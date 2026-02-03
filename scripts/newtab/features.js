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
            urlEl.addEventListener('click', () => window.open(url.startsWith('http') ? url : `https://${url}`, '_blank'));
            output.appendChild(urlEl);
        });
    }
    terminal.appendChild(output);
    createNewCommandLine();
    window.scrollTo(0, document.body.scrollHeight);
}

function openFlow(id) {
    const flows = getFlows();
    const urls = flows[id] || [];
    if (!urls.length) {
        displayMessage('No URLs in this flow.');
        return;
    }
    urls.forEach((url) => {
        window.open(url.startsWith('http') ? url : `https://${url}`, '_blank');
    });
    displayMessage(`Opened ${urls.length} URLs from flow "${id}".`);
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
            const noteEl = document.createElement('div');
            noteEl.textContent = `${idx + 1}. ${note}`;
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
