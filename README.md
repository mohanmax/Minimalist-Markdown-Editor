# Minimalist Markdown Editor

A lightning-fast, 100% client-side Markdown editor designed for privacy and distraction-free writing. Built without complex frameworks, databases, or tracking.

## Features

- 🔒 **Zero Data Collection**: Uses the modern File System Access API. Your files never leave your computer.
- ⚡ **Lightning Fast**: Built with pure HTML/CSS/JS and `marked.js`. Opens instantly.
- 🌓 **Dark & Light Mode**: Toggle between themes to suit your environment.
- 🛠️ **Rich Text Toolbar**: Format your Markdown without having to remember the syntax.
- 📱 **PWA Ready**: Install it to your desktop or dock and use it completely offline!

## How to Run Locally

You don't need a server! Simply open `index.html` in your web browser, or serve it using any basic static file server:

```bash
# Example using Python's built-in HTTP server
python -m http.server 8000
```

## Technologies Used

- Vanilla HTML, CSS, JavaScript
- [Marked.js](https://marked.js.org/) for Markdown parsing
- [DOMPurify](https://github.com/cure53/DOMPurify) for XSS protection
- Font Awesome for icons

## License

MIT License
