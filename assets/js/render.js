(function registerRenderers(app) {
  const { data, state } = app;
  const select = (selector) => document.querySelector(selector);

  function esc(s) {
    return String(s).replace(/[&<>"']/g, (c) => (
      { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
    ));
  }

  function markRhymes(text, rhymes) {
    return text.replace(new RegExp(`([${rhymes.join('')}])`, 'g'), '<mark>$1</mark>');
  }

  function renderPills() {
    select('#eraPills').innerHTML = data.eras.map((era) => (
      `<button class="pill ${state.activeEra === era.id ? 'active' : ''}" data-era="${era.id}">${era.label}</button>`
    )).join('');
  }

  function renderBars() {
    const max = Math.max(...data.eraData.map((item) => item.value), 1);
    const total = data.eraData.reduce((sum, item) => sum + item.value, 0);
    const eraLabel = state.activeEra === 'all' ? '各朝代' : `${state.activeEra}代`;
    const modeLabel = state.mode === 'count' ? '样本韵脚次数' : '样本内占比';

    select('#chartTitle').textContent = `${eraLabel} · ${modeLabel}`;
    select('#bars').innerHTML = data.eraData.map((item) => {
      const value = state.mode === 'count'
        ? item.value
        : (total ? Math.round(item.value / total * 100) : 0);
      const height = item.status === 'pending' ? 14 : Math.max(7, value / max * 180);
      const displayValue = item.status === 'pending'
        ? '—'
        : (state.mode === 'count' ? value : `${value}%`);

      return `<div class="bar-col">
        <div class="bar-value">${displayValue}</div>
        <div class="bar ${item.status === 'pending' ? 'pending' : ''}" style="--bar-height:${height}px"></div>
        <div class="bar-label">${item.id}</div>
      </div>`;
    }).join('');

    document.querySelectorAll('.switch button').forEach((button) => {
      button.classList.toggle('active', button.dataset.mode === state.mode);
    });
  }

  function renderChars() {
    const query = (select('#charSearch').value || '').trim();
    const matches = data.chars.filter(([char]) => !query || char === query);

    select('#charsList').innerHTML = matches.length
      ? matches.map(([char, count]) => (
        `<button class="char" data-char="${char}">${char}<span class="mini">${count}</span></button>`
      )).join('')
      : '<span class="muted">暂未找到这个字，试试"诗"或"枝"</span>';
  }

  function renderEvidence() {
    const poems = data.poems.filter((poem) => (
      state.activeEra === 'all' || poem.era === state.activeEra
    ));

    select('#evidenceHint').textContent = '展示可追溯样例；候选与已核验状态分开标记';

    select('#evidenceList').innerHTML = poems.length
      ? poems.map((poem) => `<article class="panel evidence" data-poem="${poem.id}">
          <div class="era">${poem.era}<small>${esc(poem.author)}</small></div>
          <div>
            <h3>${esc(poem.title)}</h3>
            <p>${markRhymes(esc(poem.text.split('\n')[0]), poem.rhymes)}</p>
            <span class="badge ${poem.status.includes('候选') ? 'pending' : ''}">${poem.status}</span>
          </div>
          <div class="proof">${poem.rhymes.map((rhyme) => `「${rhyme}」`).join(' ')}<br><span class="evidence-link">查看原诗 →</span></div>
        </article>`).join('')
      : '<div class="panel empty-state">这个朝代或字目前还没有接入样例。框架已预留位置，等待语料与人工韵脚标注。</div>';
  }

  function openModal(poem) {
    if (!poem) return;

    select('#modalTitle').textContent = `《${poem.title}》`;
    select('#modalByline').textContent = `${poem.era} · ${poem.author}`;
    select('#modalText').innerHTML = poem.text
      .split('\n')
      .map((line) => markRhymes(esc(line), poem.rhymes))
      .join('<br>');
    select('#modalInfo').innerHTML = `
      <div>韵脚候选 <b>${poem.rhymes.join('、')}</b></div>
      <div>状态 <b>${esc(poem.status)}</b></div>
      <div>来源 <b>${esc(poem.source)}</b></div>
      <div>备注 <b>${esc(poem.note)}</b></div>`;
    select('#modal').classList.add('open');
  }

  function closeModal() {
    select('#modal').classList.remove('open');
  }

  function renderAll() {
    renderPills();
    renderBars();
    renderChars();
    renderEvidence();
  }

  app.view = {
    closeModal,
    openModal,
    renderAll,
    renderBars,
    renderChars
  };
})(window.RhymeTrace = window.RhymeTrace || {});
