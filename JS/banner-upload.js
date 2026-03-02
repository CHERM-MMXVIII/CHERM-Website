// ============================================================================
// MODAL FUNCTIONS
// ============================================================================

// Show Cancel Confirmation Modal
function showCancelModal() {
    const modalHTML = `
        <div class="modal-overlay" id="cancelModal">
            <div class="modal-container">
                <div class="modal-header">
                    <div class="modal-icon warning">
                        <i class="fas fa-exclamation-triangle"></i>
                    </div>
                    <h3 class="modal-title">Cancel Upload?</h3>
                    <p class="modal-description">Are you sure you want to cancel this upload?</p>
                </div>
                
                <div class="modal-actions">
                    <button class="modal-btn modal-btn-secondary" onclick="closeCancelModal()">
                        Continue Uploading
                    </button>
                    <button class="modal-btn modal-btn-danger" onclick="confirmCancel()">
                        <i class="fas fa-times-circle"></i>
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    `;

    const existingModal = document.getElementById('cancelModal');
    if (existingModal) existingModal.remove();

    document.body.insertAdjacentHTML('beforeend', modalHTML);

    setTimeout(() => {
        document.getElementById('cancelModal').classList.add('show');
    }, 10);

    document.getElementById('cancelModal').addEventListener('click', (e) => {
        if (e.target.classList.contains('modal-overlay')) {
            closeCancelModal();
        }
    });
}

function closeCancelModal() {
    const modal = document.getElementById('cancelModal');
    if (modal) {
        modal.classList.remove('show');
        setTimeout(() => modal.remove(), 300);
    }
}

function confirmCancel() {
    const modal = document.getElementById('cancelModal');
    if (modal) {
        modal.classList.remove('show');
        setTimeout(() => {
            modal.remove();
            window.location.href = '/main-admin';
        }, 300);
    }
}

// Show Success Modal
function showSuccessModal(message = 'Banner published successfully!', redirectUrl = './manage-banners') {
    const modalHTML = `
        <div class="modal-overlay" id="successModal">
            <div class="modal-container">
                <div class="confetti-container" id="confettiContainer"></div>
                
                <div class="modal-header">
                    <div class="modal-icon success">
                        <div class="success-checkmark">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><!--!Font Awesome Free v7.1.0 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2026 Fonticons, Inc.--><path d="M256 512a256 256 0 1 1 0-512 256 256 0 1 1 0 512zM374 145.7c-10.7-7.8-25.7-5.4-33.5 5.3L221.1 315.2 169 263.1c-9.4-9.4-24.6-9.4-33.9 0s-9.4 24.6 0 33.9l72 72c5 5 11.8 7.5 18.8 7s13.4-4.1 17.5-9.8L379.3 179.2c7.8-10.7 5.4-25.7-5.3-33.5z"/></svg>
                        </div>
                    </div>
                    <h3 class="modal-title">Success!</h3>
                    <p class="modal-description">${message}</p>
                </div>
                
                <div class="modal-actions">
                    <button class="modal-btn modal-btn-secondary" onclick="closeSuccessModal()">
                        <i class="fas fa-plus"></i>
                        Upload Another
                    </button>
                    <button class="modal-btn modal-btn-primary" onclick="goToBannerManagement('${redirectUrl}')">
                        <i class="fas fa-list"></i>
                        View All Banners
                    </button>
                </div>
            </div>
        </div>
    `;

    const existingModal = document.getElementById('successModal');
    if (existingModal) existingModal.remove();

    document.body.insertAdjacentHTML('beforeend', modalHTML);

    setTimeout(() => {
        document.getElementById('successModal').classList.add('show');
        createConfetti();
    }, 10);
}

function closeSuccessModal() {
    const modal = document.getElementById('successModal');
    if (modal) {
        modal.classList.remove('show');
        setTimeout(() => {
            modal.remove();
            location.reload();
        }, 300);
    }
}

function goToBannerManagement(url) {
    const modal = document.getElementById('successModal');
    if (modal) {
        modal.classList.remove('show');
        setTimeout(() => {
            modal.remove();
            window.location.href = url;
        }, 300);
    }
}

