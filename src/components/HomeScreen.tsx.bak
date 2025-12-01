import { useState, useEffect } from 'react';
import { Search, TrendingDown, TrendingUp, DollarSign, CreditCard, Home, Heart, ChevronRight, Bug, ArrowRightLeft } from 'lucide-react';
import { syncService } from '../services/sync';
import type { DisplayTransaction } from '../types/transaction';
import { fetchTransactions } from '../services/sync/index';
import { transactionCache, TRANSACTION_CACHE_KEYS } from '../utils/cache';
import TransactionCard from './TransactionCard';

interface HomeScreenProps {
  userFullName: string;        // Full name for display (e.g., "Oleksandr 🇺🇦 Kaiukov")
  userPhotoUrl: string | null;
  userInitials: string;
  userBio: string;
  isAvailable: boolean;
  onNavigate: (screen: string) => void;
}

const features = [
  { title: 'Accounts', desc: 'Manage multiple accounts', icon: CreditCard, color: '#6366F1' },
  { title: 'Categories', desc: 'Organize transactions', icon: Home, color: '#8B5CF6' },
  { title: 'Reports', desc: 'Analyze your finances', icon: DollarSign, color: '#F59E0B' },
  { title: 'Budget', desc: 'Plan your spending', icon: Heart, color: '#EC4899' },
  { title: 'Debug', desc: 'System diagnostics', icon: Bug, color: '#6B7280', route: 'debug' }
];

