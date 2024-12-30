document.addEventListener('DOMContentLoaded', () => {
    // Theme Toggle
    const themeToggle = document.getElementById('themeToggle');
    themeToggle?.addEventListener('click', () => {
        const currentTheme = document.body.dataset.theme === 'dark' ? 'light' : 'dark';
        document.body.dataset.theme = currentTheme;
        localStorage.setItem('theme', currentTheme);
    });

    // Restore Theme
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
        document.body.dataset.theme = savedTheme;
    }

    // Search Functionality
    const searchInput = document.getElementById('searchInput');
    const searchEngines = {
        google: 'https://www.google.com/search?q=',
        duckduckgo: 'https://duckduckgo.com/?q=',
        bing: 'https://www.bing.com/search?q=',
        perplexity: 'https://www.perplexity.ai/search?q='
    };

    document.querySelector('.search-engines')?.addEventListener('click', (e) => {
        const engine = e.target.dataset.engine;
        if (engine && searchEngines[engine]) {
            const query = encodeURIComponent(searchInput?.value.trim());
            if (query) {
                window.open(`${searchEngines[engine]}${query}`, '_blank');
            } else {
                alert('Please enter a search query.');
            }
        }
    });

    // Notes Functionality
    const notesArea = document.getElementById('notesArea');
    if (notesArea) {
        notesArea.value = localStorage.getItem('notes') || '';
        notesArea.addEventListener('input', () => {
            localStorage.setItem('notes', notesArea.value);
        });
    }

    // Calculator
    const calcInput = document.getElementById('calcInput');
    const calcButtons = document.querySelector('.calc-buttons');
    if (calcButtons && calcInput) {
        const buttons = 'C789/456*123-0.=+'.split('');
        buttons.forEach((btn) => {
            const button = document.createElement('button');
            button.textContent = btn;
            button.addEventListener('click', () => {
                if (btn === 'C') {
                    calcInput.value = '';
                } else if (btn === '=') {
                    try {
                        calcInput.value = eval(calcInput.value) || '';
                    } catch {
                        calcInput.value = 'Error';
                    }
                } else {
                    calcInput.value += btn;
                }
            });
            calcButtons.appendChild(button);
        });
    }

    // Todo List
    const todoInput = document.getElementById('todoInput');
    const todoList = document.getElementById('todoList');
    const addTodoButton = document.getElementById('addTodo');
    let todos = JSON.parse(localStorage.getItem('todos')) || [];

    const updateTodos = () => {
        localStorage.setItem('todos', JSON.stringify(todos));
        todoList.innerHTML = todos.map((todo, i) => `
            <li>
                <input type="checkbox" ${todo.done ? 'checked' : ''} onchange="toggleTodo(${i})">
                <span>${todo.text}</span>
                <button onclick="deleteTodo(${i})">×</button>
            </li>
        `).join('');
    };

    const addTodo = () => {
        const text = todoInput.value.trim();
        if (text) {
            todos.push({ text, done: false });
            todoInput.value = '';
            updateTodos();
        }
    };

    const toggleTodo = (index) => {
        todos[index].done = !todos[index].done;
        updateTodos();
    };

    const deleteTodo = (index) => {
        todos.splice(index, 1);
        updateTodos();
    };

    if (addTodoButton && todoInput && todoList) {
        window.toggleTodo = toggleTodo;
        window.deleteTodo = deleteTodo;
        addTodoButton.addEventListener('click', addTodo);
        updateTodos();
    }

    // Weather Functionality
    const weatherInfo = document.getElementById('weatherInfo');
    if (weatherInfo) {
        navigator.geolocation.getCurrentPosition(async (position) => {
            try {
                const { latitude, longitude } = position.coords;
                const response = await fetch(
                    `https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&units=metric&appid=your_api_key_here`
                );
                if (!response.ok) throw new Error('Weather data fetch failed');
                const data = await response.json();
                weatherInfo.innerHTML = `
                    <p>${data.name}</p>
                    <p>${Math.round(data.main.temp)}°C</p>
                    <p>${data.weather[0].main}</p>
                `;
            } catch (error) {
                weatherInfo.innerHTML = `<p>Error fetching weather data</p>`;
            }
        });
    }
});
