/* =============================================================
   manage-data-req.js
   Admin panel — Geospatial Data Requests
   Mirrors the manage-manuscript-req.js pattern exactly.
============================================================= */

'use strict';

/* ── Data Cleaning Helpers ── */
function toTitleCase(str) {
    if (!str) return '';
    return str.toLowerCase().split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}
function toSentenceCase(str) {
    if (!str) return '';
    return str.toLowerCase().charAt(0).toUpperCase() + str.toLowerCase().slice(1);
}

/* ── State ── */
let allRequests   = [];
let filteredData  = [];
let currentPage   = 1;
let itemsPerPage  = 10;
let sortColumn    = 'created_at';
let sortDirection = 'desc';
let activeFilters = { status: [], clientType: [] };
let currentRequestId = null;
let pendingFiles  = [];   // files staged in the dropzone queue

/* ── Init ── */
document.addEventListener('DOMContentLoaded', function () {
    fetchRequests();
    buildFilterDropdown();
    bindSearch();
    bindPagination();
    bindSort();
    bindModalClose();
});

/* ═══════════════════════════════════════════════════
   DATA FETCH
═══════════════════════════════════════════════════ */
async function fetchRequests() {
    try {
        const res  = await fetch('/api/data-requests');
        const data = await res.json();
        allRequests = Array.isArray(data) ? data : [];
    } catch (err) {
        console.error('Failed to load data requests:', err);
        allRequests = [];
    }
    applyFiltersAndRender();
    updateStats();
}

/* ═══════════════════════════════════════════════════
   STATS STRIP
═══════════════════════════════════════════════════ */
function updateStats() {
    document.getElementById('statTotal').textContent     = allRequests.length;
    document.getElementById('statPending').textContent   = allRequests.filter(r => r.status === 'Pending').length;
    document.getElementById('statProcessing').textContent = allRequests.filter(r => r.status === 'Processing').length;
    document.getElementById('statFulfilled').textContent = allRequests.filter(r => r.status === 'Fulfilled').length;
}

/* ═══════════════════════════════════════════════════
   SEARCH
═══════════════════════════════════════════════════ */
function bindSearch() {
    const input = document.getElementById('requestSearchInput');
    if (!input) return;
    let timer;
    input.addEventListener('input', function () {
        clearTimeout(timer);
        timer = setTimeout(() => { currentPage = 1; applyFiltersAndRender(); }, 250);
    });
}

function searchFilter(r, q) {
    if (!q) return true;
    const s = q.toLowerCase();
    const datasets = (r.datasets || []).map(d => (d.title || d.dataset_title || '')).join(' ').toLowerCase();
    return (
        (r.request_code  || '').toLowerCase().includes(s) ||
        (r.first_name    || '').toLowerCase().includes(s) ||
        (r.surname       || '').toLowerCase().includes(s) ||
        (r.email         || '').toLowerCase().includes(s) ||
        (r.affiliation   || '').toLowerCase().includes(s) ||
        (r.purpose       || '').toLowerCase().includes(s) ||
        datasets.includes(s)
    );
}

