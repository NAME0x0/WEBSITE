export class Calculator {
    constructor(container) {
        this.container = container;
        this.display = container.querySelector('.calculator-display');
        this.scientific = false;
        this.init();
    }

    init() {
        this.setupDisplay();
        this.setupButtons();
        this.setupScientificMode();
    }

    setupDisplay() {
        this.display.value = '0';
        this.lastNumber = '';
        this.operator = null;
        this.newNumber = true;
    }

    setupButtons() {
        const basicButtons = [
            '7', '8', '9', '÷',
            '4', '5', '6', '×',
            '1', '2', '3', '-',
            '0', '.', '=', '+'
        ];

        const scientificButtons = [
            'sin', 'cos', 'tan', 'π',
            'log', 'ln', 'e', '^',
            '√', '(', ')', '%',
            'x²', 'x³', '1/x', '!'
        ];

        this.createButtonGrid(basicButtons, false);
        this.createButtonGrid(scientificButtons, true);
    }

    createButtonGrid(buttons, isScientific) {
        const grid = document.createElement('div');
        grid.className = isScientific ? 'scientific-buttons' : 'basic-buttons';
        
        buttons.forEach(btn => {
            const button = document.createElement('button');
            button.textContent = btn;
            button.className = `calc-btn ${this.getButtonClass(btn)}`;
            button.addEventListener('click', () => this.handleInput(btn));
            grid.appendChild(button);
        });

        this.container.appendChild(grid);
    }

    getButtonClass(btn) {
        if ('0123456789.'.includes(btn)) return 'number';
        if ('+-×÷'.includes(btn)) return 'operator';
        if ('sincostanlogln'.includes(btn)) return 'function';
        return 'special';
    }

    handleInput(value) {
        switch(value) {
            case 'sin':
            case 'cos':
            case 'tan':
                this.handleTrig(value);
                break;
            case 'log':
            case 'ln':
                this.handleLog(value);
                break;
            case '√':
                this.handleSqrt();
                break;
            case 'π':
                this.display.value = Math.PI;
                break;
            case 'e':
                this.display.value = Math.E;
                break;
            case 'x²':
                this.square();
                break;
            case 'x³':
                this.cube();
                break;
            case '!':
                this.factorial();
                break;
            default:
                this.handleBasicInput(value);
        }
    }

    handleTrig(func) {
        const value = parseFloat(this.display.value);
        const inRadians = value * (Math.PI / 180); // Convert to radians
        this.display.value = Math[func](inRadians);
    }

    handleLog(func) {
        const value = parseFloat(this.display.value);
        this.display.value = func === 'log' ? Math.log10(value) : Math.log(value);
    }

    handleSqrt() {
        this.display.value = Math.sqrt(parseFloat(this.display.value));
    }

    factorial() {
        const n = parseInt(this.display.value);
        let result = 1;
        for(let i = 2; i <= n; i++) result *= i;
        this.display.value = result;
    }

    setupScientificMode() {
        const toggle = this.container.querySelector('.mode-toggle');
        toggle.addEventListener('click', () => {
            this.scientific = !this.scientific;
            this.container.classList.toggle('scientific-mode');
            toggle.textContent = this.scientific ? 'Basic' : 'Scientific';
        });
    }
}
