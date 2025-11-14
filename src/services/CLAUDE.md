# Services

This directory contains services for interacting with external APIs and the Telegram Mini App interface.

**[firefly/](firefly/)**: Contains all services related to interacting with the Firefly III API. This includes creating and fetching transactions, as well as type definitions and utility functions. See the `firefly/CLAUDE.md` for more details.

**[sync.ts](sync.ts)**: Implements the `SyncService` for communicating with the custom backend Sync API. This service is responsible for fetching user-specific data like account and category usage, handling currency conversions, and retrieving Telegram user data from the backend.

**[telegram.ts](telegram.ts)**: Implements the `TelegramService`, which is a wrapper around the Telegram Mini App API. It provides methods to interact with the Telegram client, such as getting user data, controlling native UI components (e.g., Main Button, Back Button), and handling haptic feedback.
