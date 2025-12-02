# Withdrawal Flow Review — branch `refactor/expanse-flow` (2025-12-01)

## Summary
- Withdrawal path is fully machine-driven: Home → Accounts → Amount (FX preview for non-EUR) → Category → Destination name → Confirmation (date + notes) → Submit.
- Comment screen replaced by DestinationName; confirm screen now collects date and notes.
- Currency conversion is computed client-side for non-EUR accounts and forwarded via machine UI state.

## Flow walkthrough
- **Home → Accounts**: `HomeScreen` quick action sends `NAVIGATE_WITHDRAWAL_ACCOUNTS` into the machine (`src/BudgetMiniApp.tsx`).
- **Accounts → Amount**: `UPDATE_ACCOUNT` transitions to `amount` and stores account details (`src/machines/budgetMachine.ts:171-194`, `480-495`). Amount is cleared when switching to a different account_id but kept when re-selecting the same one.
- **Amount (FX)**: user input dispatches `UPDATE_AMOUNT`; non-EUR auto-converts via `syncService.getExchangeRate`, pushing `SET_CONVERSION_AMOUNT` into machine state (`src/components/AmountScreen.tsx:24-111`).
- **Amount → Category**: `NAVIGATE_CATEGORY` moves to `category`; categories fetched per withdrawal type (`src/machines/budgetMachine.ts:196-237`).
- **Category → Destination Name**: `UPDATE_CATEGORY` transitions to `notes` (DestinationName) (`src/machines/budgetMachine.ts:214-237`).
- **Destination Name → Confirm**: `NAVIGATE_CONFIRM` moves to confirm (`src/machines/budgetMachine.ts:238-252`).
- **Confirm → Submit**: `SUBMIT_TRANSACTION` triggers `resetTransaction` and returns home (`src/machines/budgetMachine.ts:253-270`), with date and notes handled inside `ConfirmScreen` (`src/components/ConfirmScreen.tsx:90-240`).

## Findings
- **P1 Critical — Destination input not persisted**: `DestinationNameScreen` is controlled by `transaction.destination_name`, but `onChange` dispatches `UPDATE_NOTES` with `{ notes: destination_name }` from `BudgetMiniApp` (`src/BudgetMiniApp.tsx:391-396`). The machine action `updateComment` reads `event.notes` yet is only wired to `UPDATE_NOTES`; however helper `useBudgetMachine.updateComment` sends `{ comment }` (no `notes`) (`src/hooks/useBudgetMachine.ts:42-44`). As a result, destination_name/notes stay empty and the input appears blank after typing. Fix: dispatch `{ type: 'UPDATE_NOTES', notes: value, destination_id }` (or change action to accept `event.comment` and/or `event.destination_name`) and align helper payload keys with the machine action (`src/machines/budgetMachine.ts:527-533`).
- **P3 Medium — user_name not recorded when selecting account**: `handleWithdrawalSelectAccount` dispatches `username` (`src/BudgetMiniApp.tsx:368-375`) but the machine’s `updateAccount` action reads `event.user_name` (`src/machines/budgetMachine.ts:480-495`). The transaction form’s `user_name` remains blank, which could affect tagging/analytics even though current payloads fall back to `context.user`. Align the field name.

## Notes vs requirements checklist
- **Back button behavior**: Machine NAVIGATE_BACK walks the expected reverse path (confirm→notes→category→amount→accounts→home). Amount is preserved when reselecting the same account_id; cleared when account changes — matches “same vs different account” expectation.
- **Non-EUR auto conversion**: Implemented with debounce and pushed into machine UI state; confirm uses `conversionAmount` for `amount_eur`. Validation fails if conversion missing, as intended.
- **Terminology rename (expense→withdrawal)**: UI text and flow names use “Withdrawal”; a stray comment “expense flow” remains in `budgetMachine.ts` (line ~690) but is cosmetic.
- **Comment page removed / Destination page added**: Implemented; DestinationName replaces comment for withdrawal. Legacy income flow still uses DestinationName as comment step.
- **Notes + Date on confirmation**: Present in `ConfirmScreen` (notes textarea, date input defaulting to today, both fed into payload).
- **Migration to xstate**: Withdrawal flow uses the machine; income/transfer still rely on legacy hooks—consistent with current branch scope but worth tracking if full migration is desired.

## Recommended fixes (quick)
1) Harmonize destination update payload: send `notes` (and `destination_id`) from all callers or update the machine action to read `event.comment`. 
2) Align account selection payload key to `user_name` so transaction context is populated.
