// wizard.js - Complete implementation with all fixes
// Version 12.5.0 - Tabbed interface with auto-save

// ============================================
// LOADING SPINNER FUNCTIONS
// ============================================

function showLoading(message = 'Loading...') {
    const overlay = document.getElementById('loading-overlay');
    const messageEl = document.getElementById('loading-message');

    if (overlay) {
        if (messageEl) {
            messageEl.textContent = message;
        }
        overlay.classList.add('active');
        // Disable all inputs to prevent interaction
        document.querySelectorAll('input, select, textarea, button').forEach(el => {
            el.dataset.wasDisabled = el.disabled;
            el.disabled = true;
        });
    }
}

function hideLoading() {
    const overlay = document.getElementById('loading-overlay');

    if (overlay) {
        overlay.classList.remove('active');
        // Re-enable inputs
        document.querySelectorAll('input, select, textarea, button').forEach(el => {
            if (el.dataset.wasDisabled === 'false' || !el.dataset.wasDisabled) {
                el.disabled = false;
            }
            delete el.dataset.wasDisabled;
        });
    }
}

// Make globally accessible
window.showLoading = showLoading;
window.hideLoading = hideLoading;

// ============================================
// TAB NAVIGATION FUNCTIONS
// ============================================

function switchToTab(tabNumber) {
    console.log('Switching to tab:', tabNumber);

    // Save current tab data before switching
    if (window.app && window.app.currentStep) {
        saveStepData();
    }

    // Update current step
    if (window.app) {
        window.app.currentStep = tabNumber;
    }

    // Hide all wizard steps
    document.querySelectorAll('.wizard-step').forEach(step => {
        step.classList.remove('active');
    });

    // Show selected step
    const targetStep = document.getElementById(`step-${tabNumber}`);
    if (targetStep) {
        targetStep.classList.add('active');
    }

    // Update tab button states
    document.querySelectorAll('.tab-button').forEach(btn => {
        btn.classList.remove('active');
        if (parseInt(btn.getAttribute('data-tab')) === tabNumber) {
            btn.classList.add('active');
        }
    });

    // Load data for the new tab
    loadStepData();

    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Make switchToTab globally accessible
window.switchToTab = switchToTab;

// ============================================
// SAVE DRAFT FUNCTION
// ============================================

function saveDraft() {
    console.log('💾 Saving draft...');

    // Show loading spinner
    if (typeof showLoading === 'function') {
        showLoading('Saving draft...');
    }

    try {
        // Save current tab first
        const currentTab = window.app?.currentStep || 1;

        // Save ALL tabs' data by calling save for each step
        console.log('Saving all tabs data...');
        const originalStep = window.app.currentStep;

        // Save each tab's data
        [1, 2, 3, 4, 5].forEach(step => {
            window.app.currentStep = step;
            saveStepData();
        });

        // Restore current step
        window.app.currentStep = originalStep;

        // Get occasion date for key
        const occasionDate = document.getElementById('occasion-date')?.value;

        if (!occasionDate) {
            if (typeof hideLoading === 'function') {
                hideLoading();
            }
            alert('Please select a date before saving draft');
            return;
        }

        // Save to localStorage with date as key
        const draftKey = `rlc_draft_${occasionDate}`;
        const draftData = {
            ...window.app.data,
            savedAt: new Date().toISOString(),
            status: 'draft'
        };

        console.log('Draft data being saved:', draftData);

        localStorage.setItem(draftKey, JSON.stringify(draftData));
        localStorage.setItem(CONFIG.STORAGE_KEYS.DRAFT_DATA, JSON.stringify(draftData));

        // Hide loading spinner
        if (typeof hideLoading === 'function') {
            hideLoading();
        }

        // Show success notification
        if (window.showNotification) {
            window.showNotification('Draft saved successfully', 'success');
        } else {
            alert('✅ Draft saved successfully');
        }

        console.log('Draft saved to localStorage:', draftKey);

    } catch (error) {
        console.error('Error saving draft:', error);

        // Hide loading spinner on error
        if (typeof hideLoading === 'function') {
            hideLoading();
        }

        alert('❌ Error saving draft: ' + error.message);
    }
}

// Make saveDraft globally accessible
window.saveDraft = saveDraft;

// ============================================
// SAVE TO BACKEND (SERVER)
// ============================================

async function saveToBackend() {
    console.log('💾 Saving to backend...');

    // Show loading spinner
    if (typeof showLoading === 'function') {
        showLoading('Saving to server...');
    }

    try {
        // Save current tab first
        const currentTab = window.app?.currentStep || 1;

        // Save ALL tabs' data by calling save for each step
        console.log('Saving all tabs data...');
        const originalStep = window.app.currentStep;

        // Save each tab's data
        [1, 2, 3, 4, 5].forEach(step => {
            window.app.currentStep = step;
            saveStepData();
        });

        // Restore current step
        window.app.currentStep = originalStep;

        // CRITICAL: Recalculate financial totals after all saves (to fix values overwritten by old calculateComprehensiveFinancials)
        if (typeof calculateFinalTotals === 'function') {
            console.log('📊 Recalculating financial totals before backend save...');
            calculateFinalTotals();
        }

        // Get occasion date for validation
        const occasionDate = document.getElementById('occasion-date')?.value;

        if (!occasionDate) {
            if (typeof hideLoading === 'function') {
                hideLoading();
            }
            alert('Please select a date before saving to server');
            return;
        }

        // Check if occasion already exists on backend
        console.log('Checking for existing occasion on backend...');
        const checkUrl = `${CONFIG.API_URL}?action=checkOccasionByDate&date=${occasionDate}`;

        // Use JSONP to check
        const callbackName = 'saveCheckCallback_' + Date.now();
        let existingStatus = null;

        await new Promise((resolve, reject) => {
            const script = document.createElement('script');

            window[callbackName] = function(response) {
                if (response.exists && response.status) {
                    existingStatus = response.status;
                }
                // Clean up immediately after callback
                delete window[callbackName];
                if (script.parentNode) {
                    script.parentNode.removeChild(script);
                }
                resolve();
            };

            script.src = `${checkUrl}&callback=${callbackName}`;
            script.onerror = () => {
                delete window[callbackName];
                if (script.parentNode) {
                    script.parentNode.removeChild(script);
                }
                resolve(); // Continue even if check fails
            };
            document.head.appendChild(script);

            // Failsafe cleanup after 10 seconds
            setTimeout(() => {
                if (window[callbackName]) {
                    delete window[callbackName];
                    resolve();
                }
                if (script.parentNode) {
                    script.parentNode.removeChild(script);
                }
            }, 10000);
        });

        // Warn if overwriting non-draft
        if (existingStatus && existingStatus !== 'draft') {
            const confirmOverwrite = confirm(
                `⚠️ An occasion for ${occasionDate} already exists with status "${existingStatus}".\n\n` +
                `Saving will overwrite it. Continue?`
            );

            if (!confirmOverwrite) {
                if (typeof hideLoading === 'function') {
                    hideLoading();
                }
                return;
            }
        }

        // Prepare save data with explicit draft status
        const saveData = {
            ...window.app.data,
            status: 'draft',  // Explicitly set as draft
            modified: new Date().toISOString()
        };

        console.log('Saving to backend with data:', saveData);

        // Submit to backend
        const response = await fetch(CONFIG.API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: new URLSearchParams({
                action: 'saveOccasion',
                data: JSON.stringify(saveData)
            })
        });

        const result = await response.json();

        // Hide loading spinner
        if (typeof hideLoading === 'function') {
            hideLoading();
        }

        if (result.success) {
            // Save the returned ID to prevent duplicate saves
            if (result.data && result.data.id) {
                if (!window.app.data.id) {
                    console.log('Saving returned occasion ID:', result.data.id);
                    window.app.data.id = result.data.id;
                    // Also save to localStorage
                    try {
                        localStorage.setItem('rlcBingoOccasionData', JSON.stringify(window.app.data));
                    } catch (e) {
                        console.warn('Could not update localStorage with new ID:', e);
                    }
                }
            }

            // Show success notification
            if (window.showNotification) {
                window.showNotification('✅ Saved to server successfully!', 'success');
            } else {
                alert('✅ Saved to server successfully!');
            }

            console.log('Backend save successful:', result);
        } else {
            throw new Error(result.message || 'Save failed');
        }

    } catch (error) {
        console.error('Error saving to backend:', error);

        // Hide loading spinner on error
        if (typeof hideLoading === 'function') {
            hideLoading();
        }

        alert('❌ Error saving to server: ' + error.message);
    }
}

// Make saveToBackend globally accessible
window.saveToBackend = saveToBackend;

// ============================================
// CHECK EXISTING OCCASION ON DATE CHANGE
// ============================================

async function checkExistingOccasion() {
    const selectedDate = document.getElementById('occasion-date')?.value;

    if (!selectedDate) {
        return;
    }

    console.log('📅 Checking for existing occasion on:', selectedDate);

    // Show loading spinner
    showLoading('Checking for existing occasion...');

    try {
        // First, check localStorage for draft
        const draftKey = `rlc_draft_${selectedDate}`;
        const localDraft = localStorage.getItem(draftKey);

        if (localDraft) {
            console.log('Found local draft for', selectedDate);
            const draftData = JSON.parse(localDraft);

            // Show loading message for data loading
            showLoading('Loading draft data...');

            // Auto-load draft without confirmation
            loadOccasionData(draftData);
            console.log('✅ Draft loaded automatically');

            // Hide spinner after short delay to show data is loaded
            setTimeout(() => hideLoading(), 500);
            return;
        }

        // Check backend for submitted/finalized occasions
        console.log('Checking backend for existing occasion...');
        const apiUrl = `${CONFIG.API_URL}?action=checkOccasionByDate&date=${selectedDate}`;

        // Use JSONP for backend call
        window.tempOccasionData = null;
        const callbackName = 'occasionCheckCallback_' + Date.now();

        window[callbackName] = function(response) {
            console.log('Backend response:', response);

            if (response.exists) {
                // Store data temporarily
                window.tempOccasionData = response.data;

                // Hide loading spinner before showing modal
                hideLoading();

                // Show modal based on status
                const modal = document.getElementById('existing-occasion-modal');
                const message = document.getElementById('modal-message');

                if (response.status === 'submitted') {
                    message.textContent = `A submitted occasion exists for ${selectedDate}. Would you like to load it?`;
                    modal.style.display = 'flex';
                } else if (response.status === 'finalized') {
                    message.textContent = `This occasion has been finalized by admin. It will be loaded in read-only mode.`;
                    modal.style.display = 'flex';
                    // Will load as read-only
                    window.isReadOnlyMode = true;
                } else if (response.status === 'draft') {
                    // Show loading message for data loading
                    showLoading('Loading draft data...');

                    // Auto-load server draft
                    loadOccasionData(response.data);

                    // Hide spinner after short delay
                    setTimeout(() => hideLoading(), 500);
                }
            } else {
                // No occasion found, hide spinner
                hideLoading();
            }

            // Cleanup
            delete window[callbackName];
        };

        const script = document.createElement('script');
        script.src = `${apiUrl}&callback=${callbackName}`;
        script.onerror = function() {
            console.log('Backend check not available, using localStorage only');
            hideLoading();
            delete window[callbackName];
        };
        document.head.appendChild(script);

        // Timeout fallback to hide spinner
        setTimeout(() => {
            script.remove();
            hideLoading();
        }, 5000);

    } catch (error) {
        console.error('Error checking existing occasion:', error);
        hideLoading();
    }
}

// Make checkExistingOccasion globally accessible
window.checkExistingOccasion = checkExistingOccasion;

// ============================================
// LOAD OCCASION DATA
// ============================================

function loadOccasionData(data) {
    console.log('Loading occasion data:', data);

    if (!data) return;

    // V2 Enhancement: Convert V1 format to V2 if needed
    if (typeof window.isV1Format === 'function' && window.isV1Format(data)) {
        console.log('🔄 V1 format detected - converting to V2');
        data = window.convertV1ToV2(data);
        console.log('✅ Converted to V2 format:', data);
    }

    // Store in app.data FIRST - this is critical for loadStepData() to work
    if (window.app) {
        window.app.data = {...data};
    }

    // Load Occasion Info (Step 1)
    if (data.occasion) {
        if (data.occasion.date) document.getElementById('occasion-date').value = data.occasion.date;
        if (data.occasion.sessionType) document.getElementById('session-type').value = data.occasion.sessionType;
        if (data.occasion.lionInCharge) document.getElementById('lion-charge').value = data.occasion.lionInCharge;
        if (data.occasion.lionPullTabs) document.getElementById('pt-lion').value = data.occasion.lionPullTabs;
        if (data.occasion.totalPlayers) document.getElementById('total-people').value = data.occasion.totalPlayers;
        // V2: Handle both birthdays (V1) and birthdayBOGOs (V2)
        const birthdayValue = data.occasion.birthdayBOGOs || data.occasion.birthdays || 0;
        if (birthdayValue) document.getElementById('birthdays').value = birthdayValue;
    }

    // Load Progressive data (V2: from occasion.progressive, V1: from root progressive)
    const progressive = data.occasion?.progressive || data.progressive;
    if (progressive) {
        if (progressive.jackpot) document.getElementById('prog-jackpot').value = progressive.jackpot;
        if (progressive.ballsNeeded) document.getElementById('prog-balls').value = progressive.ballsNeeded;
        if (progressive.consolation) document.getElementById('prog-consolation').value = progressive.consolation;
        // actualBalls, actualPrize, and checkPayment are now handled in the Game Results tab
    }

    // Load ALL tabs' data by switching to each tab
    // Save current tab
    const currentTab = window.app?.currentStep || 1;

    // Load data for each tab by temporarily switching to it
    const tabs = [1, 2, 3, 4, 5, 6]; // All tab numbers
    tabs.forEach(tabNum => {
        if (window.app) {
            window.app.currentStep = tabNum;
        }
        loadStepData();
    });

    // Restore original tab
    if (window.app) {
        window.app.currentStep = currentTab;
    }
    switchToTab(currentTab);

    // Recalculate financial totals for Review tab
    if (typeof calculateFinalTotals === 'function') {
        calculateFinalTotals();
    }

    // Update Performance Metrics
    if (typeof updatePerformanceMetrics === 'function') {
        updatePerformanceMetrics();
    }

    console.log('✅ Occasion data loaded successfully');
}

// Make loadOccasionData globally accessible
window.loadOccasionData = loadOccasionData;

