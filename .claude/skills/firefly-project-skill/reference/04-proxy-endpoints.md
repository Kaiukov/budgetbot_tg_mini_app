# Proxy Endpoints

These routes validate incoming headers and forward requests to the upstream Firefly III API. They expose curated write access to the browser while keeping high-privilege secrets on trusted services.

## 1. Create Transaction (Proxy)

Forward a transaction creation request to Firefly III with automatic username injection based on authentication tier.

**Endpoint:**

- `POST /api/v1/transactions`
- Alias: `POST /api/v1/transactions/` (trailing slash accepted)

**Headers:**

| Scenario | Headers Required | Description |
| --- | --- | --- |
| Read-only (denied) | `X-Anonymous-Key: <SYNC_ANON_API_KEY>` | Returns HTTP 403 because writes require authorization. |
| Authorized Telegram user | `X-Anonymous-Key: <SYNC_ANON_API_KEY>` + `X-Telegram-Init-Data: <initData>` | Grants write access after Telegram signature validation and `telegram_users.is_auth = true`. Username extracted from Telegram data. |
| Service automation | `Authorization: Bearer <SYNC_SERVICE_API_KEY>` + `X-Anonymous-Key: <SYNC_ANON_API_KEY>` | Full access for trusted workers. Username set to `"service_user"`. |

**Username Injection:**

The proxy automatically injects a username into transaction metadata based on the authentication tier:

- **Tier 1 (Service)**: Username is set to `"service_user"`
- **Tier 2 (Telegram Authorized)**: Username extracted from Telegram initData (`user.username` or fallback to `user.first_name`)

The username appears in:
- Transaction `tags` array: `["username"]`
- Transaction `notes`: `"... Added by username"`
- Transaction `external_id`: `"tg-{type}-{username}-{timestamp}"`

**Request Body:**

The JSON payload supports both Firefly native format and BudgetBot simplified format. The proxy transforms simplified format to Firefly-compatible structure before forwarding.

**Example Request (BudgetBot Simplified Format):**

```json
{
  "date": "2025-11-09T15:00:00Z",
  "amount": "25.50",
  "currency": "EUR",
  "category": "Testing",
  "account": "CASH EUR",
  "comment": "Test transaction"
}
```

**Response:**

Returns the raw Firefly API response exactly as-is (unwrapped):

```json
{
  "data": {
    "type": "transactions",
    "id": "1118",
    "attributes": {
      "created_at": "2025-11-09T19:31:53+02:00",
      "updated_at": "2025-11-09T19:31:53+02:00",
      "transactions": [
        {
          "transaction_journal_id": "1118",
          "type": "withdrawal",
          "date": "2025-11-09T17:00:00+02:00",
          "amount": "25.50",
          "currency_code": "EUR",
          "description": "Expense Testing from CASH EUR 25.50 EUR",
          "category_name": "Testing",
          "source_name": "CASH EUR",
          "destination_name": "Test transaction",
          "notes": "Expense Testing from CASH EUR 25.50 EUR. Comment: Test transaction Added by service_user",
          "tags": ["service_user"],
          "external_id": "tg-expense-service_user-1762709512"
        }
      ]
    },
    "links": {
      "self": "http://firefly-app:8080/api/v1/transactions/1118"
    }
  }
}
```

**Notes:**

- Response format matches Firefly API exactly (no wrapper envelope)
- `telegram_user_id` may be added to response root for tracking when using Telegram auth
- Failures return Firefly error structure with appropriate HTTP status code

---

## 2. List Transactions (Proxy)

Forward a read request to `GET /api/v1/transactions` and optionally flatten the payload for simple consumption.

**Endpoint:**

- `GET /api/v1/transactions`
- Alias: `GET /api/v1/transactions/` (trailing slash accepted)

**Query Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `limit` | integer (optional) | Maximum number of transaction groups to return. Defaults to `TRANSACTION_PROXY_DEFAULT_LIMIT` (500). Synonym: `limits`. |
| `page` | integer (optional) | Page number for pagination. Defaults to `1`. |
| `start` | `YYYY-MM-DD` (optional) | Only return transactions on or after this date. |
| `end` | `YYYY-MM-DD` (optional) | Only return transactions on or before this date. |
| `type` | string (optional) | Filter by transaction type: `withdrawal`, `deposit`, `transfer`, or `all` (default: all types). |
| `simple` | boolean (optional) | When `true`, replace the raw Firefly payload with an array of simplified transaction entries. |

