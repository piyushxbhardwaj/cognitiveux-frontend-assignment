/* ==========================================================================
   GLOBAL APP CONTROLLER (main.js)
   Controls: Navigation routing, Sticky header, Dark Mode state management,
   Scroll-reveal Intersection Observer, and Global Toast System.
   ========================================================================== */

// Create a global App namespace for utilities accessible by other components
window.App = window.App || {};

document.addEventListener("DOMContentLoaded", () => {
  // Initialize Core Systems
  initTheme();
  initNavigation();
  initScrollReveal();
  initToastSystem();
});

/* --- Theme Management --- */
function initTheme() {
  const themeToggleBtn = document.getElementById("theme-toggle");
  
  // Check cached preference or system settings
  const cachedTheme = localStorage.getItem("theme");
  const systemPrefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  
  const currentTheme = cachedTheme || (systemPrefersDark ? "dark" : "light");
  
  // Set initial theme
  document.documentElement.setAttribute("data-theme", currentTheme);
  updateThemeIcon(currentTheme);
  
  // Bind click event
  themeToggleBtn?.addEventListener("click", () => {
    const activeTheme = document.documentElement.getAttribute("data-theme");
    const newTheme = activeTheme === "dark" ? "light" : "dark";
    
    document.documentElement.setAttribute("data-theme", newTheme);
    localStorage.setItem("theme", newTheme);
    updateThemeIcon(newTheme);
    
    // Broadcast theme change for iframe components if needed
    window.dispatchEvent(new CustomEvent("themechange", { detail: { theme: newTheme } }));
    window.App.showToast(`Switched to ${newTheme} mode`, "info", 1500);
  });
}

function updateThemeIcon(theme) {
  const toggleBtn = document.getElementById("theme-toggle");
  if (!toggleBtn) return;
  
  // SVGs for sun/moon icons
  const sunIcon = `<svg viewBox="0 0 24 24"><path d="M12 7c-2.76 0-5 2.24-5 5s2.24 5 5 5 5-2.24 5-5-2.24-5-5-5zM2 13h2c.55 0 1-.45 1-1s-.45-1-1-1H2c-.55 0-1 .45-1 1s.45 1 1 1zm18 0h2c.55 0 1-.45 1-1s-.45-1-1-1h-2c-.55 0-1 .45-1 1s.45 1 1 1zM11 2v2c0 .55.45 1 1 1s1-.45 1-1V2c0-.55-.45-1-1-1s-1 .45-1 1zm0 18v2c0 .55.45 1 1 1s1-.45 1-1v-2c0-.55-.45-1-1-1s-1 .45-1 1zM5.99 4.58c-.39-.39-1.03-.39-1.41 0s-.39 1.03 0 1.41l1.06 1.06c.39.39 1.03.39 1.41 0s.39-1.03 0-1.41L5.99 4.58zm12.37 12.37c-.39-.39-1.03-.39-1.41 0s-.39 1.03 0 1.41l1.06 1.06c.39.39 1.03.39 1.41 0s.39-1.03 0-1.41l-1.06-1.06zm1.06-12.37c-.39-.39-1.02-.39-1.41 0l-1.06 1.06c-.39.39-.39 1.03 0 1.41s1.03.39 1.41 0l1.06-1.06c.38-.38.38-1.02 0-1.41zm-12.37 12.37c-.39-.39-1.03-.39-1.41 0l-1.06 1.06c-.39.39-.39 1.03 0 1.41s1.03.39 1.41 0l1.06-1.06c.39-.38.39-1.03 0-1.41z"/></svg>`;
  const moonIcon = `<svg viewBox="0 0 24 24"><path d="M12.3 22c5.07 0 9.18-4.1 9.18-9.18 0-2.62-1.1-4.99-2.88-6.68-.48-.46-1.25-.19-1.34.46-.74 5.14-5.18 9.1-10.53 9.1-.64 0-1.27-.06-1.88-.17-.68-.12-1.15.57-.7 1.1 2.2 2.61 5.53 4.37 9.25 4.37z"/></svg>`;
  
  toggleBtn.innerHTML = theme === "dark" ? sunIcon : moonIcon;
  toggleBtn.setAttribute("aria-label", theme === "dark" ? "Switch to light theme" : "Switch to dark theme");
}

