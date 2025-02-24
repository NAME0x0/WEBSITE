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
    ['notes', 'calculator', 'todo', 'weather', 'clock'].forEach(widget => {
      document.getElementById(widget).style.display = settings[`widget${widget.charAt(0).toUpperCase() + widget.slice(1)}`] ? 'block' : 'none';
    });
  }
  applyWidgetVisibility();

  // Theme Toggle
  const themeToggle = document.getElementById('themeToggle');
  themeToggle.addEventListener('click', () => {
    const newTheme = document.body.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    document.body.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
  });

  const savedTheme = localStorage.getItem('theme');
  if (savedTheme) document.body.setAttribute('data-theme', savedTheme);

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
    Object.keys(defaultSettings).forEach(key => {
      if (settingsForm.elements[key]) {
        if (typeof settings[key] === 'boolean') {
          settingsForm.elements[key].checked = settings[key];
        } else {
          settingsForm.elements[key].value = settings[key];
        }
      }
    });
    settingsModal.style.display = 'block';
  });

  closeSettings.addEventListener('click', () => settingsModal.style.display = 'none');
  window.addEventListener('click', (e) => {
    if (e.target === settingsModal) settingsModal.style.display = 'none';
  });

  settingsForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const formData = new FormData(settingsForm);
    Object.keys(defaultSettings).forEach(key => {
      settings[key] = formData.get(key) === 'on' || formData.get(key);
    });

    localStorage.setItem('dashboardSettings', JSON.stringify(settings));
    applyWidgetVisibility();
    settingsModal.style.display = 'none';
  });

  // Notes Widget
  const notesArea = document.getElementById('notesArea');
  if (notesArea) {
    notesArea.value = localStorage.getItem('notes') || '';
    notesArea.addEventListener('input', () => localStorage.setItem('notes', notesArea.value));
  }

  // Calculator Widget
  const calcInput = document.getElementById('calcInput');
  const calcButtonsContainer = document.querySelector('.calc-buttons');
  if (calcInput && calcButtonsContainer) {
    const calcButtons = ['C', '7', '8', '9', '/', '4', '5', '6', '*', '1', '2', '3', '-', '0', '.', '=', '+'];

    calcButtons.forEach(btn => {
      const button = document.createElement('button');
      button.textContent = btn;
      button.classList.add('calc-button');
      button.addEventListener('click', () => {
        if (btn === 'C') {
          calcInput.value = '';
        } else if (btn === '=') {
          try {
            calcInput.value = Function(`"use strict"; return (${calcInput.value})`)();
          } catch {
            calcInput.value = 'Error';
          }
        } else {
          calcInput.value += btn;
        }
      });
      calcButtonsContainer.appendChild(button);
    });
  }

  // To-Do List Widget
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

  // Weather Widget using Open-Meteo API
  const weatherInfo = document.getElementById('weatherInfo');

  function fetchWeather(lat, lon) {
    fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true`)
      .then(response => response.json())
      .then(data => {
        if (data?.current_weather) {
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
      position => fetchWeather(position.coords.latitude, position.coords.longitude),
      () => weatherInfo.innerHTML = '<p>Location access denied.</p>'
    );
  } else {
    weatherInfo.innerHTML = '<p>Geolocation not supported.</p>';
  }

  // Clock Widget - update every second
  const clockDisplay = document.getElementById('clockDisplay');

  function updateClock() {
    clockDisplay.textContent = new Date().toLocaleTimeString();
  }

  updateClock();
  setInterval(updateClock, 1000);
});
