// Ensure CONFIG is available
if (typeof CONFIG === 'undefined') {
    console.error('CONFIG not available in calculations.js');
    // Define fallback
    window.CONFIG = {
        STORAGE_KEYS: {
            SYNC_QUEUE: 'rlc_sync_queue',
            DRAFT_DATA: 'rlc_draft_data'
        }
    };
}
// All calculation functions
function initializeGameCalculations() {
    // Add event delegation for dynamically added game rows
    document.addEventListener('input', function(e) {
        // Check if it's a winner count input
        if (e.target.classList.contains('winner-count')) {
            const row = e.target.closest('tr');
            if (!row) return;
            
            const winnersInput = e.target;
            const prizePerInput = row.querySelector('.prize-per');
            const gameTotalCell = row.querySelector('.game-total');
            
            if (prizePerInput && gameTotalCell) {
                const winners = parseInt(winnersInput.value) || 1;
                const prizePerWinner = parseFloat(prizePerInput.value) || 0;
                const total = winners * prizePerWinner;
                
                // Update total display
                gameTotalCell.textContent = `$${total.toFixed(2)}`;
                
                // Update the prize per winner for split prizes (non-progressive only)
                if (!prizePerInput.hasAttribute('readonly')) {
                    // For regular games, the prize amount should remain constant
                    // The total changes based on number of winners
                    gameTotalCell.textContent = `$${total.toFixed(2)}`;
                }
                
                // Recalculate overall totals
                calculateTotalBingoPrizes();
            }
        }
        
        // Check if it's a prize per winner input
        if (e.target.classList.contains('prize-per')) {
            const row = e.target.closest('tr');
            if (!row) return;
            
            const winnersInput = row.querySelector('.winner-count');
            const prizePerInput = e.target;
            const gameTotalCell = row.querySelector('.game-total');
            
            if (winnersInput && gameTotalCell) {
                const winners = parseInt(winnersInput.value) || 1;
                const prizePerWinner = parseFloat(prizePerInput.value) || 0;
                const total = winners * prizePerWinner;
                
                gameTotalCell.textContent = `$${total.toFixed(2)}`;
                calculateTotalBingoPrizes();
            }
        }
    });
}

function calculateTotalBingoPrizes() {
    let total = 0;
    let checkTotal = 0;
    
    document.querySelectorAll('.game-total').forEach(cell => {
        const amount = parseFloat(cell.textContent.replace('$', '')) || 0;
        total += amount;
        
        // Check if paid by check
        const row = cell.closest('tr');
        const checkBox = row?.querySelector('.check-payment');
        if (checkBox && checkBox.checked) {
            checkTotal += amount;
        }
    });
    
    // Update display
    const totalElement = document.getElementById('total-bingo-prizes');
    if (totalElement) {
        totalElement.textContent = `$${total.toFixed(2)}`;
    }
    
    // Store in app data
    if (window.app) {
        window.app.data.financial = window.app.data.financial || {};
        window.app.data.financial.bingoPrizesPaid = total;
        window.app.data.financial.prizesPaidByCheck = checkTotal;
    }
}

// addPullTabRow and addSpecialEventRow moved to wizard.js to avoid conflicts

// calculatePullTabRow and calculatePullTabTotals moved to wizard.js to avoid conflicts

function submitOccasion() {
    if (!validateCurrentStep()) return;
    
    if (!window.app) return;
    
    const data = window.app.data;
    
    if (window.app.isOnline) {
        // Submit directly
        fetch(CONFIG.API_URL, {
            method: 'POST',
            body: new URLSearchParams({
                action: 'saveOccasion',
                data: JSON.stringify(data)
            })
        })
        .then(response => response.json())
        .then(result => {
            if (result.success) {
                alert('Occasion saved successfully!');
                localStorage.removeItem(CONFIG.STORAGE_KEYS.DRAFT_DATA);
                window.location.reload();
            } else {
                alert('Error saving occasion: ' + result.error);
            }
        })
        .catch(error => {
            console.error('Submit error:', error);
            addToSyncQueue(data);
        });
    } else {
        addToSyncQueue(data);
        alert('Saved offline. Will sync when connection is restored.');
    }
}

function addToSyncQueue(data) {
    const queue = JSON.parse(localStorage.getItem(CONFIG.STORAGE_KEYS.SYNC_QUEUE) || '[]');
    queue.push({
        action: 'saveOccasion',
        data: data,
        timestamp: new Date().toISOString()
    });
    localStorage.setItem(CONFIG.STORAGE_KEYS.SYNC_QUEUE, JSON.stringify(queue));
}

function saveDraft() {
    console.log('saveDraft() called');
    try {
        if (window.app && typeof window.app.saveDraft === 'function') {
            console.log('Calling window.app.saveDraft()');
            const success = window.app.saveDraft();
            if (success !== false) {
                alert('Draft saved!');
            }
        } else {
            console.error('window.app or window.app.saveDraft not available:', {
                app: !!window.app,
                saveDraftFunction: !!(window.app && window.app.saveDraft)
            });
            alert('Error: App not initialized properly. Please reload the page.');
        }
    } catch (error) {
        console.error('Error in saveDraft():', error);
        alert('Error saving draft: ' + error.message);
    }
}

function printReport() {
    window.print();
}

function exportData() {
    if (!window.app) return;
    
    const data = window.app.data;
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bingo-occasion-${data.occasion?.date || 'draft'}.json`;
    a.click();
    URL.revokeObjectURL(url);
}
