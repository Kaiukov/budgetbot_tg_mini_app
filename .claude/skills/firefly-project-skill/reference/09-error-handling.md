# Error Handling

## HTTP Status Codes

- `200 OK` - Request successful
- `400 Bad Request` - Invalid parameters
- `401 Unauthorized` - Authentication failed (Telegram endpoints)
- `404 Not Found` - Resource not found
- `409 Conflict` - Sync operation already in progress
- `500 Internal Server Error` - Server error

## Error Response Format

```json
{
  "success": false,
  "message": "Detailed error description",
  "timestamp": "2025-10-23T12:00:00.000Z",
  "<data_key>": [],
  "total": 0
}
```

## Common Error Scenarios

### 1. Sync Already in Progress (409)
```json
{
  "success": false,
  "message": "Sync operation already in progress",
  "timestamp": "2025-10-23T12:00:00.000Z",
  "sync_transactions": [],
  "total_sync": 0
}
```

### 2. Invalid Parameters (400)
```json
{
  "success": false,
  "message": "Invalid amount parameter - must be a positive number",
  "timestamp": "2025-10-23T12:00:00.000Z"
}
```

### 3. Database Error (500)
```json
{
  "success": false,
  "message": "Database connection failed",
  "timestamp": "2025-10-23T12:00:00.000Z",
  "get_transactions": [],
  "total": 0
}
```
