/* ==========================================================================
   TASK 3 CONTROLLER (task3.js)
   Controls: Watch time playback tracking, lead capture modal triggers, 
   form validation, storage logs, and WCAG keyboard focus trapping.
   ========================================================================== */

let player3 = null; // Task 3 player instance
let cumulativeWatchTime = 0;
let watchTimeInterval = null;
let lastCheckTime = null;
let modalOpen = false;
let modalKeyDownHandler = null; // Reference to listener for cleanups

document.addEventListener("DOMContentLoaded", () => {
  initLeadCaptureModal();
});

// Setup global hook for YouTube IFrame API initialization
window.App.initTask3Player = function() {
  player3 = new YT.Player("task3-player", {
    videoId: "RJTCAL1DRro", // Dedicated video for Lead Capture
    playerVars: {
      playsinline: 1,
      rel: 0,
      modestbranding: 1
    },
    events: {
      onStateChange: onPlayer3StateChange
    }
  });
};

function onPlayer3StateChange(event) {
  // If already submitted or deferred in this session, don't track
  if (isLeadSubmitted() || isLeadDeferred()) return;
  
  if (event.data === YT.PlayerState.PLAYING) {
    // Start tracking playback timer
    lastCheckTime = Date.now();
    if (watchTimeInterval) clearInterval(watchTimeInterval);
    watchTimeInterval = setInterval(trackWatchTime, 100);
  } else {
    // Pause tracking when video pauses/stops/buffers
    if (watchTimeInterval) {
      clearInterval(watchTimeInterval);
      watchTimeInterval = null;
    }
  }
}

function trackWatchTime() {
  if (!player3 || typeof player3.getPlayerState !== "function") return;
  
  // Verify video is indeed playing to prevent background increments
  if (player3.getPlayerState() === YT.PlayerState.PLAYING) {
    const now = Date.now();
    if (lastCheckTime) {
      cumulativeWatchTime += (now - lastCheckTime);
    }
    lastCheckTime = now;
    
    // Check if watch time exceeds 6.0 seconds (6000ms)
    if (cumulativeWatchTime >= 6000) {
      clearInterval(watchTimeInterval);
      watchTimeInterval = null;
      triggerLeadForm();
    }
  } else {
    lastCheckTime = null;
  }
}

/* --- Storage Checking Utilities --- */
function isLeadSubmitted() {
  return localStorage.getItem("lead_form_submitted") === "true";
}

function isLeadDeferred() {
  return sessionStorage.getItem("lead_form_deferred") === "true";
}

/* --- Trigger & Manage Modal Dialog --- */
function triggerLeadForm() {
  // Pause the video immediately so the user doesn't miss content
  if (player3 && typeof player3.pauseVideo === "function") {
    player3.pauseVideo();
  }
  
  const modal = document.getElementById("lead-capture-modal");
  if (!modal) return;
  
  modal.classList.add("active");
  modalOpen = true;
  
  // Setup keyboard focus trap
  setupFocusTrap(modal);
  
  // Auto-focus first input field
  const nameInput = document.getElementById("lead-name");
  setTimeout(() => {
    nameInput?.focus();
  }, 100);
}

function closeLeadForm(deferred = false) {
  const modal = document.getElementById("lead-capture-modal");
  if (!modal) return;
  
  modal.classList.remove("active");
  modalOpen = false;
  
  // Remove focus trapping listener to prevent duplicate handlers
  if (modalKeyDownHandler) {
    modal.removeEventListener("keydown", modalKeyDownHandler);
    modalKeyDownHandler = null;
  }
  
  if (deferred) {
    sessionStorage.setItem("lead_form_deferred", "true");
    window.App.showToast("We'll remind you later! Enjoy the video.", "info", 3000);
  }
  
  // Focus back on player container for keyboard users
  const playerWrapper = document.querySelector(".task3-player-wrapper");
  playerWrapper?.setAttribute("tabindex", "-1");
  playerWrapper?.focus();
}

