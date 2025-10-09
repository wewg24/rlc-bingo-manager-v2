/**
 * Format Converter - V1 to V2 Compatibility Layer
 * Automatically converts legacy V1 occasion data to new V2 format
 *
 * V2.0.0 - 2025-10-09
 */

/**
 * Detect if data is in V1 format
 * @param {Object} data - Occasion data object
 * @returns {boolean} - True if V1 format detected
 */
function isV1Format(data) {
    if (!data) return false;

    // V1 indicators:
    // - Has root-level 'progressive' object
    // - Has occasion.birthdays instead of birthdayBOGOs
    // - Has old financial structure (totalElectronicSales instead of bingoElectronicSales)
    // - Missing new fields like bingoNetDeposit, pullTabOverShort

    const hasRootProgressive = data.progressive && !data.occasion?.progressive;
    const hasBirthdaysField = data.occasion?.birthdays !== undefined && data.occasion?.birthdayBOGOs === undefined;
    const hasOldFinancial = data.financial?.totalElectronicSales !== undefined;
    const missingNewFinancial = data.financial?.bingoNetDeposit === undefined;

    return hasRootProgressive || hasBirthdaysField || (hasOldFinancial && missingNewFinancial);
}

/**
 * Convert V1 occasion data to V2 format
 * @param {Object} v1Data - V1 format occasion data
 * @returns {Object} - V2 format occasion data
 */
function convertV1ToV2(v1Data) {
    console.log('🔄 Converting V1 format to V2...');

    if (!v1Data) {
        console.error('Cannot convert null/undefined data');
        return null;
    }

    // Create V2 structure
    const v2Data = {
        occasion: convertOccasion(v1Data.occasion, v1Data.progressive),
        paperBingo: v1Data.paperBingo || {},
        posSales: convertPosSales(v1Data.posSales),
        electronic: v1Data.electronic || {},
        games: v1Data.games || [],
        pullTabs: v1Data.pullTabs || [],
        moneyCount: v1Data.moneyCount || { bingo: {}, pullTab: {} },
        financial: convertFinancial(v1Data),
        id: v1Data.id,
        created: v1Data.created,
        modified: v1Data.modified || new Date().toISOString()
    };

    console.log('✅ V1→V2 conversion complete');
    return v2Data;
}

/**
 * Convert occasion object (V1→V2)
 * - Rename birthdays → birthdayBOGOs
 * - Move root progressive into occasion.progressive
 */
function convertOccasion(v1Occasion, rootProgressive) {
    const v2Occasion = { ...v1Occasion };

    // Rename birthdays → birthdayBOGOs
    if (v1Occasion.birthdays !== undefined) {
        v2Occasion.birthdayBOGOs = v1Occasion.birthdays;
        delete v2Occasion.birthdays;
    }

    // Move root-level progressive into occasion
    if (rootProgressive && !v2Occasion.progressive) {
        v2Occasion.progressive = {
            jackpot: rootProgressive.jackpot || 0,
            ballsNeeded: rootProgressive.ballsNeeded || 21,
            ballsActual: rootProgressive.ballsActual || rootProgressive.ballsNeeded || 21,
            consolation: rootProgressive.consolation || 0
        };
    }

    return v2Occasion;
}

/**
 * Convert posSales object (V1→V2)
 * - Replace birthday-pack with birthdayBOGOs entry
 * - Remove redundant birthday entry
 */
function convertPosSales(v1PosSales) {
    if (!v1PosSales) return {};

    const v2PosSales = { ...v1PosSales };

    // Add birthdayBOGOs entry if birthday-pack exists
    if (v1PosSales['birthday-pack']) {
        v2PosSales.birthdayBOGOs = {
            price: 0,
            quantity: v1PosSales['birthday-pack'].quantity || 0,
            total: 0
        };
    }

    // Remove old birthday entry (usually zero anyway)
    if (v2PosSales.birthday) {
        delete v2PosSales.birthday;
    }

    return v2PosSales;
}

/**
 * Convert financial object (V1→V2)
 * This is the most complex conversion - expand 12 fields to 30+
 */
