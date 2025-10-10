# RLC Bingo Manager V2 - Claude Development Notes

## Project Structure

### Frontend (GitHub Repository)
- Repository: https://github.com/wewg24/rlc-bingo-manager-v2
- Frontend files: `index.html` (occasion entry), `admin.html` (dashboard)
- Hosted on GitHub Pages: https://wewg24.github.io/rlc-bingo-manager-v2/
- **Deploy Process**: Git commit and push to `main` branch

### Backend (Google Apps Script Project)
- **Project ID**: `1z4s9-QMy34Y9DeVKInecGZrcWiZFdm0i2HweSa2Gj47fKF76HclpM4Te`
- **Script URL**: https://script.google.com/d/1z4s9-QMy34Y9DeVKInecGZrcWiZFdm0i2HweSa2Gj47fKF76HclpM4Te/edit
- **Files**: `Code.js` + `appsscript.json` (only these two files)
- **Web App URL**: https://script.google.com/macros/s/AKfycbzpS12P38xjggfluuj8i2emlzdhaSGfCXXctdsWiwBXKYxfHQ1Xrzcdaotzf-CVFiG-FQ/exec
- **Library URL**: https://script.google.com/macros/library/d/1z4s9-QMy34Y9DeVKInecGZrcWiZFdm0i2HweSa2Gj47fKF76HclpM4Te/5
- **Deployment**: Version 5 (Web App - 2025-10-09 10:16 AM)
- **Deployment ID**: `AKfycbzpS12P38xjggfluuj8i2emlzdhaSGfCXXctdsWiwBXKYxfHQ1Xrzcdaotzf-CVFiG-FQ`
- **Execute as**: Me (owner)
- **Access**: Anyone (public web app)
- **Timezone**: America/Chicago
- **Deploy Process**:
  1. `clasp push` to upload Code.js + appsscript.json
  2. Deploy → New deployment → Web app (via Google Apps Script editor)

## V2 JSON Format Specification

### Key Structural Changes from V1

1. **occasion.progressive** - Moved from root level to inside occasion object
   ```json
   {
     "occasion": {
       "progressive": {
         "jackpot": 1160,
         "ballsNeeded": 21,
         "ballsActual": 30,
         "consolation": 200
       }
     }
   }
   ```

2. **occasion.birthdayBOGOs** - Renamed from `birthdays`
   ```json
   {
     "occasion": {
       "birthdayBOGOs": 4  // was: birthdays
     }
   }
   ```

3. **Enhanced Financial Object** - Expanded from 12 to 30+ fields
   ```json
   {
     "financial": {
       // Bingo Section
       "bingoElectronicSales": 870,
       "bingoMiscellaneousSales": 26,
       "bingoPaperSales": 2663,
       "bingoSales": 3559,
       "bingoPrizesPaid": 2710,
       "bingoNetProfit": 849,
       "bingoDeposit": 1879,
       "bingoStartupCash": 1000,
       "bingoNetDeposit": 879,
       "bingoOverShort": 30,

       // Pull-Tab Section (Regular/Special separated)
       "pullTabRegularSales": 3705,
       "pullTabSpecialSales": 960,
       "pullTabSales": 4665,
       "pullTabRegularPrizesPaid": 2475,
       "pullTabSpecialPrizesPaid": 599,
       "pullTabPrizes": 3074,
       "pullTabPrizesPaidByCheck": 0,
       "pulltabNetProfit": 1591,
       "pullTabNetDeposit": 1577,
       "pullTabOverShort": -14,

       // Totals Section
       "totalSales": 8224,
       "totalPrizesPaid": 5784,
       "totalPrizesPaidByCheck": 0,
       "totalNetProfit": 2440,
       "totalCurrencyDeposit": 3455,
       "totalCoinDeposit": 1,
       "totalCheckDeposit": 0,
       "totalActualDeposit": 3456,
       "totalNetDeposit": 2456,
       "totalOverShort": 16
     }
   }
   ```

