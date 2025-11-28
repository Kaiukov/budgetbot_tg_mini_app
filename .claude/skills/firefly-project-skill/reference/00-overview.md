# Overview

The Sync Service provides three categories of endpoints:

1. **Sync Endpoints** - Trigger synchronization between Firefly III API and PostgreSQL database.
2. **GET Endpoints** - Retrieve cached data from PostgreSQL without triggering sync operations.
3. **Proxy Endpoints** - Validate credentials and forward curated requests directly to the Firefly III REST API.

All endpoints return JSON responses with standardized format.

---

# Response Format

## Success Response
```json
{
  "success": true,
  "message": "Operation completed successfully",
  "timestamp": "2025-10-23T12:00:00.000Z",
  "<data_key>": [...],
  "total": 10
}
```

Sync triggers (`/sync_*`) return the same envelope but use the `total_sync` key to highlight the number of records written during the run.

## Error Response
```json
{
  "success": false,
  "message": "Error description",
  "timestamp": "2025-10-23T12:00:00.000Z",
  "<data_key>": [],
  "total": 0
}
```
