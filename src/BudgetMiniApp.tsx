import { useState, useEffect, useCallback, useRef } from 'react';
import { useTelegramUser } from './hooks/useTelegramUser';
import { useTransactionData, type TransactionData as FlowTransactionData } from './hooks/useTransactionData';

import { syncService, type AccountUsage, type CategoryUsage } from './services/sync';
import telegramService from './services/telegram';
import { getInitialServiceStatuses, type ServiceStatus } from './utils/serviceStatus';
import { refreshHomeTransactionCache, accountsCache, categoriesCache, clearAllDataCaches } from './utils/cache';

// Components
import HomeScreen from './components/HomeScreen';
import AccountsScreen from './components/AccountsScreen';
import AmountScreen from './components/AmountScreen';
import IncomeCategoryScreen from './components/IncomeCategoryScreen';
import ExpenseCategoryScreen from './components/ExampseCategoryScreen';
import DestinationNameCommentScreen from './components/DestinationNameCommentScreen';
import SourceNameCommentScreen from './components/SourceNameCommentScreen';
import ConfirmScreen from './components/ConfirmScreen';
import IncomeConfirmScreen from './components/IncomeConfirmScreen';
import TransferAmountScreen from './components/TransferAmountScreen';
import TransferFeeScreen from './components/TransferFeeScreen';
import TransferConfirmScreen from './components/TransferConfirmScreen';
import DebugScreen from './components/DebugScreen';
import TransactionsListScreen from './components/TransactionsListScreen';
import TransactionDetailScreen from './components/TransactionDetailScreen';
import TransactionEditScreen from './components/TransactionEditScreen';
import type { DisplayTransaction, TransactionData as FireflyTransactionData } from './types/transaction';

type FlowType = 'expense' | 'income';

type Screen =
  | 'home'
  | 'expense-accounts'
  | 'expense-amount'
  | 'expense-category'
  | 'expense-comment'
  | 'expense-confirm'
  | 'income-accounts'
  | 'income-amount'
  | 'income-category'
  | 'income-comment'
  | 'income-confirm'
  | 'transfer-source-accounts'
  | 'transfer-dest-accounts'
  | 'transfer-amount'
  | 'transfer-fees'
  | 'transfer-comment'
  | 'transfer-confirm'
  | 'debug'
  | 'transactions'
  | 'transaction-detail'
  | 'transaction-edit';

