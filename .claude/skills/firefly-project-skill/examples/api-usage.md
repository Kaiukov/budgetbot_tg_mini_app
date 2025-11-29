# Firefly API Usage Examples

## Authentication Examples

### Tier 3: Anonymous Read-Only

```bash
# Basic read - no authentication needed
curl -H "X-Anonymous-Key: ${SYNC_ANON_API_KEY}" \
  "https://firefly.example.com/api/v1/get_transactions?limit=10"

# Get categories
curl -H "X-Anonymous-Key: ${SYNC_ANON_API_KEY}" \
  "https://firefly.example.com/api/v1/get_categories?active=true"

# Get accounts usage for specific user
curl -H "X-Anonymous-Key: ${SYNC_ANON_API_KEY}" \
  "https://firefly.example.com/api/v1/get_accounts_usage?user_name=John"
```

### Tier 2: Telegram Authorized (Read + Write)

```bash
# Validate Telegram user
curl -X POST \
  -H "X-Anonymous-Key: ${SYNC_ANON_API_KEY}" \
  -H "Content-Type: application/json" \
  -d '{"initData":"query_id=...&user=...&hash=..."}' \
  "https://firefly.example.com/api/v1/tgUser"

# Create transaction (requires is_auth=true)
curl -X POST \
  -H "X-Anonymous-Key: ${SYNC_ANON_API_KEY}" \
  -H "X-Telegram-Init-Data: ${TELEGRAM_INIT_DATA}" \
  -H "Content-Type: application/json" \
  -d '{
    "date": "2025-11-24T12:00:00Z",
    "amount": "15.50",
    "currency": "EUR",
    "category": "Food",
    "account": "CASH EUR",
    "comment": "Lunch"
  }' \
  "https://firefly.example.com/api/v1/transactions"

# Trigger sync
curl -H "X-Anonymous-Key: ${SYNC_ANON_API_KEY}" \
     -H "X-Telegram-Init-Data: ${TELEGRAM_INIT_DATA}" \
  "https://firefly.example.com/api/v1/sync_transactions"
```

### Tier 1: Service (Full Access)

```bash
# Delete transaction
curl -X DELETE \
  -H "Authorization: Bearer ${SYNC_SERVICE_API_KEY}" \
  -H "X-Anonymous-Key: ${SYNC_ANON_API_KEY}" \
  "https://firefly.example.com/api/v1/transactions/123"

# Update transaction
curl -X PUT \
  -H "Authorization: Bearer ${SYNC_SERVICE_API_KEY}" \
  -H "X-Anonymous-Key: ${SYNC_ANON_API_KEY}" \
  -H "Content-Type: application/json" \
  -d '{
    "description": "Updated description",
    "amount": "20.00"
  }' \
  "https://firefly.example.com/api/v1/transactions/123"
```

---

## Smart Suggestions Pattern

### Get Categories with User-Specific Usage

```bash
# Basic mode: all categories
curl -H "X-Anonymous-Key: ${KEY}" \
  "https://firefly.example.com/api/v1/get_categories?active=true"

# With user filter: includes usage counts
curl -H "X-Anonymous-Key: ${KEY}" \
  "https://firefly.example.com/api/v1/get_categories_usage?user_name=John"

# With type filter
curl -H "X-Anonymous-Key: ${KEY}" \
  "https://firefly.example.com/api/v1/get_categories_usage?user_name=John&type=withdrawal"
```

### Get Destination Usage (Smart Suggestions)

```bash
# Basic mode: only user's destinations
curl -H "X-Anonymous-Key: ${KEY}" \
  "https://firefly.example.com/api/v1/get_destination_name_usage?user_name=John"

# Smart mode: personal + popular community destinations
curl -H "X-Anonymous-Key: ${KEY}" \
  "https://firefly.example.com/api/v1/get_destination_name_usage?user_name=John&category_id=1"

# Or using category name
curl -H "X-Anonymous-Key: ${KEY}" \
  "https://firefly.example.com/api/v1/get_destination_name_usage?user_name=John&category_name=Food"
```

---

## Common Query Patterns

### Date Range Filtering

```bash
# Transactions for specific month
curl -H "X-Anonymous-Key: ${KEY}" \
  "https://firefly.example.com/api/v1/get_transactions?start_date=2025-11-01&end_date=2025-11-30"

# Running balance history
curl -H "X-Anonymous-Key: ${KEY}" \
  "https://firefly.example.com/api/v1/get_running_balance?start_date=2025-11-01"
```

### Type Filtering

```bash
# Only withdrawals
curl -H "X-Anonymous-Key: ${KEY}" \
  "https://firefly.example.com/api/v1/get_transactions?type=withdrawal"

# Only deposits
curl -H "X-Anonymous-Key: ${KEY}" \
  "https://firefly.example.com/api/v1/get_transactions?type=deposit"
```

### Pagination

