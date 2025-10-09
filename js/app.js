// Main Application Logic for RLC Bingo Manager
// Version 11.0.4 - Fully refactored with proper global scope and initialization
class BingoApp {
    constructor() {
        if (typeof CONFIG === 'undefined') {
            console.error('CONFIG not loaded! Check script loading order.');
            throw new Error('CONFIG dependency missing');
        }
        
        this.currentStep = 1;
        this.totalSteps = 6;
        
        // Initialize comprehensive data structure
        this.data = {
            occasion: {},
            paperBingo: {},
            posSales: {},
            electronic: {},
            games: [],
            pullTabs: [],
            moneyCount: {
                bingo: {},
                pullTab: {}
            },
            financial: {}
        };
        
        // Pull Tab Library array - will be populated from JSON data
        this.pullTabLibrary = [];
        
        // Application state
        this.isDarkMode = localStorage.getItem(CONFIG.STORAGE_KEYS.THEME) === 'dark';
        this.isOnline = navigator.onLine;
        
        // Initialize the application
        this.init();
    }

    /**
     * Display the occasions list view
     * Stores current wizard state and loads historical occasions
     */
    showOccasions() {
        this.closeMenu();
        
        // Store current wizard state for recovery
        localStorage.setItem('wizardState', JSON.stringify({
            step: this.currentStep || 1,
            data: this.data
        }));
        
        // Create occasions view interface
        const container = document.querySelector('.wizard-container');
        if (!container) return;
        
        container.innerHTML = `
            <div class="occasions-view">
                <div class="view-header">
                    <h2>Recent Occasions</h2>
                    <button class="button secondary" onclick="window.app.returnToWizard()">Back to Entry</button>
                </div>
                <div class="occasions-list">
                    <p>Loading occasions...</p>
                </div>
            </div>
        `;
        
        this.loadOccasionsList();
    }
    
    /**
     * Load and display occasions from the backend
     */
    async loadOccasionsList() {
        try {
            const data = await this.loadOccasionsJSONP(CONFIG.API_URL);
            
            const listContainer = document.querySelector('.occasions-list');
            if (data.success && data.occasions) {
                listContainer.innerHTML = data.occasions.map(occ => `
                    <div class="occasion-item">
                        <strong>${occ.Date}</strong> - ${occ['Occasion Type']} - ${occ['Lion in Charge']}
                        <span class="occasion-status">${occ.Status}</span>
                    </div>
                `).join('');
            } else {
                listContainer.innerHTML = '<p>No occasions found or unable to load.</p>';
            }
        } catch (error) {
            console.error('Error loading occasions:', error);
            document.querySelector('.occasions-list').innerHTML = '<p>Error loading occasions. Check connection.</p>';
        }
    }

    loadOccasionsJSONP(scriptUrl) {
        return new Promise((resolve, reject) => {
            const callbackName = 'jsonp_callback_' + Math.round(100000 * Math.random());
            const script = document.createElement('script');

            // Set up the callback function
            window[callbackName] = function(data) {
                delete window[callbackName];
                document.body.removeChild(script);
                resolve({
                    success: data.success || true,
                    occasions: data.occasions || [],
                    count: data.count || 0,
                    lastUpdated: data.lastUpdated
                });
            };

            // Create the script tag
            script.src = `${scriptUrl}?action=loadOccasions&callback=${callbackName}&t=${Date.now()}`;
            script.onerror = function() {
                delete window[callbackName];
                document.body.removeChild(script);
                reject(new Error('JSONP request failed'));
            };

            document.body.appendChild(script);

            // Timeout after 10 seconds
            setTimeout(() => {
                if (window[callbackName]) {
                    delete window[callbackName];
                    document.body.removeChild(script);
                    reject(new Error('JSONP request timeout'));
                }
            }, 10000);
        });
    }

    /**
     * Display reports generation interface
     */
    showReports() {
        this.closeMenu();
        
        const container = document.querySelector('.wizard-container');
        if (!container) return;
        
        container.innerHTML = `
            <div class="view-container">
                <div class="view-header">
                    <h2>Reports</h2>
                    <button class="button primary" onclick="window.app.returnToWizard()">Back to Entry</button>
                </div>
                <div class="reports-content">
                    <div class="report-card">
                        <h3>MGC Form 104</h3>
                        <p>Generate official Missouri Gaming Commission report</p>
                        <button class="button" onclick="alert('MGC Form generation coming soon')">Generate</button>
                    </div>
                    <div class="report-card">
                        <h3>Occasion Summary</h3>
                        <p>Complete financial summary of current occasion</p>
                        <button class="button" onclick="window.print()">Print Current</button>
                    </div>
                    <div class="report-card">
                        <h3>Monthly Report</h3>
                        <p>Aggregate report for board meetings</p>
                        <button class="button" onclick="alert('Monthly report coming soon')">Generate</button>
                    </div>
                </div>
            </div>
        `;
    }
    
