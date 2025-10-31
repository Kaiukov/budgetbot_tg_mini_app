import { Search, TrendingDown, TrendingUp, DollarSign, CreditCard, Home, Heart, ChevronRight, Bug, ArrowRightLeft } from 'lucide-react';
import type { AccountUsage } from '../services/sync';

interface HomeScreenProps {
  userFullName: string;        // Full name for display (e.g., "Oleksandr 🇺🇦 Kaiukov")
  userPhotoUrl: string | null;
  userInitials: string;
  userBio: string;
  isAvailable: boolean;
  accounts?: AccountUsage[];   // Optional accounts for balance calculation
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
  accounts = [],
  onNavigate
}) => {
  // Calculate total balance from accounts
  const getTotalBalance = () => {
    if (!accounts || accounts.length === 0) return 0;
    return accounts.reduce((sum, account) => sum + account.current_balance, 0);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-950 via-purple-950/30 to-indigo-950 text-white">
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
        <h1 className="text-xl font-bold text-white mb-1 bg-gradient-to-r from-amber-400 to-orange-400 bg-clip-text text-transparent">
          Budget Manager
        </h1>
        <p className="text-xs text-gray-400 text-center">
          {userFullName}
        </p>
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
            <span className="text-lg font-bold text-emerald-400">{getTotalBalance().toLocaleString()} ₴</span>
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
            <span className="text-xs font-medium text-white text-center">Expense</span>
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
