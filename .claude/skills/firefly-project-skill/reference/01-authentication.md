# Authentication

The FastAPI middleware enforces a **3-tier authentication system** using API keys and optional Telegram validation.

## Authentication Tiers

### **TIER 1: Service Role** (Full Access)
**Headers Required:**
```http
Authorization: Bearer <SYNC_SERVICE_API_KEY>
X-Anonymous-Key: <SYNC_ANON_API_KEY>
```

**Access:** Full read/write access to all endpoints (GET/POST/PUT/DELETE)
**Use Case:** Trusted backend services, automation scripts, administrative tasks

---

### **TIER 2: Anonymous Authorized** (Read + Write to Allowed Endpoints)
**Headers Required:**
```http
X-Anonymous-Key: <SYNC_ANON_API_KEY>
X-Telegram-Init-Data: <validated_telegram_initData>
```

**Access:**
- All READ operations (GET/HEAD)
- WRITE operations to allowed endpoints (transactions, sync triggers)
- Public POST endpoints (`/tgUser`)

**Authentication Flow:**
1. Telegram initData validated via HMAC-SHA256 signature
2. User checked in PostgreSQL `telegram_users_cache` table
3. User must have `is_auth = true` flag set
4. If validation fails, falls back to Tier 3

**Use Case:** Telegram Mini App users with write permissions

---

### **TIER 3: Anonymous Read-Only**
**Headers Required:**
```http
X-Anonymous-Key: <SYNC_ANON_API_KEY>
```

**Access:**
- All READ operations (GET/HEAD)
- Public POST endpoints (`/tgUser`)
- **NO** write operations

**Use Case:** Public clients, read-only applications, unauthenticated Telegram users

---

## Access Matrix

| Tier | Headers | Capabilities | Endpoints |
| --- | --- | --- | --- |
| **TIER 1** (service) | `Authorization: Bearer <service_key>`<br>`X-Anonymous-Key: <anon_key>` | Full access (all methods) | All registered routes |
| **TIER 2** (anon_authorized) | `X-Anonymous-Key: <anon_key>`<br>`X-Telegram-Init-Data: <initData>` | Read + curated writes | GET/HEAD all + POST/PUT/DELETE to allowed endpoints |
| **TIER 3** (anon) | `X-Anonymous-Key: <anon_key>` | Read-only | GET/HEAD all + POST `/tgUser` |

## Response Codes

- `200 OK` - Request successful
- `401 Unauthorized` - Missing or invalid authentication credentials
- `403 Forbidden` - Valid credentials but insufficient permissions for operation
- `404 Not Found` - Endpoint does not exist

## Endpoint Access Control

The concrete allowlists live in [`sync/config.py`](./config.py):

- `config.READ_ONLY_ENDPOINTS` - GET/HEAD accessible by all tiers
- `config.ANON_ALLOWED_WRITE_ENDPOINTS` - Write endpoints for Tier 2 (includes `/sync_*` and `/api/v1/transactions`)
- `config.ANON_ALLOWED_PUBLIC_POST_ENDPOINTS` - Public POST routes like `/tgUser`

## HTTP Method Requirements

| Method | Tier Access | Required Headers | Notes |
| --- | --- | --- | --- |
| `GET`, `HEAD` | All tiers | **Tier 1:** `Authorization` + `X-Anonymous-Key`<br>**Tier 2:** `X-Anonymous-Key` + `X-Telegram-Init-Data`<br>**Tier 3:** `X-Anonymous-Key` | All read-only endpoints accessible by all tiers |
| `POST` (public) | All tiers | **Tier 1:** `Authorization` + `X-Anonymous-Key`<br>**Tier 2/3:** `X-Anonymous-Key` | Public endpoints like `/tgUser` |
| `POST` (write) | Tier 1, 2 only | **Tier 1:** `Authorization` + `X-Anonymous-Key`<br>**Tier 2:** `X-Anonymous-Key` + `X-Telegram-Init-Data` | Endpoints: `/api/v1/transactions`, `/sync_*` |
| `PUT`, `DELETE` | Tier 1 only | `Authorization` + `X-Anonymous-Key` | Service role required for destructive operations |

**CORS Note:** Browsers performing CORS preflight requests must include custom headers (`X-Anonymous-Key`, `X-Telegram-Init-Data`) in `Access-Control-Request-Headers`.

## Frontend Cheat Sheet

Quick reference for client integrations with the 3-tier authentication system.

### Tier Summary

| Tier | Headers | Capabilities |
| --- | --- | --- |
| **TIER 3** (anon) | `X-Anonymous-Key: ${SYNC_ANON_API_KEY}` | Read-only access (`GET`/`HEAD`) + public POST (`/tgUser`) |
| **TIER 2** (anon_authorized) | `X-Anonymous-Key: ${SYNC_ANON_API_KEY}` + `X-Telegram-Init-Data: <signed payload>` | Read + write to allowed endpoints (`/api/v1/transactions`, `/sync_*`) |
| **TIER 1** (service) | `Authorization: Bearer ${SYNC_SERVICE_API_KEY}` + `X-Anonymous-Key: ${SYNC_ANON_API_KEY}` | Full access (all methods, all endpoints) |

**Note:** Tier 1 `Authorization` header accepts `Bearer <token>` or raw token format.

### Making Requests

- **GET / HEAD** (All Tiers)
  - **Tier 3:** Only `X-Anonymous-Key` header required
  - **Tier 2:** Add `X-Telegram-Init-Data` for authenticated user context
  - **Tier 1:** Use `Authorization` + `X-Anonymous-Key` for service access

    ```bash
    # Tier 3 example
    curl \
      -H "X-Anonymous-Key: ${SYNC_ANON_API_KEY}" \
      "https://firefly.example.com/api/v1/get_transactions?limit=50"
    ```

- **POST** (Public)
  - `/api/v1/tgUser` accessible by all tiers
  - Only requires `X-Anonymous-Key` + `Content-Type: application/json`

    ```bash
    curl -X POST \
      -H "X-Anonymous-Key: ${SYNC_ANON_API_KEY}" \
      -H "Content-Type: application/json" \
      -d '{"initData":"query_id=..."}' \
      "https://firefly.example.com/api/v1/tgUser"
    ```

- **POST** (Write Endpoints)
  - Requires **Tier 2** or **Tier 1**
  - **Tier 2:** `X-Anonymous-Key` + `X-Telegram-Init-Data`
  - **Tier 1:** `Authorization` + `X-Anonymous-Key`

    ```bash
    # Tier 2 example
    curl -X POST \
      -H "X-Anonymous-Key: ${SYNC_ANON_API_KEY}" \
      -H "X-Telegram-Init-Data: ${TELEGRAM_INIT_DATA}" \
      -H "Content-Type: application/json" \
      -d '{"transactions":[{"type":"withdrawal","amount":"12.34","date":"2025-11-02"}]}' \
      "https://firefly.example.com/api/v1/transactions"
    ```

- **PUT / DELETE** (Tier 1 Only)
  - Service role required
  - Must include both `Authorization` + `X-Anonymous-Key`

    ```bash
    curl -X DELETE \
      -H "Authorization: Bearer ${SYNC_SERVICE_API_KEY}" \
      -H "X-Anonymous-Key: ${SYNC_ANON_API_KEY}" \
      "https://firefly.example.com/api/v1/transactions/12345"
    ```

- **Browser Clients**
  - CORS preflights must list `X-Anonymous-Key` and `X-Telegram-Init-Data` in `Access-Control-Request-Headers`
  - Use Tier 3 for read-only operations, Tier 2 for Telegram Mini Apps
  - **Never** expose Tier 1 credentials in browser applications
