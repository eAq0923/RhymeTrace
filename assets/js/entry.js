// Source-backed dictionary entries. Long source material lives on sources.html.
(function initializeEntry(app) {
  const d = app.dictionary;
  const { esc, link, rows, chips } = d;
  const root = document.querySelector('#entryRoot');
  const query = document.querySelector('#entryQuery');
  const params = new URLSearchParams(location.search);
  const currentQuery = params.get('char') || params.get('rhyme') || '';
  const preferredView = currentQuery || params.get('mode') === 'entry' ? 'entry' : undefined;
  d.renderViews(document.querySelector('#resultViews'), currentQuery, 'entry');

  function setTitle(kind, value = '') {
    document.querySelector('.brand-title').textContent = kind;
    document.querySelector('.footer-mark').textContent = `${kind} / entry`;
    document.title = `${value ? value + ' · ' : ''}${kind} · 韵部探索器`;
  }

  function seeAlso(rhyme) {
    return `<span class="see-also">${link('entry.html', { rhyme }, `韵部·${rhyme}`)}
      ${link('entry.html', { rhyme: rhyme === '三江' ? '四支' : '三江' }, '另一韵部')}
      ${link('sources.html', { rhyme }, '词语与引文')}<a href="index.html">大厅</a></span>`;
  }

  function renderChar(value) {
    const matches = d.find(value);
    if (!matches.length) return renderUnknown(`暂无「${value}」的字条，可继续检索词语与引文。`, value);
    root.innerHTML = matches.map((entry) => {
      const citations = entry.records.filter((record) => ['韵藻', '增'].includes(record.section));
      const terms = [...new Set(citations.map((record) => record.term).filter(Boolean))];
      const counts = (type) => entry.records.filter((record) => record.section === type).length;
      const detail = (section, label) => link('sources.html', { entry: entry.id, section }, label);
      const same = d.headwords(entry.rhyme).filter((headword) => headword !== entry.headword);
      return `<div class="entry-head"><span class="entry-char">${esc(entry.headword)}</span>
        <span class="entry-trad">源文件字形</span><span class="badge pending entry-role">待核验</span></div>
        <section class="panel entry-card">${rows([
          ['韵部', `上平 · ${esc(entry.rhyme)} · 卷${esc(entry.volume)}`],
          ['释义', esc(entry.gloss)],
          ['词语', `${citations.length} 条韵藻与增补记录 · ${detail('引文', '查看词语与典故 →')}
            <span class="sub">${terms.slice(0, 6).map(esc).join('、') || '未列出带词头的引文'}</span>`],
          ['对语', `${counts('对语')} 条 · ${detail('对语', '查看对语 →')}`],
          ['摘句', `${counts('摘句')} 条 · ${detail('摘句', '查看摘句 →')}`],
          ['同部字', chips(same.slice(0, 12)) + link('sources.html', { rhyme: entry.rhyme, view: 'characters' }, '查看字表 →')],
          ['出处', `${esc(d.sourceLabel(entry))} · ${link('sources.html', { entry: entry.id, view: 'original' }, '查看本字原文 →')}`],
          ['参见', seeAlso(entry.rhyme)]
        ])}</section>`;
    }).join('');
    if (matches.length > 1) root.insertAdjacentHTML('afterbegin',
      `<p class="muted">找到 ${matches.length} 个字条；源文件中的重出字、释义及读音说明分别保留。</p>`);
    query.value = value;
    setTitle('字条目', value);
  }

  function renderRhyme(name) {
    const entries = d.groupEntries(name);
    const words = d.headwords(name);
    const volumes = [...new Set(entries.map((entry) => entry.volume))];
    const recordCount = entries.reduce((sum, entry) => sum + entry.records.length, 0);
    root.innerHTML = `<div class="entry-head"><span class="entry-char">${esc(name)}</span>
      <span class="entry-pinyin">上平</span><span class="badge pending entry-role">待核验</span></div>
      <section class="panel entry-card">${rows([
        ['收录', `${entries.length} 个字条 · ${words.length} 种原字形 · ${volumes.length} 个卷段
          <span class="sub">按所提供文件抽取；重出字不合并，尚未确认底本完整性。</span>`],
        ['字表', chips(words.slice(0, 24)) + link('sources.html', { rhyme: name, view: 'characters' }, `查看全部 ${words.length} 种字形 →`)],
        ['资料', `${recordCount} 条韵藻、增补、对语与摘句 · ${link('sources.html', { rhyme: name }, '检索词语与引文 →')}`],
        ['出处', `《佩文韵府》卷${volumes.map(esc).join('、')}<span class="sub">来源底本、校对与使用说明待补；文件收录量不代表历史用韵频次。</span>`],
        ['参见', seeAlso(name)]
      ])}</section>`;
    query.value = name;
    setTitle('韵部条目', name);
  }

  function renderUnknown(message, value = '') {
    root.innerHTML = `<div class="panel empty-state">${esc(message)}
      ${value ? link('sources.html', { q: value, mode: 'fulltext' }, '检索词语与引文 →') : ''}</div>
      <section class="panel entry-card">${rows([
        ['字条目', chips(['江', '窓', '支', '枝', '詩'])],
        ['韵部', `<span class="see-also">${d.groups.map((rhyme) => link('entry.html', { rhyme }, rhyme)).join('')}</span>`],
        ['资料', link('sources.html', {}, '检索全部词语与引文 →')]
      ])}</section>`;
    query.value = value;
    setTitle(value ? '字条目' : '条目查询', value);
  }

  function submit() {
    const target = d.lookupUrl(query.value, preferredView);
    if (target) app.navigate(target);
  }
  document.querySelector('#entryGo').addEventListener('click', submit);
  query.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') submit();
  });
  if (params.get('char')) renderChar(params.get('char'));
  else if (d.groups.includes(params.get('rhyme'))) renderRhyme(params.get('rhyme'));
  else renderUnknown(params.get('rhyme') ? `暂无「${params.get('rhyme')}」的韵部条目。` : '输入字、词语或韵部名开始查询，可在上方切换字条目与全文检索。', currentQuery);
})(window.RhymeTrace = window.RhymeTrace || {});
