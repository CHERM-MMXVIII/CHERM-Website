// ─── Performance Criteria List ─────────────────────────────
const criteria = [
  "Provide appropriate response to customer request",
  "Courteousness and willingness of the personnel to serve",
  "Delivery of service within the minimum waiting time (promised time-frame) provided by the office",
  "Observance of empathetic and reassuring personnel/office to the client's concern",
  "Knowledge and competence of personnel to answer client's queries and resolve issues (in case there is any)",
  "Clarity of the information or advice provided",
  "Commitment of personnel in addressing client's needs",
  "Professionalism of personnel in performing their duties",
  "Friendly and courteous to clients",
  "Have the skills required to perform service",
  "The requested services availed was complete and meet the client's need or expectation",
  "Resolution of a problem or any concern directed to the office",
  "Satisfaction of clients in the services rendered by the office"
];

// ─── Build Criteria Items Dynamically ─────────────────────
const criteriaContainer = document.getElementById('criteriaContainer');

criteria.forEach((text, idx) => {
  const item = document.createElement('div');
  item.className = 'criteria-item';
  item.innerHTML = `
    <div class="criteria-label">${idx + 1}. ${text}</div>
    <div class="likert-row">
      ${[1, 2, 3, 4, 5].map(n => `
        <button type="button" class="likert-btn" data-group="${idx}" data-val="${n}">${n}</button>
      `).join('')}
    </div>
  `;
  criteriaContainer.appendChild(item);
});

// ─── Likert Button Selection ───────────────────────────────
document.addEventListener('click', (e) => {
  if (e.target.classList.contains('likert-btn')) {
    const group = e.target.dataset.group;
    document.querySelectorAll(`.likert-btn[data-group="${group}"]`).forEach(btn => {
      btn.classList.remove('selected');
    });
    e.target.classList.add('selected');
  }
});

// ─── Service Checkbox Visual Toggle ───────────────────────
document.querySelectorAll('.service-option input[type="checkbox"]').forEach(cb => {
  cb.addEventListener('change', () => {
    cb.closest('.service-option').classList.toggle('selected', cb.checked);
  });
});

// ─── "Other" Checkbox Special Handling ────────────────────
const otherCheckbox = document.getElementById('otherCheckbox');
const otherInput    = document.getElementById('otherInput');
const otherDot      = document.getElementById('otherDot');
const otherLabel    = document.getElementById('otherLabel');

function updateOtherState(isChecked) {
  if (isChecked) {
    otherDot.style.background    = 'var(--primary-color)';
    otherDot.style.borderColor   = 'var(--primary-color)';
    otherLabel.style.borderColor = 'var(--primary-color)';
    otherLabel.style.background  = '#f0fafa';
    otherInput.removeAttribute('readonly');
    otherInput.focus();
  } else {
    otherDot.style.background    = '';
    otherDot.style.borderColor   = '';
    otherLabel.style.borderColor = '';
    otherLabel.style.background  = '';
    otherInput.setAttribute('readonly', '');
    otherInput.value = '';
  }
}

// Toggle "Other" when clicking anywhere on the label except the text input
otherLabel.addEventListener('click', (e) => {
  if (e.target === otherInput) return;
  otherCheckbox.checked = !otherCheckbox.checked;
  updateOtherState(otherCheckbox.checked);
});

// ─── URL Param Handling ────────────────────────────────────
const CSS_PARAMS  = new URLSearchParams(window.location.search);
const CSS_SERVICE = CSS_PARAMS.get('service'); // 'data-request' or null
const CSS_CODE    = CSS_PARAMS.get('code');    // e.g. '20260312-CHERM-DR-A1B2'
const CSS_FILE_URL = CSS_PARAMS.get('fileUrl');   
const CSS_MAP_TYPE = CSS_PARAMS.get('mapType');   

document.addEventListener('DOMContentLoaded', () => {

  // ── Show / pre-fill Request ID section if data-request flow ──
  if (CSS_SERVICE === 'data-request') {
    const section = document.getElementById('requestIdSection');
    if (section) section.style.display = 'block';

    const input = document.getElementById('requestIdInput');
    if (input && CSS_CODE) {
      input.value    = CSS_CODE;
      input.readOnly = true;
      input.style.cssText = 'background:#f0fafa; color:#008080; font-weight:700;';

      const status = document.getElementById('requestIdStatus');
      if (status) {
        status.innerHTML   = '<i class="fas fa-check-circle" style="color:#008080;"></i> Confirmed';
        status.style.color = '#008080';
      }
    }

    // Auto-check GIS Mapping since this is a data request
    document.querySelectorAll('input[name="service"]').forEach(cb => {
      if (cb.value === 'GIS Mapping') {
        cb.checked = true;
        cb.closest('.service-option')?.classList.add('selected');
      }
    });

    // Update success message to mention file delivery
    const successText = document.getElementById('successText');
    if (successText) {
      successText.textContent =
        'Thank you for your feedback! Your requested files will be sent ' +
        'to your registered email address shortly.';
    }
  } else if (CSS_SERVICE === 'map-request') {
      // Auto-check GIS Mapping
      document.querySelectorAll('input[name="service"]').forEach(cb => {
          if (cb.value === 'GIS Mapping') {
              cb.checked = true;
              cb.closest('.service-option')?.classList.add('selected');
          }
      });

      // Update success message text
      const successText = document.getElementById('successText');
      if (successText) {
          successText.textContent =
              'Thank you for your feedback! Your map is ready to download below.';
      }
    }
});

