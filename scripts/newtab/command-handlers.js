function executeCommand(command, commandLine) {
    const normalizedCommand = resolveAliasCommand(command.trim());
    const cmdParts = tokenizeCommandLine(normalizedCommand);
    const cmd = (cmdParts[0] || '').toLowerCase();
    const args = cmdParts.slice(1);

    freezeCommandLine(commandLine, normalizedCommand);

    if (!cmd) {
        createNewCommandLine();
        return;
    }

    if (cmd === 'clip') handleClipCommand(args);
    else if (cmd === 'clear') clearTerminal();
    else if (cmd === 'help') displayHelp(args.join(' '));
    else if (cmd === 'search') handleSearchCommand(args);
    else if (cmd === 'show' && args[0]?.toLowerCase() === 'history') handleShowHistoryCommand(args.slice(1));
    else if (cmd === 'ls') handleLsCommand(args);
    else if (cmd === 'history') handleCommandHistoryCommand(args);
    else if (cmd === 'date') {
        displayMessage(formatBrowserDate('full'));
    }
    else if (cmd === 'echo') {
        displayMessage(args.join(' '));
    }

    else if (cmd === 'alias') handleAliasCommand(args);
    else if (cmd === 'unalias') handleUnaliasCommand(args);
    else if (cmd === 'mksh') handleShortcutCommand(args, 'set');
    else if (cmd === 'rmsh') handleShortcutCommand(args, 'remove');
    else if (cmd === 'sh') handleShortcutCollectionCommand(args);
    else if (cmd.startsWith('@')) handleAtShortcutCommand(cmd, args);

    else if (cmd === 'cd') handleChangeDirectory(args);
    else if (cmd === 'pwd') handlePwdCommand();
    else if (cmd === 'open' && args[0]?.toLowerCase() === 'settings') {
        openSettings();
        createNewCommandLine();
    }
    else if (cmd === 'open') handleOpenCommand(args);

    else if (cmd === 'cat' && args[0] === '>') handleCatCreate(args.slice(1));
    else if (cmd === 'rm') handleRmCommand(args);
    else if (cmd === 'rmdir') handleRmdirCommand(args);
    
    else if (cmd === 'find') handleFindCommand(args);
    else if (cmd === 'grep') handleGrepCommand(args);


    else if (cmd === 'time') handleTimeCommand(args);

    else if (cmd === '--flow' && args[0]) openFlow(args[0], parseFlowOpenOptions(args.slice(1)));
    else if (cmd === 'flow') handleFlowCommand(args);
    else if (cmd === 'create' && args[0]?.toLowerCase() === 'flow' && args[1]) createFlow(args[1]);
    else if (cmd === 'delete' && args[0]?.toLowerCase() === 'flow' && args[1]) deleteFlow(args[1]);

    else if (cmd === 'create' && args[0]?.toLowerCase() === 'note') handleCreateNoteCommand(command);
    else if (cmd === 'delete' && args[0]?.toLowerCase() === 'note' && args[1]) deleteNote(parseInt(args[1]));
    else if (cmd === 'note') handleNoteCommand(args);

    else if (cmd === 'save' && args[0]?.toLowerCase() === 'session' && args[1]) saveSession(args[1]);
    else if (cmd === 'load' && args[0]?.toLowerCase() === 'session' && args[1]) loadSession(args[1]);
    else if (cmd === 'list' && args[0]?.toLowerCase() === 'sessions') listSessions();
    else if (cmd === 'delete' && args[0]?.toLowerCase() === 'session' && args[1]) deleteSession(args[1]);

    else if (cmd === 'create' && args[0] === 'favorite') handleCreateFavoriteCommand(args);
    else if (cmd === 'mkfv') handleMkfvCommand(args);
    else if (cmd === 'rmfv') handleRmfvCommand(args);
    else if (cmd === 'delete' && args[0] === 'favorite') handleDeleteFavoriteCommand(args);

    else if (cmd === 'mkdir') handleMkdirCommand(args);
    else if (cmd === 'mkbm') handleMkbmCommand(args);
    else if (cmd === 'rmbm') handleRmbmCommand(args);

    else if (cmd === 'script') handleScriptCommand(args);

    else {
        const urlPattern = /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/i;
        if (urlPattern.test(command)) {
            const url = command.startsWith('http') ? command : `https://${command}`;
            window.open(url, '_blank');
        } else {
            window.open(`https://www.google.com/search?q=${encodeURIComponent(command)}`, '_blank');
        }
        createNewCommandLine();
    }
}

