### CLAUDE.md

BudgetMiniApp.tsx - Router that renders screens from machine state.
    - BudgetMiniApp "Maps machine context to Home/flows/transactions/debug screens"

main.tsx - Application bootstrapper.
    - main "Initializes Telegram service, providers, and mounts React"

index.css - Global styling entry.
    - Base Tailwind resets and theme primitives

vite-env.d.ts - Vite ambient type declarations.
    - Defines `import.meta.env` typing for build

components/CLAUDE.md - Screen and UI component index.
    - Home/flow screens, cards, buttons, icons overview

machines/CLAUDE.md - State machine documentation.
    - budgetMachine, actors, actions, types summaries

services/CLAUDE.md - Sync/Telegram service map.
    - Facades, gateway, API clients, FX/cache utilities

utils/CLAUDE.md - Helper functions reference.
    - Cache, currency, category, transaction formatting utilities

types/CLAUDE.md - Shared type definitions.
    - Telegram WebApp types and transaction domain models

theme/CLAUDE.md - Theme tokens and palettes.
    - claude-code palette + dark theme utilities

hooks/ - Custom React hooks (see source for specifics).
    - Data fetching and machine integration helpers

context/ - BudgetMachine context provider.
    - Persists machine state to localStorage and exposes hook

config/actorTimeouts.ts - Actor timeout constants.
    - DATA_FETCH/CRUD_OPERATION/HEALTH_CHECK values
