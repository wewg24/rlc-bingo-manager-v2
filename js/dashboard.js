/**
 * Dashboard Module
 * Handles dashboard statistics and display
 */
class Dashboard {
    constructor(adminInterface) {
        this.adminInterface = adminInterface;
    }

    /**
     * Update dashboard display based on loaded data
     */
    updateDashboardStats() {
        console.log('Dashboard: updateDashboardStats called');
        const occasions = this.adminInterface.occasions || [];
        console.log('Dashboard: occasions data:', occasions);

        // Render the simplified dashboard
        this.renderDashboard();
    }

    /**
     * Render the simplified dashboard - focuses on review workflow
     */
    renderDashboard() {
        console.log('Dashboard: renderDashboard called');
        const dashboardView = document.getElementById('dashboard-view');
        if (!dashboardView) {
            console.error('Dashboard: dashboard-view element not found!');
            return;
        }

        // Get occasions categorized by status
        const occasions = this.adminInterface.occasions || [];
        const draftOccasions = occasions.filter(o => o.status === 'draft' || o.status === 'Draft' || !o.status);
        const submittedOccasions = occasions.filter(o => o.status === 'submitted' || o.status === 'Submitted');
        const finalizedOccasions = occasions.filter(o => o.status === 'finalized' || o.status === 'Finalized');

        // Simplified dashboard focused on review workflow
        const dashboardHtml = `
            <div class="dashboard-container">
                <div class="card">
                    <div style="margin-bottom: 30px; display: flex; justify-content: space-between; align-items: start;">
                        <div>
                            <h2 style="margin-bottom: 10px;">📋 Occasions Management</h2>
                            <p style="color: #666; margin: 0;">
                                Review and manage bingo occasions. All occasions are categorized by status below.
                            </p>
                        </div>
                        <div style="display: flex; gap: 10px;">
                            <button class="btn success" onclick="window.open('occasion.html', '_blank')"
                                    style="white-space: nowrap; font-weight: 600;">
                                ➕ Add New Occasion
                            </button>
                            <button class="btn secondary" onclick="window.adminInterface.dashboard.rebuildIndex()"
                                    style="white-space: nowrap;">
                                🔄 Rebuild Index
                            </button>
                        </div>
                    </div>

                    ${this.renderReviewSection('🔵 Draft Occasions', draftOccasions, 'draft')}
                    ${this.renderReviewSection('🟡 Submitted Occasions', submittedOccasions, 'submitted')}
                    ${this.renderReviewSection('🟢 Finalized Occasions', finalizedOccasions, 'finalized')}
                </div>
            </div>
        `;

        dashboardView.innerHTML = dashboardHtml;

        // Force visibility
        dashboardView.style.display = 'block';
        dashboardView.style.minHeight = '500px';
        console.log('Dashboard: Simplified dashboard rendered successfully');
    }

