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

function handleCommand(line) {
    if (!line) {
        createCommandLine();
        return;
    }
    const parts = line.match(/(?:[^\s"]+|"[^"]*")+/g) || [];
    const cmd = (parts[0] || "").toLowerCase();
    const args = parts.slice(1).map((s) => s.replace(/^"|"$/g, ""));

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
        const text = parts.slice(1).join(" ").replace(/^"|"$/g, "");
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
        appendOutput("Commands: mkbm, rmbm, mkfv, rmfv, note");
        createCommandLine();
        return;
    }

    appendOutput('Unknown command. Type "help" for commands.');
    createCommandLine();
}
