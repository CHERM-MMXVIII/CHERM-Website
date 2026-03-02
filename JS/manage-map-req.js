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

function mapreqShowDeleteModal(title, itemName, onConfirm) {
    // Remove any existing instance
    document.getElementById('mapreq-confirm-modal')?.remove();
    document.getElementById('mapreq-confirm-styles')?.remove();

    // Inject scoped styles with unique ID — overrides everything
    const styleEl = document.createElement('style');
    styleEl.id = 'mapreq-confirm-styles';
    styleEl.textContent = `
        #mapreq-confirm-modal {
            position: fixed !important;
            inset: 0 !important;
            background: rgba(0,0,0,0.70) !important;
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
            z-index: 99999 !important;
            animation: mapreqFadeIn 0.2s ease !important;
        }
        @keyframes mapreqFadeIn {
            from { opacity: 0; }
            to   { opacity: 1; }
        }
        #mapreq-confirm-modal .mapreq-box {
            background: #ffffff !important;
            border-radius: 12px !important;
            padding: 32px !important;
            max-width: 450px !important;
            width: 90% !important;
            text-align: center !important;
            position: relative !important;
            box-shadow: 0 20px 60px rgba(0,0,0,0.3) !important;
            animation: mapreqSlideUp 0.3s ease !important;
            /* Reset anything Bootstrap might inject */
            display: block !important;
            flex-direction: unset !important;
        }
        @keyframes mapreqSlideUp {
            from { transform: translateY(30px); opacity: 0; }
            to   { transform: translateY(0);    opacity: 1; }
        }
        #mapreq-confirm-modal .mapreq-close-btn {
            position: absolute !important;
            top: 14px !important;
            right: 16px !important;
            background: none !important;
            border: none !important;
            font-size: 30px !important;
            color: #999 !important;
            cursor: pointer !important;
            line-height: 1 !important;
            padding: 2px 6px !important;
            box-shadow: none !important;
            transition: color 0.2s !important;
        }
        #mapreq-confirm-modal .mapreq-close-btn:hover {
            color: #333 !important;
        }
        #mapreq-confirm-modal .mapreq-icon-wrap {
            margin: 0 auto 20px !important;
            width: 56px !important;
            height: 56px !important;
            background: #fee2e2 !important;
            border-radius: 50% !important;
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
        }
        #mapreq-confirm-modal .mapreq-icon-wrap svg {
            fill: #dc2626 !important;
        }
        #mapreq-confirm-modal .mapreq-title {
            margin: 0 0 14px 0 !important;
            font-size: 22px !important;
            font-weight: 700 !important;
            color: #1a1a1a !important;
            font-family: inherit !important;
        }
        #mapreq-confirm-modal .mapreq-msg {
            font-size: 15px !important;
            color: #555 !important;
            margin: 0 0 8px 0 !important;
            line-height: 1.5 !important;
            font-family: inherit !important;
        }
        #mapreq-confirm-modal .mapreq-msg strong {
            color: #1a1a1a !important;
        }
        #mapreq-confirm-modal .mapreq-warn {
            font-size: 13px !important;
            color: #dc2626 !important;
            font-weight: 500 !important;
            margin: 0 0 28px 0 !important;
            font-family: inherit !important;
        }
        #mapreq-confirm-modal .mapreq-actions {
            display: flex !important;
            justify-content: center !important;
            gap: 12px !important;
        }
        #mapreq-confirm-modal .mapreq-btn-cancel {
            padding: 10px 24px !important;
            border: none !important;
            border-radius: 6px !important;
            font-size: 14px !important;
            font-weight: 500 !important;
            cursor: pointer !important;
            background: #f0f0f0 !important;
            color: #555 !important;
            transition: background 0.2s !important;
            font-family: inherit !important;
            box-shadow: none !important;
        }
        #mapreq-confirm-modal .mapreq-btn-cancel:hover {
            background: #e0e0e0 !important;
        }
        #mapreq-confirm-modal .mapreq-btn-delete {
            padding: 10px 24px !important;
            border: none !important;
            border-radius: 6px !important;
            font-size: 14px !important;
            font-weight: 500 !important;
            cursor: pointer !important;
            background: #dc2626 !important;
            color: #ffffff !important;
            transition: background 0.2s !important;
            font-family: inherit !important;
            box-shadow: none !important;
        }
        #mapreq-confirm-modal .mapreq-btn-delete:hover {
            background: #b91c1c !important;
        }
        #mapreq-confirm-modal .mapreq-btn-delete:disabled {
            background: #fca5a5 !important;
            cursor: not-allowed !important;
        }
        @media (max-width: 480px) {
            #mapreq-confirm-modal .mapreq-actions {
                flex-direction: column-reverse !important;
            }
            #mapreq-confirm-modal .mapreq-btn-cancel,
            #mapreq-confirm-modal .mapreq-btn-delete {
                width: 100% !important;
            }
        }
    `;
    document.head.appendChild(styleEl);

    const modalEl = document.createElement('div');
    modalEl.id = 'mapreq-confirm-modal';
    modalEl.innerHTML = `
        <div class="mapreq-box">
            <button class="mapreq-close-btn" onclick="mapreqCloseDeleteModal()">&times;</button>

            <div class="mapreq-icon-wrap">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="26" height="26">
                    <path d="M256 512a256 256 0 1 1 0-512 256 256 0 1 1 0 512zm0-192a32 32 0 1 0 0 64 32 32 0 1 0 0-64zm0-192c-18.2 0-32.7 15.5-31.4 33.7l7.4 104c.9 12.6 11.4 22.3 23.9 22.3 12.6 0 23-9.7 23.9-22.3l7.4-104c1.3-18.2-13.1-33.7-31.4-33.7z"/>
                </svg>
            </div>

            <h2 class="mapreq-title">${title}</h2>

            <p class="mapreq-msg">
                Are you sure you want to delete <strong>"${itemName}"</strong>?
            </p>
            <p class="mapreq-warn">This action cannot be undone.</p>

            <div class="mapreq-actions">
                <button type="button" class="mapreq-btn-cancel" onclick="mapreqCloseDeleteModal()">Cancel</button>
                <button type="button" class="mapreq-btn-delete" onclick="mapreqConfirmAction()">Delete Request</button>
            </div>
        </div>
    `;

    // Close on backdrop click
    modalEl.addEventListener('click', e => {
        if (e.target === modalEl) mapreqCloseDeleteModal();
    });

    document.body.appendChild(modalEl);
    document.body.classList.add('modal-open');
    window.confirmModalCallback = onConfirm;
}

