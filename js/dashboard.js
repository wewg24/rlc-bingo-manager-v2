/**
 * Dashboard Module
 * Handles dashboard statistics and display
 */
class Dashboard {
    constructor(adminInterface) {
        this.adminInterface = adminInterface;
    }

    /**
     * Update dashboard statistics based on loaded data
     */
    updateDashboardStats() {
        console.log('Dashboard: updateDashboardStats called');
        const occasions = this.adminInterface.occasions || [];
        console.log('Dashboard: occasions data:', occasions);

        // Calculate basic stats
        const totalOccasions = occasions.length;
        const completedOccasions = occasions.filter(o => o.status === 'Completed').length;
        const draftOccasions = occasions.filter(o => o.status === 'Draft').length;
        const totalPlayers = occasions.reduce((sum, o) => sum + (o.totalPlayers || 0), 0);
        const totalRevenue = occasions.reduce((sum, o) => sum + (o.totalRevenue || 0), 0);
        const totalProfit = occasions.reduce((sum, o) => sum + (o.netProfit || 0), 0);

        // Recent activity
        const recentOccasions = occasions
            .sort((a, b) => new Date(b.date) - new Date(a.date))
            .slice(0, 5);

        // Session type distribution
        const sessionTypeStats = this.calculateSessionTypeStats(occasions);

        // Update the dashboard HTML
        this.renderDashboard({
            totalOccasions,
            completedOccasions,
            draftOccasions,
            totalPlayers,
            totalRevenue,
            totalProfit,
            recentOccasions,
            sessionTypeStats
        });
    }

    /**
     * Calculate session type statistics
     */
    calculateSessionTypeStats(occasions) {
        const stats = {};
        occasions.forEach(occasion => {
            const sessionType = occasion.sessionType || 'Unknown';
            if (!stats[sessionType]) {
                stats[sessionType] = {
                    count: 0,
                    players: 0,
                    revenue: 0
                };
            }
            stats[sessionType].count++;
            stats[sessionType].players += occasion.totalPlayers || 0;
            stats[sessionType].revenue += occasion.totalRevenue || 0;
        });
        return stats;
    }

    /**
     * Render the complete dashboard
     */
    renderDashboard(stats) {
        console.log('Dashboard: renderDashboard called with stats:', stats);
        const dashboardView = document.getElementById('dashboard-view');
        console.log('Dashboard: dashboardView element:', dashboardView);
        if (!dashboardView) {
            console.error('Dashboard: dashboard-view element not found!');
            return;
        }

        let welcomeCard = '';
        if (stats.totalOccasions === 0) {
            welcomeCard = `
                <div class="card" style="text-align: center; padding: 40px; margin-bottom: 20px;">
                    <h2>🏁 Welcome to RLC Bingo Admin!</h2>
                    <p style="font-size: 16px; margin-bottom: 20px;">No occasions found in the system yet.</p>
                    <a href="./occasion.html" class="btn success" target="_blank" style="font-size: 18px; padding: 12px 24px;">
                        ➕ Create Your First Occasion
                    </a>
                </div>
            `;
        }

        const dashboardHtml = `
            <div class="dashboard-container">
                ${welcomeCard}
                <div class="stats-grid">
                    <div class="stat-card">
                        <div class="stat-value">${stats.totalOccasions}</div>
                        <div class="stat-label">Total Occasions</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-value">${stats.completedOccasions}</div>
                        <div class="stat-label">Completed</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-value">${stats.draftOccasions}</div>
                        <div class="stat-label">Draft</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-value">${stats.totalPlayers.toLocaleString()}</div>
                        <div class="stat-label">Total Players</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-value">$${stats.totalRevenue.toLocaleString()}</div>
                        <div class="stat-label">Total Revenue</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-value">$${stats.totalProfit.toLocaleString()}</div>
                        <div class="stat-label">Net Profit</div>
                    </div>
                </div>

                <div class="grid">
                    <div class="card">
                        <h3>Recent Activity</h3>
                        ${this.renderRecentActivity(stats.recentOccasions)}
                    </div>

                    <div class="card">
                        <h3>Session Types</h3>
                        ${this.renderSessionTypeStats(stats.sessionTypeStats)}
                    </div>

                    <div class="card">
                        <h3>Quick Actions</h3>
                        <div class="quick-actions">
                            <a href="./occasion.html" class="btn success" target="_blank">
                                📝 Create New Occasion
                            </a>
                            <button class="btn" onclick="window.adminInterface.showLibrary()">
                                🎮 View Pull-Tab Library
                            </button>
                            <button class="btn" onclick="window.adminInterface.showSessionGames()">
                                🎯 Manage Session Games
                            </button>
                            <button class="btn secondary" onclick="window.adminInterface.showReports()">
                                📊 Generate Reports
                            </button>
                        </div>
                    </div>

                    <div class="card">
                        <h3>System Status</h3>
                        <div class="system-status">
                            <div class="status-item">
                                <span class="status-indicator active"></span>
                                <span>Google Apps Script API</span>
                            </div>
                            <div class="status-item">
                                <span class="status-indicator active"></span>
                                <span>Pull-Tab Library (${this.adminInterface.pullTabLibrary?.length || 0} games)</span>
                            </div>
                            <div class="status-item">
                                <span class="status-indicator active"></span>
                                <span>Session Games (${Object.keys(this.adminInterface.sessionGames?.sessionTypes || {}).length} sessions)</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="card">
                    <h3>Mobile Access</h3>
                    <div class="qr-container">
                        <div id="qr-code-container">
                            <!-- QR code will be inserted here by utilities module -->
                        </div>
                        <p>Scan this QR code to access the mobile occasion entry form</p>
                        <p><a href="./occasion.html" target="_blank">Or click here to open directly</a></p>
                    </div>
                </div>
            </div>
        `;

        dashboardView.innerHTML = dashboardHtml;

        // Debug: Check element dimensions and visibility
        const rect = dashboardView.getBoundingClientRect();
        const computedStyle = window.getComputedStyle(dashboardView);
        console.log('Dashboard: HTML successfully set, content length:', dashboardHtml.length);
        console.log('Dashboard: Element dimensions:', {
            width: rect.width,
            height: rect.height,
            top: rect.top,
            left: rect.left
        });
        console.log('Dashboard: Computed styles:', {
            display: computedStyle.display,
            visibility: computedStyle.visibility,
            position: computedStyle.position,
            overflow: computedStyle.overflow
        });
        console.log('Dashboard: Parent container:', dashboardView.parentElement);

        // Force visibility - removed debug background color
        dashboardView.style.display = 'block';
        dashboardView.style.minHeight = '500px';
        console.log('Dashboard: Applied clean styles for visibility');
    }