/* ═══════════════════════════════════════════════════
   FILTER DROPDOWN  (status + client type)
═══════════════════════════════════════════════════ */
function buildFilterDropdown() {
    const wrapper = document.getElementById('filterDropdownWrapper');
    if (!wrapper) return;

    const statuses     = ['Pending', 'Processing', 'Ready for Pickup', 'Fulfilled', 'Declined'];
    const clientTypes  = ['Internal', 'External'];

    wrapper.innerHTML = `
    <button class="filter-dropdown-toggle" id="filterToggleBtn" onclick="toggleFilterPanel()">
        <i class="fas fa-sliders-h"></i>
        Filters
        <span id="filterActiveBadge" class="filter-active-badge" style="display:none">0</span>
        <i class="fas fa-chevron-down filter-chevron" id="filterChevron"></i>
    </button>
    <div class="filter-dropdown-panel" id="filterDropdownPanel">
        <div class="filter-panel-inner">
            <div class="filter-group">
                <div class="filter-group-header"><i class="fas fa-circle-dot"></i> Status</div>
                <div class="filter-group-options">
                    ${statuses.map(s => `
                    <label class="filter-checkbox-label">
                        <input type="checkbox" class="filter-checkbox filter-status" value="${s}">
                        <span class="filter-checkbox-custom"></span>
                        <span class="filter-checkbox-text">${s}</span>
                    </label>`).join('')}
                </div>
            </div>
            <div class="filter-group-divider"></div>
            <div class="filter-group">
                <div class="filter-group-header"><i class="fas fa-user-tag"></i> Client Type</div>
                <div class="filter-group-options">
                    ${clientTypes.map(t => `
                    <label class="filter-checkbox-label">
                        <input type="checkbox" class="filter-checkbox filter-client" value="${t}">
                        <span class="filter-checkbox-custom"></span>
                        <span class="filter-checkbox-text">${t}</span>
                    </label>`).join('')}
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

    document.addEventListener('click', function (e) {
        const panel   = document.getElementById('filterDropdownPanel');
        const toggle  = document.getElementById('filterToggleBtn');
        if (panel && !panel.contains(e.target) && !toggle.contains(e.target)) {
            panel.classList.remove('open');
        }
    });
}

function toggleFilterPanel() {
    const panel = document.getElementById('filterDropdownPanel');
    if (panel) panel.classList.toggle('open');
}

function applyFilterPanel() {
    activeFilters.status     = [...document.querySelectorAll('.filter-status:checked')].map(c => c.value);
    activeFilters.clientType = [...document.querySelectorAll('.filter-client:checked')].map(c => c.value);
    updateFilterBadge();
    currentPage = 1;
    applyFiltersAndRender();
    document.getElementById('filterDropdownPanel').classList.remove('open');
}

function clearFilters() {
    document.querySelectorAll('.filter-checkbox').forEach(c => c.checked = false);
    activeFilters = { status: [], clientType: [] };
    updateFilterBadge();
    currentPage = 1;
    applyFiltersAndRender();
}

function updateFilterBadge() {
    const total  = activeFilters.status.length + activeFilters.clientType.length;
    const badge  = document.getElementById('filterActiveBadge');
    const toggle = document.getElementById('filterToggleBtn');
    if (!badge) return;
    badge.textContent = total;
    badge.style.display = total > 0 ? 'inline-flex' : 'none';
    toggle.classList.toggle('has-filters', total > 0);
}

/* ═══════════════════════════════════════════════════
   APPLY FILTERS + RENDER
═══════════════════════════════════════════════════ */
function applyFiltersAndRender() {
    const q = (document.getElementById('requestSearchInput')?.value || '').trim();

    filteredData = allRequests.filter(r => {
        if (!searchFilter(r, q)) return false;
        if (activeFilters.status.length     && !activeFilters.status.includes(r.status))          return false;
        if (activeFilters.clientType.length && !activeFilters.clientType.includes(r.client_type)) return false;
        return true;
    });

    // Sort
    filteredData.sort((a, b) => {
        let av = a[sortColumn] ?? '';
        let bv = b[sortColumn] ?? '';
        if (sortColumn === 'created_at') { av = new Date(av); bv = new Date(bv); }
        else { av = String(av).toLowerCase(); bv = String(bv).toLowerCase(); }
        if (av < bv) return sortDirection === 'asc' ? -1 :  1;
        if (av > bv) return sortDirection === 'asc' ?  1 : -1;
        return 0;
    });

    renderTable();
    renderPagination();
}

/* ═══════════════════════════════════════════════════
   TABLE RENDERING
═══════════════════════════════════════════════════ */
function renderTable() {
    const tbody = document.getElementById('requestsTableBody');
    const start = (currentPage - 1) * itemsPerPage;
    const slice = filteredData.slice(start, start + itemsPerPage);

    if (slice.length === 0) {
        tbody.innerHTML = `
        <tr class="empty-state-row">
            <td colspan="8">
                <div class="empty-state-inner">
                    <i class="fas fa-database"></i>
                    <span>No data requests found.</span>
                </div>
            </td>
        </tr>`;
        return;
    }

    tbody.innerHTML = slice.map(r => {
        const datasets  = Array.isArray(r.datasets) ? r.datasets : [];
        const count     = datasets.length;
        const submitted = formatDate(r.created_at);
        const statusCls = statusClass(r.status);
        const clientBadge = r.client_type === 'Internal'
            ? '<span style="color:#065f46;font-size:12px;font-weight:500;">Internal</span>'
            : '<span style="color:#92400e;font-size:12px;font-weight:500;">External</span>';

        return `
        <tr>
            <td style="font-size:13px;font-weight:500;color:#1a202c;">${escHtml(r.request_code || '—')}</td>
            <td>
                <div class="requester-info">
                    <span class="requester-name">${escHtml((r.first_name || '') + ' ' + (r.surname || ''))}</span>
                    <span class="requester-office">${escHtml(r.affiliation || '')}</span>
                </div>
            </td>
            <td>${clientBadge}</td>
            <td style="font-size:13px;color:#4a5568;">${submitted}</td>
            <td style="font-size:13px;color:#4a5568;">${escHtml(r.purpose || '—')}</td>
            <td>
                <span class="dr-datasets-pill">
                    <i class="fas fa-layer-group"></i> ${count} dataset${count !== 1 ? 's' : ''}
                </span>
            </td>
            <td><span class="status-badge ${statusCls}">${escHtml(r.status || 'Pending')}</span></td>
            <td>
                <div class="action-buttons">
                    <button class="btn-action btn-edit" title="View / Manage" onclick="openViewModal(${r.id})">
                        <i class="fas fa-pen"></i>
                    </button>
                    <button class="btn-action btn-delete" title="Delete" onclick="confirmDelete(${r.id}, '${escHtml(r.request_code || '')}')">
                        <i class="fas fa-trash-alt"></i>
                    </button>
                </div>
            </td>
        </tr>`;
    }).join('');
}

/* ═══════════════════════════════════════════════════
   PAGINATION
═══════════════════════════════════════════════════ */
function bindPagination() {
    document.getElementById('firstPageBtn').addEventListener('click', () => goToPage(1));
    document.getElementById('prevPageBtn').addEventListener('click',  () => goToPage(currentPage - 1));
    document.getElementById('nextPageBtn').addEventListener('click',  () => goToPage(currentPage + 1));
    document.getElementById('lastPageBtn').addEventListener('click',  () => goToPage(totalPages()));
    document.getElementById('itemsPerPage').addEventListener('change', function () {
        itemsPerPage = parseInt(this.value);
        currentPage  = 1;
        applyFiltersAndRender();
    });
}

function totalPages() { return Math.max(1, Math.ceil(filteredData.length / itemsPerPage)); }

function goToPage(n) {
    n = Math.max(1, Math.min(n, totalPages()));
    if (n === currentPage) return;
    currentPage = n;
    renderTable();
    renderPagination();
}

function renderPagination() {
    const total  = filteredData.length;
    const pages  = totalPages();
    const start  = Math.min((currentPage - 1) * itemsPerPage + 1, total);
    const end    = Math.min(currentPage * itemsPerPage, total);

    document.getElementById('paginationInfo').textContent =
        total === 0 ? 'No entries found' : `Showing ${start} to ${end} of ${total} entries`;

    document.getElementById('firstPageBtn').disabled = currentPage === 1;
    document.getElementById('prevPageBtn').disabled  = currentPage === 1;
    document.getElementById('nextPageBtn').disabled  = currentPage === pages;
    document.getElementById('lastPageBtn').disabled  = currentPage === pages;

    const nums = document.getElementById('paginationNumbers');
    nums.innerHTML = '';
    const range = pageRange(currentPage, pages);
    range.forEach(p => {
        if (p === '…') {
            const el = document.createElement('span');
            el.className = 'pagination-ellipsis';
            el.textContent = '…';
            nums.appendChild(el);
        } else {
            const btn = document.createElement('button');
            btn.className = 'pagination-number' + (p === currentPage ? ' active' : '');
            btn.textContent = p;
            btn.addEventListener('click', () => goToPage(p));
            nums.appendChild(btn);
        }
    });
}

function pageRange(cur, total) {
    if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
    if (cur <= 4)   return [1, 2, 3, 4, 5, '…', total];
    if (cur >= total - 3) return [1, '…', total-4, total-3, total-2, total-1, total];
    return [1, '…', cur-1, cur, cur+1, '…', total];
}

/* ═══════════════════════════════════════════════════
   SORT
═══════════════════════════════════════════════════ */
function bindSort() {
    document.querySelectorAll('.requests-table th[data-col]').forEach(th => {
        th.addEventListener('click', () => sortBy(th.dataset.col));
    });
}

function sortBy(col) {
    if (sortColumn === col) {
        sortDirection = sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
        sortColumn    = col;
        sortDirection = 'asc';
    }
    document.querySelectorAll('.requests-table th[data-col]').forEach(th => {
        th.classList.remove('sort-asc', 'sort-desc', 'sort-active');
    });
    const active = document.querySelector(`.requests-table th[data-col="${col}"]`);
    if (active) {
        active.classList.add('sort-active', sortDirection === 'asc' ? 'sort-asc' : 'sort-desc');
    }
    currentPage = 1;
    applyFiltersAndRender();
}

/* ═══════════════════════════════════════════════════
   VIEW / MANAGE MODAL
═══════════════════════════════════════════════════ */
async function openViewModal(id) {
    currentRequestId = id;

    // Reset tabs
    drSwitchTab(document.querySelector('.dr-tab-btn'), 'overview');

    // Reset right panel
    pendingFiles = [];
    renderFileQueue();
    document.getElementById('drUploadBtn').style.display = 'none';
    document.getElementById('deliveryLink').value = '';
    document.getElementById('adminNotes').value   = '';

    try {
        const res  = await fetch(`/api/data-requests/${id}`);
        const data = await res.json();
        populateModal(data);
    } catch (err) {
        console.error('Failed to load request:', err);
    }

    document.getElementById('viewRequestModal').classList.add('active');
    document.body.classList.add('modal-open');

    // Attach data cleaning blur listeners (safe to re-attach — addEventListener dedupes same fn ref via named fn)
    const adminNotesEl = document.getElementById('adminNotes');
    if (adminNotesEl) {
        adminNotesEl.removeEventListener('blur', _cleanAdminNotes);
        adminNotesEl.addEventListener('blur', _cleanAdminNotes);
    }
}

function populateModal(r) {
    document.getElementById('modalRequestId').textContent    = r.request_code || '—';
    document.getElementById('modalSubmittedDate').textContent = formatDate(r.created_at);
    document.getElementById('modalName').textContent         = ((r.first_name || '') + ' ' + (r.surname || '')).trim() || '—';
    document.getElementById('modalEmail').textContent        = r.email         || '—';
    document.getElementById('modalAffiliation').textContent  = r.affiliation   || '—';
    document.getElementById('modalClientType').textContent   = r.client_type   || '—';
    document.getElementById('modalContact').textContent      = r.contact       || '—';
    document.getElementById('modalPurpose').textContent      = r.purpose       || '—';
    document.getElementById('modalNotes').textContent        = r.notes         || '—';

    // Status badge
    const badge = document.getElementById('modalStatusBadge');
    badge.textContent = r.status || 'Pending';
    badge.className   = 'status-badge ' + statusClass(r.status);

    // Status select
    const sel = document.getElementById('statusSelect');
    sel.value = r.status || 'Pending';

    // Pre-fill existing admin data
    if (r.delivery_link) document.getElementById('deliveryLink').value = r.delivery_link;
    if (r.admin_notes)   document.getElementById('adminNotes').value   = r.admin_notes;

    // Datasets tab
    renderDatasetList(r.datasets || []);

    // Fulfillment history tab
    renderFulfillmentHistory(r.delivered_files || [], r.delivery_link);
}

function renderDatasetList(datasets) {
    const container = document.getElementById('drDatasetList');
    if (!datasets.length) {
        container.innerHTML = `
        <div class="dr-empty-state">
            <i class="fas fa-layer-group"></i>
            <span>No datasets listed.</span>
        </div>`;
        return;
    }

    const iconMap = {
        'SHP': 'fa-layer-group', 'GEOJSON': 'fa-code', 'KML': 'fa-map-marked-alt',
        'TIFF': 'fa-image', 'CSV': 'fa-table', 'PDF': 'fa-file-pdf',
        'ZIP': 'fa-file-archive', 'GPKG': 'fa-database',
    };

    container.innerHTML = `
    <div class="dr-dataset-send-bar">
        <span class="dr-dataset-send-hint">
            <i class="fas fa-info-circle"></i>
            Select datasets to send download links to the requester.
        </span>
        <button class="dr-send-btn" id="drSendBtn" onclick="sendSelectedFiles()" disabled>
            <i class="fas fa-paper-plane"></i> Send Files
        </button>
    </div>
    <div class="dr-dataset-items" id="drDatasetItems">
    ${datasets.map(d => {
        const title      = escHtml(d.title || d.dataset_title || 'Unknown Dataset');
        const fmt        = (d.format || '').toUpperCase();
        const icon       = iconMap[fmt] || 'fa-map';
        const meta       = [d.coverage, d.year].filter(Boolean).join(' · ');
        const hasFile    = !!(d.file_path || d.filePath);
        const datasetId  = d.dataset_id || d.id;
        const disabledAttr = hasFile ? '' : 'disabled';
        const rowCls       = hasFile ? '' : 'dr-dataset-item--no-file';
        return `
        <div class="dr-dataset-item ${rowCls}" id="drDs_${datasetId}">
            <label class="dr-dataset-check-wrap" title="${hasFile ? 'Select to send' : 'No file uploaded yet'}">
                <input type="checkbox" class="dr-dataset-cb"
                    data-id="${datasetId}"
                    ${disabledAttr}
                    onchange="onDatasetCheckChange()">
            </label>
            <div class="dr-dataset-icon"><i class="fas ${icon}"></i></div>
            <div class="dr-dataset-info">
                <div class="dr-dataset-title">${title}</div>
                ${meta ? `<div class="dr-dataset-meta">${escHtml(meta)}</div>` : ''}
                ${!hasFile ? `<div class="dr-dataset-no-file"><i class="fas fa-exclamation-triangle"></i> No file uploaded</div>` : ''}
            </div>
            <span class="dr-dataset-format">${escHtml(fmt || '—')}</span>
        </div>`;
    }).join('')}
    </div>`;
}

function onDatasetCheckChange() {
    const checked = document.querySelectorAll('.dr-dataset-cb:checked').length;
    const btn = document.getElementById('drSendBtn');
    if (btn) btn.disabled = checked === 0;
}

async function sendSelectedFiles() {
    const checked = [...document.querySelectorAll('.dr-dataset-cb:checked')];
    if (!checked.length || !currentRequestId) return;

    const datasetIds = checked.map(cb => parseInt(cb.dataset.id));
    const btn = document.getElementById('drSendBtn');
    btn.disabled  = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending…';

    try {
        const res  = await fetch(`/api/data-requests/${currentRequestId}/notify`, {
            method:  'POST',
            headers: { 'Content-Type': 'application/json' },
            body:    JSON.stringify({ datasetIds }),
        });
        const data = await res.json();

        if (!res.ok) throw new Error(data.error || 'Failed to send');

        const msg = data.missing > 0
            ? `${data.sent} file(s) sent. ${data.missing} dataset(s) had no file and were skipped.`
            : `${data.sent} file(s) sent successfully to the requester.`;

        showToast(msg, 'success');

        // Uncheck all after sending
        document.querySelectorAll('.dr-dataset-cb').forEach(cb => cb.checked = false);

    } catch (err) {
        console.error(err);
        showToast(err.message || 'Failed to send files.', 'error');
    } finally {
        btn.disabled  = false;
        btn.innerHTML = '<i class="fas fa-paper-plane"></i> Send Files';
        onDatasetCheckChange();
    }
}

function renderFulfillmentHistory(files, deliveryLink) {
    const empty = document.getElementById('drFulfillmentEmpty');
    const list  = document.getElementById('drFulfillmentList');
    list.innerHTML = '';

    const hasFiles = files && files.length > 0;
    const hasLink  = !!deliveryLink;

    empty.style.display = (hasFiles || hasLink) ? 'none' : 'flex';

    if (hasLink) {
        list.insertAdjacentHTML('beforeend', `
        <div class="dr-fulfillment-item">
            <div class="dr-fulfillment-icon link"><i class="fas fa-link"></i></div>
            <div class="dr-fulfillment-info">
                <div class="dr-fulfillment-name">Delivery Link</div>
                <div class="dr-fulfillment-meta">${escHtml(deliveryLink)}</div>
            </div>
            <a href="${escHtml(deliveryLink)}" target="_blank" rel="noopener" class="dr-fulfillment-open" title="Open link">
                <i class="fas fa-external-link-alt"></i>
            </a>
        </div>`);
    }

    if (hasFiles) {
        files.forEach(f => {
            const ext   = (f.filename || '').split('.').pop().toLowerCase();
            const cls   = fileIconClass(ext);
            const icon  = fileIconFa(ext);
            const date  = f.uploaded_at ? formatDate(f.uploaded_at) : '';
            list.insertAdjacentHTML('beforeend', `
            <div class="dr-fulfillment-item">
                <div class="dr-fulfillment-icon ${cls}"><i class="fas ${icon}"></i></div>
                <div class="dr-fulfillment-info">
                    <div class="dr-fulfillment-name">${escHtml(f.filename || 'file')}</div>
                    <div class="dr-fulfillment-meta">${escHtml(f.size || '')}${date ? ' · ' + date : ''}</div>
                </div>
                <a href="${escHtml(f.url || f.file_path || '#')}" target="_blank" rel="noopener"
                   class="dr-fulfillment-open" title="Download">
                    <i class="fas fa-download"></i>
                </a>
            </div>`);
        });
    }
}

/* ── Tab switching ── */
function drSwitchTab(btn, tab) {
    document.querySelectorAll('.dr-tab-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.dr-tab-pane').forEach(p => p.classList.remove('active'));
    if (btn) btn.classList.add('active');
    const pane = document.getElementById('dr-tab-' + tab);
    if (pane) pane.classList.add('active');
}

/* ── Close modal ── */
function closeViewModal() {
    document.getElementById('viewRequestModal').classList.remove('active');
    document.body.classList.remove('modal-open');
    currentRequestId = null;
    pendingFiles = [];
}

function bindModalClose() {
    document.getElementById('viewRequestModal').addEventListener('click', function (e) {
        if (e.target === this) closeViewModal();
    });
}

/* ── Named blur handler (allows clean removeEventListener) ── */
function _cleanAdminNotes() {
    this.value = toSentenceCase(this.value);
}

/* ═══════════════════════════════════════════════════
   SAVE UPDATES
═══════════════════════════════════════════════════ */
async function saveRequestUpdates() {
    if (!currentRequestId) return;
    const btn    = document.querySelector('.dr-save-btn');
    const status = document.getElementById('statusSelect').value;
    const link   = document.getElementById('deliveryLink').value.trim();

    // Clean admin notes before saving
    const adminNotesEl = document.getElementById('adminNotes');
    if (adminNotesEl) adminNotesEl.value = toSentenceCase(adminNotesEl.value);
    const notes = adminNotesEl ? adminNotesEl.value.trim() : '';

    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> <span>Saving...</span>';

    try {
        const res = await fetch(`/api/data-requests/${currentRequestId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status, delivery_link: link, admin_notes: notes }),
        });

        if (!res.ok) throw new Error('Save failed');

        // Update local array
        const idx = allRequests.findIndex(r => r.id === currentRequestId);
        if (idx > -1) {
            allRequests[idx].status        = status;
            allRequests[idx].delivery_link = link;
            allRequests[idx].admin_notes   = notes;
        }

        // Update badge in modal header
        const badge = document.getElementById('modalStatusBadge');
        badge.textContent = status;
        badge.className   = 'status-badge ' + statusClass(status);

        applyFiltersAndRender();
        updateStats();
        showToast('Updates saved successfully.', 'success');
    } catch (err) {
        console.error(err);
        showToast('Failed to save. Please try again.', 'error');
    } finally {
        btn.disabled = false;
        btn.innerHTML = '<i class="fas fa-check"></i> <span>Save Updates</span>';
    }
}

