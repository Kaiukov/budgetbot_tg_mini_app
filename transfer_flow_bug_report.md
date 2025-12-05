# Transfer Flow Regression Report (P1	1, P2, P3)
Date: 2025-12-04
Owner: ChatGPT (analysis only, no code changes yet)

## Summary
- Transfer flow skips the destination account screen and jumps to **Amount**, showing blank From/To fields; Back from Amount returns to source accounts.
- Root cause: transfer actions in `src/machines/budgetMachine.ts` still write to legacy fields (`transfer.source`, `transfer.destination`, `exitAmount`, etc.), while the UI and `TransferForm` expect snake_case fields (`source_account_name`, `destination_account_name`, `source_amount`, fees, etc.). State transitions occur, but the context the UI renders from remains empty, so the app behaves as if no destination was picked.
- Fix: align transfer actions and event payloads to the snake_case `TransferForm` shape, and ensure back-navigation uses the same fields.

## Impact
- Users cannot complete transfers as designed; destination account is never populated, blocking fee/notes/confirm accuracy.
- Severity: **P1 critical** (flow broken) with related P2 (blank fields) and P3 (back-nav mismatch perceived).

## Repro (current build)
1) From Home tap **Transfer**.
2) Select source account (e.g., "O PUMB USD").
3) App jumps directly to **Transfer Amount** screen with blank From/To labels.
4) Press Back: returns to source accounts instead of destination list.

## Findings (code refs)
- State flow: `transferFlow` order is correct (`sourceAccounts -> destAccounts -> amount ...`). (`src/machines/budgetMachine.ts`, states.transferFlow)
- UI renders transfer screens from machine state: `getTransferScreenFromMachineState` in `src/BudgetMiniApp.tsx`.
- Source selection event: AccountsScreen sends `SET_TRANSFER_SOURCE` with `source_account_*` fields. (`src/BudgetMiniApp.tsx`, ~995)
- Destination selection event: AccountsScreen sends `SET_TRANSFER_DEST` with `destination_account_*` fields. (`src/BudgetMiniApp.tsx`, ~1007)
- Amount screen reads context fields `source_account_name`, `destination_account_name`, `source_amount`, `destination_amount`, `exchange_rate`. (`src/BudgetMiniApp.tsx`, TransferAmountScreen props ~1025)
- **Mismatch**: transfer actions in `budgetMachine.ts` still set legacy keys `transfer.source.account`, `transfer.destination.account`, `exitAmount`, `entryAmount`, etc. (see actions near lines ~640-700). Snake_case fields never populated, so UI sees empty strings.
- Back nav is defined correctly in machine (`NAVIGATE_BACK` from `amount` -> `destAccounts`), but because destination fields stay empty and state may be re-entered with cleared values, UX appears to jump back to source selection.

## Root Cause
Legacy transfer action implementations were not updated to the new `TransferForm` schema (snake_case). Event payloads from UI use snake_case; actions expect `event.account` / `event.amount` and write to legacy fields, leaving the canonical fields empty. Screens that read snake_case fields show blanks, and navigation seems off because destination never registers.

## Recommended Fix
1) In `src/machines/budgetMachine.ts`, rewrite transfer actions to use snake_case fields:
   - `setTransferSource`: set `source_account_name/id/currency`, `user_name`.
   - `setTransferDest`: set `destination_account_name/id/currency`, update `prevDestinationAccountId`.
   - `updateTransferSourceAmount` -> `source_amount`; `updateTransferDestAmount` -> `destination_amount`.
   - `updateTransferExchangeRate` -> `exchange_rate`.
   - Fee setters -> `source_fee`, `destination_fee` (default '0').
   - Notes setter -> `notes`.
   - Smart clear helpers (`trackDestinationChange`, `smartClearOnAmountBack`, etc.) should read/write `destination_account_id` / `prevDestinationAccountId`.
2) Keep state transition targets as-is; only align context mutations.
3) Optional: add a minimal unit test for the transfer reducer actions to guard against future schema drift.

### Patch sketch (for reference)
```ts
// inside budgetMachine actions
setTransferSource: assign(({ context, event }) => ({
  transfer: {
    ...context.transfer,
    user_name: event.user_name || context.transfer.user_name,
    source_account_name: event.source_account_name,
    source_account_id: String(event.source_account_id),
    source_account_currency: event.source_account_currency,
  },
})),
setTransferDest: assign(({ context, event }) => ({
  transfer: {
    ...context.transfer,
    destination_account_name: event.destination_account_name,
    destination_account_id: String(event.destination_account_id),
    destination_account_currency: event.destination_account_currency,
    prevDestinationAccountId: event.destination_account_id,
  },
})),
updateTransferSourceAmount: assign(({ context, event }) => ({
  transfer: { ...context.transfer, source_amount: event.source_amount },
})),
// ... similarly for destination_amount, exchange_rate, source_fee, destination_fee, notes
```

## Validation Plan
- Manual: run transfer flow with two accounts, verify screens order, fields populate, back from Amount returns to destAccounts, back from destAccounts returns to sourceAccounts.
- Multi-currency: verify suggested rate still appears and guard allows progressing when amounts + rate provided.
- Regression: quick check withdrawal/deposit flows unaffected (shared AccountsScreen only).

## Open Questions
- Should we auto-exclude the selected source account on the dest screen when `source_account_id` is empty? After fix it will be set, so current exclusion will work.
- Do we need to persist transfer draft between sessions? (not currently restored).

