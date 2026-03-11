/* ============================================================
   user-geodata-req.js  —  Place in: JS/user-geodata-req.js
   Datasets are loaded live from GET /api/datasets
============================================================ */

/* ── DATA CLEANING HELPERS ── */
function toTitleCase(str) {
  if (!str) return '';
  return str.toLowerCase().split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}
function toSentenceCase(str) {
  if (!str) return '';
  return str.toLowerCase().charAt(0).toUpperCase() + str.toLowerCase().slice(1);
}
function toLowerCaseEmail(str) {
  if (!str) return '';
  return str.toLowerCase().trim();
}

/* ── STATE ── */
let DATASETS     = [];   // populated from API on load
let currentCat   = 'all';
let searchTerm   = '';
let selectedIds  = new Set();
let currentMetaId = null;
let clientType   = 'internal';

/* ── INIT ── */
document.addEventListener('DOMContentLoaded', () => {
  loadDatasets();

  // Data cleaning — blur listeners
  const _titleCase = ['firstName', 'surname'];
  const _sentCase  = ['notes', 'otherPurpose'];
  const _emailCase = ['email'];

  _titleCase.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('blur', function () { this.value = toTitleCase(this.value); });
  });
  _sentCase.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('blur', function () { this.value = toSentenceCase(this.value); });
  });
  _emailCase.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('blur', function () { this.value = toLowerCaseEmail(this.value); });
  });
});

/* ─────────────────────────────────────────
   LOAD DATASETS FROM API
───────────────────────────────────────── */
async function loadDatasets() {
  const tbody = document.getElementById('dataTableBody');
  tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; padding:32px; color:#999;">
    <i class="fas fa-spinner fa-spin"></i> Loading datasets…
  </td></tr>`;

  try {
    const res  = await fetch('/api/datasets');
    if (!res.ok) throw new Error('Server error ' + res.status);
    const data = await res.json();
    DATASETS   = Array.isArray(data) ? data : [];
    renderTable();
    updateSelectionBar();
  } catch (err) {
    console.error('Failed to load datasets:', err);
    tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; padding:32px; color:#c0392b;">
      <i class="fas fa-exclamation-circle"></i> Failed to load datasets. Please refresh the page.
    </td></tr>`;
  }
}

/* ─────────────────────────────────────────
   HELPERS
───────────────────────────────────────── */
function catLabel(cat) {
  const map = {
    hazard: 'Hazard', landuse: 'Land Use', topo: 'Topographic',
    boundary: 'Boundary', infra: 'Infrastructure', env: 'Environment'
  };
  return map[cat] || cat;
}

// Normalise field names: DB uses data_desc; old dummy data used desc
function getDesc(d)   { return d.data_desc || d.desc || ''; }
function getSize(d)   { return d.size || '—'; }
function getScale(d)  { return d.scale || '—'; }
function getCrs(d)    { return d.crs || '—'; }

/* ─────────────────────────────────────────
   DATASET TABLE
───────────────────────────────────────── */
function renderTable() {
  const body = document.getElementById('dataTableBody');

  const filtered = DATASETS.filter(d => {
    const matchCat  = currentCat === 'all' || d.cat === currentCat;
    const desc      = getDesc(d);
    const matchTerm = d.title.toLowerCase().includes(searchTerm)
                   || (d.coverage || '').toLowerCase().includes(searchTerm)
                   || desc.toLowerCase().includes(searchTerm);
    return matchCat && matchTerm;
  });

  document.getElementById('noResults').style.display = filtered.length ? 'none' : 'block';

  body.innerHTML = filtered.map(d => `
    <tr id="row-${d.id}" class="${selectedIds.has(d.id) ? 'selected' : ''}" onclick="toggleRow(${d.id}, event)">
      <td><input type="checkbox" ${selectedIds.has(d.id) ? 'checked' : ''} onclick="toggleRow(${d.id}, event)"></td>
      <td>
        <div class="dataset-name">${escHtml(d.title)}</div>
        <div class="dataset-desc">${escHtml(getDesc(d).substring(0, 90))}${getDesc(d).length > 90 ? '…' : ''}</div>
      </td>
      <td style="white-space:nowrap; font-size:12px; color:var(--text-muted);">${escHtml(d.coverage || '—')}</td>
      <td><span class="tag ${escHtml(d.cat || '')}">${catLabel(d.cat)}</span></td>
      <td><span class="format-badge ${(d.format || '').toLowerCase()}">${escHtml(d.format || '—')}</span></td>
      <td>
        <button class="btn-meta" onclick="openMeta(${d.id}, event)">
          <i class="fas fa-info-circle"></i> Info
        </button>
      </td>
      <td>
        <button class="btn-preview" onclick="openPreview(${d.id}, event)">
          <i class="fas fa-file-alt"></i> Preview
        </button>
      </td>
    </tr>
  `).join('');
}

