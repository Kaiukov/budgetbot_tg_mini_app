# Example Requests

The following `curl` snippets demonstrate each authentication tier. Replace placeholder tokens with actual credentials.

## TIER 3: Anonymous Read-Only

```bash
# Read transactions (GET request)
curl \
  -H "X-Anonymous-Key: $SYNC_ANON_API_KEY" \
  "https://firefly.example.com/api/v1/get_transactions?limit=25"

# Get accounts usage
curl \
  -H "X-Anonymous-Key: $SYNC_ANON_API_KEY" \
  "https://firefly.example.com/api/v1/get_accounts_usage?user_name=John"
```

## TIER 2: Anonymous Authorized (Telegram User)

```bash
# Create transaction (POST request with Telegram auth)
curl \
  -X POST \
  -H "X-Anonymous-Key: $SYNC_ANON_API_KEY" \
  -H "X-Telegram-Init-Data: $TELEGRAM_INIT_DATA" \
  -H "Content-Type: application/json" \
  -d '{
        "transactions": [
          {
            "type": "withdrawal",
            "date": "2025-11-02",
            "amount": "12.34",
            "currency_code": "EUR",
            "description": "Coffee",
            "source_name": "Checking Account",
            "destination_name": "Starbucks"
          }
        ]
      }' \
  "https://firefly.example.com/api/v1/transactions"

# Trigger transaction sync
curl \
  -H "X-Anonymous-Key: $SYNC_ANON_API_KEY" \
  -H "X-Telegram-Init-Data: $TELEGRAM_INIT_DATA" \
  "https://firefly.example.com/api/v1/sync_transactions"
```

## TIER 1: Service Role (Full Access)

```bash
# Delete transaction (DELETE request)
curl \
  -X DELETE \
  -H "Authorization: Bearer $SYNC_SERVICE_API_KEY" \
  -H "X-Anonymous-Key: $SYNC_ANON_API_KEY" \
  "https://firefly.example.com/api/v1/transactions/123"

# Update transaction (PUT request)
curl \
  -X PUT \
  -H "Authorization: Bearer $SYNC_SERVICE_API_KEY" \
  -H "X-Anonymous-Key: $SYNC_ANON_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
        "transactions": [
          {
            "type": "withdrawal",
            "amount": "15.00",
            "description": "Updated coffee expense"
          }
        ]
      }' \
  "https://firefly.example.com/api/v1/transactions/123"
```
