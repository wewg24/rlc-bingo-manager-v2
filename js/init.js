// init.js - Complete Initialization Fix v12.4.0
// This file ensures proper initialization order and fixes all missing references
// Add as a new file and include AFTER all other scripts in index.html

(function() {
    'use strict';

    console.log('RLC Bingo Manager - Initializing v12.4.0');

    // Helper function: Load data via JSONP to avoid CORS issues
    function loadViaJSONP(url) {
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

    // 1. ENSURE BINGO APP IS INSTANTIATED
    function ensureAppExists() {
        if (!window.app || !(window.app instanceof BingoApp)) {
            console.log('Creating BingoApp instance...');
            window.app = new BingoApp();
        }
        return window.app;
    }
    
    async function initializePullTabLibrary() {
        try {
            // Use JSONP to avoid CORS issues
            const data = await loadViaJSONP(CONFIG.API_URL + '?action=getPullTabsLibrary');
            
            if (data.success && data.games) {
                // Handle both array and object formats from backend
                window.pullTabLibrary = data.games.map(game => {
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
                        return {
                            name: game.Game || game.name,
                            form: game.Form || game.form,
                            count: game[' Count '] || game.Count || game.count || 0,
                            price: game.Price || game.price || 1,
                            profit: game.IdealProfit || game.idealProfit || game.profit || 0,
                            url: game.URL || game.url || '',
                            identifier: `${game.Game || game.name}_${game.Form || game.form}`
                        };
                    }
                });
                
                // Also set it on the app instance
                if (window.app) {
                    window.app.pullTabLibrary = window.pullTabLibrary;
                }
                
                console.log(`Pull-tab library loaded: ${window.pullTabLibrary.length} games`);
            }
        } catch (error) {
            console.error('Error loading pull-tab library:', error);
            // Use defaults if load fails
            window.pullTabLibrary = [
                { name: 'Beat the Clock 599', form: '7724H', count: 960, price: 1, profit: 361, identifier: 'Beat the Clock 599_7724H' },
                { name: 'Black Jack 175', form: '6916M', count: 250, price: 1, profit: 75, identifier: 'Black Jack 175_6916M' }
            ];
        }
    }
    
    // 3. POPULATE PAPER SALES TABLE
    function initializePaperSalesTable() {
        const tbody = document.querySelector('#step-2 tbody, #paper-sales-body');
        if (!tbody) return;
        
        const paperTypes = [
            { id: 'eb', name: 'Early Bird', price: 5, hasFree: true },
            { id: '6f', name: 'Six Face', price: 10, hasFree: true },
            { id: '9f', name: 'Nine Face Solid', price: 15, hasFree: false },
            { id: '9fs', name: 'Nine Face Stripe', price: 10, hasFree: false },
            { id: '3f', name: 'Three Face', price: 1, hasFree: false },
            { id: '18f', name: 'Eighteen Face', price: 5, hasFree: false }
        ];
        
        tbody.innerHTML = '';
        paperTypes.forEach(type => {
            const row = tbody.insertRow();
            row.innerHTML = `
                <td>${type.name}</td>
                <td><input type="number" id="${type.id}-start" min="0" value="0"></td>
                <td>${type.hasFree ? `<input type="number" id="${type.id}-free" readonly value="0">` : '-'}</td>
                <td><input type="number" id="${type.id}-end" min="0" value="0"></td>
                <td id="${type.id}-sold">0</td>
            `;
            
            // Add event listeners for calculations
            row.querySelectorAll('input[type="number"]:not([readonly])').forEach(input => {
                input.addEventListener('input', () => calculatePaperSold(type.id, type.hasFree));
            });
        });
    }
    
    // 4. POPULATE POS DOOR SALES TABLE
    function initializePOSSalesTable() {
        const container = document.querySelector('#pos-sales-container, #step-2 .pos-sales');
        if (!container) return;
        
        const posItems = [
            // Miscellaneous
            { id: 'dauber', name: 'Dauber', price: 2, category: 'Miscellaneous' },
            // Paper (alphabetical)
            { id: 'birthday', name: 'Birthday Pack', price: 0, category: 'Paper' },
            { id: 'coverall', name: 'Coverall Extra', price: 1, category: 'Paper' },
            { id: 'double-action', name: 'Early Bird Double', price: 5, category: 'Paper' },
            { id: 'letter-x', name: 'Letter X Extra', price: 1, category: 'Paper' },
            { id: 'number7', name: 'Number 7 Extra', price: 1, category: 'Paper' },
            { id: '18-face-prog', name: 'Progressive 18 Face', price: 5, category: 'Paper' },
            { id: '3-face-prog', name: 'Progressive 3 Face', price: 1, category: 'Paper' }
        ];
        
        // Create table if it doesn't exist
        let table = container.querySelector('table');
        if (!table) {
            table = document.createElement('table');
            table.className = 'pos-sales-table';
            container.appendChild(table);
        }
        
        let tbody = table.querySelector('tbody');
        if (!tbody) {
            const thead = document.createElement('thead');
            thead.innerHTML = `
                <tr>
                    <th>Item</th>
                    <th>Price</th>
                    <th>Quantity</th>
                    <th>Total</th>
                </tr>
            `;
            table.appendChild(thead);
            tbody = document.createElement('tbody');
            table.appendChild(tbody);
        }
        
        tbody.innerHTML = '';
        posItems.forEach(item => {
            const row = tbody.insertRow();
            row.innerHTML = `
                <td>${item.name}</td>
                <td>$${item.price.toFixed(2)}</td>
                <td><input type="number" id="${item.id}-qty" min="0" value="0"></td>
                <td id="${item.id}-total">$0.00</td>
            `;
            
            const input = row.querySelector('input');
            input.addEventListener('input', () => calculatePOSTotal(item.id, item.price));
        });
        
        // Add total row
        const totalRow = tbody.insertRow();
        totalRow.innerHTML = `
            <td colspan="3"><strong>Total Paper Sales</strong></td>
            <td id="total-paper-sales"><strong>$0.00</strong></td>
        `;
    }
    
    // 5. CALCULATION FUNCTIONS
    function calculatePaperSold(typeId, hasFree) {
        const start = parseInt(document.getElementById(`${typeId}-start`)?.value) || 0;
        const end = parseInt(document.getElementById(`${typeId}-end`)?.value) || 0;
        const free = hasFree ? parseInt(document.getElementById(`${typeId}-free`)?.value) || 0 : 0;
        
        const sold = Math.max(0, start - end - free);
        const soldElement = document.getElementById(`${typeId}-sold`);
        if (soldElement) {
            soldElement.textContent = sold;
        }
    }
    
    function calculatePOSTotal(itemId, price) {
        const qty = parseInt(document.getElementById(`${itemId}-qty`)?.value) || 0;
        const total = qty * price;
        
        const totalElement = document.getElementById(`${itemId}-total`);
        if (totalElement) {
            totalElement.textContent = `$${total.toFixed(2)}`;
        }
        
        // Update grand total
        let grandTotal = 0;
        document.querySelectorAll('[id$="-total"]:not(#total-paper-sales)').forEach(el => {
            grandTotal += parseFloat(el.textContent.replace('$', '')) || 0;
        });
        
        const grandTotalElement = document.getElementById('total-paper-sales');
        if (grandTotalElement) {
            grandTotalElement.innerHTML = `<strong>$${grandTotal.toFixed(2)}</strong>`;
        }
    }
    
    // 6. LOAD SESSION GAMES
    async function loadSessionGames(sessionType) {
        if (!sessionType) return;
        
        const tbody = document.querySelector('#games-body, #step-3 tbody');
        if (!tbody) return;
        
        try {
            // Use JSONP to avoid CORS issues
            const data = await loadViaJSONP(CONFIG.API_URL + '?action=getSessionGames&sessionType=' + sessionType);
            
            if (data.success && data.games) {
                renderGamesTable(tbody, data.games);
            }
        } catch (error) {
            console.error('Error loading session games:', error);
            // Use default games
            renderGamesTable(tbody, getDefaultGames(sessionType));
        }
    }
    
    function renderGamesTable(tbody, games) {
        tbody.innerHTML = '';
        games.forEach(game => {
            const row = tbody.insertRow();
            row.className = game.progressive ? 'progressive-row' : '';
            
            row.innerHTML = `
                <td>${game.num}</td>
                <td>${game.color}</td>
                <td>${game.game}</td>
                <td>$<span class="game-prize">${game.progressive ? '0' : game.prize}</span></td>
                <td><input type="number" class="winner-count" value="1" min="0" data-game="${game.num}"></td>
                <td>$<input type="number" class="prize-per" value="${game.progressive ? '0' : game.prize}" 
                    ${game.progressive ? 'readonly' : ''} data-game="${game.num}"></td>
                <td class="game-total">$${game.progressive ? '0.00' : game.prize + '.00'}</td>
                <td><input type="checkbox" class="check-payment" data-game="${game.num}"></td>
            `;
            
            // Add event listeners
            const winnersInput = row.querySelector('.winner-count');
            const prizeInput = row.querySelector('.prize-per');
            
            winnersInput.addEventListener('input', () => calculateGameTotal(row));
            if (!game.progressive) {
                prizeInput.addEventListener('input', () => calculateGameTotal(row));
            }
        });
        
        // Add total row
        const totalRow = tbody.insertRow();
        totalRow.innerHTML = `
            <td colspan="6"><strong>Total Bingo Prizes</strong></td>
            <td colspan="2" id="total-bingo-prizes"><strong>$0.00</strong></td>
        `;
    }
    
    function calculateGameTotal(row) {
        const winners = parseInt(row.querySelector('.winner-count').value) || 0;
        const prizePerWinner = parseFloat(row.querySelector('.prize-per').value) || 0;
        const total = winners * prizePerWinner;
        
        row.querySelector('.game-total').textContent = `$${total.toFixed(2)}`;
        
        // Update total
        let grandTotal = 0;
        document.querySelectorAll('.game-total').forEach(cell => {
            grandTotal += parseFloat(cell.textContent.replace('$', '')) || 0;
        });
        
        const totalElement = document.getElementById('total-bingo-prizes');
        if (totalElement) {
            totalElement.innerHTML = `<strong>$${grandTotal.toFixed(2)}</strong>`;
        }
    }
    
    function getDefaultGames(sessionType) {
        const defaults = {
            '5-1': [
                {num: 1, color: 'Early Bird', game: 'Hard Way Bingo', prize: 100},
                {num: 2, color: 'Blue', game: 'Regular Bingo', prize: 100},
                {num: 3, color: 'Pink', game: 'Letter X', prize: 100},
                {num: 4, color: 'Purple', game: 'Diamond', prize: 100},
                {num: 5, color: 'Yellow', game: 'Picture Frame', prize: 100}
            ]
        };
        return defaults[sessionType] || defaults['5-1'];
    }
    
    // 7. MAIN INITIALIZATION
    window.addEventListener('DOMContentLoaded', async function() {
        // Ensure app exists
        const app = ensureAppExists();
        
        // Load pull-tab library first
        await initializePullTabLibrary();
        
        // Initialize all tables
        initializePaperSalesTable();
        initializePOSSalesTable();
        
        // Load session games if session is selected
        const sessionType = document.getElementById('session-type')?.value;
        if (sessionType) {
            await loadSessionGames(sessionType);
        }
        
        // Add session type change listener
        document.getElementById('session-type')?.addEventListener('change', (e) => {
            loadSessionGames(e.target.value);
        });
        
        // Birthday BOGO calculation
        document.getElementById('birthdays')?.addEventListener('input', (e) => {
            const count = parseInt(e.target.value) || 0;
            document.getElementById('eb-free').value = count * 2;
            document.getElementById('6f-free').value = count * 1;
            document.getElementById('birthday-qty').value = count;
            calculatePaperSold('eb', true);
            calculatePaperSold('6f', true);
            calculatePOSTotal('birthday', 0);
        });
        
        console.log('RLC Bingo Manager initialized successfully');
    });
    
})();
