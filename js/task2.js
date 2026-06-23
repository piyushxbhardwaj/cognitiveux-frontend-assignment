/* ==========================================================================
   TASK 2 CONTROLLER (task2.js)
   Controls: YouTube player wrapper, chapter list syncing, active video carousel,
   and the intelligent heuristic-based automated chapter generator.
   ========================================================================== */

// Videos Database for Task 2 Showcase
const task2Videos = [
  {
    id: "RJTCAL1DRro",
    title: "Next.js 14 Course for Beginners",
    duration: "09:30",
    seconds: 570,
    chapters: [
      { time: 0, timeStr: "00:00", title: "Introduction" },
      { time: 105, timeStr: "01:45", title: "Next.js Overview" },
      { time: 200, timeStr: "03:20", title: "Directives & Routing" },
      { time: 360, timeStr: "06:00", title: "Demonstration" },
      { time: 495, timeStr: "08:15", title: "Outro / Summary" }
    ]
  },
  {
    id: "jj_aUFX8SV8",
    title: "Vite Crash Course - Why and How",
    duration: "09:00",
    seconds: 540,
    chapters: [
      { time: 0, timeStr: "00:00", title: "Intro to Vite" },
      { time: 80, timeStr: "01:20", title: "Why Vite?" },
      { time: 225, timeStr: "03:45", title: "Project Setup" },
      { time: 390, timeStr: "06:30", title: "Running Dev Server" },
      { time: 495, timeStr: "08:15", title: "Summary" }
    ]
  },
  {
    id: "xmmxkmVSiq0",
    title: "Build Vanilla JS App from Scratch",
    duration: "16:00",
    seconds: 960,
    chapters: [
      { time: 0, timeStr: "00:00", title: "Introduction" },
      { time: 135, timeStr: "02:15", title: "Basic Structure" },
      { time: 300, timeStr: "05:00", title: "Dynamic UI" },
      { time: 510, timeStr: "08:30", title: "State Handling" },
      { time: 720, timeStr: "12:00", title: "Advanced Techniques" },
      { time: 900, timeStr: "15:00", title: "Outro" }
    ]
  }
];

let player2 = null; // Task 2 player instance
let player2UpdateInterval = null;
let currentVideoIndex = 0;
let carouselVideos = [...task2Videos]; // allows user to add generated videos

document.addEventListener("DOMContentLoaded", () => {
  initVideoCarousel();
  initChapterGenerator();
});

// Setup global hook for YouTube IFrame API initialization
window.App.initTask2Player = function() {
  player2 = new YT.Player("task2-player", {
    videoId: carouselVideos[0].id,
    playerVars: {
      playsinline: 1,
      rel: 0,
      modestbranding: 1
    },
    events: {
      onStateChange: onPlayer2StateChange,
      onError: onPlayer2Error
    }
  });
};

/* --- Part A: Carousel Logic --- */
function initVideoCarousel() {
  const track = document.getElementById("carousel-track");
  const prevBtn = document.getElementById("carousel-prev");
  const nextBtn = document.getElementById("carousel-next");
  
  if (!track) return;
  
  // Render carousel items
  renderCarouselItems();
  renderChapters(carouselVideos[0].chapters);
  
  let translateX = 0;
  const itemWidth = 256; // 240px width + 16px gap
  
  function updateCarouselButtons() {
    if (!prevBtn || !nextBtn) return;
    const maxScroll = (carouselVideos.length * itemWidth) - track.parentElement.clientWidth;
    prevBtn.disabled = translateX === 0;
    nextBtn.disabled = Math.abs(translateX) >= maxScroll || maxScroll <= 0;
  }
  
  prevBtn?.addEventListener("click", () => {
    translateX = Math.min(0, translateX + itemWidth);
    track.style.transform = `translateX(${translateX}px)`;
    updateCarouselButtons();
  });
  
  nextBtn?.addEventListener("click", () => {
    const maxScroll = -((carouselVideos.length * itemWidth) - track.parentElement.clientWidth);
    translateX = Math.max(maxScroll, translateX - itemWidth);
    track.style.transform = `translateX(${translateX}px)`;
    updateCarouselButtons();
  });
  
  // Recalculate layout on window resize
  window.addEventListener("resize", () => {
    updateCarouselButtons();
  });
  
  setTimeout(updateCarouselButtons, 500); // Wait for sizes to settle
}

