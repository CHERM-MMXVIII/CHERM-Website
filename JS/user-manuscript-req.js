// Configuration
const API_BASE_URL = '/api/user/manuscript-requests';

// ─── Timeline step definitions ────────────────────────────────────────────────

// Full 5-step flow: Pending / Under-review / In-progress / Awaiting Approval / Completed
const STEPS_NORMAL = [
    { key: 'received',          label: 'Received',            sublabel: 'Manuscript submitted',          icon: 'fas fa-paper-plane'     },
    { key: 'initial_review',    label: 'Initial Review',      sublabel: 'Assessing your submission',     icon: 'fas fa-clipboard-check' },
    { key: 'expert_evaluation', label: 'Expert Evaluation',   sublabel: 'Manuscript being evaluated',    icon: 'fas fa-search'          },
    { key: 'awaiting_approval', label: 'Awaiting Approval',   sublabel: 'Pending your confirmation',     icon: 'fas fa-user-check'      },
    { key: 'review_complete',   label: 'Review Complete',     sublabel: 'Review finished successfully',  icon: 'fas fa-check-circle'    }
];

// Shortened 3-step flow: Rejected (Expert Evaluation + Awaiting Approval hidden)
const STEPS_REJECTED = [
    { key: 'received',        label: 'Received',        sublabel: 'Manuscript submitted',      icon: 'fas fa-paper-plane'     },
    { key: 'initial_review',  label: 'Initial Review',  sublabel: 'Assessing your submission', icon: 'fas fa-clipboard-check' },
    { key: 'review_complete', label: 'Review Complete', sublabel: 'Manuscript not accepted',   icon: 'fas fa-times-circle'    }
];

// ─── Normalize status string ──────────────────────────────────────────────────

function normalizeStatus(status) {
    return (status || '').trim().toLowerCase().replace(/[\s-]+/g, '-');
}

// ─── Active step index ────────────────────────────────────────────────────────

function getActiveStepIndex(status, isRejected, hasReviewedFile, userApproved) {
    if (isRejected) return 2; // always lands on last step (Review Complete ✗)

    const key = normalizeStatus(status);

    // Completed — all steps done
    if (key === 'completed') return 4;

    // In-progress + reviewed file link present → Awaiting Approval
    if (key === 'in-progress' && hasReviewedFile && !userApproved) return 3;

    const map = {
        'pending':      0,
        'under-review': 1,
        'in-progress':  2,
    };
    return map[key] ?? 0;
}

// ─── URL param loader ─────────────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');

    if (code) {
        loadManuscriptReview(code);
    } else {
        showEmptyState();
    }
});

// ─── Fetch manuscript review ──────────────────────────────────────────────────

async function loadManuscriptReview(requestCode) {
    try {
        const response = await fetch(`${API_BASE_URL}?code=${encodeURIComponent(requestCode)}`);

        if (!response.ok) throw new Error('Failed to load manuscript review');

        const data = await response.json();

        if (!data.request) throw new Error('Manuscript review not found');

        displayReview(data.request);

    } catch (error) {
        console.error('Error loading manuscript review:', error);
        showEmptyState('We couldn\'t find your manuscript review. Please check your request code.');
    }
}

// ─── Build timeline HTML ──────────────────────────────────────────────────────

function buildTimeline(review) {
    const isRejected = normalizeStatus(review.status) === 'declined';
    const hasReviewedFile = !!review.reviewed_file_url;
    const userApproved    = !!review.user_approved;

    const steps        = isRejected ? STEPS_REJECTED : STEPS_NORMAL;
    const totalSegments = steps.length - 1;
    const activeIndex  = getActiveStepIndex(review.status, isRejected, hasReviewedFile, userApproved);
    const fillPercent  = Math.min((activeIndex / totalSegments) * 100, 100);

    const stepDates = isRejected
        ? [review.submitted_at || review.created_at, review.reviewed_at || null, review.decided_at || null]
        : [review.submitted_at || review.created_at, review.reviewed_at || null, review.peer_review_at || null, review.approved_at || null, review.decided_at || null];

    const stepsHtml = steps.map((step, i) => {
        let iconWrapClass, iconClass;
        const isLastStep = i === steps.length - 1;

        if (i < activeIndex) {
            iconWrapClass = 'completed';
            iconClass     = 'fas fa-check';
        } else if (i === activeIndex) {
            if (isRejected && isLastStep) {
                iconWrapClass = 'rejected-icon';
                iconClass     = 'fas fa-times';
            } else if (!isRejected && isLastStep) {
                iconWrapClass = 'completed';
                iconClass     = 'fas fa-check';
            } else {
                iconWrapClass = 'active';
                iconClass     = step.icon;
            }
        } else {
            iconWrapClass = 'pending';
            iconClass     = step.icon;
        }

        return `
            <div class="timeline-step">
                <div class="step-icon ${iconWrapClass}">
                    <i class="${iconClass}"></i>
                </div>
                <div class="step-label">${step.label}</div>
                <div class="step-sublabel">${step.sublabel}</div>
                ${stepDates[i] ? `<div class="step-date">${formatDate(stepDates[i])}</div>` : ''}
            </div>
        `;
    }).join('');

    return `
        <div class="progress-card">
            <h3>Review Progress</h3>
            <div class="timeline">
                <div class="timeline-line">
                    <div class="timeline-line-fill" style="width: ${fillPercent}%"></div>
                </div>
                ${stepsHtml}
            </div>
        </div>
    `;
}

