// List all flow ids
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
// =============================
// Flow Feature
// =============================
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
// =============================
// Notes Feature
// =============================
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
    empty.textContent = 'No notes found. Use "create note \"text\"" to add one.';
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
  displayMessage(`Note added!`);
}

function deleteNote(index) {
  const notes = getNotes();
  if (index < 1 || index > notes.length) {
    displayMessage(`Invalid note index.`);
    return;
  }
  notes.splice(index - 1, 1);
  saveNotes(notes);
  displayMessage(`Note deleted.`);
}
// Terminal state variables
let commandHistory = [];
let historyIndex = -1;
let currentTerminalPath = "browser"; // Default path
let currentTerminalPathDisplay = "browser"; // For display purposes

// Input queue for terminal-based user input (replaces prompt())
let inputQueue = [];
let isAwaitingInput = false;

// Permission help helper
function showPermissionHelp(permissionName) {
  const terminal = document.querySelector('.terminal');
  const output = document.createElement('div');
  output.className = 'command-output';
  output.style.whiteSpace = 'pre-wrap';
  const responseColor = getComputedStyle(document.documentElement).getPropertyValue('--response-color') || '#ffffff';
  output.style.color = responseColor;
  output.innerHTML = `The extension needs the <strong>${permissionName}</strong> permission to perform this action.\n` +
    `Please open the extension page (chrome://extensions), enable the required permissions for this extension, then reload the extension and try again.`;
  terminal.appendChild(output);
  createNewCommandLine();
}

// =============================
// Custom Favorites (no folders)
// =============================
function getCustomFavorites() {
  try {
    const raw = localStorage.getItem('customFavorites');
    const arr = raw ? JSON.parse(raw) : [];
    return Array.isArray(arr) ? arr : [];
  } catch (_) {
    return [];
  }
}

function saveCustomFavorites(favs) {
  localStorage.setItem('customFavorites', JSON.stringify(favs || []));
}

function listCustomFavorites() {
  const favs = getCustomFavorites();
  const items = favs.map((f) => ({ title: f.name, url: f.url }));
  if (items.length === 0) {
    displayMessage('No favorites found. Use "mkfv" to create one.');
  } else {
    displayCommandOutput('Custom Favorites:', items, 'fav', 0);
  }
}

// Custom Bookmarks Storage
function getCustomBookmarks() {
  const stored = localStorage.getItem('customBookmarks');
  return stored ? JSON.parse(stored) : {};
}

function saveCustomBookmarks(bookmarks) {
  localStorage.setItem('customBookmarks', JSON.stringify(bookmarks));
}

// Make bookmark
function makeBookmark(folder, name, url) {
  const bookmarks = getCustomBookmarks();
  
  if (folder) {
    // Add to folder
    if (!bookmarks[folder]) {
      bookmarks[folder] = {};
    }
    if (typeof bookmarks[folder] === 'object' && !bookmarks[folder].hasOwnProperty('length')) {
      bookmarks[folder][name] = url;
    } else {
      return `Error: "${folder}" is not a folder`;
    }
  } else {
    // Add to root
    bookmarks[name] = url;
  }
  
  saveCustomBookmarks(bookmarks);
  return `Bookmark "${name}" created successfully!`;
}

// Make bookmark at nested folder path: folders = ["folder", "sub1", ...]
function makeBookmarkAtPath(folders, name, url) {
  const bookmarks = getCustomBookmarks();
  let node = bookmarks;
  if (Array.isArray(folders)) {
    for (const raw of folders) {
      const folder = (raw || '').trim();
      if (!folder) continue;
      if (!node[folder]) {
        node[folder] = {};
      }
      if (typeof node[folder] === 'string') {
        return `Error: "${folder}" is not a folder`;
      }
      node = node[folder];
    }
  }
  node[name] = url;
  saveCustomBookmarks(bookmarks);
  return `Bookmark "${name}" created successfully!`;
}

// Remove bookmark
function removeBookmark(folder, name) {
  const bookmarks = getCustomBookmarks();
  
  if (folder) {
    // Remove from folder
    if (bookmarks[folder] && typeof bookmarks[folder] === 'object') {
      if (bookmarks[folder][name]) {
        delete bookmarks[folder][name];
        saveCustomBookmarks(bookmarks);
        return `Bookmark "${name}" removed from folder "${folder}"`;
      } else {
        return `Bookmark "${name}" not found in folder "${folder}"`;
      }
    } else {
      return `Folder "${folder}" not found`;
    }
  } else {
    // Remove from root
    if (bookmarks[name]) {
      if (typeof bookmarks[name] === 'string') {
        delete bookmarks[name];
        saveCustomBookmarks(bookmarks);
        return `Bookmark "${name}" removed`;
      } else {
        return `"${name}" is a folder, not a bookmark. Use "rmdir" to remove folders`;
      }
    } else {
      return `Bookmark "${name}" not found`;
    }
  }
}

// List custom bookmarks
function listCustomBookmarks(folder = null) {
  const bookmarks = getCustomBookmarks();
  const items = [];
  const folders = [];

  // Helper to resolve nested path like "folder1/sub1"
  function resolvePath(pathStr) {
    let node = bookmarks;
    const parts = (pathStr || '').split('/').filter(Boolean);
    for (const p of parts) {
      if (node && typeof node[p] === 'object') node = node[p];
      else return null;
    }
    return node;
  }

  if (folder) {
    // List contents of specific (possibly nested) folder
    const node = resolvePath(folder) || (typeof bookmarks[folder] === 'object' ? bookmarks[folder] : null);
    if (node) {
      Object.entries(node).forEach(([name, url]) => {
        if (typeof url === 'string') {
          items.push({ title: name, url });
        } else if (typeof url === 'object') {
          folders.push({ title: name, path: folder ? `${folder}/${name}` : name });
        }
      });

      if (items.length === 0 && folders.length === 0) {
        displayMessage(`Folder "${folder}" is empty`);
      } else {
        displayCustomBookmarks(`Contents of "${folder}":`, items, folders, folder);
      }
    } else {
      displayMessage(`Folder "${folder}" not found`);
    }
  } else {
    // List root bookmarks and folders
    Object.entries(bookmarks).forEach(([name, value]) => {
      if (typeof value === 'string') {
        items.push({ title: name, url: value });
      } else if (typeof value === 'object') {
        folders.push({ title: name, path: name });
      }
    });

    if (items.length === 0 && folders.length === 0) {
      displayMessage('No bookmarks found');
    } else {
      displayCustomBookmarks('Custom Bookmarks:', items, folders);
    }
  }
}

