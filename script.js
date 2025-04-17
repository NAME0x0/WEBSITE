document.addEventListener('DOMContentLoaded', () => {
  // Default Settings
  const defaultSettings = {
    defaultEngine: 'google',
    customEngineUrl: '',
    customEngineName: '',
    autoTheme: false,
    lightStart: '06:00',
    darkStart: '18:00',
    accentColor: '#0abde3',
    // Widget Toggles
    widgetNotes: true,
    widgetCalculator: true,
    widgetTodo: true,
    widgetWeather: true,
    widgetClock: true,
    widgetFinance: false,
    widgetNews: false,
    widgetBookmarks: false,
    widgetAI: false,
    widgetTranslator: false,
    widgetUtilities: false,
  };
  let settings = JSON.parse(localStorage.getItem('dashboardSettings')) || defaultSettings;
  let lastSearchQuery = localStorage.getItem('lastSearchQuery') || '';
  let favoriteSearches = JSON.parse(localStorage.getItem('favoriteSearches')) || [];
  let notesData = JSON.parse(localStorage.getItem('notesData')) || { content: '', tags: [], snapshots: [] };
  let calcHistory = JSON.parse(localStorage.getItem('calcHistory')) || [];
  let todos = JSON.parse(localStorage.getItem('todos')) || []; // Existing
  let weatherLocation = JSON.parse(localStorage.getItem('weatherLocation')) || null; // { lat, lon, name }
  let financeWatchlist = JSON.parse(localStorage.getItem('financeWatchlist')) || []; // [{ symbol, type }]
  let newsSettings = JSON.parse(localStorage.getItem('newsSettings')) || { source: 'newsapi', rssUrl: '', openInNewTab: true };
  let readLaterNews = JSON.parse(localStorage.getItem('readLaterNews')) || []; // [{ title, url }]

  const bodyElement = document.body;
  const container = document.querySelector('.container');
  const widgetPages = document.querySelectorAll('.widget-page');
  const mainHeader = document.querySelector('.main-header');
  
  // Initialize WebGL Background
  initWebGLBackground();
  
  // Initialize Horizontal Scrolling and Navigation
  setupHorizontalScrolling();
  setupNavigationDots();
  setupScrollingEffects();

  // Apply Accent Color with RGB variant for opacity calculations
  function applyAccentColor() {
    // Convert hex to RGB for CSS variables
    const hexToRgb = (hex) => {
      const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
      return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
      } : null;
    };
    
    const rgb = hexToRgb(settings.accentColor) || {r: 10, g: 189, b: 227}; // Default if conversion fails
    document.documentElement.style.setProperty('--secondary-color', settings.accentColor);
    document.documentElement.style.setProperty('--secondary-color-rgb', `${rgb.r}, ${rgb.g}, ${rgb.b}`);
  }
  applyAccentColor();

  // WebGL Background Animation using Three.js
  function initWebGLBackground() {
    const canvas = document.getElementById('backgroundCanvas');
    if (!canvas) return;
    
    // Initialize Three.js scene
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
    
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    
    // Create dynamic particles
    const particlesGeometry = new THREE.BufferGeometry();
    const particlesCount = 2000;
    const positionArray = new Float32Array(particlesCount * 3);
    const scalesArray = new Float32Array(particlesCount);
    
    // Random positions and scales
    for (let i = 0; i < particlesCount; i++) {
      positionArray[i * 3] = (Math.random() - 0.5) * 15;
      positionArray[i * 3 + 1] = (Math.random() - 0.5) * 15;
      positionArray[i * 3 + 2] = (Math.random() - 0.5) * 10;
      scalesArray[i] = Math.random();
    }
    
    particlesGeometry.setAttribute('position', new THREE.BufferAttribute(positionArray, 3));
    particlesGeometry.setAttribute('scale', new THREE.BufferAttribute(scalesArray, 1));
    
    // Create shader material for particles
    const particlesMaterial = new THREE.ShaderMaterial({
      vertexShader: `
        attribute float scale;
        varying vec3 vColor;
        
        void main() {
          vec3 pos = position;
          
          // Color based on position
          vColor = mix(
            vec3(0.04, 0.74, 0.89), // Light blue
            vec3(0.98, 0.42, 0.42), // Light red
            smoothstep(-5.0, 5.0, position.x)
          );
          
          // Vertex position
          vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
          gl_Position = projectionMatrix * mvPosition;
          
          // Size based on scale and distance
          gl_PointSize = scale * (300.0 / -mvPosition.z);
        }
      `,
      fragmentShader: `
        varying vec3 vColor;
        
        void main() {
          // Circular particle with soft edge
          float distanceToCenter = length(gl_PointCoord - vec2(0.5));
          float strength = 0.05 / distanceToCenter - 0.1;
          
          gl_FragColor = vec4(vColor, strength);
        }
      `,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
    
    const particles = new THREE.Points(particlesGeometry, particlesMaterial);
    scene.add(particles);
    
    // Position camera
    camera.position.z = 5;
    
    // Mouse movement effect
    const mouse = { x: 0, y: 0 };
    document.addEventListener('mousemove', (event) => {
      mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
      mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    });
    
    // Animation loop
    const clock = new THREE.Clock();
    
    function animate() {
      const elapsedTime = clock.getElapsedTime();
      
      // Rotate particles
      particles.rotation.y = elapsedTime * 0.05;
      
      // Move particles based on mouse position
      if (mouse.x && mouse.y) {
        particles.rotation.x += (mouse.y * 0.5 - particles.rotation.x) * 0.01;
        particles.rotation.y += (mouse.x * 0.5 - particles.rotation.y) * 0.01;
      }
      
      // Wave effect
      const positions = particlesGeometry.attributes.position.array;
      for (let i = 0; i < particlesCount; i++) {
        const i3 = i * 3;
        positions[i3 + 1] += Math.sin(elapsedTime + positions[i3]) * 0.002;
      }
      particlesGeometry.attributes.position.needsUpdate = true;
      
      // Render scene
      renderer.render(scene, camera);
      requestAnimationFrame(animate);
    }
    
    animate();
    
    // Handle window resize
    window.addEventListener('resize', () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    });
    
    // Update background color based on theme
    function updateBackgroundColor() {
      const theme = document.body.getAttribute('data-theme');
      if (theme === 'light') {
        scene.background = new THREE.Color(0xf0f0f0);
      } else {
        scene.background = new THREE.Color(0x1a1a2e);
      }
    }
    
    // Initial background color
    updateBackgroundColor();
    
    // Listen for theme changes
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName === 'data-theme') {
          updateBackgroundColor();
        }
      });
    });
    
    observer.observe(document.body, { attributes: true });
  }

  // Setup Horizontal Scrolling with vertical wheel support
  function setupHorizontalScrolling() {
    // Override wheel event to scroll horizontally
    container.addEventListener('wheel', (e) => {
      e.preventDefault();
      const delta = Math.max(-1, Math.min(1, e.deltaY || -e.detail));
      container.scrollLeft += delta * 100; // Adjust scroll speed
      
      // Check if we're at the end and need to loop
      if (container.scrollLeft + container.clientWidth >= container.scrollWidth - 50) {
        // Smooth scroll back to start after a small delay
        setTimeout(() => {
          container.scrollTo({
            left: 0,
            behavior: 'smooth'
          });
        }, 500); // Wait half a second before looping
      }
    });
    
    // Touch support for mobile devices
    let touchStart = 0;
    let touchEnd = 0;
    
    container.addEventListener('touchstart', (e) => {
      touchStart = e.changedTouches[0].screenX;
    });
    
    container.addEventListener('touchend', (e) => {
      touchEnd = e.changedTouches[0].screenX;
      handleSwipe();
    });
    
    function handleSwipe() {
      const distance = touchStart - touchEnd;
      if (Math.abs(distance) > 50) { // Minimum swipe distance
        if (distance > 0) {
          // Swipe left - go to next section
          navigateToNextSection();
          if (window.soundEffects) window.soundEffects.playSwitch();
        } else {
          // Swipe right - go to previous section
          navigateToPreviousSection();
          if (window.soundEffects) window.soundEffects.playSwitch();
        }
      }
    }
    
    // Navigate to specific section index
    window.navigateToSection = function(index) {
      const visiblePages = getVisiblePages();
      if (index >= 0 && index < visiblePages.length) {
        container.scrollTo({
          left: index === 0 ? 0 : visiblePages[index].offsetLeft,
          behavior: 'smooth'
        });
        if (window.soundEffects) window.soundEffects.playSwitch();
      }
    };
    
    // Navigate to next section
    function navigateToNextSection() {
      const currentIndex = getCurrentSectionIndex();
      const visiblePages = getVisiblePages();
      
      if (currentIndex < visiblePages.length - 1) {
        navigateToSection(currentIndex + 1);
      } else {
        // Loop back to beginning
        navigateToSection(0);
      }
    }
    
    // Navigate to previous section
    function navigateToPreviousSection() {
      const currentIndex = getCurrentSectionIndex();
      
      if (currentIndex > 0) {
        navigateToSection(currentIndex - 1);
      } else {
        // Loop to end
        const visiblePages = getVisiblePages();
        navigateToSection(visiblePages.length - 1);
      }
    }
    
    // Get currently visible section index
    function getCurrentSectionIndex() {
      const scrollLeft = container.scrollLeft;
      const visiblePages = getVisiblePages();
      
      // Find which section is most visible
      for (let i = 0; i < visiblePages.length; i++) {
        const page = visiblePages[i];
        const leftEdge = page.offsetLeft;
        const rightEdge = leftEdge + page.offsetWidth;
        
        // If scroll position is within this section
        if (scrollLeft >= leftEdge - window.innerWidth / 2 && 
            scrollLeft < rightEdge - window.innerWidth / 2) {
          return i;
        }
      }
      
      // Default to first section if none found
      return 0;
    }
    
    // Get array of visible widget pages (not hidden by settings)
    function getVisiblePages() {
      return [mainHeader, ...Array.from(widgetPages)].filter(page => 
        page && page.style.display !== 'none'
      );
    }
    
    // Add keyboard navigation
    document.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        navigateToNextSection();
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        navigateToPreviousSection();
      }
    });
    
    // Expose navigation functions globally
    window.navigateToNextSection = navigateToNextSection;
    window.navigateToPreviousSection = navigateToPreviousSection;
  }
  
  // Create and setup navigation dots
  function setupNavigationDots() {
    const navigationDots = document.querySelector('.navigation-dots');
    if (!navigationDots) return;
    
    // Create dots for main header and each widget page
    const allPages = [mainHeader, ...Array.from(widgetPages)];
    
    allPages.forEach((page, index) => {
      if (page && page.style.display !== 'none') {
        const dot = document.createElement('div');
        dot.className = 'navigation-dot';
        dot.dataset.index = index;
        dot.addEventListener('click', () => {
          window.navigateToSection(index);
        });
        // Add hover sound effect
        dot.addEventListener('mouseenter', () => {
          if (window.soundEffects) window.soundEffects.playHover();
        });
        navigationDots.appendChild(dot);
      }
    });
    
    // Update active dot based on scroll position
    updateActiveDot();
    
    container.addEventListener('scroll', updateActiveDot);
    
    function updateActiveDot() {
      const currentIndex = getCurrentSectionIndex();
      const dots = navigationDots.querySelectorAll('.navigation-dot');
      
      dots.forEach((dot, index) => {
        if (index === currentIndex) {
          dot.classList.add('active');
        } else {
          dot.classList.remove('active');
        }
      });
    }
    
    function getCurrentSectionIndex() {
      const scrollLeft = container.scrollLeft;
      const visiblePages = getVisiblePages();
      
      for (let i = 0; i < visiblePages.length; i++) {
        const page = visiblePages[i];
        const leftEdge = page.offsetLeft;
        const rightEdge = leftEdge + page.offsetWidth;
        
        if (scrollLeft >= leftEdge - window.innerWidth / 2 && 
            scrollLeft < rightEdge - window.innerWidth / 2) {
          return i;
        }
      }
      
      return 0;
    }
    
    function getVisiblePages() {
      return [mainHeader, ...Array.from(widgetPages)].filter(page => 
        page && page.style.display !== 'none'
      );
    }
  }
  
  // Setup scrolling effects and animations
  function setupScrollingEffects() {
    // Activate widgets as they come into view
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('active');
        } else {
          // Optionally remove active class when scrolling away
          // entry.target.classList.remove('active');
        }
      });
    }, { 
      root: container,
      threshold: 0.5,
      rootMargin: '0px'
    });
    
    // Observe all widget pages
    widgetPages.forEach(page => {
      observer.observe(page);
    });
    
    // Make first widget active by default
    if (widgetPages.length > 0 && !widgetPages[0].classList.contains('active')) {
      widgetPages[0].classList.add('active');
    }
  }

  // Apply Widget Visibility with animation delay
  function applyWidgetVisibility() {
    Object.keys(defaultSettings).forEach(key => {
      if (key.startsWith('widget')) {
        const widgetId = key.substring(6).toLowerCase();
        const widgetPage = document.querySelector(`.widget-page[data-widget="${widgetId}"]`);
        
        if (widgetPage) {
          widgetPage.style.display = settings[key] ? 'flex' : 'none';
        }
      }
    });
    
    // Re-setup navigation after visibility changes
    setupNavigationDots();
  }
  applyWidgetVisibility();
  
  // Loading indicator functions
  function showLoading(widgetElement) {
    if (!widgetElement) return;
    const spinner = widgetElement.querySelector('.loading-spinner');
    if (spinner) {
      spinner.style.display = 'block';
    }
  }
  
  function hideLoading(widgetElement) {
    if (!widgetElement) return;
    const spinner = widgetElement.querySelector('.loading-spinner');
    if (spinner) {
      spinner.style.display = 'none';
    }
  }
  
  // Enhance modal handling
  function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (!modal) return;
    
    modal.style.display = 'block';
    setTimeout(() => {
      modal.classList.add('show');
    }, 10);
    if (window.soundEffects) window.soundEffects.playSwitch();
  }
  
  function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (!modal) return;
    
    modal.classList.remove('show');
    setTimeout(() => {
      modal.style.display = 'none';
    }, 300);
    if (window.soundEffects) window.soundEffects.playClick();
  }
  
  // Override existing modal open/close functions
  window.addEventListener('click', (e) => {
    document.querySelectorAll('.modal').forEach(modal => {
      if (e.target === modal) {
        const modalId = modal.id;
        closeModal(modalId);
      }
    });
  });
  
  // Theme Toggle & Auto Scheduling with animation
  const themeToggle = document.getElementById('themeToggle');
  function setTheme(theme) {
    document.body.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }

  function checkAutoTheme() {
    if (settings.autoTheme) {
      const now = new Date();
      const currentTime = now.getHours() * 60 + now.getMinutes();
      const [lightH, lightM] = settings.lightStart.split(':').map(Number);
      const [darkH, darkM] = settings.darkStart.split(':').map(Number);
      const lightStartTime = lightH * 60 + lightM;
      const darkStartTime = darkH * 60 + darkM;

      let newTheme = 'light'; // Default
      if (lightStartTime < darkStartTime) { // Normal day/night cycle
        if (currentTime >= lightStartTime && currentTime < darkStartTime) {
          newTheme = 'light';
        } else {
          newTheme = 'dark';
        }
      } else { // Inverted cycle (dark starts before light, e.g., 18:00 dark, 06:00 light)
        if (currentTime >= darkStartTime || currentTime < lightStartTime) {
          newTheme = 'dark';
        } else {
          newTheme = 'light';
        }
      }
      setTheme(newTheme);
    }
  }

  themeToggle.addEventListener('click', () => {
    const currentTheme = document.body.getAttribute('data-theme') || 'light';
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    if (window.soundEffects) window.soundEffects.playSwitch();
    
    // Disable auto theme if manually toggled
    const autoThemeCheckbox = document.querySelector('#settingsForm input[name="autoTheme"]');
    if (autoThemeCheckbox && settings.autoTheme) {
      settings.autoTheme = false;
      autoThemeCheckbox.checked = false;
      localStorage.setItem('dashboardSettings', JSON.stringify(settings));
      document.getElementById('themeSchedule').style.display = 'none';
    }
  });

  const savedTheme = localStorage.getItem('theme');
  if (savedTheme && !settings.autoTheme) {
    setTheme(savedTheme);
  } else {
    checkAutoTheme(); // Apply initial theme based on schedule or default
  }
  setInterval(checkAutoTheme, 60000); // Check every minute for auto theme

  // Add click sound effects to all buttons
  document.querySelectorAll('button').forEach(button => {
    button.addEventListener('click', () => {
      if (window.soundEffects) window.soundEffects.playClick();
    });
    
    // Add hover sound effect
    button.addEventListener('mouseenter', () => {
      if (window.soundEffects) window.soundEffects.playHover();
    });
  });

  // Clock Widget - Enhanced with animations
  const clockDigitalDisplay = document.getElementById('clockDigital');
  const clockAnalogContainer = document.getElementById('clockAnalog');
  const hourHand = document.querySelector('.hour-hand');
  const minuteHand = document.querySelector('.minute-hand');
  const secondHand = document.querySelector('.second-hand');
  const clockSwitchBtn = document.getElementById('clockSwitch');
  const timerToggleBtn = document.getElementById('timerToggle');
  const timerSection = document.getElementById('timerSection');
  const timerMinutesDisplay = document.getElementById('timerMinutes');
  const timerSecondsDisplay = document.getElementById('timerSeconds');
  const startTimerBtn = document.getElementById('startTimer');
  const resetTimerBtn = document.getElementById('resetTimer');
  const timerPresets = document.querySelectorAll('.timer-presets .preset');
  const clockMarkings = document.querySelector('.clock-markings');

  let clockMode = localStorage.getItem('clockMode') || 'digital'; // 'digital' or 'analog'
  let timerModeActive = false;
  let timerInterval = null;
  let timerTotalSeconds = 25 * 60; // Default Pomodoro
  let timerRemainingSeconds = timerTotalSeconds;
  let isTimerRunning = false;

  // Create clock markings for analog clock
  function createClockMarkings() {
    if (!clockMarkings) return;
    
    let markingsHTML = '';
    
    // Create hour markings
    for (let i = 1; i <= 12; i++) {
      const angle = (i * 30) - 90; // 30 degrees per hour, -90 to start at 12 o'clock
      const radians = angle * (Math.PI / 180);
      const x = Math.cos(radians) * 80; // 80% of clock radius
      const y = Math.sin(radians) * 80;
      
      markingsHTML += `<div class="hour-marking" style="transform: translate(${x}px, ${y}px)">${i}</div>`;
    }
    
    // Create minute markings
    for (let i = 0; i < 60; i++) {
      if (i % 5 !== 0) { // Skip positions where hour markings are
        const angle = (i * 6) - 90; // 6 degrees per minute, -90 to start at 12 o'clock
        const radians = angle * (Math.PI / 180);
        const x = Math.cos(radians) * 85; // 85% of clock radius
        const y = Math.sin(radians) * 85;
        
        markingsHTML += `<div class="minute-marking" style="transform: translate(${x}px, ${y}px)"></div>`;
      }
    }
    
    clockMarkings.innerHTML = markingsHTML;
  }

  function updateClock() {
    const now = new Date();
    
    if (clockMode === 'digital' && clockDigitalDisplay) {
      // Format time with leading zeros and animated colons
      const hours = now.getHours().toString().padStart(2, '0');
      const minutes = now.getMinutes().toString().padStart(2, '0');
      const seconds = now.getSeconds().toString().padStart(2, '0');
      
      // Animate the colon by toggling opacity
      const colonClass = now.getSeconds() % 2 === 0 ? 'colon-visible' : 'colon-faded';
      
      clockDigitalDisplay.innerHTML = `
        <span class="clock-number">${hours}</span>
        <span class="clock-colon ${colonClass}">:</span>
        <span class="clock-number">${minutes}</span>
        <span class="clock-colon ${colonClass}">:</span>
        <span class="clock-number">${seconds}</span>
      `;
    } else if (clockMode === 'analog' && secondHand && minuteHand && hourHand) {
      const seconds = now.getSeconds();
      const minutes = now.getMinutes();
      const hours = now.getHours() % 12;

      // Calculate rotation angles
      const secondDeg = ((seconds / 60) * 360) + 90; // Offset by 90deg because of initial CSS position
      const minuteDeg = ((minutes / 60) * 360) + ((seconds / 60) * 6) + 90;
      const hourDeg = ((hours / 12) * 360) + ((minutes / 60) * 30) + 90;

      // Apply smooth transitions for hour and minute hands
      hourHand.style.transition = seconds === 0 ? 'transform 0.5s cubic-bezier(0.4, 2.08, 0.55, 0.44)' : 'none';
      minuteHand.style.transition = seconds === 0 ? 'transform 0.5s cubic-bezier(0.4, 2.08, 0.55, 0.44)' : 'none';
      
      // Second hand has a continuous ticking motion
      secondHand.style.transition = 'transform 0.2s cubic-bezier(0.4, 2.08, 0.55, 0.44)';
      
      // Apply rotations
      secondHand.style.transform = `rotate(${secondDeg}deg)`;
      minuteHand.style.transform = `rotate(${minuteDeg}deg)`;
      hourHand.style.transform = `rotate(${hourDeg}deg)`;
    }
  }

  function toggleClockView() {
    if (clockMode === 'digital') {
      clockMode = 'analog';
      if (clockDigitalDisplay) {
        clockDigitalDisplay.style.opacity = 0;
        setTimeout(() => {
          clockDigitalDisplay.style.display = 'none';
          if (clockAnalogContainer) {
            clockAnalogContainer.style.display = 'block';
            setTimeout(() => {
              clockAnalogContainer.style.opacity = 1;
            }, 50);
          }
        }, 300);
      }
    } else {
      clockMode = 'digital';
      if (clockAnalogContainer) {
        clockAnalogContainer.style.opacity = 0;
        setTimeout(() => {
          clockAnalogContainer.style.display = 'none';
          if (clockDigitalDisplay) {
            clockDigitalDisplay.style.display = 'block';
            setTimeout(() => {
              clockDigitalDisplay.style.opacity = 1;
            }, 50);
          }
        }, 300);
      }
    }
    
    localStorage.setItem('clockMode', clockMode);
    updateClock(); // Update immediately
    if (window.soundEffects) window.soundEffects.playSwitch();
  }

  function toggleTimerView() {
    timerModeActive = !timerModeActive;
    
    if (timerModeActive) {
      // Fade out clock
      if (clockDigitalDisplay) clockDigitalDisplay.style.opacity = 0;
      if (clockAnalogContainer) clockAnalogContainer.style.opacity = 0;
      
      setTimeout(() => {
        // Hide clock
        if (clockDigitalDisplay) clockDigitalDisplay.style.display = 'none';
        if (clockAnalogContainer) clockAnalogContainer.style.display = 'none';
        
        // Show timer
        if (timerSection) {
          timerSection.style.display = 'block';
          setTimeout(() => {
            timerSection.style.opacity = 1;
          }, 50);
        }
        
        updateTimerDisplay();
      }, 300);
    } else {
      // Fade out timer
      if (timerSection) timerSection.style.opacity = 0;
      
      setTimeout(() => {
        // Hide timer
        if (timerSection) timerSection.style.display = 'none';
        
        // Show current clock view
        if (clockMode === 'digital' && clockDigitalDisplay) {
          clockDigitalDisplay.style.display = 'block';
          setTimeout(() => {
            clockDigitalDisplay.style.opacity = 1;
          }, 50);
        }
        if (clockMode === 'analog' && clockAnalogContainer) {
          clockAnalogContainer.style.display = 'block';
          setTimeout(() => {
            clockAnalogContainer.style.opacity = 1;
          }, 50);
        }
      }, 300);
      
      stopTimer(); // Stop timer when switching away
    }
    
    if (window.soundEffects) window.soundEffects.playSwitch();
  }

  function updateTimerDisplay() {
    if (!timerMinutesDisplay || !timerSecondsDisplay) return;
    
    const minutes = Math.floor(timerRemainingSeconds / 60);
    const seconds = timerRemainingSeconds % 60;
    
    timerMinutesDisplay.textContent = String(minutes).padStart(2, '0');
    timerSecondsDisplay.textContent = String(seconds).padStart(2, '0');
    
    // Update document title when timer is running
    if (isTimerRunning) {
      document.title = `${minutes}:${String(seconds).padStart(2, '0')} - Dashboard`;
    } else if (document.title.includes(':')) {
      document.title = 'Dashboard'; // Reset title when timer stops
    }
  }

  function startTimer() {
    if (isTimerRunning) {
      // Pause the timer
      clearInterval(timerInterval);
      isTimerRunning = false;
      if (startTimerBtn) startTimerBtn.textContent = 'Start';
      if (window.soundEffects) window.soundEffects.playClick();
      return;
    }
    
    isTimerRunning = true;
    if (startTimerBtn) startTimerBtn.textContent = 'Pause';
    if (window.soundEffects) window.soundEffects.playSwitch();
    
    timerInterval = setInterval(() => {
      timerRemainingSeconds--;
      updateTimerDisplay();
      
      // Add visual feedback as timer gets closer to zero
      if (timerRemainingSeconds <= 10 && timerRemainingSeconds > 0) {
        // Flash the timer display
        timerMinutesDisplay.classList.add('timer-ending');
        timerSecondsDisplay.classList.add('timer-ending');
      }
      
      if (timerRemainingSeconds <= 0) {
        stopTimer();
        showTimerNotification();
        if (window.soundEffects) window.soundEffects.playNotification();
      }
    }, 1000);
  }

  function stopTimer() {
    clearInterval(timerInterval);
    isTimerRunning = false;
    if (startTimerBtn) startTimerBtn.textContent = 'Start';
    
    // Remove ending animation classes
    if (timerMinutesDisplay) timerMinutesDisplay.classList.remove('timer-ending');
    if (timerSecondsDisplay) timerSecondsDisplay.classList.remove('timer-ending');
    
    // Reset document title
    document.title = 'Dashboard';
  }

  function resetTimer() {
    stopTimer();
    timerRemainingSeconds = timerTotalSeconds;
    updateTimerDisplay();
    if (window.soundEffects) window.soundEffects.playClick();
  }

  function setTimerPreset(minutes) {
    stopTimer();
    timerTotalSeconds = minutes * 60;
    timerRemainingSeconds = timerTotalSeconds;
    updateTimerDisplay();
    if (window.soundEffects) window.soundEffects.playClick();
    
    // Highlight active preset
    timerPresets.forEach(preset => {
      preset.classList.toggle('active', parseInt(preset.dataset.minutes) === minutes);
    });
  }

  function showTimerNotification() {
    // Use browser notifications if available and permitted
    if ('Notification' in window) {
      if (Notification.permission === 'granted') {
        new Notification('Timer Complete!', {
          body: 'Your timer has finished.',
          icon: '/favicon.ico' // Add a favicon path if available
        });
      } else if (Notification.permission !== 'denied') {
        Notification.requestPermission().then(permission => {
          if (permission === 'granted') {
            new Notification('Timer Complete!', {
              body: 'Your timer has finished.',
              icon: '/favicon.ico'
            });
          }
        });
      }
    }
    
    // Add visual notification
    const timerDisplay = document.querySelector('.timer-display');
    if (timerDisplay) {
      timerDisplay.classList.add('timer-complete');
      setTimeout(() => {
        timerDisplay.classList.remove('timer-complete');
      }, 3000);
    }
    
    // Play notification sound
    if (window.soundEffects) window.soundEffects.playNotification();
  }

  // Initialize clock
  if (clockMode === 'digital') {
    if (clockDigitalDisplay) clockDigitalDisplay.style.display = 'block';
    if (clockAnalogContainer) clockAnalogContainer.style.display = 'none';
  } else {
    if (clockDigitalDisplay) clockDigitalDisplay.style.display = 'none';
    if (clockAnalogContainer) clockAnalogContainer.style.display = 'block';
    createClockMarkings();
  }
  
  // Update clock every second
  updateClock();
  setInterval(updateClock, 1000);
  
  // Clock controls
  if (clockSwitchBtn) {
    clockSwitchBtn.addEventListener('click', toggleClockView);
  }
  
  if (timerToggleBtn) {
    timerToggleBtn.addEventListener('click', toggleTimerView);
  }
  
  if (startTimerBtn) {
    startTimerBtn.addEventListener('click', startTimer);
  }
  
  if (resetTimerBtn) {
    resetTimerBtn.addEventListener('click', resetTimer);
  }
  
  // Timer presets
  timerPresets.forEach(preset => {
    preset.addEventListener('click', () => {
      const minutes = parseInt(preset.dataset.minutes);
      setTimerPreset(minutes);
    });
  });
  
  // Initialize timer display
  updateTimerDisplay();

  // Todo List Widget
  const todoInput = document.getElementById('todoInput');
  const todoListEl = document.getElementById('todoList');
  const addTodoButton = document.getElementById('addTodo');
  const todoDateInput = document.getElementById('todoDate');
  const todoRecurringCheckbox = document.getElementById('todoRecurring');
  const todoListView = document.getElementById('todoListView');
  const todoKanbanView = document.getElementById('todoKanbanView');
  const todoListBtn = document.getElementById('todoList');
  const todoKanbanBtn = document.getElementById('todoKanban');
  let currentTodoView = localStorage.getItem('todoView') || 'list'; // 'list' or 'kanban'

  function updateTodos() {
    localStorage.setItem('todos', JSON.stringify(todos));
    renderTodos();
  }

  function renderTodos() {
    if (currentTodoView === 'list') {
      if (!todoListEl) return;
      
      todoListEl.innerHTML = '';
      
      if (todos.length === 0) {
        todoListEl.innerHTML = '<li class="empty-list">No tasks yet. Add one above!</li>';
        return;
      }
      
      todos.forEach((todo, index) => {
        const li = document.createElement('li');
        li.className = 'todo-item';
        if (todo.completed) li.classList.add('completed');
        
        // Add animation classes for new items
        li.classList.add('todo-item-enter');
        setTimeout(() => li.classList.remove('todo-item-enter'), 500);
        
        li.innerHTML = `
          <div class="todo-content">
            <input type="checkbox" ${todo.completed ? 'checked' : ''} aria-label="Mark as ${todo.completed ? 'incomplete' : 'complete'}">
            <span class="todo-text">${todo.text}</span>
            ${todo.dueDate ? `<span class="todo-date">${new Date(todo.dueDate).toLocaleDateString()}</span>` : ''}
            ${todo.recurring ? '<span class="todo-recurring">🔄</span>' : ''}
          </div>
          <div class="todo-actions">
            <button class="todo-edit" aria-label="Edit task">✏️</button>
            <button class="todo-delete" aria-label="Delete task">🗑️</button>
          </div>
        `;
        
        // Add event listeners
        const checkbox = li.querySelector('input[type="checkbox"]');
        checkbox.addEventListener('change', () => {
          todos[index].completed = checkbox.checked;
          if (checkbox.checked) {
            li.classList.add('completed');
            if (window.soundEffects) window.soundEffects.playSuccess();
          } else {
            li.classList.remove('completed');
            if (window.soundEffects) window.soundEffects.playClick();
          }
          updateTodos();
        });
        
        const deleteBtn = li.querySelector('.todo-delete');
        deleteBtn.addEventListener('click', () => {
          // Add exit animation
          li.classList.add('todo-item-exit');
          setTimeout(() => {
            todos.splice(index, 1);
            updateTodos();
          }, 300);
          if (window.soundEffects) window.soundEffects.playClick();
        });
        
        const editBtn = li.querySelector('.todo-edit');
        editBtn.addEventListener('click', () => {
          const newText = prompt('Edit task:', todo.text);
          if (newText !== null && newText.trim() !== '') {
            todos[index].text = newText.trim();
            updateTodos();
          }
          if (window.soundEffects) window.soundEffects.playClick();
        });
        
        todoListEl.appendChild(li);
      });
    } else if (currentTodoView === 'kanban') {
      // Kanban view rendering
      const todoColumn = document.querySelector('#todoToDo .kanban-items');
      const inProgressColumn = document.querySelector('#todoInProgress .kanban-items');
      const doneColumn = document.querySelector('#todoDone .kanban-items');
      
      if (!todoColumn || !inProgressColumn || !doneColumn) return;
      
      // Clear columns
      todoColumn.innerHTML = '';
      inProgressColumn.innerHTML = '';
      doneColumn.innerHTML = '';
      
      // Render items in appropriate columns
      todos.forEach((todo, index) => {
        const item = document.createElement('div');
        item.className = 'kanban-item';
        item.draggable = true;
        item.dataset.index = index;
        
        // Add animation for new items
        item.classList.add('kanban-item-enter');
        setTimeout(() => item.classList.remove('kanban-item-enter'), 500);
        
        item.innerHTML = `
          <div class="kanban-item-content">
            <span class="kanban-item-text">${todo.text}</span>
            ${todo.dueDate ? `<span class="kanban-item-date">${new Date(todo.dueDate).toLocaleDateString()}</span>` : ''}
            ${todo.recurring ? '<span class="kanban-item-recurring">🔄</span>' : ''}
          </div>
          <div class="kanban-item-actions">
            <button class="kanban-item-delete" aria-label="Delete task">🗑️</button>
          </div>
        `;
        
        // Add drag events
        item.addEventListener('dragstart', (e) => {
          e.dataTransfer.setData('text/plain', index);
          item.classList.add('dragging');
        });
        
        item.addEventListener('dragend', () => {
          item.classList.remove('dragging');
        });
        
        // Add delete button event
        const deleteBtn = item.querySelector('.kanban-item-delete');
        deleteBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          // Add exit animation
          item.classList.add('kanban-item-exit');
          setTimeout(() => {
            todos.splice(index, 1);
            updateTodos();
          }, 300);
          if (window.soundEffects) window.soundEffects.playClick();
        });
        
        // Place in appropriate column
        if (todo.completed) {
          doneColumn.appendChild(item);
        } else if (todo.status === 'in-progress') {
          inProgressColumn.appendChild(item);
        } else {
          todoColumn.appendChild(item);
        }
      });
      
      // Show empty state if needed
      if (todos.length === 0) {
        todoColumn.innerHTML = '<div class="empty-column">No tasks yet</div>';
      }
    }
  }

  // Add new todo
  function addTodo() {
    if (!todoInput) return;
    
    const text = todoInput.value.trim();
    if (text === '') return;
    
    const dueDate = todoDateInput && todoDateInput.value ? new Date(todoDateInput.value).toISOString() : null;
    const recurring = todoRecurringCheckbox ? todoRecurringCheckbox.checked : false;
    
    todos.push({
      text,
      completed: false,
      status: 'todo',
      dueDate,
      recurring,
      createdAt: new Date().toISOString()
    });
    
    todoInput.value = '';
    if (todoDateInput) todoDateInput.value = '';
    if (todoRecurringCheckbox) todoRecurringCheckbox.checked = false;
    
    updateTodos();
    if (window.soundEffects) window.soundEffects.playSuccess();
  }

  // Toggle between list and kanban views
  function toggleTodoView(view) {
    if (view === currentTodoView) return;
    
    currentTodoView = view;
    localStorage.setItem('todoView', view);
    
    if (view === 'list') {
      if (todoListView) todoListView.style.display = 'block';
      if (todoKanbanView) todoKanbanView.style.display = 'none';
      if (todoListBtn) todoListBtn.classList.add('active');
      if (todoKanbanBtn) todoKanbanBtn.classList.remove('active');
    } else {
      if (todoListView) todoListView.style.display = 'none';
      if (todoKanbanView) todoKanbanView.style.display = 'block';
      if (todoListBtn) todoListBtn.classList.remove('active');
      if (todoKanbanBtn) todoKanbanBtn.classList.add('active');
    }
    
    renderTodos();
    if (window.soundEffects) window.soundEffects.playSwitch();
  }

  // Drag and drop for kanban
  function allowDrop(e) {
    e.preventDefault();
    e.target.closest('.kanban-column').classList.add('drag-over');
  }

  function dragLeave(e) {
    e.target.closest('.kanban-column').classList.remove('drag-over');
  }

  function drop(e) {
    e.preventDefault();
    const column = e.target.closest('.kanban-column');
    column.classList.remove('drag-over');
    
    const todoIndex = e.dataTransfer.getData('text/plain');
    if (!todoIndex) return;
    
    const columnId = column.id;
    
    // Update todo status based on column
    if (columnId === 'todoToDo') {
      todos[todoIndex].status = 'todo';
      todos[todoIndex].completed = false;
    } else if (columnId === 'todoInProgress') {
      todos[todoIndex].status = 'in-progress';
      todos[todoIndex].completed = false;
    } else if (columnId === 'todoDone') {
      todos[todoIndex].status = 'done';
      todos[todoIndex].completed = true;
      if (window.soundEffects) window.soundEffects.playSuccess();
    }
    
    updateTodos();
  }

  // Initialize todo list
  if (currentTodoView === 'list') {
    if (todoListView) todoListView.style.display = 'block';
    if (todoKanbanView) todoKanbanView.style.display = 'none';
    if (todoListBtn) todoListBtn.classList.add('active');
    if (todoKanbanBtn) todoKanbanBtn.classList.remove('active');
  } else {
    if (todoListView) todoListView.style.display = 'none';
    if (todoKanbanView) todoKanbanView.style.display = 'block';
    if (todoListBtn) todoListBtn.classList.remove('active');
    if (todoKanbanBtn) todoKanbanBtn.classList.add('active');
  }
  
  renderTodos();
  
  // Todo event listeners
  if (addTodoButton) {
    addTodoButton.addEventListener('click', addTodo);
  }
  
  if (todoInput) {
    todoInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        addTodo();
      }
    });
  }
  
  if (todoListBtn) {
    todoListBtn.addEventListener('click', () => toggleTodoView('list'));
  }
  
  if (todoKanbanBtn) {
    todoKanbanBtn.addEventListener('click', () => toggleTodoView('kanban'));
  }
  
  // Setup drag and drop for kanban columns
  document.querySelectorAll('.kanban-column').forEach(column => {
    column.addEventListener('dragover', allowDrop);
    column.addEventListener('dragleave', dragLeave);
    column.addEventListener('drop', drop);
  });

  // Make drag and drop functions global
  window.allowDrop = allowDrop;
  window.dragLeave = dragLeave;
  window.drop = drop;

  // Notes Widget
  const notesArea = document.getElementById('notesArea');
  const notesPreviewContent = document.getElementById('notesPreview');
  const notesEditorContent = document.getElementById('notesEditor');
  const notesEditorTab = document.querySelector('.tab[data-target="editor"]');
  const notesPreviewTab = document.querySelector('.tab[data-target="preview"]');
  const tagInput = document.getElementById('tagInput');
  const tagsDisplay = document.getElementById('tagsDisplay');
  const notesMarkdownToggle = document.getElementById('notesMarkdownToggle');
  const notesSnapshotBtn = document.getElementById('notesSnapshot');
  const notesHistoryToggle = document.getElementById('notesHistoryToggle');
  const notesHistorySection = document.getElementById('notesHistory');
  const snapshotListEl = document.getElementById('snapshotList');

  function renderNotes() {
    if (notesArea) {
      notesArea.value = notesData.content;
      renderMarkdownPreview();
    }
    renderTags();
  }

  function renderTags() {
    if (!tagsDisplay) return;
    
    tagsDisplay.innerHTML = notesData.tags.map((tag, index) => `
      <span class="tag">
        ${tag}
        <button onclick="removeTag(${index})" title="Remove Tag">&times;</button>
      </span>
    `).join('');
    
    // Add animation for tags
    document.querySelectorAll('.tag').forEach(tag => {
      tag.classList.add('tag-enter');
      setTimeout(() => tag.classList.remove('tag-enter'), 500);
    });
  }

  function renderMarkdownPreview() {
    if (!notesPreviewContent || !notesArea) return;
    
    const content = notesArea.value;
    
    // Use Marked.js if available
    if (typeof marked !== 'undefined') {
      try {
        // Configure marked
        marked.setOptions({
          gfm: true,
          breaks: true,
        });
        
        notesPreviewContent.innerHTML = marked.parse(content);
        
        // Add animation for preview updates
        notesPreviewContent.classList.add('preview-update');
        setTimeout(() => notesPreviewContent.classList.remove('preview-update'), 500);
      } catch (error) {
        notesPreviewContent.textContent = 'Error rendering Markdown.';
        console.error("Markdown rendering error:", error);
      }
    } else {
      // Fallback to basic simulation if marked.js fails to load
      let html = content
        .replace(/^### (.*$)/gim, '<h3>$1</h3>')
        .replace(/^## (.*$)/gim, '<h2>$1</h2>')
        .replace(/^# (.*$)/gim, '<h1>$1</h1>')
        .replace(/\*\*(.*)\*\*/gim, '<strong>$1</strong>')
        .replace(/\*(.*)\*/gim, '<em>$1</em>')
        .replace(/`(.*?)`/gim, '<code>$1</code>')
        .replace(/\n/g, '<br>');
        
      notesPreviewContent.innerHTML = html + '<p><small>(Markdown library not loaded, basic preview shown)</small></p>';
    }
  }

  window.removeTag = function(index) {
    notesData.tags.splice(index, 1);
    localStorage.setItem('notesData', JSON.stringify(notesData));
    renderTags();
    if (window.soundEffects) window.soundEffects.playClick();
  }

  if (notesArea) {
    notesArea.addEventListener('input', () => {
      notesData.content = notesArea.value;
      localStorage.setItem('notesData', JSON.stringify(notesData));
      renderMarkdownPreview();
    });
    
    // Add autosave indicator
    let saveTimeout;
    notesArea.addEventListener('input', () => {
      clearTimeout(saveTimeout);
      
      // Show saving indicator
      const savingIndicator = document.createElement('div');
      savingIndicator.className = 'saving-indicator';
      savingIndicator.textContent = 'Saving...';
      document.body.appendChild(savingIndicator);
      
      saveTimeout = setTimeout(() => {
        // Change to saved indicator
        savingIndicator.textContent = 'Saved!';
        savingIndicator.classList.add('saved');
        
        // Remove indicator after a delay
        setTimeout(() => {
          savingIndicator.classList.add('fade-out');
          setTimeout(() => {
            document.body.removeChild(savingIndicator);
          }, 500);
        }, 1000);
      }, 500);
    });
    
    renderNotes();
  }

  if (tagInput) {
    tagInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter' && tagInput.value.trim()) {
        e.preventDefault();
        const newTag = tagInput.value.trim();
        
        if (!notesData.tags.includes(newTag)) {
          notesData.tags.push(newTag);
          localStorage.setItem('notesData', JSON.stringify(notesData));
          renderTags();
          if (window.soundEffects) window.soundEffects.playSuccess();
        }
        
        tagInput.value = '';
      }
    });
  }

  if (notesEditorTab && notesPreviewTab) {
    notesEditorTab.addEventListener('click', () => {
      notesEditorTab.classList.add('active');
      notesPreviewTab.classList.remove('active');
      notesEditorContent.classList.add('active');
      notesPreviewContent.classList.remove('active');
      
      // Add transition animation
      notesEditorContent.classList.add('tab-transition');
      setTimeout(() => notesEditorContent.classList.remove('tab-transition'), 300);
      
      if (window.soundEffects) window.soundEffects.playClick();
    });
    
    notesPreviewTab.addEventListener('click', () => {
      notesPreviewTab.classList.add('active');
      notesEditorTab.classList.remove('active');
      notesPreviewContent.classList.add('active');
      notesEditorContent.classList.remove('active');
      
      // Add transition animation
      notesPreviewContent.classList.add('tab-transition');
      setTimeout(() => notesPreviewContent.classList.remove('tab-transition'), 300);
      
      renderMarkdownPreview();
      if (window.soundEffects) window.soundEffects.playClick();
    });
  }

  if (notesMarkdownToggle) {
    notesMarkdownToggle.addEventListener('click', () => {
      const isEditorActive = notesEditorTab.classList.contains('active');
      
      if (isEditorActive) {
        notesPreviewTab.click();
      } else {
        notesEditorTab.click();
      }
    });
  }

  // Snapshot Functionality
  function renderSnapshots() {
    if (!snapshotListEl) return;
    
    snapshotListEl.innerHTML = notesData.snapshots.map((snapshot, index) => `
      <li class="snapshot-item">
        <span class="snapshot-date">${new Date(snapshot.timestamp).toLocaleString()}</span>
        <div class="snapshot-actions">
          <button onclick="restoreSnapshot(${index})" class="snapshot-restore">Restore</button>
          <button onclick="deleteSnapshot(${index})" class="snapshot-delete">Delete</button>
        </div>
      </li>
    `).join('');
    
    // Add animation for snapshot items
    document.querySelectorAll('.snapshot-item').forEach(item => {
      item.classList.add('snapshot-item-enter');
      setTimeout(() => item.classList.remove('snapshot-item-enter'), 500);
    });
  }

  window.restoreSnapshot = function(index) {
    if (confirm(`Restore note content from snapshot taken at ${new Date(notesData.snapshots[index].timestamp).toLocaleString()}? Current content will be overwritten.`)) {
      notesData.content = notesData.snapshots[index].content;
      if (notesArea) notesArea.value = notesData.content;
      localStorage.setItem('notesData', JSON.stringify(notesData));
      renderMarkdownPreview();
      
      // Switch back to editor tab if history is open
      if (notesHistorySection.style.display !== 'none') {
        notesHistoryToggle.click();
        notesEditorTab.click();
      }
      
      if (window.soundEffects) window.soundEffects.playSuccess();
    }
  }

  window.deleteSnapshot = function(index) {
    if (confirm(`Delete snapshot from ${new Date(notesData.snapshots[index].timestamp).toLocaleString()}?`)) {
      // Add exit animation to the snapshot item
      const snapshotItem = snapshotListEl.children[index];
      snapshotItem.classList.add('snapshot-item-exit');
      
      setTimeout(() => {
        notesData.snapshots.splice(index, 1);
        localStorage.setItem('notesData', JSON.stringify(notesData));
        renderSnapshots();
      }, 300);
      
      if (window.soundEffects) window.soundEffects.playClick();
    }
  }

  if (notesSnapshotBtn) {
    notesSnapshotBtn.addEventListener('click', () => {
      const timestamp = new Date().toISOString();
      notesData.snapshots.unshift({ timestamp, content: notesData.content });
      notesData.snapshots = notesData.snapshots.slice(0, 10);
      localStorage.setItem('notesData', JSON.stringify(notesData));
      
      // Show confirmation with animation
      const confirmationMsg = document.createElement('div');
      confirmationMsg.className = 'snapshot-confirmation';
      confirmationMsg.textContent = `Snapshot saved at ${new Date(timestamp).toLocaleString()}`;
      document.body.appendChild(confirmationMsg);
      
      setTimeout(() => {
        confirmationMsg.classList.add('fade-out');
        setTimeout(() => {
          document.body.removeChild(confirmationMsg);
        }, 500);
      }, 2000);
      
      renderSnapshots();
      if (window.soundEffects) window.soundEffects.playSuccess();
    });
  }

  if (notesHistoryToggle) {
    notesHistoryToggle.addEventListener('click', () => {
      const isVisible = notesHistorySection.style.display !== 'none';
      
      if (isVisible) {
        // Hide history with animation
        notesHistorySection.classList.add('history-exit');
        setTimeout(() => {
          notesHistorySection.style.display = 'none';
          notesHistorySection.classList.remove('history-exit');
        }, 300);
      } else {
        // Show history with animation
        notesHistorySection.style.display = 'block';
        notesHistorySection.classList.add('history-enter');
        setTimeout(() => {
          notesHistorySection.classList.remove('history-enter');
        }, 300);
        renderSnapshots();
      }
      
      if (window.soundEffects) window.soundEffects.playSwitch();
    });
  }

  // Calculator Widget
  const calcInput = document.getElementById('calcInput');
  const calcButtonsContainer = document.querySelector('.calc-buttons');
  const calcHistoryList = document.getElementById('calcHistoryList');
  const calcModeStandard = document.getElementById('calcModeStandard');
  const calcModeScientific = document.getElementById('calcModeScientific');
  const calcModeProgramming = document.getElementById('calcModeProgramming');
  let currentCalcMode = localStorage.getItem('calcMode') || 'standard'; // 'standard', 'scientific', 'programming'

  function updateCalcHistory() {
    if (!calcHistoryList) return;
    
    calcHistoryList.innerHTML = calcHistory.map(entry =>
      `<li onclick="loadFromHistory('${entry.replace(/'/g, "\\'")}')">${entry}</li>`
    ).join('');
    
    localStorage.setItem('calcHistory', JSON.stringify(calcHistory));
    
    // Add animation for history items
    document.querySelectorAll('#calcHistoryList li').forEach((item, index) => {
      item.style.animationDelay = `${index * 0.05}s`;
      item.classList.add('history-item-enter');
      setTimeout(() => item.classList.remove('history-item-enter'), 500);
    });
  }

  window.loadFromHistory = function(entry) {
    if (calcInput) {
      // Extract the result part if entry is like "1+2 = 3"
      const parts = entry.split('=');
      calcInput.value = parts.length > 1 ? parts[1].trim() : entry;
      
      // Add animation to calculator display
      calcInput.classList.add('calc-input-update');
      setTimeout(() => calcInput.classList.remove('calc-input-update'), 300);
      
      if (window.soundEffects) window.soundEffects.playClick();
    }
  }

  function setupCalculatorButtons() {
    if (!calcInput || !calcButtonsContainer) return;
    calcButtonsContainer.innerHTML = '';

    let buttons = [];
    if (currentCalcMode === 'standard') {
      buttons = ['C', '(', ')', '/', '7', '8', '9', '*', '4', '5', '6', '-', '1', '2', '3', '+', '0', '.', '='];
    } else if (currentCalcMode === 'scientific') {
      buttons = [
        'Rad', 'Deg', 'x!', '(', ')', '%', 'C',
        'Inv', 'sin', 'ln', '7', '8', '9', '/',
        'π', 'cos', 'log', '4', '5', '6', '*',
        'e', 'tan', '√', '1', '2', '3', '-',
        'Ans', 'EXP', 'x^y', '0', '.', '=', '+'
      ];
    } else if (currentCalcMode === 'programming') {
      buttons = [
        'Hex', 'Dec', 'Oct', 'Bin',
        '<<', '>>', 'AND', 'OR', 'XOR', 'NOT', 'C',
        'A', 'B', '7', '8', '9', 'Mod',
        'C', 'D', '4', '5', '6', '/',
        'E', 'F', '1', '2', '3', '*',
        '(', ')', '0', '=', '-' , '+'
      ];
    } else {
      buttons = ['C', '7', '8', '9', '/', '4', '5', '6', '*', '1', '2', '3', '-', '0', '.', '=', '+'];
    }

    buttons.forEach(btn => {
      const button = document.createElement('button');
      button.textContent = btn;
      button.className = 'calc-button';
      
      // Add specific classes for styling
      if (btn === '=') button.classList.add('equals');
      if (btn === 'C') button.classList.add('clear');
      if (['+', '-', '*', '/', '%'].includes(btn)) button.classList.add('operator');
      if (['sin', 'cos', 'tan', 'log', 'ln', '√', 'π', 'e'].includes(btn)) button.classList.add('function');
      
      button.addEventListener('click', () => {
        handleCalcInput(btn);
        
        // Add button press animation
        button.classList.add('calc-button-press');
        setTimeout(() => button.classList.remove('calc-button-press'), 150);
        
        if (window.soundEffects) {
          if (btn === '=') {
            window.soundEffects.playSuccess();
          } else if (btn === 'C') {
            window.soundEffects.playSwitch();
          } else {
            window.soundEffects.playClick();
          }
        }
      });
      
      calcButtonsContainer.appendChild(button);
    });
    
    // Adjust grid columns based on mode
    const columns = (currentCalcMode === 'scientific') ? 7 : (currentCalcMode === 'programming' ? 6 : 4);
    calcButtonsContainer.style.gridTemplateColumns = `repeat(${columns}, 1fr)`;
    
    // Save current mode to localStorage
    localStorage.setItem('calcMode', currentCalcMode);
  }

  function handleCalcInput(btn) {
    if (!calcInput) return;
    let currentValue = calcInput.value;

    // Prevent multiple operators or invalid sequences
    const lastChar = currentValue.slice(-1);
    const operators = ['/', '*', '-', '+', '%'];

    if (btn === 'C') {
      calcInput.value = '';
      calcInput.classList.add('calc-input-clear');
      setTimeout(() => calcInput.classList.remove('calc-input-clear'), 300);
    } else if (btn === '=') {
      try {
        // Basic replacements for safety
        let safeExpression = currentValue
          .replace(/[^-()\d/*+%.eπ]/g, '')
          .replace(/π/g, 'Math.PI')
          .replace(/e/g, 'Math.E');
          
        const result = Function(`"use strict"; return (${safeExpression})`)();

        // Avoid displaying 'undefined' or excessively long results
        if (result === undefined || result === null || isNaN(result)) {
          throw new Error("Invalid calculation");
        }
        
        const displayResult = Number(result.toFixed(10));

        const historyEntry = `${currentValue} = ${displayResult}`;
        calcInput.value = displayResult;
        
        // Add calculation success animation
        calcInput.classList.add('calc-input-success');
        setTimeout(() => calcInput.classList.remove('calc-input-success'), 500);
        
        if (!calcHistory.includes(historyEntry)) {
          calcHistory.unshift(historyEntry);
          calcHistory = calcHistory.slice(0, 20);
          updateCalcHistory();
        }
      } catch (error) {
        console.error("Calculation Error:", error);
        calcInput.value = 'Error';
        
        // Add error animation
        calcInput.classList.add('calc-input-error');
        setTimeout(() => calcInput.classList.remove('calc-input-error'), 500);
      }
    } else if (currentCalcMode === 'scientific') {
      // Handle scientific functions
      try {
        let result;
        // Assume functions operate on the current value or last number
        const currentNumber = parseFloat(currentValue.match(/-?\d*\.?\d+$/)?.[0] || currentValue) || 0;

        switch (btn) {
          case 'sin': result = Math.sin(currentNumber); break;
          case 'cos': result = Math.cos(currentNumber); break;
          case 'tan': result = Math.tan(currentNumber); break;
          case 'log': result = Math.log10(currentNumber); break;
          case 'ln': result = Math.log(currentNumber); break;
          case '√': result = Math.sqrt(currentNumber); break;
          case 'x!': // Factorial
            if (Number.isInteger(currentNumber) && currentNumber >= 0) {
              result = 1;
              for (let i = 2; i <= currentNumber; i++) result *= i;
            } else {
              throw new Error("Factorial requires non-negative integer");
            }
            break;
          case 'π': calcInput.value += Math.PI; return;
          case 'e': calcInput.value += Math.E; return;
          case '%': calcInput.value += '/100'; return;
          case 'Rad': case 'Deg': case 'Inv': case 'EXP': case 'Ans': case 'x^y':
            alert(`Functionality for "${btn}" not fully implemented.`);
            return;
          default: calcInput.value += btn; return;
        }
        
        // Replace current number with result
        calcInput.value = currentValue.replace(/-?\d*\.?\d+$/, '') + result.toFixed(10);
        
        // Add update animation
        calcInput.classList.add('calc-input-update');
        setTimeout(() => calcInput.classList.remove('calc-input-update'), 300);
      } catch (error) {
        console.error("Scientific Calc Error:", error);
        calcInput.value = 'Error';
        
        // Add error animation
        calcInput.classList.add('calc-input-error');
        setTimeout(() => calcInput.classList.remove('calc-input-error'), 500);
      }
    } else if (currentCalcMode === 'programming') {
      // Basic implementation for programming mode
      if (!['Hex', 'Dec', 'Oct', 'Bin', '<<', '>>', 'AND', 'OR', 'XOR', 'NOT', 'Mod', 'A', 'B', 'C', 'D', 'E', 'F'].includes(btn)) {
        calcInput.value += btn;
      } else {
        alert(`Programming mode function "${btn}" not fully implemented yet.`);
      }
    } else {
      // Standard mode or unhandled buttons
      // Basic operator validation
      if (operators.includes(btn) && operators.includes(lastChar)) {
        // Replace last operator instead of adding another
        calcInput.value = currentValue.slice(0, -1) + btn;
      } else if (btn === '.' && lastChar === '.') {
        // Prevent double decimal points
        return;
      } else {
        calcInput.value += btn;
        
        // Add subtle animation for number input
        calcInput.classList.add('calc-input-type');
        setTimeout(() => calcInput.classList.remove('calc-input-type'), 100);
      }
    }
  }

  if (calcInput && calcButtonsContainer) {
    setupCalculatorButtons();
    updateCalcHistory();
  }

  if (calcModeStandard) {
    calcModeStandard.addEventListener('click', () => {
      currentCalcMode = 'standard';
      setupCalculatorButtons();
      if (window.soundEffects) window.soundEffects.playSwitch();
    });
  }
  
  if (calcModeScientific) {
    calcModeScientific.addEventListener('click', () => {
      currentCalcMode = 'scientific';
      setupCalculatorButtons();
      if (window.soundEffects) window.soundEffects.playSwitch();
    });
  }
  
  if (calcModeProgramming) {
    calcModeProgramming.addEventListener('click', () => {
      currentCalcMode = 'programming';
      setupCalculatorButtons();
      if (window.soundEffects) window.soundEffects.playSwitch();
    });
  }

  // Weather Widget using Open-Meteo API
  const weatherInfo = document.getElementById('weatherInfo');
  const weatherForecastEl = document.getElementById('weatherForecast');
  const weatherHourlyEl = document.getElementById('hourlyForecastList');
  const aqiInfoEl = document.getElementById('aqiInfo');
  const weatherRefreshBtn = document.getElementById('weatherRefresh');
  const weatherLocationBtn = document.getElementById('weatherLocation');
  const locationModal = document.getElementById('locationModal');
  const closeLocationBtn = document.getElementById('closeLocation');
  const locationForm = document.getElementById('locationForm');
  const cityInput = document.getElementById('cityInput');
  const useCurrentLocationBtn = document.getElementById('useCurrentLocation');

  function fetchWeather(lat, lon, locationName = "Current Location") {
    const weatherWidget = document.getElementById('weather');
    if (weatherWidget) showLoading(weatherWidget);
    
    // Fetch current, hourly (temp, code), daily (code, temp max/min), and air quality
    const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code,wind_speed_10m&hourly=temperature_2m,weather_code&daily=weather_code,temperature_2m_max,temperature_2m_min&timezone=auto`;
    const aqiUrl = `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lat}&longitude=${lon}&current=us_aqi&timezone=auto`;

    weatherInfo.innerHTML = `<p>Loading weather for ${locationName}...</p>`;
    if (weatherHourlyEl) weatherHourlyEl.innerHTML = '';
    if (weatherForecastEl) weatherForecastEl.innerHTML = '';
    if (aqiInfoEl) aqiInfoEl.innerHTML = 'Loading AQI...';

    // Fetch main weather data
    const weatherPromise = fetch(weatherUrl)
      .then(response => response.json())
      .then(data => {
        if (data?.current) {
          const { temperature_2m, weather_code, wind_speed_10m } = data.current;
          const weatherDesc = getWeatherDescription(weather_code);
          
          // Create animated weather info
          weatherInfo.innerHTML = `
            <div class="weather-current">
              <h3 class="weather-location">${locationName}</h3>
              <div class="weather-main">
                <div class="weather-icon">${getWeatherIcon(weather_code)}</div>
                <div class="weather-temp">${Math.round(temperature_2m)}°C</div>
              </div>
              <div class="weather-desc">${weatherDesc}</div>
              <div class="weather-wind">Wind: ${wind_speed_10m} km/h</div>
            </div>
          `;
          
          // Add animation classes
          const weatherElements = weatherInfo.querySelectorAll('.weather-location, .weather-icon, .weather-temp, .weather-desc, .weather-wind');
          weatherElements.forEach((el, index) => {
            el.style.animationDelay = `${index * 0.1}s`;
            el.classList.add('weather-item-enter');
          });
        } else {
          weatherInfo.innerHTML = '<p>Current weather data unavailable.</p>';
        }

        // Display Hourly Forecast (next 12 hours)
        if (data?.hourly && weatherHourlyEl) {
          const now = new Date();
          const currentHour = now.getHours();
          // Find the index corresponding to the current hour or the next available hour
          let startIndex = data.hourly.time.findIndex(timeISO => new Date(timeISO).getHours() >= currentHour);
          if (startIndex === -1) startIndex = 0;

          const hourlyData = data.hourly.time.slice(startIndex, startIndex + 12).map((timeISO, index) => ({
            time: new Date(timeISO).toLocaleTimeString('en-US', { hour: 'numeric', hour12: true }),
            temp: Math.round(data.hourly.temperature_2m[startIndex + index]),
            code: data.hourly.weather_code[startIndex + index]
          }));

          weatherHourlyEl.innerHTML = hourlyData.map((hour, index) => `
            <div class="hourly-item" style="animation-delay: ${index * 0.05}s">
              <div class="hourly-time">${hour.time}</div>
              <div class="hourly-icon">${getWeatherIcon(hour.code)}</div>
              <div class="hourly-temp">${hour.temp}°</div>
            </div>
          `).join('');
          
          // Add animation class to container
          weatherHourlyEl.classList.add('hourly-container-enter');
          setTimeout(() => weatherHourlyEl.classList.remove('hourly-container-enter'), 1000);
        } else if (weatherHourlyEl) {
          weatherHourlyEl.innerHTML = '<p>Hourly forecast unavailable.</p>';
        }

        // Display Daily Forecast
        if (data?.daily && weatherForecastEl) {
          const { time, weather_code, temperature_2m_max, temperature_2m_min } = data.daily;
          
          weatherForecastEl.innerHTML = time.slice(0, 7).map((date, index) => `
            <div class="forecast-day" style="animation-delay: ${index * 0.1}s">
              <div class="forecast-date">${new Date(date).toLocaleDateString('en-US', { weekday: 'short' })}</div>
              <div class="forecast-icon">${getWeatherIcon(weather_code[index])}</div>
              <div class="forecast-temp">${Math.round(temperature_2m_max[index])}° / ${Math.round(temperature_2m_min[index])}°</div>
            </div>
          `).join('');
          
          // Add animation class to forecast days
          document.querySelectorAll('.forecast-day').forEach(day => {
            day.classList.add('forecast-day-enter');
          });
        } else if (weatherForecastEl) {
          weatherForecastEl.innerHTML = '<p>Daily forecast unavailable.</p>';
        }
      })
      .catch((error) => {
        console.error("Weather fetch error:", error);
        weatherInfo.innerHTML = '<p>Error fetching weather data.</p>';
        if (weatherHourlyEl) weatherHourlyEl.innerHTML = '';
        if (weatherForecastEl) weatherForecastEl.innerHTML = '';
      });

    // Fetch Air Quality Data
    const aqiPromise = fetch(aqiUrl)
      .then(response => response.json())
      .then(data => {
        if (data?.current?.us_aqi && aqiInfoEl) {
          const aqi = data.current.us_aqi;
          const aqiDesc = getAqiDescription(aqi);
          const aqiColor = getAqiColor(aqi);
          
          aqiInfoEl.innerHTML = `
            <div class="aqi-display">
              <div class="aqi-value" style="color: ${aqiColor}">${aqi}</div>
              <div class="aqi-desc">${aqiDesc}</div>
            </div>
          `;
          
          // Add animation
          aqiInfoEl.classList.add('aqi-enter');
          setTimeout(() => aqiInfoEl.classList.remove('aqi-enter'), 500);
        } else if (aqiInfoEl) {
          aqiInfoEl.innerHTML = '<p>AQI data unavailable.</p>';
        }
      })
      .catch(() => {
        if (aqiInfoEl) aqiInfoEl.innerHTML = '<p>Error fetching AQI data.</p>';
      });

    // Add loading indicator hide when weather data is loaded
    Promise.all([weatherPromise, aqiPromise])
      .finally(() => {
        if (weatherWidget) hideLoading(weatherWidget);
        if (window.soundEffects) window.soundEffects.playSuccess();
      });
  }

  // Helper functions for Weather
  function getWeatherDescription(code) {
    // Simplified mapping based on WMO Weather interpretation codes
    const descriptions = {
      0: 'Clear sky', 1: 'Mainly clear', 2: 'Partly cloudy', 3: 'Overcast',
      45: 'Fog', 48: 'Depositing rime fog',
      51: 'Light drizzle', 53: 'Moderate drizzle', 55: 'Dense drizzle',
      56: 'Light freezing drizzle', 57: 'Dense freezing drizzle',
      61: 'Slight rain', 63: 'Moderate rain', 65: 'Heavy rain',
      66: 'Light freezing rain', 67: 'Heavy freezing rain',
      71: 'Slight snow fall', 73: 'Moderate snow fall', 75: 'Heavy snow fall',
      77: 'Snow grains',
      80: 'Slight rain showers', 81: 'Moderate rain showers', 82: 'Violent rain showers',
      85: 'Slight snow showers', 86: 'Heavy snow showers',
      95: 'Thunderstorm', 96: 'Thunderstorm with slight hail', 99: 'Thunderstorm with heavy hail'
    };
    return descriptions[code] || 'Unknown';
  }

  function getWeatherIcon(code) {
    // Cute emoji mapping with animations
    if ([0, 1].includes(code)) return '<span class="weather-icon-sun">☀️</span>';
    if ([2].includes(code)) return '<span class="weather-icon-partly-cloudy">⛅</span>';
    if ([3].includes(code)) return '<span class="weather-icon-cloudy">☁️</span>';
    if ([45, 48].includes(code)) return '<span class="weather-icon-fog">🌫️</span>';
    if (code >= 51 && code <= 67) return '<span class="weather-icon-rain">🌧️</span>';
    if (code >= 71 && code <= 77) return '<span class="weather-icon-snow">❄️</span>';
    if (code >= 80 && code <= 86) return '<span class="weather-icon-showers">🌦️</span>';
    if (code >= 95 && code <= 99) return '<span class="weather-icon-thunder">⛈️</span>';
    return '❓';
  }

  function getAqiDescription(aqi) {
    if (aqi <= 50) return 'Good';
    if (aqi <= 100) return 'Moderate';
    if (aqi <= 150) return 'Unhealthy for Sensitive Groups';
    if (aqi <= 200) return 'Unhealthy';
    if (aqi <= 300) return 'Very Unhealthy';
    return 'Hazardous';
  }
  
  function getAqiColor(aqi) {
    if (aqi <= 50) return '#00e400'; // Good - Green
    if (aqi <= 100) return '#ffff00'; // Moderate - Yellow
    if (aqi <= 150) return '#ff7e00'; // Unhealthy for Sensitive Groups - Orange
    if (aqi <= 200) return '#ff0000'; // Unhealthy - Red
    if (aqi <= 300) return '#99004c'; // Very Unhealthy - Purple
    return '#7e0023'; // Hazardous - Maroon
  }

  function loadWeather() {
    if (weatherLocation) {
      fetchWeather(weatherLocation.lat, weatherLocation.lon, weatherLocation.name);
    } else if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        position => {
          const { latitude, longitude } = position.coords;
          weatherLocation = { lat: latitude, lon: longitude, name: "Current Location" };
          localStorage.setItem('weatherLocation', JSON.stringify(weatherLocation));
          fetchWeather(latitude, longitude);
        },
        () => {
          if (weatherInfo) weatherInfo.innerHTML = '<p>Location access denied. Set location manually.</p>';
        }
      );
    } else {
      if (weatherInfo) weatherInfo.innerHTML = '<p>Geolocation not supported. Set location manually.</p>';
    }
  }

  // Initial weather load
  loadWeather();

  // Weather widget controls
  if (weatherRefreshBtn) {
    weatherRefreshBtn.addEventListener('click', () => {
      loadWeather();
      if (window.soundEffects) window.soundEffects.playClick();
    });
  }
  
  if (weatherLocationBtn) {
    weatherLocationBtn.addEventListener('click', () => {
      if (locationModal) {
        locationModal.style.display = 'block';
        if (window.soundEffects) window.soundEffects.playClick();
      }
    });
  }
  
  if (closeLocationBtn) {
    closeLocationBtn.addEventListener('click', () => {
      if (locationModal) {
        locationModal.style.display = 'none';
        if (window.soundEffects) window.soundEffects.playClick();
      }
    });
  }

  // Location Form Handler with Geocoding
  if (locationForm) {
    locationForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const cityName = cityInput.value.trim();
      
      if (cityName) {
        if (!settings.opencageApiKey) {
          alert("OpenCage API Key is missing in settings. Cannot search by city name.");
          return;
        }
        
        const geocodeUrl = `https://api.opencagedata.com/geocode/v1/json?q=${encodeURIComponent(cityName)}&key=${settings.opencageApiKey}&limit=1`;
        
        try {
          const response = await fetch(geocodeUrl);
          const data = await response.json();
          
          if (data.results && data.results.length > 0) {
            const { lat, lng } = data.results[0].geometry;
            const formattedName = data.results[0].formatted;
            
            weatherLocation = { lat, lon: lng, name: formattedName };
            localStorage.setItem('weatherLocation', JSON.stringify(weatherLocation));
            fetchWeather(lat, lng, formattedName);
            
            if (locationModal) locationModal.style.display = 'none';
            cityInput.value = '';
            
            if (window.soundEffects) window.soundEffects.playSuccess();
          } else {
            alert(`Could not find location: ${cityName}`);
          }
        } catch (error) {
          console.error("Geocoding error:", error);
          alert("Error fetching location data.");
        }
      }
    });
  }
  
  if (useCurrentLocationBtn) {
    useCurrentLocationBtn.addEventListener('click', () => {
      weatherLocation = null;
      localStorage.removeItem('weatherLocation');
      loadWeather();
      
      if (locationModal) locationModal.style.display = 'none';
      if (window.soundEffects) window.soundEffects.playClick();
    });
  }

  // Add sound effects to all interactive elements
  document.querySelectorAll('button, input[type="checkbox"], input[type="radio"], .tab, .navigation-dot').forEach(element => {
    if (!element.hasAttribute('data-sound-added')) {
      element.setAttribute('data-sound-added', 'true');
      
      element.addEventListener('click', () => {
        if (window.soundEffects) {
          if (element.classList.contains('tab') || element.classList.contains('navigation-dot')) {
            window.soundEffects.playSwitch();
          } else {
            window.soundEffects.playClick();
          }
        }
      });
      
      element.addEventListener('mouseenter', () => {
        if (window.soundEffects) window.soundEffects.playHover();
      });
    }
  });

}); // End DOMContentLoaded

// Initialize the WebGL background if Three.js is available - fallback for older browsers
window.addEventListener('load', () => {
  if (typeof THREE === 'undefined') {
    console.warn('Three.js not loaded. Using CSS fallback for background.');
    document.body.classList.add('no-webgl');
  }
  
  // Load sound effects
  if (window.soundEffects) {
    console.log('Sound effects initialized');
  }
});
