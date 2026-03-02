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
    let timeoutId;

    if (aboutUs && dropdown) {
        // Show dropdown on hover
        aboutUs.addEventListener('mouseenter', () => {
            clearTimeout(timeoutId);
            dropdown.style.display = 'block';
        });

        // Hide dropdown when mouse leaves the dropdown menu
        dropdown.addEventListener('mouseleave', () => {
            timeoutId = setTimeout(() => {
                dropdown.style.display = 'none';
            }, 300); // Increased delay to 300ms
        });

        // Keep dropdown visible when mouse enters it
        dropdown.addEventListener('mouseenter', () => {
            clearTimeout(timeoutId);
            dropdown.style.display = 'block';
        });

        // Handle mouse leave from the About Us link
        aboutUs.addEventListener('mouseleave', () => {
            timeoutId = setTimeout(() => {
                if (!dropdown.matches(':hover')) {
                    dropdown.style.display = 'none';
                }
            }, 300); // Increased delay to 300ms
        });

        // Toggle dropdown on click
        aboutUs.addEventListener('click', (e) => {
            e.preventDefault();
            dropdown.style.display = dropdown.style.display === 'block' ? 'none' : 'block';
        });

        // Allow dropdown items to work normally and close dropdown after click
        dropdown.querySelectorAll('.dropdown-item').forEach(item => {
            item.addEventListener('click', () => {
                setTimeout(() => {
                    dropdown.style.display = 'none';
                }, 150); // Let the browser handle navigation, then close
            });
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