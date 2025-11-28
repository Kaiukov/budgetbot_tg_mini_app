import React, { useEffect, useState } from 'react';

/**
 * Hook for Telegram Mini App
 */
export function useTelegram() {
  const [webApp, setWebApp] = useState(null);
  const [user, setUser] = useState(null);
  const [theme, setTheme] = useState('light');
  
  useEffect(() => {
    const tg = window.Telegram.WebApp;
    
    // Setup
    setWebApp(tg);
    setUser(tg.initDataUnsafe?.user);
    setTheme(tg.colorScheme);
    
    tg.ready();
    tg.expand();
    
    // Theme change handler
    const handleThemeChange = () => {
      setTheme(tg.colorScheme);
    };
    
    tg.onEvent('themeChanged', handleThemeChange);
    
    return () => {
      tg.offEvent('themeChanged', handleThemeChange);
    };
  }, []);
  
  return { webApp, user, theme };
}

/**
 * Example Component
 */
export function MyMiniApp() {
  const { webApp, user, theme } = useTelegram();
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  
  useEffect(() => {
    if (!webApp) return;
    
    // Setup buttons
    webApp.BackButton.show();
    webApp.BackButton.onClick(() => {
      webApp.close();
    });
    
    webApp.MainButton.setText('Send');
    webApp.MainButton.show();
    webApp.MainButton.onClick(handleSend);
    
    return () => {
      webApp.BackButton.hide();
      webApp.MainButton.hide();
    };
  }, [webApp, message]);
  
  const handleSend = async () => {
    if (!message.trim()) {
      webApp.showAlert('Please enter a message');
      return;
    }
    
    setLoading(true);
    webApp.MainButton.showProgress();
    webApp.HapticFeedback.impactOccurred('medium');
    
    try {
      // Your API call here
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      webApp.showAlert('Message sent!');
      webApp.HapticFeedback.notificationOccurred('success');
      setMessage('');
    } catch (error) {
      webApp.showAlert('Error sending message');
      webApp.HapticFeedback.notificationOccurred('error');
    } finally {
      setLoading(false);
      webApp.MainButton.hideProgress();
    }
  };
  
  if (!webApp) {
    return <div>Loading...</div>;
  }
  
  const bgColor = theme === 'dark' ? '#1a1a1a' : '#ffffff';
  const textColor = theme === 'dark' ? '#ffffff' : '#000000';
  const buttonColor = webApp.themeParams?.button_color || '#0088cc';
  
  return (
    <div style={{
      backgroundColor: bgColor,
      color: textColor,
      minHeight: '100vh',
      padding: '16px',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      <h1>My Mini App</h1>
      
      {user && (
        <div style={{
          backgroundColor: webApp.themeParams?.secondary_bg_color || '#f0f0f0',
          padding: '12px',
          borderRadius: '8px',
          marginBottom: '16px'
        }}>
          <strong>{user.first_name}</strong> {user.is_premium && '⭐'}
        </div>
      )}
      
      <textarea
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Enter your message..."
        disabled={loading}
        style={{
          width: '100%',
          padding: '12px',
          border: '1px solid rgba(0,0,0,0.1)',
          borderRadius: '8px',
          backgroundColor: bgColor,
          color: textColor,
          fontSize: '16px',
          fontFamily: 'inherit',
          minHeight: '100px',
          marginBottom: '12px'
        }}
      />
      
      <button
        onClick={handleSend}
        disabled={loading}
        style={{
          width: '100%',
          padding: '12px',
          backgroundColor: buttonColor,
          color: 'white',
          border: 'none',
          borderRadius: '8px',
          fontSize: '16px',
          fontWeight: '600',
          cursor: loading ? 'not-allowed' : 'pointer',
          opacity: loading ? 0.6 : 1
        }}
      >
        {loading ? 'Sending...' : 'Send'}
      </button>
    </div>
  );
}

export default MyMiniApp;

/*
Usage in main.jsx:
import MyMiniApp from './MyMiniApp';
import ReactDOM from 'react-dom';

ReactDOM.render(
  <MyMiniApp />,
  document.getElementById('root')
);
*/
