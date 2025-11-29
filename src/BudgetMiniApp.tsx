// Components
import HomeScreen from './components/HomeScreen';
import AccountsScreen from './components/AccountsScreen';
import AmountScreen from './components/AmountScreen';
import { useTelegramUser } from './hooks/useTelegramUser';
import { useExpenseFlow } from './hooks/useExpenseFlow';
import { useEffect } from 'react';

const BudgetMiniApp = () => {
  const telegramUser = useTelegramUser();
  const expenseFlow = useExpenseFlow();

  // Load accounts and categories when entering the Accounts step
  useEffect(() => {
    if (
      expenseFlow.state.step === 'expense-accounts' &&
      expenseFlow.state.fields.user_name
    ) {
      // Load accounts
      if (expenseFlow.shouldLoadAccounts()) {
        expenseFlow.loadAccounts();
      }

      // Pre-load categories for next step
      if (expenseFlow.shouldLoadCategories()) {
        expenseFlow.loadCategories();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    expenseFlow.state.step,
    expenseFlow.state.fields.user_name,
    expenseFlow.shouldLoadAccounts,
    expenseFlow.loadAccounts,
    expenseFlow.shouldLoadCategories,
    expenseFlow.loadCategories,
  ]);

  return (
    <div className="budget-mini-app">
      {/* Expense Flow - Accounts Step */}
      {expenseFlow.state.step === 'expense-accounts' && (
        <AccountsScreen
          accounts={expenseFlow.selectAccountsState().accounts}
          accountsLoading={expenseFlow.selectAccountsState().accountsLoading}
          accountsError={expenseFlow.selectAccountsState().accountsError}
          title="Select Account"
          isAvailable={telegramUser.isAvailable}
          onSelectAccount={(account) => {
            expenseFlow.selectAccount(account);
            expenseFlow.goToAmount();
          }}
          onRetry={expenseFlow.loadAccounts}
          onBack={expenseFlow.backToHome}
        />
      )}

      {/* Expense Flow - Amount Step */}
      {expenseFlow.state.step === 'expense-amount' && (
        <AmountScreen
          account={expenseFlow.state.fields.account_name || ''}
          amount={expenseFlow.state.fields.amount || ''}
          accountCurrency={expenseFlow.state.fields.account_currency}
          isAvailable={telegramUser.isAvailable}
          onBack={expenseFlow.backToAccounts}
          onAmountChange={expenseFlow.setAmount}
          onAmountForeignChange={expenseFlow.setAmountEur}
          onNext={expenseFlow.goToCategory}
        />
      )}

      {/* Home Screen */}
      {expenseFlow.state.step === 'home' && (
        <HomeScreen
          userFullName={telegramUser.userFullName}
          userPhotoUrl={telegramUser.userPhotoUrl}
          userInitials={telegramUser.userInitials}
          userBio={telegramUser.userBio}
          isAvailable={telegramUser.isAvailable}
          onNavigate={(action) => {
            if (action === 'expense-accounts') {
              expenseFlow.startExpenseFlow(telegramUser.userName || 'Guest');
            }
          }}
        />
      )}
    </div>
  );
};

export default BudgetMiniApp;
