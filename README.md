# RLC Bingo Manager V2

## Overview
Version 2.0 of the RLC Bingo Manager with improved financial tracking, enhanced JSON structure, and backward compatibility with V1 data.

## Key Improvements Over V1

### Enhanced Financial Tracking
- **Separate Bingo/Pull-Tab Deposits**: Track each revenue stream independently
- **Over/Short Analysis**: Per-category (Bingo vs Pull-Tab) variance tracking
- **Special Event Separation**: Dedicated tracking for special event pull-tabs
- **Startup Cash Tracking**: Record starting drawer amounts
- **Detailed Deposit Breakdown**: Currency, coins, and checks separated

### Improved Data Structure
- **Progressive Data Organization**: Moved to `occasion.progressive` for better grouping
- **Birthday BOGOs**: Renamed from `birthdays` for clarity
- **Consolidated Fields**: Removed redundant root-level fields
- **Granular Financial Fields**: 30+ fields vs 12 in V1

### Backward Compatibility
- **V1 Data Import**: Automatically convert legacy format on load
- **Parallel Operation**: Can run alongside V1 during migration period
- **Export/Import Tools**: Easy data migration between versions

## Version History

### V2.0.0 (2025-10-09)
- Initial V2 release
- New JSON format with enhanced financial tracking
- Backward compatibility layer for V1 data
- Improved UI for drawer tracking (side-by-side layout)
- Single-column money count entry for keyboard navigation

## Frontend Deployment
- **URL**: https://wewg24.github.io/rlc-bingo-manager-v2/
- **Method**: GitHub Pages (automatic from `main` branch)

## Backend Deployment
- **Platform**: Google Apps Script
- **Deploy**: Use `clasp push` and `clasp deploy`

## License
Internal use only - Rolla Lions Club
