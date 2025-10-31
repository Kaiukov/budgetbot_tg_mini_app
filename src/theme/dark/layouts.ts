/**
 * Dark Theme Layout Constants
 * Screen and container layout configurations
 */

export const layouts = {
  // Screen container
  screen: 'min-h-screen text-white',

  // Header bar
  header: 'flex items-center px-3 py-3',
  headerWide: 'flex items-center px-4 py-4',

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
