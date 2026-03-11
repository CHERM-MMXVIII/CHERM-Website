/* ============================================================
   manage-datasets.js  —  Place in: JS/manage-datasets.js
   Matches manage-manuscript-req UI patterns:
   - Sortable columns
   - Filter dropdown (category + format checkboxes)
   - Items-per-page select
   - First/Prev/Numbers/Next/Last pagination
   - CSV export
============================================================ */

/* ============================================================
   DATA CLEANING FUNCTIONS
============================================================ */
function toTitleCase(str) {
  if (!str) return '';
  return str.toLowerCase().split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
}

function toSentenceCase(str) {
  if (!str) return '';
  return str.toLowerCase().charAt(0).toUpperCase() + str.toLowerCase().slice(1);
}

/* ── STATE ── */
let allDatasets    = [];
let filtered       = [];
let currentPage    = 1;
let itemsPerPage   = 10;
let sortCol        = '';
let sortDir        = 'asc';   // 'asc' | 'desc'
let deleteTargetId = null;
let pendingFile    = null;

/* ── FILTER STATE ── */
let activeCategories = [];
let activeFormats    = [];
let filterOpen       = false;

const CAT_LABELS = {
  hazard:   { label: 'Hazard',         icon: 'fa-triangle-exclamation' },
  landuse:  { label: 'Land Use',       icon: 'fa-map'                  },
  topo:     { label: 'Topographic',    icon: 'fa-mountain'             },
  boundary: { label: 'Boundary',       icon: 'fa-draw-polygon'         },
  infra:    { label: 'Infrastructure', icon: 'fa-road'                 },
  env:      { label: 'Environment',    icon: 'fa-leaf'                 },
};

const FILE_ICONS = {
  shp: 'fa-map', tif: 'fa-image', tiff: 'fa-image',
  geojson: 'fa-code', json: 'fa-code', csv: 'fa-table',
  kml: 'fa-map-pin', gpkg: 'fa-database', zip: 'fa-file-archive',
  pdf: 'fa-file-pdf',
};

/* ============================================================
   INIT
============================================================ */
document.addEventListener('DOMContentLoaded', () => {
  loadUserInfo();
  fetchDatasets();
  buildFilterDropdown();

  const sidebarToggle    = document.getElementById('sidebarToggle');
  const mobileMenuToggle = document.getElementById('mobileMenuToggle');
  const sidebar          = document.getElementById('sidebar');

  if (sidebarToggle)    sidebarToggle.addEventListener('click',    () => sidebar.classList.toggle('collapsed'));
  if (mobileMenuToggle) mobileMenuToggle.addEventListener('click', () => sidebar.classList.toggle('mobile-open'));

  const logoutBtn = document.querySelector('.logout-btn');
  if (logoutBtn) logoutBtn.addEventListener('click', () => document.getElementById('logoutForm').submit());

  // Pagination buttons
  document.getElementById('firstPageBtn').addEventListener('click', () => goPage(1));
  document.getElementById('prevPageBtn').addEventListener('click',  () => goPage(currentPage - 1));
  document.getElementById('nextPageBtn').addEventListener('click',  () => goPage(currentPage + 1));
  document.getElementById('lastPageBtn').addEventListener('click',  () => goPage(getTotalPages()));

  // Data cleaning — blur listeners on dataset form fields
  const fTitle    = document.getElementById('fTitle');
  const fDesc     = document.getElementById('fDesc');
  const fCoverage = document.getElementById('fCoverage');
  const fScale    = document.getElementById('fScale');
  const fCrs      = document.getElementById('fCrs');

  if (fTitle)    fTitle.addEventListener('blur',    function () { this.value = toTitleCase(this.value); });
  if (fDesc)     fDesc.addEventListener('blur',     function () { this.value = toSentenceCase(this.value); });
  if (fCoverage) fCoverage.addEventListener('blur', function () { this.value = toSentenceCase(this.value); });
  if (fScale)    fScale.addEventListener('blur',    function () { this.value = toSentenceCase(this.value); });
  if (fCrs)      fCrs.addEventListener('blur',      function () { this.value = toSentenceCase(this.value); });

  // Close filter on outside click
  document.addEventListener('click', (e) => {
    const wrapper = document.getElementById('filterDropdownWrapper');
    if (filterOpen && wrapper && !wrapper.contains(e.target)) {
      closeFilterDropdown();
    }
  });
});

