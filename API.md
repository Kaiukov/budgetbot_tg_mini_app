# Sync Service API Documentation

This document describes all available API endpoints for the Firefly III Sync Service.

**Base URL:** `https://firefly.neon-chuckwalla.ts.net/api/sync`

**Version:** 2.0.0

---

## Table of Contents

- [Overview](#overview)
- [Response Format](#response-format)
- [Sync Endpoints](#sync-endpoints)
- [GET Endpoints (Read-Only)](#get-endpoints-read-only)
- [Utility Endpoints](#utility-endpoints)
- [Authentication](#authentication)
- [Error Handling](#error-handling)

---

## Overview

The Sync Service provides two types of endpoints:

1. **Sync Endpoints** - Trigger synchronization between Firefly III API and PostgreSQL database
2. **GET Endpoints** - Retrieve cached data from PostgreSQL without triggering sync operations

All endpoints return JSON responses with standardized format.

---

## Response Format

### Success Response
```json
{
  "success": true,
  "message": "Operation completed successfully",
  "timestamp": "2025-10-23T12:00:00.000Z",
  "<data_key>": [...],
  "total": 10
}
```

### Error Response
```json
{
  "success": false,
  "message": "Error description",
  "timestamp": "2025-10-23T12:00:00.000Z",
  "<data_key>": [],
  "total": 0
}
```

---

## Sync Endpoints

These endpoints trigger synchronization operations between Firefly III API and PostgreSQL database.

### 1. Sync Transactions
Synchronize transactions from Firefly III.

**Endpoint:** `GET /api/sync/sync_transactions`

**Response:**
```json
{
  "success": true,
  "message": "Operation completed successfully",
  "timestamp": "2025-10-23T12:00:00.000Z",
  "sync_transactions": [
    {
      "firefly_transaction_id": "123",
      "type": "withdrawal",
      "date": "2025-01-15",
      "amount": 50.00,
      "currency_code": "EUR",
      "description": "Grocery shopping",
      "source_name": "Checking Account",
      "destination_name": "Supermarket",
      "category_name": "Food",
      "user_name": "John"
    }
  ],
  "total_sync": 1
}
```

---

### 2. Sync Exchange Rate
Synchronize exchange rates from external API.

**Endpoint:** `GET /api/sync/sync_exchange_rate`

**Response:**
```json
{
  "success": true,
  "message": "Operation completed successfully",
  "timestamp": "2025-10-23T12:00:00.000Z",
  "sync_exchange_rate": [
    {
      "base_currency": "EUR",
      "target_currency": "USD",
      "rate": 1.08,
      "updated_at": "2025-10-23T12:00:00.000Z"
    }
  ],
  "total_sync": 1
}
```

---

### 3. Sync Budget
Synchronize budgets from Firefly III.

**Endpoint:** `GET /api/sync/sync_budget`

**Response:**
```json
{
  "success": true,
  "message": "Operation completed successfully",
  "timestamp": "2025-10-23T12:00:00.000Z",
  "sync_budget": [
    {
      "budget_id": "1",
      "budget_name": "Groceries",
      "currency_code": "EUR",
      "monthly_amount": 500.00,
      "spent": 350.00,
      "budget_remain": 150.00,
      "active": true
    }
  ],
  "total_sync": 1
}
```

---

### 4. Sync Accounts
Synchronize accounts from Firefly III.

**Endpoint:** `GET /api/sync/sync_accounts`

**Response:**
```json
{
  "success": true,
  "message": "Operation completed successfully",
  "timestamp": "2025-10-23T12:00:00.000Z",
  "sync_accounts": [
    {
      "id": "1",
      "name": "Checking Account",
      "currency_code": "EUR",
      "current_balance": "1500.00",
      "balance_in_usd": "1620.00",
      "balance_in_eur": "1500.00",
      "owner": "John Doe",
      "owner_id": "1"
    }
  ],
  "total_sync": 1
}
```

---

### 5. Sync Categories
Synchronize categories from Firefly III.

**Endpoint:** `GET /api/sync/sync_categories`

**Response:**
```json
{
  "success": true,
  "message": "Operation completed successfully",
  "timestamp": "2025-10-23T12:00:00.000Z",
  "sync_categories": [
    {
      "category_id": "1",
      "name": "Food",
      "notes": "Groceries and dining",
      "active": true
    }
  ],
  "total_sync": 1
}
```

---

### 6. Sync Destination Name Usage
Analyze and sync destination name usage patterns from last 90 days.

**Endpoint:** `GET /api/sync/destination_name_usage`

**Response:**
```json
{
  "success": true,
  "message": "Operation completed successfully",
  "timestamp": "2025-10-23T12:00:00.000Z",
  "destination_name_usage": [
    {
      "user_name": "John",
      "destination_name": "Supermarket",
      "category_name": "Food",
      "usage_count": 15
    }
  ],
  "total_sync": 1
}
```

---

### 7. Sync Accounts Usage
Analyze and sync account usage patterns from last 90 days.

**Endpoint:** `GET /api/sync/sync_accounts_usage`

**Response:**
```json
{
  "success": true,
  "message": "Operation completed successfully",
  "timestamp": "2025-10-23T12:00:00.000Z",
  "sync_accounts_usage": [
    {
      "user_name": "John",
      "account_name": "Checking Account",
      "usage_count": 25
    }
  ],
  "total_sync": 1
}
```

---

### 8. Sync Categories Usage
Analyze and sync category usage patterns from last 90 days.

**Endpoint:** `GET /api/sync/sync_categories_usage`

**Response:**
```json
{
  "success": true,
  "message": "Operation completed successfully",
  "timestamp": "2025-10-23T12:00:00.000Z",
  "sync_categories_usage": [
    {
      "user_name": "John",
      "category_name": "Food",
      "usage_count": 30
    }
  ],
  "total_sync": 1
}
```

---

## GET Endpoints (Read-Only)

These endpoints retrieve data from PostgreSQL cache without triggering sync operations.

### 1. Get Transactions
Retrieve transactions with optional filters.

**Endpoint:** `GET /api/sync/get_transactions`

**Query Parameters:**
- `start_date` (optional) - Start date in YYYY-MM-DD format
- `end_date` (optional) - End date in YYYY-MM-DD format
- `category` (optional) - Filter by category name
- `type` (optional) - Filter by type: `withdrawal`, `deposit`, `transfer`

**Example:**
```
GET /api/sync/get_transactions?start_date=2025-01-01&end_date=2025-01-31&category=Food&type=withdrawal
```

**Response:**
```json
{
  "success": true,
  "message": "Data retrieved successfully",
  "timestamp": "2025-10-23T12:00:00.000Z",
  "get_transactions": [
    {
      "firefly_transaction_id": "123",
      "external_id": "tg-expense-John-1234567890",
      "type": "withdrawal",
      "date": "2025-01-15",
      "amount": 50.00,
      "currency_code": "EUR",
      "description": "Grocery shopping",
      "source_name": "Checking Account",
      "destination_name": "Supermarket",
      "category_name": "Food",
      "user_name": "John",
      "updated_at": "2025-01-15T12:00:00.000Z"
    }
  ],
  "total": 1
}
```

---

### 2. Get Budget
Retrieve budgets with optional active filter.

**Endpoint:** `GET /api/sync/get_budget`

**Query Parameters:**
- `active` (optional) - Filter by active status: `true` or `false`

**Example:**
```
GET /api/sync/get_budget?active=true
```

**Response:**
```json
{
  "success": true,
  "message": "Data retrieved successfully",
  "timestamp": "2025-10-23T12:00:00.000Z",
  "get_budget": [
    {
      "budget_id": "1",
      "budget_name": "Groceries",
      "currency_code": "EUR",
      "monthly_amount": 500.00,
      "spent": 350.00,
      "budget_remain": 150.00,
      "updated_at": "2025-10-23T12:00:00.000Z",
      "active": true
    }
  ],
  "total": 1
}
```

---

### 3. Get Accounts
Retrieve accounts with optional currency filter.

**Endpoint:** `GET /api/sync/get_accounts`

**Query Parameters:**
- `currency_code` (optional) - Filter by currency code: `USD`, `EUR`, `UAH`, etc.

**Example:**
```
GET /api/sync/get_accounts?currency_code=EUR
```

**Response:**
```json
{
  "success": true,
  "message": "Data retrieved successfully",
  "timestamp": "2025-10-23T12:00:00.000Z",
  "get_accounts": [
    {
      "id": "1",
      "name": "Checking Account",
      "currency_code": "EUR",
      "current_balance": 1500.00,
      "balance_in_USD": 1620.00,
      "balance_in_EUR": 1500.00,
      "owner": "John Doe",
      "owner_id": "1"
    }
  ],
  "total": 1
}
```

---

### 4. Get Categories
Retrieve categories with optional active filter.

**Endpoint:** `GET /api/sync/get_categories`

**Query Parameters:**
- `active` (optional) - Filter by active status: `true` or `false`

**Example:**
```
GET /api/sync/get_categories?active=true
```

**Response:**
```json
{
  "success": true,
  "message": "Data retrieved successfully",
  "timestamp": "2025-10-23T12:00:00.000Z",
  "get_categories": [
    {
      "category_id": "1",
      "name": "Food",
      "notes": "Groceries and dining",
      "active": true,
      "created_at": "2025-01-01T12:00:00.000Z",
      "updated_at": "2025-10-23T12:00:00.000Z"
    }
  ],
  "total": 1
}
```

---

### 5. Get Accounts Usage
Retrieve account usage statistics.

**Endpoint:** `GET . `

**Query Parameters:** None

**Example:**
```
GET /api/sync/get_accounts_usage
```

**Response:**
```json
{
  "success": true,
  "message": "Data retrieved successfully",
  "timestamp": "2025-10-23T12:00:00.000Z",
  "get_accounts_usage": [
    {
      "user_name": "John",
      "account_name": "Checking Account",
      "usage_count": 25,
      "created_at": "2025-01-01T12:00:00.000Z",
      "updated_at": "2025-10-23T12:00:00.000Z"
    }
  ],
  "total": 1
}
```

---

### 6. Get Categories Usage
Retrieve category usage statistics with optional user filter.

**Endpoint:** `GET /api/sync/get_categories_usage`

**Query Parameters:**
- `user_name` (optional) - Filter by user name

**Example:**
```
GET /api/sync/get_categories_usage?user_name=John
```

**Response:**
```json
{
  "success": true,
  "message": "Data retrieved successfully",
  "timestamp": "2025-10-23T12:00:00.000Z",
  "get_categories_usage": [
    {
      "user_name": "John",
      "category_name": "Food",
      "usage_count": 30,
      "created_at": "2025-01-01T12:00:00.000Z",
      "updated_at": "2025-10-23T12:00:00.000Z"
    }
  ],
  "total": 1
}
```

---

### 7. Get Destination Name Usage
Retrieve destination usage statistics with optional filters.

**Endpoint:** `GET /api/sync/get_destination_name_usage`

**Query Parameters:**
- `user_name` (optional) - Filter by user name
- `category_name` (optional) - Filter by category name
- Filters can be combined

**Example:**
```
GET /api/sync/get_destination_name_usage?user_name=John&category_name=Food
```

**Response:**
```json
{
  "success": true,
  "message": "Data retrieved successfully",
  "timestamp": "2025-10-23T12:00:00.000Z",
  "get_destination_name_usage": [
    {
      "user_name": "John",
      "destination_name": "Supermarket",
      "category_name": "Food",
      "usage_count": 15,
      "created_at": "2025-01-01T12:00:00.000Z",
      "updated_at": "2025-10-23T12:00:00.000Z"
    }
  ],
  "total": 1
}
```

---

### 8. Get Running Balance
Retrieve daily running balance history across all currencies.

**Endpoint:** `GET /api/sync/get_running_balance`

**Query Parameters:**
- `start_date` (optional) - Start date in YYYY-MM-DD format
- `end_date` (optional) - End date in YYYY-MM-DD format

**Example:**
```
GET /api/sync/get_running_balance?start_date=2025-01-01&end_date=2025-01-31
```

**Response:**
```json
{
  "success": true,
  "message": "Data retrieved successfully",
  "timestamp": "2025-10-23T12:00:00.000Z",
  "get_running_balance": [
    {
      "date": "2025-01-01",
      "balance_eur": 1500.00,
      "balance_usd": 1620.00
    },
    {
      "date": "2025-01-02",
      "balance_eur": 1450.00,
      "balance_usd": 1566.00
    }
  ],
  "total": 2
}
```

**Notes:**
- Uses `running_balance_history` PostgreSQL VIEW for real-time calculations
- Aggregates balances across all account currencies
- Automatically converts to EUR and USD using exchange rates
- Ordered by date ascending

---

## Utility Endpoints

### 1. Exchange Rate Conversion
Convert amount between currencies using stored exchange rates.

**Endpoint:** `GET /api/sync/exchange_rate`

**Query Parameters:**
- `from` (required) - Source currency code (e.g., `UAH`)
- `to` (required) - Target currency code (e.g., `USD`)
- `amount` (optional) - Amount to convert (default: 1.0)

**Example:**
```
GET /api/sync/exchange_rate?from=UAH&to=USD&amount=100
```

**Response:**
```json
{
  "success": true,
  "exchangeData": {
    "from": "UAH",
    "to": "USD",
    "amount": 100,
    "exchangeRate": 0.027,
    "exchangeAmount": 2.70,
    "date": "2025-10-23T12:00:00.000Z"
  }
}
```

---

### 2. Telegram User Authentication
Authenticate Telegram Mini App user and retrieve user data.

**Endpoint:** `POST /api/sync/tgUser`

**Request Body:**
```json
{
  "initData": "query_id=...&user=...&auth_date=...&hash=..."
}
```

**Response:**
```json
{
  "success": true,
  "message": "User data retrieved successfully",
  "timestamp": "2025-10-23T12:00:00.000Z",
  "userData": {
    "id": 123456789,
    "name": "John Doe",
    "username": "johndoe",
    "bio": "Software developer",
    "avatar_url": "https://example.com/avatar.jpg",
    "language_code": "en",
    "bot_blocked": false
  }
}
```

**Authentication Flow:**
1. Validates `initData` signature using HMAC-SHA256
2. Checks PostgreSQL cache (1-hour TTL)
3. If cache miss, fetches from Telegram Bot API
4. Stores in cache for future requests

---

### 3. Sync Status
Get current sync operation status.

**Endpoint:** `GET /api/sync/status`

**Response:**
```json
{
  "sync_in_progress": false,
  "last_sync_time": "2025-10-23T12:00:00.000Z",
  "last_sync_result": {
    "success": true,
    "count": 150
  },
  "timestamp": "2025-10-23T12:05:00.000Z"
}
```

---

### 4. Health Check
Check if sync service is running.

**Endpoint:** `GET /api/sync/health`

**Response:**
```
healthy
```

**Status Code:** 200

---

### 5. Metrics
Get Prometheus-format metrics.

**Endpoint:** `GET /api/sync/metrics`

**Response:**
```
# HELP sync_transactions_total Total number of synced transactions
# TYPE sync_transactions_total counter
sync_transactions_total 1500
...
```

---

## Authentication

**Current Status:** No authentication required (v2.0.0)

All endpoints are currently open and do not require authentication. This is suitable for internal services behind Tailscale funnel.

**Future Considerations:**
- JWT token authentication
- API key authentication
- Telegram initData validation for user-specific endpoints

---

## Error Handling

### HTTP Status Codes

- `200 OK` - Request successful
- `400 Bad Request` - Invalid parameters
- `401 Unauthorized` - Authentication failed (Telegram endpoints)
- `404 Not Found` - Resource not found
- `409 Conflict` - Sync operation already in progress
- `500 Internal Server Error` - Server error

### Error Response Format

```json
{
  "success": false,
  "message": "Detailed error description",
  "timestamp": "2025-10-23T12:00:00.000Z",
  "<data_key>": [],
  "total": 0
}
```

### Common Error Scenarios

1. **Sync Already in Progress (409)**
```json
{
  "success": false,
  "message": "Sync operation already in progress",
  "timestamp": "2025-10-23T12:00:00.000Z",
  "sync_transactions": [],
  "total_sync": 0
}
```

2. **Invalid Parameters (400)**
```json
{
  "success": false,
  "message": "Invalid amount parameter - must be a positive number",
  "timestamp": "2025-10-23T12:00:00.000Z"
}
```

3. **Database Error (500)**
```json
{
  "success": false,
  "message": "Database connection failed",
  "timestamp": "2025-10-23T12:00:00.000Z",
  "get_transactions": [],
  "total": 0
}
```

---

## API Summary

### Endpoint Count: 19 Total

**Sync Endpoints (11):**
1. `GET /api/sync/sync_transactions`
2. `GET /api/sync/sync_exchange_rate`
3. `GET /api/sync/sync_budget` (FastAPI)
4. `GET /api/sync/sync_accounts`
5. `GET /api/sync/sync_categories`
6. `GET /api/sync/destination_name_usage`
7. `GET /api/sync/sync_accounts_usage`
8. `GET /api/sync/sync_categories_usage`
9. `GET /api/sync/budget` (n8n webhook - external)
10. `GET /api/sync/health`
11. `GET /api/sync/metrics`

**GET Endpoints (8):**
1. `GET /api/sync/get_transactions`
2. `GET /api/sync/get_budget`
3. `GET /api/sync/get_accounts`
4. `GET /api/sync/get_categories`
5. `GET /api/sync/get_accounts_usage`
6. `GET /api/sync/get_categories_usage`
7. `GET /api/sync/get_destination_name_usage`
8. `GET /api/sync/get_running_balance`

**Utility Endpoints (3):**
1. `GET /api/sync/exchange_rate`
2. `POST /api/sync/tgUser`
3. `GET /api/sync/status`

---

## Architecture

```
┌─────────────────────┐
│  Nginx Reverse      │  Port 80
│  Proxy              │  (Tailscale Funnel)
└──────────┬──────────┘
           │
           ├──> /api/sync/* ──────> Sync Service
           │                        ├─ Port 8000 (aiohttp)
           │                        │  - Health check
           │                        │  - Metrics
           │                        │
           │                        └─ Port 8001 (FastAPI)
           │                           - All API endpoints
           │
           └──> /* ───────────────> Firefly III (Port 8080)
```

---

## Database Schema

### Key Tables:
- `firefly_transactions` - Transaction data
- `budgets` - Budget information
- `categories` - Category data
- `Accounts_current_state` - Account balances
- `exchange_rates` - Current exchange rates
- `exchange_rates_history` - Historical exchange rates
- `destinations_usage` - Destination usage patterns
- `accounts_usage` - Account usage patterns
- `categories_usage` - Category usage patterns
- `telegram_users` - Telegram user cache

### Key Views:
- `running_balance_history` - Daily running balance calculations

---

## Configuration

### Environment Variables:

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
```

---

## Rate Limiting

**Current Status:** No rate limiting implemented

**Recommendations:**
- Add rate limiting for public-facing endpoints
- Consider per-user rate limits for authenticated endpoints
- Monitor and adjust based on usage patterns

---

## Caching Strategy

### Telegram User Data
- **TTL:** 1 hour (configurable via `TELEGRAM_USER_CACHE_TTL`)
- **Storage:** PostgreSQL `telegram_users` table
- **Invalidation:** Time-based (updated_at comparison)

### Transaction Data
- **Strategy:** Full sync + incremental updates
- **Trigger:** Manual via sync endpoints or scheduled jobs
- **Freshness:** Depends on sync frequency

### Exchange Rates
- **Strategy:** Replace all on sync
- **Update Frequency:** Typically daily
- **Fallback:** Uses last known rates if API unavailable

---

## Version History

### v2.0.0 (2025-10-23)
- Added 8 new GET endpoints for read-only data access
- Added Telegram Mini App authentication (`POST /tgUser`)
- Added running balance history endpoint
- Enhanced filtering support for usage endpoints
- Implemented nginx reverse proxy
- Standardized response format across all endpoints
- Added comprehensive error handling

### v1.0.0 (Initial Release)
- Basic sync endpoints for transactions, budgets, accounts
- Exchange rate synchronization
- PostgreSQL integration

---

## Support & Contributing

For issues, feature requests, or contributions:
- Repository: https://github.com/Kaiukov/firefly
- Sync Service: `/sync` directory
- BudgetBot: `/budgetbot` directory

---

**Last Updated:** 2025-10-23
**API Version:** 2.0.0