function filterCat(el, cat) {
  document.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
  el.classList.add('active');
  currentCat = cat;
  renderTable();
}

function filterData() {
  searchTerm = document.getElementById('dataSearch').value.toLowerCase();
  renderTable();
}

function toggleRow(id, e) {
  if (e && e.target.tagName === 'BUTTON') return;
  if (selectedIds.has(id)) selectedIds.delete(id);
  else selectedIds.add(id);
  renderTable();
  updateSelectionBar();
}

function updateSelectionBar() {
  const bar = document.getElementById('selectionBar');
  const btn = document.getElementById('btnStep3');

  document.getElementById('selCount').textContent = selectedIds.size;

  const names = [...selectedIds]
    .map(id => DATASETS.find(d => d.id === id)?.title)
    .filter(Boolean);
  document.getElementById('selectedNames').textContent = names.join(' · ');

  bar.classList.toggle('show', selectedIds.size > 0);
  btn.disabled = selectedIds.size === 0;
}

function clearSelection() {
  selectedIds.clear();
  renderTable();
  updateSelectionBar();
}

/* ─────────────────────────────────────────
   METADATA MODAL
───────────────────────────────────────── */
function openMeta(id, e) {
  if (e) e.stopPropagation();
  const d = DATASETS.find(x => x.id === id);
  if (!d) return;

  currentMetaId = id;

  document.getElementById('metaTitle').textContent    = d.title;
  document.getElementById('metaSubtitle').textContent = `${d.coverage || '—'} · ${d.year || '—'}`;
  document.getElementById('metaDesc').textContent     = getDesc(d) || 'No description available.';

  // Build metadata grid — only show fields that have values
  const fields = [
    ['Coverage', d.coverage],
    ['Year',     d.year],
    ['Format',   d.format],
    ['Scale',    d.scale],
    ['CRS',      d.crs],
    ['File Size', d.size],
  ].filter(([, v]) => v);

  document.getElementById('metaGrid').innerHTML = fields.map(([k, v]) => `
    <div class="meta-cell">
      <div class="k">${k}</div>
      <div class="v">${escHtml(String(v))}</div>
    </div>
  `).join('');

  const selBtn = document.getElementById('metaSelectBtn');
  if (selectedIds.has(id)) {
    selBtn.innerHTML        = '<i class="fas fa-check"></i> Added';
    selBtn.style.background = 'var(--success)';
  } else {
    selBtn.innerHTML        = '<i class="fas fa-plus"></i> Add to Request';
    selBtn.style.background = '';
  }

  document.getElementById('metaOverlay').classList.add('open');
}

function selectFromMeta() {
  if (!currentMetaId) return;
  if (selectedIds.has(currentMetaId)) selectedIds.delete(currentMetaId);
  else selectedIds.add(currentMetaId);
  renderTable();
  updateSelectionBar();
  openMeta(currentMetaId); // refresh button state
}

function closeMetaModal() {
  document.getElementById('metaOverlay').classList.remove('open');
}

function closeMeta(e) {
  if (e.target === document.getElementById('metaOverlay')) closeMetaModal();
}

/* ─────────────────────────────────────────
   CLIENT TYPE
───────────────────────────────────────── */
function setClientType(type) {
  clientType = type;
  document.getElementById('clientType').value = type;

  document.querySelectorAll('.client-pill').forEach(p => {
    p.classList.toggle('active', p.dataset.type === type);
  });

  const hint = document.getElementById('emailHint');
  hint.classList.toggle('show', type === 'internal');

  document.getElementById('affiliationLabel').innerHTML =
    (type === 'internal' ? 'Office / College' : 'Office / Agency / Organization') +
    ' <span class="req">*</span>';

  document.getElementById('affiliation').placeholder =
    type === 'internal' ? 'e.g. College of Engineering' : 'e.g. LGU Lucena City';
}

