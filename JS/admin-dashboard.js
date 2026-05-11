// ==================== LOAD LOGGED-IN USER INFO ====================
document.addEventListener('DOMContentLoaded', async () => {
    const emailEl = document.getElementById('userEmail');
    const nameEl  = document.getElementById('userFullName');
    const firstEl = document.getElementById('userFirstName');

    if (!emailEl && !nameEl && !firstEl) return;

    try {
        const res = await fetch('/api/me', { credentials: 'include' });
        if (!res.ok) { window.location.href = '/login'; return; }
        const data = await res.json();
        if (emailEl) emailEl.textContent = data.email;
        if (nameEl)  nameEl.textContent  = `${data.firstName} ${data.lastName}`;
        if (firstEl) firstEl.textContent = `${data.firstName}!`;
    } catch (err) {
        console.error('Failed to load user info:', err);
    }
});

// ==================== MODAL ====================
function showConfirmModal(title, message, onConfirm) {
    const modalHTML = `
        <div class="modal" id="confirmModal">
            <div class="modal-content centered">
                <h3>${title}</h3>
                <p>${message}</p>
                <div class="modal-actions">
                    <button class="btn-secondary" onclick="closeConfirmModal()">Cancel</button>
                    <button class="btn-primary" onclick="confirmAction()">Yes, Continue</button>
                </div>
            </div>
        </div>`;
    const existing = document.getElementById('confirmModal');
    if (existing) existing.remove();
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    setTimeout(() => {
        const modal = document.getElementById('confirmModal');
        if (modal) modal.classList.remove('hidden');
    }, 10);
    window.confirmModalCallback = onConfirm;
}

function closeConfirmModal() {
    const modal = document.getElementById('confirmModal');
    if (modal) modal.remove();
    window.confirmModalCallback = null;
}

function confirmAction() {
    if (window.confirmModalCallback) window.confirmModalCallback();
    closeConfirmModal();
}

// ==================== SIDEBAR TOGGLE ====================
const sidebar            = document.getElementById('sidebar');
const sidebarToggle      = document.getElementById('sidebarToggle');
const mobileMenuToggle   = document.getElementById('mobileMenuToggle');

if (sidebarToggle) {
    sidebarToggle.addEventListener('click', () => {
        if (sidebar) {
            sidebar.classList.toggle('collapsed');
            localStorage.setItem('sidebarCollapsed', sidebar.classList.contains('collapsed'));
        }
    });
}

if (mobileMenuToggle) {
    mobileMenuToggle.addEventListener('click', () => {
        if (sidebar) sidebar.classList.toggle('active');
    });
}

document.addEventListener('click', (e) => {
    if (window.innerWidth <= 1024 && sidebar) {
        if (!sidebar.contains(e.target) && mobileMenuToggle && !mobileMenuToggle.contains(e.target)) {
            sidebar.classList.remove('active');
        }
    }
});

window.addEventListener('DOMContentLoaded', () => {
    if (!sidebar) return;
    const sidebarState = localStorage.getItem('sidebarCollapsed');
    if (sidebarState === 'true' && window.innerWidth > 1024) {
        sidebar.classList.add('collapsed');
    } else if (window.innerWidth > 1024) {
        sidebar.classList.remove('collapsed');
    }
});

// ==================== NAVIGATION ====================
const navItems = document.querySelectorAll('.nav-item');
navItems.forEach(item => {
    item.addEventListener('click', function () {
        navItems.forEach(n => n.classList.remove('active'));
        this.classList.add('active');
    });
});

// ==================== TOAST ====================
function showToast(message, duration = 3000) {
    const toast = document.getElementById('toast');
    if (!toast) return;
    const span = toast.querySelector('span');
    if (span) span.textContent = message;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), duration);
}

// ==================== LOGOUT ====================
const logoutBtn = document.querySelector('.logout-btn');
if (logoutBtn) {
    logoutBtn.addEventListener('click', (e) => {
        e.preventDefault();
        showConfirmModal(
            'Logout Confirmation',
            'Are you sure you want to logout?',
            async () => {
                showToast('Logging out...', 1000);
                try {
                    await fetch('/logout', { method: 'POST', credentials: 'include' });
                    window.location.href = '/login';
                } catch (err) {
                    window.location.href = '/login';
                }
            }
        );
    });
}

