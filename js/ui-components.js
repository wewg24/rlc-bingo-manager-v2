/**
 * UI Components Module
 * Handles table rendering, forms, modals, and UI interactions
 */
class UIComponents {
    constructor(adminInterface) {
        this.adminInterface = adminInterface;
    }

    /**
     * Render Pull-Tab Library Table with New Schema Support
     */
    renderPullTabTable(games) {
        const libraryView = document.getElementById('library-view');
        if (!libraryView || !games || !Array.isArray(games)) return;

        const tableHtml = `
            <div class="card">
                <div class="d-flex justify-content-between align-items-center mb-3">
                    <h3>Pull-Tab Library (${games.length} Games)</h3>
                    <div class="d-flex gap-2">
                        <input type="text" id="pull-tab-search" placeholder="Search games..." class="form-control" style="width: 200px;">
                        <button class="btn success" onclick="window.adminInterface.uiComponents.showAddPullTabModal()">Add New Game</button>
                    </div>
                </div>
                <div class="table-container">
                    <table class="table" id="pull-tab-library-table">
                        <thead>
                            <tr>
                                <th>Game Name</th>
                                <th>Price</th>
                                <th>Count</th>
                                <th>Ideal Profit</th>
                                <th>Profit %</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${games.map(game => this.renderPullTabRow(game)).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        `;

        libraryView.innerHTML = tableHtml;

        // Initialize search functionality
        this.initializePullTabSearch();
    }

    renderPullTabRow(game) {
        const price = parseFloat(game.price) || 0;
        const count = parseInt(game.count) || 0;
        const idealProfit = parseFloat(game.idealProfit) || 0;
        const totalSales = price * count;
        const profitPercentage = totalSales > 0 ? Math.round((idealProfit / totalSales) * 100) : 0;

        return `
            <tr data-game-name="${game.name || ''}">
                <td>
                    <strong>${game.name || 'Unknown'}</strong>
                    ${game.url ? `<br><a href="${game.url}" target="_blank" class="text-small">📄 View Details</a>` : ''}
                </td>
                <td>$${price.toFixed(2)}</td>
                <td>${count.toLocaleString()}</td>
                <td>$${idealProfit.toFixed(2)}</td>
                <td>${profitPercentage}%</td>
                <td>
                    <select class="form-control status-select" data-game-name="${game.name}" onchange="window.adminInterface.uiComponents.updatePullTabStatus(this)">
                        <option value="active" ${game.status === 'active' ? 'selected' : ''}>Active</option>
                        <option value="discontinued" ${game.status === 'discontinued' ? 'selected' : ''}>Discontinued</option>
                        <option value="seasonal" ${game.status === 'seasonal' ? 'selected' : ''}>Seasonal</option>
                    </select>
                </td>
                <td>
                    <div class="btn-group">
                        <button class="btn btn-sm" onclick="window.adminInterface.uiComponents.viewPullTabDetails('${game.name}')">View</button>
                        <button class="btn btn-sm warning" onclick="window.adminInterface.uiComponents.editPullTab('${game.name}')">Edit</button>
                        <button class="btn btn-sm danger" onclick="window.adminInterface.uiComponents.deletePullTab('${game.name}')">Delete</button>
                    </div>
                </td>
            </tr>
        `;
    }

    /**
     * Render Session Games View with New Schema
     */
    renderSessionGamesView(sessionData) {
        const sessionGamesView = document.getElementById('session-games-view');
        if (!sessionGamesView || !sessionData) return;

        const metadata = sessionData.metadata || {};
        const sessionTypes = sessionData.sessionTypes || {};

        let contentHtml = `
            <div class="card">
                <div class="d-flex justify-content-between align-items-center mb-3">
                    <h3>Session Games Management</h3>
                    <div class="d-flex gap-2 align-items-center">
                        <button class="btn success" onclick="window.adminInterface.uiComponents.showAddSessionModal()">
                            ➕ Add Session Type
                        </button>
                        <span class="badge badge-info">${metadata.organization || 'Rolla Lions Club'}</span>
                        <span class="badge badge-secondary">Last Updated: ${metadata.lastUpdated || 'Unknown'}</span>
                    </div>
                </div>

                <div class="session-metadata mb-4">
                    <div class="row">
                        <div class="col-md-6">
                            <p><strong>Venue:</strong> ${metadata.venue || 'N/A'}</p>
                            <p><strong>Schedule:</strong> ${metadata.schedule || 'N/A'}</p>
                        </div>
                        <div class="col-md-6">
                            <p><strong>Minimum Age:</strong> ${metadata.minimumAge || 'N/A'}</p>
                            <p><strong>Event Games Start:</strong> ${metadata.eventGamesStart || 'N/A'}</p>
                        </div>
                    </div>
                    ${metadata.prizePayoutDisclaimer ? `<div class="alert alert-info"><small>${metadata.prizePayoutDisclaimer}</small></div>` : ''}
                </div>
        `;

        // Render each session type
        for (const [sessionId, sessionInfo] of Object.entries(sessionTypes)) {
            contentHtml += this.renderSessionTypeView(sessionId, sessionInfo);
        }

        contentHtml += `</div>`;

        sessionGamesView.innerHTML = contentHtml;
    }

