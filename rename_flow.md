# Plan
Planned changes (renaming “expense” → “withdrawal” end-to-end)

- State machine / context
    - FSM state IDs: expenseFlow, expense-accounts, expense-amount, expense-
    category, expense-comment, expense-confirm → corresponding withdrawal names.
    - Events: NAVIGATE_EXPENSE_*, SUBMIT_TRANSACTION paths, guards targeting expense
    states.
    - Context keys: transaction.conversionAmount etc. remain, but any expense-
    specific flags/keys renamed to withdrawal equivalents.
    - Persistence key(s) if include “expense”.
- Components & props
    - Screens imported/used with “expense” identifiers in BudgetMiniApp.tsx and
    machine-driven flow.
    - UI labels: “Expense” → “Withdrawal” (headers, chips, confirmations) where they
    refer to the flow name.
    - Transaction type strings passed to addTransaction/payload:
    TransactionType.EXPENSE or 'expense' → 'withdrawal' (ensure Firefly expects
    withdrawal in type, but our current TransactionType enum already uses EXPENSE
    -> withdrawal mapping—verify).
    - Suggestions fetch /get_categories_usage?type=withdrawal already matches; keep.
- Hooks / helpers
    - useTransactionData default type; any unions or “expense” strings used for
- Data migration / caches
    - Session/localStorage keys that embed “expense” (e.g., machine persistence key
    value content) may require clearing or a fallback so users don’t get stuck
    with stale state.

## Perform mcp Playwright test of flow 

- check if all work correct