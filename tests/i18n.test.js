/* Unit test for the deployed trilingual (en / zh / es) + theme logic.
   Runs the REAL inline bootstrap from index.html and the REAL scripts/lang.js
   against a minimal DOM stub, so the tested code is exactly what ships. */
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.join(__dirname, '..');
const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const langJs = fs.readFileSync(path.join(ROOT, 'scripts', 'lang.js'), 'utf8');

const bootSrc = html.match(/<script>([\s\S]*?\/\* Set language and theme[\s\S]*?)<\/script>/);
if (!bootSrc) { console.error('FAIL: inline bootstrap not found in index.html'); process.exit(1); }

function el(tag, attrs = {}) {
  const e = {
    tagName: tag, attrs: { ...attrs }, listeners: {}, title: undefined,
    setAttribute(k, v) { this.attrs[k] = String(v); },
    getAttribute(k) { return k in this.attrs ? this.attrs[k] : null; },
    removeAttribute(k) { delete this.attrs[k]; },
    addEventListener(t, fn) { (this.listeners[t] = this.listeners[t] || []).push(fn); },
    fire(t, ev = {}) { (this.listeners[t] || []).forEach((fn) => fn({ target: this, ...ev })); },
  };
  return e;
}

function env({ language = 'en-US', store = {}, darkOS = false } = {}) {
  const html = el('html');
  const btns = [
    el('button', { 'data-set-lang': 'en' }),
    el('button', { 'data-set-lang': 'zh' }),
    el('button', { 'data-set-lang': 'es' }),
  ];
  const themeBtn = el('button');
  const printBtn = el('button');
  const mem = { ...store };
  const docListeners = {};
  const doc = {
    documentElement: html,
    title: 'STATIC TITLE',
    querySelectorAll: (sel) => (sel === '[data-set-lang]' ? btns : []),
    getElementById: (id) => (id === 'theme-toggle' ? themeBtn : id === 'print-btn' ? printBtn : null),
    addEventListener: (t, fn) => { (docListeners[t] = docListeners[t] || []).push(fn); },
  };
  let printed = 0;
  const ctx = {
    document: doc,
    localStorage: {
      getItem: (k) => (k in mem ? mem[k] : null),
      setItem: (k, v) => { mem[k] = String(v); },
    },
    navigator: { language },
    window: { matchMedia: (q) => ({ matches: darkOS && /dark/.test(q) }), print: () => { printed++; } },
    console,
  };
  ctx.window.matchMedia = ctx.window.matchMedia.bind(ctx.window);
  const fireKey = (key) => (docListeners.keydown || [])
    .forEach((fn) => fn({ key, target: { tagName: 'BODY' } }));
  return { ctx, html, btns, themeBtn, printBtn, mem, doc, fireKey, printedCount: () => printed };
}

let pass = 0, fail = 0;
function check(name, got, want) {
  const ok = got === want;
  ok ? pass++ : fail++;
  console.log(`  ${ok ? '✓' : '✗'} ${name}${ok ? '' : `  (got ${JSON.stringify(got)}, want ${JSON.stringify(want)})`}`);
}

function runBootstrap(e) {
  vm.createContext(e.ctx);
  vm.runInContext(bootSrc[1], e.ctx);
}
function runLangJs(e) {
  vm.createContext(e.ctx);
  vm.runInContext(langJs, e.ctx);
}

console.log('\n── inline bootstrap (runs before first paint) ──');
let e = env({ language: 'zh-CN' }); runBootstrap(e);
check('zh-CN visitor → data-lang=zh', e.html.getAttribute('data-lang'), 'zh');
check('zh-CN visitor → lang=zh-CN', e.html.getAttribute('lang'), 'zh-CN');

e = env({ language: 'en-US' }); runBootstrap(e);
check('en-US visitor → data-lang=en', e.html.getAttribute('data-lang'), 'en');

e = env({ language: 'zh-Hans-CN' }); runBootstrap(e);
check('zh-Hans-CN visitor → zh', e.html.getAttribute('data-lang'), 'zh');

e = env({ language: 'en-US', store: { lang: 'zh' } }); runBootstrap(e);
check('stored choice beats navigator', e.html.getAttribute('data-lang'), 'zh');

e = env({ language: 'zh-CN', store: { theme: 'light' } }); runBootstrap(e);
check('stored theme applied', e.html.getAttribute('data-theme'), 'light');

e = env({ language: 'zh-CN' }); runBootstrap(e);
check('no stored theme → no data-theme', e.html.getAttribute('data-theme'), null);

