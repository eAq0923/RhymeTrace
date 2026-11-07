// Shared lookups. Normalize retrieval only; source glyphs stay intact.
(function registerDictionary(app) {
  const data = app.dictionaryData;
  const t2s = (app.charmaps || {}).t2s || {};
  const entries = data.entries;
  const groups = ['三江', '四支'];
  const esc = (value) => String(value).replace(/[&<>"']/g, (ch) => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]
  ));
  // Source line 824 explicitly says 窓「或作窗」. Search alias only.
  const normalize = (value) => Array.from(String(value)).map((ch) => (
    ch === '窓' ? '窗' : (t2s[ch] || ch)
  )).join('');
  const url = (page, params) => `${page}?${new URLSearchParams(params)}`;
  const link = (page, params, label) => `<a href="${esc(url(page, params))}">${esc(label)}</a>`;
  const byId = new Map(entries.map((entry) => [entry.id, entry]));
  const groupEntries = (name) => entries.filter((entry) => entry.rhyme === name);
  const headwords = (name) => [...new Set(groupEntries(name).map((entry) => entry.headword))];
  const find = (query) => entries.filter((entry) => normalize(entry.headword) === normalize(query));
  // First lookup chooses a useful default; subsequent lookups keep the selected view.
  const lookupUrl = (query, preferredView) => {
    const value = query.trim();
    if (!value) return null;
    if (preferredView !== 'fulltext') {
      if (groups.includes(value)) return url('entry.html', { rhyme: value });
      if (preferredView === 'entry' || find(value).length) return url('entry.html', { char: value });
    }
    return url('sources.html', { q: value, mode: 'fulltext' });
  };
  const renderViews = (root, query, active) => {
    const value = query.trim();
    const hasEntry = groups.includes(value) || find(value).length > 0;
    const entryUrl = value ? lookupUrl(value, 'entry') : url('entry.html', { mode: 'entry' });
    const fulltextUrl = url('sources.html', value ? { q: value, mode: 'fulltext' } : { mode: 'fulltext' });
    root.innerHTML = `<a href="${esc(entryUrl)}"${active === 'entry' ? ' aria-current="page"' : ''}>
      ${groups.includes(value) ? '韵部条目' : '字条目'}${value && !hasEntry ? '<span class="view-note">暂无条目</span>' : ''}</a>
      <a href="${esc(fulltextUrl)}"${active === 'fulltext' ? ' aria-current="page"' : ''}>全文检索</a>`;
  };
  const records = entries.flatMap((entry) => entry.records.map((record) => ({
    ...record, entryId: entry.id, headword: entry.headword, rhyme: entry.rhyme, volume: entry.volume,
    searchText: normalize(record.text)
  })));
  const sourceLabel = (item) => `《佩文韵府》卷${item.volume} · 文件第 ${item.startLine}–${item.endLine} 行`;
  const rows = (items) => items.map(([label, body]) => `<div class="entry-row">
    <span class="entry-label">【${esc(label)}】</span><div class="entry-body">${body}</div></div>`).join('');
  const chips = (chars) => `<div class="chips">${chars.map((ch) => (
    `<a class="chip" href="${esc(url('entry.html', { char: ch }))}">${esc(ch)}</a>`
  )).join('')}</div>`;
  app.dictionary = { data, entries, records, groups, esc, normalize, url, link, byId,
    groupEntries, headwords, find, lookupUrl, renderViews, sourceLabel, rows, chips };
})(window.RhymeTrace = window.RhymeTrace || {});