    /**
     * Render a review section for occasions with a specific status
     */
    renderReviewSection(title, occasions, statusType) {
        if (!occasions || occasions.length === 0) {
            return `
                <div class="review-section" style="margin-bottom: 30px;">
                    <h3 style="margin-bottom: 15px;">${title}</h3>
                    <p style="color: #999; padding: 20px; background: #f8f9fa; border-radius: 4px; text-align: center;">
                        No ${statusType} occasions at this time
                    </p>
                </div>
            `;
        }

        return `
            <div class="review-section" style="margin-bottom: 30px;">
                <h3 style="margin-bottom: 15px;">${title} (${occasions.length})</h3>
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
                            ${occasions.map(occasion => this.renderOccasionRowInline(occasion)).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    }

    /**
     * Render an occasion row (inline version for dashboard)
     * Reads from TRANSFORMED data structure (api-service.js flattens the data)
     */
    renderOccasionRowInline(occasion) {
        // api-service.js transforms backend data to flat structure:
        // {id, date, sessionType, lionInCharge, lionPullTabs, totalPlayers, netProfit, totalOverShort, status}

        // Date - format without timezone conversion to avoid off-by-one errors
        const dateParts = occasion.date.split('-');
        const formattedDate = dateParts.length === 3 ? `${dateParts[1]}/${dateParts[2]}/${dateParts[0]}` : occasion.date;

        // Session (convert code to name)
        const sessionType = occasion.sessionType || 'Unknown';
        const sessionTypeName = CONFIG.SESSION_TYPES?.[sessionType] || sessionType;

        // Closet (Lion in Charge) - direct field
        const closetWorker = occasion.lionInCharge || 'N/A';

        // Pull-Tabs (Lion in Charge of Pull-Tabs) - direct field
        const pullTabWorker = occasion.lionPullTabs || 'N/A';

        // Players - direct field
        const players = occasion.totalPlayers || 0;

        // Profit (Net Profit) - direct field
        const profit = occasion.netProfit || 0;

        // Offage (Over/Short) - direct field
        const offage = occasion.totalOverShort || 0;

        // Status - direct field
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


    /**
     * Rebuild the occasions index file
     */
    async rebuildIndex() {
        console.log('Dashboard: rebuildIndex called');

        if (!confirm('Rebuild the occasions index file?\n\nThis will scan all occasion files and regenerate the index with updated financial data.')) {
            return;
        }

        // Show loading spinner
        if (window.showLoading) {
            window.showLoading({
                text: 'Rebuilding Index',
                subtext: 'Scanning all occasion files and updating index...',
                timeout: 30000
            });
        }

        try {
            // Call the backend API to rebuild index
            const result = await new Promise((resolve, reject) => {
                const callbackName = 'rebuildIndexCallback_' + Date.now();

                window[callbackName] = function(response) {
                    delete window[callbackName];
                    resolve(response);
                };

                const script = document.createElement('script');
                script.src = `${CONFIG.API_URL}?action=updateOccasionsIndex&callback=${callbackName}&t=${Date.now()}`;
                script.onerror = () => {
                    delete window[callbackName];
                    reject(new Error('Failed to rebuild index'));
                };
                document.head.appendChild(script);

                setTimeout(() => {
                    if (window[callbackName]) {
                        delete window[callbackName];
                        reject(new Error('Timeout rebuilding index'));
                    }
                    if (script.parentNode) {
                        script.parentNode.removeChild(script);
                    }
                }, 30000);
            });

            console.log('Rebuild index result:', result);

            if (result.success) {
                if (this.adminInterface.utilities) {
                    this.adminInterface.utilities.showAlert(
                        `✅ Index rebuilt successfully!\n\n${result.count} occasions indexed.\n\nLast updated: ${new Date(result.lastUpdated).toLocaleString()}`,
                        'success'
                    );
                } else {
                    alert(`✅ Index rebuilt successfully!\n\n${result.count} occasions indexed.`);
                }

                // Reload the dashboard to show updated data
                if (this.adminInterface.apiService) {
                    await this.adminInterface.apiService.loadRealData();
                }
            } else {
                throw new Error(result.error || 'Rebuild failed');
            }
        } catch (error) {
            console.error('Error rebuilding index:', error);
            if (this.adminInterface.utilities) {
                this.adminInterface.utilities.showAlert(`Failed to rebuild index: ${error.message}`, 'error');
            } else {
                alert(`❌ Failed to rebuild index: ${error.message}`);
            }
        } finally {
            // Hide loading spinner
            if (window.hideLoading) {
                window.hideLoading();
            }
        }
    }

    /**
     * Add custom CSS for dashboard components
     */
    addDashboardStyles() {
        const existingStyle = document.getElementById('dashboard-styles');
        if (existingStyle) return; // Already added

        const style = document.createElement('style');
        style.id = 'dashboard-styles';
        style.textContent = `
            .dashboard-container {
                padding: 20px;
            }

            .review-section {
                margin-bottom: 30px;
            }

            .review-section h3 {
                margin-bottom: 15px;
                font-size: 1.25rem;
                font-weight: 600;
            }

            .table-container {
                overflow-x: auto;
                background: white;
                border-radius: 4px;
                box-shadow: 0 1px 3px rgba(0,0,0,0.1);
            }

            .btn-group {
                display: flex;
                gap: 5px;
            }

            .btn-sm {
                padding: 4px 8px;
                font-size: 12px;
            }

            .status {
                padding: 4px 8px;
                border-radius: 4px;
                font-size: 12px;
                font-weight: 600;
                text-transform: uppercase;
            }

            .status.draft {
                background: #e3f2fd;
                color: #1976d2;
            }

            .status.submitted {
                background: #fff3e0;
                color: #f57c00;
            }

            .status.finalized {
                background: #e8f5e9;
                color: #388e3c;
            }
        `;

        document.head.appendChild(style);
    }

    /**
     * Initialize dashboard
     */
    init() {
        this.addDashboardStyles();
        this.updateDashboardStats();
    }
}

// Make Dashboard globally available
window.Dashboard = Dashboard;