/* ═══════════════════════════════════════════════════
   FILE DROP / UPLOAD
═══════════════════════════════════════════════════ */
function drDragOver(e) {
    e.preventDefault();
    document.getElementById('drDropzone').classList.add('drag-over');
}
function drDragLeave() {
    document.getElementById('drDropzone').classList.remove('drag-over');
}
function drDrop(e) {
    e.preventDefault();
    document.getElementById('drDropzone').classList.remove('drag-over');
    drFilesSelected(e.dataTransfer.files);
}

function drFilesSelected(fileList) {
    const MAX = 100 * 1024 * 1024; // 100 MB
    Array.from(fileList).forEach(f => {
        if (f.size > MAX) { showToast(`${f.name} exceeds 100 MB limit.`, 'error'); return; }
        if (pendingFiles.find(p => p.name === f.name && p.size === f.size)) return; // dedupe
        pendingFiles.push(f);
    });
    renderFileQueue();
    document.getElementById('drUploadBtn').style.display = pendingFiles.length > 0 ? 'flex' : 'none';
    // Reset the input so same file can be re-added after removal
    document.getElementById('drFileInput').value = '';
}

function renderFileQueue() {
    const container = document.getElementById('drFileQueue');
    if (pendingFiles.length === 0) { container.innerHTML = ''; return; }
    container.innerHTML = pendingFiles.map((f, i) => `
    <div class="dr-queue-item" id="drQueueItem_${i}">
        <i class="fas ${fileIconFa(fileExt(f.name))} dr-queue-item-icon ${fileIconClass(fileExt(f.name))}"></i>
        <div class="dr-queue-item-info">
            <div class="dr-queue-item-name">${escHtml(f.name)}</div>
            <div class="dr-queue-item-size">${formatBytes(f.size)}</div>
            <div class="dr-queue-progress" id="drProgress_${i}" style="display:none">
                <div class="dr-queue-progress-bar" id="drProgressBar_${i}"></div>
            </div>
        </div>
        <button class="dr-queue-item-remove" onclick="removeQueueItem(${i})" title="Remove">
            <i class="fas fa-times"></i>
        </button>
    </div>`).join('');
}