4. **Removed Redundant Root Fields**
   - `sessionType` (already in occasion.sessionType)
   - `progressive` (moved to occasion.progressive)
   - `pullTabSales`, `pullTabPrizes`, `pullTabNet` (now in financial)

## Deployment Commands

### Deploy Frontend Changes
```bash
cd "C:\Users\bill.wiggins\OneDrive - Phelps County Bank\Lion's Club\Bingo\Project\rlc-bingo-manager-v2"
git add <files>
git commit -m "Description of changes"
git push origin main
```

### Deploy Backend Changes
```bash
cd "C:\Users\bill.wiggins\OneDrive - Phelps County Bank\Lion's Club\Bingo\Project\rlc-bingo-manager-v2"
clasp push
clasp deploy --description "Description of changes"
```

## V1 Compatibility Layer

The file `js/formatConverter.js` provides automatic conversion of V1 format to V2:

```javascript
// Usage in wizard.js loadOccasionData():
if (isV1Format(data)) {
    data = convertV1ToV2(data);
}
```

### Conversion Rules:
1. Rename `occasion.birthdays` → `occasion.birthdayBOGOs`
2. Move root `progressive` → `occasion.progressive`
3. Expand `financial` object with calculated fields
4. Separate pull-tab regular/special event totals
5. Calculate over/short per category
6. Add deposit breakdown (currency/coins/checks)

## Development Guidelines

### Financial Calculations
All financial calculations should:
1. Separate regular vs special event pull-tabs
2. Calculate over/short for bingo and pull-tabs independently
3. Track startup cash and net deposits
4. Break down deposits by currency, coins, checks

### Data Validation
Before saving, validate:
1. All required fields present
2. Calculated fields match source data
3. Over/short calculations are accurate
4. Regular + Special = Total for pull-tabs

### Testing
Test V2 with:
1. New V2 format data (create from scratch)
2. V1 format data (test conversion)
3. Edge cases (no pull-tabs, no special events, etc.)

## Important Notes

1. **V2 can read V1 data** - Conversion happens automatically
2. **V1 cannot read V2 data** - One-way migration
3. **Run parallel** - V1 and V2 can coexist during transition
4. **Keep V1 active** - Safety net for 6-12 months
5. **No data loss** - V2 preserves all V1 information

## Current Version
- **Frontend**: v2.3.8
- **Backend**: v2.3.8
- **Status**: Ready for Testing

## Recent Changes (2025-10-09)

### v2.3.8 - Fix Status Field Preservation in Submission

#### Critical Bug Fix
Fixed bug where status field was not being saved to individual occasion JSON files, causing submitted occasions to appear as 'draft' in occasions-index.json and dashboard.

**Root Cause:**
- Status field was set in frontend (`window.app.data.status = 'submitted'`) and included in JSON data
- However, the field was being lost during transmission or backend processing
- Backend's `updateOccasionsIndex()` reads `occasionData.status || 'draft'`, so missing field defaulted to 'draft'

**Solution:**
- **Frontend (wizard.js:2739-2742)**: Send status, submittedAt, and submittedBy as separate POST parameters in addition to including them in the JSON data object
- **Backend (Code.js:98-102)**: Extract separate status fields from POST parameters
- **Backend (Code.js:1118-1130)**: Explicitly add status fields to occasionData before saving to ensure they're preserved in the JSON file

**Files Modified:**
- **js/wizard.js** (lines 2729, 2739-2742): Added Object.keys debug log, send status fields as separate parameters
- **Code.js** (lines 98-103, 1090, 1093, 1118-1130): Accept and explicitly apply status fields parameter

**Impact:**
- Submitted occasions now correctly show `status: 'submitted'` in both individual JSON files and occasions-index.json
- Dashboard properly displays submission status (Draft/Submitted/Finalized)
- Status workflow (draft → submitted → finalized) now functions correctly

### v2.3.7 - Add Debugging Logs for Status Field Investigation

