class AppCore {
    constructor() {
        this.toolPanels = new Map();
        this.activePanel = null;
        this.init();
    }

    init() {
        this.setupToolPanels();
        this.setupEventListeners();
    }

    setupToolPanels() {
        document.querySelectorAll('.tool-btn').forEach(btn => {
            const toolName = btn.dataset.tool;
            const panel = document.querySelector(`#${toolName}Panel`);
            this.toolPanels.set(toolName, { button: btn, panel: panel });
        });
    }

    togglePanel(toolName) {
        if (this.activePanel === toolName) {
            this.closePanel(toolName);
            this.activePanel = null;
        } else {
            if (this.activePanel) this.closePanel(this.activePanel);
            this.openPanel(toolName);
            this.activePanel = toolName;
        }
    }

    openPanel(toolName) {
        const tool = this.toolPanels.get(toolName);
        if (!tool) return;
        
        tool.panel.classList.remove('hidden');
        tool.button.classList.add('active');
        requestAnimationFrame(() => {
            tool.panel.classList.add('panel-visible');
        });
    }

    closePanel(toolName) {
        const tool = this.toolPanels.get(toolName);
        if (!tool) return;
        
        tool.panel.classList.remove('panel-visible');
        tool.button.classList.remove('active');
        setTimeout(() => {
            tool.panel.classList.add('hidden');
        }, 300);
    }

    setupEventListeners() {
        document.querySelectorAll('.tool-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                this.togglePanel(btn.dataset.tool);
            });
        });

        // Close panel when clicking outside
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.tool-btn') && !e.target.closest('.panel')) {
                if (this.activePanel) this.closePanel(this.activePanel);
                this.activePanel = null;
            }
        });
    }
}

export const App = new AppCore();
