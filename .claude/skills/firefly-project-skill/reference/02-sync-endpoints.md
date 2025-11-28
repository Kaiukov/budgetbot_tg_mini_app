# Sync Endpoints

These endpoints trigger synchronization operations between Firefly III API and PostgreSQL database.

## 1. Sync Transactions
Synchronize transactions from Firefly III.

**Endpoint:** `GET /api/v1/sync_transactions`

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

## 2. Sync Exchange Rate
Synchronize exchange rates from external API.

**Endpoint:** `GET /api/v1/sync_exchange_rate`

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

## 3. Sync Budget
Synchronize budgets from Firefly III.

**Endpoint:** `GET /api/v1/sync_budget`

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

## 4. Sync Accounts
Synchronize accounts from Firefly III.

**Endpoint:** `GET /api/v1/sync_accounts`

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

## 5. Sync Categories
Synchronize categories from Firefly III.

**Endpoint:** `GET /api/v1/sync_categories`

**Response:**
```json
{
  "success": true,
  "message": "Operation completed successfully",
  "timestamp": "2025-10-23T12:00:00.000Z",
  "sync_categories": [
        {
            "id": "24",
            "name": "Fee"
        },
  ],
  "total_sync": 1
}
```
