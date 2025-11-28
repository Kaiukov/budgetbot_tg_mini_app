# Database Schema

## Key Tables:
- `transactions` - Full Firefly transaction cache (last sync window)
- `Accounts_current_state` - Account balances and owners
- `exchange_rates` - Current exchange rates
- `budgets` - Budget information
- `categories` - Category data
- `sync_state` - Sync cursors per sync type
- `destinations_usage` / `accounts_usage` / `categories_usage` - Usage snapshots (legacy tables; views are the primary source)
- `telegram_users` - Telegram user cache

## Key Views:
- `firefly_transactions` - Convenience view over `transactions` for downstream queries
- `accounts_usage_view` - 90-day rolling account usage per user
- `categories_usage_view` - 90-day rolling category usage per user
- `destination_name_usage_view` - Destination usage + community popularity by category
- `source_name_usage_view` - Source usage + community popularity by category
- `income_account_usage_view` / `expense_account_usage_view` - Historical usage helpers
- `running_balance_history` - Daily running balance calculations
