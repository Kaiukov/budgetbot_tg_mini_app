# HTTP Request Inventory

This document catalogs every location in the project that initiates outbound HTTP requests, grouped by service or utility. Each section describes the HTTP method, endpoint, authentication details, payload, error handling, and the main call sites.

## Firefly API Client (`src/services/firefly/firefly.ts`)

### `makeRequest<T>(endpoint)` – GET
- **Endpoint:** `${baseUrl}${endpoint}`; used with `/api/v1/about` and `/api/v1/user`.
- **Method:** `GET` with `Authorization: Bearer <token>`, `Accept: application/json`, `Content-Type: application/json` headers.
- **Authentication:** Requires Firefly API token from `VITE_FIREFLY_TOKEN`; throws if missing.
- **Usage:** Powers `checkConnection()` (about endpoint) and `getCurrentUser()` (user endpoint).【F:src/services/firefly/firefly.ts†L43-L122】【F:src/services/firefly/firefly.ts†L203-L239】

### `postRequest(endpoint, body)` – POST
- **Endpoint:** `${baseUrl}${endpoint}`; invoked primarily with `/api/v1/transactions`.
- **Method:** `POST` with JSON body and the same authorization headers as above.
- **Error handling:** Returns `{ success, data?, error? }`; captures network errors and non-OK statuses.
- **Usage:** Transaction workflows (`addTransaction`, `handleExpenseTransaction`, `handleIncomeTransaction`, `handleTransferTransaction`, fee helpers) submit transactions through this helper.【F:src/services/firefly/firefly.ts†L124-L166】【F:src/services/firefly/transactions.ts†L120-L210】【F:src/services/firefly/transactions.ts†L214-L358】【F:src/services/firefly/transactions.ts†L462-L534】

### `putRequest(endpoint, body)` – PUT
- **Endpoint:** `${baseUrl}${endpoint}` (Firefly API resources).
- **Method:** `PUT` mirroring the POST helper (JSON payload + bearer token).
- **Status:** Currently available for updating Firefly resources; not yet consumed elsewhere in the codebase.
- **Error handling:** Same pattern as `postRequest`, returning a structured success flag and payload/error info.【F:src/services/firefly/firefly.ts†L168-L210】

### `deleteRequest(endpoint)` – DELETE
- **Endpoint:** `${baseUrl}${endpoint}`.
- **Method:** `DELETE` with bearer authorization headers.
- **Status:** Prepared for removing Firefly records; presently no callers.
- **Error handling:** Returns `{ success, error? }` reflecting non-OK responses or thrown errors.【F:src/services/firefly/firefly.ts†L212-L236】

### `testConnection(url, token)` – GET (Ad-hoc)
- **Endpoint:** `${url}/api/v1/about` (custom base URL supplied at runtime).
- **Method:** `GET` using the provided token for authentication.
- **Usage:** Allows validating arbitrary Firefly API credentials (e.g., user-supplied settings).【F:src/services/firefly/firefly.ts†L241-L310】

## Firefly Transaction Module (`src/services/firefly/transactions.ts`)

All transaction handlers rely on `fireflyService.postRequest` to call `/api/v1/transactions`:
- **Expense Transactions:** Submits withdrawals; optionally converts currency through the Sync API before posting.【F:src/services/firefly/transactions.ts†L120-L210】
- **Income Transactions:** Posts deposit payloads and converts currency when needed.【F:src/services/firefly/transactions.ts†L214-L358】
- **Transfer Transactions & Fees:** Creates transfers plus optional entry/exit fee withdrawals, each posting to the same endpoint.【F:src/services/firefly/transactions.ts†L360-L534】
- **Verification:** `verifyTransactionExists` currently stubs out a read-back check; no extra HTTP call yet.

## Sync API Client (`src/services/sync.ts`)

### `makeRequest<T>(endpoint, options)` – POST (default) / GET
- **Endpoint:** `${baseUrl}${endpoint}` where `baseUrl` depends on environment (proxy vs. production URL).
- **Method:** Defaults to `POST`; overrides to `GET` when `options.method === 'GET'`.
- **Headers:** `Authorization: Bearer <Sync API key>`, `Accept: application/json`, `Content-Type: application/json`.
- **Payload:** For POST, merges `{ initData }` (Telegram auth) with optional `options.body`.
- **Error handling:** Logs status details, throws on non-OK responses after capturing response text.
- **Usage:** Shared by the data-fetching helpers below.【F:src/services/sync.ts†L232-L336】

### `getAccountsUsage(userName?)` – GET `/api/sync/get_accounts_usage`
- **Parameters:** Optional `user_name` query parameter filters results server-side.
- **Post-processing:** Applies caching and client-side sorting before returning.
- **Consumers:** `BudgetMiniApp` account picker and various hooks fetch accounts through this method.【F:src/services/sync.ts†L338-L420】【F:src/BudgetMiniApp.tsx†L217-L316】

