/**
 * Color System Aggregator
 * Combines all color categories into unified theme structure
 */

import { baseColors } from "./base";
import { accentColors } from "./accent";
import { cardColors } from "./card";
import { popoverColors } from "./popover";
import { mutedColors } from "./muted";
import { destructiveColors } from "./destructive";
import { borderInputColors } from "./border-input";
import { chartColors } from "./chart";
import { sidebarColors } from "./sidebar";
import type { ThemeColors } from "../types";

/**
 * Complete Claude Code color palette
 * Modular organization with category-specific files
 */
export const claudeCodeColors: ThemeColors = {
  light: {
    ...baseColors.light,
    ...cardColors.light,
    ...popoverColors.light,
    ...accentColors.light,
    ...mutedColors.light,
    ...destructiveColors.light,
    ...borderInputColors.light,
    chart: chartColors.light,
    ...sidebarColors.light,
  },
  dark: {
    ...baseColors.dark,
    ...cardColors.dark,
    ...popoverColors.dark,
    ...accentColors.dark,
    ...mutedColors.dark,
    ...destructiveColors.dark,
    ...borderInputColors.dark,
    chart: chartColors.dark,
    ...sidebarColors.dark,
  },
};

/**
 * CSS Custom Properties for Theme System
 * These map to Tailwind color classes
 */
export const getCSSVariables = (isDark: boolean = true) => {
  const colors = isDark ? claudeCodeColors.dark : claudeCodeColors.light;
  return {
    "--background": colors.background,
    "--foreground": colors.foreground,
    "--card": colors.card,
    "--card-foreground": colors.cardForeground,
    "--popover": colors.popover,
    "--popover-foreground": colors.popoverForeground,
    "--primary": colors.primary,
    "--primary-foreground": colors.primaryForeground,
    "--secondary": colors.secondary,
    "--secondary-foreground": colors.secondaryForeground,
    "--muted": colors.muted,
    "--muted-foreground": colors.mutedForeground,
    "--accent": colors.accent,
    "--accent-foreground": colors.accentForeground,
    "--destructive": colors.destructive,
    "--destructive-foreground": colors.destructiveForeground,
    "--border": colors.border,
    "--input": colors.input,
    "--ring": colors.ring,
    "--chart-1": colors.chart[1],
    "--chart-2": colors.chart[2],
    "--chart-3": colors.chart[3],
    "--chart-4": colors.chart[4],
    "--chart-5": colors.chart[5],
    "--sidebar": colors.sidebar,
    "--sidebar-foreground": colors.sidebarForeground,
    "--sidebar-primary": colors.sidebarPrimary,
    "--sidebar-primary-foreground": colors.sidebarPrimaryForeground,
    "--sidebar-accent": colors.sidebarAccent,
    "--sidebar-accent-foreground": colors.sidebarAccentForeground,
    "--sidebar-border": colors.sidebarBorder,
    "--sidebar-ring": colors.sidebarRing,
  };
};

/**
 * Tailwind color extension for tailwind.config.js
 * Returns object structure for Tailwind extend configuration
 */
export const getTailwindColors = () => {
  return {
    background: "var(--background)",
    foreground: "var(--foreground)",
    card: "var(--card)",
    "card-foreground": "var(--card-foreground)",
    popover: "var(--popover)",
    "popover-foreground": "var(--popover-foreground)",
    primary: "var(--primary)",
    "primary-foreground": "var(--primary-foreground)",
    secondary: "var(--secondary)",
    "secondary-foreground": "var(--secondary-foreground)",
    muted: "var(--muted)",
    "muted-foreground": "var(--muted-foreground)",
    accent: "var(--accent)",
    "accent-foreground": "var(--accent-foreground)",
    destructive: "var(--destructive)",
    "destructive-foreground": "var(--destructive-foreground)",
    border: "var(--border)",
    input: "var(--input)",
    ring: "var(--ring)",
    chart: {
      1: "var(--chart-1)",
      2: "var(--chart-2)",
      3: "var(--chart-3)",
      4: "var(--chart-4)",
      5: "var(--chart-5)",
    },
    sidebar: "var(--sidebar)",
    "sidebar-foreground": "var(--sidebar-foreground)",
    "sidebar-primary": "var(--sidebar-primary)",
    "sidebar-primary-foreground": "var(--sidebar-primary-foreground)",
    "sidebar-accent": "var(--sidebar-accent)",
    "sidebar-accent-foreground": "var(--sidebar-accent-foreground)",
    "sidebar-border": "var(--sidebar-border)",
    "sidebar-ring": "var(--sidebar-ring)",
  };
};

// Re-export individual color categories for granular imports
export { baseColors } from "./base";
export { accentColors } from "./accent";
export { cardColors } from "./card";
export { popoverColors } from "./popover";
export { mutedColors } from "./muted";
export { destructiveColors } from "./destructive";
export { borderInputColors } from "./border-input";
export { chartColors } from "./chart";
export { sidebarColors } from "./sidebar";