function handleClipCommand(args) {
    if (args.length === 0) {
        displayMessage('Usage: clip copy <text> | clip paste | clip save <name> | clip load <name> | clip ls');
        return;
    }

    const subcmd = args[0].toLowerCase();

    if (subcmd === 'copy') {
        const clipContent = args.slice(1).join(' ');
        if (!clipContent) {
            displayMessage('Usage: clip copy <message/link>');
            return;
        }
        try {
            setTerminalClipboard(clipContent);
            displayMessage('Copied to clipboard successfully!');
        } catch (e) {
            displayMessage('Failed to copy to clipboard.');
        }
        return;
    }

    if (subcmd === 'paste') {
        const savedContent = getTerminalClipboard();
        if (savedContent) {
            displayMessage(savedContent);
        } else {
            displayMessage('Clipboard is empty.');
        }
        return;
    }

    if (subcmd === 'save') {
        if (!args[1]) {
            displayMessage('Usage: clip save <name>');
            return;
        }
        const current = getTerminalClipboard();
        if (!current) {
            displayMessage('Clipboard is empty.');
            return;
        }
        if (saveClipboardSlot(args[1], current)) {
            displayMessage(`Saved clipboard slot '${args[1].toLowerCase()}'.`);
        } else {
            displayMessage('Failed to save clipboard slot.');
        }
        return;
    }

    if (subcmd === 'load') {
        if (!args[1]) {
            displayMessage('Usage: clip load <name>');
            return;
        }
        const items = getSavedClipboardItems();
        const slot = items[args[1].toLowerCase()];
        if (!slot) {
            displayMessage(`Clipboard slot '${args[1].toLowerCase()}' not found.`);
            return;
        }
        setTerminalClipboard(slot.value);
        displayMessage(slot.value);
        return;
    }

    if (subcmd === 'ls' || subcmd === 'list') {
        const items = getSavedClipboardItems();
        const names = Object.keys(items).sort();
        const terminal = document.querySelector('.terminal');
        const output = document.createElement('div');
        output.className = 'command-output';
        const responseColor = getComputedStyle(document.documentElement).getPropertyValue('--response-color') || '#ffffff';
        output.style.color = responseColor;
        output.textContent = 'Saved clipboard slots:';
        if (names.length === 0) {
            const empty = document.createElement('div');
            empty.textContent = 'No saved clipboard slots.';
            output.appendChild(empty);
        } else {
            names.forEach((name) => {
                const row = document.createElement('div');
                row.textContent = `${name} -> ${items[name].value}`;
                output.appendChild(row);
            });
        }
        terminal.appendChild(output);
        createNewCommandLine();
        window.scrollTo(0, document.body.scrollHeight);
        return;
    }

    if (subcmd === 'history') {
        const history = getClipboardHistory();
        const terminal = document.querySelector('.terminal');
        const output = document.createElement('div');
        output.className = 'command-output';
        const responseColor = getComputedStyle(document.documentElement).getPropertyValue('--response-color') || '#ffffff';
        output.style.color = responseColor;
        output.textContent = 'Clipboard history:';
        if (history.length === 0) {
            const empty = document.createElement('div');
            empty.textContent = 'Clipboard history is empty.';
            output.appendChild(empty);
        } else {
            history.slice(0, 10).forEach((entry, index) => {
                const row = document.createElement('div');
                row.textContent = `${index + 1}. ${entry.value}`;
                output.appendChild(row);
            });
        }
        terminal.appendChild(output);
        createNewCommandLine();
        window.scrollTo(0, document.body.scrollHeight);
        return;
    }

    if (subcmd === 'clear') {
        if (!args[1]) {
            displayMessage('Usage: clip clear <name>');
            return;
        }
        if (removeClipboardSlot(args[1])) {
            displayMessage(`Clipboard slot '${args[1].toLowerCase()}' removed.`);
        } else {
            displayMessage(`Clipboard slot '${args[1].toLowerCase()}' not found.`);
        }
        return;
    }

    if (subcmd === 'clear-all') {
        saveClipboardHistory([]);
        saveSavedClipboardItems({});
        displayMessage('Clipboard history cleared.');
        return;
    }

    displayMessage('Invalid clip command. Use "clip copy <text>" or "clip paste".');
}

function handleSearchCommand(args) {
    if (args.length > 0) {
        const query = args.join(' ');
        window.open(`https://www.google.com/search?q=${encodeURIComponent(query)}`, '_blank');
    } else {
        displayMessage('Usage: search <query>');
    }
    createNewCommandLine();
}

function handleShowHistoryCommand(args) {
    const page = args.length > 0 && !isNaN(args[0]) ? parseInt(args[0]) : 1;

    if (page < 1) {
        displayMessage('Page number must be 1 or greater');
        createNewCommandLine();
        return;
    }

    listHistory(page);
}

function handleCommandHistoryCommand(args) {
    if (args[0] === '-c') {
        commandHistory.length = 0;
        historyIndex = 0;
        displayMessage('Command history cleared.');
        return;
    }

    if (args[0] === 'search' && args.length > 1) {
        const query = args.slice(1).join(' ').toLowerCase();
        const matches = commandHistory.filter(cmd => cmd.toLowerCase().includes(query));
        if (matches.length === 0) {
            displayMessage('No matching commands in history.');
            return;
        }
        const terminal = document.querySelector('.terminal');
        const output = document.createElement('div');
        output.className = 'command-output';
        const responseColor = getComputedStyle(document.documentElement).getPropertyValue('--response-color') || '#ffffff';
        output.style.color = responseColor;
        output.textContent = `History matching "${query}":`;
        
        matches.forEach((item, index) => {
            const row = document.createElement('div');
            row.textContent = `${index + 1}. ${item}`;
            output.appendChild(row);
        });
        terminal.appendChild(output);
        createNewCommandLine();
        window.scrollTo(0, document.body.scrollHeight);
        return;
    }

    if (commandHistory.length === 0) {
        displayMessage('No commands in history.');
        return;
    }

    const limit = args[0] && !Number.isNaN(Number(args[0])) ? Math.max(1, Number(args[0])) : commandHistory.length;
    const items = commandHistory.slice(-limit);

    const terminal = document.querySelector('.terminal');
    const output = document.createElement('div');
    output.className = 'command-output';
    const responseColor = getComputedStyle(document.documentElement).getPropertyValue('--response-color') || '#ffffff';
    output.style.color = responseColor;
    output.textContent = 'Command history:';

    items.forEach((item, index) => {
        const row = document.createElement('div');
        row.textContent = `${commandHistory.length - items.length + index + 1}. ${item}`;
        output.appendChild(row);
    });

    terminal.appendChild(output);
    createNewCommandLine();
    window.scrollTo(0, document.body.scrollHeight);
}

function handleAliasCommand(args) {
    if (args.length === 0) {
        const aliases = getCommandAliases();
        const names = Object.keys(aliases).sort();
        if (names.length === 0) {
            displayMessage('No aliases defined.');
            return;
        }

        const terminal = document.querySelector('.terminal');
        const output = document.createElement('div');
        output.className = 'command-output';
        const responseColor = getComputedStyle(document.documentElement).getPropertyValue('--response-color') || '#ffffff';
        output.style.color = responseColor;
        output.textContent = 'Aliases:';

        names.forEach((name) => {
            const row = document.createElement('div');
            row.textContent = `${name}='${aliases[name]}'`;
            output.appendChild(row);
        });

        terminal.appendChild(output);
        createNewCommandLine();
        window.scrollTo(0, document.body.scrollHeight);
        return;
    }

    if (args.length === 1) {
        displayMessage('Usage: alias <name> "<command>"');
        return;
    }

    const aliasName = args[0].toLowerCase();
    const aliasCommand = args.slice(1).join(' ');
    const aliases = getCommandAliases();
    aliases[aliasName] = aliasCommand;
    saveCommandAliases(aliases);
    displayMessage(`Alias '${aliasName}' created.`);
}

function handleUnaliasCommand(args) {
    if (args.length === 0) {
        displayMessage('Usage: unalias <name>');
        return;
    }

    const aliasName = args[0].toLowerCase();
    const aliases = getCommandAliases();
    if (!aliases[aliasName]) {
        displayMessage(`Alias '${aliasName}' not found.`);
        return;
    }

    delete aliases[aliasName];
    saveCommandAliases(aliases);
    displayMessage(`Alias '${aliasName}' removed.`);
}

