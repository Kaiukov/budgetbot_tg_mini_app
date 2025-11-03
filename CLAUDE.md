# Budget Mini App - Project Overview

A Telegram Mini App for managing personal finances, integrated with Firefly III and a custom backend sync service.

**Production URL:** https://budgetbot-tg-mini-app.kayukov2010.workers.dev/

## Key Features
- ✅ Real-time Telegram user profile integration
- ✅ Expense, income, and transfer tracking
- ✅ Multi-account and multi-currency support
- ✅ Dark mode UI optimized for Telegram

## Tech Stack & Code Quality
- **Framework:** React `^18.3.1`
- **Language:** TypeScript `^5.7.2`
- **Build Tool:** Vite `^5.4.11`
- **Linting:** `npm run lint`
- **Type-Checking:** `npx tsc --noEmit`

This document provides a high-level overview of the "Budget Mini App" project, a Telegram Mini App for personal finance management.

## Core Components

- **[src/](src/)**: The heart of the application, containing all the React components, hooks, services, and utilities. See the detailed breakdown in `src/CLAUDE.md`. (Check code with `npm run lint` and `npx tsc --noEmit`).
- **[public/](public/)**: Contains static assets that are served directly, such as the `vite.svg` favicon.
- **[functions/](functions/)**: Houses Cloudflare Pages functions. Currently, it includes a pass-through middleware, as API requests are proxied or made directly to the backend.

## Frontend Build & Configuration

- **[index.html](index.html)**: The main entry point for the web application, which loads the React app and the Telegram WebApp SDK.
- **[vite.config.ts](vite.config.ts)**: Configuration for the Vite build tool, including development server settings and API proxy rules.
- **[package.json](package.json)**: Defines project metadata, npm scripts (like `dev`, `build`), and dependencies.
- **[tailwind.config.js](tailwind.config.js)** & **[postcss.config.js](postcss.config.js)**: Configuration files for the Tailwind CSS framework.
- **[tsconfig.json](tsconfig.json)**: The main TypeScript configuration for the project.

## Backend & Deployment

- **[API.md](API.md)**: Detailed documentation for the backend Sync Service API, outlining all available endpoints. Always check if new updats exist: https://raw.githubusercontent.com/Kaiukov/firefly/refs/heads/main/sync/API.md
- **[Dockerfile](Dockerfile)**: Defines the steps to build a production-ready Docker image for the application using Nginx.
- **[nginx.conf](nginx.conf)**: Nginx configuration for serving the static frontend files and proxying API requests to the backend services in a production environment.
- **[wrangler.toml](wrangler.toml)**: Configuration for deploying the application to Cloudflare Pages.

## Documentation & Project Management

- **[CHANGELOG.md](CHANGELOG.md)**: A log of all notable changes to the project, organized by version.
- **[.gitignore](.gitignore)**: Specifies which files and directories to exclude from version control.
- **[.env.example](.env.example)**: An example file detailing the environment variables required to run the application.
- **[.claude/](.claude/)**: Contains local settings for the Claude AI assistant.
