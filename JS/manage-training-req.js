/**
 * manage-training-req.js
 * Handles fetching, rendering, filtering, sorting, pagination,
 * and CRUD actions for the Training Requests admin table.
 *
 * DB Table: training_requests
 * Columns: id, request_code, client_type, email,
 *          surname, first_name, affiliation,
 *          request_letter_path, status, created_at
 */

'use strict';

/* ================================================
   STATE
   ================================================ */

const State = {
    allRequests: [],       // raw data from server
    filtered:   [],        // after search + filter
    sortCol:    'created_at',
    sortDir:    'desc',    // 'asc' | 'desc'
    page:       1,
    perPage:    10,
    activeFilters: {
        clientType: [],
        status:     [],
        dateFrom:   '',
        dateTo:     '',
        dateField:  'created_at', // 'created_at'
    },
    currentRequestId: null, // id of request open in modal
};

/* ================================================
   INIT
   ================================================ */

document.addEventListener('DOMContentLoaded', () => {
    fetchRequests();
    buildFilterDropdown();
    bindSearch();
    bindPagination();
});

/* ================================================
   FETCH DATA
   ================================================ */

async function fetchRequests() {
    try {
        const res  = await fetch('/api/training-requests');
        if (!res.ok) throw new Error('Network response was not ok');
        const data = await res.json();
        State.allRequests = data;
        applyFiltersAndRender();
    } catch (err) {
        console.error('Failed to fetch training requests:', err);
        renderTableBody([]);
    }
}

/* ================================================
   SEARCH
   ================================================ */

function bindSearch() {
    const input = document.getElementById('requestSearchInput');
    if (!input) return;
    input.addEventListener('input', () => {
        State.page = 1;
        applyFiltersAndRender();
    });
}

function getSearchTerm() {
    const input = document.getElementById('requestSearchInput');
    return input ? input.value.trim().toLowerCase() : '';
}

/* ================================================
   FILTER + SORT PIPELINE
   ================================================ */

function applyFiltersAndRender() {
    const term = getSearchTerm();
    const { clientType, status, dateFrom, dateTo, dateField } = State.activeFilters;

    let data = State.allRequests.filter(r => {
        // Text search
        if (term) {
            const haystack = [
                r.request_code,
                r.surname,
                r.first_name,
                r.email,
                r.affiliation,
                r.client_type,
                r.status,
            ].join(' ').toLowerCase();
            if (!haystack.includes(term)) return false;
        }

        // Client type filter
        if (clientType.length && !clientType.includes(r.client_type)) return false;

        // Status filter
        if (status.length) {
            const norm = (r.status || '').toLowerCase().replace(/[\s-]/g, '-');
            if (!status.includes(norm)) return false;
        }

        // Date range filter
        if (dateFrom || dateTo) {
            const val = r[dateField] ? new Date(r[dateField]) : null;
            if (!val) return false;
            if (dateFrom && val < new Date(dateFrom)) return false;
            if (dateTo) {
                const end = new Date(dateTo);
                end.setHours(23, 59, 59, 999);
                if (val > end) return false;
            }
        }

        return true;
    });

    // Sort
    data = sortData(data, State.sortCol, State.sortDir);

    State.filtered = data;

    // Clamp page
    const totalPages = Math.max(1, Math.ceil(data.length / State.perPage));
    if (State.page > totalPages) State.page = totalPages;

    renderTableBody(paginate(data));
    renderPagination(data.length);
    updateSortIcons();
}

/* ================================================
   SORT
   ================================================ */

function sortData(data, col, dir) {
    return [...data].sort((a, b) => {
        let va = a[col] ?? '';
        let vb = b[col] ?? '';

        // Date columns
        if (col === 'created_at') {
            va = va ? new Date(va).getTime() : 0;
            vb = vb ? new Date(vb).getTime() : 0;
        } else {
            va = String(va).toLowerCase();
            vb = String(vb).toLowerCase();
        }

        if (va < vb) return dir === 'asc' ? -1 : 1;
        if (va > vb) return dir === 'asc' ?  1 : -1;
        return 0;
    });
}