// ============================================
// MODAL HANDLERS
// ============================================

function loadExistingOccasion() {
    if (window.tempOccasionData) {
        loadOccasionData(window.tempOccasionData);

        // If read-only mode, disable all inputs
        if (window.isReadOnlyMode) {
            setReadOnlyMode(true);
        }
    }
    closeExistingOccasionModal();
}

function closeExistingOccasionModal() {
    const modal = document.getElementById('existing-occasion-modal');
    if (modal) {
        modal.style.display = 'none';
    }

    // Clear date if user cancels
    if (!window.tempOccasionData) {
        document.getElementById('occasion-date').value = '';
    }

    window.tempOccasionData = null;
    window.isReadOnlyMode = false;
}

function setReadOnlyMode(readOnly) {
    // Disable all inputs, selects, and textareas
    document.querySelectorAll('input, select, textarea').forEach(element => {
        element.disabled = readOnly;
    });

    // Hide Save Draft and Submit buttons
    document.querySelectorAll('.save-draft-btn, button[onclick="submitOccasion()"]').forEach(btn => {
        btn.style.display = readOnly ? 'none' : '';
    });

    // Show finalized banner
    if (readOnly) {
        const banner = document.createElement('div');
        banner.id = 'finalized-banner';
        banner.style.cssText = 'background: #f39c12; color: white; padding: 1rem; text-align: center; font-weight: bold; position: sticky; top: 0; z-index: 1000;';
        banner.textContent = '⚠️ This occasion has been finalized by admin and is read-only';
        document.querySelector('.wizard-container').prepend(banner);
    }
}

// Make modal functions globally accessible
window.loadExistingOccasion = loadExistingOccasion;
window.closeExistingOccasionModal = closeExistingOccasionModal;
window.setReadOnlyMode = setReadOnlyMode;

// ============================================
// STEP NAVIGATION FUNCTIONS (Legacy - kept for compatibility)
// ============================================

function nextStep() {
    // Validate current step before proceeding
    if (!validateCurrentStep()) {
        return false;
    }

    // Show loading during step processing
    if (window.showLoading) {
        window.showLoading({
            text: 'Processing Step',
            subtext: 'Saving data and advancing...',
            timeout: 10000
        });
    }

    try {
        // Save current step data
        saveStepData();

        // Move to next step if not at the end
        if (window.app && window.app.currentStep < window.app.totalSteps) {
            window.app.currentStep++;
            updateStepDisplay();
            loadStepData(); // Load any saved data for the new step
        }
    } catch (error) {
        console.error('Error in nextStep:', error);
        if (window.hideLoading) window.hideLoading();
        alert('Error processing step: ' + error.message);
        return;
    }

    // Hide loading after brief delay
    if (window.hideLoading) {
        setTimeout(() => window.hideLoading(), 800);
    }
}

function previousStep() {
    if (window.app && window.app.currentStep > 1) {
        saveStepData(); // Save before going back
        window.app.currentStep--;
        updateStepDisplay();
        loadStepData();
    }
}

function goToStep(step) {
    if (step >= 1 && step <= window.app.totalSteps) {
        saveStepData();
        window.app.currentStep = step;
        updateStepDisplay();
        loadStepData();
    }
}

// ============================================
// DISPLAY UPDATE FUNCTIONS
// ============================================

function updateStepDisplay() {
    // Hide all step contents
    document.querySelectorAll('.wizard-step').forEach(content => {
        content.classList.remove('active');
    });
    
    // Show current step content
    const currentContent = document.getElementById(`step-${window.app.currentStep}`);
    if (currentContent) {
        currentContent.classList.add('active');
    }
    
    // Update step indicators
    document.querySelectorAll('.step').forEach((indicator, index) => {
        const stepNum = index + 1;
        indicator.classList.remove('active', 'completed');
        
        if (stepNum === window.app.currentStep) {
            indicator.classList.add('active');
        } else if (stepNum < window.app.currentStep) {
            indicator.classList.add('completed');
        }
    });
    
    // Update navigation buttons
    const prevBtn = document.querySelector('.prev-button, button[onclick="previousStep()"]');
    const nextBtn = document.querySelector('.next-button, button[onclick="nextStep()"]');

    if (prevBtn) {
        if (window.app.currentStep === 1) {
            prevBtn.style.display = 'none';
            prevBtn.disabled = true;
        } else {
            prevBtn.style.display = 'inline-block';
            prevBtn.disabled = false;
            prevBtn.style.opacity = '1';
            prevBtn.style.cursor = 'pointer';
        }
    }
    
    if (nextBtn) {
        if (window.app.currentStep === window.app.totalSteps) {
            nextBtn.textContent = 'Complete';
            nextBtn.setAttribute('onclick', 'submitOccasion()');
        } else {
            nextBtn.textContent = 'Next';
            nextBtn.setAttribute('onclick', 'nextStep()');
        }
    }
}

// ============================================
// VALIDATION FUNCTIONS
// ============================================

function validateCurrentStep() {
    const currentStepNum = window.app ? window.app.currentStep : 1;
    
    switch(currentStepNum) {
        case 1: // Occasion Info
            return validateOccasionInfo();
        case 2: // Paper Sales
            return validatePaperSales();
        case 3: // Game Results
            return validateGameResults();
        case 4: // Pull-Tabs
            return true; // Optional step
        case 5: // Money Count
            return validateMoneyCount();
        case 6: // Review
            return true;
        default:
            return true;
    }
}

function validateOccasionInfo() {
    const date = document.getElementById('occasion-date')?.value;
    const session = document.getElementById('session-type')?.value;
    const lion = document.getElementById('lion-charge')?.value;
    const totalPeople = document.getElementById('total-people')?.value;
    
    if (!date || !session || !lion || !totalPeople) {
        showValidationError('Please fill in all required occasion information');
        return false;
    }
    
    console.log('Occasion info validation passed');
    return true;
}

function validatePaperSales() {
    // Basic validation - ensure at least some manual count items have been entered
    let hasValidEntry = false;

    CONFIG.MANUAL_COUNT_ITEMS.forEach(type => {
        const startInput = document.getElementById(`${type.id}-start`);
        const endInput = document.getElementById(`${type.id}-end`);

        if (startInput && endInput) {
            const start = parseInt(startInput.value) || 0;
            const end = parseInt(endInput.value) || 0;

            if (start > 0 || end > 0) {
                hasValidEntry = true;
            }
        }
    });
    
    return true; // Allow proceeding even without sales for testing
}

function validateGameResults() {
    // Ensure all games have valid winner counts
    const winnerInputs = document.querySelectorAll('.winner-count');
    
    for (let input of winnerInputs) {
        const value = parseInt(input.value);
        if (isNaN(value) || value < 0) {
            showValidationError('All games must have valid winner counts (0 or more).');
            return false;
        }
    }
    
    return true;
}

function validateMoneyCount() {
    // Money count is optional for now
    return true;
}

// ============================================
// SAVE FUNCTIONS
// ============================================

function saveStepData() {
    if (!window.app) return;

    switch (window.app.currentStep) {
        case 1:
            saveOccasionInfo();
            break;
        case 2:
            savePaperSales();
            break;
        case 3:
            saveGameResults();
            break;
        case 4:
            savePullTabs();
            break;
        case 5:
            saveMoneyCount();
            break;
    }

    // Note: Removed recursive saveDraft() call to prevent infinite loop
    // saveDraft() now explicitly saves all tabs when called
}

function saveOccasionInfo() {
    const sessionTypeKey = document.getElementById('session-type')?.value;
    const sessionTypeLabel = CONFIG.SESSION_TYPES[sessionTypeKey] || sessionTypeKey;

    window.app.data.occasion = {
        date: document.getElementById('occasion-date')?.value,
        sessionType: sessionTypeKey, // Backend expects the session code (5-1, 6-2, etc.)
        lionInCharge: document.getElementById('lion-charge')?.value,
        lionPullTabs: document.getElementById('pt-lion')?.value,  // Lion in Charge of Pull-Tabs
        totalPlayers: parseInt(document.getElementById('total-people')?.value) || 0, // Backend expects 'totalPlayers'
        birthdays: parseInt(document.getElementById('birthdays')?.value) || 0,
        createdBy: 'Mobile Entry' // Backend expects this field
    };

    // Progressive data structure aligned with backend expectations
    window.app.data.progressive = {
        jackpot: parseFloat(document.getElementById('prog-jackpot')?.value) || 0,
        ballsNeeded: parseInt(document.getElementById('prog-balls')?.value) || 0,
        consolation: parseFloat(document.getElementById('prog-consolation')?.value) || 200
        // actualBalls, actualPrize, and checkPayment are now saved per-game in saveGameResults()
    };
}

function savePaperSales() {
    // Ensure complete data structure exists
    if (!window.app || !window.app.data) {
        console.error('window.app.data not initialized');
        return;
    }

    // Initialize missing data objects
    if (!window.app.data.paperBingo) {
        console.log('Initializing paperBingo object');
        window.app.data.paperBingo = {};
    }
    if (!window.app.data.posSales) {
        console.log('Initializing posSales object');
        window.app.data.posSales = {};
    }
    if (!window.app.data.electronic) {
        console.log('Initializing electronic object');
        window.app.data.electronic = {};
    }

    // Save physical counts inventory (using PAPER_TYPES for correct ID matching)
    console.log('Saving physical counts...');
    if (CONFIG.PAPER_TYPES && Array.isArray(CONFIG.PAPER_TYPES)) {
        CONFIG.PAPER_TYPES.forEach(type => {
            try {
                // Validate type object has required properties
                if (!type || !type.id) {
                    console.warn('Invalid PAPER_TYPES entry:', type);
                    return;
                }

                // IDs are in format "paper-{id}-start" as created by loadPaperSales
                const start = parseInt(document.getElementById(`paper-${type.id}-start`)?.value) || 0;
                const end = parseInt(document.getElementById(`paper-${type.id}-end`)?.value) || 0;
                const free = parseInt(document.getElementById(`paper-${type.id}-free`)?.value) || 0;
                const sold = Math.max(0, start - end - free);

                // Ensure paperBingo object exists and initialize the specific type
                if (!window.app.data.paperBingo) {
                    window.app.data.paperBingo = {};
                }

                if (!window.app.data.paperBingo[type.id]) {
                    window.app.data.paperBingo[type.id] = {};
                }

                window.app.data.paperBingo[type.id] = { start, end, free, sold };

                console.log(`Saved paperBingo[${type.id}]:`, window.app.data.paperBingo[type.id]);
            } catch (error) {
                console.error('Error processing paper type:', type.id, error);
            }
        });
    } else {
        console.warn('CONFIG.PAPER_TYPES not found or invalid');
    }

    // Save POS sales
    if (CONFIG.POS_ITEMS) {
        CONFIG.POS_ITEMS.forEach(item => {
            try {
                const qty = parseInt(document.getElementById(`${item.id}-qty`)?.value) || 0;
                window.app.data.posSales[item.id] = {
                    name: item.name,
                    price: item.price,
                    quantity: qty,
                    total: qty * item.price
                };
            } catch (error) {
                console.error('Error processing POS item:', item.id, error);
            }
        });
    }

    // Save electronic rentals (now part of POS items)
    try {
        const smallMachineQty = parseInt(window.app.data.posSales['small-machine']?.quantity) || 0;
        const largeMachineQty = parseInt(window.app.data.posSales['large-machine']?.quantity) || 0;

        window.app.data.electronic = {
            smallMachines: smallMachineQty,
            largeMachines: largeMachineQty,
            smallTotal: smallMachineQty * 40,
            largeTotal: largeMachineQty * 65,
            total: (smallMachineQty * 40) + (largeMachineQty * 65)
        };
    } catch (error) {
        console.error('Error processing electronic rentals:', error);
    }

    // Trigger financial calculations update
    if (window.app && typeof window.app.calculateComprehensiveFinancials === 'function') {
        window.app.calculateComprehensiveFinancials();
    }
}

function saveGameResults() {
    console.log('=== saveGameResults CALLED ===');
    const games = [];
    document.querySelectorAll('#games-body tr').forEach((row, index) => {
        // Try multiple ways to find the game number
        const winnerInput = row.querySelector('.winner-count');
        const prizePerInput = row.querySelector('.prize-per-input');
        const gameNum = winnerInput?.getAttribute('data-game') ||
                       prizePerInput?.getAttribute('data-game-index') ||
                       (index + 1);

        const winners = parseInt(winnerInput?.value) || 0;
        const prizePerWinner = parseFloat(prizePerInput?.value) || 0;
        const checkPaid = row.querySelector('.paid-by-check')?.checked || false;
        const actualBallsInput = row.querySelector('.prog-actual-balls');
        const actualBalls = actualBallsInput ? parseInt(actualBallsInput.value) || 0 : null;

        // Get game details from the row
        const colorCell = row.cells[1];
        const gameNameCell = row.cells[2];
        const basePrizeCell = row.cells[3];

        const gameData = {
            number: parseInt(gameNum),
            color: colorCell?.textContent?.trim() || '',
            name: gameNameCell?.textContent?.trim() || '',
            prize: parseFloat(basePrizeCell?.textContent?.replace('$', '')) || 0,
            winners,
            prizePerWinner,
            totalPayout: winners * prizePerWinner,
            checkPayment: checkPaid
        };

        // Add actualBalls field only for progressive games
        if (actualBalls !== null) {
            gameData.actualBalls = actualBalls;
        }

        console.log(`Game ${gameNum}:`, gameData);
        games.push(gameData);
    });

    console.log(`Total games saved: ${games.length}`);
    window.app.data.games = games;

    // Trigger bingo prize calculations and comprehensive financials
    if (window.app && typeof window.app.calculateTotalBingoPrizes === 'function') {
        window.app.calculateTotalBingoPrizes();
    }
}

