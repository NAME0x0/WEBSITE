// Initialize necessary features when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', () => {
    // Because unlike some people, the theme manager knows how to adapt gracefully
    ThemeManager.init();

    // Initialize the search functionality with autocomplete and history
    SearchManager.init();

    // Initialize the material design transitions (e.g., card hover effects)
    MaterialTransitions.init();

    // Initialize the calculator functionality
    initCalculator();

    // Initialize the notes functionality for saving and displaying notes
    initNotes();

    // Add smooth brain page transitions, perfect for that “genius” who could use it
    window.addEventListener('beforeunload', () => {
        document.body.classList.add('page-transition');
    });
});

// ----------------------------- Theme Management -----------------------------

const ThemeManager = {
    init() {
        // Load saved theme from localStorage or default to 'dark'
        const savedTheme = localStorage.getItem('theme') || 'dark';
        document.documentElement.setAttribute('data-theme', savedTheme);
        this.setupThemeToggle();
    },
    setupThemeToggle() {
        // Set up the theme toggle button to switch between light and dark modes
        const themeToggle = document.getElementById('themeToggle');
        themeToggle.addEventListener('click', () => this.toggleTheme());
    },
    toggleTheme() {
        const root = document.documentElement;
        const currentTheme = root.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        
        // Updating the theme and save preference to localStorage
        root.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
    }
};

// ----------------------------- Search Functionality --------------------------

const SearchManager = {
    init() {
        // Set up search bar with autocomplete and history
        const searchBar = document.getElementById('searchBar');
        this.setupSearchHistory();
        this.setupAutocomplete(searchBar);
    },
    setupSearchHistory() {
        // Placeholder for managing and displaying search history
        const history = StorageManager.get('searchHistory') || [];
        console.log('Search History:', history);
    },
    setupAutocomplete(searchBar) {
        searchBar.addEventListener('input', this.debounce(async (e) => {
            const query = e.target.value;
            if (query.length < 2) return;

            try {
                // Local and online search (placeholders)
                const localResults = this.searchLocal(query);
                this.showResults(localResults);

                const onlineResults = await this.searchOnline(query);
                this.showResults([...localResults, ...onlineResults]);
            } catch (error) {
                console.error('Search error:', error);
            }
        }, 300));
    },
    searchLocal(query) {
        // Placeholder for local search logic
        return [];
    },
    async searchOnline(query) {
        // Placeholder for online search logic
        return [];
    },
    debounce(func, wait) {
        // Utility function to limit frequent calls
        let timeout;
        return function (...args) {
            clearTimeout(timeout);
            timeout = setTimeout(() => func(...args), wait);
        };
    },
    showResults(results) {
        // Placeholder to display search results
        console.log('Results:', results);
    }
};

// ----------------------------- Notes Functionality --------------------------

function initNotes() {
    const notesArea = document.querySelector('.notes-box');
    const saveButton = notesArea.nextElementSibling;

    // Display saved notes on page load
    displaySavedNotes();

    saveButton.addEventListener('click', () => {
        if (!notesArea.value.trim()) return;

        const note = {
            content: notesArea.value,
            timestamp: new Date().toISOString(),
            id: Date.now()
        };

        const notes = StorageManager.get('notes') || [];
        notes.unshift(note);
        StorageManager.set('notes', notes);

        displaySavedNotes();
        notesArea.value = '';
        showToast('Note saved successfully!');
    });
}

function displaySavedNotes() {
    const notesGrid = document.getElementById('saved-notes');
    const notes = StorageManager.get('notes') || [];

    notesGrid.innerHTML = notes.map(note => `
        <div class="note-card">
            <p>${note.content}</p>
            <span class="note-timestamp">${new Date(note.timestamp).toLocaleDateString()}</span>
        </div>
    `).join('');
}

// ----------------------------- Calculator Functionality ----------------------

function initCalculator() {
    const calculator = document.querySelector('.calculator');
    const display = calculator.querySelector('.calculator-display');
    const basicButtons = calculator.querySelector('.calculator-buttons');
    const scientificButtons = calculator.querySelector('.scientific-buttons');
    const toggleButton = calculator.querySelector('.calculator-toggle');

    // Create buttons for basic and scientific modes
    createButtons(basicButtons, ['7', '8', '9', '/', '4', '5', '6', '*', '1', '2', '3', '-', 'C', '0', '=', '+']);
    createButtons(scientificButtons, ['sin', 'cos', 'tan', 'π', 'log', 'ln', 'e', '^', '√', '(', ')', '%', 'x²', 'x³', '1/x', '!']);

    // Toggle between basic and scientific modes
    toggleButton.addEventListener('click', () => {
        calculator.classList.toggle('scientific');
        toggleButton.textContent = calculator.classList.contains('scientific') ? 'Basic Mode' : 'Scientific Mode';
    });
}

function createButtons(container, buttons) {
    buttons.forEach(btn => {
        const button = document.createElement('button');
        button.textContent = btn;
        button.className = 'calculator-btn';
        container.appendChild(button);

        button.addEventListener('click', () => handleCalculatorInput(btn));
    });
}

function handleCalculatorInput(value) {
    const display = document.querySelector('.calculator-display');

    switch (value) {
        case 'C':
            display.value = '';
            break;
        case '=':
            try {
                display.value = eval(display.value); // Evaluate basic operations
            } catch (e) {
                display.value = 'Error';
            }
            break;
        default:
            display.value += value;
    }
}

// -------------------------- Utility and Enhancements ------------------------

const StorageManager = {
    set: (key, value) => {
        try {
            localStorage.setItem(key, JSON.stringify(value));
        } catch (e) {
            console.warn('Storage quota exceeded');
        }
    },
    get: (key) => {
        try {
            return JSON.parse(localStorage.getItem(key));
        } catch {
            return null;
        }
    }
};

function showToast(message) {
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    document.body.appendChild(toast);

    setTimeout(() => {
        toast.remove();
    }, 3000);
}

const MaterialTransitions = {
    init() {
        this.setupCardTransitions();
    },
    setupCardTransitions() {
        document.querySelectorAll('.material-card').forEach(card => {
            card.addEventListener('mouseenter', () => {
                card.style.transform = 'translateY(-5px) scale(1.02)';
                card.style.boxShadow = '0 8px 16px rgba(0,0,0,0.2)';
            });
            card.addEventListener('mouseleave', () => {
                card.style.transform = 'translateY(0) scale(1)';
                card.style.boxShadow = '';
            });
        });
    }
};
