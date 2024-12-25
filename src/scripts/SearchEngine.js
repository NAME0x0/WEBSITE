class SearchEngine {
    constructor() {
        this.engines = {
            google: {
                name: 'Google',
                url: 'https://www.google.com/search',
                suggestUrl: 'https://suggestqueries.google.com/complete/search',
                params: { q: '' }
            },
            ddg: {
                name: 'DuckDuckGo',
                url: 'https://duckduckgo.com/',
                params: { q: '' },
                privacy: true
            },
            brave: {
                name: 'Brave',
                url: 'https://search.brave.com/search',
                params: { q: '' },
                privacy: true
            },
            bing: {
                name: 'Bing',
                url: 'https://www.bing.com/search',
                suggestUrl: 'https://api.bing.com/osjson.aspx',
                params: { q: '' }
            }
        };
        
        this.currentEngine = localStorage.getItem('defaultEngine') || 'google';
        this.searchHistory = [];
        this.customEngines = JSON.parse(localStorage.getItem('customEngines') || '{}');
        this.searchDelay = 300;
        this.maxHistory = 100;
        this.init();
        this.setupCustomEngines();
    }

    init() {
        this.loadHistory();
        this.setupEventListeners();
        this.setupSearchUI();
    }

    async search(query) {
        if (!query.trim()) return;

        const engine = this.engines[this.currentEngine];
        const searchUrl = new URL(engine.url);
        searchUrl.search = new URLSearchParams({
            ...engine.params,
            q: query
        }).toString();

        // Save to history
        this.addToHistory(query);

        // Open in new tab
        window.open(searchUrl.toString(), '_blank');
    }

    async getSuggestions(query) {
        if (!query.trim() || query.length < 2) return [];

        const engine = this.engines[this.currentEngine];
        if (!engine.suggestUrl) return [];

        try {
            const results = await Promise.all([
                this.getSearchHistory(query),
                this.fetchOnlineSuggestions(query, engine)
            ]);

            return [...new Set([...results[0], ...results[1]])].slice(0, 10);
        } catch (error) {
            console.error('Error fetching suggestions:', error);
            return this.getSearchHistory(query);
        }
    }

    getSearchHistory(query) {
        return this.searchHistory
            .filter(item => item.query.toLowerCase().includes(query.toLowerCase()))
            .map(item => item.query)
            .slice(0, 5);
    }

    addToHistory(query) {
        const entry = {
            query,
            engine: this.currentEngine,
            timestamp: new Date().toISOString()
        };
        
        this.searchHistory.unshift(entry);
        this.searchHistory = this.searchHistory.slice(0, 100);
        localStorage.setItem('searchHistory', JSON.stringify(this.searchHistory));
        
        this.updateHistoryUI();
    }

    setupCustomEngines() {
        const defaultCustomEngine = {
            name: 'Custom',
            url: 'https://${query}',
            icon: 'path/to/default-icon.svg'
        };

        this.addCustomEngine = (engine) => {
            this.customEngines[engine.name] = {...defaultCustomEngine, ...engine};
            localStorage.setItem('customEngines', JSON.stringify(this.customEngines));
        };
    }

    // ... rest of implementation
}

export default new SearchEngine();
