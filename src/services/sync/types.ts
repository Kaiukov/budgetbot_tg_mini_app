/**
 * Sync API Service - Type Definitions
 * All interfaces for Sync API responses and data structures
 */

export interface AccountUsage {
  account_id: string;
  user_name: string;
  account_name: string;
  account_currency: string;
  current_balance: number;
  balance_in_USD: number;
  balance_in_EUR: number;
  owner: string;
  owner_id: string;
  usage_count: number;
  created_at: string;
  updated_at: string;
}

export interface AccountsUsageResponse {
  success: boolean;
  message: string;
  timestamp: string;
  get_accounts_usage: AccountUsage[];
  total: number;
}

export interface CategoryUsage {
  user_name: string;
  category_name: string;
  category_id: number;
  usage_count: number;
  created_at: string | null;
  updated_at: string | null;
}

export interface CategoriesUsageResponse {
  success: boolean;
  message: string;
  timestamp: string;
  get_categories_usage: CategoryUsage[];
  total: number;
}

export interface DestinationSuggestion {
  user_name: string;
  destination_name: string;
  category_name: string;
  usage_count: number;
  global_usage?: number;
  user_has_used?: boolean;
  created_at: string | null;
  updated_at: string | null;
}

export interface DestinationNameUsageResponse {
  success: boolean;
  message: string;
  timestamp: string;
  get_destination_name_usage: DestinationSuggestion[];
  total: number;
}

export interface CurrentBalanceResponse {
  success: boolean;
  message: string;
  timestamp: string;
  get_current_balance: {
    balance_in_USD: number;
  }[];
  total: number;
}

export interface TelegramUserData {
  success: boolean;
  message: string;
  timestamp: string;
  userData: {
    photo_url: string | null;
    bio: string;
    user_id: number;
  } | null;
}

export interface ExchangeRateCache {
  rate: number;
  timestamp: number;
}