    renderSessionTypeView(sessionId, sessionInfo) {
        // Use the flat games array from the new schema
        const games = sessionInfo.games || [];

        // Sort games by order/gameNumber
        games.sort((a, b) => (a.order || a.gameNumber || 0) - (b.order || b.gameNumber || 0));

        const totalPrizeValue = games.reduce((sum, game) => {
            const payout = typeof game.payout === 'number' ? game.payout : 0;
            return sum + payout;
        }, 0);

        return `
            <div class="session-card card mb-4">
                <div class="card-header d-flex justify-content-between align-items-center">
                    <div>
                        <h4>${sessionInfo.sessionName || sessionId} (${sessionId})</h4>
                        <small class="text-muted">${sessionInfo.description || 'No description'}</small>
                    </div>
                    <div class="d-flex gap-2 align-items-center">
                        <div class="session-stats d-flex gap-2">
                            <span class="badge badge-primary">${games.length} Games</span>
                            <span class="badge badge-success">$${totalPrizeValue.toLocaleString()} Total Prizes</span>
                        </div>
                        <div class="btn-group">
                            <button class="btn btn-sm" onclick="window.adminInterface.uiComponents.addGameToSession('${sessionId}')">
                                ➕ Add Game
                            </button>
                            <button class="btn btn-sm warning" onclick="window.adminInterface.uiComponents.editSession('${sessionId}')">
                                ✏️ Edit Session
                            </button>
                            <button class="btn btn-sm danger" onclick="window.adminInterface.uiComponents.deleteSession('${sessionId}')">
                                🗑️ Delete Session
                            </button>
                        </div>
                    </div>
                </div>
                <div class="card-body">
                    <div class="table-container">
                        <table class="table table-sm">
                            <thead>
                                <tr>
                                    <th>#</th>
                                    <th>Game Name</th>
                                    <th>Color</th>
                                    <th>Category</th>
                                    <th>Timing</th>
                                    <th>Payout</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${games.map(game => this.renderSessionGameRow(sessionId, game)).join('')}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        `;
    }

    renderSessionGameRow(sessionId, game) {
        const gameNumber = game.gameNumber || game.order || '?';
        const gameName = game.name || 'Unknown Game';
        const gameColor = game.color || 'N/A';
        const category = game.category || 'Regular';
        const timing = game.timing || 'Unknown';
        const payout = typeof game.payout === 'number' ? `$${game.payout}` : (game.payout || 'Variable');

        // Color-coded background for game colors
        const colorStyle = gameColor !== 'N/A' ? `background-color: ${gameColor.toLowerCase()}; color: ${this.getContrastColor(gameColor)};` : '';

        return `
            <tr data-session="${sessionId}" data-game="${gameNumber}">
                <td><strong>${gameNumber}</strong></td>
                <td>${gameName}</td>
                <td><span class="color-badge" style="${colorStyle} padding: 2px 8px; border-radius: 4px; font-size: 12px;">${gameColor}</span></td>
                <td><span class="badge badge-outline-secondary">${category}</span></td>
                <td><small>${timing}</small></td>
                <td><strong>${payout}</strong></td>
                <td>
                    <div class="btn-group">
                        <button class="btn btn-sm" onclick="window.adminInterface.uiComponents.viewSessionGameDetails('${sessionId}', ${gameNumber})">View</button>
                        <button class="btn btn-sm warning" onclick="window.adminInterface.uiComponents.editSessionGame('${sessionId}', ${gameNumber})">Edit</button>
                    </div>
                </td>
            </tr>
        `;
    }

    /**
     * Render Occasions Table
     */
    renderOccasionsTable(occasions) {
        const occasionsView = document.getElementById('occasions-view');
        if (!occasionsView || !occasions || !Array.isArray(occasions)) return;

        const tableHtml = `
            <div class="card">
                <div class="d-flex justify-content-between align-items-center mb-3">
                    <h3>Occasions (${occasions.length} total)</h3>
                    <div class="d-flex gap-2">
                        <a href="./occasion.html" class="btn success" target="_blank">Create New Occasion</a>
                    </div>
                </div>
                <div class="table-container">
                    <table class="table">
                        <thead>
                            <tr>
                                <th>Date</th>
                                <th>Session</th>
                                <th>Closet</th>
                                <th>Pull-Tabs</th>
                                <th>Players</th>
                                <th>Profit</th>
                                <th>Offage</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${occasions.map(occasion => this.renderOccasionRow(occasion)).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        `;

        occasionsView.innerHTML = tableHtml;
    }

