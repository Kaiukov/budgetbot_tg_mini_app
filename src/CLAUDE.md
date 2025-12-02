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
- **[hooks/](hooks/)**: Contains custom React hooks that encapsulate and manage stateful logic, such as fetching user data (`useTelegramUser`) or managing transaction form state (`useTransactionData`).
- **[services/](services/)**: Includes services for interacting with external APIs. It's responsible for all communication with the Firefly III API, a custom backend sync service, and the Telegram Mini App API. See `services/CLAUDE.md` for more details.
- **[theme/](theme/)**: Contains the application's visual styling and theme configurations, including a systematic color engine and dark mode specific utilities. See `theme/CLAUDE.md` for more details.
- **[types/](types/)**: Defines TypeScript types and interfaces used throughout the application, ensuring data consistency and type safety. See `types/CLAUDE.md` for more details.
- **[utils/](utils/)**: A collection of miscellaneous helper functions for tasks like data formatting, caching, and other shared logic. See `utils/CLAUDE.md` for more details.

## Withdrawal Flow (v1.3.0+)

The application now features a fully machine-driven **withdrawal flow** (renamed from expense) with the following architecture:

### Flow Path
**Home** → **Accounts** → **Amount** (FX preview for non-EUR) → **Category** → **Destination Name** → **Confirm** (date + notes) → **Submit**

### State Management
- **State Machine**: Nested states under `ready.withdrawalFlow` (accounts → amount → category → notes → confirm)
- **Events**: `NAVIGATE_WITHDRAWAL_ACCOUNTS`, `UPDATE_ACCOUNT`, `UPDATE_AMOUNT`, `NAVIGATE_CATEGORY`, `UPDATE_CATEGORY`, `NAVIGATE_CONFIRM`, `SUBMIT_TRANSACTION`
- **Back Navigation**: Automatic state reversal with amount preservation on same-account re-select; amount cleared on account switch

### Key Features
1. **Currency Conversion**: Automatic FX preview for non-EUR accounts using `syncService.getExchangeRate()`
2. **Category Filtering**: Dynamic category fetching filtered by `withdrawal` type
3. **Notes + Date**: Confirmation screen collects notes (required) and date (defaults to today)
4. **Validation**: Amount must be positive; FX conversion required for non-EUR; notes required at confirmation

### Data Capture
- **Account Screen**: Stores account ID, currency, username for transaction context
- **Amount Screen**: Client-side FX conversion stored as `amount_eur` for Firefly payload
- **Category Screen**: Selected category with optional budget context
- **Destination Screen**: Notes/comment for transaction description
- **Confirm Screen**: Final date and notes for submission

### Known Issues (Review 2025-12-01)
1. **Destination not persisted**: `DestinationNameScreen` input clears after typing due to payload key mismatch (`notes` vs `event.comment`). Fix: Standardize `UPDATE_NOTES` payload across callers and machine action.
2. **user_name not recorded**: Account select dispatches `username` but machine expects `user_name`, leaving `transaction.user_name` blank.
3. **Cosmetic**: "expense flow" comment stray text in budgetMachine.ts

### Testing
- E2E: `tests/e2e/withdrawal-flow.spec.ts` covers navigation, terminology, and submission
- Manual: Verify back stack, FX conversion, and required notes validation
