// Notes Functionality
const notesArea = document.getElementById("notesArea");
const saveNotesBtn = document.getElementById("saveNotes");

// Load Saved Notes
window.onload = () => {
  const savedNotes = localStorage.getItem("userNotes");
  if (savedNotes) notesArea.value = savedNotes;
};

// Save Notes
saveNotesBtn.addEventListener("click", () => {
  localStorage.setItem("userNotes", notesArea.value);
  alert("Notes saved successfully!");
});

// Search Bar Placeholder Logic
const searchBar = document.getElementById("searchBar");
searchBar.addEventListener("input", () => {
  console.log(`Searching for: ${searchBar.value}`);  // Corrected template string
});

// Tools Placeholder (Calculator and Stopwatch)
const tool1 = document.getElementById("tool1");
const tool2 = document.getElementById("tool2");
const calculator = document.getElementById("calculator");

// Show/Hide Calculator
tool1.addEventListener("click", () => {
  calculator.style.display = calculator.style.display === "none" ? "block" : "none";
});

// Calculator Logic
let currentInput = "";
let operator = "";

// Append number to the display
function appendNumber(number) {
  currentInput += number;
  updateCalculatorDisplay(currentInput);
}

// Append operator to the display
function appendOperator(op) {
  if (currentInput !== "") {
    currentInput += " " + op + " ";
    updateCalculatorDisplay(currentInput);
  }
}

// Clear the display
function clearDisplay() {
  currentInput = "";
  document.getElementById("display").value = "";
}

// Calculate the result
function calculateResult() {
  try {
    const result = eval(currentInput);
    document.getElementById("display").value = result;
    currentInput = result.toString();
  } catch (error) {
    document.getElementById("display").value = "Error";
  }
}

// Stopwatch Placeholder Logic
tool2.addEventListener("click", () => alert("Stopwatch functionality coming soon!"));

// Contact Form
const contactForm = document.getElementById("contactForm");
contactForm.addEventListener("submit", (e) => {
  e.preventDefault();
  alert("Message sent successfully!");
});

// Get the navigation bar element
const nav = document.querySelector('nav');

// Variable to store the last scroll position
let lastScrollTop = 0;

// Smooth scrolling implementation with performance optimization
document.querySelectorAll('nav a').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
        e.preventDefault();
        const targetId = this.getAttribute('href');
        const targetSection = document.querySelector(targetId);
        
        // Use requestAnimationFrame for smooth performance
        requestAnimationFrame(() => {
            targetSection.scrollIntoView({
                behavior: 'smooth',
                inline: 'start'
            });
        });
    });
});

