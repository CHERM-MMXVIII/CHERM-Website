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

// ─── Form Submission ───────────────────────────────────────
document.getElementById('surveyForm').addEventListener('submit', (e) => {
  e.preventDefault();
  document.getElementById('surveyForm').style.display = 'none';
  document.getElementById('successMsg').style.display = 'block';
});