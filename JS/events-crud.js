document.addEventListener('DOMContentLoaded', () => {
  loadEvents();
  setupSearch();
  setupSorting();
  setupScrollDetection();
  setupPagination();
});

/* =========================
   PAGINATION STATE
   ========================= */
let allEvents = [];
let filteredEvents = [];
let currentPage = 1;
let itemsPerPage = 10;

/* =========================
   LOAD EVENTS
   ========================= */
async function loadEvents() {
  console.log('Loading events...');
  try {
    const res = await fetch('/api/events');
    console.log('Fetch status:', res.status);
    const data = await res.json();
    console.log('API data:', data);
    allEvents = data.rows || [];
    console.log('Events loaded:', allEvents.length);
    filteredEvents = [...allEvents];
    currentPage = 1;
    renderPaginatedEvents();
  } catch (err) {
    console.error('Load failed:', err);
  }
}

/* =========================
   RENDER PAGINATED EVENTS
   ========================= */
function renderPaginatedEvents() {
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const eventsToDisplay = filteredEvents.slice(startIndex, endIndex);
  
  renderEvents(eventsToDisplay);
  updatePaginationControls();
}

/* =========================
   RENDER TABLE
   ========================= */
function renderEvents(events) {
  const tbody = document.getElementById('eventsTableBody');
  if (!tbody) return;

  tbody.innerHTML = '';

  if (events.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="5">No events found</td>
      </tr>
    `;
    return;
  }

  events.forEach(event => {
    const tr = document.createElement('tr');

    const fbColumn = event.fb_link
      ? `<a href="${event.fb_link}" target="_blank" class="fb-link">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><!--!Font Awesome Free v7.1.0 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2026 Fonticons, Inc.--><path d="M290.4 19.8C295.4 7.8 307.1 0 320 0L480 0c17.7 0 32 14.3 32 32l0 160c0 12.9-7.8 24.6-19.8 29.6s-25.7 2.2-34.9-6.9L400 157.3 246.6 310.6c-12.5 12.5-32.8 12.5-45.3 0s-12.5-32.8 0-45.3L354.7 112 297.4 54.6c-9.2-9.2-11.9-22.9-6.9-34.9zM0 176c0-44.2 35.8-80 80-80l80 0c17.7 0 32 14.3 32 32s-14.3 32-32 32l-80 0c-8.8 0-16 7.2-16 16l0 256c0 8.8 7.2 16 16 16l256 0c8.8 0 16-7.2 16-16l0-80c0-17.7 14.3-32 32-32s32 14.3 32 32l0 80c0 44.2-35.8 80-80 80L80 512c-44.2 0-80-35.8-80-80L0 176z"/></svg>
          <span>View Post</span>
        </a>`
      : `<span style="color:#9ca3af;">—</span>`;

    tr.innerHTML = `
      <td>${event.title}</td>
      <td data-date="${event.post_date}">${new Date(event.post_date).toLocaleDateString()}</td>
      <td>${event.venue}</td>
      <td>${fbColumn}</td>
      <td>
        <button class="view-btn" data-id="${event.id}">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 576 512"><!--!Font Awesome Free v7.1.0 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2026 Fonticons, Inc.--><path d="M288 80C222.8 80 169.2 109.6 128.1 147.7 89.6 183.5 63 226 49.4 256 63 286 89.6 328.5 128.1 364.3 169.2 402.4 222.8 432 288 432s118.8-29.6 159.9-67.7C486.4 328.5 513 286 526.6 256 513 226 486.4 183.5 447.9 147.7 406.8 109.6 353.2 80 288 80zM95.4 112.6C142.5 68.8 207.2 32 288 32s145.5 36.8 192.6 80.6c46.8 43.5 78.1 95.4 93 131.1 3.3 7.9 3.3 16.7 0 24.6-14.9 35.7-46.2 87.7-93 131.1-47.1 43.7-111.8 80.6-192.6 80.6S142.5 443.2 95.4 399.4c-46.8-43.5-78.1-95.4-93-131.1-3.3-7.9-3.3-16.7 0-24.6 14.9-35.7 46.2-87.7 93-131.1zM288 336c44.2 0 80-35.8 80-80 0-29.6-16.1-55.5-40-69.3-1.4 59.7-49.6 107.9-109.3 109.3 13.8 23.9 39.7 40 69.3 40zm-79.6-88.4c2.5 .3 5 .4 7.6 .4 35.3 0 64-28.7 64-64 0-2.6-.2-5.1-.4-7.6-37.4 3.9-67.2 33.7-71.1 71.1zm45.6-115c10.8-3 22.2-4.5 33.9-4.5 8.8 0 17.5 .9 25.8 2.6 .3 .1 .5 .1 .8 .2 57.9 12.2 101.4 63.7 101.4 125.2 0 70.7-57.3 128-128 128-61.6 0-113-43.5-125.2-101.4-1.8-8.6-2.8-17.5-2.8-26.6 0-11 1.4-21.8 4-32 .2-.7 .3-1.3 .5-1.9 11.9-43.4 46.1-77.6 89.5-89.5z"/></svg>
        </button>
        <button class="edit-btn" data-id="${event.id}">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><!--!Font Awesome Free v7.1.0 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2026 Fonticons, Inc.--><path d="M441 58.9L453.1 71c9.4 9.4 9.4 24.6 0 33.9L424 134.1 377.9 88 407 58.9c9.4-9.4 24.6-9.4 33.9 0zM209.8 256.2L344 121.9 390.1 168 255.8 302.2c-2.9 2.9-6.5 5-10.4 6.1l-58.5 16.7 16.7-58.5c1.1-3.9 3.2-7.5 6.1-10.4zM373.1 25L175.8 222.2c-8.7 8.7-15 19.4-18.3 31.1l-28.6 100c-2.4 8.4-.1 17.4 6.1 23.6s15.2 8.5 23.6 6.1l100-28.6c11.8-3.4 22.5-9.7 31.1-18.3L487 138.9c28.1-28.1 28.1-73.7 0-101.8L474.9 25C446.8-3.1 401.2-3.1 373.1 25zM88 64C39.4 64 0 103.4 0 152L0 424c0 48.6 39.4 88 88 88l272 0c48.6 0 88-39.4 88-88l0-112c0-13.3-10.7-24-24-24s-24 10.7-24 24l0 112c0 22.1-17.9 40-40 40L88 464c-22.1 0-40-17.9-40-40l0-272c0-22.1 17.9-40 40-40l112 0c13.3 0 24-10.7 24-24s-10.7-24-24-24L88 64z"/></svg>
        </button>
        <button class="delete-btn" data-id="${event.id}" data-title="${event.title.replace(/"/g, '&quot;')}">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512"><!--!Font Awesome Free v7.1.0 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2026 Fonticons, Inc.--><path d="M166.2-16c-13.3 0-25.3 8.3-30 20.8L120 48 24 48C10.7 48 0 58.7 0 72S10.7 96 24 96l400 0c13.3 0 24-10.7 24-24s-10.7-24-24-24l-96 0-16.2-43.2C307.1-7.7 295.2-16 281.8-16L166.2-16zM32 144l0 304c0 35.3 28.7 64 64 64l256 0c35.3 0 64-28.7 64-64l0-304-48 0 0 304c0 8.8-7.2 16-16 16L96 464c-8.8 0-16-7.2-16-16l0-304-48 0zm160 72c0-13.3-10.7-24-24-24s-24 10.7-24 24l0 176c0 13.3 10.7 24 24 24s24-10.7 24-24l0-176zm112 0c0-13.3-10.7-24-24-24s-24 10.7-24 24l0 176c0 13.3 10.7 24 24 24s24-10.7 24-24l0-176z"/></svg>
        </button>
      </td>
    `;

    tbody.appendChild(tr);
  });

  attachRowActions();
}

/* =========================
   PAGINATION SETUP
   ========================= */
function setupPagination() {
  // Items per page selector
  const itemsSelect = document.getElementById('itemsPerPage');
  if (itemsSelect) {
    itemsSelect.addEventListener('change', (e) => {
      itemsPerPage = parseInt(e.target.value);
      currentPage = 1;
      renderPaginatedEvents();
    });
  }

  // Navigation buttons
  document.getElementById('firstPageBtn')?.addEventListener('click', () => goToPage(1));
  document.getElementById('prevPageBtn')?.addEventListener('click', () => goToPage(currentPage - 1));
  document.getElementById('nextPageBtn')?.addEventListener('click', () => goToPage(currentPage + 1));
  document.getElementById('lastPageBtn')?.addEventListener('click', () => {
    const totalPages = Math.ceil(filteredEvents.length / itemsPerPage);
    goToPage(totalPages);
  });
}

/* =========================
   PAGINATION CONTROLS
   ========================= */
function updatePaginationControls() {
  const totalItems = filteredEvents.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage + 1;
  const endIndex = Math.min(currentPage * itemsPerPage, totalItems);

  // Update info text
  const infoElement = document.getElementById('paginationInfo');
  if (infoElement) {
    if (totalItems === 0) {
      infoElement.textContent = 'Showing 0 to 0 of 0 entries';
    } else {
      infoElement.textContent = `Showing ${startIndex} to ${endIndex} of ${totalItems} entries`;
    }
  }

  // Update navigation buttons state
  const firstBtn = document.getElementById('firstPageBtn');
  const prevBtn = document.getElementById('prevPageBtn');
  const nextBtn = document.getElementById('nextPageBtn');
  const lastBtn = document.getElementById('lastPageBtn');

  if (firstBtn) firstBtn.disabled = currentPage === 1;
  if (prevBtn) prevBtn.disabled = currentPage === 1;
  if (nextBtn) nextBtn.disabled = currentPage === totalPages || totalPages === 0;
  if (lastBtn) lastBtn.disabled = currentPage === totalPages || totalPages === 0;

  // Update page numbers
  renderPageNumbers(totalPages);
}

function renderPageNumbers(totalPages) {
  const container = document.getElementById('paginationNumbers');
  if (!container) return;

  container.innerHTML = '';

  if (totalPages <= 1) return;

  const maxVisible = 5;
  let startPage = Math.max(1, currentPage - Math.floor(maxVisible / 2));
  let endPage = Math.min(totalPages, startPage + maxVisible - 1);

  if (endPage - startPage < maxVisible - 1) {
    startPage = Math.max(1, endPage - maxVisible + 1);
  }

  // Add first page and ellipsis if needed
  if (startPage > 1) {
    addPageButton(container, 1);
    if (startPage > 2) {
      const ellipsis = document.createElement('span');
      ellipsis.className = 'pagination-ellipsis';
      ellipsis.textContent = '...';
      container.appendChild(ellipsis);
    }
  }

  // Add page numbers
  for (let i = startPage; i <= endPage; i++) {
    addPageButton(container, i);
  }

  // Add last page and ellipsis if needed
  if (endPage < totalPages) {
    if (endPage < totalPages - 1) {
      const ellipsis = document.createElement('span');
      ellipsis.className = 'pagination-ellipsis';
      ellipsis.textContent = '...';
      container.appendChild(ellipsis);
    }
    addPageButton(container, totalPages);
  }
}

function addPageButton(container, pageNum) {
  const button = document.createElement('button');
  button.className = 'pagination-number';
  button.textContent = pageNum;
  
  if (pageNum === currentPage) {
    button.classList.add('active');
  }
  
  button.addEventListener('click', () => goToPage(pageNum));
  container.appendChild(button);
}

function goToPage(pageNum) {
  const totalPages = Math.ceil(filteredEvents.length / itemsPerPage);
  if (pageNum < 1 || pageNum > totalPages) return;
  
  currentPage = pageNum;
  renderPaginatedEvents();
  
  // Scroll to top of table
  document.querySelector('.table-wrapper')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

/* =========================
   SEARCH (UPDATED FOR PAGINATION)
   ========================= */
function setupSearch() {
  const searchInput = document.getElementById('eventSearch');
  if (!searchInput) {
    console.warn('Search input #eventSearch not found');
    return;
  }

  searchInput.addEventListener('input', function () {
    const query = this.value.toLowerCase().trim();

    if (!query) {
      filteredEvents = [...allEvents];
    } else {
      filteredEvents = allEvents.filter(event => {
        const title = (event.title || '').toLowerCase();
        const venue = (event.venue || '').toLowerCase();
        return title.includes(query) || venue.includes(query);
      });
    }

    currentPage = 1;
    renderPaginatedEvents();
  });
}

/* =========================
   SORTING (UPDATED FOR PAGINATION)
   ========================= */
function setupSorting() {
  const sortableHeaders = document.querySelectorAll('th[data-sort]');
  
  sortableHeaders.forEach(header => {
    header.style.cursor = 'pointer';
    header.addEventListener('click', () => {
      const column = header.dataset.sort;
      const currentOrder = header.dataset.order || 'asc';
      const newOrder = currentOrder === 'asc' ? 'desc' : 'asc';
      
      // Reset all other headers
      sortableHeaders.forEach(h => {
        if (h !== header) {
          h.dataset.order = 'asc';
          h.classList.remove('sorted-asc', 'sorted-desc');
          const ascIcon = h.querySelector('.sort-icon-asc');
          const descIcon = h.querySelector('.sort-icon-desc');
          if (ascIcon) ascIcon.style.display = '';
          if (descIcon) descIcon.style.display = 'none';
        }
      });
      
      // Update current header
      header.dataset.order = newOrder;
      header.classList.remove('sorted-asc', 'sorted-desc');
      header.classList.add(`sorted-${newOrder}`);
      
      // Toggle icons
      const ascIcon = header.querySelector('.sort-icon-asc');
      const descIcon = header.querySelector('.sort-icon-desc');
      
      if (newOrder === 'asc') {
        ascIcon.style.display = '';
        descIcon.style.display = 'none';
      } else {
        ascIcon.style.display = 'none';
        descIcon.style.display = '';
      }
      
      sortFilteredEvents(column, newOrder);
    });
  });
}

function sortFilteredEvents(column, order) {
  filteredEvents.sort((a, b) => {
    let aValue, bValue;
    
    if (column === 'date') {
      aValue = new Date(a.post_date);
      bValue = new Date(b.post_date);
      return order === 'asc' ? aValue - bValue : bValue - aValue;
    } else {
      const key = column === 'title' ? 'title' : 'venue';
      aValue = a[key].toLowerCase();
      bValue = b[key].toLowerCase();
      
      if (order === 'asc') {
        return aValue.localeCompare(bValue);
      } else {
        return bValue.localeCompare(aValue);
      }
    }
  });
  
  renderPaginatedEvents();
}

/* =========================
   BUTTON ACTIONS
   ========================= */
function attachRowActions() {
  document.querySelectorAll('.view-btn').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation();
      viewEvent(btn.dataset.id);
    });
  });

  document.querySelectorAll('.delete-btn').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation();
      deleteEvent(btn.dataset.id, btn.dataset.title);
    });
  });

  document.querySelectorAll('.edit-btn').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation();
      editEvent(btn.dataset.id);
    });
  });
}

/* =========================
   VIEW EVENT (MODAL)
   ========================= */
async function viewEvent(id) {
  try {
    const event = allEvents.find(e => e.id == id);

    if (!event) {
      alert('Event not found');
      return;
    }

    const modalOverlay = document.createElement('div');
    modalOverlay.className = 'event-modal-overlay';
    modalOverlay.innerHTML = `
      <div class="event-modal-container event-view-modal">
        <button class="event-modal-close">&times;</button>
        <h2>${event.title}</h2>
        ${event.image_url ? `<img src="${event.image_url}" alt="${event.title}" class="event-modal-image">` : ''}
        <div class="event-modal-details">
          <p class="event-modal-description">${event.content}</p>
          <div class="event-modal-meta">
            <p><strong>Date:</strong> ${new Date(event.post_date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
            <p><strong>Location:</strong> ${event.venue}</p>
          </div>
          ${event.fb_link ? `
            <a href="${event.fb_link}" target="_blank" class="event-modal-fb-link">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="20" height="20">
                <path fill="currentColor" d="M512 256C512 114.6 397.4 0 256 0S0 114.6 0 256C0 376 82.7 476.8 194.2 504.5V334.2H141.4V256h52.8V222.3c0-87.1 39.4-127.5 125-127.5c16.2 0 44.2 3.2 55.7 6.4V172c-6-.6-16.5-1-29.6-1c-42 0-58.2 15.9-58.2 57.2V256h83.6l-14.4 78.2H287V510.1C413.8 494.8 512 386.9 512 256h0z"/>
              </svg>
              View Facebook Post
            </a>
          ` : ''}
          <p class="event-modal-updated"><em>Last updated: ${new Date(event.updated_at || event.post_date).toLocaleString()}</em></p>
        </div>
      </div>
    `;

    document.body.appendChild(modalOverlay);

    const closeBtn = modalOverlay.querySelector('.event-modal-close');
    closeBtn.addEventListener('click', () => modalOverlay.remove());
    modalOverlay.addEventListener('click', (e) => {
      if (e.target === modalOverlay) modalOverlay.remove();
    });

  } catch (err) {
    console.error('View failed:', err);
    alert('Failed to load event details');
  }
}

/* =========================
   DELETE EVENT (MODAL)
   ========================= */
async function deleteEvent(id, title) {
  const modalOverlay = document.createElement('div');
  modalOverlay.className = 'event-modal-overlay';
  modalOverlay.innerHTML = `
    <div class="event-modal-container event-delete-modal">
      <button class="event-modal-close">&times;</button>
      <div class="event-delete-icon">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="40" height="40"><!--!Font Awesome Free v7.1.0 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2026 Fonticons, Inc.-->
        <path d="M256 512a256 256 0 1 1 0-512 256 256 0 1 1 0 512zm0-192a32 32 0 1 0 0 64 32 32 0 1 0 0-64zm0-192c-18.2 0-32.7 15.5-31.4 33.7l7.4 104c.9 12.6 11.4 22.3 23.9 22.3 12.6 0 23-9.7 23.9-22.3l7.4-104c1.3-18.2-13.1-33.7-31.4-33.7z"/>
        </svg>
      </div>
      <h2>Delete Event?</h2>
      <p class="event-delete-message">
        Are you sure you want to delete <strong>"${title}"</strong>?
      </p>
      <p class="event-delete-warning">
        This action cannot be undone.
      </p>
      <div class="event-form-actions delete-modal-actions">
        <button type="button" class="event-btn-cancel">Cancel</button>
        <button type="button" class="event-btn-delete">Delete Event</button>
      </div>
    </div>
  `;

  document.body.appendChild(modalOverlay);

  const deleteBtn = modalOverlay.querySelector('.event-btn-delete');
  const cancelBtn = modalOverlay.querySelector('.event-btn-cancel');
  const closeBtn = modalOverlay.querySelector('.event-modal-close');

  deleteBtn.addEventListener('click', async () => {
    deleteBtn.disabled = true;
    deleteBtn.textContent = 'Deleting...';

    try {
      await fetch(`/admin/events/${id}`, { method: 'DELETE' });
      modalOverlay.remove();
      loadEvents();
    } catch (err) {
      console.error('Delete failed:', err);
      alert('Failed to delete event');
      deleteBtn.disabled = false;
      deleteBtn.textContent = 'Delete Event';
    }
  });

  cancelBtn.addEventListener('click', () => modalOverlay.remove());
  closeBtn.addEventListener('click', () => modalOverlay.remove());
  modalOverlay.addEventListener('click', (e) => {
    if (e.target === modalOverlay) modalOverlay.remove();
  });
}

/* =========================
   EDIT EVENT (MODAL)
   ========================= */
async function editEvent(id) {
  try {
    const event = allEvents.find(e => e.id == id);

    if (!event) {
      alert('Event not found');
      return;
    }

    const isFbLinked = !!event.fb_link;

    const modalOverlay = document.createElement('div');
    modalOverlay.className = 'event-modal-overlay';
    modalOverlay.innerHTML = `
      <div class="event-modal-container event-edit-modal">
        <button class="event-modal-close">&times;</button>
        <h2>Edit Event</h2>
        <form id="editEventForm" class="event-modal-form">
          <div class="event-form-group">
            <label for="eventTitle">Event Title</label>
            <input type="text" id="eventTitle" class="event-form-input" value="${event.title}" required>
          </div>
          
          <div class="event-form-group">
            <label for="eventContent">Content / Description</label>
            <textarea id="eventContent" class="event-form-textarea" rows="5" required>${event.content}</textarea>
          </div>
          
          <div class="event-form-row">
            <div class="event-form-group">
              <label for="eventDate">Date</label>
              <input type="date" id="eventDate" class="event-form-input" value="${event.post_date.slice(0, 10)}" required>
            </div>
            
            <div class="event-form-group">
              <label for="eventVenue">Location</label>
              <input type="text" id="eventVenue" class="event-form-input" value="${event.venue}" required>
            </div>
          </div>
          
          <div class="event-form-group">
            <label for="eventImage">Event Image (Optional)</label>
            <div class="event-image-upload-wrapper">
              ${event.image_url ? `
                <div class="event-current-image">
                  <img src="${event.image_url}" alt="Current image">
                  <button type="button" class="event-remove-image">Remove Image</button>
                </div>
              ` : ''}
              <input type="file" id="eventImage" class="event-form-file" accept="image/*">
              <label for="eventImage" class="event-file-label">
                <span class="event-file-label-text">Choose Image</span>
              </label>
              <div class="event-image-preview" style="display: none;">
                <img src="" alt="Preview">
                <button type="button" class="event-remove-preview">Remove</button>
              </div>
            </div>
          </div>
          
          <div class="event-form-group">
            <label for="eventFbLink">Facebook Post Link (Optional)</label>
            <input type="url" id="eventFbLink" class="event-form-input" value="${event.fb_link || ''}">
          </div>
          
          <div class="event-form-actions">
            <button type="button" class="event-btn-cancel">Cancel</button>
            <button type="submit" class="event-btn-save">Save Changes</button>
          </div>
        </form>
      </div>
    `;

    document.body.appendChild(modalOverlay);

    if (isFbLinked) {
      modalOverlay.querySelectorAll(
        '#eventTitle, #eventDate, #eventImage, #eventFbLink, .event-remove-image'
      ).forEach(el => {
        if (el) el.disabled = true;
      });

      const fileLabel = modalOverlay.querySelector('.event-file-label');
      if (fileLabel) {
        fileLabel.style.pointerEvents = 'none';
        fileLabel.style.opacity = '0.5';
      }

      const hint = document.createElement('p');
      hint.className = 'event-form-hint';
      hint.style.color = '#dc2626';
      hint.textContent =
        'This event is linked to Facebook. Only content and location can be edited.';
      modalOverlay.querySelector('.event-modal-form').prepend(hint);
    } else {
      // For manually added events, disable Facebook link field
      const fbLinkInput = modalOverlay.querySelector('#eventFbLink');
      if (fbLinkInput) fbLinkInput.disabled = true;

      const hint = document.createElement('p');
      hint.className = 'event-form-hint';
      hint.style.color = '#dc2626';
      hint.textContent = 'This is a manual event. Facebook link cannot be added.';
      modalOverlay.querySelector('.event-modal-form').prepend(hint);
    }

    const fileInput = modalOverlay.querySelector('#eventImage');
    const fileLabelText = modalOverlay.querySelector('.event-file-label-text');
    const imagePreview = modalOverlay.querySelector('.event-image-preview');
    const previewImg = imagePreview.querySelector('img');
    const removePreviewBtn = modalOverlay.querySelector('.event-remove-preview');
    const currentImageDiv = modalOverlay.querySelector('.event-current-image');
    const removeImageBtn = modalOverlay.querySelector('.event-remove-image');

    let imageToUpload = null;
    let removeCurrentImage = false;

    if (fileInput) {
      fileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
          imageToUpload = file;
          const reader = new FileReader();
          reader.onload = (e) => {
            previewImg.src = e.target.result;
            imagePreview.style.display = 'block';
            fileLabelText.textContent = file.name;
            if (currentImageDiv) currentImageDiv.style.display = 'none';
          };
          reader.readAsDataURL(file);
        }
      });
    }

    if (removePreviewBtn) {
      removePreviewBtn.addEventListener('click', () => {
        fileInput.value = '';
        imageToUpload = null;
        imagePreview.style.display = 'none';
        fileLabelText.textContent = 'Choose Image';
        if (currentImageDiv && !removeCurrentImage) currentImageDiv.style.display = 'block';
      });
    }

    if (removeImageBtn) {
      removeImageBtn.addEventListener('click', () => {
        removeCurrentImage = true;
        currentImageDiv.style.display = 'none';
      });
    }

    const form = modalOverlay.querySelector('#editEventForm');
    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      const formData = new FormData();
      formData.append('content', document.getElementById('eventContent').value.trim());
      formData.append('venue', document.getElementById('eventVenue').value.trim());

      if (!isFbLinked) {
        formData.append('title', document.getElementById('eventTitle').value.trim());
        formData.append('post_date', document.getElementById('eventDate').value);
      }

      if (isFbLinked) {
        formData.append('fb_link', document.getElementById('eventFbLink').value.trim());
      }

      if (imageToUpload && !isFbLinked) {
        formData.append('image_file', imageToUpload);
      } else if (removeCurrentImage && !isFbLinked) {
        formData.append('remove_image', 'true');
      }

      try {
        const saveBtn = form.querySelector('.event-btn-save');
        saveBtn.disabled = true;
        saveBtn.textContent = 'Saving...';

        await fetch(`/admin/events/${id}`, {
          method: 'PUT',
          body: formData
        });

        modalOverlay.remove();
        loadEvents();
      } catch (err) {
        console.error('Update failed:', err);
        alert('Failed to update event');
      }
    });

    modalOverlay.querySelector('.event-modal-close')
      .addEventListener('click', () => modalOverlay.remove());

    modalOverlay.querySelector('.event-btn-cancel')
      .addEventListener('click', () => modalOverlay.remove());

    modalOverlay.addEventListener('click', (e) => {
      if (e.target === modalOverlay) modalOverlay.remove();
    });

  } catch (err) {
    console.error('Edit failed:', err);
    alert('Failed to load event for editing');
  }
}

function setupScrollDetection() {
    const scrollContainer = document.querySelector('.table-scroll-container');
    const wrapper = document.querySelector('.table-wrapper');
    
    if (!scrollContainer || !wrapper) return;
    
    function checkScroll() {
        const hasHorizontalScroll = scrollContainer.scrollWidth > scrollContainer.clientWidth;
        
        if (hasHorizontalScroll) {
            wrapper.classList.add('has-scroll');
        } else {
            wrapper.classList.remove('has-scroll');
        }
    }
    
    checkScroll();
    window.addEventListener('resize', checkScroll);
    
    scrollContainer.addEventListener('scroll', function() {
        if (this.scrollLeft > 10) {
            wrapper.classList.remove('has-scroll');
        }
    });
}