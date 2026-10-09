/* Language, theme and print controls. No dependencies, no build step. */
(function () {
  'use strict';

  var root = document.documentElement;
  var LANGS = ['en', 'zh', 'es'];
  var TITLES = {
    en: 'Pan Nie',
    zh: '聂磐 Pan Nie',
    es: 'Pan Nie'
  };
  var HTML_LANG = { en: 'en', zh: 'zh-CN', es: 'es' };

  function store(key, value) {
    try { localStorage.setItem(key, value); } catch (e) {}
  }

  /* ---------- language ---------- */
  /* persist is false when we are only mirroring the choice the inline <head>
     script already made, so a first visit never locks the visitor into whatever
     language their browser happened to report. */
  function applyLang(lang, persist) {
    if (LANGS.indexOf(lang) === -1) return;
    root.setAttribute('data-lang', lang);
    root.setAttribute('lang', HTML_LANG[lang]);
    document.title = TITLES[lang];
    Array.prototype.forEach.call(
      document.querySelectorAll('[data-set-lang]'),
      function (btn) {
        btn.setAttribute(
          'aria-pressed',
          btn.getAttribute('data-set-lang') === lang ? 'true' : 'false'
        );
      }
    );
    if (persist) store('lang', lang);
  }

  Array.prototype.forEach.call(
    document.querySelectorAll('[data-set-lang]'),
    function (btn) {
      btn.addEventListener('click', function () {
        applyLang(btn.getAttribute('data-set-lang'), true);
      });
    }
  );

  /* Mirror the pre-paint language into the document title and the switch state. */
  applyLang(root.getAttribute('data-lang'), false);

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

  /* ---------- keyboard: 1 / 2 / 3 switch language, p prints ---------- */
  document.addEventListener('keydown', function (e) {
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    var t = e.target;
    if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return;
    if (e.key === '1') applyLang('en', true);
    else if (e.key === '2') applyLang('zh', true);
    else if (e.key === '3') applyLang('es', true);
    else if (e.key === 'p') window.print();
  });
})();
