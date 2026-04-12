import React from 'react'
import ReactDOM from 'react-dom/client'
import BudgetMiniApp from './BudgetMiniApp'
import { BudgetMachineProvider } from './context/BudgetMachineContext'
import { telegramService } from './services/telegram'
import './index.css'

// Silence noisy console output during E2E/Playwright runs
if (import.meta.env.VITE_E2E_SILENT_LOGS === 'true') {
  ['log', 'info', 'debug', 'warn'].forEach((level) => {
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    (console as any)[level] = () => {}
  })
}

// Initialize Telegram SDK only if running inside Telegram
if (telegramService.isAvailable()) {
  telegramService.disableVerticalSwipes();
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BudgetMachineProvider>
      <BudgetMiniApp />
    </BudgetMachineProvider>
  </React.StrictMode>,
)
