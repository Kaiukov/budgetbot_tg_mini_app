### CLAUDE.md

claude-code/colors/index.ts - Aggregates palette tokens and helpers.
    - claudeCodeColors "Bundled base/accent/card/popover/muted/etc. palette"
    - getCSSVariables "Builds CSS variable map for light/dark"
    - getTailwindColors "Exposes Tailwind color config"
    - baseColors/accentColors/cardColors/popoverColors/mutedColors/destructiveColors/borderInputColors/chartColors/sidebarColors "Token objects for themed surfaces"

claude-code/types.ts - Type safety for the palette.
    - ColorPalette "Shared color tuple structure"
    - ThemeColors "Full palette contract"
    - ChartColors/SidebarColors/etc. "Component-specific palettes"

claude-code/colors/base.ts - Neutral background/foreground tokens.
    - baseColors "Base/dark/inverted color steps"

claude-code/colors/accent.ts - Accent hues.
    - accentColors "Primary, secondary, ghost accent ramps"

claude-code/colors/card.ts - Card surface tokens.
    - cardColors "Card/body/foreground/shadow colors"

claude-code/colors/popover.ts - Popover/dropdown tokens.
    - popoverColors "Surface, border, and foreground colors"

claude-code/colors/muted.ts - Muted text/background tokens.
    - mutedColors "Muted fg/bg ramps"

claude-code/colors/destructive.ts - Error/destructive palette.
    - destructiveColors "Foreground/background/error ramp"

claude-code/colors/border-input.ts - Border + input colors.
    - borderInputColors "Borders, focus rings, placeholders"

claude-code/colors/chart.ts - Chart-friendly palette.
    - chartColors "Ordered list of chart accent colors"

claude-code/colors/sidebar.ts - Sidebar theme tokens.
    - sidebarColors "Sidebar fg/bg/active/hover/disabled colors"

dark/animations.ts - Animation token set.
    - animations "Durations + easing for fade/slide/pulse"

dark/cards.ts - Card/list styling presets.
    - cardStyles "CSS class strings for list rows and panels"

dark/gradients.ts - Reusable gradient definitions.
    - gradients "Prebaked linear gradients for backgrounds"

dark/layouts.ts - Layout utility class maps.
    - layouts "Flex/grid spacing presets for screens"

dark/index.ts - Dark theme barrel.
    - theme "Combined gradients/cards/layouts/animations export"
    - gradients/cardStyles/layouts/animations "Named re-exports for components"
