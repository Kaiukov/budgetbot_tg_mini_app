/**
 * Dark Theme System
 * Central export for all theme constants and utilities
 */

export { gradients } from './gradients';
export { cardStyles } from './cards';
export { layouts } from './layouts';
export { animations } from './animations';

// Re-export as single object for convenience
export const theme = {
  get gradients() { return require('./gradients').gradients; },
  get cardStyles() { return require('./cards').cardStyles; },
  get layouts() { return require('./layouts').layouts; },
  get animations() { return require('./animations').animations; },
} as const;
