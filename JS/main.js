/**
 * main.js
 * 
 * This script handles various UI interactions and animations for the SLSU CHERM website.
 * 
 * Features:
 * - Smooth scroll to "What is CHERM" section when About Us is clicked.
 * - Handles redirection to Objectives page.
 * - Restores scroll position to "What is CHERM" if set in sessionStorage.
 * - Responsive behavior for Bootstrap modal navigation on window resize.
 * - Animated intro title using anime.js.
 * - Shows/hides the custom About Us dropdown menu on hover.
 * 
 * Dependencies:
 * - Bootstrap 5 (for modal)
 * - anime.js (for text animation)
 * 
 * Author: SLSU CHERM Web Team
 * Last updated: 2025-06-30
 */

/* jshint esversion: 6, browser: true */
(function () {
    'use strict';

    /**
     * Smooth scroll to "What is CHERM" section when About Us is clicked in navbar.
     */
    document.getElementById('navbarDropdown').addEventListener('click', function (event) {
      if (window.location.hash !== '#what-is-cherm') {
        event.preventDefault();
        document.querySelector('#what-is-cherm').scrollIntoView({ behavior: 'smooth' });
      }
    });

    /**
     * Redirects to objectives.html (currently unused).
     */
    function gotoObjectives() {
      window.location.href = "objectives.html";
    }

    /**
     * On DOMContentLoaded, scroll to "What is CHERM" if sessionStorage flag is set.
     */
    document.addEventListener("DOMContentLoaded", function () {
      if (sessionStorage.getItem("scrollToWhatIsCherm") === "true") {
        sessionStorage.removeItem("scrollToWhatIsCherm");

        let target = document.getElementById("what-is-cherm");
        if (target) {
          setTimeout(() => {
            target.scrollIntoView({
              behavior: "smooth",
              block: "start"
            });
          }, 500);
        }
      }
    });

    /**
     * Handles closing the Bootstrap modal if window is resized to desktop width.
     */
    function handleResize() {
      const navModal = document.getElementById('navModal');
      if (window.innerWidth >= 992 && navModal.classList.contains('show')) {
        const modalInstance = bootstrap.Modal.getInstance(navModal);
        if (modalInstance) {
          modalInstance.hide();
        }

        const backdrop = document.querySelector('.modal-backdrop');
        if (backdrop) {
          backdrop.remove();
        }

        document.body.classList.remove('modal-open');
        document.body.style.paddingRight = '';
      }
    }

    window.addEventListener('resize', handleResize);
    document.addEventListener('DOMContentLoaded', handleResize);

    /**
     * Animates the intro title text using anime.js.
     */
    var textWrapper = document.querySelector('.intro-title .letters');
    textWrapper.innerHTML = textWrapper.textContent.replace(/\S/g, "<span class='letter'>$&</span>");

    anime.timeline({ loop: true })
      .add({
        targets: '.intro-title .letter',
        rotateY: [-90, 0],
        duration: 1300,
        delay: (el, i) => 20 * i
      }).add({
        targets: '.intro-title .letter',
        rotateY: [0, 90],
        opacity: 0,
        duration: 1000,
        easing: "easeOutExpo",
        delay: 1000
      });

    setTimeout(function () {
      document.querySelector('.intro-title').style.display = 'none';
    }, 4000);

    /**
     * Shows/hides the custom About Us dropdown menu on hover.
     */
    const aboutUs = document.getElementById('navbarDropdown');
    const dropdown = document.getElementById('customDropdown');

    if (aboutUs && dropdown) {
      aboutUs.addEventListener('mouseenter', () => {
        dropdown.style.display = 'block';
      });

      dropdown.addEventListener('mouseleave', () => {
        dropdown.style.display = 'none';
      });

      dropdown.addEventListener('mouseenter', () => {
        dropdown.style.display = 'block';
      });

      aboutUs.addEventListener('mouseleave', () => {
        setTimeout(() => {
          if (!dropdown.matches(':hover')) {
            dropdown.style.display = 'none';
          }
        }, 200);
      });
    }

})();

/**
 * Duplicate About Us dropdown hover logic for compatibility.
 * Ensures dropdown shows/hides on hover for About Us link.
 */