    /**
     * Display pull-tab library with JSON data mapping
     */
    showPullTabLibrary() {
        this.closeMenu();
        
        const container = document.querySelector('.wizard-container');
        if (!container) return;
        
        // Generate library table HTML with proper field mapping
        const libraryHTML = this.pullTabLibrary && this.pullTabLibrary.length > 0
            ? this.pullTabLibrary.slice(0, 50).map(game => {
                // Map JSON data to display values
                const gameName = game.name || '';
                const formNumber = game.form || '';
                const ticketCount = game.count || 0;
                const ticketPrice = game.price || 1;
                const idealProfit = game.idealProfit || 0;
                
                return `
                    <tr>
                        <td>${gameName}</td>
                        <td>${formNumber}</td>
                        <td>${ticketCount}</td>
                        <td>$${ticketPrice.toFixed(2)}</td>
                        <td>$${idealProfit.toFixed(2)}</td>
                    </tr>
                `;
            }).join('')
            : '<tr><td colspan="5">No games loaded</td></tr>';
        
        container.innerHTML = `
            <div class="view-container">
                <div class="view-header">
                    <h2>Pull-Tab Game Library</h2>
                    <button class="button primary" onclick="window.app.returnToWizard()">Back to Entry</button>
                </div>
                <div class="library-info">
                    <p>Total Games in Library: ${this.pullTabLibrary ? this.pullTabLibrary.length : 0}</p>
                    <p class="info-note">Displaying first 50 games of ${this.pullTabLibrary.length} total</p>
                </div>
                <div class="table-container">
                    <table class="data-table">
                        <thead>
                            <tr>
                                <th>Game Name</th>
                                <th>Form #</th>
                                <th>Ticket Count</th>
                                <th>Price</th>
                                <th>Ideal Profit</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${libraryHTML}
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    }
    
    /**
     * Display admin interface for system management
     */
    showAdmin() {
        this.closeMenu();
        
        const container = document.querySelector('.wizard-container');
        if (!container) return;
        
        container.innerHTML = `
            <div class="admin-view">
                <div class="view-header">
                    <h2>Administration</h2>
                    <button class="button secondary" onclick="window.app.returnToWizard()">Back to Entry</button>
                </div>
                <div class="admin-sections">
                    <div class="admin-section">
                        <h3>Data Management</h3>
                        <button class="button" onclick="window.app.exportAllData()">Export All Data</button>
                        <button class="button danger" onclick="window.app.clearLocalData()">Clear Local Storage</button>
                    </div>
                    <div class="admin-section">
                        <h3>System Status</h3>
                        <button class="button" onclick="window.app.checkForUpdates()">Check for Updates</button>
                        <button class="button" onclick="window.app.viewSyncQueue()">View Sync Queue</button>
                        <button class="button" onclick="window.app.reloadPullTabLibrary()">Reload Pull-Tab Library</button>
                    </div>
                    <div class="admin-section">
                        <h3>Version Information</h3>
                        <p>Version: ${CONFIG.VERSION}</p>
                        <p>Cache Version: v11.0.0</p>
                        <p>API URL: ${CONFIG.API_URL ? 'Configured' : 'Not configured'}</p>
                        <p>Library Games: ${this.pullTabLibrary.length}</p>
                    </div>
                </div>
            </div>
        `;
    }
    
    /**
     * Display help documentation interface
     */
    showHelp() {
        this.closeMenu();
        
        const container = document.querySelector('.wizard-container');
        if (!container) return;
        
        container.innerHTML = `
            <div class="view-container">
                <div class="view-header">
                    <h2>📋 Help & Support</h2>
                    <button class="button primary" onclick="window.app.returnToWizard()">↶ Back to Entry</button>
                </div>
                <div class="help-content">
                    <section>
                        <h3>🎯 Quick Start Guide</h3>
                        <p><strong>Welcome to the RLC Bingo Manager!</strong> This system guides you through recording bingo occasions with a simple 6-step wizard.
                           All data is automatically saved as you type, and you can work completely offline.</p>
                        <div style="background: #e8f4fd; padding: 15px; border-radius: 8px; border-left: 4px solid #2196F3; margin: 15px 0;">
                            <strong>💡 Pro Tip:</strong> You can click on any completed step number in the progress bar to go back and review or edit that section.
                        </div>
                    </section>

                    <section>
                        <h3>📝 The Six Steps Explained</h3>
                        <div class="help-steps">
                            <div class="help-step" style="background: #f8f9fa; padding: 12px; margin: 8px 0; border-radius: 6px; border-left: 3px solid #007bff;">
                                <strong>1. 📅 Occasion Info:</strong> Enter the date (auto-detects Monday type), Lion in charge, attendance count, and progressive jackpot details.
                            </div>
                            <div class="help-step" style="background: #f8f9fa; padding: 12px; margin: 8px 0; border-radius: 6px; border-left: 3px solid #28a745;">
                                <strong>2. 📋 Paper Sales:</strong> Record your beginning/ending inventory counts for all paper types, POS door sales, and electronic machine rentals.
                            </div>
                            <div class="help-step" style="background: #f8f9fa; padding: 12px; margin: 8px 0; border-radius: 6px; border-left: 3px solid #ffc107;">
                                <strong>3. 🎮 Game Results:</strong> Enter the number of winners for each of the 17 regular games. System auto-calculates payouts.
                            </div>
                            <div class="help-step" style="background: #f8f9fa; padding: 12px; margin: 8px 0; border-radius: 6px; border-left: 3px solid #17a2b8;">
                                <strong>4. 🎫 Pull-Tabs:</strong> Add each pull-tab game opened, select from library, enter serial numbers and actual prizes paid.
                            </div>
                            <div class="help-step" style="background: #f8f9fa; padding: 12px; margin: 8px 0; border-radius: 6px; border-left: 3px solid #6610f2;">
                                <strong>5. 💰 Money Count:</strong> Count both the bingo and pull-tab cash drawers. System calculates deposit totals.
                            </div>
                            <div class="help-step" style="background: #f8f9fa; padding: 12px; margin: 8px 0; border-radius: 6px; border-left: 3px solid #e83e8c;">
                                <strong>6. ✅ Review:</strong> Review all totals and financial calculations before final submission to the system.
                            </div>
                        </div>
                    </section>

                    <section>
                        <h3>💡 Tips & Best Practices</h3>
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin: 15px 0;">
                            <div style="background: #d4edda; padding: 12px; border-radius: 6px;">
                                <strong>📱 Mobile Friendly</strong><br>
                                <small>Works great on tablets and phones - perfect for taking around the hall</small>
                            </div>
                            <div style="background: #d1ecf1; padding: 12px; border-radius: 6px;">
                                <strong>🌙 Dark Mode</strong><br>
                                <small>Click the moon icon for easier viewing during evening occasions</small>
                            </div>
                            <div style="background: #fff3cd; padding: 12px; border-radius: 6px;">
                                <strong>💾 Auto-Save</strong><br>
                                <small>Every field saves automatically - never lose your work!</small>
                            </div>
                            <div style="background: #f8d7da; padding: 12px; border-radius: 6px;">
                                <strong>📶 Works Offline</strong><br>
                                <small>No internet? No problem! Data syncs when connection returns</small>
                            </div>
                        </div>
                        <ul style="text-align: left; max-width: 600px; margin: 20px auto 0; background: #f8f9fa; padding: 20px; border-radius: 8px;">
                            <li><strong>Start Early:</strong> Begin entering data as the occasion starts - don't wait until the end</li>
                            <li><strong>Double-Check Counts:</strong> Verify your beginning/ending inventory counts before proceeding</li>
                            <li><strong>Use Pull-Tab Library:</strong> Contains ${this.pullTabLibrary.length} games - select instead of typing names</li>
                            <li><strong>Check Progressive:</strong> Make sure progressive jackpot amount and balls are correct</li>
                            <li><strong>Count Carefully:</strong> Money count step is critical - take your time</li>
                        </ul>
                    </section>

                    <section>
                        <h3>🛠️ Technical Support</h3>
                        <div style="background: #e7f3ff; padding: 20px; border-radius: 10px; border: 2px solid #2196F3; text-align: center;">
                            <h4 style="margin-top: 0; color: #1565C0;">Need Help? Contact Bill!</h4>
                            <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 15px; margin: 15px 0;">
                                <div>
                                    <strong>📧 Email</strong><br>
                                    <a href="mailto:wewg24@gmail.com" style="color: #1565C0; text-decoration: none;">wewg24@gmail.com</a>
                                </div>
                                <div>
                                    <strong>📱 Phone</strong><br>
                                    <a href="tel:+15735782866" style="color: #1565C0; text-decoration: none;">(573) 578-2866</a>
                                </div>
                                <div>
                                    <strong>👤 Name</strong><br>
                                    <span style="color: #1565C0;">Bill Wiggins</span>
                                </div>
                            </div>
                            <p style="margin: 15px 0 5px; font-size: 0.9em; color: #666;">
                                <strong>System Info:</strong> Version ${CONFIG.VERSION} •
                                Last Updated: ${localStorage.getItem('lastLibraryUpdate') || 'Never'}
                            </p>
                        </div>
                    </section>

                    <section style="margin-top: 30px; text-align: center; padding: 20px; background: #f8f9fa; border-radius: 10px;">
                        <h4 style="color: #2196F3; margin-bottom: 10px;">🦁 Rolla Lions Club</h4>
                        <p style="margin: 5px 0; color: #666;">Serving the community through Monday night bingo since 1924</p>
                        <p style="margin: 5px 0; font-size: 0.9em; color: #888;">Missouri Gaming Commission Compliant</p>
                    </section>
                </div>
            </div>
        `;
    }
    
    /**
     * Return to wizard from any view
     * Restores saved wizard state
     */
    returnToWizard() {
        // Restore wizard state if available
        const savedState = localStorage.getItem('wizardState');
        if (savedState) {
            const state = JSON.parse(savedState);
            this.data = state.data;
            this.currentStep = state.step;
        }
        
        // Reload to restore full wizard (simplest approach for now)
        window.location.reload();
    }
    
    /**
     * Export all application data for backup
     */
    exportAllData() {
        const exportData = {
            version: CONFIG.VERSION,
            exportDate: new Date().toISOString(),
            currentOccasion: this.data,
            localStorage: { ...localStorage },
            pullTabLibrary: this.pullTabLibrary,
            syncQueue: JSON.parse(localStorage.getItem(CONFIG.STORAGE_KEYS.SYNC_QUEUE) || '[]')
        };
        
        const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `rlc-bingo-export-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
        
        alert('Data exported successfully!');
    }
    
