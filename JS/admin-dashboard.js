// ==================== LOAD LOGGED-IN USER INFO ====================
document.addEventListener('DOMContentLoaded', async () => {
    const emailEl = document.getElementById('userEmail');
    const nameEl = document.getElementById('userFullName');
    const firstEl = document.getElementById('userFirstName');

    if (!emailEl && !nameEl && !firstEl) return;

    try {
        const res = await fetch('/api/me', {
            credentials: 'include'
        });

        if (!res.ok) {
            window.location.href = '/login';
            return;
        }

        const data = await res.json();

        if (emailEl) {
            emailEl.textContent = data.email;
        }

        if (nameEl) {
            nameEl.textContent = `${data.firstName} ${data.lastName}`;
        }

        if (firstEl) {
            firstEl.textContent = `${data.firstName}!`;
        }

    } catch (err) {
        console.error('Failed to load user info:', err);
    }
});

// ==================== MODAL FUNCTION ====================
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
        </div>
    `;
    
    const existing = document.getElementById('confirmModal');
    if (existing) existing.remove();
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    
    // CRITICAL: Make sure modal is visible
    setTimeout(() => {
        const modal = document.getElementById('confirmModal');
        if (modal) modal.classList.remove('hidden');
    }, 10);
    
    // Store the callback
    window.confirmModalCallback = onConfirm;
}

function closeConfirmModal() {
    const modal = document.getElementById('confirmModal');
    if (modal) modal.remove();
    window.confirmModalCallback = null;
}

function confirmAction() {
    if (window.confirmModalCallback) {
        window.confirmModalCallback();
    }
    closeConfirmModal();
}

// ==================== SIDEBAR TOGGLE ====================
const sidebar = document.getElementById('sidebar');
const sidebarToggle = document.getElementById('sidebarToggle');
const mobileMenuToggle = document.getElementById('mobileMenuToggle');

// Desktop sidebar collapse
if (sidebarToggle) {
    sidebarToggle.addEventListener('click', () => {
        if (sidebar) {
            sidebar.classList.toggle('collapsed');
            localStorage.setItem('sidebarCollapsed', sidebar.classList.contains('collapsed'));
        }
    });
}

// Mobile sidebar toggle
if (mobileMenuToggle) {
    mobileMenuToggle.addEventListener('click', () => {
        if (sidebar) {
            sidebar.classList.toggle('active');
        }
    });
}

// Close sidebar when clicking outside on mobile
document.addEventListener('click', (e) => {
    if (window.innerWidth <= 1024 && sidebar) {
        if (!sidebar.contains(e.target) && mobileMenuToggle && !mobileMenuToggle.contains(e.target)) {
            sidebar.classList.remove('active');
        }
    }
});

// Restore sidebar state from localStorage (only if explicitly collapsed before)
window.addEventListener('DOMContentLoaded', () => {
    if (!sidebar) return;
    
    // Only apply collapsed state if it was previously set and we're on desktop
    const sidebarState = localStorage.getItem('sidebarCollapsed');
    if (sidebarState === 'true' && window.innerWidth > 1024) {
        sidebar.classList.add('collapsed');
    } else {
        // Ensure sidebar is expanded on load for desktop
        if (window.innerWidth > 1024) {
            sidebar.classList.remove('collapsed');
        }
    }
});

// ==================== NAVIGATION ====================
const navItems = document.querySelectorAll('.nav-item');

navItems.forEach(item => {
    item.addEventListener('click', function(e) {
        // Remove active class from all items
        navItems.forEach(nav => nav.classList.remove('active'));
        
        // Add active class to clicked item
        this.classList.add('active');
    });
});

// ==================== ACTION CARDS ====================
const actionCards = document.querySelectorAll('.action-card');

actionCards.forEach(card => {
    const actionBtn = card.querySelector('.action-btn');
    const actionType = card.dataset.action;
    
    if (!actionBtn) return;
    
    // Card click handler
    card.addEventListener('click', (e) => {
        if (!e.target.closest('.action-btn')) {
            actionBtn.click();
        }
    });
    
    // Button click handler
    actionBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        handleAction(actionType);
    });
});

// ==================== ACTION HANDLERS ====================
function handleAction(actionType) {
    switch(actionType) {
        case 'banner':
            showToast('Redirecting to banner management...');
            setTimeout(() => {
                // window.location.href = '/admin/banners/update';
                console.log('Navigate to: /admin/banners/update');
            }, 1000);
            break;
            
        case 'new-event':
            showToast('Opening event creation form...');
            setTimeout(() => {
                // window.location.href = '/admin/events/create';
                console.log('Navigate to: /admin/events/create');
            }, 1000);
            break;
            
        case 'view-events':
            showToast('Loading events list...');
            setTimeout(() => {
                // window.location.href = '/admin/events';
                console.log('Navigate to: /admin/events');
            }, 1000);
            break;
            
        case 'view-banners':
            showToast('Loading banners gallery...');
            setTimeout(() => {
                // window.location.href = '/admin/banners';
                console.log('Navigate to: /admin/banners');
            }, 1000);
            break;
            
        default:
            showToast('Action not configured');
    }
}

// ==================== TOAST NOTIFICATION ====================
function showToast(message, duration = 3000) {
    const toast = document.getElementById('toast');
    if (!toast) return;
    
    const toastMessage = toast.querySelector('span');
    if (!toastMessage) return;
    
    toastMessage.textContent = message;
    toast.classList.add('show');
    
    setTimeout(() => {
        toast.classList.remove('show');
    }, duration);
}

// ==================== ANIMATIONS ON SCROLL ====================
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
        }
    });
}, observerOptions);

// Observe all cards
const cardsToObserve = document.querySelectorAll('.stat-card, .action-card, .activity-item');
cardsToObserve.forEach(el => {
    if (el) {
        el.style.opacity = '0';
        el.style.transform = 'translateY(20px)';
        el.style.transition = 'all 0.6s ease-out';
        observer.observe(el);
    }
});

// ==================== STATS COUNTER ANIMATION ====================
function animateCounter(element, target, duration = 2000) {
    let current = 0;
    const increment = target / (duration / 16);
    const isPercentage = target.toString().includes('%');
    const numericTarget = parseFloat(target);
    
    const timer = setInterval(() => {
        current += increment;
        if (current >= numericTarget) {
            current = numericTarget;
            clearInterval(timer);
        }
        
        if (isPercentage) {
            element.textContent = Math.round(current) + '%';
        } else {
            element.textContent = Math.round(current).toLocaleString();
        }
    }, 16);
}

// Animate counters when they come into view
const statCounters = document.querySelectorAll('.stat-info h3');
const counterObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting && !entry.target.dataset.animated) {
            const targetValue = entry.target.textContent.trim();
            entry.target.textContent = '0';
            animateCounter(entry.target, targetValue);
            entry.target.dataset.animated = 'true';
        }
    });
}, { threshold: 0.5 });

statCounters.forEach(counter => {
    counterObserver.observe(counter);
});

// ==================== LOGOUT FUNCTIONALITY ====================
const logoutBtn = document.querySelector('.logout-btn');

if (logoutBtn) {
    logoutBtn.addEventListener('click', (e) => {
        e.preventDefault();
        
        showConfirmModal(
            'Logout Confirmation',
            'Are you sure you want to logout?',
            async () => {
                showToast('Logging out...', 1000);
                
                // Send POST request to logout
                try {
                    await fetch('/logout', {
                        method: 'POST',
                        credentials: 'include'
                    });
                    
                    window.location.href = '/login';
                } catch (err) {
                    console.error('Logout error:', err);
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
        // window.location.href = '/admin/activity';
        console.log('Navigate to: /admin/activity');
    });
}

// ==================== RESPONSIVE ADJUSTMENTS ====================
function handleResize() {
    const width = window.innerWidth;
    
    if (width > 1024) {
        sidebar.classList.remove('active');
    }
}

window.addEventListener('resize', handleResize);

// ==================== ACTIVITY TIMESTAMP UPDATE ====================
function updateActivityTimestamps() {
    const activityTimes = document.querySelectorAll('.activity-time');
    
    activityTimes.forEach(timeElement => {
        // This would update relative time stamps in a real application
        // e.g., "2 hours ago" -> "3 hours ago" after an hour
        console.log('Update timestamp:', timeElement.textContent);
    });
}

// Update timestamps every minute
setInterval(updateActivityTimestamps, 60000);

// ==================== FEATURED CARD PULSE ====================
const featuredCard = document.querySelector('.action-card.featured');

if (featuredCard) {
    setInterval(() => {
        featuredCard.style.transform = 'scale(1.02)';
        setTimeout(() => {
            featuredCard.style.transform = 'scale(1)';
        }, 200);
    }, 5000);
}


document.addEventListener('DOMContentLoaded', () => {
    console.log('Dashboard initialized');
    
    document.documentElement.style.scrollBehavior = 'smooth';
    
    initializeComponents();
    refreshActivity();
});

function initializeComponents() {
    console.log('Components initialized');
}

// ==================== ERROR HANDLING ====================
window.addEventListener('error', (e) => {
    console.error('An error occurred:', e.error);
    // Don't show toast for every error - only log to console
});

// ==================== PERFORMANCE MONITORING ====================
if ('performance' in window) {
    window.addEventListener('load', () => {
        const perfData = performance.getEntriesByType('navigation')[0];
        console.log('Page load time:', perfData.loadEventEnd - perfData.fetchStart, 'ms');
    });
}

async function refreshActivity() {
    try {
        const res = await fetch('/api/activity/recent', { credentials: 'include' });
        const data = await res.json();

        const container = document.querySelector('.activity-list');
        if (!container) return;

        container.innerHTML = ''; // Clear old items

        data.activities.forEach(act => {
            // Determine icon class based on action type
            let iconClass = 'info';
            let iconHTML = '<i class="fas fa-info-circle"></i>';

            switch(act.action_type) {
                case 'create':
                    iconClass = 'success';
                    iconHTML = '<i class="fas fa-check"></i>';
                    break;
                case 'update':
                    iconClass = 'info';
                    iconHTML = '<i class="fas fa-edit"></i>';
                    break;
                case 'delete':
                    iconClass = 'warning';
                    iconHTML = '<i class="fas fa-trash"></i>';
                    break;
            }

            // Create activity item element
            const item = document.createElement('div');
            item.classList.add('activity-item');

            item.innerHTML = `
                <div class="activity-icon ${iconClass}">
                    ${iconHTML}
                </div>
                <div class="activity-details">
                    <h4>${capitalizeAction(act.action_type)} ${act.entity_type}</h4>
                    <p>${act.message}</p>
                    <span class="activity-time">${formatRelativeTime(act.created_at)}</span>
                </div>
            `;

            container.appendChild(item);
        });

    } catch (err) {
        console.error('Failed to load activity logs:', err);
    }
}

// Helper to capitalize first letter
function capitalizeAction(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

// Helper to convert timestamp to relative time
function formatRelativeTime(timestamp) {
    const now = new Date();
    const created = new Date(timestamp);
    const diff = Math.floor((now - created) / 1000); // seconds

    if (diff < 60) return `${diff} seconds ago`;
    if (diff < 3600) return `${Math.floor(diff/60)} minutes ago`;
    if (diff < 86400) return `${Math.floor(diff/3600)} hours ago`;
    return `${Math.floor(diff/86400)} days ago`;
}

// Call this on page load
document.addEventListener('DOMContentLoaded', () => {
    refreshActivity();
});
