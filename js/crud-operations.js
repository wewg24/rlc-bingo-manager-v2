/**
 * CRUD Operations Module
 * Handles Create, Read, Update, Delete operations for all data types
 */
class CrudOperations {
    constructor(adminInterface) {
        this.adminInterface = adminInterface;
    }

    /**
     * Update Pull-Tab Status
     */
    async updatePullTabStatus(gameName, newStatus) {
        try {
            console.log(`Updating pull-tab ${gameName} status to ${newStatus}`);

            const url = `${CONFIG.API_URL}?action=update-pull-tab-game`;
            const gameData = {
                name: gameName,
                status: newStatus
            };

            const result = await this.adminInterface.apiService.jsonpRequest(
                `${url}&data=${encodeURIComponent(JSON.stringify(gameData))}`
            );

            if (result.success) {
                this.adminInterface.utilities.showAlert(`Successfully updated ${gameName} status to ${newStatus}`, 'success');

                // Refresh the pull-tab library
                if (this.adminInterface.apiService) {
                    this.adminInterface.apiService.loadPullTabLibrary();
                }
            } else {
                throw new Error(result.error || 'Update failed');
            }
        } catch (error) {
            console.error('Error updating pull-tab status:', error);
            this.adminInterface.utilities.showAlert(`Failed to update status: ${error.message}`, 'error');
        }
    }

    /**
     * Add new Pull-Tab Game
     */
    async addPullTabGame(gameData) {
        try {
            console.log('Adding new pull-tab game:', gameData);

            const url = `${CONFIG.API_URL}?action=add-pull-tab-game`;
            const result = await this.adminInterface.apiService.jsonpRequest(
                `${url}&data=${encodeURIComponent(JSON.stringify(gameData))}`
            );

            if (result.success) {
                this.adminInterface.utilities.showAlert(`Successfully added ${gameData.name}`, 'success');

                // Refresh the pull-tab library
                if (this.adminInterface.apiService) {
                    this.adminInterface.apiService.loadPullTabLibrary();
                }
                return true;
            } else {
                throw new Error(result.error || 'Add operation failed');
            }
        } catch (error) {
            console.error('Error adding pull-tab game:', error);
            this.adminInterface.utilities.showAlert(`Failed to add game: ${error.message}`, 'error');
            return false;
        }
    }

    /**
     * Update Pull-Tab Game
     */
    async updatePullTabGame(gameIndex, gameData) {
        try {
            console.log('Updating pull-tab game:', gameIndex, gameData);

            const url = `${CONFIG.API_URL}?action=update-pull-tab-game`;
            const result = await this.adminInterface.apiService.jsonpRequest(
                `${url}&gameIndex=${gameIndex}&data=${encodeURIComponent(JSON.stringify(gameData))}`
            );

            if (result.success) {
                this.adminInterface.utilities.showAlert(`Successfully updated ${gameData.name}`, 'success');

                // Refresh the pull-tab library
                if (this.adminInterface.apiService) {
                    this.adminInterface.apiService.loadPullTabLibrary();
                }
                return true;
            } else {
                throw new Error(result.error || 'Update operation failed');
            }
        } catch (error) {
            console.error('Error updating pull-tab game:', error);
            this.adminInterface.utilities.showAlert(`Failed to update game: ${error.message}`, 'error');
            return false;
        }
    }

    /**
     * Delete Pull-Tab Game
     */
    async deletePullTabGame(gameName) {
        if (!confirm(`Are you sure you want to delete the pull-tab game "${gameName}"?`)) {
            return false;
        }

        try {
            console.log('Deleting pull-tab game:', gameName);

            // Find the game index in the library
            const gameIndex = this.adminInterface.pullTabLibrary.findIndex(game => game.name === gameName);
            if (gameIndex === -1) {
                throw new Error('Game not found in library');
            }

            const url = `${CONFIG.API_URL}?action=delete-pull-tab-game`;
            const result = await this.adminInterface.apiService.jsonpRequest(
                `${url}&gameIndex=${gameIndex}`
            );

            if (result.success) {
                this.adminInterface.utilities.showAlert(`Successfully deleted ${gameName}`, 'success');

                // Refresh the pull-tab library
                if (this.adminInterface.apiService) {
                    this.adminInterface.apiService.loadPullTabLibrary();
                }
                return true;
            } else {
                throw new Error(result.error || 'Delete operation failed');
            }
        } catch (error) {
            console.error('Error deleting pull-tab game:', error);
            this.adminInterface.utilities.showAlert(`Failed to delete game: ${error.message}`, 'error');
            return false;
        }
    }