function removeQueueItem(i) {
    pendingFiles.splice(i, 1);
    renderFileQueue();
    document.getElementById('drUploadBtn').style.display = pendingFiles.length > 0 ? 'flex' : 'none';
}

async function drUploadFiles() {
    if (!currentRequestId || pendingFiles.length === 0) return;
    const btn = document.getElementById('drUploadBtn');
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Uploading...';

    let uploaded = 0;
    for (let i = 0; i < pendingFiles.length; i++) {
        const f  = pendingFiles[i];
        const fd = new FormData();
        fd.append('file', f);
        fd.append('request_id', currentRequestId);

        // Show progress bar
        const prog    = document.getElementById(`drProgress_${i}`);
        const progBar = document.getElementById(`drProgressBar_${i}`);
        if (prog) prog.style.display = 'block';

        try {
            // Use XHR for progress events
            await new Promise((resolve, reject) => {
                const xhr = new XMLHttpRequest();
                xhr.open('POST', `/api/data-requests/${currentRequestId}/files`);
                xhr.upload.addEventListener('progress', e => {
                    if (e.lengthComputable && progBar) {
                        progBar.style.width = Math.round(e.loaded / e.total * 100) + '%';
                    }
                });
                xhr.addEventListener('load', () => {
                    if (xhr.status >= 200 && xhr.status < 300) { uploaded++; resolve(); }
                    else { reject(new Error(xhr.statusText)); }
                });
                xhr.addEventListener('error', reject);
                xhr.send(fd);
            });
        } catch (err) {
            console.error(`Upload failed for ${f.name}:`, err);
            showToast(`Failed to upload ${f.name}.`, 'error');
        }
    }

    btn.disabled = false;
    btn.innerHTML = '<i class="fas fa-upload"></i> Upload Files';

    if (uploaded > 0) {
        showToast(`${uploaded} file(s) uploaded successfully.`, 'success');
        pendingFiles = [];
        renderFileQueue();
        btn.style.display = 'none';
        // Refresh fulfillment history tab
        try {
            const res  = await fetch(`/api/data-requests/${currentRequestId}`);
            const data = await res.json();
            renderFulfillmentHistory(data.delivered_files || [], data.delivery_link);
        } catch {}
    }
}

