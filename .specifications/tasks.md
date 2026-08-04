# Project Roadmap & Task Backlog

## Metadata & Version History

- **Version**: 1.3.0
- **Date**: 2026-07-29
- **Status**: Updated Baseline (Productivity & UX Features Implemented)

---

## [ ] Backlog

### Productivity & UX Features

*(All items completed — see Completed section below)*

### Infrastructure & Security

* [ ] Bundle Third-Party Dependencies Locally (Offline Cold-Start Fix)
  - Dependencies: `sw.js`, `index.html`
  - Complexity: Medium

- [ ] Implement CI/CD Workflow & Automated Testing
  - Dependencies: GitHub Workflows, Cypress/Playwright
  - Complexity: High

---

## [ ] In Progress

*(No tasks currently in progress)*

---

## [x] Completed

- [x] Core Markdown Live Preview with 300ms Debounce
- [x] DOMPurify XSS Protection Sanitization
- [x] Native File System Access API Integration (Open & Save File Pickers)
- [x] Fallback File I/O (FileReader & Blob Download)
- [x] Basic Formatting Toolbar (Bold `**`, Italic `*`, Headings H1-H3 `#`, Unordered List `-`, Ordered List `1.`, Code/Code Block `` ` ``, Quote `>`, Link `[]()`)
- [x] Unsaved Changes Indicator & Confirmation Prompts
- [x] Dark / Light Theme Toggle with `localStorage` Persistence & System Theme Detection
- [x] Progressive Web App (PWA) Support (Service Worker & `manifest.json`)
- [x] Textarea Tab & Shift+Tab Indentation Handler
- [x] Extended Formatting Toolbar Buttons (Strikethrough `~~`, Headings H4, Horizontal Rule `---`, Task List `- [ ]`)
- [x] Table Insertion Helper Dialog & Toolbar Button
- [x] Image Insertion Dialog & Support for `{widthxheight}` Syntax
- [x] Custom Media Embedding Syntax Extensions (`!video[alt](url)` and `!audio[alt](url)`)
- [x] Page Break Syntax Extension (`===`) and Print CSS
- [x] LaTeX / Math Expressions Engine Integration (KaTeX integration for `$ inline $` and `$$ block $$`)
- [x] GitHub-Style Callout / Alert Boxes (`> [!NOTE]`, `> [!WARNING]`, etc.)
- [x] Footnotes (`[^1]`) and Private Notes (`%% note %%`) Syntax Renderers
- [x] Subscript (`~sub~`), Superscript (`^sup^`), and Highlight (`==mark==`) Syntax Parsers

### UI/UX Redesign — v1.2.0 (2026-07-29)

* [x] **Two-Row Toolbar** — App Bar (Row 1) + Format Bar (Row 2) with logical `btn-group` separators
- [x] **Document Status Bar** — Real-time Word, Char, Line count & Ln/Col cursor position in persistent footer
- [x] **Pane Headers** — "Editor" and "Preview" label strips above each pane
- [x] **Draggable Pane Resizer** — Mouse & touch drag to resize editor/preview split; minimum pane width 180px
- [x] **View Mode Toggle** — Editor Only / Split View / Preview Only buttons with `aria-pressed` state
- [x] **View Mode Persistence** — Active view mode persisted in `localStorage['trialopsiq-viewmode']`
- [x] **Keyboard Shortcuts** — `Ctrl+B` (Bold), `Ctrl+I` (Italic), `Ctrl+N` (New), `Ctrl+O` (Open), `Ctrl+S` (Save), `Alt+1/2/3` (View mode), `Escape` (Close modal)
- [x] **Copy Markdown Button** — `#btn-copy-md` copies raw markdown source to system clipboard
- [x] **Copy HTML Button** — `#btn-copy-html` copies compiled HTML output to system clipboard
- [x] **Modal Shake Animation** — `@keyframes modalShake` + `.shake` class on validation error
- [x] **Content Security Policy (CSP)** — `<meta http-equiv="Content-Security-Policy">` in `<head>`
- [x] **SEO Improvements** — Descriptive `<title>` and `<meta name="description">` tag
- [x] **Keyboard Shortcut Hints** — All interactive buttons include shortcut in `title` attribute tooltip

### Productivity & UX Features — v1.3.0 (2026-07-29)

* [x] **Undo / Redo Toolbar Buttons** — `#btn-undo` / `#btn-redo` in Format Bar; delegate to `document.execCommand('undo'/'redo')` on the focused textarea
- [x] **In-Editor Search & Replace Panel** — Floating panel (`#search-panel`) with Find input, match counter (N/N), prev/next navigation, Replace & Replace All; case-sensitive and regex mode toggles; opened via `Ctrl+F` or toolbar button; closed via Escape
- [x] **Local Storage Draft Auto-Save** — 5-second debounced auto-save to `localStorage['trialopsiq-draft']`; status chip ("● Saving…" / "✓ Draft saved") in the status bar; draft restored on blank-editor load; draft cleared after successful file save
- [x] **Export as HTML** — Generates a self-contained `<filename>.html` document with embedded print-ready CSS and downloads it via Blob URL
- [x] **Export as Plain Text** — Strips all Markdown syntax and downloads clean `.txt` via Blob URL
- [x] **Export Dropdown Menu** — `#btn-export` triggers an animated dropdown (`#export-menu`) in the App Bar; closes on outside click
- [x] **H5 & H6 Toolbar Buttons** — `#btn-h5` and `#btn-h6` added to Headings group in Format Bar; wired to `insertFormatting` with `#####` / `######` prefixes
- [x] **`downloadBlob()` Shared Utility** — Single Blob download helper used by both Export actions and re-usable for future exporters
