import React from 'react'
import ReactDOM from 'react-dom/client'
import BudgetMiniApp from './BudgetMiniApp'
import { BudgetMachineProvider } from './context/BudgetMachineContext'
import { telegramService } from './services/telegram'
import { isBrowserMode } from './utils/fakeInitData'
import './index.css'

// Silence noisy console output during E2E/Playwright runs to keep the MCP transport stable
if (import.meta.env.VITE_E2E_SILENT_LOGS === 'true') {
  ['log', 'info', 'debug', 'warn'].forEach((level) => {
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    (console as any)[level] = () => {}
  })
}

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
    <BudgetMachineProvider>
      <BudgetMiniApp />
    </BudgetMachineProvider>
  </React.StrictMode>,
)
