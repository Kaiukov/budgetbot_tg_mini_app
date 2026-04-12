import { useEffect } from 'react';
import telegramService from '../services/telegram';

/**
 * Browser-only back button for standalone PWA mode.
 * Shows when NOT inside Telegram (standalone browser / PWA).
 * Inside Telegram, the native back button is used instead.
 */
export const BrowserBackButton = ({ onBack, isHome }: { onBack?: () => void, isHome?: boolean }) => {
  // Only show if NOT inside Telegram
  if (telegramService.isAvailable()) {
    return null;
  }

  // Don't show on home screen
  if (isHome) {
    return null;
  }

  const handleBack = () => {
    onBack?.();
  };

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isHome) {
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
