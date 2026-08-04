# Product Requirements Document (PRD)

## Metadata & Version History
- **Version**: 1.4.0
- **Date**: 2026-07-29
- **Status**: Updated Baseline (Advanced Productivity & UX Polish Implemented)
- **Repository**: Minimalist-Markdown-Editor

---

## 1. Project Overview
- **Product Name**: Minimalist Markdown Editor (MD Editor)
- **Tagline**: A lightning-fast, 100% client-side Markdown editor designed for privacy and distraction-free writing.
- **Goal**: Provide a lightweight, privacy-first, framework-free web app for editing and live-previewing Markdown documents directly from the local file system without server round-trips or data collection.
- **Confidence**: **High** (Directly verified from `README.md`, `index.html`, and `app.js`)

---

## 2. Target User Personas & User Flows

### Personas
1. **Privacy-Conscious Writer / Journalist**
   - Requires zero remote data persistence or telemetry.
   - Demands direct local file system editing.
   - Benefits from Focus / Distraction-Free Mode (Preview Only).
   - **Confidence**: **High** (Verified via File System Access API implementation)

2. **Developer / Technical Note-Taker**
   - Prefers clean keyboard/toolbar-driven Markdown formatting, math formulas, code snippets, and table structures.
   - Needs syntax-aware dark/light theme options and monospace editor fonts.
   - Benefits from keyboard shortcuts (Ctrl+B, Ctrl+I, Ctrl+S, Alt+1/2/3).
   - Benefits from Copy HTML output action.
   - **Confidence**: **High** (Verified via code block helpers & theme toggle)

3. **Offline / Mobile / Desktop PWA User**
   - Installs the app as a desktop/mobile standalone PWA for offline document drafting.
   - **Confidence**: **High** (Verified via `manifest.json` and `sw.js`)

---

## 3. Core Functional Requirements

