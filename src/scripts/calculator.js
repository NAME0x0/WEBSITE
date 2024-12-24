export class Calculator {
    constructor(container) {
        this.container = container;
        this.display = container.querySelector('.calculator-display');
        this.memory = 0;
        this.lastInput = '';
        this.newNumber = true;
        this.init();
    }

    init() {
        this.display.value = '0';
        this.setupButtons();
        this.setupScientificMode();
    }

    setupButtons() {
        const basicButtons = [
            ['7', '8', '9', '÷'],
            ['4', '5', '6', '×'],
            ['1', '2', '3', '-'],
            ['C', '0', '=', '+']
        ];

        const scientificButtons = [
            ['sin', 'cos', 'tan', 'π'],
            ['log', 'ln', 'e', '^'],
            ['√', '(', ')', '%'],
            ['MC', 'MR', 'M+', 'M-']
        ];

        this.createButtonGrid(basicButtons, 'basic-buttons');
        this.createButtonGrid(scientificButtons, 'scientific-buttons');
    }

    createButtonGrid(buttons, className) {
        const grid = document.createElement('div');
        grid.className = className;

        buttons.forEach(row => {
            const rowDiv = document.createElement('div');
            rowDiv.className = 'button-row';
            
            row.forEach(btn => {
                const button = document.createElement('button');
                button.textContent = btn;
                button.className = `calc-btn ${this.getButtonClass(btn)}`;
                button.addEventListener('click', () => this.handleInput(btn));
                rowDiv.appendChild(button);
            });
            
            grid.appendChild(rowDiv);
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
        try {
            switch(value) {
                case 'C':
                    this.clearDisplay();
                    break;
                case '=':
                    this.evaluateExpression();
                    break;
                case 'sin':
                case 'cos':
                case 'tan':
                    this.handleTrig(value);
                    break;
                case 'π':
                    this.display.value = Math.PI;
                    break;
                case 'log':
                    this.display.value = Math.log10(parseFloat(this.display.value));
                    break;
                case 'ln':
                    this.display.value = Math.log(parseFloat(this.display.value));
                    break;
                case '√':
                    this.display.value = Math.sqrt(parseFloat(this.display.value));
                    break;
                case 'x²':
                    this.display.value = Math.pow(parseFloat(this.display.value), 2);
                    break;
                case 'x³':
                    this.display.value = Math.pow(parseFloat(this.display.value), 3);
                    break;
                case '!':
                    this.factorial();
                    break;
                case 'M+':
                    this.memory += parseFloat(this.display.value);
                    this.showMemoryIndicator();
                    break;
                case 'M-':
                    this.memory -= parseFloat(this.display.value);
                    this.showMemoryIndicator();
                    break;
                case 'MR':
                    this.display.value = this.memory;
                    break;
                case 'MC':
                    this.memory = 0;
                    this.hideMemoryIndicator();
                    break;
                default:
                    if (this.shouldResetDisplay) {
                        this.display.value = value;
                        this.shouldResetDisplay = false;
                    } else {
                        this.display.value += value;
                    }
            }
        } catch (error) {
            this.display.value = 'Error';
            this.shouldResetDisplay = true;
        }
    }

    evaluateExpression() {
        try {
            let expr = this.display.value
                .replace(/×/g, '*')
                .replace(/÷/g, '/')
                .replace(/π/g, Math.PI)
                .replace(/e/g, Math.E);
            const result = Function('"use strict";return (' + expr + ')')();
            this.display.value = Number.isInteger(result) ? result : result.toFixed(8);
            this.shouldResetDisplay = true;
        } catch (e) {
            this.display.value = 'Error';
            this.shouldResetDisplay = true;
        }
    }

    factorial() {
        const n = parseInt(this.display.value);
        if (n < 0) throw new Error('Invalid input');
        let result = 1;
        for (let i = 2; i <= n; i++) result *= i;
        this.display.value = result;
        this.shouldResetDisplay = true;
    }

    showMemoryIndicator() {
        const indicator = this.container.querySelector('.memory-display');
        if (indicator) indicator.classList.add('active');
    }

    hideMemoryIndicator() {
        const indicator = this.container.querySelector('.memory-display');
        if (indicator) indicator.classList.remove('active');
    }

    calculate() {
        try {
            let expression = this.display.value
                .replace('×', '*')
                .replace('÷', '/');
            this.display.value = eval(expression);
            this.newNumber = true;
        } catch (e) {
            this.display.value = 'Error';
        }
    }

    handleTrig(func) {
        const value = parseFloat(this.display.value);
        const inRadians = value * (Math.PI / 180);
        this.display.value = Math[func](inRadians);
        this.newNumber = true;
    }

    isOperator(value) {
        return '+-×÷'.includes(value);
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
