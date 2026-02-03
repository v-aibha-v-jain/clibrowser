
function showPermissionHelp(permissionName) {
    const terminal = document.querySelector('.terminal');
    const output = document.createElement('div');
    output.className = 'command-output';
    output.style.whiteSpace = 'pre-wrap';
    const responseColor = getComputedStyle(document.documentElement).getPropertyValue('--response-color') || '#ffffff';
    output.style.color = responseColor;
    output.innerHTML = `The extension needs the <strong>${permissionName}</strong> permission to perform this action.\n` +
        `Please open the extension page (chrome://extensions), enable the required permissions for this extension, then reload the extension and try again.`;
    terminal.appendChild(output);
    createNewCommandLine();
}

function getCustomFavorites() {
    try {
        const raw = localStorage.getItem('customFavorites');
        const arr = raw ? JSON.parse(raw) : [];
        return Array.isArray(arr) ? arr : [];
    } catch (_) {
        return [];
    }
}

function saveCustomFavorites(favs) {
    localStorage.setItem('customFavorites', JSON.stringify(favs || []));
}

function listCustomFavorites() {
    const favs = getCustomFavorites();
    const items = favs.map((f) => ({ title: f.name, url: f.url }));
    if (items.length === 0) {
        displayMessage('No favorites found. Use "mkfv" to create one.');
    } else {
        displayCommandOutput('Custom Favorites:', items, 'fav', 0);
    }
}

function getCustomBookmarks() {
    const stored = localStorage.getItem('customBookmarks');
    return stored ? JSON.parse(stored) : {};
}

function saveCustomBookmarks(bookmarks) {
    localStorage.setItem('customBookmarks', JSON.stringify(bookmarks));
}

function makeBookmark(folder, name, url) {
    const bookmarks = getCustomBookmarks();

    if (folder) {
        if (!bookmarks[folder]) {
            bookmarks[folder] = {};
        }
        if (typeof bookmarks[folder] === 'object' && !bookmarks[folder].hasOwnProperty('length')) {
            bookmarks[folder][name] = url;
        } else {
            return `Error: "${folder}" is not a folder`;
        }
    } else {
        bookmarks[name] = url;
    }

    saveCustomBookmarks(bookmarks);
    return `Bookmark "${name}" created successfully!`;
}

function makeBookmarkAtPath(folders, name, url) {
    const bookmarks = getCustomBookmarks();
    let node = bookmarks;
    if (Array.isArray(folders)) {
        for (const raw of folders) {
            const folder = (raw || '').trim();
            if (!folder) continue;
            if (!node[folder]) {
                node[folder] = {};
            }
            if (typeof node[folder] === 'string') {
                return `Error: "${folder}" is not a folder`;
            }
            node = node[folder];
        }
    }
    node[name] = url;
    saveCustomBookmarks(bookmarks);
    return `Bookmark "${name}" created successfully!`;
}

function removeBookmark(folder, name) {
    const bookmarks = getCustomBookmarks();

    if (folder) {
        if (bookmarks[folder] && typeof bookmarks[folder] === 'object') {
            if (bookmarks[folder][name]) {
                delete bookmarks[folder][name];
                saveCustomBookmarks(bookmarks);
                return `Bookmark "${name}" removed from folder "${folder}"`;
            } else {
                return `Bookmark "${name}" not found in folder "${folder}"`;
            }
        } else {
            return `Folder "${folder}" not found`;
        }
    } else {
        if (bookmarks[name]) {
            if (typeof bookmarks[name] === 'string') {
                delete bookmarks[name];
                saveCustomBookmarks(bookmarks);
                return `Bookmark "${name}" removed`;
            } else {
                return `"${name}" is a folder, not a bookmark. Use "rmdir" to remove folders`;
            }
        } else {
            return `Bookmark "${name}" not found`;
        }
    }
}

function listCustomBookmarks(folder = null) {
    const bookmarks = getCustomBookmarks();
    const items = [];
    const folders = [];

    function resolvePath(pathStr) {
        let node = bookmarks;
        const parts = (pathStr || '').split('/').filter(Boolean);
        for (const p of parts) {
            if (node && typeof node[p] === 'object') node = node[p];
            else return null;
        }
        return node;
    }

    if (folder) {
        const node = resolvePath(folder) || (typeof bookmarks[folder] === 'object' ? bookmarks[folder] : null);
        if (node) {
            Object.entries(node).forEach(([name, url]) => {
                if (typeof url === 'string') {
                    items.push({ title: name, url });
                } else if (typeof url === 'object') {
                    folders.push({ title: name, path: folder ? `${folder}/${name}` : name });
                }
            });

            if (items.length === 0 && folders.length === 0) {
                displayMessage(`Folder "${folder}" is empty`);
            } else {
                displayCustomBookmarks(`Contents of "${folder}":`, items, folders, folder);
            }
        } else {
            displayMessage(`Folder "${folder}" not found`);
        }
    } else {
        Object.entries(bookmarks).forEach(([name, value]) => {
            if (typeof value === 'string') {
                items.push({ title: name, url: value });
            } else if (typeof value === 'object') {
                folders.push({ title: name, path: name });
            }
        });

        if (items.length === 0 && folders.length === 0) {
            displayMessage('No bookmarks found');
        } else {
            displayCustomBookmarks('Custom Bookmarks:', items, folders);
        }
    }
}

