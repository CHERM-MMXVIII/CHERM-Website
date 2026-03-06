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

function showSuccessModal(requestCode, message) {
    const modal      = document.getElementById('successModal');
    const codeDisplay  = document.getElementById('requestCodeDisplay');
    const alertMsg   = modal ? modal.querySelector('.alert-message') : null;

    if (requestCode && codeDisplay) codeDisplay.textContent = requestCode;
    if (alertMsg && message) alertMsg.textContent = message;

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

function showLoadingModal(message) {
    const modal    = document.getElementById('loadingModal');
    const alertMsg = modal ? modal.querySelector('.alert-message') : null;
    if (alertMsg && message) alertMsg.textContent = message;
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
        closeMapTrackingModal();
        closeManuscriptTrackingModal();
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
// CLIENT TYPE TOGGLE (scope-aware)
// serviceModal4 = original IDs, serviceModal5 = tr- IDs
// ===============================
function selectClientType(clientType, scopeModalId = 'serviceModal4') {
    const scope = document.getElementById(scopeModalId) || document;
    const isTraining = scopeModalId === 'serviceModal5';

    const clientTypeInput = scope.querySelector(isTraining ? '#tr-clientType' : '#clientType');
    if (clientTypeInput) clientTypeInput.value = clientType;

    scope.querySelectorAll('.client-type-pill').forEach(pill => {
        pill.classList.toggle('active', pill.dataset.type === clientType);
    });

    const affiliationLabel = scope.querySelector(isTraining ? '#tr-affiliationLabel' : '#affiliationLabel');
    const affiliationInput = scope.querySelector(isTraining ? '#tr-affiliation'      : '#affiliation');
    if (clientType === 'internal') {
        if (affiliationLabel) affiliationLabel.textContent = isTraining ? 'Office / College *' : 'Office / College';
        if (affiliationInput) affiliationInput.placeholder = 'e.g. College of Engineering';
    } else {
        if (affiliationLabel) affiliationLabel.textContent = isTraining ? 'Office / Agency *' : 'Office / Agency';
        if (affiliationInput) affiliationInput.placeholder = 'e.g. LGU Lucena City';
    }

    const emailHint = scope.querySelector(isTraining ? '#tr-emailHint' : '#emailHint');
    if (emailHint) emailHint.style.display = clientType === 'internal' ? 'block' : 'none';

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
// MAP TRACKING MODAL
// ===============================

function showUserMapRequest() {
    const modal = document.getElementById('mapTrackingModal');
    if (modal) {
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
        setTimeout(() => {
            const input = document.getElementById('mapRequestCodeInput');
            if (input) input.focus();
        }, 100);
    }
}

function closeMapTrackingModal() {
    const modal = document.getElementById('mapTrackingModal');
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = '';
        const input = document.getElementById('mapRequestCodeInput');
        const error = document.getElementById('mapTrackingError');
        if (input) input.value = '';
        if (error) error.classList.remove('active');
    }
}

function submitMapTracking() {
    const input = document.getElementById('mapRequestCodeInput');
    const error = document.getElementById('mapTrackingError');
    if (!input) return;
    const code = input.value.trim();
    if (!code) {
        if (error) {
            error.textContent = 'Please enter your request code';
            error.classList.add('active');
        }
        input.focus();
        return;
    }
    window.location.href = `user-map-req.html?code=${encodeURIComponent(code)}`;
}

// ===============================
// SHARED: ATTACH DATA CLEANING
// ===============================
function attachDataCleaning(form) {
    if (!form) return;

    form.querySelectorAll(
        '#surname, #firstName, #tr-surname, #tr-firstName, #mr-surname, #mr-firstName'
    ).forEach(field => {
        field.addEventListener('blur', function () { this.value = toTitleCase(this.value); });
    });

    form.querySelectorAll(
        '#purpose, #areaOfInterest, #customMapType'
    ).forEach(field => {
        field.addEventListener('blur', function () { this.value = toSentenceCase(this.value); });
    });

    form.querySelectorAll(
        '#email, #tr-email, #mr-email'
    ).forEach(field => {
        field.addEventListener('blur', function () { this.value = toLowerCaseEmail(this.value); });
    });

    const quantityField = form.querySelector('#quantity');
    if (quantityField) {
        quantityField.addEventListener('blur', function () { this.value = roundUpQuantity(this.value); });
    }
}

// ===============================
// SHARED: VALIDATE SLSU EMAIL
// ===============================
function validateEmail(form, isTraining = false) {
    const clientTypeInput = form.querySelector(isTraining ? '#tr-clientType' : '#clientType');
    const clientType = clientTypeInput ? clientTypeInput.value : '';

    if (clientType === 'internal') {
        const emailField = form.querySelector(isTraining ? '#tr-email' : '#email');
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

    const mapForm      = document.getElementById('mapRequestForm');
    const trainingForm = document.getElementById('requestForm');
    const mrForm       = document.getElementById('manuscriptReviewForm');

    selectClientType('internal', 'serviceModal4');
    selectClientType('internal', 'serviceModal5');

    attachDataCleaning(mapForm);
    attachDataCleaning(trainingForm);
    attachDataCleaning(mrForm);

    // ================================================
    // ABSTRACT CHARACTER COUNTER
    // ================================================
    const abstractField = document.getElementById('mr-abstract');
    const abstractCount = document.getElementById('mr-abstractCount');

    if (abstractField && abstractCount) {
        abstractField.addEventListener('input', function () {
            abstractCount.textContent = this.value.length;
            abstractCount.style.color = this.value.length > 1800 ? '#dc3545' : '#6c757d';
        });
    }

    // ================================================
    // FILE DISPLAY — Map Request Form (Modal 4)
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
    // FILE DISPLAY — Training Request Form (Modal 5)
    // ================================================
    const trainingLetterInput = document.getElementById('tr-requestLetter');

    if (trainingLetterInput) {
        trainingLetterInput.addEventListener('change', function () {
            const uploadText = document.getElementById('tr-uploadText');
            if (!uploadText) return;

            if (!this.files.length) {
                uploadText.textContent = 'Click to upload PDF';
                return;
            }

            const file = this.files[0];

            if (file.type !== 'application/pdf') {
                showInfoModal('Invalid File Type', 'Please upload a PDF file.');
                this.value = '';
                uploadText.textContent = 'Click to upload PDF';
                return;
            }

            if (file.size > 10 * 1024 * 1024) {
                showInfoModal('File Too Large', 'Request Letter must be under 10MB.');
                this.value = '';
                uploadText.textContent = 'Click to upload PDF';
                return;
            }

            const sizeMB = (file.size / (1024 * 1024)).toFixed(2);
            uploadText.innerHTML = `
                <i class="fas fa-file-pdf" style="color:#dc2626; margin-right:6px;"></i>
                <strong>${file.name}</strong>
                <span style="display:block; font-size:12px; color:#6c757d; margin-top:4px;">${sizeMB} MB</span>`;

            const uploadArea = document.querySelector('#serviceModal5 .upload-area');
            if (uploadArea) {
                uploadArea.style.borderColor     = '#008080';
                uploadArea.style.backgroundColor = 'rgba(0,128,128,0.05)';
            }
        });
    }

    // ================================================
    // SUBMIT — Map Request Form (Modal 4)
    // ================================================
    if (mapForm) {
        mapForm.addEventListener('submit', async function (e) {
            e.preventDefault();

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

            const clientType         = mapForm.querySelector('#clientType').value;
            const mapTypeSelect      = mapForm.querySelector('#mapType');
            const customMapTypeInput = mapForm.querySelector('#customMapType');

            if (!clientType) {
                showInfoModal('Client Type Required', 'Please select whether you are an internal or external client.');
                return;
            }
            if (!validateEmail(mapForm, false)) return;
            if (mapTypeSelect.value === 'Other' && !customMapTypeInput.value.trim()) {
                showInfoModal('Map Type Required', 'Please specify the type of map you need.');
                customMapTypeInput.focus();
                return;
            }

            const reqLetter = mapForm.querySelector('#requestLetter');
            const sig       = mapForm.querySelector('#signature');
            const initData  = mapForm.querySelector('#initialData');

            if (!reqLetter.files[0]) { showInfoModal('Request Letter Required', 'Please upload a Request Letter (PDF).'); return; }
            if (!sig.files[0])       { showInfoModal('Signature Required', 'Please upload a Signature (PDF).'); return; }
            if (reqLetter.files[0].size > 5 * 1024 * 1024) { showErrorModal('Request Letter file size must be less than 5MB.'); return; }
            if (sig.files[0].size > 5 * 1024 * 1024)       { showErrorModal('Signature file size must be less than 5MB.'); return; }
            if (initData && initData.files[0] && initData.files[0].size > 10 * 1024 * 1024) {
                showErrorModal('Initial Data file size must be less than 10MB.');
                return;
            }

            showLoadingModal('Please wait while we submit your map request.');

            try {
                const formData = new FormData(mapForm);
                if (mapTypeSelect.value === 'Other' && customMapTypeInput.value.trim()) {
                    formData.set('mapType', customMapTypeInput.value.trim());
                }

                const response = await fetch('/api/map-requests', {
                    method: 'POST',
                    body: formData
                });

                const result = await response.json();
                closeLoadingModal();

                if (response.ok && result.success) {
                    showSuccessModal(
                        result.requestCode || result.request_code || 'N/A',
                        "Your map request has been received. You'll receive updates via email."
                    );
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

            const surnameFld   = trainingForm.querySelector('#tr-surname');
            const firstNameFld = trainingForm.querySelector('#tr-firstName');
            const emailFld     = trainingForm.querySelector('#tr-email');
            const affFld       = trainingForm.querySelector('#tr-affiliation');

            if (surnameFld)   surnameFld.value  = toTitleCase(surnameFld.value);
            if (firstNameFld) firstNameFld.value = toTitleCase(firstNameFld.value);
            if (emailFld)     emailFld.value     = toLowerCaseEmail(emailFld.value);

            const clientTypeInput = trainingForm.querySelector('#tr-clientType');
            const clientType      = clientTypeInput ? clientTypeInput.value : '';
            if (!clientType) {
                showInfoModal('Client Type Required', 'Please select whether you are an internal or external client.');
                return;
            }

            if (!validateEmail(trainingForm, true)) return;

            const reqLetter = document.getElementById('tr-requestLetter');
            if (!reqLetter || !reqLetter.files[0]) {
                showInfoModal('Request Letter Required', 'Please upload a Request Letter (PDF).');
                return;
            }
            if (reqLetter.files[0].size > 10 * 1024 * 1024) {
                showErrorModal('Request Letter file size must be less than 10MB.');
                return;
            }

            showLoadingModal('Please wait while we submit your training request.');

            try {
                const formData = new FormData();
                formData.append('clientType',    clientType);
                formData.append('email',         emailFld     ? emailFld.value.trim()     : '');
                formData.append('surname',       surnameFld   ? surnameFld.value.trim()   : '');
                formData.append('firstName',     firstNameFld ? firstNameFld.value.trim() : '');
                formData.append('affiliation',   affFld       ? affFld.value.trim()       : '');
                formData.append('requestLetter', reqLetter.files[0]);

                const response = await fetch('/api/training-requests', {
                    method: 'POST',
                    body:   formData
                });

                const result = await response.json();
                closeLoadingModal();

                if (response.ok && result.success) {
                    showSuccessModal(
                        result.requestCode || result.request_code || 'N/A',
                        "Your training request has been received. You'll receive updates via email."
                    );
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

    // ================================================
    // FILE DISPLAY — Manuscript Review Form (Modal 6)
    // ================================================
    const manuscriptFileInput = document.getElementById('mr-manuscriptFile');

    if (manuscriptFileInput) {
        manuscriptFileInput.addEventListener('change', function () {
            handleManuscriptFileUpload(this);
        });
    }

    // ================================================
    // SUBMIT — Manuscript Review Form (Modal 6)
    // ================================================
    if (mrForm) {
        mrForm.addEventListener('submit', async function (e) {
            e.preventDefault();

            const surnameFld    = mrForm.querySelector('#mr-surname');
            const firstNameFld  = mrForm.querySelector('#mr-firstName');
            const emailFld      = mrForm.querySelector('#mr-email');
            const affFld        = mrForm.querySelector('#mr-affiliation');
            const titleFld      = mrForm.querySelector('#mr-title');
            const abstractFld   = mrForm.querySelector('#mr-abstract');
            const dateNeededFld = mrForm.querySelector('#mr-dateNeeded');
            const publisherFld  = mrForm.querySelector('#mr-publisher');
            const fileLinkFld   = mrForm.querySelector('#mr-fileLink');

            // Clean fields
            if (surnameFld)   surnameFld.value   = toTitleCase(surnameFld.value);
            if (firstNameFld) firstNameFld.value  = toTitleCase(firstNameFld.value);
            if (emailFld)     emailFld.value      = toLowerCaseEmail(emailFld.value);
            if (titleFld)     titleFld.value      = titleFld.value.trim();
            if (abstractFld)  abstractFld.value   = abstractFld.value.trim();

            const clientTypeInput = mrForm.querySelector('#mr-clientType');
            const clientType = clientTypeInput ? clientTypeInput.value : '';
            if (!clientType) {
                showInfoModal('Client Type Required', 'Please select whether you are an internal or external client.');
                return;
            }

            if (!validateManuscriptEmail(mrForm)) return;

            // Validate title
            if (!titleFld || !titleFld.value.trim()) {
                showInfoModal('Manuscript Title Required', 'Please enter the title of your manuscript.');
                if (titleFld) titleFld.focus();
                return;
            }

            // Validate abstract
            if (!abstractFld || !abstractFld.value.trim()) {
                showInfoModal('Abstract Required', 'Please provide a short abstract for your manuscript.');
                if (abstractFld) abstractFld.focus();
                return;
            }

            // Validate date needed
            if (!dateNeededFld || !dateNeededFld.value) {
                showInfoModal('Date Required', 'Please indicate your preferred review deadline.');
                if (dateNeededFld) dateNeededFld.focus();
                return;
            }

            // Date must not be in the past
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const chosenDate = new Date(dateNeededFld.value);
            if (chosenDate < today) {
                showInfoModal('Invalid Date', 'The review deadline cannot be in the past.');
                if (dateNeededFld) dateNeededFld.focus();
                return;
            }

            // Validate manuscript file
            const manuscriptFile = document.getElementById('mr-manuscriptFile');
            if (!manuscriptFile || !manuscriptFile.files[0]) {
                showInfoModal('Manuscript Required', 'Please upload the soft copy of your manuscript.');
                return;
            }

            // Validate file link
            const fileLink = fileLinkFld ? fileLinkFld.value.trim() : '';
            if (!fileLink) {
                showInfoModal('File Link Required', 'Please provide a shareable link to your manuscript.');
                if (fileLinkFld) fileLinkFld.focus();
                return;
            }

            try {
                new URL(fileLink);
            } catch (_) {
                showInfoModal('Invalid Link', 'Please enter a valid URL (e.g. https://docs.google.com/...)');
                if (fileLinkFld) fileLinkFld.focus();
                return;
            }

            showLoadingModal('Please wait while we submit your manuscript review request.');

            try {
                const formData = new FormData();
                formData.append('clientType',      clientType);
                formData.append('email',           emailFld     ? emailFld.value.trim()     : '');
                formData.append('surname',         surnameFld   ? surnameFld.value.trim()   : '');
                formData.append('firstName',       firstNameFld ? firstNameFld.value.trim() : '');
                formData.append('affiliation',     affFld       ? affFld.value.trim()       : '');
                formData.append('manuscriptTitle', titleFld     ? titleFld.value.trim()     : '');
                formData.append('abstract',        abstractFld  ? abstractFld.value.trim()  : '');
                formData.append('dateNeeded',      dateNeededFld ? dateNeededFld.value      : '');
                formData.append('targetPublisher', publisherFld ? publisherFld.value.trim() : '');
                formData.append('fileLink',        fileLink);
                formData.append('manuscriptFile',  manuscriptFile.files[0]);

                const response = await fetch('/api/manuscript-requests', {
                    method: 'POST',
                    body:   formData
                });

                const result = await response.json();
                closeLoadingModal();

                if (response.ok && result.success) {
                    showSuccessModal(
                        result.requestCode || result.request_code || 'N/A',
                        "Your manuscript has been submitted for review. You'll receive updates via email."
                    );
                    resetManuscriptReviewForm(true);
                } else {
                    showErrorModal(result.error || 'Submission failed. Please try again.');
                }
            } catch (error) {
                console.error('Manuscript review submission error:', error);
                closeLoadingModal();
                showErrorModal('Server error. Please check your connection and try again.');
            }
        });
    }

    // ================================================
    // INIT — Manuscript Review Form (Modal 6)
    // ================================================
    selectManuscriptClientType('internal');

    // ================================================
    // MAP TRACKING MODAL — Enter key + clear error
    // ================================================
    const mapTrackingInput = document.getElementById('mapRequestCodeInput');
    if (mapTrackingInput) {
        mapTrackingInput.addEventListener('keypress', function (e) {
            if (e.key === 'Enter') { e.preventDefault(); submitMapTracking(); }
        });
        mapTrackingInput.addEventListener('input', function () {
            document.getElementById('mapTrackingError')?.classList.remove('active');
        });
    }

    // Close map tracking modal on backdrop click
    const mapTrackingModal = document.getElementById('mapTrackingModal');
    if (mapTrackingModal) {
        mapTrackingModal.addEventListener('click', function (e) {
            if (e.target === mapTrackingModal) closeMapTrackingModal();
        });
    }

    // ================================================
    // MANUSCRIPT TRACKING MODAL — Enter key + clear error
    // ================================================
    const manuscriptInput = document.getElementById('manuscriptRequestCodeInput');
    if (manuscriptInput) {
        manuscriptInput.addEventListener('keypress', function (e) {
            if (e.key === 'Enter') { e.preventDefault(); submitManuscriptTracking(); }
        });
        manuscriptInput.addEventListener('input', function () {
            document.getElementById('manuscriptTrackingError')?.classList.remove('active');
        });
    }

    // Close manuscript tracking modal on backdrop click
    const manuscriptTrackingModal = document.getElementById('manuscriptTrackingModal');
    if (manuscriptTrackingModal) {
        manuscriptTrackingModal.addEventListener('click', function (e) {
            if (e.target === manuscriptTrackingModal) closeManuscriptTrackingModal();
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

        form.querySelectorAll('.upload-text').forEach(el => {
            el.textContent = 'Click to upload PDF';
        });
        const initialDataText = document.getElementById('initialDataText');
        if (initialDataText) initialDataText.textContent = 'Click to upload initial data';

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

        const uploadText = document.getElementById('tr-uploadText');
        if (uploadText) uploadText.textContent = 'Click to upload PDF';

        const uploadArea = document.querySelector('#serviceModal5 .upload-area');
        if (uploadArea) {
            uploadArea.style.borderColor     = '';
            uploadArea.style.backgroundColor = '';
        }

        selectClientType('internal', 'serviceModal5');
        closeModal5();
    }
}

// Cancel button alias used in the training form HTML
function resetForm() {
    resetTrainingRequestForm();
}

// ===============================
// MODAL 6 — MANUSCRIPT REVIEW
// All IDs prefixed with mr-
// ===============================

function selectManuscriptClientType(clientType) {
    const scope = document.getElementById('serviceModal6');
    if (!scope) return;

    const clientTypeInput = scope.querySelector('#mr-clientType');
    if (clientTypeInput) clientTypeInput.value = clientType;

    scope.querySelectorAll('.client-type-pill').forEach(pill => {
        pill.classList.toggle('active', pill.dataset.type === clientType);
    });

    const affiliationLabel = scope.querySelector('#mr-affiliationLabel');
    const affiliationInput = scope.querySelector('#mr-affiliation');
    if (clientType === 'internal') {
        if (affiliationLabel) affiliationLabel.innerHTML = 'Office / College <span style="color:#dc3545;">*</span>';
        if (affiliationInput) affiliationInput.placeholder = 'e.g. College of Engineering';
    } else {
        if (affiliationLabel) affiliationLabel.innerHTML = 'Office / Agency <span style="color:#dc3545;">*</span>';
        if (affiliationInput) affiliationInput.placeholder = 'e.g. LGU Lucena City';
    }

    const emailHint = scope.querySelector('#mr-emailHint');
    if (emailHint) emailHint.style.display = clientType === 'internal' ? 'block' : 'none';

    const titleLabel = scope.querySelector('#mr-clientTypeLabel');
    if (titleLabel) titleLabel.textContent = clientType === 'internal' ? 'INTERNAL CLIENT' : 'EXTERNAL CLIENT';
}

function openModal6() {
    const modal = document.getElementById('serviceModal6');
    if (!modal) return;
    selectManuscriptClientType('internal');
    modal.style.display = 'block';
}

function closeModal6() {
    const modal = document.getElementById('serviceModal6');
    if (modal) modal.style.display = 'none';
}

function handleManuscriptFileUpload(input) {
    const uploadText = document.getElementById('mr-uploadText');
    if (!input || !uploadText) return;

    if (!input.files.length) {
        uploadText.textContent = 'Click to upload file';
        return;
    }

    const file = input.files[0];
    const allowedTypes = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];

    if (!allowedTypes.includes(file.type)) {
        showInfoModal('Invalid File Type', 'Please upload a PDF, DOC, or DOCX file.');
        input.value = '';
        uploadText.textContent = 'Click to upload file';
        return;
    }

    if (file.size > 25 * 1024 * 1024) {
        showInfoModal('File Too Large', 'Manuscript file must be under 25MB.');
        input.value = '';
        uploadText.textContent = 'Click to upload file';
        return;
    }

    const sizeMB = (file.size / (1024 * 1024)).toFixed(2);
    uploadText.innerHTML = `
        <i class="fas fa-file-alt" style="color:#008080; margin-right:6px;"></i>
        <strong>${file.name}</strong>
        <span style="display:block; font-size:12px; color:#6c757d; margin-top:4px;">${sizeMB} MB</span>`;

    const uploadArea = document.querySelector('#serviceModal6 .upload-area');
    if (uploadArea) {
        uploadArea.style.borderColor     = '#008080';
        uploadArea.style.backgroundColor = 'rgba(0,128,128,0.05)';
    }
}

function validateManuscriptEmail(form) {
    const clientTypeInput = form.querySelector('#mr-clientType');
    const clientType = clientTypeInput ? clientTypeInput.value : '';

    if (clientType === 'internal') {
        const emailField = form.querySelector('#mr-email');
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

function resetManuscriptReviewForm(skipConfirm = false) {
    const form = document.getElementById('manuscriptReviewForm');
    if (!form) return;

    if (skipConfirm || confirm('Are you sure you want to cancel? All entered data will be lost.')) {
        form.reset();

        const uploadText = document.getElementById('mr-uploadText');
        if (uploadText) uploadText.textContent = 'Click to upload file';

        const uploadArea = document.querySelector('#serviceModal6 .upload-area');
        if (uploadArea) {
            uploadArea.style.borderColor     = '';
            uploadArea.style.backgroundColor = '';
        }

        // Reset abstract counter
        const abstractCount = document.getElementById('mr-abstractCount');
        if (abstractCount) {
            abstractCount.textContent = '0';
            abstractCount.style.color = '#6c757d';
        }

        selectManuscriptClientType('internal');
        closeModal6();
    }
}

// ===============================
// CLOSE MODALS ON BACKDROP CLICK
// ===============================
window.addEventListener('click', function (event) {
    const modal4 = document.getElementById('serviceModal4');
    if (event.target === modal4) closeModal4();

    const modal5 = document.getElementById('serviceModal5');
    if (event.target === modal5) closeModal5();

    const modal6 = document.getElementById('serviceModal6');
    if (event.target === modal6) closeModal6();
});

// ===============================
// MANUSCRIPT TRACKING MODAL
// ===============================

function openManuscriptTrackingModal() {
    const modal = document.getElementById('manuscriptTrackingModal');
    if (modal) {
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
        setTimeout(() => {
            const input = document.getElementById('manuscriptRequestCodeInput');
            if (input) input.focus();
        }, 100);
    }
}

function closeManuscriptTrackingModal() {
    const modal = document.getElementById('manuscriptTrackingModal');
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = '';
        const input = document.getElementById('manuscriptRequestCodeInput');
        const error = document.getElementById('manuscriptTrackingError');
        if (input) input.value = '';
        if (error) error.classList.remove('active');
    }
}

function submitManuscriptTracking() {
    const input = document.getElementById('manuscriptRequestCodeInput');
    const error = document.getElementById('manuscriptTrackingError');
    if (!input) return;
    const code = input.value.trim();
    if (!code) {
        if (error) {
            error.textContent = 'Please enter your request code';
            error.classList.add('active');
        }
        input.focus();
        return;
    }
    window.location.href = `user-manuscript-req.html?code=${encodeURIComponent(code)}`;
}