function savePullTabs() {
    console.log('=== savePullTabs CALLED ===');
    const pullTabs = [];

    // Get all rows (both library and custom games)
    document.querySelectorAll('#pulltab-body tr').forEach(row => {
        const gameSelect = row.querySelector('.pulltab-select');
        const customNameInput = row.querySelector('.custom-game-name');
        const serialInput = row.querySelector('.serial-input');
        const isCustomGame = row.classList.contains('custom-game');
        const isSpecialEvent = row.querySelector('.se-checkbox')?.checked || false;

        // Get game name
        let gameName = '';
        if (isCustomGame && customNameInput) {
            gameName = customNameInput.value;
        } else if (gameSelect) {
            gameName = gameSelect.value;
        }

        if (gameName && gameName !== '' && gameName !== 'No Game') {
            // Get values from actual table cells
            const ticketPriceCell = row.querySelector('.ticket-price-cell');
            const ticketsCell = row.querySelector('.tickets-cell');
            const salesCell = row.querySelector('.sales-cell');
            const idealCell = row.querySelector('.ideal-cell');
            const prizesCell = row.querySelector('.prizes-cell');
            const netCell = row.querySelector('.net-cell');
            const checkPayment = row.querySelector('.paid-by-check')?.checked || false;

            // For custom games, get values from inputs
            const ticketPriceInput = row.querySelector('.ticket-price-input');
            const ticketsInput = row.querySelector('.tickets-input');
            const prizesInput = row.querySelector('.prizes-input');

            const price = ticketPriceInput ? parseFloat(ticketPriceInput.value) || 0 :
                         parseFloat(ticketPriceCell?.textContent?.replace('$', '')) || 0;
            const tickets = ticketsInput ? parseInt(ticketsInput.value) || 0 :
                           parseInt(ticketsCell?.textContent) || 0;
            const sales = parseFloat(salesCell?.textContent?.replace('$', '')) || 0;
            const ideal = idealCell?.textContent === 'N/A' ? 0 :
                         parseFloat(idealCell?.textContent?.replace('$', '')) || 0;
            const prizes = prizesInput ? parseFloat(prizesInput.value) || 0 :
                          parseFloat(prizesCell?.textContent?.replace('$', '')) || 0;
            const net = parseFloat(netCell?.textContent?.replace('$', '')) || 0;

            console.log(`Saving game: ${gameName}, Price: ${price}, Tickets: ${tickets}, Sales: ${sales}, Ideal: ${ideal}, Prizes: ${prizes}, Net: ${net}, SE: ${isSpecialEvent}`);

            pullTabs.push({
                gameName,
                serialNumber: serialInput?.value || '',
                price,
                tickets,
                sales,
                idealProfit: ideal,
                prizesPaid: prizes,
                netProfit: net,
                isSpecialEvent,
                checkPayment
            });
        }
    });

    console.log(`Total pull-tab games saved: ${pullTabs.length}`);
    window.app.data.pullTabs = pullTabs;

    // Save Lion in Charge of Pull-Tabs field
    const ptLion = document.getElementById('pt-lion')?.value || '';
    if (!window.app.data.occasion) {
        window.app.data.occasion = {};
    }
    window.app.data.occasion.lionPullTabs = ptLion;
    console.log('Saved Lion in Charge of Pull-Tabs:', ptLion);

    // Update Pull-Tab Event game prize in Session Games if it exists
    updatePullTabEventGamePrize();

    // Trigger financial calculations update
    if (window.app && typeof window.app.calculateComprehensiveFinancials === 'function') {
        window.app.calculateComprehensiveFinancials();
    }
}

function saveMoneyCount() {
    // Ensure moneyCount structure exists
    if (!window.app.data.moneyCount) {
        window.app.data.moneyCount = {};
    }
    if (!window.app.data.moneyCount.bingo) {
        window.app.data.moneyCount.bingo = {};
    }
    if (!window.app.data.moneyCount.pullTab && !window.app.data.moneyCount.pulltab) {
        window.app.data.moneyCount.pulltab = {};
    }

    // Save bingo drawer
    ['100', '50', '20', '10', '5', '2', '1', 'coins', 'checks'].forEach(denom => {
        const value = parseFloat(document.getElementById(`bingo-${denom}`)?.value) || 0;
        window.app.data.moneyCount.bingo[denom] = value;
    });
    
    // Save pull-tab drawer
    const pullTabData = window.app.data.moneyCount.pullTab || window.app.data.moneyCount.pulltab;

    ['100', '50', '20', '10', '5', '2', '1', 'coins'].forEach(denom => {
        // Fixed: Use 'pt-drawer-' prefix to match input IDs (was 'pt-' which caused all values to be 0)
        const value = parseFloat(document.getElementById(`pt-drawer-${denom}`)?.value) || 0;
        pullTabData[denom] = value;
    });
}

// ============================================
// LOAD FUNCTIONS
// ============================================

function loadStepData() {
    if (!window.app) return;
    
    switch (window.app.currentStep) {
        case 1:
            loadOccasionInfo();
            break;
        case 2:
            loadPaperSales();
            break;
        case 3:
            loadGameResults();
            break;
        case 4:
            loadPullTabs();
            break;
        case 5:
            loadMoneyCount();
            break;
        case 6:
            loadReviewData();
            break;
    }
}

function loadOccasionInfo() {
    if (!window.app.data.occasion) return;
    
    const data = window.app.data.occasion;
    if (data.date) document.getElementById('occasion-date').value = data.date;

    // Handle session type - sessionType is now stored as key (5-1, 6-2, etc.)
    if (data.sessionType) {
        document.getElementById('session-type').value = data.sessionType;
    }

    if (data.lionInCharge) document.getElementById('lion-charge').value = data.lionInCharge;
    if (data.lionPullTabs) document.getElementById('pt-lion').value = data.lionPullTabs;
    if (data.totalPlayers) document.getElementById('total-people').value = data.totalPlayers;
    if (data.attendance) document.getElementById('total-people').value = data.attendance; // Fallback for old data
    if (data.birthdays) document.getElementById('birthdays').value = data.birthdays;
    
    if (data.progressive) {
        const prog = data.progressive;
        if (prog.jackpot) document.getElementById('prog-jackpot').value = prog.jackpot;
        if (prog.ballsNeeded) document.getElementById('prog-balls').value = prog.ballsNeeded;
        if (prog.consolation) document.getElementById('prog-consolation').value = prog.consolation;
        // actualBalls, prizeAwarded, and paidByCheck are now handled in the Game Results tab
    }
}

function loadPaperSales() {
    // Populate Physical Counts table
    const tbody = document.getElementById('paper-sales-body');
    if (!tbody) return;

    tbody.innerHTML = '';

    // Use CONFIG.PAPER_TYPES for correct labels matching legacy forms
    CONFIG.PAPER_TYPES.forEach(type => {
        const row = tbody.insertRow();
        const hasFree = type.hasFree;

        row.innerHTML = `
            <td>${type.name}</td>
            <td><input type="number" id="paper-${type.id}-start" min="0" value="0" onchange="calculatePaperSold('${type.id}')"></td>
            ${hasFree ? '<td><input type="number" id="paper-' + type.id + '-free" min="0" value="0" onchange="calculatePaperSold(\'' + type.id + '\')"></td>' : '<td>-</td>'}
            <td><input type="number" id="paper-${type.id}-end" min="0" value="0" onchange="calculatePaperSold('${type.id}')"></td>
            <td id="paper-${type.id}-sold">0</td>
        `;
    });

    // Load saved Physical Counts data if exists
    if (window.app?.data?.paperBingo) {
        Object.keys(window.app.data.paperBingo).forEach(id => {
            const data = window.app.data.paperBingo[id];
            const startInput = document.getElementById(`paper-${id}-start`);
            const freeInput = document.getElementById(`paper-${id}-free`);
            const endInput = document.getElementById(`paper-${id}-end`);
            const soldCell = document.getElementById(`paper-${id}-sold`);

            if (startInput) startInput.value = data.start || 0;
            if (freeInput) freeInput.value = data.free || 0;
            if (endInput) endInput.value = data.end || 0;
            if (soldCell) soldCell.textContent = data.sold || 0;
        });
    }

    // Update Birthday BOGOs if birthdays value exists
    if (typeof window.updateBirthdayBOGOs === 'function') {
        setTimeout(() => window.updateBirthdayBOGOs(), 100);
    }

    // Load saved Door Sales (POS) quantities
    if (window.app?.data?.posSales) {
        Object.entries(window.app.data.posSales).forEach(([itemId, itemData]) => {
            const qtyInput = document.getElementById(`${itemId}-qty`);
            const totalCell = document.getElementById(`${itemId}-total`);

            if (qtyInput && itemData.quantity !== undefined) {
                qtyInput.value = itemData.quantity;

                // Update total cell
                if (totalCell && itemData.total !== undefined) {
                    totalCell.textContent = `$${itemData.total.toFixed(2)}`;
                }
            }
        });

        // Recalculate category totals and grand total
        if (typeof window.calculatePOSSales === 'function') {
            // Trigger recalculation by calling calculatePOSSales for first item
            const firstItem = Object.keys(window.app.data.posSales)[0];
            if (firstItem) {
                const itemConfig = CONFIG.POS_ITEMS?.find(i => i.id === firstItem);
                if (itemConfig) {
                    window.calculatePOSSales(firstItem, itemConfig.price);
                }
            }
        }
    }
}

// Calculate paper sold
function calculatePaperSold(typeId) {
    const startInput = document.getElementById(`paper-${typeId}-start`);
    const freeInput = document.getElementById(`paper-${typeId}-free`);
    const endInput = document.getElementById(`paper-${typeId}-end`);
    const soldCell = document.getElementById(`paper-${typeId}-sold`);

    if (!startInput || !endInput || !soldCell) return;

    const start = parseInt(startInput.value) || 0;
    const free = freeInput ? (parseInt(freeInput.value) || 0) : 0;
    const end = parseInt(endInput.value) || 0;

    const sold = start - end - free;
    soldCell.textContent = Math.max(0, sold);

    // Save to app data
    if (!window.app.data.paperBingo) window.app.data.paperBingo = {};
    window.app.data.paperBingo[typeId] = { start, free, end, sold: Math.max(0, sold) };

    console.log('Saved paperBingo[' + typeId + ']:', window.app.data.paperBingo[typeId]);
}

// Make globally accessible
window.calculatePaperSold = calculatePaperSold;

async function loadGameResults() {
    const gamesBody = document.getElementById('games-body');

    // Check if games are already loaded - don't reload unnecessarily
    if (gamesBody && gamesBody.children.length > 0 && !gamesBody.textContent.includes('Loading')) {
        console.log('Session games already loaded, skipping reload');
        return;
    }

    // Get the selected session type from step 1
    const sessionType = document.getElementById('session-type')?.value;

    if (!sessionType || !gamesBody) {
        console.warn('Session type not selected or games body not found');
        return;
    }

    // Show loading spinner
    if (typeof showLoading === 'function') {
        showLoading('Loading session games...');
    }

    try {
        // Show loading state in table
        gamesBody.innerHTML = '<tr><td colspan="10" style="text-align: center; padding: 20px;">Loading session games...</td></tr>';

        // Load session games from API using JSONP to avoid CORS
        const result = await loadSessionGamesJSONP();

        if (result.success && result.data) {
            const sessionTypes = result.data.sessionTypes || result.data;
            const sessionData = sessionTypes[sessionType];

            if (sessionData && sessionData.games && Array.isArray(sessionData.games)) {
                populateSessionGamesNew(sessionData);
            } else {
                console.warn('No games found for session type:', sessionType, sessionData);
                gamesBody.innerHTML = '<tr><td colspan="10" style="text-align: center; padding: 20px; color: #666;">No games configured for this session type</td></tr>';
            }
        } else {
            throw new Error(result.error || 'Failed to load session games');
        }

        // Hide loading spinner
        if (typeof hideLoading === 'function') {
            hideLoading();
        }
    } catch (error) {
        console.error('Error loading session games:', error);

        // Hide loading spinner
        if (typeof hideLoading === 'function') {
            hideLoading();
        }

        gamesBody.innerHTML = `
            <tr><td colspan="10" style="text-align: center; padding: 20px; color: #e74c3c;">
                Error loading session games: ${error.message}
                <br><button onclick="loadGameResults()" class="btn btn-small" style="margin-top: 10px;">Retry</button>
            </td></tr>
        `;
    }
}

