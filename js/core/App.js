import SearchManager from '../features/SearchManager.js';
import Calculator from '../features/Calculator.js';
import NotesManager from '../features/NotesManager.js';
import ThemeManager from '../utils/ThemeManager.js';
import StorageManager from '../utils/StorageManager.js';
import { CONFIG } from '../config.js';

class App {
    constructor() {
        this.managers = new Map();
        this.state = {
            activePanel: null,
            searchEngine: localStorage.getItem('defaultEngine') || 'google',
            theme: localStorage.getItem('theme') || 'system'
        };
        this.init();
    }

    async init() {
        try {
            // Initialize core managers
            this.managers.set('storage', new StorageManager());
            this.managers.set('theme', new ThemeManager(this.state.theme));
            this.managers.set('search', new SearchManager(CONFIG.searchEngines));
            this.managers.set('calculator', new Calculator('#calculatorPanel'));
            this.managers.set('notes', new NotesManager('#notesPanel'));

            // Setup keyboard shortcuts
            this.setupKeyboardShortcuts();
            
            // Setup tool panels
            this.setupPanels();

            console.log('App initialized successfully');
        } catch (error) {
            this.handleError(error);
        }
    }

    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Search focus: Ctrl + K
            if (e.ctrlKey && e.key === 'k') {
                e.preventDefault();
                document.querySelector('#searchInput').focus();
            }
            // Calculator: Ctrl + Shift + C
            if (e.ctrlKey && e.shiftKey && e.key === 'C') {
                e.preventDefault();
                this.togglePanel('calculator');
            }
            // Notes: Ctrl + Shift + N
            if (e.ctrlKey && e.shiftKey && e.key === 'N') {
                e.preventDefault();
                this.togglePanel('notes');
            }
            // Theme toggle: Ctrl + Shift + T
            if (e.ctrlKey && e.shiftKey && e.key === 'T') {
                e.preventDefault();
                this.managers.get('theme').toggle();
            }
        });
    }

    setupPanels() {
        document.querySelectorAll('.tool-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const tool = btn.dataset.tool;
                this.togglePanel(tool);
            });
        });

        // Close panels when clicking outside
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.tool-btn') && 
                !e.target.closest('.panel') && 
                this.state.activePanel) {
                this.togglePanel(this.state.activePanel);
            }
        });
    }

    togglePanel(panelName) {
        if (this.state.activePanel === panelName) {
            this.closePanel(panelName);
            this.state.activePanel = null;
        } else {
            if (this.state.activePanel) {
                this.closePanel(this.state.activePanel);
            }
            this.openPanel(panelName);
            this.state.activePanel = panelName;
        }
    }

    openPanel(panelName) {
        const panel = document.querySelector(`#${panelName}Panel`);
        if (!panel) return;

        panel.classList.remove('hidden');
        requestAnimationFrame(() => {
            panel.classList.add('panel-visible');
        });
    }

    closePanel(panelName) {
        const panel = document.querySelector(`#${panelName}Panel`);
        if (!panel) return;

        panel.classList.remove('panel-visible');
        panel.addEventListener('transitionend', () => {
            panel.classList.add('hidden');
        }, { once: true });
    }

    handleError(error) {
        console.error('Application error:', error);
        this.showToast(`Error: ${error.message}`, 'error');
    }

    showToast(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.textContent = message;
        document.body.appendChild(toast);

        setTimeout(() => {
            toast.classList.add('fade-out');
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.app = new App();
});