> **Note:** When no pagination parameters are supplied, the proxy requests the first page (`page=1`) with `order=desc` and `sort=date` so clients receive the newest transactions first.

**Headers:**

| Scenario | Headers Required | Description |
| --- | --- | --- |
| Anonymous read | `X-Anonymous-Key: <SYNC_ANON_API_KEY>` | Grants read access to the raw Firefly response. |
| Telegram-elevated | `X-Anonymous-Key: <SYNC_ANON_API_KEY>` + `X-Telegram-Init-Data: <initData>` | Same response as anonymous; use when the caller may later escalate to writes. |
| Service automation | `Authorization: Bearer <SYNC_SERVICE_API_KEY>` + `X-Anonymous-Key: <SYNC_ANON_API_KEY>` | Full-access credentials for trusted workers. |

**Response (simple=false - default):**

Returns the raw Firefly API response exactly as-is:

```json
{
  "data": [
    {
      "type": "transactions",
      "id": "123",
      "attributes": {
        "created_at": "2025-11-02T04:23:10+02:00",
        "updated_at": "2025-11-09T07:05:28+02:00",
        "transactions": [
          {
            "transaction_journal_id": "123",
            "type": "withdrawal",
            "date": "2025-11-02T04:23:10+02:00",
            "amount": "-15.00",
            "currency_code": "USD",
            "description": "Transaction description"
          }
        ]
      },
      "links": {
        "self": "https://firefly.example.com/api/v1/transactions/123"
      }
    }
  ],
  "meta": {
    "pagination": {
      "total": 100,
      "count": 50,
      "per_page": 50,
      "current_page": 1,
      "total_pages": 2
    }
  },
  "links": {
    "self": "https://firefly.example.com/api/v1/transactions?page=1",
    "first": "https://firefly.example.com/api/v1/transactions?page=1",
    "next": "https://firefly.example.com/api/v1/transactions?page=2",
    "last": "https://firefly.example.com/api/v1/transactions?page=2"
  }
}
```

**Response (simple=true):**

Returns simplified transaction objects wrapped in a normalized envelope:

```json
{
  "success": true,
  "status": 200,
  "message": "Transactions retrieved successfully",
  "mode": "parsed",
  "data": [
    {
      "transaction_id": "123",
      "group_id": "123",
      "type": "withdrawal",
      "date": "2025-01-15",
      "description": "Weekly grocery run",
      "category": "Groceries",
      "category_name": "Groceries",
      "currency_code": "USD",
      "amount": "-15.00",
      "foreign_amount": null,
      "foreign_currency_code": null,
      "source_account": "Checking Account",
      "source_name": "Checking Account",
      "destination_name": "Supermarket",
      "notes": "Weekly shop",
      "external_id": "tg-expense-jane-123",
      "tags": ["food", "family"]
    }
  ]
}
```

Each simplified object mirrors the columns BudgetBot stores in the `firefly_transactions` table so downstream Mini App components can consume proxy data without further transformation.

#### Firefly reference example

If you want to inspect the upstream Firefly III API directly, use the same authentication header your sync service worker would provide. The example below fetches the newest transactions from Firefly without the proxy layer applying any parsing:

```bash
curl -X GET "https://firefly.neon-chuckwalla.ts.net/api/v1/transactions" \
  -H "Authorization: Bearer {{firefly_token}}" \
  -H "Content-Type: application/json"
```

**Основные параметры запроса (key query parameters):**

- **start** — начальная дата в формате `YYYY-MM-DD`
- **end** — конечная дата в формате `YYYY-MM-DD`
- **page** — номер страницы (по умолчанию `1`)
- **limit** — количество записей на странице (до `50` в стандартной установке)
- **type** — тип транзакции (`withdrawal`, `deposit`, `transfer`)

#### Полная структура ответа Firefly III

Firefly III возвращает тройку из массива данных, метаданных пагинации и ссылок для навигации. Каждая запись в `data` представляет группу транзакций, а не одиночную операцию:

