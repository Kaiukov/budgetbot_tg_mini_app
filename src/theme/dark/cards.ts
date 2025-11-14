/**
 * Dark Theme Card Styling Classes
 * Reusable card and component styles
 */

export const cardStyles = {
  // List items in scrollable containers
  listItem: 'bg-slate-800/40 backdrop-blur-sm border-b border-slate-700/50 last:border-b-0 px-3 py-3 hover:bg-slate-800/60 transition-all cursor-pointer active:scale-98',

  // Interactive list items with better spacing
  listItemWide: 'bg-slate-800/40 backdrop-blur-sm border-b border-slate-700/50 last:border-b-0 px-4 py-3.5 hover:bg-slate-800/60 hover:border-slate-600 transition-all cursor-pointer active:scale-98 flex items-center',

  // Container cards
  container: 'bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700/50 p-4',
  containerSmall: 'bg-slate-800/50 backdrop-blur-sm rounded-lg border border-slate-700/50 p-3',

  // Header cards
  headerCard: 'bg-slate-800/50 backdrop-blur-sm rounded-lg p-4 border border-slate-700/50',

  // Icon styling
  iconBase: 'w-10 h-10 rounded-full flex items-center justify-center mr-3 flex-shrink-0',
  iconBaseWide: 'w-12 h-12 rounded-xl flex items-center justify-center mr-3.5 flex-shrink-0 shadow-md',

  // Chevron/arrow icons
  chevron: 'text-gray-500 flex-shrink-0',

  // Text content wrapper
  textWrapper: 'flex-1',
  textWrapperNoWrap: 'flex-1 min-w-0',

  // Loading and empty states
  emptyState: 'flex flex-col items-center justify-center py-8',
  loadingState: 'flex items-center justify-center py-8',

  // Shadows and effects
  shadow: 'shadow-sm',
  shadowMd: 'shadow-md',
  shadowLg: 'shadow-lg',

  // Hover and active states
  hover: 'hover:bg-slate-800/60 transition-all',
  active: 'active:scale-98',
  disabled: 'opacity-40 disabled:cursor-not-allowed',
} as const;
