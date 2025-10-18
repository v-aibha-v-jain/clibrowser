// Settings Management
const DEFAULT_SETTINGS = {
  appearance: {
    textColor: '#ffffff',
    commandColor: '#ffffff',
    responseColor: '#ffffff',
    promptColor: '#ffffff',
    bgColor: '#000000',
    bgImage: null
  }
};

// Load settings from localStorage
function loadSettings() {
  const saved = localStorage.getItem('terminalSettings');
  if (saved) {
    return JSON.parse(saved);
  }
  return DEFAULT_SETTINGS;
}

// Save settings to localStorage
function saveSettingsToStorage(settings) {
  localStorage.setItem('terminalSettings', JSON.stringify(settings));
}

// Apply appearance settings
function applyAppearanceSettings() {
  const settings = loadSettings();
  const app = settings.appearance;
  
  // Apply colors
  document.body.style.color = app.textColor;
  document.body.style.backgroundColor = app.bgColor;
  
  // Apply command color to all typed text spans
  const commandLines = document.querySelectorAll('.command-line span:not(.prompt):not(.cursor)');
  commandLines.forEach(el => el.style.color = app.commandColor);
  
  // Apply response color
  const outputs = document.querySelectorAll('.command-output');
  outputs.forEach(el => el.style.color = app.responseColor);
  
  // Apply prompt color
  const prompts = document.querySelectorAll('.prompt');
  prompts.forEach(el => el.style.color = app.promptColor);
  
  // Apply cursor color
  const cursors = document.querySelectorAll('.cursor');
  cursors.forEach(el => el.style.color = app.promptColor);
  
  // Apply background image
  if (app.bgImage) {
    document.body.style.backgroundImage = `url(${app.bgImage})`;
    document.body.style.backgroundSize = 'cover';
    document.body.style.backgroundPosition = 'center';
    document.body.style.backgroundAttachment = 'fixed';
  } else {
    document.body.style.backgroundImage = 'none';
  }
  
  // Store colors in CSS variables for dynamic elements
  document.documentElement.style.setProperty('--text-color', app.textColor);
  document.documentElement.style.setProperty('--command-color', app.commandColor);
  document.documentElement.style.setProperty('--response-color', app.responseColor);
  document.documentElement.style.setProperty('--prompt-color', app.promptColor);
}

// Settings Modal Management
let currentTab = 'appearance';

function openSettingsModal() {
  const overlay = document.getElementById('settingsOverlay');
  overlay.classList.add('active');
  loadSettingsIntoForm();
}

function closeSettingsModal() {
  const overlay = document.getElementById('settingsOverlay');
  overlay.classList.remove('active');
}

function switchTab(tabName) {
  currentTab = tabName;
  
  // Update tab buttons
  document.querySelectorAll('.settings-tab').forEach(tab => {
    tab.classList.remove('active');
    if (tab.dataset.tab === tabName) {
      tab.classList.add('active');
    }
  });
  
  // Update panels
  document.querySelectorAll('.settings-panel').forEach(panel => {
    panel.classList.remove('active');
  });
  document.getElementById(`${tabName}-panel`).classList.add('active');
}

// Load current settings into form
function loadSettingsIntoForm() {
  const settings = loadSettings();
  const app = settings.appearance;
  
  // Load appearance settings
  document.getElementById('textColor').value = app.textColor;
  document.getElementById('textColorHex').value = app.textColor;
  
  document.getElementById('commandColor').value = app.commandColor;
  document.getElementById('commandColorHex').value = app.commandColor;
  
  document.getElementById('responseColor').value = app.responseColor;
  document.getElementById('responseColorHex').value = app.responseColor;
  
  document.getElementById('promptColor').value = app.promptColor;
  document.getElementById('promptColorHex').value = app.promptColor;
  
  document.getElementById('bgColor').value = app.bgColor;
  document.getElementById('bgColorHex').value = app.bgColor;
  
  // Load background image status
  const preview = document.getElementById('bgImagePreview');
  if (app.bgImage) {
    preview.textContent = 'Background image set';
  } else {
    preview.textContent = 'No image selected';
  }
}

// Color input sync
function syncColorInputs(colorInput, hexInput) {
  colorInput.addEventListener('input', (e) => {
    hexInput.value = e.target.value;
  });
  
  hexInput.addEventListener('input', (e) => {
    if (/^#[0-9A-F]{6}$/i.test(e.target.value)) {
      colorInput.value = e.target.value;
    }
  });
}









