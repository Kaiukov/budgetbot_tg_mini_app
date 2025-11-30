import React from 'react'
import ReactDOM from 'react-dom/client'
import BudgetMiniApp from './BudgetMiniApp'
import { telegramService } from './services/telegram'
import { isBrowserMode } from './utils/fakeInitData'
import './index.css'

// Configure Telegram Mini App viewport for safe areas
// Skip if in browser debug mode (telegramService handles initialization)
if (!isBrowserMode()) {
  if (typeof window !== 'undefined' && (window as any).Telegram?.WebApp) {
    (window as any).Telegram.WebApp.ready();
    // Expand app to fill available space
    (window as any).Telegram.WebApp.expand();
    // Disable vertical swipes to prevent closing app by swiping
    telegramService.disableVerticalSwipes();
  }
} else {
  console.log('🔧 Browser debug mode: Skipping Telegram SDK initialization');
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BudgetMiniApp />
  </React.StrictMode>,
)