function populateSessionGamesNew(sessionData) {
    const gamesBody = document.getElementById('games-body');
    if (!gamesBody) return;

    // Use the flat games array from the new schema
    const games = sessionData.games || [];
    console.log(`Loading ${games.length} games for session`);

    // Sort games by order/gameNumber
    games.sort((a, b) => (a.order || a.gameNumber || 0) - (b.order || b.gameNumber || 0));

    // Check if we have saved game data to restore
    const savedGames = window.app?.data?.games || [];

    // Generate HTML for all games
    let gamesHtml = '';
    games.forEach((game, index) => {
        const gameNumber = game.gameNumber || game.order || (index + 1);
        const gameName = game.pattern || game.name || 'Unknown Game';
        let gameColor = game.color || 'N/A';

        // Check if this is the Progressive Diamond game
        const isProgressiveGame = game.isProgressive && game.pattern && game.pattern.includes('Progressive Diamond');

        // Check if this is an Early Bird game
        const isEarlyBird = game.category === 'Early Bird' || gameName.toLowerCase().includes('early bird');

        // Check if this is a Pull-Tab Event game
        const isPullTabEvent = gameName.toLowerCase().includes('pot of gold') || gameName.toLowerCase().includes('pull-tab event') || game.isSpecialEvent;

        // Override color labels for special games
        if (isProgressiveGame) {
            gameColor = 'Progressive';
        } else if (isEarlyBird) {
            gameColor = 'Early Bird';
        } else if (isPullTabEvent) {
            gameColor = 'Event Game';
        }

        // Get progressive game data from Occasion Info
        const progJackpot = window.app?.data?.progressive?.jackpot || 0;
        const progBalls = window.app?.data?.progressive?.ballsNeeded || 0;
        const progConsolation = window.app?.data?.progressive?.consolation || 200;

        let payout = typeof game.payout === 'number' ? game.payout : (game.payout === 'Varies' ? 0 : parseInt(game.payout) || 0);

        if (isProgressiveGame) {
            // Prize column always shows jackpot for Progressive Diamond
            // Per Winner/Total will use jackpot or consolation based on actual balls
            payout = progJackpot || payout;
        } else if (isPullTabEvent) {
            // Calculate total prize from Special Event pull-tabs
            const pullTabs = window.app?.data?.pullTabs || [];
            const specialEventPrize = pullTabs
                .filter(pt => pt.isSpecialEvent)
                .reduce((sum, pt) => sum + (pt.prizesPaid || 0), 0);
            payout = specialEventPrize || payout;
        }

        // Get saved data for this game if it exists
        const savedGame = savedGames[index];
        const winners = savedGame?.winners || 1;
        const prizePerWinner = savedGame?.prizePerWinner || payout;
        const totalPayout = savedGame?.totalPayout || payout;
        const checkPayment = savedGame?.checkPayment || false;
        const actualBalls = savedGame?.actualBalls || '';

        // Color-coded styling for game colors
        let colorStyle = '';
        // Only apply background color for actual CSS colors, not text labels
        const textLabels = ['early bird', 'pull-tab event', 'progressive', 'event game'];
        if (gameColor !== 'N/A' && gameColor !== '' && !textLabels.includes(gameColor.toLowerCase())) {
            colorStyle = `background-color: ${gameColor.toLowerCase()}; color: white; font-weight: bold;`;
        }

        // Generate Actual Balls column and configure winner/prize inputs based on whether it's the progressive game
        let actualBallsCell;
        let winnersOnChange;
        let prizePerOnChange;

        if (isProgressiveGame) {
            actualBallsCell = `<td style="text-align: center;"><input type="number" class="prog-actual-balls" data-game-index="${index}" min="1" max="75" value="${actualBalls}" onchange="updateProgressivePrize(${index})" style="width: 60px;" title="Actual Balls Called"></td>`;
            winnersOnChange = `updateProgressivePrize(${index})`;
            prizePerOnChange = `updateGamePrizesManual(${index})`; // Allow manual override if needed
        } else {
            actualBallsCell = `<td style="text-align: center; color: #999;">—</td>`;
            winnersOnChange = `updateGamePrizesNew(${index})`;
            prizePerOnChange = `updateGamePrizesManual(${index})`;
        }

        const formatCurrency = window.formatCurrency || ((v) => '$' + parseFloat(v).toFixed(2));

        gamesHtml += `
            <tr data-game-index="${index}">
                <td><strong>${gameNumber}</strong></td>
                <td style="${colorStyle} text-align: center; padding: 4px 8px; border-radius: 4px;">${gameColor}</td>
                <td>
                    ${gameName}
                </td>
                <td>${formatCurrency(payout)}</td>
                ${actualBallsCell}
                <td><input type="number" class="winner-count" data-game-index="${index}" min="0" value="${winners}" onchange="${winnersOnChange}" style="width: 60px;"></td>
                <td><input type="number" class="prize-per-input" data-game-index="${index}" min="0" step="1" value="${prizePerWinner.toFixed(2)}" onchange="${prizePerOnChange}" style="width: 70px;"></td>
                <td class="total-prize">${formatCurrency(totalPayout)}</td>
                <td style="text-align: center;">
                    <input type="checkbox" class="paid-by-check" data-game-index="${index}" ${checkPayment ? 'checked' : ''} title="Paid by Check">
                </td>
                <td style="text-align: center;">
                    <input type="checkbox" class="not-played-check" data-game-index="${index}" onchange="toggleGameNotPlayed(${index})" title="Mark as Not Played">
                </td>
            </tr>
        `;
    });

    if (gamesHtml) {
        gamesBody.innerHTML = gamesHtml;
        console.log(`Successfully loaded ${games.length} games for session`);

        // Calculate initial total prizes
        updateTotalBingoPrizes();
    } else {
        gamesBody.innerHTML = '<tr><td colspan="10" style="text-align: center; padding: 20px; color: #666;">No games available for this session</td></tr>';
    }
}

function populateSessionGames(sessionData) {
    const gamesBody = document.getElementById('games-body');
    if (!gamesBody) return;

    let allGames = [];
    let gameNumber = 1;

    // Collect all games from different categories
    if (sessionData.categories.earlyBird?.games) {
        sessionData.categories.earlyBird.games.forEach(game => {
            allGames.push({
                ...game,
                category: 'Early Bird',
                color: '#28a745', // Green
                displayNumber: gameNumber++
            });
        });
    }

    // Regular games - pre-intermission
    if (sessionData.categories.regular?.preIntermission) {
        sessionData.categories.regular.preIntermission.forEach(game => {
            allGames.push({
                ...game,
                category: 'Regular',
                color: '#007bff', // Blue
                displayNumber: gameNumber++
            });
        });
    }

    // Regular games - post-intermission
    if (sessionData.categories.regular?.postIntermission) {
        sessionData.categories.regular.postIntermission.forEach(game => {
            allGames.push({
                ...game,
                category: 'Regular',
                color: '#007bff', // Blue
                displayNumber: gameNumber++
            });
        });
    }

    // Regular games - post-progressive
    if (sessionData.categories.regular?.postProgressive) {
        sessionData.categories.regular.postProgressive.forEach(game => {
            allGames.push({
                ...game,
                category: 'Regular',
                color: '#007bff', // Blue
                displayNumber: gameNumber++
            });
        });
    }

    // Progressive games
    if (sessionData.categories.progressive?.games) {
        sessionData.categories.progressive.games.forEach(game => {
            allGames.push({
                ...game,
                category: 'Progressive',
                color: '#dc3545', // Red
                displayNumber: gameNumber++
            });
        });
    }

    // Special event games
    if (sessionData.categories.specialEvent?.games) {
        sessionData.categories.specialEvent.games.forEach(game => {
            allGames.push({
                ...game,
                category: 'Special',
                color: '#ffc107', // Yellow
                displayNumber: gameNumber++
            });
        });
    }

    // Generate HTML for all games
    let gamesHtml = '';
    allGames.forEach((game, index) => {
        const prizePerWinner = parseFloat(game.payout) || 0;

        gamesHtml += `
            <tr>
                <td>${game.displayNumber}</td>
                <td style="background-color: ${game.color}20; color: ${game.color}; font-weight: bold; text-align: center;">${game.category}</td>
                <td>${game.pattern}</td>
                <td>$${prizePerWinner}</td>
                <td><input type="number" class="winner-count" data-game="${game.gameNumber || index}" min="0" value="0" onchange="updateGamePrizes(${index})" style="width: 60px;"></td>
                <td class="prize-per">$${prizePerWinner}</td>
                <td class="total-prize">$0.00</td>
            </tr>
        `;
    });

    if (gamesHtml) {
        gamesBody.innerHTML = gamesHtml;
        console.log(`Loaded ${allGames.length} games for session`);
    } else {
        gamesBody.innerHTML = '<tr><td colspan="10" style="text-align: center; padding: 20px; color: #666;">No games available for this session</td></tr>';
    }
}

function updateGamePrizesNew(gameIndex, basePayout) {
    const row = document.querySelector(`#games-body tr:nth-child(${gameIndex + 1})`);
    if (!row) return;

    const winnersInput = row.querySelector('.winner-count');
    const prizePerInput = row.querySelector('.prize-per-input');
    const totalPrizeCell = row.querySelector('.total-prize');

    if (winnersInput && prizePerInput && totalPrizeCell) {
        const winners = parseInt(winnersInput.value) || 1;
        const prizePerWinner = parseFloat(prizePerInput.value) || 0;
        const totalPrize = winners * prizePerWinner;

        // Update total prize cell
        const formatCurrency = window.formatCurrency || ((v) => '$' + v.toFixed(2));
        totalPrizeCell.textContent = formatCurrency(totalPrize);

        // Update total bingo prizes
        updateTotalBingoPrizes();
    }
}

function updateProgressivePrize(gameIndex) {
    const row = document.querySelector(`#games-body tr:nth-child(${gameIndex + 1})`);
    if (!row) return;

    const actualBallsInput = row.querySelector('.prog-actual-balls');
    const prizePerInput = row.querySelector('.prize-per-input');
    const winnersInput = row.querySelector('.winner-count');
    const totalPrizeCell = row.querySelector('.total-prize');

    if (!actualBallsInput || !prizePerInput || !winnersInput || !totalPrizeCell) return;

    // Get progressive game data from Occasion Info
    const progJackpot = window.app?.data?.progressive?.jackpot || 0;
    const progBalls = window.app?.data?.progressive?.ballsNeeded || 0;
    const progConsolation = window.app?.data?.progressive?.consolation || 200;

    const actualBalls = parseInt(actualBallsInput.value) || 0;
    const winners = parseInt(winnersInput.value) || 1;

    // Calculate prize: if actualBalls <= ballsNeeded, prize = jackpot; else prize = consolation
    let totalPrize;
    if (actualBalls > 0 && progBalls > 0 && actualBalls <= progBalls) {
        totalPrize = progJackpot;
    } else if (actualBalls > 0) {
        totalPrize = progConsolation;
    } else {
        totalPrize = 0;
    }

    // Calculate per-winner amount
    const prizePerWinner = winners > 0 ? totalPrize / winners : 0;

    // Update inputs
    prizePerInput.value = prizePerWinner.toFixed(2);
    const formatCurrency = window.formatCurrency || ((v) => '$' + v.toFixed(2));
    totalPrizeCell.textContent = formatCurrency(totalPrize);

    // Update total bingo prizes
    updateTotalBingoPrizes();
}

function updateGamePrizes(gameIndex) {
    const row = document.querySelector(`#games-body tr:nth-child(${gameIndex + 1})`);
    if (!row) return;

    const winnersInput = row.querySelector('.winner-count');
    const prizePerCell = row.querySelector('.prize-per');
    const totalPrizeCell = row.querySelector('.total-prize');

    if (winnersInput && prizePerCell && totalPrizeCell) {
        const winners = parseInt(winnersInput.value) || 0;
        const prizePerWinner = parseFloat(prizePerCell.textContent.replace('$', '')) || 0;
        const totalPrize = winners * prizePerWinner;

        totalPrizeCell.textContent = `$${totalPrize.toFixed(2)}`;

        // Update total bingo prizes
        updateTotalBingoPrizes();
    }
}

// Update Pull-Tab Event game prize from Special Event pull-tabs
function updatePullTabEventGamePrize() {
    const rows = document.querySelectorAll('#games-body tr');

    rows.forEach(row => {
        const gameCell = row.cells[2];
        const gameName = gameCell?.textContent?.trim() || '';
        const isPullTabEvent = gameName.toLowerCase().includes('pot of gold') ||
                               gameName.toLowerCase().includes('pull-tab event');

        if (isPullTabEvent) {
            // Calculate total prize from Special Event pull-tabs
            const pullTabs = window.app?.data?.pullTabs || [];
            const specialEventPrize = pullTabs
                .filter(pt => pt.isSpecialEvent)
                .reduce((sum, pt) => sum + (pt.prizesPaid || 0), 0);

            // Update the Prize column (4th column, index 3)
            const prizeCell = row.cells[3];
            if (prizeCell) {
                const formatCurrency = window.formatCurrency || ((v) => '$' + v.toFixed(2));
                prizeCell.textContent = formatCurrency(specialEventPrize);
            }

            // Update per winner and total based on winners
            const winnersInput = row.querySelector('.winner-count');
            const prizePerInput = row.querySelector('.prize-per-input');
            const totalPrizeCell = row.querySelector('.total-prize');

            if (winnersInput && prizePerInput && totalPrizeCell) {
                const winners = parseInt(winnersInput.value) || 1;
                const prizePerWinner = winners > 0 ? specialEventPrize / winners : 0;

                prizePerInput.value = prizePerWinner.toFixed(2);
                totalPrizeCell.textContent = formatCurrency(specialEventPrize);
            }
        }
    });
}

function updateTotalBingoPrizes() {
    const rows = document.querySelectorAll('#games-body tr');
    let total = 0;

    rows.forEach(row => {
        // Check if this is a Pull-Tab Event game (exclude from bingo prizes)
        const gameCell = row.cells[2]; // Game name column
        const gameName = (gameCell?.textContent || '').trim();
        const isPullTabEvent = gameName.toLowerCase().includes('pot of gold') ||
                               gameName.toLowerCase().includes('pull-tab event') ||
                               gameName.toLowerCase().includes('event game');

        if (!isPullTabEvent) {
            const totalPrizeCell = row.querySelector('.total-prize');
            if (totalPrizeCell) {
                const amount = parseFloat(totalPrizeCell.textContent.replace(/[$,]/g, '')) || 0;
                total += amount;
            }
        }
    });

    const totalElement = document.getElementById('total-bingo-prizes');
    if (totalElement) {
        const formatCurrency = window.formatCurrency || ((v) => '$' + v.toFixed(2));
        totalElement.textContent = formatCurrency(total);
    }
}

// JSONP helper for loading session games
function loadSessionGamesJSONP() {
    return new Promise((resolve, reject) => {
        const callbackName = 'jsonpCallback_' + Math.random().toString(36).substr(2, 9);
        const script = document.createElement('script');

        // Set up the callback function
        window[callbackName] = function(data) {
            if (window[callbackName]) {
                delete window[callbackName];
            }
            if (script.parentNode) {
                script.parentNode.removeChild(script);
            }
            resolve(data);
        };

        // Create the script tag with callback parameter
        const url = `${CONFIG.API_URL}?action=getSessionGames&callback=${callbackName}&t=${Date.now()}`;
        script.src = url;
        script.onerror = function() {
            if (window[callbackName]) {
                delete window[callbackName];
            }
            if (script.parentNode) {
                script.parentNode.removeChild(script);
            }
            reject(new Error('Failed to load session games'));
        };

        document.body.appendChild(script);

        // Timeout after 15 seconds (increased from 10)
        setTimeout(() => {
            if (window[callbackName]) {
                delete window[callbackName];
                if (script.parentNode) {
                    script.parentNode.removeChild(script);
                }
                reject(new Error('Session games request timeout'));
            }
        }, 15000);
    });
}

// JSONP helper for loading pull-tab library
function loadPullTabLibraryJSONP() {
    return new Promise((resolve, reject) => {
        const callbackName = 'jsonpCallback_' + Math.random().toString(36).substr(2, 9);
        const script = document.createElement('script');

        // Set up the callback function
        window[callbackName] = function(data) {
            if (window[callbackName]) {
                delete window[callbackName];
            }
            if (script.parentNode) {
                script.parentNode.removeChild(script);
            }
            resolve(data);
        };

        // Create the script tag with callback parameter
        const url = `${CONFIG.API_URL}?action=getPullTabsLibrary&callback=${callbackName}&t=${Date.now()}`;
        script.src = url;
        script.onerror = function() {
            if (window[callbackName]) {
                delete window[callbackName];
            }
            if (script.parentNode) {
                script.parentNode.removeChild(script);
            }
            reject(new Error('Failed to load pull-tab library'));
        };

        document.body.appendChild(script);

        // Timeout after 15 seconds (increased from 10)
        setTimeout(() => {
            if (window[callbackName]) {
                delete window[callbackName];
                if (script.parentNode) {
                    script.parentNode.removeChild(script);
                }
                reject(new Error('Pull-tab library request timeout'));
            }
        }, 15000);
    });
}

