import type { TransactionData } from '../hooks/useTransactionData';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { useState } from 'react';

interface ComposeDataDebugPanelProps {
  transactionData: TransactionData;
  title?: string;
}

const ComposeDataDebugPanel: React.FC<ComposeDataDebugPanelProps> = ({ transactionData, title = 'Compose Data' }) => {
  const [isExpanded, setIsExpanded] = useState(true);

  const fields = [
    { key: 'user_name', label: 'user_name', value: transactionData.username },
    { key: 'account_name', label: 'account_name', value: transactionData.account },
    { key: 'account_id', label: 'account_id', value: transactionData.account_id },
    { key: 'account_currency', label: 'account_currency', value: transactionData.account_currency },
    { key: 'amount', label: 'amount', value: transactionData.amount },
    { key: 'amount_eur', label: 'amount_eur', value: transactionData.amount_foreign },
    { key: 'category_id', label: 'category_id', value: transactionData.category },
    { key: 'category_name', label: 'category_name', value: '' },
    { key: 'destination_id', label: 'destination_id', value: '' },
    { key: 'destination_name', label: 'destination_name', value: '' },
    { key: 'date', label: 'date', value: '' },
    { key: 'budget_name', label: 'budget_name', value: '' },
  ];

  const filledCount = fields.filter(f => f.value).length;

  return (
    <div className="mt-4 bg-gray-900/50 border border-gray-700 rounded-lg overflow-hidden">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-4 py-2 flex items-center justify-between hover:bg-gray-800/50 transition"
      >
        <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
          🔍 Debug: {title} ({filledCount}/{fields.length})
        </span>
        {isExpanded ? (
          <ChevronUp size={16} className="text-gray-500" />
        ) : (
          <ChevronDown size={16} className="text-gray-500" />
        )}
      </button>

      {isExpanded && (
        <div className="px-4 py-3 space-y-2 bg-gray-950/50 border-t border-gray-700">
          {fields.map((field) => {
            const isFilled = !!field.value;
            return (
              <div key={field.key} className="flex items-center justify-between text-xs">
                <span className={isFilled ? 'text-gray-300' : 'text-gray-500'}>
                  {field.label}:
                </span>
                <span className={`font-mono ${isFilled ? 'text-green-400' : 'text-gray-600'}`}>
                  {isFilled ? `"${field.value}"` : '—'}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ComposeDataDebugPanel;
