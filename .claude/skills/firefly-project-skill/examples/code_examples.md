# Code Examples for Firefly Sync Service

## 1. Standard GET Endpoint Pattern

```python
@router.get("/api/v1/get_example")
async def get_example(
    user_name: Optional[str] = Query(None, description="Filter by user"),
    category_id: Optional[int] = Query(None, description="Filter by category"),
    active: Optional[bool] = Query(None, description="Filter by active status")
):
    """
    Retrieve example data with optional filters.
    
    Response format follows standard envelope pattern.
    """
    try:
        conn = get_db_connection()
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        
        # Build dynamic query
        query = """
            SELECT *
            FROM example_view
            WHERE 1=1
        """
        params = []
        
        # Add filters
        if user_name:
            query += " AND user_name = %s"
            params.append(user_name)
            
        if category_id is not None:
            query += " AND category_id = %s"
            params.append(category_id)
            
        if active is not None:
            query += " AND active = %s"
            params.append(active)
        
        # Add ordering
        query += " ORDER BY usage_count DESC, name ASC"
        
        cursor.execute(query, params)
        results = cursor.fetchall()
        
        return {
            "success": True,
            "message": "Data retrieved successfully",
            "timestamp": datetime.utcnow().isoformat(),
            "get_example": results,
            "total": len(results)
        }
        
    except Exception as e:
        logger.error(f"Error in get_example: {str(e)}")
        return {
            "success": False,
            "message": str(e),
            "timestamp": datetime.utcnow().isoformat(),
            "get_example": [],
            "total": 0
        }
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()
```

## 2. Sync Endpoint Pattern

```python
@router.get("/api/v1/sync_example")
async def sync_example():
    """
    Trigger synchronization from Firefly III to PostgreSQL.
    
    Returns total_sync count instead of total.
    """
    try:
        # Fetch from Firefly III
        firefly_response = await fetch_from_firefly_api()
        data = firefly_response.get("data", [])
        
        # Transform and insert to PostgreSQL
        conn = get_db_connection()
        cursor = conn.cursor()
        
        insert_count = 0
        for item in data:
            transformed = transform_data(item)
            cursor.execute("""
                INSERT INTO example_table (...)
                VALUES (...)
                ON CONFLICT (id) DO UPDATE SET
                    field1 = EXCLUDED.field1,
                    updated_at = NOW()
            """, transformed)
            insert_count += 1
        
        conn.commit()
        
        return {
            "success": True,
            "message": "Sync completed successfully",
            "timestamp": datetime.utcnow().isoformat(),
            "sync_example": data,
            "total_sync": insert_count
        }
        
    except Exception as e:
        logger.error(f"Sync failed: {str(e)}")
        if conn:
            conn.rollback()
        return {
            "success": False,
            "message": str(e),
            "sync_example": [],
            "total_sync": 0
        }
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()
```

## 3. Authentication Middleware Check

```python
# В любом endpoint - проверка auth tier
@router.post("/api/v1/protected_action")
async def protected_action(request: Request):
    """
    Action that requires specific auth tier.
    """
    auth_tier = request.state.auth_tier
    
    if auth_tier == "service":
        # Full access - Tier 1
        pass
    elif auth_tier == "anon_authorized":
        # Telegram authorized - Tier 2
        telegram_data = request.state.telegram_user_data
        username = telegram_data.get("username") or telegram_data.get("first_name")
    elif auth_tier == "anon":
        # Read-only - Tier 3
        raise HTTPException(
            status_code=403,
            detail="Write access requires authentication"
        )
    
    # Perform action...
```

## 4. Usage View Query Pattern