function renderCarouselItems() {
  const track = document.getElementById("carousel-track");
  if (!track) return;
  
  track.innerHTML = "";
  
  carouselVideos.forEach((video, index) => {
    const item = document.createElement("div");
    item.className = `video-thumbnail-item ${index === currentVideoIndex ? "active" : ""}`;
    item.dataset.index = index;
    item.setAttribute("role", "button");
    item.setAttribute("tabindex", "0");
    item.setAttribute("aria-label", `Load video: ${video.title}`);
    
    item.innerHTML = `
      <div class="thumb-image-wrapper">
        <img src="https://img.youtube.com/vi/${video.id}/mqdefault.jpg" alt="${video.title} thumbnail" loading="lazy">
      </div>
      <div class="thumb-title">${video.title}</div>
      <div class="thumb-duration">⏱️ ${video.duration}</div>
    `;
    
    const selectVideo = () => {
      if (currentVideoIndex === index) return;
      currentVideoIndex = index;
      
      // Update active states in UI
      document.querySelectorAll(".video-thumbnail-item").forEach(el => el.classList.remove("active"));
      item.classList.add("active");
      
      // Load selected video
      if (player2 && typeof player2.loadVideoById === "function") {
        player2.loadVideoById(video.id);
      }
      
      renderChapters(video.chapters);
    };
    
    item.addEventListener("click", selectVideo);
    item.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        selectVideo();
      }
    });
    
    track.appendChild(item);
  });
}

/* --- Chapters Sync & Interaction --- */
function renderChapters(chapters) {
  const chaptersList = document.getElementById("chapters-list");
  if (!chaptersList) return;
  
  chaptersList.innerHTML = "";
  
  if (!chapters || chapters.length === 0) {
    chaptersList.innerHTML = `
      <div class="chapters-empty-state">
        <svg viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 16h-2v-2h2v2zm0-4h-2V7h2v7z"/></svg>
        <p>No chapters available for this video.</p>
      </div>
    `;
    return;
  }
  
  chapters.forEach((chapter, index) => {
    const item = document.createElement("li");
    item.className = "chapter-item";
    item.dataset.time = chapter.time;
    item.setAttribute("role", "button");
    item.setAttribute("tabindex", "0");
    
    item.innerHTML = `
      <span class="chapter-time">${chapter.timeStr}</span>
      <span class="chapter-title">${chapter.title}</span>
    `;
    
    const seekVideo = () => {
      if (player2 && typeof player2.seekTo === "function") {
        player2.seekTo(chapter.time, true);
        
        // If player is cued/paused, play it immediately on seeking
        if (player2.getPlayerState() !== YT.PlayerState.PLAYING) {
          player2.playVideo();
        }
        
        window.App.showToast(`Seeking to ${chapter.timeStr}: ${chapter.title}`, "info", 1500);
      }
    };
    
    item.addEventListener("click", seekVideo);
    item.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        seekVideo();
      }
    });
    
    chaptersList.appendChild(item);
  });
}

function onPlayer2StateChange(event) {
  if (event.data === YT.PlayerState.PLAYING) {
    // Start tracking active chapter
    if (player2UpdateInterval) clearInterval(player2UpdateInterval);
    player2UpdateInterval = setInterval(syncChaptersWithPlayback, 400);
  } else {
    // Stop tracking when paused or buffering
    if (player2UpdateInterval) {
      clearInterval(player2UpdateInterval);
      player2UpdateInterval = null;
    }
  }
}

function onPlayer2Error(event) {
  console.error("Player 2 encountered an error:", event.data);
  window.App.showToast("Could not load the selected video. Please check your network.", "error", 4000);
}

