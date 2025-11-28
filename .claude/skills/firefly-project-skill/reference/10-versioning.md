# Version History

## v2.4.0 (2025-11-23)
- **🆕 NEW** `GET /get_source_name_usage` endpoint for income source analytics
  - Tracks where income comes from (deposit transactions only)
  - Smart suggestions combining personal + community patterns
  - Parameters: `user_name`, `category_name`, `category_id`
  - Response schema: 8 fields (source_id, source_name, category_id, category_name, usage_count, global_usage, user_has_used)
  - Powered by `source_name_usage_view` (90-day rolling window)

- **✨ Enhanced** `/get_categories_usage` endpoint with type filtering
  - **NEW parameter:** `type` (optional) - Filter by category type (withdrawal/deposit/service)
  - **BREAKING:** `user_name` now MANDATORY - Returns 400 error if missing
  - **Response enhancement:** Added `type`, `global_usage`, `user_has_used` fields (7 fields total)
  - Backed by enhanced `categories_usage_view` with type parsing from `categories.notes` JSON

- **🔧 Refactored** database architecture to view-only approach
  - Eliminated `accounts_usage` and `categories_usage` tables
  - All usage queries now powered by real-time database views
  - No scheduled sync jobs needed (`sync_accounts_usage.py` and `sync_categories_usage.py` deleted)

- **🐛 Fixed** account usage data integrity issues
  - Removed non-existent columns (`first_used_at`, `last_used_at`)
  - Fixed user_name/owner confusion bug
  - Added `global_usage` and `user_has_used` fields

- **📝 Documentation**
  - Updated categories usage endpoint documentation with type filtering examples
  - Added project docs for category type system and account/category usage views
  - Enhanced database schema documentation

## v2.3.8 (2025-11-22)
- **✨ Enhanced** `/get_destination_name_usage` and `/get_source_name_usage` endpoints:
  - Added `category_id` query parameter (takes precedence over `category_name`)
  - Payloads now return IDs, usage counters, `user_has_used`, and `global_usage` only (no Telegram metadata/timestamps)
  - Smart suggestions mode activates when both `user_name` AND `category_id` (or `category_name`) provided
- **📝 Synced docs with current responses:**
  - `/get_destination_name_usage` and `/get_source_name_usage` response examples now show `total_sync` and the new field shape
  - `/get_accounts_usage` examples include `first_used_at`/`last_used_at` and `total_sync`
  - Database schema section updated to match `sync/db/init-db.sql` (new views + moved init path)
- **📝 Updated** API endpoint count in summary (now 9 GET endpoints)

## v2.3.7 (2025-11-22)
- **💥 Breaking Change** - Updated API Base URL:
  - Changed base path from `/api/sync` to `/api/v1` to match REST standards
  - All endpoints now prefixed with `/api/v1/` (e.g., `/api/v1/sync_transactions`)
  - Nginx configuration updated to route `/api/v1/` to the sync service
- **📝 Documentation** - Updated all endpoint references to reflect the new URL structure

## v2.3.3 (2025-11-09)
- **✨ Enhanced** POST transaction proxy with automatic username injection:
  - **Tier 1 (Service):** Username automatically set to `"service_user"`
  - **Tier 2 (Telegram Authorized):** Username extracted from Telegram initData (`user.username` or `user.first_name`)
  - Username appears in transaction `tags`, `notes`, and `external_id`
- **🔧 Fixed** POST transaction response format:
  - Now returns raw Firefly API response exactly as-is (unwrapped) to match GET endpoints
  - Eliminates wrapper envelope for consistency across all proxy endpoints
- **🔐 Enhanced** middleware to store full Telegram user data in `request.state.telegram_user_data`
- **📝 Updated** API documentation:
  - Documented username injection behavior for both authentication tiers
  - Added detailed POST transaction examples with actual response structure
  - Clarified request body format (supports both Firefly native and BudgetBot simplified formats)

## v2.3.2 (2025-11-09)
- **🔧 Fixed** response format for GET transaction proxy endpoints:
  - `simple=false` (default) now returns raw Firefly API response exactly as-is (no wrapper)
  - `simple=true` returns simplified format with normalized envelope
  - Eliminates double-nesting issue where Firefly response was being wrapped unnecessarily
- **📝 Updated** API documentation:
  - Clarified response formats for `simple=false` vs `simple=true`
  - Added detailed examples showing raw Firefly format (starts with `"data"` key)
  - Documented simplified format structure (includes `success`, `status`, `message`, `mode`)
  - Updated both list and single transaction endpoint documentation

