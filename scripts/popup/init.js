(function () {

    createCommandLine();

    window._popupTerminal = { getCustomBookmarks, getCustomFavorites, getNotes };
})();

document.addEventListener("DOMContentLoaded", function () {
    const toggle = document.getElementById("popup-terminal-bubble-toggle");

    chrome.storage.local.get({ showTerminalBubble: true }, (data) => {
        toggle.checked = !!data.showTerminalBubble;
    });

    toggle.onchange = function () {
        chrome.storage.local.set({ showTerminalBubble: toggle.checked });
    };
});