function syncChaptersWithPlayback() {
  if (!player2 || typeof player2.getCurrentTime !== "function") return;
  
  const currentTime = player2.getCurrentTime();
  const chapters = carouselVideos[currentVideoIndex].chapters;
  
  let activeChapterIndex = 0;
  for (let i = chapters.length - 1; i >= 0; i--) {
    if (currentTime >= chapters[i].time) {
      activeChapterIndex = i;
      break;
    }
  }
  
  const items = document.querySelectorAll(".chapter-item");
  items.forEach((item, index) => {
    if (index === activeChapterIndex) {
      if (!item.classList.contains("active")) {
        item.classList.add("active");
        // Scroll active item smoothly into view if needed
        item.scrollIntoView({ behavior: "smooth", block: "nearest" });
      }
    } else {
      item.classList.remove("active");
    }
  });
}

/* --- Part B: Smart Chapter Generator --- */
function initChapterGenerator() {
  const form = document.getElementById("generator-form");
  const input = document.getElementById("youtube-url-input");
  const errorMsg = document.getElementById("url-error-msg");
  const generateBtn = document.getElementById("generate-btn");
  
  if (!form || !input) return;
  
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    
    const url = input.value.trim();
    if (!url) return;
    
    // Reset errors
    errorMsg.style.display = "none";
    input.classList.remove("input-error");
    
    // Regex to extract video ID from various YouTube URL formats
    const videoIdRegex = /^.*(?:(?:youtu\.be\/|v\/|vi\/|u\/\w\/|embed\/|shorts\/)|(?:(?:watch)?\?v(?:i)?=|\&v(?:i)?=))([^#\&\?]*).*/;
    const match = url.match(videoIdRegex);
    const videoId = (match && match[1] && match[1].length === 11) ? match[1] : null;
    
    if (!videoId) {
      errorMsg.textContent = "Please enter a valid YouTube video URL.";
      errorMsg.style.display = "block";
      input.classList.add("input-error");
      window.App.showToast("Invalid YouTube URL format", "error", 2500);
      return;
    }
    
    // Lock submit button
    generateBtn.classList.add("generating");
    generateBtn.disabled = true;
    input.disabled = true;
    
    window.App.showToast("Analyzing video metadata and length...", "info", 1500);
    
    // Load the video into player2 to fetch its real duration and title!
    if (player2 && typeof player2.loadVideoById === "function") {
      player2.cueVideoById(videoId);
      
      // Poll player for duration (wait up to 3 seconds)
      let attempts = 0;
      const pollDurationInterval = setInterval(() => {
        attempts++;
        const duration = player2.getDuration();
        
        // If duration is loaded (greater than 0) or we timed out
        if (duration > 0 || attempts > 10) {
          clearInterval(pollDurationInterval);
          
          const finalDuration = duration > 0 ? duration : 600; // Fallback to 10 minutes if failed
          
          // Try to get video title from current player info
          let title = "Custom Chapter Video";
          if (player2.getVideoData && player2.getVideoData().title) {
            title = player2.getVideoData().title;
          }
          
          generateHeuristicsChapters(videoId, title, finalDuration);
          
          // Reset button state
          setTimeout(() => {
            generateBtn.classList.remove("generating");
            generateBtn.disabled = false;
            input.disabled = false;
            input.value = "";
          }, 1000);
        }
      }, 300);
    } else {
      // Fallback if player API is not initialized yet
      setTimeout(() => {
        generateHeuristicsChapters(videoId, "Custom Generated Video", 600);
        generateBtn.classList.remove("generating");
        generateBtn.disabled = false;
        input.disabled = false;
        input.value = "";
      }, 1500);
    }
  });
}

