/**
 * Transactions List Screen
 * Displays paginated list of transactions (20 per page)
 * Supports navigation between pages
 */

import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, AlertCircle } from 'lucide-react';
import telegramService from '../services/telegram';
import { fetchTransactions } from '../services/sync/index';
import type { DisplayTransaction, PaginationMeta } from '../types/transaction';
import TransactionCard from './TransactionCard';
import { layouts, gradients } from '../theme/dark';

interface TransactionsListScreenProps {
  onBack: () => void;
  onSelectTransaction: (transactionId: string) => void;
  isAvailable: boolean;
}

const TransactionsListScreen: React.FC<TransactionsListScreenProps> = ({
  onBack,
  onSelectTransaction,
  isAvailable,
}) => {
  const [transactions, setTransactions] = useState<DisplayTransaction[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta>({
    total: 0,
    count: 0,
    per_page: 20,
    current_page: 1,
    total_pages: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const LIMIT = 20;

  // Setup Telegram back button and fetch transactions on mount/page change
  useEffect(() => {
    const loadTransactions = async () => {
      setLoading(true);
      setError(null);

      const result = await fetchTransactions(pagination.current_page, LIMIT);

      if (result.error) {
        setError(result.error);
        setTransactions([]);
      } else {
        setTransactions(result.transactions);
        setPagination(result.pagination);
      }

      setLoading(false);
    };

    // Setup Telegram back button
    if (isAvailable && telegramService.isAvailable()) {
      telegramService.showBackButton(onBack);
    } else if (isAvailable) {
      // No Telegram SDK available, ensure button is hidden
      telegramService.hideBackButton();
    }

    if (isAvailable) {
      loadTransactions();
    }

    // Cleanup: hide back button when leaving this screen
    return () => {
      if (telegramService.isAvailable()) {
        telegramService.hideBackButton();
      }
    };
  }, [pagination.current_page, isAvailable, onBack]);

  const handlePreviousPage = () => {
    if (pagination.current_page > 1) {
      setPagination((prev) => ({
        ...prev,
        current_page: prev.current_page - 1,
      }));
    }
  };

  const handleNextPage = () => {
    if (pagination.current_page < pagination.total_pages) {
      setPagination((prev) => ({
        ...prev,
        current_page: prev.current_page + 1,
      }));
    }
  };

  return (
    <div className={`${layouts.screen} ${gradients.screen}`}>
      {/* Header */}
      <div className={layouts.headerLarge}>
        <h1 className="text-2xl font-bold">All Transactions</h1>
      </div>

      {/* Error State */}
      {error && (
        <div className="mx-4 mb-4 bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-3 flex items-start gap-3">
          <AlertCircle size={20} className="text-red-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-red-400">Failed to load transactions</p>
            <p className="text-xs text-red-300/70 mt-1">{error}</p>
          </div>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="px-4 space-y-3">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className="h-24 bg-slate-800/40 border border-slate-700/50 rounded-xl animate-pulse"
            />
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && transactions.length === 0 && (
        <div className="px-4 py-12 text-center">
          <p className="text-gray-400 mb-2">No transactions found</p>
          <p className="text-sm text-gray-500">Start by creating your first transaction</p>
        </div>
      )}

      {/* Transactions List */}
      {!loading && !error && transactions.length > 0 && (
        <div className="px-4 pb-6">
          <div className="space-y-2">
            {transactions.map((transaction) => (
              <TransactionCard
                key={transaction.id}
                transaction={transaction}
                onClick={() => onSelectTransaction(transaction.id)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Pagination Controls */}
      {!loading && !error && pagination.total_pages > 0 && (
        <div className="px-4 py-6 border-t border-slate-700/50">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm text-gray-400">
              Page {pagination.current_page} of {pagination.total_pages}
            </span>
            <span className="text-sm text-gray-400">
              {pagination.count} of {pagination.total} transactions
            </span>
          </div>

          {/* Pagination Buttons */}
          <div className="flex gap-2">
            <button
              onClick={handlePreviousPage}
              disabled={pagination.current_page <= 1}
              className="flex-1 flex items-center justify-center gap-2 bg-slate-800/40 backdrop-blur-sm border border-slate-700/50 rounded-xl px-4 py-3 hover:bg-slate-800/60 hover:border-slate-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft size={18} />
              <span className="text-sm font-medium">Previous</span>
            </button>

            <button
              onClick={handleNextPage}
              disabled={pagination.current_page >= pagination.total_pages}
              className="flex-1 flex items-center justify-center gap-2 bg-slate-800/40 backdrop-blur-sm border border-slate-700/50 rounded-xl px-4 py-3 hover:bg-slate-800/60 hover:border-slate-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span className="text-sm font-medium">Next</span>
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default TransactionsListScreen;
