function openSettings() {
    if (window.openSettingsModal) {
        window.openSettingsModal();
    }
}

function displayHelp() {
    const terminal = document.querySelector('.terminal');
    const output = document.createElement('div');
    output.className = 'command-output';

    const responseColor = getComputedStyle(document.documentElement).getPropertyValue('--response-color') || '#ffffff';
    output.style.color = responseColor;

    fetch('commands.json')
        .then(response => response.json())
        .then(data => {
            let helpText = 'Available Commands:\n\n';

            data.categories.forEach(category => {
                const maxCommandLength = Math.max(...category.commands.map(c => c.command.length));

                category.commands.forEach(cmd => {
                    const padding = ' '.repeat(maxCommandLength - cmd.command.length + 2);
                    helpText += `  ${cmd.command}${padding}- ${cmd.description}\n`;
                });
                helpText += '\n';
            });

            if (data.footer) {
                helpText += data.footer;
            }

            output.textContent = helpText;
            output.style.whiteSpace = 'pre-wrap';
            output.style.lineHeight = '1.6';
            terminal.appendChild(output);
            createNewCommandLine();
            window.scrollTo(0, document.body.scrollHeight);
        })
        .catch(error => {
            console.error('Error loading commands:', error);
            output.textContent = 'Error loading help commands. Please check commands.json file.';
            output.style.whiteSpace = 'pre-wrap';
            output.style.lineHeight = '1.6';
            terminal.appendChild(output);
            createNewCommandLine();
            window.scrollTo(0, document.body.scrollHeight);
        });
}

function requestTerminalInput(promptText, callback) {
    const oldInput = document.querySelector('.command-line.input-mode');
    if (oldInput) oldInput.remove();
    isAwaitingInput = true;

    const terminal = document.querySelector('.terminal');

    const promptMsg = document.createElement('div');
    promptMsg.className = 'command-output';
    const responseColor = getComputedStyle(document.documentElement).getPropertyValue('--response-color') || '#ffffff';
    promptMsg.style.color = responseColor;
    promptMsg.textContent = promptText;
    terminal.appendChild(promptMsg);

    const inputLine = document.createElement('div');
    inputLine.className = 'command-line input-mode';

    const inputPrompt = document.createElement('span');
    inputPrompt.className = 'prompt';
    inputPrompt.textContent = '>';

    const input = document.createElement('input');
    input.type = 'text';
    input.spellcheck = false;
    input.autocomplete = 'off';

    inputLine.appendChild(inputPrompt);
    inputLine.appendChild(input);

    terminal.appendChild(inputLine);

    const promptColor = getComputedStyle(document.documentElement).getPropertyValue('--prompt-color') || '#ffffff';
    const commandColor = getComputedStyle(document.documentElement).getPropertyValue('--command-color') || '#ffffff';
    inputPrompt.style.color = promptColor;
    input.style.color = commandColor;

    input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            const value = input.value;
            const typedText = document.createElement('span');
            typedText.className = 'command-text';
            typedText.textContent = value;
            input.replaceWith(typedText);
            isAwaitingInput = false;
            callback(value);
        } else if (e.key === 'Escape') {
            isAwaitingInput = false;
            inputLine.remove();
            callback(null);
        }
    });

    setTimeout(() => {
        input.focus();
    }, 50);
    window.scrollTo(0, document.body.scrollHeight);
}

function init() {
    setupCommandInput();

    setTimeout(() => {
        if (window.applyAppearanceSettings) {
            window.applyAppearanceSettings();
        }

        const input = document.getElementById('commandInput');
        if (input) input.focus();
    }, 100);

    try {
        const localOpen = (() => {
            try { return localStorage.getItem('clockUiOpen') === '1'; } catch (_) { return false; }
        })();
        if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
            chrome.storage.local.get('clockUiOpen', (data) => {
                const wasOpen = (data && typeof data.clockUiOpen !== 'undefined') ? !!data.clockUiOpen : localOpen;
                if (wasOpen) {
                    openClockUI();
                }
            });
        } else if (localOpen) {
            openClockUI();
        }
    } catch (_) { }

    document.addEventListener('visibilitychange', () => {
        if (!document.hidden) {
            [0, 50, 100, 300].forEach(delay => {
                setTimeout(() => {
                    const activeCommandLine = document.querySelector('.command-line:last-of-type');
                    if (activeCommandLine) {
                        const input = activeCommandLine.querySelector('input');
                        if (input) input.focus();
                    }
                }, delay);
            });
        }
    });

    window.addEventListener('focus', () => {
        [0, 50, 100, 300].forEach(delay => {
            setTimeout(() => {
                const activeCommandLine = document.querySelector('.command-line:last-of-type');
                if (activeCommandLine) {
                    const input = activeCommandLine.querySelector('input');
                    if (input) input.focus();
                }
            }, delay);
        });
    });
}

