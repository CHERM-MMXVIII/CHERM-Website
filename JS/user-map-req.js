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

        // -------------------------------------------------------
        // WATERMARK CHANGE:
        // Instead of a plain <img>, we render into a <canvas>.
        // PDFs still use the placeholder (can't canvas a PDF easily).
        // -------------------------------------------------------
        const mediaHTML = isPDF
            ? `<div class="pdf-placeholder">
                    <i class="fas fa-file-pdf"></i>
                    <p>PDF Document</p>
               </div>`
            : `<div class="canvas-wrapper" style="position:relative; line-height:0;">
                    <canvas id="mapCanvas" style="width:100%; display:block;"></canvas>
                    <div class="wm-click-blocker" 
                         style="position:absolute;inset:0;z-index:10;cursor:default;"
                         oncontextmenu="return false;"></div>
               </div>`;

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

        // -------------------------------------------------------
        // WATERMARK: After innerHTML is set, draw onto the canvas.
        // We wait for the canvas element to exist in the DOM first.
        // -------------------------------------------------------
        if (!isPDF && fileUrl) {
            drawWatermarkedMap(
                fileUrl,
                request.request_code || 'CHERM',
                request.map_type   || 'Map'
            );
        }
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
// Watermark Engine
// ===============================
// This draws the map image onto a <canvas> and then paints the
// watermark text directly into the pixel data.
//
// WHY CANVAS?
//   A CSS overlay watermark can be deleted in DevTools in seconds.
//   A canvas-drawn watermark is baked into the pixels — screenshots,
//   right-click → Save Image, and screen recordings all capture it.
//
// PARAMETERS:
//   imageUrl   – the map file URL from your backend
//   reqCode    – e.g. "REQ-2024-001"  (shown in watermark)
//   mapType    – e.g. "Barangay Boundary Map" (shown in watermark)
// ===============================

function drawWatermarkedMap(imageUrl, reqCode, mapType) {
    const canvas = document.getElementById('mapCanvas');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const img = new Image();

    // Required so canvas doesn't taint with cross-origin images.
    // Your backend should serve images with CORS headers, or use
    // same-origin URLs — then you can remove this line.
    img.crossOrigin = 'anonymous';

    img.onload = function () {
        // Set canvas resolution to the image's natural size
        canvas.width  = img.naturalWidth;
        canvas.height = img.naturalHeight;

        // 1. Draw the clean map image
        ctx.drawImage(img, 0, 0);

        // 2. Paint the watermark pattern on top
        applyWatermark(ctx, canvas.width, canvas.height, reqCode, mapType);
    };

    img.onerror = function () {
        // If image fails to load (e.g. CORS), show a fallback message
        canvas.width  = 600;
        canvas.height = 100;
        ctx.fillStyle = '#f8d7da';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#842029';
        ctx.font = '14px monospace';
        ctx.fillText('Could not load map image. Check CORS settings on your server.', 10, 55);
    };

    img.src = imageUrl;
}

function applyWatermark(ctx, w, h, reqCode, mapType) {
    const MAIN_TEXT   = 'SLSU CHERM';
    const CLIENT_TEXT = `${reqCode} · ${mapType.toUpperCase()}`;
    const OPACITY     = 0.18;   
    const ANGLE_DEG   = -35;    
    const FONT_SIZE   = Math.max(16, Math.round(w * 0.028)); 
    const COLOR       = '#034955'; 
    const ROWS        = 5;
    const COLS        = 3;

    ctx.save();
    ctx.globalAlpha = OPACITY;
    ctx.fillStyle   = COLOR;

    const angleRad  = (ANGLE_DEG * Math.PI) / 180;
    const spacingX  = w / COLS;
    const spacingY  = h / ROWS;

    for (let row = -1; row <= ROWS + 1; row++) {
        for (let col = -1; col <= COLS + 1; col++) {
            const offsetX = (row % 2 === 0) ? 0 : spacingX / 2;
            const cx = col * spacingX + offsetX;
            const cy = row * spacingY;

            ctx.save();
            ctx.translate(cx, cy);
            ctx.rotate(angleRad);

            // Main line
            ctx.font = `bold ${FONT_SIZE}px DM Mono, monospace`;
            ctx.fillText(MAIN_TEXT, 0, 0);
            
            ctx.font = `${Math.round(FONT_SIZE * 0.65)}px DM Mono, monospace`;
            ctx.fillText(CLIENT_TEXT, 0, FONT_SIZE + 5);

            ctx.restore();
        }
    }

    ctx.restore();
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
// NOTE: The download still serves the CLEAN image from your backend.
// If you want the watermark on the downloaded file too, handle that
// server-side (burn watermark into image before serving download URL).
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