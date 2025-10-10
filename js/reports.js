/**
 * RLC Bingo Manager - Report Generation
 * Generates PDF reports and SMS summaries
 * Version 1.0.0
 */

// ============================================
// PDF REPORT GENERATION
// ============================================

async function generatePDFReport() {
    showLoading('Generating PDF', 'Creating comprehensive report...');

    try {
        // We'll use the browser's print functionality with custom CSS for a professional report
        const reportWindow = window.open('', '_blank');

        if (!reportWindow) {
            alert('Please allow popups to generate the PDF report');
            hideLoading();
            return;
        }

        const appData = window.app?.data || {};
        const occasionDate = appData.occasion?.date || 'N/A';
        const sessionType = appData.occasion?.sessionType || 'N/A';
        const totalPlayers = appData.occasion?.totalPeople || 0;

        // Build comprehensive HTML report
        const reportHTML = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>RLC Bingo Report - ${occasionDate}</title>
    <style>
        @media print {
            @page {
                size: letter;
                margin: 0.75in;
            }
            .page-break {
                page-break-before: always;
            }
        }

        * {
            box-sizing: border-box;
        }

        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            font-size: 11pt;
            line-height: 1.4;
            color: #2c3e50;
            max-width: 8.5in;
            margin: 0 auto;
            padding: 20px;
        }

        .report-header {
            text-align: center;
            border-bottom: 3px solid #1565C0;
            padding-bottom: 1rem;
            margin-bottom: 2rem;
        }

        .report-header h1 {
            color: #1565C0;
            font-size: 24pt;
            margin: 0 0 0.5rem 0;
        }

        .report-header .meta {
            font-size: 12pt;
            color: #7f8c8d;
        }

        .section {
            margin-bottom: 2rem;
        }

        .section-title {
            background: #1565C0;
            color: white;
            padding: 0.5rem 1rem;
            font-size: 14pt;
            font-weight: 600;
            margin-bottom: 1rem;
            border-radius: 4px;
        }

        .info-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 0.75rem;
            margin-bottom: 1.5rem;
        }

        .info-item {
            padding: 0.5rem;
            background: #f8f9fa;
            border-radius: 4px;
        }

        .info-label {
            font-weight: 600;
            color: #34495e;
            font-size: 10pt;
        }

        .info-value {
            font-size: 11pt;
            color: #2c3e50;
        }

        table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 1rem;
            font-size: 10pt;
        }

        th {
            background: #ecf0f1;
            color: #2c3e50;
            font-weight: 600;
            padding: 0.5rem;
            text-align: left;
            border: 1px solid #bdc3c7;
        }

        td {
            padding: 0.4rem 0.5rem;
            border: 1px solid #e0e0e0;
        }

        tr:nth-child(even) {
            background: #f8f9fa;
        }

        .text-right {
            text-align: right;
        }

        .text-center {
            text-align: center;
        }

        .total-row {
            font-weight: 600;
            background: #e3f2fd !important;
        }

        .metrics-grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 1rem;
            margin-bottom: 2rem;
        }

        .metric-card {
            background: #f8f9fa;
            border-left: 4px solid #1565C0;
            padding: 1rem;
            border-radius: 4px;
        }

        .metric-label {
            font-size: 10pt;
            color: #7f8c8d;
            font-weight: 600;
            margin-bottom: 0.25rem;
        }

        .metric-value {
            font-size: 18pt;
            color: #2c3e50;
            font-weight: 700;
        }

        .metric-sub {
            font-size: 9pt;
            color: #95a5a6;
            margin-top: 0.25rem;
        }

        .footer {
            margin-top: 3rem;
            padding-top: 1rem;
            border-top: 2px solid #ecf0f1;
            text-align: center;
            font-size: 9pt;
            color: #95a5a6;
        }

        @media print {
            body {
                padding: 0;
            }
            .no-print {
                display: none;
            }
        }
    </style>
