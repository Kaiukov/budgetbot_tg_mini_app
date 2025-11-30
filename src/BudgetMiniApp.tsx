import { useState, useEffect } from 'react';
import { useTelegramUser } from './hooks/useTelegramUser';
import { useTransactionData, type TransactionType } from './hooks/useTransactionData';
import { syncService, type AccountUsage, type CategoryUsage } from './services/sync';
import telegramService from './services/telegram';
import { getInitialServiceStatuses, type ServiceStatus } from './utils/serviceStatus';
import { refreshHomeTransactionCache } from './utils/cache';

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
import TransactionsListScreen from './components/TransactionsListScreen';
import TransactionDetailScreen from './components/TransactionDetailScreen';
import TransactionEditScreen from './components/TransactionEditScreen';
import BrowserBackButton from './components/BrowserBackButton';
import type { DisplayTransaction, TransactionData } from './types/transaction';

const BudgetMiniApp = () => {
  const [currentScreen, setCurrentScreen] = useState('home');
  const [transactionType, setTransactionType] = useState<TransactionType>('expense');

  // Service status states
  const [serviceStatuses, setServiceStatuses] = useState<ServiceStatus[]>(getInitialServiceStatuses());
  const [telegramStatus, setTelegramStatus] = useState<ServiceStatus | null>(null);

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

  // Transaction view/edit state
  const [selectedTransactionId, setSelectedTransactionId] = useState<string | null>(null);
  const [selectedTransactionData, setSelectedTransactionData] = useState<TransactionData | null>(null);
  const [editingTransaction, setEditingTransaction] = useState<DisplayTransaction | null>(null);

  // Get Telegram user data
  const { userName, userFullName, userPhotoUrl, userInitials, userBio, isAvailable } = useTelegramUser();

  // Get transaction data hook (supports expense and income)
  const {
    transactionData,
    setUserName,
    updateAccountWithDetails,
    updateAmount,
    updateCategory,
    updateDestination,
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



  // Handle transaction detail navigation from sessionStorage
  useEffect(() => {
    if (currentScreen === 'transaction-detail') {
      const transactionId = sessionStorage.getItem('selectedTransactionId');
      if (transactionId) {
        setSelectedTransactionId(transactionId);
      }
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
        syncConfigured: syncService.isConfigured()
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
      console.log('🔍 Fetching categories for user:', userName, 'type:', transactionType);

      // If userName is known and matches users in the system, filter by userName
      // Otherwise, return all categories
      // Treat "User" and "Guest" as unknown users (browser mode)
      const isUnknownUser = userName === 'User' || userName === 'Guest';

      // Map transaction type to API type parameter
      const typeParam = transactionType === 'expense'
        ? 'withdrawal'
        : transactionType === 'income'
          ? 'deposit'
          : undefined;

      const data = await syncService.getCategoriesUsage(
        isUnknownUser ? undefined : userName,
        typeParam as 'withdrawal' | 'deposit' | undefined
      );

      console.log('📊 Fetched categories:', {
        total: data.total,
        count: data.get_categories_usage.length,
        type: typeParam
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
        syncConfigured: syncService.isConfigured()
      });
      setCategoriesError(errorMessage);
    } finally {
      setCategoriesLoading(false);
    }
  };

  const checkServiceConnections = async () => {
    // Reset all to checking state
    setServiceStatuses(getInitialServiceStatuses());

    // Check Telegram SDK readiness
    setTimeout(() => {
      const isReady = telegramService.isReady();
      setTelegramStatus({
        name: 'Telegram SDK',
        status: isReady ? 'connected' : 'disconnected',
        message: telegramService.getConnectionStatus()
      });
    }, 300);

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
        // Import apiClient dynamically to avoid circular dependencies
        const { apiClient } = await import('./services/sync/index');
        await apiClient.request<{ data: unknown }>(
          '/api/v1/transactions?limit=1',
          {
            method: 'GET',
            auth: 'tier2'
          }
        );
        setServiceStatuses(prev => prev.map(service =>
          service.name === 'Firefly API'
            ? {
                ...service,
                status: 'connected',
                message: 'Firefly API is accessible'
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
      // Store user name
      setUserName(selectedAccount.user_name);

      // Store account details
      updateAccountWithDetails(
        selectedAccount.account_name,
        parseInt(selectedAccount.account_id),
        selectedAccount.account_currency
      );
    }

    setCurrentScreen('amount');
  };

  const handleAmountChange = (value: string) => {
    updateAmount(value);
  };

  const handleConfirmTransaction = () => {
    resetTransactionData();
    setTransactionType('expense'); // Reset to default
    setCurrentScreen('home');
  };

  // Transaction handlers
  const handleSelectTransaction = (transactionId: string) => {
    setSelectedTransactionId(transactionId);
    sessionStorage.setItem('selectedTransactionId', transactionId);
    setCurrentScreen('transaction-detail');
  };

  const handleEditTransaction = async (transactionId: string, rawData: TransactionData) => {
    setSelectedTransactionData(rawData);
    // Get the display transaction from session or reconstruct from raw data
    const storedId = sessionStorage.getItem('selectedTransactionId');
    if (storedId) {
      // We'll need to fetch the display transaction - for now use raw data to reconstruct
      // In a real scenario, we'd have already fetched this
      setEditingTransaction({
        id: transactionId,
        type: rawData.type === 'deposit' ? 'income' : rawData.type === 'withdrawal' ? 'expense' : 'transfer',
        date: rawData.date,
        amount: parseFloat(rawData.amount),
        currency: rawData.currency_code,
        currencySymbol: rawData.currency_symbol,
        foreignAmount: rawData.foreign_amount ? parseFloat(rawData.foreign_amount) : undefined,
        foreignCurrency: rawData.foreign_currency_code,
        foreignCurrencySymbol: rawData.foreign_currency_symbol,
        categoryName: rawData.category_name,
        sourceName: rawData.source_name,
        destinationName: rawData.destination_name,
        description: rawData.description,
        username: rawData.tags?.[0] || 'Unknown',
        journalId: rawData.transaction_journal_id,
      });
      setCurrentScreen('transaction-edit');
    }
  };

  const handleDeleteTransaction = async (transactionId: string) => {
    try {
      // Import apiClient dynamically to avoid circular dependencies
      const { apiClient } = await import('./services/sync/index');
      await apiClient.request<Record<string, unknown>>(
        `/api/v1/transactions/${transactionId}`,
        {
          method: 'DELETE',
          auth: 'tier2'
        }
      );
      // Proactively refresh transaction cache
      await refreshHomeTransactionCache();

      sessionStorage.removeItem('selectedTransactionId');
      setSelectedTransactionId(null);
      setCurrentScreen('transactions');
    } catch (error) {
      console.error('Error deleting transaction:', error);
      alert('Failed to delete transaction');
    }
  };

  // Get back handler for current screen
  const getBackHandler = () => {
    switch (currentScreen) {
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
      case 'transactions':
        return () => setCurrentScreen('home');
      case 'transaction-detail':
        return () => {
          sessionStorage.removeItem('selectedTransactionId');
          setCurrentScreen('transactions');
        };
      case 'transaction-edit':
        return () => setCurrentScreen('transaction-detail');
      default:
        return () => setCurrentScreen('home');
    }
  };

  return (
    <div
      className="max-w-md mx-auto min-h-screen bg-gradient-to-b from-indigo-950 via-purple-950/30 to-indigo-950"
      style={{
        paddingTop: 'calc(env(safe-area-inset-top, 0px) + 1rem)',
        paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 1rem)'
      }}
    >
      {/* Browser Back Button (only shows in browser debug mode) */}
      <BrowserBackButton onBack={getBackHandler()} isHome={currentScreen === 'home'} />

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
          isAvailable={isAvailable}
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
          isAvailable={isAvailable}
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
          account={transactionData.account_name}
          amount={transactionData.amount}
          transactionData={transactionData}
          isAvailable={isAvailable}
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
          isAvailable={isAvailable}
          onBack={() => setCurrentScreen('amount')}
          onSelectCategory={(categoryName, categoryId, budgetName) => {
            updateCategory(categoryName, categoryId, budgetName || '');
            setCurrentScreen('comment');
          }}
          onRetry={fetchCategories}
        />
      )}

      {currentScreen === 'comment' && (
        <CommentScreen
          destination_name={transactionData.destination_name}
          category_name={transactionData.category_name}
          category_id={transactionData.category_id}
          isAvailable={isAvailable}
          onBack={() => setCurrentScreen('category')}
          onDestinationChange={(dest_id, dest_name) => updateDestination(typeof dest_id === 'string' ? parseInt(dest_id, 10) : dest_id, dest_name)}
          onNext={() => setCurrentScreen('confirm')}
        />
      )}

      {currentScreen === 'confirm' && transactionType === 'expense' && (
        <ConfirmScreen
          account_name={transactionData.account_name}
          amount={transactionData.amount}
          budget_name={transactionData.budget_name}
          destination_name={transactionData.destination_name}
          transactionData={transactionData}
          isAvailable={isAvailable}
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
          account_name={transactionData.account_name}
          amount={transactionData.amount}
          budget_name={transactionData.budget_name}
          destination_name={transactionData.destination_name}
          transactionData={transactionData}
          isAvailable={isAvailable}
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
          isAvailable={isAvailable}
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
          isAvailable={isAvailable}
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
          isAvailable={isAvailable}
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
          isAvailable={isAvailable}
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
          destination_name={transferComment}
          category_name="Transfer"
          isAvailable={isAvailable}
          onBack={() => setCurrentScreen('transfer-fees')}
          onDestinationChange={(_, dest) => setTransferComment(dest)}
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
          isAvailable={isAvailable}
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
          telegramStatus={telegramStatus || undefined}
          onBack={() => setCurrentScreen('home')}
          onRefresh={checkServiceConnections}
        />
      )}

      {/* Transactions List Screen */}
      {currentScreen === 'transactions' && (
        <TransactionsListScreen
          onBack={() => setCurrentScreen('home')}
          onSelectTransaction={handleSelectTransaction}
          isAvailable={isAvailable}
        />
      )}

      {/* Transaction Detail Screen */}
      {currentScreen === 'transaction-detail' && selectedTransactionId && (
        <TransactionDetailScreen
          transactionId={selectedTransactionId}
          onBack={() => {
            sessionStorage.removeItem('selectedTransactionId');
            setCurrentScreen('transactions');
          }}
          onEdit={handleEditTransaction}
          onDelete={handleDeleteTransaction}
          isAvailable={isAvailable}
        />
      )}

      {/* Transaction Edit Screen */}
      {currentScreen === 'transaction-edit' && editingTransaction && selectedTransactionData && (
        <TransactionEditScreen
          transaction={editingTransaction}
          rawData={selectedTransactionData}
          onBack={() => setCurrentScreen('transaction-detail')}
          onSuccess={() => {
            setEditingTransaction(null);
            setSelectedTransactionData(null);
            setCurrentScreen('transaction-detail');
          }}
          isAvailable={isAvailable}
        />
      )}

    </div>
  );
};

export default BudgetMiniApp;
