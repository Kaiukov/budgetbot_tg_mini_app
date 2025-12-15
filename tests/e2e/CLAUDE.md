### E2E Test Suite

**withdrawal-mock-flow.spec.ts** - 9 tests (full flow + back button + Decline)
- Happy path with confirmation and mocked data
- Back button: amount preservation (same account) and clearing (account change)
- Destination reset and re-selection after back button
- Multi-currency: UAH account with EUR conversion display
- Confirmation preservation from destination
- Destination change after selection
- Exchange rate conversion (USD/UAH)
- Multi-account sequential flows (EUR + USD)
- **Decline button cancels and returns home** ✅

**deposit-mock-flow.spec.ts** - 8 tests (flow + exchange rate + Decline)
- Happy path with mocked data and confirmation
- Back button: amount preservation and clearing on account switch
- Category selection and back button behavior
- USD account with EUR conversion in confirmation
- Confirmation preservation from source selection
- Source account changes after initial selection
- Exchange rate display for USD amount entry
- **Decline button cancels and returns home** ✅

**transfer-mock-flow.spec.ts** - 10 tests (same/diff currency + 6 back button variants + Decline)
- Happy path: same-currency transfer (USD→USD)
- **Happy path: diff-currency transfer (USD→EUR)** ✅
- **Happy path: cross-currency with confirmation (USD→EUR)** ✅
- Back button from amount: preservation with currency change
- **Back button from destination: preserves source account** ✅
- **Back button from fee: preserves fee values** ✅
- **Back button from amount preserves source/destination accounts** ✅ (NEW)
- **Back button from confirmation: preserves amounts + fees** ✅ (NEW)
- **Back button from confirmation: notes field behavior** ✅ (NEW)
- **Decline button cancels transfer and returns home** ✅

**Total: 27 tests passing** (9 withdrawal + 8 deposit + 10 transfer)
Run: `npx playwright test tests/e2e/` (~10s)

**Recent Changes (v0.2.5)**
- ✅ Fixed ConfirmScreen infinite loop bug (notes field dependency)
- ✅ Added 3 new transfer back button tests
- ✅ 100% test pass rate with full mocking