// ==================== VIEW ALL ACTIVITY ====================
const viewAllBtn = document.querySelector('.view-all-btn');
if (viewAllBtn) {
    viewAllBtn.addEventListener('click', () => {
        showToast('Loading all activities...');
    });
}

// ==================== RESPONSIVE ====================
function handleResize() {
    if (window.innerWidth > 1024 && sidebar) sidebar.classList.remove('active');
}
window.addEventListener('resize', handleResize);

// ==================== RECENT ACTIVITY ====================
async function refreshActivity() {
    try {
        const res  = await fetch('/api/activity/recent', { credentials: 'include' });
        const data = await res.json();
        const container = document.querySelector('.activity-list');
        if (!container) return;
        container.innerHTML = '';

        data.activities.forEach(act => {
            let iconClass = 'info';
            let iconHTML  = '<i class="fas fa-info-circle"></i>';
            if (act.action_type === 'create') { iconClass = 'success'; iconHTML = '<i class="fas fa-check"></i>'; }
            if (act.action_type === 'update') { iconClass = 'info';    iconHTML = '<i class="fas fa-edit"></i>'; }
            if (act.action_type === 'delete') { iconClass = 'warning'; iconHTML = '<i class="fas fa-trash"></i>'; }

            const item = document.createElement('div');
            item.classList.add('activity-item');
            item.innerHTML = `
                <div class="activity-icon ${iconClass}">${iconHTML}</div>
                <div class="activity-details">
                    <h4>${capitalizeAction(act.action_type)} ${act.entity_type}</h4>
                    <p>${act.message}</p>
                    <span class="activity-time">${formatRelativeTime(act.created_at)}</span>
                </div>`;
            container.appendChild(item);
        });
    } catch (err) {
        console.error('Failed to load activity logs:', err);
    }
}

function capitalizeAction(str) { return str.charAt(0).toUpperCase() + str.slice(1); }

function formatRelativeTime(timestamp) {
    const diff = Math.floor((new Date() - new Date(timestamp)) / 1000);
    if (diff < 60)   return `${diff} seconds ago`;
    if (diff < 3600) return `${Math.floor(diff/60)} minutes ago`;
    if (diff < 86400)return `${Math.floor(diff/3600)} hours ago`;
    return `${Math.floor(diff/86400)} days ago`;
}

setInterval(refreshActivity, 60000);

// ==================== STATISTICS ====================
let serviceChartInstance     = null;
let clientTypeChartInstance  = null;
let affiliationChartInstance = null;
let timelineChartInstance    = null;

// Map service names → stat card IDs and service badge IDs
const SERVICE_MAP = {
    'Map Request':       { statId: 'statMapCount',        badgeId: 'svcMapBadge' },
    'Training Request':  { statId: 'statTrainingCount',   badgeId: 'svcTrainingBadge' },
    'Manuscript Review': { statId: 'statManuscriptCount', badgeId: 'svcManuscriptBadge' },
    'Data Request':      { statId: 'statDataCount',       badgeId: 'svcDataBadge' },
};

