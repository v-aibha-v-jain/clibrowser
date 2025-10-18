// Load saved settings
function loadSettings() {
  chrome.storage.sync.get(
    {
      showTime: true,
      showGreeting: true,
      showSearch: true
    },
    (items) => {
      document.getElementById('showTime').checked = items.showTime;
      document.getElementById('showGreeting').checked = items.showGreeting;
      document.getElementById('showSearch').checked = items.showSearch;
    }
  );
}

// Save settings
function saveSettings() {
  const showTime = document.getElementById('showTime').checked;
  const showGreeting = document.getElementById('showGreeting').checked;
  const showSearch = document.getElementById('showSearch').checked;
  
  chrome.storage.sync.set(
    {
      showTime: showTime,
      showGreeting: showGreeting,
      showSearch: showSearch
    },
    () => {
      // Update status
      const status = document.getElementById('status');
      status.textContent = 'Settings saved!';
      
      setTimeout(() => {
        status.textContent = '';
      }, 2000);
    }
  );
}

// Event listeners
document.addEventListener('DOMContentLoaded', loadSettings);
document.getElementById('saveBtn').addEventListener('click', saveSettings);