function displayCustomBookmarks(title, items, folders, currentPath = '') {
    const terminal = document.querySelector('.terminal');
    const output = document.createElement('div');
    output.className = 'command-output';

    const responseColor = getComputedStyle(document.documentElement).getPropertyValue('--response-color') || '#ffffff';
    output.style.color = responseColor;

    const titleEl = document.createElement('div');
    titleEl.textContent = title;
    output.appendChild(titleEl);

    if (items.length > 0) {
        items.forEach((item, idx) => {
            const itemEl = document.createElement('div');
            itemEl.textContent = `${idx + 1}. ${item.title}`;
            itemEl.style.cursor = 'pointer';
            itemEl.style.padding = '5px 0';
            itemEl.addEventListener('click', () => {
                window.open(item.url.startsWith('http') ? item.url : `https://${item.url}`, '_blank');
            });
            output.appendChild(itemEl);
        });
    }

    if (items.length > 0 && folders.length > 0) {
        const separator = document.createElement('div');
        separator.textContent = '-----groups-----';
        separator.style.margin = '15px 0 10px 0';
        separator.style.opacity = '0.5';
        output.appendChild(separator);
    }

    if (folders.length > 0) {
        folders.forEach((folder, idx) => {
            const folderEl = document.createElement('div');
            folderEl.textContent = `📁 ${folder.title}/`;
            folderEl.style.cursor = 'pointer';
            folderEl.style.padding = '5px 0';
            folderEl.style.fontWeight = 'bold';
            folderEl.addEventListener('click', () => {
                const newPath = `browser/bm${currentPath ? '/' + currentPath : ''}/${folder.title}`;
                currentTerminalPath = newPath;
                currentTerminalPathDisplay = newPath;
                listCustomBookmarks(folder.path);
            });
            output.appendChild(folderEl);
        });
    }

    terminal.appendChild(output);
    createNewCommandLine();
    window.scrollTo(0, document.body.scrollHeight);
}

function displayMessage(message) {
    const terminal = document.querySelector('.terminal');
    const output = document.createElement('div');
    output.className = 'command-output';

    const responseColor = getComputedStyle(document.documentElement).getPropertyValue('--response-color') || '#ffffff';
    output.style.color = responseColor;

    output.textContent = message;
    terminal.appendChild(output);
    createNewCommandLine();
    window.scrollTo(0, document.body.scrollHeight);
}