async function loadStatistics() {
    try {
        const res  = await fetch('/api/statistics', { credentials: 'include' });
        const data = await res.json();

        const TEAL_PALETTE = [
            '#008080', '#0e9c9c', '#20c997', '#48d1cc',
            '#80cbc4', '#b2dfdb', '#034955', '#005f5f'
        ];

        // ── Stat pills + service badges ──────────────────────────────
        // Reset all to 0 first
        Object.values(SERVICE_MAP).forEach(({ statId, badgeId }) => {
            const statEl  = document.getElementById(statId);
            const badgeEl = document.getElementById(badgeId);
            if (statEl)  { statEl.textContent  = '0'; statEl.dataset.animated = 'true'; }
            if (badgeEl) badgeEl.textContent = '0';
        });

        // Fill real values
        data.byService.forEach(row => {
            const mapping = SERVICE_MAP[row.service];
            if (!mapping) return;

            const statEl  = document.getElementById(mapping.statId);
            const badgeEl = document.getElementById(mapping.badgeId);
            if (statEl)  { statEl.textContent  = row.total; statEl.dataset.animated = 'true'; }
            if (badgeEl) badgeEl.textContent = row.total;
        });

        // ── Pie Chart: by Service ────────────────────────────────────
        const serviceCtx = document.getElementById('serviceChart');
        if (serviceCtx) {
            if (serviceChartInstance) serviceChartInstance.destroy();
            serviceChartInstance = new Chart(serviceCtx, {
                type: 'pie',
                data: {
                    labels:   data.byService.map(r => r.service),
                    datasets: [{ data: data.byService.map(r => r.total), backgroundColor: TEAL_PALETTE, borderColor: '#fff', borderWidth: 2 }]
                },
                options: {
                    responsive: true, maintainAspectRatio: false,
                    plugins: { legend: { position: 'bottom', labels: { padding: 14, font: { size: 11 } } } }
                }
            });
        }

        // ── Doughnut Chart: by Client Type ───────────────────────────
        const clientCtx = document.getElementById('clientTypeChart');
        if (clientCtx) {
            if (clientTypeChartInstance) clientTypeChartInstance.destroy();
            clientTypeChartInstance = new Chart(clientCtx, {
                type: 'doughnut',
                data: {
                    labels:   data.byClientType.map(r => r.client_type || 'Unknown'),
                    datasets: [{ data: data.byClientType.map(r => r.total), backgroundColor: TEAL_PALETTE, borderColor: '#fff', borderWidth: 2 }]
                },
                options: {
                    responsive: true, maintainAspectRatio: false,
                    plugins: { legend: { position: 'bottom', labels: { padding: 14, font: { size: 11 } } } }
                }
            });
        }

        // ── Bar Chart: Top Affiliations ──────────────────────────────
        const affCtx = document.getElementById('affiliationChart');
        if (affCtx) {
            if (affiliationChartInstance) affiliationChartInstance.destroy();
            affiliationChartInstance = new Chart(affCtx, {
                type: 'bar',
                data: {
                    labels:   data.byAffiliation.map(r => r.affiliation || 'Unknown'),
                    datasets: [{ label: 'Total Requests', data: data.byAffiliation.map(r => r.total), backgroundColor: '#008080', borderRadius: 6, borderSkipped: false }]
                },
                options: {
                    responsive: true, maintainAspectRatio: false,
                    plugins: { legend: { display: false } },
                    scales: {
                        y: { beginAtZero: true, ticks: { stepSize: 1 }, grid: { color: 'rgba(0,0,0,0.04)' } },
                        x: {
                            grid: { display: false },
                            ticks: { callback: function(val) {
                                const label = this.getLabelForValue(val);
                                return label.length > 20 ? label.substring(0,18) + '…' : label;
                            }}
                        }
                    }
                }
            });
        }

        // ── Line Chart: Requests Over Time ───────────────────────────
        const timeCtx = document.getElementById('timelineChart');
        if (timeCtx && data.byMonth) {
            const months   = [...new Set(data.byMonth.map(r => r.month))].sort();
            const services = [...new Set(data.byMonth.map(r => r.service))];

            const serviceColors = {
                'Map Request':       '#008080',
                'Training Request':  '#0e9c9c',
                'Manuscript Review': '#20c997',
                'Data Request':      '#034955'
            };

            const datasets = services.map(service => ({
                label:            service,
                data:             months.map(month => {
                    const found = data.byMonth.find(r => r.month === month && r.service === service);
                    return found ? parseInt(found.total) : 0;
                }),
                borderColor:      serviceColors[service] || '#008080',
                backgroundColor:  (serviceColors[service] || '#008080') + '22',
                fill:             true,
                tension:          0.4,
                pointRadius:      4,
                pointHoverRadius: 6
            }));

            if (timelineChartInstance) timelineChartInstance.destroy();
            timelineChartInstance = new Chart(timeCtx, {
                type: 'line',
                data: { labels: months, datasets },
                options: {
                    responsive: true, maintainAspectRatio: false,
                    plugins: { legend: { position: 'bottom', labels: { padding: 14, font: { size: 11 } } } },
                    scales: {
                        y: { beginAtZero: true, ticks: { stepSize: 1 }, grid: { color: 'rgba(0,0,0,0.04)' } },
                        x: { grid: { display: false } }
                    }
                }
            });
        }

    } catch (err) {
        console.error('Failed to load statistics:', err);
    }
}

// ==================== INIT ====================
document.addEventListener('DOMContentLoaded', () => {
    refreshActivity();
    loadStatistics();
    console.log('Dashboard initialized');
});

// ==================== PERFORMANCE ====================
if ('performance' in window) {
    window.addEventListener('load', () => {
        const perf = performance.getEntriesByType('navigation')[0];
        console.log('Page load time:', Math.round(perf.loadEventEnd - perf.fetchStart), 'ms');
    });
}