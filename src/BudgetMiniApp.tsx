import { useState } from 'react';

// Components
import HomeScreen from './components/HomeScreen';
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

  const renderScreen = () => {
    // For now, only render HomeScreen - other screens can be uncommented and built later
    return <HomeScreen onNavigate={(screen) => setCurrentScreen(screen as Screen)} />;
  };

  return (
    <div className="budget-mini-app">
      {renderScreen()}
    </div>
  );
};

export default BudgetMiniApp;
