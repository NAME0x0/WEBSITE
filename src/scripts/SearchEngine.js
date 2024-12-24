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
        this.init();
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
        const engine = this.engines[this.currentEngine];
        if (!engine.suggestUrl || query.length < 2) return [];

        try {
            const response = await fetch(`${engine.suggestUrl}?q=${encodeURIComponent(query)}`);
            const data = await response.json();
            return data[1] || [];
        } catch (error) {
            console.error('Error fetching suggestions:', error);
            return [];
        }
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

    // ... rest of implementation
}

export default new SearchEngine();
