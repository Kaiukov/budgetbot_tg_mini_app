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
Retrieve categories with optional filters and user-specific usage data.

When `user_name` is provided, returns categories with personalized usage counts, following the same pattern as `/get_accounts_usage` endpoint.

**Endpoint:** `GET /api/sync/get_categories`

**Query Parameters:**
- `active` (optional) - Filter by active status: `true` or `false`
- `user_name` (optional) - Filter by user name and include usage counts

**Examples:**
```
# Get all active categories (basic mode)
GET /api/sync/get_categories?active=true

# Get categories with user-specific usage data
GET /api/sync/get_categories?user_name=John

# Combine filters: active categories for specific user
GET /api/sync/get_categories?active=true&user_name=John
```

**Response (without user_name):**
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

**Response (with user_name):**
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
      "updated_at": "2025-10-23T12:00:00.000Z",
      "user_name": "John",
      "usage_count": 45
    },
    {
      "category_id": "2",
      "name": "Transport",
      "notes": "Travel expenses",
      "active": true,
      "created_at": "2025-01-01T12:00:00.000Z",
      "updated_at": "2025-10-23T12:00:00.000Z",
      "user_name": "John",
      "usage_count": 0
    }
  ],
  "total": 2
}
```

**Notes:**
- Returns ALL active categories (including those with zero usage) when `user_name` is provided
- When `user_name` is provided, categories are sorted by that user's usage frequency (DESC)
- Without `user_name`, categories are sorted alphabetically by name
- Uses CTE-based query with LEFT JOIN for optimal performance
- Includes complete category details: name, notes, active status, timestamps

---

### 5. Get Accounts Usage
Retrieve ALL accounts with user-specific usage statistics and full account details.

**🔑 Key Behavior:** When `user_name` is provided, returns ALL accounts in the system with usage counts showing how often THAT specific user has used each account. This includes accounts owned by other users, shared accounts, and accounts the user has never used.

Combines account information from `Accounts_current_state` with usage patterns from `accounts_usage` table. Returns all accounts with their usage counts, sorted by frequency.

**Endpoint:** `GET /api/sync/get_accounts_usage`

**Query Parameters:**
- `user_name` (optional) - Show usage statistics for specific user across ALL accounts

**Examples:**
```
# Get all accounts sorted alphabetically (no usage data)
GET /api/sync/get_accounts_usage

