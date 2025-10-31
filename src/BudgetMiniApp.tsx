import { useState, useEffect } from 'react';
import { Check } from 'lucide-react';
import { useTelegramUser } from './hooks/useTelegramUser';
import { useTransactionData, type TransactionType } from './hooks/useTransactionData';
import { fireflyService } from './services/firefly';
import { syncService, type AccountUsage, type CategoryUsage } from './services/sync';
import { getInitialServiceStatuses, type ServiceStatus } from './utils/serviceStatus';
import telegramService from './services/telegram';

// Components
import HomeScreen from './components/HomeScreen';
import AccountsScreen from './components/AccountsScreen';
import AmountScreen from './components/AmountScreen';
import CategoryScreen from './components/CategoryScreen';
import CommentScreen from './components/CommentScreen';
import ConfirmScreen from './components/ConfirmScreen';
import IncomeConfirmScreen from './components/IncomeConfirmScreen';
import TransferAmountScreen from './components/TransferAmountScreen';
import TransferFeeScreen from './components/TransferFeeScreen';
import TransferConfirmScreen from './components/TransferConfirmScreen';
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

  // Transfer-specific state
  const [transferSourceAccount, setTransferSourceAccount] = useState('');
  const [_transferSourceAccountId, setTransferSourceAccountId] = useState('');
  const [transferSourceCurrency, setTransferSourceCurrency] = useState('');
  const [transferDestAccount, setTransferDestAccount] = useState('');
  const [_transferDestAccountId, setTransferDestAccountId] = useState('');
  const [transferDestCurrency, setTransferDestCurrency] = useState('');
  const [transferExitAmount, setTransferExitAmount] = useState('');
  const [transferEntryAmount, setTransferEntryAmount] = useState('');
  const [transferExitFee, setTransferExitFee] = useState('');
  const [transferEntryFee, setTransferEntryFee] = useState('');
  const [transferComment, setTransferComment] = useState('');

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

  // Fetch accounts when accounts screen is opened (for expense, income, and transfer flows)
  useEffect(() => {
    if (currentScreen === 'accounts' || currentScreen === 'income-accounts' ||
        currentScreen === 'transfer-source-accounts' || currentScreen === 'transfer-dest-accounts') {
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

  // Preload categories after 5 seconds (background optimization)
  useEffect(() => {
    const timer = setTimeout(() => {
      if (userName) {
        console.log('🚀 Preloading categories in background...');
        fetchCategories().catch(error => {
          console.warn('⚠️ Background category preload failed:', error);
        });
      }
    }, 5000);

    return () => clearTimeout(timer);
  }, [userName]);

  // Preload accounts when on home screen (background optimization)
  useEffect(() => {
    if (currentScreen === 'home' && userName) {
      console.log('🚀 Preloading accounts in background...');
      fetchAccounts().catch(error => {
        console.warn('⚠️ Background account preload failed:', error);
      });
    }
  }, [currentScreen, userName]);

  // Manage Telegram BackButton visibility and behavior using telegramService
  useEffect(() => {
    // Skip if not running in Telegram
    if (!telegramService.isAvailable()) return;

    const getBackHandler = (): (() => void) | null => {
      switch (currentScreen) {
        case 'home':
          return null; // No back button on home screen

        case 'accounts':
          return () => {
            resetTransactionData();
            setCurrentScreen('home');
          };

        case 'income-accounts':
          return () => {
            resetTransactionData();
            setTransactionType('expense');
            setCurrentScreen('home');
          };

        case 'amount':
          return () => setCurrentScreen(transactionType === 'income' ? 'income-accounts' : 'accounts');

        case 'category':
          return () => setCurrentScreen('amount');

        case 'comment':
          return () => setCurrentScreen('category');

        case 'confirm':
          return () => setCurrentScreen('comment');

        case 'transfer-source-accounts':
          return () => {
            setTransferSourceAccount('');
            setTransferSourceAccountId('');
            setTransferSourceCurrency('');
            setTransferDestAccount('');
            setTransferDestAccountId('');
            setTransferDestCurrency('');
            setTransferExitAmount('');
            setTransferEntryAmount('');
            setTransferExitFee('');
            setTransferEntryFee('');
            setTransferComment('');
            setCurrentScreen('home');
          };

        case 'transfer-dest-accounts':
          return () => {
            setTransferExitAmount('');
            setTransferEntryAmount('');
            setTransferExitFee('');
            setTransferEntryFee('');
            setCurrentScreen('transfer-source-accounts');
          };

        case 'transfer-amount':
          return () => {
            setTransferExitAmount('');
            setTransferEntryAmount('');
            setTransferExitFee('');
            setTransferEntryFee('');
            setCurrentScreen('transfer-dest-accounts');
          };

        case 'transfer-fees':
          return () => setCurrentScreen('transfer-amount');

        case 'transfer-comment':
          return () => setCurrentScreen('transfer-fees');

        case 'transfer-confirm':
          return () => setCurrentScreen('transfer-comment');

        case 'debug':
          return () => setCurrentScreen('home');

        default:
          return null;
      }
    };

    const backHandler = getBackHandler();

    if (backHandler) {
      // Show back button and set handler using telegramService
      const cleanup = telegramService.setupBackButton(backHandler);
      return cleanup; // Auto-cleanup when effect re-runs
    } else {
      // Hide back button on home screen
      telegramService.hideBackButton();
    }
  }, [currentScreen, transactionType, resetTransactionData, setTransactionType]);

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

      // Deduplicate by account_id (defensive - ensures unique accounts only)
      const uniqueAccounts = data.get_accounts_usage.filter(
        (account, index, self) =>
          index === self.findIndex((a) => a.account_id === account.account_id)
      );

      console.log('🔍 Deduplication:', {
        original: data.get_accounts_usage.length,
        unique: uniqueAccounts.length,
        duplicatesRemoved: data.get_accounts_usage.length - uniqueAccounts.length
      });

      // Accounts are already sorted by syncService.getAccountsUsage()
      // Used accounts (high → low by usage_count) followed by unused accounts (usage_count = 0)
      setAccounts(uniqueAccounts);
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
    <div className="max-w-md mx-auto bg-gray-900 min-h-screen pt-8">
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
          transactionData={transactionData}
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

      {/* Transfer Flow */}
      {currentScreen === 'transfer-source-accounts' && (
        <AccountsScreen
          title="Select Account - Exit"
          accounts={accounts}
          accountsLoading={accountsLoading}
          accountsError={accountsError}
          onBack={() => {
            // Reset transfer state
            setTransferSourceAccount('');
            setTransferSourceAccountId('');
            setTransferSourceCurrency('');
            setTransferDestAccount('');
            setTransferDestAccountId('');
            setTransferDestCurrency('');
            setTransferExitAmount('');
            setTransferEntryAmount('');
            setTransferExitFee('');
            setTransferEntryFee('');
            setTransferComment('');
            setCurrentScreen('home');
          }}
          onSelectAccount={(accountName) => {
            const selectedAccount = accounts.find(acc => acc.account_name === accountName);
            if (selectedAccount) {
              setTransferSourceAccount(selectedAccount.account_name);
              setTransferSourceAccountId(selectedAccount.account_id);
              setTransferSourceCurrency(selectedAccount.account_currency);
            }
            setCurrentScreen('transfer-dest-accounts');
          }}
          onRetry={fetchAccounts}
        />
      )}

      {currentScreen === 'transfer-dest-accounts' && (
        <AccountsScreen
          title="Select Account - Entry"
          accounts={accounts.filter(acc => acc.account_name !== transferSourceAccount)}
          accountsLoading={accountsLoading}
          accountsError={accountsError}
          onBack={() => {
            // Clear amounts when going back to source account selection
            setTransferExitAmount('');
            setTransferEntryAmount('');
            setTransferExitFee('');
            setTransferEntryFee('');
            setCurrentScreen('transfer-source-accounts');
          }}
          onSelectAccount={(accountName) => {
            const selectedAccount = accounts.find(acc => acc.account_name === accountName);
            if (selectedAccount) {
              setTransferDestAccount(selectedAccount.account_name);
              setTransferDestAccountId(selectedAccount.account_id);
              setTransferDestCurrency(selectedAccount.account_currency);
            }
            setCurrentScreen('transfer-amount');
          }}
          onRetry={fetchAccounts}
        />
      )}

      {currentScreen === 'transfer-amount' && (
        <TransferAmountScreen
          sourceAccount={transferSourceAccount}
          destAccount={transferDestAccount}
          sourceCurrency={transferSourceCurrency}
          destCurrency={transferDestCurrency}
          exitAmount={transferExitAmount}
          entryAmount={transferEntryAmount}
          onBack={() => {
            // Clear amounts when going back to destination account selection
            setTransferExitAmount('');
            setTransferEntryAmount('');
            setTransferExitFee('');
            setTransferEntryFee('');
            setCurrentScreen('transfer-dest-accounts');
          }}
          onExitAmountChange={setTransferExitAmount}
          onEntryAmountChange={setTransferEntryAmount}
          onNext={() => setCurrentScreen('transfer-fees')}
        />
      )}

      {currentScreen === 'transfer-fees' && (
        <TransferFeeScreen
          sourceAccount={transferSourceAccount}
          destAccount={transferDestAccount}
          sourceCurrency={transferSourceCurrency}
          destCurrency={transferDestCurrency}
          exitFee={transferExitFee}
          entryFee={transferEntryFee}
          onBack={() => {
            // Preserve fees when going back to amount screen
            setCurrentScreen('transfer-amount');
          }}
          onExitFeeChange={setTransferExitFee}
          onEntryFeeChange={setTransferEntryFee}
          onNext={() => setCurrentScreen('transfer-comment')}
          onSkip={() => {
            setTransferExitFee('0');
            setTransferEntryFee('0');
            setCurrentScreen('transfer-comment');
          }}
        />
      )}

      {currentScreen === 'transfer-comment' && (
        <CommentScreen
          comment={transferComment}
          category="Transfer"
          onBack={() => setCurrentScreen('transfer-fees')}
          onCommentChange={setTransferComment}
          onNext={() => setCurrentScreen('transfer-confirm')}
        />
      )}

      {currentScreen === 'transfer-confirm' && (
        <TransferConfirmScreen
          sourceAccount={transferSourceAccount}
          destAccount={transferDestAccount}
          sourceCurrency={transferSourceCurrency}
          destCurrency={transferDestCurrency}
          exitAmount={transferExitAmount}
          entryAmount={transferEntryAmount}
          exitFee={transferExitFee}
          entryFee={transferEntryFee}
          comment={transferComment}
          userName={userName}
          onBack={() => setCurrentScreen('transfer-comment')}
          onCancel={() => {
            // Reset all transfer state
            setTransferSourceAccount('');
            setTransferSourceAccountId('');
            setTransferSourceCurrency('');
            setTransferDestAccount('');
            setTransferDestAccountId('');
            setTransferDestCurrency('');
            setTransferExitAmount('');
            setTransferEntryAmount('');
            setTransferExitFee('');
            setTransferEntryFee('');
            setTransferComment('');
            setCurrentScreen('home');
          }}
          onConfirm={() => {
            setShowSuccess(true);
            setTimeout(() => {
              setShowSuccess(false);
              // Reset all transfer state
              setTransferSourceAccount('');
              setTransferSourceAccountId('');
              setTransferSourceCurrency('');
              setTransferDestAccount('');
              setTransferDestAccountId('');
              setTransferDestCurrency('');
              setTransferExitAmount('');
              setTransferEntryAmount('');
              setTransferExitFee('0');
              setTransferEntryFee('0');
              setTransferComment('');
              setCurrentScreen('home');
            }, 2000);
          }}
          onSuccess={() => {
            // Success handled by onConfirm
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
            {currentScreen.startsWith('transfer') ? 'Transfer' : transactionType === 'income' ? 'Income' : 'Expense'} saved successfully!
          </span>
        </div>
      )}
    </div>
  );
};

export default BudgetMiniApp;
