# GEMINI.md

This file provides a comprehensive overview of the Budget Mini App project, its architecture, and development conventions to be used as instructional context for future interactions.

## Project Overview

This is a **Telegram Mini App** for personal budget,,,, management, integrated with a **Firefly III** backend. It is built as a modern frontend application using **React**, **TypeScript**, and **Vite**. The application is designed to run inside the Telegram mobile and desktop apps, providing a seamless user experience.

The app's architecture consists of three main parts:

1.  **Frontend:** A React single-page application (SPA) that provides the user interface.
2.  **Backend Proxy:** A **Cloudflare Worker** (in production) or **Vite Dev Server** (in development) that proxies API requests to the backend services. This is done to handle CORS and centralize API endpoints.
3.  **Backend Services:** A **sync-service** for caching and data synchronization, and a **Firefly III** instance for core financial data storage.

## Building and Running

The project is configured with npm scripts for common development tasks.

*   **Running the development server:**
    ```bash
    npm run dev
    ```
    This will start the Vite dev server, which is accessible at `http://localhost:3000`. The dev server is configured to proxy API requests to the backend, as defined in `vite.config.ts`.

*   **Building for production:**
    ```bash
    npm run build
    ```
    This command compiles the TypeScript code and bundles the application for production using Vite. The output is placed in the `dist/` directory.

*   **Linting the code:**
    ```bash
    npm run lint
    ```
    This runs ESLint to check the codebase for any linting errors.

## Development Conventions

*   **Project Structure:**
    *   `src/components`: Contains reusable React components for different screens of the application.
    *   `src/hooks`: Contains custom React hooks for managing state and side effects (e.g., `useTelegramUser`, `useExpenseData`).
    *   `src/services`: Contains services that encapsulate the logic for interacting with external APIs (`firefly.ts`, `sync.ts`).
    *   `src/main.tsx`: The entry point of the React application.
    *   `src/BudgetMiniApp.tsx`: The main application component, which also handles the routing logic.

*   **State Management:** The application uses React's built-in `useState` and `useEffect` hooks, along with custom hooks, to manage state. There is no external state management library like Redux or Zustand.

*   **Routing:** The app uses a simple conditional rendering approach based on the `currentScreen` state variable in `BudgetMiniApp.tsx` to switch between different screens.

*   **Styling:** The project uses **Tailwind CSS** for styling. The configuration is in `tailwind.config.js`.

## API and Backend

The frontend communicates with two backend services through a proxy:

*   **Sync Service:** A custom service that provides cached data and performs synchronization operations. The frontend interacts with it through the `src/services/sync.ts` service.
*   **Firefly III:** The main financial data backend. The frontend interacts with it through the `src/services/firefly.ts` service.

In **development**, the Vite dev server proxies all requests from `/api` to `https://dev.neon-chuckwalla.ts.net`.

In **production**, a **Cloudflare Worker** defined in `functions/_middleware.ts` intercepts all `/api/*` requests and proxies them to the backend URL defined in the `BACKEND_URL` environment variable. This worker also handles CORS and can inject authentication headers.

## Deployment

The application is deployed as a static site on **Cloudflare Pages**. The `wrangler.toml` file contains the configuration for the Cloudflare Pages project. The production build output from the `dist/` directory is deployed, and the serverless function in `functions/_middleware.ts` is used as an API proxy.
