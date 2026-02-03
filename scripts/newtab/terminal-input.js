function setupCommandInput() {
    const commandInput = document.getElementById('commandInput');
    const commandLine = document.querySelector('.command-line');

    commandInput.focus();
    setTimeout(() => commandInput.focus(), 0);
    setTimeout(() => commandInput.focus(), 100);

    document.addEventListener('click', (e) => {
        const target = e.target;
        if (target && (
            target.closest('.floating-clock') ||
            target.closest('.settings-overlay') ||
            target.closest('select, input, textarea, button, [contenteditable="true"]')
        )) {
            return;
        }
        const activeCommandLine = document.querySelector('.command-line:last-of-type');
        if (activeCommandLine) {
            const input = activeCommandLine.querySelector('input');
            if (input) input.focus();
        }
    });

    commandInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            const command = commandInput.value.trim();
            if (command) {
                commandHistory.push(command);
                historyIndex = commandHistory.length;
            }
            executeCommand(command, commandLine);
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            if (historyIndex > 0) {
                historyIndex--;
                commandInput.value = commandHistory[historyIndex];
            }
        } else if (e.key === 'ArrowDown') {
            e.preventDefault();
            if (historyIndex < commandHistory.length - 1) {
                historyIndex++;
                commandInput.value = commandHistory[historyIndex];
            } else if (historyIndex === commandHistory.length - 1) {
                historyIndex = commandHistory.length;
                commandInput.value = '';
            }
        }
    });
}

function createNewCommandLine() {
    const terminal = document.querySelector('.terminal');

    const newCommandLine = document.createElement('div');
    newCommandLine.className = 'command-line';

    const prompt = document.createElement('span');
    prompt.className = 'prompt';
    prompt.textContent = `${currentTerminalPathDisplay}>`;

    const input = document.createElement('input');
    input.type = 'text';
    input.id = 'commandInput';
    input.spellcheck = false;
    input.autocomplete = 'off';

    newCommandLine.appendChild(prompt);
    newCommandLine.appendChild(input);

    terminal.appendChild(newCommandLine);

    const promptColor = getComputedStyle(document.documentElement).getPropertyValue('--prompt-color') || '#ffffff';
    const commandColor = getComputedStyle(document.documentElement).getPropertyValue('--command-color') || '#ffffff';
    prompt.style.color = promptColor;
    input.style.color = commandColor;

    input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            const command = input.value.trim();
            if (command) {
                commandHistory.push(command);
                historyIndex = commandHistory.length;
            }
            executeCommand(command, newCommandLine);
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            if (historyIndex > 0) {
                historyIndex--;
                input.value = commandHistory[historyIndex];
            }
        } else if (e.key === 'ArrowDown') {
            e.preventDefault();
            if (historyIndex < commandHistory.length - 1) {
                historyIndex++;
                input.value = commandHistory[historyIndex];
            } else if (historyIndex === commandHistory.length - 1) {
                historyIndex = commandHistory.length;
                input.value = '';
            }
        }
    });

    input.focus();

    window.scrollTo(0, document.body.scrollHeight);
}

function clearTerminal() {
    const terminal = document.querySelector('.terminal');

    while (terminal.firstChild) {
        terminal.removeChild(terminal.firstChild);
    }

    createNewCommandLine();

    const input = document.querySelector('#commandInput');
    if (input) {
        input.focus();
    }

    window.scrollTo(0, 0);
}

function freezeCommandLine(commandLine, command) {
    const input = commandLine.querySelector('input');
    if (!input) return;

    const typedText = document.createElement('span');
    typedText.className = 'command-text';
    typedText.textContent = command;
    input.replaceWith(typedText);
}
