// 标注工作台：人工判定，工具只记录与导出。
// 判定纪律（9-21 §5/§6）：AI 不判定韵脚；导出的 JSONL 即人工标注的原始记录。
(function initializeAnnotator(app) {
  const select = (selector) => document.querySelector(selector);

  function esc(s) {
    return String(s).replace(/[&<>"']/g, (c) => (
      { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
    ));
  }

  // 句切分：逗号、句号等均为句边界——每个分句的末字都要可标注（9-21：记录每句句末字）。
  function splitLines(text) {
    return text
      .split(/[\n。！？；，、?!;,]+/)
      .map((s) => s.trim())
      .filter((s) => /[\u4e00-\u9fff]/.test(s));
  }

  function storageKey(key) {
    return `rhymetrace.annotate.${key}`;
  }

  const current = { key: null, title: '', author: '', era: '', source: '', lines: [] };
  let marks = {}; // lineNo -> true(韵脚) / false(句末非韵)

  function loadPoem(poem) {
    current.key = `demo-${poem.id}`;
    current.title = poem.title;
    current.author = poem.author;
    current.era = poem.era;
    current.source = poem.source;
    current.lines = splitLines(poem.text);
    restore();
    render();
  }

  function loadCustom() {
    const title = select('#npTitle').value.trim() || '未命名';
    const author = select('#npAuthor').value.trim() || '佚名';
    const era = select('#npEra').value.trim() || '未知';
    const source = select('#npSource').value.trim() || '手工录入';
    const lines = splitLines(select('#npText').value);
    if (!lines.length) return;

    current.key = `custom-${title}-${author}`;
    current.title = title;
    current.author = author;
    current.era = era;
    current.source = source;
    current.lines = lines;
    restore();
    render();
  }

  function restore() {
    try {
      const saved = JSON.parse(localStorage.getItem(storageKey(current.key)) || 'null');
      marks = saved ? saved.marks : {};
      if (saved && saved.note) select('#bNote').value = saved.note;
      else select('#bNote').value = '';
    } catch (e) {
      marks = {};
    }
  }

  function save() {
    localStorage.setItem(storageKey(current.key), JSON.stringify({
      title: current.title,
      author: current.author,
      era: current.era,
      source: current.source,
      note: select('#bNote').value,
      marks
    }));
  }

  function toggle(lineNo) {
    if (marks[lineNo] === undefined) marks[lineNo] = true;
    else if (marks[lineNo] === true) marks[lineNo] = false;
    else delete marks[lineNo];
    save();
    renderLines();
    renderExport();
  }

  function records() {
    return current.lines.map((line, i) => ({
      poemId: current.key,
      title: current.title,
      author: current.author,
      era: current.era,
      lineNo: i + 1,
      lineText: line,
      lineFinal: line.slice(-1),
      isRhyme: marks[i] === undefined ? null : marks[i],
      judgedBy: 'human',
      source: current.source,
      note: select('#bNote').value.trim()
    }));
  }

  function jsonl() {
    return records().map((r) => JSON.stringify(r)).join('\n');
  }

  function renderLines() {
    const statusText = (m) => (m === true ? '韵脚' : m === false ? '句末非韵' : '未判');
    select('#lineList').innerHTML = current.lines.map((line, i) => {
      const m = marks[i];
      const cls = m === true ? 'rhyme' : m === false ? 'not-rhyme' : '';
      return `<div class="line-row">
        <span class="line-no">${i + 1}</span>
        <span class="line-text">${esc(line)}</span>
        <button class="final-char ${cls}" data-line="${i}" type="button" title="点击切换：未判 → 韵脚 → 句末非韵">${esc(line.slice(-1))}</button>
        <span class="line-status">${statusText(m)}</span>
      </div>`;
    }).join('');

    const rhymed = current.lines.filter((_, i) => marks[i] === true).length;
    const judged = current.lines.filter((_, i) => marks[i] !== undefined).length;
    select('#bCounts').innerHTML =
      `句数 <b>${current.lines.length}</b> · 已判 <b>${judged}</b> · 押韵 <b>${rhymed}</b>`;
  }

  function renderExport() {
    const text = jsonl();
    select('#jsonlPreview').textContent = text || '（尚未载入诗歌）';
    return text;
  }

  function render() {
    select('#board').hidden = false;
    select('#exportPanel').hidden = false;
    select('#bTitle').textContent = `《${current.title}》`;
    select('#bByline').textContent = `${current.era} · ${current.author} · 来源：${current.source}`;
    renderLines();
    renderExport();
  }

  // 诗歌选择器：data.js 内置诗 + localStorage 里标过的自定义诗
  function fillPicker() {
    const options = (app.data.poems || []).map((poem) => (
      `<option value="demo-${poem.id}">${esc(poem.title)} · ${esc(poem.author)}（内置样例）</option>`
    ));
    select('#poemPicker').innerHTML = options.join('') + '<option value="__new">＋ 新建（粘贴）…</option>';
  }

  function pickerChange() {
    const value = select('#poemPicker').value;
    if (value === '__new') {
      select('#newPoemPanel').hidden = false;
      return;
    }
    select('#newPoemPanel').hidden = true;
    const poem = (app.data.poems || []).find((p) => `demo-${p.id}` === value);
    if (poem) loadPoem(poem);
  }

  function copyText(text) {
    function fallback() {
      const area = document.createElement('textarea');
      area.value = text;
      document.body.appendChild(area);
      area.select();
      document.execCommand('copy');
      area.remove();
    }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      return navigator.clipboard.writeText(text).catch(fallback);
    }
    fallback();
    return Promise.resolve();
  }

  select('#poemPicker').addEventListener('change', pickerChange);
  select('#newPoemBtn').addEventListener('click', () => {
    select('#newPoemPanel').hidden = !select('#newPoemPanel').hidden;
    select('#poemPicker').value = '__new';
  });
  select('#npLoad').addEventListener('click', loadCustom);

  select('#lineList').addEventListener('click', (event) => {
    const button = event.target.closest('.final-char');
    if (!button) return;
    toggle(Number(button.dataset.line));
  });

  select('#bNote').addEventListener('input', save);

  select('#copyBtn').addEventListener('click', () => {
    copyText(renderExport()).then(() => {
      select('#copyBtn').textContent = '已复制 ✓';
      setTimeout(() => { select('#copyBtn').textContent = '复制 JSONL'; }, 1200);
    });
  });

  select('#downloadBtn').addEventListener('click', () => {
    const blob = new Blob([renderExport() + '\n'], { type: 'application/jsonl' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `annotate-${current.key}.jsonl`;
    a.click();
    URL.revokeObjectURL(a.href);
  });

  select('#clearBtn').addEventListener('click', () => {
    if (!confirm('清空本诗的全部标注？（不影响其他诗）')) return;
    marks = {};
    select('#bNote').value = '';
    save();
    renderLines();
    renderExport();
  });

  fillPicker();
  const first = app.data.poems && app.data.poems[0];
  if (first) loadPoem(first);
})(window.RhymeTrace = window.RhymeTrace || {});
