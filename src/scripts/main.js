import { Calculator } from './calculator.js';
import { NotesManager } from './notes.js';

document.addEventListener('DOMContentLoaded', () => {
    // Initialize calculator
    const calculator = new Calculator(document.querySelector('#calculator'));
    
    // Initialize notes
    const notes = new NotesManager(document.querySelector('#notes'));
    
    // Theme toggle
    const themeToggle = document.querySelector('.theme-toggle');
    themeToggle.addEventListener('click', () => {
        const theme = document.documentElement.getAttribute('data-theme');
        document.documentElement.setAttribute('data-theme', theme === 'dark' ? 'light' : 'dark');
        localStorage.setItem('theme', theme === 'dark' ? 'light' : 'dark');
    });
});
