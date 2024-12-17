document.addEventListener('DOMContentLoaded', () => {
    const container = document.querySelector('.container');
    const sections = document.querySelectorAll('.section');
    const noteInput = document.getElementById('note-input');
    const saveNoteButton = document.getElementById('save-note');
    const savedNotesContainer = document.getElementById('saved-notes');

    // Horizontal Scrolling Interaction
    let currentSection = 0;
    
    // Handle horizontal scroll with keyboard
    document.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowRight' && currentSection < sections.length - 1) {
            currentSection++;
            scrollToSection(currentSection);
        } else if (e.key === 'ArrowLeft' && currentSection > 0) {
            currentSection--;
            scrollToSection(currentSection);
        }
    });

    // Scroll to specific section
    function scrollToSection(index) {
        sections[index].scrollIntoView({
            behavior: 'smooth',
            block: 'start',
            inline: 'start'
        });
    }

    // Notes Functionality
    function loadNotes() {
        const savedNotes = JSON.parse(localStorage.getItem('userNotes') || '[]');
        savedNotesContainer.innerHTML = savedNotes.map(note => 
            `<div class="saved-note">${escapeHtml(note)}</div>`
        ).join('');
    }

    // Escape HTML to prevent XSS
    function escapeHtml(unsafe) {
        return unsafe
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    // Save note to localStorage
    saveNoteButton.addEventListener('click', () => {
        const noteText = noteInput.value.trim();
        if (noteText) {
            const savedNotes = JSON.parse(localStorage.getItem('userNotes') || '[]');
            savedNotes.push(noteText);
            localStorage.setItem('userNotes', JSON.stringify(savedNotes));
            
            // Clear input and reload notes
            noteInput.value = '';
            loadNotes();
        }
    });

    // Easter Egg Feature
    function checkEasterEgg() {
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.get('jpeg') !== null) {
            // Create and display a surprise element
            const easterEggElement = document.createElement('div');
            easterEggElement.innerHTML = `
                <div style="position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.9);color:white;display:flex;justify-content:center;align-items:center;z-index:1000;">
                    <div style="text-align:center;">
                        <h1>🎉 You Found the Easter Egg! 🎉</h1>
                        <p>Congratulations on your curiosity!</p>
                    </div>
                </div>
            `;
            document.body.appendChild(easterEggElement);
            
            // Remove Easter egg when clicked
            easterEggElement.addEventListener('click', () => {
                document.body.removeChild(easterEggElement);
            });
        }
    }

    // Initial load of notes and Easter egg check
    loadNotes();
    checkEasterEgg();

    // Optional: Swipe navigation for touch devices
    let startX = 0;
    container.addEventListener('touchstart', (e) => {
        startX = e.touches[0].clientX;
    });

    container.addEventListener('touchend', (e) => {
        const endX = e.changedTouches[0].clientX;
        const diffX = startX - endX;

        if (Math.abs(diffX) > 50) {  // Minimum swipe distance
            if (diffX > 0 && currentSection < sections.length - 1) {
                // Swipe left, go to next section
                currentSection++;
            } else if (diffX < 0 && currentSection > 0) {
                // Swipe right, go to previous section
                currentSection--;
            }
            scrollToSection(currentSection);
        }
    });
});