function setupTerminalHeader() {
    const terminalHeader = document.querySelector('.terminal-header');
    if (terminalHeader) {
        terminalHeader.addEventListener('mousedown', (e) => {
            if (!e.target.closest('.terminal-controls')) {
                e.preventDefault();

                const input = document.getElementById('commandInput');
                if (input) input.focus();
            }
        });
    }

    const terminalTitle = document.querySelector('.terminal-title');
    if (terminalTitle) {
        terminalTitle.addEventListener('click', () => {
            const input = document.getElementById('commandInput');
            if (input) input.focus();
        });
    }

    const minimizeBtn = document.querySelector('.terminal-minimize');
    if (minimizeBtn) {
        minimizeBtn.addEventListener('click', () => {
            displayMessage('Minimize action triggered');
        });
    }

    const maximizeBtn = document.querySelector('.terminal-maximize');
    if (maximizeBtn) {
        maximizeBtn.addEventListener('click', () => {
            document.documentElement.requestFullscreen().catch(err => {
                displayMessage('Could not enter fullscreen mode: ' + err.message);
            });
        });
    }

    const closeBtn = document.querySelector('.terminal-close');
    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            if (confirm('Close this terminal?')) {
                window.close();
            }
        });
    }
}

function focusCommandInput() {
    const input = document.getElementById('commandInput');
    if (input) {
        input.focus();

        setTimeout(() => {
            input.focus();
        }, 50);
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        init();
        setupTerminalHeader();
        focusCommandInput();
    });
} else {
    init();
    setupTerminalHeader();
    focusCommandInput();
}

function showTab(tabName) {
    document.querySelectorAll('.settings-tab').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.settings-panel').forEach(panel => {
        panel.classList.remove('active');
        panel.style.display = 'none';
    });

    document.querySelector(`.settings-tab[data-tab="${tabName}"]`).classList.add('active');
    document.getElementById(`${tabName}-panel`).classList.add('active');
    document.getElementById(`${tabName}-panel`).style.display = '';
}

document.getElementById('appearance-tab').onclick = function () {
    showTab('appearance');
};
document.getElementById('preferences-tab').onclick = function () {
    showTab('preferences');
};

const toggle = document.getElementById('show-terminal-bubble-toggle');
chrome.storage.local.get({ showTerminalBubble: true }, (data) => {
    toggle.checked = !!data.showTerminalBubble;
});
toggle.onchange = function () {
    chrome.storage.local.set({ showTerminalBubble: toggle.checked });
};

const DEFAULT_HEADER_BLUR = 5;
const DEFAULT_BACKGROUND_BLUR = 0;

const headerBlur = document.getElementById('headerBlur');
const headerBlurValue = document.getElementById('headerBlurValue');
const backgroundBlur = document.getElementById('backgroundBlur');
const backgroundBlurValue = document.getElementById('backgroundBlurValue');

chrome.storage.local.get({
    headerBlur: DEFAULT_HEADER_BLUR,
    backgroundBlur: DEFAULT_BACKGROUND_BLUR
}, (data) => {
    headerBlur.value = data.headerBlur;
    headerBlurValue.textContent = data.headerBlur;
    backgroundBlur.value = data.backgroundBlur;
    backgroundBlurValue.textContent = data.backgroundBlur;

    applyBlur(data.headerBlur, data.backgroundBlur);
});

headerBlur.addEventListener('input', function () {
    headerBlurValue.textContent = this.value;
    applyBlur(this.value, backgroundBlur.value);
});
backgroundBlur.addEventListener('input', function () {
    backgroundBlurValue.textContent = this.value;
    applyBlur(headerBlur.value, this.value);
});

document.getElementById('saveSettings').addEventListener('click', function () {
    chrome.storage.local.set({
        headerBlur: parseInt(headerBlur.value, 10),
        backgroundBlur: parseInt(backgroundBlur.value, 10)
    });
});

function applyBlur(header, bg) {
    const headerEl = document.querySelector('.terminal-header');
    const terminalEl = document.querySelector('.terminal');
    if (headerEl) headerEl.style.backdropFilter = `blur(${header}px)`;
    if (terminalEl) terminalEl.style.backdropFilter = `blur(${bg}px)`;
}
