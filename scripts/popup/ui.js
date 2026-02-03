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
