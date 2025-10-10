// Configuration - Make CONFIG globally available
// V2.0.0 - Enhanced with new financial tracking structure

window.CONFIG = {
    API_URL: 'https://script.google.com/macros/s/AKfycbx3A7363PHe2GhHxbTW-R_D1BjP-Skt7-znnjkpO1qV7gYrT2OePNwvWMdgVVkHQ1OPtA/exec',
    APP_NAME: 'RLC Bingo Manager V2',
    VERSION: '2.3.12',

    // Startup cash for bingo drawer
    BINGO_STARTUP_CASH: 1000,

    STORAGE_KEYS: {
        CURRENT_SESSION: 'rlc_v2_current_session',
        DRAFT_DATA: 'rlc_v2_draft_data',
        SYNC_QUEUE: 'rlc_v2_sync_queue',
        THEME: 'rlc_theme',
        PULL_TAB_LIBRARY: 'rlc_pulltab_library'
    },

    SESSION_TYPES: {
        '5-1': '1st/5th Monday',
        '6-2': '2nd Monday',
        '7-3': '3rd Monday',
        '8-4': '4th Monday'
    },

    PAPER_TYPES: [
        { id: 'eb', name: 'Early Birds', hasFree: true },
        { id: '6f', name: '6 Packs', hasFree: true },
        { id: '9fs', name: 'Solid Border 9', hasFree: false },
        { id: '9fst', name: 'Stripe Border 9', hasFree: false },
        { id: 'p3', name: '$1.00 Progressives', hasFree: false },
        { id: 'p18', name: '$5.00 Progressives', hasFree: false }
    ],

    POS_ITEMS: [
        // Electronic Machines (at top for door sales entry order)
        { id: 'small-machine', name: '27reg/18pro (Small Machine)', price: 40, category: 'Electronic' },
        { id: 'large-machine', name: '45reg/36pro (Large Machine)', price: 65, category: 'Electronic' },

        // Miscellaneous category
        { id: 'dauber', name: 'Dauber', price: 2, category: 'Miscellaneous' },

        // Paper category (alphabetical, with 6/9-face before birthday)
        { id: '6-face', name: '6 Packs', price: 10, category: 'Paper' },
        { id: '9-face-solid', name: 'Solid Border 9', price: 15, category: 'Paper' },
        { id: '9-face-stripe', name: 'Stripe Border 9', price: 10, category: 'Paper' },
        { id: 'birthday-pack', name: 'Birthdays (BOGOs)', price: 0, category: 'Paper' },
        { id: 'coverall', name: 'Coverall Extra', price: 1, category: 'Paper' },
        { id: 'double-action', name: 'Early Bird Double', price: 5, category: 'Paper' },
        { id: 'letter-x', name: 'Letter X Extra', price: 1, category: 'Paper' },
        { id: 'number7', name: 'Number 7 Extra', price: 1, category: 'Paper' },
        { id: '18-face-prog', name: '$5.00 Progressives', price: 5, category: 'Paper' },
        { id: '3-face-prog', name: '$1.00 Progressives', price: 1, category: 'Paper' }
    ],

    MANUAL_COUNT_ITEMS: [
        { id: 'eb', name: 'Early Birds', hasFree: true },
        { id: '6f', name: '6 Face', hasFree: true },
        { id: '9fs', name: '9 Face Solid Border', hasFree: false },
        { id: '9fst', name: '9 Face Stripe Border', hasFree: false },
        { id: 'p3', name: 'Progressive 3 Face ($1)', hasFree: false },
        { id: 'p18', name: 'Progressive 18 Face ($5)', hasFree: false }
    ],

    // V2-specific: Financial field mapping
    FINANCIAL_FIELDS: {
        BINGO: [
            'bingoElectronicSales',
            'bingoMiscellaneousSales',
            'bingoPaperSales',
            'bingoSales',
            'bingoPrizesPaid',
            'bingoNetProfit',
            'bingoDeposit',
            'bingoStartupCash',
            'bingoNetDeposit',
            'bingoOverShort'
        ],
        PULLTAB: [
            'pullTabRegularSales',
            'pullTabSpecialSales',
            'pullTabSales',
            'pullTabRegularPrizesPaid',
            'pullTabSpecialPrizesPaid',
            'pullTabPrizes',
            'pullTabPrizesPaidByCheck',
            'pulltabNetProfit',
            'pullTabNetDeposit',
            'pullTabOverShort'
        ],
        TOTALS: [
            'totalSales',
            'totalPrizesPaid',
            'totalPrizesPaidByCheck',
            'totalNetProfit',
            'totalCurrencyDeposit',
            'totalCoinDeposit',
            'totalCheckDeposit',
            'totalActualDeposit',
            'totalNetDeposit',
            'totalOverShort'
        ]
    }
};