| ID | Requirement Name | Description | Confidence Level |
| :--- | :--- | :--- | :--- |
| **FR-01** | Real-Time Live Preview | Debounced (300ms) compilation of raw Markdown input to HTML using `marked.js` and rendering in preview pane. | **High** |
| **FR-02** | XSS Security Sanitization | All compiled HTML output must pass through `DOMPurify.sanitize()` prior to DOM injection. | **High** |
| **FR-03** | Local File Open/Save | Read and write local `.md` and `.txt` files using File System Access API (`showOpenFilePicker`/`showSaveFilePicker`) with fallback to `FileReader` and Blob downloads. | **High** |
| **FR-04** | Unsaved Changes Warning | Track `isDirty` state; warn user via modal confirm dialog when attempting to trigger "New" or "Open" with unsaved edits. | **High** |
| **FR-05** | Basic Formatting Toolbar | Two-row toolbar: App Bar (logo, filename, file ops, copy actions, theme toggle) and Format Bar (grouped icon buttons with logical group separators). | **High** |
| **FR-06** | Dark / Light Theme Toggle | Support dark (Catppuccin Mocha inspired) and light mode with automatic system color scheme detection fallback (`prefers-color-scheme`) and `localStorage` persistence. | **High** |
| **FR-07** | Progressive Web App (PWA) | Support offline installation and execution via `manifest.json` and a Service Worker caching shell assets and CDN scripts. | **High** |
| **FR-08** | Advanced Formatting Suite | Support Strikethrough (`~~`), Task Lists (`- [ ]`), Headings H4, Horizontal Rule (`---`), Page Breaks (`===`), Subscript (`~`), Superscript (`^`), and Text Highlighting (`==`). | **High** |
| **FR-09** | Rich Media Syntax Support | Support Image (`![alt](url){WxH}`), Video (`!video[alt](url)`), and Audio (`!audio[alt](url)`) embedding. | **High** |
| **FR-10** | Math & Callout Rendering | Support LaTeX mathematical expressions (`$...$`, `$$...$$`) and GitHub Callout boxes (`> [!NOTE]`, `> [!WARNING]`). | **High** |
| **FR-11** | Editor Keyboard & Indentation | Intercept `Tab` and `Shift+Tab` keys in editor textarea for proper block/line indentation. | **High** |
| **FR-12** | Document Status Bar | Display real-time word count, character count, line count, and cursor position (Ln/Col) in a persistent bottom status bar. | **High** *(Implemented v1.2)* |
| **FR-13** | View Mode Toggle | Three-mode layout control: Editor Only / Split View / Preview Only. Persisted in `localStorage`. Keyboard shortcuts: `Alt+1`, `Alt+2`, `Alt+3`. | **High** *(Implemented v1.2)* |
| **FR-14** | Draggable Pane Resizer | A draggable vertical divider between editor and preview panes allowing flexible width allocation. Mouse and touch event support. Min pane width: 180px. | **High** *(Implemented v1.2)* |
| **FR-15** | Copy Markdown / Copy HTML | Toolbar icon buttons to copy the raw Markdown source or the compiled HTML output to the system clipboard via the Clipboard API. | **High** *(Implemented v1.2)* |
| **FR-16** | Keyboard Shortcuts | `Ctrl+S` (Save), `Ctrl+N` (New), `Ctrl+O` (Open), `Ctrl+B` (Bold), `Ctrl+I` (Italic), `Alt+1/2/3` (View Mode), `Escape` (Close Modal). | **High** *(Expanded in v1.2)* |
| **FR-17** | Pane Headers | Persistent "Editor" and "Preview" header labels above each pane for orientation. | **High** *(Implemented v1.2)* |
| **FR-18** | Modal Validation Shake | Shake animation feedback on the modal dialog when required fields are left empty on submission. | **High** *(Implemented v1.2)* |
| **FR-19** | Content Security Policy | CSP meta tag restricting script, style, font, and image sources for XSS hardening. | **High** *(Implemented v1.2)* |
| **FR-20** | Undo / Redo Toolbar Buttons | `#btn-undo` and `#btn-redo` buttons in the Format Bar delegate to `document.execCommand('undo'/'redo')` on the focused textarea, preserving the browser's native undo history. | **High** *(Implemented v1.3)* |
| **FR-21** | In-Editor Search & Replace | Floating `#search-panel` widget with find, match counter, prev/next navigation, replace-one, replace-all, case-sensitivity toggle, and regex mode toggle. Opened via `Ctrl+F` or toolbar button; closed via `Escape`. | **High** *(Implemented v1.3)* |
| **FR-22** | Draft Auto-Save | 5-second debounced auto-save of editor content to `localStorage['trialopsiq-draft']`. Status chip shows "● Saving…" / "✓ Draft saved" in the status bar. Draft is restored on blank-editor load and cleared on successful file save. | **High** *(Implemented v1.3)* |
| **FR-23** | Export as HTML | Generates a fully self-contained `.html` document (with embedded CSS) from the live preview DOM and downloads it via Blob URL. | **High** *(Implemented v1.3)* |
| **FR-24** | Export as Plain Text | Strips all Markdown syntax from the source and downloads a clean `.txt` file via Blob URL. | **High** *(Implemented v1.3)* |
| **FR-25** | Export Dropdown Menu | `#btn-export` triggers an animated dropdown (`#export-menu`) in the App Bar containing the HTML and TXT export actions. Closes on outside click. | **High** *(Implemented v1.3)* |
| **FR-26** | H5 & H6 Toolbar Buttons | `#btn-h5` and `#btn-h6` added to the Headings group in the Format Bar, inserting `#####` / `######` prefixes via the shared `insertFormatting` helper. | **High** *(Implemented v1.3)* |

---

## 4. Gap Analysis & Text Editing Audit

