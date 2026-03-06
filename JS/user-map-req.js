// ===============================
// User Map Requests Script
// ===============================

document.addEventListener('DOMContentLoaded', async () => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');

    if (!code) return;

    try {
        const response = await fetch(`/api/user/map-requests?code=${encodeURIComponent(code)}`);
        if (!response.ok) throw new Error('Request not found');

        const data = await response.json();

        if (!data.request) {
            showEmptyState('Request code not found.');
            return;
        }

        displayRecentUpload(data.request);

    } catch (err) {
        console.error(err);
        showEmptyState('Could not load your request. Please check the code and try again.');
    }
});

// ===============================
// Display Recent Upload
// ===============================

function displayRecentUpload(request) {
    const container = document.getElementById('recentUploadContent');
    if (!container || !request) return;

    const maps = request.admin_maps || [];

    if (maps.length === 0) {
        showEmptyState('No map file available yet. Your request is being processed.');
        return;
    }

    let activeIdx = 0;

    function renderCard(idx) {
        const map = maps[idx];
        const fileUrl = map.file_url || '';
        const isPDF = fileUrl.toLowerCase().endsWith('.pdf');
        const statusStr = request.status || '';

        // Map image or PDF placeholder
        const mediaHTML = isPDF
            ? `<div class="pdf-placeholder">
                    <i class="fas fa-file-pdf"></i>
                    <p>PDF Document</p>
               </div>`
            : `<img src="${fileUrl}" alt="${request.map_type || 'Map'}">`;

        // Admin notes
        const notesHTML = map.notes
            ? `<div class="admin-notes-box">
                    <div class="notes-label">
                        <i class="fas fa-sticky-note"></i> Admin Notes
                    </div>
                    <p>${map.notes}</p>
               </div>`
            : '';

        // Version history list
        const versionsHTML = maps.map((m, i) => `
            <div class="version-item ${i === idx ? 'active' : ''}" onclick="switchVersion(${i})">
                <div class="version-radio"></div>
                <div class="version-body">
                    <div class="version-top">
                        <span class="version-name">
                            <i class="${getFileIcon(m.file_url)}"></i>
                            Version ${maps.length - i}
                        </span>
                    </div>
                    <div class="version-filename">
                        ${m.file_url ? m.file_url.split('/').pop() : 'N/A'}
                    </div>
                    ${m.notes ? `<div class="version-note">"${m.notes}"</div>` : ''}
                    <div class="version-date">${formatDateTime(m.created_at)}</div>
                </div>
            </div>
        `).join('');

        container.innerHTML = `

            <!-- Title Card -->
            <div class="title-card">
                <div>
                    <h2>${request.map_type || 'Map Request'}</h2>
                    <div class="request-meta">
                        <div class="meta-item">
                            <i class="fas fa-hashtag"></i>
                            <span>${request.request_code || ''}</span>
                        </div>
                        <div class="meta-item">
                            <i class="far fa-calendar"></i>
                            <span>Submitted ${formatDate(request.created_at)}</span>
                        </div>
                        ${request.area_of_interest ? `
                        <div class="meta-item">
                            <i class="fas fa-map-marker-alt"></i>
                            <span>${request.area_of_interest}</span>
                        </div>` : ''}
                    </div>
                </div>
                <span class="status-badge ${getStatusClass(statusStr)}">
                    <i class="${getStatusIcon(statusStr)}"></i>
                    ${formatStatus(statusStr)}
                </span>
            </div>

            <!-- Map Viewer + Version Panel -->
            <div class="viewer-layout">

                <!-- LEFT: Map Viewer -->
                <div class="viewer-main">
                    <div class="viewer-topbar">
                        <div class="viewer-topbar-left">
                            <h3>Version ${maps.length - idx} &mdash; ${request.map_type || 'Map'}</h3>
                            <span>${request.area_of_interest || ''} &bull; ${request.request_code || ''}</span>
                        </div>
                    </div>

                    <div class="map-frame">${mediaHTML}</div>

                    ${notesHTML}

                    <div class="viewer-footer">
                        <span class="viewer-footer-meta">
                            <i class="fas fa-calendar-alt"></i>
                            Uploaded on ${formatDateTime(map.created_at)}
                        </span>
                        <button class="download-btn"
                                onclick="downloadMap('${fileUrl}', '${request.request_code}')">
                            <i class="fas fa-download"></i> Download Map
                        </button>
                    </div>
                </div>

                <!-- RIGHT: Version History -->
                <div class="version-panel">
                    <div class="version-panel-header">
                        <h4>Version History</h4>
                        <span>${maps.length} version${maps.length !== 1 ? 's' : ''}</span>
                    </div>
                    <div class="version-list">${versionsHTML}</div>
                </div>

            </div>
        `;
    }

    // Expose version switcher globally so onclick works
    window.switchVersion = function (idx) {
        activeIdx = idx;
        renderCard(idx);
    };

    renderCard(activeIdx);

    const prevSection = document.getElementById('previousMapsSection');
    if (prevSection) prevSection.style.display = 'none';
}

// ===============================
// Empty State
// ===============================

function showEmptyState(message = 'No map uploads found') {
    const container = document.getElementById('recentUploadContent');
    if (!container) return;

    container.innerHTML = `
        <div class="empty-state">
            <i class="fas fa-map-marked-alt"></i>
            <p>${message}</p>
            <p style="font-size: 0.85rem; margin-top: 4px; opacity: 0.7;">
                Your request is currently under review or pending required data. Map preparation will begin once all necessary information is available.
            </p>
        </div>`;

    const prev = document.getElementById('previousMapsSection');
    if (prev) prev.style.display = 'none';
}

// ===============================
// Download Handler
// ===============================

function downloadMap(url, code) {
    if (!url) { alert('Map file not available'); return; }
    const link = document.createElement('a');
    link.href = url;
    link.download = `map_${code}`;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// ===============================
// Utility Helpers
// ===============================

function formatDate(dateStr) {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleDateString('en-US', {
        year: 'numeric', month: 'short', day: '2-digit'
    });
}

function formatDateTime(dateStr) {
    if (!dateStr) return 'N/A';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', {
        year: 'numeric', month: 'long', day: '2-digit'
    }) + ' at ' + d.toLocaleTimeString('en-US', {
        hour: '2-digit', minute: '2-digit'
    });
}

function normalizeStatus(status) {
    return (status || '').trim().toLowerCase().replace(/[\s-]+/g, '-');
}

function formatStatus(status) {
    const map = {
        'pending':      'Pending',
        'in-progress':  'In Progress',
        'completed':    'Completed',
        'rejected':     'Rejected',
        'under-review': 'Under Review',
    };
    return map[normalizeStatus(status)] || status;
}

function getStatusIcon(status) {
    const map = {
        'pending':      'fas fa-clock',
        'in-progress':  'fas fa-spinner',
        'completed':    'fas fa-check-circle',
        'rejected':     'fas fa-times-circle',
        'under-review': 'fas fa-eye',
    };
    return map[normalizeStatus(status)] || 'fas fa-info-circle';
}

function getStatusClass(status) {
    const map = {
        'pending':      'status-pending',
        'in-progress':  'status-in-progress',
        'completed':    'status-completed',
        'rejected':     'status-rejected',
        'under-review': 'status-under-review',
    };
    return map[normalizeStatus(status)] || 'status-pending';
}

function getFileIcon(url) {
    return url && url.toLowerCase().endsWith('.pdf')
        ? 'fas fa-file-pdf'
        : 'fas fa-file-image';
}