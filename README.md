# CLI Browser Extension

A terminal-style browser extension that replaces your new tab page with a command-line interface for browsing the web.

## Features

- 🖥️ **Terminal Interface** - Full terminal-style UI with command prompt
- ⌨️ **Command System** - Execute commands to navigate, search, and manage bookmarks
- 📚 **Custom Bookmarks** - Create organized bookmarks with nested folders
- ⭐ **Favorites** - Quick access to frequently visited sites
- 📝 **Notes** - Store notes locally
- 🔄 **Flows** - Create groups of URLs to open together
- 📜 **Command History** - Navigate previous commands with arrow keys
- 🎨 **Customizable Appearance** - Change colors, background, and blur effects
- 🔍 **Search Integration** - Direct Google search from the terminal
- 📖 **Browser History** - Access your browsing history from the terminal

## Installation

### Install from GitHub

1. **Download the extension**

   ```bash
   git clone https://github.com/v-aibha-v-jain/clibrowser.git
   ```

   Or download the ZIP file from GitHub and extract it.

2. **Open Chrome/Edge Extensions Page**

   - Chrome: Navigate to `chrome://extensions/`
   - Edge: Navigate to `edge://extensions/`
   - Or click the three dots menu → Extensions → Manage Extensions

3. **Enable Developer Mode**

   - Toggle the "Developer mode" switch in the top right corner

4. **Load the extension**

   - Click "Load unpacked"
   - Select the folder where you extracted/cloned the extension
   - The CLI Browser Extension should now appear in your extensions list

5. **Start using**
   - Open a new tab and start typing commands!

## Available Commands

### Navigation & Basic Commands

| Command          | Description                                   |
| ---------------- | --------------------------------------------- |
| `help`           | Show help message with all available commands |
| `clear`          | Clear the screen (keeps history)              |
| `open <url>`     | Open a URL in a new tab                       |
| `open settings`  | Open settings modal                           |
| `open history`   | Show browsing history                         |
| `search <query>` | Search Google for the query                   |
| `--clear-history`| Clear all browsing history                    |
| `<url>`          | Navigate to URL (auto-detects URLs)           |
| `<text>`         | Search Google for text                        |

### Directory Navigation

| Command             | Description                                        |
| ------------------- | -------------------------------------------------- |
| `cd fav`            | List all favorites                                 |
| `cd fav <index>`    | Open favorite by index number                      |
| `cd fav <name>`     | Open favorite by name (searches title)             |
| `cd bm`             | List all custom bookmarks                          |
| `cd bm <folder>`    | List bookmarks in a specific folder                |
| `cd bm <path>`      | List bookmarks in nested folder (use folder1/sub1) |
| `cd bm <index>`     | Open bookmark by index number                      |
| `cd bm <name>`      | Open bookmark by name                              |
| `cd notes`          | List all notes                                     |
| `cd flow <id>`      | List all URLs in a flow                            |
| `cd history`        | List browsing history (page 1)                     |
| `cd history <page>` | List browsing history (specific page)              |
| `cd ..`             | Go up to parent directory                          |

### Bookmark Management

| Command                         | Description                                   |
| ------------------------------- | --------------------------------------------- |
| `mkdir "name" "url"`            | Create a bookmark (inside bookmark directory) |
| `mkdir`                         | Create a bookmark interactively               |
| `rmdir <name>`                  | Remove a bookmark folder                      |
| `mkbm "name" "url"`             | Create bookmark at current location           |
| `mkbm folder/path "name" "url"` | Create bookmark in nested path                |
| `rmbm <name>`                   | Remove a bookmark                             |
| `rmbm folder/path/name`         | Remove a bookmark from nested path            |

### Favorites Management

| Command             | Description                         |
| ------------------- | ----------------------------------- |
| `mkfv`              | Create a new favorite (interactive) |
| `mkfv "name" "url"` | Create a favorite directly          |
| `rmfv <index>`      | Remove a favorite by index          |
| `rmfv <name>`       | Remove a favorite by name           |