async function loadUserInfo() {
  try {
    const res  = await fetch('/api/me');
    const data = await res.json();
    const nameEl  = document.getElementById('userFullName');
    const emailEl = document.getElementById('userEmail');
    if (nameEl)  nameEl.textContent  = `${data.firstName} ${data.lastName}`;
    if (emailEl) emailEl.textContent = data.email;
  } catch {}
}

/* ============================================================
   FETCH ALL
============================================================ */
async function fetchDatasets() {
  try {
    const res  = await fetch('/api/datasets/all');
    const data = await res.json();
    allDatasets = Array.isArray(data) ? data : (data.datasets || []);
    applyFilters();
    updateStats();
  } catch (err) {
    console.error('Fetch datasets error:', err);
    document.getElementById('tableBody').innerHTML =
      `<tr><td colspan="10" class="empty-state"><i class="fas fa-exclamation-circle"></i> Failed to load datasets.</td></tr>`;
  }
}

/* ============================================================
   STATS
============================================================ */
function updateStats() {
  document.getElementById('statTotal').textContent   = allDatasets.length;
  document.getElementById('statHazard').textContent  = allDatasets.filter(d => d.cat === 'hazard').length;
  document.getElementById('statLanduse').textContent = allDatasets.filter(d => d.cat === 'landuse').length;
  document.getElementById('statOther').textContent   = allDatasets.filter(d => !['hazard','landuse'].includes(d.cat)).length;
}

/* ============================================================
   FILTER + SORT + RENDER
============================================================ */
function applyFilters() {
  const q = (document.getElementById('searchInput').value || '').toLowerCase().trim();

  filtered = allDatasets.filter(d => {
    const matchQ   = !q || [d.title, d.coverage, d.data_desc, d.format, d.crs]
      .filter(Boolean).some(v => v.toLowerCase().includes(q));
    const matchCat = !activeCategories.length || activeCategories.includes((d.cat || '').toLowerCase());
    const matchFmt = !activeFormats.length    || activeFormats.includes((d.format || '').toUpperCase());
    return matchQ && matchCat && matchFmt;
  });

  // Apply sort
  if (sortCol) {
    filtered.sort((a, b) => {
      let va = a[sortCol] ?? '';
      let vb = b[sortCol] ?? '';
      if (typeof va === 'string') va = va.toLowerCase();
      if (typeof vb === 'string') vb = vb.toLowerCase();
      if (va < vb) return sortDir === 'asc' ? -1 : 1;
      if (va > vb) return sortDir === 'asc' ?  1 : -1;
      return 0;
    });
  }

  currentPage = 1;
  renderTable();
  renderPagination();
}

function sortBy(col) {
  if (sortCol === col) {
    sortDir = sortDir === 'asc' ? 'desc' : 'asc';
  } else {
    sortCol = col;
    sortDir = 'asc';
  }
  // Update header classes
  document.querySelectorAll('.requests-table th[data-col]').forEach(th => {
    th.classList.remove('sort-active', 'sort-asc', 'sort-desc');
    if (th.dataset.col === col) {
      th.classList.add('sort-active', sortDir === 'asc' ? 'sort-asc' : 'sort-desc');
    }
  });
  applyFilters();
}

function renderTable() {
  const tbody = document.getElementById('tableBody');
  const start = (currentPage - 1) * itemsPerPage;
  const page  = filtered.slice(start, start + itemsPerPage);
  const end   = Math.min(start + itemsPerPage, filtered.length);

  // Update pagination info text
  const infoEl = document.getElementById('paginationInfo');
  if (infoEl) {
    infoEl.textContent = filtered.length
      ? `Showing ${start + 1} to ${end} of ${filtered.length} entries`
      : 'Showing 0 to 0 of 0 entries';
  }

  if (!page.length) {
    tbody.innerHTML = `<tr><td colspan="10" class="empty-state">
      <i class="fas fa-database"></i> No datasets found.
    </td></tr>`;
    return;
  }

  tbody.innerHTML = page.map((d, i) => {
    const catInfo = CAT_LABELS[d.cat] || { label: d.cat || '—', icon: 'fa-tag' };
    const desc    = d.data_desc || '';
    const inactive = !d.is_active
      ? ' style="opacity:.5;"'
      : '';
    return `
    <tr${inactive}>
      <td style="color:#aaa; font-size:.78rem;">${start + i + 1}</td>
      <td class="td-title">
        ${escHtml(d.title)}
        <small title="${escHtml(desc)}">${escHtml(desc) || '—'}</small>
      </td>
      <td>
        <span class="cat-badge cat-${escHtml(d.cat || 'boundary')}">
          ${catInfo.label}
        </span>
      </td>
      <td>${escHtml(d.coverage || '—')}</td>
      <td><span class="fmt-badge">${escHtml(d.format || '—')}</span></td>
      <td>${d.year || '—'}</td>
      <td style="white-space:nowrap; font-size:.8rem;">${escHtml(d.size || '—')}</td>
      <td>
        <div class="action-buttons">
          <button class="btn-action btn-edit"   title="Edit"   onclick="openEditModal(${d.id})"><i class="fas fa-pen"></i></button>
          <button class="btn-action btn-delete" title="Delete" onclick="confirmDelete(${d.id}, '${escHtml(d.title).replace(/'/g,"\\'")}')"><i class="fas fa-trash-alt"></i></button>
        </div>
      </td>
    </tr>`;
  }).join('');
}