#### Diagnostic Logging
Added comprehensive debug logging to trace status field through submission process (deployed but user cache prevented testing).

**Frontend Logs (wizard.js:2727-2729)**:
- Log status value before submission
- Log whether status field exists in submissionData
- Log all root-level keys in submissionData

**Backend Logs (Code.js:1112-1113)**:
- Log status field value or 'MISSING' if not present
- Log all root-level fields in received occasionData

### v2.3.6 - Dashboard Display and Money Count Fixes

#### Bug Fixes
1. **Fixed nav-occasions addEventListener error** - Removed reference to deleted Occasions tab
2. **Fixed dashboard data display** - Modified api-service.js to read from nested `occasion.occasion.*` structure
3. **Fixed Money Count calculations** - Added `calculateFinalTotals()` call in `loadMoneyCount()`
4. **Fixed Submit status** - Updated `submitOccasion()` to set status before creating submission data
5. **Added version labels** - Added (v2.3.6) to both admin and occasion page headers
6. **Changed title** - "Mobile Occasion Entry" → "Occasion Entry"

### v2.3.3 - Complete Admin CRUD Implementation

#### All Admin Functions Now Fully Operational
Completed implementation of View, Edit, and Delete functions for occasion management in admin dashboard.

#### Features Implemented

**1. View Occasion (viewOccasion)**
- Loads full occasion data from server via JSONP
- Modal displays comprehensive occasion details:
  - **Occasion Info**: Date, Session Type, Lion in Charge, Pull-Tab Worker, Total Players, Birthday BOGOs, Status
  - **Financial Summary**: Bingo/Pull-Tab/Total Sales, Prizes, Net Profit
- Read-only display with close button
- Professional table layout with color-coded sections

**2. Edit Occasion (editOccasion) - Enhanced**
- Modal now has close button (X) in header
- Readonly fields (ID, Date, Session) styled with gray background
- Only Status field is editable (dropdown: draft/submitted/finalized)
- Auto-focus on Status field for quick editing
- Helpful hint: "💡 Change to 'Draft' to allow editing in mobile interface"
- Updates occasion status via backend API
- Refreshes table after successful save

**3. Delete Occasion (deleteOccasion) - New Implementation**
- Confirmation dialog shows occasion date and ID
- Clear warning: "⚠️ This action CANNOT be undone!"
- User can cancel before deletion
- Calls backend `deleteOccasion` API action
- Refreshes both occasions table and dashboard
- Success/error notifications

**4. Modal System CSS (admin.css)**
- Professional modal overlay with semi-transparent backdrop
- Smooth animations (fade-in, slide-in)
- Responsive sizing (max 90% viewport)
- Scrollable modal body for long content
- Close button with hover effect
- Details table styling for view mode
- Form styling for edit mode
- Full dark mode support
- Z-index 9999 for proper layering

#### Files Modified
- **js/ui-components.js** (lines 698-978): Implemented viewOccasion(), enhanced editOccasion(), implemented deleteOccasion()
- **css/admin.css** (lines 696-864): Complete modal system styling

#### User Experience Improvements
- All action buttons now work as expected
- Professional modal dialogs replace browser alerts
- Clear visual distinction between readonly and editable fields
- Consistent styling across all modals
- Smooth animations for better UX

### v2.3.2 - Admin Dashboard Data Display Fix

#### Issues Fixed
Admin dashboard and Occasions tab were displaying incorrect data despite API returning correct values.

**Symptoms:**
- Date showing as 7/13 instead of 7/14
- Session Type showing "Unknown" instead of "6-2 (2nd Monday)"
- Lion in Charge showing "N/A" instead of "Wayne Parry"
- Players showing 0 instead of 85
- Revenue showing $0 instead of actual values

**Root Cause:**
API returns nested data structure where detailed information is in `occasion.occasion.*` but rendering code was reading from top level `occasion.*`.

