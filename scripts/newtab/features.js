function listAllFlows() {
    const flows = getFlows();
    const ids = Object.keys(flows);
    const terminal = document.querySelector('.terminal');
    const output = document.createElement('div');
    output.className = 'command-output';
    const responseColor = getComputedStyle(document.documentElement).getPropertyValue('--response-color') || '#ffffff';
    output.style.color = responseColor;
    output.textContent = 'Flows:';
    if (ids.length === 0) {
        const empty = document.createElement('div');
        empty.textContent = 'No flows found. Use "create flow <id>" to add one.';
        output.appendChild(empty);
    } else {
        ids.forEach((id, idx) => {
            const idEl = document.createElement('div');
            idEl.textContent = `${idx + 1}. ${id}`;
            output.appendChild(idEl);
        });
    }
    terminal.appendChild(output);
    createNewCommandLine();
    window.scrollTo(0, document.body.scrollHeight);
}

function getFlows() {
    try {
        const raw = localStorage.getItem('flows');
        const obj = raw ? JSON.parse(raw) : {};
        return typeof obj === 'object' && obj !== null ? obj : {};
    } catch (_) {
        return {};
    }
}

function saveFlows(flows) {
    localStorage.setItem('flows', JSON.stringify(flows || {}));
}

function parseFlowOpenOptions(args) {
    const options = { delayMs: 0, openInWindow: false };
    for (let index = 0; index < args.length; index += 1) {
        const token = String(args[index] || '').toLowerCase();
        if (token === '--delay' && args[index + 1] && !Number.isNaN(Number(args[index + 1]))) {
            options.delayMs = Math.max(0, Number(args[index + 1]));
            index += 1;
        } else if (token === '--window') {
            options.openInWindow = true;
        }
    }
    return options;
}

function openUrlsInSequence(urls, options = {}) {
    const delayMs = Math.max(0, Number(options.delayMs) || 0);
    const openInWindow = !!options.openInWindow;

    urls.forEach((rawUrl, index) => {
        const resolvedUrl = rawUrl.startsWith('http') ? rawUrl : `https://${rawUrl}`;
        const openAt = delayMs > 0 ? index * delayMs : 0;
        setTimeout(() => {
            window.open(resolvedUrl, openInWindow ? '_blank' : '_blank');
        }, openAt);
    });
}

function listFlow(id) {
    const flows = getFlows();
    const urls = flows[id] || [];
    const terminal = document.querySelector('.terminal');
    const output = document.createElement('div');
    output.className = 'command-output';
    const responseColor = getComputedStyle(document.documentElement).getPropertyValue('--response-color') || '#ffffff';
    output.style.color = responseColor;
    output.textContent = `Flow: ${id}`;
    if (!urls.length) {
        const empty = document.createElement('div');
        empty.textContent = 'No URLs in this flow.';
        output.appendChild(empty);
    } else {
        urls.forEach((url, idx) => {
            const urlEl = document.createElement('div');
            urlEl.textContent = `${idx + 1}. ${url}`;
            urlEl.style.cursor = 'pointer';
            urlEl.style.width = 'fit-content';
            urlEl.addEventListener('click', () => window.open(url.startsWith('http') ? url : `https://${url}`, '_blank'));
            output.appendChild(urlEl);
        });
    }
    terminal.appendChild(output);
    createNewCommandLine();
    window.scrollTo(0, document.body.scrollHeight);
}

function openFlow(id, options = {}) {
    const flows = getFlows();
    const urls = flows[id] || [];
    if (!urls.length) {
        displayMessage('No URLs in this flow.');
        return;
    }
    openUrlsInSequence(urls, options);
    if (options.delayMs > 0) {
        displayMessage(`Opening ${urls.length} URLs from flow "${id}" every ${options.delayMs}ms.`);
    } else {
        displayMessage(`Opened ${urls.length} URLs from flow "${id}".`);
    }
}

function createFlow(id) {
    const flows = getFlows();
    if (flows[id]) {
        displayMessage('Flow already exists.');
        return;
    }
    const urls = [];
    function promptUrl() {
        requestTerminalInput(`Enter url #${urls.length + 1} (type 'exit' to finish):`, (input) => {
            if (!input || input.toLowerCase() === 'exit') {
                flows[id] = urls;
                saveFlows(flows);
                displayMessage(`Flow "${id}" created with ${urls.length} URLs.`);
                return;
            }
            urls.push(input);
            promptUrl();
        });
    }
    promptUrl();
}

