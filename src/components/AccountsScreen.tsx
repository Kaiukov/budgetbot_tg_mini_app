import { ArrowLeft, ChevronRight, CreditCard } from 'lucide-react';
import { useEffect } from 'react';
import telegramService from '../services/telegram';
import type { AccountUsage } from '../services/sync';
import { getAccountIcon, getAccountColor } from '../utils/accounts';
import { formatCurrency } from '../utils/currencies';
import { gradients, cardStyles, layouts } from '../theme/dark';

interface AccountsScreenProps {
  accounts: AccountUsage[];
  accountsLoading: boolean;
  accountsError: string | null;
  title?: string;
  isAvailable?: boolean;
  excludeAccountId?: string;
  onBack: () => void;
  onSelectAccount: (accountName: string, accountId?: string, currency?: string, user_name?: string) => void;
  onRetry: () => void;
}

const AccountsScreen: React.FC<AccountsScreenProps> = ({
  accounts,
  accountsLoading,
  accountsError,
  title = 'Select Account',
  isAvailable,
  excludeAccountId,
  onBack,
  onSelectAccount,
  onRetry
}) => {
  // Filter out excluded account
  const filteredAccounts = excludeAccountId
    ? accounts.filter(acc => acc.account_id !== excludeAccountId)
    : accounts;
  // Show Telegram back button
  useEffect(() => {
    telegramService.showBackButton(onBack);
    return () => telegramService.hideBackButton();
  }, [onBack]);

  return (
    <div className={`${layouts.screen} ${gradients.screen}`}>
      <div className={`${layouts.header} ${gradients.header}`}>
        {!isAvailable && (
          <button onClick={onBack} className="mr-3">
            <ArrowLeft size={20} className="text-white" />
          </button>
        )}
        <h1 className="text-2xl font-bold">{title}</h1>
      </div>

      <div className={layouts.content}>
        {/* Loading State */}
        {accountsLoading && (
          <div className="flex items-center justify-center py-8">
            <div className="text-gray-400 text-sm">Loading accounts...</div>
          </div>
        )}

        {/* Error State */}
        {accountsError && !accountsLoading && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
            <p className="text-red-400 text-sm">{accountsError}</p>
            <button
              onClick={onRetry}
              className="mt-2 text-red-400 text-sm underline"
            >
              Retry
            </button>
          </div>
        )}

        {/* Accounts List */}
        {!accountsLoading && !accountsError && filteredAccounts.length > 0 && (
          <div className={layouts.listContainer}>
            {filteredAccounts.map((account) => {
              const color = getAccountColor(account.account_currency, account.account_name);
              const Icon = getAccountIcon(account.account_currency, account.account_name);

              return (
                <div
                  key={account.account_id}
                  onClick={() => onSelectAccount(account.account_name, account.account_id, account.account_currency, account.user_name)}
                  className={`${cardStyles.listItem} flex items-center`}
                >
                  <div
                    className={cardStyles.iconBase}
                    style={{ backgroundColor: `${color}20` }}
                  >
                    <Icon size={20} style={{ color }} />
                  </div>
                  <div className={cardStyles.textWrapper}>
                    <h3 className="font-medium text-white text-sm leading-tight">{account.account_name}</h3>
                    <p className="text-xs text-gray-400 mt-0.5 leading-tight">
                      Used {account.usage_count} • {formatCurrency(account.current_balance, account.account_currency)}
                    </p>
                  </div>
                  <ChevronRight size={16} className={cardStyles.chevron} />
                </div>
              );
            })}
          </div>
        )}

        {/* Empty State */}
        {!accountsLoading && !accountsError && filteredAccounts.length === 0 && (
          <div className="flex flex-col items-center justify-center py-8">
            <CreditCard size={48} className="text-gray-600 mb-3" />
            <p className="text-gray-400 text-sm">No accounts found</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AccountsScreen;