/* ═══════════════════════════════════════════════════
   DELETE
═══════════════════════════════════════════════════ */
function confirmDelete(id, code) {
    const slot = document.getElementById('confirmDeleteModal');
    slot.innerHTML = `
    <div class="confirm-modal-overlay">
        <div class="confirm-modal-container">
            <button class="confirm-modal-close" onclick="closeConfirmModal()">×</button>
            <div class="confirm-delete-icon">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24">
                    <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6"/>
                </svg>
            </div>
            <h2>Delete Request</h2>
            <p class="confirm-delete-message">Are you sure you want to delete request <strong>${escHtml(code)}</strong>?</p>
            <p class="confirm-delete-warning">This action cannot be undone.</p>
            <div class="confirm-modal-actions">
                <button class="confirm-btn-cancel" onclick="closeConfirmModal()">Cancel</button>
                <button class="confirm-btn-delete" onclick="deleteRequest(${id})">Delete</button>
            </div>
        </div>
    </div>`;
    slot.querySelector('.confirm-modal-overlay').addEventListener('click', function(e) {
        if (e.target === this) closeConfirmModal();
    });
}

function closeConfirmModal() {
    document.getElementById('confirmDeleteModal').innerHTML = '';
}

async function deleteRequest(id) {
    const btn = document.querySelector('.confirm-btn-delete');
    if (btn) btn.disabled = true;
    try {
        const res = await fetch(`/api/data-requests/${id}`, { method: 'DELETE' });
        if (!res.ok) throw new Error('Delete failed');
        allRequests = allRequests.filter(r => r.id !== id);
        applyFiltersAndRender();
        updateStats();
        closeConfirmModal();
        showToast('Request deleted.', 'success');
    } catch (err) {
        console.error(err);
        if (btn) btn.disabled = false;
        showToast('Failed to delete. Please try again.', 'error');
    }
}