| Editing Option Category | Feature | Native `marked.js` Support | Current UI / Toolbar Support | Status / Gap Action |
| :--- | :--- | :--- | :--- | :--- |
| **Headings & Structure** | Headings H1-H3 | Supported | Yes (`btn-h1`, `btn-h2`, `btn-h3`) | ✅ Available |
| | Headings H4 | Supported | Yes (`btn-h4`) | ✅ Available |
| | Headings H5-H6 | Supported | No | ⚠️ No toolbar button (parsed via raw markdown) |
| | Page Breaks (`===`) | Custom ext. | Yes (`btn-pagebreak`) | ✅ Available |
| | Horizontal Lines (`---`) | Supported | Yes (`btn-hr`) | ✅ Available |
| | Blockquotes (`>`) | Supported | Yes (`btn-quote`) | ✅ Available |
| **Text Formatting** | Bold (`**`) | Supported | Yes (`btn-bold`, `Ctrl+B`) | ✅ Available |
| | Italic (`*`) | Supported | Yes (`btn-italic`, `Ctrl+I`) | ✅ Available |
| | Strikethrough (`~~`) | Supported (GFM) | Yes (`btn-strikethrough`) | ✅ Available |
| | Subscript (`~`) / Superscript (`^`) | Custom ext. | Yes | ✅ Available |
| | Highlight (`==text==`) | Custom ext. | Yes (`btn-highlight`) | ✅ Available |
| **Lists & Indentation** | Unordered Lists | Supported | Yes (`btn-list-ul`) | ✅ Available |
| | Ordered Lists | Supported | Yes (`btn-list-ol`) | ✅ Available |
| | Task Lists (`- [ ]`) | Supported (GFM) | Yes (`btn-tasklist`) | ✅ Available |
| | Tab Key Indentation | N/A | Yes (Tab/Shift+Tab handler) | ✅ Available |
| **Media & Links** | Links (`[text](url)`) | Supported | Yes (`btn-link`) | ✅ Available |
| | Images (`![alt](url){WxH}`) | Custom ext. | Yes (`btn-image`) | ✅ Available |
| | Videos (`!video[alt](url)`) | Custom ext. | Yes (`btn-video`) | ✅ Available |
| | Audio (`!audio[alt](url)`) | Custom ext. | Yes (`btn-audio`) | ✅ Available |
| **Code & Advanced** | Inline Code & Code Blocks | Supported | Yes (`btn-code`) | ✅ Available |
| | Tables | Supported (GFM) | Yes (`btn-table`) | ✅ Available |
| | LaTeX / Math | KaTeX | Yes (`btn-math`) | ✅ Available |
| | Callouts (`> [!NOTE]`) | Custom ext. | Yes (`btn-callout`) | ✅ Available |
| | Footnotes (`[^1]`) | Custom ext. | Yes (`btn-footnote`) | ✅ Available |
| | Private Notes (`%% note %%`) | Custom ext. | Yes (`btn-privatenote`) | ✅ Available |
| **UX & Productivity** | Undo / Redo | Browser native | Yes (`#btn-undo`, `#btn-redo`) | ✅ Implemented v1.3 |
| | Text Search & Replace | Custom regex engine | Yes (`#search-panel`, `Ctrl+F`) | ✅ Implemented v1.3 |
| | Copy Markdown / HTML | Clipboard API | Yes (`btn-copy-md`, `btn-copy-html`) | ✅ Implemented v1.2 |
| | Document Status Bar | N/A | Yes (word, char, line, cursor) | ✅ Implemented v1.2 |
| | Draft Auto-Save | localStorage | Yes (5s debounce) | ✅ Implemented v1.3 |
| | Export HTML / Plain Text | Blob API | Yes (`btn-export` dropdown) | ✅ Implemented v1.3 |

---

## 5. [TODO: Human Input]

- [ ] Confirm preference for additional Heading button behaviour (H5/H6 now present; H7+ is non-standard).
- [ ] Determine if PDF export capability should be introduced into the V1.4 roadmap.
- [ ] Establish target test browser matrix (Chromium, Firefox, Safari versions for File System Access API support).
- [ ] Confirm whether the plain-text export should preserve list bullet characters or strip them entirely.
- [ ] Consider adding in-editor word-wrap toggle to the status bar.
