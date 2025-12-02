Back Button Test Report (Playwright)
====================================

Environment
- Date: 2025-12-01
- App: Budget Mini App (localhost:3000, browser debug mode)
- Tooling: MCP Playwright via CLI

Test Steps
1) Home → Quick Action “Withdrawal”.
2) On “Select Account” screen, click “← Back”.

Observed Result
- The click fires (console logs “Browser back button clicked”) but the UI remains on “Select Account”; no navigation back to Home.
- Subsequent scripted steps that assume Home then fail/time out because the screen never changes.

Additional Signals (pre-existing)
- Repeated 401s on `GET /api/v1/transactions?page=1&limit=10`.
- Balance fetch error: “Cannot read properties of undefined (reading '0')”.
- These are noise; they do not explain the back navigation failure.

Root Cause
- `getBackHandler` still checks `machineContext.state.matches({ ready: 'expenseFlow' })`, but the machine renamed that branch to `withdrawalFlow` (see `budgetMachine.ts`, line ~147). As a result the handler never sends `NAVIGATE_BACK`, so the machine state stays on `withdrawalFlow.accounts` even though legacy UI state switches to `home`, leaving the UI stuck.

Fix Plan
1) Update `getBackHandler` (src/BudgetMiniApp.tsx) to match `withdrawalFlow` instead of `expenseFlow`, and optionally keep a backwards-compatible alias for `expenseFlow` until the rename fully lands.
2) After the fix, clicking “← Back” on any withdrawal screen should call `machineContext.send({ type: 'NAVIGATE_BACK' })`, letting the machine transition back to `ready.home` via the existing transition in `budgetMachine.ts`.
3) Once verified, remove the legacy `currentScreen` fallback for withdrawal-specific screens to avoid silent divergence between machine state and legacy UI state.
