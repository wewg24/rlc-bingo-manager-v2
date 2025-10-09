/**
 * Core Admin Interface Class
 * Handles authentication, navigation, and main app state
 */
class AdminInterface {
    constructor() {
        this.currentUser = null;
        this.occasions = [];
        this.pullTabLibrary = [];
        this.sessionGames = [];
        this.adminEventsBound = false;
        this.init();
    }

    init() {
        this.loadSavedState();
        this.setupEventListeners();
        this.checkAuthentication();
    }

    setupEventListeners() {
        // Login form
        document.getElementById('login-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleLogin();
        });

        // Logout
        document.getElementById('logout-btn').addEventListener('click', () => {
            this.handleLogout();
        });

        // Theme toggle
        document.getElementById('theme-toggle').addEventListener('click', () => {
            this.toggleTheme();
        });
    }

    checkAuthentication() {
        // Always require fresh authentication - no persistent login
        this.showLoginScreen();
    }

    handleLogin() {
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;
        const alert = document.getElementById('login-alert');

        // Simple authentication - no persistent storage
        if (username.toUpperCase() === 'RLC' && password === 'lions1935') {
            this.currentUser = { username: 'RLC', loginTime: new Date() };
            this.showAdminInterface();
        } else {
            alert.textContent = 'Invalid username or password';
            alert.classList.remove('hidden');
        }
    }

    handleLogout() {
        this.currentUser = null;
        this.showLoginScreen();
    }

    showLoginScreen() {
        document.getElementById('login-screen').classList.remove('hidden');
        document.getElementById('admin-interface').classList.add('hidden');
    }

    showAdminInterface() {
        console.log('AdminInterface: showAdminInterface called');
        const loginScreen = document.getElementById('login-screen');
        const adminInterface = document.getElementById('admin-interface');

        console.log('AdminInterface: loginScreen element:', loginScreen);
        console.log('AdminInterface: adminInterface element:', adminInterface);

        loginScreen.classList.add('hidden');
        adminInterface.classList.remove('hidden');

        console.log('AdminInterface: calling showDashboard()');
        this.showDashboard();
        this.bindAdminEventListeners();
    }

    bindAdminEventListeners() {
        // Prevent duplicate bindings
        if (this.adminEventsBound) return;
        this.adminEventsBound = true;

        // Navigation buttons
        document.getElementById('nav-dashboard').addEventListener('click', () => this.showDashboard());
        document.getElementById('nav-reports').addEventListener('click', () => this.showReports());
        document.getElementById('nav-library').addEventListener('click', () => this.showLibrary());
        document.getElementById('nav-session-games').addEventListener('click', () => this.showSessionGames());
        document.getElementById('nav-offline-generator').addEventListener('click', () => this.showOfflineGenerator());
    }

    toggleTheme() {
        document.body.classList.toggle('dark-mode');
        const isDark = document.body.classList.contains('dark-mode');
        localStorage.setItem('rlc_theme', isDark ? 'dark' : 'light');

        const themeButton = document.getElementById('theme-toggle');
        if (themeButton) {
            themeButton.textContent = isDark ? '☀️' : '🌙';
            themeButton.setAttribute('aria-label', isDark ? 'Switch to light mode' : 'Switch to dark mode');
        }

        console.log(`Theme switched to: ${isDark ? 'dark' : 'light'}`);
    }

    loadSavedState() {
        const savedTheme = localStorage.getItem('rlc_theme') || 'light';
        const systemPrefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
        const theme = savedTheme === 'auto' ? (systemPrefersDark ? 'dark' : 'light') : savedTheme;

        if (theme === 'dark') {
            document.body.classList.add('dark-mode');
        }

        const themeButton = document.getElementById('theme-toggle');
        if (themeButton) {
            themeButton.textContent = theme === 'dark' ? '☀️' : '🌙';
            themeButton.setAttribute('aria-label', theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode');
        }

        console.log(`Theme loaded: ${theme}`);
    }

    // Navigation Methods
    hideAllViews() {
        // Force hide all views with important styling
        const views = document.querySelectorAll('.view');
        views.forEach(view => {
            view.classList.remove('active');
            view.style.display = 'none';
        });

        // Remove active class from all nav buttons
        const navButtons = document.querySelectorAll('.nav button');
        navButtons.forEach(btn => btn.classList.remove('active'));

        console.log('AdminInterface: hideAllViews - hidden', views.length, 'views');
    }

    showDashboard() {
        console.log('AdminInterface: showDashboard called');
        this.hideAllViews();
        const dashboardView = document.getElementById('dashboard-view');
        const dashboardNav = document.getElementById('nav-dashboard');

        if (dashboardView && dashboardNav) {
            dashboardView.classList.add('active');
            dashboardView.style.display = 'block';
            dashboardNav.classList.add('active');
            console.log('AdminInterface: Dashboard view activated');
            this.loadDashboard();
        }
    }

    showOccasions() {
        console.log('AdminInterface: showOccasions called');
        this.hideAllViews();
        const occasionsView = document.getElementById('occasions-view');
        const occasionsNav = document.getElementById('nav-occasions');

        if (occasionsView && occasionsNav) {
            occasionsView.classList.add('active');
            occasionsView.style.display = 'block';
            occasionsNav.classList.add('active');
            console.log('AdminInterface: Occasions view activated');

            if (this.apiService) {
                this.apiService.loadOccasionsTable();
            }
        }
    }

    showReports() {
        console.log('AdminInterface: showReports called');
        this.hideAllViews();
        const reportsView = document.getElementById('reports-view');
        const reportsNav = document.getElementById('nav-reports');

        if (reportsView && reportsNav) {
            reportsView.classList.add('active');
            reportsView.style.display = 'block';
            reportsNav.classList.add('active');
            console.log('AdminInterface: Reports view activated');
        }
    }

    showLibrary() {
        console.log('AdminInterface: showLibrary called');
        this.hideAllViews();
        const libraryView = document.getElementById('library-view');
        const libraryNav = document.getElementById('nav-library');

        if (libraryView && libraryNav) {
            libraryView.classList.add('active');
            libraryView.style.display = 'block';
            libraryNav.classList.add('active');
            console.log('AdminInterface: Library view activated');

            if (this.apiService) {
                this.apiService.loadPullTabLibrary();
            }
        }
    }

    showSessionGames() {
        console.log('AdminInterface: showSessionGames called');
        this.hideAllViews();
        const sessionGamesView = document.getElementById('session-games-view');
        const sessionGamesNav = document.getElementById('nav-session-games');

        if (sessionGamesView && sessionGamesNav) {
            sessionGamesView.classList.add('active');
            sessionGamesView.style.display = 'block';
            sessionGamesNav.classList.add('active');
            console.log('AdminInterface: Session Games view activated');

            if (this.apiService) {
                this.apiService.loadSessionGames();
            }
        }
    }

    showOfflineGenerator() {
        console.log('AdminInterface: showOfflineGenerator called');
        this.hideAllViews();
        const offlineView = document.getElementById('offline-generator-view');
        const offlineNav = document.getElementById('nav-offline-generator');

        if (offlineView && offlineNav) {
            offlineView.classList.add('active');
            offlineView.style.display = 'block';
            offlineNav.classList.add('active');
            console.log('AdminInterface: Offline Generator view activated');
        }
    }

    // Dashboard Loading
    async loadDashboard() {
        console.log('AdminInterface: loadDashboard called');
        console.log('AdminInterface: window.showLoading available:', !!window.showLoading);

        if (window.showLoading) {
            console.log('AdminInterface: calling showLoading');
            window.showLoading({
                text: 'Loading Dashboard',
                subtext: 'Fetching occasions and data from Google Drive...',
                timeout: 20000
            });
        } else {
            console.warn('AdminInterface: window.showLoading not available');
        }

        try {
            if (this.apiService) {
                await this.apiService.loadRealData();
                this.generateQRCode();
            } else {
                throw new Error('API Service not initialized');
            }
        } catch (error) {
            console.error('Error loading dashboard:', error);
            this.showErrorState(error.message || 'Unable to load data from Google Drive');
        } finally {
            console.log('AdminInterface: calling hideLoading in finally block');
            if (window.hideLoading) {
                window.hideLoading();
                console.log('AdminInterface: hideLoading called successfully');
            } else {
                console.warn('AdminInterface: window.hideLoading not available in finally block');
            }

            // Force remove any loading text that might be stuck
            setTimeout(() => {
                const loadingOverlay = document.getElementById('loading-overlay');
                if (loadingOverlay) {
                    loadingOverlay.style.display = 'none';
                    console.log('AdminInterface: Force-hidden loading overlay');
                }
            }, 100);
        }
    }

    showErrorState(message) {
        const dashboardView = document.getElementById('dashboard-view');
        if (dashboardView) {
            dashboardView.innerHTML = `
                <div class="card">
                    <div class="alert error">
                        <h3>⚠️ Error Loading Dashboard</h3>
                        <p>${message}</p>
                        <button class="btn" onclick="window.adminInterface.loadDashboard()">
                            🔄 Retry Loading
                        </button>
                    </div>
                </div>
            `;
        }
    }

    generateQRCode() {
        if (this.utilities) {
            this.utilities.generateQRCode();
        }
    }

    // Utility methods for data processing
    cleanString(value) {
        if (typeof value !== 'string') return '';
        return value.trim();
    }

    validateDate(dateValue) {
        if (!dateValue) return null;
        const date = new Date(dateValue);
        if (isNaN(date.getTime())) return null;
        return date.toISOString().split('T')[0];
    }

    // Set module references (will be set during initialization)
    setApiService(apiService) {
        this.apiService = apiService;
    }

    setCrudOperations(crudOperations) {
        this.crudOperations = crudOperations;
    }

    setUtilities(utilities) {
        this.utilities = utilities;
    }

    setDashboard(dashboard) {
        this.dashboard = dashboard;
    }

    setUIComponents(uiComponents) {
        this.uiComponents = uiComponents;
    }

    // Report generation functions
    generateFinancialReport() {
        console.log('Generating financial report...');
        alert('Financial Report generation is not yet implemented. This feature will be available in a future update.');
    }

    generatePlayerReport() {
        console.log('Generating player report...');
        alert('Player Report generation is not yet implemented. This feature will be available in a future update.');
    }

    generateSessionReport() {
        console.log('Generating session report...');
        alert('Session Report generation is not yet implemented. This feature will be available in a future update.');
    }

    generateOfflineApp() {
        console.log('Generating offline app...');
        alert('Offline App generation is not yet implemented. This feature will be available in a future update.');
    }
}

// Make AdminInterface globally available
window.AdminInterface = AdminInterface;