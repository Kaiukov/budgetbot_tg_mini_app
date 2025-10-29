import { useState, useEffect } from 'react';
import { Check } from 'lucide-react';
import { useTelegramUser } from './hooks/useTelegramUser';
import { useTransactionData, type TransactionType } from './hooks/useTransactionData';
import { fireflyService } from './services/firefly';
import { syncService, type AccountUsage, type CategoryUsage } from './services/sync';
import { getInitialServiceStatuses, type ServiceStatus } from './utils/serviceStatus';

// Components
import HomeScreen from './components/HomeScreen';
import AccountsScreen from './components/AccountsScreen';
import AmountScreen from './components/AmountScreen';
import CategoryScreen from './components/CategoryScreen';
import CommentScreen from './components/CommentScreen';
import ConfirmScreen from './components/ConfirmScreen';
import IncomeConfirmScreen from './components/IncomeConfirmScreen';
import DebugScreen from './components/DebugScreen';

const BudgetMiniApp = () => {
  const [currentScreen, setCurrentScreen] = useState('home');
  const [showSuccess, setShowSuccess] = useState(false);
  const [transactionType, setTransactionType] = useState<TransactionType>('expense');

  // Service status states
  const [serviceStatuses, setServiceStatuses] = useState<ServiceStatus[]>(getInitialServiceStatuses());

  // Accounts state
  const [accounts, setAccounts] = useState<AccountUsage[]>([]);
  const [accountsLoading, setAccountsLoading] = useState(false);
  const [accountsError, setAccountsError] = useState<string | null>(null);

  // Categories state
  const [categories, setCategories] = useState<CategoryUsage[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(false);
  const [categoriesError, setCategoriesError] = useState<string | null>(null);

  // Get Telegram user data
  const { userName, userFullName, userPhotoUrl, userInitials, userBio, isAvailable, user } = useTelegramUser();

  // Get transaction data hook (supports expense and income)
  const {
    transactionData,
    updateAccount,
    updateAccountWithDetails,
    updateAmount,
    updateCategory,
    updateComment,
    setUserData,
    resetTransactionData
  } = useTransactionData(transactionType);

  // Fetch accounts when accounts screen is opened (for both expense and income flows)
  useEffect(() => {
    if (currentScreen === 'accounts' || currentScreen === 'income-accounts') {
      fetchAccounts();
    }
  }, [currentScreen, userName]);

  // Fetch categories when category screen is opened
  useEffect(() => {
    if (currentScreen === 'category') {
      fetchCategories();
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

  const fetchCategories = async () => {
    setCategoriesLoading(true);
    setCategoriesError(null);

    try {
      console.log('🔍 Fetching categories for user:', userName);

      // If userName is known and matches users in the system, filter by userName
      // Otherwise, return all categories
      // Treat "User" and "Guest" as unknown users (browser mode)
      const isUnknownUser = userName === 'User' || userName === 'Guest';
      const data = await syncService.getCategoriesUsage(isUnknownUser ? undefined : userName);

      console.log('📊 Fetched categories:', {
        total: data.total,
        count: data.get_categories_usage.length
      });

      // Categories are already sorted by syncService.getCategoriesUsage()
      // Used categories (high → low by usage_count) followed by unused categories (usage_count = 0)
      setCategories(data.get_categories_usage);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch categories';
      console.error('❌ Failed to fetch categories:', {
        error,
        message: errorMessage,
        userName,
        syncConfigured: syncService.isConfigured(),
        baseUrl: syncService.getBaseUrl()
      });
      setCategoriesError(errorMessage);
    } finally {
      setCategoriesLoading(false);
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
    // Clear previous transaction data before starting new one
    resetTransactionData();

    // Find the selected account from accounts list to get full details
    const selectedAccount = accounts.find(acc => acc.account_name === accountName);

    if (selectedAccount) {
      // Store account details
      updateAccountWithDetails(
        selectedAccount.account_name,
        selectedAccount.account_id,
        selectedAccount.account_currency,
        selectedAccount.user_name
      );

      // Store user data if available
      if (user?.id) {
        setUserData(user.id, userName);
      }
    } else {
      // Fallback to old method if account not found
      updateAccount(accountName);
    }

    setCurrentScreen('amount');
  };

  const handleAmountChange = (value: string) => {
    updateAmount(value);
  };

  const handleConfirmTransaction = () => {
    setShowSuccess(true);
    setTimeout(() => {
      setShowSuccess(false);
      resetTransactionData();
      setTransactionType('expense'); // Reset to default
      setCurrentScreen('home');
    }, 2000);
  };

  return (
    <div className="max-w-md mx-auto bg-gray-900 min-h-screen">
      {/* Screen Router */}
      {currentScreen === 'home' && (
        <HomeScreen
          userFullName={userFullName}
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
          onBack={() => {
            resetTransactionData();
            setCurrentScreen('home');
          }}
          onSelectAccount={handleSelectAccount}
          onRetry={fetchAccounts}
        />
      )}

      {currentScreen === 'income-accounts' && (
        <AccountsScreen
          accounts={accounts}
          accountsLoading={accountsLoading}
          accountsError={accountsError}
          onBack={() => {
            resetTransactionData();
            setTransactionType('expense'); // Reset to default
            setCurrentScreen('home');
          }}
          onSelectAccount={(accountName) => {
            setTransactionType('income'); // Set transaction type to income
            handleSelectAccount(accountName);
          }}
          onRetry={fetchAccounts}
        />
      )}

      {currentScreen === 'amount' && (
        <AmountScreen
          account={transactionData.account}
          amount={transactionData.amount}
          expenseData={transactionData}
          onBack={() => setCurrentScreen(transactionType === 'income' ? 'income-accounts' : 'accounts')}
          onAmountChange={handleAmountChange}
          onNext={() => setCurrentScreen('category')}
        />
      )}

      {currentScreen === 'category' && (
        <CategoryScreen
          categories={categories}
          categoriesLoading={categoriesLoading}
          categoriesError={categoriesError}
          transactionType={transactionType}
          onBack={() => setCurrentScreen('amount')}
          onSelectCategory={(category) => {
            updateCategory(category);
            setCurrentScreen('comment');
          }}
          onRetry={fetchCategories}
        />
      )}

      {currentScreen === 'comment' && (
        <CommentScreen
          comment={transactionData.comment}
          category={transactionData.category}
          onBack={() => setCurrentScreen('category')}
          onCommentChange={updateComment}
          onNext={() => setCurrentScreen('confirm')}
        />
      )}

      {currentScreen === 'confirm' && transactionType === 'expense' && (
        <ConfirmScreen
          account={transactionData.account}
          amount={transactionData.amount}
          category={transactionData.category}
          comment={transactionData.comment}
          expenseData={transactionData}
          userName={userName}
          onBack={() => setCurrentScreen('comment')}
          onCancel={() => {
            resetTransactionData();
            setTransactionType('expense');
            setCurrentScreen('home');
          }}
          onConfirm={handleConfirmTransaction}
          onSuccess={() => {
            resetTransactionData();
            setTransactionType('expense');
            setCurrentScreen('home');
          }}
        />
      )}

      {currentScreen === 'confirm' && transactionType === 'income' && (
        <IncomeConfirmScreen
          account={transactionData.account}
          amount={transactionData.amount}
          category={transactionData.category}
          comment={transactionData.comment}
          transactionData={transactionData}
          userName={userName}
          onBack={() => setCurrentScreen('comment')}
          onCancel={() => {
            resetTransactionData();
            setTransactionType('expense');
            setCurrentScreen('home');
          }}
          onConfirm={handleConfirmTransaction}
          onSuccess={() => {
            resetTransactionData();
            setTransactionType('expense');
            setCurrentScreen('home');
          }}
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
          <span className="font-medium">
            {transactionType === 'income' ? 'Income' : 'Expense'} saved successfully!
          </span>
        </div>
      )}
    </div>
  );
};

export default BudgetMiniApp;
