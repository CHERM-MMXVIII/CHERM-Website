// ===============================
// MODAL FUNCTIONS
// ===============================

function showSuccessModal(title, message) {
    const modalHTML = `
        <div class="modal" id="successModal">
            <div class="modal-content centered">
                <button class="modal-close" onclick="closeSuccessModal()">×</button>
                <div class="modal-icon success"><i class="fas fa-check-circle"></i></div>
                <h3>${title}</h3>
                <p>${message}</p>
                <div class="modal-actions">
                    <button class="btn-primary" onclick="closeSuccessModal()">Got it</button>
                </div>
            </div>
        </div>`;
    document.getElementById('successModal')?.remove();
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    setTimeout(() => document.getElementById('successModal')?.classList.remove('hidden'), 10);
}

function closeSuccessModal() {
    document.getElementById('successModal')?.remove();
}

function showErrorModal(title, message) {
    const modalHTML = `
        <div class="modal" id="errorModal">
            <div class="modal-content centered">
                <button class="modal-close" onclick="closeErrorModal()">×</button>
                <div class="modal-icon error"><i class="fas fa-exclamation-circle"></i></div>
                <h3>${title}</h3>
                <p>${message}</p>
                <div class="modal-actions">
                    <button class="btn-primary" onclick="closeErrorModal()">Got it</button>
                </div>
            </div>
        </div>`;
    document.getElementById('errorModal')?.remove();
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    setTimeout(() => document.getElementById('errorModal')?.classList.remove('hidden'), 10);
}

function closeErrorModal() {
    document.getElementById('errorModal')?.remove();
}

// ===============================
// DELETE CONFIRM MODAL
// ===============================