function handleNoteCommand(args) {
    if (args.length === 0 || args[0] === 'ls' || args[0] === 'list') {
        listNotes();
        return;
    }

    const subcmd = args[0].toLowerCase();
    if (subcmd === 'search') {
        const query = args.slice(1).join(' ');
        const matches = searchNotes(query);
        const terminal = document.querySelector('.terminal');
        const output = document.createElement('div');
        output.className = 'command-output';
        const responseColor = getComputedStyle(document.documentElement).getPropertyValue('--response-color') || '#ffffff';
        output.style.color = responseColor;
        output.textContent = query ? `Notes matching "${query}":` : 'Notes search:';

        if (matches.length === 0) {
            const empty = document.createElement('div');
            empty.textContent = 'No matching notes found.';
            output.appendChild(empty);
        } else {
            matches.forEach((note) => {
                const row = document.createElement('div');
                row.textContent = `${note.index}. ${note.title}: ${note.content}`;
                output.appendChild(row);
            });
        }

        terminal.appendChild(output);
        createNewCommandLine();
        window.scrollTo(0, document.body.scrollHeight);
        return;
    }

    if (subcmd === 'cat' && args[1]) {
        const notes = getNotes();
        const index = findNoteIndexByToken(notes, args[1]);
        if (index >= 0) {
            const note = normalizeNoteItem(notes[index], index + 1);
            const tags = note.tags.length ? `\nTags: ${note.tags.join(', ')}` : '';
            displayMessage(`${note.title}\n\n${note.content}${tags}`);
        } else {
            displayMessage('Note not found.');
        }
        return;
    }

    if (subcmd === 'rm' && args[1]) {
        const notes = getNotes();
        const index = findNoteIndexByToken(notes, args[1]);
        if (index >= 0) {
            notes.splice(index, 1);
            saveNotes(notes);
            displayMessage('Note deleted.');
        } else {
            displayMessage('Note not found.');
        }
        return;
    }

    if (subcmd === 'edit' && args[1]) {
        editNote(args[1], args.slice(2).join(' '));
        return;
    }

    if (subcmd === 'tag' && args[1]) {
        tagNote(args[1], args.slice(2));
        return;
    }

    if (subcmd === 'create') {
        const title = args[1];
        const content = args.slice(2).join(' ');
        if (!title || !content) {
            displayMessage('Usage: note create <title> <content>');
            return;
        }
        addStructuredNote(title, content);
        return;
    }

    if (subcmd === 'export') {
        exportNotes();
        return;
    }

    if (subcmd === 'import' && args[1]) {
        importNotes(args.slice(1).join(' '));
        return;
    }

    addNote(args.join(' '));
}

function handleAtShortcutCommand(shortcutToken, args) {
    const key = shortcutToken.replace(/^@/, '').trim().toLowerCase();
    if (!key) {
        displayMessage('Usage: @<key> [url]');
        return;
    }

    if (args.length > 0) {
        const url = args.join(' ');
        setBookmarkShortcut(key, { name: key, url });
        displayMessage(`Shortcut '@${key}' saved.`);
        return;
    }

    const shortcut = resolveBookmarkShortcut(key);
    if (!shortcut) {
        displayMessage(`Shortcut '@${key}' not found.`);
        return;
    }

    openNormalizedTarget(shortcut.url);
    displayMessage(`Opening shortcut '@${key}': ${shortcut.name}`);
}

function handleShortcutCommand(args, mode) {
    if (mode === 'remove') {
        if (!args[0]) {
            displayMessage('Usage: rmsh <key>');
            return;
        }

        if (removeBookmarkShortcut(args[0])) {
            displayMessage(`Shortcut '${args[0].toLowerCase()}' removed.`);
        } else {
            displayMessage(`Shortcut '${args[0].toLowerCase()}' not found.`);
        }
        return;
    }

    if (args.length < 2) {
        displayMessage('Usage: mksh <key> [name] <url>');
        return;
    }

    const key = args[0];
    const url = args.length === 2 ? args[1] : args.slice(2).join(' ');
    const name = args.length === 2 ? key : args[1];
    setBookmarkShortcut(key, { name, url });
    displayMessage(`Shortcut '${key.toLowerCase()}' saved.`);
}

function handleShortcutCollectionCommand(args) {
    const subcmd = (args[0] || 'ls').toLowerCase();

    if (subcmd === 'ls' || subcmd === 'list') {
        const shortcuts = getBookmarkShortcuts();
        const entries = Object.values(shortcuts).sort((a, b) => a.key.localeCompare(b.key));

        const terminal = document.querySelector('.terminal');
        const output = document.createElement('div');
        output.className = 'command-output';
        const responseColor = getComputedStyle(document.documentElement).getPropertyValue('--response-color') || '#ffffff';
        output.style.color = responseColor;
        output.textContent = 'Bookmark shortcuts:';

        if (entries.length === 0) {
            const empty = document.createElement('div');
            empty.textContent = 'No shortcuts defined.';
            output.appendChild(empty);
        } else {
            entries.forEach((entry) => {
                const row = document.createElement('div');
                row.textContent = `@${entry.key}  ${entry.name} -> ${entry.url}`;
                output.appendChild(row);
            });
        }

        terminal.appendChild(output);
        createNewCommandLine();
        window.scrollTo(0, document.body.scrollHeight);
        return;
    }

    if (subcmd === 'rm' && args[1]) {
        if (removeBookmarkShortcut(args[1])) {
            displayMessage(`Shortcut '${args[1].toLowerCase()}' removed.`);
        } else {
            displayMessage(`Shortcut '${args[1].toLowerCase()}' not found.`);
        }
        return;
    }

    if (subcmd === 'export') {
        const shortcuts = typeof getBookmarkShortcuts === 'function' ? getBookmarkShortcuts() : {};
        const jsonStr = JSON.stringify(shortcuts);
        displayMessage(`Shortcuts export:\n${jsonStr}`);
        return;
    }

    if (subcmd === 'import' && args[1]) {
        try {
            const imported = JSON.parse(args.slice(1).join(' '));
            if (typeof imported !== 'object') throw new Error('Not an object');
            const shortcuts = typeof getBookmarkShortcuts === 'function' ? getBookmarkShortcuts() : {};
            Object.assign(shortcuts, imported);
            if (typeof saveBookmarkShortcuts === 'function') saveBookmarkShortcuts(shortcuts);
            displayMessage('Shortcuts imported.');
        } catch(e) {
            displayMessage('Invalid shortcuts JSON.');
        }
        return;
    }

    displayMessage('Usage: sh ls | sh rm <key> | sh export | sh import <json>');
}

