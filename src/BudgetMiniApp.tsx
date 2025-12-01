import { useState, useEffect } from 'react';
import { useTelegramUser } from './hooks/useTelegramUser';
import { useTransactionData, type TransactionType } from './hooks/useTransactionData';
import { syncService, type AccountUsage, type CategoryUsage } from './services/sync';
import telegramService from './services/telegram';
import { getInitialServiceStatuses, type ServiceStatus } from './utils/serviceStatus';
import { refreshHomeTransactionCache } from './utils/cache';
import { useBudgetMachineContext } from './context/BudgetMachineContext';

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
import type { DisplayTransaction, TransactionData as APITransactionData } from './types/transaction';
import type { TransactionData as HookTransactionData } from './hooks/useTransactionData';

// Helper to determine expense screen from machine state
const getExpenseScreenFromMachineState = (machineState: any): string | null => {
  if (!machineState?.matches) return null;

  // Check if in expenseFlow
  if (machineState.matches({ ready: 'expenseFlow' })) {
    // Get the substate
    if (machineState.matches({ ready: { expenseFlow: 'accounts' } })) return 'expense-accounts';
    if (machineState.matches({ ready: { expenseFlow: 'amount' } })) return 'expense-amount';
    if (machineState.matches({ ready: { expenseFlow: 'category' } })) return 'expense-category';
    if (machineState.matches({ ready: { expenseFlow: 'comment' } })) return 'expense-comment';
    if (machineState.matches({ ready: { expenseFlow: 'confirm' } })) return 'expense-confirm';
  }

  return null;
};

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
  const [selectedTransactionData, setSelectedTransactionData] = useState<APITransactionData | null>(null);
  const [editingTransaction, setEditingTransaction] = useState<DisplayTransaction | null>(null);

  // Get Telegram user data
  const { userName, userFullName, userPhotoUrl, userInitials, userBio, isAvailable } = useTelegramUser();

  // Get machine context for state and actions (expense flow)
  const machineContext = useBudgetMachineContext();

  // Determine current expense screen from machine state
  const expenseScreen = getExpenseScreenFromMachineState(machineContext.state);

  // Get transaction data hook (supports expense and income - for income/transfer flows only)
  const {
    transactionData,
    setUserName,
    updateAccountWithDetails,
    updateAmount,
    updateCategory,
    updateDestination,
    resetTransactionData
  } = useTransactionData(transactionType) as any;

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

  // ===== EXPENSE FLOW HANDLERS (Machine-driven) =====
  const handleExpenseSelectAccount = (accountName: string, accountId?: string, currency?: string, user?: string) => {
    machineContext.send({
      type: 'UPDATE_ACCOUNT',
      account: accountName,
      account_id: accountId || '',
      account_currency: currency || '',
      username: user || userName
    });
  };

  const handleExpenseAmountChange = (value: string) => {
    machineContext.send({ type: 'UPDATE_AMOUNT', amount: value });
  };

  const handleExpenseSelectCategory = (categoryName: string, _categoryId: number, _budgetName?: string) => {
    machineContext.send({
      type: 'UPDATE_CATEGORY',
      category: categoryName,
    });
  };

  const handleExpenseDestinationChange = (_destinationId: number | string, destinationName: string) => {
    machineContext.send({
      type: 'UPDATE_COMMENT',
      comment: destinationName,
    });
  };

  const handleExpenseConfirm = () => {
    machineContext.send({ type: 'SUBMIT_TRANSACTION' });
  };

  // ===== INCOME FLOW HANDLERS (useTransactionData-driven) =====
  // Navigation handlers
  const handleNavigate = (screen: string) => {
    // For expense flow, dispatch machine event
    if (screen === 'accounts') {
      machineContext.send({ type: 'NAVIGATE_EXPENSE_ACCOUNTS' });
      return;
    }

    // For other screens, use currentScreen state
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

  const handleEditTransaction = async (transactionId: string, rawData: APITransactionData) => {
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

  // Get back handler for current screen (handles both machine and legacy states)
  const getBackHandler = () => {
    // Machine-driven screens (priority)
    if (machineContext.state.matches({ ready: 'expenseFlow' })) {
      return () => machineContext.send({ type: 'NAVIGATE_BACK' });
    }
    if (machineContext.state.matches({ ready: 'incomeFlow' })) {
      return () => machineContext.send({ type: 'NAVIGATE_BACK' });
    }
    if (machineContext.state.matches({ ready: 'transferFlow' })) {
      return () => machineContext.send({ type: 'NAVIGATE_BACK' });
    }
    if (machineContext.state.matches({ ready: 'transactions' })) {
      return () => machineContext.send({ type: 'NAVIGATE_BACK' });
    }
    if (machineContext.state.matches({ ready: 'debug' })) {
      return () => machineContext.send({ type: 'NAVIGATE_BACK' });
    }

    // Legacy screens (for backward compatibility)
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
      <BrowserBackButton
        onBack={getBackHandler()}
        isHome={machineContext.state.matches({ ready: 'home' }) && currentScreen === 'home'}
      />

      {/* Screen Router */}
      {machineContext.state.matches({ ready: 'home' }) && (
        <HomeScreen
          userFullName={userFullName}
          userPhotoUrl={userPhotoUrl}
          userInitials={userInitials}
          userBio={userBio}
          isAvailable={isAvailable}
          onNavigate={handleNavigate}
        />
      )}

      {/* EXPENSE FLOW - Machine-driven */}
      {expenseScreen === 'expense-accounts' && (
        <AccountsScreen
          accounts={machineContext.context.data.accounts}
          accountsLoading={machineContext.context.ui.accounts.loading}
          accountsError={machineContext.context.ui.accounts.error}
          isAvailable={isAvailable}
          onBack={() => machineContext.send({ type: 'NAVIGATE_HOME' })}
          onSelectAccount={handleExpenseSelectAccount}
          onRetry={fetchAccounts}
        />
      )}

      {expenseScreen === 'expense-amount' && (
        <AmountScreen
          account={machineContext.context.transaction.account}
          amount={machineContext.context.transaction.amount}
          transactionData={{
            user_name: machineContext.context.user.username,
            account_name: machineContext.context.transaction.account,
            account_id: 0,
            account_currency: machineContext.context.transaction.account_currency,
            amount: machineContext.context.transaction.amount,
            amount_eur: machineContext.context.transaction.conversionAmount || 0,
            category_id: 0,
            category_name: '',
            budget_name: '',
            destination_id: 0,
            destination_name: '',
            date: ''
          } as HookTransactionData}
          conversionAmount={machineContext.context.transaction.conversionAmount}
          isLoadingConversion={machineContext.context.transaction.isLoadingConversion}
          isAvailable={isAvailable}
          onBack={() => machineContext.send({ type: 'NAVIGATE_BACK' })}
          onAmountChange={handleExpenseAmountChange}
          onConversionAmountChange={(amount) => machineContext.send({ type: 'SET_CONVERSION_AMOUNT', amount_eur: amount })}
          onIsLoadingConversionChange={(isLoading) => machineContext.send({ type: 'SET_IS_LOADING_CONVERSION', isLoading })}
          onNext={() => machineContext.send({ type: 'NAVIGATE_CATEGORY' })}
        />
      )}

      {expenseScreen === 'expense-category' && (
        <CategoryScreen
          categories={machineContext.context.data.categories}
          categoriesLoading={machineContext.context.ui.categories.loading}
          categoriesError={machineContext.context.ui.categories.error}
          transactionType="expense"
          isAvailable={isAvailable}
          onBack={() => machineContext.send({ type: 'NAVIGATE_BACK' })}
          onSelectCategory={handleExpenseSelectCategory}
          onRetry={fetchCategories}
        />
      )}

      {expenseScreen === 'expense-comment' && (
        <CommentScreen
          destination_name={
            (machineContext.context.transaction as any).destination_name ||
            machineContext.context.transaction.comment ||
            ''
          }
          category_name={machineContext.context.transaction.category}
          category_id={0}
          suggestions={(machineContext.context.transaction as any).suggestions || []}
          isLoadingSuggestions={(machineContext.context.transaction as any).isLoadingSuggestions || false}
          suggestionsError={(machineContext.context.transaction as any).suggestionsError || null}
          isAvailable={isAvailable}
          onBack={() => machineContext.send({ type: 'NAVIGATE_BACK' })}
          onDestinationChange={handleExpenseDestinationChange}
          onSuggestionsChange={(suggestions) => machineContext.send({ type: 'SET_SUGGESTIONS', suggestions })}
          onLoadingSuggestionsChange={(isLoading) => machineContext.send({ type: 'SET_IS_LOADING_SUGGESTIONS', isLoading })}
          onSuggestionsErrorChange={(error) => machineContext.send({ type: 'SET_SUGGESTIONS_ERROR', error })}
          onNext={() => machineContext.send({ type: 'NAVIGATE_CONFIRM' })}
        />
      )}

      {expenseScreen === 'expense-confirm' && (
        <ConfirmScreen
          account_name={machineContext.context.transaction.account}
          amount={machineContext.context.transaction.amount}
          budget_name={(machineContext.context.transaction as any).budget_name || ''}
          destination_name={
            (machineContext.context.transaction as any).destination_name ||
            machineContext.context.transaction.comment ||
            ''
          }
          transactionData={{
            user_name: machineContext.context.user.username,
            account_name: machineContext.context.transaction.account,
            account_id: 0,
            account_currency: machineContext.context.transaction.account_currency,
            amount: machineContext.context.transaction.amount,
            amount_eur: machineContext.context.transaction.conversionAmount || 0,
            category_id: 0,
            category_name: machineContext.context.transaction.category,
            budget_name: (machineContext.context.transaction as any).budget_name || '',
            destination_id: 0,
            destination_name:
              (machineContext.context.transaction as any).destination_name ||
              machineContext.context.transaction.comment ||
              '',
            date: ''
          } as HookTransactionData}
          isSubmitting={(machineContext.context.transaction as any).isSubmitting || false}
          submitMessage={(machineContext.context.transaction as any).submitMessage || null}
          isAvailable={isAvailable}
          onBack={() => machineContext.send({ type: 'NAVIGATE_BACK' })}
          onCancel={() => machineContext.send({ type: 'NAVIGATE_HOME' })}
          onConfirm={handleExpenseConfirm}
          onSuccess={() => machineContext.send({ type: 'NAVIGATE_HOME' })}
          onIsSubmittingChange={(isSubmitting) => machineContext.send({ type: 'SET_IS_SUBMITTING', isSubmitting })}
          onSubmitMessageChange={(message) => machineContext.send({ type: 'SET_SUBMIT_MESSAGE', message })}
        />
      )}

      {/* INCOME FLOW - useTransactionData-driven (legacy) */}
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
