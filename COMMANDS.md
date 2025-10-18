# CLI Browser Extension - Command Reference

This extension provides a terminal-style interface for browsing, searching, and managing bookmarks, favorites, notes, and more.

---

## 🚀 Installation (Quick)

1. Download or clone the repo from GitHub: `git clone https://github.com/v-aibha-v-jain/clibrowser.git`
2. Go to your browser's extensions page (e.g. `chrome://extensions/`)
3. Enable Developer Mode
4. Click "Load unpacked" and select the project directory
5. Open a new tab and start typing commands!

See the README for full details and troubleshooting.

---

## 🖥️ Terminal Commands

### General

| Command          | Description                                   |
| ---------------- | --------------------------------------------- |
| `help`           | Show help message with all available commands |
| `clear`          | Clear the screen (keeps history)              |
| `open <url>`     | Open a URL in a new tab                       |
| `open settings`  | Open settings modal                           |
| `open history`   | Show browsing history                         |
| `search <query>` | Search Google for the query                   |
| `<url>`          | Navigate to URL (auto-detects URLs)           |
| `<text>`         | Search Google for text                        |

### Navigation

| Command             | Description                                    |
| ------------------- | ---------------------------------------------- |
| `cd fav`            | List all favorites                             |
| `cd fav <index>`    | Open favorite by index number                  |
| `cd fav <name>`     | Open favorite by name (searches title)         |
| `cd bm`             | List all custom bookmarks                      |
| `cd bm <folder>`    | List bookmarks in a specific folder            |
| `cd bm <path>`      | List bookmarks in nested folder (folder1/sub1) |
| `cd bm <index>`     | Open bookmark by index number                  |
| `cd bm <name>`      | Open bookmark by name                          |
| `cd notes`          | List all notes                                 |
| `cd flow <id>`      | List all URLs in a flow                        |
| `cd history`        | List browsing history (page 1)                 |
| `cd history <page>` | List browsing history (specific page)          |
| `cd ..`             | Go up to parent directory                      |

### Bookmarks

| Command                         | Description                                   |
| ------------------------------- | --------------------------------------------- |
| `mkbm "name" "url"`             | Create bookmark at current location           |
| `mkbm folder/path "name" "url"` | Create bookmark in nested path                |
| `rmbm <name>`                   | Remove a bookmark                             |
| `rmbm folder/path/name`         | Remove a bookmark from nested path            |

### Favorites

| Command             | Description                         |
| ------------------- | ----------------------------------- |
| `mkfv`              | Create a new favorite (interactive) |
| `mkfv "name" "url"` | Create a favorite directly          |
| `rmfv <index>`      | Remove a favorite by index          |
| `rmfv <name>`       | Remove a favorite by name           |

### Notes

| Command               | Description            |
| --------------------- | ---------------------- |
| `create note "text"`  | Create a note          |
| `delete note <index>` | Delete a note by index |

### Flows

| Command            | Description                                      |
| ------------------ | ------------------------------------------------ |
| `create flow <id>` | Create a new flow (enter URLs, 'exit' to finish) |
| `delete flow <id>` | Delete a flow                                    |
| `--flow <id>`      | Open all URLs in a flow in new tabs              |

---

## 💡 Usage Examples

### Navigation

```
browser> cd bm
browser/bm> cd work
browser/bm/work> cd ..
```

### Creating Bookmarks

```
browser/bm> mkbm "GitHub" "https://github.com"
browser/bm> mkbm work/projects "MyProject" "https://github.com/user/project"
```

### Managing Favorites

```
browser> mkfv "Google" "https://google.com"
browser> cd fav
browser/fav> 1
```

### Using Flows

```
browser> create flow morning
browser> --flow morning
```

---

## 📁 Project Structure

```
cli/
├── .gitignore
├── COMMANDS.md
├── README.md
├── manifest.json
├── newtab.html
├── popup.html
├── icons/
│   ├── README.md
│   ├── icon.png
│   ├── icon16.png
│   ├── icon32.png
│   ├── icon48.png
│   └── icon128.png
├── scripts/
│   ├── newtab.js
│   ├── popup.js
│   └── settings.js
└── styles/
    ├── newtab.css
    ├── popup.css
    └── settings.css
```

---

For full documentation, troubleshooting, and customization tips, see the README.md file.
