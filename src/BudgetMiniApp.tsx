import { useState, useEffect, useRef } from 'react';
import { useTelegramUser } from './hooks/useTelegramUser';
import { useTransactionData, type TransactionType } from './hooks/useTransactionData';
import { syncService, type AccountUsage, type CategoryUsage } from './services/sync';
import telegramService from './services/telegram';
import { getInitialServiceStatuses, type ServiceStatus } from './utils/serviceStatus';
import { refreshHomeTransactionCache } from './utils/cache';
import { useBudgetMachineContext } from './context/BudgetMachineContext';
import { validationGuards } from './machines/actions';

// Components
import HomeScreen from './components/HomeScreen';
import AccountsScreen from './components/AccountsScreen';
import AmountScreen from './components/AmountScreen';
import CategoryScreen from './components/CategoryScreen';
import DestinationSourceNamesScreen from './components/DestinationSourceNamesScreen';
import ConfirmScreen from './components/ConfirmScreen';
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

const enableDebugLogs = import.meta.env.VITE_ENABLE_DEBUG_LOGS === 'true';

// Helper to determine withdrawal screen from machine state
const getWithdrawalScreenFromMachineState = (machineState: any): string | null => {
  if (!machineState?.matches) return null;

  // Check if in withdrawalFlow
  if (machineState.matches({ ready: 'withdrawalFlow' })) {
    // Get the substate
    if (machineState.matches({ ready: { withdrawalFlow: 'accounts' } })) return 'withdrawal-accounts';
    if (machineState.matches({ ready: { withdrawalFlow: 'amount' } })) return 'withdrawal-amount';
    if (machineState.matches({ ready: { withdrawalFlow: 'category' } })) return 'withdrawal-category';
    if (machineState.matches({ ready: { withdrawalFlow: 'notes' } })) return 'withdrawal-notes';
    if (machineState.matches({ ready: { withdrawalFlow: 'confirm' } })) return 'withdrawal-confirm';
  }

  return null;
};

// Helper to determine deposit screen from machine state
const getDepositScreenFromMachineState = (machineState: any): string | null => {
  if (!machineState?.matches) return null;

  if (machineState.matches({ ready: 'depositFlow' })) {
    if (machineState.matches({ ready: { depositFlow: 'accounts' } })) return 'deposit-accounts';
    if (machineState.matches({ ready: { depositFlow: 'amount' } })) return 'deposit-amount';
    if (machineState.matches({ ready: { depositFlow: 'category' } })) return 'deposit-category';
    if (machineState.matches({ ready: { depositFlow: 'notes' } })) return 'deposit-notes';
    if (machineState.matches({ ready: { depositFlow: 'confirm' } })) return 'deposit-confirm';
  }

  return null;
};

// Helper to determine transfer screen from machine state
const getTransferScreenFromMachineState = (machineState: any): string | null => {
  if (!machineState?.matches) return null;

  if (machineState.matches({ ready: 'transferFlow' })) {
    if (machineState.matches({ ready: { transferFlow: 'sourceAccounts' } })) return 'transfer-source-accounts';
    if (machineState.matches({ ready: { transferFlow: 'destAccounts' } })) return 'transfer-dest-accounts';
    if (machineState.matches({ ready: { transferFlow: 'amount' } })) return 'transfer-amount';
    if (machineState.matches({ ready: { transferFlow: 'fees' } })) return 'transfer-fees';
    if (machineState.matches({ ready: { transferFlow: 'confirm' } })) return 'transfer-confirm';
  }

  return null;
};

