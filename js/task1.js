/* ==========================================================================
   TASK 1 CONTROLLER (task1.js)
   Vanilla JS implementation of the 3D Coverflow Slider.
   Features: Drag & swipe gestures, dynamically calculated 3D transforms, 
   bullet pagination, and custom button events.
   ========================================================================== */

document.addEventListener("DOMContentLoaded", () => {
  initExclusiveSlider();
});

function initExclusiveSlider() {
  const container = document.querySelector(".exclusive .swiper-container");
  const wrapper = document.querySelector(".exclusive .swiper-wrapper");
  const slides = document.querySelectorAll(".exclusive .swiper-slide");
  const prevBtn = document.querySelector(".exclusive .swiper-button-prev");
  const nextBtn = document.querySelector(".exclusive .swiper-button-next");
  const paginationContainer = document.querySelector(".exclusive .swiper-pagination");
  
  if (!wrapper || slides.length === 0) return;
  
  let activeIndex = 0;
  const totalSlides = slides.length;
  
  // Drag & Swipe State Variables
  let isDragging = false;
  let startX = 0;
  let currentTranslate = 0;
  let prevTranslate = 0;
  let dragOffset = 0;
  
  // Setup pagination dots dynamically if container exists
  if (paginationContainer) {
    paginationContainer.innerHTML = "";
    for (let i = 0; i < totalSlides; i++) {
      const bullet = document.createElement("span");
      bullet.className = `swiper-pagination-bullet ${i === activeIndex ? 'swiper-pagination-bullet-active' : ''}`;
      bullet.setAttribute("role", "button");
      bullet.setAttribute("aria-label", `Go to slide ${i + 1}`);
      bullet.setAttribute("tabindex", "0");
      bullet.dataset.index = i;
      
      bullet.addEventListener("click", () => {
        goToSlide(i);
      });
      
      // Keyboard enter/space triggers
      bullet.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          goToSlide(i);
        }
      });
      
      paginationContainer.appendChild(bullet);
    }
  }
  
  // Update slide transforms
  function updateSlider() {
    const isMobile = window.innerWidth <= 768;
    
    // Exact translation ratios from ICICI DevTools measurements
    const transformXMultiplier = isMobile ? 80 : 94.7059;
    const transformZMultiplier = isMobile ? 180 : 236.765;
    const rotateYMultiplier = isMobile ? 22 : 29.5956;
    
    slides.forEach((slide, index) => {
      const offset = index - activeIndex;
      const absOffset = Math.abs(offset);
      
      // Reset classes
      slide.className = "swiper-slide";
      
      if (offset === 0) {
        slide.classList.add("swiper-slide-active", "swiper-slide-visible");
        slide.style.transform = `translate3d(0px, 0px, 0px) rotateX(0deg) rotateY(0deg) scale(1)`;
        slide.style.zIndex = 10;
        slide.style.opacity = "1";
        slide.setAttribute("aria-hidden", "false");
      } else {
        if (offset === 1) {
          slide.classList.add("swiper-slide-next", "swiper-slide-visible");
        } else if (offset === -1) {
          slide.classList.add("swiper-slide-prev", "swiper-slide-visible");
        }
        
        // Apply 3D matrix offsets
        const tx = -transformXMultiplier * offset;
        const tz = -transformZMultiplier * absOffset;
        const ry = rotateYMultiplier * offset;
        
        slide.style.transform = `translate3d(${tx}px, 0px, ${tz}px) rotateX(0deg) rotateY(${ry}deg) scale(1)`;
        slide.style.zIndex = 10 - absOffset;
        slide.style.opacity = "0.6";
        slide.setAttribute("aria-hidden", "true");
      }
      
      // Toggle custom visibility classes
      if (absOffset <= 1) {
        slide.classList.add("swiper-slide-visible");
      }
    });
    
    // Update pagination bullets
    if (paginationContainer) {
      const bullets = paginationContainer.querySelectorAll(".swiper-pagination-bullet");
      bullets.forEach((bullet, index) => {
        if (index === activeIndex) {
          bullet.classList.add("swiper-pagination-bullet-active");
          bullet.setAttribute("aria-current", "true");
        } else {
          bullet.classList.remove("swiper-pagination-bullet-active");
          bullet.removeAttribute("aria-current");
        }
      });
    }
    
    // Update button disability
    if (prevBtn) {
      prevBtn.style.opacity = activeIndex === 0 ? "0.3" : "1";
      prevBtn.style.pointerEvents = activeIndex === 0 ? "none" : "auto";
      prevBtn.setAttribute("aria-disabled", activeIndex === 0 ? "true" : "false");
    }
    if (nextBtn) {
      nextBtn.style.opacity = activeIndex === totalSlides - 1 ? "0.3" : "1";
      nextBtn.style.pointerEvents = activeIndex === totalSlides - 1 ? "none" : "auto";
      nextBtn.setAttribute("aria-disabled", activeIndex === totalSlides - 1 ? "true" : "false");
    }
  }
  
  function goToSlide(index) {
    if (index < 0 || index >= totalSlides) return;
    activeIndex = index;
    updateSlider();
  }
  
  function nextSlide() {
    if (activeIndex < totalSlides - 1) {
      activeIndex++;
      updateSlider();
    }
  }
  
  function prevSlide() {
    if (activeIndex > 0) {
      activeIndex--;
      updateSlider();
    }
  }
  
  // Navigation Button Handlers
  prevBtn?.addEventListener("click", prevSlide);
  nextBtn?.addEventListener("click", nextSlide);
  
  // Keyboard slider controls
  container?.addEventListener("keydown", (e) => {
    if (e.key === "ArrowLeft") {
      prevSlide();
    } else if (e.key === "ArrowRight") {
      nextSlide();
    }
  });
  
  /* --- Swipe/Drag Event Listeners --- */
  
  // Touch events for mobile
  wrapper?.addEventListener("touchstart", touchStart, { passive: true });
  wrapper?.addEventListener("touchmove", touchMove, { passive: true });
  wrapper?.addEventListener("touchend", touchEnd);
  
  // Mouse events for desktop dragging
  wrapper?.addEventListener("mousedown", dragStart);
  wrapper?.addEventListener("mousemove", dragMove);
  wrapper?.addEventListener("mouseup", dragEnd);
  wrapper?.addEventListener("mouseleave", dragEnd);
  
  function getPositionX(e) {
    return e.type.includes("mouse") ? e.pageX : e.touches[0].clientX;
  }
  
  function touchStart(e) {
    startX = getPositionX(e);
    isDragging = true;
  }
  
  function touchMove(e) {
    if (!isDragging) return;
    const currentX = getPositionX(e);
    dragOffset = currentX - startX;
  }
  
  function touchEnd() {
    if (!isDragging) return;
    isDragging = false;
    handleDragAction();
  }
  
  function dragStart(e) {
    // Only drag with left click
    if (e.button !== 0) return;
    startX = getPositionX(e);
    isDragging = true;
    wrapper.style.cursor = "grabbing";
  }
  
  function dragMove(e) {
    if (!isDragging) return;
    const currentX = getPositionX(e);
    dragOffset = currentX - startX;
  }
  
  function dragEnd() {
    if (!isDragging) return;
    isDragging = false;
    wrapper.style.cursor = "grab";
    handleDragAction();
  }
  
  function handleDragAction() {
    const threshold = 50; // swipe threshold in pixels
    if (dragOffset < -threshold) {
      nextSlide();
    } else if (dragOffset > threshold) {
      prevSlide();
    }
    dragOffset = 0; // reset offset
  }
  
  // Handle resize events to recalculate layout
  let resizeTimeout;
  window.addEventListener("resize", () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
      updateSlider();
    }, 150); // Debounced resize handler
  });
  
  // Initial run
  updateSlider();
}
