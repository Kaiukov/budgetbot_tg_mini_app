### CLAUDE.md

withdrawal-mock-flow.spec.ts - Playwright E2E for withdrawal flow with full API mocking.
    - test.describe "Withdrawal flow (mocked, fast)" "Sets Telegram init script + API routes stubs"
    - happy path completes with mocked data and correct confirmation details
    - back button preserves amount for same account and clears when account changes
    - destination page resets after back and allows changing selection before final confirm
    - happy path with UAH account shows converted amount and note
    - back button from confirmation returns to destination with data preserved
    - destination selection can be changed after initial choice
    - exchange rate conversion displayed for USD withdrawal
    - both EUR and USD accounts can complete withdrawals successfully

deposit-mock-flow.spec.ts - Playwright E2E for deposit flow with mocked APIs.
    - happy path completes with mocked data and correct confirmation details
    - back button keeps amount for same account and clears on switch
    - category selection works and back button returns to category choice
    - happy path with USD account shows converted amount in confirmation
    - back button from confirmation returns to source selection with data preserved
    - source selection can be changed after initial choice
    - exchange rate displayed correctly for USD amount entry

transfer-mock-flow.spec.ts - Playwright E2E for transfer flow (dual accounts) with mocks.
    - happy path same-currency transfer with mocked data
    - back button clears amounts when destination account changes (cross currency)