const BudgetMiniApp = () => {
  const [currentScreen, setCurrentScreen] = useState<Screen>('home');

  // Service status states
  const [serviceStatuses, setServiceStatuses] = useState<ServiceStatus[]>(getInitialServiceStatuses());
  const [telegramStatus, setTelegramStatus] = useState<ServiceStatus | null>(null);

  // Accounts state
  const [accounts, setAccounts] = useState<AccountUsage[]>([]);
  const [accountsLoading, setAccountsLoading] = useState(false);
  const [accountsError, setAccountsError] = useState<string | null>(null);

  // Expense categories
  const [expenseCategories, setExpenseCategories] = useState<CategoryUsage[]>([]);
  const [expenseCategoriesLoading, setExpenseCategoriesLoading] = useState(false);
  const [expenseCategoriesError, setExpenseCategoriesError] = useState<string | null>(null);
  const [expenseCategoryId, setExpenseCategoryId] = useState<number | null>(null);
  const [expenseReview, setExpenseReview] = useState<FlowTransactionData | null>(null);

  // Income categories
  const [incomeCategories, setIncomeCategories] = useState<CategoryUsage[]>([]);
  const [incomeCategoriesLoading, setIncomeCategoriesLoading] = useState(false);
  const [incomeCategoriesError, setIncomeCategoriesError] = useState<string | null>(null);
  const [incomeCategoryId, setIncomeCategoryId] = useState<number | null>(null);
  const [incomeReview, setIncomeReview] = useState<FlowTransactionData | null>(null);

  // Comment reset key (forces comment screen remount when backing out)
  const [commentResetKey, setCommentResetKey] = useState(0);
  const expenseAmountRef = useRef<string>('');
  const incomeAmountRef = useRef<string>('');

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
  const [selectedTransactionData, setSelectedTransactionData] = useState<FireflyTransactionData | null>(null);
  const [editingTransaction, setEditingTransaction] = useState<DisplayTransaction | null>(null);

  // Telegram user data
  const { userName, userFullName, userPhotoUrl, userInitials, userBio, isAvailable, user } = useTelegramUser();

  // Separate transaction data for each flow
  const expenseFlow = useTransactionData('expense');
  const incomeFlow = useTransactionData('income');

  const getFlowApi = (flow: FlowType) => (flow === 'income' ? incomeFlow : expenseFlow);

  const resetFlowState = useCallback((flow: FlowType) => {
    const api = getFlowApi(flow);
    api.resetTransactionData();
    if (flow === 'income') {
      setIncomeCategoryId(null);
      setIncomeReview(null);
      incomeAmountRef.current = '';
    } else {
      setExpenseCategoryId(null);
      setExpenseReview(null);
      expenseAmountRef.current = '';
    }
  }, [expenseFlow, incomeFlow]);

  const handleFlowExitToHome = useCallback((flow: FlowType, clearCaches?: boolean) => {
    resetFlowState(flow);
    if (flow === 'income') {
      setIncomeReview(null);
    } else {
      setExpenseReview(null);
    }
    if (clearCaches) {
      clearAllDataCaches();
    }
    setCurrentScreen('home');
  }, [resetFlowState]);

  const fetchAccounts = useCallback(async () => {
    const cacheKey = userName || 'all';

    const cached = accountsCache.get(cacheKey);
    if (cached) {
      setAccounts(cached);
      return;
    }

    setAccountsLoading(true);
    setAccountsError(null);

    try {
      const isUnknownUser = userName === 'User' || userName === 'Guest';
      const data = await syncService.getAccountsUsage(isUnknownUser ? undefined : userName);

      const uniqueAccounts = data.get_accounts_usage.filter(
        (account, index, self) =>
          index === self.findIndex((a) => a.account_id === account.account_id)
      );

      accountsCache.set(cacheKey, uniqueAccounts);
      setAccounts(uniqueAccounts);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch accounts';
      setAccountsError(errorMessage);
    } finally {
      setAccountsLoading(false);
    }
  }, [userName]);

  const fetchCategories = useCallback(async (flow: FlowType) => {
    const categoryType = flow === 'income' ? 'deposit' : 'withdrawal';
    const cacheKey = `${userName || 'all'}_${categoryType}`;

    const setData = flow === 'income' ? setIncomeCategories : setExpenseCategories;
    const setLoading = flow === 'income' ? setIncomeCategoriesLoading : setExpenseCategoriesLoading;
    const setError = flow === 'income' ? setIncomeCategoriesError : setExpenseCategoriesError;

    const cached = categoriesCache.get(cacheKey);
    if (cached) {
      setData(cached);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const isUnknownUser = userName === 'User' || userName === 'Guest';
      const data = await syncService.getCategoriesUsage(
        isUnknownUser ? undefined : userName,
        categoryType
      );

      categoriesCache.set(cacheKey, data.get_categories_usage);
      setData(data.get_categories_usage);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch categories';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [userName]);

  const preloadFlowData = useCallback((flow: FlowType) => {
    fetchAccounts();
    fetchCategories(flow);
  }, [fetchAccounts, fetchCategories]);

  const getTransactionDataForFlow = (flow: FlowType): FlowTransactionData => {
    const data = getFlowApi(flow).transactionData;
    return {
      ...data,
      category: data.category,
      amount: data.amount,
      account: data.account,
      account_id: data.account_id,
      account_currency: data.account_currency,
      comment: data.comment
    };
  };

  const buildReview = (flow: FlowType): FlowTransactionData => {
    return getTransactionDataForFlow(flow);
  };

  const restoreFlowFromReview = useCallback((flow: FlowType) => {
    const review = flow === 'income' ? incomeReview : expenseReview;
    if (!review) return;

    const api = getFlowApi(flow);
    api.updateAccount(review.account);
    api.updateAmount(review.amount);
    api.updateCategory(review.category);
    api.updateComment(review.comment);
    if (review.account_id || review.account_currency || review.username) {
      api.updateAccountWithDetails(
        review.account,
        review.account_id || '',
        review.account_currency || '',
        review.username || ''
      );
    }
  }, [expenseReview, getFlowApi, incomeReview]);

  // Fetch lists when entering account selection screens
  useEffect(() => {
    if (currentScreen === 'expense-accounts') {
      preloadFlowData('expense');
    } else if (currentScreen === 'income-accounts') {
      preloadFlowData('income');
    } else if (currentScreen === 'transfer-source-accounts' || currentScreen === 'transfer-dest-accounts') {
      fetchAccounts();
    }
  }, [currentScreen, fetchAccounts, preloadFlowData]);

  // Fetch categories when landing on category screens
  useEffect(() => {
    if (currentScreen === 'expense-category') {
      fetchCategories('expense');
    } else if (currentScreen === 'income-category') {
      fetchCategories('income');
    }
  }, [currentScreen, fetchCategories]);

  // Restore last typed amount when coming back from category -> amount
  useEffect(() => {
    if (currentScreen === 'income-amount' && incomeAmountRef.current) {
      incomeFlow.updateAmount(incomeAmountRef.current);
    }
    if (currentScreen === 'expense-amount' && expenseAmountRef.current) {
      expenseFlow.updateAmount(expenseAmountRef.current);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
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

  // Run service checks when entering debug screen
  useEffect(() => {
    if (currentScreen === 'debug') {
      checkServiceConnections();
    }
  }, [currentScreen]);

  // Manage Telegram BackButton visibility and behavior
  useEffect(() => {
    const tg = window.Telegram?.WebApp;
    if (!tg) return;

    const backHandler = (() => {
      switch (currentScreen) {
        case 'home':
          return null;
        case 'expense-accounts':
          return () => handleFlowExitToHome('expense');
        case 'expense-amount':
          return () => setCurrentScreen('expense-accounts');
        case 'expense-category':
          return () => setCurrentScreen('expense-amount');
        case 'expense-comment':
          return () => {
            setCommentResetKey((key) => key + 1);
            setCurrentScreen('expense-category');
          };
        case 'expense-confirm':
          return () => setCurrentScreen('expense-comment');
        case 'income-accounts':
          return () => handleFlowExitToHome('income');
        case 'income-amount':
          return () => setCurrentScreen('income-accounts');
        case 'income-category':
          return () => setCurrentScreen('income-amount');
        case 'income-comment':
          return () => {
            setCommentResetKey((key) => key + 1);
            setCurrentScreen('income-category');
          };
        case 'income-confirm':
          return () => setCurrentScreen('income-comment');
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
          return null;
      }
    })();

    if (backHandler) {
      tg.BackButton.show();
      tg.BackButton.onClick(backHandler);
      return () => tg.BackButton.offClick(backHandler);
    }

    tg.BackButton.hide();
  }, [currentScreen, handleFlowExitToHome]);

  const checkServiceConnections = async () => {
    setServiceStatuses(getInitialServiceStatuses());

    setTimeout(() => {
      const isReady = telegramService.isReady();
      setTelegramStatus({
        name: 'Telegram SDK',
        status: isReady ? 'connected' : 'disconnected',
        message: telegramService.getConnectionStatus()
      });
    }, 300);

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
  };

  const startFlow = (flow: FlowType) => {
    resetFlowState(flow);
    if (flow === 'income') {
      setIncomeReview(null);
    } else {
      setExpenseReview(null);
    }
    setCurrentScreen(flow === 'income' ? 'income-accounts' : 'expense-accounts');
    preloadFlowData(flow);
  };

  const handleNavigate = (screen: string) => {
    if (screen === 'accounts' || screen === 'expense-accounts' || screen === 'expense') {
      startFlow('expense');
      return;
    }
    if (screen === 'income-accounts' || screen === 'income') {
      startFlow('income');
      return;
    }
    if (screen === 'transfer-source-accounts') {
      setCurrentScreen('transfer-source-accounts');
      return;
    }
    setCurrentScreen(screen as Screen);
  };

  const handleSelectAccount = (flow: FlowType, accountName: string) => {
    const flowApi = getFlowApi(flow);
    const selectedAccount = accounts.find(acc => acc.account_name === accountName);
    const previousAccountId = flowApi.transactionData.account_id;

    if (selectedAccount) {
      flowApi.updateAccountWithDetails(
        selectedAccount.account_name,
        selectedAccount.account_id,
        selectedAccount.account_currency,
        selectedAccount.user_name
      );
      if (user?.id) {
        flowApi.setUserData(user.id, userName);
      }
    } else {
      flowApi.updateAccount(accountName);
    }

    if (selectedAccount?.account_id !== previousAccountId) {
      flowApi.updateAmount('');
      flowApi.updateCategory('');
      flowApi.updateComment('');
      flowApi.updateAmountForeign('');
      if (flow === 'income') {
        setIncomeCategoryId(null);
      } else {
        setExpenseCategoryId(null);
      }
    }

    setCurrentScreen(flow === 'income' ? 'income-amount' : 'expense-amount');
  };

  const handleAmountChange = (flow: FlowType, value: string) => {
    getFlowApi(flow).updateAmount(value);
    if (flow === 'income') {
      incomeAmountRef.current = value;
    } else {
      expenseAmountRef.current = value;
    }
  };

  const handleCategorySelect = (flow: FlowType, category: string) => {
    const flowApi = getFlowApi(flow);
    const categories = flow === 'income' ? incomeCategories : expenseCategories;
    const selected = categories.find(cat => cat.category_name === category);
    const derivedCategoryId = selected?.category_id ?? selected?.category_id1 ?? null;

    flowApi.updateCategory(category);
    if (flow === 'income') {
      setIncomeCategoryId(derivedCategoryId !== undefined && derivedCategoryId !== null ? Number(derivedCategoryId) : null);
    } else {
      setExpenseCategoryId(derivedCategoryId !== undefined && derivedCategoryId !== null ? Number(derivedCategoryId) : null);
    }
    setCurrentScreen(flow === 'income' ? 'income-comment' : 'expense-comment');
  };

  const handleSelectTransaction = (transactionId: string) => {
    setSelectedTransactionId(transactionId);
    sessionStorage.setItem('selectedTransactionId', transactionId);
    setCurrentScreen('transaction-detail');
  };

  const handleEditTransaction = async (transactionId: string, rawData: FireflyTransactionData) => {
    setSelectedTransactionData(rawData);
    const storedId = sessionStorage.getItem('selectedTransactionId');
    if (storedId) {
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
      const response = await syncService.deleteTransaction(transactionId);
      if (response.success) {
        await refreshHomeTransactionCache();
        clearAllDataCaches();
        sessionStorage.removeItem('selectedTransactionId');
        setSelectedTransactionId(null);
        setCurrentScreen('transactions');
      } else {
        alert(`Failed to delete transaction: ${response.error}`);
      }
    } catch (error) {
      alert('Failed to delete transaction');
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

      {currentScreen === 'expense-accounts' && (
        <AccountsScreen
          accounts={accounts}
          accountsLoading={accountsLoading}
          accountsError={accountsError}
          isAvailable={isAvailable}
          onBack={() => handleFlowExitToHome('expense')}
          onSelectAccount={(accountName) => handleSelectAccount('expense', accountName)}
          onRetry={fetchAccounts}
        />
      )}

      {currentScreen === 'income-accounts' && (
        <AccountsScreen
          accounts={accounts}
          accountsLoading={accountsLoading}
          accountsError={accountsError}
          isAvailable={isAvailable}
          onBack={() => handleFlowExitToHome('income')}
          onSelectAccount={(accountName) => handleSelectAccount('income', accountName)}
          onRetry={fetchAccounts}
        />
      )}

      {currentScreen === 'expense-amount' && (
        <AmountScreen
          account={expenseFlow.transactionData.account}
          amount={expenseFlow.transactionData.amount}
          transactionData={expenseFlow.transactionData}
          isAvailable={isAvailable}
          onBack={() => {
            setExpenseReview(null);
            setExpenseCategoryId(null);
            expenseFlow.updateAmount('');
            expenseFlow.updateCategory('');
            expenseFlow.updateComment('');
            expenseAmountRef.current = '';
            setCurrentScreen('expense-accounts');
          }}
          onAmountChange={(value) => handleAmountChange('expense', value)}
          onNext={() => setCurrentScreen('expense-category')}
        />
      )}

      {currentScreen === 'income-amount' && (
        <AmountScreen
          account={incomeFlow.transactionData.account}
          amount={incomeFlow.transactionData.amount}
          transactionData={incomeFlow.transactionData}
          isAvailable={isAvailable}
          onBack={() => {
            setIncomeReview(null);
            setIncomeCategoryId(null);
            incomeFlow.updateAmount('');
            incomeFlow.updateCategory('');
            incomeFlow.updateComment('');
            incomeAmountRef.current = '';
            setCurrentScreen('income-accounts');
          }}
          onAmountChange={(value) => handleAmountChange('income', value)}
          onNext={() => setCurrentScreen('income-category')}
        />
      )}

      {currentScreen === 'income-category' && (
        <IncomeCategoryScreen
          categories={incomeCategories}
          categoriesLoading={incomeCategoriesLoading}
          categoriesError={incomeCategoriesError}
          onSelectCategory={(category) => handleCategorySelect('income', category)}
          onRetry={() => fetchCategories('income')}
        />
      )}

      {currentScreen === 'expense-category' && (
        <ExpenseCategoryScreen
          categories={expenseCategories}
          categoriesLoading={expenseCategoriesLoading}
          categoriesError={expenseCategoriesError}
          onSelectCategory={(category) => handleCategorySelect('expense', category)}
          onRetry={() => fetchCategories('expense')}
        />
      )}

      {currentScreen === 'expense-comment' && (
        <DestinationNameCommentScreen
          key={commentResetKey}
          comment={expenseFlow.transactionData.comment}
          category={expenseFlow.transactionData.category}
          categoryId={expenseCategoryId}
          onCommentChange={expenseFlow.updateComment}
          onNext={() => {
            setExpenseReview(buildReview('expense'));
            setCurrentScreen('expense-confirm');
          }}
        />
      )}

      {currentScreen === 'income-comment' && (
        <SourceNameCommentScreen
          key={commentResetKey}
          comment={incomeFlow.transactionData.comment}
          category={incomeFlow.transactionData.category}
          categoryId={incomeCategoryId}
          onCommentChange={incomeFlow.updateComment}
          onNext={() => {
            setIncomeReview(buildReview('income'));
            setCurrentScreen('income-confirm');
          }}
        />
      )}

      {currentScreen === 'expense-confirm' && (
        <ConfirmScreen
          account={expenseReview?.account || expenseFlow.transactionData.account}
          amount={expenseReview?.amount || expenseFlow.transactionData.amount}
          category={expenseReview?.category || expenseFlow.transactionData.category}
          comment={expenseReview?.comment || expenseFlow.transactionData.comment}
          transactionData={expenseReview || getTransactionDataForFlow('expense')}
          isAvailable={isAvailable}
          onBack={() => {
            restoreFlowFromReview('expense');
            setCurrentScreen('expense-comment');
          }}
          onCancel={() => handleFlowExitToHome('expense', true)}
          onConfirm={() => handleFlowExitToHome('expense', true)}
          onSuccess={() => handleFlowExitToHome('expense', true)}
        />
      )}

      {currentScreen === 'income-confirm' && (
        <IncomeConfirmScreen
          account={incomeReview?.account || incomeFlow.transactionData.account}
          amount={incomeReview?.amount || incomeFlow.transactionData.amount}
          category={incomeReview?.category || incomeFlow.transactionData.category}
          comment={incomeReview?.comment || incomeFlow.transactionData.comment}
          transactionData={incomeReview || getTransactionDataForFlow('income')}
          isAvailable={isAvailable}
          onBack={() => {
            restoreFlowFromReview('income');
            setCurrentScreen('income-comment');
          }}
          onCancel={() => handleFlowExitToHome('income', true)}
          onConfirm={() => handleFlowExitToHome('income', true)}
          onSuccess={() => handleFlowExitToHome('income', true)}
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
          onBack={() => setCurrentScreen('transfer-amount')}
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
        <DestinationNameCommentScreen
          comment={transferComment}
          category="Transfer"
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
          isAvailable={isAvailable}
          onBack={() => setCurrentScreen('transfer-comment')}
          onCancel={() => {
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

      {currentScreen === 'transactions' && (
        <TransactionsListScreen
          onBack={() => setCurrentScreen('home')}
          onSelectTransaction={handleSelectTransaction}
          isAvailable={isAvailable}
        />
      )}

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