function handleFlowCommand(args) {
    const subcmd = (args[0] || 'ls').toLowerCase();

    if (subcmd === 'ls' || subcmd === 'list') {
        listAllFlows();
        return;
    }

    if ((subcmd === 'open' || subcmd === 'run') && args[1]) {
        openFlow(args[1], parseFlowOpenOptions(args.slice(2)));
        return;
    }

    if (subcmd === 'create' && args[1]) {
        createFlow(args[1]);
        return;
    }

    if (subcmd === 'delete' && args[1]) {
        deleteFlow(args[1]);
        return;
    }

    if (subcmd === 'add' && args[1] && args[2]) {
        addUrlToFlow(args[1], args[2]);
        return;
    }

    if (subcmd === 'rm' && args[1] && args[2]) {
        removeUrlFromFlow(args[1], args[2]);
        return;
    }

    if (subcmd === 'export' && args[1]) {
        exportFlow(args[1]);
        return;
    }

    if (subcmd === 'import' && args[1] && args[2]) {
        importFlow(args[1], args.slice(2).join(' '));
        return;
    }

    if (subcmd === 'copy' && args[1] && args[2]) {
        copyFlow(args[1], args[2]);
        return;
    }

    displayMessage('Usage: flow ls | flow open <id> [--delay N] [--window] | flow create <id> | flow delete <id> | flow add <id> <url> | flow rm <id> <url> | flow export <id> | flow import <id> <json> | flow copy <id> <newid>');
}

function handleListCommand(args) {
    const pathParts = currentTerminalPath.split('/');
    const root = pathParts[0];

    if (pathParts.length === 1 && root === 'browser') {
        const output = document.createElement('div');
        output.className = 'command-output';
        const responseColor = getComputedStyle(document.documentElement).getPropertyValue('--response-color') || '#ffffff';
        output.style.color = responseColor;

        const paths = [
            { name: 'flows/', description: 'Stored flow commands' },
            { name: 'fav/', description: 'Favorite websites' },
            { name: 'bm/', description: 'Bookmarks' },
            { name: 'notes/', description: 'Stored notes' }
        ];

        paths.forEach(path => {
            const pathEl = document.createElement('div');
            pathEl.textContent = `${path.name.padEnd(12)} ${path.description}`;
            pathEl.style.cursor = 'pointer';
            pathEl.style.width = 'fit-content';
            pathEl.addEventListener('click', () => {
                const targetPath = path.name.replace('/', '');
                handleChangeDirectory([targetPath]);
            });
            output.appendChild(pathEl);
        });

        document.querySelector('.terminal').appendChild(output);
        createNewCommandLine();
    } else if (pathParts.length > 1) {
        const subPath = pathParts[1];

        if (subPath === 'flows') {
            listAllFlows();
        } else if (subPath === 'fav') {
            listFavorites();
        } else if (subPath === 'bm') {
            const bmPath = pathParts.slice(2).join('/');
            listCustomBookmarks(bmPath);
        } else if (subPath === 'notes') {
            listNotes();
        }
    }
}

function handleTimeCommand(args) {
    const now = new Date();
    const pad2 = (n) => String(n).padStart(2, '0');

    const hh24 = pad2(now.getHours());
    const mm = pad2(now.getMinutes());
    const ss = pad2(now.getSeconds());
    const hundredths = pad2(Math.floor(now.getMilliseconds() / 10));
    const time24 = `${hh24}:${mm}:${ss}.${hundredths}`;

    const hours12Raw = now.getHours() % 12 || 12;
    const hh12 = pad2(hours12Raw);
    const ampm = now.getHours() >= 12 ? 'PM' : 'AM';
    const time12 = `${hh12}:${mm}:${ss}.${hundredths} ${ampm}`;

    const variant = (args[0] || '').toLowerCase();

    if (variant === 'ui') {
        openClockUI();
        createNewCommandLine();
        return;
    }

    if (variant === '24') {
        displayMessage(time24);
        return;
    }

    if (variant === '12') {
        displayMessage(time12);
        return;
    }

    if (variant === 'live') {
        if (isLiveTimeRunning) {
            displayMessage('Live time is already running. Press ^C to exit.');
            return;
        }
        isLiveTimeRunning = true;

        const terminal = document.querySelector('.terminal');
        const output = document.createElement('div');
        output.className = 'command-output';
        const responseColor = getComputedStyle(document.documentElement).getPropertyValue('--response-color') || '#ffffff';
        output.style.color = responseColor;
        output.style.whiteSpace = 'pre-wrap';
        output.style.lineHeight = '1.6';
        output.textContent = `Live time (press ^C to exit)\n${time24}`;
        terminal.appendChild(output);

        const update = () => {
            const n = new Date();
            const h = pad2(n.getHours());
            const m = pad2(n.getMinutes());
            const s = pad2(n.getSeconds());
            const hs = pad2(Math.floor(n.getMilliseconds() / 10));
            output.textContent = `Live time (press ^C to exit)\n${h}:${m}:${s}.${hs}`;
        };
        update();
        liveTimeTimerId = setInterval(update, 200);

        liveTimeKeydownHandler = (e) => {
            const isCtrlC = (e.key === 'c' || e.key === 'C') && (e.ctrlKey || e.metaKey);
            if (isCtrlC && isLiveTimeRunning) {
                clearInterval(liveTimeTimerId);
                liveTimeTimerId = null;
                isLiveTimeRunning = false;
                document.removeEventListener('keydown', liveTimeKeydownHandler);
                liveTimeKeydownHandler = null;
                const exitLine = document.createElement('div');
                exitLine.className = 'command-output';
                exitLine.style.color = responseColor;
                exitLine.textContent = '^C';
                terminal.appendChild(exitLine);
                createNewCommandLine();
                window.scrollTo(0, document.body.scrollHeight);
            }
        };
        document.addEventListener('keydown', liveTimeKeydownHandler);
        window.scrollTo(0, document.body.scrollHeight);
        return;
    }

    if (variant === 'full') {
        const dateStr = `${now.getFullYear()}-${pad2(now.getMonth() + 1)}-${pad2(now.getDate())}`;
        const tzParts = Intl.DateTimeFormat('en-US', { timeZoneName: 'short' }).formatToParts(now);
        const tzPart = tzParts.find(p => p.type === 'timeZoneName');
        const tzShort = tzPart ? tzPart.value : '';
        const offsetMinutes = -now.getTimezoneOffset();
        const sign = offsetMinutes >= 0 ? '+' : '-';
        const absMinutes = Math.abs(offsetMinutes);
        const offsetHH = pad2(Math.floor(absMinutes / 60));
        const offsetMM = pad2(absMinutes % 60);
        const tzOffset = `UTC${sign}${offsetHH}:${offsetMM}`;

        const terminal = document.querySelector('.terminal');
        const output = document.createElement('div');
        output.className = 'command-output';
        const responseColor = getComputedStyle(document.documentElement).getPropertyValue('--response-color') || '#ffffff';
        output.style.color = responseColor;
        output.style.whiteSpace = 'pre-wrap';
        output.style.lineHeight = '1.6';
        output.textContent = `⏰ Time Capsule\n\n📅 Date: ${dateStr}\n🕒 Time (24h): ${time24}\n🕰️ Time (12h): ${time12}\n🌍 Timezone: ${tzShort} (${tzOffset})\n\nMake every second count ✨`;
        terminal.appendChild(output);
        createNewCommandLine();
        window.scrollTo(0, document.body.scrollHeight);
        return;
    }

    displayMessage(time24);
}

