// Main JavaScript file for client-side functionality

document.addEventListener('DOMContentLoaded', function() {
    // Initialize tooltips if Bootstrap is available
    if (typeof bootstrap !== 'undefined') {
        const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
        tooltipTriggerList.map(function (tooltipTriggerEl) {
            return new bootstrap.Tooltip(tooltipTriggerEl);
        });
    }
    
    // Add warning for sync button clicks
    const syncButtons = document.querySelectorAll('a[href^="/sync/start/"]');
    syncButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            if (!confirm('This will create a new playlist in your Tidal account. Continue?')) {
                e.preventDefault();
            }
        });
    });
});