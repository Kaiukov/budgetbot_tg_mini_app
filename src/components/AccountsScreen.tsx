import { ArrowLeft, ChevronRight, CreditCard } from 'lucide-react';
import type { AccountUsage } from '../services/sync';
import { getAccountIcon, getAccountColor } from '../utils/accounts';
import { formatCurrency } from '../utils/formatCurrency';

interface AccountsScreenProps {
  accounts: AccountUsage[];
  accountsLoading: boolean;
  accountsError: string | null;
  onBack: () => void;
  onSelectAccount: (accountName: string) => void;
  onRetry: () => void;
}

const AccountsScreen: React.FC<AccountsScreenProps> = ({
  accounts,
  accountsLoading,
  accountsError,
  onBack,
  onSelectAccount,
  onRetry
}) => {
  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="flex items-center px-3 py-3 border-b border-gray-800">
        <button onClick={onBack} className="mr-3">
          <ArrowLeft size={20} className="text-white" />
        </button>
        <h2 className="text-base font-semibold">Select Account</h2>
      </div>

      <div className="p-3">
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
        {!accountsLoading && !accountsError && accounts.length > 0 && (
          <div className="space-y-0">
            {accounts.map((account, idx) => {
              const color = getAccountColor(account.account_currency, account.account_name);
              const Icon = getAccountIcon(account.account_currency, account.account_name);

              return (
                <div
                  key={`${account.account_name}-${idx}`}
                  onClick={() => onSelectAccount(account.account_name)}
                  className="bg-gray-800 border-b border-gray-700 last:border-b-0 px-3 py-3 hover:bg-gray-750 transition cursor-pointer active:bg-gray-700 flex items-center"
                >
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center mr-3"
                    style={{ backgroundColor: `${color}20` }}
                  >
                    <Icon size={20} style={{ color }} />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium text-white text-sm leading-tight">{account.account_name}</h3>
                    <p className="text-xs text-gray-400 mt-0.5 leading-tight">
                      Used {account.usage_count} times • {account.user_name || account.owner || 'Unknown'} • {formatCurrency(account.current_balance, account.account_currency)}
                    </p>
                  </div>
                  <ChevronRight size={16} className="text-gray-500" />
                </div>
              );
            })}
          </div>
        )}

        {/* Empty State */}
        {!accountsLoading && !accountsError && accounts.length === 0 && (
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
