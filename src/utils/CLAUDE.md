# Utils

This directory contains a collection of utility functions and helpers used across the application for various tasks like data formatting, caching, and providing configuration.

**[accounts.ts](accounts.ts)**: Provides helper functions to determine the appropriate icon and color for a bank account based on its currency or name.

**[cache.ts](cache.ts)**: Implements a generic, dual-layer (memory + localStorage) caching system with configurable expiration. It is used for caching API responses like transaction data.

**[categories.ts](categories.ts)**: Contains utility functions for handling category data, such as extracting emojis from names and assigning a default icon or color based on keywords in the category name.

**[categoryFilter.ts](categoryFilter.ts)**: A utility for filtering the list of available categories based on the current transaction type (e.g., 'income', 'expense').

**[currencies.ts](currencies.ts)**: A comprehensive currency utility based on Google's currency dataset. It provides functions to get currency symbols, names, and perform basic formatting.

**[fetchUserData.ts](fetchUserData.ts)**: A function to fetch detailed user data (name, bio, avatar) from the backend Sync API, using Telegram's `initData` for authentication.

**[fetchUserPhoto.ts](fetchUserPhoto.ts)**: Appears to be an older or redundant version of `fetchUserData.ts`, with a similar purpose but a slightly different implementation.

**[formatCurrency.ts](formatCurrency.ts)**: Provides robust currency formatting functions using the `Intl.NumberFormat` API for locale-aware currency display.

**[serviceStatus.ts](serviceStatus.ts)**: Defines types and initial state for tracking the connection status of the application's backend services.

**[transactionHelpers.ts](transactionHelpers.ts)**: A suite of helper functions for formatting transaction data for display in the UI, including generating labels, amounts, dates, and icons.
