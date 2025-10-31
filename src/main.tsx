import React from 'react'
import ReactDOM from 'react-dom/client'
import BudgetMiniApp from './BudgetMiniApp'
import './index.css'

// Configure Telegram Mini App viewport for safe areas
if (typeof window !== 'undefined' && (window as any).Telegram?.WebApp) {
  (window as any).Telegram.WebApp.ready();
  // Expand app to fill available space
  (window as any).Telegram.WebApp.expand();
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BudgetMiniApp />
  </React.StrictMode>,
)
