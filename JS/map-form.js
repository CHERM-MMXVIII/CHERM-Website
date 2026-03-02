// ===============================
// DATA CLEANING FUNCTIONS
// ===============================

function toTitleCase(str) {
    if (!str) return '';
    return str.toLowerCase().split(' ').map(word => {
        return word.charAt(0).toUpperCase() + word.slice(1);
    }).join(' ');
}

function toSentenceCase(str) {
    if (!str) return '';
    return str.toLowerCase().charAt(0).toUpperCase() + str.toLowerCase().slice(1);
}

function toLowerCaseEmail(str) {
    if (!str) return '';
    return str.toLowerCase().trim();
}

function roundUpQuantity(value) {
    if (!value) return 0;
    const num = parseFloat(value);
    if (isNaN(num)) return 0;
    return Math.ceil(num);
}

// ===============================
// ALERT MODAL FUNCTIONS
// ===============================

function showSuccessModal(requestCode) {
    const modal = document.getElementById('successModal');
    const codeDisplay = document.getElementById('requestCodeDisplay');
    if (requestCode && codeDisplay) codeDisplay.textContent = requestCode;
    if (modal) {
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
    }
}

function closeSuccessModal() {
    const modal = document.getElementById('successModal');
    if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = '';
    }
}

function copyRequestCode() {
    const codeElement = document.getElementById('requestCodeDisplay');
    if (!codeElement) return;
    const code = codeElement.textContent;
    navigator.clipboard.writeText(code).then(() => {
        const btn = event.target.closest('.btn-copy');
        if (!btn) return;
        const originalHTML = btn.innerHTML;
        btn.innerHTML = '<i class="fas fa-check"></i>';
        btn.style.background = '#10b981';
        btn.style.color = 'white';
        setTimeout(() => {
            btn.innerHTML = originalHTML;
            btn.style.background = '';
            btn.style.color = '';
        }, 2000);
    }).catch(() => showInfoModal('Copy Failed', 'Please copy the code manually.'));
}

function showErrorModal(message = "We couldn't process your request. Please try again.") {
    const modal = document.getElementById('errorModal');
    const messageElement = document.getElementById('errorMessage');
    if (messageElement) messageElement.textContent = message;
    if (modal) {
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
    }
}

function closeErrorModal() {
    const modal = document.getElementById('errorModal');
    if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = '';
    }
}

function showLoadingModal() {
    const modal = document.getElementById('loadingModal');
    if (modal) {
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
    }
}

function closeLoadingModal() {
    const modal = document.getElementById('loadingModal');
    if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = '';
    }
}

function showInfoModal(title, message) {
    const modal = document.getElementById('infoModal');
    const titleElement = document.getElementById('infoTitle');
    const messageElement = document.getElementById('infoMessage');
    if (titleElement) titleElement.textContent = title;
    if (messageElement) messageElement.textContent = message;
    if (modal) {
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
    }
}

function closeInfoModal() {
    const modal = document.getElementById('infoModal');
    if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = '';
    }
}

function showToast(type, title, message, duration = 4000) {
    const existingToast = document.querySelector('.toast-notification');
    if (existingToast) existingToast.remove();
    const toast = document.createElement('div');
    toast.className = `toast-notification ${type}`;
    const iconMap = { success: 'fa-check-circle', error: 'fa-exclamation-circle', info: 'fa-info-circle' };
    toast.innerHTML = `
        <div class="toast-icon"><i class="fas ${iconMap[type]}"></i></div>
        <div class="toast-content">
            <div class="toast-title">${title}</div>
            <div class="toast-message">${message}</div>
        </div>
        <button class="toast-close" onclick="this.parentElement.remove()"><i class="fas fa-times"></i></button>
    `;
    document.body.appendChild(toast);
    if (duration > 0) {
        setTimeout(() => {
            toast.style.animation = 'slideOutRight 0.4s ease';
            setTimeout(() => toast.remove(), 400);
        }, duration);
    }
}

document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        closeSuccessModal();
        closeErrorModal();
        closeInfoModal();
    }
});

// ===============================
// MAP TYPE CHANGE HANDLER
// ===============================
function handleMapTypeChange() {
    const mapTypeSelect = document.getElementById('mapType');
    const customMapTypeInput = document.getElementById('customMapType');
    if (!mapTypeSelect || !customMapTypeInput) return;
    if (mapTypeSelect.value === 'Other') {
        customMapTypeInput.style.display = 'block';
        customMapTypeInput.required = true;
        customMapTypeInput.focus();
    } else {
        customMapTypeInput.style.display = 'none';
        customMapTypeInput.required = false;
        customMapTypeInput.value = '';
    }
}

