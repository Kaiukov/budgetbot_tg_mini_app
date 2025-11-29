export interface ApiResponse<T> {
  success: boolean;
  message: string;
  timestamp: string;
  total?: number;
  total_sync?: number;
  [key: string]: any;
}

export interface Transaction {
  firefly_transaction_id: string;
  external_id?: string;
  type: 'withdrawal' | 'deposit' | 'transfer';
  date: string;
  amount: number;
  currency_code: string;
  description: string;
  source_name: string;
  destination_name: string;
  category_name: string;
  user_name: string;
  updated_at?: string;
}

export interface Account {
  id: string;
  name: string;
  currency_code: string;
  current_balance: number;
  balance_in_USD: number;
  balance_in_EUR: number;
  owner: string;
  owner_id: string;
}

export interface AccountUsage extends Account {
  user_name: string;
  usage_count: number;
  first_used_at: string | null;
  last_used_at: string | null;
}

export interface Category {
  category_id: string;
  name: string;
  notes: string;
  active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface CategoryUsage extends Category {
  user_name: string;
  type: 'withdrawal' | 'deposit' | 'service' | 'unknown';
  usage_count: number;
  global_usage: number;
  user_has_used: boolean;
}

export interface DestinationUsage {
  user_name: string;
  destination_id: string;
  destination_name: string;
  category_id: string;
  category_name: string;
  usage_count: number;
  global_usage: number;
  user_has_used: boolean;
}

export interface SourceUsage {
  user_name: string;
  source_id: string;
  source_name: string;
  category_id: string;
  category_name: string;
  usage_count: number;
  global_usage: number;
  user_has_used: boolean;
}

export interface RunningBalance {
  date: string;
  balance_eur: number;
  balance_usd: number;
}

export interface ExchangeRateData {
  from: string;
  to: string;
  amount: number;
  exchangeRate: number;
  exchangeAmount: number;
  date: string;
}

export interface TelegramUserData {
  id: number;
  name: string;
  username?: string;
  bio?: string;
  avatar_url?: string;
  language_code?: string;
  bot_blocked: boolean;
}
