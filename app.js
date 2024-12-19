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
  document.getElementById("display").value = currentInput;
}

// Append operator to the display
function appendOperator(op) {
  if (currentInput !== "") {
    currentInput += " " + op + " ";
    document.getElementById("display").value = currentInput;
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

// Function to handle the scroll event
window.addEventListener('scroll', function() {
    let currentScroll = window.pageYOffset || document.documentElement.scrollTop;

    // Check if the page has been scrolled down
    if (currentScroll > lastScrollTop) {
        // Add the 'shrink' class to shrink the navbar
        nav.classList.add('shrink');
    } else {
        // Remove the 'shrink' class to restore the navbar to normal size
        nav.classList.remove('shrink');
    }

    // Update the last scroll position
    lastScrollTop = currentScroll <= 0 ? 0 : currentScroll;
});