// Display custom bookmarks with separator
function displayCustomBookmarks(title, items, folders, currentPath = '') {
  const terminal = document.querySelector('.terminal');
  const output = document.createElement('div');
  output.className = 'command-output';
  
  // Apply response color
  const responseColor = getComputedStyle(document.documentElement).getPropertyValue('--response-color') || '#ffffff';
  output.style.color = responseColor;
  
  // Title
  const titleEl = document.createElement('div');
  titleEl.textContent = title; 
  // titleEl.style.marginBottom = '10px';
  output.appendChild(titleEl);
  
  // Bookmarks
  if (items.length > 0) {
    items.forEach((item, idx) => {
      const itemEl = document.createElement('div');
      itemEl.textContent = `${idx + 1}. ${item.title}`;
      itemEl.style.cursor = 'pointer';
      itemEl.style.padding = '5px 0';
      itemEl.addEventListener('click', () => {
        window.open(item.url.startsWith('http') ? item.url : `https://${item.url}`, '_blank');
      });
      output.appendChild(itemEl);
    });
  }
  
  // Separator
  if (items.length > 0 && folders.length > 0) {
    const separator = document.createElement('div');
    separator.textContent = '-----groups-----';
    separator.style.margin = '15px 0 10px 0';
    separator.style.opacity = '0.5';
    output.appendChild(separator);
  }
  
  // Folders
  if (folders.length > 0) {
    folders.forEach((folder, idx) => {
      const folderEl = document.createElement('div');
      folderEl.textContent = `📁 ${folder.title}/`;
      folderEl.style.cursor = 'pointer';
      folderEl.style.padding = '5px 0';
      folderEl.style.fontWeight = 'bold';
      folderEl.addEventListener('click', () => {
        // Handle cd to subfolder
        const newPath = `browser/bm${currentPath ? '/' + currentPath : ''}/${folder.title}`;
        currentTerminalPath = newPath;
        currentTerminalPathDisplay = newPath;
        listCustomBookmarks(folder.path);
      });
      output.appendChild(folderEl);
    });
  }
  
  terminal.appendChild(output);
  createNewCommandLine();
  window.scrollTo(0, document.body.scrollHeight);
}

// Display simple message
function displayMessage(message) {
  const terminal = document.querySelector('.terminal');
  const output = document.createElement('div');
  output.className = 'command-output';
  
  const responseColor = getComputedStyle(document.documentElement).getPropertyValue('--response-color') || '#ffffff';
  output.style.color = responseColor;
  
  output.textContent = message;
  terminal.appendChild(output);
  createNewCommandLine();
  window.scrollTo(0, document.body.scrollHeight);
}

// Handle cd command to change directory
function handleChangeDirectory(args) {
  // cd with no args - go back to root
  if (args.length === 0) {
    currentTerminalPath = "browser";
    currentTerminalPathDisplay = "browser";
    displayMessage("Returned to root path");
    return;
  }
  
  // cd .. - go up one level
  if (args[0] === '..') {
    const pathParts = currentTerminalPath.split('/');
    if (pathParts.length > 1) {
      pathParts.pop();
      currentTerminalPath = pathParts.join('/');
      currentTerminalPathDisplay = pathParts.join('/');
      displayMessage(`Changed to ${currentTerminalPathDisplay}`);
    } else {
      displayMessage("Already at root level");
    }
    return;
  }
  
  // Handle paths with multiple parts (e.g. cd bm/work/projects)
  if (args[0].includes('/')) {
    const pathParts = args[0].split('/').filter(Boolean);
    
    // Start from browser root for absolute paths
    let startPath = currentTerminalPath;
    if (pathParts[0] === 'bm' || pathParts[0] === 'flows' || 
        pathParts[0] === 'fav' || pathParts[0] === 'notes') {
      startPath = 'browser';
    }
    
    // Navigate each part of the path
    let currentPath = startPath;
    for (let i = 0; i < pathParts.length; i++) {
      const part = pathParts[i];
      
      // Determine the next path
      let nextPath;
      if (currentPath === 'browser') {
        if (part === 'bm' || part === 'flows' || part === 'fav' || part === 'notes') {
          nextPath = `browser/${part}`;
        } else {
          displayMessage(`Invalid path: ${part} not a valid section`);
          return;
        }
      } else if (currentPath.startsWith('browser/bm')) {
        // Navigate within bookmarks
        const bookmarks = getCustomBookmarks();
        let node = bookmarks;
        const currentParts = currentPath.split('/').slice(2);
        
        // Navigate to current position
        for (const p of currentParts) {
          if (node && typeof node[p] === 'object') {
            node = node[p];
          } else {
            displayMessage(`Invalid path: ${currentPath}`);
            return;
          }
        }
        
        // Check if target exists
        if (node[part] && typeof node[part] === 'object') {
          nextPath = `${currentPath}/${part}`;
        } else if (node[part] && typeof node[part] === 'string') {
          // It's a bookmark, open it
          const url = node[part];
          window.open(url.startsWith('http') ? url : `https://${url}`, '_blank');
          displayMessage(`Opening ${part}: ${url}`);
          return;
        } else {
          displayMessage(`Path not found: ${part}`);
          return;
        }
      } else {
        // Not in a path that supports nested navigation
        displayMessage(`Cannot navigate to ${args[0]}`);
        return;
      }
      
      // Move to next path
      currentPath = nextPath;
    }
    
    // Successfully navigated to the path
    currentTerminalPath = currentPath;
    currentTerminalPathDisplay = currentPath;
    
    // Auto-list the contents
    if (currentPath === 'browser/flows') {
      listAllFlows();
    } else if (currentPath === 'browser/fav') {
      listFavorites();
    } else if (currentPath.startsWith('browser/bm')) {
      const bmPath = currentPath.split('/').slice(2).join('/');
      listCustomBookmarks(bmPath || null);
    } else if (currentPath === 'browser/notes') {
      listNotes();
    }
    
    return;
  }
  
  const targetPath = args[0].toLowerCase();
  
  // Handle main paths from root
  if (currentTerminalPath === "browser" && 
      (targetPath === 'flows' || targetPath === 'fav' || targetPath === 'bm' || targetPath === 'notes')) {
    currentTerminalPath = `browser/${targetPath}`;
    currentTerminalPathDisplay = `browser/${targetPath}`;
    
    // Auto-list the contents of the new path
    if (targetPath === 'flows') {
      listAllFlows();
    } else if (targetPath === 'fav') {
      listFavorites();
    } else if (targetPath === 'bm') {
      listCustomBookmarks();
    } else if (targetPath === 'notes') {
      listNotes();
    }
    return;
  }
  
  // Handle subpaths for bookmarks
  if (currentTerminalPath.startsWith('browser/bm')) {
    const bookmarks = getCustomBookmarks();
    let currentNode = bookmarks;
    
    // Navigate from root to current path
    const currentParts = currentTerminalPath.split('/').slice(2);
    for (const part of currentParts) {
      if (currentNode && typeof currentNode[part] === 'object') {
        currentNode = currentNode[part];
      } else {
        displayMessage(`Invalid path: ${currentTerminalPath}`);
        return;
      }
    }
    
    // Check if target is a valid subfolder
    if (currentNode[targetPath] && typeof currentNode[targetPath] === 'object') {
      // It's a subfolder, cd into it
      currentTerminalPath = `${currentTerminalPath}/${targetPath}`;
      currentTerminalPathDisplay = `${currentTerminalPathDisplay}/${targetPath}`;
      listCustomBookmarks(currentParts.length > 0 ? `${currentParts.join('/')}/${targetPath}` : targetPath);
    } else if (currentNode[targetPath] && typeof currentNode[targetPath] === 'string') {
      // It's a bookmark, open it
      const url = currentNode[targetPath];
      window.open(url.startsWith('http') ? url : `https://${url}`, '_blank');
      displayMessage(`Opening ${targetPath}: ${url}`);
    } else if (!isNaN(targetPath) && parseInt(targetPath) > 0) {
      // Try to open by index
      const items = [];
      Object.entries(currentNode).forEach(([name, val]) => {
        if (typeof val === 'string') {
          items.push({ name, url: val });
        }
      });
      
      const idx = parseInt(targetPath) - 1;
      if (idx >= 0 && idx < items.length) {
        const item = items[idx];
        window.open(item.url.startsWith('http') ? item.url : `https://${item.url}`, '_blank');
        displayMessage(`Opening [${idx + 1}] ${item.name}: ${item.url}`);
      } else {
        displayMessage(`Invalid index: ${targetPath}`);
      }
    } else {
      displayMessage(`Subfolder or bookmark not found: ${targetPath}`);
    }
    return;
  }
  
  // Handle opening favorites by name when in fav path
  if (currentTerminalPath === 'browser/fav') {
    const favs = getCustomFavorites();
    // Try to find favorite by name
    const favorite = favs.find(f => f.name.toLowerCase() === targetPath.toLowerCase());
    if (favorite) {
      window.open(favorite.url.startsWith('http') ? favorite.url : `https://${favorite.url}`, '_blank');
      displayMessage(`Opening ${favorite.name}: ${favorite.url}`);
      return;
    }
    
    // Try by index
    if (!isNaN(targetPath)) {
      const idx = parseInt(targetPath) - 1;
      if (idx >= 0 && idx < favs.length) {
        const favorite = favs[idx];
        window.open(favorite.url.startsWith('http') ? favorite.url : `https://${favorite.url}`, '_blank');
        displayMessage(`Opening [${idx + 1}] ${favorite.name}: ${favorite.url}`);
        return;
      }
    }
    
    displayMessage(`Favorite '${targetPath}' not found`);
    return;
  }
  
  // Path not found
  displayMessage(`Unknown path: ${targetPath}`);
}

