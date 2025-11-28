# Quick Reference Guide

## Authentication Headers

```bash
# Tier 3: Anonymous (read-only)
X-Anonymous-Key: ${SYNC_ANON_API_KEY}

# Tier 2: Telegram Authorized (read + write)
X-Anonymous-Key: ${SYNC_ANON_API_KEY}
X-Telegram-Init-Data: ${TELEGRAM_INIT_DATA}

# Tier 1: Service (full access)
Authorization: Bearer ${SYNC_SERVICE_API_KEY}
X-Anonymous-Key: ${SYNC_ANON_API_KEY}
```

## Response Formats

### Standard Envelope (GET/Sync endpoints)
```json
{
  "success": true,
  "message": "Operation completed",
  "timestamp": "2025-11-23T12:00:00.000Z",
  "get_data": [...],
  "total": 10
}
```

### Sync Endpoints (use total_sync)
```json
{
  "success": true,
  "message": "Sync completed",
  "timestamp": "2025-11-23T12:00:00.000Z",
  "sync_transactions": [...],
  "total_sync": 50
}
```

### Proxy Endpoints (raw Firefly response)
```json
{
  "data": {
    "type": "transactions",
    "id": "123",
    "attributes": {...}
  }
}
```

## Common Queries

### Get transactions with filters
```bash
GET /api/v1/get_transactions?start_date=2025-01-01&end_date=2025-01-31&category=Food&type=withdrawal
```

### Get usage data (smart suggestions)
```bash
# Personal + community destinations for category
GET /api/v1/get_destination_name_usage?user_name=John&category_id=1

# Personal + community sources for category
GET /api/v1/get_source_name_usage?user_name=John&category_id=5

# All accounts with user's usage stats
GET /api/v1/get_accounts_usage?user_name=John

# All categories with usage and type filtering
GET /api/v1/get_categories_usage?user_name=John&type=withdrawal
```

### Create transaction (proxy)
```bash
POST /api/v1/transactions
{
  "date": "2025-11-23",
  "amount": "15.50",
  "currency": "EUR",
  "category": "Food",
  "account": "Checking Account",
  "comment": "Coffee"
}
```

## Database Quick Queries

### Check view data
```sql
-- Categories usage for user
SELECT * FROM categories_usage_view 
WHERE user_name = 'John' 
ORDER BY usage_count DESC;

-- Accounts usage for user
SELECT * FROM accounts_usage_view 
WHERE user_name = 'John' 
ORDER BY usage_count DESC;

-- Destinations by category
SELECT * FROM destination_name_usage_view
WHERE user_name = 'John' AND category_id = 1
ORDER BY usage_count DESC;
```

### Check transactions
```sql
-- Recent transactions
SELECT * FROM transactions 
WHERE date >= CURRENT_DATE - INTERVAL '7 days'
ORDER BY date DESC 
LIMIT 20;

-- Transactions by user
SELECT * FROM transactions
WHERE user_name = 'John'
AND date >= CURRENT_DATE - INTERVAL '30 days'
ORDER BY date DESC;
```

## Endpoint Allowlists (config.py)

### Read-only endpoints (all tiers)
```python
READ_ONLY_ENDPOINTS = {
    "/api/v1/get_transactions",
    "/api/v1/get_budget",
    "/api/v1/get_accounts",
    "/api/v1/get_categories",
    "/api/v1/get_accounts_usage",
    "/api/v1/get_categories_usage",
    "/api/v1/get_destination_name_usage",
    "/api/v1/get_source_name_usage",
    "/api/v1/get_running_balance",
    "/api/v1/exchange_rate",
    "/api/v1/status"
}
```

### Write endpoints (Tier 2 allowed)
```python
ANON_ALLOWED_WRITE_ENDPOINTS = {
    "/api/v1/sync_transactions",
    "/api/v1/sync_exchange_rate",
    "/api/v1/sync_budget",
    "/api/v1/sync_accounts",
    "/api/v1/sync_categories",
    "/api/v1/transactions",      # POST/PUT/DELETE
    "/api/v1/transactions/"       # Alias with trailing slash
}
```

### Public POST endpoints (all tiers)
```python
ANON_ALLOWED_PUBLIC_POST_ENDPOINTS = {
    "/api/v1/tgUser"
}
```

## Common Patterns

### 1. Add filter to endpoint
```python
# In route parameters
category_id: Optional[int] = Query(None, description="Filter by category")

# In query building
if category_id is not None:
    query += " AND category_id = %s"
    params.append(category_id)
```

### 2. Add endpoint to allowlist
```python
# In sync/config.py
READ_ONLY_ENDPOINTS.add("/api/v1/get_new_feature")

# Or for Tier 2 writes
ANON_ALLOWED_WRITE_ENDPOINTS.add("/api/v1/new_write_action")
```

