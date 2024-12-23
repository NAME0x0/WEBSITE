export class NotesManager {
    constructor(container) {
        this.container = container;
        this.storage = localStorage;
        this.notes = [];
        this.init();
    }

    init() {
        this.setupNoteInput();
        this.loadSavedNotes();
        this.setupEventListeners();
    }

    setupNoteInput() {
        const textarea = document.createElement('textarea');
        textarea.className = 'note-input';
        textarea.placeholder = 'Write a note...';

        const saveBtn = document.createElement('button');
        saveBtn.className = 'save-note-btn';
        saveBtn.textContent = 'Save';

        this.container.querySelector('.notes-wrapper').appendChild(textarea);
        this.container.querySelector('.notes-wrapper').appendChild(saveBtn);
    }

    loadSavedNotes() {
        try {
            const savedNotes = JSON.parse(this.storage.getItem('notes') || '[]');
            this.notes = savedNotes;
            this.renderNotes(this.notes);
        } catch (e) {
            console.error("Failed to load notes:", e);
            this.notes = [];
            this.renderNotes([]);
        }
    }

    renderNotes(notes) {
        const grid = document.createElement('div');
        grid.className = 'notes-grid';

        grid.innerHTML = notes.map(note => `
            <div class="note-card glass-effect" data-id="${note.id}">
                <p>${note.content}</p>
                <div class="note-footer">
                    <span class="note-date">${new Date(note.timestamp).toLocaleDateString()}</span>
                    <button class="edit-note" aria-label="Edit note">✏️</button>
                    <button class="delete-note" aria-label="Delete note">×</button>
                </div>
            </div>
        `).join('');

        const existingGrid = this.container.querySelector('.notes-grid');
        if (existingGrid) existingGrid.remove();
        this.container.appendChild(grid);
    }

    setupEventListeners() {
        const saveBtn = this.container.querySelector('.save-note-btn');
        const textarea = this.container.querySelector('.note-input');

        // Save note
        saveBtn.addEventListener('click', () => {
            const content = textarea.value.trim();
            if (content === '') {
                alert("Note content can't be empty!");
                return;
            }

            const newNote = {
                id: Date.now(),
                content,
                timestamp: new Date().toISOString()
            };

            this.notes.push(newNote);
            this.saveNotes();
            this.renderNotes(this.notes);
            textarea.value = ''; // Clear the input
        });

        // Handle note deletion
        this.container.addEventListener('click', (event) => {
            if (event.target.classList.contains('delete-note')) {
                const noteCard = event.target.closest('.note-card');
                const noteId = noteCard.dataset.id;
                this.deleteNote(noteId);
            } else if (event.target.classList.contains('edit-note')) {
                const noteCard = event.target.closest('.note-card');
                const noteId = noteCard.dataset.id;
                this.editNote(noteId);
            }
        });
    }

    saveNotes() {
        try {
            this.storage.setItem('notes', JSON.stringify(this.notes));
        } catch (e) {
            console.error("Failed to save notes:", e);
        }
    }

    deleteNote(noteId) {
        this.notes = this.notes.filter(note => note.id !== parseInt(noteId, 10));
        this.saveNotes();
        this.renderNotes(this.notes);
    }

    editNote(noteId) {
        const note = this.notes.find(note => note.id === parseInt(noteId, 10));
        if (!note) return;

        const textarea = this.container.querySelector('.note-input');
        const saveBtn = this.container.querySelector('.save-note-btn');

        textarea.value = note.content; // Pre-fill textarea with the note content
        saveBtn.textContent = 'Update'; // Change button text to "Update"

        saveBtn.removeEventListener('click', this.saveNoteHandler);
        saveBtn.addEventListener('click', () => {
            const content = textarea.value.trim();
            if (content === '') {
                alert("Note content can't be empty!");
                return;
            }

            note.content = content; // Update the note content
            note.timestamp = new Date().toISOString(); // Update timestamp
            this.saveNotes();
            this.renderNotes(this.notes);
            textarea.value = ''; // Clear the input
            saveBtn.textContent = 'Save'; // Reset button text
        });
    }
}
