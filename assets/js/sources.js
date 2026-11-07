(function initializeSources(app) {
  const d = app.dictionary;
  const { esc, link } = d;
  const select = (selector) => document.querySelector(selector);
  const params = new URLSearchParams(location.search);
  const entryId = params.get('entry');
  const entry = d.byId.get(entryId);
  const rhyme = d.groups.includes(params.get('rhyme')) ? params.get('rhyme') : '';
  const section = ['引文', '韵藻', '增', '对语', '摘句'].includes(params.get('section')) ? params.get('section') : '';
  const query = (params.get('q') || '').trim();
  const view = params.get('view');
  const isFulltext = params.get('mode') === 'fulltext';
  const root = select('#sourceRoot');
  const form = select('#sourceForm');
  const views = select('#resultViews');
  d.renderViews(views, query, 'fulltext');
  views.hidden = view === 'original' || view === 'characters';
  select('#sourceQuery').value = query;
  select('#sourceRhyme').value = rhyme;
  select('#sourceSection').value = section;

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const keyword = select('#sourceQuery').value.trim();
    const hasFilters = select('#sourceRhyme').value || select('#sourceSection').value;
    const isInitialQuery = !query && !isFulltext && !entryId && !rhyme && !section && !view
      && !hasFilters && event.submitter?.value !== 'filters';
    const target = isInitialQuery ? d.lookupUrl(keyword) : null;
    if (target?.startsWith('entry.html?')) {
      app.navigate(target);
      return;
    }
    const next = {};
    if (keyword) next.q = keyword;
    next.mode = 'fulltext';
    if (select('#sourceRhyme').value) next.rhyme = select('#sourceRhyme').value;
    if (select('#sourceSection').value) next.section = select('#sourceSection').value;
    if (entry) next.entry = entry.id;
    // Changing filters from the full headword list searches headwords only.
    if (view === 'characters') next.view = view;
    app.navigate(d.url('sources.html', next));
  });

  if (entryId && !entry) {
    root.innerHTML = '<div class="panel empty-state">未找到该字条，请返回查询条目。</div>';
    return;
  }
  if (entry) {
    select('#sourceContext').innerHTML = `<div class="muted">当前字条：${link('entry.html', { char: entry.headword }, entry.headword)}
      · ${esc(entry.rhyme)} · ${esc(entry.gloss)}<br />${esc(d.sourceLabel(entry))}
      · ${link('sources.html', query ? { q: query, mode: 'fulltext' } : {}, '检索全部字条')}
      · ${link('sources.html', { entry: entry.id, view: 'original' }, '本字原文')}</div>`;
  }

  if (view === 'original' && entry) {
    form.hidden = true;
    select('#sourceFilters').hidden = true;
    select('#sourceCount').textContent = '源文件原文 · 待核验';
    const pre = document.createElement('pre');
    pre.className = 'panel source-original';
    pre.textContent = entry.sourceText;
    root.appendChild(pre);
    document.title = `${entry.headword} · 原文`;
    return;
  }

  function paginate(items, render) {
    const size = view === 'characters' ? 80 : 30;
    const totalPages = Math.max(1, Math.ceil(items.length / size));
    const requested = Number(params.get('page'));
    const page = Math.min(totalPages, Math.max(1, Number.isSafeInteger(requested) ? requested : 1));
    const start = (page - 1) * size;
    root.innerHTML = items.length ? render(items.slice(start, start + size))
      : '<div class="panel empty-state">没有匹配记录。可减少关键词或更换筛选条件。</div>';
    select('#sourceCount').textContent = `共 ${items.length} ${view === 'characters' ? '个字条' : '条资料'} · 第 ${page} / ${totalPages} 页 · 待核验`;
    const pageLink = (number, label) => {
      const next = new URLSearchParams(params);
      next.set('page', String(number));
      return `<a href="${esc('sources.html?' + next.toString())}">${esc(label)}</a>`;
    };
    select('#sourcePages').innerHTML = (page > 1 ? pageLink(page - 1, '← 上一页') : '')
      + (page < totalPages ? pageLink(page + 1, '下一页 →') : '');
  }

  const normalized = d.normalize(query);
  if (view === 'characters') {
    const items = d.entries.filter((item) => (!rhyme || item.rhyme === rhyme)
      && (!query || d.normalize(item.headword + item.gloss).includes(normalized)));
    paginate(items, (page) => `<section class="panel entry-card">${page.map((item) => d.rows([
      [item.headword, `${link('entry.html', { char: item.headword }, item.headword)} · ${esc(item.rhyme)}
        <span class="sub">${esc(item.gloss)}</span><span class="sub">${esc(d.sourceLabel(item))}</span>`]
    ])).join('')}</section>`);
    document.title = `${rhyme || '三江、四支'} · 字表`;
    return;
  }
  const items = d.records.filter((item) => (!entry || item.entryId === entry.id)
    && (!rhyme || item.rhyme === rhyme)
    && (!section || (section === '引文' ? ['韵藻', '增'].includes(item.section) : item.section === section))
    && (!query || item.searchText.includes(normalized)));
  document.title = `${query ? query + ' · ' : ''}引文全文检索 · 韵部探索器`;
  paginate(items, (page) => page.map((item) => `<article class="panel source-record">
    <div class="source-record-head"><b>${esc(item.term || item.section)}</b>
      <span class="badge pending">${esc(item.section)} · 待核验</span></div>
    <p class="source-text">${esc(item.text)}</p>
    <div class="muted">${link('entry.html', { char: item.headword }, `字条目·${item.headword}`)} · ${esc(item.rhyme)}
      · ${esc(d.sourceLabel(item))} · ${link('sources.html', { entry: item.entryId, view: 'original' }, '本字原文')}</div>
  </article>`).join(''));
  select('#sourceCount').prepend(`引文全文检索${query ? '「' + query + '」' : ''} · `);
})(window.RhymeTrace = window.RhymeTrace || {});