```python
@router.get("/api/v1/get_usage_example")
async def get_usage_example(
    user_name: str = Query(..., description="Required: user name"),
    category_id: Optional[int] = Query(None, description="Optional: category filter")
):
    """
    Usage endpoint with smart suggestions (personal + community).
    
    When user_name + category_id provided: returns ALL items with usage stats.
    """
    try:
        conn = get_db_connection()
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        
        # Smart suggestions mode: user_name + category_id
        if category_id is not None:
            query = """
                SELECT 
                    user_name,
                    item_id,
                    item_name,
                    category_id,
                    category_name,
                    usage_count,
                    global_usage,
                    CASE WHEN usage_count > 0 THEN true ELSE false END as user_has_used
                FROM usage_view
                WHERE user_name = %s AND category_id = %s
                ORDER BY 
                    (usage_count > 0) DESC,  -- Used items first
                    usage_count DESC,         -- Then by personal usage
                    global_usage DESC         -- Then by community usage
            """
            params = [user_name, category_id]
        else:
            # Basic mode: only user's used items
            query = """
                SELECT *
                FROM usage_view
                WHERE user_name = %s AND usage_count > 0
                ORDER BY usage_count DESC
            """
            params = [user_name]
        
        cursor.execute(query, params)
        results = cursor.fetchall()
        
        return {
            "success": True,
            "message": "Usage data retrieved successfully",
            "timestamp": datetime.utcnow().isoformat(),
            "get_usage_example": results,
            "total_sync": len(results)  # Note: usage endpoints use total_sync
        }
        
    except Exception as e:
        logger.error(f"Error: {str(e)}")
        return {
            "success": False,
            "message": str(e),
            "get_usage_example": [],
            "total_sync": 0
        }
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()
```

## 5. Proxy Endpoint with Username Injection

```python
@router.post("/api/v1/transactions")
async def create_transaction_proxy(request: Request, body: dict):
    """
    Proxy POST to Firefly III with automatic username injection.
    """
    # Extract username based on auth tier
    auth_tier = request.state.auth_tier
    
    if auth_tier == "service":
        username = "service_user"
    elif auth_tier == "anon_authorized":
        telegram_data = request.state.telegram_user_data
        username = telegram_data.get("username") or telegram_data.get("first_name", "unknown")
    else:
        raise HTTPException(403, "Write access denied")
    
    # Transform body (support both simplified and Firefly format)
    if "transactions" not in body:
        # Simplified format → transform to Firefly format
        body = transform_simplified_to_firefly(body)
    
    # Inject username into transaction
    for transaction in body["transactions"]:
        # Add to tags
        if "tags" not in transaction:
            transaction["tags"] = []
        transaction["tags"].append(username)
        
        # Add to notes
        notes = transaction.get("notes", "")
        transaction["notes"] = f"{notes} Added by {username}".strip()
        
        # Generate external_id for deduplication
        timestamp = int(time.time())
        tx_type = transaction.get("type", "expense")
        transaction["external_id"] = f"tg-{tx_type}-{username}-{timestamp}"
    
    # Forward to Firefly III
    async with httpx.AsyncClient() as client:
        response = await client.post(
            f"{FIREFLY_API_URL}/transactions",
            headers={"Authorization": f"Bearer {FIREFLY_API_TOKEN}"},
            json=body
        )
    
    # Return raw Firefly response (no wrapper)
    return response.json()
```

## 6. Database View Creation Pattern

```sql
-- Example: Create usage view with 90-day rolling window
CREATE OR REPLACE VIEW items_usage_view AS
WITH user_item_usage AS (
    -- Personal usage in last 90 days
    SELECT 
        t.user_name,
        t.item_id,
        i.item_name,
        t.category_id,
        c.category_name,
        COUNT(*) as usage_count,
        MIN(t.date) as first_used_at,
        MAX(t.date) as last_used_at
    FROM transactions t
    LEFT JOIN items i ON t.item_id = i.id
    LEFT JOIN categories c ON t.category_id = c.category_id
    WHERE t.date >= CURRENT_DATE - INTERVAL '90 days'
    GROUP BY t.user_name, t.item_id, i.item_name, t.category_id, c.category_name
),
global_usage AS (
    -- Community usage (all users)
    SELECT 
        item_id,
        category_id,
        COUNT(*) as global_usage
    FROM transactions
    WHERE date >= CURRENT_DATE - INTERVAL '90 days'
    GROUP BY item_id, category_id
)
SELECT 
    u.user_name,
    u.item_id,
    u.item_name,
    u.category_id,
    u.category_name,
    COALESCE(u.usage_count, 0) as usage_count,
    COALESCE(g.global_usage, 0) as global_usage,
    CASE WHEN u.usage_count > 0 THEN true ELSE false END as user_has_used,
    u.first_used_at,
    u.last_used_at
FROM user_item_usage u
LEFT JOIN global_usage g 
    ON u.item_id = g.item_id 
    AND u.category_id = g.category_id;
```