// Create confetti animation
function createConfetti() {
    const container = document.getElementById('confettiContainer');
    if (!container) return;

    const colors = ['#008080', '#0e9c9c', '#f59e0b', '#10b981'];
    const confettiCount = 50;

    for (let i = 0; i < confettiCount; i++) {
        const confetti = document.createElement('div');
        confetti.className = 'confetti';
        confetti.style.left = Math.random() * 100 + '%';
        confetti.style.animationDelay = Math.random() * 0.5 + 's';
        confetti.style.animationDuration = (Math.random() * 2 + 2) + 's';
        confetti.style.background = colors[Math.floor(Math.random() * colors.length)];
        container.appendChild(confetti);
    }

    setTimeout(() => {
        container.innerHTML = '';
    }, 4000);
}

// Show Loading Modal
function showLoadingModal(message = 'Publishing banner...') {
    const modalHTML = `
        <div class="modal-overlay show" id="loadingModal">
            <div class="modal-container">
                <div class="modal-header">
                    <div class="modal-icon success">
                        <div class="spinner" style="width: 48px; height: 48px; border-width: 4px; border-color: #008080; border-top-color: transparent;"></div>
                    </div>
                    <h3 class="modal-title">${message}</h3>
                    <p class="modal-description">Please wait while we process your request...</p>
                </div>
            </div>
        </div>
    `;

    const existingModal = document.getElementById('loadingModal');
    if (existingModal) existingModal.remove();

    document.body.insertAdjacentHTML('beforeend', modalHTML);
}

function closeLoadingModal() {
    const modal = document.getElementById('loadingModal');
    if (modal) {
        modal.classList.remove('show');
        setTimeout(() => modal.remove(), 300);
    }
}

// Show Error Modal
function showErrorModal(message = 'Something went wrong!', details = 'Please try again or contact support if the problem persists.') {
    const modalHTML = `
        <div class="modal-overlay" id="errorModal">
            <div class="modal-container">
                <div class="modal-header">
                    <div class="modal-icon warning">
                        <i class="fas fa-exclamation-circle"></i>
                    </div>
                    <h3 class="modal-title">${message}</h3>
                    <p class="modal-description">${details}</p>
                </div>
                
                <div class="modal-actions">
                    <button class="modal-btn modal-btn-primary" onclick="closeErrorModal()">
                        <i class="fas fa-check"></i>
                        Got it
                    </button>
                </div>
            </div>
        </div>
    `;

    const existingModal = document.getElementById('errorModal');
    if (existingModal) existingModal.remove();

    document.body.insertAdjacentHTML('beforeend', modalHTML);

    setTimeout(() => {
        document.getElementById('errorModal').classList.add('show');
    }, 10);

    document.getElementById('errorModal').addEventListener('click', (e) => {
        if (e.target.classList.contains('modal-overlay')) {
            closeErrorModal();
        }
    });
}

function closeErrorModal() {
    const modal = document.getElementById('errorModal');
    if (modal) {
        modal.classList.remove('show');
        setTimeout(() => modal.remove(), 300);
    }
}

// ============================================================================
// BANNER UPLOAD FUNCTIONALITY
// ============================================================================

document.addEventListener('DOMContentLoaded', () => {

  if (document.getElementById('uploadBox')) {
    initBannerUpload();
  }

  if (document.getElementById('bannerList')) {
    initBannerManager();
  }

});