document.addEventListener('DOMContentLoaded', function() {
    const aboutLink = document.getElementById('navbarDropdown');
    const dropdown = document.getElementById('customDropdown');

    if (aboutLink && dropdown) {
        aboutLink.addEventListener('mouseenter', () => {
            dropdown.style.display = 'block';
        });
        aboutLink.addEventListener('mouseleave', () => {
            setTimeout(() => {
                if (!dropdown.matches(':hover')) dropdown.style.display = 'none';
            }, 200);
        });
        dropdown.addEventListener('mouseleave', () => {
            dropdown.style.display = 'none';
        });
        dropdown.addEventListener('mouseenter', () => {
            dropdown.style.display = 'block';
        });
    }
});


// Events and Updates
let currentSlide = 0;
let slides = [];
let isTransitioning = false;
let allEvents = [];

/* ===== AUTOPLAY ===== */
let autoplayTimer = null;
const AUTOPLAY_DELAY = 4000;

/* ===== TOUCH ===== */
let touchStartX = 0;
let touchEndX = 0;
const SWIPE_THRESHOLD = 50;

/* ===== SCROLL ANIMATION OBSERVER ===== */
let eventCardsObserver = null;

document.addEventListener('DOMContentLoaded', () => {
  fetch('/api/events')
    .then(res => res.json())
    .then(result => {
      if (!result.rows || result.rows.length === 0) return;
      allEvents = result.rows.slice(0, 5); // Store the 5 events
      initCarousel();
    })
    .catch(err => console.error('❌ Carousel error:', err));
});

function getCardsPerSlide() {
  const width = window.innerWidth;
  if (width <= 640) return 1;
  if (width <= 1024) return 2;
  return 3;
}

function initCarousel() {
  const track = document.getElementById('eventTrack');
  const btnLeft = document.getElementById('btnLeft');
  const btnRight = document.getElementById('btnRight');
  const viewport = document.querySelector('.carousel-viewport');

  buildAndRender();

  btnRight.addEventListener('click', () => moveNext(track));
  btnLeft.addEventListener('click', () => movePrev(track));

  track.addEventListener('transitionend', () => handleLoop(track));

  /* ===== AUTOPLAY ===== */
  startAutoplay(track);

  viewport.addEventListener('mouseenter', stopAutoplay);
  viewport.addEventListener('mouseleave', () => startAutoplay(track));

  /* ===== TOUCH SWIPE ===== */
  viewport.addEventListener('touchstart', onTouchStart, { passive: true });
  viewport.addEventListener('touchend', e => onTouchEnd(e, track), {
    passive: true
  });
}

function buildAndRender() {
  const cardsPerSlide = getCardsPerSlide();
  slides = buildSlides(allEvents, cardsPerSlide);
  
  const track = document.getElementById('eventTrack');
  renderSlides(track);
  goToSlide(0, false);
  
  // ✅ INITIALIZE SCROLL ANIMATIONS AFTER CARDS ARE RENDERED
  initScrollAnimations();
}

/* ===== SLIDES ===== */
function buildSlides(events, cardsPerSlide) {
  if (cardsPerSlide === 1) {
    return [
      [events[0]],
      [events[1]],
      [events[2]],
      [events[3]],
      [events[4]],
      [events[0]]
    ];
  } else if (cardsPerSlide === 2) {
    return [
      [events[0], events[1]],
      [events[2], events[3]],
      [events[4], events[0]],
      [events[1], events[2]] 
    ];
  } else {
    return [
      [events[0], events[1], events[2]],
      [events[3], events[4], events[0]],
      [events[1], events[2], events[3]] 
    ];
  }
}

function renderSlides(track) {
  track.innerHTML = slides
    .map(
      slide => `
        <div class="event-slide">
          ${slide.map(renderCard).join('')}
        </div>
      `
    )
    .join('');
}

function renderCard(article) {
  // Guard clause: skip if article is undefined
  if (!article) return '';

  // Use optional chaining (?.) and fallback values
  const fbLink = article.fb_link || '#';
  const imageUrl = article.image_url || '/path/to/placeholder.jpg';
  const title = article.title || 'Untitled Event';
  const postDate = article.post_date ? new Date(article.post_date).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  }) : 'Date not available';

  return `
    <div class="event-card">
      <a href="${fbLink}" target="_blank">
        <img src="${imageUrl}" alt="${title}">
        <div class="card-body">
          <h5>${title}</h5>
          <p>${postDate}</p>
        </div>
      </a>
    </div>
  `;
}

