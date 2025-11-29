// Components
import HomeScreen from './components/HomeScreen';
import AccountsScreen from './components/AccountsScreen';
import AmountScreen from './components/AmountScreen';
import ExpenseCategoryScreen from './components/ExampseCategoryScreen';
import DestinationNameCommentScreen from './components/DestinationNameCommentScreen';
import ConfirmScreen from './components/ConfirmScreen';
import { useTelegramUser } from './hooks/useTelegramUser';
import { useExpenseFlow } from './hooks/useExpenseFlow';

const BudgetMiniApp = () => {
  const telegramUser = useTelegramUser();
  const expenseFlow = useExpenseFlow();

  // Get current state and context
  const currentState = expenseFlow.state.value as string;
  const { draft, accountsCache } = expenseFlow.context;

  return (
    <div className="budget-mini-app">
      {/* Home Screen */}
      {currentState === 'home' && (
        <HomeScreen
          userFullName={telegramUser.userFullName}
          userPhotoUrl={telegramUser.userPhotoUrl}
          userInitials={telegramUser.userInitials}
          userBio={telegramUser.userBio}
          isAvailable={telegramUser.isAvailable}
          onNavigate={(action) => {
            if (action === 'expense-accounts') {
              expenseFlow.send({
                type: 'START_EXPENSE_FLOW',
                userName: telegramUser.userName || 'Guest',
              });
            }
          }}
        />
      )}

      {/* Expense Flow - Accounts Step */}
      {currentState === 'accounts' && (
        <AccountsScreen
          accounts={accountsCache as any}
          accountsLoading={false}
          accountsError={expenseFlow.context.error}
          title="Select Account"
          isAvailable={telegramUser.isAvailable}
          onSelectAccount={(account: any) => {
            expenseFlow.send({
              type: 'SELECT_ACCOUNT',
              account: {
                id: account.account_id,
                name: account.account_name,
                currency: account.account_currency,
                usage_count: account.usage_count,
              },
            });
            // Auto-advance after selection
            expenseFlow.send({ type: 'NEXT_FROM_ACCOUNTS' });
          }}
          onRetry={() => {
            // Pre-loading is automatic via useEffect in hook
            // Retry is handled by re-triggering the effect
            expenseFlow.send({
              type: 'LOAD_CACHES',
              accounts: accountsCache,
              categories: expenseFlow.context.categoriesCache,
            });
          }}
          onBack={() => {
            expenseFlow.send({ type: 'BACK_TO_HOME' });
          }}
        />
      )}

      {/* Expense Flow - Amount Step */}
      {currentState === 'amount' && (
        <AmountScreen
          account={draft.account_name || ''}
          amount={String(draft.amount || '')}
          accountCurrency={draft.account_currency}
          isAvailable={telegramUser.isAvailable}
          onBack={() => {
            expenseFlow.send({ type: 'BACK_TO_ACCOUNTS' });
          }}
          onAmountChange={(amount: string) => {
            const numAmount = parseFloat(amount) || 0;
            // Amount change without EUR conversion for now
            expenseFlow.send({
              type: 'SET_AMOUNT',
              amount: numAmount,
              amountEur: numAmount, // TODO: integrate exchange rate
            });
          }}
          onAmountForeignChange={() => {
            // TODO: implement currency conversion
          }}
          onNext={() => {
            expenseFlow.send({ type: 'NEXT_FROM_AMOUNT' });
          }}
        />
      )}

      {/* Expense Flow - Category Step */}
      {currentState === 'categories' && (
        <ExpenseCategoryScreen
          onBack={() => {
            expenseFlow.send({ type: 'BACK_TO_AMOUNT' });
          }}
          onSelectCategory={(category: any) => {
            expenseFlow.send({
              type: 'SELECT_CATEGORY',
              category: {
                id: category.id,
                name: category.name,
                budget_name: category.budget_name,
              },
            });
            // Auto-advance after selection
            expenseFlow.send({ type: 'NEXT_FROM_CATEGORIES' });
          }}
          onNext={() => {
            expenseFlow.send({ type: 'NEXT_FROM_CATEGORIES' });
          }}
        />
      )}

      {/* Expense Flow - Comment/Destination Step */}
      {currentState === 'comment' && (
        <DestinationNameCommentScreen
          comment={draft.comment || ''}
          category={draft.category_name}
          categoryId={draft.category_id}
          onCommentChange={(comment: string) => {
            expenseFlow.send({
              type: 'SET_COMMENT',
              comment,
            });
          }}
          onNext={() => {
            expenseFlow.send({ type: 'NEXT_FROM_COMMENT' });
          }}
        />
      )}

      {/* Expense Flow - Confirm Step */}
      {currentState === 'confirmation' && (
        <ConfirmScreen
          onBack={() => {
            expenseFlow.send({ type: 'BACK_TO_COMMENT' });
          }}
          onSubmit={() => {
            expenseFlow.send({ type: 'SUBMIT' });
          }}
        />
      )}
    </div>
  );
};

export default BudgetMiniApp;