    /**
     * Clear all local storage data with confirmation
     */
    clearLocalData() {
        if (confirm('This will clear all local data including drafts and sync queue. Are you sure?')) {
            if (confirm('This action cannot be undone. Continue?')) {
                localStorage.clear();
                localStorage.clear();
                alert('Local data cleared. Refreshing...');
                window.location.reload();
            }
        }
    }
    
    /**
     * View pending sync queue items
     */
    viewSyncQueue() {
        const queue = JSON.parse(localStorage.getItem(CONFIG.STORAGE_KEYS.SYNC_QUEUE) || '[]');
        alert(`Sync Queue: ${queue.length} items pending\n\n` + 
              (queue.length > 0 ? `Next item: ${JSON.stringify(queue[0], null, 2).substring(0, 500)}...` : 'Queue is empty'));
    }
    
    /**
     * Force reload pull-tab library from backend
     */
    async reloadPullTabLibrary() {
        const originalLength = this.pullTabLibrary.length;
        await this.loadPullTabLibrary(true); // Force reload
        alert(`Library reloaded. Games: ${originalLength} → ${this.pullTabLibrary.length}`);
    }
    
    /**
     * Check for application updates
     */
    checkForUpdates() {
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.ready.then(registration => {
                registration.update();
                alert('Checking for updates... If an update is available, it will be installed on next refresh.');
            });
        } else {
            alert('Service Worker not supported. Manual refresh required for updates.');
        }
    }
    
    /**
     * Check version from server
     */
    async checkVersion() {
        try {
            const basePath = window.location.pathname.includes('/rlc-bingo-manager/') 
                ? '/rlc-bingo-manager' 
                : '';
            const response = await fetch(`${basePath}/version.json?t=` + Date.now());
            const data = await response.json();
            
            const currentVersion = localStorage.getItem('app_version');
            
            if (currentVersion && currentVersion !== data.version) {
                // New version available
                if (confirm('A new version is available. Refresh to update?')) {
                    localStorage.setItem('app_version', data.version);
                    window.location.reload(true);
                }
            } else {
                localStorage.setItem('app_version', data.version);
            }
        } catch (error) {
            console.log('Version check failed:', error);
        }
    }
    
    /**
     * Initialize the application
     */
    async init() {
        // Load saved draft if exists
        this.loadDraft();
        
        // Initialize UI components
        this.initializeTheme();
        this.initializeEventListeners();
        this.initializeDateField();
        this.initializePaperSalesTable();
        this.initializePOSSalesTable();
        
        // Load pull-tab library from JSON API
        await this.loadPullTabLibrary();
        
        // Setup online/offline detection
        this.setupConnectionMonitoring();
        
        // Process any pending sync items
        await this.processSyncQueue();

        // Check for updates periodically (DISABLED - no version.json file)
        // this.checkVersion();
        // setInterval(() => this.checkVersion(), 5 * 60 * 1000); // Every 5 minutes
    }
    
    /**
     * Initialize dark/light theme
     */
    initializeTheme() {
        if (this.isDarkMode) {
            document.body.classList.add('dark-mode');
            const themeToggle = document.getElementById('theme-toggle');
            if (themeToggle) {
                themeToggle.innerHTML = '<span class="theme-icon">☀️</span>';
            }
        }
    }
    
    /**
     * Setup all event listeners
     */
    initializeEventListeners() {
        // Theme toggle
        const themeToggle = document.getElementById('theme-toggle');
        if (themeToggle) {
            themeToggle.addEventListener('click', () => this.toggleTheme());
        }
        
        // Menu toggle
        const menuToggle = document.getElementById('menu-toggle');
        if (menuToggle) {
            menuToggle.addEventListener('click', () => this.openMenu());
        }
        
        // Occasion type change
        const occasionType = document.getElementById('occasion-type');
        if (occasionType) {
            occasionType.addEventListener('change', (e) => this.loadOccasionGames(e.target.value));
        }
        
        // Birthday BOGO calculation
        const birthdays = document.getElementById('birthdays');
        if (birthdays) {
            birthdays.addEventListener('input', (e) => this.calculateBirthdayBOGO(e.target.value));
        }
        
        // Progressive calculations
        const progActualBalls = document.getElementById('prog-actual-balls');
        if (progActualBalls) {
            progActualBalls.addEventListener('input', () => this.calculateProgressivePrize());
        }
        
        // Money count calculations
        document.querySelectorAll('[id^="bingo-"], [id^="pt-"]').forEach(input => {
            input.addEventListener('input', () => this.calculateMoneyTotals());
        });
        
        // Electronic sales
        const smallMachines = document.getElementById('small-machines');
        const largeMachines = document.getElementById('large-machines');
        if (smallMachines) {
            smallMachines.addEventListener('input', () => this.calculateElectronicSales());
        }
        if (largeMachines) {
            largeMachines.addEventListener('input', () => this.calculateElectronicSales());
        }
        
        // Auto-save on input
        document.querySelectorAll('input, select').forEach(element => {
            element.addEventListener('change', () => this.saveDraft());
        });
    }
    
    /**
     * Initialize date field with auto-occasion detection
     */
    initializeDateField() {
        const dateField = document.getElementById('occasion-date');
        if (dateField) {
            const today = new Date().toISOString().split('T')[0];
            dateField.value = today;
            this.determineOccasion(today);
        }
    }
    
    /**
     * Initialize paper sales inventory table
     */
    initializePaperSalesTable() {
        const tbody = document.getElementById('paper-sales-body');
        if (!tbody) return;

        tbody.innerHTML = '';
        CONFIG.MANUAL_COUNT_ITEMS.forEach(type => {
            const row = tbody.insertRow();
            row.innerHTML = `
                <td>${type.name}</td>
                <td><input type="number" id="${type.id}-start" min="0" data-type="${type.id}"></td>
                <td>${type.hasFree ? `<input type="number" id="${type.id}-free" readonly>` : '-'}</td>
                <td><input type="number" id="${type.id}-end" min="0" data-type="${type.id}"></td>
                <td id="${type.id}-sold">0</td>
            `;

            // Add event listeners for calculations
            row.querySelectorAll('input[type="number"]:not([readonly])').forEach(input => {
                input.addEventListener('input', () => this.calculatePaperSales(type.id));
            });
        });
    }
    
    /**
     * Initialize POS sales table
     */
    initializePOSSalesTable() {
        const tbody = document.getElementById('pos-sales-body');
        if (!tbody) return;

        tbody.innerHTML = '';

        // Group items by category
        const categories = {};
        CONFIG.POS_ITEMS.forEach(item => {
            if (!categories[item.category]) {
                categories[item.category] = [];
            }
            categories[item.category].push(item);
        });

        // Render categories in the order they appear in door sales summary
        const categoryOrder = ['Electronic Bingo', 'Miscellaneous', 'Paper Bingo'];

        categoryOrder.forEach(categoryName => {
            if (categories[categoryName]) {
                // Add category header row
                const headerRow = tbody.insertRow();
                headerRow.classList.add('category-header');
                headerRow.innerHTML = `
                    <td colspan="4" class="category-title"><strong>${categoryName}</strong></td>
                `;

                // Add items in this category
                categories[categoryName].forEach(item => {
                    const row = tbody.insertRow();
                    row.innerHTML = `
                        <td>${item.name}</td>
                        <td>$${item.price.toFixed(2)}</td>
                        <td><input type="number" id="${item.id}-qty" min="0" value="0" data-item="${item.id}"></td>
                        <td id="${item.id}-total">$0.00</td>
                    `;

                    const input = row.querySelector('input');
                    input.addEventListener('input', () => this.calculatePOSSales(item.id, item.price));
                });
            }
        });
    }
    
    /**
     * Determine occasion type based on date (Monday logic)
     */
    determineOccasion(dateString) {
        const date = new Date(dateString);
        if (date.getDay() !== 1) return; // Not Monday
        
        const firstMonday = new Date(date.getFullYear(), date.getMonth(), 1);
        while (firstMonday.getDay() !== 1) {
            firstMonday.setDate(firstMonday.getDate() + 1);
        }
        
        const weekNumber = Math.ceil((date.getDate() - firstMonday.getDate() + 1) / 7) + 1;
        
        let occasion;
        switch(weekNumber) {
            case 1:
            case 5:
                occasion = '5-1';
                break;
            case 2:
                occasion = '6-2';
                break;
            case 3:
                occasion = '7-3';
                break;
            case 4:
                occasion = '8-4';
                break;
            default:
                occasion = '5-1';
        }

        const occasionSelect = document.getElementById('occasion-type');
        if (occasionSelect) {
            occasionSelect.value = occasion;
            this.loadOccasionGames(occasion);
        }
    }
    
    /**
     * Load occasion-specific games from backend
     */
    async loadOccasionGames(occasionType) {
        if (!occasionType) return;

        try {
            const response = await fetch(CONFIG.API_URL + '?path=occasion-games&occasionType=' + occasionType);
            const data = await response.json();

            if (data.success && data.games) {
                this.renderGamesTable(data.games);
            }
        } catch (error) {
            console.error('Error loading occasion games:', error);
            // Use default games if API fails
            this.renderGamesTable(this.getDefaultGames(occasionType));
        }
    }
    
    /**
     * Render games table with occasion data
     */
    renderGamesTable(games) {
        const tbody = document.getElementById('games-body');
        if (!tbody) return;
        
        tbody.innerHTML = '';
        games.forEach(game => {
            const row = tbody.insertRow();
            row.className = game.progressive ? 'progressive-row' : '';
            
            row.innerHTML = `
                <td>${game.num}</td>
                <td>${game.color}</td>
                <td>${game.game}</td>
                <td>$<span class="game-prize">${game.progressive ? '0' : game.prize}</span></td>
                <td><input type="number" class="winner-count" value="1" min="1" data-game="${game.num}"></td>
                <td>$<input type="number" class="prize-per" value="${game.progressive ? '0' : game.prize}" 
                    ${game.progressive ? 'readonly' : ''} data-game="${game.num}"></td>
                <td class="game-total">$${game.progressive ? '0.00' : game.prize + '.00'}</td>
                <td><input type="checkbox" class="check-payment" data-game="${game.num}"></td>
            `;
            
            // Add event listeners
            const winnersInput = row.querySelector('.winner-count');
            const prizeInput = row.querySelector('.prize-per');
            
            winnersInput.addEventListener('input', () => this.calculateGamePrize(game.num));
            if (!game.progressive) {
                prizeInput.addEventListener('input', () => this.calculateGamePrize(game.num));
            }
        });
        
        this.data.games = games;
    }
    
    /**
     * Calculate birthday BOGO promotions
     */
    calculateBirthdayBOGO(birthdays) {
        const count = parseInt(birthdays) || 0;
        
        // Update free counts
        const ebFree = document.getElementById('eb-free');
        const sixFree = document.getElementById('6f-free');
        const birthdayQty = document.getElementById('birthday-qty');
        
        if (ebFree) ebFree.value = count * 2; // 2 Early Birds per birthday
        if (sixFree) sixFree.value = count * 1; // 1 Six Face per birthday  
        if (birthdayQty) birthdayQty.value = count;
        
        this.calculatePaperSales('eb');
        this.calculatePaperSales('6f');
        this.calculatePOSSales('birthday', 0);
    }
    
    /**
     * Calculate paper sales inventory
     */
    calculatePaperSales(typeId) {
        const start = parseInt(document.getElementById(`${typeId}-start`)?.value) || 0;
        const end = parseInt(document.getElementById(`${typeId}-end`)?.value) || 0;
        const free = parseInt(document.getElementById(`${typeId}-free`)?.value) || 0;
        
        const sold = Math.max(0, start - end - free);
        const soldElement = document.getElementById(`${typeId}-sold`);
        if (soldElement) {
            soldElement.textContent = sold;
        }
        
        // Store in data
        this.data.paperBingo[typeId] = { start, end, free, sold };
    }
    
    /**
     * Calculate POS sales items
     */
    calculatePOSSales(itemId, price) {
        const qty = parseInt(document.getElementById(`${itemId}-qty`)?.value) || 0;
        const total = qty * price;
        
        const totalElement = document.getElementById(`${itemId}-total`);
        if (totalElement) {
            totalElement.textContent = `$${total.toFixed(2)}`;
        }
        
        // Store in data
        this.data.posSales[itemId] = { price, quantity: qty, total };
        
        // Update total
        this.calculateTotalPaperSales();
    }
    
    /**
     * Calculate total paper sales revenue
     */
    calculateTotalPaperSales() {
        let total = 0;
        Object.values(this.data.posSales).forEach(item => {
            total += item.total || 0;
        });
        
        const totalElement = document.getElementById('total-paper-sales');
        if (totalElement) {
            totalElement.textContent = `$${total.toFixed(2)}`;
        }
    }
    
    /**
     * Calculate electronic rental sales
     */
    calculateElectronicSales() {
        const small = parseInt(document.getElementById('small-machines')?.value) || 0;
        const large = parseInt(document.getElementById('large-machines')?.value) || 0;
        
        const smallTotal = small * 40;
        const largeTotal = large * 65;
        const total = smallTotal + largeTotal;
        
        this.data.electronic = {
            smallMachines: small,
            largeMachines: large,
            smallTotal,
            largeTotal,
            total
        };
    }
    
    /**
     * Calculate progressive game prize
     */
    calculateProgressivePrize() {
        const jackpot = parseFloat(document.getElementById('prog-jackpot')?.value) || 0;
        const ballsNeeded = parseInt(document.getElementById('prog-balls')?.value) || 0;
        const actualBalls = parseInt(document.getElementById('prog-actual-balls')?.value) || 0;
        const consolation = parseFloat(document.getElementById('prog-consolation')?.value) || 200;
        
        let prize = 0;
        if (actualBalls > 0 && ballsNeeded > 0) {
            prize = actualBalls <= ballsNeeded ? jackpot : consolation;
        }
        
        const prizeField = document.getElementById('prog-prize');
        if (prizeField) {
            prizeField.value = prize;
        }
        
        // Update progressive game in games table
        this.updateProgressiveGame(prize);
    }
    
    /**
     * Update progressive game row in table
     */
    updateProgressiveGame(prize) {
        const progRow = document.querySelector('.progressive-row');
        if (progRow) {
            progRow.querySelector('.game-prize').textContent = prize;
            progRow.querySelector('.prize-per').value = prize;
            progRow.querySelector('.game-total').textContent = `$${prize.toFixed(2)}`;
        }
    }
    
    /**
     * Calculate individual game prizes
     */
    calculateGamePrize(gameNum) {
        const row = document.querySelector(`[data-game="${gameNum}"]`).closest('tr');
        const winners = parseInt(row.querySelector('.winner-count').value) || 1;
        const prizePerWinner = parseFloat(row.querySelector('.prize-per').value) || 0;
        const total = winners * prizePerWinner;
        
        row.querySelector('.game-total').textContent = `$${total.toFixed(2)}`;
        this.calculateTotalBingoPrizes();
    }
    
    /**
     * Calculate total bingo prizes
     */
    calculateTotalBingoPrizes() {
        let total = 0;
        let checkTotal = 0;
        
        document.querySelectorAll('.game-total').forEach(cell => {
            const amount = parseFloat(cell.textContent.replace('$', '')) || 0;
            total += amount;
            
            const checkBox = cell.parentElement.querySelector('.check-payment');
            if (checkBox?.checked) {
                checkTotal += amount;
            }
        });
        
        const totalElement = document.getElementById('total-bingo-prizes');
        if (totalElement) {
            totalElement.textContent = `$${total.toFixed(2)}`;
        }
        
        this.data.financial.bingoPrizesPaid = total;
        this.data.financial.prizesPaidByCheck = checkTotal;
    }
    
    /**
     * Calculate money drawer totals
     */
    calculateMoneyTotals() {
        // Calculate Bingo drawer
        let bingoTotal = 0;
        ['100', '50', '20', '10', '5', '2', '1', 'coins', 'checks'].forEach(denom => {
            const value = parseFloat(document.getElementById(`bingo-${denom}`)?.value) || 0;
            bingoTotal += value;
            this.data.moneyCount.bingo[denom] = value;
        });
        
        const bingoTotalElement = document.getElementById('bingo-total');
        if (bingoTotalElement) {
            bingoTotalElement.textContent = `$${bingoTotal.toFixed(2)}`;
        }
        
        // Calculate Pull-tab drawer
        // Ensure pullTab object exists (handle both 'pullTab' and 'pulltab' casing)
        if (!this.data.moneyCount.pullTab && !this.data.moneyCount.pulltab) {
            this.data.moneyCount.pulltab = {};
        }

        const pullTabData = this.data.moneyCount.pullTab || this.data.moneyCount.pulltab;

        let ptTotal = 0;
        ['100', '50', '20', '10', '5', '2', '1', 'coins'].forEach(denom => {
            const value = parseFloat(document.getElementById(`pt-${denom}`)?.value) || 0;
            ptTotal += value;
            pullTabData[denom] = value;
        });
        
        const ptTotalElement = document.getElementById('pt-total');
        if (ptTotalElement) {
            ptTotalElement.textContent = `$${ptTotal.toFixed(2)}`;
        }
        
        // Calculate deposit summary
        const totalDeposit = bingoTotal + ptTotal;
        const pullTabCoins = (this.data.moneyCount.pullTab?.coins || this.data.moneyCount.pulltab?.coins || 0);
        const currency = totalDeposit - (this.data.moneyCount.bingo.coins || 0) - pullTabCoins;
        const coins = (this.data.moneyCount.bingo.coins || 0) + pullTabCoins;
        const checks = this.data.moneyCount.bingo.checks || 0;
        
        const depositCurrencyElement = document.getElementById('deposit-currency');
        const depositCoinsElement = document.getElementById('deposit-coins');
        const depositChecksElement = document.getElementById('deposit-checks');
        const depositTotalElement = document.getElementById('deposit-total');
        const netDepositElement = document.getElementById('net-deposit');
        
        if (depositCurrencyElement) depositCurrencyElement.textContent = `$${currency.toFixed(2)}`;
        if (depositCoinsElement) depositCoinsElement.textContent = `$${coins.toFixed(2)}`;
        if (depositChecksElement) depositChecksElement.textContent = `$${checks.toFixed(2)}`;
        if (depositTotalElement) depositTotalElement.textContent = `$${totalDeposit.toFixed(2)}`;
        
        const netDeposit = totalDeposit - 1000; // Less startup cash
        if (netDepositElement) netDepositElement.textContent = `$${netDeposit.toFixed(2)}`;
        
        this.data.financial.totalCashDeposit = totalDeposit;
        this.data.financial.actualProfit = netDeposit;

        // Trigger comprehensive financial calculations
        this.calculateComprehensiveFinancials();
    }

    /**
     * Calculate comprehensive financial totals for metrics
     */
    calculateComprehensiveFinancials() {
        // Initialize financial object if not exists
        this.data.financial = this.data.financial || {};

        // Calculate total paper sales
        let totalPaperSales = 0;
        Object.values(this.data.paperBingo || {}).forEach(paper => {
            const sold = paper.sold || 0;
            const price = this.getPaperPrice(paper.type); // Need to implement
            totalPaperSales += sold * price;
        });

        // Calculate POS sales total
        let totalPosSales = 0;
        Object.values(this.data.posSales || {}).forEach(item => {
            totalPosSales += item.total || 0;
        });

        // Electronic sales total
        const electronicSales = (this.data.electronic?.total) || 0;

        // Calculate pull-tab totals
        let pullTabSales = 0;
        let pullTabPrizes = 0;
        let specialEventSales = 0;
        let specialEventPrizes = 0;

        (this.data.pullTabs || []).forEach(pt => {
            if (pt.isSpecial) {
                specialEventSales += pt.tickets || 0;
                specialEventPrizes += pt.prizes || 0;
            } else {
                pullTabSales += pt.tickets || 0;
                pullTabPrizes += pt.prizes || 0;
            }
        });

        // Progressive and regular bingo prizes already calculated in calculateTotalBingoPrizes
        const bingoPrizes = this.data.financial.bingoPrizesPaid || 0;
        const checkPrizes = this.data.financial.prizesPaidByCheck || 0;

        // Calculate gross sales
        const grossSales = totalPaperSales + totalPosSales + electronicSales + pullTabSales + specialEventSales;

        // Calculate total prizes
        const totalPrizes = bingoPrizes + pullTabPrizes + specialEventPrizes;

        // Update financial object with all calculated values
        Object.assign(this.data.financial, {
            totalBingoSales: totalPaperSales + electronicSales,
            totalPosSales: totalPosSales,
            pullTabSales,
            specialEventSales,
            grossSales,
            bingoPrizesPaid: bingoPrizes,
            pullTabPrizesPaid: pullTabPrizes,
            specialEventPrizesPaid: specialEventPrizes,
            totalPrizesPaid: totalPrizes,
            prizesPaidByCheck: checkPrizes,
            // actualProfit and totalCashDeposit are set by calculateMoneyTotals
            idealProfit: grossSales - totalPrizes - 1000, // Less startup cash
            overShort: (this.data.financial.actualProfit || 0) - (grossSales - totalPrizes - 1000)
        });

        // Update metrics display if on review step
        this.updateMetricsDisplay();
    }

    /**
     * Update metrics display elements
     */
    updateMetricsDisplay() {
        const financial = this.data.financial;
        const elements = {
            'metric-gross-sales': financial.grossSales,
            'metric-total-prizes': financial.totalPrizesPaid,
            'metric-actual-profit': financial.actualProfit,
            'metric-ideal-profit': financial.idealProfit,
            'metric-over-short': financial.overShort
        };

        Object.entries(elements).forEach(([id, value]) => {
            const element = document.getElementById(id);
            if (element && typeof value === 'number') {
                element.textContent = `$${value.toFixed(2)}`;
            }
        });
    }

    /**
     * Get paper price by type (helper function)
     */
    getPaperPrice(paperType) {
        const prices = {
            'eb': 10,      // Early Birds
            '6f': 10,      // 6 Face
            '9fs': 15,     // 9 Face Solid
            '9fst': 10,    // 9 Face Stripe
            'p3': 1,       // Progressive 3 Face
            'p18': 5       // Progressive 18 Face
        };
        return prices[paperType] || 0;
    }

    /**
     * Load data via JSONP to avoid CORS issues
     */
    loadViaJSONP(url) {
        return new Promise((resolve, reject) => {
            const callbackName = 'jsonp_callback_' + Math.round(100000 * Math.random());
            const script = document.createElement('script');

            window[callbackName] = function(data) {
                delete window[callbackName];
                document.body.removeChild(script);
                resolve(data);
            };

            script.src = `${url}&callback=${callbackName}&t=${Date.now()}`;
            script.onerror = function() {
                delete window[callbackName];
                if (script.parentNode) {
                    document.body.removeChild(script);
                }
                reject(new Error('JSONP request failed'));
            };

            document.body.appendChild(script);

            setTimeout(() => {
                if (window[callbackName]) {
                    delete window[callbackName];
                    if (script.parentNode) {
                        document.body.removeChild(script);
                    }
                    reject(new Error('Request timeout'));
                }
            }, 30000);
        });
    }

    /**
     * Load pull-tab library from backend or cache
     * Maps JSON data to expected structure
     */
    async loadPullTabLibrary(forceReload = false) {
        try {
            // Use JSONP to avoid CORS issues with Google Apps Script
            const data = await this.loadViaJSONP(CONFIG.API_URL + '?action=getPullTabsLibrary');
            
            if (data.success && data.games) {
                // Store library with proper JSON data mapping
                this.pullTabLibrary = data.games.map(game => {
                    // Handle both array and object formats from backend
                    if (Array.isArray(game)) {
                        return {
                            name: game[0],
                            form: game[1],
                            count: game[2],
                            price: game[3],
                            profit: game[4],
                            url: game[5] || '',
                            identifier: `${game[0]}_${game[1]}`
                        };
                    } else {
                        // Backend returns objects with lowercase properties
                        return {
                            name: game.name,
                            form: game.form,
                            count: game.count || 0,
                            price: game.price || 1,
                            profit: game.idealProfit || 0,
                            url: game.url || '',
                            identifier: `${game.name}_${game.form}`
                        };
                    }
                });
                
                // Store timestamp for cache
                localStorage.setItem('lastLibraryUpdate', new Date().toISOString());
            }
        } catch (error) {
            console.error('Error loading pull-tab library:', error);
            // Use default games if API fails
            this.pullTabLibrary = this.getDefaultPullTabGames();
        }
    }    
    /**
     * Get default pull-tab games if library unavailable
     */
    getDefaultPullTabGames() {
        return [
            {name: 'Beat the Clock 599', form: '7724H', count: 960, price: 1, profit: 361, identifier: 'Beat the Clock 599_7724H'},
            {name: 'Black Jack 175', form: '6916M', count: 250, price: 1, profit: 75, identifier: 'Black Jack 175_6916M'},
            {name: 'Black Jack 200', form: '6779P', count: 300, price: 1, profit: 100, identifier: 'Black Jack 200_6779P'}
        ];
    }
    
    /**
     * Get default games for occasion type
     */
    getDefaultGames(occasionType) {
        // Default games if API fails
        const defaults = {
            '5-1': [
                {num: 1, color: 'Early Bird', game: 'Hard Way Bingo', prize: 100},
                {num: 2, color: 'Blue', game: 'Regular Bingo', prize: 100},
                {num: 3, color: 'Pink', game: 'Letter X', prize: 100},
                {num: 4, color: 'Purple', game: 'Diamond', prize: 100},
                {num: 5, color: 'Yellow', game: 'Picture Frame', prize: 100}
            ],
            '6-2': [
                {num: 1, color: 'Early Bird', game: 'Four Corners', prize: 125},
                {num: 2, color: 'Blue', game: 'Regular Bingo', prize: 125},
                {num: 3, color: 'Pink', game: 'Two Lines', prize: 125},
                {num: 4, color: 'Purple', game: 'Layer Cake', prize: 125},
                {num: 5, color: 'Yellow', game: 'Picture Frame', prize: 125},
                {num: 6, color: 'Red', game: 'Coverall', prize: 125}
            ]
        };
        return defaults[occasionType] || defaults['5-1'];
    }
    
    /**
     * Toggle dark/light theme
     */
    toggleTheme() {
        this.isDarkMode = !this.isDarkMode;
        document.body.classList.toggle('dark-mode');
        
        const themeIcon = document.getElementById('theme-toggle');
        if (themeIcon) {
            themeIcon.innerHTML = this.isDarkMode ? 
                '<span class="theme-icon">☀️</span>' : 
                '<span class="theme-icon">🌙</span>';
        }
        
        localStorage.setItem(CONFIG.STORAGE_KEYS.THEME, this.isDarkMode ? 'dark' : 'light');
    }
    
    /**
     * Open side menu
     */
    openMenu() {
        const sideMenu = document.getElementById('side-menu');
        const overlay = document.getElementById('overlay');
        if (sideMenu) sideMenu.classList.add('active');
        if (overlay) overlay.classList.add('active');
    }
    
    /**
     * Close side menu
     */
    closeMenu() {
        const sideMenu = document.getElementById('side-menu');
        const overlay = document.getElementById('overlay');
        if (sideMenu) sideMenu.classList.remove('active');
        if (overlay) overlay.classList.remove('active');
    }
    
    /**
     * Setup connection monitoring for online/offline detection
     */
    setupConnectionMonitoring() {
        window.addEventListener('online', () => {
            this.isOnline = true;
            const statusIndicator = document.getElementById('status-indicator');
            const statusText = document.getElementById('status-text');
            if (statusIndicator) statusIndicator.className = 'status-online';
            if (statusText) statusText.textContent = 'Online';
            this.processSyncQueue();
        });
        
        window.addEventListener('offline', () => {
            this.isOnline = false;
            const statusIndicator = document.getElementById('status-indicator');
            const statusText = document.getElementById('status-text');
            if (statusIndicator) statusIndicator.className = 'status-offline';
            if (statusText) statusText.textContent = 'Offline';
        });
    }
    
    /**
     * Save draft data to local storage
     */
    saveDraft() {
        try {
            localStorage.setItem(CONFIG.STORAGE_KEYS.DRAFT_DATA, JSON.stringify(this.data));
            console.log('Draft saved successfully to localStorage');

            // Show user feedback
            if (window.showToast) {
                window.showToast('Draft saved successfully', 'success');
            } else {
                // Fallback notification
                const notification = document.createElement('div');
                notification.textContent = 'Draft saved!';
                notification.style.cssText = `
                    position: fixed; top: 20px; right: 20px; z-index: 10000;
                    background: #4CAF50; color: white; padding: 12px 20px;
                    border-radius: 4px; font-family: Arial, sans-serif;
                    font-size: 14px; box-shadow: 0 2px 8px rgba(0,0,0,0.3);
                `;
                document.body.appendChild(notification);
                setTimeout(() => {
                    if (notification.parentNode) {
                        notification.parentNode.removeChild(notification);
                    }
                }, 3000);
            }
            return true;
        } catch (error) {
            console.error('Error saving draft:', error);

            // Show error feedback
            if (window.showToast) {
                window.showToast('Error saving draft: ' + error.message, 'error');
            } else {
                alert('Error saving draft: ' + error.message);
            }
            return false;
        }
    }
    
    /**
     * Load draft data from local storage
     */
    loadDraft() {
        const draft = localStorage.getItem(CONFIG.STORAGE_KEYS.DRAFT_DATA);
        if (draft) {
            this.data = JSON.parse(draft);
            // Populate form fields with draft data
            this.populateFormFromData();
        }
    }
    
    /**
     * Populate form fields from saved data
     */
    populateFormFromData() {
        // Populate occasion fields
        if (this.data.occasion.date) {
            const occasionDate = document.getElementById('occasion-date');
            if (occasionDate) occasionDate.value = this.data.occasion.date;
        }
        if (this.data.occasion.sessionType) {
            const sessionType = document.getElementById('session-type');
            if (sessionType) sessionType.value = this.data.occasion.sessionType;
        }
        // Add more field population logic as needed
    }
    
    /**
     * Process sync queue when online
     */
    async processSyncQueue() {
        if (!this.isOnline) return;
        
        const queue = localStorage.getItem(CONFIG.STORAGE_KEYS.SYNC_QUEUE);
        if (!queue) return;
        
        const items = JSON.parse(queue);
        const failed = [];
        
        for (const item of items) {
            try {
                const response = await fetch(CONFIG.API_URL, {
                    method: 'POST',
                    body: new URLSearchParams({
                        action: item.action,
                        data: JSON.stringify(item.data)
                    })
                });
                
                if (!response.ok) {
                    failed.push(item);
                }
            } catch (error) {
                failed.push(item);
            }
        }
        
        if (failed.length > 0) {
            localStorage.setItem(CONFIG.STORAGE_KEYS.SYNC_QUEUE, JSON.stringify(failed));
        } else {
            localStorage.removeItem(CONFIG.STORAGE_KEYS.SYNC_QUEUE);
        }
    }
}