/* ─────────────────────────────────────────
   PURPOSE
───────────────────────────────────────── */
function selectPurpose(el) {
  document.querySelectorAll('.purpose-card').forEach(c => c.classList.remove('selected'));
  el.classList.add('selected');

  const val = el.dataset.purpose;
  document.getElementById('purposeVal').value = val;
  document.getElementById('otherPurposeWrap').style.display = val === 'Other' ? 'flex' : 'none';

  toggleSubmit();
}

/* ─────────────────────────────────────────
   TOS / SUBMIT GATE
───────────────────────────────────────── */
function toggleSubmit() {
  const tos     = document.getElementById('tosCheck').checked;
  const purpose = document.getElementById('purposeVal').value;
  document.getElementById('btnSubmit').disabled = !(tos && purpose);
}

/* ─────────────────────────────────────────
   STEP NAVIGATION
───────────────────────────────────────── */
function goToStep(n) {
  if (n === 2 && !validateStep1()) return;
  if (n === 3) populateReview();

  document.querySelectorAll('.panel').forEach((p, i) => {
    p.classList.toggle('active', i === n - 1);
  });

  document.querySelectorAll('.step-item').forEach((s, i) => {
    s.classList.remove('active', 'done');
    if (i < n - 1) s.classList.add('done');
    if (i === n - 1) s.classList.add('active');
  });

  document.querySelectorAll('.step-item').forEach((s, i) => {
    const numEl = s.querySelector('.step-num');
    if (s.classList.contains('done')) {
      numEl.innerHTML = '<i class="fas fa-check" style="font-size:12px;"></i>';
    } else {
      numEl.textContent = i + 1;
    }
  });

  document.querySelector('.main-card').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

/* ─────────────────────────────────────────
   VALIDATION — STEP 1
───────────────────────────────────────── */
function validateStep1() {
  const emailEl = document.getElementById('email');
  const firstEl = document.getElementById('firstName');
  const surEl   = document.getElementById('surname');
  const affEl   = document.getElementById('affiliation');

  // Clean before validating
  if (emailEl) emailEl.value = toLowerCaseEmail(emailEl.value);
  if (firstEl) firstEl.value = toTitleCase(firstEl.value);
  if (surEl)   surEl.value   = toTitleCase(surEl.value);

  const email = emailEl.value.trim();
  const first = firstEl.value.trim();
  const sur   = surEl.value.trim();
  const aff   = affEl.value.trim();

  [emailEl, firstEl, surEl, affEl].forEach(el => el.classList.remove('error'));

  if (!email) {
    emailEl.classList.add('error');
    alert('Please enter your email address.');
    return false;
  }
  if (clientType === 'internal' && !email.endsWith('@slsu.edu.ph')) {
    emailEl.classList.add('error');
    alert('Internal clients must use their SLSU email (@slsu.edu.ph).');
    return false;
  }
  if (!first) {
    firstEl.classList.add('error');
    alert('Please enter your first name.');
    return false;
  }
  if (!sur) {
    surEl.classList.add('error');
    alert('Please enter your surname.');
    return false;
  }
  if (!aff) {
    affEl.classList.add('error');
    alert('Please enter your office or affiliation.');
    return false;
  }

  return true;
}

/* ─────────────────────────────────────────
   POPULATE REVIEW (STEP 3)
───────────────────────────────────────── */
function populateReview() {
  document.getElementById('rv-clientType').textContent =
    clientType === 'internal' ? 'Internal (SLSU)' : 'External';

  document.getElementById('rv-name').textContent =
    document.getElementById('firstName').value.trim() + ' ' +
    document.getElementById('surname').value.trim();

  document.getElementById('rv-email').textContent =
    document.getElementById('email').value.trim();

  document.getElementById('rv-affiliation').textContent =
    document.getElementById('affiliation').value.trim();

  const datasets = [...selectedIds]
    .map(id => DATASETS.find(d => d.id === id))
    .filter(Boolean);

  document.getElementById('rv-count').textContent = datasets.length;

  document.getElementById('rv-datasets').innerHTML = datasets.map(d => `
    <div class="review-dataset-item">
      <i class="fas fa-layer-group"></i>
      ${escHtml(d.title)}
      <span class="format-badge ${(d.format || '').toLowerCase()}" style="margin-left:4px;">${escHtml(d.format || '—')}</span>
    </div>
  `).join('');
}

/* ─────────────────────────────────────────
   SUBMIT  —  POST to /api/data-requests
───────────────────────────────────────── */
async function submitRequest() {
  const btn = document.getElementById('btnSubmit');
  btn.disabled  = true;
  btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Submitting…';

  // Clean fields before submission
  const firstEl = document.getElementById('firstName');
  const surEl   = document.getElementById('surname');
  const emailEl = document.getElementById('email');
  const notesEl = document.getElementById('notes');
  const otherEl = document.getElementById('otherPurpose');

  if (firstEl) firstEl.value = toTitleCase(firstEl.value);
  if (surEl)   surEl.value   = toTitleCase(surEl.value);
  if (emailEl) emailEl.value = toLowerCaseEmail(emailEl.value);
  if (notesEl) notesEl.value = toSentenceCase(notesEl.value);
  if (otherEl) otherEl.value = toSentenceCase(otherEl.value);

  const purpose = document.getElementById('purposeVal').value;
  const finalPurpose = purpose === 'Other'
    ? document.getElementById('otherPurpose').value.trim() || 'Other'
    : purpose;

  const datasets = [...selectedIds]
    .map(id => DATASETS.find(d => d.id === id))
    .filter(Boolean)
    .map(d => ({
      id:       d.id,
      title:    d.title,
      format:   d.format   || null,
      coverage: d.coverage || null,
      year:     d.year     || null,
    }));

  const payload = {
    clientType:  document.getElementById('clientType').value,
    email:       document.getElementById('email').value.trim(),
    firstName:   document.getElementById('firstName').value.trim(),
    surname:     document.getElementById('surname').value.trim(),
    affiliation: document.getElementById('affiliation').value.trim(),
    purpose:     finalPurpose,
    notes:       document.getElementById('notes').value.trim()   || null,
    datasets:    datasets,
  };

  try {
    const res  = await fetch('/api/data-requests', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(payload),
    });
    const data = await res.json();

    if (!res.ok) throw new Error(data.error || 'Submission failed');

    document.getElementById('successCode').textContent = data.requestCode;

    document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
    document.getElementById('panel-4').classList.add('active');

    document.querySelectorAll('.step-item').forEach(s => {
      s.classList.remove('active');
      s.classList.add('done');
      s.querySelector('.step-num').innerHTML = '<i class="fas fa-check" style="font-size:12px;"></i>';
    });

    document.querySelector('.main-card').scrollIntoView({ behavior: 'smooth', block: 'start' });

  } catch (err) {
    alert('Submission failed: ' + (err.message || 'Please try again.'));
    btn.disabled  = false;
    btn.innerHTML = '<i class="fas fa-paper-plane"></i> Submit Request';
  }
}

