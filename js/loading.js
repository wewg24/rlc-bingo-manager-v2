/**
 * Loading Overlay System
 * Simple, reliable spinner for RLC Bingo Manager
 * Version 12.0.0 - Rebuilt from scratch
 */

(function() {
    'use strict';

    let overlay = null;
    let textElement = null;
    let subtextElement = null;
    let hideTimeout = null;

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    function init() {
        overlay = document.getElementById('loading-overlay');
        textElement = document.getElementById('loading-text');
        subtextElement = document.getElementById('loading-subtext');

        if (!overlay) {
            console.error('Loading overlay element not found!');
            return;
        }

        console.log('Loading manager initialized');
    }

    function showLoading(text = 'Loading', subtext = 'Please wait...') {
        if (!overlay) {
            console.warn('Loading overlay not initialized');
            return;
        }

        // Clear any pending hide timeout
        if (hideTimeout) {
            clearTimeout(hideTimeout);
            hideTimeout = null;
        }

        // Update text
        if (textElement) textElement.textContent = text;
        if (subtextElement) subtextElement.textContent = subtext;

        // Show overlay
        overlay.classList.add('show');

        console.log('Loading shown:', text);
    }

    function hideLoading(delay = 0) {
        if (!overlay) {
            console.warn('Loading overlay not initialized');
            return;
        }

        // Clear any existing hide timeout
        if (hideTimeout) {
            clearTimeout(hideTimeout);
            hideTimeout = null;
        }

        if (delay > 0) {
            hideTimeout = setTimeout(() => {
                overlay.classList.remove('show');
                console.log('Loading hidden (after delay)');
            }, delay);
        } else {
            overlay.classList.remove('show');
            console.log('Loading hidden');
        }
    }

    function updateLoadingText(text, subtext = null) {
        if (textElement && text) {
            textElement.textContent = text;
        }
        if (subtextElement && subtext) {
            subtextElement.textContent = subtext;
        }
    }

    // Export to global window object
    window.showLoading = showLoading;
    window.hideLoading = hideLoading;
    window.updateLoading = updateLoadingText;

    // Legacy compatibility
    window.LoadingManager = {
        show: (options = {}) => {
            const text = options.text || 'Loading';
            const subtext = options.subtext || 'Please wait...';
            showLoading(text, subtext);
        },
        hide: hideLoading,
        updateText: updateLoadingText
    };

})();
