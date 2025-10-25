import { useState, useEffect } from 'react';
import { Search, TrendingDown, TrendingUp, DollarSign, CreditCard, Home, ShoppingBag, Coffee, Car, Heart, MoreHorizontal, ArrowLeft, Check, X, ChevronRight, Bug, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { useTelegramUser } from './hooks/useTelegramUser';
import { fireflyService } from './services/firefly';

interface ServiceStatus {
  name: string;
  status: 'connected' | 'disconnected' | 'checking';
  message: string;
}

const BudgetMiniApp = () => {
  const [currentScreen, setCurrentScreen] = useState('home');
  const [showSuccess, setShowSuccess] = useState(false);
  const [expenseData, setExpenseData] = useState({
    account: '',
    amount: '',
    category: '',
    comment: ''
  });

  // Service status states
  const [serviceStatuses, setServiceStatuses] = useState<ServiceStatus[]>([
    { name: 'Telegram Bot', status: 'checking', message: 'Checking connection...' },
    { name: 'Health Connect Sync', status: 'checking', message: 'Checking connection...' },
    { name: 'Firefly API', status: 'checking', message: 'Checking connection...' }
  ]);

  // Get Telegram user data
  const { userName, userPhotoUrl, userInitials, userBio, isAvailable } = useTelegramUser();

  // Check service connections when debug screen is opened
  useEffect(() => {
    if (currentScreen === 'debug') {
      checkServiceConnections();
    }
  }, [currentScreen]);

  const checkServiceConnections = async () => {
    // Reset all to checking state
    setServiceStatuses([
      { name: 'Telegram Bot', status: 'checking', message: 'Checking connection...' },
      { name: 'Health Connect Sync', status: 'checking', message: 'Checking connection...' },
      { name: 'Firefly API', status: 'checking', message: 'Checking connection...' }
    ]);

    // Check Telegram Bot connection
    setTimeout(() => {
      setServiceStatuses(prev => prev.map(service =>
        service.name === 'Telegram Bot'
          ? {
              ...service,
              status: isAvailable ? 'connected' : 'disconnected',
              message: isAvailable
                ? 'Connected to Telegram Mini App'
                : 'Not running in Telegram environment'
            }
          : service
      ));
    }, 500);

    // Check Health Connect Sync (simulated)
    setTimeout(() => {
      setServiceStatuses(prev => prev.map(service =>
        service.name === 'Health Connect Sync'
          ? {
              ...service,
              status: 'disconnected',
              message: 'Service not configured yet'
            }
          : service
      ));
    }, 1000);

    // Check Firefly API (real check)
    setTimeout(async () => {
      try {
        const result = await fireflyService.checkConnection();
        setServiceStatuses(prev => prev.map(service =>
          service.name === 'Firefly API'
            ? {
                ...service,
                status: result.success ? 'connected' : 'disconnected',
                message: result.message
              }
            : service
        ));
      } catch (error) {
        setServiceStatuses(prev => prev.map(service =>
          service.name === 'Firefly API'
            ? {
                ...service,
                status: 'disconnected',
                message: error instanceof Error ? error.message : 'Connection failed'
              }
            : service
        ));
      }
    }, 1500);
  };

  const accounts = [
    { id: 'cash', name: 'Cash', balance: '5,240 ₴', icon: <DollarSign size={20} />, color: '#10B981' },
    { id: 'card', name: 'Privat Card', balance: '12,580 ₴', icon: <CreditCard size={20} />, color: '#3B82F6' },
    { id: 'savings', name: 'Savings', balance: '25,000 ₴', icon: <TrendingUp size={20} />, color: '#8B5CF6' }
  ];

  const categories = [
    { id: 'food', name: 'Food', icon: <ShoppingBag size={18} />, color: '#EF4444' },
    { id: 'cafe', name: 'Cafe', icon: <Coffee size={18} />, color: '#F59E0B' },
    { id: 'transport', name: 'Transport', icon: <Car size={18} />, color: '#3B82F6' },
    { id: 'home', name: 'Home', icon: <Home size={18} />, color: '#10B981' },
    { id: 'health', name: 'Health', icon: <Heart size={18} />, color: '#EC4899' },
    { id: 'other', name: 'Other', icon: <MoreHorizontal size={18} />, color: '#6B7280' }
  ];

  const suggestedComments = [
    'Groceries at store',
    'Lunch',
    'Taxi',
    'Utilities',
    'Medicine'
  ];

  const features = [
    { title: 'Expenses', desc: 'Track daily expenses', icon: <TrendingDown size={20} />, color: '#EF4444' },
    { title: 'Income', desc: 'Record income sources', icon: <TrendingUp size={20} />, color: '#10B981' },
    { title: 'Accounts', desc: 'Manage multiple accounts', icon: <CreditCard size={20} />, color: '#3B82F6' },
    { title: 'Categories', desc: 'Organize transactions', icon: <Home size={20} />, color: '#8B5CF6' },
    { title: 'Reports', desc: 'Analyze your finances', icon: <DollarSign size={20} />, color: '#F59E0B' },
    { title: 'Budget', desc: 'Plan your spending', icon: <Heart size={20} />, color: '#EC4899' }
  ];

  interface NumberPadProps {
    onNumberClick: (num: string) => void;
    onDelete: () => void;
    onConfirm?: () => void;
  }

  const NumberPad: React.FC<NumberPadProps> = ({ onNumberClick, onDelete, onConfirm: _onConfirm }) => {
    const buttons = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '.', '0', '←'];
    
    return (
      <div className="grid grid-cols-3 gap-1.5 mt-3">
        {buttons.map((btn) => (
          <button
            key={btn}
            onClick={() => {
              if (btn === '←') onDelete();
              else onNumberClick(btn);
            }}
            className="h-12 bg-gray-700 rounded-lg font-medium text-base text-gray-200 hover:bg-gray-600 active:scale-95 transition"
          >
            {btn === '←' ? '←' : btn}
          </button>
        ))}
      </div>
    );
  };

  const HomeScreen = () => (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="flex flex-col items-center pt-6 pb-4 px-4">
        {/* User Avatar */}
        {userPhotoUrl ? (
          <img
            src={userPhotoUrl}
            alt={userName}
            className="w-16 h-16 rounded-full mb-2.5 object-cover border-2 border-blue-500"
          />
        ) : (
          <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center mb-2.5">
            <span className="text-white text-xl font-semibold">{userInitials}</span>
          </div>
        )}

        <h1 className="text-lg font-semibold text-white mb-0.5">
          {userName}
        </h1>
        <p className="text-xs text-gray-400 text-center px-4">
          {isAvailable ? userBio : 'Browser Mode - Limited Features'}
        </p>

        {/* Debug info - remove after testing */}
        {isAvailable && (
          <div className="mt-2 text-[10px] text-gray-500 text-center px-4">
            Debug: photoUrl={userPhotoUrl ? 'yes' : 'no'} | available={String(isAvailable)}
          </div>
        )}
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
          {features.map((feature, idx) => (
            <div
              key={idx}
              onClick={() => feature.title === 'Expenses' && setCurrentScreen('accounts')}
              className="bg-gray-800 border-b border-gray-700 last:border-b-0 px-3 py-3 hover:bg-gray-750 transition cursor-pointer active:bg-gray-700 flex items-center"
            >
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center mr-3 flex-shrink-0"
                style={{ backgroundColor: `${feature.color}20` }}
              >
                <div style={{ color: feature.color }}>{feature.icon}</div>
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-medium text-white text-sm leading-tight">{feature.title}</h3>
                <p className="text-xs text-gray-400 mt-0.5 truncate leading-tight">{feature.desc}</p>
              </div>
              <ChevronRight size={16} className="text-gray-500 flex-shrink-0 ml-2" />
            </div>
          ))}
        </div>
      </div>

      {/* Debug Button */}
      <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 w-full max-w-md px-3">
        <button
          onClick={() => setCurrentScreen('debug')}
          className="w-full bg-gray-800 border border-gray-700 text-gray-300 py-3 rounded-lg font-medium hover:bg-gray-700 transition active:scale-98 flex items-center justify-center gap-2"
        >
          <Bug size={18} />
          <span>Debug</span>
        </button>
      </div>
    </div>
  );

  const AccountsScreen = () => (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="flex items-center px-3 py-3 border-b border-gray-800">
        <button onClick={() => setCurrentScreen('home')} className="mr-3">
          <ArrowLeft size={20} className="text-white" />
        </button>
        <h2 className="text-base font-semibold">Select Account</h2>
      </div>

      <div className="p-3 space-y-0">
        {accounts.map((account, _idx) => (
          <div
            key={account.id}
            onClick={() => {
              setExpenseData({ ...expenseData, account: account.name });
              setCurrentScreen('amount');
            }}
            className="bg-gray-800 border-b border-gray-700 last:border-b-0 px-3 py-3 hover:bg-gray-750 transition cursor-pointer active:bg-gray-700 flex items-center"
          >
            <div 
              className="w-10 h-10 rounded-full flex items-center justify-center mr-3"
              style={{ backgroundColor: `${account.color}20` }}
            >
              <div style={{ color: account.color }}>{account.icon}</div>
            </div>
            <div className="flex-1">
              <h3 className="font-medium text-white text-sm leading-tight">{account.name}</h3>
              <p className="text-xs text-gray-400 mt-0.5 leading-tight">{account.balance}</p>
            </div>
            <ChevronRight size={16} className="text-gray-500" />
          </div>
        ))}
      </div>
    </div>
  );

  const AmountScreen = () => (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="flex items-center px-3 py-3 border-b border-gray-800">
        <button onClick={() => setCurrentScreen('accounts')} className="mr-3">
          <ArrowLeft size={20} className="text-white" />
        </button>
        <h2 className="text-base font-semibold">Enter Amount</h2>
      </div>

      <div className="p-4">
        <div className="bg-gray-800 rounded-lg p-4 mb-3">
          <p className="text-xs text-gray-400 mb-2">Account: {expenseData.account}</p>
          <div className="text-3xl font-bold text-center py-4 text-white">
            {expenseData.amount || '0'} <span className="text-gray-500">₴</span>
          </div>
        </div>

        <NumberPad
          onNumberClick={(num: string) => {
            setExpenseData({ ...expenseData, amount: expenseData.amount + num });
          }}
          onDelete={() => {
            setExpenseData({ ...expenseData, amount: expenseData.amount.slice(0, -1) });
          }}
          onConfirm={() => {}}
        />

        <button
          onClick={() => expenseData.amount && setCurrentScreen('category')}
          disabled={!expenseData.amount}
          className="w-full mt-4 bg-blue-500 text-white py-3 rounded-lg text-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed hover:bg-blue-600 transition active:scale-98"
        >
          Next
        </button>
      </div>
    </div>
  );

  const CategoryScreen = () => (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="flex items-center px-3 py-3 border-b border-gray-800">
        <button onClick={() => setCurrentScreen('amount')} className="mr-3">
          <ArrowLeft size={20} className="text-white" />
        </button>
        <h2 className="text-base font-semibold">Select Category</h2>
      </div>

      <div className="p-3 space-y-0">
        {categories.map((cat) => (
          <div
            key={cat.id}
            onClick={() => {
              setExpenseData({ ...expenseData, category: cat.name });
              setCurrentScreen('comment');
            }}
            className="bg-gray-800 border-b border-gray-700 last:border-b-0 px-3 py-3 hover:bg-gray-750 transition cursor-pointer active:bg-gray-700 flex items-center"
          >
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center mr-3"
              style={{ backgroundColor: `${cat.color}20` }}
            >
              <div style={{ color: cat.color }}>{cat.icon}</div>
            </div>
            <h3 className="font-medium text-white text-sm flex-1 leading-tight">{cat.name}</h3>
            <ChevronRight size={16} className="text-gray-500" />
          </div>
        ))}
      </div>
    </div>
  );

  const CommentScreen = () => (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="flex items-center px-3 py-3 border-b border-gray-800">
        <button onClick={() => setCurrentScreen('category')} className="mr-3">
          <ArrowLeft size={20} className="text-white" />
        </button>
        <h2 className="text-base font-semibold">Comment</h2>
      </div>

      <div className="p-3">
        <textarea
          value={expenseData.comment}
          onChange={(e) => setExpenseData({ ...expenseData, comment: e.target.value })}
          placeholder="Add comment (optional)"
          className="w-full h-28 p-3 text-sm bg-gray-800 text-white rounded-lg border-none focus:ring-1 focus:ring-gray-700 outline-none resize-none placeholder-gray-500"
        />

        <div className="mt-3">
          <p className="text-xs text-gray-400 mb-2">Quick options:</p>
          <div className="flex flex-wrap gap-1.5">
            {suggestedComments.map((comment, _idx: number) => (
              <button
                key={_idx}
                onClick={() => setExpenseData({ ...expenseData, comment })}
                className="px-3 py-1.5 bg-gray-800 text-gray-300 rounded-full text-xs hover:bg-gray-700 transition active:scale-95"
              >
                {comment}
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={() => setCurrentScreen('confirm')}
          className="w-full mt-4 bg-blue-500 text-white py-3 rounded-lg text-sm font-medium hover:bg-blue-600 transition active:scale-98"
        >
          Next
        </button>
      </div>
    </div>
  );

  const ConfirmScreen = () => (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="flex items-center px-3 py-3 border-b border-gray-800">
        <button onClick={() => setCurrentScreen('comment')} className="mr-3">
          <ArrowLeft size={20} className="text-white" />
        </button>
        <h2 className="text-base font-semibold">Confirmation</h2>
      </div>

      <div className="p-3">
        <div className="bg-gray-800 rounded-lg p-4 mb-4">
          <div className="text-center mb-4">
            <div className="text-3xl font-bold text-red-500 mb-1">-{expenseData.amount} ₴</div>
            <p className="text-xs text-gray-400">Expense</p>
          </div>

          <div className="space-y-0">
            <div className="flex justify-between py-2.5 border-b border-gray-700">
              <span className="text-xs text-gray-400">Account:</span>
              <span className="text-xs font-medium text-white">{expenseData.account}</span>
            </div>
            <div className="flex justify-between py-2.5 border-b border-gray-700">
              <span className="text-xs text-gray-400">Category:</span>
              <span className="text-xs font-medium text-white">{expenseData.category}</span>
            </div>
            <div className="flex justify-between py-2.5 border-b border-gray-700">
              <span className="text-xs text-gray-400">Comment:</span>
              <span className="text-xs font-medium text-white text-right max-w-[60%]">{expenseData.comment || 'No comment'}</span>
            </div>
            <div className="flex justify-between py-2.5">
              <span className="text-xs text-gray-400">Date:</span>
              <span className="text-xs font-medium text-white">{new Date().toLocaleDateString('en-US')}</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-1.5">
          <button
            onClick={() => setCurrentScreen('home')}
            className="bg-red-500 text-white py-2 rounded-lg font-medium hover:bg-red-600 transition active:scale-95 flex items-center justify-center text-xs"
          >
            <X size={14} className="mr-1" />
            No
          </button>
          <button
            onClick={() => setCurrentScreen('comment')}
            className="bg-gray-700 text-white py-2 rounded-lg font-medium hover:bg-gray-600 transition active:scale-95 flex items-center justify-center text-xs"
          >
            <ArrowLeft size={14} className="mr-1" />
            Back
          </button>
          <button
            onClick={() => {
              setShowSuccess(true);
              setTimeout(() => {
                setShowSuccess(false);
                setExpenseData({ account: '', amount: '', category: '', comment: '' });
                setCurrentScreen('home');
              }, 2000);
            }}
            className="bg-green-500 text-white py-2 rounded-lg font-medium hover:bg-green-600 transition active:scale-95 flex items-center justify-center text-xs"
          >
            <Check size={14} className="mr-1" />
            Yes
          </button>
        </div>
      </div>
    </div>
  );

  const DebugScreen = () => {
    const [fireflyUrl, setFireflyUrl] = useState(fireflyService.getBaseUrl());
    const [fireflyToken, setFireflyToken] = useState(fireflyService.getToken() || '');
    const [showSettings, setShowSettings] = useState(false);

    const getStatusIcon = (status: 'connected' | 'disconnected' | 'checking') => {
      switch (status) {
        case 'connected':
          return <CheckCircle size={20} className="text-green-500" />;
        case 'disconnected':
          return <XCircle size={20} className="text-red-500" />;
        case 'checking':
          return <AlertCircle size={20} className="text-yellow-500 animate-pulse" />;
      }
    };

    const getStatusColor = (status: 'connected' | 'disconnected' | 'checking') => {
      switch (status) {
        case 'connected':
          return 'text-green-500';
        case 'disconnected':
          return 'text-red-500';
        case 'checking':
          return 'text-yellow-500';
      }
    };

    const saveFireflySettings = () => {
      fireflyService.setBaseUrl(fireflyUrl);
      fireflyService.setToken(fireflyToken);
      setShowSettings(false);
      // Re-check connection after saving
      checkServiceConnections();
    };

    return (
      <div className="min-h-screen bg-gray-900 text-white pb-20">
        <div className="flex items-center px-3 py-3 border-b border-gray-800">
          <button onClick={() => setCurrentScreen('home')} className="mr-3">
            <ArrowLeft size={20} className="text-white" />
          </button>
          <h2 className="text-base font-semibold">Debug Information</h2>
        </div>

        <div className="p-3">
          {/* Services Status Section */}
          <div className="mb-4">
            <h3 className="text-sm font-semibold mb-3 text-white px-1">Services Status</h3>
            <div className="space-y-0">
              {serviceStatuses.map((service, idx) => (
                <div
                  key={idx}
                  className="bg-gray-800 border-b border-gray-700 last:border-b-0 px-3 py-3"
                >
                  <div className="flex items-start">
                    <div className="mt-0.5 mr-3">
                      {getStatusIcon(service.status)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h4 className="font-medium text-white text-sm">{service.name}</h4>
                        <span className={`text-xs font-medium uppercase ${getStatusColor(service.status)}`}>
                          {service.status}
                        </span>
                      </div>
                      <p className="text-xs text-gray-400 leading-tight">{service.message}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Refresh Button */}
          <button
            onClick={checkServiceConnections}
            className="w-full bg-blue-500 text-white py-3 rounded-lg font-medium hover:bg-blue-600 transition active:scale-98 flex items-center justify-center gap-2"
          >
            <AlertCircle size={18} />
            <span>Refresh Status</span>
          </button>

          {/* Additional Debug Info */}
          <div className="mt-4 bg-gray-800 rounded-lg p-3">
            <h4 className="text-xs font-semibold text-gray-400 mb-2">System Information</h4>
            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between">
                <span className="text-gray-500">Environment:</span>
                <span className="text-gray-300">{isAvailable ? 'Telegram Mini App' : 'Browser'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">User:</span>
                <span className="text-gray-300">{userName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Timestamp:</span>
                <span className="text-gray-300">{new Date().toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Firefly API Settings */}
          <div className="mt-4 bg-gray-800 rounded-lg p-3">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-xs font-semibold text-gray-400">Firefly III Settings</h4>
              <button
                onClick={() => setShowSettings(!showSettings)}
                className="text-xs text-blue-500 hover:text-blue-400"
              >
                {showSettings ? 'Hide' : 'Configure'}
              </button>
            </div>

            {showSettings && (
              <div className="space-y-3">
                <div>
                  <label className="text-xs text-gray-400 block mb-1">API URL</label>
                  <input
                    type="text"
                    value={fireflyUrl}
                    onChange={(e) => setFireflyUrl(e.target.value)}
                    placeholder="https://your-firefly-instance.com"
                    className="w-full px-3 py-2 text-sm bg-gray-700 text-white rounded-lg border-none focus:ring-1 focus:ring-blue-500 outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs text-gray-400 block mb-1">API Token</label>
                  <input
                    type="password"
                    value={fireflyToken}
                    onChange={(e) => setFireflyToken(e.target.value)}
                    placeholder="Your Firefly III API token"
                    className="w-full px-3 py-2 text-sm bg-gray-700 text-white rounded-lg border-none focus:ring-1 focus:ring-blue-500 outline-none"
                  />
                </div>

                <button
                  onClick={saveFireflySettings}
                  className="w-full bg-green-500 text-white py-2 rounded-lg font-medium text-sm hover:bg-green-600 transition active:scale-98"
                >
                  Save Settings
                </button>
              </div>
            )}

            {!showSettings && (
              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-gray-500">API URL:</span>
                  <span className="text-gray-300 truncate ml-2 max-w-[60%]">
                    {fireflyUrl || 'Not configured'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Token:</span>
                  <span className="text-gray-300">
                    {fireflyToken ? '••••••••' : 'Not configured'}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-md mx-auto bg-gray-900 min-h-screen">
      {currentScreen === 'home' && <HomeScreen />}
      {currentScreen === 'accounts' && <AccountsScreen />}
      {currentScreen === 'amount' && <AmountScreen />}
      {currentScreen === 'category' && <CategoryScreen />}
      {currentScreen === 'comment' && <CommentScreen />}
      {currentScreen === 'confirm' && <ConfirmScreen />}
      {currentScreen === 'debug' && <DebugScreen />}

      {/* Success Toast */}
      {showSuccess && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-2 z-50 animate-fade-in">
          <Check size={20} />
          <span className="font-medium">Expense saved successfully!</span>
        </div>
      )}
    </div>
  );
};

export default BudgetMiniApp;