/* ═══════════════════════════════════════════════════
   EXPORT TO CSV
═══════════════════════════════════════════════════ */
function exportToCSV() {
    const rows = [
        ['Request ID', 'First Name', 'Surname', 'Email', 'Affiliation', 'Client Type',
         'Contact', 'Purpose', 'Datasets Requested', 'Date Submitted', 'Status',
         'Delivery Link', 'Admin Notes'],
    ];
    filteredData.forEach(r => {
        const datasets = (r.datasets || []).map(d => d.title || d.dataset_title || '').join('; ');
        rows.push([
            r.request_code, r.first_name, r.surname, r.email, r.affiliation,
            r.client_type, r.contact, r.purpose, datasets,
            formatDate(r.created_at), r.status, r.delivery_link || '', r.admin_notes || '',
        ]);
    });
    const csv  = rows.map(r => r.map(v => `"${String(v ?? '').replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = `data-requests-${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
}

/* ═══════════════════════════════════════════════════
   HELPERS
═══════════════════════════════════════════════════ */
function statusClass(s) {
    switch ((s || '').toLowerCase().replace(/\s+/g,'-')) {
        case 'pending':          return 'status-pending';
        case 'processing':       return 'status-processing';
        case 'ready-for-pickup': return 'status-ready-pickup';
        case 'fulfilled':        return 'status-fulfilled';
        case 'declined':         return 'status-declined';
        default:                 return 'status-pending';
    }
}

function fileExt(name) {
    return (name || '').split('.').pop().toLowerCase();
}

function fileIconFa(ext) {
    const m = {
        pdf: 'fa-file-pdf', zip: 'fa-file-archive', shp: 'fa-layer-group',
        dbf: 'fa-file-alt', shx: 'fa-file-alt', prj: 'fa-file-alt',
        tif: 'fa-image', tiff: 'fa-image',
        csv: 'fa-table', geojson: 'fa-code', json: 'fa-code',
        kml: 'fa-map-marked-alt', gpkg: 'fa-database',
    };
    return m[ext] || 'fa-file-alt';
}

function fileIconClass(ext) {
    const m = { pdf: 'pdf', zip: 'zip', shp: 'shp', dbf: 'shp', shx: 'shp', prj: 'shp',
                tif: 'tiff', tiff: 'tiff', csv: 'csv', geojson: 'geo', json: 'geo',
                kml: 'shp', gpkg: 'shp' };
    return m[ext] || 'file';
}

function formatDate(dateStr) {
    if (!dateStr) return '—';
    const d = new Date(dateStr);
    if (isNaN(d)) return dateStr;
    return d.toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: '2-digit' });
}

function formatBytes(b) {
    if (b < 1024)           return b + ' B';
    if (b < 1024 * 1024)    return (b / 1024).toFixed(1) + ' KB';
    return (b / (1024*1024)).toFixed(1) + ' MB';
}

function escHtml(s) {
    return String(s ?? '')
        .replace(/&/g,'&amp;').replace(/</g,'&lt;')
        .replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

/* ── Toast notification ── */
function showToast(msg, type) {
    let container = document.getElementById('drToastContainer');
    if (!container) {
        container = document.createElement('div');
        container.id = 'drToastContainer';
        container.style.cssText = 'position:fixed;bottom:24px;right:24px;z-index:9999;display:flex;flex-direction:column;gap:8px;';
        document.body.appendChild(container);
    }
    const t   = document.createElement('div');
    const bg  = type === 'success' ? '#008080' : '#dc2626';
    const ico = type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle';
    t.style.cssText = `background:${bg};color:white;padding:12px 18px;border-radius:8px;font-size:13px;
        font-weight:500;display:flex;align-items:center;gap:8px;box-shadow:0 4px 16px rgba(0,0,0,.2);
        animation:slideUp .25s ease;min-width:240px;max-width:360px;`;
    t.innerHTML = `<i class="fas ${ico}"></i> ${escHtml(msg)}`;
    container.appendChild(t);
    setTimeout(() => { t.style.opacity = '0'; t.style.transition = 'opacity .3s'; setTimeout(() => t.remove(), 300); }, 3500);
}