// ===============================
// CLIENT TYPE TOGGLE (shared, scope-aware)
// ===============================

function selectClientType(clientType, scopeModalId = 'serviceModal4') {
    const scope = document.getElementById(scopeModalId) || document;

    // Update hidden input
    const clientTypeInput = scope.querySelector('#clientType');
    if (clientTypeInput) clientTypeInput.value = clientType;

    // Update pill buttons
    scope.querySelectorAll('.client-type-pill').forEach(pill => {
        pill.classList.toggle('active', pill.dataset.type === clientType);
    });

    // Update affiliation label / placeholder
    const affiliationLabel = scope.querySelector('#affiliationLabel');
    const affiliationInput = scope.querySelector('#affiliation');
    if (clientType === 'internal') {
        if (affiliationLabel) affiliationLabel.textContent = 'Office / College';
        if (affiliationInput) affiliationInput.placeholder = 'e.g. College of Engineering';
    } else {
        if (affiliationLabel) affiliationLabel.textContent = 'Office / Agency';
        if (affiliationInput) affiliationInput.placeholder = 'e.g. LGU Lucena City';
    }

    // Show/hide email hint
    const emailHint = scope.querySelector('#emailHint');
    if (emailHint) emailHint.style.display = clientType === 'internal' ? 'block' : 'none';

    // Update modal title label
    const titleLabel = scope.querySelector('#clientTypeLabel');
    if (titleLabel) titleLabel.textContent = clientType === 'internal' ? 'INTERNAL CLIENT' : 'EXTERNAL CLIENT';
}

// ===============================
// MODAL OPEN / CLOSE
// ===============================

function openModal3() {
    openMapRequestForm('internal');
}

function closeModal3() {
    const modal = document.getElementById('serviceModal3');
    if (modal) modal.style.display = 'none';
}

// ── Modal 4: Map Request Form ──
function openMapRequestForm(clientType) {
    const modal = document.getElementById('serviceModal4');
    if (!modal) return;
    selectClientType(clientType || 'internal', 'serviceModal4');
    modal.style.display = 'block';
}

function closeModal4() {
    const modal = document.getElementById('serviceModal4');
    if (modal) modal.style.display = 'none';
}

// ── Modal 5: Training Request Form ──
function openModal5() {
    const modal = document.getElementById('serviceModal5');
    if (!modal) return;
    selectClientType('internal', 'serviceModal5');
    modal.style.display = 'block';
}

function closeModal5() {
    const modal = document.getElementById('serviceModal5');
    if (modal) modal.style.display = 'none';
}

// ===============================
// SHARED: ATTACH DATA CLEANING TO A FORM
// Scopes all listeners to the given form element
// ===============================
function attachDataCleaning(form) {
    if (!form) return;

    ['surname', 'firstName'].forEach(id => {
        const field = form.querySelector(`#${id}`);
        if (field) field.addEventListener('blur', function () { this.value = toTitleCase(this.value); });
    });

    ['purpose', 'areaOfInterest'].forEach(id => {
        const field = form.querySelector(`#${id}`);
        if (field) field.addEventListener('blur', function () { this.value = toSentenceCase(this.value); });
    });

    const customMapTypeField = form.querySelector('#customMapType');
    if (customMapTypeField) {
        customMapTypeField.addEventListener('blur', function () { this.value = toSentenceCase(this.value); });
    }

    const emailField = form.querySelector('#email');
    if (emailField) {
        emailField.addEventListener('blur', function () { this.value = toLowerCaseEmail(this.value); });
    }

    const quantityField = form.querySelector('#quantity');
    if (quantityField) {
        quantityField.addEventListener('blur', function () { this.value = roundUpQuantity(this.value); });
    }
}

// ===============================
// SHARED: VALIDATE SLSU EMAIL (scoped to form)
// ===============================
function validateEmail(form) {
    const clientType = form.querySelector('#clientType').value;
    if (clientType === 'internal') {
        const emailField = form.querySelector('#email');
        const email = emailField ? emailField.value.trim() : '';
        if (!email.endsWith('@slsu.edu.ph')) {
            showInfoModal(
                'Invalid Email',
                'Internal clients must use their SLSU institutional email address (e.g. juan@slsu.edu.ph).'
            );
            if (emailField) emailField.focus();
            return false;
        }
    }
    return true;
}

