// Scroll-based Highlight for Philippine Provinces
document.addEventListener('DOMContentLoaded', function() {
    // List of province IDs in the order you want to highlight them
    const provinces = [
        'abra',
        'agusan-del-norte',
        'agusan-del-sur',
        'aklan',
        'albay',
        'antique',
        'apayao',
        'aurora',
        'basilan',
        'bataan',
        'batanes',
        'batangas',
        'benguet',
        'biliran',
        'bohol',
        'bukidnon',
        'bulacan',
        'cagayan',
        'camarines-norte',
        'camarines-sur',
        'camiguin',
        'capiz',
        'catanduanes',
        'cavite',
        'cebu',
        'cotabato',
        'davao-de-oro', 
        'davao-del-norte',
        'davao-del-sur',
        'davao-occidental',
        'davao-oriental',
        'dinagat-islands',
        'eastern-samar',
        'guimaras',
        'ifugao',
        'ilocos-norte',
        'ilocos-sur',
        'iloilo',
        'isabela',
        'kalinga',
        'la-union',
        'laguna',
        'lanao-del-norte',
        'lanao-del-sur',
        'leyte',
        'maguidanao-del-norte',
        'maguidanao-del-sur',
        'marinduque',
        'masbate',
        'metro-manila', 
        'misamis-occidental',
        'misamis-oriental',
        'mountain-province',
        'negros-occidental',
        'negros-oriental',
        'northern-samar',
        'nueva-ecija',
        'nueva-vizcaya',
        'occidental-mindoro',
        'oriental-mindoro',
        'palawan',
        'pampanga',
        'pangasinan',
        'quezon',
        'quirino',
        'rizal',
        'romblon',
        'samar',  
        'sarangani',
        'siquijor',
        'sorsogon',
        'south-cotabato',
        'southern-leyte',
        'sultan-kudarat',
        'sulu',
        'surigao-del-norte',
        'surigao-del-sur',
        'tarlac',
        'tawi-tawi',
        'zambales',
        'zamboanga-del-norte',
        'zamboanga-del-sur',
        'zamboanga-sibugay'
    ];

    // Mouse hover highlight
    provinces.forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            el.addEventListener('mouseenter', function() {
                el.classList.add('highlight');
            });
            el.addEventListener('mouseleave', function() {
                // Only remove highlight if not highlighted by scroll
                if (!el.dataset.scrollHighlight) {
                    el.classList.remove('highlight');
                }
            });
        }
    });

    // Scroll-based highlight
    function highlightProvincesOnScroll() {
        const scrollY = window.scrollY;
        const docHeight = document.body.scrollHeight - window.innerHeight;
        const scrollPercent = docHeight ? scrollY / docHeight : 0;

        // Calculate how many provinces to highlight based on scroll
        const highlightCount = Math.floor(scrollPercent * provinces.length);

        provinces.forEach((id, idx) => {
            const el = document.getElementById(id);
            if (el) {
                if (idx <= highlightCount) {
                    el.classList.add('highlight');
                    el.dataset.scrollHighlight = "true";
                } else {
                    // Only remove if not hovered
                    el.dataset.scrollHighlight = "";
                    if (!el.matches(':hover')) {
                        el.classList.remove('highlight');
                    }
                }
            }
        });
    }

    window.addEventListener('scroll', highlightProvincesOnScroll);
    highlightProvincesOnScroll();
});


// Hover-based Highlight for Quezon Map City/Municipalities
window.addEventListener('DOMContentLoaded', () => {
  const obj = document.getElementById('quezon-map');
  const tooltip = document.getElementById('mapTooltip');

  obj.addEventListener('load', function() {
    const svgDoc = obj.contentDocument;
    if (!svgDoc) return;
    const paths = svgDoc.querySelectorAll('path');

    paths.forEach((path, idx) => {
      path.addEventListener('mousemove', (e) => {
        tooltip.style.display = 'block';
        tooltip.style.left = (e.clientX + 10) + 'px';
        tooltip.style.top = (e.clientY - 20) + 'px';
        tooltip.textContent = `Region ${idx + 1}`;
      });
      path.addEventListener('mouseleave', () => {
        tooltip.style.display = 'none';
      });
    });
  });
});