async function loadPullTabs() {
    // Show loading spinner if loading library from API
    const needsLibraryLoad = !window.pullTabLibrary || window.pullTabLibrary.length === 0;

    if (needsLibraryLoad && typeof showLoading === 'function') {
        showLoading('Loading pull-tab library...');
    }

    try {
        // Load library if not already loaded
        if (needsLibraryLoad) {
            console.log('Loading pull-tab library...');

            // Load pull-tab library from API using JSONP
            const result = await loadPullTabLibraryJSONP();

            if (result.success && result.data && result.data.games) {
                // Ensure each game has required properties
                window.pullTabLibrary = result.data.games.map(game => ({
                    ...game,
                    identifier: game.identifier || `${game.name}_${game.form}` || game.name,
                    name: game.name || 'Unknown Game',
                    form: game.form || '',
                    count: game.count || 0,
                    price: game.price || 1,
                    idealProfit: game.idealProfit || 0
                }));
                console.log('Pull-tab library loaded:', window.pullTabLibrary.length, 'games');
            } else {
                console.warn('Failed to load pull-tab library:', result);
                window.pullTabLibrary = [];
            }
        }

        // ALWAYS populate dropdowns when this function is called, whether library was just loaded or already existed
        if (window.pullTabLibrary && window.pullTabLibrary.length > 0) {
            const pullTabSelects = document.querySelectorAll('.pulltab-select');
            console.log(`Populating ${pullTabSelects.length} pull-tab dropdowns with ${window.pullTabLibrary.length} games`);
            pullTabSelects.forEach(select => {
                populatePullTabSelect(select);
            });
        }

        // Load saved pull-tab data
        if (window.app?.data?.pullTabs && Array.isArray(window.app.data.pullTabs) && window.app.data.pullTabs.length > 0) {
            const pullTabsBody = document.getElementById('pulltab-body');
            if (pullTabsBody) {
                // Clear all existing rows
                pullTabsBody.innerHTML = '';

                // Add rows for each saved pull-tab
                window.app.data.pullTabs.forEach((pt, index) => {
                    // Add a new row
                    if (typeof addPullTabRow === 'function') {
                        addPullTabRow();
                    }

                    // Populate the row that was just added
                    const row = pullTabsBody.rows[pullTabsBody.rows.length - 1]; // Get the last row (just added)
                    if (row) {
                        // Set game name in dropdown
                        const select = row.querySelector('.pulltab-select');
                        if (select) {
                            select.value = pt.gameName || '';
                            // Trigger selection to populate cells
                            if (pt.gameName && typeof handlePullTabSelection === 'function') {
                                handlePullTabSelection(select);
                            }
                        }

                        // Set serial number
                        const serialInput = row.querySelector('.serial-input');
                        if (serialInput) serialInput.value = pt.serialNumber || '';

                        // Set prizes paid
                        const prizesInput = row.querySelector('.prizes-input');
                        if (prizesInput) {
                            prizesInput.value = pt.prizesPaid || 0;
                            // Trigger recalculation
                            if (typeof recalculateNetProfit === 'function') {
                                recalculateNetProfit(prizesInput);
                            }
                        }

                        // Set special event checkbox
                        const seCheckbox = row.querySelector('.se-checkbox');
                        if (seCheckbox) {
                            seCheckbox.checked = pt.isSpecialEvent || false;
                        }

                        // Set check payment checkbox
                        const checkPayment = row.querySelector('.paid-by-check');
                        if (checkPayment) {
                            checkPayment.checked = pt.checkPayment || false;
                        }
                    }
                });

                // Recalculate totals
                if (typeof calculatePullTabTotals === 'function') {
                    calculatePullTabTotals();
                }

                console.log('Loaded', window.app.data.pullTabs.length, 'pull-tab rows');
            }
        }

        // Hide loading spinner
        if (needsLibraryLoad && typeof hideLoading === 'function') {
            hideLoading();
        }
    } catch (error) {
        console.error('Error loading pull-tab library:', error);
        window.pullTabLibrary = [];

        // Hide loading spinner on error
        if (needsLibraryLoad && typeof hideLoading === 'function') {
            hideLoading();
        }
    }
}

function loadMoneyCount() {
    if (!window.app?.data?.moneyCount) return;

    const moneyData = window.app.data.moneyCount;

    // Load Bingo Drawer
    if (moneyData.bingo) {
        Object.entries(moneyData.bingo).forEach(([key, value]) => {
            const input = document.getElementById(`bingo-${key}`);
            if (input) {
                input.value = value || 0;
            }
        });
    }

    // Load Pull-Tab Drawer (check both pullTab and pulltab)
    const pullTabData = moneyData.pullTab || moneyData.pulltab;
    if (pullTabData) {
        Object.entries(pullTabData).forEach(([key, value]) => {
            // Skip 'total' key since it's calculated, not an input
            if (key === 'total') return;

            // Use 'pt-drawer-' prefix for pull-tab drawer inputs
            const input = document.getElementById(`pt-drawer-${key}`);
            if (input) {
                input.value = value || 0;
            }
        });
    }

    // Recalculate totals if function exists
    if (window.app && typeof window.app.calculateMoneyTotals === 'function') {
        window.app.calculateMoneyTotals();
    }

    // Calculate Pull-Tab drawer total to update displays
    if (typeof calculatePullTabDrawer === 'function') {
        calculatePullTabDrawer();
    }

    // Calculate final totals to update Deposit Summary
    if (typeof calculateFinalTotals === 'function') {
        calculateFinalTotals();
    }

    console.log('Money count data loaded');
}

function loadReviewData() {
    // Calculate Pull-Tab drawer to update Money Summary displays
    if (typeof calculatePullTabDrawer === 'function') {
        calculatePullTabDrawer();
    }

    // Calculate final totals for Financial Summary
    calculateFinalTotals();
}

// ============================================
// DATE PICKER & SESSION AUTO-SELECT
// ============================================

function initializeDatePicker() {
    const dateInput = document.getElementById('occasion-date');
    if (!dateInput) return;
    
    // Enable native date picker
    dateInput.type = 'date';
    
    // Set default to today
    const today = new Date().toISOString().split('T')[0];
    dateInput.value = today;
    
    // Set min and max dates (within reasonable range)
    const minDate = new Date(new Date().getFullYear() - 1, 0, 1);
    const maxDate = new Date(new Date().getFullYear() + 1, 11, 31);
    
    dateInput.min = minDate.toISOString().split('T')[0];
    dateInput.max = maxDate.toISOString().split('T')[0];
    
    // Add change event for auto session selection
    dateInput.addEventListener('change', function(e) {
        const selectedDate = new Date(e.target.value + 'T12:00:00'); // Add noon time to avoid timezone issues
        
        // Only auto-select for Mondays
        if (selectedDate.getDay() === 1) {
            // Find first Monday of the month
            const firstDay = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1);
            const firstMonday = new Date(firstDay);
            
            // Move to first Monday
            while (firstMonday.getDay() !== 1) {
                firstMonday.setDate(firstMonday.getDate() + 1);
            }
            
            // Calculate which Monday this is (1st, 2nd, 3rd, 4th, or 5th)
            const dayDiff = selectedDate.getDate() - firstMonday.getDate();
            const weekNumber = Math.floor(dayDiff / 7) + 1;
            
            let sessionType;
            switch(weekNumber) {
                case 1:
                    sessionType = '5-1';  // 1st Monday
                    break;
                case 2:
                    sessionType = '6-2';  // 2nd Monday
                    break;
                case 3:
                    sessionType = '7-3';  // 3rd Monday
                    break;
                case 4:
                    sessionType = '8-4';  // 4th Monday
                    break;
                case 5:
                    sessionType = '5-1';  // 5th Monday (same as 1st)
                    break;
                default:
                    sessionType = '5-1';
            }
            
            // Set the session dropdown
            const sessionSelect = document.getElementById('session-type');
            if (sessionSelect) {
                sessionSelect.value = sessionType;
                // Trigger change event to load games
                sessionSelect.dispatchEvent(new Event('change'));
            }
        }
    });
    
    // Trigger initial check if today is Monday
    const todayDate = new Date();
    if (todayDate.getDay() === 1) {
        dateInput.dispatchEvent(new Event('change'));
    }
}

// ============================================
// GAME CALCULATIONS
// ============================================

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
                
                // Recalculate overall totals
                if (window.app && window.app.calculateTotalBingoPrizes) {
                    window.app.calculateTotalBingoPrizes();
                }
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
                
                if (window.app && window.app.calculateTotalBingoPrizes) {
                    window.app.calculateTotalBingoPrizes();
                }
            }
        }
    });
}

// ============================================
// PULL-TAB FUNCTIONS
// ============================================

function addPullTabRow() {
    console.log('=== addPullTabRow() CALLED ===');
    console.log('Timestamp:', new Date().toISOString());

    const tbody = document.getElementById('pulltab-body');
    console.log('tbody element found:', !!tbody);

    if (!tbody) {
        console.error('ERROR: pulltab-body element not found!');
        return;
    }

    const row = document.createElement('tr');
    row.className = 'pulltab-row';
    row.id = 'pulltab-' + Date.now();
    console.log('Created row with ID:', row.id);

    row.innerHTML = `
        <td>
            <select class="pulltab-select" onchange="handlePullTabSelection(this)">
                <option value="">Select Game...</option>
                <option value="No Game">No Game</option>
            </select>
        </td>
        <td><input type="text" class="serial-input" placeholder="Serial #"></td>
        <td class="ticket-price-cell">$0.00</td>
        <td class="tickets-cell">0</td>
        <td class="sales-cell">$0.00</td>
        <td class="ideal-cell">$0.00</td>
        <td><input type="number" class="prizes-input" min="0" step="1" value="0" onchange="recalculateNetProfit(this)" style="width: 70px;"></td>
        <td class="net-cell">$0.00</td>
        <td><input type="checkbox" class="paid-by-check" title="Paid by Check"></td>
        <td><input type="checkbox" class="se-checkbox" title="Special Event" onchange="handleSECheckbox(this)"></td>
        <td><button onclick="deleteRow(this)" class="remove-btn" title="Remove">🗑️</button></td>
    `;

    tbody.appendChild(row);
    console.log('Row appended to tbody successfully');
    console.log('Current tbody row count:', tbody.children.length);

    // Populate the select with library games
    const selectElement = row.querySelector('.pulltab-select');
    console.log('addPullTabRow: selectElement found:', !!selectElement);
    console.log('addPullTabRow: selectElement tag:', selectElement?.tagName);
    console.log('addPullTabRow: selectElement class:', selectElement?.className);
    console.log('addPullTabRow: window.pullTabLibrary exists:', !!window.pullTabLibrary);
    console.log('addPullTabRow: window.pullTabLibrary type:', typeof window.pullTabLibrary);
    console.log('addPullTabRow: window.pullTabLibrary length:', window.pullTabLibrary?.length);
    console.log('addPullTabRow: First 3 games:', window.pullTabLibrary?.slice(0, 3));

    if (window.pullTabLibrary && window.pullTabLibrary.length > 0) {
        console.log('Populating new dropdown with', window.pullTabLibrary.length, 'games');
        populatePullTabSelect(selectElement);
    } else {
        console.log('Library not loaded yet, loading now...');
        // Load library if not already loaded, then populate
        loadPullTabLibraryJSONP().then(result => {
            console.log('Library load result:', result);
            if (result.success && result.data && result.data.games) {
                window.pullTabLibrary = result.data.games.map(game => ({
                    ...game,
                    identifier: game.identifier || `${game.name}_${game.form}` || game.name,
                    name: game.name || 'Unknown Game',
                    form: game.form || '',
                    count: game.count || 0,
                    price: game.price || 1,
                    idealProfit: game.idealProfit || 0
                }));
                console.log('Library loaded in addPullTabRow, populating dropdown with', window.pullTabLibrary.length, 'games');
                populatePullTabSelect(selectElement);
            }
        }).catch(error => {
            console.error('Error loading library in addPullTabRow:', error);
        });
    }
}

function handlePullTabSelection(selectElement) {
    console.log('=== handlePullTabSelection CALLED ===');
    const selectedValue = selectElement.value;
    console.log('Selected value:', selectedValue);

    if (!selectedValue || selectedValue === 'No Game') return;

    const row = selectElement.closest('tr');
    const game = window.pullTabLibrary?.find(g => g.identifier === selectedValue || g.name === selectedValue);

    console.log('Found game:', game);
    console.log('Row:', row);

    if (game && row) {
        // Auto-populate fields based on actual table structure
        const ticketPriceCell = row.querySelector('.ticket-price-cell');
        const ticketsCell = row.querySelector('.tickets-cell');
        const salesCell = row.querySelector('.sales-cell');
        const idealCell = row.querySelector('.ideal-cell');
        const prizesInput = row.querySelector('.prizes-input');
        const netCell = row.querySelector('.net-cell');

        console.log('Cells found:', {
            ticketPriceCell: !!ticketPriceCell,
            ticketsCell: !!ticketsCell,
            salesCell: !!salesCell,
            idealCell: !!idealCell,
            prizesInput: !!prizesInput,
            netCell: !!netCell
        });

        // Populate ticket price
        if (ticketPriceCell) {
            ticketPriceCell.textContent = `$${game.price.toFixed(2)}`;
            console.log('Set ticket price:', game.price);
        }

        // Populate ticket count
        if (ticketsCell) {
            ticketsCell.textContent = game.count;
            console.log('Set tickets:', game.count);
        }

        // Calculate and populate sales (tickets × price)
        const totalSales = game.count * game.price;
        if (salesCell) {
            salesCell.textContent = `$${totalSales.toFixed(2)}`;
            console.log('Set sales:', totalSales);
        }

        // Populate ideal profit
        if (idealCell) {
            idealCell.textContent = `$${game.idealProfit.toFixed(2)}`;
            console.log('Set ideal profit:', game.idealProfit);
        }

        // Calculate and populate expected prizes (sales - ideal profit)
        const expectedPrizes = totalSales - game.idealProfit;
        if (prizesInput) {
            prizesInput.value = expectedPrizes.toFixed(2);
            console.log('Set prizes:', expectedPrizes);
        }

        // Calculate and populate net (sales - prizes)
        const netProfit = totalSales - expectedPrizes;
        if (netCell) {
            netCell.textContent = `$${netProfit.toFixed(2)}`;
            console.log('Set net:', netProfit);
        }

        // Trigger totals calculation
        calculatePullTabTotals();
    } else {
        console.warn('Game or row not found');
    }
}