    /**
     * Delete Occasion
     */
    async deleteOccasion(occasionId) {
        if (!confirm(`Are you sure you want to delete occasion "${occasionId}"?`)) {
            return false;
        }

        try {
            console.log('Deleting occasion:', occasionId);

            const url = `${CONFIG.API_URL}?action=deleteOccasion&occasionId=${encodeURIComponent(occasionId)}`;
            const result = await this.adminInterface.apiService.jsonpRequest(url);

            if (result.success) {
                this.adminInterface.utilities.showAlert(`Successfully deleted occasion ${occasionId}`, 'success');

                // Refresh occasions and dashboard
                if (this.adminInterface.apiService) {
                    this.adminInterface.apiService.loadOccasionsTable();
                    this.adminInterface.apiService.loadRealData();
                }
                return true;
            } else {
                throw new Error(result.error || 'Delete operation failed');
            }
        } catch (error) {
            console.error('Error deleting occasion:', error);
            this.adminInterface.utilities.showAlert(`Failed to delete occasion: ${error.message}`, 'error');
            return false;
        }
    }

    /**
     * Show Pull-Tab Details Modal
     */
    viewPullTabDetails(gameName) {
        const game = this.adminInterface.pullTabLibrary.find(g => g.name === gameName);
        if (!game) {
            this.adminInterface.utilities.showAlert('Game not found', 'error');
            return;
        }

        const price = parseFloat(game.price) || 0;
        const count = parseInt(game.count) || 0;
        const idealProfit = parseFloat(game.idealProfit) || 0;
        const totalSales = price * count;
        const profitPercentage = totalSales > 0 ? Math.round((idealProfit / totalSales) * 100) : 0;

        const modalHtml = `
            <div class="modal-overlay" onclick="this.remove()">
                <div class="modal-content" onclick="event.stopPropagation()">
                    <div class="modal-header">
                        <h3>${game.name}</h3>
                        <button class="close-btn" onclick="this.closest('.modal-overlay').remove()">×</button>
                    </div>
                    <div class="modal-body">
                        <div class="game-details">
                            <div><strong>Price per Ticket:</strong> $${price.toFixed(2)}</div>
                            <div><strong>Total Tickets:</strong> ${count.toLocaleString()}</div>
                            <div><strong>Total Sales:</strong> $${totalSales.toFixed(2)}</div>
                            <div><strong>Ideal Profit:</strong> $${idealProfit.toFixed(2)}</div>
                            <div><strong>Profit Percentage:</strong> ${profitPercentage}%</div>
                            <div><strong>Status:</strong> <span class="status ${game.status || 'active'}">${game.status || 'active'}</span></div>
                            ${game.url ? `<div><strong>Details:</strong> <a href="${game.url}" target="_blank">View PDF</a></div>` : ''}
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button class="btn warning" onclick="window.adminInterface.crudOperations.editPullTab('${gameName}')">Edit</button>
                        <button class="btn danger" onclick="window.adminInterface.crudOperations.deletePullTab('${gameName}')">Delete</button>
                        <button class="btn secondary" onclick="this.closest('.modal-overlay').remove()">Close</button>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHtml);
        this.addModalStyles();
    }

    /**
     * Show Edit Pull-Tab Modal
     */
    editPullTab(gameName) {
        const game = this.adminInterface.pullTabLibrary.find(g => g.name === gameName);
        if (!game) {
            this.adminInterface.utilities.showAlert('Game not found', 'error');
            return;
        }

        const gameIndex = this.adminInterface.pullTabLibrary.findIndex(g => g.name === gameName);

        const modalHtml = `
            <div class="modal-overlay" onclick="this.remove()">
                <div class="modal-content" onclick="event.stopPropagation()">
                    <div class="modal-header">
                        <h3>Edit Pull-Tab Game</h3>
                        <button class="close-btn" onclick="this.closest('.modal-overlay').remove()">×</button>
                    </div>
                    <form id="edit-pull-tab-form">
                        <div class="modal-body">
                            <div class="form-group">
                                <label>Game Name</label>
                                <input type="text" name="name" value="${game.name || ''}" class="form-control" required>
                            </div>
                            <div class="form-group">
                                <label>Price per Ticket</label>
                                <input type="number" name="price" value="${game.price || ''}" step="0.01" class="form-control" required>
                            </div>
                            <div class="form-group">
                                <label>Total Tickets</label>
                                <input type="number" name="count" value="${game.count || ''}" class="form-control" required>
                            </div>
                            <div class="form-group">
                                <label>Ideal Profit</label>
                                <input type="number" name="idealProfit" value="${game.idealProfit || ''}" step="0.01" class="form-control" required>
                            </div>
                            <div class="form-group">
                                <label>Status</label>
                                <select name="status" class="form-control">
                                    <option value="active" ${game.status === 'active' ? 'selected' : ''}>Active</option>
                                    <option value="discontinued" ${game.status === 'discontinued' ? 'selected' : ''}>Discontinued</option>
                                    <option value="seasonal" ${game.status === 'seasonal' ? 'selected' : ''}>Seasonal</option>
                                </select>
                            </div>
                            <div class="form-group">
                                <label>URL (optional)</label>
                                <input type="url" name="url" value="${game.url || ''}" class="form-control">
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button type="submit" class="btn success">Save Changes</button>
                            <button type="button" class="btn secondary" onclick="this.closest('.modal-overlay').remove()">Cancel</button>
                        </div>
                    </form>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHtml);
        this.addModalStyles();

