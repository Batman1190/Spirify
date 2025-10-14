// Utility Functions for Musika ni Rod
// Security, Performance, and Helper Functions

// ============================================
// SECURITY: HTML Sanitization
// ============================================

/**
 * Sanitize HTML to prevent XSS attacks
 * Escapes HTML special characters
 */
function sanitizeHTML(str) {
    if (typeof str !== 'string') return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

/**
 * Create a safe DOM element with text content
 */
function createSafeElement(tag, text, className = '') {
    const element = document.createElement(tag);
    if (text) element.textContent = text;
    if (className) element.className = className;
    return element;
}

// ============================================
// STORAGE: Safe localStorage Operations
// ============================================

/**
 * Safe localStorage setter with quota handling
 */
function safeLocalStorageSet(key, value) {
    try {
        localStorage.setItem(key, value);
        return true;
    } catch (e) {
        if (e.name === 'QuotaExceededError') {
            console.error('Storage quota exceeded');
            showNotification('Storage is full. Please clear some data.', 'error');
        } else {
            console.error('Error saving to localStorage:', e);
        }
        return false;
    }
}

/**
 * Safe localStorage getter
 */
function safeLocalStorageGet(key, defaultValue = null) {
    try {
        const value = localStorage.getItem(key);
        return value !== null ? value : defaultValue;
    } catch (e) {
        console.error('Error reading from localStorage:', e);
        return defaultValue;
    }
}

// ============================================
// NETWORK: Connection Status
// ============================================

let isOnline = navigator.onLine;
let onlineStatusCallbacks = [];

function initNetworkMonitoring() {
    window.addEventListener('online', () => {
        isOnline = true;
        showNotification('You are back online!', 'success');
        onlineStatusCallbacks.forEach(cb => cb(true));
    });

    window.addEventListener('offline', () => {
        isOnline = false;
        showNotification('You are offline. Some features may not work.', 'warning');
        onlineStatusCallbacks.forEach(cb => cb(false));
    });
}

function onNetworkStatusChange(callback) {
    onlineStatusCallbacks.push(callback);
}

function checkOnlineStatus() {
    return isOnline;
}

// ============================================
// UI: Custom Notifications (replaces alert/confirm)
// ============================================

function showNotification(message, type = 'info', duration = 3000) {
    const notification = document.createElement('div');
    notification.className = `custom-notification ${type}`;
    notification.setAttribute('role', 'alert');
    notification.setAttribute('aria-live', 'polite');
    
    const icon = {
        'success': '✓',
        'error': '✗',
        'warning': '⚠',
        'info': 'ℹ'
    }[type] || 'ℹ';
    
    notification.innerHTML = `
        <span class="notification-icon">${icon}</span>
        <span class="notification-message">${sanitizeHTML(message)}</span>
        <button class="notification-close" aria-label="Close notification">×</button>
    `;
    
    document.body.appendChild(notification);
    
    // Close button
    notification.querySelector('.notification-close').addEventListener('click', () => {
        notification.remove();
    });
    
    // Auto-remove
    if (duration > 0) {
        setTimeout(() => {
            notification.classList.add('fade-out');
            setTimeout(() => notification.remove(), 300);
        }, duration);
    }
    
    return notification;
}

function showConfirmDialog(message, onConfirm, onCancel) {
    const overlay = document.createElement('div');
    overlay.className = 'custom-confirm-overlay';
    overlay.innerHTML = `
        <div class="custom-confirm-dialog" role="dialog" aria-modal="true" aria-labelledby="confirm-message">
            <p id="confirm-message" class="confirm-message">${sanitizeHTML(message)}</p>
            <div class="confirm-actions">
                <button class="btn-secondary confirm-cancel">Cancel</button>
                <button class="btn-primary confirm-ok">OK</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(overlay);
    
    const dialog = overlay.querySelector('.custom-confirm-dialog');
    const okBtn = dialog.querySelector('.confirm-ok');
    const cancelBtn = dialog.querySelector('.confirm-cancel');
    
    // Focus OK button
    setTimeout(() => okBtn.focus(), 100);
    
    function cleanup() {
        overlay.remove();
    }
    
    okBtn.addEventListener('click', () => {
        cleanup();
        if (onConfirm) onConfirm();
    });
    
    cancelBtn.addEventListener('click', () => {
        cleanup();
        if (onCancel) onCancel();
    });
    
    // Close on Escape
    function handleEscape(e) {
        if (e.key === 'Escape') {
            cleanup();
            if (onCancel) onCancel();
            document.removeEventListener('keydown', handleEscape);
        }
    }
    document.addEventListener('keydown', handleEscape);
    
    // Close on background click
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
            cleanup();
            if (onCancel) onCancel();
        }
    });
}

// ============================================
// PERFORMANCE: Debounce & Throttle
// ============================================

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

function throttle(func, limit) {
    let inThrottle;
    return function(...args) {
        if (!inThrottle) {
            func.apply(this, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

// ============================================
// MOBILE: Viewport Height Fix
// ============================================

function setMobileViewportHeight() {
    // Fix for mobile browsers where 100vh includes address bar
    const vh = window.innerHeight * 0.01;
    document.documentElement.style.setProperty('--vh', `${vh}px`);
}

function initMobileViewportFix() {
    setMobileViewportHeight();
    window.addEventListener('resize', debounce(setMobileViewportHeight, 100));
    window.addEventListener('orientationchange', setMobileViewportHeight);
}

// ============================================
// ACCESSIBILITY: Focus Management
// ============================================

class FocusTrap {
    constructor(element) {
        this.element = element;
        this.previousFocus = document.activeElement;
        this.focusableElements = null;
        this.firstFocusable = null;
        this.lastFocusable = null;
    }
    
    activate() {
        this.updateFocusableElements();
        if (this.firstFocusable) {
            this.firstFocusable.focus();
        }
        this.element.addEventListener('keydown', this.handleKeyDown.bind(this));
    }
    
    deactivate() {
        this.element.removeEventListener('keydown', this.handleKeyDown.bind(this));
        if (this.previousFocus && this.previousFocus.focus) {
            this.previousFocus.focus();
        }
    }
    
    updateFocusableElements() {
        const focusableSelectors = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';
        this.focusableElements = this.element.querySelectorAll(focusableSelectors);
        this.firstFocusable = this.focusableElements[0];
        this.lastFocusable = this.focusableElements[this.focusableElements.length - 1];
    }
    
    handleKeyDown(e) {
        if (e.key === 'Tab') {
            if (e.shiftKey) {
                if (document.activeElement === this.firstFocusable) {
                    e.preventDefault();
                    this.lastFocusable.focus();
                }
            } else {
                if (document.activeElement === this.lastFocusable) {
                    e.preventDefault();
                    this.firstFocusable.focus();
                }
            }
        }
    }
}

// ============================================
// ERROR HANDLING: Global Error Handler
// ============================================

function initGlobalErrorHandling() {
    window.addEventListener('error', (e) => {
        console.error('Global error:', e.error);
        showNotification('An error occurred. Please try again.', 'error');
    });
    
    window.addEventListener('unhandledrejection', (e) => {
        console.error('Unhandled promise rejection:', e.reason);
        showNotification('An error occurred. Please try again.', 'error');
        e.preventDefault();
    });
}

// ============================================
// FEATURE DETECTION
// ============================================

const features = {
    indexedDB: typeof indexedDB !== 'undefined',
    serviceWorker: 'serviceWorker' in navigator,
    localStorage: (() => {
        try {
            const test = '__test__';
            localStorage.setItem(test, test);
            localStorage.removeItem(test);
            return true;
        } catch (e) {
            return false;
        }
    })(),
    touchEvents: 'ontouchstart' in window,
    backdropFilter: CSS.supports('backdrop-filter', 'blur(10px)') || CSS.supports('-webkit-backdrop-filter', 'blur(10px)')
};

function checkFeatureSupport(feature) {
    return features[feature] || false;
}

// ============================================
// INITIALIZATION
// ============================================

function initUtils() {
    initNetworkMonitoring();
    initMobileViewportFix();
    initGlobalErrorHandling();
    
    // Add feature detection classes to body
    if (!features.backdropFilter) {
        document.body.classList.add('no-backdrop-filter');
    }
    if (features.touchEvents) {
        document.body.classList.add('touch-device');
    }
    
    console.log('Utils initialized. Features:', features);
}

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initUtils);
} else {
    initUtils();
}
