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

  let storedSettings = localStorage.getItem('dashboardSettings');
  let settings = storedSettings ? JSON.parse(storedSettings) : defaultSettings;

  // Apply Widget Visibility
  function applyWidgetVisibility() {
    const widgets = ['notes', 'calculator', 'todo', 'weather', 'clock'];
    widgets.forEach(widget => {
      const element = document.getElementById(widget);
      if (element) {
        element.style.display = settings[`widget${widget.charAt(0).toUpperCase() + widget.slice(1)}`] ? 'block' : 'none';
      }
    });
  }
  applyWidgetVisibility();

  // Calculator Widget - Ensure Elements Exist Before Running Script
  const calcInput = document.getElementById('calcInput');
  const calcButtonsContainer = document.querySelector('.calc-buttons');

  console.log(calcButtonsContainer); // Debugging: Ensure this exists

  if (calcInput && calcButtonsContainer) {
    const calcButtons = ['C', '7', '8', '9', '/', '4', '5', '6', '*', '1', '2', '3', '-', '0', '.', '=', '+'];

    calcButtons.forEach((btn) => {
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
  } else {
    console.error("Calculator elements not found in the DOM. Make sure your HTML has the correct IDs and classes.");
  }

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

  // Notes Widget
  const notesArea = document.getElementById('notesArea');
  if (notesArea) {
    notesArea.value = localStorage.getItem('notes') || '';
    notesArea.addEventListener('input', () => localStorage.setItem('notes', notesArea.value));
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