function mapreqCloseDeleteModal() {
    document.getElementById('mapreq-confirm-modal')?.remove();
    document.getElementById('mapreq-confirm-styles')?.remove();
    if (!document.getElementById('viewRequestModal')?.classList.contains('active')) {
        document.body.classList.remove('modal-open');
    }
    window.confirmModalCallback = null;
}

function mapreqConfirmAction() {
    if (window.confirmModalCallback) window.confirmModalCallback();
    mapreqCloseDeleteModal();
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

const sortState = {
    column: null,   // active column key
    dir:    'asc',  // 'asc' | 'desc'
};

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

        // String sort
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
            { value: 'pending',     label: 'Pending'     },
            { value: 'in-progress', label: 'In Progress' },
            { value: 'completed',   label: 'Completed'   },
            { value: 'rejected',    label: 'Rejected'    },
            { value: 'terminated',  label: 'Terminated'  },
        ],
    },
    {
        key:     'map_type',
        label:   'Map Type',
        icon:    'fa-map',
        options: [
            { value: 'topographic', label: 'Topographic' },
            { value: 'hazard',      label: 'Hazard'      },
            { value: 'land-use',    label: 'Land Use'    },
            { value: 'thematic',    label: 'Thematic'    },
            { value: 'other',       label: 'Other'       },
        ],
    },
    {
        key:     'client_type',
        label:   'Client Type',
        icon:    'fa-user-tag',
        options: [], // populated dynamically from data
    },
    {
        key:     'date_range',
        label:   'Date Range',
        icon:    'fa-calendar-days',
        options: [], // rendered as date inputs, not checkboxes
    },
];

