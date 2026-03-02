let currentPage = 1;
const EVENT_PER_PAGE = 6;

document.addEventListener('DOMContentLoaded', () => {
  if (typeof AOS !== 'undefined') {
    AOS.init();
  }
  loadEvents(currentPage);
  loadNewsFlash();
});

/* ---------------- FETCH EVENTS ---------------- */
function loadEvents(page) {
  const list = document.getElementById('eventsList');
  const empty = document.getElementById('emptyState');
  const pagination = document.getElementById('pagination');

  list.style.display = 'none';
  empty.style.display = 'none';

  fetch(`/api/events?page=${page}&limit=${EVENT_PER_PAGE}`)
    .then(res => res.json())
    .then(data => {
      if (!data.rows || data.rows.length === 0) {
        empty.style.display = 'block';
        pagination.innerHTML = '';
        return;
      }

      list.innerHTML = data.rows.map(renderEvent).join('');
      list.style.display = 'grid';

      renderPagination(data.page, data.totalPages);

      setTimeout(() => {
        if (typeof AOS !== 'undefined') AOS.refresh();
      }, 100);
    })
    .catch(err => {
      console.error('Events error:', err);
      empty.style.display = 'block';
    });
}

/* ---------------- RENDER EVENT ---------------- */
function renderEvent(event) {
  const MAX_LENGTH = 340; // Character limit for content
  const content = event.content || '';
  const isLongContent = content.length > MAX_LENGTH;
  const truncatedContent = isLongContent ? content.substring(0, MAX_LENGTH) + '...' : content;
  
  // Generate unique ID for each event
  const eventId = `event-${event.id || Math.random().toString(36).substr(2, 9)}`;
  
  return `
    <div class="event-row">
      <div class="event-image-container">
        <img src="${event.image_url}" alt="${event.title}">
      </div>

      <div class="event-info">
        <h2>${event.title}</h2>
        <div class="event-content" id="${eventId}">
          <p class="content-short">${truncatedContent}</p>
          ${isLongContent ? `<p class="content-full" style="display: none;">${content}</p>` : ''}
        </div>
        
        ${isLongContent ? `
          <button class="toggle-content-btn" onclick="toggleEventContent('${eventId}', this)">
            See more
          </button>
        ` : ''}

        <div class="event-metadata">
            <p>${event.venue}</p>
            <p class="event-date">
                ${new Date(event.post_date).toLocaleDateString('en-GB', {
                day: 'numeric',
                month: 'long',
                year: 'numeric'
                })}
          </p>
        </div>

        ${
          event.fb_link
            ? `<a href="${event.fb_link}" target="_blank" class="view-details-link">View details →</a>`
            : ''
        }
      </div>
    </div>
  `;
}

/* ---------------- SEE MORE / SEE LESS ---------------- */
function toggleEventContent(eventId, button) {
  const container = document.getElementById(eventId);
  const shortContent = container.querySelector('.content-short');
  const fullContent = container.querySelector('.content-full');
  
  if (!fullContent) return;
  
  const isExpanded = fullContent.style.display !== 'none';
  
  if (isExpanded) {
    // Collapse
    shortContent.style.display = 'block';
    fullContent.style.display = 'none';
    button.textContent = 'See more';
    button.setAttribute('aria-expanded', 'false');
  } else {
    // Expand
    shortContent.style.display = 'none';
    fullContent.style.display = 'block';
    button.textContent = 'See less';
    button.setAttribute('aria-expanded', 'true');
  }
}

/* ---------------- PAGINATION ---------------- */
function renderPagination(current, total) {
  const container = document.getElementById('pagination');
  let html = '';

  if (total <= 1) {
    container.innerHTML = '';
    return;
  }

  if (current > 1) {
    html += `<button onclick="changePage(${current - 1})">‹ Prev</button>`;
  }

  for (let i = 1; i <= total; i++) {
    html += `
      <button class="${i === current ? 'active' : ''}"
              onclick="changePage(${i})">
        ${i}
      </button>
    `;
  }

  if (current < total) {
    html += `<button onclick="changePage(${current + 1})">Next ›</button>`;
  }

  container.innerHTML = html;
}

function changePage(page) {
  currentPage = page;
  window.scrollTo({ top: 0, behavior: 'smooth' });
  loadEvents(page);
}

document.addEventListener('DOMContentLoaded', () => {
  const params = new URLSearchParams(window.location.search);

  const errorModal   = document.getElementById('errorModal');
  const successModal = document.getElementById('successModal');

  const closeError   = document.getElementById('closeErrorModal');
  const closeSuccess = document.getElementById('closeSuccessModal');

  if (params.get('error') === 'incomplete' && errorModal) {
    errorModal.classList.remove('hidden');
    history.replaceState({}, document.title, '/admin');
  }

  if (params.get('success') === '1' && successModal) {
    successModal.classList.remove('hidden');
    history.replaceState({}, document.title, '/admin');
  }

  closeError?.addEventListener('click', () => {
    errorModal.classList.add('hidden');
  });

  closeSuccess?.addEventListener('click', () => {
    successModal.classList.add('hidden');
  });
});

/* ---------------- LOAD NEWS FLASH ---------------- */
function loadNewsFlash() {
  fetch('/api/events?page=1&limit=3')
    .then(res => res.json())
    .then(data => {
      if (!data.rows || data.rows.length === 0) return;
      
      const track = document.getElementById('newsFlashTrack');
      
      const newsItems = data.rows.map(event => 
        `<span class="news-flash-item">${event.title}</span>`
      ).join('');
      
      track.innerHTML = newsItems + newsItems;
    })
    .catch(err => {
      console.error('News flash error:', err);
    });
}