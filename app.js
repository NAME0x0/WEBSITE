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
  console.log(Searching for: ${searchBar.value});
});

// Tools Placeholder
const tool1 = document.getElementById("tool1");
const tool2 = document.getElementById("tool2");

tool1.addEventListener("click", () => alert("Calculator functionality coming soon!"));
tool2.addEventListener("click", () => alert("Stopwatch functionality coming soon!"));

// Contact Form
const contactForm = document.getElementById("contactForm");
contactForm.addEventListener("submit", (e) => {
  e.preventDefault();
  alert("Message sent successfully!");
});