function sortBy(col) {
    if (State.sortCol === col) {
        State.sortDir = State.sortDir === 'asc' ? 'desc' : 'asc';
    } else {
        State.sortCol = col;
        State.sortDir = 'asc';
    }
    State.page = 1;
    applyFiltersAndRender();
}

function updateSortIcons() {
    document.querySelectorAll('.requests-table th[data-col]').forEach(th => {
        th.classList.remove('sort-active', 'sort-asc', 'sort-desc');
        if (th.dataset.col === State.sortCol) {
            th.classList.add('sort-active', State.sortDir === 'asc' ? 'sort-asc' : 'sort-desc');
        }
    });
}

/* ================================================
   PAGINATION
   ================================================ */

function paginate(data) {
    const start = (State.page - 1) * State.perPage;
    return data.slice(start, start + State.perPage);
}

function bindPagination() {
    document.getElementById('firstPageBtn')?.addEventListener('click', () => goToPage(1));
    document.getElementById('prevPageBtn')?.addEventListener('click',  () => goToPage(State.page - 1));
    document.getElementById('nextPageBtn')?.addEventListener('click',  () => goToPage(State.page + 1));
    document.getElementById('lastPageBtn')?.addEventListener('click',  () => {
        const total = Math.ceil(State.filtered.length / State.perPage);
        goToPage(total);
    });

    document.getElementById('itemsPerPage')?.addEventListener('change', e => {
        State.perPage = parseInt(e.target.value, 10);
        State.page    = 1;
        applyFiltersAndRender();
    });
}

function goToPage(p) {
    const total = Math.max(1, Math.ceil(State.filtered.length / State.perPage));
    State.page  = Math.min(Math.max(1, p), total);
    applyFiltersAndRender();
}

function renderPagination(total) {
    const totalPages = Math.max(1, Math.ceil(total / State.perPage));
    const start      = Math.min((State.page - 1) * State.perPage + 1, total);
    const end        = Math.min(State.page * State.perPage, total);

    const info = document.getElementById('paginationInfo');
    if (info) info.textContent = `Showing ${total ? start : 0} to ${end} of ${total} entries`;

    const firstBtn = document.getElementById('firstPageBtn');
    const prevBtn  = document.getElementById('prevPageBtn');
    const nextBtn  = document.getElementById('nextPageBtn');
    const lastBtn  = document.getElementById('lastPageBtn');

    if (firstBtn) firstBtn.disabled = State.page === 1;
    if (prevBtn)  prevBtn.disabled  = State.page === 1;
    if (nextBtn)  nextBtn.disabled  = State.page === totalPages;
    if (lastBtn)  lastBtn.disabled  = State.page === totalPages;

    // Page numbers
    const numbersEl = document.getElementById('paginationNumbers');
    if (!numbersEl) return;
    numbersEl.innerHTML = '';

    const pages = getPageNumbers(State.page, totalPages);
    pages.forEach(p => {
        if (p === '...') {
            const el = document.createElement('span');
            el.className = 'pagination-ellipsis';
            el.textContent = '…';
            numbersEl.appendChild(el);
        } else {
            const btn = document.createElement('button');
            btn.className = 'pagination-number' + (p === State.page ? ' active' : '');
            btn.textContent = p;
            btn.addEventListener('click', () => goToPage(p));
            numbersEl.appendChild(btn);
        }
    });
}

function getPageNumbers(current, total) {
    if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
    const pages = [];
    if (current <= 4) {
        for (let i = 1; i <= 5; i++) pages.push(i);
        pages.push('...', total);
    } else if (current >= total - 3) {
        pages.push(1, '...');
        for (let i = total - 4; i <= total; i++) pages.push(i);
    } else {
        pages.push(1, '...', current - 1, current, current + 1, '...', total);
    }
    return pages;
}

