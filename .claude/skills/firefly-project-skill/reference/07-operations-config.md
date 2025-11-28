# Operations & Health

Operational endpoints live alongside the FastAPI app and the lightweight aiohttp server that exposes readiness data. Unlike the documented FastAPI routes, these paths do **not** sit under the `/api/v1` prefix when accessed directly.

## FastAPI status endpoint

- `GET /api/v1/status` (documented above) returns the latest manual sync results and in-progress flag. It is part of the FastAPI service and therefore respects the API-key middleware.

## Aiohttp health probe

- `GET /health`
- `GET /`

Both routes are served by the aiohttp application running on `config.HEALTH_CHECK_PORT` (default `8000`). They return a JSON payload that summarizes sync timing, PostgreSQL connectivity, and Firefly API reachability as implemented in `sync/main.py`. These endpoints sit behind the same Nginx proxy but do **not** require sync API keys.

## Metrics

A Prometheus `/metrics` route is **not** implemented in the current codebase. Any monitoring integration should poll the aiohttp health JSON or add a custom collector if needed.

---

# Configuration

## Environment Variables:

```bash
# PostgreSQL
POSTGRES_HOST=budgetbot-db
POSTGRES_PORT=5432
POSTGRES_DB=telegram_bot
POSTGRES_USER=telegram_bot
POSTGRES_PASSWORD=your_password

# Firefly III
FIREFLY_API_URL=http://firefly-app:8080/api
FIREFLY_API_TOKEN=your_token

# Telegram
TELEGRAM_BOT_TOKEN=your_bot_token
TELEGRAM_USER_CACHE_TTL=3600  # 1 hour

# Sync Service
FASTAPI_PORT=8001
# Optional: override GET /api/v1/transactions default page size
TRANSACTION_PROXY_DEFAULT_LIMIT=500
```

---

# Rate Limiting

**Current Status:** No rate limiting implemented

**Recommendations:**
- Add rate limiting for public-facing endpoints
- Consider per-user rate limits for authenticated endpoints
- Monitor and adjust based on usage patterns

---

# Caching Strategy

## Telegram User Data
- **TTL:** 1 hour (configurable via `TELEGRAM_USER_CACHE_TTL`)
- **Storage:** PostgreSQL `telegram_users` table
- **Invalidation:** Time-based (updated_at comparison)

## Transaction Data
- **Strategy:** Full sync + incremental updates
- **Trigger:** Manual via sync endpoints or scheduled jobs
- **Freshness:** Depends on sync frequency

## Exchange Rates
- **Strategy:** Replace all on sync
- **Update Frequency:** Typically daily
- **Fallback:** Uses last known rates if API unavailable
