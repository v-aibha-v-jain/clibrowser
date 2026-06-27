function makeBookmarkAtPath(folders, name, url) {
    const bookmarks = getCustomBookmarks();
    let node = bookmarks;
    if (Array.isArray(folders)) {
        for (const raw of folders) {
            const f = (raw || "").trim();
            if (!f) continue;
            if (!node[f]) node[f] = {};
            if (typeof node[f] === "string") return `Error: "${f}" is not a folder`;
            node = node[f];
        }
    }
    node[name] = url;
    saveCustomBookmarks(bookmarks);
    return `Bookmark "${name}" created successfully`;
}

function removeBookmarkByPath(pathParts) {
    const bookmarks = getCustomBookmarks();
    if (pathParts.length === 0) return "Invalid path";
    if (pathParts.length === 1) {
        const name = pathParts[0];
        if (bookmarks[name] && typeof bookmarks[name] === "string") {
            delete bookmarks[name];
            saveCustomBookmarks(bookmarks);
            return `Bookmark "${name}" removed`;
        }
        return `Bookmark "${name}" not found at root`;
    }
    const name = pathParts.pop();
    let node = bookmarks;
    for (const p of pathParts) {
        if (node[p] && typeof node[p] === "object") node = node[p];
        else return `Path not found: ${pathParts.join("/")}`;
    }
    if (node[name] && typeof node[name] === "string") {
        delete node[name];
        saveCustomBookmarks(bookmarks);
        return `Bookmark "${name}" removed from "${pathParts.join("/")}"`;
    }
    return `Bookmark "${name}" not found in "${pathParts.join("/")}"`;
}

let popupCommandHistory = [];

function appendPopupList(title, values) {
    appendOutput(title);
    values.forEach((value, index) => appendOutput(`${index + 1}. ${value}`));
    createCommandLine();
}

function normalizePopupNote(note, index) {
    if (note && typeof note === 'object' && !Array.isArray(note)) {
        return {
            index,
            title: note.title || `Note ${index}`,
            content: note.content || '',
            tags: Array.isArray(note.tags) ? note.tags : [],
        };
    }

    return {
        index,
        title: `Note ${index}`,
        content: String(note ?? ''),
        tags: [],
    };
}

function popupFindNoteIndex(notes, token) {
    if (!token) return -1;
    const numeric = Number(token);
    if (Number.isFinite(numeric) && numeric > 0 && numeric <= notes.length) {
        return numeric - 1;
    }
    const lowerToken = String(token).toLowerCase();
    return notes.findIndex((note, index) => {
        const normalized = normalizePopupNote(note, index + 1);
        return normalized.title.toLowerCase() === lowerToken || normalized.content.toLowerCase().includes(lowerToken);
    });
}

function popupSearchNotes(query) {
    const notes = getNotes();
    const lowerQuery = String(query || '').trim().toLowerCase();
    return notes
        .map((note, index) => normalizePopupNote(note, index + 1))
        .filter((note) => {
            const tagText = note.tags.join(' ').toLowerCase();
            return note.title.toLowerCase().includes(lowerQuery) || note.content.toLowerCase().includes(lowerQuery) || tagText.includes(lowerQuery);
        });
}

