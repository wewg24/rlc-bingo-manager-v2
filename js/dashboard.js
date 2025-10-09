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
                    <div style="margin-bottom: 30px;">
                        <h2 style="margin-bottom: 10px;">📋 Occasions Management</h2>
                        <p style="color: #666;">
                            Review and manage bingo occasions. All occasions are categorized by status below.
                        </p>
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
                                <th>Session Type</th>
                                <th>Lion in Charge</th>
                                <th>Players</th>
                                <th>Revenue</th>
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
     */
    renderOccasionRowInline(occasion) {
        // Occasion data structure from API has nested 'occasion' object
        const occasionData = occasion.occasion || {};

        const formattedDate = new Date(occasion.date).toLocaleDateString();
        const sessionType = occasion.session || occasionData.sessionType || 'Unknown';
        const sessionTypeName = CONFIG.SESSION_TYPES ? (CONFIG.SESSION_TYPES[sessionType] || sessionType) : sessionType;
        const lionInCharge = occasionData.lionInCharge || 'N/A';
        const totalPlayers = occasionData.totalPlayers || 0;

        // Revenue from financial data if available
        const financial = occasion.financial || occasionData.financial || {};
        const totalRevenue = financial.totalSales || financial.grossSales || 0;

        return `
            <tr>
                <td><strong>${formattedDate}</strong></td>
                <td>${sessionTypeName}</td>
                <td>${lionInCharge}</td>
                <td>${totalPlayers}</td>
                <td>$${totalRevenue.toLocaleString()}</td>
                <td><span class="status ${occasion.status.toLowerCase()}">${occasion.status}</span></td>
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