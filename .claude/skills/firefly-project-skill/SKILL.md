# Firefly Project Skill

This skill provides comprehensive documentation and tools for interacting with the Firefly III Sync Service.

## Documentation Index

### Core Concepts
- [Overview](reference/00-overview.md#overview)
- [Response Format](reference/00-overview.md#response-format)
- [Authentication](reference/01-authentication.md)
- [Architecture](reference/08-architecture.md)
- [Error Handling](reference/09-error-handling.md)

### Endpoints

#### Sync (Trigger Synchronization)
- [Sync Transactions](reference/02-sync-endpoints.md#1-sync-transactions)
- [Sync Exchange Rate](reference/02-sync-endpoints.md#2-sync-exchange-rate)
- [Sync Budget](reference/02-sync-endpoints.md#3-sync-budget)
- [Sync Accounts](reference/02-sync-endpoints.md#4-sync-accounts)
- [Sync Categories](reference/02-sync-endpoints.md#5-sync-categories)

#### GET (Read-Only Data)
- [Get Transactions](reference/03-get-endpoints.md#1-get-transactions)
- [Get Budget](reference/03-get-endpoints.md#2-get-budget)
- [Get Accounts](reference/03-get-endpoints.md#3-get-accounts)
- [Get Categories](reference/03-get-endpoints.md#4-get-categories)
- [Get Accounts Usage](reference/03-get-endpoints.md#5-get-accounts-usage)
- [Get Categories Usage](reference/03-get-endpoints.md#6-get-categories-usage)
- [Get Destination Name Usage](reference/03-get-endpoints.md#7-get-destination-name-usage)
- [Get Source Name Usage](reference/03-get-endpoints.md#8-get-source-name-usage)
- [Get Running Balance](reference/03-get-endpoints.md#9-get-running-balance)

#### Proxy (Write Access)
- [Create Transaction](reference/04-proxy-endpoints.md#1-create-transaction-proxy)
- [List Transactions](reference/04-proxy-endpoints.md#2-list-transactions-proxy)
- [Get Single Transaction](reference/04-proxy-endpoints.md#3-get-single-transaction-proxy)
- [Update Transaction](reference/04-proxy-endpoints.md#4-update-transaction-proxy)
- [Delete Transaction](reference/04-proxy-endpoints.md#5-delete-transaction-proxy)

#### Utility
- [Exchange Rate Conversion](reference/03-get-endpoints.md#1-exchange-rate-conversion)
- [Telegram User Auth](reference/03-get-endpoints.md#2-telegram-user-authentication)
- [Sync Status](reference/03-get-endpoints.md#3-sync-status)

### Operations & Reference
- [Operations & Health](reference/07-operations-config.md#operations--health)
- [Configuration](reference/07-operations-config.md#configuration)
- [Rate Limiting](reference/07-operations-config.md#rate-limiting)
- [Caching Strategy](reference/07-operations-config.md#caching-strategy)
- [Database Schema](reference/05-database-views.md)
- [Example Requests](reference/06-examples.md)
- [Version History](reference/10-versioning.md)

## Quick Start

### Authentication
Most endpoints require an API key. See [Authentication](reference/01-authentication.md) for details on headers:
- `X-Anonymous-Key`: Required for all requests.
- `Authorization`: Required for service-level access.
- `X-Telegram-Init-Data`: Required for user-level write access.

### Common Tasks

**Get Transactions:**
```http
GET /api/v1/get_transactions?limit=10
```

**Get Account Usage:**
```http
GET /api/v1/get_accounts_usage?user_name=John
```

**Create Transaction (Proxy):**
```http
POST /api/v1/transactions
```
