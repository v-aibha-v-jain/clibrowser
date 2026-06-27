function tokenizeCommandLine(commandLine) {
    if (!commandLine) return [];
    const matches = String(commandLine).match(/(?:[^\s"]+|"[^"]*")+/g) || [];
    return matches.map((part) => part.replace(/^"|"$/g, ''));
}

function getStoredJson(key, fallback) {
    try {
        const raw = localStorage.getItem(key);
        if (!raw) return fallback;
        return JSON.parse(raw);
    } catch (_) {
        return fallback;
    }
}

function setStoredJson(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
}

function normalizeUrl(input) {
    const value = String(input || '').trim();
    if (!value) return '';
    if (/^(https?:|file:|chrome:|chrome-extension:|about:|data:)/i.test(value)) {
        return value;
    }
    if (/^[a-zA-Z]:[\\/]/.test(value)) {
        return 'file:///' + value.replace(/\\/g, '/');
    }
    if (/^\/\//.test(value)) {
        return 'https:' + value;
    }
    return value.includes(' ') ? `https://www.google.com/search?q=${encodeURIComponent(value)}` : `https://${value}`;
}

function openNormalizedTarget(target, openFn) {
    const url = normalizeUrl(target);
    if (!url) return;
    if (typeof openFn === 'function') {
        openFn(url);
    } else {
        window.open(url, '_blank');
    }
}

function getCommandAliases() {
    return getStoredJson('commandAliases', {});
}

function saveCommandAliases(aliases) {
    setStoredJson('commandAliases', aliases || {});
}

function resolveAliasCommand(commandLine) {
    const tokens = tokenizeCommandLine(commandLine);
    if (tokens.length === 0) return commandLine;
    const aliases = getCommandAliases();
    const aliasValue = aliases[tokens[0].toLowerCase()];
    if (!aliasValue) return commandLine;
    const suffix = tokens.slice(1).join(' ');
    return suffix ? `${aliasValue} ${suffix}` : aliasValue;
}

function describeCurrentBrowserUser() {
    const alias = getStoredJson('browserProfileName', 'browser');
    return typeof alias === 'string' && alias.trim() ? alias.trim() : 'browser';
}

function formatBrowserDate(mode) {
    const now = new Date();
    const pad2 = (n) => String(n).padStart(2, '0');
    const dateStr = `${now.getFullYear()}-${pad2(now.getMonth() + 1)}-${pad2(now.getDate())}`;
    const time24 = `${pad2(now.getHours())}:${pad2(now.getMinutes())}:${pad2(now.getSeconds())}`;
    const hours12Raw = now.getHours() % 12 || 12;
    const time12 = `${pad2(hours12Raw)}:${pad2(now.getMinutes())}:${pad2(now.getSeconds())} ${now.getHours() >= 12 ? 'PM' : 'AM'}`;

    if (mode === 'time') return time24;
    if (mode === 'time12') return time12;
    if (mode === 'date') return dateStr;

    const tzParts = Intl.DateTimeFormat('en-US', { timeZoneName: 'short' }).formatToParts(now);
    const tzPart = tzParts.find((part) => part.type === 'timeZoneName');
    return `${dateStr} ${time24} ${tzPart ? tzPart.value : ''}`.trim();
}

function getBookmarkShortcuts() {
    return getStoredJson('bookmarkShortcuts', {});
}

function saveBookmarkShortcuts(shortcuts) {
    setStoredJson('bookmarkShortcuts', shortcuts || {});
}

function normalizeShortcutKey(key) {
    return String(key || '').trim().toLowerCase();
}

function setBookmarkShortcut(key, entry) {
    const shortcuts = getBookmarkShortcuts();
    const normalizedKey = normalizeShortcutKey(key);
    if (!normalizedKey) return false;
    shortcuts[normalizedKey] = {
        key: normalizedKey,
        name: String(entry && entry.name ? entry.name : normalizedKey),
        url: String(entry && entry.url ? entry.url : ''),
        createdAt: new Date().toISOString(),
    };
    saveBookmarkShortcuts(shortcuts);
    return true;
}

function removeBookmarkShortcut(key) {
    const shortcuts = getBookmarkShortcuts();
    const normalizedKey = normalizeShortcutKey(key);
    if (!normalizedKey || !shortcuts[normalizedKey]) return false;
    delete shortcuts[normalizedKey];
    saveBookmarkShortcuts(shortcuts);
    return true;
}

function resolveBookmarkShortcut(key) {
    const shortcuts = getBookmarkShortcuts();
    return shortcuts[normalizeShortcutKey(key)] || null;
}

function getCurrentActiveTabUrl(callback) {
    if (typeof chrome !== 'undefined' && chrome.tabs && chrome.tabs.query) {
        try {
            chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
                if (chrome.runtime && chrome.runtime.lastError) {
                    callback(null);
                    return;
                }
                const activeTab = tabs && tabs[0];
                callback(activeTab && activeTab.url ? activeTab.url : null);
            });
            return;
        } catch (_) {
            callback(null);
            return;
        }
    }
    callback(null);
}

function getClipboardHistory() {
    return getStoredJson('terminalClipboardHistory', []);
}

function saveClipboardHistory(history) {
    setStoredJson('terminalClipboardHistory', Array.isArray(history) ? history : []);
}

function getSavedClipboardItems() {
    return getStoredJson('savedClipboardItems', {});
}

function saveSavedClipboardItems(items) {
    setStoredJson('savedClipboardItems', items || {});
}

function setTerminalClipboard(text) {
    const value = String(text ?? '');
    localStorage.setItem('terminal_clipboard', value);
    const history = getClipboardHistory();
    history.unshift({ value, timestamp: new Date().toISOString() });
    saveClipboardHistory(history.slice(0, 50));
    return value;
}

function getTerminalClipboard() {
    return localStorage.getItem('terminal_clipboard') || '';
}

function saveClipboardSlot(name, value) {
    const items = getSavedClipboardItems();
    const key = String(name || '').trim().toLowerCase();
    if (!key) return false;
    items[key] = {
        name: key,
        value: String(value ?? ''),
        updatedAt: new Date().toISOString(),
    };
    saveSavedClipboardItems(items);
    return true;
}

function removeClipboardSlot(name) {
    const items = getSavedClipboardItems();
    const key = String(name || '').trim().toLowerCase();
    if (!key || !items[key]) return false;
    delete items[key];
    saveSavedClipboardItems(items);
    return true;
}


