/* Language, theme and print controls. No dependencies, no build step. */
(function () {
  'use strict';

  var root = document.documentElement;
  var TITLES = {
    en: 'Nathan Penny — Tsinghua University · Local-first AI Systems',
    zh: 'Nathan Penny — 清华大学 · 本地优先 AI 系统'
  };

  function store(key, value) {
    try { localStorage.setItem(key, value); } catch (e) {}
  }

  /* ---------- language ---------- */
  function setLang(lang) {
    if (lang !== 'en' && lang !== 'zh') return;
    root.setAttribute('data-lang', lang);
    root.setAttribute('lang', lang === 'zh' ? 'zh-CN' : 'en');
    document.title = TITLES[lang];
    store('lang', lang);
  }

  Array.prototype.forEach.call(
    document.querySelectorAll('[data-set-lang]'),
    function (btn) {
      btn.addEventListener('click', function () {
        setLang(btn.getAttribute('data-set-lang'));
      });
    }
  );

  /* ---------- theme ---------- */
  var themeBtn = document.getElementById('theme-toggle');

  function currentTheme() {
    var explicit = root.getAttribute('data-theme');
    if (explicit === 'light' || explicit === 'dark') return explicit;
    return window.matchMedia &&
      window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }

  if (themeBtn) {
    themeBtn.addEventListener('click', function () {
      var next = currentTheme() === 'dark' ? 'light' : 'dark';
      root.setAttribute('data-theme', next);
      store('theme', next);
    });
  }

  /* ---------- print ---------- */
  var printBtn = document.getElementById('print-btn');
  if (printBtn) {
    printBtn.addEventListener('click', function () { window.print(); });
  }

  /* ---------- keyboard: 1 / 2 switch language, p prints ---------- */
  document.addEventListener('keydown', function (e) {
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    var t = e.target;
    if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return;
    if (e.key === '1') setLang('en');
    else if (e.key === '2') setLang('zh');
    else if (e.key === 'p') window.print();
  });
})();