/* --- WCAG Focus Trapping Logic --- */
function setupFocusTrap(modal) {
  const focusableSelectors = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';
  const focusableElements = modal.querySelectorAll(focusableSelectors);
  const firstFocusableElement = focusableElements[0];
  const lastFocusableElement = focusableElements[focusableElements.length - 1];
  
  // Clean up any previous listener to prevent duplicates
  if (modalKeyDownHandler) {
    modal.removeEventListener("keydown", modalKeyDownHandler);
  }
  
  // Setup named keydown handler
  modalKeyDownHandler = function(e) {
    if (e.key === "Tab") {
      if (e.shiftKey) { // Shift + Tab (navigating backwards)
        if (document.activeElement === firstFocusableElement) {
          lastFocusableElement.focus();
          e.preventDefault();
        }
      } else { // Tab (navigating forwards)
        if (document.activeElement === lastFocusableElement) {
          firstFocusableElement.focus();
          e.preventDefault();
        }
      }
    }
  };
  
  // Trap key press listener
  modal.addEventListener("keydown", modalKeyDownHandler);
}

// Global Key Listeners for ESC key
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && modalOpen) {
    closeLeadForm(true); // Treat ESC as 'remind me later' deferral
  }
});

/* --- Form Validation and Save --- */
function initLeadCaptureModal() {
  const form = document.getElementById("lead-form");
  const closeBtn = document.getElementById("modal-close");
  const remindBtn = document.getElementById("modal-remind-later");
  
  if (!form) return;
  
  // Close actions
  closeBtn?.addEventListener("click", () => closeLeadForm(true));
  remindBtn?.addEventListener("click", () => closeLeadForm(true));
  
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    
    // Clear previous errors
    clearFormErrors();
    
    // Retrieve values
    const nameVal = document.getElementById("lead-name").value.trim();
    const emailVal = document.getElementById("lead-email").value.trim();
    const phoneVal = document.getElementById("lead-phone").value.trim();
    const companyVal = document.getElementById("lead-company").value.trim();
    
    // Validations
    let isValid = true;
    
    // Name validation: Letters and spaces, min 2 chars
    if (!nameVal || !/^[a-zA-Z\s]{2,50}$/.test(nameVal)) {
      showError("lead-name", "Please enter a valid name (at least 2 letters, no numbers).");
      isValid = false;
    }
    
    // Email validation: Standard email structure
    if (!emailVal || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailVal)) {
      showError("lead-email", "Please enter a valid email address.");
      isValid = false;
    }
    
    // Phone validation: Digits, spaces, hyphens, min 10 digits
    if (!phoneVal || !/^[0-9\-\+\s\(\)]{10,15}$/.test(phoneVal)) {
      showError("lead-phone", "Please enter a valid phone number (at least 10 digits).");
      isValid = false;
    }
    
    // Company validation: required, min 2 characters
    if (!companyVal || companyVal.length < 2) {
      showError("lead-company", "Please enter a company name (at least 2 characters).");
      isValid = false;
    }
    
    if (!isValid) return;
    
    // Save lead details
    const leadRecord = {
      name: nameVal,
      email: emailVal,
      phone: phoneVal,
      company: companyVal,
      timestamp: new Date().toISOString()
    };
    
    // Load list, append, save
    const leadsList = JSON.parse(localStorage.getItem("leads_list") || "[]");
    leadsList.push(leadRecord);
    localStorage.setItem("leads_list", JSON.stringify(leadsList));
    
    // Set cookie/localStorage submitted flag
    localStorage.setItem("lead_form_submitted", "true");
    
    // Close modal
    closeLeadForm(false);
    
    // Alert success toast
    window.App.showToast("Thank you! Lead info saved successfully.", "success", 4000);
    
    // Reset form
    form.reset();
  });
}

function showError(inputId, message) {
  const inputEl = document.getElementById(inputId);
  if (!inputEl) return;
  
  inputEl.classList.add("input-error");
  
  // Find sibling error message tag
  const group = inputEl.closest(".form-group");
  const errorEl = group?.querySelector(".input-error-msg");
  if (errorEl) {
    errorEl.textContent = message;
    errorEl.style.display = "block";
  }
}

function clearFormErrors() {
  document.querySelectorAll(".lead-form .input-field").forEach(el => {
    el.classList.remove("input-error");
  });
  document.querySelectorAll(".lead-form .input-error-msg").forEach(el => {
    el.style.display = "none";
  });
}