function deletePullTabRow(button) {
    const row = button.closest('tr');
    if (row && confirm('Delete this pull-tab game?')) {
        row.remove();
        calculatePullTabTotals();
    }
}

function populatePullTabSelect(selectElement) {
    console.log('populatePullTabSelect called with selectElement:', selectElement);
    console.log('window.pullTabLibrary:', window.pullTabLibrary?.length, 'games');

    if (!window.pullTabLibrary || !selectElement) {
        console.log('Cannot populate - missing library or selectElement');
        return;
    }

    // Keep existing options
    const currentValue = selectElement.value;

    // Clear options except first two
    while (selectElement.options.length > 2) {
        selectElement.remove(2);
    }

    console.log('Adding', window.pullTabLibrary.length, 'games to dropdown');

    // Add library games
    window.pullTabLibrary.forEach((game, index) => {
        const option = document.createElement('option');
        option.value = game.identifier || game.name;
        option.textContent = `${game.name} (${game.form})`;
        selectElement.appendChild(option);

        if (index < 3) {
            console.log('Added game:', option.textContent, 'value:', option.value);
        }
    });

    console.log('Dropdown now has', selectElement.options.length, 'options');
    
    // Restore value if it existed
    if (currentValue) {
        selectElement.value = currentValue;
    }
}

function addSpecialEventRow() {
    // This adds a custom pull-tab game (not from library)
    const tbody = document.getElementById('pulltab-body');
    if (!tbody) return;

    const rowId = 'custom-' + Date.now();
    const row = document.createElement('tr');
    row.className = 'pulltab-row custom-game';
    row.id = rowId;
    row.dataset.customGame = 'true';

    row.innerHTML = `
        <td>
            <input type="text" class="custom-game-name" placeholder="Enter custom game name..." style="width: 100%;">
        </td>
        <td><input type="text" class="serial-input" placeholder="Serial #"></td>
        <td><input type="number" class="ticket-price-input" min="0" step="0.01" value="1.00" onchange="calculateCustomGameTotals(this)" style="width: 60px;"></td>
        <td><input type="number" class="tickets-input" min="0" value="0" onchange="calculateCustomGameTotals(this)" style="width: 60px;"></td>
        <td class="sales-cell">$0.00</td>
        <td class="ideal-cell">N/A</td>
        <td><input type="number" class="prizes-input" min="0" step="1" value="0" onchange="calculateCustomGameTotals(this)" style="width: 60px;"></td>
        <td class="net-cell">$0.00</td>
        <td><input type="checkbox" class="paid-by-check" title="Paid by Check"></td>
        <td><input type="checkbox" class="se-checkbox" title="Special Event" onchange="handleSECheckbox(this)"></td>
        <td><button onclick="deleteRow(this)" class="remove-btn" title="Remove">🗑️</button></td>
    `;

    tbody.appendChild(row);
}

function handleSpecialEventSelection(selectElement) {
    const row = selectElement.closest('tr');
    const nameInput = row.querySelector('.event-name-input');
    const ticketsCell = row.querySelector('.event-tickets-cell');
    const salesCell = row.querySelector('.event-sales-cell');
    
    if (selectElement.value === 'custom') {
        nameInput.style.display = 'block';
        selectElement.style.display = 'none';
    } else if (selectElement.value) {
        // Parse the value to get tickets amount
        const match = selectElement.value.match(/\$(\d+)/);
        if (match) {
            const amount = parseInt(match[1]);
            ticketsCell.textContent = amount;
            salesCell.textContent = `$${amount.toFixed(2)}`;
        }
        calculatePullTabTotals();
    }
}

function deleteSpecialEvent(button) {
    const row = button.closest('tr');
    if (row && confirm('Delete this special event?')) {
        row.remove();
        calculatePullTabTotals();
    }
}

// calculatePullTabTotals moved to end of file to avoid duplicates

// ============================================
// FINAL CALCULATIONS
// ============================================

function calculateFinalTotals() {
    console.log('Calculating final totals for review step');

    // Get data from window.app if available
    const appData = window.app?.data || {};

    // 1. Calculate Bingo Sales by Category from POS data
    let totalElectronicSales = 0;
    let totalMiscellaneousSales = 0;
    let totalPaperSales = 0;

    if (appData.posSales) {
        Object.entries(appData.posSales).forEach(([key, item]) => {
            const total = item.total || 0;

            // Categorize based on CONFIG.POS_ITEMS
            const configItem = CONFIG.POS_ITEMS?.find(i => i.id === key);
            if (configItem) {
                if (configItem.category === 'Electronic') {
                    totalElectronicSales += total;
                } else if (configItem.category === 'Miscellaneous') {
                    totalMiscellaneousSales += total;
                } else if (configItem.category === 'Paper') {
                    totalPaperSales += total;
                }
            }
        });
    }

    // Total Bingo Sales = Electronic + Misc + Paper
    const totalBingoSales = totalElectronicSales + totalMiscellaneousSales + totalPaperSales;

    // 2. Bingo Prizes (from Session Games in step 3)
    let totalBingoPrizes = 0;
    let prizesPaidByCheck = 0;

    if (appData.games && Array.isArray(appData.games)) {
        appData.games.forEach(game => {
            // Exclude Pull-Tab Event game from bingo prizes
            const gameName = game.name || '';
            const isPullTabEvent = gameName.toLowerCase().includes('pot of gold') ||
                                   gameName.toLowerCase().includes('pull-tab event') ||
                                   gameName.toLowerCase().includes('event game');

            if (!isPullTabEvent) {
                const payout = game.totalPayout || 0;
                totalBingoPrizes += payout;

                // Count check payments
                if (game.checkPayment) {
                    prizesPaidByCheck += payout;
                }
            }
        });
    }

    // Note: Progressive prize is already included in the games array
    // (game with color "Progressive"), so we don't add it separately
    // Pull-Tab Event game is excluded as it's a pull-tab prize, not bingo

    // 3. Pull-Tab Sales and Prizes (from step 4)
    let totalPullTabSales = 0;
    let totalPullTabPrizes = 0;
    let totalSESales = 0;
    let totalSEPrizes = 0;

    // Check for pull-tab data in app.data
    if (appData.pullTabs && Array.isArray(appData.pullTabs)) {
        appData.pullTabs.forEach(pt => {
            if (pt.isSpecialEvent) {
                totalSESales += pt.sales || 0;
                totalSEPrizes += pt.prizesPaid || 0;
            } else {
                totalPullTabSales += pt.sales || 0;
                totalPullTabPrizes += pt.prizesPaid || 0;
            }
        });
    }

    // 4. Cash Deposit (from step 5 - Money Count)
    let totalDeposit = 0;

    // Check for deposit data in app.data
    if (appData.moneyCount) {
        // Sum up all the cash in both drawers
        const bingoDrawer = appData.moneyCount.bingo || {};
        const pullTabDrawer = appData.moneyCount.pulltab || appData.moneyCount.pullTab || {};

        Object.entries(bingoDrawer).forEach(([key, amount]) => {
            // Sum all denomination values (not the 'checks' key)
            if (key !== 'checks') {
                totalDeposit += parseFloat(amount) || 0;
            }
        });
        Object.entries(pullTabDrawer).forEach(([key, amount]) => {
            // Sum all denomination values (not the 'checks' key if exists)
            if (key !== 'checks') {
                totalDeposit += parseFloat(amount) || 0;
            }
        });
    }

    // ==========================================
    // V2 ENHANCED FINANCIAL CALCULATIONS
    // ==========================================

    // Extract money count details for deposit breakdown
    const bingoDrawer = appData.moneyCount?.bingo || {};
    const pullTabDrawer = appData.moneyCount?.pulltab || appData.moneyCount?.pullTab || {};

    // Calculate bingo drawer total and breakdown
    let bingoDeposit = 0;
    let bingoCurrency = 0;
    let bingoCoins = 0;
    let bingoChecks = 0;

    Object.entries(bingoDrawer).forEach(([key, amount]) => {
        const value = parseFloat(amount) || 0;
        if (key === 'coins') {
            bingoCoins += value;
        } else if (key === 'checks') {
            bingoChecks += value;
        } else if (key !== 'total') {
            bingoCurrency += value;
        }
    });
    bingoDeposit = bingoCurrency + bingoCoins + bingoChecks;

    // Calculate pull-tab drawer total and breakdown
    let pullTabDeposit = 0;
    let pullTabCurrency = 0;
    let pullTabCoins = 0;
    let pullTabChecks = 0;

    Object.entries(pullTabDrawer).forEach(([key, amount]) => {
        const value = parseFloat(amount) || 0;
        if (key === 'coins') {
            pullTabCoins += value;
        } else if (key === 'checks') {
            pullTabChecks += value;
        } else if (key !== 'total') {
            pullTabCurrency += value;
        }
    });
    pullTabDeposit = pullTabCurrency + pullTabCoins + pullTabChecks;

    // Calculate total deposit breakdown
    const totalCurrencyDeposit = bingoCurrency + pullTabCurrency;
    const totalCoinDeposit = bingoCoins + pullTabCoins;
    const totalCheckDeposit = bingoChecks + pullTabChecks;
    const totalActualDeposit = totalCurrencyDeposit + totalCoinDeposit + totalCheckDeposit;

    // Update Money Count tab Deposit Summary
    const depositCurrency = document.getElementById('deposit-currency');
    const depositCoins = document.getElementById('deposit-coins');
    const depositChecks = document.getElementById('deposit-checks');
    const depositTotal = document.getElementById('deposit-total');
    const netDeposit = document.getElementById('net-deposit');

    if (depositCurrency) depositCurrency.textContent = `$${totalCurrencyDeposit.toFixed(2)}`;
    if (depositCoins) depositCoins.textContent = `$${totalCoinDeposit.toFixed(2)}`;
    if (depositChecks) depositChecks.textContent = `$${totalCheckDeposit.toFixed(2)}`;
    if (depositTotal) depositTotal.textContent = `$${totalActualDeposit.toFixed(2)}`;

    // Bingo financial calculations
    const bingoSales = totalBingoSales;
    const bingoPrizesPaid = totalBingoPrizes;
    const bingoNetProfit = bingoSales - bingoPrizesPaid;
    const bingoStartupCash = 1000; // Standard startup
    const bingoNetDeposit = bingoDeposit - bingoStartupCash;
    const bingoIdealProfit = bingoSales - bingoPrizesPaid;
    const bingoOverShort = bingoNetDeposit - bingoIdealProfit;

    // Pull-Tab financial calculations (separated regular/special)
    const pullTabRegularSales = totalPullTabSales;
    const pullTabSpecialSales = totalSESales;
    const pullTabSales = pullTabRegularSales + pullTabSpecialSales;
    const pullTabRegularPrizesPaid = totalPullTabPrizes;
    const pullTabSpecialPrizesPaid = totalSEPrizes;
    const pullTabPrizes = pullTabRegularPrizesPaid + pullTabSpecialPrizesPaid;
    const pullTabPrizesPaidByCheck = 0; // Pull-tabs typically paid in cash
    const pulltabNetProfit = pullTabSales - pullTabPrizes;
    const pullTabNetDeposit = pullTabDeposit; // No startup for pull-tabs
    const pullTabIdealProfit = pullTabSales - pullTabPrizes;
    const pullTabOverShort = pullTabNetDeposit - pullTabIdealProfit;

    // Grand totals
    const totalSales = bingoSales + pullTabSales;
    const grossSales = totalSales; // Alias for Review tab compatibility
    const totalPrizesPaid = bingoPrizesPaid + pullTabPrizes;
    const totalPrizesPaidByCheck = prizesPaidByCheck; // From games check payments
    const totalNetProfit = totalSales - totalPrizesPaid;
    const totalNetDeposit = totalActualDeposit - bingoStartupCash;
    const totalOverShort = totalNetDeposit - totalNetProfit;
    const actualProfit = totalNetDeposit; // Alias for Review tab
    const idealProfit = totalNetProfit; // Alias for Review tab
    const overShort = totalOverShort; // Alias for Review tab
    totalDeposit = totalActualDeposit; // Update existing variable (declared at line 2431)

    // Update Money Count tab Net Deposit
    if (netDeposit) netDeposit.textContent = `$${totalNetDeposit.toFixed(2)}`;

    // Save V2 Enhanced Financial Data (30+ fields)
    if (window.app && window.app.data) {
        window.app.data.financial = {
            // Bingo Section (10 fields)
            bingoElectronicSales: totalElectronicSales,
            bingoMiscellaneousSales: totalMiscellaneousSales,
            bingoPaperSales: totalPaperSales,
            bingoSales: bingoSales,
            bingoPrizesPaid: bingoPrizesPaid,
            bingoNetProfit: bingoNetProfit,
            bingoDeposit: bingoDeposit,
            bingoStartupCash: bingoStartupCash,
            bingoNetDeposit: bingoNetDeposit,
            bingoOverShort: bingoOverShort,

            // Pull-Tab Section (10 fields - Regular/Special separated)
            pullTabRegularSales: pullTabRegularSales,
            pullTabSpecialSales: pullTabSpecialSales,
            pullTabSales: pullTabSales,
            pullTabRegularPrizesPaid: pullTabRegularPrizesPaid,
            pullTabSpecialPrizesPaid: pullTabSpecialPrizesPaid,
            pullTabPrizes: pullTabPrizes,
            pullTabPrizesPaidByCheck: pullTabPrizesPaidByCheck,
            pulltabNetProfit: pulltabNetProfit,
            pullTabNetDeposit: pullTabNetDeposit,
            pullTabOverShort: pullTabOverShort,

            // Totals Section (11 fields)
            totalSales: totalSales,
            totalPrizesPaid: totalPrizesPaid,
            totalPrizesPaidByCheck: totalPrizesPaidByCheck,
            totalNetProfit: totalNetProfit,
            totalCurrencyDeposit: totalCurrencyDeposit,
            totalCoinDeposit: totalCoinDeposit,
            totalCheckDeposit: totalCheckDeposit,
            totalActualDeposit: totalActualDeposit,
            totalNetDeposit: totalNetDeposit,
            totalOverShort: totalOverShort,

            // Legacy V1 fields for backward compatibility
            totalElectronicSales: totalElectronicSales,
            totalMiscellaneousSales: totalMiscellaneousSales,
            totalPaperSales: totalPaperSales,
            totalBingoSales: totalBingoSales,
            pullTabPrizesPaid: totalPullTabPrizes,
            specialEventSales: totalSESales,
            specialEventPrizesPaid: totalSEPrizes,
            grossSales: totalSales,
            idealProfit: totalNetProfit,
            overShort: totalOverShort,
            totalCashDeposit: totalActualDeposit,
            actualProfit: totalNetDeposit
        };

        console.log('💰 V2 Enhanced Financial Data Saved:', window.app.data.financial);
    }

    // Update the Review & Submit summary fields
    updateSummaryField('summary-bingo-sales', totalBingoSales);
    updateSummaryField('summary-pt-sales', totalPullTabSales);
    updateSummaryField('summary-se-sales', totalSESales);
    updateSummaryField('summary-gross', grossSales);
    updateSummaryField('summary-bingo-prizes', totalBingoPrizes);
    updateSummaryField('summary-pt-prizes', totalPullTabPrizes);
    updateSummaryField('summary-se-prizes', totalSEPrizes);
    updateSummaryField('summary-total-prizes', totalPrizesPaid);
    updateSummaryField('summary-deposit', totalDeposit);
    updateSummaryField('summary-actual', actualProfit);
    updateSummaryField('summary-ideal', idealProfit);
    updateSummaryField('summary-overshort', overShort);

    // Update performance metrics with calculated values
    const totalPlayers = appData.occasion?.totalPlayers || 0;
    updatePerformanceMetrics(totalPlayers, grossSales, actualProfit);

    console.log('Final totals calculated:', {
        bingoSales: totalBingoSales,
        pullTabSales: totalPullTabSales,
        seSales: totalSESales,
        grossSales: grossSales,
        bingoPrizes: totalBingoPrizes,
        pullTabPrizes: totalPullTabPrizes,
        sePrizes: totalSEPrizes,
        totalPrizes: totalPrizesPaid,
        deposit: totalDeposit,
        idealProfit: idealProfit,
        actualProfit: actualProfit,
        overShort: overShort
    });
}