function mrShowDeleteModal(title, itemName, onConfirm) {
    document.getElementById('mr-confirm-modal')?.remove();
    document.getElementById('mr-confirm-styles')?.remove();

    const styleEl = document.createElement('style');
    styleEl.id = 'mr-confirm-styles';
    styleEl.textContent = `
        #mr-confirm-modal {
            position: fixed !important;
            inset: 0 !important;
            background: rgba(0,0,0,0.70) !important;
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
            z-index: 99999 !important;
            animation: mrFadeIn 0.2s ease !important;
        }
        @keyframes mrFadeIn { from { opacity: 0; } to { opacity: 1; } }
        #mr-confirm-modal .mr-box {
            background: #ffffff !important;
            border-radius: 12px !important;
            padding: 32px !important;
            max-width: 450px !important;
            width: 90% !important;
            text-align: center !important;
            position: relative !important;
            box-shadow: 0 20px 60px rgba(0,0,0,0.3) !important;
            animation: mrSlideUp 0.3s ease !important;
            display: block !important;
        }
        @keyframes mrSlideUp { from { transform: translateY(30px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        #mr-confirm-modal .mr-close-btn {
            position: absolute !important; top: 14px !important; right: 16px !important;
            background: none !important; border: none !important; font-size: 30px !important;
            color: #999 !important; cursor: pointer !important; line-height: 1 !important;
            padding: 2px 6px !important; box-shadow: none !important;
        }
        #mr-confirm-modal .mr-close-btn:hover { color: #333 !important; }
        #mr-confirm-modal .mr-icon-wrap {
            margin: 0 auto 20px !important; width: 56px !important; height: 56px !important;
            background: #fee2e2 !important; border-radius: 50% !important;
            display: flex !important; align-items: center !important; justify-content: center !important;
        }
        #mr-confirm-modal .mr-icon-wrap svg { fill: #dc2626 !important; }
        #mr-confirm-modal .mr-title { margin: 0 0 14px 0 !important; font-size: 22px !important; font-weight: 700 !important; color: #1a1a1a !important; font-family: inherit !important; }
        #mr-confirm-modal .mr-msg { font-size: 15px !important; color: #555 !important; margin: 0 0 8px 0 !important; line-height: 1.5 !important; font-family: inherit !important; }
        #mr-confirm-modal .mr-msg strong { color: #1a1a1a !important; }
        #mr-confirm-modal .mr-warn { font-size: 13px !important; color: #dc2626 !important; font-weight: 500 !important; margin: 0 0 28px 0 !important; font-family: inherit !important; }
        #mr-confirm-modal .mr-actions { display: flex !important; justify-content: center !important; gap: 12px !important; }
        #mr-confirm-modal .mr-btn-cancel {
            padding: 10px 24px !important; border: none !important; border-radius: 6px !important;
            font-size: 14px !important; font-weight: 500 !important; cursor: pointer !important;
            background: #f0f0f0 !important; color: #555 !important; transition: background 0.2s !important; font-family: inherit !important; box-shadow: none !important;
        }
        #mr-confirm-modal .mr-btn-cancel:hover { background: #e0e0e0 !important; }
        #mr-confirm-modal .mr-btn-delete {
            padding: 10px 24px !important; border: none !important; border-radius: 6px !important;
            font-size: 14px !important; font-weight: 500 !important; cursor: pointer !important;
            background: #dc2626 !important; color: #ffffff !important; transition: background 0.2s !important; font-family: inherit !important; box-shadow: none !important;
        }
        #mr-confirm-modal .mr-btn-delete:hover { background: #b91c1c !important; }
        @media (max-width: 480px) {
            #mr-confirm-modal .mr-actions { flex-direction: column-reverse !important; }
            #mr-confirm-modal .mr-btn-cancel,
            #mr-confirm-modal .mr-btn-delete { width: 100% !important; }
        }
    `;
    document.head.appendChild(styleEl);

    const modalEl = document.createElement('div');
    modalEl.id = 'mr-confirm-modal';
    modalEl.innerHTML = `
        <div class="mr-box">
            <button class="mr-close-btn" onclick="mrCloseDeleteModal()">&times;</button>
            <div class="mr-icon-wrap">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="26" height="26">
                    <path d="M256 512a256 256 0 1 1 0-512 256 256 0 1 1 0 512zm0-192a32 32 0 1 0 0 64 32 32 0 1 0 0-64zm0-192c-18.2 0-32.7 15.5-31.4 33.7l7.4 104c.9 12.6 11.4 22.3 23.9 22.3 12.6 0 23-9.7 23.9-22.3l7.4-104c1.3-18.2-13.1-33.7-31.4-33.7z"/>
                </svg>
            </div>
            <h2 class="mr-title">${title}</h2>
            <p class="mr-msg">Are you sure you want to delete <strong>"${itemName}"</strong>?</p>
            <p class="mr-warn">This action cannot be undone.</p>
            <div class="mr-actions">
                <button type="button" class="mr-btn-cancel" onclick="mrCloseDeleteModal()">Cancel</button>
                <button type="button" class="mr-btn-delete" onclick="mrConfirmAction()">Delete Request</button>
            </div>
        </div>`;

    modalEl.addEventListener('click', e => { if (e.target === modalEl) mrCloseDeleteModal(); });
    document.body.appendChild(modalEl);
    document.body.classList.add('modal-open');
    window.mrConfirmCallback = onConfirm;
}

function mrCloseDeleteModal() {
    document.getElementById('mr-confirm-modal')?.remove();
    document.getElementById('mr-confirm-styles')?.remove();
    if (!document.getElementById('viewRequestModal')?.classList.contains('active')) {
        document.body.classList.remove('modal-open');
    }
    window.mrConfirmCallback = null;
}

function mrConfirmAction() {
    if (window.mrConfirmCallback) window.mrConfirmCallback();
    mrCloseDeleteModal();
}

// ===============================
// STATE
// ===============================

let allRequests      = [];
let filteredRequests = [];
let PAGE_SIZE        = 10;
let currentPage      = 1;

// ===============================
// SORTING
// ===============================

const sortState = { column: null, dir: 'asc' };
const SORT_DATE_COLS = ['created_at', 'date_needed'];

function sortBy(column) {
    if (sortState.column === column) {
        sortState.dir = sortState.dir === 'asc' ? 'desc' : 'asc';
    } else {
        sortState.column = column;
        sortState.dir = 'asc';
    }
    updateSortHeaders();
    currentPage = 1;
    applyFilters();
}

function updateSortHeaders() {
    document.querySelectorAll('.requests-table th[data-col]').forEach(th => {
        th.classList.remove('sort-asc', 'sort-desc', 'sort-active');
        if (th.dataset.col === sortState.column) {
            th.classList.add('sort-active', sortState.dir === 'asc' ? 'sort-asc' : 'sort-desc');
        }
    });
}