/* ─────────────────────────────────────────
   COPY CODE
───────────────────────────────────────── */
function copyCode() {
  const code = document.getElementById('successCode').textContent;
  navigator.clipboard.writeText(code).then(() => {
    const btn = document.querySelector('.btn-copy-code');
    btn.innerHTML = '<i class="fas fa-check"></i>';
    setTimeout(() => { btn.innerHTML = '<i class="fas fa-copy"></i>'; }, 2000);
  });
}

/* ─────────────────────────────────────────
   RESET FORM
───────────────────────────────────────── */
function resetForm() {
  selectedIds.clear();
  currentCat  = 'all';
  searchTerm  = '';
  clientType  = 'internal';

  document.getElementById('email').value       = '';
  document.getElementById('firstName').value   = '';
  document.getElementById('surname').value     = '';
  document.getElementById('affiliation').value = '';
  document.getElementById('notes').value       = '';
  document.getElementById('purposeVal').value  = '';
  document.getElementById('tosCheck').checked  = false;
  document.getElementById('clientType').value  = 'internal';

  document.querySelectorAll('.purpose-card').forEach(c => c.classList.remove('selected'));
  document.querySelectorAll('.chip').forEach((c, i) => c.classList.toggle('active', i === 0));
  document.getElementById('otherPurposeWrap').style.display = 'none';
  document.getElementById('emailHint').classList.add('show');

  document.querySelectorAll('.client-pill').forEach(p => {
    p.classList.toggle('active', p.dataset.type === 'internal');
  });

  document.getElementById('affiliationLabel').innerHTML = 'Office / College <span class="req">*</span>';
  document.getElementById('affiliation').placeholder    = 'e.g. College of Engineering';

  renderTable();
  updateSelectionBar();
  goToStep(1);
}

