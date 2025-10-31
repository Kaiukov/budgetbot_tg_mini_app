/**
 * Dark Theme Animations & Transitions
 * Consistent motion and transition configurations
 */

export const animations = {
  // Scale animations
  scaleHover: 'hover:scale-105',
  scaleActive: 'active:scale-98',
  scaleBoth: 'hover:scale-105 active:scale-98',

  // Transitions
  transition: 'transition',
  transitionAll: 'transition-all',
  transitionColors: 'transition-colors',
  transitionTransform: 'transition-transform',
  transitionOpacity: 'transition-opacity',

  // Combined transitions
  transitionSmooth: 'transition-all duration-200',
  transitionHover: 'transition-all hover:scale-105',

  // Duration presets
  duration200: 'duration-200',
  duration300: 'duration-300',
  duration500: 'duration-500',

  // Easing
  easeLinear: 'ease-linear',
  easeIn: 'ease-in',
  easeOut: 'ease-out',
  easeInOut: 'ease-in-out',

  // Pulse and other effects
  pulse: 'animate-pulse',
  spin: 'animate-spin',
  bounce: 'animate-bounce',

  // Custom combinations
  cardHover: 'transition-all hover:bg-slate-800/60 hover:border-slate-600',
  buttonHover: 'transition-all hover:scale-105 active:scale-98',
} as const;
