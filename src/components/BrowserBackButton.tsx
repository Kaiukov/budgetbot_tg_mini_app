import { useEffect } from 'react';
import telegramService from '../services/telegram';

/**
 * Browser-only back button for development/debugging
 * Only renders when in browser debug mode (VITE_WEB_APP_MODE=browser)
 *
 * This component duplicates the functionality of Telegram's built-in back button:
 * - Shows on all screens except home
 * - Calls the provided onBack callback when clicked
 * - Supports Escape key for back navigation
 */
export const BrowserBackButton = ({ onBack, isHome }: { onBack?: () => void, isHome?: boolean }) => {
  // Only show if in browser debug mode
  const isBrowserMode = telegramService.isBrowserMode();

  if (!isBrowserMode) {
    return null;
  }

  // Don't show on home screen
  if (isHome) {
    return null;
  }

  const handleBack = () => {
    console.log('🔙 Browser back button clicked');
    onBack?.();
  };

  // Support Escape key for back navigation (matches Telegram back button behavior)
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isHome) {
        console.log('⌨️ Escape key pressed - navigating back');
        handleBack();
      }
    };

    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isHome, onBack]);

  return (
    <button
      onClick={handleBack}
      className="fixed top-4 left-4 z-50 bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-3 py-2 text-sm font-medium transition-colors shadow-lg"
      title="Back (ESC key also works)"
      aria-label="Go back"
    >
      ← Back
    </button>
  );
};

export default BrowserBackButton;
