'use strict';

// ─── URL param loader (same pattern as user-manuscript-req.js) ────────────────

document.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');

    if (code) {
        loadDataRequest(code);
    } else {
        showEmptyState('No request code provided. Please go back to Services and use the Track Data button.');
    }
});

// ─── Fetch data request ───────────────────────────────────────────────────────

async function loadDataRequest(requestCode) {
    try {
        const response = await fetch(`/api/user/data-requests?code=${encodeURIComponent(requestCode)}`);

        if (!response.ok) throw new Error('Request not found');

        const data = await response.json();

        if (!data.request) throw new Error('Not found');

        displayRequest(data.request);

    } catch (err) {
        console.error('Data request lookup error:', err);
        showEmptyState("We couldn't find your data request. Please check your request code and try again.");
    }
}

// ─── Main display function ────────────────────────────────────────────────────

function displayRequest(r) {
    const content   = document.getElementById('tdrContent');
    const statusKey = normalizeStatus(r.status);
    const name      = [r.first_name, r.surname].filter(Boolean).join(' ') || '—';

    content.innerHTML = `

        <!-- Title Card -->
        <div class="tdr-title-card">
            <div class="tdr-title-left">
                <div class="tdr-request-code">${escHtml(r.request_code)}</div>
                <div class="tdr-meta">
                    <span class="tdr-meta-item">
                        <i class="fas fa-calendar-alt"></i>
                        Submitted ${formatDate(r.created_at)}
                    </span>
                    <span class="tdr-meta-item">
                        <i class="fas fa-user"></i>
                        ${escHtml(name)}
                    </span>
                    ${r.purpose ? `
                    <span class="tdr-meta-item">
                        <i class="fas fa-bullseye"></i>
                        ${escHtml(r.purpose)}
                    </span>` : ''}
                </div>
            </div>
            <span class="tdr-status-badge ${statusKey}">
                <i class="${getStatusIcon(r.status)}"></i>
                ${formatStatus(r.status)}
            </span>
        </div>

        <!-- Timeline -->
        ${buildTimeline(r)}

        <!-- Admin Remarks -->
        ${buildRemarksCard(r)}

        <!-- Two-column: datasets + details -->
        <div class="tdr-two-col">
            ${buildDatasetsCard(r.datasets || [])}
            ${buildDetailsCard(r)}
        </div>

        <!-- Delivery section (fulfilled only) -->
        ${buildDeliveryCard(r)}

    `;
}

// ─── Timeline ────────────────────────────────────────────────────────────────

const STEPS = [
    { label: 'Received',     sublabel: 'Request submitted', icon: 'fas fa-inbox'  },
    { label: 'Under Review', sublabel: 'Being evaluated',   icon: 'fas fa-search' },
    { label: 'Fulfilled',    sublabel: 'Files sent to you', icon: 'fas fa-check'  },
];

function buildTimeline(r) {
    const s          = normalizeStatus(r.status);
    const isDeclined = s === 'declined';

    let activeIdx = 0;
    if (s === 'under-review')  activeIdx = 1;
    if (s === 'fulfilled')     activeIdx = 2;
    if (s === 'declined')      activeIdx = 1;

    const fillPct = activeIdx === 0 ? 0 : activeIdx === 1 ? 50 : 100;

    const stepsHtml = STEPS.map((step, i) => {
        let wrapCls, icon;

        if (isDeclined && i === 1) {
            wrapCls = 'rejected-icon';
            icon    = 'fas fa-times';
        } else if (i < activeIdx) {
            wrapCls = 'completed';
            icon    = 'fas fa-check';
        } else if (i === activeIdx) {
            wrapCls = isDeclined ? 'rejected-icon' : 'active';
            icon    = isDeclined ? 'fas fa-times' : step.icon;
        } else {
            wrapCls = 'pending';
            icon    = step.icon;
        }

        const sublabel = (isDeclined && i === 1) ? 'Request declined' : step.sublabel;

        return `
        <div class="timeline-step">
            <div class="step-icon ${wrapCls}">
                <i class="${icon}"></i>
            </div>
            <div class="step-label">${step.label}</div>
            <div class="step-sublabel">${sublabel}</div>
        </div>`;
    }).join('');

    return `
    <div class="progress-card">
        <h3>Request Progress</h3>
        <div class="timeline">
            <div class="timeline-line">
                <div class="timeline-line-fill" style="width:${fillPct}%"></div>
            </div>
            ${stepsHtml}
        </div>
    </div>`;
}

