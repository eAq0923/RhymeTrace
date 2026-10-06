(function registerState(app) {
  const initialState = Object.freeze({
    activeEra: 'all',
    mode: 'count'
  });

  app.state = { ...initialState };
  app.resetState = function resetState() {
    Object.assign(app.state, initialState);
  };
})(window.RhymeTrace = window.RhymeTrace || {});
