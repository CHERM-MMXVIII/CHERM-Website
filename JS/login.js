// ============================================================================
// SIMPLE MODAL FUNCTIONS (Works with your existing modal CSS)
// ============================================================================

// Show Success Modal
function showSuccessModal(title, message) {
    const modalHTML = `
        <div class="modal" id="successModal">
            <div class="modal-content centered">
                <div class="modal-icon success">
                    <i class="fas fa-check-circle"></i>
                </div>
                <h3>${title}</h3>
                <p>${message}</p>
                <div class="modal-actions">
                    <button class="btn-primary" onclick="closeSuccessModal()">Got it, thanks!</button>
                </div>
            </div>
        </div>
    `;
    
    const existing = document.getElementById('successModal');
    if (existing) existing.remove();
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
}

function closeSuccessModal() {
    const modal = document.getElementById('successModal');
    if (modal) {
        modal.remove();
        // Also close forgot password modal
        const forgotModal = document.getElementById('forgotModal');
        if (forgotModal) forgotModal.classList.add('hidden');
    }
}

// Show Error Modal
function showErrorModal(title, message) {
    const modalHTML = `
        <div class="modal" id="errorModal">
            <div class="modal-content centered">
                <div class="modal-icon error">
                    <i class="fas fa-exclamation-circle"></i>
                </div>
                <h3>${title}</h3>
                <p>${message}</p>
                <div class="modal-actions">
                    <button class="btn-primary" onclick="closeErrorModal()">Got it</button>
                </div>
            </div>
        </div>
    `;
    
    const existing = document.getElementById('errorModal');
    if (existing) existing.remove();
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
}

function closeErrorModal() {
    const modal = document.getElementById('errorModal');
    if (modal) modal.remove();
}

// ============================================================================
// LOGIN FUNCTIONALITY
// ============================================================================

document.addEventListener('DOMContentLoaded', () => {
  const loginForm = document.getElementById('loginForm');
  const emailInput = document.getElementById('email');
  const passwordInput = document.getElementById('password');
  const rememberCheckbox = document.getElementById('remember');
  const togglePassword = document.getElementById('togglePassword');
  const forgotPasswordLink = document.getElementById('forgotPassword');
  const forgotModal = document.getElementById('forgotModal');
  const forgotEmailInput = document.getElementById('forgotEmail');
  const sendForgotBtn = document.getElementById('sendForgotRequest');
  const closeForgotBtn = document.getElementById('closeForgotModal');

  // Toggle Password Visibility
  if (togglePassword) {
    togglePassword.addEventListener('click', () => {
      const isHidden = passwordInput.type === 'password';
      passwordInput.type = isHidden ? 'text' : 'password';

      togglePassword.innerHTML = isHidden
        ? `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
             <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
             <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8"/>
             <line x1="1" y1="1" x2="23" y2="23"/>
           </svg>`
        : `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
             <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
             <circle cx="12" cy="12" r="3"/>
           </svg>`;
    });
  }

  // Login Form Submit
  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      const email = emailInput.value.trim();
      const password = passwordInput.value;
      const remember = rememberCheckbox ? rememberCheckbox.checked : false;

      if (!email || !password) {
        showErrorModal('Missing Information', 'Please enter both email and password.');
        return;
      }

      try {
        const response = await fetch('/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ email, password, remember })
        });

        let data;
        try {
          data = await response.json();
        } catch {
          throw new Error('Unexpected server response.');
        }

        if (!response.ok) {
          throw new Error(data.message || 'Invalid email or password.');
        }

        window.location.href = '/main-admin';
      } catch (err) {
        console.error('Login error:', err);
        showErrorModal('Login Failed', err.message);
      }
    });
  }

  if (emailInput) {
    emailInput.addEventListener('blur', () => {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      emailInput.style.borderColor =
        emailInput.value && !emailRegex.test(emailInput.value) ? '#ff4444' : '#e0e0e0';
    });
  }

  if (forgotPasswordLink && forgotModal) {
    forgotPasswordLink.addEventListener('click', (e) => {
      e.preventDefault();
      forgotModal.classList.remove('hidden');
      
      if (forgotEmailInput && emailInput) {
        forgotEmailInput.value = emailInput.value.trim();
      }
      
      if (forgotEmailInput) forgotEmailInput.focus();
    });
  }

  if (closeForgotBtn && forgotModal) {
    closeForgotBtn.addEventListener('click', () => {
      forgotModal.classList.add('hidden');
    });
  }

  if (forgotModal) {
    forgotModal.addEventListener('click', (e) => {
      if (e.target === forgotModal) {
        forgotModal.classList.add('hidden');
      }
    });
  }

  // Send Forgot Password Request
  if (sendForgotBtn && forgotEmailInput) {
    sendForgotBtn.addEventListener('click', async () => {
      const email = forgotEmailInput.value.trim();

      if (!email) {
        showErrorModal('Email Required', 'Please enter your email address.');
        return;
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        showErrorModal('Invalid Email', 'Please enter a valid email address.');
        return;
      }

      const originalText = sendForgotBtn.innerHTML;
      sendForgotBtn.disabled = true;
      sendForgotBtn.innerHTML = '<span class="spinner"></span> Sending...';

      try {
        const response = await fetch('/forgot-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email })
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || 'Failed to send request.');
        }

        showSuccessModal(
          'Request Sent!',
          'The CHERM team has been notified and will send you password reset instructions shortly.'
        );

      } catch (err) {
        console.error('Forgot password error:', err);
        showErrorModal('Request Failed', err.message);
      } finally {
        sendForgotBtn.disabled = false;
        sendForgotBtn.innerHTML = originalText;
      }
    });
  }

  const forgotLink = document.getElementById('forgot-password');
  if (forgotLink && forgotModal) {
    forgotLink.addEventListener('click', (e) => {
      e.preventDefault();
      forgotModal.classList.remove('hidden');
      
      if (forgotEmailInput && emailInput) {
        forgotEmailInput.value = emailInput.value.trim();
      }
      
      if (forgotEmailInput) forgotEmailInput.focus();
    });
  }
});