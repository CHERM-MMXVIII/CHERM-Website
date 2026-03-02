// ===============================
// User Map Requests Script
// ===============================

// ===============================
// URL Param Loader
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
            document.getElementById('recentUploadContent').innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-exclamation-circle"></i>
                    <p>Request code not found</p>
                </div>
            `;
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
        showEmptyState('No map file available yet.');
        return;
    }

    // active version index (0 = latest)
    let activeIdx = 0;

    function renderCard(idx) {
        const map = maps[idx];
        const fileUrl = map.file_url || '';
        const isPDF = fileUrl.toLowerCase().endsWith('.pdf');

        // Single global status from the request — not per-version
        const statusStr = request.status || '';

        // Map image or PDF placeholder
        const mediaHTML = isPDF
            ? `<div class="pdf-placeholder">
                    <i class="fas fa-file-pdf"></i>
                    <p>PDF Document</p>
               </div>`
            : `<img src="${fileUrl}" alt="${request.map_type || 'Map'}">`;

        // Admin notes (optional)
        const notesHTML = map.notes
            ? `<div class="admin-notes-box">
                    <div class="notes-label">
                        <i class="fas fa-sticky-note"></i> Admin Notes
                    </div>
                    <p>${map.notes}</p>
               </div>`
            : '';

        // Version history list — NO status badge per version
        const versionsHTML = maps.map((m, i) => {
            return `
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
            </div>`;
        }).join('');

        container.innerHTML = `
        <div class="viewer-layout">

            <!-- LEFT: Map Viewer -->
            <div class="viewer-main">
                <div class="viewer-topbar">
                    <div class="viewer-topbar-left">
                        <h3>Version ${maps.length - idx} &mdash; ${request.map_type || 'Map'}</h3>
                        <span>${request.area_of_interest || ''} &bull; ${request.request_code || ''}</span>
                    </div>
                    <!-- Single global status badge -->
                    <span class="status-badge-lg ${getStatusClass(statusStr)}">
                        <i class="${getStatusIcon(statusStr)}"></i>
                        ${formatStatus(statusStr)}
                    </span>
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

        </div>`;
    }

    // Expose version switcher globally so onclick works
    window.switchVersion = function (idx) {
        activeIdx = idx;
        renderCard(idx);
    };

    renderCard(activeIdx);

    // Hide the old previous maps section — versions are now in the panel
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
            <p style="font-size: 0.9rem; opacity: 0.7;">
                Your request is currently under review or pending required data. Map preparation will begin once all necessary information is available..
            </p>
        </div>`;

    const prev = document.getElementById('previousMapsSection');
    if (prev) prev.style.display = 'none';
}

// ===============================
// Download Handler
// ===============================

function downloadMap(url, code) {
    if (!url) {
        alert('Map file not available');
        return;
    }
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
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: '2-digit'
    });
}

function formatDateTime(dateStr) {
    if (!dateStr) return 'N/A';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: '2-digit'
    }) + ' at ' + d.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit'
    });
}

function formatStatus(status) {
    const key = (status || '').trim().toLowerCase().replace(/[\s-]+/g, '-');
    const map = {
        'pending':      'Pending',
        'in-progress':  'In Progress',
        'completed':    'Completed',
        'rejected':     'Rejected',
        'under-review': 'Under Review',
    };
    return map[key] || status;
}

function getStatusIcon(status) {
    const key = (status || '').trim().toLowerCase().replace(/[\s-]+/g, '-');
    const map = {
        'pending':      'fas fa-clock',
        'in-progress':  'fas fa-spinner ',
        'completed':    'fas fa-check-circle',
        'rejected':     'fas fa-times-circle',
        'under-review': 'fas fa-eye',
    };
    return map[key] || 'fas fa-info-circle';
}

function getStatusClass(status) {
    // Normalize: trim whitespace, lowercase, collapse spaces/hyphens
    const key = (status || '').trim().toLowerCase().replace(/[\s-]+/g, '-');
    const map = {
        'pending':       'status-pending',
        'in-progress':   'status-in-progress',
        'completed':     'status-completed',
        'rejected':      'status-rejected',
        'under-review':  'status-under-review',
    };
    return map[key] || 'status-pending';
}

function getFileIcon(url) {
    return url && url.toLowerCase().endsWith('.pdf')
        ? 'fas fa-file-pdf'
        : 'fas fa-file-image';
}