function initBannerUpload() {
    const uploadBox = document.getElementById('uploadBox');
    const bannerFile = document.getElementById('bannerFile');
    const browseLink = document.getElementById('browseLink');
    const uploadContent = document.getElementById('uploadContent');
    const uploadProgress = document.getElementById('uploadProgress');
    const uploadSuccess = document.getElementById('uploadSuccess');
    const progressBarFill = document.getElementById('progressBarFill');
    const progressPercentage = document.getElementById('progressPercentage');
    const previewContainer = document.getElementById('previewContainer');
    const publishBtn = document.getElementById('publishBtn');
    const cancelBtn = document.getElementById('cancelBtn');
    const uploadAnother = document.getElementById('uploadAnother');

    let selectedFile = null;
    let uploadedFileUrl = null;
    let uploadedFileType = null;

    browseLink.addEventListener('click', (e) => {
        e.preventDefault();
        bannerFile.click();
    });

    uploadBox.addEventListener('click', (e) => {
        if (
            e.target !== browseLink &&
            uploadProgress.style.display === 'none' &&
            uploadSuccess.style.display === 'none'
        ) {
            bannerFile.click();
        }
    });

    bannerFile.addEventListener('change', handleFileSelect);

    uploadBox.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadBox.classList.add('drag-over');
    });

    uploadBox.addEventListener('dragleave', (e) => {
        e.preventDefault();
        uploadBox.classList.remove('drag-over');
    });

    uploadBox.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadBox.classList.remove('drag-over');

        const files = e.dataTransfer.files;
        if (files.length > 0) {
            handleFile(files[0]);
        }
    });

    // Use modal instead of confirm
    cancelBtn.addEventListener('click', () => {
        showCancelModal();
    });

    uploadAnother.addEventListener('click', resetUpload);

    // Use modals for success/error
    publishBtn.addEventListener('click', async () => {
        if (!uploadedFileUrl || !uploadedFileType) return;

        try {
            publishBtn.disabled = true;
            publishBtn.innerHTML = '<span class="spinner"></span> Publishing...';

            showLoadingModal('Publishing banner...');

            const response = await fetch('/api/banners/publish', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    fileUrl: uploadedFileUrl,
                    fileType: uploadedFileType
                })
            });

            const result = await response.json();
            
            closeLoadingModal();

            if (!response.ok || !result.success) {
                throw new Error(result.error || 'Publish failed');
            }

            showSuccessModal('Banner published successfully!', './manage-banners');

        } catch (err) {
            console.error(err);
            closeLoadingModal();
            
            showErrorModal(
                'Failed to publish banner',
                err.message || 'Please try again or contact support if the problem persists.'
            );
            
            publishBtn.disabled = false;
            publishBtn.innerHTML = '<i class="fas fa-check-circle"></i> Publish Banner';
        }
    });


    function handleFileSelect(e) {
        if (e.target.files.length > 0) {
            handleFile(e.target.files[0]);
        }
    }

    function handleFile(file) {
        const validImageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
        const validVideoTypes = ['video/mp4', 'video/webm', 'video/ogg'];
        const allValidTypes = [...validImageTypes, ...validVideoTypes];

        if (!allValidTypes.includes(file.type)) {
            showErrorModal(
                'Invalid file type',
                'Please upload an image (JPG, PNG, GIF, WebP) or video (MP4, WebM, OGG).'
            );
            return;
        }

        const maxSize = 500 * 1024 * 1024;
        if (file.size > maxSize) {
            showErrorModal(
                'File too large',
                'File size exceeds 500MB. Please choose a smaller file.'
            );
            return;
        }

        selectedFile = file;
        uploadFile(file);
    }

    async function uploadFile(file) {
        uploadContent.style.display = 'none';
        uploadProgress.style.display = 'flex';
        uploadSuccess.style.display = 'none';

        const formData = new FormData();
        formData.append('banner', file);

        try {
            const response = await fetch('/api/banners/upload', {
                method: 'POST',
                body: formData
            });

            if (!response.ok) throw new Error('Upload failed');

            const data = await response.json();
            uploadedFileUrl = data.url;
            uploadedFileType = data.type;

            progressBarFill.style.width = '100%';
            progressPercentage.textContent = '100%';

            setTimeout(() => {
                showSuccess(file);
            }, 500);

        } catch (err) {
            console.error(err);
            showErrorModal(
                'Upload failed',
                'There was an error uploading your file. Please try again.'
            );
            resetUpload();
        }
    }

    function showSuccess(file) {
        uploadProgress.style.display = 'none';
        uploadSuccess.style.display = 'flex';

        previewContainer.innerHTML = '';
        const previewUrl = URL.createObjectURL(file);

        if (file.type.startsWith('image/')) {
            const img = document.createElement('img');
            img.src = previewUrl;
            img.alt = 'Banner Preview';
            previewContainer.appendChild(img);
        } else {
            const video = document.createElement('video');
            video.src = previewUrl;
            video.autoplay = true;
            video.loop = true;
            video.muted = true;
            video.playsInline = true;
            previewContainer.appendChild(video);
        }

        publishBtn.disabled = false;
    }

    function resetUpload() {
        selectedFile = null;
        uploadedFileUrl = null;
        uploadedFileType = null;
        bannerFile.value = '';

        progressBarFill.style.width = '0%';
        progressPercentage.textContent = '0%';

        uploadContent.style.display = 'flex';
        uploadProgress.style.display = 'none';
        uploadSuccess.style.display = 'none';

        previewContainer.innerHTML = '';
        publishBtn.disabled = true;
    }
}

