# Transfer Flow – type vs. name usage

## Overview
- Multi‑step UI: sourceAccounts → destAccounts → amount → fees → notes → confirm (machine state `transferFlow` in `src/machines/budgetMachine.ts`).
- Confirm screen submits via `addTransaction(payload, 'transfer', true)` (`src/components/TransferConfirmScreen.tsx`).

## How “transfer” is used
- **Transaction type**: The payload is dispatched with the literal type string `'transfer'`; `addTransaction` normalizes it to the `TransactionType.TRANSFER` enum and routes to `handleTransferTransaction` (`src/services/sync/transactions.ts`).
- **Firefly payload**: `handleTransferTransaction` builds the API body with `type: 'transfer'` (same- and cross-currency branches) ensuring the journal is saved as a transfer, not withdrawal/deposit.
- **Fees**: Optional exit/entry fees are created as separate `withdrawal` transactions via `handleTransferFee`; only the main movement remains `transfer`.

## Data model touchpoints
- UI form state lives in `transfer` slice of machine context (`src/machines/types.ts` + `budgetMachine.ts` actions).
- Transfer submission payload fields: `exit_account`, `entry_account`, `exit_amount`, `entry_amount`, `exit_currency`, `entry_currency`, optional `exit_fee`, `entry_fee`, `description`, and `user_name`.

## Naming quirk to note
- `TransferConfirmScreen` prop is named `userName`, but the component destructures `user_name`; when missing, it falls back to `'unknown'`. This doesn’t alter the transaction type but could affect tagging/audit.

## Answer to the original question
- Yes—the transfer flow consistently treats the operation as a **transaction of type `transfer`**. The name is used to label the flow/UI, while the persisted transaction type is explicitly `transfer` in the API payload.