/* ─────────────────────────────────────────
   DOCUMENT PREVIEW MODAL
───────────────────────────────────────── */
var IMAGE_EXTS = ['png','jpg','jpeg','tif','tiff','webp','bmp'];
var PDF_EXTS   = ['pdf'];
var CSV_EXTS   = ['csv'];

function getExtension(url) {
  if (!url) return null;
  return url.split('.').pop().toLowerCase().split('?')[0];
}

function openPreview(id, e) {
  if (e) e.stopPropagation();
  var d = DATASETS.find(function(x) { return x.id === id; });
  if (!d) return;

  document.getElementById('prevTitle').textContent    = d.title;
  document.getElementById('prevSubtitle').textContent =
    (d.format || '—') + ' \u00b7 ' + (d.coverage || '—') + ' \u00b7 ' + (d.year || '—');
  document.getElementById('prevDatasetId').value      = id;

  var container = document.getElementById('prevPagesContainer');
  container.innerHTML = '';

  var freeBar     = document.getElementById('prevFreeBar');
  var freeBarText = document.getElementById('prevFreeBarText');
  // Use preview_url if set; fall back to file_path for previewable file types
  var PREVIEWABLE_EXTS = ['pdf','png','jpg','jpeg','webp','bmp','csv'];
  var previewUrl = d.preview_url || d.previewUrl || null;
  if (!previewUrl && d.file_path) {
    var _fe = getExtension(d.file_path);
    if (PREVIEWABLE_EXTS.indexOf(_fe) > -1) previewUrl = d.file_path;
  }
  var ext = getExtension(previewUrl);

  if (!previewUrl) {
    freeBar.className       = 'preview-free-bar preview-free-bar--placeholder';
    freeBarText.textContent = 'No preview file uploaded yet. Showing a sample document layout.';
    renderPlaceholderPreview(container, d);
  } else if (PDF_EXTS.indexOf(ext) > -1) {
    freeBar.className       = 'preview-free-bar';
    freeBarText.textContent = 'Pages 1\u20132 are freely viewable. Remaining pages require an approved request.';
    renderPdfPreview(previewUrl, container, d);
  } else if (IMAGE_EXTS.indexOf(ext) > -1) {
    freeBar.className       = 'preview-free-bar preview-free-bar--image';
    freeBarText.textContent = 'Sample thumbnail of the dataset. Full-resolution file requires an approved request.';
    renderImagePreview(previewUrl, container, d);
  } else if (CSV_EXTS.indexOf(ext) > -1) {
    freeBar.className       = 'preview-free-bar preview-free-bar--csv';
    freeBarText.textContent = 'Showing the first 50 rows. The complete dataset requires an approved request.';
    renderCsvPreview(previewUrl, container, d);
  } else {
    freeBar.className       = 'preview-free-bar preview-free-bar--placeholder';
    freeBarText.textContent = 'Preview not available for this file type. Submit a request to access the full dataset.';
    renderUnsupportedPreview(container, d);
  }

  document.getElementById('previewOverlay').classList.add('open');
  document.body.style.overflow = 'hidden';
}

/* ── PLACEHOLDER ── */
function renderPlaceholderPreview(container, d) {
  container.innerHTML += buildPlaceholderPage(1, d, false);
  container.innerHTML += buildPlaceholderPage(2, d, false);
  for (var i = 3; i <= 5; i++) container.innerHTML += buildPlaceholderPage(i, d, true);
  container.innerHTML += buildGateOverlay(d);
}

