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
- **Frontend**: v2.0.0
- **Backend**: v2.0.0
- **Status**: In Development