```json
{
  "data": [
    {
      "type": "transactions",
      "id": "752",
      "attributes": {
        "created_at": "2025-08-07T16:21:03+00:00",
        "updated_at": "2025-08-07T16:21:03+00:00",
        "user": "1",
        "group_title": null,
        "transactions": [
          {
            "user": "1",
            "transaction_journal_id": "1523",
            "type": "withdrawal",
            "date": "2025-08-07T00:00:00+00:00",
            "order": 0,
            "currency_id": "1",
            "currency_code": "UAH",
            "currency_symbol": "₴",
            "currency_decimal_places": 2,
            "foreign_currency_id": null,
            "foreign_currency_code": null,
            "foreign_currency_symbol": null,
            "foreign_currency_decimal_places": null,
            "amount": "110.20",
            "foreign_amount": null,
            "description": "Аптека - ліки",
            "source_id": "45",
            "source_name": "PUMB UAH Violetta",
            "source_iban": null,
            "source_type": "Asset account",
            "destination_id": "128",
            "destination_name": "Аптека",
            "destination_iban": null,
            "destination_type": "Expense account",
            "budget_id": "7",
            "budget_name": "Здоров'я",
            "category_id": "14",
            "category_name": "Здоров'я 💊",
            "bill_id": null,
            "bill_name": null,
            "reconciled": false,
            "notes": null,
            "tags": [
              "user:violettakaiukova",
              "category:health"
            ],
            "internal_reference": null,
            "external_id": null,
            "external_url": null,
            "original_source": "ff3-v6.1.0|api-v2",
            "recurrence_id": null,
            "recurrence_total": 0,
            "recurrence_count": 0,
            "bunq_payment_id": null,
            "import_hash_v2": "abc123def456...",
            "sepa_cc": null,
            "sepa_ct_op": null,
            "sepa_ct_id": null,
            "sepa_db": null,
            "sepa_country": null,
            "sepa_ep": null,
            "sepa_ci": null,
            "sepa_batch_id": null,
            "interest_date": null,
            "book_date": null,
            "process_date": null,
            "due_date": null,
            "payment_date": null,
            "invoice_date": null,
            "latitude": null,
            "longitude": null,
            "zoom_level": null,
            "has_attachments": false
          }
        ]
      },
      "links": {
        "0": {
          "rel": "self",
          "uri": "/transactions/752"
        },
        "self": "https://firefly.neon-chuckwalla.ts.net/api/v1/transactions/752"
      }
    }
  ],
  "meta": {
    "pagination": {
      "total": 1250,
      "count": 50,
      "per_page": 50,
      "current_page": 1,
      "total_pages": 25,
      "links": {
        "next": "https://firefly.neon-chuckwalla.ts.net/api/v1/transactions?page=2"
      }
    }
  },
  "links": {
    "self": "https://firefly.neon-chuckwalla.ts.net/api/v1/transactions?page=1",
    "first": "https://firefly.neon-chuckwalla.ts.net/api/v1/transactions?page=1",
    "next": "https://firefly.neon-chuckwalla.ts.net/api/v1/transactions?page=2",
    "last": "https://firefly.neon-chuckwalla.ts.net/api/v1/transactions?page=25"
  }
}
```

#### Ключевые особенности структуры

- **Двойная вложенность транзакций.** Один элемент `data` может содержать несколько операций в массиве `transactions`. Переводы между счетами, например, дают пару операций внутри одной группы.
- **Основная и иностранная валюта.** Поля `currency_*` описывают базовую валюту операции, а `foreign_currency_*` появляются при мультивалютных транзакциях.
- **Категории и бюджеты.** Пары `category_id`/`category_name` и `budget_id`/`budget_name` существуют независимо, что важно для расчётов в BudgetBot.
- **Теги как метаданные.** Массив `tags` остаётся лучшим способом кодировать пользователя (`user:...`) и произвольные атрибуты для n8n.
- **Дополнительные поля object_group.** Новые версии Firefly могут добавлять `object_group_id` и `object_group_title`, поэтому клиенты должны обрабатывать эти поля, если они присутствуют.

#### Критические поля для интеграции n8n

- **Идентификаторы:** `id` на уровне группы и `transaction_journal_id` внутри операций.
- **Счета:** Пары `source_*` и `destination_*` определяют направление движения средств.
- **Категоризация:** `category_*`, `budget_*` и `tags` совместно описывают назначение транзакции.
- **Временные метки:** `date`, `created_at`, `updated_at` используются для расчётов давности и синхронизации.
- **Суммы и валюты:** `amount` всегда положительная величина, а `foreign_amount` и `foreign_currency_code` помогают с мультивалютными сценариями.

If the upstream call fails, the proxy returns the same normalized error envelope used by the POST handler.

---

## 3. Get Single Transaction (Proxy)

Retrieve a single transaction by ID from Firefly III with optional response simplification.

