function executeCommand(command, commandLine) {
    const cmdParts = command.trim().split(/\s+/);
    const cmd = cmdParts[0].toLowerCase();
    const args = cmdParts.slice(1);

    freezeCommandLine(commandLine, command);

    if (cmd === 'clip') handleClipCommand(args);
    else if (cmd === 'clear') clearTerminal();
    else if (cmd === 'help') displayHelp();
    else if (cmd === 'search') handleSearchCommand(args);
    else if (cmd === 'show' && args[0]?.toLowerCase() === 'history') handleShowHistoryCommand(args.slice(1));
    else if (cmd === 'ls') handleLsCommand(args);

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

    else if (cmd === 'time') handleTimeCommand(args);

    else if (cmd === '--flow' && args[0]) openFlow(args[0]);
    else if (cmd === 'create' && args[0]?.toLowerCase() === 'flow' && args[1]) createFlow(args[1]);
    else if (cmd === 'delete' && args[0]?.toLowerCase() === 'flow' && args[1]) deleteFlow(args[1]);

    else if (cmd === 'create' && args[0]?.toLowerCase() === 'note') handleCreateNoteCommand(command);
    else if (cmd === 'delete' && args[0]?.toLowerCase() === 'note' && args[1]) deleteNote(parseInt(args[1]));

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
        displayMessage('Usage: clip copy <text> | clip paste');
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
            localStorage.setItem('terminal_clipboard', clipContent);
            displayMessage('Copied to clipboard successfully!');
        } catch (e) {
            displayMessage('Failed to copy to clipboard.');
        }
        return;
    }

    if (subcmd === 'paste') {
        const savedContent = localStorage.getItem('terminal_clipboard');
        if (savedContent) {
            displayMessage(savedContent);
        } else {
            displayMessage('Clipboard is empty.');
        }
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
        } else {
            targetPath = arg.startsWith('/') ? 'browser' + arg : 'browser/' + arg;
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
        });
    } else if (subPath === 'bm') {
        requestTerminalInput('Enter URL for bookmark: ', (url) => {
            if (url === null) {
                displayMessage('Cancelled.');
                return;
            }

            if (folderPath.length === 0) {
                const bookmarks = getCustomBookmarks();
                bookmarks[itemName] = url;
                saveCustomBookmarks(bookmarks);
                displayMessage(`Bookmark "${itemName}" saved!`);
            } else {
                makeBookmarkAtPath(folderPath, itemName, url);
            }
        });
    } else if (subPath === 'notes') {
        requestTerminalInput('Enter note content: ', (content) => {
            if (content === null) {
                displayMessage('Cancelled.');
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
