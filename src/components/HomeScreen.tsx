import { Search, TrendingDown, TrendingUp, DollarSign, CreditCard, Home, Heart, ChevronRight, Bug } from 'lucide-react';

interface HomeScreenProps {
  userFullName: string;        // Full name for display (e.g., "Oleksandr 🇺🇦 Kaiukov")
  userPhotoUrl: string | null;
  userInitials: string;
  userBio: string;
  isAvailable: boolean;
  onNavigate: (screen: string) => void;
}

const features = [
  { title: 'Expenses', desc: 'Track daily expenses', icon: TrendingDown, color: '#EF4444', route: 'accounts' },
  { title: 'Income', desc: 'Record income sources', icon: TrendingUp, color: '#10B981', route: 'income-accounts' },
  { title: 'Accounts', desc: 'Manage multiple accounts', icon: CreditCard, color: '#3B82F6' },
  { title: 'Categories', desc: 'Organize transactions', icon: Home, color: '#8B5CF6' },
  { title: 'Reports', desc: 'Analyze your finances', icon: DollarSign, color: '#F59E0B' },
  { title: 'Budget', desc: 'Plan your spending', icon: Heart, color: '#EC4899' }
];

const HomeScreen: React.FC<HomeScreenProps> = ({
  userFullName,
  userPhotoUrl,
  userInitials,
  userBio,
  isAvailable,
  onNavigate
}) => {
  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="flex flex-col items-center pt-6 pb-4 px-4">
        {/* User Avatar */}
        {userPhotoUrl ? (
          <img
            src={userPhotoUrl}
            alt={userFullName}
            className="w-16 h-16 rounded-full mb-2.5 object-cover border-2 border-blue-500"
          />
        ) : (
          <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center mb-2.5">
            <span className="text-white text-xl font-semibold">{userInitials}</span>
          </div>
        )}

        <h1 className="text-lg font-semibold text-white mb-0.5">
          {userFullName}
        </h1>
        <p className="text-xs text-gray-400 text-center px-4">
          {isAvailable ? userBio : 'Browser Mode - Limited Features'}
        </p>
      </div>

      <div className="px-3 mb-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" size={16} />
          <input
            type="text"
            placeholder="Search"
            className="w-full pl-10 pr-3 py-2.5 text-sm bg-gray-800 text-white rounded-lg border-none focus:ring-1 focus:ring-gray-700 outline-none placeholder-gray-500"
          />
        </div>
      </div>

      <div className="px-3">
        <h2 className="text-sm font-semibold mb-2 text-white px-1">My Features</h2>

        <div className="space-y-0">
          {features.map((feature, idx) => {
            const Icon = feature.icon;
            return (
              <div
                key={idx}
                onClick={() => feature.route && onNavigate(feature.route)}
                className="bg-gray-800 border-b border-gray-700 last:border-b-0 px-3 py-3 hover:bg-gray-750 transition cursor-pointer active:bg-gray-700 flex items-center"
              >
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center mr-3 flex-shrink-0"
                  style={{ backgroundColor: `${feature.color}20` }}
                >
                  <Icon size={20} style={{ color: feature.color }} />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-white text-sm leading-tight">{feature.title}</h3>
                  <p className="text-xs text-gray-400 mt-0.5 truncate leading-tight">{feature.desc}</p>
                </div>
                <ChevronRight size={16} className="text-gray-500 flex-shrink-0 ml-2" />
              </div>
            );
          })}
        </div>
      </div>

      {/* Debug Button */}
      <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 w-full max-w-md px-3">
        <button
          onClick={() => onNavigate('debug')}
          className="w-full bg-gray-800 border border-gray-700 text-gray-300 py-3 rounded-lg font-medium hover:bg-gray-700 transition active:scale-98 flex items-center justify-center gap-2"
        >
          <Bug size={18} />
          <span>Debug</span>
        </button>
      </div>
    </div>
  );
};

export default HomeScreen;