/* ============================================================
   PAGINATION
============================================================ */
function getTotalPages() {
  return Math.max(1, Math.ceil(filtered.length / itemsPerPage));
}

function renderPagination() {
  const total = getTotalPages();

  // First / Prev / Next / Last buttons
  document.getElementById('firstPageBtn').disabled = currentPage === 1;
  document.getElementById('prevPageBtn').disabled  = currentPage === 1;
  document.getElementById('nextPageBtn').disabled  = currentPage === total;
  document.getElementById('lastPageBtn').disabled  = currentPage === total;

  // Number buttons with ellipsis
  const numbersEl = document.getElementById('paginationNumbers');
  if (!numbersEl) return;

  let html = '';
  const range = buildPageRange(currentPage, total);

  range.forEach(item => {
    if (item === '…') {
      html += `<span class="pagination-ellipsis">…</span>`;
    } else {
      html += `<button class="pagination-number ${item === currentPage ? 'active' : ''}" onclick="goPage(${item})">${item}</button>`;
    }
  });

  numbersEl.innerHTML = html;
}

function buildPageRange(current, total) {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);

  const pages = [];
  pages.push(1);

  if (current > 3) pages.push('…');

  const start = Math.max(2, current - 1);
  const end   = Math.min(total - 1, current + 1);
  for (let i = start; i <= end; i++) pages.push(i);

  if (current < total - 2) pages.push('…');

  pages.push(total);
  return pages;
}