// ─── Build approval card ──────────────────────────────────────────────────────
// Shown when admin has added a reviewed file link and user hasn't approved yet

function buildApprovalCard(review) {
    if (!review.reviewed_file_url) return '';

    const isCompleted = normalizeStatus(review.status) === 'completed';
    const approved    = !!review.user_approved;

    if (approved || isCompleted) {
        // Already approved — show a read-only confirmation
        return `
            <div class="approval-card approved">
                <div class="approval-card-icon">
                    <i class="fas fa-check-circle"></i>
                </div>
                <div class="approval-card-info">
                    <h5>You have approved this manuscript</h5>
                    <p>The reviewed file has been confirmed and the request is now complete.</p>
                    <a href="${review.reviewed_file_url}" target="_blank" class="reviewed-link">
                        <i class="fas fa-external-link-alt"></i> Open Reviewed File
                    </a>
                </div>
            </div>
        `;
    }

    // Pending approval — show link + approve button
    return `
        <div class="approval-card pending-approval">
            <div class="approval-card-icon pulse">
                <i class="fas fa-user-check"></i>
            </div>
            <div class="approval-card-info">
                <h5>Your reviewed manuscript is ready</h5>
                <p>Please review the file below. Once you're satisfied, click <strong>Approve</strong> to confirm receipt and complete the process.</p>
                <a href="${review.reviewed_file_url}" target="_blank" class="reviewed-link">
                    <i class="fas fa-external-link-alt"></i> Open Reviewed File
                </a>
            </div>
            <div class="approval-actions">
                <button class="approve-btn" onclick="approveManuscript('${review.request_code}')">
                    <i class="fas fa-check"></i> Approve
                </button>
                <button class="revision-btn" onclick="toggleRevisionForm()">
                    <i class="fas fa-edit"></i> Request Revision
                </button>
            </div>
            <div class="revision-form" id="revisionForm" style="display:none;">
                <textarea id="revisionText" placeholder="Describe the revisions or changes you are requesting..." rows="4"></textarea>
                <div class="revision-form-actions">
                    <button class="revision-cancel-btn" onclick="toggleRevisionForm()">Cancel</button>
                    <button class="revision-submit-btn" onclick="submitRevision('${review.request_code}')">
                        <i class="fas fa-paper-plane"></i> Submit Request
                    </button>
                </div>
            </div>
        </div>
    `;
}

// ─── Approve action ───────────────────────────────────────────────────────────

async function approveManuscript(requestCode) {
    const btn = document.querySelector('.approve-btn');
    if (btn) {
        btn.disabled     = true;
        btn.innerHTML    = '<i class="fas fa-spinner fa-spin"></i> Approving...';
    }

    try {
        const response = await fetch(`/api/user/manuscript-requests/${encodeURIComponent(requestCode)}/approve`, {
            method:  'POST',
            headers: { 'Content-Type': 'application/json' }
        });

        if (!response.ok) throw new Error('Approval failed');

        // Reload the review to reflect updated status
        loadManuscriptReview(requestCode);

    } catch (error) {
        console.error('Approval error:', error);
        if (btn) {
            btn.disabled  = false;
            btn.innerHTML = '<i class="fas fa-check"></i> Approve';
        }
        alert('Something went wrong. Please try again.');
    }
}

function toggleRevisionForm() {
    const form = document.getElementById('revisionForm');
    if (form) {
        form.style.display = form.style.display === 'none' ? 'block' : 'none';
        if (form.style.display === 'block') {
            document.getElementById('revisionText')?.focus();
        }
    }
}

async function submitRevision(requestCode) {
    const text = document.getElementById('revisionText')?.value.trim();
    if (!text) {
        alert('Please describe the revisions you are requesting.');
        return;
    }

    const btn = document.querySelector('.revision-submit-btn');
    if (btn) {
        btn.disabled = true;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Submitting...';
    }

    try {
        const response = await fetch(`/api/user/manuscript-requests/${encodeURIComponent(requestCode)}/revision`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ revision_notes: text })
        });

        if (!response.ok) throw new Error('Submission failed');

        loadManuscriptReview(requestCode);

    } catch (error) {
        console.error('Revision error:', error);
        if (btn) {
            btn.disabled = false;
            btn.innerHTML = '<i class="fas fa-paper-plane"></i> Submit Request';
        }
        alert('Something went wrong. Please try again.');
    }
}

// ─── Build author + documents row ─────────────────────────────────────────────

