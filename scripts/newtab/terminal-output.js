function listFavorites() {
    if (chrome && chrome.bookmarks) {
        chrome.bookmarks.getTree((bookmarkTree) => {
            const favoriteItems = [];

            function processNode(node) {
                if (node.title === 'Favorites' || node.title === 'Bookmarks Bar' || node.title === 'Bookmarks bar') {
                    if (node.children) {
                        node.children.forEach((child, index) => {
                            if (child.url) {
                                favoriteItems.push({ title: child.title, url: child.url });
                            }
                        });
                    }
                }

                if (node.children) {
                    node.children.forEach(processNode);
                }
            }

            bookmarkTree.forEach(processNode);

            if (favoriteItems.length > 0) {
                displayCommandOutput('Browser Favorites:', favoriteItems, 'fav', 0);
            }

            listCustomFavorites();
        });
    } else {
        showPermissionHelp('bookmarks');
    }
}

function listBookmarks() {
    if (chrome && chrome.bookmarks) {
        chrome.bookmarks.getTree((bookmarkTree) => {
            const bookmarkItems = [];

            function processNode(node) {
                if (node.url) {
                    bookmarkItems.push({ title: node.title, url: node.url });
                }

                if (node.children) {
                    node.children.forEach(processNode);
                }
            }

            bookmarkTree.forEach(processNode);

            if (bookmarkItems.length > 0) {
                displayCommandOutput('Browser Bookmarks:', bookmarkItems, 'bookmark', 0);
            }

            listCustomBookmarks();
        });
    } else {
        alert('Bookmarks feature requires browser permissions. Please check manifest.json');
    }
}

function openFavoriteByIndexOrName(indexOrName) {
    if (chrome && chrome.bookmarks) {
        chrome.bookmarks.getTree((bookmarkTree) => {
            const favoriteItems = [];

            function processNode(node) {
                if (node.title === 'Favorites' || node.title === 'Bookmarks Bar' || node.title === 'Bookmarks bar') {
                    if (node.children) {
                        node.children.forEach((child, index) => {
                            if (child.url) {
                                favoriteItems.push({ title: child.title, url: child.url });
                            }
                        });
                    }
                }

                if (node.children) {
                    node.children.forEach(processNode);
                }
            }

            bookmarkTree.forEach(processNode);

            if (!isNaN(indexOrName)) {
                const idx = parseInt(indexOrName) - 1;
                if (idx >= 0 && idx < favoriteItems.length) {
                    window.open(favoriteItems[idx].url, '_blank');
                    displayMessage(`Opening [${idx + 1}] ${favoriteItems[idx].title}`);
                    return;
                }
            } else {
                const favorite = favoriteItems.find(item =>
                    item.title.toLowerCase() === indexOrName.toLowerCase()
                );

                if (favorite) {
                    window.open(favorite.url, '_blank');
                    displayMessage(`Opening ${favorite.title}`);
                    return;
                }
            }

            const customFavs = getCustomFavorites();

            if (!isNaN(indexOrName)) {
                const adjustedIdx = parseInt(indexOrName) - 1 - favoriteItems.length;
                if (adjustedIdx >= 0 && adjustedIdx < customFavs.length) {
                    window.open(customFavs[adjustedIdx].url.startsWith('http') ?
                        customFavs[adjustedIdx].url : `https://${customFavs[adjustedIdx].url}`, '_blank');
                    displayMessage(`Opening [${indexOrName}] ${customFavs[adjustedIdx].name}`);
                    return;
                }
            } else {
                const customFav = customFavs.find(f => f.name.toLowerCase() === indexOrName.toLowerCase());
                if (customFav) {
                    window.open(customFav.url.startsWith('http') ? customFav.url : `https://${customFav.url}`, '_blank');
                    displayMessage(`Opening ${customFav.name}`);
                    return;
                }
            }

            displayMessage(`Favorite '${indexOrName}' not found`);
        });
    } else {
        showPermissionHelp('bookmarks');
    }
}

function openFavoriteByIndex(index) {
    openFavoriteByIndexOrName(index);
}

function openBookmarkByIndex(index) {
}

function listHistory(page = 1) {
    if (chrome && chrome.history) {
        const itemsPerPage = 10;
        const startIndex = (page - 1) * itemsPerPage;

        chrome.history.search({
            text: '',
            maxResults: 1000,
            startTime: 0
        }, (historyItems) => {
            const items = historyItems.slice(startIndex, startIndex + itemsPerPage)
                .map(item => ({ title: item.title || item.url, url: item.url }));

            displayCommandOutput(`Browsing History (Page ${page}):`, items, 'history', startIndex);
            displayMessage(`Showing page ${page} (items ${startIndex + 1}-${Math.min(startIndex + itemsPerPage, historyItems.length)} of ${historyItems.length})`);
        });
    } else {
        alert('History feature requires browser permissions. Please check manifest.json');
    }
}

function displayCommandOutput(title, items, type, startIndex = 0) {
    const terminal = document.querySelector('.terminal');

    const output = document.createElement('div');
    output.className = 'command-output';

    const responseColor = getComputedStyle(document.documentElement).getPropertyValue('--response-color') || '#ffffff';
    output.style.color = responseColor;

    const titleEl = document.createElement('div');
    titleEl.textContent = title;
    output.appendChild(titleEl);

    if (items.length === 0) {
        const emptyMsg = document.createElement('div');
        emptyMsg.textContent = 'No items found';
        output.appendChild(emptyMsg);
    } else {
        items.forEach((item, idx) => {
            const itemEl = document.createElement('div');
            itemEl.textContent = `${startIndex + idx + 1}. ${item.title || 'Untitled'}`;
            itemEl.style.cursor = 'pointer';
            itemEl.style.padding = '5px 0';

            itemEl.addEventListener('click', () => {
                window.open(item.url, '_blank');
            });

            itemEl.addEventListener('mouseenter', () => {
                itemEl.style.textDecoration = 'underline';
            });

            itemEl.addEventListener('mouseleave', () => {
                itemEl.style.textDecoration = 'none';
            });

            output.appendChild(itemEl);
        });
    }

    terminal.appendChild(output);

    createNewCommandLine();

    window.scrollTo(0, document.body.scrollHeight);
}
