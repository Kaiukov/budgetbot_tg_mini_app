# Source Code (`src`)

This directory contains the core source code for the Budget Mini App, a React application built with TypeScript and Vite.

## Root Files

- **[BudgetMiniApp.tsx](BudgetMiniApp.tsx)**: The main application component. It manages the application's state, screen navigation (routing), and orchestrates data fetching and UI rendering.
- **[main.tsx](main.tsx)**: The entry point of the application. It renders the root `BudgetMiniApp` component and performs initial setup for the Telegram Mini App environment.
- **[index.css](index.css)**: Global stylesheet, including Tailwind CSS setup and base styles.
- **[vite-env.d.ts](vite-env.d.ts)**: TypeScript declarations for Vite environment variables.

## Directories

- **[assets/](assets/)**: Contains static assets, such as custom SVG icons.
- **[components/](components/)**: Home to all React components, which are organized by screens (e.g., `HomeScreen`, `AccountsScreen`) and reusable UI elements (e.g., `TransactionCard`).
- **[config/](config/)**: Stores static configuration files, like `categories.json` which defines rules for transaction categories.
- **[hooks/](hooks/)**: Contains custom React hooks that encapsulate and manage stateful logic, such as fetching user data (`useTelegramUser`). The legacy transaction form hook was removed in preparation for the new expense-flow store.
- **[services/](services/)**: Includes services for interacting with external APIs. It's responsible for all communication with the Firefly III API, a custom backend sync service, and the Telegram Mini App API. See `services/CLAUDE.md` for more details.
- **[theme/](theme/)**: Contains the application's visual styling and theme configurations, including a systematic color engine and dark mode specific utilities. See `theme/CLAUDE.md` for more details.
- **[types/](types/)**: Defines TypeScript types and interfaces used throughout the application, ensuring data consistency and type safety. See `types/CLAUDE.md` for more details.
- **[utils/](utils/)**: A collection of miscellaneous helper functions for tasks like data formatting, caching, and other shared logic. See `utils/CLAUDE.md` for more details.