**Endpoint:**

- `GET /api/v1/transactions/{transaction_id}`

**Path Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `transaction_id` | string (required) | The ID of the transaction group to retrieve (e.g., `1108`) |

**Query Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `simple` | boolean (optional) | When `true`, return simplified transaction format instead of full Firefly response. Defaults to `false`. |

**Headers:**

| Scenario | Headers Required | Description |
| --- | --- | --- |
| Anonymous read | `X-Anonymous-Key: <SYNC_ANON_API_KEY>` | Grants read access to the raw Firefly response. |
| Telegram-elevated | `X-Anonymous-Key: <SYNC_ANON_API_KEY>` + `X-Telegram-Init-Data: <initData>` | Same response as anonymous; use when the caller may later escalate to writes. |
| Service automation | `Authorization: Bearer <SYNC_SERVICE_API_KEY>` + `X-Anonymous-Key: <SYNC_ANON_API_KEY>` | Full-access credentials for trusted workers. |

**Response (simple=false - default):**

Returns the raw Firefly API response exactly as-is:

```json
{
  "data": {
    "type": "transactions",
    "id": "1108",
    "attributes": {
      "created_at": "2025-11-02T04:23:10+02:00",
      "updated_at": "2025-11-09T07:05:28+02:00",
      "user": "1",
      "user_group": "1",
      "group_title": null,
      "transactions": [
        {
          "transaction_journal_id": "1108",
          "type": "withdrawal",
          "date": "2025-11-02T04:23:10+02:00",
          "amount": "1.000000000000",
          "currency_code": "USD",
          "description": "Expense from account 1 USD",
          "source_id": "146",
          "source_name": "Account",
          "destination_name": "Expense",
          "category_id": "1",
          "category_name": "Food",
          "tags": ["user"]
        }
      ]
    },
    "links": {
      "self": "https://firefly.example.com/api/v1/transactions/1108"
    }
  }
}
```

**Response (simple=true):**

Returns simplified transaction object (single object, not array) wrapped in a normalized envelope:

```json
{
  "success": true,
  "status": 200,
  "message": "Transaction retrieved successfully",
  "data": {
    "transaction_id": "1108",
    "group_id": "1108",
    "type": "withdrawal",
    "date": "2025-11-02T04:23:10+02:00",
    "description": "Expense from account 1 USD",
    "category": "Food",
    "category_name": "Food",
    "currency_code": "USD",
    "amount": "1.000000000000",
    "foreign_amount": null,
    "foreign_currency_code": null,
    "source_account": "Account",
    "source_name": "Account",
    "destination_name": "Expense",
    "notes": null,
    "external_id": "tg-expense-user-1762050190",
    "tags": ["user"]
  },
  "mode": "parsed"
}
```

**Error Handling:**

- Returns HTTP 404 if transaction ID not found
- Returns HTTP 401 for missing or invalid authentication
- Returns HTTP 403 for insufficient permissions

---

## 4. Update Transaction (Proxy)

Update a transaction by ID using GET-then-PUT pattern with field merging.

**Endpoint:**

- `PUT /api/v1/transactions/{transaction_id}`

**Path Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `transaction_id` | string (required) | The ID of the transaction group to update (e.g., `1119`) |

**Headers:**

| Scenario | Headers Required | Description |
| --- | --- | --- |
| Authorized Telegram user | `X-Anonymous-Key: <SYNC_ANON_API_KEY>` + `X-Telegram-Init-Data: <initData>` | Grants write access after Telegram validation and `is_auth = true`. Username from Telegram. |
| Service automation | `Authorization: Bearer <SYNC_SERVICE_API_KEY>` + `X-Anonymous-Key: <SYNC_ANON_API_KEY>` | Full access for trusted workers. Username set to "service_user". |

**Request Body:**

Supports both simplified format (partial fields) and Firefly native format (full transactions array).

**Simplified Format:**
```json
{
  "description": "Updated transaction description",
  "amount": "75.00",
  "category_name": "Updated Category",
  "date": "2025-11-09T18:00:00Z",
  "type": "withdrawal",
  "source_name": "CASH EUR",
  "destination_name": "Updated Expense"
}
```

**Firefly Native Format:**
```json
{
  "apply_rules": true,
  "fire_webhooks": true,
  "transactions": [
    {
      "type": "withdrawal",
      "date": "2025-11-09T18:00:00Z",
      "amount": "75.00",
      "currency_code": "EUR",
      "description": "Updated transaction",
      "source_id": "41",
      "destination_name": "Expense",
      "category_id": "28",
      "tags": ["updated"]
    }
  ]
}
```