/* ===== MOVEMENT ===== */
function moveNext(track) {
  if (isTransitioning) return;
  isTransitioning = true;
  currentSlide++;
  goToSlide(currentSlide, true);
}

function movePrev(track) {
  if (isTransitioning) return;
  isTransitioning = true;
  currentSlide--;
  goToSlide(currentSlide, true);
}

function goToSlide(index, animate = true) {
  const track = document.getElementById('eventTrack');
  track.style.transition = animate ? 'transform 0.45s ease' : 'none';
  track.style.transform = `translateX(-${index * 100}%)`;
}

/* ===== LOOP FIX ===== */
function handleLoop(track) {
  track.style.transition = 'none';

  if (currentSlide === slides.length - 1) {
    currentSlide = 0;
    goToSlide(currentSlide, false);
  }

  if (currentSlide < 0) {
    currentSlide = slides.length - 2;
    goToSlide(currentSlide, false);
  }

  isTransitioning = false;
}

function startAutoplay(track) {
  stopAutoplay();
  autoplayTimer = setInterval(() => moveNext(track), AUTOPLAY_DELAY);
}

function stopAutoplay() {
  if (autoplayTimer) {
    clearInterval(autoplayTimer);
    autoplayTimer = null;
  }
}

function onTouchStart(e) {
  stopAutoplay();
  touchStartX = e.changedTouches[0].clientX;
}

function onTouchEnd(e, track) {
  touchEndX = e.changedTouches[0].clientX;
  const diff = touchStartX - touchEndX;

  if (Math.abs(diff) > SWIPE_THRESHOLD) {
    diff > 0 ? moveNext(track) : movePrev(track);
  }

  startAutoplay(track);
}

let resizeTimeout;
window.addEventListener('resize', () => {
  clearTimeout(resizeTimeout);
  resizeTimeout = setTimeout(() => {
    if (allEvents.length > 0) {
      stopAutoplay();
      buildAndRender();
      startAutoplay(document.getElementById('eventTrack'));
    }
  }, 300);
});

/* ===== SCROLL ANIMATIONS FOR EVENT CARDS ===== */
function initScrollAnimations() {
  // Clean up previous observer if it exists
  if (eventCardsObserver) {
    eventCardsObserver.disconnect();
  }

  // Get all event cards (NOW they exist in the DOM)
  const eventCards = document.querySelectorAll('.event-card');
  
  if (eventCards.length === 0) {
    console.warn('⚠️ No event cards found for animation');
    return;
  }

  // Configuration for the Intersection Observer
  const observerOptions = {
    root: null, // viewport
    rootMargin: '0px 0px -100px 0px', // trigger slightly before entering viewport
    threshold: 0.1 // trigger when 10% of the element is visible
  };

  // Callback function when elements intersect
  const handleIntersection = (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        // Add staggered delay based on card index
        const allCards = Array.from(document.querySelectorAll('.event-card'));
        const cardIndex = allCards.indexOf(entry.target);
        const delay = cardIndex * 100;

        setTimeout(() => {
          entry.target.classList.add('animate-in');
        }, delay);
      } else {
        // Remove animation class when card leaves viewport
        entry.target.classList.remove('animate-in');
      }
    });
  };

  // Create the observer
  eventCardsObserver = new IntersectionObserver(handleIntersection, observerOptions);

  // Observe each event card
  eventCards.forEach(card => {
    card.classList.add('animate-ready');
    eventCardsObserver.observe(card);
  });
}

document.addEventListener('DOMContentLoaded', async () => {
    const heroMedia = document.getElementById('hero-media');

    // Guard: only run on pages that have a hero
    if (!heroMedia) return;

    try {
        const res = await fetch('/api/banners/active');
        const data = await res.json();

        if (!data.banner) return;

        const { file_url, file_type } = data.banner;

        if (file_type.startsWith('video/')) {
            heroMedia.innerHTML = `
                <video autoplay loop muted playsinline>
                    <source src="${file_url}" type="${file_type}">
                </video>
            `;
        } else {
            heroMedia.innerHTML = `
                <img src="${file_url}" alt="Hero Banner" />
            `;
        }

    } catch (err) {
        console.error('Failed to load hero banner:', err);
    }
});