/* ================================================
   RENDER TABLE
   ================================================ */

function renderTableBody(rows) {
    const tbody = document.getElementById('requestsTableBody');
    if (!tbody) return;

    if (!rows.length) {
        tbody.innerHTML = `
            <tr class="empty-state-row">
                <td colspan="7">
                    <div class="empty-state-inner">
                        <i class="fas fa-inbox"></i>
                        <span>No training requests found</span>
                    </div>
                </td>
            </tr>`;
        return;
    }

    tbody.innerHTML = rows.map(r => `
        <tr>
            <td>${escHtml(r.request_code || '—')}</td>
            <td>
                <div class="requester-info">
                    <span class="requester-name">${escHtml(r.surname + ', ' + r.first_name)}</span>
                    <span class="requester-affiliation">${escHtml(r.affiliation || '—')}</span>
                </div>
            </td>
            <td>${escHtml(r.client_type || '—')}</td>
            <td class="email-cell">${escHtml(r.email || '—')}</td>
            <td>${formatDate(r.created_at)}</td>
            <td><span class="status-badge ${statusClass(r.status)}">${escHtml(r.status || 'Pending')}</span></td>
            <td>
                <div class="action-buttons">
                    <button class="btn-action btn-view" title="View / Edit" onclick="openViewModal(${r.id})">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="btn-action btn-delete" title="Delete" onclick="confirmDelete(${r.id}, '${escAttr(r.request_code)}')">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
}

/* ================================================
   MODAL — VIEW / EDIT
   ================================================ */

async function openViewModal(id) {
    State.currentRequestId = id;

    // Find from local data first for fast display
    let r = State.allRequests.find(x => x.id === id);
    if (!r) {
        try {
            const res = await fetch(`/api/training-requests/${id}`);
            r = await res.json();
        } catch (err) {
            console.error('Failed to load request:', err);
            return;
        }
    }

    // Populate modal fields
    document.getElementById('modalRequestId').textContent    = r.request_code || '—';
    document.getElementById('modalSubmittedDate').textContent = formatDate(r.created_at);
    document.getElementById('modalName').textContent         = `${r.surname}, ${r.first_name}`;
    document.getElementById('modalEmail').textContent        = r.email || '—';
    document.getElementById('modalAffiliation').textContent  = r.affiliation || '—';
    document.getElementById('modalClientType').textContent   = r.client_type || '—';
    document.getElementById('modalDate').textContent         = formatDate(r.created_at);

    // Status badge
    const statusEl = document.getElementById('modalStatus');
    statusEl.textContent = r.status || 'Pending';
    statusEl.className   = `status-badge ${statusClass(r.status)}`;

    // Pre-select status dropdown
    const statusSelect = document.getElementById('statusSelect');
    if (statusSelect) {
        const norm = (r.status || 'pending').toLowerCase().replace(/\s/g, '-');
        statusSelect.value = norm;
    }

    // Clear notes
    const notesEl = document.getElementById('adminNotes');
    if (notesEl) notesEl.value = r.admin_notes || '';

    // Store request_letter_path for download
    document.getElementById('viewRequestModal').dataset.letterPath = r.request_letter_path || '';

    // Open modal
    document.getElementById('viewRequestModal').classList.add('active');
    document.body.classList.add('modal-open');
}

function closeViewModal() {
    document.getElementById('viewRequestModal').classList.remove('active');
    document.body.classList.remove('modal-open');
    State.currentRequestId = null;
}

// Close on overlay click
document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('viewRequestModal')?.addEventListener('click', function(e) {
        if (e.target === this) closeViewModal();
    });
});

/* ================================================
   SAVE UPDATES
   ================================================ */

async function saveRequestUpdates() {
    if (!State.currentRequestId) return;

    const status     = document.getElementById('statusSelect')?.value || 'pending';
    const adminNotes = document.getElementById('adminNotes')?.value   || '';

    const btn = document.querySelector('.btn-save-updates');
    if (btn) { btn.disabled = true; btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...'; }

    try {
        const res = await fetch(`/api/training-requests/${State.currentRequestId}`, {
            method:  'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status, admin_notes: adminNotes }),
        });
        if (!res.ok) throw new Error('Save failed');

        // Update local state
        const idx = State.allRequests.findIndex(r => r.id === State.currentRequestId);
        if (idx !== -1) {
            State.allRequests[idx].status      = capitalizeStatus(status);
            State.allRequests[idx].admin_notes = adminNotes;
        }

        applyFiltersAndRender();
        closeViewModal();
        showToast('Request updated successfully.', 'success');
    } catch (err) {
        console.error('Save error:', err);
        showToast('Failed to save updates. Please try again.', 'error');
    } finally {
        if (btn) { btn.disabled = false; btn.innerHTML = '<i class="fas fa-check"></i> <span>Save Updates</span>'; }
    }
}

/* ================================================
   DOCUMENT DOWNLOAD
   ================================================ */

function downloadDocument(type) {
    if (type === 'letter') {
        const path = document.getElementById('viewRequestModal')?.dataset.letterPath;
        if (path) {
            window.open(path, '_blank');
        } else {
            showToast('No request letter available.', 'error');
        }
    }
}

/* ================================================
   DELETE
   ================================================ */

function confirmDelete(id, requestCode) {
    const overlay = document.createElement('div');
    overlay.className = 'confirm-modal-overlay';
    overlay.innerHTML = `
        <div class="confirm-modal-container">
            <button class="confirm-modal-close" onclick="this.closest('.confirm-modal-overlay').remove()">×</button>
            <div class="confirm-delete-icon">
                <svg viewBox="0 0 24 24" width="28" height="28">
                    <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6"/>
                </svg>
            </div>
            <h2>Delete Request</h2>
            <p class="confirm-delete-message">Are you sure you want to delete <strong>${escHtml(requestCode)}</strong>?</p>
            <p class="confirm-delete-warning">This action cannot be undone.</p>
            <div class="confirm-modal-actions">
                <button class="confirm-btn-cancel" onclick="this.closest('.confirm-modal-overlay').remove()">Cancel</button>
                <button class="confirm-btn-delete" onclick="deleteRequest(${id}, this)">Delete</button>
            </div>
        </div>`;
    document.body.appendChild(overlay);
}

async function deleteRequest(id, btn) {
    if (btn) btn.disabled = true;
    try {
        const res = await fetch(`/api/training-requests/${id}`, { method: 'DELETE' });
        if (!res.ok) throw new Error('Delete failed');

        State.allRequests = State.allRequests.filter(r => r.id !== id);
        applyFiltersAndRender();

        document.querySelector('.confirm-modal-overlay')?.remove();
        showToast('Request deleted successfully.', 'success');
    } catch (err) {
        console.error('Delete error:', err);
        showToast('Failed to delete request. Please try again.', 'error');
        if (btn) btn.disabled = false;
    }
}

/* ================================================
   EXPORT CSV
   ================================================ */

function exportToCSV() {
    const data = State.filtered.length ? State.filtered : State.allRequests;
    if (!data.length) { showToast('No data to export.', 'error'); return; }

    const headers = ['Request ID', 'Surname', 'First Name', 'Email', 'Affiliation', 'Client Type', 'Status', 'Date Submitted'];
    const rows = data.map(r => [
        r.request_code  || '',
        r.surname       || '',
        r.first_name    || '',
        r.email         || '',
        r.affiliation   || '',
        r.client_type   || '',
        r.status        || '',
        formatDate(r.created_at),
    ]);

    const csv  = [headers, ...rows].map(row => row.map(csvCell).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = `training_requests_${dateStamp()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
}

/* ================================================
   FILTER DROPDOWN
   ================================================ */

function buildFilterDropdown() {
    const wrapper = document.getElementById('filterDropdownWrapper');
    if (!wrapper) return;

    wrapper.innerHTML = `
        <button class="filter-dropdown-toggle" id="filterToggleBtn" onclick="toggleFilterPanel()">
            <i class="fas fa-filter"></i>
            <span>Filter</span>
            <i class="fas fa-chevron-down filter-chevron" id="filterChevron"></i>
        </button>
        <div class="filter-dropdown-panel" id="filterPanel">
            <div class="filter-panel-inner">
                <!-- Client Type -->
                <div class="filter-group">
                    <div class="filter-group-header">
                        <i class="fas fa-users"></i> Client Type
                    </div>
                    <div class="filter-group-options" id="clientTypeOptions">
                        ${['Internal', 'External'].map(v => checkboxRow('clientType', v.toLowerCase(), v)).join('')}
                    </div>
                </div>
                <div class="filter-group-divider"></div>
                <!-- Status -->
                <div class="filter-group">
                    <div class="filter-group-header">
                        <i class="fas fa-circle-half-stroke"></i> Status
                    </div>
                    <div class="filter-group-options">
                        ${['Pending', 'Approved', 'Rejected', 'Completed', 'Terminated'].map(v =>
                            checkboxRow('status', v.toLowerCase(), v)
                        ).join('')}
                    </div>
                </div>
                <div class="filter-group-divider"></div>
                <!-- Date Range -->
                <div class="filter-group">
                    <div class="filter-group-header">
                        <i class="fas fa-calendar-days"></i> Date Submitted
                    </div>
                    <div class="filter-date-inputs">
                        <div class="filter-date-row">
                            <span class="filter-date-label">From</span>
                            <input type="date" class="filter-date-input" id="dateFrom">
                        </div>
                        <div class="filter-date-row">
                            <span class="filter-date-label">To</span>
                            <input type="date" class="filter-date-input" id="dateTo">
                        </div>
                    </div>
                </div>
            </div>
            <div class="filter-panel-footer">
                <button class="filter-clear-btn" onclick="clearFilters()">
                    <i class="fas fa-times"></i> Clear
                </button>
                <button class="filter-apply-btn" onclick="applyFilterPanel()">Apply</button>
            </div>
        </div>`;

    // Close on outside click
    document.addEventListener('click', e => {
        if (!wrapper.contains(e.target)) closeFilterPanel();
    });
}

function checkboxRow(group, value, label) {
    return `
        <label class="filter-checkbox-label">
            <input type="checkbox" class="filter-checkbox" data-group="${group}" value="${value}">
            <span class="filter-checkbox-custom"></span>
            <span class="filter-checkbox-text">${label}</span>
        </label>`;
}

function toggleFilterPanel() {
    const panel   = document.getElementById('filterPanel');
    const chevron = document.getElementById('filterChevron');
    const isOpen  = panel?.classList.contains('open');
    if (isOpen) {
        panel.classList.remove('open');
        chevron?.style.setProperty('transform', '');
    } else {
        panel?.classList.add('open');
        chevron?.style.setProperty('transform', 'rotate(180deg)');
    }
}

function closeFilterPanel() {
    document.getElementById('filterPanel')?.classList.remove('open');
    document.getElementById('filterChevron')?.style.setProperty('transform', '');
}

function applyFilterPanel() {
    const boxes = document.querySelectorAll('.filter-checkbox');
    const clientType = [];
    const status     = [];

    boxes.forEach(cb => {
        if (!cb.checked) return;
        if (cb.dataset.group === 'clientType') {
            // Capitalize first letter to match DB values
            clientType.push(cb.value.charAt(0).toUpperCase() + cb.value.slice(1));
        }
        if (cb.dataset.group === 'status') status.push(cb.value);
    });

    State.activeFilters.clientType = clientType;
    State.activeFilters.status     = status;
    State.activeFilters.dateFrom   = document.getElementById('dateFrom')?.value || '';
    State.activeFilters.dateTo     = document.getElementById('dateTo')?.value   || '';

    // Update badge
    const activeCount = clientType.length + status.length
        + (State.activeFilters.dateFrom || State.activeFilters.dateTo ? 1 : 0);
    const toggleBtn = document.getElementById('filterToggleBtn');
    if (toggleBtn) {
        const badge = activeCount ? `<span class="filter-active-badge">${activeCount}</span>` : '';
        toggleBtn.innerHTML = `
            <i class="fas fa-filter"></i>
            <span>Filter</span>
            ${badge}
            <i class="fas fa-chevron-down filter-chevron" id="filterChevron" style="transform:rotate(180deg)"></i>`;
        toggleBtn.classList.toggle('has-filters', !!activeCount);
    }

    State.page = 1;
    applyFiltersAndRender();
}

function clearFilters() {
    document.querySelectorAll('.filter-checkbox').forEach(cb => cb.checked = false);
    const df = document.getElementById('dateFrom');
    const dt = document.getElementById('dateTo');
    if (df) df.value = '';
    if (dt) dt.value = '';

    State.activeFilters = { clientType: [], status: [], dateFrom: '', dateTo: '', dateField: 'created_at' };

    const toggleBtn = document.getElementById('filterToggleBtn');
    if (toggleBtn) {
        toggleBtn.innerHTML = `
            <i class="fas fa-filter"></i>
            <span>Filter</span>
            <i class="fas fa-chevron-down filter-chevron" id="filterChevron"></i>`;
        toggleBtn.classList.remove('has-filters');
    }

    State.page = 1;
    applyFiltersAndRender();
}

/* ================================================
   TOAST
   ================================================ */

function showToast(message, type = 'success') {
    const existing = document.getElementById('cherm-toast');
    if (existing) existing.remove();

    const bg    = type === 'success' ? '#008080' : '#dc2626';
    const icon  = type === 'success' ? 'fa-check-circle' : 'fa-circle-exclamation';
    const toast = document.createElement('div');
    toast.id    = 'cherm-toast';
    toast.style.cssText = `
        position: fixed; bottom: 24px; right: 24px; z-index: 9999;
        background: ${bg}; color: #fff; padding: 14px 20px;
        border-radius: 10px; font-size: 14px; font-weight: 500;
        display: flex; align-items: center; gap: 10px;
        box-shadow: 0 8px 24px rgba(0,0,0,0.18);
        animation: toastIn 0.3s ease-out;
    `;
    toast.innerHTML = `<i class="fas ${icon}"></i> ${escHtml(message)}`;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3500);
}

/* ================================================
   HELPERS
   ================================================ */

function formatDate(val) {
    if (!val) return '—';
    const d = new Date(val);
    if (isNaN(d)) return val;
    return d.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });
}

function statusClass(status) {
    const map = {
        'pending':    'status-pending',
        'approved':   'status-approved',
        'in-progress':'status-approved',
        'completed':  'status-completed',
        'rejected':   'status-rejected',
        'terminated': 'status-terminated',
    };
    return map[(status || '').toLowerCase().replace(/\s/g, '-')] || 'status-pending';
}

function capitalizeStatus(val) {
    return val ? val.charAt(0).toUpperCase() + val.slice(1).replace(/-/g, ' ') : 'Pending';
}

function escHtml(str) {
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

function escAttr(str) {
    return String(str).replace(/'/g, "\\'").replace(/"/g, '&quot;');
}

function csvCell(val) {
    const s = String(val);
    return s.includes(',') || s.includes('"') || s.includes('\n')
        ? `"${s.replace(/"/g, '""')}"`
        : s;
}

function dateStamp() {
    return new Date().toISOString().slice(0, 10);
}