function applySorting(list) {
    if (!sortState.column) return list;
    const col    = sortState.column;
    const isDate = SORT_DATE_COLS.includes(col);
    const dir    = sortState.dir === 'asc' ? 1 : -1;
    return [...list].sort((a, b) => {
        let valA = a[col] ?? '';
        let valB = b[col] ?? '';
        if (isDate) {
            valA = valA ? new Date(valA).getTime() : 0;
            valB = valB ? new Date(valB).getTime() : 0;
            return (valA - valB) * dir;
        }
        return valA.toString().toLowerCase().localeCompare(valB.toString().toLowerCase()) * dir;
    });
}

// ===============================
// FILTER DROPDOWN
// ===============================

const FILTER_CONFIG = [
    {
        key:     'status',
        label:   'Status',
        icon:    'fa-circle-half-stroke',
        options: [
            { value: 'pending',      label: 'Pending'      },
            { value: 'in progress',  label: 'In Progress'  },
            { value: 'under review', label: 'Under Review' },
            { value: 'completed',    label: 'Completed'    },
            { value: 'declined',     label: 'Declined'     },
        ],
    },
    {
        key:     'client_type',
        label:   'Client Type',
        icon:    'fa-user-tag',
        options: [], // populated from data
    },
    {
        key:     'date_range',
        label:   'Date Range',
        icon:    'fa-calendar-days',
        options: [], // rendered as date inputs
    },
];

const activeFilters = {
    status:      new Set(),
    client_type: new Set(),
    date_field:  'created_at',
    date_from:   null,
    date_to:     null,
};

function buildFilterDropdown() {
    const wrapper = document.getElementById('filterDropdownWrapper');
    if (!wrapper) return;

    wrapper.innerHTML = `
        <div class="filter-dropdown-toggle" id="filterToggleBtn" onclick="toggleFilterDropdown(event)">
            <i class="fas fa-sliders"></i>
            <span>Filters</span>
            <span class="filter-active-badge" id="filterActiveBadge" style="display:none">0</span>
            <i class="fas fa-chevron-down filter-chevron" id="filterChevron"></i>
        </div>
        <div class="filter-dropdown-panel" id="filterDropdownPanel">
            <div class="filter-panel-inner">
                ${FILTER_CONFIG.map((group, idx) => `
                    ${idx > 0 ? '<div class="filter-group-divider"></div>' : ''}
                    <div class="filter-group" id="filterGroup-${group.key}">
                        <div class="filter-group-header">
                            <i class="fas ${group.icon}"></i>
                            <span>${group.label}</span>
                        </div>
                        <div class="filter-group-options" id="filterOptions-${group.key}">
                            ${group.key === 'date_range' ? renderDateRange() : group.options.map(opt => renderCheckbox(group.key, opt)).join('')}
                        </div>
                    </div>
                `).join('')}
            </div>
            <div class="filter-panel-footer">
                <button class="filter-clear-btn" onclick="clearAllFilters()">
                    <i class="fas fa-rotate-left"></i> Clear all
                </button>
                <button class="filter-apply-btn" onclick="closeFilterDropdown()">Done</button>
            </div>
        </div>`;
}

function renderCheckbox(groupKey, opt) {
    return `
        <label class="filter-checkbox-label">
            <input type="checkbox" class="filter-checkbox" data-group="${groupKey}" value="${opt.value}" onchange="onCheckboxChange(this)">
            <span class="filter-checkbox-custom"></span>
            <span class="filter-checkbox-text">${opt.label}</span>
        </label>`;
}

function renderDateRange() {
    return `
        <div class="filter-date-field-toggle">
            <button class="date-field-btn active" data-field="created_at"  onclick="setDateField(this,'created_at')">Date Submitted</button>
            <button class="date-field-btn"        data-field="date_needed" onclick="setDateField(this,'date_needed')">Review By</button>
        </div>
        <div class="filter-date-inputs">
            <div class="filter-date-row">
                <label class="filter-date-label">From</label>
                <input type="date" id="dateFrom" class="filter-date-input" onchange="onDateChange()" />
            </div>
            <div class="filter-date-row">
                <label class="filter-date-label">To</label>
                <input type="date" id="dateTo" class="filter-date-input" onchange="onDateChange()" />
            </div>
        </div>`;
}

