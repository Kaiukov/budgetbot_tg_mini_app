/**
 * Dark Theme Gradient Definitions
 * Centralized gradient classes for consistent visual design
 */

export const gradients = {
  // Screen backgrounds - rich purple/indigo gradient
  screen: 'bg-gradient-to-b from-indigo-950 via-purple-950/30 to-indigo-950',

  // Card backgrounds - semi-transparent slate with backdrop blur
  card: {
    base: 'bg-slate-800/40 backdrop-blur-sm border border-slate-700/50',
    hover: 'hover:bg-slate-800/60 hover:border-slate-600',
    hoverBoth: 'bg-slate-800/40 backdrop-blur-sm border border-slate-700/50 hover:bg-slate-800/60 hover:border-slate-600',
    active: 'active:bg-slate-700',
  },

  // Special cards
  balanceCard: 'bg-gradient-to-r from-emerald-500/20 to-teal-500/20 backdrop-blur-sm border border-emerald-500/30',
  errorCard: 'bg-red-500/10 border border-red-500/30',
  successCard: 'bg-green-500/10 border border-green-500/30',

  // Headers with backdrop blur
  header: 'border-b border-slate-700/50 backdrop-blur-sm',

  // Buttons with gradients
  button: {
    primary: 'bg-blue-600 hover:bg-blue-700 text-white',
    success: 'bg-green-600 hover:bg-green-700 text-white',
    danger: 'bg-red-600 hover:bg-red-700 text-white',
    secondary: 'bg-gray-700 hover:bg-gray-600 text-white',
  },

  // Input fields
  input: 'bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 text-white placeholder-gray-500 focus:ring-2 focus:ring-amber-500/50',

  // Icon backgrounds with dynamic color
  iconBg: (color: string) => `rounded-xl flex items-center justify-center shadow-md`,

  // Colored glow effects
  glow: (color: string) => `shadow-lg shadow-${color}/30`,
} as const;