function updateSummaryField(fieldId, value) {
    const field = document.getElementById(fieldId);
    if (field) {
        field.textContent = `$${value.toFixed(2)}`;
    }
}

function updatePerformanceMetrics(players, sales, profit) {
    // If parameters not provided, read from saved data
    if (players === undefined || sales === undefined || profit === undefined) {
        const appData = window.app?.data || {};
        players = appData.occasion?.totalPlayers || 0;
        sales = appData.financial?.grossSales || 0;
        profit = appData.financial?.actualProfit || 0;
    }

    // Total Players
    const playersEl = document.getElementById('metric-players');
    if (playersEl) playersEl.textContent = players;

    // Gross Sales
    const grossEl = document.getElementById('metric-gross');
    if (grossEl) grossEl.textContent = `$${sales.toFixed(2)}`;

    // Net Profit (Actual Profit)
    const profitEl = document.getElementById('metric-profit');
    if (profitEl) profitEl.textContent = `$${profit.toFixed(2)}`;

    // Sales Per Player (Gross Sales / Total Players)
    const salesPerPlayer = players > 0 ? (sales / players) : 0;
    const salesPerPlayerEl = document.getElementById('metric-sales-per-player');
    if (salesPerPlayerEl) salesPerPlayerEl.textContent = `$${salesPerPlayer.toFixed(2)} / player`;

    // Profit Per Player (Net Profit / Total Players)
    const profitPerPlayer = players > 0 ? (profit / players) : 0;
    const profitPerPlayerEl = document.getElementById('metric-profit-per-player');
    if (profitPerPlayerEl) profitPerPlayerEl.textContent = `$${profitPerPlayer.toFixed(2)} / player`;

    console.log('Performance metrics updated:', {
        totalPlayers: players,
        grossSales: sales,
        netProfit: profit,
        salesPerPlayer: salesPerPlayer.toFixed(2),
        profitPerPlayer: profitPerPlayer.toFixed(2)
    });
}

// ============================================
// SUBMIT FUNCTION
// ============================================

async function submitOccasion() {
    console.log('🚀 submitOccasion() called - starting submission process');

    if (!confirm('Submit this occasion? This will save all data to the database.')) {
        console.log('❌ User cancelled submission');
        return;
    }

    console.log('✅ User confirmed submission - proceeding');

    // Show loading overlay and disable button to prevent multiple clicks
    if (window.showLoading) {
        window.showLoading('Submitting Occasion', 'Please wait while we save your data...');
    }

    const submitBtn = document.querySelector('[onclick="submitOccasion()"]');
    if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Submitting...';
    }

    try {
        // CRITICAL: Recalculate financial totals before submission
        if (typeof calculateFinalTotals === 'function') {
            console.log('📊 Recalculating financial totals before submission...');
            calculateFinalTotals();
        }

        // Update status in app data first
        window.app.data.status = 'submitted';
        window.app.data.submittedAt = new Date().toISOString();
        window.app.data.submittedBy = window.app.data.occasion?.lionInCharge || 'Unknown';

        // Prepare submission data
        const submissionData = {
            ...window.app.data
        };

        console.log('✅ Submitting occasion with status:', submissionData.status);
        console.log('📤 Full submission data includes status field:', 'status' in submissionData);
        console.log('📤 Submission data keys:', Object.keys(submissionData));

        // Submit to backend with status as separate parameter to ensure it's preserved
        const response = await fetch(CONFIG.API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: new URLSearchParams({
                action: 'saveOccasion',
                status: 'submitted',  // Send status separately
                submittedAt: submissionData.submittedAt,
                submittedBy: submissionData.submittedBy,
                data: JSON.stringify(submissionData)
            })
        });

        const result = await response.json();

        // Hide loading overlay
        if (window.hideLoading) {
            window.hideLoading();
        }

        if (result.success) {
            // Verify status was saved
            if (result.data && result.data.status === 'submitted') {
                console.log('✅ Status verified as submitted in backend response');
            } else {
                console.warn('⚠️ Status not confirmed in backend response:', result.data?.status);
            }

            alert('Occasion submitted successfully!');

            // Clear draft data
            localStorage.removeItem(CONFIG.STORAGE_KEYS.DRAFT_DATA);

            // Redirect to home page after successful submission
            window.location.href = 'index.html';
        } else {
            // Re-enable button on error
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.textContent = 'Submit Occasion';
            }
            throw new Error(result.message || 'Submission failed');
        }
    } catch (error) {
        console.error('Submission error:', error);

        // Hide loading overlay
        if (window.hideLoading) {
            window.hideLoading();
        }

        // Re-enable button
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Submit Occasion';
        }

        // Add to sync queue for later submission
        const queue = JSON.parse(localStorage.getItem(CONFIG.STORAGE_KEYS.SYNC_QUEUE) || '[]');
        queue.push({
            action: 'saveOccasion',
            data: window.app.data,
            timestamp: new Date().toISOString()
        });
        localStorage.setItem(CONFIG.STORAGE_KEYS.SYNC_QUEUE, JSON.stringify(queue));

        alert('Submission saved offline. Will sync when connection is restored.');
    }
}

// ============================================
// HELPER FUNCTIONS
// ============================================

function showValidationError(message) {
    // Show error message to user
    const existingError = document.querySelector('.validation-error');
    if (existingError) {
        existingError.remove();
    }
    
    const errorDiv = document.createElement('div');
    errorDiv.className = 'validation-error';
    errorDiv.style.cssText = `
        position: fixed;
        top: 20px;
        left: 50%;
        transform: translateX(-50%);
        background: #f44336;
        color: white;
        padding: 12px 24px;
        border-radius: 4px;
        box-shadow: 0 2px 5px rgba(0,0,0,0.2);
        z-index: 10000;
    `;
    errorDiv.textContent = message;
    document.body.appendChild(errorDiv);
    
    // Remove after 5 seconds
    setTimeout(() => errorDiv.remove(), 5000);
}

// ============================================
// URL PARAMETER HANDLING FOR EDITING
// ============================================

/**
 * Check URL for date and id parameters, and load occasion if present
 * This enables editing occasions from the admin dashboard
 */
async function checkAndLoadOccasionFromUrl() {
    try {
        const urlParams = new URLSearchParams(window.location.search);
        const occasionId = urlParams.get('id');
        const occasionDate = urlParams.get('date');

        if (!occasionId && !occasionDate) {
            console.log('No URL parameters found - starting fresh occasion');
            return;
        }

        console.log('📥 URL parameters detected:', { id: occasionId, date: occasionDate });

        if (!occasionId) {
            console.warn('Date provided but no ID - cannot load occasion');
            return;
        }

        // Show loading
        if (window.showLoading) {
            window.showLoading('Loading Occasion', 'Loading occasion data from server...');
        }

        // Load occasion from backend via JSONP
        const callbackName = 'loadOccasionFromUrlCallback_' + Date.now();
        let occasionData = null;

        await new Promise((resolve, reject) => {
            window[callbackName] = function(response) {
                if (response.success && response.data) {
                    occasionData = response.data;
                    console.log('✅ Loaded occasion data:', occasionData);
                } else {
                    console.error('Failed to load occasion:', response.error || response.message);
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
            }, 15000);
        });

        if (!occasionData) {
            throw new Error('No occasion data loaded from server');
        }

        // Check if occasion is finalized (read-only)
        const status = occasionData.status || 'draft';
        if (status === 'finalized') {
            alert('⚠️ This occasion is finalized and cannot be edited.\n\nYou can view the data but cannot make changes.');
            // Continue loading but we'll disable form fields later
        }

        // Populate window.app.data with loaded occasion
        if (window.app && window.app.data) {
            // Merge loaded data into app.data
            Object.assign(window.app.data, occasionData);
            console.log('✅ Occasion data loaded into window.app.data');

            // Save to localStorage so it persists across tab switches
            try {
                localStorage.setItem(CONFIG.STORAGE_KEYS.DRAFT_DATA, JSON.stringify(occasionData));
                console.log('✅ Occasion data saved to localStorage');
            } catch (e) {
                console.warn('Could not save to localStorage:', e);
            }

            // Load data into all form fields using loadOccasionData (handles progressive data)
            loadOccasionData(occasionData);

            // Show notification
            if (window.showNotification) {
                window.showNotification(
                    `📂 Loaded occasion from ${occasionDate} (${status})`,
                    'success'
                );
            } else {
                alert(`📂 Loaded occasion from ${occasionDate}\nStatus: ${status}`);
            }

            // If finalized, disable all form inputs
            if (status === 'finalized') {
                disableAllFormInputs();
            }
        }

    } catch (error) {
        console.error('Error loading occasion from URL:', error);
        alert(`❌ Failed to load occasion: ${error.message}\n\nYou can still create a new occasion.`);
    } finally {
        if (window.hideLoading) {
            window.hideLoading();
        }
    }
}

/**
 * Load data into all form fields across all tabs
 */
function loadAllStepData() {
    console.log('Loading data into all form fields...');
    const originalStep = window.app.currentStep;

    // Load data for each step
    for (let step = 1; step <= 6; step++) {
        window.app.currentStep = step;
        loadStepData();
    }

    // Restore original step
    window.app.currentStep = originalStep;
    updateStepDisplay();

    console.log('✅ All form fields loaded');
}

/**
 * Disable all form inputs for finalized occasions
 */
function disableAllFormInputs() {
    console.log('Disabling all form inputs (finalized occasion)');

    document.querySelectorAll('input, select, textarea, button').forEach(el => {
        // Don't disable tab navigation buttons
        if (!el.classList.contains('tab-button') && !el.classList.contains('step')) {
            el.disabled = true;
        }
    });

    // Add visual indicator
    const header = document.querySelector('h1');
    if (header) {
        header.innerHTML += ' <span style="color: #f44336; font-size: 0.8em;">[READ-ONLY - FINALIZED]</span>';
    }
}

// ============================================
// INITIALIZATION
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    console.log('Wizard.js initializing...');

    // Initialize date picker
    initializeDatePicker();

    // Initialize game calculations
    initializeGameCalculations();

    // Add step click handlers for direct navigation
    document.querySelectorAll('.step[data-step]').forEach(stepElement => {
        stepElement.addEventListener('click', (e) => {
            const targetStep = parseInt(stepElement.getAttribute('data-step'));
            if (targetStep && targetStep !== window.app.currentStep) {
                // Save current step data before switching
                if (window.app.saveDraft) {
                    window.app.saveDraft();
                }
                // Allow direct navigation to any step
                window.app.currentStep = targetStep;
                updateStepDisplay();
            }
        });
        // Add cursor pointer to indicate clickable
        stepElement.style.cursor = 'pointer';
    });

    // Set initial step display
    if (window.app) {
        updateStepDisplay();
    }

    // Load pull-tab library if function exists
    if (typeof loadPullTabLibrary === 'function') {
        loadPullTabLibrary();
    }

    // Check for URL parameters to load existing occasion for editing
    checkAndLoadOccasionFromUrl();

    console.log('Wizard.js initialization complete');
});

// Recalculate net profit when prizes are manually edited
function recalculateNetProfit(input) {
    const row = input.closest('tr');
    if (!row) return;

    const salesCell = row.querySelector('.sales-cell');
    const prizesInput = row.querySelector('.prizes-input');
    const netCell = row.querySelector('.net-cell');

    const sales = parseFloat(salesCell?.textContent?.replace('$', '')) || 0;
    const prizes = parseFloat(prizesInput?.value) || 0;
    const net = sales - prizes;

    if (netCell) {
        netCell.textContent = `$${net.toFixed(2)}`;
    }

    // Recalculate totals
    calculatePullTabTotals();
}

// Make functions globally accessible for inline onclick handlers
window.addPullTabRow = addPullTabRow;
window.addSpecialEventRow = addSpecialEventRow;
window.handlePullTabSelection = handlePullTabSelection;
window.deleteRow = deleteRow;
window.calculateCustomGameTotals = calculateCustomGameTotals;
window.updateGamePrizesNew = updateGamePrizesNew;
window.updateGamePrizesManual = updateGamePrizesManual;
window.toggleGameNotPlayed = toggleGameNotPlayed;
window.editGameRow = editGameRow;
window.recalculateNetProfit = recalculateNetProfit;

