/**
 * API Service Module
 * Handles all JSONP and API communication with Google Apps Script backend
 */
class ApiService {
    constructor(adminInterface) {
        this.adminInterface = adminInterface;
    }


    /**
     * Load occasions with JSONP
     */
    loadOccasionsJSONP(scriptUrl) {
        return new Promise((resolve, reject) => {
            const callbackName = 'jsonp_callback_' + Math.round(100000 * Math.random());
            const script = document.createElement('script');

            // Set up the callback function
            window[callbackName] = function(data) {
                // Hide loading spinner
                if (window.hideLoading) {
                    window.hideLoading();
                }

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
                if (script.parentNode) {
                    if (script.parentNode) {
                        document.body.removeChild(script);
                    }
                }
                reject(new Error('JSONP request failed'));
            };

            document.body.appendChild(script);

            // Timeout after 30 seconds for initial load
            setTimeout(() => {
                if (window[callbackName]) {
                    delete window[callbackName];
                    if (script.parentNode) {
                        if (script.parentNode) {
                        document.body.removeChild(script);
                    }
                    }
                    reject(new Error('Request timeout - server may be slow'));
                }
            }, 30000);
        });
    }

    /**
     * Load real data from API and process it
     */
    async loadRealData() {
        const result = await this.loadOccasionsJSONP(CONFIG.API_URL);

        console.log('API Response:', result); // Debug logging

        if (result.success && result.occasions && Array.isArray(result.occasions)) {
            // Convert API data to admin interface format with correct field mapping
            this.adminInterface.occasions = result.occasions.map(occasion => {
                console.log('Processing occasion:', occasion); // Debug logging

                // Clean and validate the occasion ID - handle both object formats
                const occasionId = occasion.id || occasion['Occasion ID'];
                if (!occasionId || typeof occasionId !== 'string') {
                    console.warn('Invalid occasion ID:', occasionId);
                    return null; // Skip invalid records
                }

                // Get session type with robust property access
                const sessionTypeValue = this.adminInterface.cleanString(
                    occasion.sessionType ||
                    occasion['Session Type'] ||
                    occasion['sessionType']
                ) || 'Unknown';

                // Convert session type: if it's already a key (like "5-1"), keep it
                // If it's a full name (like "1st/5th Monday"), convert to key
                let sessionTypeKey = sessionTypeValue;
                if (CONFIG.SESSION_TYPES && CONFIG.SESSION_TYPES[sessionTypeValue]) {
                    // It's already a key like "5-1"
                    sessionTypeKey = sessionTypeValue;
                } else {
                    // It's a full name like "1st/5th Monday", find the key
                    sessionTypeKey = Object.keys(CONFIG.SESSION_TYPES || {}).find(key =>
                        (CONFIG.SESSION_TYPES[key] || '') === sessionTypeValue
                    ) || sessionTypeValue;
                }

                // Get lion in charge with robust property access
                const lionInCharge = this.adminInterface.cleanString(
                    occasion.lionInCharge ||
                    occasion['Lion in Charge'] ||
                    occasion['lionInCharge']
                ) || 'N/A';

                // Get date with robust property access
                const dateValue = occasion.date || occasion['Date'] || occasion['date'];
                const validatedDate = this.adminInterface.validateDate(dateValue) || new Date().toISOString().split('T')[0];

                // Get status with robust property access
                const statusValue = this.adminInterface.cleanString(
                    occasion.status ||
                    occasion['Status'] ||
                    occasion['status']
                ) || 'Draft';

                return {
                    id: occasionId,
                    date: validatedDate,
                    sessionType: sessionTypeKey,
                    lionInCharge: lionInCharge,
                    totalPlayers: parseInt(
                        occasion.totalPlayers ||
                        occasion['Total Players'] ||
                        occasion['totalPlayers']
                    ) || 0,
                    // For now, use 0 for revenue/profit until we have those fields calculated
                    totalRevenue: 0,
                    netProfit: 0,
                    status: statusValue,
                    // Store additional fields for reference
                    progressive: {
                        jackpot: parseFloat(occasion['Progressive Jackpot']) || 0,
                        balls: parseInt(occasion['Progressive Balls']) || 0,
                        consolation: parseFloat(occasion['Progressive Consolation']) || 0,
                        actual: parseFloat(occasion['Progressive Actual']) || 0,
                        prize: parseFloat(occasion['Progressive Prize']) || 0
                    }
                };
            }).filter(occasion => occasion !== null); // Remove null records

            // Update dashboard with loaded data
            if (this.adminInterface.dashboard) {
                this.adminInterface.dashboard.updateDashboardStats();
            }
        } else {
            console.warn('Invalid API response:', result);
            throw new Error('No occasions data received from server');
        }
    }