console.log('\n── Spanish detection ──');
for (const loc of ['es-ES', 'es-MX', 'es-419', 'es']) {
  const s = env({ language: loc }); runBootstrap(s); runLangJs(s);
  check(`${loc} → data-lang=es`, s.html.getAttribute('data-lang'), 'es');
  check(`${loc} → lang=es`, s.html.getAttribute('lang'), 'es');
}
e = env({ language: 'en-US', store: { lang: 'es' } }); runBootstrap(e);
check('stored es beats navigator', e.html.getAttribute('data-lang'), 'es');

console.log('\n── any other language falls back to English ──');
for (const loc of ['ja-JP', 'ko-KR', 'de-DE', 'fr-FR', 'ru-RU', 'ar-SA']) {
  const s = env({ language: loc }); runBootstrap(s); runLangJs(s);
  check(`${loc} → en`, s.html.getAttribute('data-lang'), 'en');
}
e = env({ language: undefined }); runBootstrap(e);
check('missing navigator.language → en', e.html.getAttribute('data-lang'), 'en');

console.log('\n── scripts/lang.js: state on load ──');
e = env({ language: 'zh-CN' }); runBootstrap(e); runLangJs(e);
check('auto zh → Chinese title mirrored', e.doc.title, '聂磐 Pan Nie');
check('auto zh → html lang', e.html.getAttribute('lang'), 'zh-CN');
check('auto zh → aria-pressed on 中文', e.btns[1].getAttribute('aria-pressed'), 'true');
check('auto zh → aria-pressed off EN', e.btns[0].getAttribute('aria-pressed'), 'false');
check('auto zh → load does NOT persist', e.mem.lang, undefined);

e = env({ language: 'es-ES' }); runBootstrap(e); runLangJs(e);
check('auto es → title', e.doc.title, 'Pan Nie');
check('auto es → aria-pressed on ES', e.btns[2].getAttribute('aria-pressed'), 'true');
check('auto es → load does NOT persist', e.mem.lang, undefined);

console.log('\n── scripts/lang.js: manual switching ──');
e = env({ language: 'en-US' }); runBootstrap(e); runLangJs(e);
e.btns[1].fire('click');
check('click 中文 → data-lang=zh', e.html.getAttribute('data-lang'), 'zh');
check('click 中文 → lang=zh-CN', e.html.getAttribute('lang'), 'zh-CN');
check('click 中文 → persisted', e.mem.lang, 'zh');
check('click 中文 → title switched', e.doc.title.includes('聂磐'), true);
check('click 中文 → aria-pressed on 中文', e.btns[1].getAttribute('aria-pressed'), 'true');

e.btns[2].fire('click');
check('click ES → data-lang=es', e.html.getAttribute('data-lang'), 'es');
check('click ES → lang=es', e.html.getAttribute('lang'), 'es');
check('click ES → persisted', e.mem.lang, 'es');
check('click ES → aria-pressed on ES', e.btns[2].getAttribute('aria-pressed'), 'true');
check('click ES → aria-pressed off 中文', e.btns[1].getAttribute('aria-pressed'), 'false');

e.btns[0].fire('click');
check('click EN → back to en', e.html.getAttribute('data-lang'), 'en');
check('click EN → persisted', e.mem.lang, 'en');

console.log('\n── keyboard shortcuts ──');
e = env({ language: 'en-US' }); runBootstrap(e); runLangJs(e);
e.fireKey('2');
check('key 2 → zh', e.html.getAttribute('data-lang'), 'zh');
check('key 2 → persisted', e.mem.lang, 'zh');
e.fireKey('3');
check('key 3 → es', e.html.getAttribute('data-lang'), 'es');
check('key 3 → persisted', e.mem.lang, 'es');
e.fireKey('1');
check('key 1 → en', e.html.getAttribute('data-lang'), 'en');
e.fireKey('p');
check('key p → print', e.printedCount(), 1);

console.log('\n── theme ──');
e = env({ language: 'en-US' }); runBootstrap(e); runLangJs(e);
e.themeBtn.fire('click');
check('theme toggle from light → dark', e.html.getAttribute('data-theme'), 'dark');
check('theme persisted', e.mem.theme, 'dark');
e.themeBtn.fire('click');
check('theme toggle dark → light', e.html.getAttribute('data-theme'), 'light');

e.printBtn.fire('click');
check('print button calls window.print', e.printedCount(), 1);

e = env({ language: 'en-US', darkOS: true }); runBootstrap(e); runLangJs(e);
e.themeBtn.fire('click');
check('OS dark → toggle yields light', e.html.getAttribute('data-theme'), 'light');

console.log(`\n${fail === 0 ? '✓ all passed' : '✗ FAILURES'} — ${pass} passed, ${fail} failed\n`);
process.exit(fail === 0 ? 0 : 1);
