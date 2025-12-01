/**
 * Reusable Transaction Card Component
 * Displays a single transaction in a card format
 * Supports income, withdrawal, and transfer transactions
 */

import { TrendingDown, TrendingUp, ArrowRightLeft, ChevronRight } from 'lucide-react';
import type { DisplayTransaction } from '../types/transaction';
import {
  formatTransactionForDisplay,
  getTransactionIcon,
  shouldShowForeignAmount,
} from '../utils/transactionHelpers';

interface TransactionCardProps {
  transaction: DisplayTransaction;
  onClick?: () => void;
}

const TransactionCard: React.FC<TransactionCardProps> = ({ transaction, onClick }) => {
  const displayData = formatTransactionForDisplay(transaction);
  const icon = getTransactionIcon(displayData.type);

  // Select appropriate icon component
  let IconComponent: React.FC<any>;
  switch (displayData.type) {
    case 'income':
      IconComponent = TrendingUp;
      break;
    case 'withdrawal':
      IconComponent = TrendingDown;
      break;
    case 'transfer':
      IconComponent = ArrowRightLeft;
      break;
    default:
      IconComponent = TrendingDown;
  }

  return (
    <div
      onClick={onClick}
      className="bg-slate-800/40 backdrop-blur-sm border border-slate-700/50 rounded-xl px-4 py-3.5 hover:bg-slate-800/60 hover:border-slate-600 transition-all cursor-pointer active:scale-98 flex items-center shadow-sm"
      style={{
        boxShadow: `0 4px 12px ${icon.color}15`,
      }}
    >
      {/* Icon Container */}
      <div
        className="w-12 h-12 rounded-xl flex items-center justify-center mr-3.5 flex-shrink-0 shadow-md"
        style={{
          backgroundColor: icon.bgColor,
        }}
      >
        <IconComponent size={20} style={{ color: icon.color }} />
      </div>

      {/* Content Container */}
      <div className="flex-1 min-w-0">
        {/* Transfer: Show both accounts in two lines */}
        {displayData.type === 'transfer' ? (
          <>
            <h3 className="font-semibold text-white text-sm leading-tight truncate">
              {displayData.label}
            </h3>
            <p className="text-xs text-gray-400 truncate leading-tight">
              {displayData.secondaryLabel}
            </p>
            <p className="text-xs text-gray-500 mt-1">{displayData.date}</p>
          </>
        ) : (
          <>
            {/* Primary Label (Category, Account) */}
            <h3 className="font-semibold text-white text-sm leading-tight mb-0.5 truncate">
              {displayData.label}
            </h3>

            {/* Secondary Label (Description/Comment) */}
            <p className="text-xs text-gray-400 truncate leading-tight">
              {displayData.secondaryLabel}
            </p>

            {/* Date */}
            <p className="text-xs text-gray-500 mt-1">{displayData.date}</p>
          </>
        )}
      </div>

      {/* Amount Container */}
      <div className="flex flex-col items-end ml-3 flex-shrink-0">
        {/* Primary Amount */}
        <span
          className="text-sm font-semibold"
          style={{
            color:
              displayData.type === 'income'
                ? '#10B981'
                : displayData.type === 'withdrawal'
                  ? '#EF4444'
                  : '#3B82F6',
          }}
        >
          {displayData.amount}
        </span>

        {/* Foreign Amount (if applicable) */}
        {shouldShowForeignAmount(transaction) && displayData.foreignAmount && (
          <span className="text-xs text-gray-400 mt-0.5">{displayData.foreignAmount}</span>
        )}
      </div>

      {/* Chevron */}
      <ChevronRight size={18} className="text-gray-500 flex-shrink-0 ml-2" />
    </div>
  );
};

export default TransactionCard;