    /**
     * Load pull-tab library
     */
    async loadPullTabLibrary() {
        // Show loading spinner
        if (window.showLoading) {
            window.showLoading({
                text: 'Loading Pull-Tab Library',
                subtext: 'Fetching games from Google Drive...',
                timeout: 15000
            });
        }

        try {
            // Use working JSONP approach (same as loadOccasionsJSONP)
            const result = await new Promise((resolve, reject) => {
                const callbackName = 'jsonp_callback_' + Math.round(100000 * Math.random());
                const script = document.createElement('script');

                // Set up the callback function
                window[callbackName] = function(data) {
                    delete window[callbackName];
                    document.body.removeChild(script);
                    resolve(data);
                };

                // Create the script tag
                script.src = `${CONFIG.API_URL}?action=getPullTabsLibrary&callback=${callbackName}&t=${Date.now()}`;
                script.onerror = function() {
                    delete window[callbackName];
                    if (script.parentNode) {
                        document.body.removeChild(script);
                    }
                    reject(new Error('JSONP request failed'));
                };

                document.body.appendChild(script);

                // Timeout after 30 seconds
                setTimeout(() => {
                    if (window[callbackName]) {
                        delete window[callbackName];
                        if (script.parentNode) {
                            document.body.removeChild(script);
                        }
                        reject(new Error('Request timeout - server may be slow'));
                    }
                }, 30000);
            });

            console.log('Pull-tab library API response:', result);

            // Check for backend API action support
            if (!result || !result.success) {
                if (result && result.error && result.error.includes('Unknown GET action: getPullTabsLibrary')) {
                    throw new Error('Google Apps Script backend does not support getPullTabsLibrary action. Backend deployment needs to be updated with pull-tab library support.');
                }
                throw new Error(result?.message || result?.error || 'API request failed - no success flag');
            }

            let games = null;
            if (result.data && result.data.games && Array.isArray(result.data.games)) {
                games = result.data.games;
            } else if (result.data && Array.isArray(result.data)) {
                games = result.data;
            } else if (Array.isArray(result.games)) {
                games = result.games;
            } else if (Array.isArray(result.pullTabs)) {
                games = result.pullTabs;
            } else {
                throw new Error('Invalid response structure - expected array of pull-tab games from Google Drive');
            }

            if (!games || games.length === 0) {
                throw new Error('No pull-tab games found in Google Drive');
            }

            console.log(`Pull-tab library loaded from Google Drive: ${games.length} games`);
            this.adminInterface.pullTabLibrary = games;

            if (this.adminInterface.uiComponents) {
                this.adminInterface.uiComponents.renderPullTabTable(games);
            } else {
                throw new Error('UI Components not available for pull-tab table rendering');
            }
        } catch (error) {
            console.error('Pull-tab library failed to load from Google Drive:', error);
            this.showPullTabError(`Failed to load pull-tab library from Google Drive: ${error.message}`);
        } finally {
            // Hide loading spinner
            if (window.hideLoading) {
                window.hideLoading();
            }
        }
    }

    /**
     * Load session games using JSONP from backend
     */
    async loadSessionGames() {
        // Show loading spinner
        if (window.showLoading) {
            window.showLoading({
                text: 'Loading Session Games',
                subtext: 'Fetching session games from Google Apps Script...',
                timeout: 15000
            });
        }

        try {
            // Use working JSONP approach (same as loadOccasionsJSONP)
            const result = await new Promise((resolve, reject) => {
                const callbackName = 'jsonp_callback_' + Math.round(100000 * Math.random());
                const script = document.createElement('script');

                // Set up the callback function
                window[callbackName] = function(data) {
                    delete window[callbackName];
                    document.body.removeChild(script);
                    resolve(data);
                };

                // Create the script tag
                script.src = `${CONFIG.API_URL}?action=getSessionGames&callback=${callbackName}&t=${Date.now()}`;
                script.onerror = function() {
                    delete window[callbackName];
                    if (script.parentNode) {
                        document.body.removeChild(script);
                    }
                    reject(new Error('JSONP request failed'));
                };

                document.body.appendChild(script);

                // Timeout after 30 seconds
                setTimeout(() => {
                    if (window[callbackName]) {
                        delete window[callbackName];
                        if (script.parentNode) {
                            document.body.removeChild(script);
                        }
                        reject(new Error('Request timeout - server may be slow'));
                    }
                }, 30000);
            });

            console.log('Session games API response:', result);

            // Check for backend API action support
            if (!result || !result.success) {
                if (result && result.error && result.error.includes('Unknown GET action: getSessionGames')) {
                    throw new Error('Google Apps Script backend does not support getSessionGames action. Backend deployment needs to be updated with session games support.');
                }
                throw new Error(result?.message || result?.error || 'API request failed - no success flag');
            }

            let sessionGamesData = null;
            if (result.data && (result.data.sessionTypes || result.data.metadata)) {
                sessionGamesData = result.data;
            } else if (result.sessionTypes || result.metadata) {
                sessionGamesData = result;
            } else {
                throw new Error('Invalid response structure - expected session games data from Google Drive');
            }

            if (!sessionGamesData || !sessionGamesData.sessionTypes) {
                throw new Error('No session games data found in Google Drive');
            }

            console.log('Session games loaded from Google Drive:', sessionGamesData);
            this.adminInterface.sessionGames = sessionGamesData;

            if (this.adminInterface.uiComponents) {
                this.adminInterface.uiComponents.renderSessionGamesView(sessionGamesData);
            } else {
                throw new Error('UI Components not available for session games rendering');
            }
        } catch (error) {
            console.error('Session games failed to load from Google Drive:', error);
            this.showSessionGamesError(`Failed to load session games from Google Drive: ${error.message}`);
        } finally {
            // Hide loading spinner
            if (window.hideLoading) {
                window.hideLoading();
            }
        }
    }

