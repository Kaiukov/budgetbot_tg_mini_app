# Theme

This directory contains the application's theme and styling configurations, organized into two main systems: `claude-code` and `dark`.

**[claude-code/](claude-code/)**: A systematic and modern color theme engine.
- **[colors/](claude-code/colors/)**: Defines a modular color palette with separate files for each color category (e.g., `accent`, `base`, `card`). The `index.ts` file aggregates these colors and provides helper functions to generate CSS variables and a Tailwind CSS color configuration.
- **[types.ts](claude-code/types.ts)**: Contains TypeScript interfaces for the entire color system, ensuring type safety.

**[dark/](dark/)**: A collection of reusable dark-theme-specific styling constants and Tailwind CSS class strings.
- **[animations.ts](dark/animations.ts)**: Provides constants for CSS animations and transitions.
- **[cards.ts](dark/cards.ts)**: Defines class strings for various card and list item styles.
- **[gradients.ts](dark/gradients.ts)**: Contains predefined gradient styles for backgrounds and other UI elements.
- **[layouts.ts](dark/layouts.ts)**: Offers constants for common flexbox and grid layout patterns.
- **[index.ts](dark/index.ts)**: Serves as the central export hub for all constants within the `dark` theme directory.
