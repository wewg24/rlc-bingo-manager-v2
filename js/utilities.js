/**
 * Utilities Module
 * Handles QR codes, themes, search, and other utility functions
 */
class Utilities {
    constructor(adminInterface) {
        this.adminInterface = adminInterface;
    }

    /**
     * Generate QR Code for mobile access
     */
    generateQRCode() {
        const qrContainer = document.getElementById('qr-code-container');
        if (!qrContainer) return;

        // Clear existing QR code
        qrContainer.innerHTML = '';

        try {
            // Get the current page URL and modify it to point to occasion.html
            const currentUrl = new URL(window.location.href);
            const occasionUrl = new URL('./occasion.html', currentUrl).href;

            // Create QR code using a simple library or service
            const qrCodeDiv = document.createElement('div');
            qrCodeDiv.className = 'qr-code';

            // Using QR Server API for simple QR code generation
            const qrImage = document.createElement('img');
            qrImage.src = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(occasionUrl)}`;
            qrImage.alt = 'QR Code for Mobile Access';
            qrImage.style.maxWidth = '200px';
            qrImage.style.height = 'auto';

            qrCodeDiv.appendChild(qrImage);
            qrContainer.appendChild(qrCodeDiv);

            console.log('QR Code generated for URL:', occasionUrl);
        } catch (error) {
            console.error('Error generating QR code:', error);
            qrContainer.innerHTML = '<p class="text-muted">Unable to generate QR code</p>';
        }
    }

    /**
     * Initialize search functionality for various tables
     */
    initializeSearch(searchInputId, tableId, searchColumns = [0]) {
        const searchInput = document.getElementById(searchInputId);
        const table = document.getElementById(tableId);

        if (!searchInput || !table) return;

        searchInput.addEventListener('input', (e) => {
            this.filterTable(table, e.target.value, searchColumns);
        });
    }

    /**
     * Filter table rows based on search term
     */
    filterTable(table, searchTerm, searchColumns) {
        const rows = table.querySelectorAll('tbody tr');
        const lowerSearchTerm = searchTerm.toLowerCase();

        rows.forEach(row => {
            let shouldShow = false;

            // Search in specified columns
            searchColumns.forEach(columnIndex => {
                const cell = row.cells[columnIndex];
                if (cell && cell.textContent.toLowerCase().includes(lowerSearchTerm)) {
                    shouldShow = true;
                }
            });

            row.style.display = shouldShow ? '' : 'none';
        });

        // Update visible count
        const visibleRows = Array.from(rows).filter(row => row.style.display !== 'none').length;
        this.updateSearchResultsCount(table, visibleRows, rows.length);
    }

    /**
     * Update search results count display
     */
    updateSearchResultsCount(table, visibleCount, totalCount) {
        let countElement = table.parentElement.querySelector('.search-results-count');

        if (!countElement) {
            countElement = document.createElement('div');
            countElement.className = 'search-results-count text-muted';
            countElement.style.fontSize = '12px';
            countElement.style.marginTop = '5px';
            table.parentElement.appendChild(countElement);
        }

        countElement.textContent = visibleCount === totalCount
            ? `Showing all ${totalCount} results`
            : `Showing ${visibleCount} of ${totalCount} results`;
    }

    /**
     * Format currency values
     */
    formatCurrency(value) {
        if (typeof value !== 'number' || isNaN(value)) return '$0.00';
        return `$${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }

    /**
     * Format dates consistently
     */
    formatDate(dateValue) {
        if (!dateValue) return 'N/A';

        try {
            const date = new Date(dateValue);
            if (isNaN(date.getTime())) return 'Invalid Date';

            return date.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            });
        } catch (error) {
            return 'Invalid Date';
        }
    }

    /**
     * Validate email addresses
     */
    validateEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    /**
     * Validate phone numbers
     */
    validatePhone(phone) {
        // Basic phone validation - accepts various formats
        const phoneRegex = /^[\+]?[1-9]?[\d\s\-\(\)]{7,15}$/;
        return phoneRegex.test(phone.replace(/\s/g, ''));
    }

    /**
     * Sanitize input strings
     */
    sanitizeString(str) {
        if (typeof str !== 'string') return '';
        return str.trim().replace(/[<>]/g, '');
    }

    /**
     * Deep clone objects
     */
    deepClone(obj) {
        if (obj === null || typeof obj !== 'object') return obj;
        if (obj instanceof Date) return new Date(obj.getTime());
        if (obj instanceof Array) return obj.map(item => this.deepClone(item));

        const clonedObj = {};
        for (const key in obj) {
            if (obj.hasOwnProperty(key)) {
                clonedObj[key] = this.deepClone(obj[key]);
            }
        }
        return clonedObj;
    }

    /**
     * Generate unique IDs
     */
    generateId(prefix = 'id') {
        return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * Debounce function calls
     */
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func.apply(this, args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    /**
     * Show loading spinner
     */
    showLoading(message = 'Loading...') {
        let loadingOverlay = document.getElementById('loading-overlay');

        if (!loadingOverlay) {
            loadingOverlay = document.createElement('div');
            loadingOverlay.id = 'loading-overlay';
            loadingOverlay.innerHTML = `
                <div class="loading-content">
                    <div class="loading-spinner"></div>
                    <div class="loading-message">${message}</div>
                </div>
            `;
            document.body.appendChild(loadingOverlay);
            this.addLoadingStyles();
        } else {
            // Check for both possible message element structures
            let messageElement = loadingOverlay.querySelector('.loading-message');
            if (!messageElement) {
                messageElement = loadingOverlay.querySelector('.loading-text');
            }

            if (messageElement) {
                messageElement.textContent = message;
            } else {
                // If the existing overlay doesn't have the expected structure, replace it
                loadingOverlay.innerHTML = `
                    <div class="loading-content">
                        <div class="loading-spinner"></div>
                        <div class="loading-message">${message}</div>
                    </div>
                `;
            }
        }

        loadingOverlay.style.display = 'flex';
    }

    /**
     * Hide loading spinner
     */
    hideLoading() {
        const loadingOverlay = document.getElementById('loading-overlay');
        if (loadingOverlay) {
            loadingOverlay.style.display = 'none';
        }
    }

    /**
     * Add loading styles
     */
    addLoadingStyles() {
        const existingStyle = document.getElementById('loading-styles');
        if (existingStyle) return;

        const style = document.createElement('style');
        style.id = 'loading-styles';
        style.textContent = `
            #loading-overlay {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.5);
                display: none;
                justify-content: center;
                align-items: center;
                z-index: 9999;
            }

            .loading-content {
                background: white;
                padding: 30px;
                border-radius: 8px;
                text-align: center;
                box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            }

            .loading-spinner {
                width: 40px;
                height: 40px;
                border: 4px solid #f3f3f3;
                border-top: 4px solid #2196F3;
                border-radius: 50%;
                animation: spin 1s linear infinite;
                margin: 0 auto 15px;
            }

            .loading-message {
                color: #333;
                font-weight: 500;
            }

            @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }
        `;

        document.head.appendChild(style);
    }

    /**
     * Show notifications/alerts
     */
    showAlert(message, type = 'info', duration = 5000) {
        const alert = document.createElement('div');
        alert.className = `alert alert-${type} alert-dismissible`;
        alert.innerHTML = `
            <span>${message}</span>
            <button type="button" class="close" onclick="this.parentElement.remove()">×</button>
        `;

        // Add to top of the page
        const container = document.querySelector('.admin-container') || document.body;
        container.insertBefore(alert, container.firstChild);

        // Auto-remove after duration
        if (duration > 0) {
            setTimeout(() => {
                if (alert.parentElement) {
                    alert.remove();
                }
            }, duration);
        }
    }

    /**
     * Export data as JSON file
     */
    exportAsJson(data, filename) {
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);

        URL.revokeObjectURL(url);
    }

    /**
     * Export data as CSV file
     */
    exportAsCsv(data, filename, headers = []) {
        if (!Array.isArray(data) || data.length === 0) return;

        // Generate headers from first object if not provided
        if (headers.length === 0) {
            headers = Object.keys(data[0]);
        }

        // Create CSV content
        const csvContent = [
            headers.join(','),
            ...data.map(row =>
                headers.map(header => {
                    const value = row[header] || '';
                    // Escape commas and quotes
                    return typeof value === 'string' && (value.includes(',') || value.includes('"'))
                        ? `"${value.replace(/"/g, '""')}"`
                        : value;
                }).join(',')
            )
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);

        URL.revokeObjectURL(url);
    }

    /**
     * Get browser and device info
     */
    getBrowserInfo() {
        const ua = navigator.userAgent;
        return {
            isMobile: /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua),
            isTablet: /iPad|Android(?!.*Mobile)/i.test(ua),
            isDesktop: !/Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua)
        };
    }
}

// Make Utilities globally available
window.Utilities = Utilities;