import {
  DollarSign,       // USD - Dollar sign ($)
  Euro,             // EUR - Euro sign (€)
  CreditCard,       // RON - Bank card for Romanian leu & fallback
  type LucideIcon
} from 'lucide-react';
import { CurrencyHryvnia } from '../components/icons/CurrencyIcons';

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
const CURRENCY_ICON_MAP: Record<string, AccountIconType> = {
  'USD': DollarSign,        // US Dollar - $ symbol (Lucide)
  'EUR': Euro,              // Euro - € symbol (Lucide)
  'UAH': CurrencyHryvnia,   // Ukrainian Hryvnia - ₴ symbol (Custom)
  'RON': CreditCard,        // Romanian Leu - Bank card (Lucide)
};

/**
 * Currency to Color mapping
 * Maps ISO currency codes to branded colors
 */
const CURRENCY_COLOR_MAP: Record<string, string> = {
  'USD': '#10B981',     // Green - Dollar green
  'EUR': '#3B82F6',     // Blue - EU flag blue
  'UAH': '#F59E0B',     // Amber/Yellow - Ukrainian flag yellow
  'RON': '#8B5CF6',     // Purple - Romanian distinctive color
};

/**
 * Get icon component based on currency code or account name
 * @param currencyCode - ISO currency code (e.g., 'USD', 'EUR')
 * @param accountName - Account name (fallback for detection)
 * @returns Icon component (either Lucide or custom React component)
 */
export const getAccountIcon = (currencyCode?: string, accountName?: string): AccountIconType => {
  // Primary: Use currency code if provided
  if (currencyCode && CURRENCY_ICON_MAP[currencyCode.toUpperCase()]) {
    return CURRENCY_ICON_MAP[currencyCode.toUpperCase()];
  }

  // Fallback: Detect from account name
  if (accountName) {
    const name = accountName.toLowerCase();
    if (name.includes('cash')) return DollarSign;
  }

  // Default fallback: Always use CreditCard for unknown currencies/accounts
  return CreditCard;
};

/**
 * Get color based on currency code or account name
 * @param currencyCode - ISO currency code (e.g., 'USD', 'EUR')
 * @param accountName - Account name (fallback for detection)
 */
export const getAccountColor = (currencyCode?: string, accountName?: string): string => {
  // Primary: Use currency code if provided
  if (currencyCode && CURRENCY_COLOR_MAP[currencyCode.toUpperCase()]) {
    return CURRENCY_COLOR_MAP[currencyCode.toUpperCase()];
  }

  // Fallback: Detect from account name
  if (accountName) {
    const name = accountName.toLowerCase();
    if (name.includes('cash')) return '#10B981';
    if (name.includes('usd')) return '#10B981';
    if (name.includes('eur')) return '#3B82F6';
    if (name.includes('uah')) return '#F59E0B';
    if (name.includes('ron')) return '#8B5CF6';
  }

  // Default gray
  return '#6B7280';
};
