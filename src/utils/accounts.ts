import { DollarSign, CreditCard, TrendingUp, type LucideIcon } from 'lucide-react';

/**
 * Get icon component based on account name
 */
export const getAccountIcon = (accountName: string): LucideIcon => {
  const name = accountName.toLowerCase();
  if (name.includes('cash')) return DollarSign;
  if (name.includes('card') || name.includes('mono') || name.includes('pumb') || name.includes('zen')) {
    return CreditCard;
  }
  return TrendingUp;
};

/**
 * Get color based on account name or currency
 */
export const getAccountColor = (accountName: string): string => {
  const name = accountName.toLowerCase();
  if (name.includes('cash')) return '#10B981';
  if (name.includes('usd')) return '#3B82F6';
  if (name.includes('eur')) return '#8B5CF6';
  if (name.includes('uah')) return '#F59E0B';
  return '#6B7280';
};