function buildPlaceholderPage(pageNum, d, blurred) {
  var lines = generateFakeContent(pageNum, d);
  return '<div class="prev-page ' + (blurred ? 'blurred' : '') + '">'
    + '<div class="prev-page-inner">'
    + '<div class="prev-page-header">'
    + '<div class="prev-page-logo">CHERM</div>'
    + '<div class="prev-page-meta">' + escHtml(d.title) + ' &nbsp;|&nbsp; Page ' + pageNum + '</div>'
    + '</div>'
    + '<div class="prev-page-body">'
    + (pageNum === 1
        ? '<div class="fake-doc-title">' + escHtml(d.title) + '</div>'
          + '<div class="fake-doc-sub">' + escHtml(d.coverage || '—') + ' &middot; ' + (d.year || '—') + '</div>'
          + '<div class="prev-page-divider"></div>'
        : '')
    + lines
    + '</div>'
    + '<div class="prev-page-footer">'
    + '<span>Center for Hazard and Environmental Resource Mapping (CHERM)</span>'
    + '<span>Page ' + pageNum + '</span>'
    + '</div>'
    + '</div>'
    + '<div class="prev-page-num">Page ' + pageNum + '</div>'
    + '</div>';
}

function generateFakeContent(pageNum, d) {
  if (pageNum === 1) {
    return '<div class="fake-section">1. Introduction</div>'
      + fakePara(4) + fakePara(3)
      + '<div class="fake-section">2. Dataset Summary</div>'
      + '<div class="fake-table">'
      + fakeRow(true,  'Attribute',         'Value')
      + fakeRow(false, 'Coverage',          d.coverage || '—')
      + fakeRow(false, 'Coordinate System', d.crs      || '—')
      + fakeRow(false, 'Scale',             d.scale    || '—')
      + fakeRow(false, 'Format',            d.format   || '—')
      + fakeRow(false, 'File Size',         d.size     || '—')
      + '</div>';
  }
  if (pageNum === 2) {
    return '<div class="fake-section">3. Methodology</div>'
      + fakePara(4) + fakePara(4)
      + '<div class="fake-figure"><i class="fas fa-map"></i><span>Figure 1. Map extent &mdash; ' + escHtml(d.coverage || '—') + '</span></div>'
      + fakePara(2);
  }
  return '<div class="fake-section">' + pageNum + '. Continued</div>'
    + fakePara(5) + fakePara(4) + fakePara(3);
}

function fakePara(lines) {
  var html = '<div class="fake-para">';
  for (var i = 0; i < lines; i++) {
    var w = 68 + Math.floor(Math.random() * 30);
    html += '<div class="fake-line" style="width:' + w + '%"></div>';
  }
  return html + '</div>';
}

function fakeRow(header, a, b) {
  return '<div class="fake-table-row' + (header ? ' header' : '') + '">'
    + '<div class="fake-table-cell">' + escHtml(String(a)) + '</div>'
    + '<div class="fake-table-cell">' + escHtml(String(b)) + '</div>'
    + '</div>';
}

/* ── PDF PREVIEW ── */
function renderPdfPreview(url, container, d) {
  container.innerHTML = '<div class="prev-loading"><i class="fas fa-spinner fa-spin"></i><span>Loading PDF...</span></div>';

  if (typeof pdfjsLib === 'undefined') {
    container.innerHTML = '';
    renderPlaceholderPreview(container, d);
    return;
  }

  pdfjsLib.getDocument(url).promise.then(function(pdf) {
    container.innerHTML = '';
    var total = pdf.numPages;
    var free  = Math.min(2, total);

    function renderPage(num, blurred) {
      return pdf.getPage(num).then(function(page) {
        var scale  = Math.min(1.4, container.clientWidth / page.getViewport({scale:1}).width * 0.95);
        var vp     = page.getViewport({ scale: scale });
        var canvas = document.createElement('canvas');
        canvas.width  = vp.width;
        canvas.height = vp.height;
        page.render({ canvasContext: canvas.getContext('2d'), viewport: vp });

        var wrap  = document.createElement('div');
        wrap.className = 'prev-page prev-page--pdf' + (blurred ? ' blurred' : '');
        var label = document.createElement('div');
        label.className   = 'prev-page-num';
        label.textContent = 'Page ' + num;
        wrap.appendChild(canvas);
        wrap.appendChild(label);
        container.appendChild(wrap);
      });
    }

    var tasks = [];
    for (var i = 1; i <= free; i++)                       tasks.push(renderPage(i, false));
    for (var j = free + 1; j <= Math.min(total, 5); j++) tasks.push(renderPage(j, true));

    Promise.all(tasks).then(function() {
      container.insertAdjacentHTML('beforeend', buildGateOverlay(d));
    });

  }).catch(function(err) {
    console.warn('PDF load failed:', err);
    container.innerHTML = '';
    renderPlaceholderPreview(container, d);
  });
}

