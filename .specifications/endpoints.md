# Endpoints & Integrations Specification

## Metadata & Version History
- **Version**: 1.0.0
- **Date**: 2026-07-29
- **Status**: Active Baseline

---

## 1. Backend APIs
* **Status**: N/A (Client-Side Static Application)
* **Confidence**: **High**
* **Notes**: This repository contains no backend server modules, REST APIs, GraphQL endpoints, or serverless functions.

---

## 2. Frontend Routes & Views

| Route / Entry | Type | View Container | Description | Confidence Level |
| :--- | :--- | :--- | :--- | :--- |
| `/` or `index.html` | Static Entry Point | `body` | Main dual-pane editor UI containing split `editor-pane` and `preview-pane`. | **High** |

---

## 3. External Integrations & Remote Assets

The application consumes third-party static assets over HTTP/HTTPS from public CDNs.

| Integration Target | Protocol / Type | Source URL / Resource | Purpose | Confidence Level |
| :--- | :--- | :--- | :--- | :--- |
| **Marked.js CDN** | External Script (CDN) | `https://cdn.jsdelivr.net/npm/marked/marked.min.js` | Client-side Markdown compilation engine | **High** |
| **DOMPurify CDN** | External Script (CDN) | `https://cdnjs.cloudflare.com/ajax/libs/dompurify/3.0.6/purify.min.js` | XSS sanitization library | **High** |
| **Font Awesome CDN** | External Stylesheet (CDN) | `https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css` | UI iconography | **High** |
| **Google Fonts CDN** | External Stylesheet & Font Asset | `https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=JetBrains+Mono&display=swap` | Inter (UI) & JetBrains Mono (Code/Editor) fonts | **High** |
| **Wikimedia Assets** | External Icon Image | `https://upload.wikimedia.org/wikipedia/commons/4/48/Markdown-mark.svg` | App icon reference in `manifest.json` | **High** |

---

## 4. Native Browser & Web API Integrations

| Browser API | Methods Used | Purpose | Confidence Level |
| :--- | :--- | :--- | :--- |
| **File System Access API** | `window.showOpenFilePicker()`, `window.showSaveFilePicker()`, `FileSystemFileHandle.createWritable()` | Native file reading/writing directly to local disk without downloads. | **High** |
| **Web Storage API** | `localStorage.getItem()`, `localStorage.setItem()` | Theme preference persistence (`trialopsiq-theme`). | **High** |
| **Service Worker API** | `navigator.serviceWorker.register('sw.js')` | Progressive Web App offline asset caching. | **High** |
| **DOM / Selection API** | `selectionStart`, `selectionEnd`, `setSelectionRange()` | Monospace text insertion & cursor placement control. | **High** |
| **Match Media API** | `window.matchMedia('(prefers-color-scheme: light)')` | Automatic dark/light theme detection. | **High** |