    /**
     * Load occasions table
     */
    async loadOccasionsTable() {
        // Show loading spinner
        if (window.showLoading) {
            window.showLoading({
                text: 'Loading Occasions',
                subtext: 'Fetching occasions from Google Drive...',
                timeout: 15000
            });
        }

        try {
            const result = await this.loadOccasionsJSONP(CONFIG.API_URL);

            if (result.success && result.occasions && Array.isArray(result.occasions)) {
                if (this.adminInterface.uiComponents) {
                    this.adminInterface.uiComponents.renderOccasionsTable(result.occasions);
                }
            } else {
                console.warn('Invalid occasions response:', result);
                this.showOccasionsError('Invalid response from server. No occasions data available.');
            }
        } catch (error) {
            console.error('Error loading occasions table:', error);
            this.showOccasionsError(error.message || 'Unable to load occasions from Google Drive');
        } finally {
            // Hide loading spinner
            if (window.hideLoading) {
                window.hideLoading();
            }
        }
    }

    // Error display methods
    showPullTabError(message) {
        const libraryView = document.getElementById('library-view');
        if (libraryView) {
            libraryView.innerHTML = `
                <div class="card">
                    <div class="alert error">
                        <h3>⚠️ Error Loading Pull-Tab Library</h3>
                        <p>${message}</p>
                        <button class="btn" onclick="window.adminInterface.apiService.clearPullTabErrorAndRetry()">
                            🔄 Clear Error & Retry
                        </button>
                    </div>
                </div>
            `;
        }
    }

    showSessionGamesError(message) {
        const sessionGamesView = document.getElementById('session-games-view');
        if (sessionGamesView) {
            sessionGamesView.innerHTML = `
                <div class="card">
                    <div class="alert error">
                        <h3>⚠️ Error Loading Session Games</h3>
                        <p>${message}</p>
                        <button class="btn" onclick="window.adminInterface.apiService.clearSessionGamesErrorAndRetry()">
                            🔄 Clear Error & Retry
                        </button>
                    </div>
                </div>
            `;
        }
    }

    showOccasionsError(message) {
        const occasionsView = document.getElementById('occasions-view');
        if (occasionsView) {
            occasionsView.innerHTML = `
                <div class="card">
                    <div class="alert error">
                        <h3>⚠️ Error Loading Occasions</h3>
                        <p>${message}</p>
                        <button class="btn" onclick="window.adminInterface.apiService.loadOccasionsTable()">
                            🔄 Retry Loading
                        </button>
                    </div>
                </div>
            `;
        }
    }

    // Error recovery methods
    clearPullTabErrorAndRetry() {
        const libraryView = document.getElementById('library-view');
        if (libraryView) {
            libraryView.innerHTML = '<div class="card"><p>Loading...</p></div>';
        }
        setTimeout(() => this.loadPullTabLibrary(), 500);
    }


    clearSessionGamesErrorAndRetry() {
        const sessionGamesView = document.getElementById('session-games-view');
        if (sessionGamesView) {
            sessionGamesView.innerHTML = '<div class="card"><p>Loading...</p></div>';
        }
        setTimeout(() => this.loadSessionGames(), 500);
    }

}

// Make ApiService globally available
window.ApiService = ApiService;