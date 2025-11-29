# Project: Firefly III Sync Service

## Overview

Sync service для интеграции Telegram Mini App с Firefly III (personal finances manager). 
Предоставляет API для синхронизации финансовых данных, proxy endpoints для контролируемого 
доступа к Firefly III, и 3-tier authentication систему.

## Tech Stack

**Backend:**
- Python 3.11+
- FastAPI 0.104+ (API server на порту 8001)
- aiohttp (Health checks на порту 8000)
- PostgreSQL 15+ (данные и views)
- psycopg2 (database driver)

**Infrastructure:**
- nginx (reverse proxy с Tailscale Funnel)
- Docker Compose
- Firefly III API (upstream)
- Telegram Bot API

**Key Libraries:**
- pydantic - validation
- python-dotenv - config
- httpx - HTTP client для Firefly API

## Architecture

```
┌─────────────────────┐
│  Nginx Reverse      │  Port 80 (Tailscale Funnel)
│  Proxy              │
└──────────┬──────────┘
           │
           ├──> /api/v1/*   ────> FastAPI (8001)
           │                       - All API endpoints
           │                       - 3-tier auth middleware
           │
           ├──> /health, /  ────> aiohttp (8000)
           │                       - Health check JSON
           │
           └──> /*          ────> Firefly III (8080)
                                   - Financial data source
```

### Directory Structure

```
firefly/
├── sync/                           # Main sync service
│   ├── api_server.py              # FastAPI app + routes
│   ├── main.py                    # aiohttp health server
│   ├── middleware.py              # 3-tier authentication
│   ├── proxy_firefly.py           # Firefly III proxy
│   ├── config.py                  # Settings + allowlists
│   ├── sync_transactions.py       # Transaction sync
│   ├── sync_accounts.py           # Accounts sync
│   ├── sync_categories.py         # Categories sync
│   ├── sync_budget.py             # Budget sync
│   ├── sync_exchange_rate.py      # Exchange rates
│   └── db/
│       └── init-db.sql            # Schema + views
├── project_docs/
│   └── API.md                     # Complete API doc (v2.4.0)
├── budgetbot/                     # Telegram bot (separate)
├── docker-compose.yml
└── .env
```

## Key Concepts

### 1. Three-Tier Authentication

**TIER 1: Service Role** - Full access
- Headers: `Authorization: Bearer {service_key}` + `X-Anonymous-Key: {anon_key}`
- Use: Backend services, admin tasks

**TIER 2: Telegram Authorized** - Read + Write
- Headers: `X-Anonymous-Key: {anon_key}` + `X-Telegram-Init-Data: {initData}`
- Validation: HMAC-SHA256 signature + `telegram_users.is_auth = true`
- Use: Authenticated Telegram Mini App users

**TIER 3: Anonymous** - Read-Only
- Headers: `X-Anonymous-Key: {anon_key}`
- Use: Public read access, unauthenticated users

### 2. Endpoint Categories

**Sync Endpoints** (`/api/v1/sync_*`)
- Trigger synchronization from Firefly III API → PostgreSQL
- Examples: sync_transactions, sync_accounts, sync_categories
- Return: `total_sync` count

**GET Endpoints** (`/api/v1/get_*`)
- Read cached data from PostgreSQL
- Support filters: dates, user, category, type
- Return: `total` count

**Proxy Endpoints** (`/api/v1/transactions`)
- Forward requests to Firefly III with validation
- Methods: POST (create), GET (list/single), PUT (update), DELETE (remove)
- Feature: Automatic username injection

### 3. View-Only Usage Pattern

Usage данные (accounts, categories, destinations, sources) хранятся ТОЛЬКО в views:
```sql
CREATE OR REPLACE VIEW categories_usage_view AS
WITH user_category_usage AS (
  SELECT user_name, category_id, COUNT(*) as usage_count
  FROM transactions
  WHERE date >= CURRENT_DATE - INTERVAL '90 days'
  GROUP BY user_name, category_id
)
SELECT ... FROM user_category_usage ...
```

**NO materialized tables, NO sync jobs** - everything real-time from transactions table.

### 4. Smart Suggestions

Usage endpoints возвращают personal + community данные для discovery:
```json
{
  "user_name": "John",
  "destination_name": "Penny Market",
  "usage_count": 45,        // John's usage
  "global_usage": 120,      // Everyone's usage
  "user_has_used": true     // Boolean flag
}
```

## Conventions

### File Naming
- `sync_*.py` - Synchronization modules
- `get_*.py` - Would be for GET endpoint helpers (currently in api_server.py)
- `proxy_*.py` - Proxy implementations