### `getCategoriesUsage(userName?)` – GET `/api/sync/get_categories_usage`
- **Parameters:** Optional `user_name` query parameter for personalized ordering.
- **Post-processing:** Similar caching/sorting pipeline to accounts.
- **Consumers:** Category selection screens via `BudgetMiniApp` logic.【F:src/services/sync.ts†L422-L518】【F:src/BudgetMiniApp.tsx†L317-L403】

### `getDestinationNameUsage()` – GET `/api/sync/get_destination_name_usage`
- **Behavior:** Retrieves the full destination dataset (no filtering) for client-side suggestion logic.
- **Consumers:** `CommentScreen` performs local filtering and ranking of suggestions.【F:src/services/sync.ts†L520-L574】【F:src/components/CommentScreen.tsx†L1-L118】

### `getTelegramUser()` – POST `/api/sync/tgUser`
- **Payload:** `{ initData }` supplied from Telegram WebApp context.
- **Usage:** Supplies avatar/bio metadata for the UI; gracefully handles missing configuration by returning a failure payload.【F:src/services/sync.ts†L576-L626】

### `getExchangeRate(from, to, amount)` – GET `/api/sync/exchange_rate`
- **Parameters:** Query string `from`, `to`, and `amount`; response cached for one hour.
- **Consumers:** Amount entry screens (`AmountScreen`, `TransferAmountScreen`) and transaction currency conversion helpers leverage this method.【F:src/services/sync.ts†L628-L708】【F:src/components/AmountScreen.tsx†L1-L80】【F:src/components/TransferAmountScreen.tsx†L1-L82】【F:src/services/firefly/transactions.ts†L536-L588】

### `checkConnection()` – GET (via `getAccountsUsage`)
- **Behavior:** Calls `getAccountsUsage()` to verify Sync API availability, surfacing success/error messages to the diagnostics UI.【F:src/services/sync.ts†L710-L754】【F:src/BudgetMiniApp.tsx†L404-L487】

## Telegram User Fetch Utilities

### `src/utils/fetchUserPhoto.ts` – POST `/api/sync/tgUser`
- **Endpoint:** `${BASE_URL}/api/sync/tgUser`, where `BASE_URL` falls back to `http://localhost` if `VITE_BASE_URL` is unset.
- **Payload:** `{ initData }` using the Telegram init data from `telegramService`.
- **Headers:** Includes Sync API key for authorization.
- **Usage:** Retrieves photo/bio details specifically for avatar display; logs and returns `null` on errors.【F:src/utils/fetchUserPhoto.ts†L1-L52】

### `src/utils/fetchUserData.ts` – POST `/api/sync/tgUser`
- **Endpoint:** `${baseUrl}/api/sync/tgUser`, where `baseUrl` mirrors the Sync service environment detection.
- **Payload:** `{ initData, userId? }` to fetch the complete Telegram user profile.
- **Error handling:** Throws on non-OK responses with detailed logging of status and body text.
- **Consumers:** `useTelegramUser` hook consolidates Telegram + backend metadata for the UI.【F:src/utils/fetchUserData.ts†L1-L99】【F:src/hooks/useTelegramUser.ts†L1-L100】

## Summary Table

| Module / File | Function | Method(s) | Endpoint(s) |
| ------------- | -------- | --------- | ----------- |
| `firefly/firefly.ts` | `makeRequest` | GET | `/api/v1/about`, `/api/v1/user` |
| `firefly/firefly.ts` | `postRequest` | POST | `/api/v1/transactions` (and other Firefly endpoints as needed) |
| `firefly/firefly.ts` | `putRequest` | PUT | Firefly resources (no current callers) |
| `firefly/firefly.ts` | `deleteRequest` | DELETE | Firefly resources (no current callers) |
| `firefly/firefly.ts` | `testConnection` | GET | `${url}/api/v1/about` |
| `firefly/transactions.ts` | Transaction handlers | POST | `/api/v1/transactions` |
| `services/sync.ts` | `makeRequest` | POST/GET | `/api/sync/*` (shared helper) |
| `services/sync.ts` | `getAccountsUsage` | GET | `/api/sync/get_accounts_usage` |
| `services/sync.ts` | `getCategoriesUsage` | GET | `/api/sync/get_categories_usage` |
| `services/sync.ts` | `getDestinationNameUsage` | GET | `/api/sync/get_destination_name_usage` |
| `services/sync.ts` | `getTelegramUser` | POST | `/api/sync/tgUser` |
| `services/sync.ts` | `getExchangeRate` | GET | `/api/sync/exchange_rate` |
| `utils/fetchUserPhoto.ts` | `fetchUserData` | POST | `/api/sync/tgUser` |
| `utils/fetchUserData.ts` | `fetchUserData` | POST | `/api/sync/tgUser` |

> **Note:** No code currently issues HTTP `OPTIONS` requests; preflight handling is assumed to be managed by the browser automatically when required.