### 3. Create database view
```sql
CREATE OR REPLACE VIEW my_view AS
WITH base_data AS (
    SELECT ...
    FROM transactions
    WHERE date >= CURRENT_DATE - INTERVAL '90 days'
)
SELECT ... FROM base_data;
```

### 4. Test endpoint
```bash
# Test read (Tier 3)
curl -H "X-Anonymous-Key: ${SYNC_ANON_API_KEY}" \
  "http://localhost/api/v1/get_example"

# Test write (Tier 2)
curl -X POST \
  -H "X-Anonymous-Key: ${SYNC_ANON_API_KEY}" \
  -H "X-Telegram-Init-Data: ${INIT_DATA}" \
  -H "Content-Type: application/json" \
  -d '{"data":"example"}' \
  "http://localhost/api/v1/create_example"
```

## Debugging Commands

### Check health
```bash
curl http://localhost:8000/health
curl http://localhost:8000/
```

### Check Firefly connection
```bash
curl -H "Authorization: Bearer ${FIREFLY_API_TOKEN}" \
  http://firefly-app:8080/api/v1/about
```

### Check PostgreSQL
```bash
# Connect to database
docker exec -it budgetbot-db psql -U telegram_bot -d telegram_bot

# List tables
\dt

# List views
\dv

# Describe table/view
\d+ transactions
\d+ categories_usage_view
```

### Check logs
```bash
# FastAPI logs (API endpoints)
docker logs firefly-sync -f

# aiohttp logs (health checks)
docker logs firefly-health -f

# Filter for errors
docker logs firefly-sync 2>&1 | grep -i error
```

## Environment Variables Reference

```bash
# Required
POSTGRES_HOST=budgetbot-db
POSTGRES_PORT=5432
POSTGRES_DB=telegram_bot
POSTGRES_USER=telegram_bot
POSTGRES_PASSWORD=xxx

FIREFLY_API_URL=http://firefly-app:8080/api
FIREFLY_API_TOKEN=xxx

SYNC_ANON_API_KEY=xxx
SYNC_SERVICE_API_KEY=xxx

TELEGRAM_BOT_TOKEN=xxx

# Optional
FASTAPI_PORT=8001
HEALTH_CHECK_PORT=8000
TELEGRAM_USER_CACHE_TTL=3600
TRANSACTION_PROXY_DEFAULT_LIMIT=500
```

## Common Error Messages

### "Missing required parameter: user_name"
```
Solution: Add user_name query parameter
Example: ?user_name=John
```

### "403 Forbidden"
```
Причина: Недостаточно прав для операции
Solution: Проверьте auth tier и headers
- Write операции требуют Tier 1 или Tier 2
- DELETE/PUT требуют только Tier 1
```

### "Sync operation already in progress"
```
Причина: Предыдущий sync еще выполняется
Solution: Дождитесь завершения или проверьте /api/v1/status
```

### "Database connection failed"
```
Причина: PostgreSQL недоступен
Solution: 
1. Проверьте docker ps
2. Проверьте POSTGRES_HOST в .env
3. Проверьте логи: docker logs budgetbot-db
```

## Performance Tips

### 1. Use appropriate filters
```
❌ Bad: GET /api/v1/get_transactions (fetches all)
✅ Good: GET /api/v1/get_transactions?start_date=2025-11-01&end_date=2025-11-23
```

### 2. Leverage views
```
✅ Views are indexed and optimized
✅ 90-day rolling window keeps data fresh
✅ No manual sync needed
```

### 3. Batch operations
```
❌ Bad: 10 separate POST requests
✅ Good: 1 POST request with array of transactions
```

### 4. Use smart suggestions wisely
```
✅ user_name + category_id → full discovery (personal + community)
⚠️  user_name only → only used items (faster)
```

## Quick Checklist

### Adding New Endpoint
- [ ] Define route in api_server.py
- [ ] Add to config.py allowlist if needed
- [ ] Implement standard envelope response
- [ ] Add error handling with finally block
- [ ] Test with all auth tiers
- [ ] Document in API.md
- [ ] Update version in API.md

### Adding New View
- [ ] Create view in init-db.sql
- [ ] Use 90-day rolling window pattern
- [ ] Include usage_count + global_usage
- [ ] Test query performance
- [ ] Create endpoint to expose view
- [ ] NO sync job needed

### Changing Endpoint Behavior
- [ ] Update code
- [ ] Update API.md documentation
- [ ] Bump version in API.md header
- [ ] Add entry to Version History
- [ ] Test with existing clients
- [ ] Notify users of breaking changes