/* ── IMAGE PREVIEW ── */
function renderImagePreview(url, container, d) {
  container.innerHTML = '<div class="prev-loading"><i class="fas fa-spinner fa-spin"></i><span>Loading image...</span></div>';

  var img = new Image();
  img.onload = function() {
    container.innerHTML = '';

    var wrap  = document.createElement('div');
    wrap.className = 'prev-image-wrap';
    var imgEl = document.createElement('img');
    imgEl.src = url; imgEl.className = 'prev-image'; imgEl.alt = d.title;
    wrap.appendChild(imgEl);
    container.appendChild(wrap);

    var blurWrap  = document.createElement('div');
    blurWrap.className = 'prev-image-wrap blurred';
    var imgEl2 = document.createElement('img');
    imgEl2.src = url; imgEl2.className = 'prev-image'; imgEl2.alt = '';
    blurWrap.appendChild(imgEl2);
    container.appendChild(blurWrap);

    container.insertAdjacentHTML('beforeend', buildGateOverlayImage(d));
  };
  img.onerror = function() {
    container.innerHTML = '';
    renderUnsupportedPreview(container, d);
  };
  img.src = url;
}

/* ── CSV PREVIEW ── */
function renderCsvPreview(url, container, d) {
  container.innerHTML = '<div class="prev-loading"><i class="fas fa-spinner fa-spin"></i><span>Loading CSV...</span></div>';

  fetch(url)
    .then(function(r) { return r.text(); })
    .then(function(text) {
      container.innerHTML = '';
      var lines   = text.trim().split('\n');
      var headers = parseCsvLine(lines[0]);
      var rows    = lines.slice(1, 51);
      var total   = lines.length - 1;

      var html = '<div class="prev-csv-wrap">'
        + '<div class="prev-csv-info">'
        + '<i class="fas fa-table"></i> Showing <strong>' + rows.length + '</strong> of <strong>' + total + '</strong> rows'
        + ' &nbsp;&middot;&nbsp; ' + headers.length + ' columns'
        + '</div>'
        + '<div class="prev-csv-scroll">'
        + '<table class="prev-csv-table">'
        + '<thead><tr>' + headers.map(function(h) { return '<th>' + escHtml(h) + '</th>'; }).join('') + '</tr></thead>'
        + '<tbody>';

      rows.forEach(function(line, idx) {
        var cells = parseCsvLine(line);
        var cls   = idx >= 40 ? ' class="fading"' : '';
        html += '<tr' + cls + '>' + cells.map(function(c) { return '<td>' + escHtml(c) + '</td>'; }).join('') + '</tr>';
      });

      html += '</tbody></table></div></div>';
      container.innerHTML = html;
      container.insertAdjacentHTML('beforeend', buildGateOverlay(d));
    })
    .catch(function() {
      container.innerHTML = '';
      renderUnsupportedPreview(container, d);
    });
}

function parseCsvLine(line) {
  var result = [], cur = '', inQ = false;
  for (var i = 0; i < line.length; i++) {
    var ch = line[i];
    if (ch === '"') { inQ = !inQ; }
    else if (ch === ',' && !inQ) { result.push(cur.trim()); cur = ''; }
    else { cur += ch; }
  }
  result.push(cur.trim());
  return result;
}