// Command input functionality
function setupCommandInput() {
  const commandInput = document.getElementById('commandInput');
  const commandLine = document.querySelector('.command-line');
  const cursor = document.querySelector('.cursor');
  const prompt = document.querySelector('.prompt');
  
  // Refocus on click anywhere in the document
  document.addEventListener('click', () => {
    const activeCommandLine = document.querySelector('.command-line:last-of-type');
    if (activeCommandLine) {
      const input = activeCommandLine.querySelector('input');
      if (input) input.focus();
    }
  });
  
  // Create a span to display typed text
  const typedText = document.createElement('span');
  typedText.style.whiteSpace = 'pre';
  commandLine.insertBefore(typedText, cursor);
  
  // Update displayed text and cursor position
  commandInput.addEventListener('input', () => {
    typedText.textContent = commandInput.value;
  });
  
  commandInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      const command = commandInput.value.trim();
      if (command) {
        commandHistory.push(command);
        historyIndex = commandHistory.length;
      }
      executeCommand(command, commandLine, typedText);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (historyIndex > 0) {
        historyIndex--;
        commandInput.value = commandHistory[historyIndex];
        typedText.textContent = commandInput.value;
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIndex < commandHistory.length - 1) {
        historyIndex++;
        commandInput.value = commandHistory[historyIndex];
        typedText.textContent = commandInput.value;
      } else if (historyIndex === commandHistory.length - 1) {
        historyIndex = commandHistory.length;
        commandInput.value = '';
        typedText.textContent = '';
      }
    }
  });
}

function createNewCommandLine() {
  const terminal = document.querySelector('.terminal');
  
  // Create new command line
  const newCommandLine = document.createElement('div');
  newCommandLine.className = 'command-line';
  
  // Create prompt
  const prompt = document.createElement('span');
  prompt.className = 'prompt';
  prompt.textContent = `${currentTerminalPathDisplay}>`;
  
  // Create cursor
  const cursor = document.createElement('span');
  cursor.className = 'cursor';
  cursor.textContent = '_';
  
  // Create typed text span
  const typedText = document.createElement('span');
  typedText.style.whiteSpace = 'pre';
  
  // Create input
  const input = document.createElement('input');
  input.type = 'text';
  input.id = 'commandInput';
  input.spellcheck = false;
  input.autocomplete = 'off';
  
  // Assemble command line
  newCommandLine.appendChild(prompt);
  newCommandLine.appendChild(typedText);
  newCommandLine.appendChild(cursor);
  newCommandLine.appendChild(input);
  
  // Add to terminal
  terminal.appendChild(newCommandLine);
  
  // Apply colors from settings
  const promptColor = getComputedStyle(document.documentElement).getPropertyValue('--prompt-color') || '#ffffff';
  const commandColor = getComputedStyle(document.documentElement).getPropertyValue('--command-color') || '#ffffff';
  prompt.style.color = promptColor;
  cursor.style.color = promptColor;
  typedText.style.color = commandColor;
  
  // Setup input handler
  input.addEventListener('input', () => {
    typedText.textContent = input.value;
  });
  
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      const command = input.value.trim();
      if (command) {
        commandHistory.push(command);
        historyIndex = commandHistory.length;
      }
      executeCommand(command, newCommandLine, typedText);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (historyIndex > 0) {
        historyIndex--;
        input.value = commandHistory[historyIndex];
        typedText.textContent = input.value;
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIndex < commandHistory.length - 1) {
        historyIndex++;
        input.value = commandHistory[historyIndex];
        typedText.textContent = input.value;
      } else if (historyIndex === commandHistory.length - 1) {
        historyIndex = commandHistory.length;
        input.value = '';
        typedText.textContent = '';
      }
    }
  });
  
  // Focus new input
  input.focus();
  
  // Scroll to bottom
  window.scrollTo(0, document.body.scrollHeight);
}

// Clear terminal screen but preserve command history
function clearTerminal() {
  // Get terminal element
  const terminal = document.querySelector('.terminal');
  
  // Remove all existing content while preserving history
  while (terminal.firstChild) {
    terminal.removeChild(terminal.firstChild);
  }
  
  // Create a new command line at the top
  createNewCommandLine();
  
  // Focus on the input
  const input = document.querySelector('#commandInput');
  if (input) {
    input.focus();
  }
  
  // Make sure the view starts at the top of the screen
  window.scrollTo(0, 0);
}