function handleCommand(line) {
    if (!line) {
        createCommandLine();
        return;
    }
    const normalizedLine = resolveAliasCommand(line.trim());
    const parts = tokenizeCommandLine(normalizedLine);
    const cmd = (parts[0] || "").toLowerCase();
    const args = parts.slice(1);

    if (normalizedLine) {
        popupCommandHistory.push(normalizedLine);
    }

    if (!cmd) {
        createCommandLine();
        return;
    }

    if (cmd === "mkbm") {
        if (args.length === 1) {
            const name = args[0];
            getCurrentTabUrl((url) => {
                if (!url)
                    return appendOutput(
                        "Could not get current tab URL (permission missing)",
                        "error"
                    );
                const res = makeBookmarkAtPath([], name, url);
                appendOutput(res);
                createCommandLine();
            });
            return;
        }
        if (args.length === 2) {
            const path = args[0].split("/").filter(Boolean);
            const name = args[1];
            getCurrentTabUrl((url) => {
                if (!url)
                    return appendOutput(
                        "Could not get current tab URL (permission missing)",
                        "error"
                    );
                const res = makeBookmarkAtPath(path, name, url);
                appendOutput(res);
                createCommandLine();
            });
            return;
        }
        appendOutput("Usage: mkbm <name>  OR  mkbm <path> <name>");
        createCommandLine();
        return;
    }

    if (cmd === "rmbm") {
        if (args.length === 0) {
            appendOutput("Usage: rmbm <name>  OR  rmbm <path>/<name>");
            createCommandLine();
            return;
        }
        const input = args.join(" ");
        const partsPath = input.split("/").filter(Boolean);
        const res = removeBookmarkByPath(partsPath);
        appendOutput(res);
        createCommandLine();
        return;
    }

    if (cmd === "mkfv") {
        if (args.length !== 1) {
            appendOutput("Usage: mkfv <name>");
            createCommandLine();
            return;
        }
        const name = args[0];
        getCurrentTabUrl((url) => {
            if (!url)
                return appendOutput(
                    "Could not get current tab URL (permission missing)",
                    "error"
                );
            const favs = getCustomFavorites();
            favs.push({ name, url });
            saveCustomFavorites(favs);
            appendOutput(`Favorite "${name}" created`);
            createCommandLine();
        });
        return;
    }

    if (cmd === "rmfv") {
        const favs = getCustomFavorites();
        if (args.length === 0) {
            appendOutput("Usage: rmfv <index>|<name>");
            createCommandLine();
            return;
        }
        const token = args.join(" ");
        if (!isNaN(token)) {
            const idx = parseInt(token);
            if (idx > 0 && idx <= favs.length) {
                const removed = favs.splice(idx - 1, 1)[0];
                saveCustomFavorites(favs);
                appendOutput(`Favorite "${removed.name}" removed`);
            } else appendOutput(`Invalid favorite index: ${idx}`);
            createCommandLine();
            return;
        }
        const i = favs.findIndex(
            (f) => f.name.toLowerCase() === token.toLowerCase()
        );
        if (i >= 0) {
            const removed = favs.splice(i, 1)[0];
            saveCustomFavorites(favs);
            appendOutput(`Favorite "${removed.name}" removed`);
        } else appendOutput(`Favorite "${token}" not found`);
        createCommandLine();
        return;
    }

    if (cmd === "note") {
        if (args.length === 0 || args[0] === "ls" || args[0] === "list") {
            const notes = getNotes();
            const values = notes.length ? notes.map((note, index) => {
                const normalized = normalizePopupNote(note, index + 1);
                const preview = normalized.content.length > 48 ? `${normalized.content.slice(0, 48)}...` : normalized.content;
                const tags = normalized.tags.length ? ` [${normalized.tags.join(', ')}]` : '';
                return `${index + 1}. ${normalized.title}: ${preview}${tags}`;
            }) : ["No notes found."];
            appendPopupList("Notes:", values);
            return;
        }

        const subcmd = args[0].toLowerCase();
        if (subcmd === "search") {
            const query = args.slice(1).join(" ");
            const matches = popupSearchNotes(query);
            const values = matches.length ? matches.map((note) => `${note.index}. ${note.title}: ${note.content}`) : ["No matching notes found."];
            appendPopupList(query ? `Notes matching "${query}":` : "Notes search:", values);
            return;
        }

        if (subcmd === "cat" && args[1]) {
            const notes = getNotes();
            const index = popupFindNoteIndex(notes, args[1]);
            if (index >= 0) {
                const note = normalizePopupNote(notes[index], index + 1);
                appendOutput(`${note.title}\n\n${note.content}`);
            } else {
                appendOutput("Note not found.", "error");
            }
            createCommandLine();
            return;
        }

        if (subcmd === "edit" && args[1]) {
            const notes = getNotes();
            const index = popupFindNoteIndex(notes, args[1]);
            if (index >= 0) {
                const current = notes[index];
                const newContent = args.slice(2).join(" ");
                notes[index] = current && typeof current === "object" && !Array.isArray(current)
                    ? { ...current, content: newContent, updatedAt: new Date().toISOString() }
                    : newContent;
                saveNotes(notes);
                appendOutput("Note updated.");
            } else {
                appendOutput("Note not found.", "error");
            }
            createCommandLine();
            return;
        }

        if (subcmd === "tag" && args[1]) {
            const notes = getNotes();
            const index = popupFindNoteIndex(notes, args[1]);
            if (index >= 0) {
                const current = notes[index];
                const tags = args.slice(2).map((tag) => String(tag).trim()).filter(Boolean);
                if (current && typeof current === 'object' && !Array.isArray(current)) {
                    const currentTags = Array.isArray(current.tags) ? current.tags : [];
                    notes[index] = { ...current, tags: Array.from(new Set([...currentTags, ...tags])), updatedAt: new Date().toISOString() };
                } else {
                    notes[index] = { title: `Note ${index + 1}`, content: String(current ?? ''), tags, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
                }
                saveNotes(notes);
                appendOutput("Note tags updated.");
            } else {
                appendOutput("Note not found.", "error");
            }
            createCommandLine();
            return;
        }

        const text = args.join(" ");
        if (!text) {
            appendOutput("Usage: note <text>");
            createCommandLine();
            return;
        }
        const notes = getNotes();
        notes.push(text);
        saveNotes(notes);
        appendOutput("Note saved");
        createCommandLine();
        return;
    }

    if (cmd === "mksh") {
        if (args.length < 2) {
            appendOutput('Usage: mksh <key> [name] <url>');
            createCommandLine();
            return;
        }
        const key = args[0].toLowerCase();
        const url = args.length === 2 ? args[1] : args.slice(2).join(" ");
        const name = args.length === 2 ? key : args[1];
        setBookmarkShortcut(key, { name, url });
        appendOutput(`Shortcut '${key}' saved.`);
        createCommandLine();
        return;
    }

    if (cmd === "rmsh") {
        if (!args[0]) {
            appendOutput('Usage: rmsh <key>');
            createCommandLine();
            return;
        }
        if (removeBookmarkShortcut(args[0])) {
            appendOutput(`Shortcut '${args[0].toLowerCase()}' removed.`);
        } else {
            appendOutput(`Shortcut '${args[0].toLowerCase()}' not found.`, "error");
        }
        createCommandLine();
        return;
    }

    if (cmd === "clip" && args[0]) {
        const action = args[0].toLowerCase();

        if (action === "copy" && args[1]) {
            const content = args.slice(1).join(" ");
            setTerminalClipboard(content);
            appendOutput("Copied to clipboard!");
            createCommandLine();
            return;
        }

        if (action === "paste") {
            const content = getTerminalClipboard();
            appendOutput(content || "Clipboard is empty.");
            createCommandLine();
            return;
        }

        if (action === "save" && args[1]) {
            const content = getTerminalClipboard();
            if (!content) {
                appendOutput("Clipboard is empty.", "error");
                createCommandLine();
                return;
            }
            if (saveClipboardSlot(args[1], content)) {
                appendOutput(`Saved clipboard slot '${args[1].toLowerCase()}'.`);
            } else {
                appendOutput("Failed to save clipboard slot.", "error");
            }
            createCommandLine();
            return;
        }

        if (action === "load" && args[1]) {
            const items = getSavedClipboardItems();
            const slot = items[args[1].toLowerCase()];
            if (!slot) {
                appendOutput(`Clipboard slot '${args[1].toLowerCase()}' not found.`, "error");
                createCommandLine();
                return;
            }
            setTerminalClipboard(slot.value);
            appendOutput(slot.value);
            createCommandLine();
            return;
        }

        if (action === "ls" || action === "list") {
            const items = getSavedClipboardItems();
            const names = Object.keys(items).sort();
            appendPopupList("Saved clipboard slots:", names.length ? names.map((name) => `${name} -> ${items[name].value}`) : ["No saved clipboard slots."]);
            return;
        }

        if (action === "history") {
            const history = getClipboardHistory();
            appendPopupList("Clipboard history:", history.length ? history.slice(0, 10).map((entry, index) => `${index + 1}. ${entry.value}`) : ["Clipboard history is empty."]);
            return;
        }

        if (action === "clear" && args[1]) {
            if (removeClipboardSlot(args[1])) {
                appendOutput(`Clipboard slot '${args[1].toLowerCase()}' removed.`);
            } else {
                appendOutput(`Clipboard slot '${args[1].toLowerCase()}' not found.`, "error");
            }
            createCommandLine();
            return;
        }

        if (action === "clear-all") {
            saveClipboardHistory([]);
            saveSavedClipboardItems({});
            appendOutput("Clipboard history cleared.");
            createCommandLine();
            return;
        }
    }

    if (cmd === "sh") {
        const subcmd = (args[0] || "ls").toLowerCase();
        if (subcmd === "ls" || subcmd === "list") {
            const shortcuts = getBookmarkShortcuts();
            const entries = Object.values(shortcuts).sort((a, b) => a.key.localeCompare(b.key));
            const values = entries.length ? entries.map((entry) => `@${entry.key}  ${entry.name} -> ${entry.url}`) : ["No shortcuts defined."];
            appendPopupList("Bookmark shortcuts:", values);
            return;
        }
        if (subcmd === "rm" && args[1]) {
            if (removeBookmarkShortcut(args[1])) {
                appendOutput(`Shortcut '${args[1].toLowerCase()}' removed.`);
            } else {
                appendOutput(`Shortcut '${args[1].toLowerCase()}' not found.`, "error");
            }
            createCommandLine();
            return;
        }
        appendOutput('Usage: sh ls | sh rm <key>');
        createCommandLine();
        return;
    }

    if (cmd.startsWith("@")) {
        const key = cmd.slice(1).toLowerCase();
        if (!key) {
            appendOutput('Usage: @<key> [url]');
            createCommandLine();
            return;
        }

        if (args.length > 0) {
            const url = args.join(" ");
            setBookmarkShortcut(key, { name: key, url });
            appendOutput(`Shortcut '@${key}' saved.`);
            createCommandLine();
            return;
        }

        const shortcut = resolveBookmarkShortcut(key);
        if (!shortcut) {
            appendOutput(`Shortcut '@${key}' not found.`, "error");
            createCommandLine();
            return;
        }

        window.open(shortcut.url.startsWith('http') ? shortcut.url : `https://${shortcut.url}`, '_blank');
        appendOutput(`Opened shortcut '@${key}': ${shortcut.name}`);
        createCommandLine();
        return;
    }

    if (cmd === "history") {
        if (args[0] === "-c") {
            popupCommandHistory = [];
            appendOutput("Command history cleared.");
            createCommandLine();
            return;
        }
        const limit = args[0] && !Number.isNaN(Number(args[0])) ? Math.max(1, Number(args[0])) : popupCommandHistory.length;
        const entries = popupCommandHistory.slice(-limit);
        appendPopupList("Command history:", entries.length ? entries : ["No commands in history."]);
        return;
    }

    if (cmd === "date") {
        appendOutput(formatBrowserDate("full"));
        createCommandLine();
        return;
    }

    if (cmd === "echo") {
        appendOutput(args.join(" "));
        createCommandLine();
        return;
    }



    if (cmd === "alias") {
        if (args.length === 0) {
            const aliases = getCommandAliases();
            const names = Object.keys(aliases).sort();
            appendPopupList("Aliases:", names.length ? names.map((name) => `${name}='${aliases[name]}'`) : ["No aliases defined."]);
            return;
        }
        if (args.length === 1) {
            appendOutput('Usage: alias <name> "<command>"');
            createCommandLine();
            return;
        }
        const aliases = getCommandAliases();
        aliases[args[0].toLowerCase()] = args.slice(1).join(" ");
        saveCommandAliases(aliases);
        appendOutput(`Alias '${args[0].toLowerCase()}' created.`);
        createCommandLine();
        return;
    }

    if (cmd === "unalias") {
        if (!args[0]) {
            appendOutput('Usage: unalias <name>');
            createCommandLine();
            return;
        }
        const aliases = getCommandAliases();
        const aliasName = args[0].toLowerCase();
        if (!aliases[aliasName]) {
            appendOutput(`Alias '${aliasName}' not found.`);
            createCommandLine();
            return;
        }
        delete aliases[aliasName];
        saveCommandAliases(aliases);
        appendOutput(`Alias '${aliasName}' removed.`);
        createCommandLine();
        return;
    }

    if (cmd === "save" && args[0] === "session") {
        if (!args[1]) {
            appendOutput("Usage: save session <id>");
            createCommandLine();
            return;
        }
        const sessionId = args[1];
        if (chrome && chrome.tabs && chrome.windows) {
            chrome.windows.getCurrent({ populate: true }, (currentWindow) => {
                if (chrome.runtime.lastError || !currentWindow) {
                    appendOutput("Error: Could not access current window.", "error");
                    createCommandLine();
                    return;
                }
                const tabs = currentWindow.tabs || [];
                const urls = tabs.map(tab => tab.url).filter(url => url && !url.startsWith('chrome://') && !url.startsWith('chrome-extension://'));
                if (urls.length === 0) {
                    appendOutput("No valid tabs to save in current window.", "error");
                    createCommandLine();
                    return;
                }
                const sessions = getSessions();
                sessions[sessionId] = {
                    urls: urls,
                    timestamp: new Date().toISOString(),
                    count: urls.length
                };
                saveSessions(sessions);
                appendOutput(`Session "${sessionId}" saved with ${urls.length} tab(s).`);
                createCommandLine();
            });
        } else {
            appendOutput("Error: Browser tabs API not available.", "error");
            createCommandLine();
        }
        return;
    }

    if (cmd === "load" && args[0] === "session") {
        if (!args[1]) {
            appendOutput("Usage: load session <id>");
            createCommandLine();
            return;
        }
        const sessionId = args[1];
        const sessions = getSessions();
        const session = sessions[sessionId];
        if (!session || !session.urls || session.urls.length === 0) {
            appendOutput(`Session "${sessionId}" not found or empty.`, "error");
            createCommandLine();
            return;
        }
        session.urls.forEach((url) => {
            window.open(url, '_blank');
        });
        appendOutput(`Loaded session "${sessionId}" with ${session.urls.length} tab(s).`);
        createCommandLine();
        return;
    }

    if (cmd === "clip" && args[0]) {
        const action = args[0].toLowerCase();

        if (action === "copy" && args[1]) {
            const content = args.slice(1).join(" ");
            localStorage.setItem("terminal_clipboard", content);
            appendOutput("Copied to clipboard!");
            createCommandLine();
            return;
        }

        if (action === "paste") {
            const content = localStorage.getItem("terminal_clipboard");
            if (content) {
                appendOutput(content);
            } else {
                appendOutput("Clipboard is empty.");
            }
            createCommandLine();
            return;
        }
    }

    if (cmd === "help") {
        appendOutput("Commands: mkbm, rmbm, mkfv, rmfv, note, history, date, echo, alias, unalias");
        createCommandLine();
        return;
    }

    appendOutput('Unknown command. Type "help" for commands.');
    createCommandLine();
}
