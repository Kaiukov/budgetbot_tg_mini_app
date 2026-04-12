/**
 * Dark Theme System
 * Central export for all theme constants and utilities
 */

import { gradients } from './gradients';
import { cardStyles } from './cards';
import { layouts } from './layouts';
import { animations } from './animations';

export { gradients, cardStyles, layouts, animations };

// Re-export as single object for convenience
export const theme = {
  gradients,
  cardStyles,
  layouts,
  animations,
} as const;