function setDateField(btn, field) {
    activeFilters.date_field = field;
    document.querySelectorAll('.date-field-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    currentPage = 1;
    applyFilters();
}

function onDateChange() {
    const fromVal = document.getElementById('dateFrom')?.value;
    const toVal   = document.getElementById('dateTo')?.value;
    activeFilters.date_from = fromVal ? new Date(fromVal + 'T00:00:00') : null;
    activeFilters.date_to   = toVal   ? new Date(toVal   + 'T23:59:59') : null;
    updateActiveBadge();
    currentPage = 1;
    applyFilters();
}

function populateDynamicFilterOptions() {
    const clientTypes = [...new Set(allRequests.map(r => r.client_type).filter(Boolean))].sort();
    const clientTypeGroup = FILTER_CONFIG.find(g => g.key === 'client_type');
    clientTypeGroup.options = clientTypes.map(v => ({ value: v.toLowerCase(), label: capitalize(v) }));
    const el = document.getElementById('filterOptions-client_type');
    if (el) el.innerHTML = clientTypeGroup.options.map(opt => renderCheckbox('client_type', opt)).join('');
}

function toggleFilterDropdown(e) {
    e.stopPropagation();
    const panel   = document.getElementById('filterDropdownPanel');
    const chevron = document.getElementById('filterChevron');
    const isOpen  = panel.classList.toggle('open');
    chevron.style.transform = isOpen ? 'rotate(180deg)' : '';
}

function closeFilterDropdown() {
    document.getElementById('filterDropdownPanel')?.classList.remove('open');
    const chevron = document.getElementById('filterChevron');
    if (chevron) chevron.style.transform = '';
}

function onCheckboxChange(checkbox) {
    const group = checkbox.dataset.group;
    const val   = checkbox.value;
    if (checkbox.checked) activeFilters[group].add(val);
    else activeFilters[group].delete(val);
    updateActiveBadge();
    currentPage = 1;
    applyFilters();
}

function clearAllFilters() {
    activeFilters.status.clear();
    activeFilters.client_type.clear();
    activeFilters.date_from  = null;
    activeFilters.date_to    = null;
    activeFilters.date_field = 'created_at';
    document.querySelectorAll('.filter-checkbox').forEach(cb => cb.checked = false);
    const dateFrom = document.getElementById('dateFrom');
    const dateTo   = document.getElementById('dateTo');
    if (dateFrom) dateFrom.value = '';
    if (dateTo)   dateTo.value   = '';
    document.querySelectorAll('.date-field-btn').forEach(b => b.classList.remove('active'));
    document.querySelector('.date-field-btn[data-field="created_at"]')?.classList.add('active');
    updateActiveBadge();
    currentPage = 1;
    applyFilters();
}

function updateActiveBadge() {
    const total = activeFilters.status.size + activeFilters.client_type.size
                + (activeFilters.date_from ? 1 : 0) + (activeFilters.date_to ? 1 : 0);
    const badge = document.getElementById('filterActiveBadge');
    if (!badge) return;
    if (total > 0) {
        badge.textContent   = total;
        badge.style.display = 'inline-flex';
        document.getElementById('filterToggleBtn')?.classList.add('has-filters');
    } else {
        badge.style.display = 'none';
        document.getElementById('filterToggleBtn')?.classList.remove('has-filters');
    }
}

// ===============================
// INIT
// ===============================

document.addEventListener('DOMContentLoaded', () => {
    buildFilterDropdown();
    loadRequests();

    const viewModal = document.getElementById('viewRequestModal');
    if (viewModal) {
        viewModal.addEventListener('click', e => { if (e.target === viewModal) closeViewModal(); });
    }

    document.addEventListener('keydown', e => {
        if (e.key === 'Escape') {
            closeFilterDropdown();
            closeViewModal();
            mrCloseDeleteModal();
            closeErrorModal();
            closeSuccessModal();
        }
    });

    document.addEventListener('click', e => {
        const wrapper = document.getElementById('filterDropdownWrapper');
        if (wrapper && !wrapper.contains(e.target)) closeFilterDropdown();
    });

    document.querySelector('.requests-table-container')?.addEventListener('scroll', function () {
        this.classList.toggle('scrolled-end', this.scrollLeft + this.clientWidth >= this.scrollWidth - 10);
    });

    // Search (debounced)
    let debounceTimer;
    document.getElementById('requestSearchInput')?.addEventListener('input', () => {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => { currentPage = 1; applyFilters(); }, 250);
    });

    // Pagination controls
    document.getElementById('firstPageBtn')?.addEventListener('click', () => {
        if (currentPage !== 1) { currentPage = 1; renderPage(); }
    });
    document.getElementById('prevPageBtn')?.addEventListener('click', () => {
        if (currentPage > 1) { currentPage--; renderPage(); }
    });
    document.getElementById('nextPageBtn')?.addEventListener('click', () => {
        if (currentPage < Math.ceil(filteredRequests.length / PAGE_SIZE)) { currentPage++; renderPage(); }
    });
    document.getElementById('lastPageBtn')?.addEventListener('click', () => {
        const totalPages = Math.ceil(filteredRequests.length / PAGE_SIZE);
        if (currentPage !== totalPages) { currentPage = totalPages; renderPage(); }
    });
    document.getElementById('itemsPerPage')?.addEventListener('change', (e) => {
        PAGE_SIZE = parseInt(e.target.value);
        currentPage = 1;
        renderPage();
    });
});

