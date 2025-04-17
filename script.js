document.addEventListener('DOMContentLoaded', () => {
  // Default Settings
  const defaultSettings = {
    defaultEngine: 'google',
    customEngineUrl: '',
    customEngineName: '',
    autoTheme: false,
    lightStart: '06:00',
    darkStart: '18:00',
    accentColor: '#0abde3',
    // Widget Toggles
    widgetNotes: true,
    widgetCalculator: true,
    widgetTodo: true,
    widgetWeather: true,
    widgetClock: true,
    widgetFinance: false,
    widgetNews: false,
    widgetBookmarks: false,
    widgetAI: false,
    widgetTranslator: false,
    widgetUtilities: false,
  };
  let settings = JSON.parse(localStorage.getItem('dashboardSettings')) || defaultSettings;
  let lastSearchQuery = localStorage.getItem('lastSearchQuery') || '';
  let favoriteSearches = JSON.parse(localStorage.getItem('favoriteSearches')) || [];
  let notesData = JSON.parse(localStorage.getItem('notesData')) || { content: '', tags: [], snapshots: [] };
  let calcHistory = JSON.parse(localStorage.getItem('calcHistory')) || [];
  let todos = JSON.parse(localStorage.getItem('todos')) || []; // Existing
  let weatherLocation = JSON.parse(localStorage.getItem('weatherLocation')) || null; // { lat, lon, name }
  let financeWatchlist = JSON.parse(localStorage.getItem('financeWatchlist')) || []; // [{ symbol, type }]
  let newsSettings = JSON.parse(localStorage.getItem('newsSettings')) || { source: 'newsapi', rssUrl: '', openInNewTab: true };
  let readLaterNews = JSON.parse(localStorage.getItem('readLaterNews')) || []; // [{ title, url }]

  // Apply Accent Color
  function applyAccentColor() {
    document.documentElement.style.setProperty('--secondary-color', settings.accentColor);
    // Potentially update other related colors if needed
  }
  applyAccentColor();

  // Apply Widget Visibility
  function applyWidgetVisibility() {
    Object.keys(defaultSettings).forEach(key => {
      if (key.startsWith('widget')) {
        const widgetId = key.substring(6).toLowerCase();
        const element = document.getElementById(widgetId);
        if (element) {
          element.style.display = settings[key] ? 'block' : 'none'; // Assuming 'block', adjust if grid/flex needed
        }
      }
    });
    // Re-apply grid layout if using CSS Grid for dashboard
    // const dashboard = document.getElementById('widgetsContainer');
    // dashboard.style.gridTemplateColumns = 'repeat(auto-fit, minmax(280px, 1fr))'; // Example
  }
  applyWidgetVisibility();

  // Theme Toggle & Auto Scheduling
  const themeToggle = document.getElementById('themeToggle');
  function setTheme(theme) {
    document.body.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }

  function checkAutoTheme() {
    if (settings.autoTheme) {
      const now = new Date();
      const currentTime = now.getHours() * 60 + now.getMinutes();
      const [lightH, lightM] = settings.lightStart.split(':').map(Number);
      const [darkH, darkM] = settings.darkStart.split(':').map(Number);
      const lightStartTime = lightH * 60 + lightM;
      const darkStartTime = darkH * 60 + darkM;

      let newTheme = 'light'; // Default
      if (lightStartTime < darkStartTime) { // Normal day/night cycle
        if (currentTime >= lightStartTime && currentTime < darkStartTime) {
          newTheme = 'light';
        } else {
          newTheme = 'dark';
        }
      } else { // Inverted cycle (dark starts before light, e.g., 18:00 dark, 06:00 light)
        if (currentTime >= darkStartTime || currentTime < lightStartTime) {
          newTheme = 'dark';
        } else {
          newTheme = 'light';
        }
      }
      setTheme(newTheme);
    }
  }

  themeToggle.addEventListener('click', () => {
    const currentTheme = document.body.getAttribute('data-theme') || 'light';
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    // Disable auto theme if manually toggled
    const autoThemeCheckbox = document.querySelector('#settingsForm input[name="autoTheme"]');
    if (autoThemeCheckbox && settings.autoTheme) {
      settings.autoTheme = false;
      autoThemeCheckbox.checked = false;
      localStorage.setItem('dashboardSettings', JSON.stringify(settings));
      document.getElementById('themeSchedule').style.display = 'none';
    }
  });

  const savedTheme = localStorage.getItem('theme');
  if (savedTheme && !settings.autoTheme) {
    setTheme(savedTheme);
  } else {
    checkAutoTheme(); // Apply initial theme based on schedule or default
  }
  setInterval(checkAutoTheme, 60000); // Check every minute for auto theme

  // Search Functionality
  const searchInput = document.getElementById('searchInput');
  const searchBtn = document.getElementById('searchBtn');
  const voiceSearchBtn = document.getElementById('voiceSearchBtn');
  const searchSuggestions = document.getElementById('searchSuggestions');
  const lastSearchBtn = document.getElementById('lastSearchBtn');
  const favoriteSearchBtn = document.getElementById('favoriteSearchBtn');
  const favoriteSearchModal = document.getElementById('favoriteSearchModal');
  const closeFavSearchBtn = document.getElementById('closeFavSearch');
  const favoriteSearchListEl = document.getElementById('favoriteSearchList');
  const newFavSearchInput = document.getElementById('newFavSearchInput');
  const addFavSearchBtn = document.getElementById('addFavSearchBtn');

  const searchEngines = {
    google: 'https://www.google.com/search?q=',
    duckduckgo: 'https://duckduckgo.com/?q=',
    bing: 'https://www.bing.com/search?q=',
    perplexity: 'https://www.perplexity.ai/search?q=', // Corrected URL
    custom: settings.customEngineUrl || 'https://www.google.com/search?q=' // Fallback
  };

  function performSearch(query = null) {
    const searchQuery = query !== null ? query : searchInput.value.trim();
    const encodedQuery = encodeURIComponent(searchQuery);
    if (encodedQuery) {
      let engineUrl = searchEngines[settings.defaultEngine] || searchEngines.google;
      if (settings.defaultEngine === 'custom' && settings.customEngineUrl) {
        engineUrl = settings.customEngineUrl.includes('%s')
          ? settings.customEngineUrl.replace('%s', encodedQuery)
          : engineUrl + encodedQuery; // Basic fallback if %s missing
      } else {
         engineUrl += encodedQuery;
      }

      window.open(engineUrl, '_blank');
      lastSearchQuery = searchQuery; // Store the last query
      localStorage.setItem('lastSearchQuery', lastSearchQuery);
      searchInput.value = ''; // Clear input after search
      hideSuggestions();
    }
  }

  searchBtn.addEventListener('click', () => performSearch());
  searchInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      performSearch();
    }
  });
  searchInput.addEventListener('input', () => showSuggestions(searchInput.value));
  searchInput.addEventListener('blur', () => setTimeout(hideSuggestions, 150)); // Delay to allow click on suggestion

  lastSearchBtn.addEventListener('click', () => {
    if (lastSearchQuery) {
      searchInput.value = lastSearchQuery;
      performSearch(lastSearchQuery);
    }
  });

  // --- Updated Functions ---
  async function showSuggestions(query) { // Make async for API call
    if (!query) {
      hideSuggestions();
      return;
    }

    // DuckDuckGo Instant Answer API (JSONP)
    const script = document.createElement('script');
    script.src = `https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&callback=handleDDGSuggestions`;
    document.body.appendChild(script);
    // Cleanup script tag after callback or timeout
    script.onload = () => setTimeout(() => document.body.removeChild(script), 500);
    script.onerror = () => {
        console.error("Failed to load DDG suggestions.");
        hideSuggestions(); // Hide on error
        document.body.removeChild(script);
    };
  }

  // Callback function for DDG API
  window.handleDDGSuggestions = function(data) {
      const suggestions = data.RelatedTopics?.map(topic => topic.Text).filter(Boolean) || [];
      // Add history/favorites as well?
      const combined = [...new Set([...suggestions, ...favoriteSearches.filter(fav => fav.toLowerCase().includes(searchInput.value.toLowerCase()))])].slice(0, 7); // Limit suggestions

      if (combined.length > 0) {
          searchSuggestions.innerHTML = combined.map(item =>
              `<div class="suggestion-item" onmousedown="selectSuggestion('${item.replace(/'/g, "\\'")}')">${item}</div>` // Use onmousedown
          ).join('');
          searchSuggestions.classList.add('active');
      } else {
          hideSuggestions();
      }
  }


  window.selectSuggestion = function(query) { // Make it global for onclick/onmousedown
      searchInput.value = query;
      performSearch(query);
      hideSuggestions(); // Ensure suggestions hide after selection
  }

  function hideSuggestions() {
    // Don't hide immediately on blur, allow click/mousedown on suggestion item
    // setTimeout(() => {
        searchSuggestions.classList.remove('active');
        searchSuggestions.innerHTML = '';
    // }, 150); // Delay removed, handled by onmousedown
  }

  // Voice Search Implementation
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  let recognition;

  if (SpeechRecognition) {
      recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.lang = 'en-US';
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;

      recognition.onresult = (event) => {
          const speechResult = event.results[0][0].transcript;
          searchInput.value = speechResult;
          performSearch(); // Optionally perform search immediately
      };

      recognition.onspeechend = () => {
          recognition.stop();
          voiceSearchBtn.textContent = '🎤'; // Reset icon
          voiceSearchBtn.disabled = false;
      };

      recognition.onerror = (event) => {
          console.error('Speech recognition error:', event.error);
          alert(`Speech recognition error: ${event.error}`);
          voiceSearchBtn.textContent = '🎤'; // Reset icon
          voiceSearchBtn.disabled = false;
      };

      voiceSearchBtn.addEventListener('click', () => {
          if (recognition && !recognition.running) {
              try {
                  recognition.start();
                  voiceSearchBtn.textContent = '...'; // Indicate listening
                  voiceSearchBtn.disabled = true;
              } catch (e) {
                  console.error("Could not start recognition:", e);
                  alert("Could not start voice recognition. Please check permissions.");
                  voiceSearchBtn.textContent = '🎤';
                  voiceSearchBtn.disabled = false;
              }
          } else if (recognition) {
              recognition.stop(); // Allow stopping manually
          }
      });

  } else {
      voiceSearchBtn.addEventListener('click', () => {
          alert('Voice Search is not supported by your browser.');
      });
      voiceSearchBtn.disabled = true; // Disable if not supported
  }

  // Favorite Searches Modal Logic
  function renderFavoriteSearches() {
      favoriteSearchListEl.innerHTML = favoriteSearches.map((fav, index) => `
          <li>
              <span onclick="selectSuggestion('${fav.replace(/'/g, "\\'")}')">${fav}</span>
              <button onclick="removeFavoriteSearch(${index})" title="Remove Favorite">×</button>
          </li>
      `).join('');
  }

  window.removeFavoriteSearch = function(index) {
      favoriteSearches.splice(index, 1);
      localStorage.setItem('favoriteSearches', JSON.stringify(favoriteSearches));
      renderFavoriteSearches();
  }

  if (favoriteSearchBtn) {
      favoriteSearchBtn.addEventListener('click', () => {
          newFavSearchInput.value = searchInput.value || lastSearchQuery || ''; // Pre-fill with current/last query
          renderFavoriteSearches();
          favoriteSearchModal.style.display = 'block';
      });
  }
  if (closeFavSearchBtn) {
      closeFavSearchBtn.addEventListener('click', () => favoriteSearchModal.style.display = 'none');
  }
  if (addFavSearchBtn) {
      addFavSearchBtn.addEventListener('click', () => {
          const newFav = newFavSearchInput.value.trim();
          if (newFav && !favoriteSearches.includes(newFav)) {
              favoriteSearches.push(newFav);
              localStorage.setItem('favoriteSearches', JSON.stringify(favoriteSearches));
              renderFavoriteSearches();
              newFavSearchInput.value = ''; // Clear input
          } else if (!newFav) {
              alert("Favorite search cannot be empty.");
          } else {
              alert("This search is already in your favorites.");
          }
      });
  }
  window.addEventListener('click', (e) => { // Close modal on outside click
      if (e.target === favoriteSearchModal) favoriteSearchModal.style.display = 'none';
      // ... other modals
  });
  // --- End Search Enhancements ---


  // Settings Modal Functionality
  const settingsToggle = document.getElementById('settingsToggle');
  const settingsModal = document.getElementById('settingsModal');
  const closeSettings = document.getElementById('closeSettings');
  const settingsForm = document.getElementById('settingsForm');
  const customEngineOptions = document.getElementById('customEngineOptions');
  const themeSchedule = document.getElementById('themeSchedule');

  settingsToggle.addEventListener('click', () => {
    // Populate form with current settings
    Object.keys(settings).forEach(key => {
      const element = settingsForm.elements[key];
      if (element) {
        if (element.type === 'checkbox') {
          element.checked = settings[key];
        } else if (element.type === 'radio') {
          // Handle radio buttons - check the one with the matching value
          document.querySelectorAll(`input[name="${key}"]`).forEach(radio => {
            radio.checked = (radio.value === settings[key]);
          });
        } else if (element.type === 'color') {
           element.value = settings[key] || defaultSettings[key]; // Handle color picker
        }
         else {
          element.value = settings[key];
        }
      }
    });
    // Show/hide custom engine options based on selection
    customEngineOptions.style.display = settings.defaultEngine === 'custom' ? 'block' : 'none';
    // Show/hide theme schedule options
    themeSchedule.style.display = settings.autoTheme ? 'block' : 'none';

    settingsModal.style.display = 'block';
  });

  closeSettings.addEventListener('click', () => settingsModal.style.display = 'none');
  window.addEventListener('click', (e) => {
    if (e.target === settingsModal) settingsModal.style.display = 'none';
  });

  // Handle dynamic visibility in settings form
  settingsForm.addEventListener('change', (e) => {
    if (e.target.name === 'defaultEngine') {
      customEngineOptions.style.display = e.target.value === 'custom' ? 'block' : 'none';
    }
    if (e.target.name === 'autoTheme') {
      themeSchedule.style.display = e.target.checked ? 'block' : 'none';
    }
  });

  // Update submit handler to include API keys
  settingsForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const formData = new FormData(settingsForm);
    const newSettings = {};

    // Iterate over default settings keys to ensure all are processed
    Object.keys(defaultSettings).forEach(key => {
      const element = settingsForm.elements[key];
      if (element) {
        if (element.type === 'checkbox') {
          newSettings[key] = element.checked;
        } else if (element.type === 'radio') {
          const checkedRadio = settingsForm.querySelector(`input[name="${key}"]:checked`);
          newSettings[key] = checkedRadio ? checkedRadio.value : defaultSettings[key];
        } else {
          // Includes text, color, time, and API keys
          newSettings[key] = formData.get(key) || defaultSettings[key];
        }
      } else {
        newSettings[key] = settings[key];
      }
    });

    // Basic validation/warning for API keys (optional)
    if (!newSettings.opencageApiKey && settings.widgetWeather) {
        console.warn("OpenCage API Key missing, manual weather location search might fail.");
    }
    // Add similar warnings for other keys if needed

    settings = newSettings; // Update global settings object
    localStorage.setItem('dashboardSettings', JSON.stringify(settings));

    // Re-apply necessary settings immediately
    applyWidgetVisibility();
    applyAccentColor();
    checkAutoTheme();
    searchEngines.custom = settings.customEngineUrl || 'https://www.google.com/search?q=';
    // Reload weather/finance/news if API keys might have changed? Or prompt user?
    // For simplicity, let's assume they refresh manually or on next load for now.

    settingsModal.style.display = 'none';
  });

  // Data Management Buttons
  const exportDataBtn = document.getElementById('exportData');
  const importDataBtn = document.getElementById('importData');
  const clearDataBtn = document.getElementById('clearData');

  if (exportDataBtn) {
    exportDataBtn.addEventListener('click', () => {
      const allData = {
        settings: settings,
        lastSearchQuery: lastSearchQuery,
        favoriteSearches: favoriteSearches,
        notesData: notesData,
        calcHistory: calcHistory,
        todos: todos,
        weatherLocation: weatherLocation,
        financeWatchlist: financeWatchlist,
        newsSettings: newsSettings,
        readLaterNews: readLaterNews,
        theme: localStorage.getItem('theme') || 'light'
        // Add other data points as needed
      };
      const dataStr = JSON.stringify(allData, null, 2);
      const blob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `dashboard_backup_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    });
  }

  if (importDataBtn) {
    importDataBtn.addEventListener('click', () => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '.json';
      input.onchange = e => {
        const file = e.target.files[0];
        if (file) {
          const reader = new FileReader();
          reader.onload = (event) => {
            try {
              const importedData = JSON.parse(event.target.result);
              // Validate basic structure (optional but recommended)
              if (importedData.settings && importedData.todos) {
                 // Merge imported data carefully
                 settings = { ...defaultSettings, ...importedData.settings };
                 lastSearchQuery = importedData.lastSearchQuery || '';
                 favoriteSearches = importedData.favoriteSearches || [];
                 notesData = importedData.notesData || { content: '', tags: [], snapshots: [] };
                 calcHistory = importedData.calcHistory || [];
                 todos = importedData.todos || [];
                 weatherLocation = importedData.weatherLocation || null;
                 financeWatchlist = importedData.financeWatchlist || [];
                 newsSettings = importedData.newsSettings || { source: 'newsapi', rssUrl: '', openInNewTab: true };
                 readLaterNews = importedData.readLaterNews || [];

                 // Save imported data to localStorage
                 localStorage.setItem('dashboardSettings', JSON.stringify(settings));
                 localStorage.setItem('lastSearchQuery', lastSearchQuery);
                 localStorage.setItem('favoriteSearches', JSON.stringify(favoriteSearches));
                 localStorage.setItem('notesData', JSON.stringify(notesData));
                 localStorage.setItem('calcHistory', JSON.stringify(calcHistory));
                 localStorage.setItem('todos', JSON.stringify(todos));
                 localStorage.setItem('weatherLocation', JSON.stringify(weatherLocation));
                 localStorage.setItem('financeWatchlist', JSON.stringify(financeWatchlist));
                 localStorage.setItem('newsSettings', JSON.stringify(newsSettings));
                 localStorage.setItem('readLaterNews', JSON.stringify(readLaterNews));
                 if (importedData.theme) {
                    localStorage.setItem('theme', importedData.theme);
                 }

                 // Reload the page or re-apply all settings and update UI
                 alert('Data imported successfully! Reloading page.');
                 location.reload();
              } else {
                alert('Invalid backup file format.');
              }
            } catch (error) {
              alert('Error reading or parsing backup file: ' + error.message);
            }
          };
          reader.readAsText(file);
        }
      };
      input.click();
    });
  }

  if (clearDataBtn) {
    clearDataBtn.addEventListener('click', () => {
      if (confirm('Are you sure you want to clear ALL dashboard data? This cannot be undone.')) {
        localStorage.clear(); // Clears everything
        // Optionally reset to defaults instead of clearing everything
        // localStorage.setItem('dashboardSettings', JSON.stringify(defaultSettings));
        // localStorage.removeItem('todos'); // etc.
        alert('All data cleared. Reloading page.');
        location.reload();
      }
    });
  }


  // Notes Widget
  const notesArea = document.getElementById('notesArea');
  const notesEditorTab = document.querySelector('.tab[data-target="editor"]');
  const notesPreviewTab = document.querySelector('.tab[data-target="preview"]');
  const notesEditorContent = document.getElementById('notesEditor');
  const notesPreviewContent = document.getElementById('notesPreview');
  const notesMarkdownToggle = document.getElementById('notesMarkdownToggle'); // Assuming this toggles preview visibility
  const notesSnapshotBtn = document.getElementById('notesSnapshot');
  const tagInput = document.getElementById('tagInput');
  const tagsDisplay = document.getElementById('tagsDisplay');
  const notesHistoryToggle = document.getElementById('notesHistoryToggle'); // New button
  const notesHistorySection = document.getElementById('notesHistory'); // New section
  const snapshotListEl = document.getElementById('snapshotList'); // New list

  function renderNotes() {
    if (notesArea) notesArea.value = notesData.content;
    renderTags();
    renderMarkdownPreview(); // Initial render
  }

  function renderTags() {
     if (!tagsDisplay) return;
     tagsDisplay.innerHTML = notesData.tags.map((tag, index) => `
        <span class="tag">
            ${tag}
            <button onclick="removeTag(${index})" title="Remove Tag">&times;</button>
        </span>
     `).join('');
  }

  function renderMarkdownPreview() {
    if (!notesPreviewContent || !notesArea) return;
    const content = notesArea.value;
    // Use Marked.js if available
    if (typeof marked !== 'undefined') {
        try {
            // Configure marked (optional, e.g., enable GitHub Flavored Markdown)
            marked.setOptions({
                gfm: true,
                breaks: true, // Convert single line breaks to <br>
                // sanitize: true, // Deprecated, use a dedicated sanitizer if needed
            });
            notesPreviewContent.innerHTML = marked.parse(content);
        } catch (error) {
            notesPreviewContent.textContent = 'Error rendering Markdown.';
            console.error("Markdown rendering error:", error);
        }
    } else {
        // Fallback to basic simulation if marked.js fails to load
        let html = content
            .replace(/^### (.*$)/gim, '<h3>$1</h3>')
            .replace(/^## (.*$)/gim, '<h2>$1</h2>')
            .replace(/^# (.*$)/gim, '<h1>$1</h1>')
            .replace(/\*\*(.*)\*\*/gim, '<strong>$1</strong>')
            .replace(/\*(.*)\*/gim, '<em>$1</em>')
            .replace(/`(.*?)`/gim, '<code>$1</code>')
            .replace(/\n/g, '<br>');
        notesPreviewContent.innerHTML = html + '<p><small>(Markdown library not loaded, basic preview shown)</small></p>';
    }
  }

  window.removeTag = function(index) { // Make global
      notesData.tags.splice(index, 1);
      localStorage.setItem('notesData', JSON.stringify(notesData));
      renderTags();
  }

  if (notesArea) {
    notesArea.addEventListener('input', () => {
      notesData.content = notesArea.value;
      localStorage.setItem('notesData', JSON.stringify(notesData));
      renderMarkdownPreview(); // Live preview update
    });
    renderNotes(); // Load initial notes and tags
  }

  if (tagInput) {
      tagInput.addEventListener('keypress', (e) => {
          if (e.key === 'Enter' && tagInput.value.trim()) {
              e.preventDefault();
              const newTag = tagInput.value.trim();
              if (!notesData.tags.includes(newTag)) {
                  notesData.tags.push(newTag);
                  localStorage.setItem('notesData', JSON.stringify(notesData));
                  renderTags();
              }
              tagInput.value = '';
          }
      });
  }

  if (notesEditorTab && notesPreviewTab) {
      notesEditorTab.addEventListener('click', () => {
          notesEditorTab.classList.add('active');
          notesPreviewTab.classList.remove('active');
          notesEditorContent.classList.add('active');
          notesPreviewContent.classList.remove('active');
      });
      notesPreviewTab.addEventListener('click', () => {
          notesPreviewTab.classList.add('active');
          notesEditorTab.classList.remove('active');
          notesPreviewContent.classList.add('active');
          notesEditorContent.classList.remove('active');
          renderMarkdownPreview(); // Ensure preview is up-to-date
      });
  }

  if (notesMarkdownToggle) { // Example: Use toggle button to switch tabs
      notesMarkdownToggle.addEventListener('click', () => {
          const isEditorActive = notesEditorTab.classList.contains('active');
          if (isEditorActive) {
              notesPreviewTab.click();
          } else {
              notesEditorTab.click();
          }
      });
  }

  // Snapshot Functionality
  function renderSnapshots() {
      if (!snapshotListEl) return;
      snapshotListEl.innerHTML = notesData.snapshots.map((snapshot, index) => `
          <li>
              <span>${new Date(snapshot.timestamp).toLocaleString()}</span>
              <button onclick="restoreSnapshot(${index})">Restore</button>
              <button onclick="deleteSnapshot(${index})">Delete</button>
          </li>
      `).join('');
  }

  window.restoreSnapshot = function(index) {
      if (confirm(`Restore note content from snapshot taken at ${new Date(notesData.snapshots[index].timestamp).toLocaleString()}? Current content will be overwritten.`)) {
          notesData.content = notesData.snapshots[index].content;
          if (notesArea) notesArea.value = notesData.content;
          localStorage.setItem('notesData', JSON.stringify(notesData));
          renderMarkdownPreview(); // Update preview
          // Switch back to editor tab if history is open
          if (notesHistorySection.style.display !== 'none') {
              notesHistoryToggle.click(); // Toggle history off
              notesEditorTab.click(); // Go to editor
          }
      }
  }

  window.deleteSnapshot = function(index) {
      if (confirm(`Delete snapshot from ${new Date(notesData.snapshots[index].timestamp).toLocaleString()}?`)) {
          notesData.snapshots.splice(index, 1);
          localStorage.setItem('notesData', JSON.stringify(notesData));
          renderSnapshots(); // Update list
      }
  }

  if (notesSnapshotBtn) {
      notesSnapshotBtn.addEventListener('click', () => {
          const timestamp = new Date().toISOString();
          notesData.snapshots.unshift({ timestamp, content: notesData.content });
          notesData.snapshots = notesData.snapshots.slice(0, 10); // Limit snapshots
          localStorage.setItem('notesData', JSON.stringify(notesData));
          alert(`Snapshot saved at ${new Date(timestamp).toLocaleString()}`);
          renderSnapshots(); // Update list if visible
      });
  }

  if (notesHistoryToggle) {
      notesHistoryToggle.addEventListener('click', () => {
          const isVisible = notesHistorySection.style.display !== 'none';
          notesHistorySection.style.display = isVisible ? 'none' : 'block';
          if (!isVisible) {
              renderSnapshots(); // Render list when showing
          }
      });
  }
  // Initial render call needs to include snapshot rendering if the section might be initially visible
  renderNotes();
  // renderSnapshots(); // Or call only when toggled


  // Calculator Widget
  const calcInput = document.getElementById('calcInput');
  const calcButtonsContainer = document.querySelector('.calc-buttons');
  const calcHistoryList = document.getElementById('calcHistoryList');
  const calcModeStandard = document.getElementById('calcModeStandard');
  const calcModeScientific = document.getElementById('calcModeScientific');
  const calcModeProgramming = document.getElementById('calcModeProgramming');
  let currentCalcMode = 'standard'; // 'standard', 'scientific', 'programming'

  function updateCalcHistory() {
      if (!calcHistoryList) return;
      calcHistoryList.innerHTML = calcHistory.map(entry =>
          `<li onclick="loadFromHistory('${entry.replace(/'/g, "\\'")}')">${entry}</li>` // Handle potential quotes
      ).join('');
      localStorage.setItem('calcHistory', JSON.stringify(calcHistory));
  }

   window.loadFromHistory = function(entry) { // Make global
      if (calcInput) {
          // Extract the result part if entry is like "1+2 = 3"
          const parts = entry.split('=');
          calcInput.value = parts.length > 1 ? parts[1].trim() : entry;
      }
  }

  function setupCalculatorButtons() {
      if (!calcInput || !calcButtonsContainer) return;
      calcButtonsContainer.innerHTML = ''; // Clear existing buttons

      let buttons = [];
      if (currentCalcMode === 'standard') {
          buttons = ['C', '(', ')', '/', '7', '8', '9', '*', '4', '5', '6', '-', '1', '2', '3', '+', '0', '.', '='];
      } else if (currentCalcMode === 'scientific') {
          buttons = [ // Example scientific layout
              'Rad', 'Deg', 'x!', '(', ')', '%', 'C',
              'Inv', 'sin', 'ln', '7', '8', '9', '/',
              'π', 'cos', 'log', '4', '5', '6', '*',
              'e', 'tan', '√', '1', '2', '3', '-',
              'Ans', 'EXP', 'x^y', '0', '.', '=', '+'
          ];
          // TODO: Implement scientific functions
      } else if (currentCalcMode === 'programming') {
          buttons = [ // Example programming layout
              'Hex', 'Dec', 'Oct', 'Bin',
              '<<', '>>', 'AND', 'OR', 'XOR', 'NOT', 'C',
              'A', 'B', '7', '8', '9', 'Mod',
              'C', 'D', '4', '5', '6', '/',
              'E', 'F', '1', '2', '3', '*',
              '(', ')', '0', '=', '-' , '+'
          ];
          // TODO: Implement programming functions and base conversions
      } else {
          buttons = ['C', '7', '8', '9', '/', '4', '5', '6', '*', '1', '2', '3', '-', '0', '.', '=', '+']; // Fallback
      }

      buttons.forEach(btn => {
          const button = document.createElement('button');
          button.textContent = btn;
          button.classList.add('calc-button');
          // Add specific classes or styles if needed (e.g., for operators, equals)
          if (btn === '=') button.classList.add('equals');
          if (btn === 'C') button.classList.add('clear');

          button.addEventListener('click', () => handleCalcInput(btn));
          calcButtonsContainer.appendChild(button);
      });
      // Adjust grid columns based on mode if necessary
      const columns = (currentCalcMode === 'scientific' || currentCalcMode === 'programming') ? 7 : 4;
      calcButtonsContainer.style.gridTemplateColumns = `repeat(${columns}, 1fr)`;
  }

  function handleCalcInput(btn) {
      if (!calcInput) return;
      let currentValue = calcInput.value;

      // Prevent multiple operators or invalid sequences (basic)
      const lastChar = currentValue.slice(-1);
      const operators = ['/', '*', '-', '+', '%'];

      if (btn === 'C') {
          calcInput.value = '';
      } else if (btn === '=') {
          try {
              // WARNING: Using Function() is potentially unsafe. Consider a math parser library (like math.js) for production.
              // Basic replacements for safety (still not foolproof)
              let safeExpression = currentValue
                  .replace(/[^-()\d/*+%.eπ]/g, '') // Remove potentially harmful characters (allow e, π)
                  .replace(/π/g, 'Math.PI')
                  .replace(/e/g, 'Math.E');
              // Handle x^y (replace with Math.pow) - needs careful parsing
              // safeExpression = safeExpression.replace(/(\d+(?:\.\d+)?)\^(\d+(?:\.\d+)?)/g, 'Math.pow($1, $2)');

              const result = Function(`"use strict"; return (${safeExpression})`)();

              // Avoid displaying 'undefined' or excessively long results
              if (result === undefined || result === null || isNaN(result)) {
                  throw new Error("Invalid calculation");
              }
              const displayResult = Number(result.toFixed(10)); // Limit precision

              const historyEntry = `${currentValue} = ${displayResult}`;
              calcInput.value = displayResult;
              if (!calcHistory.includes(historyEntry)) {
                  calcHistory.unshift(historyEntry);
                  calcHistory = calcHistory.slice(0, 20);
                  updateCalcHistory();
              }
          } catch (error) {
              console.error("Calculation Error:", error);
              calcInput.value = 'Error';
          }
      } else if (currentCalcMode === 'scientific') {
          // Handle scientific functions
          try {
              let result;
              // Assume functions operate on the current value or last number
              const currentNumber = parseFloat(currentValue.match(/-?\d*\.?\d+$/)?.[0] || currentValue) || 0; // Get last number or whole value

              switch (btn) {
                  case 'sin': result = Math.sin(currentNumber); break;
                  case 'cos': result = Math.cos(currentNumber); break;
                  case 'tan': result = Math.tan(currentNumber); break;
                  case 'log': result = Math.log10(currentNumber); break; // Base 10
                  case 'ln': result = Math.log(currentNumber); break; // Natural log
                  case '√': result = Math.sqrt(currentNumber); break;
                  case 'x!': // Factorial - simple implementation for integers
                      if (Number.isInteger(currentNumber) && currentNumber >= 0) {
                          result = 1;
                          for (let i = 2; i <= currentNumber; i++) result *= i;
                      } else { throw new Error("Factorial requires non-negative integer"); }
                      break;
                  case 'π': calcInput.value += Math.PI; return; // Append PI
                  case 'e': calcInput.value += Math.E; return; // Append E
                  case '%': calcInput.value += '/100'; return; // Append /100 for percentage calculation
                  // Placeholder for others
                  case 'Rad': case 'Deg': case 'Inv': case 'EXP': case 'Ans': case 'x^y':
                      alert(`Functionality for "${btn}" not fully implemented.`); return;
                  default: calcInput.value += btn; return; // Append standard buttons
              }
              // Replace current number with result (basic approach)
              calcInput.value = currentValue.replace(/-?\d*\.?\d+$/, '') + result.toFixed(10);

          } catch (error) {
              console.error("Scientific Calc Error:", error);
              calcInput.value = 'Error';
          }

      } else if (currentCalcMode === 'programming') {
          // TODO: Implement programming functions (Hex, Dec, Oct, Bin, bitwise ops)
          alert(`Programming mode function "${btn}" not implemented yet.`);
          if (!['Hex', 'Dec', 'Oct', 'Bin', '<<', '>>', 'AND', 'OR', 'XOR', 'NOT', 'Mod', 'A', 'B', 'C', 'D', 'E', 'F'].includes(btn)) {
             calcInput.value += btn; // Allow numbers and basic ops
          }
      }
       else {
          // Standard mode or unhandled buttons
          // Basic operator validation
          if (operators.includes(btn) && operators.includes(lastChar)) {
              // Replace last operator instead of adding another
              calcInput.value = currentValue.slice(0, -1) + btn;
          } else if (btn === '.' && lastChar === '.') {
              // Prevent double decimal points
              return;
          }
           else {
              calcInput.value += btn;
          }
      }
  }

  if (calcInput && calcButtonsContainer) {
      setupCalculatorButtons(); // Initial setup
      updateCalcHistory(); // Load history
  }

  if (calcModeStandard) calcModeStandard.addEventListener('click', () => { currentCalcMode = 'standard'; setupCalculatorButtons(); });
  if (calcModeScientific) calcModeScientific.addEventListener('click', () => { currentCalcMode = 'scientific'; setupCalculatorButtons(); alert('Scientific mode not fully implemented.'); });
  if (calcModeProgramming) calcModeProgramming.addEventListener('click', () => { currentCalcMode = 'programming'; setupCalculatorButtons(); alert('Programming mode not fully implemented.'); });


  // To-Do List Widget
  const todoInput = document.getElementById('todoInput');
  const todoListEl = document.getElementById('todoList'); // Renamed from todoList to avoid conflict
  const addTodoButton = document.getElementById('addTodo');
  const todoDateInput = document.getElementById('todoDate');
  const todoRecurringCheckbox = document.getElementById('todoRecurring');
  const todoListView = document.getElementById('todoListView');
  const todoKanbanView = document.getElementById('todoKanbanView');
  const todoListBtn = document.getElementById('todoListBtn'); // Assuming ID for list view button
  const todoKanbanBtn = document.getElementById('todoKanban'); // Assuming ID for kanban view button
  let currentTodoView = 'list'; // 'list' or 'kanban'

  function updateTodos() {
    localStorage.setItem('todos', JSON.stringify(todos));
    renderTodos();
  }

  function renderTodos() {
      if (currentTodoView === 'list') {
          renderListView();
          if (todoListView) todoListView.style.display = 'block';
          if (todoKanbanView) todoKanbanView.style.display = 'none';
      } else {
          renderKanbanView();
          if (todoListView) todoListView.style.display = 'none';
          if (todoKanbanView) todoKanbanView.style.display = 'grid'; // Or 'flex' depending on CSS
      }
  }

  function renderListView() {
      if (!todoListEl) return;
      todoListEl.innerHTML = todos.map((todo, idx) => `
        <li data-id="${idx}" draggable="true" ondragstart="dragStart(event)">
          <input type="checkbox" ${todo.done ? 'checked' : ''} onchange="toggleTodo(${idx})">
          <span>${todo.text} ${todo.dueDate ? `(Due: ${todo.dueDate})` : ''} ${todo.recurring ? '🔄' : ''}</span>
          <button onclick="deleteTodo(${idx})" title="Delete Task">×</button>
        </li>
      `).join('');
  }

  function renderKanbanView() {
      const todoCol = document.querySelector('#todoToDo .kanban-items');
      const inProgressCol = document.querySelector('#todoInProgress .kanban-items');
      const doneCol = document.querySelector('#todoDone .kanban-items');

      if (!todoCol || !inProgressCol || !doneCol) return;

      // Clear columns
      todoCol.innerHTML = '';
      inProgressCol.innerHTML = '';
      doneCol.innerHTML = '';

      todos.forEach((todo, idx) => {
          const item = document.createElement('div');
          item.classList.add('kanban-item');
          item.setAttribute('draggable', true);
          item.setAttribute('data-id', idx);
          // item.textContent = todo.text; // Replace with more details
          item.innerHTML = `
              <span>${todo.text}</span>
              <span class="kanban-item-details">
                  ${todo.dueDate ? `📅${todo.dueDate.slice(5)}` : ''} ${todo.recurring ? '🔄' : ''}
              </span>
          `;
          item.addEventListener('dragstart', dragStart);

          // Add due date/recurring info if needed
          // Add delete button if needed

          if (todo.status === 'done' || todo.done) { // Use status if available, fallback to done
              doneCol.appendChild(item);
          } else if (todo.status === 'inprogress') {
              inProgressCol.appendChild(item);
          } else { // Default to 'todo'
              todoCol.appendChild(item);
          }
      });

      // Add dragover/drop listeners to columns
      [todoCol, inProgressCol, doneCol].forEach(col => {
          col.parentElement.ondragover = dragOver; // Attach to column container
          col.parentElement.ondrop = drop;
      });
  }

  // Drag and Drop Handlers
  window.dragStart = function(event) {
      event.dataTransfer.setData('text/plain', event.target.dataset.id);
      setTimeout(() => { // Make item disappear smoothly
          event.target.classList.add('dragging');
      }, 0);
  }

  window.dragOver = function(event) {
      event.preventDefault(); // Necessary to allow drop
      // Optional: add visual feedback
      // event.target.closest('.kanban-column').classList.add('drag-over');
  }

  window.drop = function(event) {
      event.preventDefault();
      const id = event.dataTransfer.getData('text/plain');
      const draggableElement = document.querySelector(`.kanban-item[data-id='${id}']`);
      const dropzoneColumn = event.target.closest('.kanban-column');

      if (dropzoneColumn && draggableElement) {
          const targetStatus = dropzoneColumn.id.replace('todo', '').toLowerCase(); // 'todo', 'inprogress', 'done'
          const todoIndex = parseInt(id, 10);

          // Update todo status
          todos[todoIndex].status = targetStatus;
          todos[todoIndex].done = (targetStatus === 'done'); // Sync 'done' property

          // Move element in UI (or re-render)
          // dropzoneColumn.querySelector('.kanban-items').appendChild(draggableElement);
          updateTodos(); // Re-render to ensure consistency and save state
      }
      if (draggableElement) draggableElement.classList.remove('dragging');
      // Optional: remove visual feedback
      // document.querySelectorAll('.kanban-column').forEach(col => col.classList.remove('drag-over'));
  }


  addTodoButton.addEventListener('click', () => {
    const text = todoInput.value.trim();
    if (text) {
      const newTodo = {
          text,
          done: false,
          status: 'todo', // Default status for Kanban
          dueDate: todoDateInput.value || null,
          recurring: todoRecurringCheckbox.checked || false
      };
      todos.push(newTodo);
      todoInput.value = '';
      todoDateInput.value = ''; // Clear date input
      todoRecurringCheckbox.checked = false; // Clear recurring checkbox
      updateTodos();
    }
  });

  window.toggleTodo = function(idx) {
    todos[idx].done = !todos[idx].done;
    // Update status based on done state for Kanban consistency
    todos[idx].status = todos[idx].done ? 'done' : 'todo';
    updateTodos();
  };

  window.deleteTodo = function(idx) {
    todos.splice(idx, 1);
    updateTodos();
  };

  // Initial render
  renderTodos();

  // View switching
  if (todoListBtn) {
      todoListBtn.addEventListener('click', () => {
          currentTodoView = 'list';
          renderTodos();
      });
  }
  if (todoKanbanBtn) {
      todoKanbanBtn.addEventListener('click', () => {
          currentTodoView = 'kanban';
          renderTodos();
          alert('Kanban drag & drop is basic. Status updates on drop.');
      });
  }


  // Weather Widget using Open-Meteo API
  const weatherInfo = document.getElementById('weatherInfo');
  const weatherForecastEl = document.getElementById('weatherForecast'); // Daily
  const weatherHourlyEl = document.getElementById('hourlyForecastList'); // Hourly
  const aqiInfoEl = document.getElementById('aqiInfo');
  const weatherRefreshBtn = document.getElementById('weatherRefresh');
  const weatherLocationBtn = document.getElementById('weatherLocation');
  const locationModal = document.getElementById('locationModal');
  const closeLocationBtn = document.getElementById('closeLocation');
  const locationForm = document.getElementById('locationForm');
  const cityInput = document.getElementById('cityInput');
  const useCurrentLocationBtn = document.getElementById('useCurrentLocation');

  function fetchWeather(lat, lon, locationName = "Current Location") {
    // Fetch current, hourly (temp, code), daily (code, temp max/min), and air quality
    const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code,wind_speed_10m&hourly=temperature_2m,weather_code&daily=weather_code,temperature_2m_max,temperature_2m_min&timezone=auto`;
    const aqiUrl = `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lat}&longitude=${lon}&current=us_aqi&timezone=auto`;

    weatherInfo.innerHTML = `<p>Loading weather for ${locationName}...</p>`;
    if (weatherHourlyEl) weatherHourlyEl.innerHTML = ''; // Clear hourly
    if (weatherForecastEl) weatherForecastEl.innerHTML = ''; // Clear daily
    if (aqiInfoEl) aqiInfoEl.innerHTML = 'Loading AQI...';

    // Fetch main weather data
    fetch(weatherUrl)
      .then(response => response.json())
      .then(data => {
        if (data?.current) {
          const { temperature_2m, weather_code, wind_speed_10m } = data.current;
          const weatherDesc = getWeatherDescription(weather_code); // Helper function needed
          weatherInfo.innerHTML = `
            <h3>${locationName}</h3>
            <p>Now: ${temperature_2m}°C, ${weatherDesc}</p>
            <p>Wind: ${wind_speed_10m} km/h</p>
          `;
        } else {
          weatherInfo.innerHTML = '<p>Current weather data unavailable.</p>';
        }

        // Display Hourly Forecast (next 12 hours)
        if (data?.hourly && weatherHourlyEl) {
            const now = new Date();
            const currentHour = now.getHours();
            // Find the index corresponding to the current hour or the next available hour
            let startIndex = data.hourly.time.findIndex(timeISO => new Date(timeISO).getHours() >= currentHour);
            if (startIndex === -1) startIndex = 0; // Fallback if not found

            const hourlyData = data.hourly.time.slice(startIndex, startIndex + 12).map((timeISO, index) => ({
                time: new Date(timeISO).toLocaleTimeString('en-US', { hour: 'numeric', hour12: true }),
                temp: Math.round(data.hourly.temperature_2m[startIndex + index]),
                code: data.hourly.weather_code[startIndex + index]
            }));

            weatherHourlyEl.innerHTML = hourlyData.map(hour => `
                <div class="hourly-item">
                    <div class="hourly-time">${hour.time}</div>
                    <div class="hourly-icon">${getWeatherIcon(hour.code)}</div>
                    <div class="hourly-temp">${hour.temp}°</div>
                </div>
            `).join('');
        } else if (weatherHourlyEl) {
            weatherHourlyEl.innerHTML = '<p>Hourly forecast unavailable.</p>';
        }


        // Display Daily Forecast
        if (data?.daily && weatherForecastEl) {
            const { time, weather_code, temperature_2m_max, temperature_2m_min } = data.daily;
            weatherForecastEl.innerHTML = time.slice(0, 7).map((date, index) => `
                <div class="forecast-day">
                    <div class="forecast-date">${new Date(date).toLocaleDateString('en-US', { weekday: 'short' })}</div>
                    <div class="forecast-icon">${getWeatherIcon(weather_code[index])}</div>
                    <div class="forecast-temp">${Math.round(temperature_2m_max[index])}° / ${Math.round(temperature_2m_min[index])}°</div>
                </div>
            `).join('');
        } else if (weatherForecastEl) {
            weatherForecastEl.innerHTML = '<p>Daily forecast unavailable.</p>';
        }
      })
      .catch((error) => {
          console.error("Weather fetch error:", error);
          weatherInfo.innerHTML = '<p>Error fetching weather data.</p>';
          if (weatherHourlyEl) weatherHourlyEl.innerHTML = '';
          if (weatherForecastEl) weatherForecastEl.innerHTML = '';
      });

    // Fetch Air Quality Data
    fetch(aqiUrl)
      .then(response => response.json())
      .then(data => {
          if (data?.current?.us_aqi && aqiInfoEl) {
              const aqi = data.current.us_aqi;
              aqiInfoEl.innerHTML = `<p>US AQI: ${aqi} (${getAqiDescription(aqi)})</p>`;
          } else if (aqiInfoEl) {
              aqiInfoEl.innerHTML = '<p>AQI data unavailable.</p>';
          }
      })
      .catch(() => {
          if (aqiInfoEl) aqiInfoEl.innerHTML = '<p>Error fetching AQI data.</p>';
      });
  }

  // --- Helper functions for Weather ---
  function getWeatherDescription(code) {
      // Simplified mapping based on WMO Weather interpretation codes
      const descriptions = {
          0: 'Clear sky', 1: 'Mainly clear', 2: 'Partly cloudy', 3: 'Overcast',
          45: 'Fog', 48: 'Depositing rime fog',
          51: 'Light drizzle', 53: 'Moderate drizzle', 55: 'Dense drizzle',
          56: 'Light freezing drizzle', 57: 'Dense freezing drizzle',
          61: 'Slight rain', 63: 'Moderate rain', 65: 'Heavy rain',
          66: 'Light freezing rain', 67: 'Heavy freezing rain',
          71: 'Slight snow fall', 73: 'Moderate snow fall', 75: 'Heavy snow fall',
          77: 'Snow grains',
          80: 'Slight rain showers', 81: 'Moderate rain showers', 82: 'Violent rain showers',
          85: 'Slight snow showers', 86: 'Heavy snow showers',
          95: 'Thunderstorm', 96: 'Thunderstorm with slight hail', 99: 'Thunderstorm with heavy hail'
      };
      return descriptions[code] || 'Unknown';
  }

  function getWeatherIcon(code) {
      // Simple emoji mapping
      if ([0, 1].includes(code)) return '☀️'; // Clear/Mainly clear
      if ([2].includes(code)) return '⛅'; // Partly cloudy
      if ([3].includes(code)) return '☁️'; // Overcast
      if ([45, 48].includes(code)) return '🌫️'; // Fog
      if (code >= 51 && code <= 67) return '🌧️'; // Rain/Drizzle
      if (code >= 71 && code <= 77) return '❄️'; // Snow
      if (code >= 80 && code <= 86) return '🌦️'; // Showers
      if (code >= 95 && code <= 99) return '⛈️'; // Thunderstorm
      return '❓';
  }

   function getAqiDescription(aqi) {
      if (aqi <= 50) return 'Good';
      if (aqi <= 100) return 'Moderate';
      if (aqi <= 150) return 'Unhealthy for Sensitive Groups';
      if (aqi <= 200) return 'Unhealthy';
      if (aqi <= 300) return 'Very Unhealthy';
      return 'Hazardous';
  }
  // --- End Helper Functions ---

  function loadWeather() {
      if (weatherLocation) {
          fetchWeather(weatherLocation.lat, weatherLocation.lon, weatherLocation.name);
      } else if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
              position => {
                  const { latitude, longitude } = position.coords;
                  // Attempt reverse geocoding (requires another API or careful handling)
                  // For now, just use coordinates
                  weatherLocation = { lat: latitude, lon: longitude, name: "Current Location" };
                  localStorage.setItem('weatherLocation', JSON.stringify(weatherLocation));
                  fetchWeather(latitude, longitude);
              },
              () => {
                  if (weatherInfo) weatherInfo.innerHTML = '<p>Location access denied. Set location manually.</p>';
                  // Optionally fetch weather for a default location
                  // fetchWeather(51.5074, -0.1278, "London"); // Example default
              }
          );
      } else {
          if (weatherInfo) weatherInfo.innerHTML = '<p>Geolocation not supported. Set location manually.</p>';
          // Optionally fetch weather for a default location
          // fetchWeather(51.5074, -0.1278, "London"); // Example default
      }
  }

  // Initial weather load
  loadWeather();

  // Weather widget controls
  if (weatherRefreshBtn) {
      weatherRefreshBtn.addEventListener('click', loadWeather);
  }
  if (weatherLocationBtn) {
      weatherLocationBtn.addEventListener('click', () => {
          if (locationModal) locationModal.style.display = 'block';
      });
  }
  if (closeLocationBtn) {
      closeLocationBtn.addEventListener('click', () => {
          if (locationModal) locationModal.style.display = 'none';
      });
  }

  // Updated Location Form Handler with Geocoding (using OpenCage example)
  if (locationForm) {
      locationForm.addEventListener('submit', async (e) => { // Make async
          e.preventDefault();
          const cityName = cityInput.value.trim();
          if (cityName) {
              if (!settings.opencageApiKey) {
                  alert("OpenCage API Key is missing in settings. Cannot search by city name.");
                  return;
              }
              const geocodeUrl = `https://api.opencagedata.com/geocode/v1/json?q=${encodeURIComponent(cityName)}&key=${settings.opencageApiKey}&limit=1`;
              try {
                  const response = await fetch(geocodeUrl);
                  const data = await response.json();
                  if (data.results && data.results.length > 0) {
                      const { lat, lng } = data.results[0].geometry;
                      const formattedName = data.results[0].formatted;
                      weatherLocation = { lat, lon: lng, name: formattedName };
                      localStorage.setItem('weatherLocation', JSON.stringify(weatherLocation));
                      fetchWeather(lat, lng, formattedName);
                      if (locationModal) locationModal.style.display = 'none';
                      cityInput.value = '';
                  } else {
                      alert(`Could not find location: ${cityName}`);
                  }
              } catch (error) {
                  console.error("Geocoding error:", error);
                  alert("Error fetching location data.");
              }
          }
      });
  }
  if (useCurrentLocationBtn) {
      useCurrentLocationBtn.addEventListener('click', () => {
          weatherLocation = null; // Clear saved location to force geolocation
          localStorage.removeItem('weatherLocation');
          loadWeather();
          if (locationModal) locationModal.style.display = 'none';
      });
  }
  window.addEventListener('click', (e) => { // Close modal on outside click
      if (e.target === locationModal) locationModal.style.display = 'none';
      if (e.target === addSymbolModal) addSymbolModal.style.display = 'none';
      if (e.target === newsSettingsModal) newsSettingsModal.style.display = 'none';
  });


  // Clock Widget - update every second
  const clockDigitalDisplay = document.getElementById('clockDigital'); // Use the specific ID
  const clockAnalogContainer = document.getElementById('clockAnalog');
  const hourHand = document.querySelector('.hour-hand');
  const minuteHand = document.querySelector('.minute-hand');
  const secondHand = document.querySelector('.second-hand');
  const clockSwitchBtn = document.getElementById('clockSwitch');
  const timerToggleBtn = document.getElementById('timerToggle');
  const timerSection = document.getElementById('timerSection');
  const timerMinutesDisplay = document.getElementById('timerMinutes');
  const timerSecondsDisplay = document.getElementById('timerSeconds');
  const startTimerBtn = document.getElementById('startTimer');
  const resetTimerBtn = document.getElementById('resetTimer');
  const timerPresets = document.querySelectorAll('.timer-presets .preset');

  let clockMode = 'digital'; // 'digital' or 'analog'
  let timerModeActive = false;
  let timerInterval = null;
  let timerTotalSeconds = 25 * 60; // Default Pomodoro
  let timerRemainingSeconds = timerTotalSeconds;
  let isTimerRunning = false;

  function updateClock() {
    const now = new Date();
    if (clockMode === 'digital' && clockDigitalDisplay) {
        clockDigitalDisplay.textContent = now.toLocaleTimeString();
    } else if (clockMode === 'analog' && secondHand && minuteHand && hourHand) {
        const seconds = now.getSeconds();
        const minutes = now.getMinutes();
        const hours = now.getHours();

        const secondDeg = ((seconds / 60) * 360) + 90; // Offset by 90deg because of initial CSS position
        const minuteDeg = ((minutes / 60) * 360) + ((seconds / 60) * 6) + 90;
        const hourDeg = ((hours / 12) * 360) + ((minutes / 60) * 30) + 90;

        secondHand.style.transform = `rotate(${secondDeg}deg)`;
        minuteHand.style.transform = `rotate(${minuteDeg}deg)`;
        hourHand.style.transform = `rotate(${hourDeg}deg)`;
    }
  }

  function toggleClockView() {
      if (clockMode === 'digital') {
          clockMode = 'analog';
          if (clockDigitalDisplay) clockDigitalDisplay.style.display = 'none';
          if (clockAnalogContainer) clockAnalogContainer.style.display = 'block'; // Or 'flex' etc.
          updateClock(); // Update analog immediately
      } else {
          clockMode = 'digital';
          if (clockDigitalDisplay) clockDigitalDisplay.style.display = 'block'; // Or 'flex' etc.
          if (clockAnalogContainer) clockAnalogContainer.style.display = 'none';
          updateClock(); // Update digital immediately
      }
  }

  function toggleTimerView() {
      timerModeActive = !timerModeActive;
      if (timerModeActive) {
          if (timerSection) timerSection.style.display = 'block';
          // Hide clock display(s) if desired
          if (clockDigitalDisplay) clockDigitalDisplay.style.display = 'none';
          if (clockAnalogContainer) clockAnalogContainer.style.display = 'none';
          updateTimerDisplay();
      } else {
          if (timerSection) timerSection.style.display = 'none';
          // Show the current clock view
          if (clockMode === 'digital' && clockDigitalDisplay) clockDigitalDisplay.style.display = 'block';
          if (clockMode === 'analog' && clockAnalogContainer) clockAnalogContainer.style.display = 'block';
          stopTimer(); // Stop timer when switching away
      }
  }

  function updateTimerDisplay() {
      if (!timerMinutesDisplay || !timerSecondsDisplay) return;
      const minutes = Math.floor(timerRemainingSeconds / 60);
      const seconds = timerRemainingSeconds % 60;
      timerMinutesDisplay.textContent = String(minutes).padStart(2, '0');
      timerSecondsDisplay.textContent = String(seconds).padStart(2, '0');
  }

  function startTimer() {
      if (isTimerRunning) return;
      isTimerRunning = true;
      if (startTimerBtn) startTimerBtn.textContent = 'Pause';
      timerInterval = setInterval(() => {
          timerRemainingSeconds--;
          updateTimerDisplay();
          if (timerRemainingSeconds <= 0) {
              stopTimer();
              // Use Notifications API
              showTimerNotification();
              resetTimer();
          }
      }, 1000);
  }

  function stopTimer() { // Also acts as pause
      clearInterval(timerInterval);
      isTimerRunning = false;
      if (startTimerBtn) startTimerBtn.textContent = 'Start';
  }

  function resetTimer(minutes = null) {
      stopTimer();
      if (minutes !== null) {
          timerTotalSeconds = minutes * 60;
      }
      timerRemainingSeconds = timerTotalSeconds;
      updateTimerDisplay();
  }

  // Timer Notification
  function showTimerNotification() {
      if (!('Notification' in window)) {
          alert('Timer finished! (Notifications not supported)');
          return;
      }

      if (Notification.permission === 'granted') {
          new Notification('Timer Finished!', {
              body: 'Your countdown timer has ended.',
              icon: './icons/icon-192x192.png' // Optional: Add an icon path
          });
      } else if (Notification.permission !== 'denied') {
          Notification.requestPermission().then(permission => {
              if (permission === 'granted') {
                  showTimerNotification(); // Try again now that permission is granted
              } else {
                  alert('Timer finished! (Notifications denied)');
              }
          });
      } else {
          // Permission was denied
          alert('Timer finished! (Notifications blocked)');
      }
  }

  // Initial Clock Setup
  updateClock();
  setInterval(updateClock, 1000);
  // Set initial clock view based on preference or default
  if (clockMode === 'analog') toggleClockView(); // If default is analog
  if (timerModeActive) toggleTimerView(); // If default is timer

  // Clock/Timer Controls
  if (clockSwitchBtn) clockSwitchBtn.addEventListener('click', toggleClockView);
  if (timerToggleBtn) timerToggleBtn.addEventListener('click', toggleTimerView);
  if (startTimerBtn) startTimerBtn.addEventListener('click', () => {
      if (isTimerRunning) {
          stopTimer();
      } else {
          startTimer();
      }
  });
  if (resetTimerBtn) resetTimerBtn.addEventListener('click', () => resetTimer());
  timerPresets.forEach(button => {
      button.addEventListener('click', () => {
          const minutes = parseInt(button.dataset.minutes, 10);
          resetTimer(minutes);
      });
  });


  // Finance Widget
  const financeWatchlistEl = document.getElementById('watchlist');
  const financeAddSymbolBtn = document.getElementById('financeAddSymbol');
  const financeToggleTypeBtn = document.getElementById('financeToggleType'); // Updated ID
  const addSymbolModal = document.getElementById('addSymbolModal');
  const closeAddSymbolBtn = document.getElementById('closeAddSymbol');
  const addSymbolForm = document.getElementById('addSymbolForm');
  const symbolTypeSelect = document.getElementById('symbolType');
  const symbolSearchInput = document.getElementById('symbolSearch');
  const symbolSearchResultsEl = document.getElementById('symbolSearchResults');
  let currentFinanceType = 'stock'; // 'stock' or 'crypto'

  function renderWatchlist() {
      if (!financeWatchlistEl) return;
      financeWatchlistEl.innerHTML = 'Loading watchlist...';

      // Filter watchlist based on currentFinanceType
      const itemsToDisplay = financeWatchlist.filter(item => item.type === currentFinanceType);

      if (itemsToDisplay.length === 0) {
          financeWatchlistEl.innerHTML = `<p>No ${currentFinanceType} symbols in watchlist. Add symbols using the + button.</p>`;
          return;
      }

      // Display symbols, fetch data later
      financeWatchlistEl.innerHTML = itemsToDisplay.map((item, index) => {
          // Find the original index in the full financeWatchlist array for deletion
          const originalIndex = financeWatchlist.findIndex(fullItem => fullItem.symbol === item.symbol && fullItem.type === item.type);
          return `
              <div class="watchlist-item" data-symbol="${item.symbol}" data-type="${item.type}">
                  <span class="symbol-name">${item.symbol.toUpperCase()}</span>
                  <span class="symbol-price">--.--</span>
                  <span class="price-change">-.--%</span>
                  <button onclick="removeWatchlistItem(${originalIndex})" title="Remove ${item.symbol}" style="margin-left: 10px; background: none; border: none; color: var(--accent-color); cursor: pointer;">&times;</button>
                  <div class="mini-chart" style="display: none;">Chart placeholder for ${item.symbol}</div>
              </div>
          `;
      }).join('');

      // Fetch data for visible items
      fetchWatchlistData(itemsToDisplay);
  }

   window.removeWatchlistItem = function(originalIndex) { // Use original index
      if (originalIndex >= 0 && originalIndex < financeWatchlist.length) {
          financeWatchlist.splice(originalIndex, 1);
          localStorage.setItem('financeWatchlist', JSON.stringify(financeWatchlist));
          renderWatchlist(); // Re-render the filtered list
      }
  }

  function fetchWatchlistData(items) {
      // TODO: Implement REAL API calls using settings.alphaVantageApiKey etc.
      console.log(`Fetching data for ${currentFinanceType}:`, items.map(i => i.symbol));
      if (!settings.alphaVantageApiKey && currentFinanceType === 'stock') {
          console.warn("AlphaVantage API Key missing. Cannot fetch stock data.");
          // Show placeholder or error in UI
      }
      // Add similar check for crypto API key if using a different one

      // Placeholder data simulation:
      items.forEach(item => {
          const itemEl = financeWatchlistEl.querySelector(`.watchlist-item[data-symbol="${item.symbol}"][data-type="${item.type}"]`);
          if (itemEl) {
              const priceEl = itemEl.querySelector('.symbol-price');
              const changeEl = itemEl.querySelector('.price-change');
              setTimeout(() => { // Simulate network delay
                  const price = (Math.random() * (item.type === 'crypto' ? 50000 : 500)).toFixed(2);
                  const change = (Math.random() * 10 - 5).toFixed(2);
                  priceEl.textContent = `$${price}`;
                  changeEl.textContent = `${change}%`;
                  changeEl.className = `price-change ${change >= 0 ? 'positive' : 'negative'}`;
              }, Math.random() * 1000);
          }
      });
      // TODO: Implement mini-charts on hover
      // TODO: Set interval for updates: setTimeout(() => fetchWatchlistData(items), 60000);
  }

  // Initial render
  renderWatchlist();

  // Finance Controls
  if (financeAddSymbolBtn) {
      financeAddSymbolBtn.addEventListener('click', () => {
          if (addSymbolModal) addSymbolModal.style.display = 'block';
          // Clear previous search results
          if (symbolSearchInput) symbolSearchInput.value = '';
          if (symbolSearchResultsEl) symbolSearchResultsEl.innerHTML = '';
      });
  }
  if (closeAddSymbolBtn) {
      closeAddSymbolBtn.addEventListener('click', () => {
          if (addSymbolModal) addSymbolModal.style.display = 'none';
      });
  }

  if (financeToggleTypeBtn) { // Updated ID
      financeToggleTypeBtn.addEventListener('click', () => {
          currentFinanceType = currentFinanceType === 'stock' ? 'crypto' : 'stock';
          // Update button title/icon if needed
          renderWatchlist(); // Re-render with the new filter
      });
  }

  // Add Symbol Modal Logic - Symbol Search with AlphaVantage (Example)
  let symbolSearchTimeout;
  if (symbolSearchInput) {
      symbolSearchInput.addEventListener('input', () => {
          clearTimeout(symbolSearchTimeout);
          const query = symbolSearchInput.value.trim();
          const type = symbolTypeSelect.value; // 'stock' or 'crypto'

          if (query.length > 1) {
              symbolSearchTimeout = setTimeout(async () => { // Debounce API calls
                  if (!settings.alphaVantageApiKey) {
                      symbolSearchResultsEl.innerHTML = '<p><small>AlphaVantage API Key missing in settings.</small></p>';
                      return;
                  }
                  // Use AlphaVantage Search Endpoint
                  const searchUrl = `https://www.alphavantage.co/query?function=SYMBOL_SEARCH&keywords=${encodeURIComponent(query)}&apikey=${settings.alphaVantageApiKey}`;
                  try {
                      const response = await fetch(searchUrl);
                      const data = await response.json();
                      if (data.bestMatches && data.bestMatches.length > 0) {
                          // Filter results roughly by type if possible (AV results mix types)
                          const filteredMatches = data.bestMatches.filter(match => {
                              // Basic filtering - improve if needed
                              const matchType = match['3. type'].toLowerCase();
                              const matchRegion = match['4. region'].toLowerCase();
                              if (type === 'stock') {
                                  return matchType === 'equity' && matchRegion.includes('united states'); // Example: US Stocks
                              } else if (type === 'crypto') {
                                  return matchType === 'crypto' || matchType === 'digital currency';
                              }
                              return false;
                          }).slice(0, 5); // Limit results

                          if (filteredMatches.length > 0) {
                              symbolSearchResultsEl.innerHTML = filteredMatches.map(match => `
                                  <div onclick="selectSymbol('${match['1. symbol']}', '${match['2. name'].replace(/'/g, "\\'")}', '${type}')">
                                      ${match['1. symbol']} (${match['2. name']})
                                  </div>
                              `).join('');
                          } else {
                              symbolSearchResultsEl.innerHTML = '<p><small>No matching symbols found.</small></p>';
                          }
                      } else {
                          symbolSearchResultsEl.innerHTML = '<p><small>No results or API limit reached.</small></p>';
                      }
                  } catch (error) {
                      console.error("Symbol search error:", error);
                      symbolSearchResultsEl.innerHTML = '<p><small>Error searching for symbols.</small></p>';
                  }
              }, 500); // Wait 500ms after typing stops
          } else {
              symbolSearchResultsEl.innerHTML = '';
          }
      });
  }

  window.selectSymbol = function(symbol, name, type) { // Make global
      if (symbolSearchInput) symbolSearchInput.value = `${symbol} (${name})`;
      if (symbolSearchResultsEl) symbolSearchResultsEl.innerHTML = '';
      // Store selected symbol temporarily if needed for form submission
      addSymbolForm.dataset.selectedSymbol = symbol;
      addSymbolForm.dataset.selectedType = type;
  }

  if (addSymbolForm) {
      addSymbolForm.addEventListener('submit', (e) => {
          e.preventDefault();
          const symbol = addSymbolForm.dataset.selectedSymbol;
          const type = addSymbolForm.dataset.selectedType || symbolTypeSelect.value;

          if (symbol && type) {
              // Check if symbol already exists
              if (!financeWatchlist.some(item => item.symbol === symbol && item.type === type)) {
                  financeWatchlist.push({ symbol, type });
                  localStorage.setItem('financeWatchlist', JSON.stringify(financeWatchlist));
                  renderWatchlist(); // Update the main widget view
              } else {
                  alert(`${symbol} is already in the watchlist.`);
              }
              if (addSymbolModal) addSymbolModal.style.display = 'none'; // Close modal
          } else {
              alert('Please search and select a symbol first.');
          }
          // Clear selection data
          delete addSymbolForm.dataset.selectedSymbol;
          delete addSymbolForm.dataset.selectedType;
      });
  }


  // News Widget
  const newsContainer = document.getElementById('newsContainer');
  const newsCategoriesContainer = document.querySelector('.news-categories');
  const newsRefreshBtn = document.getElementById('newsRefresh');
  const newsSettingsBtn = document.getElementById('newsSettings');
  const readLaterListEl = document.getElementById('readLaterItems');
  const newsSettingsModal = document.getElementById('newsSettingsModal');
  const closeNewsSettingsBtn = document.getElementById('closeNewsSettings');
  const newsSettingsForm = document.getElementById('newsSettingsForm');
  const rssOptionsDiv = document.getElementById('rssOptions');
  let currentNewsCategory = 'general';

  async function fetchNews(category = currentNewsCategory) { // Make async
      if (!newsContainer) return;
      newsContainer.innerHTML = `<p>Loading ${category} news...</p>`;
      currentNewsCategory = category;

      // Highlight active category button
      document.querySelectorAll('.news-category').forEach(btn => {
          btn.classList.toggle('active', btn.dataset.category === category);
      });

      try {
          let articles = [];
          if (newsSettings.source === 'newsapi') {
              if (!settings.newsApiKey) {
                  newsContainer.innerHTML = '<p>NewsAPI Key missing in settings.</p>';
                  return;
              }
              const url = `https://newsapi.org/v2/top-headlines?country=us&category=${category}&apiKey=${settings.newsApiKey}&pageSize=15`;
              const response = await fetch(url);
              if (!response.ok) {
                  throw new Error(`NewsAPI error: ${response.statusText}`);
              }
              const data = await response.json();
              articles = data.articles || [];

          } else if (newsSettings.source === 'rss' && newsSettings.rssUrl) {
              // Use rss2json.com for parsing RSS feeds (requires no API key for basic use)
              const rssToJsonService = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(newsSettings.rssUrl)}`;
              const response = await fetch(rssToJsonService);
               if (!response.ok) {
                  throw new Error(`RSS fetch error: ${response.statusText}`);
              }
              const data = await response.json();
              if (data.status === 'ok') {
                  // Adapt RSS item structure to match NewsAPI structure roughly
                  articles = (data.items || []).map(item => ({
                      title: item.title,
                      description: item.description || item.content, // Use content if description missing
                      url: item.link,
                      source: { name: data.feed?.title || 'RSS Feed' },
                      publishedAt: item.pubDate // Keep original pubDate if needed
                  }));
              } else {
                   throw new Error(`RSS parsing error: ${data.message}`);
              }
          } else {
              newsContainer.innerHTML = '<p>Please configure news source in settings.</p>';
              return;
          }
          renderNews(articles);

      } catch (error) {
          console.error("News fetch error:", error);
          newsContainer.innerHTML = `<p>Error fetching news: ${error.message}. Check API key or RSS URL.</p>`;
      }
  }

  function renderNews(articles) {
      if (!newsContainer) return;
      if (!articles || articles.length === 0) {
          newsContainer.innerHTML = '<p>No news articles found.</p>';
          return;
      }
      newsContainer.innerHTML = articles.slice(0, 15).map((article, index) => `
          <div class="news-item">
              <h3><a href="${article.url}" target="${newsSettings.openInNewTab ? '_blank' : '_self'}" rel="noopener noreferrer">${article.title}</a></h3>
              <p>${article.description || ''} <small>(${article.source?.name || 'Unknown Source'})</small></p>
              <div class="news-item-actions">
                  <span class="news-action" onclick="addReadLater(${index}, '${article.title.replace(/'/g, "\\'")}', '${article.url.replace(/'/g, "\\'")}')">Read Later</span>
                  <!-- Add other actions like share? -->
              </div>
          </div>
      `).join('');
      // Store articles temporarily if needed for read later function by index
      newsContainer.dataset.articles = JSON.stringify(articles);
  }

  function renderReadLaterList() {
      if (!readLaterListEl) return;
      readLaterListEl.innerHTML = readLaterNews.map((item, index) => `
          <li>
              <a href="${item.url}" target="${newsSettings.openInNewTab ? '_blank' : '_self'}" rel="noopener noreferrer">${item.title}</a>
              <button onclick="removeReadLater(${index})" title="Remove" style="background:none; border:none; color:var(--accent-color); cursor:pointer;">&times;</button>
          </li>
      `).join('');
  }

  window.addReadLater = function(index, title, url) { // Make global
      // Optional: Get data from stored dataset if not passed directly
      // const articles = JSON.parse(newsContainer.dataset.articles || '[]');
      // const article = articles[index];
      if (title && url) {
          if (!readLaterNews.some(item => item.url === url)) {
              readLaterNews.push({ title, url });
              localStorage.setItem('readLaterNews', JSON.stringify(readLaterNews));
              renderReadLaterList();
          } else {
              alert('Article already in Read Later list.');
          }
      }
  }

  window.removeReadLater = function(index) { // Make global
      readLaterNews.splice(index, 1);
      localStorage.setItem('readLaterNews', JSON.stringify(readLaterNews));
      renderReadLaterList();
  }

  // Initial Load
  fetchNews();
  renderReadLaterList();

  // News Controls
  if (newsCategoriesContainer) {
      newsCategoriesContainer.addEventListener('click', (e) => {
          if (e.target.classList.contains('news-category')) {
              const category = e.target.dataset.category;
              fetchNews(category);
          }
      });
  }
  if (newsRefreshBtn) {
      newsRefreshBtn.addEventListener('click', () => fetchNews());
  }
  if (newsSettingsBtn) {
      newsSettingsBtn.addEventListener('click', () => {
          // Populate news settings modal
          if (newsSettingsForm) {
              newsSettingsForm.elements.newsSource.value = newsSettings.source;
              newsSettingsForm.elements.rssUrl.value = newsSettings.rssUrl || '';
              newsSettingsForm.elements.openInNewTab.checked = newsSettings.openInNewTab;
              rssOptionsDiv.style.display = newsSettings.source === 'rss' ? 'block' : 'none';
          }
          if (newsSettingsModal) newsSettingsModal.style.display = 'block';
      });
  }
  if (closeNewsSettingsBtn) {
      closeNewsSettingsBtn.addEventListener('click', () => {
          if (newsSettingsModal) newsSettingsModal.style.display = 'none';
      });
  }

  // News Settings Modal Logic
  if (newsSettingsForm) {
      newsSettingsForm.elements.newsSource.addEventListener('change', (e) => {
          rssOptionsDiv.style.display = e.target.value === 'rss' ? 'block' : 'none';
      });

      newsSettingsForm.addEventListener('submit', (e) => {
          e.preventDefault();
          newsSettings.source = newsSettingsForm.elements.newsSource.value;
          newsSettings.rssUrl = newsSettingsForm.elements.rssUrl.value.trim();
          newsSettings.openInNewTab = newsSettingsForm.elements.openInNewTab.checked;

          if (newsSettings.source === 'rss' && !newsSettings.rssUrl) {
              alert('Please enter an RSS Feed URL.');
              return;
          }

          localStorage.setItem('newsSettings', JSON.stringify(newsSettings));
          if (newsSettingsModal) newsSettingsModal.style.display = 'none';
          fetchNews(); // Refresh news with new settings
          renderReadLaterList(); // Re-render in case target changed
      });
  }

  // --- Placeholder Widgets ---
  // Add basic setup for other widgets mentioned in HTML/README if they exist
  const bookmarksWidget = document.getElementById('bookmarks');
  const aiWidget = document.getElementById('ai');
  const translatorWidget = document.getElementById('translator');
  const utilitiesWidget = document.getElementById('utilities');

  if (bookmarksWidget && settings.widgetBookmarks) {
      bookmarksWidget.innerHTML += '<p>Bookmark functionality not yet implemented.</p>';
      // TODO: Implement bookmark logic (localStorage or IndexedDB)
  }
  if (aiWidget && settings.widgetAI) {
      aiWidget.innerHTML += '<p>AI Assistant functionality not yet implemented.</p>';
      // TODO: Implement OpenAI or other LLM integration
  }
  if (translatorWidget && settings.widgetTranslator) {
      translatorWidget.innerHTML += '<p>Translator functionality not yet implemented.</p>';
      // TODO: Implement translation API (e.g., Google Translate)
  }
  if (utilitiesWidget && settings.widgetUtilities) {
      utilitiesWidget.innerHTML += '<p>Utility Toolbox functionality not yet implemented.</p>';
      // TODO: Implement converters, QR generator etc.
  }
  // --- End Placeholder Widgets ---

}); // End DOMContentLoaded
