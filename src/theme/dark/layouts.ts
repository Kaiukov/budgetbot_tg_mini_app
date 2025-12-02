/**
 * Dark Theme Layout Constants
 * Screen and container layout configurations
 */

export const layouts = {
  // Screen container - absolute positioning to prevent rendering under other elements
  screen: 'absolute inset-0 min-h-screen text-white overflow-y-auto',

  // Header bar (safe area handled by parent container) - Universal pattern for all screens
  header: 'flex items-center justify-between px-4 pt-8 pb-6',
  headerLarge: 'flex items-center justify-between px-4 pt-8 pb-6', // Alias for backward compatibility

  // Content areas
  content: 'p-3',
  contentWide: 'p-4',
  contentPadded: 'p-4 space-y-3',

  // List containers
  listContainer: 'space-y-0',
  listContainerWithGap: 'space-y-2',

  // Flex utilities
  flex: 'flex',
  flexCol: 'flex flex-col',
  flexCenter: 'flex items-center justify-center',
  flexBetween: 'flex items-center justify-between',

  // Grid utilities
  grid: 'grid grid-cols-3 gap-1.5',
  gridCols2: 'grid grid-cols-2 gap-2',

  // Spacing
  gap: 'gap-2',
  gapSmall: 'gap-1',
  gapLarge: 'gap-3',

  // Alignment
  centerContent: 'flex flex-col items-center justify-center',
  stretchContent: 'w-full',
} as const;
