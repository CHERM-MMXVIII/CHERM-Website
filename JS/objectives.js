// Function to hide the modal if the window width is greater than or equal to 992px
function handleResize() {
    const navModal = document.getElementById('navModal');
    if (window.innerWidth >= 992 && navModal.classList.contains('show')) {
        // Check if the modal instance exists
        const modalInstance = bootstrap.Modal.getInstance(navModal);
        if (modalInstance) {
            modalInstance.hide(); // Hide the modal
        }

        // Remove the modal backdrop if it exists
        const backdrop = document.querySelector('.modal-backdrop');
        if (backdrop) {
            backdrop.remove();
        }

        // Ensure the body class and styles are reset
        document.body.classList.remove('modal-open');
        document.body.style.paddingRight = '';
    }
}

// Add event listener for window resize
window.addEventListener('resize', handleResize);

// Call the function on page load to handle initial state
document.addEventListener('DOMContentLoaded', handleResize);

const aboutUs = document.getElementById('navbarDropdown');
const dropdown = document.getElementById('customDropdown');

if (aboutUs && dropdown) {
    // Show on hover
    aboutUs.addEventListener('mouseenter', () => {
        dropdown.style.display = 'block';
    });

    aboutUs.addEventListener('mouseleave', () => {
        setTimeout(() => {
            if (!dropdown.matches(':hover')) {
                dropdown.style.display = 'none';
            }
        }, 200);
    });

    dropdown.addEventListener('mouseenter', () => {
        dropdown.style.display = 'block';
    });

    dropdown.addEventListener('mouseleave', () => {
        dropdown.style.display = 'none';
    });

    // Show on click too
    aboutUs.addEventListener('click', (e) => {
        e.preventDefault(); // prevent link jump
        dropdown.style.display = dropdown.style.display === 'block' ? 'none' : 'block';
    });
}

function goToAboutUs() {
    window.location.href = "index.html#what-is-cherm";
    sessionStorage.setItem("scrollToWhatIsCherm", "true"); // Store flag in sessionStorage
}

function goToContactUs() {
    window.location.href = "index.html#contact-us";
    sessionStorage.setItem("scrollToContactUs", "true"); 
}


document.addEventListener('DOMContentLoaded', function() {
    const aboutLink = document.getElementById('navbarDropdown');
    const dropdown = document.getElementById('customDropdown');

    if (aboutLink && dropdown) {
        // Show on hover (desktop)
        aboutLink.addEventListener('mouseenter', () => {
            dropdown.style.display = 'block';
        });
        aboutLink.addEventListener('mouseleave', () => {
            setTimeout(() => {
                if (!dropdown.matches(':hover')) dropdown.style.display = 'none';
            }, 200);
        });
        dropdown.addEventListener('mouseenter', () => {
            dropdown.style.display = 'block';
        });
        dropdown.addEventListener('mouseleave', () => {
            dropdown.style.display = 'none';
        });

        // Show/hide on click (mobile/touch)
        aboutLink.addEventListener('click', function(e) {
            e.preventDefault();
            // Toggle dropdown
            if (dropdown.style.display === 'block') {
                dropdown.style.display = 'none';
            } else {
                dropdown.style.display = 'block';
            }
        });

        // Hide dropdown when clicking outside
        document.addEventListener('click', function(event) {
            if (
                !aboutLink.contains(event.target) &&
                !dropdown.contains(event.target)
            ) {
                dropdown.style.display = 'none';
            }
        });
    }
});