function deleteFlow(id) {
    const flows = getFlows();
    if (!flows[id]) {
        displayMessage('Flow not found.');
        return;
    }
    delete flows[id];
    saveFlows(flows);
    displayMessage(`Flow "${id}" deleted.`);
}

function getNotes() {
    try {
        const raw = localStorage.getItem('notes');
        const arr = raw ? JSON.parse(raw) : [];
        return Array.isArray(arr) ? arr : [];
    } catch (_) {
        return [];
    }
}

function saveNotes(notes) {
    localStorage.setItem('notes', JSON.stringify(notes || []));
}

function normalizeNoteItem(note, index) {
    if (note && typeof note === 'object' && !Array.isArray(note)) {
        return {
            index,
            title: note.title || `Note ${index}`,
            content: note.content || '',
            tags: Array.isArray(note.tags) ? note.tags : [],
            createdAt: note.createdAt || null,
            updatedAt: note.updatedAt || null,
            raw: note,
        };
    }

    return {
        index,
        title: `Note ${index}`,
        content: String(note ?? ''),
        tags: [],
        createdAt: null,
        updatedAt: null,
        raw: note,
    };
}

function findNoteIndexByToken(notes, token) {
    if (!token) return -1;
    const numericIndex = Number(token);
    if (Number.isFinite(numericIndex) && numericIndex > 0 && numericIndex <= notes.length) {
        return numericIndex - 1;
    }
    const lowerToken = String(token).toLowerCase();
    return notes.findIndex((note, index) => {
        const normalized = normalizeNoteItem(note, index + 1);
        return normalized.title.toLowerCase() === lowerToken || normalized.content.toLowerCase().includes(lowerToken);
    });
}

function updateNoteAtIndex(index, updater) {
    const notes = getNotes();
    const noteIndex = index - 1;
    if (noteIndex < 0 || noteIndex >= notes.length) {
        return null;
    }
    const updated = updater(notes[noteIndex]);
    notes[noteIndex] = updated;
    saveNotes(notes);
    return updated;
}

function searchNotes(query) {
    const notes = getNotes();
    const lowerQuery = String(query || '').trim().toLowerCase();
    if (!lowerQuery) return [];
    return notes
        .map((note, index) => normalizeNoteItem(note, index + 1))
        .filter((note) => {
            const tagText = note.tags.join(' ').toLowerCase();
            return note.title.toLowerCase().includes(lowerQuery) || note.content.toLowerCase().includes(lowerQuery) || tagText.includes(lowerQuery);
        });
}

