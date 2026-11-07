// Offline regression: one query, two views, retained selection and global full text.
const assert = require('node:assert/strict');
const path = require('node:path');
const os = require('node:os');
const { pathToFileURL } = require('node:url');
const { chromium } = require(require.resolve('playwright', {
  paths: [process.argv[2] || process.cwd()]
}));

(async () => {
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  try {
    const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
    const errors = [];
    page.on('pageerror', (error) => errors.push(error.message));
    const base = pathToFileURL(path.resolve(__dirname, '../')).href + '/';
    const go = (file, params = {}) => page.goto(base + file + '?' + new URLSearchParams(params));
    const tab = (name) => page.locator('#resultViews').getByRole('link', { name, exact: true });
    const active = () => page.locator('#resultViews [aria-current="page"]').innerText();
    const waitParam = (key, value) => page.waitForURL((url) => url.searchParams.get(key) === value);

    // First query uses entry if known, from either search landing.
    for (const value of ['支', '诗', '窗', '𢥠', '其', '四支', '三江']) {
      const results = [];
      for (const [file, input] of [['entry.html', '#entryQuery'], ['sources.html', '#sourceQuery']]) {
        await go(file);
        await page.locator(input).fill(value);
        await page.locator(input).press('Enter');
        await page.waitForURL((url) => url.searchParams.get('char') === value || url.searchParams.get('rhyme') === value);
        results.push(new URL(page.url()).search);
        assert.equal(await active(), value === '四支' || value === '三江' ? '韵部条目' : '字条目');
      }
      assert.equal(results[0], results[1], `Inconsistent first lookup: ${value}`);
    }
    // Tabs sit directly after search and preserve the committed query.
    await go('entry.html', { char: '支' });
    assert.equal(await page.locator('.brand-title').innerText(), '字条目');
    assert.match(await page.title(), /字条目/);
    assert.ok(await page.locator('.query-bar + #resultViews').count());
    await page.screenshot({ path: path.join(os.tmpdir(), 'rhymetrace-tabs-entry.png') });
    await tab('全文检索').click();
    await waitParam('mode', 'fulltext');
    assert.equal(await page.locator('#sourceQuery').inputValue(), '支');
    assert.equal(await active(), '全文检索');
    assert.ok(await page.locator('.query-bar + #resultViews').count());
    assert.match(await page.locator('#sourceCount').innerText(), /引文全文检索「支」.*共 179 条/);
    // Results include other headwords; this is not a search scoped to 支.
    assert.ok(await page.locator('.source-record a').filter({ hasText: /^字条目·(?!支$)/ }).count() > 0);
    await page.screenshot({ path: path.join(os.tmpdir(), 'rhymetrace-tabs-fulltext.png') });
    await page.getByRole('link', { name: '下一页 →' }).click();
    await waitParam('page', '2');
    assert.equal(new URL(page.url()).searchParams.get('mode'), 'fulltext');
    await tab('字条目').click();
    await waitParam('char', '支');
    assert.equal(await page.locator('#entryQuery').inputValue(), '支');
    await page.goBack();
    assert.equal(await active(), '全文检索');
    assert.equal(new URL(page.url()).searchParams.get('page'), '2');
    await page.goForward();
    assert.equal(await active(), '字条目');

    // Full text remains selected when another known character or rhyme is submitted.
    await tab('全文检索').click();
    await waitParam('mode', 'fulltext');
    for (const value of ['江', '三江']) {
      await page.locator('#sourceQuery').fill(value);
      await page.locator('#sourceGo').click();
      await waitParam('q', value);
      assert.equal(await active(), '全文检索');
      assert.equal(new URL(page.url()).searchParams.get('mode'), 'fulltext');
    }
    await tab('韵部条目').click();
    await waitParam('rhyme', '三江');
    assert.equal(await page.locator('.brand-title').innerText(), '韵部条目');
    await page.locator('#entryQuery').fill('江');
    await page.locator('#entryGo').click();
    await waitParam('char', '江');
    assert.equal(await active(), '字条目');

    // No-entry first query defaults to full text, but the empty entry is still available.
    for (const [file, input] of [['entry.html', '#entryQuery'], ['sources.html', '#sourceQuery']]) {
      await go(file);
      await page.locator(input).fill('春江');
      await page.locator(input).press('Enter');
      await waitParam('q', '春江');
      assert.equal(await active(), '全文检索');
      assert.ok(await page.locator('.source-record').count() > 0);
      await tab('字条目 暂无条目').click();
      await waitParam('char', '春江');
      assert.match(await page.locator('#entryRoot').innerText(), /暂无「春江」/);
      assert.equal(await page.locator('#entryQuery').inputValue(), '春江');
      assert.equal(await page.locator('#resultViews a').count(), 2);
      // Selected entry also stays selected when next query has no entry.
      await page.locator('#entryQuery').fill('没有此词987654321');
      await page.locator('#entryGo').click();
      await waitParam('char', '没有此词987654321');
      assert.match(await active(), /字条目/);
    }
    // Explicit tab selection on an empty landing is also retained.
    await go('sources.html', { mode: 'fulltext' });
    await tab('字条目').click();
    await waitParam('mode', 'entry');
    await page.locator('#entryQuery').fill('春江');
    await page.locator('#entryGo').click();
    await waitParam('char', '春江');

    // Legacy full-text URLs no longer force recognized words into entry view.
    await go('sources.html', { q: '支' });
    assert.equal(await active(), '全文检索');
    assert.match(await page.locator('#sourceCount').innerText(), /共 179 条/);
    // Applying filters keeps the query; switching via tabs resets scope to whole library.
    await page.locator('#sourceRhyme').selectOption('三江');
    await page.getByRole('button', { name: '应用筛选 →' }).click();
    await waitParam('rhyme', '三江');
    assert.equal(new URL(page.url()).searchParams.get('q'), '支');
    await tab('字条目').click();
    await waitParam('char', '支');
    await tab('全文检索').click();
    await waitParam('mode', 'fulltext');
    assert.equal(new URL(page.url()).searchParams.has('rhyme'), false);
    assert.match(await page.locator('#sourceCount').innerText(), /共 179 条/);

    await page.setViewportSize({ width: 375, height: 812 });
    for (const [file, params] of [
      ['entry.html', { char: '江' }], ['sources.html', { q: '支', mode: 'fulltext' }],
      ['entry.html', { char: '春江' }]
    ]) {
      await go(file, params);
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
      assert.equal(await page.locator('#resultViews a').count(), 2);
    }
    await page.screenshot({ path: path.join(os.tmpdir(), 'rhymetrace-tabs-mobile.png') });
    assert.deepEqual(errors, []);
    console.log('PASS: first-query defaults, shared-query tabs, global full text, retained views, empty entries, filters, pagination, history and mobile layout.');
  } finally {
    await browser.close();
  }
})().catch((error) => { console.error(error); process.exitCode = 1; });
