import { useState, useEffect, useRef } from 'react';
import { useTelegramUser } from './hooks/useTelegramUser';
import { syncService } from './services/sync';
import telegramService from './services/telegram';
import { getInitialServiceStatuses, type ServiceStatus } from './utils/serviceStatus';
import { refreshHomeTransactionCache } from './utils/cache';
import { useBudgetMachineContext } from './context/BudgetMachineContext';
import { validationGuards, validateTransferFeePage } from './machines/actions';

// Components
import HomeScreen from './components/HomeScreen';
import AccountsScreen from './components/AccountsScreen';
import AmountScreen from './components/AmountScreen';
import CategoryScreen from './components/CategoryScreen';
import DestinationSourceNamesScreen from './components/DestinationSourceNamesScreen';
import ConfirmScreen from './components/ConfirmScreen';
import TransferFeeScreen from './components/TransferFeeScreen';
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
  // Service status states (kept local; machine tracks only transaction flows)
  const [serviceStatuses, setServiceStatuses] = useState<ServiceStatus[]>(getInitialServiceStatuses());
  const [telegramStatus, setTelegramStatus] = useState<ServiceStatus | null>(null);

  // Category fetch dedupe key
  const lastCategoriesKeyRef = useRef<string | null>(null);

  // Get Telegram user data
  const { user_name, userFullName, userPhotoUrl, userInitials, userBio, isAvailable } = useTelegramUser();

  // Get machine context for state and actions (withdrawal flow)
  const machineContext = useBudgetMachineContext();

  // Screen derivations from machine state
  const isHomeScreen = machineContext.state.matches({ ready: 'home' });
  const isDebugScreen = machineContext.state.matches({ ready: 'debug' });
  const isTransactionsList = machineContext.state.matches({ ready: { transactions: 'list' } });
  const isTransactionsDetail = machineContext.state.matches({ ready: { transactions: 'detail' } });
  const isTransactionsEdit = machineContext.state.matches({ ready: { transactions: 'edit' } });

  // Determine current withdrawal screen from machine state
  const withdrawalScreen = getWithdrawalScreenFromMachineState(machineContext.state);
  const depositScreen = getDepositScreenFromMachineState(machineContext.state);
  const transferScreen = getTransferScreenFromMachineState(machineContext.state);

  // Fetch accounts when an accounts screen is active (withdrawal, deposit, transfer)
  useEffect(() => {
    if (
      withdrawalScreen === 'withdrawal-accounts' ||
      depositScreen === 'deposit-accounts' ||
      transferScreen === 'transfer-source-accounts' ||
      transferScreen === 'transfer-dest-accounts'
    ) {
      fetchAccounts();
    }
  }, [withdrawalScreen, depositScreen, transferScreen, user_name]);

  // Fetch categories when category screen is opened (withdrawal/deposit)
  useEffect(() => {
    if (withdrawalScreen === 'withdrawal-category' || depositScreen === 'deposit-category') {
      fetchCategories();
    }
  }, [withdrawalScreen, depositScreen, user_name]);

  // Check service connections when debug screen is opened
  useEffect(() => {
    if (isDebugScreen) {
      checkServiceConnections();
    }
  }, [isDebugScreen]);

  // Ensure selected transaction is hydrated when navigating directly to detail
  useEffect(() => {
    if (isTransactionsDetail && !machineContext.context.selectedTransaction.id) {
      const transactionId = sessionStorage.getItem('selectedTransactionId');
      if (transactionId) {
        machineContext.send({ type: 'SELECT_TRANSACTION', id: transactionId });
      }
    }
  }, [isTransactionsDetail, machineContext.context.selectedTransaction.id, machineContext]);

  const fetchAccounts = async () => {
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

      machineContext.send({ type: 'FETCH_ACCOUNTS_SUCCESS', accounts: uniqueAccounts });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch accounts';
      console.error('❌ Failed to fetch accounts:', {
        error,
        message: errorMessage,
        user_name,
        syncConfigured: syncService.isConfigured()
      });
      machineContext.send({ type: 'FETCH_ACCOUNTS_ERROR', error: errorMessage });
    }
  };

  const buildTransferNotes = () => {
    const t = machineContext.context.transfer;
    const sourceFee = t.source_fee || '0';
    const destFee = t.destination_fee || '0';

    return `transfer from ${t.source_account_name} ${t.source_amount} ${t.source_account_currency} to ${t.destination_account_name} ${t.destination_amount} ${t.destination_account_currency}. source fee ${sourceFee} ${t.source_account_currency}, destination fee ${destFee} ${t.destination_account_currency}`;
  };

  const fetchCategories = async () => {
    const typeParam = withdrawalScreen ? 'withdrawal' : depositScreen ? 'deposit' : undefined;
    const typeKey = `${user_name || 'unknown'}|${typeParam || 'all'}`;

    // Skip duplicate fetches for the same user/type when we already have data
    const existingCategories = machineContext.context.data.categories || [];
    if (lastCategoriesKeyRef.current === typeKey && existingCategories.length > 0) {
      return;
    }

    machineContext.send({ type: 'FETCH_CATEGORIES' });

    try {
      if (enableDebugLogs) {
        console.log('🔍 Fetching categories for user:', user_name, 'type:', typeParam);
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
      machineContext.send({ type: 'FETCH_CATEGORIES_ERROR', error: errorMessage });
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
  const handleWithdrawalSelectAccount = (accountName: string, accountId?: string | number, currency?: string, user?: string) => {
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
    machineContext.send({ type: 'SUBMIT_TRANSACTION' });
  };

  // ===== DEPOSIT FLOW HANDLERS (Machine-driven) =====
  const handleDepositSelectAccount = (accountName: string, accountId?: string | number, currency?: string, user?: string) => {
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
    switch (screen) {
      case 'accounts':
        machineContext.send({ type: 'NAVIGATE_WITHDRAWAL_ACCOUNTS' });
        break;
      case 'deposit-accounts':
        machineContext.send({ type: 'NAVIGATE_DEPOSIT_ACCOUNTS' });
        void fetchAccounts();
        break;
      case 'transfer-source-accounts':
        machineContext.send({ type: 'NAVIGATE_TRANSFER_SOURCE' });
        void fetchAccounts();
        break;
      case 'transactions':
        machineContext.send({ type: 'NAVIGATE_TRANSACTIONS' });
        break;
      case 'transaction-detail': {
        const selectedId = sessionStorage.getItem('selectedTransactionId');
        machineContext.send({ type: 'NAVIGATE_TRANSACTIONS' });
        if (selectedId) {
          // Defer to ensure state moves into transactions list before selecting
          setTimeout(() => machineContext.send({ type: 'SELECT_TRANSACTION', id: selectedId }), 0);
        }
        break;
      }
      case 'debug':
        machineContext.send({ type: 'NAVIGATE_DEBUG' });
        break;
      default:
        machineContext.send({ type: 'NAVIGATE_HOME' });
    }
  };

  // Transaction handlers
  const handleSelectTransaction = (transactionId: string) => {
    sessionStorage.setItem('selectedTransactionId', transactionId);
    if (!machineContext.state.matches({ ready: 'transactions' })) {
      machineContext.send({ type: 'NAVIGATE_TRANSACTIONS' });
    }
    machineContext.send({ type: 'SELECT_TRANSACTION', id: transactionId });
  };

  const handleEditTransaction = async (transactionId: string, rawData: APITransactionData) => {
    // Get the display transaction from session or reconstruct from raw data
    const storedId = sessionStorage.getItem('selectedTransactionId');
    if (storedId) {
      // We'll need to fetch the display transaction - for now use raw data to reconstruct
      // In a real scenario, we'd have already fetched this
      const editingTransaction: DisplayTransaction = {
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
      };

      machineContext.send({ type: 'SELECT_TRANSACTION', id: transactionId, rawData, editing: editingTransaction });
      machineContext.send({ type: 'NAVIGATE_TRANSACTION_EDIT' });
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
      machineContext.send({ type: 'NAVIGATE_TRANSACTIONS' });
    } catch (error) {
      console.error('Error deleting transaction:', error);
      alert('Failed to delete transaction');
    }
  };

  // Get back handler for current screen (handles both machine and legacy states)
  const getBackHandler = () => {
    if (machineContext.state.matches({ ready: 'withdrawalFlow' })) return () => machineContext.send({ type: 'NAVIGATE_BACK' });
    if (machineContext.state.matches({ ready: 'depositFlow' })) return () => machineContext.send({ type: 'NAVIGATE_BACK' });
    if (machineContext.state.matches({ ready: 'transferFlow' })) return () => machineContext.send({ type: 'NAVIGATE_BACK' });
    if (machineContext.state.matches({ ready: 'transactions' })) return () => machineContext.send({ type: 'NAVIGATE_BACK' });
    if (machineContext.state.matches({ ready: 'debug' })) return () => machineContext.send({ type: 'NAVIGATE_BACK' });
    return () => machineContext.send({ type: 'NAVIGATE_HOME' });
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
        isHome={isHomeScreen}
      />

      {/* Screen Router */}
      {isHomeScreen && (
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
            notes: machineContext.context.transaction.notes,
            date: ''
          } as HookTransactionData}
          isSubmitting={(machineContext.context.transaction as any).isSubmitting || false}
          submitMessage={(machineContext.context.transaction as any).submitMessage || null}
          errors={(machineContext.context.transaction as any).errors}
          isAvailable={isAvailable}
          onBack={() => machineContext.send({ type: 'NAVIGATE_BACK' })}
          onCancel={() => machineContext.send({ type: 'NAVIGATE_HOME' })}
          onConfirm={handleWithdrawalConfirm}
          onSuccess={() => {
            machineContext.send({ type: 'NAVIGATE_HOME' });
          }}
          onIsSubmittingChange={(isSubmitting) => machineContext.send({ type: 'SET_IS_SUBMITTING', isSubmitting })}
          onSubmitMessageChange={(message) => machineContext.send({ type: 'SET_SUBMIT_MESSAGE', message })}
          onDateChange={(isoDate) => machineContext.send({ type: 'UPDATE_DATE', date: isoDate })}
          onNotesChange={(notes) => machineContext.send({ type: 'UPDATE_NOTES', notes })}
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
          onCancel={() => machineContext.send({ type: 'NAVIGATE_HOME' })}
          onConfirm={handleDepositConfirm}
          onSuccess={() => {
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
        <AmountScreen
          mode="transfer"
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
          errors={machineContext.context.transfer.errors}
          onBack={() => machineContext.send({ type: 'NAVIGATE_BACK' })}
          onSourceFeeChange={(source_fee) => machineContext.send({ type: 'UPDATE_TRANSFER_SOURCE_FEE', source_fee })}
          onDestFeeChange={(destination_fee) => machineContext.send({ type: 'UPDATE_TRANSFER_DEST_FEE', destination_fee })}
          onClearError={() => machineContext.send({ type: 'CLEAR_TRANSFER_VALIDATION_ERROR' })}
          onNext={() => {
            const error = validateTransferFeePage(machineContext.context.transfer as any);
            if (error) {
              machineContext.send({ type: 'SET_TRANSFER_VALIDATION_ERROR', page: 'fees', error });
              return;
            }
            machineContext.send({ type: 'CLEAR_TRANSFER_VALIDATION_ERROR' });
            machineContext.send({ type: 'UPDATE_TRANSFER_NOTES', notes: buildTransferNotes() });
            machineContext.send({ type: 'NAVIGATE_TRANSFER_CONFIRM' });
          }}
        />
      )}

      {transferScreen === 'transfer-confirm' && (
        <ConfirmScreen
          transactionType="transfer"
          sourceAccount={machineContext.context.transfer.source_account_name}
          destAccount={machineContext.context.transfer.destination_account_name}
          sourceCurrency={machineContext.context.transfer.source_account_currency}
          destCurrency={machineContext.context.transfer.destination_account_currency}
          sourceAmount={machineContext.context.transfer.source_amount}
          destAmount={machineContext.context.transfer.destination_amount}
          sourceFee={machineContext.context.transfer.source_fee}
          destFee={machineContext.context.transfer.destination_fee}
          transactionData={{
            user_name: machineContext.context.user.user_name,
            account_name: machineContext.context.transfer.source_account_name,
            account_id: Number(machineContext.context.transfer.source_account_id) || 0,
            account_currency: machineContext.context.transfer.source_account_currency,
            amount: machineContext.context.transfer.source_amount,
            amount_eur: Number(machineContext.context.transfer.source_amount) || 0,
            category_id: 0,
            category_name: '',
            budget_name: '',
            destination_id: Number(machineContext.context.transfer.destination_account_id) || 0,
            destination_name: machineContext.context.transfer.destination_account_name,
            source_id: Number(machineContext.context.transfer.source_account_id) || 0,
            source_name: machineContext.context.transfer.source_account_name,
            notes: machineContext.context.transfer.notes,
            date: machineContext.context.transfer.date,
          } as HookTransactionData}
          isSubmitting={false}
          submitMessage={null}
          errors={{}}
          isAvailable={isAvailable}
          onBack={() => machineContext.send({ type: 'NAVIGATE_BACK' })}
          onCancel={() => machineContext.send({ type: 'NAVIGATE_HOME' })}
          onConfirm={() => machineContext.send({ type: 'SUBMIT_TRANSFER' })}
          onSuccess={() => machineContext.send({ type: 'NAVIGATE_HOME' })}
          onIsSubmittingChange={() => {}}
          onSubmitMessageChange={() => {}}
          onDateChange={(date) => machineContext.send({ type: 'UPDATE_TRANSFER_DATE', date })}
          onNotesChange={(notes) => machineContext.send({ type: 'UPDATE_TRANSFER_NOTES', notes })}
          onClearError={() => {}}
        />
      )}

      {isDebugScreen && (
        <DebugScreen
          userName={user_name}
          isAvailable={isAvailable}
          serviceStatuses={serviceStatuses}
          telegramStatus={telegramStatus || undefined}
          onBack={() => machineContext.send({ type: 'NAVIGATE_HOME' })}
          onRefresh={checkServiceConnections}
        />
      )}

      {/* Transactions List Screen */}
      {isTransactionsList && (
        <TransactionsListScreen
          onBack={() => machineContext.send({ type: 'NAVIGATE_HOME' })}
          onSelectTransaction={handleSelectTransaction}
          isAvailable={isAvailable}
        />
      )}

      {/* Transaction Detail Screen */}
      {isTransactionsDetail && machineContext.context.selectedTransaction.id && (
        <TransactionDetailScreen
          transactionId={machineContext.context.selectedTransaction.id}
          onBack={() => {
            sessionStorage.removeItem('selectedTransactionId');
            machineContext.send({ type: 'NAVIGATE_BACK' });
          }}
          onEdit={handleEditTransaction}
          onDelete={handleDeleteTransaction}
          isAvailable={isAvailable}
        />
      )}

      {/* Transaction Edit Screen */}
      {isTransactionsEdit &&
        machineContext.context.selectedTransaction.editing &&
        machineContext.context.selectedTransaction.rawData && (
        <TransactionEditScreen
          transaction={machineContext.context.selectedTransaction.editing}
          rawData={machineContext.context.selectedTransaction.rawData as APITransactionData}
          onBack={() => machineContext.send({ type: 'NAVIGATE_BACK' })}
          onSuccess={() => {
            machineContext.send({ type: 'CLEAR_SELECTED_TRANSACTION' });
            machineContext.send({ type: 'NAVIGATE_BACK' });
          }}
          isAvailable={isAvailable}
        />
      )}

    </div>
  );
};

export default BudgetMiniApp;
