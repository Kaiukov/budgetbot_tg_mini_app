import React from 'react'
import ReactDOM from 'react-dom/client'
import BudgetMiniApp from './BudgetMiniApp'
import { telegramService } from './services/telegram'
import { installRemoteConsoleForwarding } from './utils/remoteConsole'
import { logEvent } from './utils/remoteLogger'
import './index.css'

if (typeof window !== 'undefined') {
  installRemoteConsoleForwarding();
}

// Configure Telegram Mini App viewport for safe areas
const telegramApp = typeof window !== 'undefined' ? window.Telegram?.WebApp : null;
if (telegramApp) {
  telegramApp.ready();
  // Expand app to fill available space
  telegramApp.expand();
  // Disable vertical swipes to prevent closing app by swiping
  telegramService.disableVerticalSwipes();
  void logEvent({ message: 'MiniApp started', level: 'info' });
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BudgetMiniApp />
  </React.StrictMode>,
)
