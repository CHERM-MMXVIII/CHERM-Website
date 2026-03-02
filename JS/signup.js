// ============================================================================
// SIGNUP FORM FUNCTIONALITY
// ============================================================================

// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function() {
    
    // Get DOM elements
    const signupForm = document.getElementById('signupForm');
    const togglePasswordButtons = document.querySelectorAll('.toggle-password');
    const nextButtons = document.querySelectorAll('.next-btn');
    const backButtons = document.querySelectorAll('.back-btn');
    const stepIndicators = document.querySelectorAll('.step');
    const formSteps = document.querySelectorAll('.form-step');
    const stepLabel = document.querySelector('.step-label');
    
    let currentStep = 1;
    const stepLabels = {
        1: 'Step 1: Personal Info',
        2: 'Step 2: Details',
        3: 'Step 3: Security'
    };
    
    // Toggle password visibility
    togglePasswordButtons.forEach(button => {
        button.addEventListener('click', function() {
            const targetId = this.getAttribute('data-target');
            const targetInput = document.getElementById(targetId);
            const type = targetInput.getAttribute('type') === 'password' ? 'text' : 'password';
            targetInput.setAttribute('type', type);
            
            this.innerHTML = type === 'password' 
                ? '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>'
                : '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>';
        });
    });
    
    // Next button handlers
    nextButtons.forEach(button => {
        button.addEventListener('click', function() {
            const nextStep = parseInt(this.getAttribute('data-next'));
            
            if (validateStep(currentStep)) {
                goToStep(nextStep);
            }
        });
    });
    
    // Back button handlers
    backButtons.forEach(button => {
        button.addEventListener('click', function() {
            const prevStep = parseInt(this.getAttribute('data-back'));
            goToStep(prevStep);
        });
    });
    
    // Function to go to a specific step
    function goToStep(step) {
        // Hide all steps
        formSteps.forEach(formStep => {
            formStep.classList.remove('active');
        });
        
        // Show target step
        const targetStep = document.querySelector(`.form-step[data-step="${step}"]`);
        if (targetStep) {
            targetStep.classList.add('active');
        }
        
        // Update step indicators
        stepIndicators.forEach((indicator, index) => {
            const stepNum = index + 1;
            indicator.classList.remove('active', 'completed');
            
            if (stepNum < step) {
                indicator.classList.add('completed');
                const circle = indicator.querySelector('.step-circle');
                circle.textContent = '';
            } else if (stepNum === step) {
                indicator.classList.add('active');
                const circle = indicator.querySelector('.step-circle');
                circle.textContent = stepNum;
            } else {
                const circle = indicator.querySelector('.step-circle');
                circle.textContent = stepNum;
            }
        });
        
        stepLabel.textContent = stepLabels[step];
        
        currentStep = step;
    }
    
    function validateStep(step) {
        let isValid = true;
        const currentFormStep = document.querySelector(`.form-step[data-step="${step}"]`);
        const inputs = currentFormStep.querySelectorAll('input[required]');
        
        inputs.forEach(input => {
            if (!input.value.trim()) {
                input.style.borderColor = '#ff4444';
                isValid = false;
            } else {
                input.style.borderColor = '#e0e0e0';
            }
        });
        
        if (!isValid) {
            showErrorModal('Missing Information', 'Please fill in all required fields before proceeding.');
        }
        
        return isValid;
    }
    
    const passwordInput = document.getElementById('password');
    const confirmPasswordInput = document.getElementById('confirmPassword');
    
    if (confirmPasswordInput) {
        confirmPasswordInput.addEventListener('input', function() {
            if (this.value !== passwordInput.value && this.value !== '') {
                this.style.borderColor = '#ff4444';
            } else {
                this.style.borderColor = '#e0e0e0';
            }
        });
    }
    
    if (passwordInput) {
        passwordInput.addEventListener('input', function() {
            if (confirmPasswordInput.value !== '' && confirmPasswordInput.value !== this.value) {
                confirmPasswordInput.style.borderColor = '#ff4444';
            } else {
                confirmPasswordInput.style.borderColor = '#e0e0e0';
            }
        });
    }
    
    signupForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        // Get form values
        const first_name = document.getElementById('first_name').value.trim();
        const last_name = document.getElementById('last_name').value.trim();
        const birthday = document.getElementById('birthday').value;
        const position = document.getElementById('position').value.trim();
        const university_code = document.getElementById('university_code').value.trim();
        const email = document.getElementById('email').value.trim();
        const password = passwordInput.value;
        const confirmPassword = confirmPasswordInput.value;
        
        if (password !== confirmPassword) {
            showErrorModal('Password Mismatch', 'Passwords do not match. Please try again.');
            confirmPasswordInput.focus();
            return;
        }
        
        if (password.length < 8) {
            showErrorModal('Weak Password', 'Password must be at least 8 characters long.');
            passwordInput.focus();
            return;
        }
        
        // Create user object
        const userData = {
            first_name,
            last_name,
            birthday,
            position,
            university_code,
            email,
            password
        };

        console.log('Signup attempt:', { 
            ...userData, 
            password: '***'
        });
        
        registerUser(userData);
    });
    
    async function registerUser(userData) {
        try {
            const response = await fetch('/signup', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'include',
                body: JSON.stringify(userData)
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.message || 'Signup failed');
            }

            showSuccessModal(
                'Account Created!',
                'Your account has been created successfully. Welcome to SLSU CHERM!'
            );

        } catch (err) {
            console.error('Signup error:', err);
            showErrorModal(
                'Signup Failed',
                err.message || 'Unable to create account. Please try again.'
            );
        }
    }   
    
    // Email validation
    const emailInput = document.getElementById('email');
    if (emailInput) {
        emailInput.addEventListener('blur', function() {
            validateEmail(this.value);
        });
    }
    
    function validateEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (email && !emailRegex.test(email)) {
            emailInput.style.borderColor = '#ff4444';
        } else {
            emailInput.style.borderColor = '#e0e0e0';
        }
    }
    
});

// ============================================================================
// MODAL FUNCTIONS
// ============================================================================
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
                    <button class="btn-primary" onclick="closeSuccessModal()">Continue</button>
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
        window.location.href = '/main-admin';
    }
}

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
