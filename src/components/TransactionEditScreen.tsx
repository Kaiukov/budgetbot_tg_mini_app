/**
 * Transaction Edit Screen
 * Allows editing transaction details
 * Supports editing: date, amount, description
 */

import { useState, useEffect } from 'react';
import { AlertCircle, Save, Loader, ArrowLeft } from 'lucide-react';
import telegramService from '../services/telegram';
import { fireflyService } from '../services/firefly/firefly';
import type { TransactionData, DisplayTransaction } from '../types/transaction';
import { formatTransactionDate } from '../utils/transactionHelpers';
import { refreshHomeTransactionCache } from '../utils/cache';

interface TransactionEditScreenProps {
  transaction: DisplayTransaction;
  rawData: TransactionData;
  onBack: () => void;
  onSuccess: () => void;
  isAvailable: boolean;
}

const TransactionEditScreen: React.FC<TransactionEditScreenProps> = ({
  transaction,
  rawData,
  onBack,
  onSuccess,
  isAvailable,
}) => {
  const [formData, setFormData] = useState({
    date: transaction.date.split('T')[0], // ISO date format YYYY-MM-DD
    amount: transaction.amount.toString(),
    description: transaction.description || '',
  });

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    // Setup Telegram back button
    if (isAvailable && telegramService.isAvailable()) {
      telegramService.showBackButton(onBack);
    } else if (isAvailable) {
      telegramService.hideBackButton();
    }

    // Cleanup: hide back button when leaving this screen
    return () => {
      if (telegramService.isAvailable()) {
        telegramService.hideBackButton();
      }
    };
  }, [isAvailable, onBack]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    setError(null);
  };

  const handleSave = async () => {
    // Validation
    if (!formData.date) {
      setError('Date is required');
      return;
    }

    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      setError('Amount must be greater than 0');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      // Prepare update payload - must include all fields
      // Preserve time from original transaction when date is edited
      const originalDate = new Date(rawData.date);
      const editedDate = new Date(formData.date);
      editedDate.setHours(
        originalDate.getHours(),
        originalDate.getMinutes(),
        originalDate.getSeconds(),
        originalDate.getMilliseconds()
      );

      const payload = {
        transactions: [
          {
            type: rawData.type as 'withdrawal' | 'deposit' | 'transfer',
            date: editedDate.toISOString(),
            amount: formData.amount,
            description: formData.description,
            currency_code: rawData.currency_code,
            source_name: rawData.source_name,
            destination_name: rawData.destination_name,
            category_name: rawData.category_name,
            notes: rawData.notes,
            tags: rawData.tags,
            reconciled: rawData.reconciled,
            ...(rawData.foreign_currency_code && {
              foreign_currency_code: rawData.foreign_currency_code,
              foreign_amount: rawData.foreign_amount,
            }),
          },
        ],
      };

      const response = await fireflyService.putRequest(
        `/api/v1/transactions/${transaction.journalId}`,
        payload
      );

      if (!response.success) {
        setError(response.error || 'Failed to update transaction');
        return;
      }

      // Proactively refresh transaction cache
      await refreshHomeTransactionCache();

      setSuccess(true);
      setTimeout(() => {
        onSuccess();
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update transaction');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen text-white">
      {/* Header */}
      <div className="flex items-center justify-between pt-8 pb-6 px-4">
        {!isAvailable && (
          <button onClick={onBack} className="mr-3">
            <ArrowLeft size={20} className="text-white" />
          </button>
        )}
        <h1 className="text-2xl font-bold">Edit Transaction</h1>
      </div>

      {/* Success Message */}
      {success && (
        <div className="mx-4 mb-4 bg-green-500/10 border border-green-500/30 rounded-lg px-4 py-3 flex items-start gap-3">
          <div className="w-5 h-5 rounded-full bg-green-500/30 flex items-center justify-center flex-shrink-0 mt-0.5">
            <div className="w-2 h-2 rounded-full bg-green-400" />
          </div>
          <div>
            <p className="text-sm font-medium text-green-400">Transaction updated successfully!</p>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="mx-4 mb-4 bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-3 flex items-start gap-3">
          <AlertCircle size={20} className="text-red-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-red-400">Error</p>
            <p className="text-xs text-red-300/70 mt-1">{error}</p>
          </div>
        </div>
      )}

      {/* Form */}
      <div className="px-4 space-y-4 pb-6">
        {/* Date Field */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Date</label>
          <input
            type="date"
            name="date"
            value={formData.date}
            onChange={handleInputChange}
            disabled={saving}
            className="w-full bg-slate-800/50 border border-slate-700/50 text-white rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500/50 disabled:opacity-50"
          />
          <p className="text-xs text-gray-500 mt-1">
            Current: {formatTransactionDate(transaction.date)}
          </p>
        </div>

        {/* Amount Field */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Amount ({transaction.currency})
          </label>
          <input
            type="number"
            name="amount"
            value={formData.amount}
            onChange={handleInputChange}
            disabled={saving}
            step="0.01"
            min="0"
            className="w-full bg-slate-800/50 border border-slate-700/50 text-white rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500/50 disabled:opacity-50"
          />
          <p className="text-xs text-gray-500 mt-1">Must be greater than 0</p>
        </div>

        {/* Description Field */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Description</label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            disabled={saving}
            rows={3}
            placeholder="Enter transaction description..."
            className="w-full bg-slate-800/50 border border-slate-700/50 text-white rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500/50 disabled:opacity-50 resize-none"
          />
        </div>

        {/* Read-only Fields */}
        <div className="bg-slate-800/40 border border-slate-700/50 rounded-xl px-4 py-3 space-y-2">
          <p className="text-xs text-gray-400 font-medium mb-3">Transaction Details (Read-only)</p>

          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-400">Type</span>
            <span className="text-sm font-medium text-white capitalize">{transaction.type}</span>
          </div>

          {transaction.type === 'expense' && (
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-400">From Account</span>
              <span className="text-sm font-medium text-white">{transaction.sourceName}</span>
            </div>
          )}

          {transaction.type === 'income' && (
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-400">To Account</span>
              <span className="text-sm font-medium text-white">{transaction.destinationName}</span>
            </div>
          )}

          {transaction.type === 'transfer' && (
            <>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-400">From</span>
                <span className="text-sm font-medium text-white">{transaction.sourceName}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-400">To</span>
                <span className="text-sm font-medium text-white">{transaction.destinationName}</span>
              </div>
            </>
          )}

          {transaction.categoryName && (
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-400">Category</span>
              <span className="text-sm font-medium text-white">{transaction.categoryName}</span>
            </div>
          )}
        </div>

        {/* Note about API requirements */}
        <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl px-4 py-3">
          <p className="text-xs text-blue-400 leading-relaxed">
            ℹ️ You can edit the date, amount, and description. Other transaction details are locked
            to maintain data integrity.
          </p>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="px-4 pb-6 space-y-2 border-t border-slate-700/50 pt-6">
        <button
          onClick={handleSave}
          disabled={saving || !isAvailable}
          className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl px-4 py-3 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? (
            <>
              <Loader size={18} className="animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save size={18} />
              Save Changes
            </>
          )}
        </button>

        <button
          onClick={onBack}
          disabled={saving}
          className="w-full bg-slate-800/40 border border-slate-700/50 text-white rounded-xl px-4 py-3 font-medium hover:bg-slate-800/60 transition-colors disabled:opacity-50"
        >
          Cancel
        </button>
      </div>
    </div>
  );
};

export default TransactionEditScreen;