// Tracks active checkbox selections and date range
const activeFilters = {
    status:      new Set(),
    map_type:    new Set(),
    client_type: new Set(),
    date_field:  'created_at', // 'created_at' or 'date_needed'
    date_from:   null,
    date_to:     null,
};

/** Build the filter dropdown HTML and inject it into #filterDropdownWrapper */
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
                ${FILTER_CONFIG.map(group => `
                    <div class="filter-group" id="filterGroup-${group.key}">
                        <div class="filter-group-header">
                            <i class="fas ${group.icon}"></i>
                            <span>${group.label}</span>
                        </div>
                        <div class="filter-group-options" id="filterOptions-${group.key}">
                            ${group.key === 'date_range' ? renderDateRange() : group.options.map(opt => renderCheckbox(group.key, opt)).join('')}
                        </div>
                    </div>
                `).join('<div class="filter-group-divider"></div>')}
            </div>

            <div class="filter-panel-footer">
                <button class="filter-clear-btn" onclick="clearAllFilters()">
                    <i class="fas fa-rotate-left"></i> Clear all
                </button>
                <button class="filter-apply-btn" onclick="closeFilterDropdown()">
                    Done
                </button>
            </div>
        </div>
    `;
}

function renderCheckbox(groupKey, opt) {
    return `
        <label class="filter-checkbox-label">
            <input
                type="checkbox"
                class="filter-checkbox"
                data-group="${groupKey}"
                value="${opt.value}"
                onchange="onCheckboxChange(this)"
            >
            <span class="filter-checkbox-custom"></span>
            <span class="filter-checkbox-text">${opt.label}</span>
        </label>`;
}

function renderDateRange() {
    return `
        <div class="filter-date-field-toggle">
            <button class="date-field-btn active" data-field="created_at"  onclick="setDateField(this, 'created_at')">Date Created</button>
            <button class="date-field-btn"        data-field="date_needed" onclick="setDateField(this, 'date_needed')">Date Needed</button>
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

/** Populate dynamic options for client_type from loaded data */
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
    if (checkbox.checked) {
        activeFilters[group].add(val);
    } else {
        activeFilters[group].delete(val);
    }
    updateActiveBadge();
    currentPage = 1;
    applyFilters();
}

function clearAllFilters() {
    activeFilters.status.clear();
    activeFilters.map_type.clear();
    activeFilters.client_type.clear();
    activeFilters.date_from  = null;
    activeFilters.date_to    = null;
    activeFilters.date_field = 'created_at';
    document.querySelectorAll('.filter-checkbox').forEach(cb => cb.checked = false);
    const dateFrom = document.getElementById('dateFrom');
    const dateTo   = document.getElementById('dateTo');
    if (dateFrom) dateFrom.value = '';
    if (dateTo)   dateTo.value   = '';
    // Reset field toggle buttons
    document.querySelectorAll('.date-field-btn').forEach(b => b.classList.remove('active'));
    document.querySelector('.date-field-btn[data-field="created_at"]')?.classList.add('active');
    updateActiveBadge();
    currentPage = 1;
    applyFilters();
}