function goPage(n) {
  const total = getTotalPages();
  if (n < 1 || n > total) return;
  currentPage = n;
  renderTable();
  renderPagination();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function onItemsPerPageChange() {
  const sel = document.getElementById('itemsPerPage');
  if (sel) itemsPerPage = parseInt(sel.value) || 10;
  currentPage = 1;
  renderTable();
  renderPagination();
}

/* ============================================================
   FILTER DROPDOWN
============================================================ */
function buildFilterDropdown() {
  const wrapper = document.getElementById('filterDropdownWrapper');
  if (!wrapper) return;

  wrapper.innerHTML = `
    <button class="filter-dropdown-toggle" id="filterToggleBtn" onclick="toggleFilterDropdown()">
      <i class="fas fa-filter"></i>
      <span>Filter</span>
      <i class="fas fa-chevron-down filter-chevron" id="filterChevron"></i>
    </button>
    <div class="filter-dropdown-panel" id="filterDropdownPanel">
      <div class="filter-panel-inner">

        <div class="filter-group">
          <div class="filter-group-header"><i class="fas fa-tag"></i> Category</div>
          <div class="filter-group-options" id="filterCatOptions">
            ${buildCheckboxGroup([
              { value: 'hazard',   label: 'Hazard'         },
              { value: 'landuse',  label: 'Land Use'       },
              { value: 'topo',     label: 'Topographic'    },
              { value: 'boundary', label: 'Boundary'       },
              { value: 'infra',    label: 'Infrastructure' },
              { value: 'env',      label: 'Environment'    },
            ], 'cat')}
          </div>
        </div>

        <div class="filter-group-divider"></div>

        <div class="filter-group">
          <div class="filter-group-header"><i class="fas fa-file-code"></i> Format</div>
          <div class="filter-group-options" id="filterFmtOptions">
            ${buildCheckboxGroup([
              { value: 'SHP',     label: 'SHP'     },
              { value: 'TIFF',    label: 'TIFF'    },
              { value: 'GEOJSON', label: 'GEOJSON' },
              { value: 'CSV',     label: 'CSV'     },
              { value: 'KML',     label: 'KML'     },
              { value: 'GPKG',    label: 'GPKG'    },
              { value: 'PDF',    label: 'PDF'    },
            ], 'fmt')}
          </div>
        </div>

      </div>
      <div class="filter-panel-footer">
        <button class="filter-clear-btn" onclick="clearFilters()">
          <i class="fas fa-times"></i> Clear
        </button>
        <button class="filter-apply-btn" onclick="applyFilterDropdown()">
          Apply
        </button>
      </div>
    </div>
  `;
}

function buildCheckboxGroup(options, group) {
  return options.map(opt => `
    <label class="filter-checkbox-label">
      <input type="checkbox" class="filter-checkbox filter-cb-${group}" value="${opt.value}">
      <span class="filter-checkbox-custom"></span>
      <span class="filter-checkbox-text">${opt.label}</span>
    </label>
  `).join('');
}

function toggleFilterDropdown() {
  filterOpen = !filterOpen;
  document.getElementById('filterDropdownPanel').classList.toggle('open', filterOpen);
  document.getElementById('filterChevron').style.transform = filterOpen ? 'rotate(180deg)' : '';
}

function closeFilterDropdown() {
  filterOpen = false;
  const panel = document.getElementById('filterDropdownPanel');
  if (panel) panel.classList.remove('open');
  const chevron = document.getElementById('filterChevron');
  if (chevron) chevron.style.transform = '';
}

function applyFilterDropdown() {
  activeCategories = [...document.querySelectorAll('.filter-cb-cat:checked')].map(cb => cb.value);
  activeFormats    = [...document.querySelectorAll('.filter-cb-fmt:checked')].map(cb => cb.value.toUpperCase());

  const total = activeCategories.length + activeFormats.length;
  const btn   = document.getElementById('filterToggleBtn');

  if (total > 0) {
    btn.classList.add('has-filters');
    const existingBadge = btn.querySelector('.filter-active-badge');
    if (existingBadge) existingBadge.textContent = total;
    else btn.querySelector('span').insertAdjacentHTML('afterend', `<span class="filter-active-badge">${total}</span>`);
  } else {
    btn.classList.remove('has-filters');
    const badge = btn.querySelector('.filter-active-badge');
    if (badge) badge.remove();
  }

  closeFilterDropdown();
  applyFilters();
}

function clearFilters() {
  document.querySelectorAll('.filter-cb-cat, .filter-cb-fmt').forEach(cb => cb.checked = false);
  activeCategories = [];
  activeFormats    = [];

  const btn = document.getElementById('filterToggleBtn');
  if (btn) {
    btn.classList.remove('has-filters');
    const badge = btn.querySelector('.filter-active-badge');
    if (badge) badge.remove();
  }

  closeFilterDropdown();
  applyFilters();
}

/* ============================================================
   CSV EXPORT
============================================================ */
function exportToCSV() {
  if (!filtered.length) {
    showToast('No data to export.', 'error');
    return;
  }

  const headers = ['ID','Title','Description','Category','Format','Coverage','Scale','CRS','Year','Size','Active'];
  const rows = filtered.map(d => [
    d.id,
    d.title         || '',
    d.data_desc     || '',
    d.cat           || '',
    d.format        || '',
    d.coverage      || '',
    d.scale         || '',
    d.crs           || '',
    d.year          || '',
    d.size          || '',
    d.is_active ? 'Yes' : 'No',
  ]);

  const csvContent = [headers, ...rows]
    .map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(','))
    .join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = `datasets-${new Date().toISOString().slice(0,10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
  showToast('Export successful.', 'success');
}

/* ============================================================
   ADD MODAL
============================================================ */
function openAddModal() {
  document.getElementById('formModalTitle').innerHTML = '<i class="fas fa-plus-circle"></i> Add Dataset';
  document.getElementById('formSubmitBtn').innerHTML  = '<i class="fas fa-save"></i> Save Dataset';
  document.getElementById('formDatasetId').value      = '';
  document.getElementById('datasetForm').reset();
  dsClearFile();
  openFormModal();
}

/* ============================================================
   EDIT MODAL
============================================================ */
function openEditModal(id) {
  const d = allDatasets.find(x => x.id === id);
  if (!d) return;

  document.getElementById('formModalTitle').innerHTML = '<i class="fas fa-pen"></i> Edit Dataset';
  document.getElementById('formSubmitBtn').innerHTML  = '<i class="fas fa-save"></i> Update Dataset';
  document.getElementById('formDatasetId').value      = d.id;

  document.getElementById('fTitle').value    = d.title       || '';
  document.getElementById('fDesc').value     = d.data_desc   || '';
  document.getElementById('fCat').value      = d.cat         || '';
  document.getElementById('fFormat').value   = d.format      || '';
  document.getElementById('fCoverage').value = d.coverage    || '';
  document.getElementById('fScale').value    = d.scale       || '';
  document.getElementById('fCrs').value      = d.crs         || '';
  document.getElementById('fYear').value     = d.year        || '';
  document.getElementById('fSize').value     = d.size        || '';

  // Show existing file chip if one is stored
  dsClearFile();
  if (d.file_path) {
    const filename = d.file_path.split('/').pop();
    const ext      = filename.split('.').pop().toLowerCase();
    document.getElementById('dsFileIcon').className   = `fas ${FILE_ICONS[ext] || 'fa-file'}`;
    document.getElementById('dsFileName').textContent = filename;
    document.getElementById('dsFileMeta').textContent = `${d.size || ''}  ·  existing file`;
    document.getElementById('dsFileInfo').style.display = 'flex';
    document.getElementById('dsDropzone').style.display = 'none';
  }

  openFormModal();
}

function openFormModal() {
  document.getElementById('formModalBackdrop').classList.add('active');
  document.getElementById('formModal').classList.add('open');
}

function closeFormModal() {
  document.getElementById('formModalBackdrop').classList.remove('active');
  document.getElementById('formModal').classList.remove('open');
}

/* ============================================================
   SUBMIT  —  Step 1: save metadata  →  Step 2: upload file
============================================================ */
async function submitDatasetForm(e) {
  e.preventDefault();

  const id  = document.getElementById('formDatasetId').value;
  const btn = document.getElementById('formSubmitBtn');

  // Clean fields before submission
  const fTitleEl    = document.getElementById('fTitle');
  const fDescEl     = document.getElementById('fDesc');
  const fCoverageEl = document.getElementById('fCoverage');
  const fScaleEl    = document.getElementById('fScale');
  const fCrsEl      = document.getElementById('fCrs');
  if (fTitleEl)    fTitleEl.value    = toTitleCase(fTitleEl.value);
  if (fDescEl)     fDescEl.value     = toSentenceCase(fDescEl.value);
  if (fCoverageEl) fCoverageEl.value = toSentenceCase(fCoverageEl.value);
  if (fScaleEl)    fScaleEl.value    = toSentenceCase(fScaleEl.value);
  if (fCrsEl)      fCrsEl.value      = toSentenceCase(fCrsEl.value);

  const payload = {
    title:     document.getElementById('fTitle').value.trim(),
    data_desc: document.getElementById('fDesc').value.trim()    || null,
    cat:       document.getElementById('fCat').value,
    format:    document.getElementById('fFormat').value,
    coverage:  document.getElementById('fCoverage').value.trim(),
    scale:     document.getElementById('fScale').value.trim()   || null,
    crs:       document.getElementById('fCrs').value.trim()     || null,
    year:      parseInt(document.getElementById('fYear').value) || null,
  };

  btn.disabled  = true;
  btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving…';

  try {
    const isEdit  = !!id;
    const metaRes = await fetch(isEdit ? `/api/datasets/${id}` : '/api/datasets', {
      method:  isEdit ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(payload),
    });
    const metaData = await metaRes.json();
    if (!metaRes.ok) throw new Error(metaData.error || 'Save failed');

    const recordId = isEdit ? id : metaData.id;

    if (pendingFile) {
      btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Uploading file…';
      const fd = new FormData();
      fd.append('datasetFile', pendingFile);
      const uploadRes  = await fetch(`/api/datasets/${recordId}/file`, { method: 'POST', body: fd });
      const uploadData = await uploadRes.json();
      if (!uploadRes.ok) throw new Error(uploadData.error || 'File upload failed');
    }

    showToast(isEdit ? 'Dataset updated.' : 'Dataset added.', 'success');
    closeFormModal();
    await fetchDatasets();

  } catch (err) {
    showToast(err.message || 'Failed to save dataset.', 'error');
  } finally {
    btn.disabled  = false;
    btn.innerHTML = id
      ? '<i class="fas fa-save"></i> Update Dataset'
      : '<i class="fas fa-save"></i> Save Dataset';
  }
}

/* ============================================================
   DROPZONE
============================================================ */
function dsDragOver(e) {
  e.preventDefault();
  document.getElementById('dsDropzone').classList.add('drag-over');
}
function dsDragLeave() {
  document.getElementById('dsDropzone').classList.remove('drag-over');
}
function dsDrop(e) {
  e.preventDefault();
  document.getElementById('dsDropzone').classList.remove('drag-over');
  const file = e.dataTransfer.files[0];
  if (file) dsFileSelected(file);
}

function dsFileSelected(file) {
  if (!file) return;
  pendingFile = file;
  document.getElementById('fSize').value = formatBytes(file.size);
  const ext = file.name.split('.').pop().toLowerCase();
  document.getElementById('dsFileIcon').className   = `fas ${FILE_ICONS[ext] || 'fa-file'}`;
  document.getElementById('dsFileName').textContent = file.name;
  document.getElementById('dsFileMeta').textContent = `${formatBytes(file.size)} · ${ext.toUpperCase()}`;
  document.getElementById('dsFileInfo').style.display = 'flex';
  document.getElementById('dsDropzone').style.display = 'none';

  const formatMap = {
    shp: 'SHP', tif: 'TIFF', tiff: 'TIFF',
    geojson: 'GEOJSON', json: 'GEOJSON',
    csv: 'CSV', kml: 'KML', gpkg: 'GPKG',
    pdf: 'PDF', zip: 'SHP',
  };

  const fFormat = document.getElementById('fFormat');
  if (fFormat && formatMap[ext]) {
    fFormat.value = formatMap[ext];
  }
}

function dsClearFile() {
  pendingFile = null;
  const input = document.getElementById('fDatasetFile');
  if (input) input.value = '';
  document.getElementById('fSize').value                  = '';
  document.getElementById('dsFileInfo').style.display     = 'none';
  document.getElementById('dsDropzone').style.display     = '';
  document.getElementById('dsDropzone').classList.remove('drag-over');
  document.getElementById('fFormat').value = '';
}

function formatBytes(bytes) {
  if (bytes < 1024)               return bytes + ' B';
  if (bytes < 1024 * 1024)        return (bytes / 1024).toFixed(1) + ' KB';
  if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  return (bytes / (1024 * 1024 * 1024)).toFixed(2) + ' GB';
}

/* ============================================================
   DELETE
============================================================ */
function confirmDelete(id, title) {
  deleteTargetId = id;
  document.getElementById('deleteModalText').textContent =
    `"${title}" will be permanently removed. This cannot be undone.`;
  document.getElementById('deleteModalBackdrop').classList.add('active');
  document.getElementById('deleteModal').classList.add('open');
}

function closeDeleteModal() {
  deleteTargetId = null;
  document.getElementById('deleteModalBackdrop').classList.remove('active');
  document.getElementById('deleteModal').classList.remove('open');
}

async function executeDelete() {
  if (!deleteTargetId) return;
  const btn = document.getElementById('deleteConfirmBtn');
  btn.disabled  = true;
  btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Deleting…';
  try {
    const res  = await fetch(`/api/datasets/${deleteTargetId}`, { method: 'DELETE' });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Delete failed');
    showToast('Dataset deleted.', 'success');
    closeDeleteModal();
    await fetchDatasets();
  } catch (err) {
    showToast(err.message || 'Failed to delete.', 'error');
  } finally {
    btn.disabled  = false;
    btn.innerHTML = '<i class="fas fa-trash-alt"></i> Delete';
  }
}

/* ============================================================
   TOAST
============================================================ */
function showToast(msg, type = 'success') {
  const container = document.getElementById('toastContainer');
  const el        = document.createElement('div');
  el.className    = `toast ${type}`;
  el.innerHTML    = `<i class="fas ${type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'}"></i> ${escHtml(msg)}`;
  container.appendChild(el);
  setTimeout(() => el.remove(), 3500);
}

/* ── Escape HTML ── */
function escHtml(str) {
  if (!str && str !== 0) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g,  '&lt;')
    .replace(/>/g,  '&gt;')
    .replace(/"/g,  '&quot;')
    .replace(/'/g,  '&#39;');
}