// ─── Remarks card ─────────────────────────────────────────────────────────────

function buildRemarksCard(r) {
    if (!r.admin_notes || !r.admin_notes.trim()) return '';
    return `
    <div class="tdr-remarks-card">
        <div class="tdr-remarks-icon"><i class="fas fa-comment-dots"></i></div>
        <div class="tdr-remarks-body">
            <div class="tdr-remarks-label">Remarks from CHERM</div>
            <div class="tdr-remarks-text">${escHtml(r.admin_notes)}</div>
        </div>
    </div>`;
}

// ─── Datasets card ────────────────────────────────────────────────────────────

function buildDatasetsCard(datasets) {
    const iconMap = {
        'SHP': 'fa-layer-group', 'GEOJSON': 'fa-code', 'KML': 'fa-map-marked-alt',
        'TIFF': 'fa-image', 'CSV': 'fa-table', 'PDF': 'fa-file-pdf',
        'ZIP': 'fa-file-archive', 'GPKG': 'fa-database',
    };

    const listHtml = datasets.length
        ? datasets.map(d => {
            const title = escHtml(d.dataset_title || d.title || '—');
            const fmt   = (d.format || '').toUpperCase();
            const icon  = iconMap[fmt] || 'fa-map';
            const meta  = [d.coverage, d.year].filter(Boolean).join(' · ');
            return `
            <div class="tdr-dataset-item">
                <div class="tdr-dataset-icon"><i class="fas ${icon}"></i></div>
                <div class="tdr-dataset-info">
                    <div class="tdr-dataset-title">${title}</div>
                    ${meta ? `<div class="tdr-dataset-meta">${escHtml(meta)}</div>` : ''}
                </div>
                ${fmt ? `<span class="tdr-dataset-fmt">${escHtml(fmt)}</span>` : ''}
            </div>`;
        }).join('')
        : `<p style="color:var(--text-muted);font-size:0.88rem;">No datasets listed.</p>`;

    return `
    <div class="tdr-info-card">
        <div class="card-title"><i class="fas fa-layer-group"></i> Datasets Requested</div>
        ${listHtml}
    </div>`;
}

// ─── Details card ─────────────────────────────────────────────────────────────

function buildDetailsCard(r) {
    const fields = [
        { icon: 'fa-envelope',    label: 'Email',       value: r.email       },
        { icon: 'fa-building',    label: 'Affiliation', value: r.affiliation },
        { icon: 'fa-user-tag',    label: 'Client Type', value: r.client_type ? capitalize(r.client_type) : null },
        { icon: 'fa-sticky-note', label: 'Notes',       value: r.notes       },
    ].filter(f => f.value && String(f.value).trim());

    const fieldsHtml = fields.map(f => `
    <div class="author-field">
        <div class="author-field-icon"><i class="fas ${f.icon}"></i></div>
        <div class="author-field-info">
            <span class="author-field-label">${f.label}</span>
            <span class="author-field-value">${escHtml(String(f.value))}</span>
        </div>
    </div>`).join('');

    return `
    <div class="tdr-info-card">
        <div class="card-title"><i class="fas fa-user-circle"></i> Request Details</div>
        <div class="author-list">${fieldsHtml || '<p style="color:var(--text-muted);font-size:0.88rem;">No additional details.</p>'}</div>
    </div>`;
}

// ─── Delivery card ────────────────────────────────────────────────────────────