// ===============================
// DOM READY
// ===============================
document.addEventListener('DOMContentLoaded', function () {

    // ── Grab form elements ──
    const mapForm = document.getElementById('mapRequestForm');
    const trainingForm = document.getElementById('requestForm');

    // ── Default client type on load ──
    selectClientType('internal', 'serviceModal4');
    selectClientType('internal', 'serviceModal5');

    // ── Attach data cleaning to both forms ──
    attachDataCleaning(mapForm);
    attachDataCleaning(trainingForm);

    // ================================================
    // FILE NAME DISPLAY — Map Request Form (Modal 4)
    // ================================================
    function updateUploadLabel(input) {
        if (!input || !input.files.length) return;
        const fileName = input.files[0].name;
        const wrapper = input.closest('.upload-wrapper') || input.parentElement;
        const uploadText = wrapper ? wrapper.querySelector('.upload-text') : null;
        if (uploadText) uploadText.textContent = fileName;
    }

    const mapRequestLetterInput = mapForm ? mapForm.querySelector('#requestLetter') : null;
    const signatureInput        = mapForm ? mapForm.querySelector('#signature')      : null;
    const initialDataInput      = mapForm ? mapForm.querySelector('#initialData')    : null;

    if (mapRequestLetterInput) {
        mapRequestLetterInput.addEventListener('change', function () { updateUploadLabel(this); });
    }
    if (signatureInput) {
        signatureInput.addEventListener('change', function () { updateUploadLabel(this); });
    }
    if (initialDataInput) {
        initialDataInput.addEventListener('change', function () {
            const text = document.getElementById('initialDataText');
            if (text) text.textContent = this.files.length ? this.files[0].name : 'Click to upload initial data';
        });
    }

    // ================================================
    // FILE NAME DISPLAY — Training Request Form (Modal 5)
    // ================================================
    const trainingRequestLetterInput = trainingForm ? trainingForm.querySelector('#requestLetter') : null;

    if (trainingRequestLetterInput) {
        trainingRequestLetterInput.addEventListener('change', function () {
            const uploadText = trainingForm.querySelector('#uploadText');
            if (uploadText) uploadText.textContent = this.files.length ? this.files[0].name : 'Click to upload PDF';
        });
    }

    // ================================================
    // SUBMIT — Map Request Form (Modal 4)
    // ================================================
    if (mapForm) {
        mapForm.addEventListener('submit', async function (e) {
            e.preventDefault();

            // Clean data (scoped)
            ['surname', 'firstName'].forEach(id => {
                const f = mapForm.querySelector(`#${id}`);
                if (f) f.value = toTitleCase(f.value);
            });
            ['purpose', 'areaOfInterest'].forEach(id => {
                const f = mapForm.querySelector(`#${id}`);
                if (f) f.value = toSentenceCase(f.value);
            });
            const cmt = mapForm.querySelector('#customMapType');
            if (cmt && cmt.style.display !== 'none') cmt.value = toSentenceCase(cmt.value);
            const ef = mapForm.querySelector('#email');
            if (ef) ef.value = toLowerCaseEmail(ef.value);
            const qf = mapForm.querySelector('#quantity');
            if (qf) qf.value = roundUpQuantity(qf.value);

            // Validation
            const clientType   = mapForm.querySelector('#clientType').value;
            const mapTypeSelect      = mapForm.querySelector('#mapType');
            const customMapTypeInput = mapForm.querySelector('#customMapType');

            if (!clientType) {
                showInfoModal('Client Type Required', 'Please select whether you are an internal or external client.');
                return;
            }

            if (!validateEmail(mapForm)) return;

            if (mapTypeSelect.value === 'Other' && !customMapTypeInput.value.trim()) {
                showInfoModal('Map Type Required', 'Please specify the type of map you need.');
                customMapTypeInput.focus();
                return;
            }

            const reqLetter  = mapForm.querySelector('#requestLetter');
            const sig        = mapForm.querySelector('#signature');
            const initData   = mapForm.querySelector('#initialData');

            if (!reqLetter.files[0]) {
                showInfoModal('Request Letter Required', 'Please upload a Request Letter (PDF).');
                return;
            }
            if (!sig.files[0]) {
                showInfoModal('Signature Required', 'Please upload a Signature (PDF).');
                return;
            }
            if (reqLetter.files[0].size > 5 * 1024 * 1024) {
                showErrorModal('Request Letter file size must be less than 5MB.');
                return;
            }
            if (sig.files[0].size > 5 * 1024 * 1024) {
                showErrorModal('Signature file size must be less than 5MB.');
                return;
            }
            if (initData && initData.files[0] && initData.files[0].size > 10 * 1024 * 1024) {
                showErrorModal('Initial Data file size must be less than 10MB.');
                return;
            }

            showLoadingModal();

            try {
                const formData = new FormData(mapForm);
                if (mapTypeSelect.value === 'Other' && customMapTypeInput.value.trim()) {
                    formData.set('mapType', customMapTypeInput.value.trim());
                }

                const response = await fetch('http://localhost:3000/api/map-requests', {
                    method: 'POST',
                    body: formData
                });

                const result = await response.json();
                closeLoadingModal();

                if (response.ok && result.success) {
                    showSuccessModal(result.requestCode || result.request_code || 'N/A');
                    resetMapRequestForm(true);
                } else {
                    showErrorModal(result.error || 'Submission failed. Please try again.');
                }
            } catch (error) {
                console.error('Map request submission error:', error);
                closeLoadingModal();
                showErrorModal('Server error. Please check your connection and try again.');
            }
        });
    }

    // ================================================
    // SUBMIT — Training Request Form (Modal 5)
    // ================================================
    if (trainingForm) {
        trainingForm.addEventListener('submit', async function (e) {
            e.preventDefault();

            // Clean data (scoped)
            ['surname', 'firstName'].forEach(id => {
                const f = trainingForm.querySelector(`#${id}`);
                if (f) f.value = toTitleCase(f.value);
            });
            const ef = trainingForm.querySelector('#email');
            if (ef) ef.value = toLowerCaseEmail(ef.value);

            // Validation
            const clientType = trainingForm.querySelector('#clientType').value;
            if (!clientType) {
                showInfoModal('Client Type Required', 'Please select whether you are an internal or external client.');
                return;
            }

            if (!validateEmail(trainingForm)) return;

            const reqLetter = trainingForm.querySelector('#requestLetter');
            if (!reqLetter.files[0]) {
                showInfoModal('Request Letter Required', 'Please upload a Request Letter (PDF).');
                return;
            }
            if (reqLetter.files[0].size > 5 * 1024 * 1024) {
                showErrorModal('Request Letter file size must be less than 5MB.');
                return;
            }

            showLoadingModal();

            try {
                const formData = new FormData(trainingForm);

                const response = await fetch('http://localhost:3000/api/training-requests', {
                    method: 'POST',
                    body: formData
                });

                const result = await response.json();
                closeLoadingModal();

                if (response.ok && result.success) {
                    showSuccessModal(result.requestCode || result.request_code || 'N/A');
                    resetTrainingRequestForm(true);
                } else {
                    showErrorModal(result.error || 'Submission failed. Please try again.');
                }
            } catch (error) {
                console.error('Training request submission error:', error);
                closeLoadingModal();
                showErrorModal('Server error. Please check your connection and try again.');
            }
        });
    }

});

