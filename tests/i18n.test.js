/* Unit test for the deployed bilingual + theme logic.
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
  const btns = [el('button', { 'data-set-lang': 'en' }), el('button', { 'data-set-lang': 'zh' })];
  const themeBtn = el('button');
  const printBtn = el('button');
  const mem = { ...store };
  const doc = {
    documentElement: html,
    title: 'STATIC TITLE',
    querySelectorAll: (sel) => (sel === '[data-set-lang]' ? btns : []),
    getElementById: (id) => (id === 'theme-toggle' ? themeBtn : id === 'print-btn' ? printBtn : null),
    addEventListener: () => {},
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
  return { ctx, html, btns, themeBtn, printBtn, mem, doc, printedCount: () => printed };
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

console.log('\n── scripts/lang.js ──');
e = env({ language: 'en-US' }); runBootstrap(e); runLangJs(e);
e.btns[1].fire('click');
check('click 中文 → data-lang=zh', e.html.getAttribute('data-lang'), 'zh');
check('click 中文 → lang=zh-CN', e.html.getAttribute('lang'), 'zh-CN');
check('click 中文 → persisted', e.mem.lang, 'zh');
check('click 中文 → title switched', e.doc.title.includes('清华大学'), true);

e.btns[0].fire('click');
check('click EN → back to en', e.html.getAttribute('data-lang'), 'en');
check('click EN → persisted', e.mem.lang, 'en');

e.themeBtn.fire('click');
check('theme toggle from light → dark', e.html.getAttribute('data-theme'), 'dark');
check('theme persisted', e.mem.theme, 'dark');
e.themeBtn.fire('click');
check('theme toggle dark → light', e.html.getAttribute('data-theme'), 'light');

e.printBtn.fire('click');
check('print button calls window.print', e.printedCount(), 1);

console.log('\n── OS dark preference, no explicit choice ──');
e = env({ language: 'en-US', darkOS: true }); runBootstrap(e); runLangJs(e);
e.themeBtn.fire('click');
check('OS dark → toggle yields light', e.html.getAttribute('data-theme'), 'light');

console.log(`\n${fail === 0 ? '✓ all passed' : '✗ FAILURES'} — ${pass} passed, ${fail} failed\n`);
process.exit(fail === 0 ? 0 : 1);
