document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const markdownInput = document.getElementById('markdown-input');
    const htmlPreview = document.getElementById('html-preview');
    const fileNameDisplay = document.getElementById('file-name');
    
    // Default Welcome Text
    if (!markdownInput.value) {
        markdownInput.value = `# Welcome to MD Editor! 🚀\n\nA lightning-fast, 100% client-side Markdown editor designed for privacy and distraction-free writing.\n\n## Why use this?\n\n- 🔒 **Zero Data Collection**: Your files never leave your computer.\n- 🌓 **Dark & Light Mode**: Toggle between themes using the ☀️ icon above.\n- 🛠️ **Rich Text Toolbar**: Highlight text and click the buttons above to format instantly.\n- 📱 **Works Offline**: Install it as an app and use it anywhere!\n\n> Go ahead, delete this text and start writing!`;
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

    // Initialize Marked options
    marked.setOptions({
        gfm: true,
        breaks: true,
    });

    // --- Markdown Rendering ---
    
    let debounceTimer;
    function updatePreview() {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
            const markdownText = markdownInput.value;
            const rawHtml = marked.parse(markdownText);
            const cleanHtml = DOMPurify.sanitize(rawHtml);
            htmlPreview.innerHTML = cleanHtml;
            
            if (!isDirty && markdownText !== '') {
                setDirty(true);
            }
        }, 300);
    }

    markdownInput.addEventListener('input', updatePreview);

    // --- State Management ---
    
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

    // --- File Operations (File System Access API) ---

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
    });

    btnOpen.addEventListener('click', async () => {
        if (isDirty) {
            const confirmOpen = confirm('You have unsaved changes. Are you sure you want to open another file?');
            if (!confirmOpen) return;
        }

        try {
            if ('showOpenFilePicker' in window) {
                // Modern API
                const [handle] = await window.showOpenFilePicker({
                    types: [{
                        description: 'Markdown Files',
                        accept: {'text/markdown': ['.md'], 'text/plain': ['.txt']}
                    }]
                });
                fileHandle = handle;
                const file = await fileHandle.getFile();
                const text = await file.text();
                
                setFileName(file.name);
                markdownInput.value = text;
                updatePreview();
                setDirty(false);
            } else {
                // Fallback for older browsers
                const input = document.createElement('input');
                input.type = 'file';
                input.accept = '.md,.txt';
                input.onchange = e => {
                    const file = e.target.files[0];
                    if (!file) return;
                    const reader = new FileReader();
                    reader.onload = event => {
                        fileHandle = null; // Can't keep handle in fallback
                        setFileName(file.name);
                        markdownInput.value = event.target.result;
                        updatePreview();
                        setDirty(false);
                    };
                    reader.readAsText(file);
                };
                input.click();
            }
        } catch (err) {
            if (err.name !== 'AbortError') {
                console.error(err);
                alert('Error opening file.');
            }
        }
    });

    btnSave.addEventListener('click', async () => {
        try {
            if ('showSaveFilePicker' in window) {
                if (!fileHandle) {
                    fileHandle = await window.showSaveFilePicker({
                        suggestedName: currentFileName,
                        types: [{
                            description: 'Markdown Files',
                            accept: {'text/markdown': ['.md']}
                        }]
                    });
                    setFileName(fileHandle.name);
                }
                const writable = await fileHandle.createWritable();
                await writable.write(markdownInput.value);
                await writable.close();
                setDirty(false);
            } else {
                // Fallback: trigger download
                const blob = new Blob([markdownInput.value], { type: 'text/markdown' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = currentFileName;
                a.click();
                URL.revokeObjectURL(url);
                setDirty(false);
            }
        } catch (err) {
            if (err.name !== 'AbortError') {
                console.error(err);
                alert('Error saving file.');
            }
        }
    });

    // --- Rich Text Formatting Toolbar ---

    function insertFormatting(prefix, suffix, defaultText) {
        const start = markdownInput.selectionStart;
        const end = markdownInput.selectionEnd;
        const text = markdownInput.value;
        const selectedText = text.substring(start, end) || defaultText;

        const before = text.substring(0, start);
        const after = text.substring(end);

        markdownInput.value = before + prefix + selectedText + suffix + after;
        
        // Restore selection
        markdownInput.focus();
        markdownInput.selectionStart = start + prefix.length;
        markdownInput.selectionEnd = start + prefix.length + selectedText.length;
        
        updatePreview();
        setDirty(true);
    }

    function insertListFormatting(isOrdered) {
        const start = markdownInput.selectionStart;
        const end = markdownInput.selectionEnd;
        const text = markdownInput.value;
        const selectedText = text.substring(start, end) || 'List item';

        const before = text.substring(0, start);
        const after = text.substring(end);

        const lines = selectedText.split('\n');
        const formattedLines = lines.map((line, index) => {
            const prefix = isOrdered ? `${index + 1}. ` : '- ';
            return prefix + line;
        });
        const newSelectedText = formattedLines.join('\n');

        markdownInput.value = before + newSelectedText + after;
        
        // Restore selection
        markdownInput.focus();
        markdownInput.selectionStart = start;
        markdownInput.selectionEnd = start + newSelectedText.length;
        
        updatePreview();
        setDirty(true);
    }

    document.getElementById('btn-bold').addEventListener('click', () => insertFormatting('**', '**', 'bold text'));
    document.getElementById('btn-italic').addEventListener('click', () => insertFormatting('*', '*', 'italic text'));
    document.getElementById('btn-h1').addEventListener('click', () => insertFormatting('# ', '', 'Heading 1'));
    document.getElementById('btn-h2').addEventListener('click', () => insertFormatting('## ', '', 'Heading 2'));
    document.getElementById('btn-h3').addEventListener('click', () => insertFormatting('### ', '', 'Heading 3'));
    
    document.getElementById('btn-list-ul').addEventListener('click', () => {
        insertListFormatting(false);
    });
    
    document.getElementById('btn-list-ol').addEventListener('click', () => {
        insertListFormatting(true);
    });

    document.getElementById('btn-code').addEventListener('click', () => {
        const start = markdownInput.selectionStart;
        const end = markdownInput.selectionEnd;
        if (markdownInput.value.substring(start, end).includes('\n')) {
            insertFormatting('\n```\n', '\n```\n', 'code block');
        } else {
            insertFormatting('`', '`', 'inline code');
        }
    });

    document.getElementById('btn-quote').addEventListener('click', () => insertFormatting('> ', '', 'Blockquote'));
    
    document.getElementById('btn-link').addEventListener('click', () => {
        const text = markdownInput.value.substring(markdownInput.selectionStart, markdownInput.selectionEnd) || 'link text';
        const url = prompt('Enter URL:', 'https://');
        if (url) {
             insertFormatting(`[`, `](${url})`, text);
        }
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
