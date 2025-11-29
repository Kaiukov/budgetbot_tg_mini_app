import { useEffect } from 'react';
import { useBudgetMachineContext } from '../context/BudgetMachineContext';
import telegramService from '../services/telegram';

/**
 * Browser-only back button for development/debugging
 * Only renders when NOT in Telegram WebApp environment
 */
export const BrowserBackButton = () => {
  const machine = useBudgetMachineContext();
  const { state } = machine;

  // Only show if NOT in actual Telegram (check for real user data)
  const webApp = telegramService.getWebApp();
  const hasRealTelegramUser = webApp?.initDataUnsafe?.user?.id;

  if (hasRealTelegramUser) {
    return null;
  }

  const getCurrentScreen = () => {
    if (typeof state === 'string') return state;
    if (state?.ready) {
      const ready = state.ready;
      if (typeof ready === 'string') return ready;

      if (ready.expenseFlow) {
        const expense = ready.expenseFlow;
        if (expense === 'accounts') return 'accounts';
        if (expense === 'amount') return 'amount';
        if (expense === 'category') return 'category';
        if (expense === 'comment') return 'comment';
        if (expense === 'confirm') return 'confirm';
      }

      if (ready.incomeFlow) {
        const income = ready.incomeFlow;
        if (income === 'accounts') return 'income-accounts';
        if (income === 'amount') return 'amount';
        if (income === 'category') return 'category';
        if (income === 'comment') return 'comment';
        if (income === 'confirm') return 'confirm';
      }

      if (ready.transferFlow) {
        const transfer = ready.transferFlow;
        if (transfer === 'sourceAccounts') return 'transfer-source-accounts';
        if (transfer === 'destAccounts') return 'transfer-dest-accounts';
        if (transfer === 'amount') return 'transfer-amount';
        if (transfer === 'fees') return 'transfer-fees';
        if (transfer === 'comment') return 'transfer-comment';
        if (transfer === 'confirm') return 'transfer-confirm';
      }

      if (ready.transactions) {
        const tx = ready.transactions;
        if (tx === 'list') return 'transactions';
        if (tx === 'detail') return 'transaction-detail';
        if (tx === 'edit') return 'transaction-edit';
      }

      if (ready === 'debug') return 'debug';
      if (ready === 'home') return 'home';
    }
    return 'loading';
  };

  const currentScreen = getCurrentScreen();
  const isHome = currentScreen === 'home';

  if (isHome) {
    return null;
  }

  const handleBack = () => {
    console.log('🔙 Browser back button clicked');
    // Entry screens should jump straight home
    if (['accounts', 'income-accounts', 'transfer-source-accounts', 'transactions'].includes(currentScreen)) {
      machine.goHome();
      return;
    }

    machine.goBack();
  };

  // Also support Escape key for back navigation
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isHome) {
        console.log('⌨️ Escape key pressed');
        handleBack();
      }
    };

    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [machine, isHome, currentScreen]);

  return (
    <button
      onClick={handleBack}
      className="fixed top-4 left-4 z-50 bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-3 py-2 text-sm font-medium transition-colors"
      title="Back (ESC key also works)"
    >
      ← Back
    </button>
  );
};
