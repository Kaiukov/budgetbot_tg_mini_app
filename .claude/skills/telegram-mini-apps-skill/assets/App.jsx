// App.jsx
// React component template for Telegram Mini App

import React, { useEffect, useState } from 'react';
import './App.css';

/**
 * Hook for accessing Telegram WebApp
 */
function useTelegramWebApp() {
  const [tg, setTg] = useState(null);
  const [user, setUser] = useState(null);
  const [theme, setTheme] = useState(null);

  useEffect(() => {
    const telegram = window.Telegram.WebApp;
    
    // Initialize
    telegram.ready();
    telegram.expand();
    
    setTg(telegram);
    setUser(telegram.initDataUnsafe?.user);
    setTheme(telegram.themeParams);

    // Handle theme changes
    const handleThemeChange = () => {
      setTheme({ ...telegram.themeParams });
    };

    telegram.onEvent('themeChanged', handleThemeChange);

    return () => {
      telegram.offEvent('themeChanged', handleThemeChange);
    };
  }, []);

  return { tg, user, theme };
}

/**
 * Hook for Telegram storage
 */
function useTelegramStorage(key, defaultValue = null) {
  const [value, setValue] = useState(defaultValue);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!window.Telegram?.WebApp?.CloudStorage) return;

    window.Telegram.WebApp.CloudStorage.getItem(key, (error, result) => {
      if (!error && result) {
        try {
          setValue(JSON.parse(result));
        } catch {
          setValue(result);
        }
      }
      setLoading(false);
    });
  }, [key]);

  const setValue_ = (newValue) => {
    setValue(newValue);
    window.Telegram.WebApp.CloudStorage.setItem(
      key,
      typeof newValue === 'string' ? newValue : JSON.stringify(newValue),
      (error) => {
        if (error) console.error('Storage error:', error);
      }
    );
  };

  return [value, setValue_, loading];
}

/**
 * Haptic feedback hook
 */
function useHapticFeedback() {
  const tg = window.Telegram?.WebApp;
  
  return {
    impact: (style = 'light') => tg?.HapticFeedback?.impactOccurred(style),
    notification: (type = 'success') => tg?.HapticFeedback?.notificationOccurred(type),
    selectionChanged: () => tg?.HapticFeedback?.selectionChanged()
  };
}

/**
 * Main App Component
 */
export default function App() {
  const { tg, user, theme } = useTelegramWebApp();
  const [settings, setSettings, settingsLoading] = useTelegramStorage('settings', {});
  const haptic = useHapticFeedback();
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState(null);

  // Apply theme
  useEffect(() => {
    if (!theme) return;

    const root = document.documentElement;
    root.style.setProperty('--tg-bg', theme.bg_color);
    root.style.setProperty('--tg-text', theme.text_color);
    root.style.setProperty('--tg-button-bg', theme.button_color);
    root.style.setProperty('--tg-hint', theme.hint_color);

    document.body.setAttribute('data-theme', tg?.colorScheme);
  }, [theme, tg?.colorScheme]);

  // Setup buttons
  useEffect(() => {
    if (!tg) return;

    // Back button
    tg.BackButton.show();
    tg.BackButton.onClick(() => tg.close());

    // Main button
    tg.MainButton.setText('Confirm');
    tg.MainButton.show();
    tg.MainButton.onClick(() => {
      handleMainButtonClick();
    });

    setLoading(false);

    return () => {
      tg.BackButton.offClick(() => {});
      tg.MainButton.offClick(() => {});
    };
  }, [tg]);

  const handleMainButtonClick = async () => {
    if (!tg) return;

    haptic.impact('medium');
    tg.MainButton.showProgress();

    try {
      // Example API call
      const response = await fetch('/api/action', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Telegram-Init-Data': tg.initData
        },
        body: JSON.stringify({
          userId: user?.id,
          action: 'confirm'
        })
      });

      if (response.ok) {
        haptic.notification('success');
        showMessage('Action completed!', 'success');
      } else {
        throw new Error('Request failed');
      }
    } catch (error) {
      console.error('Error:', error);
      haptic.notification('error');
      showMessage('An error occurred', 'error');
    } finally {
      tg.MainButton.hideProgress();
    }
  };

  const handleActionClick = () => {
    haptic.impact('light');
    tg?.showAlert('Button clicked!');
  };

  const handleSettingChange = (key, value) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
  };

  const showMessage = (text, type = 'info') => {
    setMessage({ text, type });
    setTimeout(() => setMessage(null), 3000);
  };

  if (loading || !user) {
    return (
      <div className="app loading">
        <div className="spinner"></div>
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="app">
      <header className="header">
        <h1>My Mini App</h1>
        <p>Hello, {user.first_name}!</p>
      </header>

      <main className="content">
        {/* Messages */}
        {message && (
          <div className={`message message-${message.type}`}>
            {message.text}
          </div>
        )}

        {/* User Info */}
        <section className="section">
          <h2 className="section-title">User Information</h2>
          <div className="section-content">
            <div className="info-item">
              <span className="label">Name</span>
              <span className="value">
                {user.first_name} {user.last_name || ''}
              </span>
            </div>
            <div className="info-item">
              <span className="label">ID</span>
              <span className="value">{user.id}</span>
            </div>
            <div className="info-item">
              <span className="label">Premium</span>
              <span className="value">{user.is_premium ? 'Yes ⭐' : 'No'}</span>
            </div>
            <div className="info-item">
              <span className="label">Language</span>
              <span className="value">{user.language_code || 'Unknown'}</span>
            </div>
          </div>
        </section>

        {/* Settings */}
        {!settingsLoading && (
          <section className="section">
            <h2 className="section-title">Settings</h2>
            <div className="section-content">
              <label className="checkbox">
                <input
                  type="checkbox"
                  checked={settings.notifications || false}
                  onChange={(e) => handleSettingChange('notifications', e.target.checked)}
                />
                <span>Enable Notifications</span>
              </label>
              
              <label className="checkbox">
                <input
                  type="checkbox"
                  checked={settings.darkMode || false}
                  onChange={(e) => handleSettingChange('darkMode', e.target.checked)}
                />
                <span>Dark Mode</span>
              </label>
            </div>
          </section>
        )}

        {/* Actions */}
        <section className="section">
          <h2 className="section-title">Actions</h2>
          <div className="section-content">
            <button className="button" onClick={handleActionClick}>
              Perform Action
            </button>
            <button
              className="button secondary"
              onClick={() => {
                haptic.impact('light');
                tg?.showAlert(`Platform: ${tg?.platform}\nVersion: ${tg?.version}`);
              }}
            >
              Show Info
            </button>
            <button
              className="button danger"
              onClick={() => {
                haptic.notification('warning');
                tg?.showConfirm('Close the app?', (confirmed) => {
                  if (confirmed) tg?.close();
                });
              }}
            >
              Close App
            </button>
          </div>
        </section>
      </main>

      <footer className="footer">
        <p>Telegram Mini App</p>
      </footer>
    </div>
  );
}

/**
 * CSS for React component (App.css)
 * 
 * See template.html for base styles, convert to CSS modules or styled-components
 */