// Optimize scroll performance with throttling
function throttle(func, limit) {
    let inThrottle;
    return function() {
        const args = arguments;
        const context = this;
        if (!inThrottle) {
            func.apply(context, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    }
}

// Optimized navbar shrink behavior
const handleScroll = throttle(() => {
    const currentScroll = window.pageYOffset || document.documentElement.scrollTop;
    
    // Use requestAnimationFrame for smooth class toggling
    requestAnimationFrame(() => {
        if (currentScroll > lastScrollTop) {
            nav.classList.add('shrink');
        } else {
            nav.classList.remove('shrink');
        }
        lastScrollTop = currentScroll <= 0 ? 0 : currentScroll;
    });
}, 100); // Throttle to 10 times per second

window.addEventListener('scroll', handleScroll);

// Optimize calculator display updates
function updateCalculatorDisplay(value) {
    requestAnimationFrame(() => {
        document.getElementById("display").value = value;
    });
}

// Local Storage Manager
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

// Enhanced Theme Management
const ThemeManager = {
    init() {
        const savedTheme = localStorage.getItem('theme') || 'dark';
        document.documentElement.setAttribute('data-theme', savedTheme);
        this.setupThemeToggle();
    },
    
    setupThemeToggle() {
        const themeToggle = document.getElementById('themeToggle');
        themeToggle.addEventListener('click', () => {
            this.toggleTheme();
        });
    },

    toggleTheme() {
        const root = document.documentElement;
        const currentTheme = root.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        
        root.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
    }
};

// Enhanced Search Functionality
const SearchManager = {
    init() {
        const searchBar = document.getElementById('searchBar');
        this.setupSearchHistory();
        this.setupAutocomplete(searchBar);
    },

    setupSearchHistory() {
        const history = StorageManager.get('searchHistory') || [];
        // Implementation for search history
    },

    setupAutocomplete(searchBar) {
        searchBar.addEventListener('input', this.debounce(async (e) => {
            const query = e.target.value;
            if (query.length < 2) return;
            
            try {
                // Implement local first search before making network requests
                const localResults = this.searchLocal(query);
                this.showResults(localResults);
                
                // Then fetch online results if needed
                const onlineResults = await this.searchOnline(query);
                this.showResults([...localResults, ...onlineResults]);
            } catch (error) {
                console.error('Search error:', error);
            }
        }, 300));
    },

    searchLocal(query) {
        // Search through local storage, notes, and cached data
        return [];
    },

    async searchOnline(query) {
        // Implement privacy-focused meta search
        return [];
    },

    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }
};

// Material Design Ripple Effect
function createRipple(event) {
    const button = event.currentTarget;
    const ripple = document.createElement('span');
    const diameter = Math.max(button.clientWidth, button.clientHeight);
    
    ripple.style.width = ripple.style.height = `${diameter}px`;
    ripple.style.left = `${event.clientX - button.offsetLeft - diameter / 2}px`;
    ripple.style.top = `${event.clientY - button.offsetTop - diameter / 2}px`;
    ripple.classList.add('ripple');
    
    button.appendChild(ripple);
    ripple.addEventListener('animationend', () => ripple.remove());
}

// Apply ripple effect to all material buttons
document.querySelectorAll('.material-fab, .material-button').forEach(button => {
    button.addEventListener('click', createRipple);
});

// Enhanced Material Design Transitions
const MaterialTransitions = {
    init() {
        this.setupCardTransitions();
        this.setupInputTransitions();
    },

    setupCardTransitions() {
        document.querySelectorAll('.material-card').forEach(card => {
            card.addEventListener('mouseenter', () => {
                requestAnimationFrame(() => {
                    card.style.transform = 'translateY(-5px) scale(1.02)';
                    card.style.boxShadow = '0 8px 16px rgba(0,0,0,0.2)';
                });
            });
            
            card.addEventListener('mouseleave', () => {
                requestAnimationFrame(() => {
                    card.style.transform = 'translateY(0) scale(1)';
                    card.style.boxShadow = '';
                });
            });
        });
    },

    setupInputTransitions() {
        document.querySelectorAll('.material-input').forEach(input => {
            input.addEventListener('focus', () => {
                input.parentElement.classList.add('focused');
            });
            
            input.addEventListener('blur', () => {
                if (!input.value) {
                    input.parentElement.classList.remove('focused');
                }
            });
        });
    }
};

// Initialize everything with enhanced animations
document.addEventListener('DOMContentLoaded', () => {
    ThemeManager.init();
    SearchManager.init();
    MaterialTransitions.init();
    initCalculator();
    // ...existing code...
    
    // Add smooth page transitions
    window.addEventListener('beforeunload', () => {
        document.body.classList.add('page-transition');
    });
});

// Initialize calculator
function initCalculator() {
    const calculator = document.querySelector('.calculator');
    const display = calculator.querySelector('.calculator-display');
    const buttonsContainer = calculator.querySelector('.calculator-buttons');
    
    const buttons = [
        '7', '8', '9', '/',
        '4', '5', '6', '*',
        '1', '2', '3', '-',
        '0', '.', '=', '+'
    ];
    
    buttons.forEach(btn => {
        const button = document.createElement('button');
        button.textContent = btn;
        button.className = 'calculator-btn';
        if(['+', '-', '*', '/', '='].includes(btn)) {
            button.classList.add('operator');
        }
        buttonsContainer.appendChild(button);
        
        button.addEventListener('click', () => {
            if(btn === '=') {
                try {
                    display.value = eval(display.value);
                } catch(e) {
                    display.value = 'Error';
                }
            } else {
                display.value += btn;
            }
        });
    });
}

// Initialize everything when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Initialize theme
    const savedTheme = localStorage.getItem('theme') || 'dark';
    root.setAttribute('data-theme', savedTheme);
    
    // Initialize calculator
    initCalculator();
    
    // Initialize other components
    // ...existing code...
});
