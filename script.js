document.addEventListener('DOMContentLoaded', () => {
    // Theme Toggle
    const themeToggle = document.getElementById('themeToggle');
    themeToggle.addEventListener('click', () => {
        document.body.dataset.theme = document.body.dataset.theme === 'dark' ? 'light' : 'dark';
        localStorage.setItem('theme', document.body.dataset.theme);
    });

    // Search Functionality
    const searchInput = document.getElementById('searchInput');
    const searchEngines = {
        google: 'https://www.google.com/search?q=',
        duckduckgo: 'https://duckduckgo.com/?q=',
        bing: 'https://www.bing.com/search?q=',
        perplexity: 'https://www.perplexity.ai/?q='
    };

    document.querySelector('.search-engines').addEventListener('click', (e) => {
        if (e.target.dataset.engine) {
            const query = encodeURIComponent(searchInput.value);
            if (query) {
                window.open(searchEngines[e.target.dataset.engine] + query, '_blank');
            }
        }
    });

    // Notes
    const notesArea = document.getElementById('notesArea');
    notesArea.value = localStorage.getItem('notes') || '';
    notesArea.addEventListener('input', () => {
        localStorage.setItem('notes', notesArea.value);
    });

    // Calculator
    const calcInput = document.getElementById('calcInput');
    const calcButtons = document.querySelector('.calc-buttons');
    const buttons = '789/456*123-0.=+'.split('');
    
    buttons.forEach(btn => {
        const button = document.createElement('button');
        button.textContent = btn;
        button.onclick = () => {
            if (btn === '=') {
                try {
                    calcInput.value = eval(calcInput.value);
                } catch (e) {
                    calcInput.value = 'Error';
                }
            } else {
                calcInput.value += btn;
            }
        };
        calcButtons.appendChild(button);
    });

    // Todo List
    const todoInput = document.getElementById('todoInput');
    const todoList = document.getElementById('todoList');
    const todos = JSON.parse(localStorage.getItem('todos')) || [];

    function updateTodos() {
        localStorage.setItem('todos', JSON.stringify(todos));
        todoList.innerHTML = todos.map((todo, i) => `
            <li>
                <input type="checkbox" ${todo.done ? 'checked' : ''} 
                       onchange="toggleTodo(${i})">
                <span>${todo.text}</span>
                <button onclick="deleteTodo(${i})">×</button>
            </li>
        `).join('');
    }

    window.addTodo = () => {
        const text = todoInput.value.trim();
        if (text) {
            todos.push({ text, done: false });
            todoInput.value = '';
            updateTodos();
        }
    };

    window.toggleTodo = (index) => {
        todos[index].done = !todos[index].done;
        updateTodos();
    };

    window.deleteTodo = (index) => {
        todos.splice(index, 1);
        updateTodos();
    };

    document.getElementById('addTodo').onclick = window.addTodo;

    // Weather
    navigator.geolocation.getCurrentPosition(async (position) => {
        const { latitude, longitude } = position.coords;
        const response = await fetch(
            `https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&units=metric&appid=c94855a6ee90b695d89354f672ca47bc`
        );
        const data = await response.json();
        document.getElementById('weatherInfo').innerHTML = `
            <p>${data.name}</p>
            <p>${Math.round(data.main.temp)}°C</p>
            <p>${data.weather[0].main}</p>
        `;
    });
});