### Database Naming
- Tables: `snake_case` (transactions, telegram_users)
- Views: `*_view` suffix (categories_usage_view)
- Columns: `snake_case` (user_name, category_id)

### API Response Format

**Standard envelope** (non-proxy):
```json
{
  "success": true,
  "message": "Operation completed successfully",
  "timestamp": "2025-11-23T12:00:00.000Z",
  "{data_key}": [...],
  "total": 10  // или total_sync для sync endpoints
}
```

**Proxy endpoints**: Return RAW Firefly response (no wrapper), except `simple=true` mode.

### Code Style
- Python: PEP 8
- Async/await for I/O operations
- Type hints where possible
- Exception handling with try/except
- Connection cleanup in finally blocks

## Environment Variables

Required `.env` file:
```bash
# PostgreSQL
POSTGRES_HOST=budgetbot-db
POSTGRES_PORT=5432
POSTGRES_DB=telegram_bot
POSTGRES_USER=telegram_bot
POSTGRES_PASSWORD=xxx

# Firefly III
FIREFLY_API_URL=http://firefly-app:8080/api
FIREFLY_API_TOKEN=xxx

# Sync Service Auth
SYNC_ANON_API_KEY=xxx
SYNC_SERVICE_API_KEY=xxx

# Telegram
TELEGRAM_BOT_TOKEN=xxx
TELEGRAM_USER_CACHE_TTL=3600

# Ports
FASTAPI_PORT=8001
HEALTH_CHECK_PORT=8000

# Optional
TRANSACTION_PROXY_DEFAULT_LIMIT=500
```

## Common Workflows

### Adding New Endpoint

1. **Define route** в `sync/api_server.py`
2. **Add to allowlist** в `sync/config.py` (для Tier 2/3)
3. **Document** в `project_docs/API.md`
4. **Test** с proper auth headers
5. **Update version** в API.md

### Adding Database View

1. **Create/modify** в `sync/db/init-db.sql`
2. **Apply** через psql или restart container
3. **Query** через endpoint
4. **NO sync job needed** - views are real-time

### Testing Changes

```bash
# Health check
curl http://localhost:8000/health

# Test endpoint (Tier 3)
curl -H "X-Anonymous-Key: $SYNC_ANON_API_KEY" \
  http://localhost/api/v1/get_transactions?limit=10

# Test with Telegram auth (Tier 2)
curl -H "X-Anonymous-Key: $SYNC_ANON_API_KEY" \
     -H "X-Telegram-Init-Data: $INIT_DATA" \
     http://localhost/api/v1/get_accounts_usage?user_name=John

# Service access (Tier 1)
curl -H "Authorization: Bearer $SYNC_SERVICE_API_KEY" \
     -H "X-Anonymous-Key: $SYNC_ANON_API_KEY" \
     -X DELETE http://localhost/api/v1/transactions/123
```

## Critical Rules

### ❌ Don't Do
1. Never expose Service (Tier 1) credentials in client code
2. Never create materialized usage tables - use views
3. Never bypass authentication middleware
4. Never modify transaction external_id (used for deduplication)
5. Never skip API.md version updates

### ✅ Always Do
1. Use envelope response format (except proxy endpoints)
2. Include usage_count + global_usage in usage endpoints
3. Return IDs (category_id, account_id) for client-side caching
4. Update API.md version history on behavior changes
5. Check auth tier before write operations
6. Clean up database connections in finally blocks

## Known Issues & Workarounds

1. **Firefly API Pagination**: Max 50 records per page → use multiple requests
2. **90-day Rolling Window**: Views only show last 90 days of transactions
3. **CORS**: Custom headers must be in Access-Control-Request-Headers
4. **Telegram InitData**: Expires after ~1 hour → handle refresh in client

## Debugging

### Check Auth Tier
```python
print(f"Auth tier: {request.state.auth_tier}")
print(f"Telegram: {getattr(request.state, 'telegram_user_data', None)}")
```

### Check View Data
```sql
SELECT * FROM categories_usage_view 
WHERE user_name = 'John' 
LIMIT 10;
```

### Check Firefly Connection
```bash
curl -H "Authorization: Bearer $FIREFLY_API_TOKEN" \
  http://firefly-app:8080/api/v1/about
```

## References

- **API Documentation**: `project_docs/API.md` (complete reference)
- **Database Schema**: `sync/db/init-db.sql`
- **Auth Logic**: `sync/middleware.py`
- **Config**: `sync/config.py`
- **Firefly III Docs**: https://docs.firefly-iii.org/

## Current Version

Project: Firefly Sync Service
API Version: 2.4.0
Last Updated: 2025-11-23
