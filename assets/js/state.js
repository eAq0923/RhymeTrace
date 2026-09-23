(function registerState(app) {
  const initialState = Object.freeze({
    activeEra: 'all',
    mode: 'count',
    selected: null
  });

  app.state = { ...initialState };
  app.resetState = function resetState() {
    Object.assign(app.state, initialState);
  };
})(window.RhymeTrace = window.RhymeTrace || {});
