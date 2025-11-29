// Components
import HomeScreen from './components/HomeScreen';
import { useTelegramUser } from './hooks/useTelegramUser';
// import AccountsScreen from './components/AccountsScreen';
// import AmountScreen from './components/AmountScreen';
// import ExpenseCategoryScreen from './components/ExampseCategoryScreen';
// import DestinationNameCommentScreen from './components/DestinationNameCommentScreen';
// import ConfirmScreen from './components/ConfirmScreen';
// import TransferAmountScreen from './components/TransferAmountScreen';
// import TransferFeeScreen from './components/TransferFeeScreen';
// import TransferConfirmScreen from './components/TransferConfirmScreen';
// import DebugScreen from './components/DebugScreen';
// import TransactionsListScreen from './components/TransactionsListScreen';
// import TransactionDetailScreen from './components/TransactionDetailScreen';
// import TransactionEditScreen from './components/TransactionEditScreen';

const BudgetMiniApp = () => {
  const telegramUser = useTelegramUser();

  return (
    <div className="budget-mini-app">
      {/* Flow navigation will be re-wired once the expense-flow store is added */}
      <HomeScreen
        userFullName={telegramUser.userFullName}
        userPhotoUrl={telegramUser.userPhotoUrl}
        userInitials={telegramUser.userInitials}
        userBio={telegramUser.userBio}
        isAvailable={telegramUser.isAvailable}
      />
    </div>
  );
};

export default BudgetMiniApp;
