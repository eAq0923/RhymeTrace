// 条目视图渲染：只消费 data.js 与 entry-data.js，不内嵌任何文案。
(function initializeEntry(app) {
  const { data, entryData } = app;
  const select = (selector) => document.querySelector(selector);
  const root = select('#entryRoot');

  const { t2s, s2t } = app.charmaps || { t2s: {}, s2t: {} };

  function esc(s) {
    return String(s).replace(/[&<>"']/g, (c) => (
      { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
    ));
  }

  function normalizeChar(ch) {
    return t2s[ch] || ch;
  }

  function markLine(line, rhymes) {
    return line.replace(new RegExp(`([${rhymes.join('')}])`, 'g'), '<mark>$1</mark>');
  }

  function chips(chars, counts) {
    return `<div class="chips">${chars.map((ch) => {
      const mini = counts && counts[ch] ? `<span class="mini">${counts[ch]}</span>` : '';
      return `<a class="chip" href="entry.html?char=${encodeURIComponent(ch)}">${ch}${mini}</a>`;
    }).join('')}</div>`;
  }

  function groupChars(group) {
    return group.charsFromData
      ? (data.chars || []).map(([ch]) => ch)
      : group.chars || [];
  }

  function groupCounts(group) {
    if (!group.charsFromData) return null;
    return Object.fromEntries((data.chars || []).map(([ch, n]) => [ch, n]));
  }

  function groupOfChar(ch) {
    return Object.values(entryData.groups).find((group) => (
      group.charsFromData
        ? (data.chars || []).some(([c]) => c === ch)
        : (group.chars || []).includes(ch)
    )) || null;
  }

  function charUsage(group, ch) {
    if (group.charsFromData) {
      const list = data.chars || [];
      const hit = list.find(([c]) => c === ch) || [];
      const rank = list.findIndex(([c]) => c === ch) + 1;
      return `样本中作韵脚 ${hit[1] || 0} 次（演示）· 字表第 ${rank} 位 → <a href="index.html">大厅分布图</a>`;
    }
    return group.usagePending;
  }

  function verifiedPoems(ch) {
    return (data.poems || []).filter((poem) => (
      poem.rhymes.includes(ch) && poem.status.indexOf('已核验') >= 0
    ));
  }

  function examplesRow(group, ch) {
    const poems = verifiedPoems(ch);
    if (!poems.length) return `<span class="muted">${group.examplePending}</span>`;
    return poems.map((poem) => `
      <div class="entry-example">
        <div>${markLine(esc(poem.text.split('\n')[0]), poem.rhymes)}</div>
        <span class="muted">${poem.era} · ${esc(poem.author)}《${esc(poem.title)}》 · 韵脚：${poem.rhymes.map((r) => `「${r}」`).join('')}</span>
        <span class="badge">${poem.status}</span>
      </div>`).join('');
  }

  function notesRow(group) {
    return group.notes.map((note) => (
      `<div class="entry-note-item">${note.text}<span class="tag">${note.tag}</span></div>`
    )).join('');
  }

  function rows(list) {
    return list.map(([label, body]) => `
      <div class="entry-row">
        <span class="entry-label">【${label}】</span>
        <div class="entry-body">${body}</div>
      </div>`).join('');
  }

  function seeAlso(group) {
    return `<span class="see-also">
      <a href="entry.html?rhyme=${encodeURIComponent(group.name)}">韵部·${group.name}</a>
      <a href="entry.html?rhyme=${encodeURIComponent(group.peer.name)}">${group.peer.label}</a>
      <a href="index.html#method">口径说明</a>
    </span>`;
  }

  function renderQuiz(group, quizIndex) {
    const host = select('#quizRoot');
    const pool = (group.quizzes || []).filter((q) => !q.backup);
    if (!pool.length) {
      host.innerHTML = '';
      return;
    }

    const current = typeof quizIndex === 'number'
      ? quizIndex
      : Math.max(0, pool.findIndex((q) => q.default));
    const quiz = pool[current];

    host.innerHTML = `
      <section class="panel quiz-card">
        <div class="quiz-head">
          <span class="badge">测一问</span>
          <button class="text-link" id="quizNext" type="button">换一题 ↻</button>
        </div>
        <div class="quiz-stem">${quiz.stem}</div>
        <div class="quiz-opts">
          ${quiz.options.map((opt, i) => `<button class="quiz-opt" data-index="${i}" type="button">${opt}</button>`).join('')}
        </div>
        <div class="quiz-feedback" id="quizFeedback" aria-live="polite"></div>
      </section>`;

    function settle(picked) {
      const feedback = select('#quizFeedback');
      feedback.classList.add('show');
      feedback.innerHTML = `
        <div>${picked === quiz.answer ? quiz.right : quiz.wrong}</div>
        <span class="quiz-basis">依据：${quiz.basis}</span>`;
      host.querySelectorAll('.quiz-opt').forEach((button, i) => {
        button.disabled = true;
        if (i === quiz.answer) button.classList.add('correct');
        else if (i === picked) button.classList.add('wrong');
      });
    }

    host.querySelectorAll('.quiz-opt').forEach((button) => {
      button.addEventListener('click', () => settle(Number(button.dataset.index)));
    });
    host.querySelector('#quizNext').addEventListener('click', () => {
      renderQuiz(group, (current + 1) % pool.length);
    });
  }

  function renderCharEntry(ch) {
    const group = groupOfChar(ch);
    if (!group) return renderUnknown(`暂无「${esc(ch)}」的条目——演示范围见下方快速入口。`);

    const pinyin = entryData.pinyin[ch] ? `<span class="entry-pinyin">${entryData.pinyin[ch]}</span>` : '';
    const trad = entryData.pinyin[ch]
      ? `<span class="entry-trad">─ 繁體 ${s2t[ch] || ch}</span>` : '';
    const peers = groupChars(group).filter((c) => c !== ch);

    root.innerHTML = `
      <div class="entry-head">
        <span class="entry-char">${ch}</span>
        ${pinyin}${trad}
        <span class="badge entry-role">${group.role}</span>
      </div>
      <section class="panel entry-card">
        ${rows([
          ['韵部', `平水韵 · ${group.shortLabel}（${group.source} · ${group.xiaoyun}）<span class="sub">邻韵：${group.neighbor}</span>`],
          ['同韵字', chips(peers, groupCounts(group)) + (group.charsNote ? `<span class="sub">${group.charsNote}</span>` : '')],
          ['例证', examplesRow(group, ch)],
          ['用韵', charUsage(group, ch)],
          ['注', notesRow(group)],
          ['参见', seeAlso(group)]
        ])}
      </section>`;
    document.title = `${ch} · 韵部探索器`;
    renderQuiz(group);
  }

  function renderRhymeEntry(group) {
    const usage = group.charsFromData
      ? (data.eraData || []).filter((era) => era.status === 'ready')
        .map((era) => `${era.id} ${era.value}`).join(' · ')
        .concat('（样本）→ <a href="index.html">大厅分布图</a>')
      : group.usagePending;

    root.innerHTML = `
      <div class="entry-head">
        <span class="entry-char">${group.name}</span>
        <span class="entry-pinyin">${group.volume}</span>
        <span class="badge entry-role">${group.role}</span>
      </div>
      <section class="panel entry-card">
        ${rows([
          ['字表', chips(groupChars(group), groupCounts(group)) + (group.charsNote ? `<span class="sub">${group.charsNote}</span>` : '')],
          ['用韵', usage],
          ['诗人', `<span class="muted">${group.poetsPending}</span> <span class="badge pending">待接入</span>`],
          ['注', notesRow(group)],
          ['参见', `<span class="see-also">
            <a href="entry.html?char=${encodeURIComponent(group.sampleChar)}">字条目·${group.sampleChar}</a>
            <a href="entry.html?rhyme=${encodeURIComponent(group.peer.name)}">${group.peer.label}</a>
            <a href="index.html#method">口径说明</a>
          </span>`]
        ])}
      </section>`;
    document.title = `${group.name} · 韵部探索器`;
    renderQuiz(group);
  }

  function renderUnknown(message) {
    root.innerHTML = `
      <div class="panel empty-state">${message}</div>
      <section class="panel entry-card">
        <div class="entry-row">
          <span class="entry-label">快速入口</span>
          <div class="entry-body">
            ${chips(entryData.quickLinks.chars, null)}
            <div class="see-also">
              ${entryData.quickLinks.rhymes.map((name) => `<a href="entry.html?rhyme=${encodeURIComponent(name)}">韵部·${name}</a>`).join('')}
            </div>
          </div>
        </div>
      </section>`;
    select('#quizRoot').innerHTML = '';
    document.title = '条目 · 韵部探索器';
  }

  function route() {
    const params = new URLSearchParams(location.search);
    const ch = params.get('char');
    const rhyme = params.get('rhyme');

    if (ch) return renderCharEntry(normalizeChar(ch));
    if (rhyme && entryData.groups[rhyme]) return renderRhymeEntry(entryData.groups[rhyme]);
    if (rhyme) return renderUnknown(`暂无「${esc(rhyme)}」的韵部条目——演示范围：四支、三江。`);
    return renderUnknown('在上方输入一个字或韵部名，查看词典式条目。');
  }

  function submit() {
    const input = select('#entryQuery');
    const value = normalizeChar((input.value || '').trim());
    if (!value) return;

    if (entryData.groups[value]) {
      app.navigate(`entry.html?rhyme=${encodeURIComponent(value)}`);
      return;
    }
    if (groupOfChar(value)) {
      app.navigate(`entry.html?char=${encodeURIComponent(value)}`);
      return;
    }
    select('#queryHint').textContent = '演示范围暂无这个条目，试试「枝」「江」「诗」或「四支」「三江」';
  }

  select('#entryGo').addEventListener('click', submit);
  select('#entryQuery').addEventListener('keydown', (event) => {
    if (event.key === 'Enter') submit();
  });
  select('#entryQuery').addEventListener('input', () => {
    select('#queryHint').textContent = '';
  });

  route();
})(window.RhymeTrace = window.RhymeTrace || {});