function convertFinancial(v1Data) {
    const v1Financial = v1Data.financial || {};
    const v1MoneyCount = v1Data.moneyCount || { bingo: {}, pullTab: {} };
    const pullTabs = v1Data.pullTabs || [];

    // Calculate pull-tab regular vs special event
    const ptRegular = pullTabs.filter(pt => !pt.isSpecialEvent);
    const ptSpecial = pullTabs.filter(pt => pt.isSpecialEvent);

    const pullTabRegularSales = ptRegular.reduce((sum, pt) => sum + (pt.sales || 0), 0);
    const pullTabSpecialSales = ptSpecial.reduce((sum, pt) => sum + (pt.sales || 0), 0);
    const pullTabRegularPrizesPaid = ptRegular.reduce((sum, pt) => sum + (pt.prizesPaid || 0), 0);
    const pullTabSpecialPrizesPaid = ptSpecial.reduce((sum, pt) => sum + (pt.prizesPaid || 0), 0);

    // Calculate deposits from money counts
    const bingoDeposit = calculateDepositTotal(v1MoneyCount.bingo);
    const pullTabDeposit = calculateDepositTotal(v1MoneyCount.pullTab);

    // Calculate currency vs coins
    const bingoCurrency = calculateCurrencyTotal(v1MoneyCount.bingo);
    const bingoCoins = v1MoneyCount.bingo?.coins || 0;
    const bingoChecks = v1MoneyCount.bingo?.checks || 0;

    const pullTabCurrency = calculateCurrencyTotal(v1MoneyCount.pullTab);
    const pullTabCoins = v1MoneyCount.pullTab?.coins || 0;

    // Bingo calculations
    const bingoSales = v1Financial.totalBingoSales || v1Financial.bingoSales || 0;
    const bingoPrizesPaid = v1Financial.bingoPrizesPaid || 0;
    const bingoNetProfit = bingoSales - bingoPrizesPaid;
    const bingoStartupCash = 1000; // Default startup cash (may need to be input)
    const bingoNetDeposit = bingoDeposit - bingoStartupCash;
    const bingoOverShort = bingoNetDeposit - bingoNetProfit;

    // Pull-Tab calculations
    const pullTabSales = pullTabRegularSales + pullTabSpecialSales;
    const pullTabPrizes = pullTabRegularPrizesPaid + pullTabSpecialPrizesPaid;
    const pulltabNetProfit = pullTabSales - pullTabPrizes;
    const pullTabNetDeposit = pullTabDeposit; // No startup cash for pull-tabs
    const pullTabOverShort = pullTabNetDeposit - pulltabNetProfit;

    // Total calculations
    const totalSales = bingoSales + pullTabSales;
    const totalPrizesPaid = bingoPrizesPaid + pullTabPrizes;
    const totalPrizesPaidByCheck = 0; // Would need to calculate from checkPayment flags
    const totalNetProfit = totalSales - totalPrizesPaid;
    const totalCurrencyDeposit = bingoCurrency + pullTabCurrency;
    const totalCoinDeposit = bingoCoins + pullTabCoins;
    const totalCheckDeposit = bingoChecks;
    const totalActualDeposit = bingoDeposit + pullTabDeposit;
    const totalNetDeposit = bingoNetDeposit + pullTabNetDeposit;
    const totalOverShort = bingoOverShort + pullTabOverShort;

    return {
        // Bingo Section
        bingoElectronicSales: v1Financial.totalElectronicSales || 0,
        bingoMiscellaneousSales: v1Financial.totalMiscellaneousSales || 0,
        bingoPaperSales: v1Financial.totalPaperSales || 0,
        bingoSales: bingoSales,
        bingoPrizesPaid: bingoPrizesPaid,
        bingoNetProfit: bingoNetProfit,
        bingoDeposit: bingoDeposit,
        bingoStartupCash: bingoStartupCash,
        bingoNetDeposit: bingoNetDeposit,
        bingoOverShort: bingoOverShort,

        // Pull-Tab Section
        pullTabRegularSales: pullTabRegularSales,
        pullTabSpecialSales: pullTabSpecialSales,
        pullTabSales: pullTabSales,
        pullTabRegularPrizesPaid: pullTabRegularPrizesPaid,
        pullTabSpecialPrizesPaid: pullTabSpecialPrizesPaid,
        pullTabPrizes: pullTabPrizes,
        pullTabPrizesPaidByCheck: 0, // Calculate if needed
        pulltabNetProfit: pulltabNetProfit,
        pullTabNetDeposit: pullTabNetDeposit,
        pullTabOverShort: pullTabOverShort,

        // Totals Section
        totalSales: totalSales,
        totalPrizesPaid: totalPrizesPaid,
        totalPrizesPaidByCheck: totalPrizesPaidByCheck,
        totalNetProfit: totalNetProfit,
        totalCurrencyDeposit: totalCurrencyDeposit,
        totalCoinDeposit: totalCoinDeposit,
        totalCheckDeposit: totalCheckDeposit,
        totalActualDeposit: totalActualDeposit,
        totalNetDeposit: totalNetDeposit,
        totalOverShort: totalOverShort
    };
}