# Get ALL accounts sorted by John's usage frequency
GET /api/sync/get_accounts_usage?user_name=John
```

**Response (with user_name):**
```json
{
  "success": true,
  "message": "Data retrieved successfully",
  "timestamp": "2025-10-31T01:06:51.537581",
  "get_accounts_usage": [
    {
      "account_id": "1",
      "user_name": "John",
      "account_name": "John's Checking",
      "account_currency": "EUR",
      "current_balance": 1500.00,
      "balance_in_USD": 1620.00,
      "balance_in_EUR": 1500.00,
      "owner": "John",
      "owner_id": "1",
      "usage_count": 41
    },
    {
      "account_id": "5",
      "user_name": "John",
      "account_name": "Jane's Savings",
      "account_currency": "USD",
      "current_balance": 5000.00,
      "balance_in_USD": 5000.00,
      "balance_in_EUR": 4629.63,
      "owner": "Jane",
      "owner_id": "2",
      "usage_count": 7
    },
    {
      "account_id": "3",
      "user_name": "John",
      "account_name": "Shared Cash Account",
      "account_currency": "USD",
      "current_balance": 2380.00,
      "balance_in_USD": 2380.00,
      "balance_in_EUR": 2047.69,
      "owner": "Jane",
      "owner_id": "2",
      "usage_count": 2
    },
    {
      "account_id": "8",
      "user_name": "John",
      "account_name": "Jane's Personal Card",
      "account_currency": "EUR",
      "current_balance": 753.64,
      "balance_in_USD": 875.95,
      "balance_in_EUR": 753.64,
      "owner": "Jane",
      "owner_id": "2",
      "usage_count": 0
    }
  ],
  "total": 4
}
```

**Response (without user_name):**
```json
{
  "success": true,
  "message": "Data retrieved successfully",
  "timestamp": "2025-10-31T01:06:57.045387",
  "get_accounts_usage": [
    {
      "account_id": "3",
      "user_name": "Jane",
      "account_name": "Shared Cash Account",
      "account_currency": "USD",
      "current_balance": 2380.00,
      "balance_in_USD": 2380.00,
      "balance_in_EUR": 2047.69,
      "owner": "Jane",
      "owner_id": "2",
      "usage_count": 0
    },
    {
      "account_id": "1",
      "user_name": "John",
      "account_name": "John's Checking",
      "account_currency": "EUR",
      "current_balance": 1500.00,
      "balance_in_USD": 1620.00,
      "balance_in_EUR": 1500.00,
      "owner": "John",
      "owner_id": "1",
      "usage_count": 0
    }
  ],
  "total": 2
}
```

**Field Descriptions:**
- **`user_name`**: The requesting user (parameter value) when filtered, otherwise account owner
- **`owner`**: The actual account owner (may differ from `user_name` for shared accounts)
- **`owner_id`**: Firefly III user ID of the account owner
- **`usage_count`**: How many times the requesting user has used this account (last 90 days)

**Use Cases:**
1. **Smart Account Suggestions**: Show user's most-used accounts first, regardless of ownership
2. **Shared Account Management**: Track which shared accounts each user actually uses
3. **Account Discovery**: Users can see all available accounts (including those they haven't used)
4. **Personal Analytics**: Understand usage patterns across all accessible accounts

**Notes:**
- ✅ Returns ALL accounts in the system (not filtered by ownership)
- ✅ When `user_name` provided, shows that user's usage across ALL accounts
- ✅ Includes accounts with `usage_count=0` (never used by requesting user)
- ✅ Shows accounts owned by other users if requesting user has used them
- ✅ Sorted by requesting user's `usage_count DESC`, then account name
- ✅ Without `user_name`, returns all accounts sorted alphabetically with owner as `user_name`
- ✅ Uses CTE-based query with LEFT JOIN for optimal performance
- ✅ Includes complete account details: balances, currency conversions, owner information
- ⚠️ `user_name` and `owner` fields serve different purposes - don't confuse them!

---

### 6. Get Categories Usage
Retrieve ALL category usage data (used and unused) for a specific user with smart sorting.

Returns all categories including those never used by the user. Used categories have `usage_count > 0`, unused have `usage_count = 0`.

**Endpoint:** `GET /api/sync/get_categories_usage`

**Query Parameters:**
- `user_name` (required) - Filter by user name (mandatory parameter)

**Example:**
```
GET /api/sync/get_categories_usage?user_name=John
```

**Response (Success):**
```json
{
  "success": true,
  "message": "Data retrieved successfully",
  "timestamp": "2025-10-23T12:00:00.000Z",
  "get_categories_usage": [
    {
      "user_name": "John",
      "category_name": "Food",
      "category_id": 1,
      "usage_count": 30,
      "created_at": "2025-01-01T12:00:00.000Z",
      "updated_at": "2025-10-23T12:00:00.000Z"
    },
    {
      "user_name": "John",
      "category_name": "Transport",
      "category_id": 2,
      "usage_count": 15,
      "created_at": "2025-01-01T12:00:00.000Z",
      "updated_at": "2025-10-20T12:00:00.000Z"
    },
    {
      "user_name": "John",
      "category_name": "Health",
      "category_id": 3,
      "usage_count": 0,
      "created_at": null,
      "updated_at": null
    },
    {
      "user_name": "John",
      "category_name": "Entertainment",
      "category_id": 4,
      "usage_count": 0,
      "created_at": null,
      "updated_at": null
    }
  ],
  "total": 4
}
```

**Response (Missing user_name - 400 Bad Request):**
```json
{
  "success": false,
  "message": "Missing required query parameter: user_name",
  "timestamp": "2025-10-23T12:00:00.000Z",
  "get_categories_usage": [],
  "total": 0
}
```

**Features:**
- ✅ Returns ALL categories (used + unused)
- ✅ Includes `category_id` from categories table
- ✅ Unused categories have `usage_count = 0`
- ✅ Null timestamps for unused categories
- ✅ Sorted by `usage_count DESC` (most used first)
- ✅ Mandatory `user_name` parameter (returns 400 if missing)
- ✅ Perfect for client-side smart sorting and category suggestions

**Notes:**
- **Mandatory Parameter**: `user_name` is required. Request without it returns 400 Bad Request
- **Complete Coverage**: Returns every active category in the system, regardless of user history
- **Smart Sorting**: Used categories (with usage data) appear first, sorted by frequency
- **Data Freshness**: Usage counts based on transactions from last 90 days (sync-dependent)
- **Use Case**: Client app can make single API call and get all categories pre-sorted for smart suggestions

---

### 7. Get Destination Name Usage
Retrieve destination usage statistics with optional smart suggestions.

When both `user_name` AND `category_name` are provided, returns **smart suggestions** combining personal destinations with popular community destinations for discovery.

**Endpoint:** `GET /api/sync/get_destination_name_usage`

**Query Parameters:**
- `user_name` (optional) - Filter by user name (enables smart suggestions when combined with category_name)
- `category_name` (optional) - Filter by category name (enables smart suggestions when combined with user_name)
- Filters can be combined for different modes

**Examples:**
```
# Basic mode: Only John's used destinations
GET /api/sync/get_destination_name_usage?user_name=John

# Basic mode: All destinations in Food category (all users)
GET /api/sync/get_destination_name_usage?category_name=Food