// ===============================
// DATA LOADING
// ===============================

async function loadRequests() {
    try {
        const res = await fetch('/api/manuscript-requests');
        if (!res.ok) throw new Error('Failed to load requests');
        const data = await res.json();
        allRequests = data.requests || [];
        populateDynamicFilterOptions();
        applyFilters();
    } catch (err) {
        console.error(err);
        showErrorModal('Loading Failed', 'Failed to load requests. Please refresh and try again.');
    }
}

// ===============================
// SEARCH + FILTER
// ===============================

function applyFilters() {
    const query = (document.getElementById('requestSearchInput')?.value || '').trim().toLowerCase();

    filteredRequests = allRequests.filter(req => {

        // Status filter
        if (activeFilters.status.size > 0) {
            const normalised = (req.status || '').toLowerCase();
            if (!activeFilters.status.has(normalised)) return false;
        }

        // Client type filter
        if (activeFilters.client_type.size > 0) {
            if (!activeFilters.client_type.has((req.client_type || '').toLowerCase())) return false;
        }

        // Date range filter
        if (activeFilters.date_from || activeFilters.date_to) {
            const raw = req[activeFilters.date_field];
            if (!raw) return false;
            const d = new Date(raw);
            if (activeFilters.date_from && d < activeFilters.date_from) return false;
            if (activeFilters.date_to   && d > activeFilters.date_to)   return false;
        }

        // Full-text search
        if (query) {
            const haystack = [
                req.request_code,
                req.first_name,
                req.surname,
                `${req.first_name} ${req.surname}`,
                req.email,
                req.affiliation,
                req.client_type,
                req.status,
                req.target_publisher,
                req.manuscript_title,
                req.abstract,
            ].filter(Boolean).join(' ').toLowerCase();
            if (!haystack.includes(query)) return false;
        }

        return true;
    });

    filteredRequests = applySorting(filteredRequests);
    renderPage();
}

// ===============================
// PAGINATION + RENDER
// ===============================

function renderPage() {
    const totalPages = Math.max(1, Math.ceil(filteredRequests.length / PAGE_SIZE));
    if (currentPage > totalPages) currentPage = totalPages;
    if (currentPage < 1)         currentPage = 1;

    const start = (currentPage - 1) * PAGE_SIZE;
    populateTable(filteredRequests.slice(start, start + PAGE_SIZE));
    updatePaginationInfo();
    renderPaginationControls(totalPages);
}

function updatePaginationInfo() {
    const total = filteredRequests.length;
    const start = total === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1;
    const end   = Math.min(currentPage * PAGE_SIZE, total);
    const infoEl = document.getElementById('paginationInfo');
    if (infoEl) {
        infoEl.textContent = total === 0
            ? 'Showing 0 to 0 of 0 entries'
            : `Showing ${start} to ${end} of ${total} entries`;
    }
}

