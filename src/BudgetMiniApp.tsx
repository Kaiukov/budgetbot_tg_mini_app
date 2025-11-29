// Components
import HomeScreen from './components/HomeScreen';
import AccountsScreen from './components/AccountsScreen';
import { useTelegramUser } from './hooks/useTelegramUser';
import { useExpenseFlow } from './hooks/useExpenseFlow';
import { useEffect } from 'react';

const BudgetMiniApp = () => {
  const telegramUser = useTelegramUser();
  const expenseFlow = useExpenseFlow();

  // Load accounts when entering the Accounts step and userName is set
  useEffect(() => {
    if (
      expenseFlow.state.step === 'expense-accounts' &&
      expenseFlow.state.fields.user_name &&
      expenseFlow.shouldLoadAccounts()
    ) {
      expenseFlow.loadAccounts();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    expenseFlow.state.step,
    expenseFlow.state.fields.user_name,
    expenseFlow.shouldLoadAccounts,
    expenseFlow.loadAccounts,
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
          onSelectAccount={(accountName) => {
            const account = expenseFlow.selectAccountsState().accounts.find(
              a => a.account_name === accountName
            );
            if (account) {
              expenseFlow.selectAccount(account);
              expenseFlow.goToAmount();
            }
          }}
          onRetry={expenseFlow.loadAccounts}
          onBack={expenseFlow.backToHome}
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
