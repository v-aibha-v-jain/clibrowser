(function () {
  // --- helpers: storage ---
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

  // --- UI helpers ---
  const terminal = document.querySelector(".terminal");
  function appendOutput(text, cls) {
    const d = document.createElement("div");
    d.className = cls || "command-output";
    d.textContent = text;
    terminal.appendChild(d);
    terminal.scrollTop = terminal.scrollHeight;
  }
  function createCommandLine() {
    const line = document.createElement("div");
    line.className = "command-line";
    const prompt = document.createElement("span");
    prompt.className = "prompt";
    prompt.textContent = "Browser >";
    const input = document.createElement("input");
    input.type = "text";
    input.spellcheck = false;
    input.autocomplete = "off";
    input.style.flex = "1";
    line.appendChild(prompt);
    line.appendChild(input);
    terminal.appendChild(line);
    input.focus();
    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        const cmd = input.value.trim();
        freezeLine(line, cmd);
        handleCommand(cmd);
      }
    });
  }
  function freezeLine(line, text) {
    const input = line.querySelector("input");
    if (!input) return;
    const span = document.createElement("span");
    span.className = "frozen";
    span.textContent = text;
    line.replaceChild(span, input);
  }

  // --- chrome helper ---
  function getCurrentTabUrl(cb) {
    if (chrome && chrome.tabs && chrome.tabs.query) {
      try {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
          if (!tabs || tabs.length === 0) return cb(null);
          const t = tabs[0];
          cb(t && t.url ? t.url : null);
        });
      } catch (e) {
        cb(null);
      }
    } else {
      cb(null);
    }
  }

  // --- bookmark helpers (nested) ---
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
    // navigate to parent
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

  // --- command handlers ---
  function handleCommand(line) {
    if (!line) {
      createCommandLine();
      return;
    }
    const parts = line.match(/(?:[^\s"]+|"[^"]*")+/g) || [];
    const cmd = (parts[0] || "").toLowerCase();
    const args = parts.slice(1).map((s) => s.replace(/^"|"$/g, ""));

    if (cmd === "mkbm") {
      // mkbm <name>  OR mkbm <path> <name>
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
      // rmbm <name> OR rmbm <path>/<name>
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
      // mkfv <name> -> use current tab URL
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
      // note <text>
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

    if (cmd === "clip" && args[0]) {
      const action = args[0].toLowerCase();

      // CLIP COPY
      if (action === "copy" && args[1]) {
        // Join all remaining args as the content
        const content = args.slice(1).join(" ");
        // Save to localStorage (extension clipboard)
        localStorage.setItem("terminal_clipboard", content);
        appendOutput("Copied to clipboard!");
        createCommandLine();
        return;
      }

      // CLIP PASTE
      if (action === "paste") {
        // Read from localStorage
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

    // fallback: echo / help
    if (cmd === "help") {
      appendOutput("Commands: mkbm, rmbm, mkfv, rmfv, note");
      createCommandLine();
      return;
    }

    appendOutput('Unknown command. Type "help" for commands.');
    createCommandLine();
  }

  // --- init popup terminal ---
  createCommandLine();

  // expose for debugging (optional)
  window._popupTerminal = { getCustomBookmarks, getCustomFavorites, getNotes };
})();

document.addEventListener("DOMContentLoaded", function () {
  const toggle = document.getElementById("popup-terminal-bubble-toggle");
  // Load current value
  chrome.storage.local.get({ showTerminalBubble: true }, (data) => {
    toggle.checked = !!data.showTerminalBubble;
  });
  // Save on change
  toggle.onchange = function () {
    chrome.storage.local.set({ showTerminalBubble: toggle.checked });
  };
});