function renderPaginationControls(totalPages) {
    const firstBtn = document.getElementById('firstPageBtn');
    const prevBtn  = document.getElementById('prevPageBtn');
    const nextBtn  = document.getElementById('nextPageBtn');
    const lastBtn  = document.getElementById('lastPageBtn');

    if (firstBtn) firstBtn.disabled = currentPage <= 1;
    if (prevBtn)  prevBtn.disabled  = currentPage <= 1;
    if (nextBtn)  nextBtn.disabled  = currentPage >= totalPages || totalPages === 0;
    if (lastBtn)  lastBtn.disabled  = currentPage >= totalPages || totalPages === 0;

    const container = document.getElementById('paginationNumbers');
    if (!container) return;
    container.innerHTML = '';
    if (totalPages <= 1) return;

    getPageRange(currentPage, totalPages).forEach(p => {
        if (p === '…') {
            const span = document.createElement('span');
            span.className   = 'pagination-ellipsis';
            span.textContent = '…';
            container.appendChild(span);
        } else {
            const btn = document.createElement('button');
            btn.className   = 'pagination-number' + (p === currentPage ? ' active' : '');
            btn.textContent = p;
            btn.addEventListener('click', () => { currentPage = p; renderPage(); });
            container.appendChild(btn);
        }
    });
}

function getPageRange(current, total) {
    if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
    const pages  = new Set([1, total, current]);
    if (current > 1)     pages.add(current - 1);
    if (current < total) pages.add(current + 1);
    const sorted = [...pages].sort((a, b) => a - b);
    const result = [];
    for (let i = 0; i < sorted.length; i++) {
        if (i > 0 && sorted[i] - sorted[i - 1] > 1) result.push('…');
        result.push(sorted[i]);
    }
    return result;
}

// ===============================
// TABLE POPULATION
// ===============================

