import { useState, useEffect } from 'react';
import { Check } from 'lucide-react';
import { useTelegramUser } from './hooks/useTelegramUser';
import { useExpenseData } from './hooks/useExpenseData';
import { fireflyService } from './services/firefly';
import { syncService, type AccountUsage } from './services/sync';
import { getInitialServiceStatuses, type ServiceStatus } from './utils/serviceStatus';

// Components
import HomeScreen from './components/HomeScreen';
import AccountsScreen from './components/AccountsScreen';
import AmountScreen from './components/AmountScreen';
import CategoryScreen from './components/CategoryScreen';
import CommentScreen from './components/CommentScreen';
import ConfirmScreen from './components/ConfirmScreen';
import DebugScreen from './components/DebugScreen';

const BudgetMiniApp = () => {
  const [currentScreen, setCurrentScreen] = useState('home');
  const [showSuccess, setShowSuccess] = useState(false);

  // Service status states
  const [serviceStatuses, setServiceStatuses] = useState<ServiceStatus[]>(getInitialServiceStatuses());

  // Accounts state
  const [accounts, setAccounts] = useState<AccountUsage[]>([]);
  const [accountsLoading, setAccountsLoading] = useState(false);
  const [accountsError, setAccountsError] = useState<string | null>(null);

  // Get Telegram user data
  const { userName, userPhotoUrl, userInitials, userBio, isAvailable } = useTelegramUser();

  // Get expense data hook
  const {
    expenseData,
    updateAccount,
    updateAmount,
    updateCategory,
    updateComment,
    resetExpenseData
  } = useExpenseData();

  // Fetch accounts when accounts screen is opened
  useEffect(() => {
    if (currentScreen === 'accounts') {
      fetchAccounts();
    }
  }, [currentScreen, userName]);

  // Check service connections when debug screen is opened
  useEffect(() => {
    if (currentScreen === 'debug') {
      checkServiceConnections();
    }
  }, [currentScreen]);

  const fetchAccounts = async () => {
    setAccountsLoading(true);
    setAccountsError(null);

    try {
      console.log('🔍 Fetching accounts for user:', userName);

      // If userName is known and matches users in the system, filter by userName
      // Otherwise, return all accounts
      // Treat "User" and "Guest" as unknown users (browser mode)
      const isUnknownUser = userName === 'User' || userName === 'Guest';
      const data = await syncService.getAccountsUsage(isUnknownUser ? undefined : userName);

      console.log('📊 Fetched accounts:', {
        total: data.total,
        count: data.get_accounts_usage.length
      });

      // Accounts are already sorted by syncService.getAccountsUsage()
      // Used accounts (high → low by usage_count) followed by unused accounts (usage_count = 0)
      setAccounts(data.get_accounts_usage);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch accounts';
      console.error('❌ Failed to fetch accounts:', {
        error,
        message: errorMessage,
        userName,
        syncConfigured: syncService.isConfigured(),
        baseUrl: syncService.getBaseUrl()
      });
      setAccountsError(errorMessage);
    } finally {
      setAccountsLoading(false);
    }
  };

  const checkServiceConnections = async () => {
    // Reset all to checking state
    setServiceStatuses(getInitialServiceStatuses());

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

    // Check Sync API (real check)
    setTimeout(async () => {
      try {
        const result = await syncService.checkConnection();
        setServiceStatuses(prev => prev.map(service =>
          service.name === 'Sync API'
            ? {
                ...service,
                status: result.success ? 'connected' : 'disconnected',
                message: result.message
              }
            : service
        ));
      } catch (error) {
        setServiceStatuses(prev => prev.map(service =>
          service.name === 'Sync API'
            ? {
                ...service,
                status: 'disconnected',
                message: error instanceof Error ? error.message : 'Connection failed'
              }
            : service
        ));
      }
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

  // Navigation handlers
  const handleNavigate = (screen: string) => {
    setCurrentScreen(screen);
  };

  const handleSelectAccount = (accountName: string) => {
    updateAccount(accountName);
    setCurrentScreen('amount');
  };

  const handleNumberClick = (num: string) => {
    updateAmount(expenseData.amount + num);
  };

  const handleDelete = () => {
    updateAmount(expenseData.amount.slice(0, -1));
  };

  const handleConfirmExpense = () => {
    setShowSuccess(true);
    setTimeout(() => {
      setShowSuccess(false);
      resetExpenseData();
      setCurrentScreen('home');
    }, 2000);
  };

  return (
    <div className="max-w-md mx-auto bg-gray-900 min-h-screen">
      {/* Screen Router */}
      {currentScreen === 'home' && (
        <HomeScreen
          userName={userName}
          userPhotoUrl={userPhotoUrl}
          userInitials={userInitials}
          userBio={userBio}
          isAvailable={isAvailable}
          onNavigate={handleNavigate}
        />
      )}

      {currentScreen === 'accounts' && (
        <AccountsScreen
          accounts={accounts}
          accountsLoading={accountsLoading}
          accountsError={accountsError}
          onBack={() => setCurrentScreen('home')}
          onSelectAccount={handleSelectAccount}
          onRetry={fetchAccounts}
        />
      )}

      {currentScreen === 'amount' && (
        <AmountScreen
          account={expenseData.account}
          amount={expenseData.amount}
          onBack={() => setCurrentScreen('accounts')}
          onNumberClick={handleNumberClick}
          onDelete={handleDelete}
          onNext={() => setCurrentScreen('category')}
        />
      )}

      {currentScreen === 'category' && (
        <CategoryScreen
          onBack={() => setCurrentScreen('amount')}
          onSelectCategory={(category) => {
            updateCategory(category);
            setCurrentScreen('comment');
          }}
        />
      )}

      {currentScreen === 'comment' && (
        <CommentScreen
          comment={expenseData.comment}
          onBack={() => setCurrentScreen('category')}
          onCommentChange={updateComment}
          onNext={() => setCurrentScreen('confirm')}
        />
      )}

      {currentScreen === 'confirm' && (
        <ConfirmScreen
          account={expenseData.account}
          amount={expenseData.amount}
          category={expenseData.category}
          comment={expenseData.comment}
          onBack={() => setCurrentScreen('comment')}
          onCancel={() => setCurrentScreen('home')}
          onConfirm={handleConfirmExpense}
        />
      )}

      {currentScreen === 'debug' && (
        <DebugScreen
          userName={userName}
          isAvailable={isAvailable}
          serviceStatuses={serviceStatuses}
          onBack={() => setCurrentScreen('home')}
          onRefresh={checkServiceConnections}
        />
      )}

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