### Notes Management

| Command               | Description            |
| --------------------- | ---------------------- |
| `create note "text"`  | Create a note          |
| `delete note <index>` | Delete a note by index |

### Flow Management

| Command            | Description                                      |
| ------------------ | ------------------------------------------------ |
| `create flow <id>` | Create a new flow (enter URLs, 'exit' to finish) |
| `delete flow <id>` | Delete a flow                                    |
| `--flow <id>`      | Open all URLs in a flow in new tabs              |

### History Management

| Command            | Description                                      |
| ------------------ | ------------------------------------------------ |
| `cd history`       | List browsing history                            |
| `--clear-history`  | Clear all browsing history                       |

## Project Structure

```
cli/
├── .gitignore                     # Git ignore file
├── COMMANDS.md                    # Detailed command reference
├── README.md                      # This file
├── manifest.json                  # Chrome extension manifest
├── newtab.html                    # New tab page HTML
├── popup.html                     # Extension popup HTML
├── icons/                         # Extension icons
│   ├── README.md                  # Icon documentation
│   ├── icon.png                   # Main icon
│   ├── icon16.png                 # 16x16 icon
│   ├── icon32.png                 # 32x32 icon
│   ├── icon48.png                 # 48x48 icon
│   └── icon128.png                # 128x128 icon
├── scripts/                       # JavaScript files
│   ├── newtab.js                  # New tab functionality
│   ├── popup.js                   # Popup functionality
│   └── settings.js                # Settings functionality
└── styles/                        # CSS files
    ├── newtab.css                 # New tab styles
    ├── popup.css                  # Popup styles
    └── settings.css               # Settings styles
```

## Usage Examples

### Basic Navigation

```bash
browser> cd bm
# Lists all bookmarks

browser/bm> cd work
# Navigate to 'work' folder

browser/bm/work> cd ..
# Go back to parent directory
```

### Creating Bookmarks

```bash
browser> cd bm
browser/bm> mkbm "GitHub" "https://github.com"
# Creates a bookmark at current location

browser/bm> mkbm work/projects "MyProject" "https://github.com/user/project"
# Creates a bookmark in nested path
```

### Managing Favorites

```bash
browser> mkfv "Google" "https://google.com"
# Creates a favorite

browser> cd fav
# Lists all favorites

browser/fav> open 1
# Opens the first favorite
```

### Using Flows

```bash
browser> create flow morning
# Enter URLs one by one, type 'exit' when done

browser> --flow morning
# Opens all URLs in the 'morning' flow

browser> --clear-history
# Clears all browsing history
```

## Customization

Open settings by typing `open settings` in the terminal to customize:

- **Prompt Color** - Change the color of the command prompt
- **Response Color** - Change the color of command responses
- **Text Color** - Change the general text color
- **Background Color** - Change the terminal background color
- **Background Image** - Set a custom background image (URL)

## Tips

1. **Quick Search**: Just type any text and press Enter to search Google
2. **Auto URL Detection**: Type a URL and it will automatically open in a new tab
3. **Command History**: Use Up/Down arrow keys to navigate through previous commands
4. **Tab Completion**: Use Tab key for auto-completion (coming soon)
5. **Nested Bookmarks**: Organize bookmarks in folders like `work/projects/web`


# Contributors 🌟

Contributions are welcome! Please feel free to submit a Pull Request.

Thank you to all the amazing people who have contributed to CLI Browser!

<div align="center">

[![Contributors](https://contrib.rocks/image?repo=v-aibha-v-jain/clibrowser)](https://github.com/v-aibha-v-jain/clibrowser/graphs/contributors)

</div>

## License

MIT License - feel free to use this project for personal or commercial purposes.

## Credits

Created with ❤️ for terminal enthusiasts who prefer keyboard-driven browsing.