function handleCreateNoteCommand(command) {
    const match = command.match(/create note\s+"([^"]+)"/i);
    if (match && match[1]) {
        addNote(match[1]);
    } else {
        displayMessage('Usage: create note "your note text here"');
    }
}

function handleCreateFavoriteCommand(args) {
    if (!currentTerminalPath.startsWith('browser/fav')) {
        displayMessage('Command "create favorite" only works in favorite paths. Use "cd fav" first.');
        return;
    }

    if (args.length >= 3) {
        const name = args[1].replace(/^["']|["']$/g, '');
        const url = args[2].replace(/^["']|["']$/g, '');
        const favs = getCustomFavorites();
        favs.push({ name, url });
        saveCustomFavorites(favs);
        displayMessage(`Favorite "${name}" created successfully!`);
        return;
    }

    requestTerminalInput('Enter favorite name:', (name) => {
        if (!name) {
            displayMessage('Favorite creation cancelled');
            return;
        }
        requestTerminalInput('Enter favorite URL:', (url) => {
            if (!url) {
                displayMessage('Favorite creation cancelled');
                return;
            }
            const favs = getCustomFavorites();
            favs.push({ name, url });
            saveCustomFavorites(favs);
            displayMessage(`Favorite "${name}" created successfully!`);
        });
    });
}

function handleMkfvCommand(args) {
    if (args.length >= 2) {
        const name = args[0].replace(/^["']|["']$/g, '');
        const url = args[1].replace(/^["']|["']$/g, '');
        const favs = getCustomFavorites();
        favs.push({ name, url });
        saveCustomFavorites(favs);
        displayMessage(`Favorite "${name}" created successfully!`);
        return;
    }

    requestTerminalInput('Enter favorite name:', (name) => {
        if (!name) {
            displayMessage('Favorite creation cancelled');
            return;
        }
        requestTerminalInput('Enter favorite URL:', (url) => {
            if (!url) {
                displayMessage('Favorite creation cancelled');
                return;
            }
            const favs = getCustomFavorites();
            favs.push({ name, url });
            saveCustomFavorites(favs);
            displayMessage(`Favorite "${name}" created successfully!`);
        });
    });
}

function handleRmfvCommand(args) {
    const favs = getCustomFavorites();
    if (args.length === 0) {
        displayMessage('Usage: rmfv <index>|<name>');
        return;
    }
    const token = args.join(' ');
    if (!isNaN(token)) {
        const idx = parseInt(token);
        if (idx > 0 && idx <= favs.length) {
            const removed = favs.splice(idx - 1, 1)[0];
            saveCustomFavorites(favs);
            displayMessage(`Favorite "${removed.name}" removed`);
        } else {
            displayMessage(`Invalid favorite index: ${idx}`);
        }
        return;
    }
    const i = favs.findIndex(f => f.name.toLowerCase() === token.toLowerCase());
    if (i >= 0) {
        const removed = favs.splice(i, 1)[0];
        saveCustomFavorites(favs);
        displayMessage(`Favorite "${removed.name}" removed`);
    } else {
        displayMessage(`Favorite "${token}" not found`);
    }
}

function handleDeleteFavoriteCommand(args) {
    if (!currentTerminalPath.startsWith('browser/fav')) {
        displayMessage('Command "delete favorite" only works in favorite paths. Use "cd fav" first.');
        return;
    }

    const favs = getCustomFavorites();
    if (args.length < 2) {
        displayMessage('Usage: delete favorite <index>|<name>');
        return;
    }

    const token = args.slice(1).join(' ');
    if (!isNaN(token)) {
        const idx = parseInt(token);
        if (idx > 0 && idx <= favs.length) {
            const removed = favs.splice(idx - 1, 1)[0];
            saveCustomFavorites(favs);
            displayMessage(`Favorite "${removed.name}" removed`);
        } else {
            displayMessage(`Invalid favorite index: ${idx}`);
        }
        return;
    }
    const i = favs.findIndex(f => f.name.toLowerCase() === token.toLowerCase());
    if (i >= 0) {
        const removed = favs.splice(i, 1)[0];
        saveCustomFavorites(favs);
        displayMessage(`Favorite "${removed.name}" removed`);
    } else {
        displayMessage(`Favorite "${token}" not found`);
    }
}

function handleMkdirCommand(args) {
    if (!currentTerminalPath.startsWith('browser/bm')) {
        displayMessage('Command "mkdir" only works in bookmark paths. Use "cd bm" first.');
        return;
    }

    if (args.length === 0) {
        displayMessage('Usage: mkdir <folder_name>');
        return;
    }

    const folderName = args.join(' ');
    const bookmarks = getCustomBookmarks();
    const currentBmPath = currentTerminalPath.split('/').slice(2);

    let node = bookmarks;
    for (const part of currentBmPath) {
        if (node[part] && typeof node[part] === 'object') {
            node = node[part];
        } else {
            displayMessage(`Invalid path: ${currentTerminalPath}`);
            return;
        }
    }

    if (node[folderName]) {
        displayMessage(`Folder "${folderName}" already exists`);
        return;
    }

    node[folderName] = {};
    saveCustomBookmarks(bookmarks);
    displayMessage(`Folder "${folderName}" created successfully!`);
    createNewCommandLine();
}

function handleMkbmCommand(args) {
    if (args.length >= 2) {
        let folderPath = "", name = "", url = "";

        if (args[0].includes('/')) {
            folderPath = args[0];
            if (args.length >= 3) {
                name = args[1].replace(/^["']|["']$/g, '');
                url = args[2].replace(/^["']|["']$/g, '');
            } else {
                displayMessage('Usage: mkbm [folder/path] name url');
                return;
            }
        } else {
            name = args[0].replace(/^["']|["']$/g, '');
            url = args[1].replace(/^["']|["']$/g, '');
        }

        const folders = folderPath ? folderPath.split('/').filter(Boolean) : [];
        const result = makeBookmarkAtPath(folders, name, url);
        displayMessage(result);
        return;
    } else {
        displayMessage('Usage: mkbm [folder/path] name url');
    }
}

function handleRmdirCommand(args) {
    if (!currentTerminalPath.startsWith('browser/bm')) {
        displayMessage('Command "rmdir" only works in bookmark paths. Use "cd bm" first.');
        return;
    }

    if (args.length === 0) {
        displayMessage('Usage: rmdir <name>');
        return;
    }

    const name = args[0];
    const currentBmPathParts = currentTerminalPath.split('/').slice(2);

    if (currentBmPathParts.length > 0) {
        const bookmarks = getCustomBookmarks();
        let node = bookmarks;

        for (const part of currentBmPathParts) {
            if (node[part] && typeof node[part] === 'object') {
                node = node[part];
            } else {
                displayMessage(`Invalid path: ${currentTerminalPath}`);
                return;
            }
        }

        if (node[name] !== undefined) {
            delete node[name];
            saveCustomBookmarks(bookmarks);
            displayMessage(`"${name}" removed successfully`);
        } else {
            displayMessage(`"${name}" not found in current folder`);
        }
    } else {
        const result = removeBookmark(null, name);
        displayMessage(result);
    }
}

function handleRmbmCommand(args) {
    if (args.length === 0) {
        displayMessage('Usage: rmbm [folder/path/]name');
        return;
    }

    let path = args[0];

    if (path.includes('/')) {
        const pathParts = path.split('/');
        const bookmarkName = pathParts.pop();
        const folderPath = pathParts;

        const bookmarks = getCustomBookmarks();
        let node = bookmarks;

        for (const part of folderPath) {
            if (node && typeof node[part] === 'object') {
                node = node[part];
            } else {
                displayMessage(`Path not found: ${folderPath.join('/')}`);
                return;
            }
        }

        if (node[bookmarkName] !== undefined) {
            if (typeof node[bookmarkName] === 'string') {
                delete node[bookmarkName];
                saveCustomBookmarks(bookmarks);
                displayMessage(`Bookmark "${bookmarkName}" removed from path "${folderPath.join('/')}"`);
            } else {
                displayMessage(`"${bookmarkName}" is a folder, not a bookmark. Use "rmdir" to remove folders.`);
            }
        } else {
            displayMessage(`Bookmark "${bookmarkName}" not found in path "${folderPath.join('/')}"`);
        }
    } else {
        if (currentTerminalPath.startsWith('browser/bm')) {
            const currentBmPathParts = currentTerminalPath.split('/').slice(2);
            const bookmarkName = args[0];

            if (currentBmPathParts.length > 0) {
                const bookmarks = getCustomBookmarks();
                let node = bookmarks;

                for (const part of currentBmPathParts) {
                    if (node[part] && typeof node[part] === 'object') {
                        node = node[part];
                    } else {
                        displayMessage(`Invalid path: ${currentTerminalPath}`);
                        return;
                    }
                }

                if (node[bookmarkName] !== undefined) {
                    if (typeof node[bookmarkName] === 'string') {
                        delete node[bookmarkName];
                        saveCustomBookmarks(bookmarks);
                        displayMessage(`Bookmark "${bookmarkName}" removed`);
                    } else {
                        displayMessage(`"${bookmarkName}" is a folder, not a bookmark. Use "rmdir" to remove folders.`);
                    }
                } else {
                    displayMessage(`Bookmark "${bookmarkName}" not found in current folder`);
                }
            } else {
                const result = removeBookmark(null, bookmarkName);
                displayMessage(result);
            }
        } else {
            const result = removeBookmark(null, args[0]);
            displayMessage(result);
        }
    }
}

function handleOpenCommand(args) {
    if (args.length > 0) {
        const urlOrPath = args.join(' ');

        if (urlOrPath.startsWith('@')) {
            const shortcut = resolveBookmarkShortcut(urlOrPath.slice(1));
            if (shortcut) {
                openNormalizedTarget(shortcut.url);
                displayMessage(`Opening shortcut ${urlOrPath}: ${shortcut.name}`);
                createNewCommandLine();
                return;
            }
        }

        if (urlOrPath.startsWith('/') || (urlOrPath.includes('/') && !urlOrPath.includes('://'))) {
            let pathParts = urlOrPath.startsWith('/') ? urlOrPath.substring(1).split('/') : urlOrPath.split('/');

            if (pathParts[0] === 'bm' || currentTerminalPath.startsWith('browser/bm')) {
                const bookmarks = getCustomBookmarks();
                let node = bookmarks;

                for (let i = 0; i < pathParts.length - 1; i++) {
                    if (node[pathParts[i]] && typeof node[pathParts[i]] === 'object') {
                        node = node[pathParts[i]];
                    } else {
                        break;
                    }
                }

                const itemName = pathParts[pathParts.length - 1];
                if (node[itemName] && typeof node[itemName] === 'string') {
                    const url = node[itemName];
                    window.open(url.startsWith('http') ? url : `https://${url}`, '_blank');
                    displayMessage(`Opening ${itemName}: ${url}`);
                    createNewCommandLine();
                    return;
                }
            }

            if (pathParts[0] === 'fav' || currentTerminalPath === 'browser/fav') {
                const favs = getCustomFavorites();
                const itemName = pathParts[pathParts.length - 1];
                const fav = favs.find(f => f.name.toLowerCase() === itemName.toLowerCase());
                if (fav) {
                    window.open(fav.url.startsWith('http') ? fav.url : `https://${fav.url}`, '_blank');
                    displayMessage(`Opening ${fav.name}: ${fav.url}`);
                    createNewCommandLine();
                    return;
                }
            }
        }

        if (currentTerminalPath.startsWith('browser/bm')) {
            const bookmarks = getCustomBookmarks();
            const bmPathParts = currentTerminalPath.split('/').slice(2);
            let node = bookmarks;

            for (const part of bmPathParts) {
                if (node[part] && typeof node[part] === 'object') {
                    node = node[part];
                } else {
                    break;
                }
            }

            if (node[urlOrPath] && typeof node[urlOrPath] === 'string') {
                const url = node[urlOrPath];
                window.open(url.startsWith('http') ? url : `https://${url}`, '_blank');
                displayMessage(`Opening ${urlOrPath}: ${url}`);
                createNewCommandLine();
                return;
            }

            if (!isNaN(urlOrPath)) {
                const idx = parseInt(urlOrPath) - 1;
                const bookmarks = Object.entries(node)
                    .filter(([_, val]) => typeof val === 'string')
                    .map(([name, url]) => ({ name, url }));

                if (idx >= 0 && idx < bookmarks.length) {
                    const bm = bookmarks[idx];
                    window.open(bm.url.startsWith('http') ? bm.url : `https://${bm.url}`, '_blank');
                    displayMessage(`Opening [${idx + 1}] ${bm.name}: ${bm.url}`);
                    createNewCommandLine();
                    return;
                }
            }
        }

        if (currentTerminalPath === 'browser/fav') {
            const favs = getCustomFavorites();
            const fav = favs.find(f => f.name.toLowerCase() === urlOrPath.toLowerCase());
            if (fav) {
                window.open(fav.url.startsWith('http') ? fav.url : `https://${fav.url}`, '_blank');
                displayMessage(`Opening ${fav.name}: ${fav.url}`);
                createNewCommandLine();
                return;
            }

            if (!isNaN(urlOrPath)) {
                const idx = parseInt(urlOrPath) - 1;
                if (idx >= 0 && idx < favs.length) {
                    const fav = favs[idx];
                    window.open(fav.url.startsWith('http') ? fav.url : `https://${fav.url}`, '_blank');
                    displayMessage(`Opening [${idx + 1}] ${fav.name}: ${fav.url}`);
                    createNewCommandLine();
                    return;
                }
            }
        }

        if (/^(https?:\/\/)/.test(urlOrPath)) {
            window.open(urlOrPath, '_blank');
        } else if (/^(file:\/\/)/.test(urlOrPath)) {
            window.open(urlOrPath, '_blank');
        } else if (/^[a-zA-Z]:[\\/]/.test(urlOrPath)) {
            window.open('file:///' + urlOrPath.replace(/\\/g, '/'), '_blank');
        } else {
            window.open('https://' + urlOrPath, '_blank');
        }
    }
    createNewCommandLine();
}

function handlePwdCommand() {
    displayMessage(currentTerminalPath);
}

function handleLsCommand(args) {
    const pathParts = currentTerminalPath.split('/');
    let targetPath = currentTerminalPath;

    if (args.length > 0) {
        const arg = args[0].toLowerCase();
        if (arg === 'bm') {
            targetPath = 'browser/bm';
            if (args.length > 1) {
                targetPath = 'browser/bm/' + args.slice(1).join('/');
            }
        } else if (arg === 'fav') {
            targetPath = 'browser/fav';
        } else if (arg === 'notes') {
            targetPath = 'browser/notes';
        } else if (arg === 'flows') {
            targetPath = 'browser/flows';
        } else if (arg.startsWith('/')) {
            targetPath = 'browser' + arg;
        } else {
            // Relative path - append to current path
            targetPath = currentTerminalPath + '/' + arg;
        }
    }

    const parts = targetPath.split('/');
    const root = parts[0];
    const subPath = parts[1];

    if (!subPath) {
        const output = document.createElement('div');
        output.className = 'command-output';
        const responseColor = getComputedStyle(document.documentElement).getPropertyValue('--response-color') || '#ffffff';
        output.style.color = responseColor;

        const items = [
            'bm/',
            'fav/',
            'notes/',
            'flows/'
        ];

        items.forEach(item => {
            const itemEl = document.createElement('div');
            itemEl.textContent = item;
            output.appendChild(itemEl);
        });

        document.querySelector('.terminal').appendChild(output);
    } else if (subPath === 'bm') {
        const bmPath = parts.slice(2).join('/');
        listCustomBookmarks(bmPath || null);
    } else if (subPath === 'fav') {
        listCustomFavorites();
    } else if (subPath === 'notes') {
        listNotes();
    } else if (subPath === 'flows') {
        listAllFlows();
    }

    createNewCommandLine();
}

function handleCatCreate(args) {
    if (args.length === 0) {
        displayMessage('Usage: cat > <name> or cat > <folder/name>');
        return;
    }

    const pathParts = currentTerminalPath.split('/');
    const subPath = pathParts[1];

    if (!subPath || !['bm', 'fav', 'notes'].includes(subPath)) {
        displayMessage('cat > can only be used in bm, fav, or notes directories');
        return;
    }

    const fullPath = args.join(' ');
    const pathComponents = fullPath.split('/');
    const itemName = pathComponents.pop();
    const folderPath = pathComponents.length > 0 ? pathComponents : [];

    if (subPath === 'fav') {
        requestTerminalInput('Enter URL for favorite: ', (url) => {
            if (url === null) {
                displayMessage('Cancelled.');
                createNewCommandLine();
                return;
            }

            const favs = getCustomFavorites();
            const idx = favs.findIndex(f => f.name.toLowerCase() === itemName.toLowerCase());
            if (idx >= 0) {
                favs[idx].url = url;
            } else {
                favs.push({ name: itemName, url });
            }
            saveCustomFavorites(favs);
            displayMessage(`Favorite "${itemName}" saved!`);
            createNewCommandLine();
        });
    } else if (subPath === 'bm') {
        requestTerminalInput('Enter URL for bookmark: ', (url) => {
            if (url === null) {
                displayMessage('Cancelled.');
                createNewCommandLine();
                return;
            }

            const currentBmPath = currentTerminalPath.split('/').slice(2);
            const fullFolderPath = [...currentBmPath, ...folderPath];

            if (fullFolderPath.length === 0) {
                const bookmarks = getCustomBookmarks();
                bookmarks[itemName] = url;
                saveCustomBookmarks(bookmarks);
                displayMessage(`Bookmark "${itemName}" saved!`);
            } else {
                makeBookmarkAtPath(fullFolderPath, itemName, url);
            }
            createNewCommandLine();
        });
    } else if (subPath === 'notes') {
        requestTerminalInput('Enter note content: ', (content) => {
            if (content === null) {
                displayMessage('Cancelled.');
                createNewCommandLine();
                return;
            }

            const notes = getNotes();
            const idx = notes.findIndex((n, i) => {
                return String(i + 1) === itemName || n === itemName;
            });

            if (idx >= 0) {
                notes[idx] = content;
            } else {
                notes.push(content);
            }
            saveNotes(notes);
            displayMessage('Note saved!');
            createNewCommandLine();
        });
    }
}

function handleRmCommand(args) {
    if (args.length === 0) {
        displayMessage('Usage: rm <name|path>');
        return;
    }

    const pathParts = currentTerminalPath.split('/');
    const subPath = pathParts[1];

    if (!subPath || !['bm', 'fav', 'notes'].includes(subPath)) {
        displayMessage('rm can only be used in bm, fav, or notes directories');
        return;
    }

    const fullPath = args.join(' ');
    const pathComponents = fullPath.split('/');
    const itemName = pathComponents.pop();
    const folderPath = pathComponents.length > 0 ? pathComponents : [];

    if (subPath === 'fav') {
        const favs = getCustomFavorites();
        const idx = favs.findIndex(f => f.name.toLowerCase() === itemName.toLowerCase());
        if (idx >= 0) {
            favs.splice(idx, 1);
            saveCustomFavorites(favs);
            displayMessage(`Favorite "${itemName}" deleted!`);
        } else {
            displayMessage(`Favorite "${itemName}" not found.`);
        }
    } else if (subPath === 'bm') {
        const bookmarks = getCustomBookmarks();

        if (folderPath.length === 0) {
            if (bookmarks[itemName] !== undefined) {
                delete bookmarks[itemName];
                saveCustomBookmarks(bookmarks);
                displayMessage(`Bookmark "${itemName}" deleted!`);
            } else {
                displayMessage(`Bookmark "${itemName}" not found.`);
            }
        } else {
            let node = bookmarks;
            let valid = true;

            for (const folder of folderPath) {
                if (node[folder] && typeof node[folder] === 'object') {
                    node = node[folder];
                } else {
                    valid = false;
                    break;
                }
            }

            if (valid && node[itemName]) {
                delete node[itemName];
                saveCustomBookmarks(bookmarks);
                displayMessage(`Bookmark "${itemName}" deleted!`);
            } else {
                displayMessage(`Bookmark "${itemName}" not found in path.`);
            }
        }
    } else if (subPath === 'notes') {
        const notes = getNotes();
        let idx = -1;

        if (!isNaN(itemName)) {
            idx = parseInt(itemName) - 1;
        } else {
            idx = notes.findIndex(n => n === itemName);
        }

        if (idx >= 0 && idx < notes.length) {
            notes.splice(idx, 1);
            saveNotes(notes);
            displayMessage('Note deleted!');
        } else {
            displayMessage('Note not found.');
        }
    }

    createNewCommandLine();
}

function handleScriptCommand(args) {
    if (args.length === 0) {
        displayMessage('Usage: script create <name> | script run <name>');
        return;
    }
    const subcmd = args[0].toLowerCase();
    if (subcmd === 'create' && args[1]) {
        createScript(args[1]);
        return;
    }
    if (subcmd === 'run' && args[1]) {
        runScript(args[1]);
        return;
    }
    displayMessage('Usage: script create <name> | script run <name>');
}

function handleFindCommand(args) {
    if (args.length === 0) {
        displayMessage('Usage: find <query>');
        return;
    }
    const query = args.join(' ').toLowerCase();
    const results = [];
    
    const notes = getNotes();
    notes.forEach((n, i) => {
        const title = typeof n === 'object' ? n.title : `Note ${i+1}`;
        if (title.toLowerCase().includes(query)) results.push(`browser/notes/${i+1} (${title})`);
    });
    
    const flows = getFlows();
    Object.keys(flows).forEach(f => {
        if (f.toLowerCase().includes(query)) results.push(`browser/flows/${f}`);
    });
    
    if (results.length === 0) {
        displayMessage('No matches found.');
        return;
    }
    const terminal = document.querySelector('.terminal');
    const output = document.createElement('div');
    output.className = 'command-output';
    const responseColor = getComputedStyle(document.documentElement).getPropertyValue('--response-color') || '#ffffff';
    output.style.color = responseColor;
    output.textContent = `Find results for "${query}":`;
    results.forEach(res => {
        const row = document.createElement('div');
        row.textContent = res;
        output.appendChild(row);
    });
    terminal.appendChild(output);
    createNewCommandLine();
    window.scrollTo(0, document.body.scrollHeight);
}

function handleGrepCommand(args) {
    if (args.length === 0) {
        displayMessage('Usage: grep "<pattern>"');
        return;
    }
    const query = args.join(' ').replace(/^["']|["']$/g, '').toLowerCase();
    const results = [];
    
    const notes = getNotes();
    notes.forEach((n, i) => {
        const content = typeof n === 'object' ? n.content : n;
        if (content && content.toLowerCase().includes(query)) {
            const title = typeof n === 'object' ? n.title : `Note ${i+1}`;
            results.push(`${title}: ${content.substring(0, 50)}...`);
        }
    });
    
    if (results.length === 0) {
        displayMessage('No matches found.');
        return;
    }
    const terminal = document.querySelector('.terminal');
    const output = document.createElement('div');
    output.className = 'command-output';
    const responseColor = getComputedStyle(document.documentElement).getPropertyValue('--response-color') || '#ffffff';
    output.style.color = responseColor;
    output.textContent = `Grep results for "${query}":`;
    results.forEach(res => {
        const row = document.createElement('div');
        row.textContent = res;
        output.appendChild(row);
    });
    terminal.appendChild(output);
    createNewCommandLine();
    window.scrollTo(0, document.body.scrollHeight);
}