    renderOccasionRow(occasion) {
        // Backend index stores: {id, date, session, occasion: {...}, financial: {...}, status}
        const occasionData = occasion.occasion || {};
        const financial = occasion.financial || {};

        // Date
        const formattedDate = new Date(occasion.date).toLocaleDateString();

        // Session (convert code to name)
        const sessionType = occasion.session || 'Unknown';
        const sessionTypeName = CONFIG.SESSION_TYPES?.[sessionType] || sessionType;

        // Closet (Lion in Charge)
        const closetWorker = occasionData.lionInCharge || 'N/A';

        // Pull-Tabs (Lion in Charge of Pull-Tabs)
        const pullTabWorker = occasionData.lionPullTabs || 'N/A';

        // Players
        const players = occasionData.totalPlayers || 0;

        // Profit (Net Profit)
        const profit = financial.totalNetProfit || 0;

        // Offage (Over/Short)
        const offage = financial.totalOverShort || 0;

        // Status
        const status = occasion.status || 'draft';

        return `
            <tr>
                <td><strong>${formattedDate}</strong></td>
                <td>${sessionTypeName}</td>
                <td>${closetWorker}</td>
                <td>${pullTabWorker}</td>
                <td>${players}</td>
                <td>$${profit.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
                <td style="color: ${offage >= 0 ? 'green' : 'red'};">$${offage.toFixed(2)}</td>
                <td><span class="status ${status.toLowerCase()}">${status}</span></td>
                <td>
                    <div class="btn-group">
                        <button class="btn btn-sm" onclick="window.adminInterface.uiComponents.viewOccasion('${occasion.id}')">View</button>
                        <button class="btn btn-sm warning" onclick="window.adminInterface.uiComponents.editOccasion('${occasion.id}')">Edit</button>
                        <button class="btn btn-sm danger" onclick="window.adminInterface.uiComponents.deleteOccasion('${occasion.id}')">Delete</button>
                    </div>
                </td>
            </tr>
        `;
    }

