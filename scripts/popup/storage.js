function getCustomBookmarks() {
    try {
        const s = localStorage.getItem("customBookmarks");
        return s ? JSON.parse(s) : {};
    } catch {
        return {};
    }
}
function saveCustomBookmarks(b) {
    localStorage.setItem("customBookmarks", JSON.stringify(b || {}));
}

function getCustomFavorites() {
    try {
        const s = localStorage.getItem("customFavorites");
        return s ? JSON.parse(s) : [];
    } catch {
        return [];
    }
}
function saveCustomFavorites(f) {
    localStorage.setItem("customFavorites", JSON.stringify(f || []));
}

function getNotes() {
    try {
        const s = localStorage.getItem("notes");
        return s ? JSON.parse(s) : [];
    } catch {
        return [];
    }
}
function saveNotes(n) {
    localStorage.setItem("notes", JSON.stringify(n || []));
}

function getSessions() {
    try {
        const s = localStorage.getItem("sessions");
        return s ? JSON.parse(s) : {};
    } catch {
        return {};
    }
}
function saveSessions(sessions) {
    localStorage.setItem("sessions", JSON.stringify(sessions || {}));
}