    /**
     * Render recent activity list
     */
    renderRecentActivity(recentOccasions) {
        if (!recentOccasions || recentOccasions.length === 0) {
            return '<p class="text-muted">No recent activity</p>';
        }

        return `
            <div class="recent-activity">
                ${recentOccasions.map(occasion => `
                    <div class="activity-item">
                        <div class="activity-date">${new Date(occasion.date).toLocaleDateString()}</div>
                        <div class="activity-details">
                            <strong>${CONFIG.SESSION_TYPES?.[occasion.sessionType] || occasion.sessionType}</strong>
                            <span class="text-muted">• ${occasion.lionInCharge}</span>
                            <span class="status ${occasion.status.toLowerCase()}">${occasion.status}</span>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    }

    /**
     * Render session type statistics
     */
    renderSessionTypeStats(sessionTypeStats) {
        if (!sessionTypeStats || Object.keys(sessionTypeStats).length === 0) {
            return '<p class="text-muted">No session data available</p>';
        }

        return `
            <div class="session-type-stats">
                ${Object.entries(sessionTypeStats).map(([type, stats]) => `
                    <div class="session-stat-item">
                        <div class="session-stat-header">
                            <strong>${CONFIG.SESSION_TYPES?.[type] || type}</strong>
                            <span class="badge">${stats.count}</span>
                        </div>
                        <div class="session-stat-details">
                            <small>
                                ${stats.players.toLocaleString()} players •
                                $${stats.revenue.toLocaleString()} revenue
                            </small>
                        </div>
                    </div>
                `).join('')}
            </div>
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
            .quick-actions {
                display: flex;
                flex-direction: column;
                gap: 10px;
            }

            .quick-actions .btn {
                justify-content: flex-start;
                text-align: left;
            }

            .system-status {
                display: flex;
                flex-direction: column;
                gap: 8px;
            }

            .status-item {
                display: flex;
                align-items: center;
                gap: 8px;
            }

            .status-indicator {
                width: 8px;
                height: 8px;
                border-radius: 50%;
                background: #dc3545;
            }

            .status-indicator.active {
                background: #28a745;
            }

            .recent-activity {
                display: flex;
                flex-direction: column;
                gap: 10px;
            }

            .activity-item {
                padding: 10px;
                background: #f8f9fa;
                border-radius: 4px;
                border-left: 3px solid #2196F3;
            }

            .activity-date {
                font-size: 12px;
                color: #666;
                margin-bottom: 5px;
            }

            .activity-details {
                display: flex;
                align-items: center;
                gap: 10px;
                flex-wrap: wrap;
            }

            .session-type-stats {
                display: flex;
                flex-direction: column;
                gap: 10px;
            }

            .session-stat-item {
                padding: 10px;
                background: #f8f9fa;
                border-radius: 4px;
            }

            .session-stat-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 5px;
            }

            .badge {
                background: #2196F3;
                color: white;
                padding: 2px 8px;
                border-radius: 12px;
                font-size: 12px;
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