function populateTable(requests) {
    const tbody = document.getElementById('requestsTableBody');
    tbody.innerHTML = '';

    if (requests.length === 0) {
        tbody.innerHTML = `
            <tr class="empty-state-row">
                <td colspan="8">
                    <div class="empty-state-inner">
                        <i class="fas fa-inbox"></i>
                        <span>No requests match your search</span>
                    </div>
                </td>
            </tr>`;
        return;
    }

    requests.forEach(req => {
        const statusClass  = (req.status || 'pending').toLowerCase().replace(/\s+/g, '-');
        const titlePreview = req.manuscript_title
            ? (req.manuscript_title.length > 48
                ? req.manuscript_title.slice(0, 48) + '…'
                : req.manuscript_title)
            : '<span style="color:#a0aec0; font-style:italic;">—</span>';

        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${req.request_code}</td>
            <td>
                <div class="requester-info">
                    <div class="requester-name">${req.first_name} ${req.surname}</div>
                    <div class="requester-office">${req.affiliation}</div>
                </div>
            </td>
            <td>${req.client_type ? capitalize(req.client_type) : 'N/A'}</td>
            <td>${formatDate(req.created_at)}</td>
            <td>${req.date_needed ? formatDate(req.date_needed) : '<span style="color:#a0aec0;">—</span>'}</td>
            <td title="${escapeHtml(req.manuscript_title || '')}">${titlePreview}</td>
            <td><span class="status-badge status-${statusClass}">${formatStatus(req.status)}</span></td>
            <td>
                <div class="action-buttons">
                    <button class="btn-action btn-view"   onclick="viewRequest(${req.id})"                                        title="View / Edit"><i class="fa-solid fa-pen"></i></button>
                    <button class="btn-action btn-delete" onclick="deleteRequest(${req.id}, '${escapeHtml(req.request_code)}')"   title="Delete"><i class="fas fa-trash"></i></button>
                </div>
            </td>`;
        tbody.appendChild(row);
    });
}

// ===============================
// HELPERS
// ===============================

function formatDate(dateStr) {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: '2-digit' });
}

function capitalize(str) {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1);
}

function escapeHtml(str) {
    return String(str || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function formatStatus(status) {
    if (!status) return 'Pending';
    const map = {
        'pending':      'Pending',
        'in progress':  'In Progress',
        'under review': 'Under Review',
        'completed':    'Completed',
        'declined':     'Declined',
    };
    return map[status.toLowerCase()] || status;
}

// ===============================
// VIEW REQUEST MODAL
// ===============================

async function viewRequest(id) {
    try {
        const res = await fetch(`/api/manuscript-requests/${id}`);
        if (!res.ok) throw new Error('Failed to fetch request details');
        const req = (await res.json()).request;
        if (!req) return showErrorModal('Not Found', 'Request not found.');

        // Header
        const modalIdEl       = document.getElementById('modalRequestId');
        modalIdEl.textContent = req.request_code;
        modalIdEl.dataset.id  = req.id;
        document.getElementById('modalSubmittedDate').textContent = formatDate(req.created_at);

        // Info rows
        document.getElementById('modalName').textContent       = `${req.first_name} ${req.surname}`;
        document.getElementById('modalEmail').textContent      = req.email;
        document.getElementById('modalOffice').textContent     = req.affiliation;
        document.getElementById('modalClientType').textContent = capitalize(req.client_type || '');
        document.getElementById('modalDateNeeded').textContent = req.date_needed ? formatDate(req.date_needed) : '—';
        document.getElementById('modalTargetPublisher').textContent     = req.target_publisher;
        document.getElementById('reviewedFileUrl').value = req.reviewed_file_url || '';

        const statusBadge       = document.getElementById('modalStatus');
        statusBadge.textContent = formatStatus(req.status);
        statusBadge.className   = `status-badge status-${(req.status || 'pending').toLowerCase().replace(/\s+/g, '-')}`;

        // Status select — sync with current value
        const statusSelect = document.getElementById('statusSelect');
        const matchingOption = [...statusSelect.options].find(
            o => o.value.toLowerCase() === (req.status || '').toLowerCase()
        );
        statusSelect.value = matchingOption ? matchingOption.value : 'Pending';

        // Admin notes
        document.getElementById('adminNotes').value = req.admin_notes || '';

        // Manuscript details
        document.getElementById('modalTitle').textContent    = req.manuscript_title || '—';
        document.getElementById('modalAbstract').textContent = req.abstract          || '—';

        // Document buttons
        const btnFile = document.getElementById('btnManuscriptFile');
        const btnLink = document.getElementById('btnFileLink');

        if (req.manuscript_file_path) {
            btnFile.style.display = 'flex';
            btnFile.onclick = () => window.open(req.manuscript_file_path, '_blank');
        } else {
            btnFile.style.display = 'none';
        }

        if (req.file_link) {
            btnLink.style.display = 'flex';
            btnLink.onclick = () => window.open(req.file_link, '_blank');
        } else {
            btnLink.style.display = 'none';
        }

        mrResetModalTabs();
        openViewModal();
    } catch (err) {
        console.error(err);
        showErrorModal('Load Failed', 'Failed to load request details.');
    }
}

function openViewModal() {
    document.getElementById('viewRequestModal')?.classList.add('active');
    document.body.classList.add('modal-open');
}

function closeViewModal() {
    document.getElementById('viewRequestModal')?.classList.remove('active');
    document.body.classList.remove('modal-open');
}

// ===============================
// SAVE / DELETE
// ===============================

async function saveRequestUpdates() {
    const id             = document.getElementById('modalRequestId').dataset.id;
    const status         = document.getElementById('statusSelect').value;
    const notes          = document.getElementById('adminNotes').value.trim();
    const reviewedFileUrl = document.getElementById('reviewedFileUrl').value.trim();

    if (!status) return showErrorModal('Missing Status', 'Please select a status.');

    try {
        const res = await fetch(`/api/manuscript-requests/${id}`, {
            method:  'PUT',
            headers: { 'Content-Type': 'application/json' },
            body:    JSON.stringify({
                status,
                admin_notes:        notes,
                reviewed_file_url:  reviewedFileUrl || null
            }),
        });
        if (!res.ok) throw new Error('Failed to update');

        // Update local state so table refreshes correctly
        const record = allRequests.find(r => r.id == id);
        if (record) {
            record.status             = status;
            record.admin_notes        = notes;
            record.reviewed_file_url  = reviewedFileUrl || null;
        }

        showSuccessModal('Saved', 'Manuscript request updated successfully!');
        applyFilters();
        closeViewModal();
    } catch (err) {
        console.error(err);
        showErrorModal('Save Failed', 'Failed to save updates. Please try again.');
    }
}

function deleteRequest(id, requestCode) {
    mrShowDeleteModal('Delete Request?', requestCode, async () => {
        try {
            const res = await fetch(`/api/manuscript-requests/${id}`, { method: 'DELETE' });
            if (!res.ok) throw new Error('Delete failed');
            allRequests = allRequests.filter(r => r.id != id);
            showSuccessModal('Deleted', 'Manuscript request deleted successfully.');
            applyFilters();
        } catch (err) {
            console.error(err);
            showErrorModal('Delete Failed', 'Failed to delete request.');
        }
    });
}

// ===============================
// EXPORT TO CSV
// ===============================

function exportToCSV() {
    if (filteredRequests.length === 0) {
        showErrorModal('Nothing to Export', 'No requests match the current filters.');
        return;
    }

    const columns = [
        { key: 'request_code',     label: 'Request ID'       },
        { key: 'first_name',       label: 'First Name'       },
        { key: 'surname',          label: 'Surname'          },
        { key: 'email',            label: 'Email'            },
        { key: 'affiliation',      label: 'Office'           },
        { key: 'client_type',      label: 'Client Type'      },
        { key: 'created_at',       label: 'Date Submitted'   },
        { key: 'date_needed',      label: 'Review By'        },
        { key: 'target_publisher', label: 'Target Publisher' },
        { key: 'manuscript_title', label: 'Manuscript Title' },
        { key: 'abstract',         label: 'Abstract'         },
        { key: 'file_link',        label: 'File Link'        },
        { key: 'status',           label: 'Status'           },
        { key: 'admin_notes',      label: 'Admin Notes'      },
    ];

    function escapeCell(val) {
        const str = (val === null || val === undefined) ? '' : String(val);
        if (str.includes(',') || str.includes('"') || str.includes('\n')) {
            return '"' + str.replace(/"/g, '""') + '"';
        }
        return str;
    }

    const header   = columns.map(c => escapeCell(c.label)).join(',');
    const dataRows = filteredRequests.map(req =>
        columns.map(col => {
            let val = req[col.key] ?? '';
            if ((col.key === 'created_at' || col.key === 'date_needed') && val) val = formatDate(val);
            if (col.key === 'client_type' && val) val = capitalize(val);
            if (col.key === 'status'      && val) val = formatStatus(val);
            return escapeCell(val);
        }).join(',')
    );

    const csvContent = [header, ...dataRows].join('\n');
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');

    const isFiltered = (
        activeFilters.status.size > 0 ||
        activeFilters.client_type.size > 0 ||
        activeFilters.date_from ||
        activeFilters.date_to ||
        (document.getElementById('requestSearchInput')?.value || '').trim()
    );

    const timestamp = new Date().toISOString().slice(0, 10);
    const filename  = isFiltered
        ? `manuscript-requests-filtered-${timestamp}.csv`
        : `manuscript-requests-${timestamp}.csv`;

    a.href     = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    showSuccessModal(
        'Export Successful',
        `${filteredRequests.length} record${filteredRequests.length !== 1 ? 's' : ''} exported to <strong>${filename}</strong>.`
    );
}

function mrSwitchTab(btn, tabId) {
    document.querySelectorAll('.mr-tab-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.mr-tab-pane').forEach(p => p.classList.remove('active'));

    btn.classList.add('active');
    document.getElementById('mr-tab-' + tabId)?.classList.add('active');

    if (tabId === 'documents') {
        const hasFile = document.getElementById('btnManuscriptFile')?.style.display !== 'none';
        const hasLink = document.getElementById('btnFileLink')?.style.display !== 'none';
        const placeholder = document.getElementById('mr-docs-placeholder');
        if (placeholder) placeholder.style.display = (hasFile || hasLink) ? 'none' : 'flex';
    }
}

function mrResetModalTabs() {
    const overviewBtn = document.querySelector('.mr-tab-btn[data-tab="overview"]');
    if (overviewBtn) mrSwitchTab(overviewBtn, 'overview');
}