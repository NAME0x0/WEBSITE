document.addEventListener('DOMContentLoaded', () => {
  // Default Settings
  const defaultSettings = {
    defaultEngine: 'google',
    widgetNotes: true,
    widgetCalculator: true,
    widgetTodo: true,
    widgetWeather: true,
    widgetClock: true
  };
  let settings = JSON.parse(localStorage.getItem('dashboardSettings')) || defaultSettings;

  // Apply Widget Visibility
  function applyWidgetVisibility() {
    document.getElementById('notes').style.display = settings.widgetNotes ? 'block' : 'none';
    document.getElementById('calculator').style.display = settings.widgetCalculator ? 'block' : 'none';
    document.getElementById('todo').style.display = settings.widgetTodo ? 'block' : 'none';
    document.getElementById('weather').style.display = settings.widgetWeather ? 'block' : 'none';
    document.getElementById('clock').style.display = settings.widgetClock ? 'block' : 'none';
  }
  applyWidgetVisibility();

  // Theme Toggle
  const themeToggle = document.getElementById('themeToggle');
  themeToggle.addEventListener('click', () => {
    const currentTheme = document.body.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    document.body.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
  });
  const savedTheme = localStorage.getItem('theme');
  if (savedTheme) {
    document.body.setAttribute('data-theme', savedTheme);
  }

  // Search Functionality
  const searchInput = document.getElementById('searchInput');
  const searchBtn = document.getElementById('searchBtn');
  const searchEngines = {
    google: 'https://www.google.com/search?q=',
    duckduckgo: 'https://duckduckgo.com/?q=',
    bing: 'https://www.bing.com/search?q=',
    perplexity: 'https://www.perplexity.ai/?q='
  };
  function performSearch() {
    const query = encodeURIComponent(searchInput.value.trim());
    if (query) {
      const engineUrl = searchEngines[settings.defaultEngine] || searchEngines.google;
      window.open(engineUrl + query, '_blank');
    }
  }
  searchBtn.addEventListener('click', performSearch);
  searchInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      performSearch();
    }
  });

  // Settings Modal Functionality
  const settingsToggle = document.getElementById('settingsToggle');
  const settingsModal = document.getElementById('settingsModal');
  const closeSettings = document.getElementById('closeSettings');
  const settingsForm = document.getElementById('settingsForm');

  settingsToggle.addEventListener('click', () => {
    // Pre-fill settings form with current values
    settingsForm.elements['defaultEngine'].value = settings.defaultEngine;
    settingsForm.elements['widgetNotes'].checked = settings.widgetNotes;
    settingsForm.elements['widgetCalculator'].checked = settings.widgetCalculator;
    settingsForm.elements['widgetTodo'].checked = settings.widgetTodo;
    settingsForm.elements['widgetWeather'].checked = settings.widgetWeather;
    settingsForm.elements['widgetClock'].checked = settings.widgetClock;
    settingsModal.style.display = 'block';
  });
  closeSettings.addEventListener('click', () => settingsModal.style.display = 'none');
  window.addEventListener('click', (e) => { if (e.target === settingsModal) settingsModal.style.display = 'none'; });
  settingsForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const formData = new FormData(settingsForm);
    settings.defaultEngine = formData.get('defaultEngine');
    settings.widgetNotes = formData.get('widgetNotes') === 'on';
    settings.widgetCalculator = formData.get('widgetCalculator') === 'on';
    settings.widgetTodo = formData.get('widgetTodo') === 'on';
    settings.widgetWeather = formData.get('widgetWeather') === 'on';
    settings.widgetClock = formData.get('widgetClock') === 'on';
    localStorage.setItem('dashboardSettings', JSON.stringify(settings));
    applyWidgetVisibility();
    settingsModal.style.display = 'none';
  });

  // Notes Widget
  const notesArea = document.getElementById('notesArea');
  notesArea.value = localStorage.getItem('notes') || '';
  notesArea.addEventListener('input', () => localStorage.setItem('notes', notesArea.value));

  // To‑Do List Widget
  const todoInput = document.getElementById('todoInput');
  const todoList = document.getElementById('todoList');
  const addTodoButton = document.getElementById('addTodo');
  let todos = JSON.parse(localStorage.getItem('todos')) || [];
  function updateTodos() {
    localStorage.setItem('todos', JSON.stringify(todos));
    todoList.innerHTML = todos.map((todo, idx) => `
      <li>
        <input type="checkbox" ${todo.done ? 'checked' : ''} onchange="toggleTodo(${idx})">
        <span>${todo.text}</span>
        <button onclick="deleteTodo(${idx})" title="Delete Task">×</button>
      </li>
    `).join('');
  }
  addTodoButton.addEventListener('click', () => {
    const text = todoInput.value.trim();
    if (text) {
      todos.push({ text, done: false });
      todoInput.value = '';
      updateTodos();
    }
  });
  window.toggleTodo = function(idx) {
    todos[idx].done = !todos[idx].done;
    updateTodos();
  };
  window.deleteTodo = function(idx) {
    todos.splice(idx, 1);
    updateTodos();
  };
  updateTodos();

  // Weather Widget using Open‑Meteo API
  const weatherInfo = document.getElementById('weatherInfo');
  function fetchWeather(lat, lon) {
    fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true`)
      .then(response => response.json())
      .then(data => {
        if (data && data.current_weather) {
          const { temperature, windspeed } = data.current_weather;
          weatherInfo.innerHTML = `<p>Temp: ${temperature}°C | Wind: ${windspeed} km/h</p>`;
        } else {
          weatherInfo.innerHTML = '<p>Weather data unavailable.</p>';
        }
      })
      .catch(() => weatherInfo.innerHTML = '<p>Error fetching weather data.</p>');
  }
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        fetchWeather(latitude, longitude);
      },
      () => weatherInfo.innerHTML = '<p>Location access denied.</p>'
    );
  } else {
    weatherInfo.innerHTML = '<p>Geolocation not supported.</p>';
  }

  // Clock Widget - update every second
  const clockDisplay = document.getElementById('clockDisplay');
  function updateClock() {
    const now = new Date();
    clockDisplay.textContent = now.toLocaleTimeString();
  }
  updateClock();
  setInterval(updateClock, 1000);
});
 //tiny emoji did not get added but we move