</head>
<body>
    <div class="no-print" style="text-align: right; margin-bottom: 1rem;">
        <button onclick="window.print()" style="padding: 0.5rem 1.5rem; background: #1565C0; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 11pt;">Print / Save as PDF</button>
        <button onclick="window.close()" style="padding: 0.5rem 1.5rem; background: #95a5a6; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 11pt; margin-left: 0.5rem;">Close</button>
    </div>

    <div class="report-header">
        <h1>Rolla Lions Club - Bingo Report</h1>
        <div class="meta">
            <strong>${occasionDate}</strong> | ${sessionType}
        </div>
    </div>

    ${generateFinancialSummarySection(appData)}

    ${generateBingoSalesSection(appData)}

    <div class="page-break"></div>

    ${generateSessionGamesSection(appData)}

    ${generatePullTabsSection(appData)}

    <div class="page-break"></div>

    ${generateMoneyCountSection(appData)}

    <div class="footer">
        Generated ${new Date().toLocaleString()} | Rolla Lions Club Bingo Manager
    </div>
</body>
</html>
        `;

        reportWindow.document.write(reportHTML);
        reportWindow.document.close();

        hideLoading(500);

    } catch (error) {
        console.error('Error generating PDF report:', error);
        alert('Error generating PDF report. Please try again.');
        hideLoading();
    }
}

function formatCurrency(value) {
    const num = parseFloat(value) || 0;
    return '$' + num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatNumber(value) {
    const num = parseInt(value) || 0;
    return num.toLocaleString('en-US');
}

function generateFinancialSummarySection(appData) {
    const financial = appData.financial || {};
    const totalPlayers = appData.occasion?.totalPlayers || appData.occasion?.totalPeople || 0;

    // Get values from multiple possible locations for compatibility
    const totalBingoSales = financial.totalBingoSales || 0;
    const totalPullTabSales = financial.pullTabSales || appData.pullTabSales || 0;
    const grossSales = financial.grossSales || 0;

    const bingoPrizes = financial.bingoPrizesPaid || appData.totalBingoPrizes || 0;
    const pullTabPrizes = financial.pullTabPrizesPaid || appData.pullTabPrizes || 0;
    const totalPrizes = financial.totalPrizesPaid || (bingoPrizes + pullTabPrizes) || 0;

    const netProfit = financial.actualProfit || 0;

    const salesPerPlayer = totalPlayers > 0 ? grossSales / totalPlayers : 0;
    const profitPerPlayer = totalPlayers > 0 ? netProfit / totalPlayers : 0;

    return `
    <div class="section">
        <div class="section-title">Financial Summary</div>

        <div class="metrics-grid">
            <div class="metric-card">
                <div class="metric-label">Total Players</div>
                <div class="metric-value">${formatNumber(totalPlayers)}</div>
            </div>
            <div class="metric-card">
                <div class="metric-label">Gross Sales</div>
                <div class="metric-value">${formatCurrency(grossSales)}</div>
                <div class="metric-sub">${formatCurrency(salesPerPlayer)} / player</div>
            </div>
            <div class="metric-card">
                <div class="metric-label">Net Profit</div>
                <div class="metric-value">${formatCurrency(netProfit)}</div>
                <div class="metric-sub">${formatCurrency(profitPerPlayer)} / player</div>
            </div>
        </div>

        <table>
            <tr>
                <th>Category</th>
                <th class="text-right">Amount</th>
            </tr>
            <tr>
                <td>Total Bingo Sales</td>
                <td class="text-right">${formatCurrency(totalBingoSales)}</td>
            </tr>
            <tr>
                <td>Total Pull-Tab Sales</td>
                <td class="text-right">${formatCurrency(totalPullTabSales)}</td>
            </tr>
            <tr class="total-row">
                <td>Gross Sales</td>
                <td class="text-right">${formatCurrency(grossSales)}</td>
            </tr>
            <tr>
                <td>Bingo Prizes</td>
                <td class="text-right">${formatCurrency(bingoPrizes)}</td>
            </tr>
            <tr>
                <td>Pull-Tab Prizes</td>
                <td class="text-right">${formatCurrency(pullTabPrizes)}</td>
            </tr>
            <tr class="total-row">
                <td>Total Prizes</td>
                <td class="text-right">${formatCurrency(totalPrizes)}</td>
            </tr>
            <tr class="total-row" style="background: #c8e6c9 !important;">
                <td><strong>Net Profit</strong></td>
                <td class="text-right"><strong>${formatCurrency(netProfit)}</strong></td>
            </tr>
        </table>
    </div>
    `;
}

function generateBingoSalesSection(appData) {
    const posSales = appData.posSales || {};

    // Categorize items from posSales object
    const electronic = ['small-machine', 'large-machine'];
    const misc = ['dauber'];
    const paper = ['6-face', '9-face-solid', '9-face-stripe', 'birthday-pack',
                   'coverall', 'double-action', 'letter-x', 'number7',
                   '18-face-prog', '3-face-prog'];

    const electronicItems = Object.keys(posSales)
        .filter(key => electronic.includes(key) && posSales[key].quantity > 0)
        .map(key => ({ ...posSales[key], name: posSales[key].name || key }));

    const miscItems = Object.keys(posSales)
        .filter(key => misc.includes(key) && posSales[key].quantity > 0)
        .map(key => ({ ...posSales[key], name: posSales[key].name || key }));

    const paperItems = Object.keys(posSales)
        .filter(key => paper.includes(key) && posSales[key].quantity > 0)
        .map(key => ({ ...posSales[key], name: posSales[key].name || key }));

    return `
    <div class="section">
        <div class="section-title">Bingo Sales Breakdown</div>

        <h4 style="margin-top: 1rem; color: #34495e;">Electronic Bingo</h4>
        <table>
            <tr>
                <th>Item</th>
                <th class="text-right">Price</th>
                <th class="text-right">Quantity</th>
                <th class="text-right">Total</th>
            </tr>
            ${generateDoorSalesRows(electronicItems)}
        </table>

        <h4 style="margin-top: 1.5rem; color: #34495e;">Miscellaneous</h4>
        <table>
            <tr>
                <th>Item</th>
                <th class="text-right">Price</th>
                <th class="text-right">Quantity</th>
                <th class="text-right">Total</th>
            </tr>
            ${generateDoorSalesRows(miscItems)}
        </table>

        <h4 style="margin-top: 1.5rem; color: #34495e;">Paper Bingo</h4>
        <table>
            <tr>
                <th>Item</th>
                <th class="text-right">Price</th>
                <th class="text-right">Quantity</th>
                <th class="text-right">Total</th>
            </tr>
            ${generateDoorSalesRows(paperItems)}
        </table>
    </div>
    `;
}

function generateDoorSalesRows(items) {
    if (!items || items.length === 0) {
        return '<tr><td colspan="4" class="text-center" style="color: #95a5a6;">No items</td></tr>';
    }

    return items.map(item => `
        <tr>
            <td>${item.name || item.item || 'Unknown'}</td>
            <td class="text-right">${formatCurrency(item.price || 0)}</td>
            <td class="text-right">${formatNumber(item.quantity || 0)}</td>
            <td class="text-right">${formatCurrency(item.total || 0)}</td>
        </tr>
    `).join('');
}

function generateSessionGamesSection(appData) {
    const games = appData.games || [];

    if (games.length === 0) {
        return '<div class="section"><div class="section-title">Session Games</div><p style="color: #95a5a6;">No games recorded</p></div>';
    }

    const gameRows = games.map((game, index) => {
        const gameName = (game.name || '').replace(/\s*Edit\s*/g, '').replace(/\n/g, ' ').trim();
        const isPTEvent = gameName.toLowerCase().includes('pot of gold') ||
                         gameName.toLowerCase().includes('pull-tab event') ||
                         gameName.toLowerCase().includes('event game');

        return `
        <tr>
            <td class="text-center">${index + 1}</td>
            <td>${gameName}${isPTEvent ? ' <em>(Not included in Bingo total)</em>' : ''}</td>
            <td class="text-right">${formatCurrency(game.prize || 0)}</td>
            <td class="text-right">${game.winners || 0}</td>
            <td class="text-right">${formatCurrency(game.prizePerWinner || 0)}</td>
            <td class="text-right">${formatCurrency(game.totalPayout || 0)}</td>
            <td class="text-center">${game.checkPayment ? '✓' : ''}</td>
        </tr>
    `}).join('');

    const totalPrizes = games.reduce((sum, g) => {
        const gameName = (g.name || '').toLowerCase();
        const isPTEvent = gameName.includes('pot of gold') ||
                         gameName.includes('pull-tab event') ||
                         gameName.includes('event game');
        return isPTEvent ? sum : sum + (g.totalPayout || 0);
    }, 0);

    return `
    <div class="section">
        <div class="section-title">Session Games</div>
        <table>
            <tr>
                <th class="text-center" style="width: 50px;">#</th>
                <th>Game Name</th>
                <th class="text-right">Prize</th>
                <th class="text-right">Winners</th>
                <th class="text-right">Per Winner</th>
                <th class="text-right">Total</th>
                <th class="text-center">Check</th>
            </tr>
            ${gameRows}
            <tr class="total-row">
                <td colspan="5" class="text-right"><strong>Total Bingo Prizes:</strong></td>
                <td class="text-right"><strong>${formatCurrency(totalPrizes)}</strong></td>
                <td></td>
            </tr>
        </table>
    </div>
    `;
}

function generatePullTabsSection(appData) {
    const pullTabs = appData.pullTabs || [];

    if (pullTabs.length === 0) {
        return '<div class="section"><div class="section-title">Pull-Tabs</div><p style="color: #95a5a6;">No pull-tabs recorded</p></div>';
    }

    const ptRows = pullTabs.map(pt => `
        <tr>
            <td>${pt.gameName || 'Unknown'}</td>
            <td class="text-center">${pt.serialNumber || 'N/A'}</td>
            <td class="text-right">${formatCurrency(pt.price || pt.ticketPrice || 0)}</td>
            <td class="text-right">${formatNumber(pt.tickets || pt.ticketsSold || 0)}</td>
            <td class="text-right">${formatCurrency(pt.sales || 0)}</td>
            <td class="text-right">${formatCurrency(pt.idealProfit || 0)}</td>
            <td class="text-right">${formatCurrency(pt.prizesPaid || 0)}</td>
            <td class="text-right">${formatCurrency(pt.netProfit || 0)}</td>
            <td class="text-center">${pt.checkPayment || pt.paidByCheck ? '✓' : ''}</td>
            <td class="text-center">${pt.isSpecialEvent ? '✓' : ''}</td>
        </tr>
    `).join('');

    const totals = pullTabs.reduce((acc, pt) => {
        acc.sales += pt.sales || 0;
        acc.ideal += pt.idealProfit || 0;
        acc.prizes += pt.prizesPaid || 0;
        acc.net += pt.netProfit || 0;
        return acc;
    }, { sales: 0, ideal: 0, prizes: 0, net: 0 });

    return `
    <div class="section">
        <div class="section-title">Pull-Tab Games</div>
        <table style="font-size: 9pt;">
            <tr>
                <th>Game</th>
                <th class="text-center">Serial #</th>
                <th class="text-right">$/Ticket</th>
                <th class="text-right">Tickets</th>
                <th class="text-right">Sales</th>
                <th class="text-right">Ideal</th>
                <th class="text-right">Prizes</th>
                <th class="text-right">Net</th>
                <th class="text-center">Check</th>
                <th class="text-center">SE</th>
            </tr>
            ${ptRows}
            <tr class="total-row">
                <td colspan="4" class="text-right"><strong>Totals:</strong></td>
                <td class="text-right"><strong>${formatCurrency(totals.sales)}</strong></td>
                <td class="text-right"><strong>${formatCurrency(totals.ideal)}</strong></td>
                <td class="text-right"><strong>${formatCurrency(totals.prizes)}</strong></td>
                <td class="text-right"><strong>${formatCurrency(totals.net)}</strong></td>
                <td colspan="2"></td>
            </tr>
        </table>
    </div>
    `;
}

function generateMoneyCountSection(appData) {
    // Use V2 enhanced financial data for accurate money count
    const financial = appData.financial || {};

    // Bingo drawer calculation
    const bingoStartupCash = financial.bingoStartupCash || 1000;
    const bingoDeposit = financial.bingoDeposit || 0;
    const bingoChecks = appData.moneyCount?.bingo?.checks || 0;
    const bingoCashTotal = bingoDeposit - bingoChecks;

    // Pull-Tab drawer calculation
    const pullTabStartupCash = 0; // Pull-tabs don't have startup cash
    const pullTabDeposit = financial.pullTabNetDeposit || 0;
    const pullTabChecks = appData.moneyCount?.pullTab?.checks || appData.moneyCount?.pulltab?.checks || 0;
    const pullTabCashTotal = pullTabDeposit - pullTabChecks;

    return `
    <div class="section">
        <div class="section-title">Money Count</div>

        <div class="info-grid">
            <div>
                <h4 style="color: #34495e; margin-bottom: 0.5rem;">Bingo Drawer</h4>
                <table>
                    <tr><td>Starting Bank</td><td class="text-right">${formatCurrency(bingoStartupCash)}</td></tr>
                    <tr><td>Cash Total</td><td class="text-right">${formatCurrency(bingoCashTotal)}</td></tr>
                    <tr><td>Checks</td><td class="text-right">${formatCurrency(bingoChecks)}</td></tr>
                    <tr class="total-row"><td>Drawer Total</td><td class="text-right">${formatCurrency(bingoDeposit)}</td></tr>
                </table>
            </div>
            <div>
                <h4 style="color: #34495e; margin-bottom: 0.5rem;">Pull-Tab Drawer</h4>
                <table>
                    <tr><td>Starting Bank</td><td class="text-right">${formatCurrency(pullTabStartupCash)}</td></tr>
                    <tr><td>Cash Total</td><td class="text-right">${formatCurrency(pullTabCashTotal)}</td></tr>
                    <tr><td>Checks</td><td class="text-right">${formatCurrency(pullTabChecks)}</td></tr>
                    <tr class="total-row"><td>Drawer Total</td><td class="text-right">${formatCurrency(pullTabDeposit)}</td></tr>
                </table>
            </div>
        </div>
    </div>
    `;
}

// ============================================
// SMS SUMMARY GENERATION
// ============================================

function generateSMSSummary() {
    const appData = window.app?.data || {};
    const financial = appData.financial || {};
    const occasion = appData.occasion || {};

    const date = occasion.date || 'N/A';
    const session = occasion.sessionType || 'N/A';
    const players = occasion.totalPlayers || occasion.totalPeople || 0;

    // Get values from multiple possible locations for compatibility
    const grossSales = financial.grossSales || 0;
    const bingoSales = financial.totalBingoSales || 0;
    const ptSales = financial.pullTabSales || appData.pullTabSales || 0;

    const bingoPrizes = financial.bingoPrizesPaid || appData.totalBingoPrizes || 0;
    const ptPrizes = financial.pullTabPrizesPaid || appData.pullTabPrizes || 0;
    const totalPrizes = bingoPrizes + ptPrizes;

    const netProfit = financial.actualProfit || 0;
    const profitPerPlayer = players > 0 ? netProfit / players : 0;

    // Create SMS-friendly summary
    const summary = `🎱 RLC Bingo Report