**Changes:**
- **dashboard.js** `renderOccasionRowInline()`: Read from `occasion.occasion.*` for nested data
- **ui-components.js** `renderOccasionRow()`: Same fix for Occasions tab
- Both now correctly extract: `sessionType`, `lionInCharge`, `totalPlayers`, and revenue from `financial.totalSales`

**Files Modified:**
- js/dashboard.js (lines 108-139): Fixed data extraction from nested structure
- js/ui-components.js (lines 265-296): Fixed data extraction from nested structure

### v2.3.1 - Critical Bug Fixes for Occasion Entry

#### Issues Identified from Testing
After thorough testing with real data (2025-07-14 occasion), identified and fixed 4 critical bugs:

#### Bug Fixes

**1. ReferenceError: grossSales is not defined** (wizard.js:2577)
- **Symptom**: Review tab showed all $0.00 values for Gross Sales, Bingo Prizes, Pull-Tab Prizes, etc.
- **Root Cause**: Variables `grossSales`, `actualProfit`, `idealProfit`, `overShort`, `totalDeposit` were used but never declared
- **Fix**: Added variable declarations in `calculateFinalTotals()` at line 2510-2519
- **Impact**: Review tab now displays all financial metrics correctly

**2. Pull-Tab Money Count Not Loading** (wizard.js:1903)
- **Symptom**: Pull-tab denominations saved correctly (total: $1577) but individual denominations showed as $0
- **Root Cause**: `loadMoneyCount()` looked for input IDs like `pt-100` but actual IDs are `pt-drawer-100`
- **Fix**: Changed input ID prefix from `'pt-'` to `'pt-drawer-'` in loadMoneyCount()
- **Impact**: Pull-tab denominations now load correctly from saved occasions

**3. Duplicate Occasions Created on Multiple Saves** (wizard.js:292-305)
- **Symptom**: Clicking "Save to Server" multiple times created duplicate occasions (OCC_1760031938706, OCC_1760031994616, OCC_1760032241928)
- **Root Cause**: New occasions have no ID, so each save created a new occasion instead of updating existing
- **Fix**: Capture returned occasion ID from first successful save and store in `window.app.data.id` + localStorage
- **Impact**: Subsequent saves UPDATE existing occasion instead of creating duplicates

**4. PDF Report Money Count Shows $0.00** (reports.js:534-576)
- **Symptom**: PDF Money Count section showed $0.00 for both Bingo Drawer and Pull-Tab Drawer
- **Root Cause**: Code looked for non-existent properties like `moneyCount.bingo.cashTotal` and `moneyCount.bingo.drawerTotal`
- **Fix**: Changed to use V2 enhanced financial data (`financial.bingoDeposit`, `financial.pullTabNetDeposit`)
- **Impact**: PDF reports now show accurate money count data ($1879 bingo, $1577 pull-tab)

#### Files Modified
- **js/wizard.js** (Lines 1903, 2510-2519, 292-305): Fixed input loading, variable declarations, duplicate prevention
- **js/reports.js** (Lines 534-576): Fixed PDF money count display

### v2.3.0 - Simplified Admin Dashboard

#### Dashboard Redesign
Completely simplified the admin dashboard to focus on the actual workflow: reviewing and managing occasions by status.

#### Changes Made
- **Removed superfluous sections**: Welcome message, metrics cards (Total Occasions, Completed, Draft, Total Players, Total Revenue, Net Profit), Recent Activity, Session Types, Quick Actions
- **Consolidated occasions display**: All occasions now shown on Dashboard tab, categorized by status (Draft, Submitted, Finalized)
- **Color-coded status indicators**: 🔵 Draft (blue), 🟡 Submitted (yellow), 🟢 Finalized (green)
- **Streamlined workflow**: Dashboard shows exactly what needs review without clutter

#### File Changes
- **js/dashboard.js** (lines 10-174):
  - Simplified `updateDashboardStats()` - removed complex calculations
  - Rewrote `renderDashboard()` - clean status-based occasion display
  - Added `renderReviewSection()` - renders occasions by status category
  - Added `renderOccasionRowInline()` - displays individual occasion rows
  - Cleaned up CSS styles - removed unused style rules