function addStructuredNote(title, content, tags = []) {
    const notes = getNotes();
    notes.push({
        title: String(title || '').trim() || `Note ${notes.length + 1}`,
        content: String(content || ''),
        tags: Array.isArray(tags) ? tags.map((tag) => String(tag).trim()).filter(Boolean) : [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    });
    saveNotes(notes);
    displayMessage('Note added!');
}

function listNotes() {
    const notes = getNotes();
    const terminal = document.querySelector('.terminal');
    const output = document.createElement('div');
    output.className = 'command-output';
    const responseColor = getComputedStyle(document.documentElement).getPropertyValue('--response-color') || '#ffffff';
    output.style.color = responseColor;
    output.textContent = 'Notes:';
    if (notes.length === 0) {
        const empty = document.createElement('div');
        empty.textContent = 'No notes found. Use "create note "text"" to add one.';
        output.appendChild(empty);
    } else {
        notes.forEach((note, idx) => {
            const normalized = normalizeNoteItem(note, idx + 1);
            const noteEl = document.createElement('div');
            const preview = normalized.content.length > 72 ? `${normalized.content.slice(0, 72)}...` : normalized.content;
            const tagText = normalized.tags.length ? ` [${normalized.tags.join(', ')}]` : '';
            noteEl.textContent = `${idx + 1}. ${normalized.title}: ${preview}${tagText}`;
            output.appendChild(noteEl);
        });
    }
    terminal.appendChild(output);
    createNewCommandLine();
    window.scrollTo(0, document.body.scrollHeight);
}

function addNote(text) {
    const notes = getNotes();
    notes.push(text);
    saveNotes(notes);
    displayMessage('Note added!');
}

function editNote(token, content) {
    const notes = getNotes();
    const index = findNoteIndexByToken(notes, token);
    if (index < 0) {
        displayMessage('Note not found.');
        return;
    }

    const current = notes[index];
    if (current && typeof current === 'object' && !Array.isArray(current)) {
        notes[index] = {
            ...current,
            content: String(content || ''),
            updatedAt: new Date().toISOString(),
        };
    } else {
        notes[index] = String(content || '');
    }

    saveNotes(notes);
    displayMessage('Note updated.');
}

function tagNote(token, tags) {
    const notes = getNotes();
    const index = findNoteIndexByToken(notes, token);
    if (index < 0) {
        displayMessage('Note not found.');
        return;
    }

    const current = notes[index];
    const normalizedTags = tags.map((tag) => String(tag).trim()).filter(Boolean);
    if (current && typeof current === 'object' && !Array.isArray(current)) {
        const existingTags = Array.isArray(current.tags) ? current.tags : [];
        notes[index] = {
            ...current,
            tags: Array.from(new Set([...existingTags, ...normalizedTags])),
            updatedAt: new Date().toISOString(),
        };
    } else {
        notes[index] = {
            title: `Note ${index + 1}`,
            content: String(current ?? ''),
            tags: normalizedTags,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };
    }

    saveNotes(notes);
    displayMessage('Note tags updated.');
}

function deleteNote(index) {
    const notes = getNotes();
    if (index < 1 || index > notes.length) {
        displayMessage('Invalid note index.');
        return;
    }
    notes.splice(index - 1, 1);
    saveNotes(notes);
    displayMessage('Note deleted.');
}

function getSessions() {
    try {
        const raw = localStorage.getItem('sessions');
        const obj = raw ? JSON.parse(raw) : {};
        return typeof obj === 'object' && obj !== null ? obj : {};
    } catch (_) {
        return {};
    }
}

function saveSessions(sessions) {
    localStorage.setItem('sessions', JSON.stringify(sessions || {}));
}

function saveSession(id) {
    if (typeof chrome !== 'undefined' && chrome.tabs && chrome.windows) {
        chrome.windows.getCurrent({ populate: true }, (currentWindow) => {
            if (chrome.runtime.lastError || !currentWindow) {
                displayMessage('Error: Could not access current window.');
                return;
            }

            const tabs = currentWindow.tabs || [];
            const urls = tabs.map(tab => tab.url).filter(url => url && !url.startsWith('chrome://') && !url.startsWith('chrome-extension://'));

            if (urls.length === 0) {
                displayMessage('No valid tabs to save in current window.');
                return;
            }

            const sessions = getSessions();
            sessions[id] = {
                urls: urls,
                timestamp: new Date().toISOString(),
                count: urls.length
            };
            saveSessions(sessions);
            displayMessage(`Session "${id}" saved with ${urls.length} tab(s).`);
        });
    } else {
        displayMessage('Error: Browser tabs API not available.');
    }
}

function loadSession(id) {
    const sessions = getSessions();
    const session = sessions[id];

    if (!session || !session.urls || session.urls.length === 0) {
        displayMessage(`Session "${id}" not found or empty.`);
        return;
    }

    session.urls.forEach((url) => {
        window.open(url, '_blank');
    });

    displayMessage(`Loaded session "${id}" with ${session.urls.length} tab(s).`);
}

function listSessions() {
    const sessions = getSessions();
    const ids = Object.keys(sessions);
    const terminal = document.querySelector('.terminal');
    const output = document.createElement('div');
    output.className = 'command-output';
    const responseColor = getComputedStyle(document.documentElement).getPropertyValue('--response-color') || '#ffffff';
    output.style.color = responseColor;
    output.textContent = 'Sessions:';
    if (ids.length === 0) {
        const empty = document.createElement('div');
        empty.textContent = 'No sessions found. Use "save session <id>" to create one.';
        output.appendChild(empty);
    } else {
        ids.forEach((id, idx) => {
            const session = sessions[id];
            const idEl = document.createElement('div');
            const date = session.timestamp ? new Date(session.timestamp).toLocaleString() : 'Unknown';
            idEl.textContent = `${idx + 1}. ${id} (${session.count || 0} tabs, saved: ${date})`;
            output.appendChild(idEl);
        });
    }
    terminal.appendChild(output);
    createNewCommandLine();
    window.scrollTo(0, document.body.scrollHeight);
}

function deleteSession(id) {
    const sessions = getSessions();
    if (!sessions[id]) {
        displayMessage('Session not found.');
        return;
    }
    delete sessions[id];
    saveSessions(sessions);
    displayMessage(`Session "${id}" deleted.`);
}

function addUrlToFlow(id, url) {
    const flows = getFlows();
    if (!flows[id]) {
        displayMessage('Flow not found.');
        return;
    }
    flows[id].push(url);
    saveFlows(flows);
    displayMessage(`URL added to flow "${id}".`);
}

function removeUrlFromFlow(id, url) {
    const flows = getFlows();
    if (!flows[id]) {
        displayMessage('Flow not found.');
        return;
    }
    const idx = flows[id].indexOf(url);
    if (idx === -1) {
        displayMessage('URL not found in flow.');
        return;
    }
    flows[id].splice(idx, 1);
    saveFlows(flows);
    displayMessage(`URL removed from flow "${id}".`);
}

function exportFlow(id) {
    const flows = getFlows();
    if (!flows[id]) {
        displayMessage('Flow not found.');
        return;
    }
    const jsonStr = JSON.stringify(flows[id]);
    displayMessage(`Flow "${id}" export:\n${jsonStr}`);
}

function importFlow(id, jsonStr) {
    try {
        const urls = JSON.parse(jsonStr);
        if (!Array.isArray(urls)) throw new Error('Not an array');
        const flows = getFlows();
        flows[id] = urls;
        saveFlows(flows);
        displayMessage(`Flow "${id}" imported.`);
    } catch (e) {
        displayMessage('Invalid flow JSON.');
    }
}

function copyFlow(id, newId) {
    const flows = getFlows();
    if (!flows[id]) {
        displayMessage('Flow not found.');
        return;
    }
    if (flows[newId]) {
        displayMessage(`Flow "${newId}" already exists.`);
        return;
    }
    flows[newId] = [...flows[id]];
    saveFlows(flows);
    displayMessage(`Flow copied from "${id}" to "${newId}".`);
}

function exportNotes() {
    const notes = getNotes();
    const jsonStr = JSON.stringify(notes);
    displayMessage(`Notes export:\n${jsonStr}`);
}

function importNotes(jsonStr) {
    try {
        const imported = JSON.parse(jsonStr);
        if (!Array.isArray(imported)) throw new Error('Not an array');
        const notes = getNotes();
        notes.push(...imported);
        saveNotes(notes);
        displayMessage(`Imported ${imported.length} notes.`);
    } catch (e) {
        displayMessage('Invalid notes JSON.');
    }
}

function getScripts() {
    try {
        const raw = localStorage.getItem('scripts');
        const obj = raw ? JSON.parse(raw) : {};
        return typeof obj === 'object' && obj !== null ? obj : {};
    } catch (_) {
        return {};
    }
}

function saveScripts(scripts) {
    localStorage.setItem('scripts', JSON.stringify(scripts || {}));
}

function createScript(name) {
    const scripts = getScripts();
    if (scripts[name]) {
        displayMessage('Script already exists.');
        return;
    }
    const commands = [];
    function promptCommand() {
        requestTerminalInput(`Enter command #${commands.length + 1} (type 'exit' to finish):`, (input) => {
            if (!input || input.toLowerCase() === 'exit') {
                scripts[name] = commands;
                saveScripts(scripts);
                displayMessage(`Script "${name}" created with ${commands.length} commands.`);
                return;
            }
            commands.push(input);
            promptCommand();
        });
    }
    promptCommand();
}

function runScript(name) {
    const scripts = getScripts();
    if (!scripts[name]) {
        displayMessage('Script not found.');
        return;
    }
    const commands = scripts[name];
    if (commands.length === 0) {
        displayMessage('Script is empty.');
        return;
    }
    commands.forEach(cmd => {
        const dummyLine = document.createElement('div');
        executeCommand(cmd, dummyLine);
    });
}
