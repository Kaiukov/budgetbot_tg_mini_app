# firefly
Services for GET|POST|PUT|DELETE calls to Firefly III API

**[firefly.ts](firefly.ts)**: Core service implementation with GET, POST, PUT, DELETE request methods, connection checking, and API token management
**[transactions.ts](transactions.ts)**: Transaction handling functions for adding expense, income, and transfer transactions with verification
**[types.ts](types.ts)**: TypeScript interfaces and types for transaction data, payloads, and API responses
**[utils.ts](utils.ts)**: Utility functions for date parsing, amount formatting, external ID generation, and transaction processing
**[index.ts](index.ts)**: Export hub that centralizes all Firefly III service exports for clean imports