## 7. Error Handling Pattern

```python
async def endpoint_with_proper_error_handling():
    """
    Proper error handling with specific error messages.
    """
    conn = None
    cursor = None
    
    try:
        # Validate input
        if not user_name:
            return {
                "success": False,
                "message": "Missing required parameter: user_name",
                "timestamp": datetime.utcnow().isoformat(),
                "data": [],
                "total": 0
            }
        
        # Database operations
        conn = get_db_connection()
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        
        cursor.execute(query, params)
        results = cursor.fetchall()
        
        if not results:
            return {
                "success": True,
                "message": "No data found matching criteria",
                "timestamp": datetime.utcnow().isoformat(),
                "data": [],
                "total": 0
            }
        
        return {
            "success": True,
            "message": "Data retrieved successfully",
            "timestamp": datetime.utcnow().isoformat(),
            "data": results,
            "total": len(results)
        }
        
    except psycopg2.Error as db_error:
        logger.error(f"Database error: {str(db_error)}")
        return {
            "success": False,
            "message": f"Database error: {str(db_error)}",
            "timestamp": datetime.utcnow().isoformat(),
            "data": [],
            "total": 0
        }
    except Exception as e:
        logger.error(f"Unexpected error: {str(e)}")
        return {
            "success": False,
            "message": f"Internal server error: {str(e)}",
            "timestamp": datetime.utcnow().isoformat(),
            "data": [],
            "total": 0
        }
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()
```

## 8. Testing with curl

```bash
# Tier 3: Anonymous read
curl -X GET \
  -H "X-Anonymous-Key: ${SYNC_ANON_API_KEY}" \
  "http://localhost/api/v1/get_transactions?limit=10"

# Tier 2: Telegram authorized write
curl -X POST \
  -H "X-Anonymous-Key: ${SYNC_ANON_API_KEY}" \
  -H "X-Telegram-Init-Data: ${TELEGRAM_INIT_DATA}" \
  -H "Content-Type: application/json" \
  -d '{
    "transactions": [{
      "type": "withdrawal",
      "date": "2025-11-23",
      "amount": "15.50",
      "currency_code": "EUR",
      "description": "Coffee",
      "source_name": "Checking Account",
      "destination_name": "Starbucks",
      "category_name": "Food"
    }]
  }' \
  "http://localhost/api/v1/transactions"

# Tier 1: Service delete
curl -X DELETE \
  -H "Authorization: Bearer ${SYNC_SERVICE_API_KEY}" \
  -H "X-Anonymous-Key: ${SYNC_ANON_API_KEY}" \
  "http://localhost/api/v1/transactions/123"

# Health check (no auth needed)
curl http://localhost:8000/health
```

## Key Patterns Summary

1. **Standard Envelope**: Always return `success`, `message`, `timestamp`, `{data_key}`, `total`
2. **Sync Endpoints**: Use `total_sync` instead of `total`
3. **Proxy Endpoints**: Return raw Firefly response (no wrapper)
4. **Usage Endpoints**: Include `usage_count`, `global_usage`, `user_has_used`
5. **Error Handling**: Always clean up connections in finally block
6. **Auth Check**: Use `request.state.auth_tier` to determine access level
7. **Username Injection**: Extract from Telegram data or use "service_user"
8. **Views**: Always query from views for usage data (real-time, no sync needed)