// ===============================
// RESET — Map Request Form (Modal 4)
// ===============================
function resetMapRequestForm(skipConfirm = false) {
    const form = document.getElementById('mapRequestForm');
    if (!form) return;

    if (skipConfirm || confirm('Are you sure you want to cancel? All entered data will be lost.')) {
        form.reset();

        // Reset upload labels
        form.querySelectorAll('.upload-text').forEach(el => {
            el.textContent = 'Click to upload PDF';
        });
        const initialDataText = document.getElementById('initialDataText');
        if (initialDataText) initialDataText.textContent = 'Click to upload initial data';

        // Hide custom map type input
        const customMapTypeInput = form.querySelector('#customMapType');
        if (customMapTypeInput) {
            customMapTypeInput.style.display = 'none';
            customMapTypeInput.required = false;
            customMapTypeInput.value = '';
        }

        selectClientType('internal', 'serviceModal4');
        closeModal4();
    }
}

// ===============================
// RESET — Training Request Form (Modal 5)
// ===============================
function resetTrainingRequestForm(skipConfirm = false) {
    const form = document.getElementById('requestForm');
    if (!form) return;

    if (skipConfirm || confirm('Are you sure you want to cancel? All entered data will be lost.')) {
        form.reset();

        // Reset upload label
        const uploadText = form.querySelector('#uploadText');
        if (uploadText) uploadText.textContent = 'Click to upload PDF';

        selectClientType('internal', 'serviceModal5');
        closeModal5();
    }
}

// ===============================
// CLOSE MODALS WHEN CLICK OUTSIDE
// ===============================
window.addEventListener('click', function (event) {
    const modal4 = document.getElementById('serviceModal4');
    if (event.target === modal4) closeModal4();

    const modal5 = document.getElementById('serviceModal5');
    if (event.target === modal5) closeModal5();
});