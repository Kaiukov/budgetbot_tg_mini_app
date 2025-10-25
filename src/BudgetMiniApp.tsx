import { useState } from 'react';
import { Search, TrendingDown, TrendingUp, DollarSign, CreditCard, Home, ShoppingBag, Coffee, Car, Heart, MoreHorizontal, ArrowLeft, Check, X, ChevronRight } from 'lucide-react';
import { useTelegramUser } from './hooks/useTelegramUser';

const BudgetMiniApp = () => {
  const [currentScreen, setCurrentScreen] = useState('home');
  const [showSuccess, setShowSuccess] = useState(false);
  const [expenseData, setExpenseData] = useState({
    account: '',
    amount: '',
    category: '',
    comment: ''
  });

  // Get Telegram user data
  const { userName, userPhotoUrl, userInitials, userBio, isAvailable } = useTelegramUser();

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

  return (
    <div className="max-w-md mx-auto bg-gray-900 min-h-screen">
      {currentScreen === 'home' && <HomeScreen />}
      {currentScreen === 'accounts' && <AccountsScreen />}
      {currentScreen === 'amount' && <AmountScreen />}
      {currentScreen === 'category' && <CategoryScreen />}
      {currentScreen === 'comment' && <CommentScreen />}
      {currentScreen === 'confirm' && <ConfirmScreen />}

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