/**
 * Calculate total deposit from money count object
 */
function calculateDepositTotal(moneyCount) {
    if (!moneyCount) return 0;

    return (
        (moneyCount['1'] || 0) * 1 +
        (moneyCount['2'] || 0) * 2 +
        (moneyCount['5'] || 0) * 5 +
        (moneyCount['10'] || 0) * 10 +
        (moneyCount['20'] || 0) * 20 +
        (moneyCount['50'] || 0) * 50 +
        (moneyCount['100'] || 0) * 100 +
        (moneyCount.coins || 0) +
        (moneyCount.checks || 0)
    );
}

/**
 * Calculate currency total (excluding coins and checks)
 */
function calculateCurrencyTotal(moneyCount) {
    if (!moneyCount) return 0;

    return (
        (moneyCount['1'] || 0) * 1 +
        (moneyCount['2'] || 0) * 2 +
        (moneyCount['5'] || 0) * 5 +
        (moneyCount['10'] || 0) * 10 +
        (moneyCount['20'] || 0) * 20 +
        (moneyCount['50'] || 0) * 50 +
        (moneyCount['100'] || 0) * 100
    );
}

/**
 * Export V2 data to V1 format (for backward compatibility export)
 * NOTE: This loses some V2 detail (regular/special split, over/short per category)
 */
function convertV2ToV1(v2Data) {
    console.log('🔄 Converting V2 format to V1 (export mode)...');

    if (!v2Data) {
        console.error('Cannot convert null/undefined data');
        return null;
    }

    const v1Data = {
        occasion: {
            ...v2Data.occasion,
            birthdays: v2Data.occasion.birthdayBOGOs || v2Data.occasion.birthdays || 0
        },
        paperBingo: v2Data.paperBingo,
        posSales: v2Data.posSales,
        electronic: v2Data.electronic,
        games: v2Data.games,
        pullTabs: v2Data.pullTabs,
        moneyCount: v2Data.moneyCount,
        financial: {
            totalElectronicSales: v2Data.financial.bingoElectronicSales || 0,
            totalMiscellaneousSales: v2Data.financial.bingoMiscellaneousSales || 0,
            totalPaperSales: v2Data.financial.bingoPaperSales || 0,
            totalBingoSales: v2Data.financial.bingoSales || 0,
            pullTabSales: v2Data.financial.pullTabSales || 0,
            specialEventSales: v2Data.financial.pullTabSpecialSales || 0,
            grossSales: v2Data.financial.totalSales || 0,
            bingoPrizesPaid: v2Data.financial.bingoPrizesPaid || 0,
            pullTabPrizesPaid: v2Data.financial.pullTabPrizes || 0,
            specialEventPrizesPaid: v2Data.financial.pullTabSpecialPrizesPaid || 0,
            totalPrizesPaid: v2Data.financial.totalPrizesPaid || 0,
            prizesPaidByCheck: v2Data.financial.totalPrizesPaidByCheck || 0,
            idealProfit: v2Data.financial.totalNetProfit || 0,
            overShort: v2Data.financial.totalOverShort || 0,
            totalCashDeposit: v2Data.financial.totalActualDeposit || 0,
            actualProfit: v2Data.financial.totalNetDeposit || 0
        },
        sessionType: v2Data.occasion.sessionType,
        progressive: v2Data.occasion.progressive || {},
        pullTabSales: v2Data.financial.pullTabSales || 0,
        pullTabPrizes: v2Data.financial.pullTabPrizes || 0,
        pullTabNet: v2Data.financial.pulltabNetProfit || 0,
        id: v2Data.id,
        created: v2Data.created,
        modified: v2Data.modified
    };

    // Remove progressive from occasion if it was moved
    if (v1Data.occasion.progressive) {
        delete v1Data.occasion.progressive;
    }

    // Remove birthdayBOGOs from occasion
    if (v1Data.occasion.birthdayBOGOs) {
        delete v1Data.occasion.birthdayBOGOs;
    }

    console.log('✅ V2→V1 conversion complete (for export)');
    return v1Data;
}

// Make functions available globally
window.isV1Format = isV1Format;
window.convertV1ToV2 = convertV1ToV2;
window.convertV2ToV1 = convertV2ToV1;