# Smart suggestions mode: John's destinations + popular community destinations in Food
GET /api/sync/get_destination_name_usage?user_name=John&category_name=Food
```

**Response (basic mode - only user's used destinations):**
```json
{
  "success": true,
  "message": "Data retrieved successfully",
  "timestamp": "2025-10-28T12:00:00.000Z",
  "get_destination_name_usage": [
    {
      "user_name": "John",
      "destination_name": "Penny Market",
      "category_name": "Food",
      "usage_count": 45,
      "created_at": "2025-01-01T12:00:00.000Z",
      "updated_at": "2025-10-28T12:00:00.000Z"
    }
  ],
  "total": 1
}
```

**Response (smart suggestions mode - personal + community):**
```json
{
  "success": true,
  "message": "Data retrieved successfully",
  "timestamp": "2025-10-28T12:00:00.000Z",
  "get_destination_name_usage": [
    {
      "user_name": "John",
      "destination_name": "Penny Market",
      "category_name": "Food",
      "usage_count": 45,
      "global_usage": 120,
      "user_has_used": true,
      "created_at": "2025-01-01T12:00:00.000Z",
      "updated_at": "2025-10-28T12:00:00.000Z"
    },
    {
      "user_name": "John",
      "destination_name": "Starbucks",
      "category_name": "Food",
      "usage_count": 12,
      "global_usage": 300,
      "user_has_used": true,
      "created_at": "2025-01-05T12:00:00.000Z",
      "updated_at": "2025-10-28T12:00:00.000Z"
    },
    {
      "user_name": "John",
      "destination_name": "McDonald's",
      "category_name": "Food",
      "usage_count": 0,
      "global_usage": 500,
      "user_has_used": false,
      "created_at": null,
      "updated_at": null
    },
    {
      "user_name": "John",
      "destination_name": "Local Bakery",
      "category_name": "Food",
      "usage_count": 0,
      "global_usage": 80,
      "user_has_used": false,
      "created_at": null,
      "updated_at": null
    }
  ],
  "total": 4
}
```

**Smart Suggestions Features:**
- **Discovery**: Users discover popular destinations they haven't tried yet
- **Personalization**: User's destinations shown first, sorted by personal usage
- **Social Intelligence**: Community destinations sorted by global popularity
- **Complete Data**: Includes `global_usage` (total across all users) and `user_has_used` flag
- **Smart Sorting**:
  1. User's used destinations (by personal usage DESC)
  2. Community destinations not yet used (by global popularity DESC)
  3. Alphabetically within each group

**Notes:**
- **Smart mode** activates ONLY when both `user_name` AND `category_name` are provided
- Basic filtering mode works when only one parameter is provided (backward compatible)
- Returns ALL destinations in category when smart mode active
- Similar to budgetbot's `get_smart_destinations_for_user()` functionality
- Uses CTE-based query with LEFT JOIN for optimal performance
- Perfect for autocomplete UI with discovery features

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

### 9. Get Current Balance
Retrieve current aggregated balances across all accounts.

**Endpoint:** `GET /api/sync/get_current_balance`

**Response:**
```json
{
  "success": true,
  "message": "Data retrieved successfully",
  "timestamp": "2025-10-31T03:07:37.976006",
  "get_current_balance": [
    {
      "date": "2025-10-31",
      "balance_in_EUR": 11870.44,
      "balance_in_USD": 13747.46
    }
  ],
  "total": 1
}
```

**Notes:**
- Reads from PostgreSQL view `current_balance`.
- Falls back to summing `Accounts_current_state` if the view is missing.

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

### Endpoint Count: 18 Total

**Sync Endpoints (8):**
1. `GET /api/sync/sync_transactions`
2. `GET /api/sync/sync_exchange_rate`
3. `GET /api/sync/sync_budget`
4. `GET /api/sync/sync_accounts`
5. `GET /api/sync/sync_categories`
6. `GET /api/sync/destination_name_usage`
7. `GET /api/sync/sync_accounts_usage`
8. `GET /api/sync/sync_categories_usage`

**GET Endpoints (9):**
1. `GET /api/sync/get_transactions`
2. `GET /api/sync/get_budget`
3. `GET /api/sync/get_accounts`
4. `GET /api/sync/get_categories`
5. `GET /api/sync/get_accounts_usage`
6. `GET /api/sync/get_categories_usage`
7. `GET /api/sync/get_destination_name_usage`
8. `GET /api/sync/get_running_balance`
9. `GET /api/sync/get_current_balance`

**Utility Endpoints (2):**
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

### v2.0.1 (2025-10-31)
- **Fixed** `/get_accounts_usage` endpoint user filtering behavior:
  - `user_name` field now correctly shows requesting user, not account owner
  - Returns ALL accounts with requesting user's usage statistics
  - Properly supports shared account usage tracking across users
  - Enhanced documentation with clear field descriptions and use cases

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

**Last Updated:** 2025-10-31
**API Version:** 2.0.1