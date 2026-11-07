// 过渡动画：内部页面跳转统一走 app.navigate —— 先播离场动画（transition.css）再跳转。
// JS 里请用 app.navigate(url) 代替直接给 location.href 赋值；<a> 链接会被自动拦截。
(function registerTransition(app) {
  const EXIT_MS = 140;

  app.navigate = function navigate(url) {
    document.body.classList.add('page-leaving');
    setTimeout(() => {
      window.location.href = url;
    }, EXIT_MS);
  };

  document.addEventListener('click', (event) => {
    if (event.defaultPrevented || event.button !== 0
      || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

    const link = event.target.closest('a[href]');
    if (!link || link.target === '_blank') return;

    const url = link.getAttribute('href');
    if (!/^[\w./-]+\.html([?#].*)?$/.test(url)) return;

    event.preventDefault();
    app.navigate(url);
  });

  window.addEventListener('pageshow', (event) => {
    if (event.persisted) document.body.classList.remove('page-leaving');
  });
})(window.RhymeTrace = window.RhymeTrace || {});