## v2.3.1 (2025-11-09)
- **✅ Verified** GET transaction proxy endpoints working correctly:
  - `GET /api/v1/transactions` - List transactions with filters (type, date range, pagination)
  - `GET /api/v1/transactions/{id}` - Get single transaction by ID
  - Both endpoints support `simple=true` for simplified response format
  - Tested all 4 scenarios: list/single × full/simple formats
- **📝 Enhanced** API documentation:
  - Added missing `page` and `type` parameters to list endpoint documentation
  - Documented new GET single transaction endpoint with examples
  - Added detailed response examples for both simple and full modes
  - Documented error handling for transaction endpoints
- **✅ Confirmed** authentication working correctly:
  - Tier 1 (Service): Full access with both headers
  - Tier 3 (Anon): Read-only access with anon key only
  - All endpoints properly validating credentials

## v2.3.0 (2025-11-09)
- **🔒 Security** - Refactored authentication to 3-tier system:
  - **Tier 1 (Service):** `Authorization` + `X-Anonymous-Key` for full access
  - **Tier 2 (Anon Authorized):** `X-Anonymous-Key` + `X-Telegram-Init-Data` for read + write
  - **Tier 3 (Anon):** `X-Anonymous-Key` only for read-only access
- **Removed** `Authorization` header requirement for Tiers 2 & 3
- **Simplified** authentication logic with clear tier separation
- **Enhanced** API documentation with tier-based examples
- **Updated** all example requests to reflect new authentication model

## v2.2.0 (2025-11-08)
- **🔧 Fixed** critical data corruption in `/get_accounts_usage`:
  - Removed COALESCE rewrite that was hiding actual account owners
  - Fixed JOIN to include account_id for proper data isolation
  - Removed broken fallback query (was querying categories table)
  - Now returns ALL accounts with accurate usage stats and ownership info
- **🔧 Fixed** `/get_categories_usage_with_all` empty result regression:
  - Restored COALESCE pattern in `categories_usage_view` for uncached categories
  - View now preserves transactions with missing category_ids in cache
  - Returns all categories with zero-counts even for new users
- **Added** usage timestamps (`first_used_at`, `last_used_at`) to `/get_accounts_usage`
- **Improved** API documentation clarity on field semantics (user_name vs owner)

## v2.1.3 (2025-11-04)
- Documented the native Firefly `/api/v1/transactions` reference call, parameters, and full response structure.
- Highlighted critical fields for BudgetBot/n8n workflows and expanded the proxy section with upstream context.

## v2.1.2 (2025-11-03)
- Documented example `curl` invocations for anon, Telegram-elevated, and service roles.
- Bumped the published version metadata to reflect the expanded authentication guidance.

## v2.1.1 (2025-11-02)
- Default the transaction proxy to request the newest 500 groups from Firefly when no pagination is supplied.
- Documented the optional `TRANSACTION_PROXY_DEFAULT_LIMIT` configuration flag and clarified proxy ordering behaviour.

## v2.1.0 (2025-11-01)
- Documented the active FastAPI routes, removing stale references to `/get_current_balance` and the non-existent `/metrics` endpoint.
- Added an operations section clarifying the aiohttp health probe and lack of Prometheus output.
- Linked authentication behaviour to the `sync/config.py` allowlists and refreshed the version metadata.

## v2.0.1 (2025-10-31)
- **Fixed** `/get_accounts_usage` endpoint user filtering behavior:
  - `user_name` field now correctly shows requesting user, not account owner
  - Returns ALL accounts with requesting user's usage statistics
  - Properly supports shared account usage tracking across users
  - Enhanced documentation with clear field descriptions and use cases

## v2.0.0 (2025-10-23)
- Added 8 new GET endpoints for read-only data access
- Added Telegram Mini App authentication (`POST /tgUser`)
- Added running balance history endpoint
- Enhanced filtering support for usage endpoints
- Implemented nginx reverse proxy
- Standardized response format across all endpoints
- Added comprehensive error handling

## v1.0.0 (Initial Release)
- Basic sync endpoints for transactions, budgets, accounts
- Exchange rate synchronization
- PostgreSQL integration

---

# Version Control

- Repository: `firefly`
- Document path: `sync/API.md`
- When behaviour changes, update the header `**Version:**` value and add an entry to [Version History](#version-history).
- Reference the touched modules (for example [`sync/api_server.py`](./api_server.py), [`sync/proxy_firefly.py`](./proxy_firefly.py)) in commit messages to keep future reviews traceable.