// ─── Form Submission ───────────────────────────────────────
document.getElementById('surveyForm').addEventListener('submit', async (e) => {
  e.preventDefault();

  const form       = document.getElementById('surveyForm');
  const submitBtn  = form.querySelector('.submit-btn');
  const successMsg = document.getElementById('successMsg');

  // ── Data-request flow: call API before showing success ──
  if (CSS_SERVICE === 'data-request') {
    const requestId = document.getElementById('requestIdInput')?.value?.trim();

    if (!requestId) {
      document.getElementById('requestIdInput').focus();
      return;
    }

    // Disable button and show loading state
    submitBtn.disabled     = true;
    submitBtn.style.opacity = '0.7';
    submitBtn.innerHTML    = `
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
           stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"
           style="animation:spin 1s linear infinite;">
        <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
      </svg>
      Submitting...`;

    try {
      const res = await fetch('/api/css-survey/submit', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        // TODO: add full survey answers here when DB is ready
        // For now only requestId is sent; backend marks as Fulfilled + sends files
        body: JSON.stringify({ requestId }),
      });

      const data = await res.json();

      if (!res.ok) {
        // Restore button and show error inline
        submitBtn.disabled      = false;
        submitBtn.style.opacity = '1';
        submitBtn.innerHTML     = `
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
               stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <line x1="22" y1="2" x2="11" y2="13"/>
            <polygon points="22 2 15 22 11 13 2 9 22 2"/>
          </svg>
          Submit Survey`;

        // Show error below the button
        let errEl = document.getElementById('surveySubmitError');
        if (!errEl) {
          errEl    = document.createElement('p');
          errEl.id = 'surveySubmitError';
          errEl.style.cssText =
            'color:#dc2626; font-size:0.88rem; font-weight:500; margin-top:12px; text-align:center;';
          submitBtn.insertAdjacentElement('afterend', errEl);
        }
        errEl.textContent = data.error || 'Submission failed. Please try again.';
        return;
      }

    } catch (networkErr) {
      submitBtn.disabled      = false;
      submitBtn.style.opacity = '1';
      submitBtn.innerHTML     = `
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
             stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <line x1="22" y1="2" x2="11" y2="13"/>
          <polygon points="22 2 15 22 11 13 2 9 22 2"/>
        </svg>
        Submit Survey`;

      let errEl = document.getElementById('surveySubmitError');
      if (!errEl) {
        errEl    = document.createElement('p');
        errEl.id = 'surveySubmitError';
        errEl.style.cssText =
          'color:#dc2626; font-size:0.88rem; font-weight:500; margin-top:12px; text-align:center;';
        submitBtn.insertAdjacentElement('afterend', errEl);
      }
      errEl.textContent = 'Network error. Please check your connection and try again.';
      return;
    }
  }

  if (CSS_SERVICE === 'map-request' && CSS_FILE_URL) {
    const successMsg = document.getElementById('successMsg');

    const dlWrap = document.createElement('div');
    dlWrap.style.cssText = 'margin-top:20px;';

    const dlBtn = document.createElement('a');
    dlBtn.href     = CSS_FILE_URL;
    dlBtn.download = `map_${CSS_CODE || 'file'}`;
    dlBtn.target   = '_blank';
    dlBtn.style.cssText =
        'display:inline-flex;align-items:center;gap:8px;' +
        'background:#008080;color:white;padding:12px 24px;' +
        'border-radius:10px;text-decoration:none;' +
        'font-size:0.9rem;font-weight:700;' +
        'box-shadow:0 4px 12px rgba(0,128,128,0.3);';
    dlBtn.innerHTML =
        '<i class="fas fa-download"></i> Download ' +
        (CSS_MAP_TYPE ? CSS_MAP_TYPE : 'Map');

    dlWrap.appendChild(dlBtn);
    successMsg.appendChild(dlWrap);
  }

  // ── Show success screen (both flows reach here) ──────────
  form.style.display       = 'none';
  successMsg.style.display = 'block';
});