#### Next Steps
- Consider hiding Occasions and Reports navigation tabs (functionality now on Dashboard)
- Test simplified dashboard with real occasion data

### v2.2.0 - V2 Enhanced Financial Format (31 Fields)

#### Full Implementation of V2 Financial Structure
Completely rewrote `calculateFinalTotals()` to save occasion data with enhanced V2 financial format (31 fields vs 12 in V1).

#### New Financial Fields
**Bingo Section (10 fields)**:
- `bingoElectronicSales`, `bingoMiscellaneousSales`, `bingoPaperSales`
- `bingoSales` (sum of above three)
- `bingoPrizesPaid`, `bingoNetProfit`
- `bingoDeposit`, `bingoStartupCash` (1000), `bingoNetDeposit`
- `bingoOverShort` (actual vs ideal profit)

**Pull-Tab Section (10 fields)**:
- `pullTabRegularSales`, `pullTabSpecialSales`, `pullTabSales` (sum)
- `pullTabRegularPrizesPaid`, `pullTabSpecialPrizesPaid`, `pullTabPrizes` (sum)
- `pullTabPrizesPaidByCheck`, `pulltabNetProfit`
- `pullTabNetDeposit`, `pullTabOverShort`

**Totals Section (11 fields)**:
- `totalSales`, `totalPrizesPaid`, `totalPrizesPaidByCheck`, `totalNetProfit`
- `totalCurrencyDeposit`, `totalCoinDeposit`, `totalCheckDeposit`
- `totalActualDeposit` (sum of currency + coins + checks)
- `totalNetDeposit` (actual - startup)
- `totalOverShort` (net deposit - net profit)

#### Backward Compatibility
Included legacy V1 field names for backward compatibility with V1 format consumers.

#### Key Calculations
- **Per-Category Over/Short**: Separate calculations for Bingo and Pull-Tabs
- **Deposit Breakdown**: Currency, coins, and checks tracked separately
- **Net Deposits**: Actual deposits minus startup cash
- **Regular vs Special**: Pull-tabs separated into regular games and special events

### v2.1.1 - Pull-Tab Drawer Display Fix

#### Bug Fixes
- Fixed Pull-Tab drawer total showing $0.00 on Review tab
- Added `calculatePullTabDrawer()` calls in `loadMoneyCount()` and `loadReviewData()`
- Pull-Tab denominations now display correctly when loading saved occasions

### v2.1.0 - Complete Draft/Submitted/Finalized Workflow

#### Critical Fixes
1. **Added Backend Save Button** - "Save to Server" button now persists drafts to Google Drive (not just localStorage)
2. **Submit Sets Status** - "Submit Occasion" now properly sets `status: 'submitted'` to lock from mobile edits
3. **Admin Status Management** - Admin "Edit" button opens modal to change status (submitted→draft for re-editing)
4. **Missing Admin Files** - Copied 7 admin JavaScript files from V1 (admin was completely broken)

#### New Features
- **saveToBackend()** function in wizard.js (lines 176-318)
  - Validates occasion date before saving
  - Checks for existing occasions via JSONP
  - Warns if overwriting non-draft occasions
  - Explicitly sets `status: 'draft'`
- **Edit Occasion Modal** in ui-components.js (lines 693-829)
  - Loads full occasion data
  - Status dropdown (draft/submitted/finalized)
  - Saves changes and reloads table

#### Workflow
1. **Mobile (occasion.html)**:
   - "📝 Local Draft" button → localStorage only (auto-save between tabs)
   - "💾 Save to Server" button → Google Drive with status='draft'
   - "Submit Occasion" button → Google Drive with status='submitted' (locks from editing)
   - Finalized occasions → Read-only mode

2. **Admin (admin.html)**:
   - View all occasions with status column
   - Click "Edit" to change status
   - Change submitted/finalized → draft to allow mobile re-editing