// ============================================================================
// BANNER MANAGER FUNCTIONALITY
// ============================================================================

async function initBannerManager() {
  const container = document.getElementById('bannerList');

  try {
    const res = await fetch('/api/banners', {
        cache: 'no-store'
    });

    if (!res.ok && res.status !== 304) {
        throw new Error(`Failed to fetch banners (status ${res.status})`);
    }

    const data = await res.json();

    if (!data.banners || data.banners.length === 0) {
      container.innerHTML = `
        <div class="empty-state" data-aos="fade-up">
          <i class="fas fa-image"></i>
          <h3>No Banners Yet</h3>
          <p>You haven't uploaded any banners. Upload your first banner to get started.</p>
          <a href="./upload-banner.html" class="btn-add-new">
            <i class="fas fa-plus"></i> Upload Your First Banner
          </a>
        </div>
      `;
      return;
    }

    const grid = document.createElement('div');
    grid.className = 'banners-grid';

    data.banners.forEach((banner, index) => {
      const card = document.createElement('div');
      card.className = 'banner-card';
      card.setAttribute('data-aos', 'fade-up');
      card.setAttribute('data-aos-delay', index * 100);

      const isVideo = banner.file_type.startsWith('video/');
      const typeIcon = isVideo ? 'fa-video' : 'fa-image';
      const fileTypeLabel = isVideo ? 'Video' : 'Image';
      
      card.setAttribute('data-type', isVideo ? 'video' : 'image');

      const preview = isVideo
        ? `<video src="${banner.file_url}" muted loop onmouseover="this.play()" onmouseout="this.pause()"></video>`
        : `<img src="${banner.file_url}" alt="Banner ${banner.id}"/>`;

      const statusBadge = banner.is_active
        ? '<div class="active-badge"><i class="fas fa-circle"></i> Active</div>'
        : '<div class="inactive-badge">Inactive</div>';

      card.innerHTML = `
        <div class="banner-preview">
          ${preview}
          ${statusBadge}
        </div>
        <div class="banner-info">
          <div class="banner-meta">
            <span class="banner-type">
              <i class="fas ${typeIcon}"></i> ${fileTypeLabel}
            </span>
            <span class="banner-id">#${banner.id}</span>
          </div>
          <div class="banner-actions">
            ${
              banner.is_active
                ? '<button class="btn-activate" disabled><i class="fas fa-check"></i> Currently Active</button>'
                : `<button class="btn-activate" data-id="${banner.id}"><i class="fas fa-check-circle"></i> Set as Active</button>`
            }
          </div>
        </div>
      `;

      grid.appendChild(card);
    });

    container.innerHTML = '';
    container.appendChild(grid);

    initFilterDropdown();

    container.addEventListener('click', async (e) => {
      if (e.target.closest('button.btn-activate[data-id]')) {
        const button = e.target.closest('button.btn-activate[data-id]');
        const bannerId = button.dataset.id;

        if (!confirm('Set this banner as active? The current active banner will be deactivated.')) {
          return;
        }

        button.disabled = true;
        button.innerHTML = '<span class="spinner"></span> Activating...';

        try {
          const response = await fetch(`/api/banners/${bannerId}/activate`, {
            method: 'POST'
          });

          if (!response.ok) {
            throw new Error('Failed to activate banner');
          }

          initBannerManager();
          
          showToast('Banner activated successfully!', 'success');
        } catch (err) {
          console.error(err);
          showToast('Failed to activate banner. Please try again.', 'error');
          button.disabled = false;
          button.innerHTML = '<i class="fas fa-check-circle"></i> Set as Active';
        }
      }
    });

  } catch (err) {
    console.error(err);
    container.innerHTML = `
      <div class="error-state">
        <i class="fas fa-exclamation-triangle"></i>
        <h3>Error Loading Banners</h3>
        <p>${err.message}</p>
        <button class="btn-add-new" onclick="location.reload()">
          <i class="fas fa-redo"></i> Try Again
        </button>
      </div>
    `;
  }
}