function buildInfoRow(review) {
    return `
        <div class="info-row">
            <div class="author-card">
                <div class="card-title">Author Details</div>
                <div class="author-list">
                    <div class="author-field">
                        <div class="author-field-icon"><i class="far fa-envelope"></i></div>
                        <div class="author-field-info">
                            <span class="author-field-label">Email</span>
                            <span class="author-field-value">${review.email || 'N/A'}</span>
                        </div>
                    </div>
                    <div class="author-field">
                        <div class="author-field-icon"><i class="fas fa-university"></i></div>
                        <div class="author-field-info">
                            <span class="author-field-label">Affiliation</span>
                            <span class="author-field-value">${review.affiliation || 'N/A'}</span>
                        </div>
                    </div>
                    <div class="author-field">
                        <div class="author-field-icon"><i class="fas fa-tag"></i></div>
                        <div class="author-field-info">
                            <span class="author-field-label">Client Type</span>
                            <span class="author-field-value">${review.client_type ? capitalize(review.client_type) : 'N/A'}</span>
                        </div>
                    </div>
                    <div class="author-field">
                        <div class="author-field-icon"><i class="far fa-calendar-check"></i></div>
                        <div class="author-field-info">
                            <span class="author-field-label">Review Needed By</span>
                            <span class="author-field-value">${formatDate(review.date_needed)}</span>
                        </div>
                    </div>
                </div>
            </div>

            <div class="documents-card">
                <div class="card-title">Submitted Documents</div>
                <div class="doc-list">
                    ${review.manuscript_file_path ? `
                        <a href="${review.manuscript_file_path}" target="_blank" class="document-link">
                            <div class="document-icon-wrap"><i class="fas fa-file-pdf"></i></div>
                            <div class="document-info">
                                <h5>Manuscript File</h5>
                                <p>${getFileType(review.manuscript_file_path)}</p>
                            </div>
                        </a>
                    ` : ''}
                    ${review.file_link ? `
                        <a href="${review.file_link}" target="_blank" class="document-link">
                            <div class="document-icon-wrap link-type"><i class="fas fa-external-link-alt"></i></div>
                            <div class="document-info">
                                <h5>Shared Document</h5>
                                <p>External Link</p>
                            </div>
                        </a>
                    ` : ''}
                    ${!review.manuscript_file_path && !review.file_link ? `
                        <p style="color: var(--text-muted); font-size: 0.9rem;">No documents submitted.</p>
                    ` : ''}
                </div>
            </div>
        </div>
    `;
}

// ─── Main display function ────────────────────────────────────────────────────

function displayReview(review) {
    const content   = document.getElementById('recentReviewContent');
    const statusKey = normalizeStatus(review.status);

    content.innerHTML = `
        <div class="title-card">
            <div>
                <h2>${review.manuscript_title || 'Untitled Manuscript'}</h2>
                <div class="request-meta">
                    <div class="meta-item">
                        <i class="fas fa-hashtag"></i>
                        <span>${review.request_code}</span>
                    </div>
                    <div class="meta-item">
                        <i class="far fa-calendar"></i>
                        <span>Submitted ${formatDate(review.created_at)}</span>
                    </div>
                    <div class="meta-item">
                        <i class="fas fa-user"></i>
                        <span>${review.first_name} ${review.surname}</span>
                    </div>
                </div>
            </div>
            <div class="status-badge status-${statusKey}">
                <i class="${getStatusIcon(review.status)}"></i>
                ${formatStatus(review.status)}
            </div>
        </div>

        ${buildTimeline(review)}

        ${buildApprovalCard(review)}

        ${buildInfoRow(review)}

        ${review.abstract ? `
            <div class="abstract-card">
                <div class="card-title">Abstract</div>
                <div class="abstract-text">${review.abstract}</div>
            </div>
        ` : ''}

    
        ${review.admin_notes ? `
            <div class="comments-card">
                <div class="card-title">Reviewer Comments</div>
                <div class="comments-box">${review.admin_notes}</div>
            </div>
        ` : ''}
    `;
}

// ─── Empty state ──────────────────────────────────────────────────────────────

function showEmptyState(message = 'No manuscript review found') {
    const content = document.getElementById('recentReviewContent');
    content.innerHTML = `
        <div class="empty-state">
            <i class="fas fa-file-alt"></i>
            <p>${message}</p>
            <p style="font-size: 0.9rem; margin-top: 8px; opacity: 0.7;">Please check your request code or contact us for assistance.</p>
        </div>
    `;
}

// ─── Utilities ────────────────────────────────────────────────────────────────

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

function formatStatus(status) {
    const map = {
        'pending':      'Pending',
        'under-review': 'Under Review',
        'in-progress':  'In Progress',
        'completed':    'Completed',
        'declined':     'Declined'
    };
    return map[normalizeStatus(status)] || status;
}

function getStatusIcon(status) {
    const map = {
        'pending':      'fas fa-clock',
        'under-review': 'fas fa-eye',
        'in-progress':  'fas fa-spinner fa-spin',
        'completed':    'fas fa-check-circle',
        'declined':     'fas fa-times-circle'
    };
    return map[normalizeStatus(status)] || 'fas fa-info-circle';
}

function getFileType(url) {
    if (!url) return 'File';
    const ext = url.split('.').pop().toLowerCase();
    const map = { pdf: 'PDF Document', doc: 'Word Document', docx: 'Word Document', txt: 'Text File' };
    return map[ext] || 'File';
}