# Services

This directory contains services for interacting with external APIs and the Telegram Mini App interface.

**[firefly/](firefly/)**: Contains all services related to interacting with the Firefly III API. This includes creating and fetching transactions, as well as type definitions and utility functions. See the `firefly/CLAUDE.md` for more details.

**[sync/](sync/)**: Layered Sync API client (Core → Cache → Balance → Accounts → Categories → Destinations → User) that exposes a typed singleton for the rest of the app. Handles anonymous-key auth, Telegram `initData`, caching, currency conversion, usage stats, destination suggestions, and Telegram user profiles. See `sync/CLAUDE.md` for the class map.

**[telegram.ts](telegram.ts)**: Implements the `TelegramService`, which is a wrapper around the Telegram Mini App API. It provides methods to interact with the Telegram client, such as getting user data, controlling native UI components (e.g., Main Button, Back Button), and handling haptic feedback.