// CRITICAL: Expose class to global scope AFTER definition
window.BingoApp = BingoApp;

// Create and expose the global app instance
window.app = new BingoApp();

// Merge with any temporary data from occasion.html
if (window.tempAppData) {
    Object.assign(window.app, window.tempAppData);
    // Ensure the saveDraft method from the class is preserved
    const classSaveDraft = window.app.saveDraft.bind(window.app);
    window.app.saveDraft = classSaveDraft;
    // Clean up temporary data
    delete window.tempAppData;
}

// Global utility functions for pull-tab management
window.populatePullTabDropdowns = function() {
    const dropdowns = document.querySelectorAll('.pulltab-select');
    
    dropdowns.forEach(select => {
        // Clear existing options except the first
        while (select.options.length > 1) {
            select.remove(1);
        }
        
        // Add library games
        window.app.pullTabLibrary.forEach(game => {
            const option = document.createElement('option');
            option.value = game.identifier;
            option.textContent = `${game.name} (${game.form})`;
            option.dataset.tickets = game.count;
            option.dataset.price = game.price;
            option.dataset.profit = game.idealProfit;
            select.appendChild(option);
        });
    });
};

window.handlePullTabSelection = function(selectElement) {
    const selectedValue = selectElement.value;
    if (!selectedValue || selectedValue === 'No Game') return;
    
    const row = selectElement.closest('tr');
    const game = window.app.pullTabLibrary.find(g => g.identifier === selectedValue);
    
    if (game && row) {
        // Auto-populate fields
        const ticketsCell = row.querySelector('.tickets-cell');
        const pricesCell = row.querySelector('.prices-cell');
        const ticketsSoldCell = row.querySelector('.tickets-sold-cell');
        const prizesPaidCell = row.querySelector('.prizes-cell');
        const profitCell = row.querySelector('.profit-cell');
        const idealProfitCell = row.querySelector('.ideal-profit-cell');
        
        // Set values
        if (ticketsCell) ticketsCell.textContent = game.count;
        if (pricesCell) pricesCell.textContent = `$${game.price}`;
        
        // Calculate ideal values
        const idealSales = game.count * game.price;
        const idealPrizes = idealSales - game.idealProfit;
        
        if (ticketsSoldCell) ticketsSoldCell.textContent = `$${idealSales.toFixed(2)}`;
        if (prizesPaidCell) prizesPaidCell.textContent = `$${idealPrizes.toFixed(2)}`;
        if (profitCell) profitCell.textContent = `$${game.idealProfit.toFixed(2)}`;
        if (idealProfitCell) idealProfitCell.textContent = `$${game.idealProfit.toFixed(2)}`;
        
        // Trigger totals calculation if function exists
        if (typeof window.calculatePullTabTotals === 'function') {
            window.calculatePullTabTotals();
        }
    }
};

window.deletePullTabRow = function(button) {
    const row = button.closest('tr');
    if (row && confirm('Delete this pull-tab game?')) {
        row.remove();
        if (typeof window.calculatePullTabTotals === 'function') {
            window.calculatePullTabTotals();
        }
    }
};

// Global functions for onclick handlers - Browser compatible
window.closeMenu = function() {
    window.app?.closeMenu();
};

window.showOccasions = function() {
    window.app?.showOccasions();
};

window.showReports = function() {
    window.app?.showReports();
};

window.showPullTabLibrary = function() {
    window.app?.showPullTabLibrary();
};

window.showAdmin = function() {
    window.app?.showAdmin();
};

window.showHelp = function() {
    window.app?.showHelp();
};

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded, BingoApp available:', typeof window.BingoApp);
    console.log('App instance available:', typeof window.app);
    
    // Set up pull-tab dropdown handlers
    document.addEventListener('change', function(e) {
        if (e.target.classList.contains('pulltab-select')) {
            window.handlePullTabSelection(e.target);
        }
    });
});

// Final validation and debugging
console.log('app.js loaded successfully');
console.log('BingoApp class available:', typeof window.BingoApp);
console.log('App instance created:', typeof window.app);