function updateActiveBadge() {
    const checkboxTotal = activeFilters.status.size + activeFilters.map_type.size + activeFilters.client_type.size;
    const dateTotal     = (activeFilters.date_from ? 1 : 0) + (activeFilters.date_to ? 1 : 0);
    const total         = checkboxTotal + dateTotal;
    const badge = document.getElementById('filterActiveBadge');
    if (!badge) return;
    if (total > 0) {
        badge.textContent    = total;
        badge.style.display  = 'inline-flex';
        document.getElementById('filterToggleBtn')?.classList.add('has-filters');
    } else {
        badge.style.display  = 'none';
        document.getElementById('filterToggleBtn')?.classList.remove('has-filters');
    }
}

// ===============================
// INIT
// ===============================

document.addEventListener('DOMContentLoaded', () => {
    buildFilterDropdown();
    loadRequests();

    // Close view modal on backdrop click
    const viewModal = document.getElementById('viewRequestModal');
    if (viewModal) {
        viewModal.addEventListener('click', e => {
            if (e.target === viewModal) closeViewModal();
        });
    }

    // Escape key closes any open modal or dropdown
    document.addEventListener('keydown', e => {
        if (e.key === 'Escape') {
            closeFilterDropdown();
            closeViewModal();
            mapreqCloseDeleteModal();
            closeErrorModal();
            closeSuccessModal();
        }
    });

    // Click outside closes filter dropdown
    document.addEventListener('click', e => {
        const wrapper = document.getElementById('filterDropdownWrapper');
        if (wrapper && !wrapper.contains(e.target)) closeFilterDropdown();
    });

    // Scroll indicator on mobile
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
        const res = await fetch('/api/map-requests');
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
            const normalised = req.status.toLowerCase().replace(/\s+/g, '-');
            if (!activeFilters.status.has(normalised)) return false;
        }

        // Map type filter
        if (activeFilters.map_type.size > 0) {
            const standardTypes = ['topographic', 'hazard', 'land-use', 'thematic'];
            const reqMapType = (req.map_type || '').toLowerCase();
            
            if (activeFilters.map_type.has('other')) {
                // If "Other" is selected, show requests where mapType is NOT a standard type
                if (standardTypes.includes(reqMapType)) return false;
            } else {
                // Standard filter for named types
                if (!activeFilters.map_type.has(reqMapType)) return false;
            }
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
                req.map_type,
                req.affiliation,
                req.client_type,
                req.status,
                req.area_of_interest,
                req.purpose,
            ].join(' ').toLowerCase();
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
            <td>${formatDate(req.date_needed)}</td>
            <td>${req.map_type}</td>
            <td><span class="status-badge status-${req.status.toLowerCase().replace(/\s+/g, '-')}">${formatStatus(req.status)}</span></td>
            <td>
                <div class="action-buttons">
                    <button class="btn-action btn-view"   onclick="viewRequest(${req.id})"                            title="View"><i class="fa-solid fa-pen"></i></button>
                    <button class="btn-action btn-delete" onclick="deleteRequest(${req.id}, '${req.request_code}')"   title="Delete"><i class="fas fa-trash"></i></button>
                </div>
            </td>`;
        tbody.appendChild(row);
    });
}

// ===============================
// HELPERS
// ===============================

function formatDate(dateStr) {
    return new Date(dateStr).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: '2-digit' });
}

function capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

function formatStatus(status) {
    const map = { 'Pending': 'Pending', 'In-progress': 'In Progress', 'Completed': 'Completed', 'Rejected': 'Rejected', 'Terminated': 'Terminated' };
    return map[status] || status;
}

// ===============================
// VIEW REQUEST MODAL
// ===============================

async function viewRequest(id) {
    try {
        const res = await fetch(`/api/map-requests/${id}`);
        if (!res.ok) throw new Error('Failed to fetch request details');
        const req = (await res.json()).request;
        if (!req) return showErrorModal('Not Found', 'Request not found.');

        const modalIdEl         = document.getElementById('modalRequestId');
        modalIdEl.textContent   = req.request_code;
        modalIdEl.dataset.id    = req.id;

        document.getElementById('modalSubmittedDate').textContent  = formatDate(req.created_at);
        document.getElementById('modalName').textContent           = `${req.first_name} ${req.surname}`;
        document.getElementById('modalEmail').textContent          = req.email;
        document.getElementById('modalOffice').textContent         = req.affiliation;
        document.getElementById('modalDate').textContent           = formatDate(req.date_needed);
        document.getElementById('modalMapType').textContent        = req.map_type;
        document.getElementById('modalPurpose').textContent        = req.purpose;
        document.getElementById('modalAreaOfInterest').textContent = req.area_of_interest;
        document.getElementById('modalSize').textContent           = req.map_size;
        document.getElementById('modalQuantity').textContent       = req.quantity;

        const statusBadge       = document.getElementById('modalStatus');
        statusBadge.textContent = formatStatus(req.status);
        statusBadge.className   = `status-badge status-${req.status.toLowerCase().replace(/\s+/g, '-')}`;
        document.getElementById('statusSelect').value = req.status.toLowerCase();

        const letterBtn    = document.querySelector('.btn-document:nth-child(1)');
        const signatureBtn = document.querySelector('.btn-document:nth-child(2)');
        const initialDataBtn = document.querySelector('.btn-document:nth-child(3)');
        letterBtn.style.display    = req.request_letter_url ? 'flex' : 'none';
        signatureBtn.style.display = req.signature_url      ? 'flex' : 'none';
        initialDataBtn.style.display = req.initial_data_url      ? 'flex' : 'none';
        if (req.request_letter_url) letterBtn.onclick    = () => window.open(req.request_letter_url, '_blank');
        if (req.signature_url)      signatureBtn.onclick = () => window.open(req.signature_url, '_blank');
        if (req.initial_data_url)      initialDataBtn.onclick = () => window.open(req.initial_data_url, '_blank');

        const mapPreview   = document.getElementById('mapPreview');
        const mapContainer = document.getElementById('mapPreviewContainer');
        if (req.map_file_url) {
            mapPreview.src             = req.map_file_url;
            mapContainer.style.display = 'block';
        } else {
            mapPreview.src             = '';
            mapContainer.style.display = 'none';
        }

        await loadUploadHistory(req.id);
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
    removeMapUpload();
}

// ===============================
// SAVE / DELETE
// ===============================

async function saveRequestUpdates() {
    const id      = document.getElementById('modalRequestId').dataset.id;
    const status  = document.getElementById('statusSelect').value;
    const mapFile = document.getElementById('mapProgressUpload').files[0];

    if (!status) return showErrorModal('Missing Status', 'Please select a status.');

    try {
        const res = await fetch(`/api/map-requests/${id}`, {
            method:  'PUT',
            headers: { 'Content-Type': 'application/json' },
            body:    JSON.stringify({ status }),
        });
        if (!res.ok) throw new Error('Failed to update status');

        if (mapFile) {
            const formData = new FormData();
            formData.append('mapFile', mapFile);
            const uploadRes = await fetch(`/api/map-requests/${id}/upload`, { method: 'POST', body: formData });
            if (!uploadRes.ok) throw new Error('Failed to upload file');
        }

        const record = allRequests.find(r => r.id == id);
        if (record) record.status = capitalize(status);

        showSuccessModal('Saved', 'Request updated successfully!');
        applyFilters();
        closeViewModal();
    } catch (err) {
        console.error(err);
        showErrorModal('Save Failed', 'Failed to save updates.');
    }
}

function deleteRequest(id, requestCode) {
    mapreqShowDeleteModal('Delete Request?', requestCode, async () => {
        try {
            const res = await fetch(`/api/map-requests/${id}`, { method: 'DELETE' });
            if (!res.ok) throw new Error('Delete failed');
            allRequests = allRequests.filter(r => r.id != id);
            showSuccessModal('Deleted', 'Request deleted successfully.');
            applyFilters();
        } catch (err) {
            console.error(err);
            showErrorModal('Delete Failed', 'Failed to delete request.');
        }
    });
}

// ===============================
// MAP FILE PREVIEW
// ===============================

function handleMapUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    if (file.size > 20 * 1024 * 1024) {
        showErrorModal('File Too Large', 'File must be under 20 MB.');
        event.target.value = '';
        return;
    }

    const validTypes = ['image/png', 'image/jpeg', 'image/jpg', 'application/pdf'];
    if (!validTypes.includes(file.type)) {
        showErrorModal('Invalid File', 'Please upload a PNG, JPG, or PDF file.');
        event.target.value = '';
        return;
    }

    const preview   = document.getElementById('mapPreview');
    const container = document.getElementById('mapPreviewContainer');

    if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = e => { preview.src = e.target.result; container.style.display = 'block'; };
        reader.readAsDataURL(file);
    } else {
        preview.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200"%3E%3Crect fill="%23f8f9fa" width="200" height="200"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" fill="%236c757d" font-family="Arial" font-size="16"%3EPDF Uploaded%3C/text%3E%3C/svg%3E';
        container.style.display = 'block';
    }
}

function removeMapUpload() {
    const input = document.getElementById('mapProgressUpload');
    if (input) input.value = '';
    const container = document.getElementById('mapPreviewContainer');
    if (container) container.style.display = 'none';
    const preview = document.getElementById('mapPreview');
    if (preview) preview.src = '';
}

// ===============================
// UPLOAD HISTORY
// ===============================

let lightboxImages = [];
let lightboxIndex  = 0;

async function loadUploadHistory(requestId) {
    const grid = document.getElementById('uploadHistoryGrid');
    if (!grid) return;

    grid.innerHTML = `
        <div class="upload-history-loading">
            <i class="fas fa-spinner fa-spin"></i>
            <span>Loading history…</span>
        </div>`;

    try {
        const res = await fetch(`/api/map-requests/${requestId}/uploads`);
        if (!res.ok) throw new Error('Failed to fetch upload history');
        const data = await res.json();
        const uploads = data.uploads || [];

        if (uploads.length === 0) {
            grid.innerHTML = `
                <div class="upload-history-empty">
                    <i class="fas fa-images"></i>
                    <span>No uploads yet</span>
                </div>`;
            return;
        }

        // Build image list for lightbox
        lightboxImages = uploads.map(u => ({
            url:       u.file_url,
            label:     u.file_name || 'Uploaded file',
            uploadedAt: u.uploaded_at ? formatDate(u.uploaded_at) : '',
        }));

        grid.innerHTML = uploads.map((u, i) => {
            const isPdf = (u.file_url || '').toLowerCase().includes('.pdf')
                       || (u.file_name || '').toLowerCase().endsWith('.pdf');
            const thumb = isPdf
                ? `<div class="history-thumb-pdf"><i class="fas fa-file-pdf"></i></div>`
                : `<img src="${u.file_url}" alt="Upload ${i + 1}" loading="lazy">`;

            return `
                <div class="history-thumb" onclick="openLightbox(${i})" title="${u.file_name || ''}">
                    ${thumb}
                    <div class="history-thumb-overlay">
                        <i class="fas fa-expand-alt"></i>
                    </div>
                    <div class="history-thumb-date">${u.uploaded_at ? formatDate(u.uploaded_at) : ''}</div>
                </div>`;
        }).join('');

    } catch (err) {
        console.error(err);
        grid.innerHTML = `
            <div class="upload-history-empty error">
                <i class="fas fa-exclamation-circle"></i>
                <span>Failed to load history</span>
            </div>`;
    }
}

function openLightbox(index) {
    if (!lightboxImages.length) return;
    lightboxIndex = index;
    renderLightboxSlide();
    document.getElementById('imgLightbox').classList.add('active');
    document.body.classList.add('modal-open');
}

function closeLightbox() {
    document.getElementById('imgLightbox').classList.remove('active');
    // Don't remove modal-open — the view modal may still be open
}

function lightboxNav(e, dir) {
    e.stopPropagation();
    lightboxIndex = (lightboxIndex + dir + lightboxImages.length) % lightboxImages.length;
    renderLightboxSlide();
}

function renderLightboxSlide() {
    const item = lightboxImages[lightboxIndex];
    const img  = document.getElementById('lightboxImg');
    const meta = document.getElementById('lightboxMeta');
    const prev = document.getElementById('lightboxPrev');
    const next = document.getElementById('lightboxNext');

    const isPdf = (item.url || '').toLowerCase().includes('.pdf');

    if (isPdf) {
        img.style.display = 'none';
        meta.innerHTML = `
            <div class="lightbox-pdf-placeholder">
                <i class="fas fa-file-pdf"></i>
                <span>${item.label}</span>
                <a href="${item.url}" target="_blank" class="lightbox-open-link">
                    <i class="fas fa-external-link-alt"></i> Open PDF
                </a>
            </div>`;
    } else {
        img.style.display = 'block';
        img.src = item.url;
        meta.innerHTML = `
            <span class="lightbox-filename">${item.label}</span>
            <span class="lightbox-date">${item.uploadedAt}</span>
            <span class="lightbox-counter">${lightboxIndex + 1} / ${lightboxImages.length}</span>`;
    }

    prev.style.display = lightboxImages.length > 1 ? 'flex' : 'none';
    next.style.display = lightboxImages.length > 1 ? 'flex' : 'none';
}

// Keyboard nav for lightbox
document.addEventListener('keydown', e => {
    const lb = document.getElementById('imgLightbox');
    if (!lb?.classList.contains('active')) return;
    if (e.key === 'ArrowLeft')  { lightboxNav(e, -1); }
    if (e.key === 'ArrowRight') { lightboxNav(e,  1); }
    if (e.key === 'Escape')     { closeLightbox(); }
});

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
        { key: 'created_at',       label: 'Date Created'     },
        { key: 'date_needed',      label: 'Date Needed'      },
        { key: 'map_type',         label: 'Map Type'         },
        { key: 'map_size',         label: 'Map Size'         },
        { key: 'quantity',         label: 'Quantity'         },
        { key: 'area_of_interest', label: 'Area of Interest' },
        { key: 'purpose',          label: 'Purpose'          },
        { key: 'status',           label: 'Status'           },
    ];

    function escapeCell(val) {
        const str = (val === null || val === undefined) ? '' : String(val);
        if (str.includes(',') || str.includes('"') || str.includes('\n')) {
            return '"' + str.replace(/"/g, '""') + '"';
        }
        return str;
    }

    const header = columns.map(c => escapeCell(c.label)).join(',');

    const dataRows = filteredRequests.map(req => {
        return columns.map(col => {
            let val = req[col.key] ?? '';
            if ((col.key === 'created_at' || col.key === 'date_needed') && val) val = formatDate(val);
            if (col.key === 'client_type' && val) val = capitalize(val);
            if (col.key === 'status' && val)      val = formatStatus(val);
            return escapeCell(val);
        }).join(',');
    });

    const csvContent = [header, ...dataRows].join('\n');

    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');

    const isFiltered = (
        activeFilters.status.size > 0 ||
        activeFilters.map_type.size > 0 ||
        activeFilters.client_type.size > 0 ||
        activeFilters.date_from ||
        activeFilters.date_to ||
        (document.getElementById('requestSearchInput')?.value || '').trim()
    );

    const timestamp = new Date().toISOString().slice(0, 10);
    const filename  = isFiltered
        ? `map-requests-filtered-${timestamp}.csv`
        : `map-requests-${timestamp}.csv`;

    a.href     = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    showSuccessModal('Export Successful', `${filteredRequests.length} record${filteredRequests.length !== 1 ? 's' : ''} exported to <strong>${filename}</strong>.`);
}