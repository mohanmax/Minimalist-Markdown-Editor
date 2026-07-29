document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const markdownInput = document.getElementById('markdown-input');
    const htmlPreview = document.getElementById('html-preview');
    const fileNameDisplay = document.getElementById('file-name');

    // Default Welcome Text
    if (!markdownInput.value) {
        markdownInput.value = `# Welcome to MD Editor! 🚀\n\nA lightning-fast, 100% client-side Markdown editor designed for privacy and distraction-free writing.\n\n## Extended Features Enabled ✨\n\n- 🧪 **Math/LaTeX**: $E = mc^2$ and block math:\n  $$\n  \\int_0^\\infty e^{-x^2} dx = \\frac{\\sqrt{\\pi}}{2}\n  $$\n- 💡 **Callout Boxes**: \n  > [!NOTE]\n  > Rich callouts with icons and custom theme styling.\n- 📝 **Formatting**: ~~Strikethrough~~, ==Highlighted text==, H~2~O subscript, X^2^ superscript.\n- 🎬 **Media Embeds**: \n  !video[Demo Video](https://www.w3schools.com/html/mov_bbb.mp4){640x360}\n- 📄 **Page Breaks**: Insert \`===\` for printable page breaks.\n- 📌 **Footnotes & Private Notes**: Reference[^1] and confidential comments %% private note %%.\n\n[^1]: Footnotes render automatically at the end of the document.\n\n> Go ahead, edit this text and start writing!`;
    }

    // Buttons
    const btnNew = document.getElementById('btn-new');
    const btnOpen = document.getElementById('btn-open');
    const btnSave = document.getElementById('btn-save');

    // State
    let fileHandle = null;
    let currentFileName = 'Untitled.md';
    let isDirty = false;

    // --- Theme Toggle ---
    const btnTheme = document.getElementById('btn-theme');
    const themeIcon = btnTheme.querySelector('i');
    const THEME_KEY = 'trialopsiq-theme';

    function setTheme(isLight) {
        if (isLight) {
            document.body.classList.add('light-theme');
            themeIcon.classList.remove('fa-sun');
            themeIcon.classList.add('fa-moon');
            btnTheme.title = 'Toggle Dark Mode';
            localStorage.setItem(THEME_KEY, 'light');
        } else {
            document.body.classList.remove('light-theme');
            themeIcon.classList.remove('fa-moon');
            themeIcon.classList.add('fa-sun');
            btnTheme.title = 'Toggle Light Mode';
            localStorage.setItem(THEME_KEY, 'dark');
        }
    }

    btnTheme.addEventListener('click', () => {
        const isLight = !document.body.classList.contains('light-theme');
        setTheme(isLight);
    });

    // Initialize Theme
    const savedTheme = localStorage.getItem(THEME_KEY);
    if (savedTheme) {
        setTheme(savedTheme === 'light');
    } else {
        const prefersLight = window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches;
        setTheme(prefersLight);
    }

    // --- DOMPurify Configuration ---
    const dompurifyConfig = {
        ADD_TAGS: [
            'video', 'audio', 'source', 'mark', 'sub', 'sup',
            'math', 'annotation', 'semantics', 'mtext', 'mn', 'mo', 'ms',
            'mspace', 'mtable', 'mtr', 'mtd', 'mrow', 'annotation-xml',
            'svg', 'path', 'g', 'line', 'rect', 'circle', 'use'
        ],
        ADD_ATTR: [
            'controls', 'src', 'type', 'title', 'width', 'height', 'style',
            'autoplay', 'loop', 'preload', 'target', 'id', 'aria-hidden',
            'encoding', 'viewBox', 'd', 'xmlns', 'class', 'data-page-break'
        ],
        ADD_DATA_URI_TAGS: ['img', 'video', 'audio', 'source'],
        ALLOWED_URI_REGEXP: /^(?:(?:(?:f|ht)tps?|mailto|tel|callto|cid|xmpp|file|data|blob):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i
    };

    // --- Custom Marked Extensions ---

    const subscriptExt = {
        name: 'subscript',
        level: 'inline',
        start(src) { return src.indexOf('~'); },
        tokenizer(src) {
            const rule = /^~([^~\r\n]+?)~/;
            const match = rule.exec(src);
            if (match) {
                const token = {
                    type: 'subscript',
                    raw: match[0],
                    text: match[1],
                    tokens: []
                };
                this.lexer.inlineTokens(token.text, token.tokens);
                return token;
            }
        },
        renderer(token) {
            return `<sub>${this.parser.parseInline(token.tokens)}</sub>`;
        }
    };

    const superscriptExt = {
        name: 'superscript',
        level: 'inline',
        start(src) { return src.indexOf('^'); },
        tokenizer(src) {
            const rule = /^\^([^\^\r\n]+?)\^/;
            const match = rule.exec(src);
            if (match) {
                const token = {
                    type: 'superscript',
                    raw: match[0],
                    text: match[1],
                    tokens: []
                };
                this.lexer.inlineTokens(token.text, token.tokens);
                return token;
            }
        },
        renderer(token) {
            return `<sup>${this.parser.parseInline(token.tokens)}</sup>`;
        }
    };

    const highlightExt = {
        name: 'highlight',
        level: 'inline',
        start(src) { return src.indexOf('=='); },
        tokenizer(src) {
            const rule = /^==([^=\r\n]+?)==/;
            const match = rule.exec(src);
            if (match) {
                const token = {
                    type: 'highlight',
                    raw: match[0],
                    text: match[1],
                    tokens: []
                };
                this.lexer.inlineTokens(token.text, token.tokens);
                return token;
            }
        },
        renderer(token) {
            return `<mark>${this.parser.parseInline(token.tokens)}</mark>`;
        }
    };

    const imageSizeExt = {
        name: 'imageSize',
        level: 'inline',
        start(src) { return src.indexOf('!['); },
        tokenizer(src) {
            const rule = /^!\[(?<alt>[^\]]*)\](?:(?:\((?<url>[^\s\)]+)(?:\s+"(?<title>[^"]*)")?\))|(?:\[(?<ref>[^\]]+)\]))(?:\{(?<size>[^\}]+)\})?/;
            const match = rule.exec(src);
            if (match) {
                let { alt, url, ref, title, size } = match.groups;
                if (!url && ref && this.lexer.tokens.links && this.lexer.tokens.links[ref.toLowerCase()]) {
                    const link = this.lexer.tokens.links[ref.toLowerCase()];
                    url = link.href;
                    if (!title) title = link.title || '';
                }
                if (url) {
                    return {
                        type: 'imageSize',
                        raw: match[0],
                        alt: alt || '',
                        url,
                        title: title || '',
                        size: size || ''
                    };
                }
            }
        },
        renderer(token) {
            let widthStr = '';
            let heightStr = '';
            if (token.size) {
                if (token.size.includes('x')) {
                    const parts = token.size.split('x');
                    if (parts[0]) widthStr = isNaN(parts[0]) ? parts[0] : parts[0] + 'px';
                    if (parts[1]) heightStr = isNaN(parts[1]) ? parts[1] : parts[1] + 'px';
                } else {
                    widthStr = isNaN(token.size) ? token.size : token.size + 'px';
                }
            }

            let styleStr = 'max-width:100%; border-radius:6px;';
            if (widthStr) styleStr += ` width:${widthStr};`;
            if (heightStr) styleStr += ` height:${heightStr};`;

            return `<img src="${token.url}" alt="${token.alt}" ${token.title ? `title="${token.title}"` : ''} style="${styleStr}" />`;
        }
    };

    const videoExt = {
        name: 'videoEmbed',
        level: 'inline',
        start(src) { return src.indexOf('!video['); },
        tokenizer(src) {
            const rule = /^!video\[(?<alt>[^\]]*)\](?:(?:\((?<url>[^\s\)]+)(?:\s+"(?<title>[^"]*)")?\))|(?:\[(?<ref>[^\]]+)\]))(?:\{(?<size>[^\}]+)\})?/;
            const match = rule.exec(src);
            if (match) {
                let { alt, url, ref, title, size } = match.groups;
                if (!url && ref && this.lexer.tokens.links && this.lexer.tokens.links[ref.toLowerCase()]) {
                    const link = this.lexer.tokens.links[ref.toLowerCase()];
                    url = link.href;
                    if (!title) title = link.title || '';
                }
                if (url) {
                    return {
                        type: 'videoEmbed',
                        raw: match[0],
                        alt: alt || '',
                        url,
                        title: title || '',
                        size: size || ''
                    };
                }
            }
        },
        renderer(token) {
            let widthStr = '100%';
            let heightStr = 'auto';
            if (token.size) {
                if (token.size.includes('x')) {
                    const parts = token.size.split('x');
                    if (parts[0]) widthStr = isNaN(parts[0]) ? parts[0] : parts[0] + 'px';
                    if (parts[1]) heightStr = isNaN(parts[1]) ? parts[1] : parts[1] + 'px';
                } else {
                    widthStr = isNaN(token.size) ? token.size : token.size + 'px';
                }
            }
            const styleStr = `width:${widthStr}; height:${heightStr}; max-width:100%; border-radius: 8px;`;
            return `<div class="media-container video-container"><video controls src="${token.url}" title="${token.alt || token.title}" style="${styleStr}">${token.alt || 'Video playback not supported.'}</video></div>`;
        }
    };

    const audioExt = {
        name: 'audioEmbed',
        level: 'inline',
        start(src) { return src.indexOf('!audio['); },
        tokenizer(src) {
            const rule = /^!audio\[(?<alt>[^\]]*)\](?:(?:\((?<url>[^\s\)]+)(?:\s+"(?<title>[^"]*)")?\))|(?:\[(?<ref>[^\]]+)\]))/;
            const match = rule.exec(src);
            if (match) {
                let { alt, url, ref, title } = match.groups;
                if (!url && ref && this.lexer.tokens.links && this.lexer.tokens.links[ref.toLowerCase()]) {
                    const link = this.lexer.tokens.links[ref.toLowerCase()];
                    url = link.href;
                    if (!title) title = link.title || '';
                }
                if (url) {
                    return {
                        type: 'audioEmbed',
                        raw: match[0],
                        alt: alt || '',
                        url,
                        title: title || ''
                    };
                }
            }
        },
        renderer(token) {
            return `<div class="media-container audio-container"><audio controls src="${token.url}" title="${token.alt || token.title}" style="width:100%; max-width:500px;">${token.alt || 'Audio playback not supported.'}</audio></div>`;
        }
    };

    const pageBreakExt = {
        name: 'pageBreak',
        level: 'block',
        start(src) { return src.match(/^(?:===|\\pagebreak)/m)?.index; },
        tokenizer(src) {
            const rule = /^(?:===|\\pagebreak)[ \t]*(?:\n|$)/;
            const match = rule.exec(src);
            if (match) {
                return {
                    type: 'pageBreak',
                    raw: match[0]
                };
            }
        },
        renderer() {
            return `<div class="page-break" data-page-break="Page Break"></div>`;
        }
    };

    const blockMathExt = {
        name: 'blockMath',
        level: 'block',
        start(src) { return src.indexOf('$$'); },
        tokenizer(src) {
            const rule = /^\$\$\n?([\s\S]+?)\n?\$\$/;
            const match = rule.exec(src);
            if (match) {
                return {
                    type: 'blockMath',
                    raw: match[0],
                    text: match[1].trim()
                };
            }
        },
        renderer(token) {
            if (typeof katex !== 'undefined') {
                try {
                    return `<div class="katex-block">${katex.renderToString(token.text, { displayMode: true, throwOnError: false })}</div>`;
                } catch (e) {
                    return `<div class="katex-error">${token.text}</div>`;
                }
            }
            return `<pre class="math-fallback"><code>${token.text}</code></pre>`;
        }
    };

    const inlineMathExt = {
        name: 'inlineMath',
        level: 'inline',
        start(src) { return src.indexOf('$'); },
        tokenizer(src) {
            const rule = /^\$((?:\\\$|[^\$\n])+)\$/;
            const match = rule.exec(src);
            if (match) {
                return {
                    type: 'inlineMath',
                    raw: match[0],
                    text: match[1].trim()
                };
            }
        },
        renderer(token) {
            if (typeof katex !== 'undefined') {
                try {
                    return katex.renderToString(token.text, { displayMode: false, throwOnError: false });
                } catch (e) {
                    return `<code>${token.text}</code>`;
                }
            }
            return `<code>$${token.text}$</code>`;
        }
    };

    let activeFootnotes = [];

    const footnoteRefExt = {
        name: 'footnoteRef',
        level: 'inline',
        start(src) { return src.indexOf('[^'); },
        tokenizer(src) {
            const rule = /^\[\^([^\]]+)\](?!:)/;
            const match = rule.exec(src);
            if (match) {
                return {
                    type: 'footnoteRef',
                    raw: match[0],
                    label: match[1]
                };
            }
        },
        renderer(token) {
            return `<sup class="footnote-ref"><a href="#fn-${token.label}" id="fnref-${token.label}">[${token.label}]</a></sup>`;
        }
    };

    const footnoteDefExt = {
        name: 'footnoteDef',
        level: 'block',
        start(src) { return src.match(/^\[\^([^\]]+)\]:/m)?.index; },
        tokenizer(src) {
            const rule = /^\[\^([^\]]+)\]:\s*([^\n]+(?:\n+(?:[ ]{4}|\t)[^\n]+)*)/;
            const match = rule.exec(src);
            if (match) {
                activeFootnotes.push({
                    label: match[1],
                    content: match[2].trim()
                });
                return {
                    type: 'footnoteDef',
                    raw: match[0]
                };
            }
        },
        renderer() {
            return '';
        }
    };

    const privateNoteExt = {
        name: 'privateNote',
        level: 'inline',
        start(src) { return src.indexOf('%%'); },
        tokenizer(src) {
            const rule = /^%%([\s\S]+?)%%/;
            const match = rule.exec(src);
            if (match) {
                return {
                    type: 'privateNote',
                    raw: match[0],
                    text: match[1].trim()
                };
            }
        },
        renderer(token) {
            return `<span class="private-note" title="Private Note"><i class="fa-solid fa-eye-slash"></i> <span class="private-note-text">${token.text}</span></span>`;
        }
    };

    const customRenderer = {
        blockquote(quote) {
            const alertRegex = /^\s*<p>\s*\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\](?:\s*<br\s*\/?>|\s*\n)?\s*/i;
            const match = alertRegex.exec(quote);
            if (match) {
                const alertType = match[1].toUpperCase();
                const cleanContent = quote.replace(match[0], '<p>');

                let iconClass = 'fa-info-circle';
                let alertTitle = 'Note';
                let alertCss = 'markdown-alert-note';

                switch (alertType) {
                    case 'TIP':
                        iconClass = 'fa-lightbulb';
                        alertTitle = 'Tip';
                        alertCss = 'markdown-alert-tip';
                        break;
                    case 'IMPORTANT':
                        iconClass = 'fa-circle-exclamation';
                        alertTitle = 'Important';
                        alertCss = 'markdown-alert-important';
                        break;
                    case 'WARNING':
                        iconClass = 'fa-triangle-exclamation';
                        alertTitle = 'Warning';
                        alertCss = 'markdown-alert-warning';
                        break;
                    case 'CAUTION':
                        iconClass = 'fa-shield-halved';
                        alertTitle = 'Caution';
                        alertCss = 'markdown-alert-caution';
                        break;
                    default:
                        iconClass = 'fa-info-circle';
                        alertTitle = 'Note';
                        alertCss = 'markdown-alert-note';
                        break;
                }

                return `<div class="markdown-alert ${alertCss}">
                    <p class="markdown-alert-title"><i class="fa-solid ${iconClass}"></i> ${alertTitle}</p>
                    <div class="markdown-alert-content">${cleanContent}</div>
                </div>`;
            }
            return `<blockquote>${quote}</blockquote>`;
        }
    };

    marked.use({
        gfm: true,
        breaks: true,
        renderer: customRenderer,
        extensions: [
            subscriptExt, superscriptExt, highlightExt, imageSizeExt, videoExt, audioExt,
            pageBreakExt, blockMathExt, inlineMathExt, footnoteRefExt, footnoteDefExt, privateNoteExt
        ]
    });

    // --- Markdown Rendering Pipeline ---

    let debounceTimer;
    function updatePreview() {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
            activeFootnotes = [];
            const markdownText = markdownInput.value;
            let rawHtml = marked.parse(markdownText);

            if (activeFootnotes.length > 0) {
                const footnotesHtml = `
                    <section class="footnotes">
                        <hr class="footnotes-sep">
                        <ol class="footnotes-list">
                            ${activeFootnotes.map(fn => `
                                <li id="fn-${fn.label}" class="footnote-item">
                                    <p>${marked.parseInline(fn.content)} <a href="#fnref-${fn.label}" class="footnote-backref" title="Jump back to reference">↩</a></p>
                                </li>
                            `).join('')}
                        </ol>
                    </section>
                `;
                rawHtml += footnotesHtml;
            }

            const cleanHtml = DOMPurify.sanitize(rawHtml, dompurifyConfig);
            htmlPreview.innerHTML = cleanHtml;

            if (!isDirty && markdownText !== '') {
                setDirty(true);
            }
        }, 300);
    }

    markdownInput.addEventListener('input', updatePreview);

    // --- Textarea Tab & Shift+Tab Indentation Handler ---
    markdownInput.addEventListener('keydown', (e) => {
        if (e.key === 'Tab') {
            e.preventDefault();
            const start = markdownInput.selectionStart;
            const end = markdownInput.selectionEnd;
            const value = markdownInput.value;

            if (start === end) {
                if (e.shiftKey) {
                    const lineStart = value.lastIndexOf('\n', start - 1) + 1;
                    const lineText = value.substring(lineStart, start);
                    if (lineText.endsWith('  ')) {
                        markdownInput.value = value.substring(0, start - 2) + value.substring(start);
                        markdownInput.selectionStart = markdownInput.selectionEnd = start - 2;
                    } else if (lineText.endsWith('\t')) {
                        markdownInput.value = value.substring(0, start - 1) + value.substring(start);
                        markdownInput.selectionStart = markdownInput.selectionEnd = start - 1;
                    } else if (value.substring(lineStart).startsWith('  ')) {
                        markdownInput.value = value.substring(0, lineStart) + value.substring(lineStart + 2);
                        markdownInput.selectionStart = markdownInput.selectionEnd = Math.max(lineStart, start - 2);
                    } else if (value.substring(lineStart).startsWith(' ')) {
                        markdownInput.value = value.substring(0, lineStart) + value.substring(lineStart + 1);
                        markdownInput.selectionStart = markdownInput.selectionEnd = Math.max(lineStart, start - 1);
                    }
                } else {
                    markdownInput.value = value.substring(0, start) + '  ' + value.substring(end);
                    markdownInput.selectionStart = markdownInput.selectionEnd = start + 2;
                }
            } else {
                const lineStart = value.lastIndexOf('\n', start - 1) + 1;
                let lineEnd = value.indexOf('\n', end);
                if (lineEnd === -1) lineEnd = value.length;

                const selectedBlock = value.substring(lineStart, lineEnd);
                const lines = selectedBlock.split('\n');

                let newLines;
                if (e.shiftKey) {
                    newLines = lines.map(line => {
                        if (line.startsWith('  ')) return line.substring(2);
                        if (line.startsWith('\t') || line.startsWith(' ')) return line.substring(1);
                        return line;
                    });
                } else {
                    newLines = lines.map(line => '  ' + line);
                }

                const newBlock = newLines.join('\n');
                markdownInput.value = value.substring(0, lineStart) + newBlock + value.substring(lineEnd);

                markdownInput.selectionStart = lineStart;
                markdownInput.selectionEnd = lineStart + newBlock.length;
            }

            updatePreview();
            setDirty(true);
        }
    });

    // --- Dynamic Modal System ---
    const modalOverlay = document.getElementById('modal-overlay');
    const modalTitle = document.getElementById('modal-title');
    const modalFields = document.getElementById('modal-fields');
    const modalForm = document.getElementById('modal-form');
    const modalCloseBtn = document.getElementById('modal-close-btn');
    const modalCancelBtn = document.getElementById('modal-cancel-btn');

    let currentModalSubmitHandler = null;

    function closeModal() {
        modalOverlay.classList.add('hidden');
        modalFields.innerHTML = '';
        if (currentModalSubmitHandler) {
            modalForm.removeEventListener('submit', currentModalSubmitHandler);
            currentModalSubmitHandler = null;
        }
    }

    modalCloseBtn.addEventListener('click', closeModal);
    modalCancelBtn.addEventListener('click', closeModal);
    modalOverlay.addEventListener('click', (e) => {
        if (e.target === modalOverlay) closeModal();
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && !modalOverlay.classList.contains('hidden')) {
            closeModal();
        }
    });

    function showModal({ title, fields, onSubmit }) {
        closeModal();

        modalTitle.textContent = title;
        modalFields.innerHTML = '';

        fields.forEach(field => {
            const group = document.createElement('div');
            group.className = 'form-group' + (field.type === 'checkbox' ? ' form-group-checkbox' : '');

            const label = document.createElement('label');
            label.htmlFor = `modal-field-${field.id}`;
            label.textContent = field.label;

            let input;
            if (field.type === 'select') {
                input = document.createElement('select');
                field.options.forEach(opt => {
                    const option = document.createElement('option');
                    option.value = opt.value;
                    option.textContent = opt.label;
                    if (opt.value === field.value) option.selected = true;
                    input.appendChild(option);
                });
            } else if (field.type === 'textarea') {
                input = document.createElement('textarea');
                input.rows = field.rows || 3;
                input.value = field.value || '';
            } else if (field.type === 'file') {
                input = document.createElement('input');
                input.type = 'file';
                if (field.accept) input.accept = field.accept;
                input.addEventListener('change', (e) => {
                    const file = e.target.files[0];
                    if (file) {
                        const reader = new FileReader();
                        reader.onload = (event) => {
                            if (field.targetId) {
                                const targetUrlInput = document.getElementById(`modal-field-${field.targetId}`);
                                if (targetUrlInput) {
                                    targetUrlInput.value = event.target.result;
                                }
                            }
                        };
                        reader.readAsDataURL(file);
                    }
                });
            } else {
                input = document.createElement('input');
                input.type = field.type || 'text';
                if (field.type === 'checkbox') {
                    input.checked = !!field.value;
                } else {
                    input.value = field.value || '';
                }
            }

            input.id = `modal-field-${field.id}`;
            if (field.placeholder) input.placeholder = field.placeholder;
            if (field.min !== undefined) input.min = field.min;
            if (field.max !== undefined) input.max = field.max;

            if (field.type === 'checkbox') {
                group.appendChild(input);
                group.appendChild(label);
            } else {
                group.appendChild(label);
                group.appendChild(input);
            }

            modalFields.appendChild(group);
        });

        currentModalSubmitHandler = (e) => {
            e.preventDefault();
            const results = {};
            fields.forEach(field => {
                const el = document.getElementById(`modal-field-${field.id}`);
                if (el) {
                    if (field.type === 'checkbox') {
                        results[field.id] = el.checked;
                    } else {
                        results[field.id] = el.value.trim();
                    }
                }
            });
            closeModal();
            onSubmit(results);
        };

        modalForm.addEventListener('submit', currentModalSubmitHandler);
        modalOverlay.classList.remove('hidden');

        const firstInput = modalFields.querySelector('input, select, textarea');
        if (firstInput) firstInput.focus();
    }

    // --- State Management & Notification Toast ---

    function showToast(message, type = 'success') {
        let container = document.getElementById('toast-container');
        if (!container) {
            container = document.createElement('div');
            container.id = 'toast-container';
            container.className = 'toast-container';
            document.body.appendChild(container);
        }

        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;

        let icon = 'fa-check-circle';
        if (type === 'error') icon = 'fa-exclamation-circle';
        if (type === 'info') icon = 'fa-info-circle';

        toast.innerHTML = `<i class="fa-solid ${icon}"></i> <span>${message}</span>`;
        container.appendChild(toast);

        setTimeout(() => {
            toast.classList.add('show');
        }, 10);

        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => {
                toast.remove();
            }, 300);
        }, 3000);
    }

    function setDirty(dirty) {
        isDirty = dirty;
        if (dirty) {
            fileNameDisplay.classList.add('dirty');
        } else {
            fileNameDisplay.classList.remove('dirty');
        }
    }

    function setFileName(name) {
        currentFileName = name;
        fileNameDisplay.textContent = name;
    }

    // --- File Operations (File System Access API with Fallbacks) ---

    async function getWritePermission(handle) {
        if (!handle || typeof handle.createWritable !== 'function') return false;
        try {
            if (handle.queryPermission) {
                const status = await handle.queryPermission({ mode: 'readwrite' });
                if (status === 'granted') return true;
            }
            if (handle.requestPermission) {
                const status = await handle.requestPermission({ mode: 'readwrite' });
                if (status === 'granted') return true;
            }
            return true;
        } catch (e) {
            console.warn('Write permission check failed:', e);
            return false;
        }
    }

    btnNew.addEventListener('click', async () => {
        if (isDirty) {
            const confirmNew = confirm('You have unsaved changes. Are you sure you want to create a new file?');
            if (!confirmNew) return;
        }
        fileHandle = null;
        setFileName('Untitled.md');
        markdownInput.value = '';
        updatePreview();
        setDirty(false);
        showToast('Created new file', 'info');
    });

    btnOpen.addEventListener('click', async () => {
        if (isDirty) {
            const confirmOpen = confirm('You have unsaved changes. Are you sure you want to open another file?');
            if (!confirmOpen) return;
        }

        const openFallback = () => {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = '.md,.txt';
            input.onchange = e => {
                const file = e.target.files[0];
                if (!file) return;
                const reader = new FileReader();
                reader.onload = event => {
                    fileHandle = null;
                    setFileName(file.name);
                    markdownInput.value = event.target.result;
                    updatePreview();
                    setDirty(false);
                    showToast(`Opened "${file.name}"`, 'info');
                };
                reader.readAsText(file);
            };
            input.click();
        };

        try {
            if ('showOpenFilePicker' in window) {
                const [handle] = await window.showOpenFilePicker({
                    types: [{
                        description: 'Markdown Files',
                        accept: { 'text/markdown': ['.md'], 'text/plain': ['.txt'] }
                    }]
                });
                fileHandle = handle;
                const file = await fileHandle.getFile();
                const text = await file.text();

                setFileName(file.name);
                markdownInput.value = text;
                updatePreview();
                setDirty(false);
                showToast(`Opened "${file.name}"`, 'info');
            } else {
                openFallback();
            }
        } catch (err) {
            if (err.name !== 'AbortError') {
                console.warn('showOpenFilePicker failed, using fallback:', err);
                openFallback();
            }
        }
    });

    async function saveFile() {
        // Attempt 1: Native File System Access API (existing handle or new handle)
        if ('showSaveFilePicker' in window && window.isSecureContext) {
            try {
                if (fileHandle) {
                    const canWrite = await getWritePermission(fileHandle);
                    if (!canWrite) {
                        fileHandle = null; // Reset handle to force Save As if permission was denied
                    }
                }

                if (!fileHandle) {
                    fileHandle = await window.showSaveFilePicker({
                        suggestedName: currentFileName,
                        types: [{
                            description: 'Markdown Files',
                            accept: { 'text/markdown': ['.md'], 'text/plain': ['.txt'] }
                        }]
                    });
                    setFileName(fileHandle.name);
                }

                const writable = await fileHandle.createWritable();
                await writable.write(markdownInput.value);
                await writable.close();
                setDirty(false);
                showToast(`File "${currentFileName}" saved successfully!`, 'success');
                return;
            } catch (err) {
                if (err.name === 'AbortError') return;
                console.warn('File System Access save error, trying download fallback:', err);
            }
        }

        // Attempt 2: Fallback via Blob download (attaching element to DOM ensures browser execution)
        try {
            const blob = new Blob([markdownInput.value], { type: 'text/markdown;charset=utf-8' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = currentFileName || 'Untitled.md';
            a.style.display = 'none';
            document.body.appendChild(a);
            a.click();
            setTimeout(() => {
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
            }, 150);
            setDirty(false);
            showToast(`File "${currentFileName || 'Untitled.md'}" saved!`, 'success');
        } catch (fallbackErr) {
            console.error('Save failed completely:', fallbackErr);
            showToast('Error saving file.', 'error');
        }
    }

    btnSave.addEventListener('click', saveFile);

    // Shortcut: Ctrl+S / Cmd+S to Save
    document.addEventListener('keydown', (e) => {
        if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
            e.preventDefault();
            saveFile();
        }
    });

    // --- Rich Text Formatting Helpers ---

    function insertFormatting(prefix, suffix, defaultText) {
        const scrollTop = markdownInput.scrollTop;
        const scrollLeft = markdownInput.scrollLeft;

        const start = markdownInput.selectionStart;
        const end = markdownInput.selectionEnd;
        const text = markdownInput.value;
        const selectedText = text.substring(start, end) || defaultText;

        const before = text.substring(0, start);
        const after = text.substring(end);

        markdownInput.value = before + prefix + selectedText + suffix + after;

        markdownInput.focus({ preventScroll: true });
        markdownInput.selectionStart = start + prefix.length;
        markdownInput.selectionEnd = start + prefix.length + selectedText.length;
        markdownInput.scrollTop = scrollTop;
        markdownInput.scrollLeft = scrollLeft;

        updatePreview();
        setDirty(true);
    }

    function insertListFormatting(prefixType) {
        const scrollTop = markdownInput.scrollTop;
        const scrollLeft = markdownInput.scrollLeft;

        const start = markdownInput.selectionStart;
        const end = markdownInput.selectionEnd;
        const text = markdownInput.value;
        const selectedText = text.substring(start, end) || 'List item';

        const before = text.substring(0, start);
        const after = text.substring(end);

        const lines = selectedText.split('\n');
        const formattedLines = lines.map((line, index) => {
            let prefix = '- ';
            if (prefixType === 'ol') prefix = `${index + 1}. `;
            else if (prefixType === 'task') prefix = '- [ ] ';
            return prefix + line;
        });
        const newSelectedText = formattedLines.join('\n');

        markdownInput.value = before + newSelectedText + after;

        markdownInput.focus({ preventScroll: true });
        markdownInput.selectionStart = start;
        markdownInput.selectionEnd = start + newSelectedText.length;
        markdownInput.scrollTop = scrollTop;
        markdownInput.scrollLeft = scrollLeft;

        updatePreview();
        setDirty(true);
    }

    // --- Formatting Toolbar Event Listeners ---

    document.getElementById('btn-bold')?.addEventListener('click', () => insertFormatting('**', '**', 'bold text'));
    document.getElementById('btn-italic')?.addEventListener('click', () => insertFormatting('*', '*', 'italic text'));
    document.getElementById('btn-strikethrough')?.addEventListener('click', () => insertFormatting('~~', '~~', 'strikethrough text'));
    document.getElementById('btn-highlight')?.addEventListener('click', () => insertFormatting('==', '==', 'highlighted text'));
    document.getElementById('btn-subscript')?.addEventListener('click', () => insertFormatting('~', '~', 'subscript'));
    document.getElementById('btn-superscript')?.addEventListener('click', () => insertFormatting('^', '^', 'superscript'));

    document.getElementById('btn-h1')?.addEventListener('click', () => insertFormatting('# ', '', 'Heading 1'));
    document.getElementById('btn-h2')?.addEventListener('click', () => insertFormatting('## ', '', 'Heading 2'));
    document.getElementById('btn-h3')?.addEventListener('click', () => insertFormatting('### ', '', 'Heading 3'));
    document.getElementById('btn-h4')?.addEventListener('click', () => insertFormatting('#### ', '', 'Heading 4'));

    document.getElementById('btn-list-ul')?.addEventListener('click', () => insertListFormatting('ul'));
    document.getElementById('btn-list-ol')?.addEventListener('click', () => insertListFormatting('ol'));
    document.getElementById('btn-tasklist')?.addEventListener('click', () => insertListFormatting('task'));

    document.getElementById('btn-quote')?.addEventListener('click', () => insertFormatting('> ', '', 'Blockquote'));
    document.getElementById('btn-code')?.addEventListener('click', () => {
        const start = markdownInput.selectionStart;
        const end = markdownInput.selectionEnd;
        if (markdownInput.value.substring(start, end).includes('\n')) {
            insertFormatting('\n```\n', '\n```\n', 'code block');
        } else {
            insertFormatting('`', '`', 'inline code');
        }
    });

    document.getElementById('btn-hr')?.addEventListener('click', () => insertFormatting('\n---\n', '', ''));
    document.getElementById('btn-pagebreak')?.addEventListener('click', () => insertFormatting('\n===\n', '', ''));

    document.getElementById('btn-link')?.addEventListener('click', () => {
        const text = markdownInput.value.substring(markdownInput.selectionStart, markdownInput.selectionEnd) || 'link text';
        showModal({
            title: 'Insert Link',
            fields: [
                { id: 'text', label: 'Link Text', type: 'text', value: text },
                { id: 'url', label: 'URL', type: 'text', placeholder: 'https://example.com', value: 'https://' }
            ],
            onSubmit: ({ text: linkText, url }) => {
                if (url) {
                    insertFormatting('[', `](${url})`, linkText || 'link text');
                }
            }
        });
    });

    document.getElementById('btn-image')?.addEventListener('click', () => {
        const text = markdownInput.value.substring(markdownInput.selectionStart, markdownInput.selectionEnd) || 'Image description';
        showModal({
            title: 'Insert Image',
            fields: [
                { id: 'url', label: 'Image URL / Location', type: 'text', placeholder: 'https://example.com/image.jpg or data:image/...', value: '' },
                { id: 'file', label: 'Or Browse Local Image File', type: 'file', accept: 'image/*', targetId: 'url' },
                { id: 'alt', label: 'Alt Text / Description', type: 'text', value: text },
                { id: 'width', label: 'Width (optional)', type: 'text', placeholder: 'e.g. 600 or 100%' },
                { id: 'height', label: 'Height (optional)', type: 'text', placeholder: 'e.g. 300' }
            ],
            onSubmit: ({ url, alt, width, height }) => {
                if (!url) return;
                let sizeSuffix = '';
                if (width || height) {
                    sizeSuffix = `{${width || ''}${height ? 'x' + height : ''}}`;
                }

                if (url.startsWith('data:') || url.length > 100) {
                    let refIndex = 1;
                    while (markdownInput.value.includes(`[img${refIndex}]:`)) {
                        refIndex++;
                    }
                    const refId = `img${refIndex}`;
                    insertFormatting(`![${alt || 'Image'}][${refId}]`, sizeSuffix, '');

                    if (!markdownInput.value.includes(`[${refId}]:`)) {
                        markdownInput.value = markdownInput.value.trimEnd() + `\n\n[${refId}]: ${url}\n`;
                        updatePreview();
                        setDirty(true);
                    }
                } else {
                    insertFormatting(`![${alt || 'Image'}](${url})`, sizeSuffix, '');
                }
            }
        });
    });

    document.getElementById('btn-video')?.addEventListener('click', () => {
        showModal({
            title: 'Insert Video Embed',
            fields: [
                { id: 'url', label: 'Video URL / Location', type: 'text', placeholder: 'https://example.com/video.mp4 or data:video/...', value: '' },
                { id: 'file', label: 'Or Browse Local Video File', type: 'file', accept: 'video/*', targetId: 'url' },
                { id: 'alt', label: 'Title / Description', type: 'text', value: 'Video playback' },
                { id: 'width', label: 'Width (optional)', type: 'text', placeholder: 'e.g. 640 or 100%' },
                { id: 'height', label: 'Height (optional)', type: 'text', placeholder: 'e.g. 360' }
            ],
            onSubmit: ({ url, alt, width, height }) => {
                if (!url) return;
                let sizeSuffix = '';
                if (width || height) {
                    sizeSuffix = `{${width || ''}${height ? 'x' + height : ''}}`;
                }

                if (url.startsWith('data:') || url.length > 100) {
                    let refIndex = 1;
                    while (markdownInput.value.includes(`[vid${refIndex}]:`)) {
                        refIndex++;
                    }
                    const refId = `vid${refIndex}`;
                    insertFormatting(`!video[${alt || 'Video'}][${refId}]`, sizeSuffix, '');

                    if (!markdownInput.value.includes(`[${refId}]:`)) {
                        markdownInput.value = markdownInput.value.trimEnd() + `\n\n[${refId}]: ${url}\n`;
                        updatePreview();
                        setDirty(true);
                    }
                } else {
                    insertFormatting(`!video[${alt || 'Video'}](${url})`, sizeSuffix, '');
                }
            }
        });
    });

    document.getElementById('btn-audio')?.addEventListener('click', () => {
        showModal({
            title: 'Insert Audio Embed',
            fields: [
                { id: 'url', label: 'Audio URL / Location', type: 'text', placeholder: 'https://example.com/audio.mp3 or data:audio/...', value: '' },
                { id: 'file', label: 'Or Browse Local Audio File', type: 'file', accept: 'audio/*', targetId: 'url' },
                { id: 'alt', label: 'Title / Description', type: 'text', value: 'Audio track' }
            ],
            onSubmit: ({ url, alt }) => {
                if (!url) return;

                if (url.startsWith('data:') || url.length > 100) {
                    let refIndex = 1;
                    while (markdownInput.value.includes(`[aud${refIndex}]:`)) {
                        refIndex++;
                    }
                    const refId = `aud${refIndex}`;
                    insertFormatting(`!audio[${alt || 'Audio'}][${refId}]`, '', '');

                    if (!markdownInput.value.includes(`[${refId}]:`)) {
                        markdownInput.value = markdownInput.value.trimEnd() + `\n\n[${refId}]: ${url}\n`;
                        updatePreview();
                        setDirty(true);
                    }
                } else {
                    insertFormatting(`!audio[${alt || 'Audio'}](${url})`, '', '');
                }
            }
        });
    });

    document.getElementById('btn-table')?.addEventListener('click', () => {
        showModal({
            title: 'Insert Table Helper',
            fields: [
                { id: 'rows', label: 'Number of Rows', type: 'number', value: '3', min: 1, max: 50 },
                { id: 'cols', label: 'Number of Columns', type: 'number', value: '3', min: 1, max: 20 },
                { id: 'header', label: 'Include Header Row', type: 'checkbox', value: true }
            ],
            onSubmit: ({ rows, cols, header }) => {
                const r = parseInt(rows, 10) || 3;
                const c = parseInt(cols, 10) || 3;

                let tableMd = '\n';
                if (header) {
                    let headerLine = '|';
                    let separatorLine = '|';
                    for (let j = 1; j <= c; j++) {
                        headerLine += ` Header ${j} |`;
                        separatorLine += ' --- |';
                    }
                    tableMd += headerLine + '\n' + separatorLine + '\n';
                }
                for (let i = 1; i <= r; i++) {
                    let rowLine = '|';
                    for (let j = 1; j <= c; j++) {
                        rowLine += ` Cell ${i}.${j} |`;
                    }
                    tableMd += rowLine + '\n';
                }
                tableMd += '\n';
                insertFormatting(tableMd, '', '');
            }
        });
    });

    document.getElementById('btn-math')?.addEventListener('click', () => {
        showModal({
            title: 'Insert LaTeX Math Expression',
            fields: [
                {
                    id: 'mode', label: 'Display Mode', type: 'select', value: 'inline', options: [
                        { value: 'inline', label: 'Inline Math ($ ... $)' },
                        { value: 'block', label: 'Block Math ($$ ... $$)' }
                    ]
                },
                { id: 'expr', label: 'LaTeX Expression', type: 'textarea', placeholder: 'E = mc^2', value: 'E = mc^2' }
            ],
            onSubmit: ({ mode, expr }) => {
                if (!expr) return;
                if (mode === 'block') {
                    insertFormatting('\n$$\n', '\n$$\n', expr);
                } else {
                    insertFormatting('$', '$', expr);
                }
            }
        });
    });

    document.getElementById('btn-callout')?.addEventListener('click', () => {
        showModal({
            title: 'Insert Callout / Alert Box',
            fields: [
                {
                    id: 'type', label: 'Alert Type', type: 'select', value: 'NOTE', options: [
                        { value: 'NOTE', label: 'Note (Blue)' },
                        { value: 'TIP', label: 'Tip (Green)' },
                        { value: 'IMPORTANT', label: 'Important (Purple)' },
                        { value: 'WARNING', label: 'Warning (Amber)' },
                        { value: 'CAUTION', label: 'Caution (Red)' }
                    ]
                },
                { id: 'content', label: 'Callout Message', type: 'textarea', placeholder: 'Enter alert content...', value: 'This is a callout box message.' }
            ],
            onSubmit: ({ type, content }) => {
                const lines = (content || 'Alert content').split('\n');
                const calloutMd = `\n> [!${type}]\n` + lines.map(line => `> ${line}`).join('\n') + '\n\n';
                insertFormatting(calloutMd, '', '');
            }
        });
    });

    document.getElementById('btn-footnote')?.addEventListener('click', () => {
        const selectedText = markdownInput.value.substring(markdownInput.selectionStart, markdownInput.selectionEnd) || 'Footnote description text';
        showModal({
            title: 'Insert Footnote',
            fields: [
                { id: 'label', label: 'Footnote Label / Identifier', type: 'text', value: '1' },
                { id: 'text', label: 'Footnote Content', type: 'textarea', value: selectedText }
            ],
            onSubmit: ({ label, text }) => {
                const id = label || '1';
                insertFormatting(`[^${id}]`, '', '');
                if (!markdownInput.value.includes(`[^${id}]:`)) {
                    markdownInput.value = markdownInput.value.trimEnd() + `\n\n[^${id}]: ${text || 'Footnote detail'}\n`;
                    updatePreview();
                    setDirty(true);
                }
            }
        });
    });

    document.getElementById('btn-privatenote')?.addEventListener('click', () => {
        insertFormatting('%% ', ' %%', 'Private confidential note');
    });

    // Initial render
    updatePreview();

    // Register Service Worker for PWA
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('sw.js').catch(err => {
                console.error('ServiceWorker registration failed: ', err);
            });
        });
    }
});

