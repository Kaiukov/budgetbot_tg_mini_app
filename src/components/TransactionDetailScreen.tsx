/**
 * Transaction Detail Screen
 * Displays complete information about a single transaction
 * Allows editing and deletion
 */

import { useState, useEffect } from 'react';
import { Edit, Trash2, AlertCircle, Loader, ArrowLeft } from 'lucide-react';
import telegramService from '../services/telegram';
import { fetchTransactionById } from '../services/sync/index';
import type { DisplayTransaction, TransactionData } from '../types/transaction';
import {
  formatTransactionForDisplay,
  shouldShowForeignAmount,
} from '../utils/transactionHelpers';
import TransactionCard from './TransactionCard';

interface TransactionDetailScreenProps {
  transactionId: string;
  onBack: () => void;
  onEdit: (transactionId: string, rawData: TransactionData) => void;
  onDelete: (transactionId: string) => void;
  isAvailable: boolean;
}

const TransactionDetailScreen: React.FC<TransactionDetailScreenProps> = ({
  transactionId,
  onBack,
  onEdit,
  onDelete,
  isAvailable,
}) => {
  const [transaction, setTransaction] = useState<DisplayTransaction | null>(null);
  const [rawData, setRawData] = useState<TransactionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const loadTransaction = async () => {
      setLoading(true);
      setError(null);

      const result = await fetchTransactionById(transactionId);

      if (result.error) {
        setError(result.error);
      } else {
        setTransaction(result.transaction || null);
        setRawData(result.rawData || null);
      }

      setLoading(false);
    };

    // Setup Telegram back button
    if (isAvailable && telegramService.isAvailable()) {
      telegramService.showBackButton(onBack);
    } else if (isAvailable) {
      telegramService.hideBackButton();
    }

    if (isAvailable) {
      loadTransaction();
    }

    // Cleanup: hide back button when leaving this screen
    return () => {
      if (telegramService.isAvailable()) {
        telegramService.hideBackButton();
      }
    };
  }, [transactionId, isAvailable, onBack]);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await onDelete(transactionId);
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen text-white flex items-center justify-center">
        <div className="text-center">
          <Loader size={32} className="animate-spin mx-auto mb-4 text-blue-400" />
          <p className="text-gray-300">Loading transaction...</p>
        </div>
      </div>
    );
  }

  if (error || !transaction || !rawData) {
    return (
      <div className="min-h-screen text-white">
        {/* Header */}
        <div className="flex items-center justify-between pt-8 pb-6 px-4">
          {!isAvailable && (
            <button onClick={onBack} className="mr-3">
              <ArrowLeft size={20} className="text-white" />
            </button>
          )}
          <h1 className="text-2xl font-bold">Transaction Details</h1>
        </div>

        {/* Error */}
        <div className="mx-4 bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-3 flex items-start gap-3">
          <AlertCircle size={20} className="text-red-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-red-400">Failed to load transaction</p>
            <p className="text-xs text-red-300/70 mt-1">{error || 'Transaction not found'}</p>
          </div>
        </div>
      </div>
    );
  }

  const displayData = formatTransactionForDisplay(transaction);

  return (
    <div className="min-h-screen text-white">
      {/* Header */}
      <div className="flex items-center justify-between pt-8 pb-6 px-4">
        {!isAvailable && (
          <button onClick={onBack} className="mr-3">
            <ArrowLeft size={20} className="text-white" />
          </button>
        )}
        <h1 className="text-2xl font-bold">Transaction Details</h1>
      </div>

      {/* Transaction Card Preview */}
      <div className="px-4 mb-6">
        <TransactionCard transaction={transaction} />
      </div>

      {/* Details Section */}
      <div className="px-4 space-y-4 mb-6">
        {/* Type */}
        <div className="bg-slate-800/40 backdrop-blur-sm border border-slate-700/50 rounded-xl px-4 py-3">
          <p className="text-xs text-gray-400 mb-1">Type</p>
          <p className="text-sm font-medium text-white capitalize">{displayData.type}</p>
        </div>

        {/* Date & Time */}
        <div className="bg-slate-800/40 backdrop-blur-sm border border-slate-700/50 rounded-xl px-4 py-3">
          <p className="text-xs text-gray-400 mb-1">Date & Time</p>
          <p className="text-sm font-medium text-white">
            {displayData.date}
            {displayData.time && <span className="text-gray-400 ml-2">{displayData.time}</span>}
          </p>
        </div>

        {/* Category/Account Info based on type */}
        {transaction.type === 'withdrawal' && (
          <>
            <div className="bg-slate-800/40 backdrop-blur-sm border border-slate-700/50 rounded-xl px-4 py-3">
              <p className="text-xs text-gray-400 mb-1">From Account</p>
              <p className="text-sm font-medium text-white">{transaction.source_name}</p>
            </div>

            <div className="bg-slate-800/40 backdrop-blur-sm border border-slate-700/50 rounded-xl px-4 py-3">
              <p className="text-xs text-gray-400 mb-1">Category</p>
              <p className="text-sm font-medium text-white">
                {transaction.category_name || 'Uncategorized'}
              </p>
            </div>
          </>
        )}

        {transaction.type === 'deposit' && (
          <>
            <div className="bg-slate-800/40 backdrop-blur-sm border border-slate-700/50 rounded-xl px-4 py-3">
              <p className="text-xs text-gray-400 mb-1">To Account</p>
              <p className="text-sm font-medium text-white">{transaction.destination_name}</p>
            </div>

            <div className="bg-slate-800/40 backdrop-blur-sm border border-slate-700/50 rounded-xl px-4 py-3">
              <p className="text-xs text-gray-400 mb-1">Category</p>
              <p className="text-sm font-medium text-white">
                {transaction.category_name || 'Uncategorized'}
              </p>
            </div>
          </>
        )}

        {transaction.type === 'transfer' && (
          <>
            <div className="bg-slate-800/40 backdrop-blur-sm border border-slate-700/50 rounded-xl px-4 py-3">
              <p className="text-xs text-gray-400 mb-1">From Account</p>
              <p className="text-sm font-medium text-white">{transaction.source_name}</p>
            </div>

            <div className="bg-slate-800/40 backdrop-blur-sm border border-slate-700/50 rounded-xl px-4 py-3">
              <p className="text-xs text-gray-400 mb-1">To Account</p>
              <p className="text-sm font-medium text-white">{transaction.destination_name}</p>
            </div>
          </>
        )}

        {/* Amount */}
        <div className="bg-slate-800/40 backdrop-blur-sm border border-slate-700/50 rounded-xl px-4 py-3">
          <p className="text-xs text-gray-400 mb-1">Amount</p>
          <div className="flex items-baseline gap-2">
            <p
              className="text-lg font-semibold"
              style={{
                color:
                  displayData.type === 'deposit'
                    ? '#10B981'
                    : displayData.type === 'withdrawal'
                      ? '#EF4444'
                      : '#3B82F6',
              }}
            >
              {displayData.amount}
            </p>
            {shouldShowForeignAmount(transaction) && displayData.amount_eur && (
              <p className="text-sm text-gray-400">{displayData.amount_eur}</p>
            )}
          </div>
        </div>

        {/* Description */}
        {transaction.description && (
          <div className="bg-slate-800/40 backdrop-blur-sm border border-slate-700/50 rounded-xl px-4 py-3">
            <p className="text-xs text-gray-400 mb-1">Description</p>
            <p className="text-sm font-medium text-white break-words">{transaction.description}</p>
          </div>
        )}

        {/* User/Tags */}
        <div className="bg-slate-800/40 backdrop-blur-sm border border-slate-700/50 rounded-xl px-4 py-3">
          <p className="text-xs text-gray-400 mb-1">Added by</p>
          <p className="text-sm font-medium text-white">{transaction.user_name}</p>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="px-4 pb-6 space-y-2">
        <button
          onClick={() => onEdit(transactionId, rawData)}
          className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl px-4 py-3 font-medium transition-colors"
        >
          <Edit size={18} />
          Edit Transaction
        </button>

        {!showDeleteConfirm ? (
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="w-full flex items-center justify-center gap-2 bg-red-600/20 hover:bg-red-600/30 text-red-400 border border-red-600/30 rounded-xl px-4 py-3 font-medium transition-colors"
          >
            <Trash2 size={18} />
            Delete Transaction
          </button>
        ) : (
          <div className="space-y-2">
            <p className="text-center text-sm text-red-400 font-medium">
              Are you sure? This cannot be undone.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 bg-slate-800/40 border border-slate-700/50 text-white rounded-xl px-4 py-3 font-medium hover:bg-slate-800/60 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white rounded-xl px-4 py-3 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {deleting && <Loader size={16} className="animate-spin" />}
                {deleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TransactionDetailScreen;