${date} - ${session}

👥 Players: ${formatNumber(players)}

💰 FINANCIAL SUMMARY
Gross Sales: ${formatCurrency(grossSales)}
├─ Bingo: ${formatCurrency(bingoSales)}
└─ Pull-Tabs: ${formatCurrency(ptSales)}

🎁 PRIZES PAID
Total: ${formatCurrency(totalPrizes)}
├─ Bingo: ${formatCurrency(bingoPrizes)}
└─ Pull-Tabs: ${formatCurrency(ptPrizes)}

✅ NET PROFIT: ${formatCurrency(netProfit)}
Per Player: ${formatCurrency(profitPerPlayer)}

Generated: ${new Date().toLocaleString()}`;

    // Show in a modal for copying
    showSMSModal(summary);
}

function showSMSModal(summary) {
    // Remove any existing modal
    const existing = document.getElementById('sms-modal');
    if (existing) {
        existing.remove();
    }

    // Create modal HTML
    const modal = document.createElement('div');
    modal.id = 'sms-modal';
    modal.innerHTML = `
        <style>
            #sms-modal {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.8);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 100000;
                animation: fadeIn 0.2s;
            }
            @keyframes fadeIn {
                from { opacity: 0; }
                to { opacity: 1; }
            }
            .sms-modal-content {
                background: white;
                padding: 2rem;
                border-radius: 12px;
                max-width: 500px;
                width: 90%;
                box-shadow: 0 10px 40px rgba(0,0,0,0.5);
            }
            .sms-modal-header {
                font-size: 1.5rem;
                font-weight: 600;
                color: #2c3e50;
                margin-bottom: 1rem;
                display: flex;
                align-items: center;
                gap: 0.5rem;
            }
            .sms-textarea {
                width: 100%;
                min-height: 350px;
                padding: 1rem;
                border: 2px solid #e0e0e0;
                border-radius: 8px;
                font-family: monospace;
                font-size: 0.9rem;
                line-height: 1.5;
                resize: vertical;
                margin-bottom: 1rem;
            }
            .sms-buttons {
                display: flex;
                gap: 0.5rem;
                justify-content: flex-end;
            }
            .sms-btn {
                padding: 0.75rem 1.5rem;
                border: none;
                border-radius: 6px;
                font-size: 1rem;
                cursor: pointer;
                font-weight: 600;
                transition: transform 0.1s;
            }
            .sms-btn:active {
                transform: scale(0.98);
            }
            .sms-btn-primary {
                background: #1565C0;
                color: white;
            }
            .sms-btn-secondary {
                background: #95a5a6;
                color: white;
            }
            .copy-success {
                position: absolute;
                background: #27ae60;
                color: white;
                padding: 0.5rem 1rem;
                border-radius: 6px;
                font-weight: 600;
                animation: slideDown 0.3s;
            }
            @keyframes slideDown {
                from {
                    opacity: 0;
                    transform: translateY(-20px);
                }
                to {
                    opacity: 1;
                    transform: translateY(0);
                }
            }
        </style>
        <div class="sms-modal-content">
            <div class="sms-modal-header">
                💬 SMS Summary
            </div>
            <textarea class="sms-textarea" id="sms-text" readonly>${summary}</textarea>
            <div class="sms-buttons">
                <button class="sms-btn sms-btn-primary" onclick="copySMSToClipboard()">📋 Copy to Clipboard</button>
                <button class="sms-btn sms-btn-secondary" onclick="closeSMSModal()">Close</button>
            </div>
        </div>
    `;

    document.body.appendChild(modal);

    // Auto-select text
    const textarea = document.getElementById('sms-text');
    if (textarea) {
        textarea.select();
    }
}

function copySMSToClipboard() {
    const textarea = document.getElementById('sms-text');
    if (!textarea) return;

    textarea.select();
    document.execCommand('copy');

    // Show success message
    const button = event.target;
    const originalText = button.textContent;
    button.textContent = '✓ Copied!';
    button.style.background = '#27ae60';

    setTimeout(() => {
        button.textContent = originalText;
        button.style.background = '#1565C0';
    }, 2000);
}

function closeSMSModal() {
    const modal = document.getElementById('sms-modal');
    if (modal) {
        modal.remove();
    }
}

// Make functions globally accessible
window.generatePDFReport = generatePDFReport;
window.generateSMSSummary = generateSMSSummary;
window.copySMSToClipboard = copySMSToClipboard;
window.closeSMSModal = closeSMSModal;
