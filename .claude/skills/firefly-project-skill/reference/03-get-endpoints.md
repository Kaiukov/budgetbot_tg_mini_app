# GET Endpoints (Read-Only)

These endpoints retrieve cached data from PostgreSQL without triggering sync operations.

## 1. Get Transactions
Retrieve transactions with optional filters.

**Endpoint:** `GET /api/v1/get_transactions`

**Query Parameters:**
- `start_date` (optional) - Start date in YYYY-MM-DD format
- `end_date` (optional) - End date in YYYY-MM-DD format
- `category` (optional) - Filter by category name
- `type` (optional) - Filter by type: `withdrawal`, `deposit`, `transfer`

**Example:**
```
GET /api/v1/get_transactions?start_date=2025-01-01&end_date=2025-01-31&category=Food&type=withdrawal
```

**Response:**
```json
{
  "success": true,
  "message": "Operation completed successfully",
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

## 2. Get Budget
Retrieve budgets with optional active filter.

**Endpoint:** `GET /api/v1/get_budget`

**Query Parameters:**
- `active` (optional) - Filter by active status: `true` or `false`

**Example:**
```
GET /api/v1/get_budget?active=true
```

**Response:**
```json
{
  "success": true,
  "message": "Operation completed successfully",
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

## 3. Get Accounts
Retrieve accounts with optional currency filter.

**Endpoint:** `GET /api/v1/get_accounts`

**Query Parameters:**
- `currency_code` (optional) - Filter by currency code: `USD`, `EUR`, `UAH`, etc.

**Example:**
```
GET /api/v1/get_accounts?currency_code=EUR
```

**Response:**
```json
{
  "success": true,
  "message": "Operation completed successfully",
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

## 4. Get Categories
Retrieve categories with optional filters and user-specific usage data.

When `user_name` is provided, returns categories with personalized usage counts, following the same pattern as `/get_accounts_usage` endpoint.

**Endpoint:** `GET /api/v1/get_categories`

**Query Parameters:**
- `active` (optional) - Filter by active status: `true` or `false`
- `user_name` (optional) - Filter by user name and include usage counts

**Examples:**
```
# Get all active categories (basic mode)
GET /api/v1/get_categories?active=true

# Get categories with user-specific usage data
GET /api/v1/get_categories?user_name=John

# Combine filters: active categories for specific user
GET /api/v1/get_categories?active=true&user_name=John
```

**Response (without user_name):**
```json
{
  "success": true,
  "message": "Operation completed successfully",
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
  "message": "Operation completed successfully",
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

## 5. Get Accounts Usage
Retrieve ALL accounts with user-specific usage statistics and full account details.

**🔑 Key Behavior:** When `user_name` is provided, returns ALL accounts in the system with usage counts showing how often THAT specific user has used each account. This includes accounts owned by other users, shared accounts, and accounts the user has never used.

Combines account information from `Accounts_current_state` with usage patterns sourced from the precomputed `accounts_usage_view`. Returns all accounts with their usage counts, sorted by frequency.

**Endpoint:** `GET /api/v1/get_accounts_usage`

**Query Parameters:**
- `user_name` (optional) - Show usage statistics for specific user across ALL accounts

**Examples:**
```
# Get all accounts sorted by owner usage frequency (default view)
GET /api/v1/get_accounts_usage

# Get ALL accounts sorted by John's usage frequency
GET /api/v1/get_accounts_usage?user_name=John
```

**Response (with user_name):**
```json
{
  "success": true,
  "message": "Operation completed successfully",
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
      "usage_count": 41,
      "first_used_at": "2025-08-01T09:00:00.000000",
      "last_used_at": "2025-10-31T01:06:51.537581"
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
      "usage_count": 7,
      "first_used_at": "2025-09-04T10:12:00.000000",
      "last_used_at": "2025-10-30T07:15:33.000000"
    }
  ],
  "total_sync": 2
}
```

**Response (without user_name):**
```json
{
  "success": true,
  "message": "Operation completed successfully",
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
      "usage_count": 0,
      "first_used_at": null,
      "last_used_at": null
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
      "usage_count": 0,
      "first_used_at": null,
      "last_used_at": null
    }
  ],
  "total_sync": 2
}
```

**Field Descriptions:**
- **`user_name`**: The requesting user (when `user_name` parameter provided), otherwise the account owner. Shows whose usage is being tracked.
- **`owner`**: The actual account owner in Firefly III (may differ from `user_name` for shared accounts).
- **`owner_id`**: Firefly III user ID of the account owner.
- **`usage_count`**: How many times the specified user (or owner if no filter) has used this account within the last 90 days.
- **`first_used_at`**: First usage timestamp within the 90-day window (null if never used).
- **`last_used_at`**: Most recent usage timestamp within the 90-day window (null if never used).

**Use Cases:**
1. **Smart Account Suggestions**: Show user's most-used accounts first, regardless of ownership
2. **Shared Account Management**: Track which shared accounts each user actually uses
3. **Account Discovery**: Users can see all available accounts (including those they haven't used)
4. **Personal Analytics**: Understand usage patterns across all accessible accounts

**Notes:**
- ✅ Returns ALL accounts in the system (never filtered by ownership)
- ✅ When `user_name` provided, shows that user's usage across ALL accounts (even accounts owned by others)
- ✅ Always includes accounts with `usage_count=0` (never used by the tracked user)
- ✅ Includes accounts owned by other users if the tracked user has used them
- ✅ Sorted by usage_count DESC (most-used first), then account name
- ✅ Without `user_name`, returns all accounts with each owner's own usage stats
- ✅ Powered by the `accounts_usage_view` (90-day rolling aggregation) joined with `accounts_current_state`
- ✅ Includes complete account details: current balances, multi-currency conversions, owner information
- ✅ Now includes usage timestamps: `first_used_at` and `last_used_at`
- ✅ Response envelope uses `total_sync` (count of returned records)
- ✅ Data-safe: `user_name` shows requested filter, `owner` shows actual account owner
- ⚠️ Never returns empty list - always shows all accounts

---

## 6. Get Categories Usage
Retrieve ALL category usage data (used and unused) for a specific user with optional type filtering and smart sorting.

Returns all categories including those never used by the user. Used categories have `usage_count > 0`, unused have `usage_count = 0`. Categories are tagged with type metadata (withdrawal/deposit/service).

**Endpoint:** `GET /api/v1/get_categories_usage`

**Query Parameters:**
- `user_name` (required) - Filter by user name (mandatory parameter)
- `type` (optional) - Filter by category type (e.g., `withdrawal`, `deposit`, `service`)

**Examples:**
```
# Get all categories for user
GET /api/v1/get_categories_usage?user_name=John

# Get only withdrawal categories for user
GET /api/v1/get_categories_usage?user_name=John&type=withdrawal

# Get deposit categories (case-insensitive)
GET /api/v1/get_categories_usage?user_name=John&type=DEPOSIT
```

**Response (Success):**
```json
{
  "success": true,
  "message": "Operation completed successfully",
  "timestamp": "2025-11-23T12:00:00.000Z",
  "get_categories_usage": [
    {
      "user_name": "John",
      "category_id": 1,
      "category_name": "Food",
      "type": "withdrawal",
      "usage_count": 30,
      "global_usage": 150,
      "user_has_used": true
    },
    {
      "user_name": "John",
      "category_id": 2,
      "category_name": "Transport",
      "type": "withdrawal",
      "usage_count": 15,
      "global_usage": 85,
      "user_has_used": true
    },
    {
      "user_name": "John",
      "category_id": 5,
      "category_name": "Salary",
      "type": "deposit",
      "usage_count": 0,
      "global_usage": 200,
      "user_has_used": false
    }
  ],
  "total": 3
}
```

**Field Descriptions:**
- `category_id`: Unique category identifier from Firefly III
- `category_name`: Category display name
- `type`: Category type (`withdrawal`, `deposit`, `service`, or `unknown`)
- `usage_count`: Number of withdrawal/deposit transactions linked to category in the last 90 days (for requested user)
- `global_usage`: Total usage count across all users for this category in the last 90 days
- `user_has_used`: Boolean indicating whether the requested user has used this category

**Response (Missing user_name - 400 Bad Request):**
```json
{
  "success": false,
  "message": "Missing required query parameter: user_name",
  "timestamp": "2025-11-23T12:00:00.000Z",
  "get_categories_usage": [],
  "total": 0
}
```

**Features:**
- ✅ Returns ALL categories (used + unused)
- ✅ Includes category type metadata (`withdrawal`, `deposit`, `service`)
- ✅ Optional `type` filtering (case-insensitive)
- ✅ Global usage tracking across all users
- ✅ `user_has_used` boolean flag for easy filtering
- ✅ Sorted by `usage_count DESC`, `category_name ASC`
- ✅ Mandatory `user_name` parameter (returns 400 if missing)
- ✅ Perfect for client-side smart sorting and category suggestions

**Notes:**
- **Mandatory Parameter**: `user_name` is required. Request without it returns 400 Bad Request
- **Complete Coverage**: Returns every active category in the system, regardless of user history
- **Type Filtering**: Categories with missing or unparseable type default to `unknown`
- **Smart Sorting**: Personal usage appears first (user_has_used=true), sorted by frequency
- **Data Freshness**: Backed by the `categories_usage_view`, which recalculates the last 90 days of transactions on demand—no manual sync required
- **Use Case**: Client app can make single API call and get all categories pre-sorted with community usage insights

---

## 7. Get Destination Name Usage
Retrieve destination usage statistics with optional smart suggestions.

When both `user_name` AND `category_name`/`category_id` are provided, returns **smart suggestions** combining personal destinations with popular community destinations for discovery. Responses always include destination/category identifiers, personal usage counts, global popularity, and a `user_has_used` flag. **Simplified 8-field structure** (no Telegram metadata or timestamps).

**Endpoint:** `GET /api/v1/get_destination_name_usage`

**Query Parameters:**
- `user_name` (optional) - Filter by user name (enables smart suggestions when combined with category_name or category_id)
- `category_name` (optional) - Filter by category name (backward compatible, enables smart suggestions when combined with user_name)
- `category_id` (optional) - Filter by category ID (takes precedence over category_name when both provided)
- Filters can be combined for different modes

**Examples:**
```
# Basic mode: Only John's used destinations
GET /api/v1/get_destination_name_usage?user_name=John

# Basic mode: All destinations in Food category (all users)
GET /api/v1/get_destination_name_usage?category_name=Food

# Smart suggestions mode: John's destinations + popular community destinations in Food (using category_name)
GET /api/v1/get_destination_name_usage?user_name=John&category_name=Food

# Smart suggestions mode: John's destinations + popular community destinations in Food (using category_id)
GET /api/v1/get_destination_name_usage?user_name=John&category_id=1
```

**Response (basic mode - user scope only):**
```json
{
  "success": true,
  "message": "Operation completed successfully",
  "timestamp": "2025-11-22T12:00:00.000Z",
  "get_destination_name_usage": [
    {
      "user_name": "John",
      "destination_id": "22",
      "destination_name": "Penny Market",
      "category_id": "1",
      "category_name": "Food",
      "usage_count": 45,
      "global_usage": 120,
      "user_has_used": true
    },
    {
      "user_name": "John",
      "destination_id": "33",
      "destination_name": "Local Bakery",
      "category_id": "1",
      "category_name": "Food",
      "usage_count": 0,
      "global_usage": 80,
      "user_has_used": false
    }
  ],
  "total_sync": 2
}
```

**Response (smart suggestions mode - personal + community):**
```json
{
  "success": true,
  "message": "Operation completed successfully",
  "timestamp": "2025-11-22T12:00:00.000Z",
  "get_destination_name_usage": [
    {
      "user_name": "John",
      "destination_id": "22",
      "destination_name": "Penny Market",
      "category_id": "1",
      "category_name": "Food",
      "usage_count": 45,
      "global_usage": 120,
      "user_has_used": true
    },
    {
      "user_name": "John",
      "destination_id": "44",
      "destination_name": "Starbucks",
      "category_id": "1",
      "category_name": "Food",
      "usage_count": 12,
      "global_usage": 300,
      "user_has_used": true
    },
    {
      "user_name": "John",
      "destination_id": "58",
      "destination_name": "McDonald's",
      "category_id": "1",
      "category_name": "Food",
      "usage_count": 0,
      "global_usage": 500,
      "user_has_used": false
    },
    {
      "user_name": "John",
      "destination_id": "70",
      "destination_name": "Local Bakery",
      "category_id": "1",
      "category_name": "Food",
      "usage_count": 0,
      "global_usage": 80,
      "user_has_used": false
    }
  ],
  "total_sync": 4
}
```

**Field Descriptions:**
- `destination_id`: Firefly destination (account) identifier for the payee
- `destination_name`: Destination account/title
- `category_id` / `category_name`: Category context for the destination
- `usage_count`: Personal usage count for the filtered user in the last 90 days (integer)
- `global_usage`: Sum of all users' usage for the same destination/category (integer)
- `user_has_used`: `true` when the filtered user has used this destination at least once

**Response Structure:**
- ✅ Exactly 8 fields per record (consistent with source endpoint)
- ✅ No Telegram metadata (removed: telegram_user_id, first_name, last_name, telegram_username)
- ✅ No timestamp fields (removed: created_at, updated_at)
- ✅ Integer counts (usage_count, global_usage)
- ✅ Boolean user_has_used flag

**Smart Suggestions Features:**
- **Discovery**: Users discover popular destinations they haven't tried yet (records with `user_has_used=false`)
- **Personalization**: Personal destinations appear first, sorted by `usage_count` DESC
- **Social Intelligence**: Community destinations sorted by `global_usage` DESC when the user has never used them
- **Smart Sorting**: `user_has_used` DESC → `usage_count` DESC → `global_usage` DESC
- **Unified Structure**: Identical field structure to source endpoint for consistency

**Notes:**
- **Smart mode** activates when both `user_name` AND (`category_id` or `category_name`) are provided
- Basic filtering mode works with any single filter (user-only or category-only)
- Returns all destinations that have a category_id in the 90-day transaction window, even if `usage_count = 0` for the user
- Backed by the consolidated `destination_name_usage_view` (3-CTE structure matching source pattern)
- Response envelope uses `total_sync` (count of returned records)
- Uses `transactions` table with `type = 'withdrawal'` filter (90-day rolling window)
- Perfect for autocomplete UI with discovery features

---

## 8. Get Source Name Usage
Retrieve source (income) usage statistics with optional smart suggestions.

When both `user_name` AND `category_name`/`category_id` are provided, returns **smart suggestions** combining personal income sources with popular community sources for discovery. Responses mirror the destination endpoint: identifiers, usage counts, global usage, and a `user_has_used` boolean only.

**Endpoint:** `GET /api/v1/get_source_name_usage`

**Query Parameters:**
- `user_name` (optional) - Filter by user name (enables smart suggestions when combined with category_name or category_id)
- `category_name` (optional) - Filter by category name (backward compatible, enables smart suggestions when combined with user_name)
- `category_id` (optional) - Filter by category ID (takes precedence over category_name when both provided)
- Filters can be combined for different modes

**Examples:**
```
# Basic mode: Only John's used income sources
GET /api/v1/get_source_name_usage?user_name=John

# Basic mode: All sources in Salary category (all users)
GET /api/v1/get_source_name_usage?category_name=Salary

# Smart suggestions mode: John's sources + popular community sources in Salary (using category_name)
GET /api/v1/get_source_name_usage?user_name=John&category_name=Salary

# Smart suggestions mode: John's sources + popular community sources in Salary (using category_id)
GET /api/v1/get_source_name_usage?user_name=John&category_id=5
```

**Response (basic mode - only user's used sources):**
```json
{
  "success": true,
  "message": "Operation completed successfully",
  "timestamp": "2025-10-28T12:00:00.000Z",
  "get_source_name_usage": [
    {
      "user_name": "John",
      "source_id": "17",
      "source_name": "Employer ABC",
      "category_id": "5",
      "category_name": "Salary",
      "usage_count": 12,
      "global_usage": 45,
      "user_has_used": true
    }
  ],
  "total_sync": 1
}
```

**Response (smart suggestions mode - personal + community):**
```json
{
  "success": true,
  "message": "Operation completed successfully",
  "timestamp": "2025-10-28T12:00:00.000Z",
  "get_source_name_usage": [
    {
      "user_name": "John",
      "source_id": "17",
      "source_name": "Employer ABC",
      "category_id": "5",
      "category_name": "Salary",
      "usage_count": 12,
      "global_usage": 45,
      "user_has_used": true
    },
    {
      "user_name": "John",
      "source_id": "21",
      "source_name": "Freelance Project",
      "category_id": "5",
      "category_name": "Salary",
      "usage_count": 8,
      "global_usage": 20,
      "user_has_used": true
    },
    {
      "user_name": "John",
      "source_id": "28",
      "source_name": "Bonus Payment",
      "category_id": "5",
      "category_name": "Salary",
      "usage_count": 0,
      "global_usage": 35,
      "user_has_used": false
    },
    {
      "user_name": "John",
      "source_id": "30",
      "source_name": "Side Gig",
      "category_id": "5",
      "category_name": "Salary",
      "usage_count": 0,
      "global_usage": 15,
      "user_has_used": false
    }
  ],
  "total_sync": 4
}
```

**Field Descriptions:**
- `source_id`: Firefly source (income account) identifier
- `source_name`: Income source account/title
- `category_id` / `category_name`: Category context for the source
- `usage_count`: Personal usage count for the filtered user in the last 90 days
- `global_usage`: Sum of all users' usage for the same source/category
- `user_has_used`: `true` when the filtered user has used this source at least once

**Smart Suggestions Features:**
- **Discovery**: Users discover popular income sources they haven't used yet
- **Personalization**: User's sources shown first, sorted by personal usage
- **Social Intelligence**: Community sources sorted by global popularity
- **Complete Data**: Every record includes `global_usage`, `user_has_used`, and IDs (no timestamps/Telegram metadata)
- **Smart Sorting**:
  1. User's used sources (by personal usage DESC)
  2. Community sources not yet used (by global popularity DESC)
  3. Stable ordering within each group

**Notes:**
- **Smart mode** activates ONLY when both `user_name` AND `category_name`/`category_id` are provided
- Basic filtering mode works when only one parameter is provided (backward compatible)
- Returns ALL sources in the category when smart mode is active, even with `usage_count = 0` for the user
- Backed by the consolidated `source_name_usage_view`, which now precomputes both personal history and community popularity for every user/category/source combination
- Response envelope uses `total_sync` (count of returned records)
- Perfect for autocomplete UI with discovery features for income sources

---

## 9. Get Running Balance
Retrieve daily running balance history across all currencies.

**Endpoint:** `GET /api/v1/get_running_balance`

**Query Parameters:**
- `start_date` (optional) - Start date in YYYY-MM-DD format
- `end_date` (optional) - End date in YYYY-MM-DD format

**Example:**
```
GET /api/v1/get_running_balance?start_date=2025-01-01&end_date=2025-01-31
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

# Utility Endpoints

## 1. Exchange Rate Conversion
Convert amount between currencies using stored exchange rates.

**Endpoint:** `GET /api/v1/exchange_rate`

**Query Parameters:**
- `from` (required) - Source currency code (e.g., `UAH`)
- `to` (required) - Target currency code (e.g., `USD`)
- `amount` (optional) - Amount to convert (default: 1.0)

**Example:**
```
GET /api/v1/exchange_rate?from=UAH&to=USD&amount=100
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

## 2. Telegram User Authentication
Authenticate Telegram Mini App user and retrieve user data.

**Endpoint:** `POST /api/v1/tgUser`

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

## 3. Sync Status
Get current sync operation status.

**Endpoint:** `GET /api/v1/status`

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
