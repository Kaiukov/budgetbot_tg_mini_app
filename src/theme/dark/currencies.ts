/**
 * Currency Theme Configuration
 * Maps ISO currency codes to icons and colors
 */

import { DollarSign, Euro, CreditCard, type LucideIcon } from 'lucide-react';
import { CurrencyHryvnia } from '../../components/icons/CurrencyIcons';

/**
 * Icon type that can be either a Lucide icon or a custom React component
 */
export type AccountIconType = LucideIcon | React.FC<any>;

/**
 * Currency to Icon mapping
 * Maps ISO currency codes to appropriate icons (Lucide or custom)
 *
 * Note: UAH uses custom CurrencyHryvnia component with authentic ₴ symbol
 * RON uses CreditCard icon as requested
 */
export const currencyIconMap: Record<string, AccountIconType> = {
  'USD': DollarSign,        // US Dollar - $ symbol (Lucide)
  'EUR': Euro,              // Euro - € symbol (Lucide)
  'UAH': CurrencyHryvnia,   // Ukrainian Hryvnia - ₴ symbol (Custom)
  'RON': CreditCard,        // Romanian Leu - Bank card (Lucide)
} as const;

/**
 * Currency to Color mapping
 * Maps ISO currency codes to branded colors
 */
export const currencyColorMap: Record<string, string> = {
  'USD': '#10B981',     // Green - Dollar green
  'EUR': '#3B82F6',     // Blue - EU flag blue
  'UAH': '#F59E0B',     // Amber/Yellow - Ukrainian flag yellow
  'RON': '#8B5CF6',     // Purple - Romanian distinctive color
} as const;

/**
 * Default colors for currency detection fallbacks
 */
export const currencyColorDefaults = {
  cash: '#10B981',      // Green
  usd: '#10B981',       // Green
  eur: '#3B82F6',       // Blue
  uah: '#F59E0B',       // Amber
  ron: '#8B5CF6',       // Purple
  default: '#6B7280',   // Gray
} as const;