    // Utility Methods
    initializePullTabSearch() {
        const searchInput = document.getElementById('pull-tab-search');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.filterPullTabTable(e.target.value);
            });
        }
    }

    filterPullTabTable(searchTerm) {
        const table = document.getElementById('pull-tab-library-table');
        if (!table) return;

        const rows = table.querySelectorAll('tbody tr');
        const lowerSearchTerm = searchTerm.toLowerCase();

        rows.forEach(row => {
            const gameName = row.querySelector('td strong')?.textContent.toLowerCase() || '';
            if (gameName.includes(lowerSearchTerm)) {
                row.style.display = '';
            } else {
                row.style.display = 'none';
            }
        });
    }

    getContrastColor(colorName) {
        // Simple contrast calculator for readability
        const darkColors = ['black', 'navy', 'brown', 'purple', 'olive'];
        return darkColors.includes(colorName.toLowerCase()) ? 'white' : 'black';
    }

    updatePullTabStatus(selectElement) {
        const gameName = selectElement.dataset.gameName;
        const newStatus = selectElement.value;
        console.log(`Updating ${gameName} status to ${newStatus}`);
        // This would trigger a save operation through the CRUD module
        if (this.adminInterface.crudOperations) {
            this.adminInterface.crudOperations.updatePullTabStatus(gameName, newStatus);
        }
    }

    // Modal and Detail View Methods (placeholders for now)
    showAddPullTabModal() {
        console.log('Show add pull-tab modal');
        if (this.adminInterface.crudOperations) {
            this.adminInterface.crudOperations.showAddPullTabModal();
        } else {
            console.error('CRUD Operations module not available');
            this.adminInterface.utilities.showAlert('CRUD Operations not available', 'error');
        }
    }

    viewPullTabDetails(gameName) {
        console.log('View pull-tab details:', gameName);
        if (this.adminInterface.crudOperations) {
            this.adminInterface.crudOperations.viewPullTabDetails(gameName);
        } else {
            console.error('CRUD Operations module not available');
            this.adminInterface.utilities.showAlert('CRUD Operations not available', 'error');
        }
    }

    editPullTab(gameName) {
        console.log('Edit pull-tab:', gameName);
        if (this.adminInterface.crudOperations) {
            this.adminInterface.crudOperations.editPullTab(gameName);
        } else {
            console.error('CRUD Operations module not available');
            this.adminInterface.utilities.showAlert('CRUD Operations not available', 'error');
        }
    }

    deletePullTab(gameName) {
        console.log('Delete pull-tab:', gameName);
        if (this.adminInterface.crudOperations) {
            this.adminInterface.crudOperations.deletePullTabGame(gameName);
        } else {
            console.error('CRUD Operations module not available');
            this.adminInterface.utilities.showAlert('CRUD Operations not available', 'error');
        }
    }

    viewSessionGameDetails(sessionId, gameNumber) {
        console.log('View session game details:', sessionId, gameNumber);

        // Find the session game data from the correct structure
        const sessionGamesData = this.adminInterface.sessionGames || {};
        const sessionTypes = sessionGamesData.sessionTypes || {};
        const sessionData = sessionTypes[sessionId];

        if (sessionData && sessionData.games) {
            const game = sessionData.games.find(g => g.gameNumber === parseInt(gameNumber));
            if (game) {
                // Add session context to game data
                const gameWithContext = {
                    ...game,
                    sessionId: sessionId,
                    sessionName: sessionData.sessionName
                };
                this.showSessionGameModal(gameWithContext, 'view');
            } else {
                this.adminInterface.utilities.showAlert('Game not found in session', 'error');
            }
        } else {
            this.adminInterface.utilities.showAlert('Session not found', 'error');
        }
    }

    editSessionGame(sessionId, gameNumber) {
        console.log('Edit session game:', sessionId, gameNumber);

        // Find the session game data from the correct structure
        const sessionGamesData = this.adminInterface.sessionGames || {};
        const sessionTypes = sessionGamesData.sessionTypes || {};
        const sessionData = sessionTypes[sessionId];

        if (sessionData && sessionData.games) {
            const game = sessionData.games.find(g => g.gameNumber === parseInt(gameNumber));
            if (game) {
                // Add session context to game data
                const gameWithContext = {
                    ...game,
                    sessionId: sessionId,
                    sessionName: sessionData.sessionName
                };
                this.showSessionGameModal(gameWithContext, 'edit');
            } else {
                this.adminInterface.utilities.showAlert('Game not found in session', 'error');
            }
        } else {
            this.adminInterface.utilities.showAlert('Session not found', 'error');
        }
    }

    showSessionGameModal(game, mode = 'view') {
        const modalHTML = `
            <div class="modal fade" id="sessionGameModal" tabindex="-1">
                <div class="modal-dialog">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">${mode === 'edit' ? 'Edit' : 'View'} Session Game</h5>
                            <button type="button" class="btn-close" onclick="this.closeModal('sessionGameModal')"></button>
                        </div>
                        <div class="modal-body">
                            <form id="sessionGameForm">
                                <div class="form-group">
                                    <label>Session:</label>
                                    <input type="text" class="form-control" value="${game.sessionName || game.sessionId}" readonly>
                                </div>
                                <div class="form-group">
                                    <label>Game Number:</label>
                                    <input type="number" class="form-control" value="${game.gameNumber}" ${mode === 'view' ? 'readonly' : ''}>
                                </div>
                                <div class="form-group">
                                    <label>Game Name:</label>
                                    <input type="text" class="form-control" value="${game.name || 'Not specified'}" ${mode === 'view' ? 'readonly' : ''}>
                                </div>
                                <div class="form-group">
                                    <label>Category:</label>
                                    <input type="text" class="form-control" value="${game.category || 'Not specified'}" ${mode === 'view' ? 'readonly' : ''}>
                                </div>
                                <div class="form-group">
                                    <label>Color:</label>
                                    <input type="text" class="form-control" value="${game.color || 'N/A'}" ${mode === 'view' ? 'readonly' : ''}>
                                </div>
                                <div class="form-group">
                                    <label>Payout:</label>
                                    <input type="number" class="form-control" value="${game.payout || 0}" ${mode === 'view' ? 'readonly' : ''}>
                                </div>
                                <div class="form-group">
                                    <label>Timing:</label>
                                    <input type="text" class="form-control" value="${game.timing || 'Not specified'}" ${mode === 'view' ? 'readonly' : ''}>
                                </div>
                            </form>
                        </div>
                        <div class="modal-footer">
                            ${mode === 'edit' ?
                                '<button type="button" class="btn btn-primary" onclick="window.adminInterface.uiComponents.saveSessionGame()">Save Changes</button>' :
                                ''}
                            <button type="button" class="btn btn-secondary" onclick="window.adminInterface.uiComponents.closeModal('sessionGameModal')">Close</button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Add modal to page and show it
        const existingModal = document.getElementById('sessionGameModal');
        if (existingModal) {
            existingModal.remove();
        }

        document.body.insertAdjacentHTML('beforeend', modalHTML);

        // Show modal using Bootstrap or custom modal system
        const modal = document.getElementById('sessionGameModal');
        modal.style.display = 'block';
        modal.classList.add('show');
    }

    closeModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.style.display = 'none';
            modal.classList.remove('show');
            setTimeout(() => modal.remove(), 300);
        }
    }

    saveSessionGame() {
        this.adminInterface.utilities.showAlert('Session game save functionality not yet implemented', 'info');
        this.closeModal('sessionGameModal');
    }

    // Session CRUD Methods
    showAddSessionModal() {
        console.log('Show add session modal');
        const modalHTML = `
            <div class="modal fade" id="addSessionModal" tabindex="-1">
                <div class="modal-dialog">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">Add New Session Type</h5>
                            <button type="button" class="btn-close" onclick="window.adminInterface.uiComponents.closeModal('addSessionModal')"></button>
                        </div>
                        <div class="modal-body">
                            <form id="addSessionForm">
                                <div class="form-group">
                                    <label>Session ID:</label>
                                    <input type="text" id="sessionId" class="form-control" placeholder="e.g., 5-1" required>
                                    <small class="text-muted">Format: week-day (e.g., 5-1 for 1st/5th Monday)</small>
                                </div>
                                <div class="form-group">
                                    <label>Session Name:</label>
                                    <input type="text" id="sessionName" class="form-control" placeholder="e.g., 1st/5th Monday" required>
                                </div>
                                <div class="form-group">
                                    <label>Description:</label>
                                    <input type="text" id="sessionDescription" class="form-control" placeholder="e.g., 1st & 5th Monday of Month">
                                </div>
                            </form>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-primary" onclick="window.adminInterface.uiComponents.saveNewSession()">Create Session</button>
                            <button type="button" class="btn btn-secondary" onclick="window.adminInterface.uiComponents.closeModal('addSessionModal')">Cancel</button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Add modal to page and show it
        const existingModal = document.getElementById('addSessionModal');
        if (existingModal) {
            existingModal.remove();
        }

        document.body.insertAdjacentHTML('beforeend', modalHTML);
        document.getElementById('addSessionModal').style.display = 'block';
    }

    editSession(sessionId) {
        console.log('Edit session:', sessionId);
        const sessionGamesData = this.adminInterface.sessionGames || {};
        const sessionTypes = sessionGamesData.sessionTypes || {};
        const sessionData = sessionTypes[sessionId];

        if (!sessionData) {
            this.adminInterface.utilities.showAlert('Session not found', 'error');
            return;
        }

        const modalHTML = `
            <div class="modal fade" id="editSessionModal" tabindex="-1">
                <div class="modal-dialog">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">Edit Session: ${sessionData.sessionName}</h5>
                            <button type="button" class="btn-close" onclick="window.adminInterface.uiComponents.closeModal('editSessionModal')"></button>
                        </div>
                        <div class="modal-body">
                            <form id="editSessionForm">
                                <input type="hidden" id="editSessionId" value="${sessionId}">
                                <div class="form-group">
                                    <label>Session Name:</label>
                                    <input type="text" id="editSessionName" class="form-control" value="${sessionData.sessionName || ''}" required>
                                </div>
                                <div class="form-group">
                                    <label>Description:</label>
                                    <input type="text" id="editSessionDescription" class="form-control" value="${sessionData.description || ''}">
                                </div>
                            </form>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-primary" onclick="window.adminInterface.uiComponents.saveEditedSession()">Save Changes</button>
                            <button type="button" class="btn btn-secondary" onclick="window.adminInterface.uiComponents.closeModal('editSessionModal')">Cancel</button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Add modal to page and show it
        const existingModal = document.getElementById('editSessionModal');
        if (existingModal) {
            existingModal.remove();
        }

        document.body.insertAdjacentHTML('beforeend', modalHTML);
        document.getElementById('editSessionModal').style.display = 'block';
    }

    deleteSession(sessionId) {
        console.log('Delete session:', sessionId);
        const sessionGamesData = this.adminInterface.sessionGames || {};
        const sessionTypes = sessionGamesData.sessionTypes || {};
        const sessionData = sessionTypes[sessionId];

        if (!sessionData) {
            this.adminInterface.utilities.showAlert('Session not found', 'error');
            return;
        }

        const gameCount = sessionData.games ? sessionData.games.length : 0;
        const confirmMessage = `Are you sure you want to delete session "${sessionData.sessionName}" (${sessionId})? This will delete ${gameCount} games.`;

        if (confirm(confirmMessage)) {
            delete sessionTypes[sessionId];
            this.adminInterface.utilities.showAlert(`Session "${sessionData.sessionName}" deleted successfully`, 'success');
            // Refresh the view
            this.renderSessionGamesView(this.adminInterface.sessionGames);
        }
    }

    addGameToSession(sessionId) {
        console.log('Add game to session:', sessionId);
        this.adminInterface.utilities.showAlert('Add Game to Session functionality coming soon', 'info');
    }

    saveNewSession() {
        const sessionId = document.getElementById('sessionId').value.trim();
        const sessionName = document.getElementById('sessionName').value.trim();
        const sessionDescription = document.getElementById('sessionDescription').value.trim();

        if (!sessionId || !sessionName) {
            this.adminInterface.utilities.showAlert('Session ID and Name are required', 'error');
            return;
        }

        const sessionGamesData = this.adminInterface.sessionGames || {};
        const sessionTypes = sessionGamesData.sessionTypes || {};

        if (sessionTypes[sessionId]) {
            this.adminInterface.utilities.showAlert('Session ID already exists', 'error');
            return;
        }

        // Create new session
        sessionTypes[sessionId] = {
            sessionName: sessionName,
            description: sessionDescription,
            totalGames: 0,
            totalPrizeValue: 0,
            games: []
        };

        this.adminInterface.utilities.showAlert(`Session "${sessionName}" created successfully`, 'success');
        this.closeModal('addSessionModal');
        // Refresh the view
        this.renderSessionGamesView(this.adminInterface.sessionGames);
    }

    saveEditedSession() {
        const sessionId = document.getElementById('editSessionId').value;
        const sessionName = document.getElementById('editSessionName').value.trim();
        const sessionDescription = document.getElementById('editSessionDescription').value.trim();

        if (!sessionName) {
            this.adminInterface.utilities.showAlert('Session Name is required', 'error');
            return;
        }

        const sessionGamesData = this.adminInterface.sessionGames || {};
        const sessionTypes = sessionGamesData.sessionTypes || {};

        if (sessionTypes[sessionId]) {
            sessionTypes[sessionId].sessionName = sessionName;
            sessionTypes[sessionId].description = sessionDescription;

            this.adminInterface.utilities.showAlert(`Session "${sessionName}" updated successfully`, 'success');
            this.closeModal('editSessionModal');
            // Refresh the view
            this.renderSessionGamesView(this.adminInterface.sessionGames);
        } else {
            this.adminInterface.utilities.showAlert('Session not found', 'error');
        }
    }

    async viewOccasion(occasionId) {
        console.log('View occasion:', occasionId);

        try {
            // Load occasion data
            const callbackName = 'loadOccasionCallback_' + Date.now();
            let occasionData = null;

            await new Promise((resolve, reject) => {
                window[callbackName] = function(response) {
                    if (response.success && response.data) {
                        occasionData = response.data;
                    }
                    delete window[callbackName];
                    resolve();
                };

                const script = document.createElement('script');
                script.src = `${CONFIG.API_URL}?action=loadOccasion&id=${occasionId}&callback=${callbackName}`;
                script.onerror = () => {
                    delete window[callbackName];
                    reject(new Error('Failed to load occasion'));
                };
                document.head.appendChild(script);

                setTimeout(() => {
                    if (window[callbackName]) {
                        delete window[callbackName];
                        reject(new Error('Timeout loading occasion'));
                    }
                    if (script.parentNode) {
                        script.parentNode.removeChild(script);
                    }
                }, 10000);
            });

            if (!occasionData) {
                throw new Error('No occasion data loaded');
            }

            const occasion = occasionData.occasion || {};
            const financial = occasionData.financial || {};

            // Show view modal with all details
            const modal = document.createElement('div');
            modal.className = 'modal-overlay';
            modal.innerHTML = `
                <div class="modal-content" style="max-width: 600px; max-height: 80vh; overflow-y: auto;">
                    <div class="modal-header">
                        <h3>View Occasion - ${occasion.date || 'Unknown'}</h3>
                        <button type="button" class="modal-close" onclick="this.closest('.modal-overlay').remove()">&times;</button>
                    </div>
                    <div class="modal-body">
                        <h4 style="margin-top: 0; color: #2196F3;">Occasion Details</h4>
                        <table class="details-table">
                            <tr><td><strong>Date:</strong></td><td>${occasion.date || 'N/A'}</td></tr>
                            <tr><td><strong>Session:</strong></td><td>${occasion.sessionType || 'N/A'}</td></tr>
                            <tr><td><strong>Lion in Charge:</strong></td><td>${occasion.lionInCharge || 'N/A'}</td></tr>
                            <tr><td><strong>Pull-Tab Worker:</strong></td><td>${occasion.lionPullTabs || 'N/A'}</td></tr>
                            <tr><td><strong>Total Players:</strong></td><td>${occasion.totalPlayers || 0}</td></tr>
                            <tr><td><strong>Birthdays (BOGOs):</strong></td><td>${occasion.birthdays || occasion.birthdayBOGOs || 0}</td></tr>
                            <tr><td><strong>Status:</strong></td><td><span class="status ${occasionData.status}">${occasionData.status || 'draft'}</span></td></tr>
                        </table>

                        <h4 style="margin-top: 20px; color: #2196F3;">Financial Summary</h4>
                        <table class="details-table">
                            <tr><td><strong>Bingo Sales:</strong></td><td>$${(financial.bingoSales || 0).toLocaleString()}</td></tr>
                            <tr><td><strong>Pull-Tab Sales:</strong></td><td>$${(financial.pullTabSales || 0).toLocaleString()}</td></tr>
                            <tr><td><strong>Total Sales:</strong></td><td>$${(financial.totalSales || 0).toLocaleString()}</td></tr>
                            <tr><td><strong>Bingo Prizes:</strong></td><td>$${(financial.bingoPrizesPaid || 0).toLocaleString()}</td></tr>
                            <tr><td><strong>Pull-Tab Prizes:</strong></td><td>$${(financial.pullTabPrizes || 0).toLocaleString()}</td></tr>
                            <tr><td><strong>Total Prizes:</strong></td><td>$${(financial.totalPrizesPaid || 0).toLocaleString()}</td></tr>
                            <tr style="border-top: 2px solid #2196F3;"><td><strong>Net Profit:</strong></td><td><strong>$${(financial.totalNetProfit || 0).toLocaleString()}</strong></td></tr>
                        </table>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn secondary" onclick="this.closest('.modal-overlay').remove()">Close</button>
                    </div>
                </div>
            `;

            document.body.appendChild(modal);

        } catch (error) {
            console.error('Error loading occasion for view:', error);
            this.adminInterface.utilities.showAlert(`Failed to load occasion: ${error.message}`, 'error');
        }
    }

    async editOccasion(occasionId) {
        console.log('Edit occasion:', occasionId);

        try {
            // Load occasion data
            const callbackName = 'loadOccasionCallback_' + Date.now();
            let occasionData = null;

            await new Promise((resolve, reject) => {
                window[callbackName] = function(response) {
                    if (response.success && response.data) {
                        occasionData = response.data;
                    }
                    delete window[callbackName];
                    resolve();
                };

                const script = document.createElement('script');
                script.src = `${CONFIG.API_URL}?action=loadOccasion&id=${occasionId}&callback=${callbackName}`;
                script.onerror = () => {
                    delete window[callbackName];
                    reject(new Error('Failed to load occasion'));
                };
                document.head.appendChild(script);

                setTimeout(() => {
                    if (window[callbackName]) {
                        delete window[callbackName];
                        reject(new Error('Timeout loading occasion'));
                    }
                    if (script.parentNode) {
                        script.parentNode.removeChild(script);
                    }
                }, 10000);
            });

            if (!occasionData) {
                throw new Error('No occasion data loaded');
            }

            const currentStatus = occasionData.status || 'draft';
            const occasionDate = occasionData.occasion?.date || 'Unknown';

            // Show edit modal with status dropdown
            const modal = document.createElement('div');
            modal.className = 'modal-overlay';
            modal.innerHTML = `
                <div class="modal-content" style="max-width: 500px;">
                    <div class="modal-header">
                        <h3>Edit Occasion - ${occasionDate}</h3>
                        <button type="button" class="modal-close" onclick="this.closest('.modal-overlay').remove()">&times;</button>
                    </div>
                    <form id="edit-occasion-form">
                        <div class="modal-body">
                            <div class="form-group">
                                <label><strong>Occasion ID:</strong></label>
                                <input type="text" value="${occasionId}" class="form-control" readonly style="background: #f5f5f5;">
                            </div>
                            <div class="form-group">
                                <label><strong>Date:</strong></label>
                                <input type="text" value="${occasionDate}" class="form-control" readonly style="background: #f5f5f5;">
                            </div>
                            <div class="form-group">
                                <label><strong>Session:</strong></label>
                                <input type="text" value="${occasionData.occasion?.sessionType || 'N/A'}" class="form-control" readonly style="background: #f5f5f5;">
                            </div>
                            <div class="form-group">
                                <label><strong>Status:</strong></label>
                                <select name="status" class="form-control" required autofocus>
                                    <option value="draft" ${currentStatus === 'draft' ? 'selected' : ''}>Draft</option>
                                    <option value="submitted" ${currentStatus === 'submitted' ? 'selected' : ''}>Submitted</option>
                                    <option value="finalized" ${currentStatus === 'finalized' ? 'selected' : ''}>Finalized</option>
                                </select>
                                <small style="color: #666; display: block; margin-top: 0.5rem;">
                                    💡 Tip: Draft occasions can be edited in the mobile interface. ${currentStatus === 'draft' ? 'Click "Edit in Mobile Interface" button below.' : 'Change to "Draft" to enable editing.'}
                                </small>
                            </div>
                        </div>
                        <div class="modal-footer">
                            ${currentStatus === 'draft' ? `
                                <button type="button" class="btn primary" onclick="window.location.href='occasion.html?date=${occasionDate}&id=${occasionId}';" style="margin-right: auto;">
                                    📱 Edit in Mobile Interface
                                </button>
                            ` : ''}
                            <button type="submit" class="btn success">💾 Save Changes</button>
                            <button type="button" class="btn secondary" onclick="this.closest('.modal-overlay').remove()">Cancel</button>
                        </div>
                    </form>
                </div>
            `;

            document.body.appendChild(modal);

            // Handle form submission
            document.getElementById('edit-occasion-form').addEventListener('submit', async (e) => {
                e.preventDefault();
                const formData = new FormData(e.target);
                const newStatus = formData.get('status');

                try {
                    // Update occasion with new status
                    const updatedData = {
                        ...occasionData,
                        status: newStatus,
                        modified: new Date().toISOString(),
                        modifiedBy: 'Admin'
                    };

                    const response = await fetch(CONFIG.API_URL, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/x-www-form-urlencoded'
                        },
                        body: new URLSearchParams({
                            action: 'saveOccasion',
                            data: JSON.stringify(updatedData)
                        })
                    });

                    const result = await response.json();

                    if (result.success) {
                        modal.remove();
                        this.adminInterface.utilities.showAlert(`Status updated to "${newStatus}"`, 'success');

                        // Rebuild index to reflect status change
                        console.log('Rebuilding index after status change...');
                        if (this.adminInterface.dashboard && typeof this.adminInterface.dashboard.rebuildIndex === 'function') {
                            await this.adminInterface.dashboard.rebuildIndex();
                        }

                        // Reload occasions table
                        if (this.adminInterface.apiService) {
                            this.adminInterface.apiService.loadOccasionsTable();
                        }
                    } else {
                        throw new Error(result.message || 'Update failed');
                    }
                } catch (error) {
                    console.error('Error updating occasion:', error);
                    this.adminInterface.utilities.showAlert(`Failed to update: ${error.message}`, 'error');
                }
            });

        } catch (error) {
            console.error('Error loading occasion for edit:', error);
            this.adminInterface.utilities.showAlert(`Failed to load occasion: ${error.message}`, 'error');
        }
    }

    async deleteOccasion(occasionId) {
        console.log('Delete occasion:', occasionId);

        // Get occasion date for confirmation message
        const occasion = this.adminInterface.occasions?.find(o => o.id === occasionId);
        const occasionDate = occasion?.occasion?.date || occasion?.date || 'Unknown';

        // Confirm deletion
        const confirmMessage = `⚠️ Are you sure you want to delete the occasion for ${occasionDate}?\n\n` +
                             `Occasion ID: ${occasionId}\n\n` +
                             `This action CANNOT be undone!`;

        if (!confirm(confirmMessage)) {
            console.log('Deletion cancelled by user');
            return;
        }

        try {
            // Delete occasion from backend
            const response = await fetch(CONFIG.API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
                body: new URLSearchParams({
                    action: 'deleteOccasion',
                    id: occasionId
                })
            });

            const result = await response.json();

            if (result.success) {
                this.adminInterface.utilities.showAlert(`✅ Occasion ${occasionDate} deleted successfully`, 'success');

                // Reload occasions table
                if (this.adminInterface.apiService) {
                    this.adminInterface.apiService.loadOccasionsTable();
                }

                // Reload dashboard if visible
                if (this.adminInterface.dashboard) {
                    this.adminInterface.loadDashboard();
                }
            } else {
                throw new Error(result.message || 'Delete failed');
            }

        } catch (error) {
            console.error('Error deleting occasion:', error);
            this.adminInterface.utilities.showAlert(`❌ Failed to delete occasion: ${error.message}`, 'error');
        }
    }
}

// Make UIComponents globally available
window.UIComponents = UIComponents;