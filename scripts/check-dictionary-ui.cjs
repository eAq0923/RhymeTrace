// node scripts/check-dictionary-ui.cjs [directory containing playwright]
const assert = require('node:assert/strict');
const path = require('node:path');
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
    const go = async (file, params = {}) => {
      await page.goto(base + file + '?' + new URLSearchParams(params));
    };
    await go('entry.html', { rhyme: '四支' });
    assert.match(await page.locator('#entryRoot').innerText(), /443 个字条.*437 种原字形/);
    assert.equal(await page.locator('.chip').count(), 24);
    await page.getByRole('link', { name: '查看全部 437 种字形 →' }).click();
    await page.waitForURL(/view=characters/);
    assert.match(await page.locator('#sourceCount').innerText(), /443 个字条/);
    assert.equal(await page.locator('.entry-row').count(), 80);
    await page.getByRole('link', { name: '下一页 →' }).click();
    await page.waitForURL(/page=2/);
    assert.match(await page.locator('#sourceCount').innerText(), /第 2/);

    await go('entry.html', { char: '诗' });
    assert.equal(await page.locator('.entry-char').first().innerText(), '詩');
    assert.match(await page.locator('#entryRoot').innerText(), /文件第/);
    await page.getByRole('link', { name: '查看词语与典故 →' }).click();
    await page.waitForURL(/sources.html/);
    assert.ok(await page.locator('.source-record').count() > 0);
    await page.locator('.source-record a').last().click();
    await page.waitForURL(/view=original/);
    assert.match(await page.locator('.source-original').innerText(), /韵藻/);
    assert.ok(await page.locator('#sourceForm').isHidden());

    await go('entry.html', { char: '窗' });
    assert.equal(await page.locator('.entry-char').first().innerText(), '窓');
    await go('entry.html', { char: '𢥠' });
    assert.equal(await page.locator('.entry-char').first().innerText(), '𢥠');
    await go('entry.html', { char: '其' });
    assert.equal(await page.locator('.entry-head').count(), 2);
    await go('entry.html', { char: '<img src=x onerror=alert(1)>' });
    assert.equal(await page.locator('#entryRoot img').count(), 0);
    assert.match(await page.locator('#entryRoot').innerText(), /暂无/);
    await go('sources.html', { entry: '__proto__' });
    assert.match(await page.locator('#sourceRoot').innerText(), /未找到/);

    await go('sources.html', { q: '杜甫', rhyme: '三江', section: '引文' });
    assert.ok(await page.locator('.source-record').count() > 0);
    const oldFirst = await page.locator('.source-text').first().innerText();
    assert.match(oldFirst, /杜甫/);
    await page.getByRole('link', { name: '下一页 →' }).click();
    await page.waitForURL(/page=2/);
    assert.equal(new URL(page.url()).searchParams.get('q'), '杜甫');
    assert.notEqual(await page.locator('.source-text').first().innerText(), oldFirst);
    await go('entry.html');
    await page.locator('#entryQuery').fill('三江');
    await page.locator('#entryGo').click();
    await page.waitForURL(/rhyme=/);
    assert.match(await page.locator('#entryRoot').innerText(), /46 个字条/);
    await page.locator('#entryQuery').fill('春江');
    await page.locator('#entryQuery').press('Enter');
    await page.waitForURL((url) => url.searchParams.get('char') === '春江');
    assert.match(await page.locator('#entryRoot').innerText(), /暂无/);
    await page.locator('#resultViews').getByRole('link', { name: '全文检索', exact: true }).click();
    await page.waitForURL(/sources.html/);
    assert.ok(await page.locator('.source-record').count() > 0);
    await page.locator('#sourceQuery').fill('没有此词987654321');
    await page.locator('#sourceGo').click();
    await page.waitForURL(/987654321/);
    assert.match(await page.locator('#sourceCount').innerText(), /共 0 条/);

    await go('index.html');
    await page.locator('[data-char="枝"]').click();
    await page.waitForURL(/entry.html/);
    assert.match(await page.locator('#entryRoot').innerText(), /待核验/);
    await page.setViewportSize({ width: 375, height: 812 });
    for (const [file, params] of [['entry.html', { char: '江' }], ['sources.html', { q: '春江' }]]) {
      await go(file, params);
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth);
      assert.equal(overflow, false, `${file}: mobile horizontal overflow`);
    }
    if (process.env.RHYMETRACE_SCREENSHOT) {
      await page.screenshot({ path: process.env.RHYMETRACE_SCREENSHOT, fullPage: false });
    }
    assert.deepEqual(errors, []);
    console.log('PASS: offline entries, simplified/variant/rare glyphs, duplicates, search, filters, pagination, source text, XSS, hall navigation and mobile layout.');
  } finally {
    await browser.close();
  }
})().catch((error) => { console.error(error); process.exitCode = 1; });
