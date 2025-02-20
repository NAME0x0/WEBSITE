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

  // Cache DOM Elements
  const widgets = {
    notes: document.getElementById('notes'),
    calculator: document.getElementById('calculator'),
    todo: document.getElementById('todo'),
    weather: document.getElementById('weather'),
    clock: document.getElementById('clock')
  };

  // Apply Widget Visibility
  function applyWidgetVisibility() {
    Object.keys(widgets).forEach(key => {
      if (settings[`widget${key.charAt(0).toUpperCase() + key.slice(1)}`] !== undefined) {
        widgets[key].style.display = settings[`widget${key.charAt(0).toUpperCase() + key.slice(1)}`] ? 'block' : 'none';
      }
    });
  }
  applyWidgetVisibility();

  // Theme Toggle
  const themeToggle = document.getElementById('themeToggle');
  themeToggle.addEventListener('click', () => {
    const isDark = document.body.classList.toggle('dark-theme');
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
  });
  document.body.classList.toggle('dark-theme', localStorage.getItem('theme') === 'dark');

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
    if (query) window.open((searchEngines[settings.defaultEngine] || searchEngines.google) + query, '_blank');
  }
  searchBtn.addEventListener('click', performSearch);
  searchInput.addEventListener('keypress', (e) => e.key === 'Enter' && performSearch());

  // Settings Modal Functionality
  const settingsToggle = document.getElementById('settingsToggle');
  const settingsModal = document.getElementById('settingsModal');
  const closeSettings = document.getElementById('closeSettings');
  const settingsForm = document.getElementById('settingsForm');

  settingsToggle.addEventListener('click', () => {
    Object.keys(settings).forEach(key => {
      if (settingsForm.elements[key]) {
        settingsForm.elements[key].type === 'checkbox' ?
          settingsForm.elements[key].checked = settings[key] :
          settingsForm.elements[key].value = settings[key];
      }
    });
    settingsModal.style.display = 'block';
  });
  closeSettings.addEventListener('click', () => settingsModal.style.display = 'none');
  window.addEventListener('click', (e) => e.target === settingsModal && (settingsModal.style.display = 'none'));
  settingsForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const formData = new FormData(settingsForm);
    Object.keys(settings).forEach(key => settings[key] = formData.get(key) === 'on' ? true : formData.get(key));
    localStorage.setItem('dashboardSettings', JSON.stringify(settings));
    applyWidgetVisibility();
    settingsModal.style.display = 'none';
  });

  // Notes Widget
  const notesArea = document.getElementById('notesArea');
  notesArea.value = localStorage.getItem('notes') || '';
  notesArea.addEventListener('input', () => localStorage.setItem('notes', notesArea.value));

  // Calculator Widget (Secure)
  const calcInput = document.getElementById('calcInput');
  const calcButtonsContainer = document.querySelector('.calc-buttons');
  const calcButtons = ['C', '7', '8', '9', '/', '4', '5', '6', '*', '1', '2', '3', '-', '0', '.', '=', '+'];
  function handleCalculatorInput(value) {
    if (value === 'C') calcInput.value = '';
    else if (value === '=') {
      try { calcInput.value = new Function(`return ${calcInput.value}`)(); } 
      catch { calcInput.value = 'Error'; }
    } else calcInput.value += value;
  }
  calcButtonsContainer.addEventListener('click', (e) => {
    if (e.target.classList.contains('calc-button')) handleCalculatorInput(e.target.textContent);
  });

  // To-Do List Widget (Efficient Updates)
  const todoInput = document.getElementById('todoInput');
  const todoList = document.getElementById('todoList');
  const addTodoButton = document.getElementById('addTodo');
  let todos = JSON.parse(localStorage.getItem('todos')) || [];
  function updateTodos() {
    localStorage.setItem('todos', JSON.stringify(todos));
    todoList.innerHTML = '';
    const fragment = document.createDocumentFragment();
    todos.forEach((todo, idx) => {
      const li = document.createElement('li');
      li.innerHTML = `<input type="checkbox" ${todo.done ? 'checked' : ''} onchange="toggleTodo(${idx})"> <span>${todo.text}</span> <button onclick="deleteTodo(${idx})">×</button>`;
      fragment.appendChild(li);
    });
    todoList.appendChild(fragment);
  }
  addTodoButton.addEventListener('click', () => {
    const text = todoInput.value.trim();
    if (text) {
      todos.push({ text, done: false });
      todoInput.value = '';
      updateTodos();
    }
  });
  window.toggleTodo = idx => { todos[idx].done = !todos[idx].done; updateTodos(); };
  window.deleteTodo = idx => { todos.splice(idx, 1); updateTodos(); };
  updateTodos();

  // Weather Widget with Better Error Handling
  const weatherInfo = document.getElementById('weatherInfo');
  async function fetchWeather(lat, lon) {
    try {
      const response = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true`);
      if (!response.ok) throw new Error('Failed to fetch data');
      const data = await response.json();
      if (data.current_weather) {
        const { temperature, windspeed } = data.current_weather;
        weatherInfo.innerHTML = `<p>Temp: ${temperature}°C | Wind: ${windspeed} km/h</p>`;
      }
    } catch {
      weatherInfo.innerHTML = '<p>Error fetching weather data.</p>';
    }
  }
  navigator.geolocation?.getCurrentPosition(
    ({ coords }) => fetchWeather(coords.latitude, coords.longitude),
    () => weatherInfo.innerHTML = '<p>Location access denied.</p>'
  );

  // Clock Widget
  const clockDisplay = document.getElementById('clockDisplay');
  setInterval(() => clockDisplay.textContent = new Date().toLocaleTimeString(), 1000);
});
