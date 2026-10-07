# pan-nie.github.io

My personal homepage — a **CV / résumé site** intended for professional contexts
(job and graduate applications, conference bios, the link on a résumé).

It is deliberately restrained: typography-led, no decorative animation, no build
step. The playful, creative side of my work lives at
[nathanpenny.fun](https://nathanpenny.fun) — the two sites link to each other and
serve different purposes.

## Stack

Plain hand-written HTML, CSS and JavaScript. No framework, no bundler, no
dependencies. Any text editor and a browser are enough.

| Path | Purpose |
| --- | --- |
| `index.html` | The entire page. Both languages live here side by side. |
| `styles/style.css` | Styling, including the dedicated `@media print` rulesheet. |
| `scripts/lang.js` | Language toggle, theme toggle, print button (~70 lines). |
| `assets/favicon.svg` | Monogram favicon. |
| `.nojekyll` | Tells GitHub Pages to skip Jekyll processing. |

## How the bilingual text works

Every translatable element is duplicated and tagged with a language:

```html
<span data-lang="en">Undergraduate, Tsinghua University</span>
<span data-lang="zh">清华大学 本科生</span>
```

CSS hides whichever language is not selected:

```css
html[data-lang="en"] [data-lang="zh"],
html[data-lang="zh"] [data-lang="en"] { display: none !important; }
```

The visitor's choice is remembered in `localStorage`, and the language is applied
by a small inline script in `<head>` **before first paint**, so there is no flash
of the wrong language. Both languages are present in the HTML source, which means
search engines and no-JavaScript readers see the full text.

## Editing content

1. Open `index.html` and find the section you want (`#education`, `#projects`, …).
2. Edit **both** the `data-lang="en"` and `data-lang="zh"` elements so the two
   languages stay in sync.
3. Refresh the browser. There is nothing to compile.

Anything highlighted in orange on the page is a placeholder waiting to be filled
in. Search `index.html` for `todo-inline` to find every one of them. Once a
section is genuinely complete, remove the `todo-inline` wrapper so the highlight
disappears.

Sections that currently contain **nothing but** placeholders also carry an
`is-placeholder` class. Those sections are hidden from the printed PDF, so no
bare heading appears on paper with nothing under it. Once a section has real
content, delete the class from that `<section>` tag.

### Still to fill in

| Where | What is needed |
| --- | --- |
| Hero | Chinese name |
| `#education` | Major, start/end dates, GPA or class rank |
| `#experience` | Internships, research or teaching positions — or delete the section |
| `#awards` | Scholarships, competitions, publications — or delete the section |
| `#skills` | The lists are inferred from the repositories; adjust proficiency honestly |

## Validating changes

`check.py` verifies the invariants that are easy to break by hand:

```bash
python3 check.py
```

It fails if any anchor points at a missing id, any referenced asset is absent,
any tag is left unclosed, the JSON-LD does not parse, or a container carries only
one of the two languages.

`tests/i18n.test.js` exercises the language and theme logic — the part most
likely to break during editing:

```bash
node tests/i18n.test.js
```

It runs the real inline bootstrap and the real `scripts/lang.js` against a small
DOM stub, checking Chinese-locale detection, that a stored choice wins over the
browser locale, that switching updates the document language and title, that the
choice persists, and that the theme toggle behaves when the OS preference is
dark. It needs no dependencies and no test framework.

## Printing to PDF

Press the printer icon in the header, or `Cmd`/`Ctrl` + `P`. The print stylesheet
strips the navigation and controls, switches to black on white, sets A4 margins,
and prevents entries from breaking across pages — the result is a clean one- to
two-page CV. Because the PDF is generated from the live page, the web version and
the PDF can never drift out of sync.

## Keyboard shortcuts

| Key | Action |
| --- | --- |
| `1` | Switch to English |
| `2` | Switch to 中文 |
| `p` | Print / Save as PDF |

## Local preview

```bash
python3 -m http.server 8000
```

Then open <http://localhost:8000>.

## Deployment

Served by GitHub Pages from the `main` branch root of this repository. Pushing to
`main` publishes automatically; there is no CI step.

Note that a separate GitHub Pages site already exists at
`pan-nie.github.io/nathanpenny.fun/` — project sites live on a subpath, so
the two coexist and neither affects the other.

## Privacy

This page intentionally does **not** publish a phone number, ID number, home
address or other identifiers that are common on printed Chinese CVs. Those are
routinely harvested by crawlers. Keep the full version for direct applications
and leave only an email address here.