/* ── UNSUPPORTED FORMAT ── */
function renderUnsupportedPreview(container, d) {
  var iconMap = {
    'SHP': 'fas fa-layer-group', 'GEOJSON': 'fas fa-code',
    'KML': 'fas fa-map-marked-alt', 'TIFF': 'fas fa-image', 'CSV': 'fas fa-table',
  };
  var icon = iconMap[d.format] || 'fas fa-file-alt';

  container.innerHTML = '<div class="prev-unsupported">'
    + '<div class="prev-unsupported-icon"><i class="' + icon + '"></i></div>'
    + '<div class="prev-unsupported-format">' + escHtml(d.format || '—') + '</div>'
    + '<h3>' + escHtml(d.title) + '</h3>'
    + '<p>In-browser preview is not available for <strong>' + escHtml(d.format || '—') + '</strong> files. '
    + 'You can request access to download and open this dataset in GIS software (e.g. QGIS, ArcGIS).</p>'
    + '<div class="prev-unsupported-specs">'
    + '<div class="prev-spec-item"><span class="prev-spec-label">Coverage</span><span>' + escHtml(d.coverage || '—') + '</span></div>'
    + '<div class="prev-spec-item"><span class="prev-spec-label">CRS</span><span>'      + escHtml(d.crs      || '—') + '</span></div>'
    + '<div class="prev-spec-item"><span class="prev-spec-label">Scale</span><span>'    + escHtml(d.scale    || '—') + '</span></div>'
    + '<div class="prev-spec-item"><span class="prev-spec-label">File Size</span><span>' + escHtml(d.size   || '—') + '</span></div>'
    + '</div>'
    + '<button class="btn btn-primary" onclick="gateAddToRequest(' + d.id + ')" style="margin-top:24px;">'
    + '<i class="fas fa-plus"></i> Add to My Request'
    + '</button>'
    + '</div>';
}

/* ── GATE OVERLAYS ── */
function buildGateOverlay(d) {
  return '<div class="prev-gate">'
    + '<div class="prev-gate-inner">'
    + '<div class="prev-gate-icon"><i class="fas fa-lock"></i></div>'
    + '<h3>Full Document Restricted</h3>'
    + '<p>You are viewing a free preview of <strong>' + escHtml(d.title) + '</strong>. '
    + 'The complete dataset is accessible only to approved requestors.</p>'
    + '<button class="btn btn-primary" onclick="gateAddToRequest(' + d.id + ')">'
    + '<i class="fas fa-plus"></i> Add to My Request'
    + '</button>'
    + '<div class="prev-gate-note">'
    + '<i class="fas fa-info-circle"></i> '
    + 'Submit a data request to receive the full dataset and documentation.'
    + '</div>'
    + '</div>'
    + '</div>';
}

function buildGateOverlayImage(d) {
  return '<div class="prev-gate prev-gate--image">'
    + '<div class="prev-gate-inner">'
    + '<div class="prev-gate-icon"><i class="fas fa-lock"></i></div>'
    + '<h3>Full-Resolution Restricted</h3>'
    + '<p>This is a low-resolution sample of <strong>' + escHtml(d.title) + '</strong>. '
    + 'The full-resolution file (' + escHtml(d.size || '—') + ') is available to approved requestors.</p>'
    + '<button class="btn btn-primary" onclick="gateAddToRequest(' + d.id + ')">'
    + '<i class="fas fa-plus"></i> Add to My Request'
    + '</button>'
    + '<div class="prev-gate-note">'
    + '<i class="fas fa-info-circle"></i> '
    + 'Submit a data request to receive the full dataset and documentation.'
    + '</div>'
    + '</div>'
    + '</div>';
}

function gateAddToRequest(id) {
  selectedIds.add(id);
  renderTable();
  updateSelectionBar();
  closePreviewModal();
}

function closePreviewModal() {
  document.getElementById('previewOverlay').classList.remove('open');
  document.body.style.overflow = '';
}

function closePreview(e) {
  if (e.target === document.getElementById('previewOverlay')) closePreviewModal();
}

/* ── ESCAPE HTML ── */
function escHtml(str) {
  return String(str)
    .replace(/&/g,'&amp;').replace(/</g,'&lt;')
    .replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}