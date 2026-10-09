# pan-nie.github.io

My personal homepage — a **CV / résumé site** intended for professional contexts
(job and graduate applications, conference bios, the link on a résumé).

It is deliberately restrained: typography-led, no decorative animation, no build
step. 

## Stack

Plain hand-written HTML, CSS and JavaScript. No framework, no bundler, no
dependencies. Any text editor and a browser are enough.

| Path | Purpose |
| --- | --- |
| `index.html` | The entire page. All three languages live here side by side. |
| `styles/style.css` | Styling, including the dedicated `@media print` rulesheet. |
| `scripts/lang.js` | Language switch, theme toggle, print button (~90 lines). |
| `assets/favicon.svg` | Monogram favicon. |
| `.nojekyll` | Tells GitHub Pages to skip Jekyll processing. |

## How the three languages work

The page ships **English, Simplified Chinese and Spanish**. Every translatable
element is duplicated once per language and tagged:

```html
<span data-lang="en">Undergraduate, Tsinghua University</span>
<span data-lang="zh">清华大学本科生</span>
<span data-lang="es">Estudiante de grado, Universidad de Tsinghua</span>
```

CSS hides whichever languages are not selected:

```css
html[data-lang="en"] [data-lang]:not([data-lang="en"]),
html[data-lang="zh"] [data-lang]:not([data-lang="zh"]),
html[data-lang="es"] [data-lang]:not([data-lang="es"]) { display: none !important; }
```

The visitor's choice is remembered in `localStorage`, and the language is applied
by a small inline script in `<head>` **before first paint**, so there is no flash
of the wrong language. All three languages are present in the HTML source, which
means search engines and no-JavaScript readers see the full text.

Which language a first-time visitor gets, in order:

1. `localStorage.lang`, when it is one of `en`, `zh`, `es`;
2. otherwise the browser locale — `zh…` → Chinese, `es…` → Spanish;
3. otherwise English, which is the fallback for every other language.

A *detected* language is not written to `localStorage`; only an explicit choice
(clicking a button or using `1` / `2` / `3`) is persisted. That way a visitor
whose browser reports a locale they never picked is not locked into it on later
visits.

## Editing content

1. Open `index.html` and find the section you want (`#education`, `#projects`, …).
2. Edit **all three** of the `data-lang="en"`, `data-lang="zh"` and `data-lang="es"`
   elements so the languages stay in sync.
3. Refresh the browser. There is nothing to compile.

Anything highlighted in orange on the page is a placeholder waiting to be filled
in. Search `index.html` for `todo-inline` to find every one of them. Once a
section is genuinely complete, remove the `todo-inline` wrapper so the highlight
disappears.

Sections that currently contain **nothing but** placeholders also carry an
`is-placeholder` class. Those sections are hidden from the printed PDF, so no
bare heading appears on paper with nothing under it. Once a section has real
content, delete the class from that `<section>` tag.

### Content sources

Content is kept in step with the résumé (a Word document kept outside this
repository) and with the public repositories listed on the page. Section ids stay
stable even where a heading was renamed: `#experience` is now **Service &
Practice** (class and college roles, field practice, volunteering), and `#awards`
holds the scholarship and the competition results.

### Still to fill in

| Where | What is needed |
| --- | --- |
| `#experience` | Internships or research positions, once there are any — they belong alongside the current entries |
| `#skills` | The lists are inferred from the repositories; adjust proficiency honestly |
| `#awards` | Publications, once there are any |

## Validating changes

`check.py` verifies the invariants that are easy to break by hand:

```bash
python3 check.py
```

It fails if any anchor points at a missing id, any referenced asset is absent,
any tag is left unclosed, or the JSON-LD does not parse. It also counts the
`data-lang` occurrences and reports any container that is missing a language, so
a translation added in one language but not the others shows up immediately.

`tests/i18n.test.js` exercises the language and theme logic — the part most
likely to break during editing:

```bash
node tests/i18n.test.js
```

It runs the real inline bootstrap and the real `scripts/lang.js` against a small
DOM stub, checking Chinese and Spanish locale detection, that every other
language falls back to English, that a stored choice wins over the browser
locale, that merely loading the page does not persist a detected language, that
switching updates the document language, title and `aria-pressed` state, that the
`1` / `2` / `3` shortcuts work, and that the theme toggle behaves when the OS
preference is dark. It needs no dependencies and no test framework.

## Printing to PDF

Press the printer icon in the header, or `Cmd`/`Ctrl` + `P`. The print stylesheet
strips the navigation and controls, switches to black on white (even when the
site is in dark mode), declares `size: A4` with 12 × 14 mm margins, and keeps
entries whole across page breaks — the result is a clean two- to three-page CV as
the content stands.
Because the PDF is generated from the live page, the web version and the PDF can
never drift out of sync. The printed CV comes out in whichever language is
currently selected, so print once per language if you need all three.

## Keyboard shortcuts

| Key | Action |
| --- | --- |
| `1` | Switch to English |
| `2` | Switch to 中文 |
| `3` | Switch to Español |
| `p` | Print / Save as PDF |

## Local preview

```bash
python3 -m http.server 8000
```

Then open <http://localhost:8000>.

## Deployment

Served by GitHub Pages from the `main` branch root of this repository. Pushing to
`main` publishes automatically; there is no CI step.

Note that project sites deploy to a subpath (`pan-nie.github.io/<repo>/`) and do
not affect this root site.

## Privacy

The only contact detail on this page is a single email address. It intentionally
does **not** publish a phone number, student ID number, home address or other
identifiers that are common on printed Chinese CVs — those are routinely
harvested by crawlers. Keep that fuller version for direct applications.