function buildDeliveryCard(r) {
    const s        = normalizeStatus(r.status);
    const files    = r.delivered_files || [];
    const hasFiles = files.length > 0;
    const hasLink  = !!(r.delivery_link && r.delivery_link.trim());

    if (s !== 'fulfilled' || (!hasFiles && !hasLink)) return '';

    let innerHtml = '';

    if (hasFiles) {
        innerHtml += `
        <div class="tdr-delivery-section-label">
            <i class="fas fa-file-download"></i> Files
        </div>
        <div class="tdr-delivery-files">
        ${files.map(f => {
            const ext  = (f.filename || '').split('.').pop().toLowerCase();
            const icon = fileIconFa(ext);
            const size = f.file_size ? `<div class="tdr-delivery-file-meta">${escHtml(f.file_size)}</div>` : '';
            return `
            <div class="tdr-delivery-file">
                <div class="tdr-delivery-file-icon"><i class="fas ${icon}"></i></div>
                <div class="tdr-delivery-file-info">
                    <div class="tdr-delivery-file-name">${escHtml(f.filename || 'File')}</div>
                    ${size}
                </div>
                <a href="${escHtml(f.file_path || '#')}" class="download-btn" download>
                    <i class="fas fa-download"></i> Download
                </a>
            </div>`;
        }).join('')}
        </div>`;
    }

    if (hasLink) {
        innerHtml += `
        <div class="tdr-delivery-section-label" style="margin-top:${hasFiles ? '20px' : '0'}">
            <i class="fas fa-external-link-alt"></i> External Link
        </div>
        <div class="tdr-external-link">
            <div class="tdr-external-link-icon"><i class="fas fa-link"></i></div>
            <div class="tdr-external-link-info">
                <div class="tdr-external-link-label">Access your files via external link</div>
                <div class="tdr-external-link-url">${escHtml(r.delivery_link)}</div>
            </div>
            <a href="${escHtml(r.delivery_link)}" target="_blank" rel="noopener"
               class="download-btn" style="background:#0ea5e9; box-shadow:0 4px 12px rgba(14,165,233,0.2);">
                <i class="fas fa-external-link-alt"></i> Open
            </a>
        </div>`;
    }

    return `
    <div class="download-card-wrap">
        <div class="download-card-icon">
            <i class="fas fa-check-circle"></i>
        </div>
        <div class="download-card-info">
            <h5>Your Files Are Ready</h5>
            <p>Your requested datasets have been prepared and are available below.</p>
            <div style="margin-top:16px;">${innerHtml}</div>
        </div>
    </div>`;
}

// ─── Empty state ──────────────────────────────────────────────────────────────

function showEmptyState(message) {
    document.getElementById('tdrContent').innerHTML = `
    <div class="empty-state">
        <i class="fas fa-map-marked-alt"></i>
        <p>${escHtml(message)}</p>
        <p style="font-size:0.85rem;margin-top:6px;opacity:0.7;">
            Please check your request code or contact us at
            <a href="mailto:cherm4a@slsu.edu.ph" style="color:var(--primary-color);">cherm4a@slsu.edu.ph</a>
        </p>
    </div>`;
}

// ─── Utilities ────────────────────────────────────────────────────────────────

function normalizeStatus(s) {
    return (s || '').trim().toLowerCase().replace(/[\s-]+/g, '-');
}

function formatStatus(s) {
    const map = {
        'pending':      'Pending',
        'under-review': 'Under Review',
        'fulfilled':    'Fulfilled',
        'declined':     'Declined',
    };
    return map[normalizeStatus(s)] || (s || 'Pending');
}

function getStatusIcon(s) {
    const map = {
        'pending':      'fas fa-clock',
        'under-review': 'fas fa-eye',
        'fulfilled':    'fas fa-check-circle',
        'declined':     'fas fa-times-circle',
    };
    return map[normalizeStatus(s)] || 'fas fa-info-circle';
}

function fileIconFa(ext) {
    const m = {
        pdf: 'fa-file-pdf', zip: 'fa-file-archive',
        shp: 'fa-layer-group', tif: 'fa-image', tiff: 'fa-image',
        csv: 'fa-table', geojson: 'fa-code', json: 'fa-code',
        kml: 'fa-map-marked-alt', gpkg: 'fa-database',
    };
    return m[ext] || 'fa-file-alt';
}

function formatDate(dateStr) {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleDateString('en-US', {
        year: 'numeric', month: 'short', day: '2-digit'
    });
}

function capitalize(str) {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1);
}

function escHtml(s) {
    return String(s ?? '')
        .replace(/&/g, '&amp;').replace(/</g, '&lt;')
        .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}