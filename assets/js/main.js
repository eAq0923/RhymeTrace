(function initialize(app) {
  const { data, state, view } = app;
  const select = (selector) => document.querySelector(selector);

  select('#eraPills').addEventListener('click', (event) => {
    const button = event.target.closest('[data-era]');
    if (!button) return;

    state.activeEra = button.dataset.era;
    view.renderAll();
  });

  select('.switch').addEventListener('click', (event) => {
    const button = event.target.closest('[data-mode]');
    if (!button) return;

    state.mode = button.dataset.mode;
    view.renderBars();
  });

  select('#charsList').addEventListener('click', (event) => {
    const button = event.target.closest('[data-char]');
    if (!button) return;

    app.navigate(`entry.html?char=${encodeURIComponent(button.dataset.char)}`);
  });

  select('#evidenceList').addEventListener('click', (event) => {
    const card = event.target.closest('[data-poem]');
    if (!card) return;

    view.openModal(data.poems.find((poem) => poem.id === Number(card.dataset.poem)));
  });

  select('#charSearch').addEventListener('input', view.renderChars);
  select('#charSearch').addEventListener('keydown', (event) => {
    if (event.key !== 'Enter') return;
    const value = (select('#charSearch').value || '').trim();
    if (value) app.navigate(`entry.html?char=${encodeURIComponent(value)}`);
  });
  select('#resetBtn').addEventListener('click', () => {
    app.resetState();
    select('#charSearch').value = '';
    view.renderAll();
  });
  select('#modalClose').addEventListener('click', view.closeModal);
  select('#modal').addEventListener('click', (event) => {
    if (event.target.id === 'modal') view.closeModal();
  });
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') view.closeModal();
  });

  view.renderAll();
})(window.RhymeTrace = window.RhymeTrace || {});