**Response:**

Returns the raw Firefly API response exactly as-is (unwrapped):

```json
{
  "data": {
    "type": "transactions",
    "id": "1119",
    "attributes": {
      "created_at": "2025-11-09T19:34:06+02:00",
      "updated_at": "2025-11-10T01:53:18+02:00",
      "transactions": [
        {
          "transaction_journal_id": "1119",
          "type": "withdrawal",
          "date": "2025-11-09T18:00:00+02:00",
          "amount": "75.000000000000",
          "currency_code": "EUR",
          "description": "Updated transaction description",
          "source_name": "CASH EUR",
          "destination_name": "Updated Expense",
          "category_name": "Updated Category",
          "tags": ["service_user"],
          "updated_at": "2025-11-10T01:53:18+02:00"
        }
      ]
    },
    "links": {
      "self": "https://firefly.example.com/api/v1/transactions/1119"
    }
  }
}
```

**Implementation Details:**

1. **GET-then-PUT Pattern:** Fetches current transaction before updating
2. **Field Merging:** Partial updates merged with current data (no fields lost)
3. **Validation:** Firefly API validates all required fields
4. **Response Format:** Raw Firefly response (no wrapper envelope)

**Required Fields for Update:**

Either provide full Firefly format OR at least these for simplified format:
- `type` (withdrawal/deposit/transfer)
- `date` (ISO 8601)
- `amount` (string)
- `description`
- Source: `source_id` OR `source_name`
- Destination: `destination_id` OR `destination_name`

**Permissions:**

| Tier | Can Update |
|------|-----------|
| **Service** | ✅ Yes (full access) |
| **Telegram Authorized** | ✅ Yes (after validation + `is_auth=true`) |
| **Telegram Not Authorized** | ❌ No (read-only) |
| **Anonymous** | ❌ No (read-only) |

---

## 5. Delete Transaction (Proxy)

Delete a transaction by ID using authorization validation.

**Endpoint:**

- `DELETE /api/v1/transactions/{transaction_id}`

**Path Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `transaction_id` | string (required) | The ID of the transaction group to delete (e.g., `1119`) |

**Headers:**

| Scenario | Headers Required | Description |
| --- | --- | --- |
| Authorized Telegram user | `X-Anonymous-Key: <SYNC_ANON_API_KEY>` + `X-Telegram-Init-Data: <initData>` | Grants delete access after Telegram validation and `is_auth = true`. |
| Service automation | `Authorization: Bearer <SYNC_SERVICE_API_KEY>` + `X-Anonymous-Key: <SYNC_ANON_API_KEY>` | Full access for trusted workers. |

**Response:**

Returns the raw Firefly API response exactly as-is (unwrapped):

**Success (204 No Content):**
```
Status: 204
Body: (empty)
```

**Error (404 Not Found):**
```json
{
  "success": false,
  "status": 404,
  "message": "Resource not found",
  "details": {
    "message": "Resource not found",
    "exception": "NotFoundHttpException"
  }
}
```

**Implementation Details:**

1. **Direct Deletion:** Deletes transaction immediately (no GET-then-DELETE pattern)
2. **Authorization:** Only Tier 1 (Service) and Tier 2 (Telegram Authorized) can delete
3. **Response Format:** Raw Firefly response (no wrapper envelope)
4. **Idempotent:** Deleting non-existent transaction returns 404

**Permissions:**

| Tier | Can Delete |
|------|-----------|
| **Service** | ✅ Yes (full access) |
| **Telegram Authorized** | ✅ Yes (after validation + `is_auth=true`) |
| **Telegram Not Authorized** | ❌ No (read-only) |
| **Anonymous** | ❌ No (read-only) |

**Example cURL:**

Tier 1 (Service):
```bash
curl -X DELETE "{{base_url}}/api/v1/transactions/1119" \
  -H "Authorization: Bearer {{service_key}}" \
  -H "X-Anonymous-Key: {{anon_key}}" \
  -H "Accept: application/json"
```

Tier 2 (Telegram Authorized):
```bash
curl -X DELETE "{{base_url}}/api/v1/transactions/1119" \
  -H "X-Anonymous-Key: {{anon_key}}" \
  -H "X-Telegram-Init-Data: {{initData}}" \
  -H "Accept: application/json"
```