const BudgetMiniApp = () => {
  const [currentScreen, setCurrentScreen] = useState('home');
  const [transactionType, setTransactionType] = useState<TransactionType>('withdrawal');

  // Service status states
  const [serviceStatuses, setServiceStatuses] = useState<ServiceStatus[]>(getInitialServiceStatuses());
  const [telegramStatus, setTelegramStatus] = useState<ServiceStatus | null>(null);

  // Accounts state
  const [_accounts, setAccounts] = useState<AccountUsage[]>([]);
  const [_accountsLoading, setAccountsLoading] = useState(false);
  const [_accountsError, setAccountsError] = useState<string | null>(null);

  // Categories state
  const [categories, setCategories] = useState<CategoryUsage[]>([]);
  const [_categoriesLoading, setCategoriesLoading] = useState(false);
  const [_categoriesError, setCategoriesError] = useState<string | null>(null);
  const lastCategoriesKeyRef = useRef<string | null>(null);

  // Transfer-specific state (legacy - values read from machine context, setters used for clearing)
  const [_transferSourceAccount, setTransferSourceAccount] = useState('');
  const [_transferSourceAccountId, setTransferSourceAccountId] = useState('');
  const [_transferSourceCurrency, setTransferSourceCurrency] = useState('');
  const [_transferDestAccount, setTransferDestAccount] = useState('');
  const [_transferDestAccountId, setTransferDestAccountId] = useState('');
  const [_transferDestCurrency, setTransferDestCurrency] = useState('');
  const [_transferExitAmount, setTransferExitAmount] = useState('');
  const [_transferEntryAmount, setTransferEntryAmount] = useState('');
  const [_transferExitFee, setTransferExitFee] = useState('');
  const [_transferEntryFee, setTransferEntryFee] = useState('');
  const [_transferComment, setTransferComment] = useState('');
  const [withdrawalNotes, setWithdrawalNotes] = useState('');

  // Transaction view/edit state
  const [selectedTransactionId, setSelectedTransactionId] = useState<string | null>(null);
  const [selectedTransactionData, setSelectedTransactionData] = useState<APITransactionData | null>(null);
  const [editingTransaction, setEditingTransaction] = useState<DisplayTransaction | null>(null);

  // Get Telegram user data
  const { user_name, userFullName, userPhotoUrl, userInitials, userBio, isAvailable } = useTelegramUser();

  // Get machine context for state and actions (withdrawal flow)
  const machineContext = useBudgetMachineContext();

  // Determine current withdrawal screen from machine state
  const withdrawalScreen = getWithdrawalScreenFromMachineState(machineContext.state);
  const depositScreen = getDepositScreenFromMachineState(machineContext.state);
  const transferScreen = getTransferScreenFromMachineState(machineContext.state);

  // Reset notes when a fresh withdrawal flow starts
  useEffect(() => {
    if (withdrawalScreen === 'withdrawal-accounts') {
      setWithdrawalNotes('');
    }
  }, [withdrawalScreen]);

  // Get transaction data hook (legacy - resetTransactionData still used for clearing)
  const {
    transactionData: _transactionData,
    setUserName: _setUserName,
    updateAccountWithDetails: _updateAccountWithDetails,
    updateAmount: _updateAmount,
    updateAmountEUR: _updateAmountEUR,
    updateCategory: _updateCategory,
    updateDestination: _updateDestination,
    updateSource: _updateSource,
    updateNotes: _updateNotes,
    resetTransactionData
  } = useTransactionData(transactionType) as any;

  // Fetch accounts when accounts screen is opened (for expense, deposit, and transfer flows)
  useEffect(() => {
    if (currentScreen === 'accounts' || currentScreen === 'deposit-accounts' ||
        currentScreen === 'transfer-source-accounts' || currentScreen === 'transfer-dest-accounts') {
      fetchAccounts();
    }
  }, [currentScreen, user_name]);

  // Fetch categories when category screen is opened
  useEffect(() => {
    if (currentScreen === 'category') {
      fetchCategories();
    }
  }, [currentScreen, user_name]);

  // Fetch categories with correct type for machine-driven expense flow
  useEffect(() => {
    if (withdrawalScreen === 'withdrawal-category') {
      fetchCategories();
    }
  }, [withdrawalScreen, user_name]);

  // Check service connections when debug screen is opened
  useEffect(() => {
    if (currentScreen === 'debug') {
      checkServiceConnections();
    }
  }, [currentScreen]);


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
    machineContext.send({ type: 'FETCH_ACCOUNTS' });

    try {
      if (enableDebugLogs) {
        console.log('🔍 Fetching accounts:', {
          user_name,
          isAvailable,
          isUnknownUser: user_name === 'User' || user_name === 'Guest'
        });
      }

      // If user_name is known and matches users in the system, filter by user_name
      // Otherwise, return all accounts
      // Treat "User" and "Guest" as unknown users (browser mode)
      const isUnknownUser = user_name === 'User' || user_name === 'Guest';
      const queryUserName = isUnknownUser ? undefined : user_name;

      if (enableDebugLogs) {
        console.log('📤 Sending accounts request:', {
          queryUserName,
          willIncludeUserFilter: !!queryUserName
        });
      }

      const data = await syncService.getAccountsUsage(queryUserName);

      if (enableDebugLogs) {
        console.log('📊 Fetched accounts:', {
          total_sync: data.total_sync,
          count: data.get_accounts_usage.length
        });
      }

      // Deduplicate by account_id (defensive - ensures unique accounts only)
      const uniqueAccounts = data.get_accounts_usage.filter(
        (account, index, self) =>
          index === self.findIndex((a) => a.account_id === account.account_id)
      );

      if (enableDebugLogs) {
        console.log('🔍 Deduplication:', {
          original: data.get_accounts_usage.length,
          unique: uniqueAccounts.length,
          duplicatesRemoved: data.get_accounts_usage.length - uniqueAccounts.length
        });
      }

      // Accounts are already sorted by syncService.getAccountsUsage()
      // Used accounts (high → low by usage_count) followed by unused accounts (usage_count = 0)
      setAccounts(uniqueAccounts);
      machineContext.send({ type: 'FETCH_ACCOUNTS_SUCCESS', accounts: uniqueAccounts });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch accounts';
      console.error('❌ Failed to fetch accounts:', {
        error,
        message: errorMessage,
        user_name,
        syncConfigured: syncService.isConfigured()
      });
      setAccountsError(errorMessage);
      machineContext.send({ type: 'FETCH_ACCOUNTS_ERROR', error: errorMessage });
    } finally {
      setAccountsLoading(false);
    }
  };

  const fetchCategories = async () => {
    const typeParam = transactionType === 'withdrawal'
      ? 'withdrawal'
      : transactionType === 'deposit'
        ? 'deposit'
        : undefined;
    const typeKey = `${user_name || 'unknown'}|${typeParam || 'all'}`;

    // Skip duplicate fetches for the same user/type when we already have data
    if (lastCategoriesKeyRef.current === typeKey && categories.length > 0) {
      return;
    }

    setCategoriesLoading(true);
    setCategoriesError(null);
    machineContext.send({ type: 'FETCH_CATEGORIES' });

    try {
      if (enableDebugLogs) {
        console.log('🔍 Fetching categories for user:', user_name, 'type:', transactionType);
      }

      // If user_name is known and matches users in the system, filter by user_name
      // Otherwise, return all categories
      // Treat "User" and "Guest" as unknown users (browser mode)
      const isUnknownUser = user_name === 'User' || user_name === 'Guest';

      const data = await syncService.getCategoriesUsage(
        isUnknownUser ? undefined : user_name,
        typeParam as 'withdrawal' | 'deposit' | undefined
      );

      if (enableDebugLogs) {
        console.log('📊 Fetched categories:', {
          total: data.total,
          count: data.get_categories_usage.length,
          type: typeParam
        });
      }

      // Categories are already sorted by syncService.getCategoriesUsage()
      // Used categories (high → low by usage_count) followed by unused categories (usage_count = 0)
      setCategories(data.get_categories_usage);
      lastCategoriesKeyRef.current = typeKey;
      machineContext.send({ type: 'FETCH_CATEGORIES_SUCCESS', categories: data.get_categories_usage });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch categories';
      console.error('❌ Failed to fetch categories:', {
        error,
        message: errorMessage,
        user_name,
        syncConfigured: syncService.isConfigured()
      });
      setCategoriesError(errorMessage);
      machineContext.send({ type: 'FETCH_CATEGORIES_ERROR', error: errorMessage });
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

  // ===== WITHDRAWAL FLOW HANDLERS (Machine-driven) =====
  const handleWithdrawalSelectAccount = (accountName: string, accountId?: string, currency?: string, user?: string) => {
    machineContext.send({
      type: 'UPDATE_ACCOUNT',
      account: accountName,
      account_id: accountId || '',
      account_currency: currency || '',
      user_name: user || user_name
    });
  };

  const handleWithdrawalAmountChange = (value: string) => {
    machineContext.send({ type: 'UPDATE_AMOUNT', amount: value });
  };

  const handleWithdrawalSelectCategory = (category_name: string, categoryId: number, budgetName?: string) => {
    machineContext.send({
      type: 'UPDATE_CATEGORY',
      category: category_name,
      category_id: categoryId,
      budget_name: budgetName || '',
    });
  };

  const handleWithdrawalDestinationChange = (destinationId: number | string, destination_name: string) => {
    machineContext.send({
      type: 'UPDATE_NOTES',
      notes: destination_name,
      destination_id: typeof destinationId === 'string' ? parseInt(destinationId, 10) : destinationId,
    });
  };

  const handleWithdrawalConfirm = () => {
    setWithdrawalNotes('');
    machineContext.send({ type: 'SUBMIT_TRANSACTION' });
  };

  // ===== DEPOSIT FLOW HANDLERS (Machine-driven) =====
  const handleDepositSelectAccount = (accountName: string, accountId?: string, currency?: string, user?: string) => {
    machineContext.send({
      type: 'UPDATE_ACCOUNT',
      account: accountName,
      account_id: accountId || '',
      account_currency: currency || '',
      user_name: user || user_name,
    });
  };

  const handleDepositAmountChange = (value: string) => {
    machineContext.send({ type: 'UPDATE_AMOUNT', amount: value });
  };

  const handleDepositSelectCategory = (category_name: string, categoryId: number, budgetName?: string) => {
    machineContext.send({
      type: 'UPDATE_CATEGORY',
      category: category_name,
      category_id: categoryId,
      budget_name: budgetName || '',
    });
  };

  const handleDepositSourceChange = (source_id: number | string, source_name: string) => {
    machineContext.send({
      type: 'UPDATE_SOURCE_NAME',
      source_id: typeof source_id === 'string' ? parseInt(source_id, 10) : source_id,
      source_name,
    });
  };

  const handleDepositConfirm = () => {
    machineContext.send({ type: 'SUBMIT_TRANSACTION' });
  };

  // ===== DEPOSIT FLOW HANDLERS (useTransactionData-driven) =====
  // Navigation handlers
  const handleNavigate = (screen: string) => {
    // For withdrawal flow, dispatch machine event
    if (screen === 'accounts') {
      machineContext.send({ type: 'NAVIGATE_WITHDRAWAL_ACCOUNTS' });
      return;
    }

    if (screen === 'deposit-accounts') {
      machineContext.send({ type: 'NAVIGATE_DEPOSIT_ACCOUNTS' });
      // Keep legacy transactionType state in sync with active flow
      setTransactionType('deposit');
      // Ensure accounts list is fresh for machine-driven flow
      void fetchAccounts();
      return;
    }

    if (screen === 'transfer-source-accounts') {
      machineContext.send({ type: 'NAVIGATE_TRANSFER_SOURCE' });
      // Ensure accounts list is fresh for machine-driven flow
      void fetchAccounts();
      return;
    }

    // For other screens, use currentScreen state
    setCurrentScreen(screen);
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
        type: rawData.type === 'deposit' ? 'deposit' : rawData.type === 'withdrawal' ? 'withdrawal' : 'transfer',
        date: rawData.date,
        amount: parseFloat(rawData.amount),
        currency: rawData.currency_code,
        currency_symbol: rawData.currency_symbol,
        amount_eur: rawData.foreign_amount ? parseFloat(rawData.foreign_amount) : undefined,
        foreign_currency: rawData.foreign_currency_code,
        foreign_currency_symbol: rawData.foreign_currency_symbol,
        category_name: rawData.category_name,
        source_name: rawData.source_name,
        destination_name: rawData.destination_name,
        description: rawData.description,
        user_name: rawData.tags?.[0] || 'Unknown',
        journal_id: rawData.transaction_journal_id,
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
    if (machineContext.state.matches({ ready: 'withdrawalFlow' })) {
      return () => machineContext.send({ type: 'NAVIGATE_BACK' });
    }
    if (machineContext.state.matches({ ready: 'depositFlow' })) {
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
      case 'deposit-accounts':
        return () => {
          resetTransactionData();
          setTransactionType('withdrawal');
          setCurrentScreen('home');
        };
      case 'amount':
        return () => setCurrentScreen(transactionType === 'deposit' ? 'deposit-accounts' : 'accounts');
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
      case 'transfer-confirm':
        return () => setCurrentScreen('transfer-fees');
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
      className="relative max-w-md mx-auto min-h-screen bg-gradient-to-b from-indigo-950 via-purple-950/30 to-indigo-950"
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
      {machineContext.state.matches({ ready: 'home' }) && currentScreen === 'home' && (
        <HomeScreen
          userFullName={userFullName}
          userPhotoUrl={userPhotoUrl}
          userInitials={userInitials}
          userBio={userBio}
          isAvailable={isAvailable}
          onNavigate={handleNavigate}
        />
      )}

      {/* WITHDRAWAL FLOW - Machine-driven */}
      {withdrawalScreen === 'withdrawal-accounts' && (
        <AccountsScreen
          accounts={machineContext.context.data.accounts}
          accountsLoading={machineContext.context.ui.accounts.loading}
          accountsError={machineContext.context.ui.accounts.error}
          isAvailable={isAvailable}
          onBack={() => machineContext.send({ type: 'NAVIGATE_HOME' })}
          onSelectAccount={handleWithdrawalSelectAccount}
          onRetry={fetchAccounts}
        />
      )}

      {withdrawalScreen === 'withdrawal-amount' && (
        <AmountScreen
          account={machineContext.context.transaction.account}
          amount={machineContext.context.transaction.amount}
          canProceed={validationGuards.canProceedFromAmountPage(machineContext.context.transaction as any)}
          transactionData={{
            user_name: machineContext.context.user.user_name,
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
          errors={(machineContext.context.transaction as any).errors}
          isAvailable={isAvailable}
          onBack={() => machineContext.send({ type: 'NAVIGATE_BACK' })}
          onAmountChange={handleWithdrawalAmountChange}
          onConversionAmountChange={(amount) => machineContext.send({ type: 'SET_CONVERSION_AMOUNT', amount_eur: amount })}
          onIsLoadingConversionChange={(isLoading) => machineContext.send({ type: 'SET_IS_LOADING_CONVERSION', isLoading })}
          onClearError={() => machineContext.send({ type: 'CLEAR_VALIDATION_ERROR' })}
          onNext={() => machineContext.send({ type: 'NAVIGATE_CATEGORY' })}
        />
      )}

      {withdrawalScreen === 'withdrawal-category' && (
        <CategoryScreen
          categories={machineContext.context.data.categories}
          categoriesLoading={machineContext.context.ui.categories.loading}
          categoriesError={machineContext.context.ui.categories.error}
          transactionType="withdrawal"
          isAvailable={isAvailable}
          onBack={() => machineContext.send({ type: 'NAVIGATE_BACK' })}
          onSelectCategory={handleWithdrawalSelectCategory}
          onRetry={fetchCategories}
        />
      )}

      {withdrawalScreen === 'withdrawal-notes' && (
        <DestinationSourceNamesScreen
          transactionType="withdrawal"
          name={
            (machineContext.context.transaction as any).destination_name ||
            (machineContext.context.transaction as any).comment ||
            ''
          }
          category_name={machineContext.context.transaction.category}
          category_id={machineContext.context.transaction.category_id}
          suggestions={(machineContext.context.transaction as any).suggestions || []}
          isLoadingSuggestions={(machineContext.context.transaction as any).isLoadingSuggestions || false}
          suggestionsError={(machineContext.context.transaction as any).suggestionsError || null}
          errors={(machineContext.context.transaction as any).errors}
          isAvailable={isAvailable}
          onBack={() => machineContext.send({ type: 'NAVIGATE_BACK' })}
          onNameChange={handleWithdrawalDestinationChange}
          onSuggestionsChange={(suggestions) => machineContext.send({ type: 'SET_SUGGESTIONS', suggestions })}
          onLoadingSuggestionsChange={(isLoading) => machineContext.send({ type: 'SET_IS_LOADING_SUGGESTIONS', isLoading })}
          onSuggestionsErrorChange={(error) => machineContext.send({ type: 'SET_SUGGESTIONS_ERROR', error })}
          onClearError={() => machineContext.send({ type: 'CLEAR_VALIDATION_ERROR' })}
          onNext={() => machineContext.send({ type: 'NAVIGATE_CONFIRM' })}
        />
      )}

      {withdrawalScreen === 'withdrawal-confirm' && (
        <ConfirmScreen
          transactionType="withdrawal"
          account_name={machineContext.context.transaction.account}
          amount={machineContext.context.transaction.amount}
          budget_name={(machineContext.context.transaction as any).budget_name || ''}
          destination_name={
            (machineContext.context.transaction as any).destination_name ||
            (machineContext.context.transaction as any).comment ||
            ''
          }
          transactionData={{
            user_name: machineContext.context.user.user_name,
            account_name: machineContext.context.transaction.account,
            account_id: Number(machineContext.context.transaction.account_id) || 0,
            account_currency: machineContext.context.transaction.account_currency,
            amount: machineContext.context.transaction.amount,
            amount_eur: (() => {
              const conversionAmount = machineContext.context.transaction.conversionAmount;
              const isEUR = machineContext.context.transaction.account_currency?.toUpperCase() === 'EUR';
              const parsedAmount = Number(machineContext.context.transaction.amount) || 0;

              // Priority: Use conversion if valid, else use original amount for EUR, else 0
              if (conversionAmount && conversionAmount > 0) return conversionAmount;
              if (isEUR && parsedAmount > 0) return parsedAmount;
              return 0;
            })(),
            category_id: machineContext.context.transaction.category_id || 0,
            category_name: machineContext.context.transaction.category,
            budget_name: (machineContext.context.transaction as any).budget_name || '',
            destination_id: (machineContext.context.transaction as any).destination_id || 0,
            destination_name:
              (machineContext.context.transaction as any).destination_name || '',
            notes: withdrawalNotes,
            date: ''
          } as HookTransactionData}
          isSubmitting={(machineContext.context.transaction as any).isSubmitting || false}
          submitMessage={(machineContext.context.transaction as any).submitMessage || null}
          errors={(machineContext.context.transaction as any).errors}
          isAvailable={isAvailable}
          onBack={() => machineContext.send({ type: 'NAVIGATE_BACK' })}
          onCancel={() => {
            setWithdrawalNotes('');
            machineContext.send({ type: 'NAVIGATE_HOME' });
          }}
          onConfirm={handleWithdrawalConfirm}
          onSuccess={() => {
            setWithdrawalNotes('');
            machineContext.send({ type: 'NAVIGATE_HOME' });
          }}
          onIsSubmittingChange={(isSubmitting) => machineContext.send({ type: 'SET_IS_SUBMITTING', isSubmitting })}
          onSubmitMessageChange={(message) => machineContext.send({ type: 'SET_SUBMIT_MESSAGE', message })}
          onDateChange={(isoDate) => machineContext.send({ type: 'UPDATE_DATE', date: isoDate })}
          onNotesChange={setWithdrawalNotes}
          onClearError={() => machineContext.send({ type: 'CLEAR_VALIDATION_ERROR' })}
        />
      )}

      {/* DEPOSIT FLOW - Machine-driven */}
      {depositScreen === 'deposit-accounts' && (
        <AccountsScreen
          accounts={machineContext.context.data.accounts}
          accountsLoading={machineContext.context.ui.accounts.loading}
          accountsError={machineContext.context.ui.accounts.error}
          isAvailable={isAvailable}
          onBack={() => machineContext.send({ type: 'NAVIGATE_HOME' })}
          onSelectAccount={(accountName) => {
            const selectedAccount = machineContext.context.data.accounts.find(acc => acc.account_name === accountName);
            handleDepositSelectAccount(
              accountName,
              selectedAccount?.account_id,
              selectedAccount?.account_currency,
              selectedAccount?.user_name,
            );
          }}
          onRetry={fetchAccounts}
        />
      )}

      {depositScreen === 'deposit-amount' && (
        <AmountScreen
          account={machineContext.context.transaction.account}
          amount={machineContext.context.transaction.amount}
          canProceed={validationGuards.canProceedFromAmountPage(machineContext.context.transaction as any)}
          transactionData={{
            user_name: machineContext.context.user.user_name,
            account_name: machineContext.context.transaction.account,
            account_id: Number(machineContext.context.transaction.account_id) || 0,
            account_currency: machineContext.context.transaction.account_currency,
            amount: machineContext.context.transaction.amount,
            amount_eur: machineContext.context.transaction.conversionAmount || 0,
            category_id: machineContext.context.transaction.category_id,
            category_name: machineContext.context.transaction.category,
            budget_name: machineContext.context.transaction.budget_name,
            destination_id: machineContext.context.transaction.destination_id,
            destination_name: machineContext.context.transaction.destination_name,
            date: '',
          } as HookTransactionData}
          conversionAmount={machineContext.context.transaction.conversionAmount}
          isLoadingConversion={machineContext.context.transaction.isLoadingConversion}
          errors={(machineContext.context.transaction as any).errors}
          isAvailable={isAvailable}
          onBack={() => machineContext.send({ type: 'NAVIGATE_BACK' })}
          onAmountChange={handleDepositAmountChange}
          onConversionAmountChange={(amount) => machineContext.send({ type: 'SET_CONVERSION_AMOUNT', amount_eur: amount })}
          onIsLoadingConversionChange={(isLoading) => machineContext.send({ type: 'SET_IS_LOADING_CONVERSION', isLoading })}
          onClearError={() => machineContext.send({ type: 'CLEAR_VALIDATION_ERROR' })}
          onNext={() => machineContext.send({ type: 'NAVIGATE_CATEGORY' })}
        />
      )}

      {depositScreen === 'deposit-category' && (
        <CategoryScreen
          categories={machineContext.context.data.categories}
          categoriesLoading={machineContext.context.ui.categories.loading}
          categoriesError={machineContext.context.ui.categories.error}
          transactionType="deposit"
          isAvailable={isAvailable}
          onBack={() => machineContext.send({ type: 'NAVIGATE_BACK' })}
          onSelectCategory={handleDepositSelectCategory}
          onRetry={fetchCategories}
        />
      )}

      {depositScreen === 'deposit-notes' && (
        <DestinationSourceNamesScreen
          transactionType="deposit"
          name={(machineContext.context.transaction as any).source_name || ''}
          category_name={machineContext.context.transaction.category}
          category_id={machineContext.context.transaction.category_id}
          suggestions={(machineContext.context.transaction as any).suggestions || []}
          isLoadingSuggestions={(machineContext.context.transaction as any).isLoadingSuggestions || false}
          suggestionsError={(machineContext.context.transaction as any).suggestionsError || null}
          errors={(machineContext.context.transaction as any).errors}
          isAvailable={isAvailable}
          onBack={() => machineContext.send({ type: 'NAVIGATE_BACK' })}
          onNameChange={handleDepositSourceChange}
          onSuggestionsChange={(suggestions) => machineContext.send({ type: 'SET_SUGGESTIONS', suggestions })}
          onLoadingSuggestionsChange={(isLoading) => machineContext.send({ type: 'SET_IS_LOADING_SUGGESTIONS', isLoading })}
          onSuggestionsErrorChange={(error) => machineContext.send({ type: 'SET_SUGGESTIONS_ERROR', error })}
          onClearError={() => machineContext.send({ type: 'CLEAR_VALIDATION_ERROR' })}
          onNext={() => machineContext.send({ type: 'NAVIGATE_CONFIRM' })}
        />
      )}

      {depositScreen === 'deposit-confirm' && (
        <ConfirmScreen
          transactionType="deposit"
          account_name={machineContext.context.transaction.account}
          amount={machineContext.context.transaction.amount}
          budget_name={machineContext.context.transaction.budget_name}
          destination_name={machineContext.context.transaction.destination_name}
          source_name={(machineContext.context.transaction as any).source_name}
          source_id={(machineContext.context.transaction as any).source_id}
          transactionData={{
            user_name: machineContext.context.user.user_name,
            account_name: machineContext.context.transaction.account,
            account_id: Number(machineContext.context.transaction.account_id) || 0,
            account_currency: machineContext.context.transaction.account_currency,
            amount: machineContext.context.transaction.amount,
            amount_eur: (() => {
              const conversionAmount = machineContext.context.transaction.conversionAmount;
              const isEUR = machineContext.context.transaction.account_currency?.toUpperCase() === 'EUR';
              const parsedAmount = Number(machineContext.context.transaction.amount) || 0;

              // Priority: Use conversion if valid, else use original amount for EUR, else 0
              if (conversionAmount && conversionAmount > 0) return conversionAmount;
              if (isEUR && parsedAmount > 0) return parsedAmount;
              return 0;
            })(),
            category_id: machineContext.context.transaction.category_id,
            category_name: machineContext.context.transaction.category,
            source_id: (machineContext.context.transaction as any).source_id,
            source_name: (machineContext.context.transaction as any).source_name,
            notes: machineContext.context.transaction.notes,
            date: '',
          } as HookTransactionData}
          isSubmitting={(machineContext.context.transaction as any).isSubmitting || false}
          submitMessage={(machineContext.context.transaction as any).submitMessage || null}
          errors={(machineContext.context.transaction as any).errors}
          isAvailable={isAvailable}
          onBack={() => machineContext.send({ type: 'NAVIGATE_BACK' })}
          onCancel={() => {
            setTransactionType('withdrawal');
            machineContext.send({ type: 'NAVIGATE_HOME' });
          }}
          onConfirm={handleDepositConfirm}
          onSuccess={() => {
            setTransactionType('withdrawal');
            machineContext.send({ type: 'NAVIGATE_HOME' });
          }}
          onIsSubmittingChange={(isSubmitting) => machineContext.send({ type: 'SET_IS_SUBMITTING', isSubmitting })}
          onSubmitMessageChange={(message) => machineContext.send({ type: 'SET_SUBMIT_MESSAGE', message })}
          onDateChange={(isoDate) => machineContext.send({ type: 'UPDATE_DATE', date: isoDate })}
          onNotesChange={(notes) => machineContext.send({ type: 'UPDATE_NOTES', notes })}
          onClearError={() => machineContext.send({ type: 'CLEAR_VALIDATION_ERROR' })}
        />
      )}


      {/* Transfer Flow - Machine-driven */}
      {transferScreen === 'transfer-source-accounts' && (
        <AccountsScreen
          accounts={machineContext.context.data.accounts}
          accountsLoading={machineContext.context.ui.accounts.loading}
          accountsError={machineContext.context.ui.accounts.error}
          isAvailable={isAvailable}
          onBack={() => machineContext.send({ type: 'NAVIGATE_HOME' })}
          onSelectAccount={(accountName) => {
            const selectedAccount = machineContext.context.data.accounts.find(acc => acc.account_name === accountName);
            if (selectedAccount) {
              machineContext.send({
                type: 'SET_TRANSFER_SOURCE',
                user_name: machineContext.context.user.user_name,
                source_account_name: selectedAccount.account_name,
                source_account_id: selectedAccount.account_id,
                source_account_currency: selectedAccount.account_currency
              });
            }
          }}
          onRetry={fetchAccounts}
        />
      )}

      {transferScreen === 'transfer-dest-accounts' && (
        <AccountsScreen
          accounts={machineContext.context.data.accounts}
          excludeAccountId={machineContext.context.transfer.source_account_id}
          accountsLoading={machineContext.context.ui.accounts.loading}
          accountsError={machineContext.context.ui.accounts.error}
          isAvailable={isAvailable}
          onBack={() => machineContext.send({ type: 'NAVIGATE_BACK' })}
          onSelectAccount={(accountName) => {
            const selectedAccount = machineContext.context.data.accounts.find(acc => acc.account_name === accountName);
            if (selectedAccount) {
              machineContext.send({
                type: 'SET_TRANSFER_DEST',
                destination_account_name: selectedAccount.account_name,
                destination_account_id: selectedAccount.account_id,
                destination_account_currency: selectedAccount.account_currency
              });
            }
          }}
          onRetry={fetchAccounts}
        />
      )}

      {transferScreen === 'transfer-amount' && (
        <TransferAmountScreen
          sourceAccount={machineContext.context.transfer.source_account_name}
          destAccount={machineContext.context.transfer.destination_account_name}
          sourceCurrency={machineContext.context.transfer.source_account_currency}
          destCurrency={machineContext.context.transfer.destination_account_currency}
          sourceAmount={machineContext.context.transfer.source_amount}
          destAmount={machineContext.context.transfer.destination_amount}
          exchangeRate={machineContext.context.transfer.exchange_rate}
          errors={machineContext.context.transfer.errors}
          isAvailable={isAvailable}
          onBack={() => machineContext.send({ type: 'NAVIGATE_BACK' })}
          onSourceAmountChange={(source_amount) => machineContext.send({ type: 'UPDATE_TRANSFER_SOURCE_AMOUNT', source_amount })}
          onDestAmountChange={(destination_amount) => machineContext.send({ type: 'UPDATE_TRANSFER_DEST_AMOUNT', destination_amount })}
          onExchangeRateChange={(exchange_rate) => machineContext.send({ type: 'UPDATE_TRANSFER_EXCHANGE_RATE', exchange_rate })}
          onClearError={() => machineContext.send({ type: 'CLEAR_TRANSFER_VALIDATION_ERROR' })}
          onNext={() => machineContext.send({ type: 'NAVIGATE_TRANSFER_FEES' })}
        />
      )}

      {transferScreen === 'transfer-fees' && (
        <TransferFeeScreen
          sourceAccount={machineContext.context.transfer.source_account_name}
          destAccount={machineContext.context.transfer.destination_account_name}
          sourceCurrency={machineContext.context.transfer.source_account_currency}
          destCurrency={machineContext.context.transfer.destination_account_currency}
          sourceFee={machineContext.context.transfer.source_fee}
          destFee={machineContext.context.transfer.destination_fee}
          isAvailable={isAvailable}
          onBack={() => machineContext.send({ type: 'NAVIGATE_BACK' })}
          onSourceFeeChange={(source_fee) => machineContext.send({ type: 'UPDATE_TRANSFER_SOURCE_FEE', source_fee })}
          onDestFeeChange={(destination_fee) => machineContext.send({ type: 'UPDATE_TRANSFER_DEST_FEE', destination_fee })}
          onNext={() => machineContext.send({ type: 'NAVIGATE_TRANSFER_CONFIRM' })}
          onSkip={() => {
            machineContext.send({ type: 'UPDATE_TRANSFER_SOURCE_FEE', source_fee: '0' });
            machineContext.send({ type: 'UPDATE_TRANSFER_DEST_FEE', destination_fee: '0' });
            machineContext.send({ type: 'NAVIGATE_TRANSFER_CONFIRM' });
          }}
        />
      )}

      {transferScreen === 'transfer-confirm' && (
        <TransferConfirmScreen
          sourceAccount={machineContext.context.transfer.source_account_name}
          destAccount={machineContext.context.transfer.destination_account_name}
          sourceCurrency={machineContext.context.transfer.source_account_currency}
          destCurrency={machineContext.context.transfer.destination_account_currency}
          sourceAmount={machineContext.context.transfer.source_amount}
          destAmount={machineContext.context.transfer.destination_amount}
          sourceFee={machineContext.context.transfer.source_fee}
          destFee={machineContext.context.transfer.destination_fee}
          comment={machineContext.context.transfer.notes}
          userName={machineContext.context.user.user_name}
          isAvailable={isAvailable}
          onBack={() => machineContext.send({ type: 'NAVIGATE_BACK' })}
          onCancel={() => machineContext.send({ type: 'NAVIGATE_HOME' })}
          onConfirm={() => machineContext.send({ type: 'SUBMIT_TRANSFER' })}
          onSuccess={() => machineContext.send({ type: 'NAVIGATE_HOME' })}
        />
      )}

      {currentScreen === 'debug' && (
        <DebugScreen
          userName={user_name}
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