// Update game prizes with auto-calculation of Per Winner
function updateGamePrizesNew(gameIndex) {
    const row = document.querySelector(`tr[data-game-index="${gameIndex}"]`);
    if (!row) return;

    const winnerInput = row.querySelector('.winner-count');
    const prizePerInput = row.querySelector('.prize-per-input');
    const totalPrizeCell = row.querySelector('.total-prize');
    const prizeCell = row.cells[3]; // Prize column

    const winners = parseInt(winnerInput.value) || 1;
    const basePrize = parseFloat(prizeCell.textContent.replace('$', '')) || 0;

    // Calculate per winner (rounded up to nearest dollar)
    const perWinner = Math.ceil(basePrize / winners);
    const totalPrize = perWinner * winners;

    prizePerInput.value = perWinner.toFixed(2);
    totalPrizeCell.textContent = `$${totalPrize.toFixed(2)}`;

    // Save to app data
    if (window.app && window.app.data && window.app.data.sessionGames) {
        if (!window.app.data.sessionGames[gameIndex]) {
            window.app.data.sessionGames[gameIndex] = {};
        }
        window.app.data.sessionGames[gameIndex].winners = winners;
        window.app.data.sessionGames[gameIndex].perWinner = perWinner;
        window.app.data.sessionGames[gameIndex].totalPrize = totalPrize;
    }

    // Update total prizes
    updateTotalBingoPrizes();
}

// Update game prizes when Per Winner is manually edited
function updateGamePrizesManual(gameIndex) {
    const row = document.querySelector(`tr[data-game-index="${gameIndex}"]`);
    if (!row) return;

    const winnerInput = row.querySelector('.winner-count');
    const prizePerInput = row.querySelector('.prize-per-input');
    const totalPrizeCell = row.querySelector('.total-prize');

    const winners = parseInt(winnerInput.value) || 1;
    const perWinner = parseFloat(prizePerInput.value) || 0;

    // Calculate total (Per Winner × Winners)
    const totalPrize = perWinner * winners;

    totalPrizeCell.textContent = `$${totalPrize.toFixed(2)}`;

    // Save to app data
    if (window.app && window.app.data && window.app.data.sessionGames) {
        if (!window.app.data.sessionGames[gameIndex]) {
            window.app.data.sessionGames[gameIndex] = {};
        }
        window.app.data.sessionGames[gameIndex].winners = winners;
        window.app.data.sessionGames[gameIndex].perWinner = perWinner;
        window.app.data.sessionGames[gameIndex].totalPrize = totalPrize;
    }

    // Update total prizes
    updateTotalBingoPrizes();
}

// Toggle game as not played
function toggleGameNotPlayed(gameIndex) {
    const row = document.querySelector(`tr[data-game-index="${gameIndex}"]`);
    if (!row) return;

    const checkbox = row.querySelector('.not-played-check');
    const isNotPlayed = checkbox.checked;

    // Disable/enable inputs when not played
    const winnerInput = row.querySelector('.winner-count');
    winnerInput.disabled = isNotPlayed;

    // Gray out the row if not played
    if (isNotPlayed) {
        row.style.opacity = '0.5';
        row.style.textDecoration = 'line-through';
    } else {
        row.style.opacity = '1';
        row.style.textDecoration = 'none';
    }

    // Save to app data
    if (window.app && window.app.data && window.app.data.sessionGames) {
        if (!window.app.data.sessionGames[gameIndex]) {
            window.app.data.sessionGames[gameIndex] = {};
        }
        window.app.data.sessionGames[gameIndex].notPlayed = isNotPlayed;
    }
}

// Edit individual game row
function editGameRow(gameIndex) {
    const row = document.querySelector(`tr[data-game-index="${gameIndex}"]`);
    if (!row) return;

    const gameNumber = row.cells[0].textContent;
    const color = row.cells[1].textContent;
    const pattern = row.cells[2].textContent;
    const prize = row.cells[3].textContent;

    const newPattern = prompt(`Edit game ${gameNumber} pattern:`, pattern);
    if (newPattern && newPattern !== pattern) {
        row.cells[2].textContent = newPattern;

        // Save to app data
        if (window.app && window.app.data && window.app.data.sessionGames) {
            if (!window.app.data.sessionGames[gameIndex]) {
                window.app.data.sessionGames[gameIndex] = {};
            }
            window.app.data.sessionGames[gameIndex].pattern = newPattern;
        }
    }
}

// Delete pull-tab row
function deleteRow(button) {
    const row = button.closest('tr');
    if (row && confirm('Remove this pull-tab game?')) {
        row.remove();
        // Recalculate totals
        calculatePullTabTotals();
    }
}

// Calculate totals for custom pull-tab games
function calculateCustomGameTotals(input) {
    const row = input.closest('tr');
    if (!row) return;

    const priceInput = row.querySelector('.ticket-price-input');
    const ticketsInput = row.querySelector('.tickets-input');
    const prizesInput = row.querySelector('.prizes-input');
    const salesCell = row.querySelector('.sales-cell');
    const idealCell = row.querySelector('.ideal-cell');
    const netCell = row.querySelector('.net-cell');

    const price = parseFloat(priceInput?.value || 0);
    const tickets = parseInt(ticketsInput?.value || 0);
    const prizes = parseFloat(prizesInput?.value || 0);

    // Calculate sales (price * tickets)
    const sales = price * tickets;

    // For custom games, ideal profit is unknown, so show N/A or 0
    const ideal = 0;

    // Net = Sales - Prizes
    const net = sales - prizes;

    if (salesCell) salesCell.textContent = `$${sales.toFixed(2)}`;
    if (idealCell) idealCell.textContent = 'N/A';
    if (netCell) netCell.textContent = `$${net.toFixed(2)}`;

    // Recalculate overall totals
    calculatePullTabTotals();
}

// Calculate overall pull-tab totals
function calculatePullTabTotals() {
    console.log('=== calculatePullTabTotals CALLED ===');

    const rows = document.querySelectorAll('#pulltab-body tr');
    console.log('Found rows:', rows.length);

    // Separate regular games from special events
    let regSales = 0, regIdeal = 0, regPrizes = 0, regNet = 0;
    let seSales = 0, seIdeal = 0, sePrizes = 0, seNet = 0;

    rows.forEach((row, index) => {
        const isSpecialEvent = row.querySelector('.se-checkbox')?.checked || false;

        const salesCell = row.querySelector('.sales-cell');
        const idealCell = row.querySelector('.ideal-cell');
        const prizesInput = row.querySelector('.prizes-input');
        const netCell = row.querySelector('.net-cell');

        const sales = parseFloat(salesCell?.textContent?.replace('$', '')) || 0;
        const ideal = parseFloat(idealCell?.textContent?.replace('$', '')) || 0;
        const prizes = parseFloat(prizesInput?.value) || 0;
        const net = parseFloat(netCell?.textContent?.replace('$', '')) || 0;

        console.log(`Row ${index}: SE=${isSpecialEvent}, Sales=${sales}, Ideal=${ideal}, Prizes=${prizes}, Net=${net}`);

        if (isSpecialEvent) {
            seSales += sales;
            seIdeal += ideal;
            sePrizes += prizes;
            seNet += net;
        } else {
            regSales += sales;
            regIdeal += ideal;
            regPrizes += prizes;
            regNet += net;
        }
    });

    console.log('Regular totals:', { regSales, regIdeal, regPrizes, regNet });
    console.log('SE totals:', { seSales, seIdeal, sePrizes, seNet });

    // Update footer totals - Regular Games
    const ptRegSales = document.getElementById('pt-reg-sales');
    const ptRegIdeal = document.getElementById('pt-reg-ideal');
    const ptRegPrizes = document.getElementById('pt-reg-prizes');
    const ptRegNet = document.getElementById('pt-reg-net');

    if (ptRegSales) ptRegSales.textContent = `$${regSales.toFixed(2)}`;
    if (ptRegIdeal) ptRegIdeal.textContent = `$${regIdeal.toFixed(2)}`;
    if (ptRegPrizes) ptRegPrizes.textContent = `$${regPrizes.toFixed(2)}`;
    if (ptRegNet) ptRegNet.textContent = `$${regNet.toFixed(2)}`;

    // Update footer totals - Special Events
    const ptSeSales = document.getElementById('pt-se-sales');
    const ptSeIdeal = document.getElementById('pt-se-ideal');
    const ptSePrizes = document.getElementById('pt-se-prizes');
    const ptSeNet = document.getElementById('pt-se-net');

    if (ptSeSales) ptSeSales.textContent = `$${seSales.toFixed(2)}`;
    if (ptSeIdeal) ptSeIdeal.textContent = `$${seIdeal.toFixed(2)}`;
    if (ptSePrizes) ptSePrizes.textContent = `$${sePrizes.toFixed(2)}`;
    if (ptSeNet) ptSeNet.textContent = `$${seNet.toFixed(2)}`;

    // Update footer totals - All Pull-Tab Games
    const allSales = regSales + seSales;
    const allIdeal = regIdeal + seIdeal;
    const allPrizes = regPrizes + sePrizes;
    const allNet = regNet + seNet;

    const ptAllSales = document.getElementById('pt-all-sales');
    const ptAllIdeal = document.getElementById('pt-all-ideal');
    const ptAllPrizes = document.getElementById('pt-all-prizes');
    const ptAllNet = document.getElementById('pt-all-net');

    if (ptAllSales) ptAllSales.textContent = `$${allSales.toFixed(2)}`;
    if (ptAllIdeal) ptAllIdeal.textContent = `$${allIdeal.toFixed(2)}`;
    if (ptAllPrizes) ptAllPrizes.textContent = `$${allPrizes.toFixed(2)}`;
    if (ptAllNet) ptAllNet.textContent = `$${allNet.toFixed(2)}`;

    console.log('Footer updated successfully');

    // Update Offage Analysis section
    const offageGamesNet = document.getElementById('offage-games-net');
    if (offageGamesNet) {
        offageGamesNet.textContent = `$${allNet.toFixed(2)}`;
    }

    // Calculate and update Over/Short
    calculateOffageAnalysis();

    // Save to app data
    if (window.app && window.app.data) {
        window.app.data.pullTabSales = allSales;
        window.app.data.pullTabPrizes = allPrizes;
        window.app.data.pullTabNet = allNet;
    }
}

// ============================================
// PULL-TAB DRAWER CALCULATION
// ============================================

function calculatePullTabDrawer() {
    console.log('=== calculatePullTabDrawer CALLED ===');

    const denominations = {
        100: parseFloat(document.getElementById('pt-drawer-100')?.value) || 0,
        50: parseFloat(document.getElementById('pt-drawer-50')?.value) || 0,
        20: parseFloat(document.getElementById('pt-drawer-20')?.value) || 0,
        10: parseFloat(document.getElementById('pt-drawer-10')?.value) || 0,
        5: parseFloat(document.getElementById('pt-drawer-5')?.value) || 0,
        2: parseFloat(document.getElementById('pt-drawer-2')?.value) || 0,
        1: parseFloat(document.getElementById('pt-drawer-1')?.value) || 0,
        coins: parseFloat(document.getElementById('pt-drawer-coins')?.value) || 0
    };

    const total = denominations[100] + denominations[50] + denominations[20] +
                  denominations[10] + denominations[5] + denominations[2] +
                  denominations[1] + denominations.coins;

    // Update total display on Pull-Tabs tab
    const ptDrawerTotal = document.getElementById('pt-drawer-total');
    if (ptDrawerTotal) {
        ptDrawerTotal.textContent = `$${total.toFixed(2)}`;
    }

    // Update read-only displays on Money Count tab
    document.getElementById('pt-100-display').textContent = `$${denominations[100].toFixed(2)}`;
    document.getElementById('pt-50-display').textContent = `$${denominations[50].toFixed(2)}`;
    document.getElementById('pt-20-display').textContent = `$${denominations[20].toFixed(2)}`;
    document.getElementById('pt-10-display').textContent = `$${denominations[10].toFixed(2)}`;
    document.getElementById('pt-5-display').textContent = `$${denominations[5].toFixed(2)}`;
    document.getElementById('pt-2-display').textContent = `$${denominations[2].toFixed(2)}`;
    document.getElementById('pt-1-display').textContent = `$${denominations[1].toFixed(2)}`;
    document.getElementById('pt-coins-display').textContent = `$${denominations.coins.toFixed(2)}`;

    const ptTotal = document.getElementById('pt-total');
    if (ptTotal) {
        ptTotal.textContent = `$${total.toFixed(2)}`;
    }

    // Update Offage Analysis
    const offageDrawerTotal = document.getElementById('offage-drawer-total');
    if (offageDrawerTotal) {
        offageDrawerTotal.textContent = `$${total.toFixed(2)}`;
    }

    // Calculate Over/Short
    calculateOffageAnalysis();

    // Save to app data
    if (window.app && window.app.data) {
        if (!window.app.data.moneyCount) window.app.data.moneyCount = {};
        if (!window.app.data.moneyCount.pullTab) window.app.data.moneyCount.pullTab = {};
        window.app.data.moneyCount.pullTab = {
            ...denominations,
            total: total
        };
    }

    console.log('Pull-Tab Drawer Total:', total);
}

// ============================================
// OFFAGE ANALYSIS CALCULATION
// ============================================

function calculateOffageAnalysis() {
    console.log('=== calculateOffageAnalysis CALLED ===');

    // Get drawer total
    const drawerTotalEl = document.getElementById('pt-drawer-total');
    const drawerTotal = drawerTotalEl ? parseFloat(drawerTotalEl.textContent.replace('$', '')) || 0 : 0;

    // Get games net
    const gamesNetEl = document.getElementById('pt-all-net');
    const gamesNet = gamesNetEl ? parseFloat(gamesNetEl.textContent.replace('$', '')) || 0 : 0;

    // Calculate Over/Short (Drawer - Games Net)
    const overShort = drawerTotal - gamesNet;

    // Update display
    const offageOvershort = document.getElementById('offage-overshort');
    if (offageOvershort) {
        offageOvershort.textContent = `$${overShort.toFixed(2)}`;

        // Color code based on positive/negative
        const parentCell = offageOvershort.parentElement;
        if (overShort > 0) {
            parentCell.style.color = '#27ae60'; // Green for over
        } else if (overShort < 0) {
            parentCell.style.color = '#e74c3c'; // Red for short
        } else {
            parentCell.style.color = '#2c3e50'; // Default for zero
        }
    }

    console.log('Offage Analysis - Drawer:', drawerTotal, 'Games Net:', gamesNet, 'Over/Short:', overShort);
}

// Make functions globally accessible
window.calculatePullTabDrawer = calculatePullTabDrawer;
window.calculateOffageAnalysis = calculateOffageAnalysis;