function executeCommand(command, commandLine, typedText) {
  const commandInput = commandLine.querySelector('input');
  const cmdParts = command.trim().split(/\s+/);
  const cmd = cmdParts[0].toLowerCase();
  const args = cmdParts.slice(1);
  
  // Freeze the current command line
  freezeCommandLine(commandLine, command);

  // Command: ls - list content based on current path
  if (cmd === 'ls') {
    // Check current path and list appropriate content
    const pathParts = currentTerminalPath.split('/');
    const root = pathParts[0];
    
    if (pathParts.length === 1 && root === 'browser') {
      // At root, show available paths
      const output = document.createElement('div');
      output.className = 'command-output';
      const responseColor = getComputedStyle(document.documentElement).getPropertyValue('--response-color') || '#ffffff';
      output.style.color = responseColor;
      
      const paths = [
        { name: 'flows/', description: 'Stored flow commands' },
        { name: 'fav/', description: 'Favorite websites' },
        { name: 'bm/', description: 'Bookmarks' },
        { name: 'notes/', description: 'Stored notes' }
      ];
      
      paths.forEach(path => {
        const pathEl = document.createElement('div');
        pathEl.textContent = `${path.name.padEnd(12)} ${path.description}`;
        pathEl.style.cursor = 'pointer';
        pathEl.addEventListener('click', () => {
          const targetPath = path.name.replace('/', '');
          handleChangeDirectory([targetPath]);
        });
        output.appendChild(pathEl);
      });
      
      document.querySelector('.terminal').appendChild(output);
      createNewCommandLine();
    } else if (pathParts.length > 1) {
      // In a subpath
      const subPath = pathParts[1];
      
      if (subPath === 'flows') {
        listAllFlows();
      } else if (subPath === 'fav') {
        listFavorites();
      } else if (subPath === 'bm') {
        // For bookmarks, handle nested paths
        const bmPath = pathParts.slice(2).join('/');
        listCustomBookmarks(bmPath);
      } else if (subPath === 'notes') {
        listNotes();
      }
    }
    return;
  }
  
  // Flow feature
  if (cmd === '--flow' && args[0]) {
    openFlow(args[0]);
    return;
  }
  if (cmd === 'create' && args[0] && args[0].toLowerCase() === 'flow' && args[1]) {
    createFlow(args[1]);
    return;
  }
  if (cmd === 'delete' && args[0] && args[0].toLowerCase() === 'flow' && args[1]) {
    deleteFlow(args[1]);
    return;
  }
  if (cmd === 'create' && args[0] && args[0].toLowerCase() === 'note') {
    // create note "text"
    const match = command.match(/create note\s+"([^"]+)"/i);
    if (match && match[1]) {
      addNote(match[1]);
    } else {
      displayMessage('Usage: create note "your note text here"');
    }
    return;
  }
  if (cmd === 'delete' && args[0] && args[0].toLowerCase() === 'note') {
    // delete note <index>
    if (args[1] && !isNaN(args[1])) {
      deleteNote(parseInt(args[1]));
    } else {
      displayMessage('Usage: delete note <index>');
    }
    return;
  }
  
  // Command: open settings
  if (cmd === 'open' && args.length > 0 && args[0].toLowerCase() === 'settings') {
    openSettings();
    createNewCommandLine();
    return;
  }
  
  // Command: open history
  if (cmd === 'open' && args.length > 0 && args[0].toLowerCase() === 'history') {
    const page = args.length > 1 && !isNaN(args[1]) ? parseInt(args[1]) : 1;
    listHistory(page);
    return;
  }
  
  // Command: help
  if (cmd === 'help') {
    displayHelp();
    return;
  }
  
  // Command: clear - clear screen but keep history
  if (cmd === 'clear') {
    clearTerminal();
    return;
  }
  
  // Command: open - enhanced to work with paths
  if (cmd === 'open') {
    if (args.length > 0) {
      const urlOrPath = args.join(' ');
      
      // Check if current path is a bookmark path
      if (currentTerminalPath.startsWith('browser/bm')) {
        const bookmarks = getCustomBookmarks();
        const bmPathParts = currentTerminalPath.split('/').slice(2);
        let node = bookmarks;
        
        // Navigate to current bookmark folder
        for (const part of bmPathParts) {
          if (node[part] && typeof node[part] === 'object') {
            node = node[part];
          } else {
            // Invalid path
            break;
          }
        }
        
        // Check if the bookmark exists in current folder
        if (node[urlOrPath] && typeof node[urlOrPath] === 'string') {
          const url = node[urlOrPath];
          window.open(url.startsWith('http') ? url : `https://${url}`, '_blank');
          displayMessage(`Opening ${urlOrPath}: ${url}`);
          createNewCommandLine();
          return;
        }
        
        // Check if it's an index
        if (!isNaN(urlOrPath)) {
          const idx = parseInt(urlOrPath) - 1;
          const bookmarks = Object.entries(node)
            .filter(([_, val]) => typeof val === 'string')
            .map(([name, url]) => ({ name, url }));
          
          if (idx >= 0 && idx < bookmarks.length) {
            const bm = bookmarks[idx];
            window.open(bm.url.startsWith('http') ? bm.url : `https://${bm.url}`, '_blank');
            displayMessage(`Opening [${idx + 1}] ${bm.name}: ${bm.url}`);
            createNewCommandLine();
            return;
          }
        }
      }
      
      // Check if current path is favorites
      if (currentTerminalPath === 'browser/fav') {
        const favs = getCustomFavorites();
        // Try by name
        const fav = favs.find(f => f.name.toLowerCase() === urlOrPath.toLowerCase());
        if (fav) {
          window.open(fav.url.startsWith('http') ? fav.url : `https://${fav.url}`, '_blank');
          displayMessage(`Opening ${fav.name}: ${fav.url}`);
          createNewCommandLine();
          return;
        }
        
        // Try by index
        if (!isNaN(urlOrPath)) {
          const idx = parseInt(urlOrPath) - 1;
          if (idx >= 0 && idx < favs.length) {
            const fav = favs[idx];
            window.open(fav.url.startsWith('http') ? fav.url : `https://${fav.url}`, '_blank');
            displayMessage(`Opening [${idx + 1}] ${fav.name}: ${fav.url}`);
            createNewCommandLine();
            return;
          }
        }
      }
      
      // Default: Treat as URL
      // First, check if it's already a URL
      if (/^(https?:\/\/)/.test(urlOrPath)) {
        window.open(urlOrPath, '_blank');
      } else if (/^(file:\/\/)/.test(urlOrPath)) {
        window.open(urlOrPath, '_blank');
      }
      // Check if it's a Windows path (C:/..., D:/...)
      else if (/^[a-zA-Z]:[\\/]/.test(urlOrPath)) {
        window.open('file:///' + urlOrPath.replace(/\\/g, '/'), '_blank');
      }
      // Assume it's a URL without protocol
      else {
        window.open('https://' + urlOrPath, '_blank');
      }
    }
    createNewCommandLine();
    return;
  }
  
  // Command: cd - change directory/path
  if (cmd === 'cd') {
    handleChangeDirectory(args);
    return;
  }
  
  // Command: create favorite - make favorite (path-aware)
  if (cmd === 'create' && args[0] === 'favorite') {
    // Check if we're in the right path
    if (!currentTerminalPath.startsWith('browser/fav')) {
      displayMessage('Command "create favorite" only works in favorite paths. Use "cd fav" first.');
      return;
    }
    
    // Support: create favorite "name" "url"
    if (args.length >= 3) {
      const name = args[1].replace(/^["']|["']$/g, '');
      const url = args[2].replace(/^["']|["']$/g, '');
      const favs = getCustomFavorites();
      favs.push({ name, url });
      saveCustomFavorites(favs);
      displayMessage(`Favorite "${name}" created successfully!`);
      return;
    }
    // Interactive
    requestTerminalInput('Enter favorite name:', (name) => {
      if (!name) {
        displayMessage('Favorite creation cancelled'); 
        return;
      }
      requestTerminalInput('Enter favorite URL:', (url) => {
        if (!url) {
          displayMessage('Favorite creation cancelled');
          return;
        }
        const favs = getCustomFavorites();
        favs.push({ name, url });
        saveCustomFavorites(favs);
        displayMessage(`Favorite "${name}" created successfully!`);
      });
    });
    return;
  }
  
  // Command: mkfv (make favorite - root only, no folders)
  if (cmd === 'mkfv') {
    // Support: mkfv "name" "url"
    if (args.length >= 2) {
      const name = args[0].replace(/^["']|["']$/g, '');
      const url = args[1].replace(/^["']|["']$/g, '');
      const favs = getCustomFavorites();
      favs.push({ name, url });
      saveCustomFavorites(favs);
      displayMessage(`Favorite "${name}" created successfully!`);
      return;
    }
    // Interactive
    requestTerminalInput('Enter favorite name:', (name) => {
      if (!name) {
        displayMessage('Favorite creation cancelled');
        return;
      }
      requestTerminalInput('Enter favorite URL:', (url) => {
        if (!url) {
          displayMessage('Favorite creation cancelled');
          return;
        }
        const favs = getCustomFavorites();
        favs.push({ name, url });
        saveCustomFavorites(favs);
        displayMessage(`Favorite "${name}" created successfully!`);
      });
    });
    return;
  }

  // Command: rmfv (remove favorite by index or name)
  if (cmd === 'rmfv') {
    const favs = getCustomFavorites();
    if (args.length === 0) {
      displayMessage('Usage: rmfv <index>|<name>');
      return;
    }
    const token = args.join(' ');
    if (!isNaN(token)) {
      const idx = parseInt(token);
      if (idx > 0 && idx <= favs.length) {
        const removed = favs.splice(idx - 1, 1)[0];
        saveCustomFavorites(favs);
        displayMessage(`Favorite "${removed.name}" removed`);
      } else {
        displayMessage(`Invalid favorite index: ${idx}`);
      }
      return;
    }
    const i = favs.findIndex(f => f.name.toLowerCase() === token.toLowerCase());
    if (i >= 0) {
      const removed = favs.splice(i, 1)[0];
      saveCustomFavorites(favs);
      displayMessage(`Favorite "${removed.name}" removed`);
    } else {
      displayMessage(`Favorite "${token}" not found`);
    }
    return;
  }
  
  // Command: delete favorite (path-aware)
  if (cmd === 'delete' && args[0] === 'favorite') {
    // Check if we're in the right path
    if (!currentTerminalPath.startsWith('browser/fav')) {
      displayMessage('Command "delete favorite" only works in favorite paths. Use "cd fav" first.');
      return;
    }
    
    const favs = getCustomFavorites();
    if (args.length < 2) {
      displayMessage('Usage: delete favorite <index>|<name>');
      return;
    }
    
    const token = args.slice(1).join(' ');
    if (!isNaN(token)) {
      const idx = parseInt(token);
      if (idx > 0 && idx <= favs.length) {
        const removed = favs.splice(idx - 1, 1)[0];
        saveCustomFavorites(favs);
        displayMessage(`Favorite "${removed.name}" removed`);
      } else {
        displayMessage(`Invalid favorite index: ${idx}`);
      }
      return;
    }
    const i = favs.findIndex(f => f.name.toLowerCase() === token.toLowerCase());
    if (i >= 0) {
      const removed = favs.splice(i, 1)[0];
      saveCustomFavorites(favs);
      displayMessage(`Favorite "${removed.name}" removed`);
    } else {
      displayMessage(`Favorite "${token}" not found`);
    }
    return;
  }

  // Command: mkdir - make bookmark directory
  if (cmd === 'mkdir') {
    // Check if we're in the right path
    if (!currentTerminalPath.startsWith('browser/bm')) {
      displayMessage('Command "mkdir" only works in bookmark paths. Use "cd bm" first.');
      return;
    }
    
    let name, url;
    
    if (args.length >= 2) {
      // Direct syntax provided
      name = args[0].replace(/^["']|["']$/g, '');
      url = args[1].replace(/^["']|["']$/g, '');
      const currentBmPath = currentTerminalPath.split('/').slice(2);
      const result = makeBookmarkAtPath(currentBmPath, name, url);
      displayMessage(result);
      return;
    }
    
    // Interactive mode
    requestTerminalInput('Enter bookmark name:', (name) => {
      if (!name) {
        displayMessage('Bookmark creation cancelled');
        return;
      }

      requestTerminalInput('Enter bookmark URL:', (url) => {
        if (!url) {
          displayMessage('Bookmark creation cancelled');
          return;
        }
        
        const currentBmPath = currentTerminalPath.split('/').slice(2);
        const result = makeBookmarkAtPath(currentBmPath, name, url);
        displayMessage(result);
      });
    });
    return;
  }
  
  // Command: mkbm - make bookmark with support for nested paths
  if (cmd === 'mkbm') {
    let folderPath = "";
    let name = "";
    let url = "";
    
    // Parse the command: mkbm [folder/path] name url
    if (args.length >= 2) {
      // Check if the first argument contains a folder path
      if (args[0].includes('/')) {
        folderPath = args[0];
        if (args.length >= 3) {
          name = args[1].replace(/^["']|["']$/g, '');
          url = args[2].replace(/^["']|["']$/g, '');
        } else {
          displayMessage('Usage: mkbm [folder/path] name url');
          return;
        }
      } else {
        // No folder path, just name and URL
        name = args[0].replace(/^["']|["']$/g, '');
        url = args[1].replace(/^["']|["']$/g, '');
      }
      
      // Create the bookmark
      const folders = folderPath ? folderPath.split('/').filter(Boolean) : [];
      const result = makeBookmarkAtPath(folders, name, url);
      displayMessage(result);
      return;
    } else {
      displayMessage('Usage: mkbm [folder/path] name url');
      return;
    }
  }
  
  // Command: rmdir - remove bookmark directory
  if (cmd === 'rmdir') {
    // Check if we're in the right path
    if (!currentTerminalPath.startsWith('browser/bm')) {
      displayMessage('Command "rmdir" only works in bookmark paths. Use "cd bm" first.');
      return;
    }
    
    if (args.length === 0) {
      displayMessage('Usage: rmdir <name>');
      return;
    }
    
    const name = args[0];
    const currentBmPathParts = currentTerminalPath.split('/').slice(2);
    
    if (currentBmPathParts.length > 0) {
      // We're in a subfolder, use the current path
      const bookmarks = getCustomBookmarks();
      let node = bookmarks;
      
      for (const part of currentBmPathParts) {
        if (node[part] && typeof node[part] === 'object') {
          node = node[part];
        } else {
          displayMessage(`Invalid path: ${currentTerminalPath}`);
          return;
        }
      }
      
      // Now node points to current folder
      if (node[name] !== undefined) {
        delete node[name];
        saveCustomBookmarks(bookmarks);
        displayMessage(`"${name}" removed successfully`);
      } else {
        displayMessage(`"${name}" not found in current folder`);
      }
    } else {
      // We're at root level of bookmarks
      const result = removeBookmark(null, name);
      displayMessage(result);
      return;
    }
  }
  
  // Command: rmbm - remove bookmark with support for nested paths
  if (cmd === 'rmbm') {
    if (args.length === 0) {
      displayMessage('Usage: rmbm [folder/path/]name');
      return;
    }
    
    let path = args[0];
    
    if (path.includes('/')) {
      // Format: rmbm folder/path/bookmark
      const pathParts = path.split('/');
      const bookmarkName = pathParts.pop(); // Last part is the bookmark name
      const folderPath = pathParts; // Remaining parts form the folder path
      
      // Find the bookmark and remove it
      const bookmarks = getCustomBookmarks();
      let node = bookmarks;
      
      // Navigate to the folder
      for (const part of folderPath) {
        if (node && typeof node[part] === 'object') {
          node = node[part];
        } else {
          displayMessage(`Path not found: ${folderPath.join('/')}`);
          return;
        }
      }
      
      // Remove the bookmark
      if (node[bookmarkName] !== undefined) {
        if (typeof node[bookmarkName] === 'string') {
          // It's a bookmark
          delete node[bookmarkName];
          saveCustomBookmarks(bookmarks);
          displayMessage(`Bookmark "${bookmarkName}" removed from path "${folderPath.join('/')}"`);
        } else {
          // It's a folder
          displayMessage(`"${bookmarkName}" is a folder, not a bookmark. Use "rmdir" to remove folders.`);
        }
      } else {
        displayMessage(`Bookmark "${bookmarkName}" not found in path "${folderPath.join('/')}"`);
      }
    } else {
      // Format: rmbm name (from current location)
      // If we're in browser/bm path, use current path
      if (currentTerminalPath.startsWith('browser/bm')) {
        const currentBmPathParts = currentTerminalPath.split('/').slice(2);
        const bookmarkName = args[0];
        
        if (currentBmPathParts.length > 0) {
          // We're in a subfolder
          const bookmarks = getCustomBookmarks();
          let node = bookmarks;
          
          // Navigate to current folder
          for (const part of currentBmPathParts) {
            if (node[part] && typeof node[part] === 'object') {
              node = node[part];
            } else {
              displayMessage(`Invalid path: ${currentTerminalPath}`);
              return;
            }
          }
          
          // Remove bookmark from current folder
          if (node[bookmarkName] !== undefined) {
            if (typeof node[bookmarkName] === 'string') {
              delete node[bookmarkName];
              saveCustomBookmarks(bookmarks);
              displayMessage(`Bookmark "${bookmarkName}" removed`);
            } else {
              displayMessage(`"${bookmarkName}" is a folder, not a bookmark. Use "rmdir" to remove folders.`);
            }
          } else {
            displayMessage(`Bookmark "${bookmarkName}" not found in current folder`);
          }
        } else {
          // We're at root level of bookmarks
          const result = removeBookmark(null, bookmarkName);
          displayMessage(result);
        }
      } else {
        // We're not in a bookmark path
        const result = removeBookmark(null, args[0]);
        displayMessage(result);
      }
    }
    return;
  }
  
  // Command: search
  if (cmd === 'search') {
    if (args.length > 0) {
      const query = args.join(' ');
      window.open(`https://www.google.com/search?q=${encodeURIComponent(query)}`, '_blank');
    }
    createNewCommandLine();
    return;
  }
  
  // Custom commands have been removed
  
  // Default: Check if it's a URL
  const urlPattern = /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/i;
  
  if (urlPattern.test(command)) {
    // Navigate to URL in new tab
    const url = command.startsWith('http') ? command : `https://${command}`;
    window.open(url, '_blank');
  } else {
    // Search with Google in new tab
    window.open(`https://www.google.com/search?q=${encodeURIComponent(command)}`, '_blank');
  }
  
  createNewCommandLine();
}

function freezeCommandLine(commandLine, command) {
  // Remove input and cursor
  const input = commandLine.querySelector('input');
  const cursor = commandLine.querySelector('.cursor');
  const typedText = commandLine.querySelector('span:not(.prompt):not(.cursor)');
  
  if (input) input.remove();
  if (cursor) cursor.remove();
  
  // Make typed text permanent
  if (typedText) {
    typedText.textContent = command;
  }
}

// List favorites
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
      
      // Display built-in favorites if available
      if (favoriteItems.length > 0) {
        displayCommandOutput('Browser Favorites:', favoriteItems, 'fav', 0);
      }
      
      // Then also show custom favorites
      listCustomFavorites();
    });
  } else {
    showPermissionHelp('bookmarks');
  }
}

// List bookmarks
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
      
      // Display built-in bookmarks if available
      if (bookmarkItems.length > 0) {
        displayCommandOutput('Browser Bookmarks:', bookmarkItems, 'bookmark', 0);
      }
      
      // Then also show custom bookmarks
      listCustomBookmarks();
    });
  } else {
    alert('Bookmarks feature requires browser permissions. Please check manifest.json');
  }
}

// Open favorite by index or name
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
      
      // Check browser favorites first
      if (!isNaN(indexOrName)) {
        // By index
        const idx = parseInt(indexOrName) - 1;
        if (idx >= 0 && idx < favoriteItems.length) {
          window.open(favoriteItems[idx].url, '_blank');
          displayMessage(`Opening [${idx + 1}] ${favoriteItems[idx].title}`);
          return;
        }
      } else {
        // By name
        const favorite = favoriteItems.find(item => 
          item.title.toLowerCase() === indexOrName.toLowerCase()
        );
        
        if (favorite) {
          window.open(favorite.url, '_blank');
          displayMessage(`Opening ${favorite.title}`);
          return;
        }
      }
      
      // Then check custom favorites
      const customFavs = getCustomFavorites();
      
      if (!isNaN(indexOrName)) {
        // Adjust index to account for browser favorites
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

// Open favorite by index (kept for backward compatibility)
function openFavoriteByIndex(index) {
  openFavoriteByIndexOrName(index);
}

// Open bookmark by index
function openBookmarkByIndex(index) {
  // This function is no longer used for custom bookmarks
}

// List history
function listHistory(page = 1) {
  if (chrome && chrome.history) {
    const itemsPerPage = 10;
    const startIndex = (page - 1) * itemsPerPage;
    
    // Request more items to support pagination
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

// Display command output in terminal style
function displayCommandOutput(title, items, type, startIndex = 0) {
  const terminal = document.querySelector('.terminal');
  
  // Create output container
  const output = document.createElement('div');
  output.className = 'command-output';
  
  // Apply response color from settings
  const responseColor = getComputedStyle(document.documentElement).getPropertyValue('--response-color') || '#ffffff';
  output.style.color = responseColor;
  
  // Add title
  const titleEl = document.createElement('div');
  titleEl.textContent = title;
  output.appendChild(titleEl);
  
  // Add items
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
      
      // Make items clickable
      itemEl.addEventListener('click', () => {
        window.open(item.url, '_blank');
      });
      
      // Hover effect
      itemEl.addEventListener('mouseenter', () => {
        itemEl.style.textDecoration = 'underline';
      });
      
      itemEl.addEventListener('mouseleave', () => {
        itemEl.style.textDecoration = 'none';
      });
      
      output.appendChild(itemEl);
    });
  }
  
  // Append to terminal
  terminal.appendChild(output);
  
  // Create new command line after output
  createNewCommandLine();
  
  // Scroll to bottom
  window.scrollTo(0, document.body.scrollHeight);
}

// Open settings
function openSettings() {
  // Open the settings modal
  if (window.openSettingsModal) {
    window.openSettingsModal();
  }
}

// Display help command
function displayHelp() {
  const terminal = document.querySelector('.terminal');
  const output = document.createElement('div');
  output.className = 'command-output';
  
  // Apply response color
  const responseColor = getComputedStyle(document.documentElement).getPropertyValue('--response-color') || '#ffffff';
  output.style.color = responseColor;
  
  const helpText = `
Available Commands:

  help                      - Show this help message
  open <url>                - Open a URL in a new tab
  open settings             - Open settings modal
  
  cd fav                    - List all favorites
  cd fav <index>            - Open favorite by index number
  cd fav <name>             - Open favorite by name (searches title)
  
  mkfv                      - Create a new favorite (interactive)
  mkfv "name" "url"         - Create a favorite directly
  rmfv <index>|<name>       - Remove a favorite by index or name
  
  cd notes                  - List all notes
  create note "text"        - Create a note
  delete note <index>       - Delete a note by index
  
  cd bm                     - List all custom bookmarks
  cd bm <folder>            - List bookmarks in a specific folder
  cd bm <path>              - List bookmarks in nested folder (use folder1/sub1)
  cd bm <index>             - Open bookmark by index number
  cd bm <name>              - Open bookmark by name
  cd bm <folder> <index>    - Open bookmark by index in folder
  cd bm <folder> <name>     - Open bookmark by name in folder
  cd bm <path> <index|name> - Open bookmark in nested folder (use folder1/sub1)

  cd flow <id>              - List all URLs in a flow
  --flow <id>               - Open all URLs in a flow in new tabs
  create flow <id>          - Create a new flow (enter URLs, 'exit' to finish)
  delete flow <id>          - Delete a flow

  cd history                - List browsing history (page 1)
  cd history <page>         - List browsing history (specific page)
  
  mkbm "name" "url"         - Create a bookmark (inside bookmark directory)
  mkbm                      - Create a bookmark interactively (inside bookmark directory)
  rmbm <name>               - Remove a bookmark (inside bookmark directory)
  
  rmbm <name>               - Remove a bookmark
  rmbm -<folder> <name>     - Remove a bookmark from a specific folder
  
  search <query>            - Search Google for the query
  
  <url>                     - Navigate to URL (auto-detects URLs)
  <text>                    - Search Google for text

Settings:
  Use "open settings" to customize terminal appearance.`;
  
  output.textContent = helpText;
  output.style.whiteSpace = 'pre-wrap';
  output.style.lineHeight = '1.6';
  
  terminal.appendChild(output);
  createNewCommandLine();
  window.scrollTo(0, document.body.scrollHeight);
}

// Terminal-based input system (replaces prompt())
function requestTerminalInput(promptText, callback) {
  // Remove any previous input box
  const oldInput = document.querySelector('.command-line.input-mode');
  if (oldInput) oldInput.remove();
  isAwaitingInput = true;

  const terminal = document.querySelector('.terminal');

  // Display the prompt message
  const promptMsg = document.createElement('div');
  promptMsg.className = 'command-output';
  const responseColor = getComputedStyle(document.documentElement).getPropertyValue('--response-color') || '#ffffff';
  promptMsg.style.color = responseColor;
  promptMsg.textContent = promptText;
  terminal.appendChild(promptMsg);

  // Create a special input line
  const inputLine = document.createElement('div');
  inputLine.className = 'command-line input-mode';

  const inputPrompt = document.createElement('span');
  inputPrompt.className = 'prompt';
  inputPrompt.textContent = '>';

  const cursor = document.createElement('span');
  cursor.className = 'cursor';
  cursor.textContent = '_';

  const typedText = document.createElement('span');
  typedText.style.whiteSpace = 'pre';

  const input = document.createElement('input');
  input.type = 'text';
  input.spellcheck = false;
  input.autocomplete = 'off';

  inputLine.appendChild(inputPrompt);
  inputLine.appendChild(typedText);
  inputLine.appendChild(cursor);
  inputLine.appendChild(input);

  terminal.appendChild(inputLine);

  // Apply colors
  const promptColor = getComputedStyle(document.documentElement).getPropertyValue('--prompt-color') || '#ffffff';
  const commandColor = getComputedStyle(document.documentElement).getPropertyValue('--command-color') || '#ffffff';
  inputPrompt.style.color = promptColor;
  cursor.style.color = promptColor;
  typedText.style.color = commandColor;

  // Setup input handler
  input.addEventListener('input', () => {
    typedText.textContent = input.value;
  });

  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      const value = input.value;
      // Make the input permanent before removal
      typedText.textContent = value;
      // Remove active input elements
      input.remove();
      cursor.remove();
      // Mark input as finished
      isAwaitingInput = false;
      // Process the input value
      callback(value);
    } else if (e.key === 'Escape') {
      // Cancel input
      isAwaitingInput = false;
      inputLine.remove();
      callback(null);
    }
  });

  // Focus the input with a small delay to ensure DOM is ready
  setTimeout(() => {
    input.focus();
  }, 50);
  window.scrollTo(0, document.body.scrollHeight);
}

// Initialize
function init() {
  setupCommandInput();
  
  // Apply appearance settings after a short delay to ensure settings.js is loaded
  setTimeout(() => {
    if (window.applyAppearanceSettings) {
      window.applyAppearanceSettings();
    }
  }, 100);
  
  // --- FIX 1: For the INITIAL new tab focus ---
  // This runs ONCE when the window first gets focus (after the address bar)
  window.addEventListener(
    'focus',
    () => {
      setTimeout(() => {
        // Find the *last* command line, but not a special input prompt
        const activeCommandLine = document.querySelector('.command-line:last-of-type:not(.input-mode)');
        if (activeCommandLine) {
          const input = activeCommandLine.querySelector('input');
          if (input) input.focus();
        }
      }, 100); // 100ms delay to ensure browser is ready
    },
    { once: true } // This is key: it only runs ONCE on the first focus
  );
  
  // --- FIX 2: For RE-FOCUSING when you tab away and back ---
  document.addEventListener('visibilitychange', () => {
    // We also check !isAwaitingInput so we don't refocus the main
    // input while the user is typing in a special prompt.
    if (!document.hidden && !isAwaitingInput) {
      setTimeout(() => {
        const activeCommandLine = document.querySelector('.command-line:last-of-type:not(.input-mode)');
        if (activeCommandLine) {
          const input = activeCommandLine.querySelector('input');
          if (input) input.focus();
        }
      }, 100);
    }
  });
}
  
  // Also refocus on window focus
  window.addEventListener('focus', () => {
    // Use multiple attempts with varying delays to ensure focus is obtained
    [0, 50, 100, 300].forEach(delay => {
      setTimeout(() => {
        const activeCommandLine = document.querySelector('.command-line:last-of-type');
        if (activeCommandLine) {
          const input = activeCommandLine.querySelector('input');
          if (input) input.focus();
        }
      }, delay);
    });
  });
}
// Handle terminal header controls
function setupTerminalHeader() {
  // Ensure clicks on the header don't prevent the terminal from receiving focus
  const terminalHeader = document.querySelector('.terminal-header');
  if (terminalHeader) {
    terminalHeader.addEventListener('mousedown', (e) => {
      // Don't prevent default for control buttons
      if (!e.target.closest('.terminal-controls')) {
        e.preventDefault();
        
        // --- THIS IS THE FIX ---
        // Focus the (last) command input
        const activeCommandLine = document.querySelector('.command-line:last-of-type');
        if (activeCommandLine) {
          const input = activeCommandLine.querySelector('input');
          if (input) input.focus();
        }
        // --- END FIX ---
      }
    });
  }
  
  // Make the header act like a typical window header (can be dragged in the future)
  const terminalTitle = document.querySelector('.terminal-title');
  if (terminalTitle) {
    terminalTitle.addEventListener('click', () => {
      
      // --- THIS IS THE FIX ---
      const activeCommandLine = document.querySelector('.command-line:last-of-type');
      if (activeCommandLine) {
        const input = activeCommandLine.querySelector('input');
        if (input) input.focus();
      }
      // --- END FIX ---
    });
  }
  
  // Minimize button
  const minimizeBtn = document.querySelector('.terminal-minimize');
  if (minimizeBtn) {
    minimizeBtn.addEventListener('click', () => {
      // In a real OS this would minimize the window
      // For this web app, let's just show a message
      displayMessage('Minimize action triggered');
    });
  }

  // Maximize button
  const maximizeBtn = document.querySelector('.terminal-maximize');
  if (maximizeBtn) {
    maximizeBtn.addEventListener('click', () => {
      document.documentElement.requestFullscreen().catch(err => {
        displayMessage('Could not enter fullscreen mode: ' + err.message);
      });
    });
  }
  
  // Close button
  const closeBtn = document.querySelector('.terminal-close');
  if (closeBtn) {
    closeBtn.addEventListener('click', () => {
      // In a browser extension, this would close the tab
      if (confirm('Close this terminal?')) {
        window.close();
      }
    });
  }
} // <-- THIS (line 66) is the correct closing brace
// Run when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    init();
    setupTerminalHeader();
  });
} else {
  init();
  setupTerminalHeader();
}

function showTab(tabName) {
  // Remove active from all tabs and panels
  document.querySelectorAll('.settings-tab').forEach(btn => btn.classList.remove('active'));
  document.querySelectorAll('.settings-panel').forEach(panel => {
    panel.classList.remove('active');
    panel.style.display = 'none';
  });

  // Activate the selected tab and panel
  document.querySelector(`.settings-tab[data-tab="${tabName}"]`).classList.add('active');
  document.getElementById(`${tabName}-panel`).classList.add('active');
  document.getElementById(`${tabName}-panel`).style.display = '';
}

document.getElementById('appearance-tab').onclick = function() {
  showTab('appearance');
};
document.getElementById('preferences-tab').onclick = function() {
  showTab('preferences');
};

// Load and save toggle state
const toggle = document.getElementById('show-terminal-bubble-toggle');
chrome.storage.local.get({showTerminalBubble: true}, (data) => {
  toggle.checked = !!data.showTerminalBubble;
});
toggle.onchange = function() {
  chrome.storage.local.set({showTerminalBubble: toggle.checked});
};

// Default values
const DEFAULT_HEADER_BLUR = 5;
const DEFAULT_BACKGROUND_BLUR = 0;

// Get elements
const headerBlur = document.getElementById('headerBlur');
const headerBlurValue = document.getElementById('headerBlurValue');
const backgroundBlur = document.getElementById('backgroundBlur');
const backgroundBlurValue = document.getElementById('backgroundBlurValue');

// Load settings on open
chrome.storage.local.get({
  headerBlur: DEFAULT_HEADER_BLUR,
  backgroundBlur: DEFAULT_BACKGROUND_BLUR
}, (data) => {
  headerBlur.value = data.headerBlur;
  headerBlurValue.textContent = data.headerBlur;
  backgroundBlur.value = data.backgroundBlur;
  backgroundBlurValue.textContent = data.backgroundBlur;

  // Apply blur immediately
  applyBlur(data.headerBlur, data.backgroundBlur);
});

// Update value display and apply blur on slider change
headerBlur.addEventListener('input', function() {
  headerBlurValue.textContent = this.value;
  applyBlur(this.value, backgroundBlur.value);
});
backgroundBlur.addEventListener('input', function() {
  backgroundBlurValue.textContent = this.value;
  applyBlur(headerBlur.value, this.value);
});

// Save on settings save
document.getElementById('saveSettings').addEventListener('click', function() {
  chrome.storage.local.set({
    headerBlur: parseInt(headerBlur.value, 10),
    backgroundBlur: parseInt(backgroundBlur.value, 10)
  });
});

// Function to apply blur
function applyBlur(header, bg) {
  const headerEl = document.querySelector('.terminal-header');
  const terminalEl = document.querySelector('.terminal');
  if (headerEl) headerEl.style.backdropFilter = `blur(${header}px)`;
  if (terminalEl) terminalEl.style.backdropFilter = `blur(${bg}px)`;
}