function initFilterDropdown() {
  const filterToggle = document.getElementById('filterToggle');
  const filterMenu = document.getElementById('filterMenu');
  const dropdownItems = document.querySelectorAll('.dropdown-item');
  
  if (!filterToggle || !filterMenu || !dropdownItems.length) {
    return;
  }
  
  filterToggle.addEventListener('click', (e) => {
    e.stopPropagation();
    filterMenu.classList.toggle('show');
    filterToggle.classList.toggle('active');
  });

  document.addEventListener('click', (e) => {
    if (!e.target.closest('.filter-dropdown')) {
      filterMenu.classList.remove('show');
      filterToggle.classList.remove('active');
    }
  });

  dropdownItems.forEach(item => {
    item.addEventListener('click', (e) => {
      e.stopPropagation();
      
      dropdownItems.forEach(i => i.classList.remove('active'));
      item.classList.add('active');
      
      const filterType = item.getAttribute('data-filter');
      const filterText = item.textContent.trim();
      filterToggle.innerHTML = `<i class="fas fa-filter"></i> ${filterText} <i class="fas fa-chevron-down"></i>`;
      
      filterBanners(filterType);
      
      filterMenu.classList.remove('show');
      filterToggle.classList.remove('active');
    });
  });
}

function filterBanners(filterType) {
  const bannerCards = document.querySelectorAll('.banner-card');

  bannerCards.forEach(card => {
    const cardType = card.getAttribute('data-type');
    
    if (filterType === 'all') {
      card.classList.remove('hidden');
    } else if (filterType === cardType) {
      card.classList.remove('hidden');
    } else {
      card.classList.add('hidden');
    }
  });
}

// Toast notification function
function showToast(message, type = 'success') {
  const existingToast = document.querySelector('.toast-notification');
  if (existingToast) {
    existingToast.remove();
  }

  const toast = document.createElement('div');
  toast.className = `toast-notification toast-${type}`;
  toast.innerHTML = `
    <i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'}"></i>
    <span>${message}</span>
  `;

  const style = document.createElement('style');
  style.textContent = `
    .toast-notification {
      position: fixed;
      top: 20px;
      right: 20px;
      background: white;
      padding: 16px 24px;
      border-radius: 12px;
      box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
      display: flex;
      align-items: center;
      gap: 12px;
      z-index: 9999;
      animation: slideIn 0.3s ease;
      font-weight: 600;
    }

    .toast-success {
      border-left: 4px solid #48bb78;
      color: #2d3748;
    }

    .toast-success i {
      color: #48bb78;
      font-size: 1.2rem;
    }

    .toast-error {
      border-left: 4px solid #f56565;
      color: #2d3748;
    }

    .toast-error i {
      color: #f56565;
      font-size: 1.2rem;
    }

    @keyframes slideIn {
      from {
        transform: translateX(400px);
        opacity: 0;
      }
      to {
        transform: translateX(0);
        opacity: 1;
      }
    }

    @keyframes slideOut {
      from {
        transform: translateX(0);
        opacity: 1;
      }
      to {
        transform: translateX(400px);
        opacity: 0;
      }
    }
  `;

  if (!document.querySelector('#toast-styles')) {
    style.id = 'toast-styles';
    document.head.appendChild(style);
  }

  document.body.appendChild(toast);

  setTimeout(() => {
    toast.style.animation = 'slideOut 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

// Initialize AOS animations
document.addEventListener('DOMContentLoaded', () => {
  if (window.AOS) {
    AOS.init({
      duration: 800,
      once: true
    });
  }
});