// Save settings
function saveSettings() {
  const settings = loadSettings();
  
  const textColorAll = document.getElementById('textColor').value;
  
  // Save appearance
  settings.appearance = {
    textColor: textColorAll,
    commandColor: document.getElementById('commandColor').value || textColorAll,
    responseColor: document.getElementById('responseColor').value || textColorAll,
    promptColor: document.getElementById('promptColor').value || textColorAll,
    bgColor: document.getElementById('bgColor').value,
    bgImage: settings.appearance.bgImage // Keep existing image
  };
  
  saveSettingsToStorage(settings);
  applyAppearanceSettings();
  
  alert('Settings saved successfully!');
}

// Reset to default
function resetSettings() {
  if (!confirm('Reset all settings to default?')) return;
  
  localStorage.removeItem('terminalSettings');
  loadSettingsIntoForm();
  loadCommandsList();
  applyAppearanceSettings();
  
  alert('Settings reset to default!');
}

// Background image handling
function handleBgImageUpload(e) {
  const file = e.target.files[0];
  if (!file) return;
  
  const reader = new FileReader();
  reader.onload = (event) => {
    const settings = loadSettings();
    settings.appearance.bgImage = event.target.result;
    saveSettingsToStorage(settings);
    
    document.getElementById('bgImagePreview').textContent = file.name;
    applyAppearanceSettings();
  };
  reader.readAsDataURL(file);
}

function removeBgImage() {
  const settings = loadSettings();
  settings.appearance.bgImage = null;
  saveSettingsToStorage(settings);
  
  document.getElementById('bgImagePreview').textContent = 'No image selected';
  document.getElementById('bgImage').value = '';
  applyAppearanceSettings();
}

// Execute custom command - Removed
function executeCustomCommand(name) {
  return false; // Custom commands feature removed
}

// Initialize settings
document.addEventListener('DOMContentLoaded', () => {
  // Apply saved settings on load
  applyAppearanceSettings();
  
  // Settings modal controls
  document.getElementById('closeSettings').addEventListener('click', closeSettingsModal);
  document.getElementById('settingsOverlay').addEventListener('click', (e) => {
    if (e.target.id === 'settingsOverlay') {
      closeSettingsModal();
    }
  });
  
  // Tab switching
  document.querySelectorAll('.settings-tab').forEach(tab => {
    tab.addEventListener('click', () => switchTab(tab.dataset.tab));
  });
  
  // Color input syncing
  syncColorInputs(document.getElementById('textColor'), document.getElementById('textColorHex'));
  syncColorInputs(document.getElementById('commandColor'), document.getElementById('commandColorHex'));
  syncColorInputs(document.getElementById('responseColor'), document.getElementById('responseColorHex'));
  syncColorInputs(document.getElementById('promptColor'), document.getElementById('promptColorHex'));
  syncColorInputs(document.getElementById('bgColor'), document.getElementById('bgColorHex'));
  
  // Update other colors when "Text Color (All)" changes
  document.getElementById('textColor').addEventListener('input', (e) => {
    const color = e.target.value;
    document.getElementById('commandColor').value = color;
    document.getElementById('commandColorHex').value = color;
    document.getElementById('responseColor').value = color;
    document.getElementById('responseColorHex').value = color;
    document.getElementById('promptColor').value = color;
    document.getElementById('promptColorHex').value = color;
  });
  
  document.getElementById('textColorHex').addEventListener('input', (e) => {
    if (/^#[0-9A-F]{6}$/i.test(e.target.value)) {
      const color = e.target.value;
      document.getElementById('commandColor').value = color;
      document.getElementById('commandColorHex').value = color;
      document.getElementById('responseColor').value = color;
      document.getElementById('responseColorHex').value = color;
      document.getElementById('promptColor').value = color;
      document.getElementById('promptColorHex').value = color;
    }
  });
  
  // Background image
  document.getElementById('bgImage').addEventListener('change', handleBgImageUpload);
  document.getElementById('removeBgImage').addEventListener('click', removeBgImage);
  
  // Save/Reset buttons
  document.getElementById('saveSettings').addEventListener('click', saveSettings);
  document.getElementById('resetSettings').addEventListener('click', resetSettings);
});

// Export for use in newtab.js
window.openSettingsModal = openSettingsModal;
window.applyAppearanceSettings = applyAppearanceSettings;