/* --- Navigation & Router --- */
function initNavigation() {
  const header = document.querySelector(".header-nav");
  const mobileToggle = document.getElementById("mobile-menu-toggle");
  const navLinksList = document.querySelector(".nav-links");
  const navLinks = document.querySelectorAll(".nav-link");
  const sections = document.querySelectorAll("section, header.hero-section");
  
  // Throttled sticky header and nav highlighting on scroll
  window.addEventListener("scroll", throttle(() => {
    if (window.scrollY > 30) {
      header?.classList.add("header-scrolled");
    } else {
      header?.classList.remove("header-scrolled");
    }
    
    // Highlight Nav link on scroll
    let currentActive = "";
    sections.forEach((sec) => {
      const secTop = sec.offsetTop - 120;
      if (window.scrollY >= secTop) {
        currentActive = sec.getAttribute("id") || "";
      }
    });
    
    navLinks.forEach((link) => {
      link.classList.remove("active");
      if (link.getAttribute("href") === `#${currentActive}`) {
        link.classList.add("active");
      }
    });
  }, 60));
  
  // Mobile Nav menu toggling
  mobileToggle?.addEventListener("click", () => {
    navLinksList?.classList.toggle("mobile-active");
    const isExpanded = navLinksList?.classList.contains("mobile-active");
    mobileToggle.setAttribute("aria-expanded", isExpanded ? "true" : "false");
  });
  
  // Close mobile nav menu on clicking nav link
  navLinks.forEach(link => {
    link.addEventListener("click", () => {
      navLinksList?.classList.remove("mobile-active");
      mobileToggle?.setAttribute("aria-expanded", "false");
    });
  });
}

/* --- Scroll Reveal animations --- */
function initScrollReveal() {
  // Support prefers-reduced-motion
  const userPrefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (userPrefersReducedMotion) {
    document.querySelectorAll(".scroll-reveal").forEach(el => {
      el.classList.add("reveal-active");
    });
    return;
  }
  
  const observerOptions = {
    root: null,
    rootMargin: "0px",
    threshold: 0.15
  };
  
  const observer = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add("reveal-active");
        observer.unobserve(entry.target); // Trigger only once
      }
    });
  }, observerOptions);
  
  document.querySelectorAll(".scroll-reveal").forEach(el => {
    observer.observe(el);
  });
}

/* --- Toast Notification System --- */
function initToastSystem() {
  // Check if target container exists, if not create one
  let container = document.getElementById("toast-container");
  if (!container) {
    container = document.createElement("div");
    container.id = "toast-container";
    container.setAttribute("aria-live", "polite");
    document.body.appendChild(container);
  }
  
  // Export global function
  window.App.showToast = function(message, type = "info", duration = 3000) {
    const toast = document.createElement("div");
    toast.className = `toast toast-${type}`;
    
    // Icon selections based on toast type
    let icon = "🔔";
    if (type === "success") icon = "✅";
    if (type === "error") icon = "❌";
    if (type === "info") icon = "ℹ️";
    
    toast.innerHTML = `
      <span style="margin-right: 8px;">${icon}</span>
      <span class="toast-message">${message}</span>
      <button class="toast-close" aria-label="Dismiss Notification">&times;</button>
    `;
    
    container.appendChild(toast);
    
    // Close button event
    const closeBtn = toast.querySelector(".toast-close");
    closeBtn?.addEventListener("click", () => dismissToast(toast));
    
    // Auto timeout dismiss
    const timeoutId = setTimeout(() => {
      dismissToast(toast);
    }, duration);
    
    // Store timer on element to clean up
    toast.dataset.timeoutId = timeoutId;
  };
}

function dismissToast(toast) {
  if (toast.classList.contains("toast-fade-out")) return;
  
  // Clear timeout if dismissed manually
  if (toast.dataset.timeoutId) {
    clearTimeout(parseInt(toast.dataset.timeoutId, 10));
  }
  
  toast.classList.add("toast-fade-out");
  toast.addEventListener("animationend", () => {
    toast.remove();
  });
}

/**
 * Throttle utility to limit function executions during high-frequency events (scroll/resize).
 */
function throttle(fn, wait) {
  let time = Date.now();
  return function() {
    if ((time + wait - Date.now()) < 0) {
      fn();
      time = Date.now();
    }
  };
}