        // Handle form submission
        document.getElementById('edit-pull-tab-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(e.target);
            const gameData = Object.fromEntries(formData.entries());

            // Convert numeric fields
            gameData.price = parseFloat(gameData.price) || 0;
            gameData.count = parseInt(gameData.count) || 0;
            gameData.idealProfit = parseFloat(gameData.idealProfit) || 0;

            const success = await this.updatePullTabGame(gameIndex, gameData);
            if (success) {
                e.target.closest('.modal-overlay').remove();
            }
        });
    }

    /**
     * Add modal styles
     */
    addModalStyles() {
        const existingStyle = document.getElementById('modal-styles');
        if (existingStyle) return;

        const style = document.createElement('style');
        style.id = 'modal-styles';
        style.textContent = `
            .modal-overlay {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.5);
                display: flex;
                justify-content: center;
                align-items: center;
                z-index: 10000;
            }

            .modal-content {
                background: white;
                border-radius: 8px;
                max-width: 600px;
                width: 90%;
                max-height: 90vh;
                overflow-y: auto;
                box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            }

            .modal-header {
                padding: 20px;
                border-bottom: 1px solid #eee;
                display: flex;
                justify-content: space-between;
                align-items: center;
            }

            .modal-header h3 {
                margin: 0;
            }

            .close-btn {
                background: none;
                border: none;
                font-size: 24px;
                cursor: pointer;
                color: #666;
            }

            .close-btn:hover {
                color: #000;
            }

            .modal-body {
                padding: 20px;
            }

            .modal-footer {
                padding: 20px;
                border-top: 1px solid #eee;
                display: flex;
                gap: 10px;
                justify-content: flex-end;
            }

            .game-details {
                display: flex;
                flex-direction: column;
                gap: 10px;
            }

            .game-details > div {
                padding: 8px 0;
                border-bottom: 1px solid #f0f0f0;
            }

            .btn-group {
                display: flex;
                gap: 5px;
            }

            .btn-sm {
                padding: 5px 10px;
                font-size: 12px;
            }
        `;

        document.head.appendChild(style);
    }

    /**
     * Show Add Pull-Tab Modal
     */
    showAddPullTabModal() {
        const modalHtml = `
            <div class="modal-overlay" onclick="this.remove()">
                <div class="modal-content" onclick="event.stopPropagation()">
                    <div class="modal-header">
                        <h3>Add New Pull-Tab Game</h3>
                        <button class="close-btn" onclick="this.closest('.modal-overlay').remove()">×</button>
                    </div>
                    <form id="add-pull-tab-form">
                        <div class="modal-body">
                            <div class="form-group">
                                <label>Game Name</label>
                                <input type="text" name="name" class="form-control" required>
                            </div>
                            <div class="form-group">
                                <label>Price per Ticket</label>
                                <input type="number" name="price" step="0.01" class="form-control" required>
                            </div>
                            <div class="form-group">
                                <label>Total Tickets</label>
                                <input type="number" name="count" class="form-control" required>
                            </div>
                            <div class="form-group">
                                <label>Ideal Profit</label>
                                <input type="number" name="idealProfit" step="0.01" class="form-control" required>
                            </div>
                            <div class="form-group">
                                <label>Status</label>
                                <select name="status" class="form-control">
                                    <option value="active">Active</option>
                                    <option value="discontinued">Discontinued</option>
                                    <option value="seasonal">Seasonal</option>
                                </select>
                            </div>
                            <div class="form-group">
                                <label>URL (optional)</label>
                                <input type="url" name="url" class="form-control">
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button type="submit" class="btn success">Add Game</button>
                            <button type="button" class="btn secondary" onclick="this.closest('.modal-overlay').remove()">Cancel</button>
                        </div>
                    </form>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHtml);
        this.addModalStyles();

        // Handle form submission
        document.getElementById('add-pull-tab-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(e.target);
            const gameData = Object.fromEntries(formData.entries());

            // Convert numeric fields
            gameData.price = parseFloat(gameData.price) || 0;
            gameData.count = parseInt(gameData.count) || 0;
            gameData.idealProfit = parseFloat(gameData.idealProfit) || 0;

            const success = await this.addPullTabGame(gameData);
            if (success) {
                e.target.closest('.modal-overlay').remove();
            }
        });
    }
}

// Make CrudOperations globally available
window.CrudOperations = CrudOperations;