function generateHeuristicsChapters(videoId, title, durationSec) {
  // Format total duration into mm:ss or hh:mm:ss string
  const formatTime = (totalSeconds) => {
    const hrs = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = Math.floor(totalSeconds % 60);
    
    const formattedMins = mins.toString().padStart(2, "0");
    const formattedSecs = secs.toString().padStart(2, "0");
    
    if (hrs > 0) {
      return `${hrs.toString().padStart(2, "0")}:${formattedMins}:${formattedSecs}`;
    }
    return `${formattedMins}:${formattedSecs}`;
  };
  
  // Decide how many chapters to generate based on duration ranges
  let numChapters = 4;
  if (durationSec < 180) {
    numChapters = 3;
  } else if (durationSec >= 180 && durationSec < 600) {
    numChapters = 4;
  } else if (durationSec >= 600 && durationSec < 1200) {
    numChapters = 5;
  } else {
    numChapters = 6;
  }
  
  // Custom templates of names depending on titles keywords (smart heuristics)
  const lowerTitle = title.toLowerCase();
  let titleTemplate = [
    "Introduction & Hook",
    "Key Concepts & Overview",
    "Detailed Discussion",
    "Main Example / Case Study",
    "Common Mistakes & Tips",
    "Summary & Action Items"
  ];
  
  if (lowerTitle.includes("review") || lowerTitle.includes("unbox") || lowerTitle.includes("comparison") || lowerTitle.includes("versus") || lowerTitle.includes("vs")) {
    titleTemplate = [
      "Introduction & Unboxing",
      "Design & Build Quality",
      "Key Features & Interface",
      "Real-world Performance Test",
      "Pros & Cons Comparison",
      "Final Verdict & Purchase Link"
    ];
  } else if (lowerTitle.includes("tutorial") || lowerTitle.includes("course") || lowerTitle.includes("build") || lowerTitle.includes("how to") || lowerTitle.includes("code") || lowerTitle.includes("programming")) {
    titleTemplate = [
      "Introduction & Prerequisites",
      "Project Architecture & Setup",
      "Core Features Coding",
      "Practical Demonstration",
      "Advanced Implementation Tricks",
      "Deployment & Next Steps"
    ];
  }
  
  const generatedChapters = [];
  const division = durationSec / numChapters;
  
  for (let i = 0; i < numChapters; i++) {
    let timestamp = 0;
    
    if (i > 0) {
      // Calculate division time and round to the nearest 15 or 30 seconds for a cleaner look
      const rawTime = division * i;
      const roundInterval = durationSec > 600 ? 30 : 15;
      timestamp = Math.round(rawTime / roundInterval) * roundInterval;
      
      // Safety checks: timestamp should be between previous and end
      const prevTime = generatedChapters[i - 1].time;
      if (timestamp <= prevTime) {
        timestamp = prevTime + 30; // space out
      }
      if (timestamp >= durationSec - 15) {
        timestamp = Math.floor(durationSec - 30);
      }
    }
    
    generatedChapters.push({
      time: timestamp,
      timeStr: formatTime(timestamp),
      title: titleTemplate[i] || `Chapter ${i + 1}`
    });
  }
  
  // Construct new video object
  const newVideo = {
    id: videoId,
    title: title.length > 50 ? title.substring(0, 48) + "..." : title,
    duration: formatTime(durationSec),
    seconds: durationSec,
    chapters: generatedChapters
  };
  
  // Add to our list, make it active, and re-render
  carouselVideos.push(newVideo);
  currentVideoIndex = carouselVideos.length - 1;
  
  renderCarouselItems();
  
  // Trigger loading
  if (player2 && typeof player2.loadVideoById === "function") {
    player2.loadVideoById(videoId);
  }
  
  renderChapters(newVideo.chapters);
  
  // Center slide active item in carousel scroll track
  const track = document.getElementById("carousel-track");
  const activeItem = track.querySelector(`.video-thumbnail-item[data-index="${currentVideoIndex}"]`);
  if (activeItem && track) {
    const parentWidth = track.parentElement.clientWidth;
    const itemOffset = activeItem.offsetLeft;
    const targetScroll = -(itemOffset - (parentWidth / 2) + 128); // centering offset
    const maxScroll = -(track.scrollWidth - parentWidth);
    const scrollVal = Math.max(maxScroll, Math.min(0, targetScroll));
    track.style.transform = `translateX(${scrollVal}px)`;
  }
  
  window.App.showToast("Successfully generated smart chapters!", "success", 3000);
}