```bash
# First page (newest)
curl -H "X-Anonymous-Key: ${KEY}" \
  "https://firefly.example.com/api/v1/transactions?page=1&limit=50"

# Second page
curl -H "X-Anonymous-Key: ${KEY}" \
  "https://firefly.example.com/api/v1/transactions?page=2&limit=50"
```

### Simple Response Format

```bash
# Raw Firefly format (default)
curl -H "X-Anonymous-Key: ${KEY}" \
  "https://firefly.example.com/api/v1/transactions?limit=5"

# Simplified format
curl -H "X-Anonymous-Key: ${KEY}" \
  "https://firefly.example.com/api/v1/transactions?limit=5&simple=true"
```

---

## Error Handling Examples

### Missing Required Parameter

```bash
# Returns 400 Bad Request
curl -H "X-Anonymous-Key: ${KEY}" \
  "https://firefly.example.com/api/v1/get_categories_usage"
# Response: {"success": false, "message": "Missing required parameter: user_name"}
```

### Insufficient Permissions

```bash
# Tier 3 trying to write - Returns 403 Forbidden
curl -X POST \
  -H "X-Anonymous-Key: ${KEY}" \
  -d '{"amount": "10"}' \
  "https://firefly.example.com/api/v1/transactions"
```

### Sync Already in Progress

```bash
# Trigger sync while another is running - Returns 409 Conflict
curl -H "X-Anonymous-Key: ${KEY}" \
  "https://firefly.example.com/api/v1/sync_transactions"
# Response: {"success": false, "message": "Sync operation already in progress"}
```

---

## Python Client Example

```python
import httpx
import os
from typing import Optional

class FireflyClient:
    def __init__(self, base_url: str, anon_key: str, tier: str = "anon"):
        self.base_url = base_url
        self.headers = {"X-Anonymous-Key": anon_key}
        self.tier = tier
        
    def set_telegram_auth(self, init_data: str):
        """Enable Tier 2 authentication"""
        self.headers["X-Telegram-Init-Data"] = init_data
        self.tier = "telegram"
    
    def set_service_auth(self, service_key: str):
        """Enable Tier 1 authentication"""
        self.headers["Authorization"] = f"Bearer {service_key}"
        self.tier = "service"
    
    async def get_transactions(
        self, 
        start_date: Optional[str] = None,
        end_date: Optional[str] = None,
        category: Optional[str] = None,
        limit: int = 50
    ):
        """Get transactions with filters"""
        params = {"limit": limit}
        if start_date:
            params["start_date"] = start_date
        if end_date:
            params["end_date"] = end_date
        if category:
            params["category"] = category
        
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{self.base_url}/api/v1/get_transactions",
                headers=self.headers,
                params=params
            )
            response.raise_for_status()
            return response.json()
    
    async def create_transaction(self, transaction: dict):
        """Create transaction (requires Tier 1 or 2)"""
        if self.tier == "anon":
            raise ValueError("Write access requires authentication")
        
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{self.base_url}/api/v1/transactions",
                headers=self.headers,
                json=transaction
            )
            response.raise_for_status()
            return response.json()
    
    async def get_categories_usage(
        self, 
        user_name: str,
        type: Optional[str] = None
    ):
        """Get category usage with smart suggestions"""
        params = {"user_name": user_name}
        if type:
            params["type"] = type
        
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{self.base_url}/api/v1/get_categories_usage",
                headers=self.headers,
                params=params
            )
            response.raise_for_status()
            return response.json()


# Usage example
async def main():
    client = FireflyClient(
        base_url="https://firefly.example.com",
        anon_key=os.getenv("SYNC_ANON_API_KEY")
    )
    
    # Read operations (Tier 3)
    transactions = await client.get_transactions(limit=10)
    print(f"Found {transactions['total']} transactions")
    
    # Enable Telegram auth for writes
    client.set_telegram_auth(os.getenv("TELEGRAM_INIT_DATA"))
    
    # Write operations (Tier 2)
    result = await client.create_transaction({
        "date": "2025-11-24",
        "amount": "12.50",
        "category": "Food",
        "account": "CASH EUR",
        "comment": "Coffee"
    })
    print(f"Created transaction: {result['data']['id']}")
```

---

## Testing Checklist

При тестировании новых endpoints:

1. **All Auth Tiers**
   - [ ] Tier 3: Read access works
   - [ ] Tier 2: Read + write works
   - [ ] Tier 1: Full access works

2. **Error Cases**
   - [ ] Missing required params return 400
   - [ ] Invalid auth returns 401/403
   - [ ] Missing resources return 404

3. **Response Format**
   - [ ] Success envelope correct
   - [ ] Error envelope correct
   - [ ] Proxy endpoints return raw (no envelope)

4. **Performance**
   - [ ] Query uses views (not tables)
   - [ ] Filters applied in SQL
   - [ ] Indexes present