const HomeScreen: React.FC<HomeScreenProps> = ({
  userFullName,
  userPhotoUrl,
  userInitials,
  userBio,
  isAvailable,
  onNavigate
}) => {
  const [latestTransactions, setLatestTransactions] = useState<DisplayTransaction[]>([]);
  const [loadingTransactions, setLoadingTransactions] = useState(false);
  const [totalBalance, setTotalBalance] = useState(0);

  useEffect(() => {
    const fetchBalance = async () => {
      try {
        const balance = await syncService.fetchCurrentBalance();
        setTotalBalance(balance);
      } catch (error) {
        console.warn('Failed to fetch total balance:', error);
      }
    };

    if (isAvailable) {
      fetchBalance();
    }
  }, [isAvailable]);

  // Fetch latest 10 transactions on component mount with caching
  useEffect(() => {
    const loadLatestTransactions = async () => {
      setLoadingTransactions(true);

      // Try cache first
      const cached = transactionCache.get(TRANSACTION_CACHE_KEYS.HOME_LATEST);
      if (cached) {
        setLatestTransactions(cached);
        setLoadingTransactions(false);
        return;
      }

      // Cache miss - fetch from API
      try {
        const result = await fetchTransactions(1, 10);
        if (!result.error) {
          setLatestTransactions(result.transactions);
          transactionCache.set(TRANSACTION_CACHE_KEYS.HOME_LATEST, result.transactions);
        }
      } catch (error) {
        console.warn('Failed to load latest transactions:', error);
      } finally {
        setLoadingTransactions(false);
      }
    };

    if (isAvailable) {
      loadLatestTransactions();
    }
  }, [isAvailable]);

  return (
    <div className="min-h-screen text-white">
      <div className="flex flex-col items-center pt-8 pb-6 px-4">
        {/* User Avatar */}
        <div className="w-20 h-20 bg-gradient-to-br from-amber-500 to-orange-600 rounded-full flex items-center justify-center mb-3 shadow-lg shadow-amber-500/30">
          {userPhotoUrl ? (
            <img
              src={userPhotoUrl}
              alt={userFullName}
              className="w-20 h-20 rounded-full object-cover"
            />
          ) : (
            <span className="text-white text-3xl font-semibold">{userInitials}</span>
          )}
        </div>

        {/* Title with Gradient Text */}
        <h1 className="text-2xl font-bold text-white mb-1 bg-gradient-to-r from-amber-400 to-orange-400 bg-clip-text text-transparent">
          {userFullName}
        </h1>
        <p className="text-xs text-gray-400 text-center px-4 mt-1">
          {isAvailable ? userBio : 'Browser Mode - Limited Features'}
        </p>
      </div>

      {/* Balance Card */}
      <div className="px-4 mb-4">
        <div
          className="bg-gradient-to-r from-emerald-500/20 to-teal-500/20 backdrop-blur-sm border border-emerald-500/30 rounded-2xl px-6 py-3 cursor-pointer hover:scale-105 transition-transform shadow-lg shadow-emerald-500/10"
        >
          <div className="flex items-center justify-center">
            <span className="text-xs text-gray-300 mr-2">Total Balance:</span>
            <span className="text-lg font-bold text-emerald-400">
              {totalBalance.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
            </span>
            <TrendingUp size={16} className="text-emerald-400 ml-1.5" />
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="px-4 mb-4">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="Search features..."
            className="w-full pl-12 pr-4 py-3 text-sm bg-slate-800/50 backdrop-blur-sm text-white rounded-xl border border-slate-700/50 focus:ring-2 focus:ring-amber-500/50 outline-none placeholder-gray-500 transition"
          />
        </div>
      </div>

      {/* Quick Actions */}
      <div className="px-4 mb-4">
        <h2 className="text-sm font-semibold mb-3 text-gray-300 px-1">Quick Actions</h2>
        <div className="grid grid-cols-3 gap-2">
          {/* Expense Card */}
          <div
            onClick={() => onNavigate('accounts')}
            className="bg-slate-800/40 backdrop-blur-sm border border-slate-700/50 rounded-xl px-3 py-3.5 hover:bg-slate-800/60 hover:border-slate-600 transition-all cursor-pointer active:scale-98 flex flex-col items-center justify-center shadow-sm"
            style={{
              boxShadow: '0 4px 12px rgba(239, 68, 68, 0.08)'
            }}
          >
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center mb-2 shadow-md"
              style={{
                backgroundColor: '#EF444420'
              }}
            >
              <TrendingDown size={20} style={{ color: '#EF4444' }} />
            </div>
            <span className="text-xs font-medium text-white text-center">Withdrawal</span>
          </div>

          {/* Income Card */}
          <div
            onClick={() => onNavigate('income-accounts')}
            className="bg-slate-800/40 backdrop-blur-sm border border-slate-700/50 rounded-xl px-3 py-3.5 hover:bg-slate-800/60 hover:border-slate-600 transition-all cursor-pointer active:scale-98 flex flex-col items-center justify-center shadow-sm"
            style={{
              boxShadow: '0 4px 12px rgba(16, 185, 129, 0.08)'
            }}
          >
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center mb-2 shadow-md"
              style={{
                backgroundColor: '#10B98120'
              }}
            >
              <TrendingUp size={20} style={{ color: '#10B981' }} />
            </div>
            <span className="text-xs font-medium text-white text-center">Income</span>
          </div>

          {/* Transfer Card */}
          <div
            onClick={() => onNavigate('transfer-source-accounts')}
            className="bg-slate-800/40 backdrop-blur-sm border border-slate-700/50 rounded-xl px-3 py-3.5 hover:bg-slate-800/60 hover:border-slate-600 transition-all cursor-pointer active:scale-98 flex flex-col items-center justify-center shadow-sm"
            style={{
              boxShadow: '0 4px 12px rgba(59, 130, 246, 0.08)'
            }}
          >
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center mb-2 shadow-md"
              style={{
                backgroundColor: '#3B82F620'
              }}
            >
              <ArrowRightLeft size={20} style={{ color: '#3B82F6' }} />
            </div>
            <span className="text-xs font-medium text-white text-center">Transfer</span>
          </div>
        </div>
      </div>

      {/* Transactions */}
      <div className="px-4 mb-6">
        <div className="flex items-center justify-between mb-3 px-1">
          <h2 className="text-sm font-semibold text-gray-300">Transactions</h2>
          {latestTransactions.length > 0 && (
            <button
              onClick={() => onNavigate('transactions')}
              className="text-xs font-medium text-blue-400 hover:text-blue-300 transition-colors"
            >
              View all
            </button>
          )}
        </div>

        {/* Loading State */}
        {loadingTransactions && (
          <div className="space-y-2">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="h-20 bg-slate-800/40 border border-slate-700/50 rounded-xl animate-pulse"
              />
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loadingTransactions && latestTransactions.length === 0 && (
          <div className="bg-slate-800/40 backdrop-blur-sm border border-slate-700/50 rounded-xl px-4 py-6 text-center">
            <p className="text-sm text-gray-400">No transactions yet</p>
            <p className="text-xs text-gray-500 mt-1">Start by creating your first transaction</p>
          </div>
        )}

        {/* Transactions List */}
        {!loadingTransactions && latestTransactions.length > 0 && (
          <div className="space-y-2">
            {latestTransactions.slice(0, 10).map((transaction) => (
              <TransactionCard
                key={transaction.id}
                transaction={transaction}
                onClick={() => {
                  onNavigate('transaction-detail');
                  // Store selected transaction ID in sessionStorage for navigation
                  sessionStorage.setItem('selectedTransactionId', transaction.id);
                }}
              />
            ))}
          </div>
        )}
      </div>

      {/* Features */}
      <div className="px-4">
        <h2 className="text-sm font-semibold mb-3 text-gray-300 px-1">My Features</h2>

        <div className="space-y-2">
          {features.map((feature, idx) => {
            const Icon = feature.icon;
            return (
              <div
                key={idx}
                onClick={() => feature.route && onNavigate(feature.route)}
                className="bg-slate-800/40 backdrop-blur-sm border border-slate-700/50 rounded-xl px-4 py-3.5 hover:bg-slate-800/60 hover:border-slate-600 transition-all cursor-pointer active:scale-98 flex items-center shadow-sm"
                style={{
                  boxShadow: feature.route ? `0 4px 12px ${feature.color}15` : 'none'
                }}
              >
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center mr-3.5 flex-shrink-0 shadow-md"
                  style={{
                    backgroundColor: `${feature.color}20`
                  }}
                >
                  <Icon size={20} style={{ color: feature.color }} />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-white text-sm leading-tight mb-0.5">{feature.title}</h3>
                  <p className="text-xs text-gray-400 truncate leading-tight">{feature.desc}</p>
                </div>
                {feature.route && <ChevronRight size={18} className="text-gray-500 flex-shrink-0 ml-2" />}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default HomeScreen;
