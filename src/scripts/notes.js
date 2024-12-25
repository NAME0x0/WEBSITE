export class NotesManager {
    constructor(container) {
        this.container = container;
        this.notes = JSON.parse(localStorage.getItem('notes') || '[]');
        this.categories = new Set(['Personal', 'Work', 'Ideas']);
        this.tags = new Set();
        this.init();
        this.enableRichText();
    }

    init() {
        this.createNoteInput();
        this.createNotesList();
        this.setupEventListeners();
        this.renderNotes();
    }

    enableRichText() {
        const toolbar = document.createElement('div');
        toolbar.className = 'rich-text-toolbar';
        toolbar.innerHTML = `
            <button data-command="bold" title="Bold"><b>B</b></button>
            <button data-command="italic" title="Italic"><i>I</i></button>
            <button data-command="underline" title="Underline"><u>U</u></button>
            <select class="note-category">
                ${Array.from(this.categories).map(cat => 
                    `<option value="${cat}">${cat}</option>`
                ).join('')}
            </select>
        `;

        toolbar.addEventListener('click', e => {
            if (e.target.dataset.command) {
                document.execCommand(e.target.dataset.command, false, null);
            }
        });

        this.container.insertBefore(toolbar, this.container.firstChild);
    }

    createNoteInput() {
        const noteForm = document.createElement('form');
        noteForm.className = 'note-form';
        
        const textarea = document.createElement('textarea');
        textarea.className = 'note-input';
        textarea.placeholder = 'Write your note here...';
        textarea.required = true;
        
        const buttonGroup = document.createElement('div');
        buttonGroup.className = 'note-actions';
        
        const saveButton = document.createElement('button');
        saveButton.type = 'submit';
        saveButton.className = 'save-note-btn';
        saveButton.textContent = 'Save';
        
        const clearButton = document.createElement('button');
        clearButton.type = 'button';
        clearButton.className = 'clear-note-btn';
        clearButton.textContent = 'Clear';
        
        buttonGroup.appendChild(saveButton);
        buttonGroup.appendChild(clearButton);
        noteForm.appendChild(textarea);
        noteForm.appendChild(buttonGroup);
        
        this.container.appendChild(noteForm);
        
        // Setup form handlers
        noteForm.addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveNote(textarea.value);
            textarea.value = '';
        });
        
        clearButton.addEventListener('click', () => {
            textarea.value = '';
            textarea.focus();
        });
    }

    createNotesList() {
        const notesGrid = document.createElement('div');
        notesGrid.className = 'notes-grid';
        this.container.appendChild(notesGrid);
    }

    setupEventListeners() {
        // Delete note functionality
        this.container.addEventListener('click', (e) => {
            if (e.target.classList.contains('delete-note')) {
                const noteId = parseInt(e.target.closest('.note-card').dataset.id);
                this.deleteNote(noteId);
            }
        });
    }

    renderNotes() {
        const notesGrid = this.container.querySelector('.notes-grid');
        notesGrid.innerHTML = this.notes.map(note => `
            <div class="note-card" data-id="${note.id}">
                <div class="note-content">${this.formatContent(note.content)}</div>
                <div class="note-footer">
                    <span class="note-date">${this.formatDate(note.timestamp)}</span>
                    <button class="delete-note" title="Delete note">×</button>
                </div>
            </div>
        `).join('');
    }

    saveNote(content) {
        if (!content.trim()) return;
        
        const category = this.container.querySelector('.note-category').value;
        const tags = content.match(/#[\w]+/g) || [];
        
        const note = {
            id: Date.now(),
            content: content.trim(),
            timestamp: new Date().toISOString(),
            lastModified: new Date().toISOString(),
            category,
            tags,
            style: {
                color: this.currentColor,
                fontSize: this.currentSize
            }
        };

        this.notes.unshift(note);
        this.saveToStorage();
        this.renderNotes();
        this.showToast('Note saved successfully!');
    }

    deleteNote(id) {
        const noteIndex = this.notes.findIndex(note => note.id === id);
        if (noteIndex === -1) return;
        
        const note = this.notes[noteIndex];
        if (confirm(`Delete note from ${this.formatDate(note.timestamp)}?`)) {
            this.notes.splice(noteIndex, 1);
            this.saveToStorage();
            this.renderNotes();
            this.showToast('Note deleted');
        }
    }

    saveToStorage() {
        localStorage.setItem('notes', JSON.stringify(this.notes));
    }

    formatContent(content) {
        return content.replace(/\n/g, '<br>');
    }

    formatDate(timestamp) {
        const date = new Date(timestamp);
        return new Intl.DateTimeFormat('en-US', {
            month: 'short',
            day: 'numeric',
            hour: 'numeric',
            minute: 'numeric',
            hour12: true
        }).format(date);
    }

    showToast(message) {
        const toast = document.createElement('div');
        toast.className = 'toast';
        toast.textContent = message;
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.remove();
        }, 3000);
    }
}