function handleChangeDirectory(args) {
    if (args.length === 0) {
        currentTerminalPath = "browser";
        currentTerminalPathDisplay = "browser";
        displayMessage("Returned to root path");
        return;
    }

    if (args[0] === '..') {
        const pathParts = currentTerminalPath.split('/');
        if (pathParts.length > 1) {
            pathParts.pop();
            currentTerminalPath = pathParts.join('/');
            currentTerminalPathDisplay = pathParts.join('/');
            displayMessage(`Changed to ${currentTerminalPathDisplay}`);

            if (currentTerminalPath === 'browser') {
            } else if (currentTerminalPath === 'browser/flows') {
                listAllFlows();
            } else if (currentTerminalPath === 'browser/fav') {
                listFavorites();
            } else if (currentTerminalPath.startsWith('browser/bm')) {
                const bmPath = currentTerminalPath.split('/').slice(2).join('/');
                listCustomBookmarks(bmPath || null);
            } else if (currentTerminalPath === 'browser/notes') {
                listNotes();
            } else {
                createNewCommandLine();
            }
        } else {
            displayMessage("Already at root level");
        }
        return;
    }

    if (args[0].includes('/')) {
        const pathParts = args[0].split('/').filter(Boolean);

        let startPath = currentTerminalPath;
        if (pathParts[0] === 'bm' || pathParts[0] === 'flows' ||
            pathParts[0] === 'fav' || pathParts[0] === 'notes') {
            startPath = 'browser';
        }

        let currentPath = startPath;
        for (let i = 0; i < pathParts.length; i++) {
            const part = pathParts[i];

            let nextPath;
            if (currentPath === 'browser') {
                if (part === 'bm' || part === 'flows' || part === 'fav' || part === 'notes') {
                    nextPath = `browser/${part}`;
                } else {
                    displayMessage(`Invalid path: ${part} not a valid section`);
                    return;
                }
            } else if (currentPath.startsWith('browser/bm')) {
                const bookmarks = getCustomBookmarks();
                let node = bookmarks;
                const currentParts = currentPath.split('/').slice(2);

                for (const p of currentParts) {
                    if (node && typeof node[p] === 'object') {
                        node = node[p];
                    } else {
                        displayMessage(`Invalid path: ${currentPath}`);
                        return;
                    }
                }

                if (node[part] && typeof node[part] === 'object') {
                    nextPath = `${currentPath}/${part}`;
                } else if (node[part] && typeof node[part] === 'string') {
                    const url = node[part];
                    window.open(url.startsWith('http') ? url : `https://${url}`, '_blank');
                    displayMessage(`Opening ${part}: ${url}`);
                    return;
                } else {
                    displayMessage(`Path not found: ${part}`);
                    return;
                }
            } else {
                displayMessage(`Cannot navigate to ${args[0]}`);
                return;
            }

            currentPath = nextPath;
        }
        currentTerminalPath = currentPath;
        currentTerminalPathDisplay = currentPath;

        if (currentPath === 'browser/flows') {
            listAllFlows();
        } else if (currentPath === 'browser/fav') {
            listFavorites();
        } else if (currentPath.startsWith('browser/bm')) {
            const bmPath = currentPath.split('/').slice(2).join('/');
            listCustomBookmarks(bmPath || null);
        } else if (currentPath === 'browser/notes') {
            listNotes();
        }

        return;
    }

    const targetPath = args[0].toLowerCase();

    if (currentTerminalPath === "browser" &&
        (targetPath === 'flows' || targetPath === 'fav' || targetPath === 'bm' || targetPath === 'notes')) {
        currentTerminalPath = `browser/${targetPath}`;
        currentTerminalPathDisplay = `browser/${targetPath}`;

        if (targetPath === 'flows') {
            listAllFlows();
        } else if (targetPath === 'fav') {
            listFavorites();
        } else if (targetPath === 'bm') {
            listCustomBookmarks();
        } else if (targetPath === 'notes') {
            listNotes();
        }
        return;
    }

    if (currentTerminalPath.startsWith('browser/bm')) {
        const bookmarks = getCustomBookmarks();
        let currentNode = bookmarks;

        const currentParts = currentTerminalPath.split('/').slice(2);
        for (const part of currentParts) {
            if (currentNode && typeof currentNode[part] === 'object') {
                currentNode = currentNode[part];
            } else {
                displayMessage(`Invalid path: ${currentTerminalPath}`);
                return;
            }
        }

        if (currentNode[targetPath] && typeof currentNode[targetPath] === 'object') {
            currentTerminalPath = `${currentTerminalPath}/${targetPath}`;
            currentTerminalPathDisplay = `${currentTerminalPathDisplay}/${targetPath}`;
            listCustomBookmarks(currentParts.length > 0 ? `${currentParts.join('/')}/${targetPath}` : targetPath);
        } else if (currentNode[targetPath] && typeof currentNode[targetPath] === 'string') {
            const url = currentNode[targetPath];
            window.open(url.startsWith('http') ? url : `https://${url}`, '_blank');
            displayMessage(`Opening ${targetPath}: ${url}`);
        } else if (!isNaN(targetPath) && parseInt(targetPath) > 0) {
            const items = [];
            Object.entries(currentNode).forEach(([name, val]) => {
                if (typeof val === 'string') {
                    items.push({ name, url: val });
                }
            });

            const idx = parseInt(targetPath) - 1;
            if (idx >= 0 && idx < items.length) {
                const item = items[idx];
                window.open(item.url.startsWith('http') ? item.url : `https://${item.url}`, '_blank');
                displayMessage(`Opening [${idx + 1}] ${item.name}: ${item.url}`);
            } else {
                displayMessage(`Invalid index: ${targetPath}`);
            }
        } else {
            displayMessage(`Subfolder or bookmark not found: ${targetPath}`);
        }
        return;
    }

    if (currentTerminalPath === 'browser/fav') {
        const favs = getCustomFavorites();
        const favorite = favs.find(f => f.name.toLowerCase() === targetPath.toLowerCase());
        if (favorite) {
            window.open(favorite.url.startsWith('http') ? favorite.url : `https://${favorite.url}`, '_blank');
            displayMessage(`Opening ${favorite.name}: ${favorite.url}`);
            return;
        }

        if (!isNaN(targetPath)) {
            const idx = parseInt(targetPath) - 1;
            if (idx >= 0 && idx < favs.length) {
                const favorite = favs[idx];
                window.open(favorite.url.startsWith('http') ? favorite.url : `https://${favorite.url}`, '_blank');
                displayMessage(`Opening [${idx + 1}] ${favorite.name}: ${favorite.url}`);
                return;
            }
        }

        displayMessage(`Favorite '${targetPath}' not found`);
        return;
    }

    displayMessage(`Unknown path: ${targetPath}`);
}
