/**
 * Telegram Mini App - Initialization Script
 * Complete setup for Telegram Mini Apps
 */

class TelegramMiniAppManager {
  constructor(options = {}) {
    this.tg = window.Telegram.WebApp;
    this.options = {
      debugMode: options.debugMode || false,
      expandOnInit: options.expandOnInit !== false,
      setupTheme: options.setupTheme !== false,
      setupButtons: options.setupButtons !== false,
      ...options
    };
    
    this.initialized = false;
    this.eventHandlers = new Map();
  }
  
  /**
   * Initialize the Mini App
   */
  init() {
    if (this.initialized) return;
    
    this.log('Initializing Telegram Mini App...');
    
    // Signal readiness
    this.tg.ready();
    
    // Expand if configured
    if (this.options.expandOnInit) {
      this.tg.expand();
    }
    
    // Setup theme if configured
    if (this.options.setupTheme) {
      this.setupTheme();
    }
    
    // Setup default buttons if configured
    if (this.options.setupButtons) {
      this.setupButtons();
    }
    
    this.initialized = true;
    this.log('Mini App initialized successfully');
  }
  
  /**
   * Setup theme-related functionality
   */
  setupTheme() {
    this.log('Setting up theme support...');
    
    // Apply initial theme
    this.applyTheme();
    
    // Listen for theme changes
    this.on('themeChanged', () => {
      this.log('Theme changed:', this.tg.colorScheme);
      this.applyTheme();
    });
  }
  
  /**
   * Apply theme colors to document
   */
  applyTheme() {
    const theme = this.tg.themeParams;
    const root = document.documentElement;
    
    // Set CSS variables
    Object.entries(theme).forEach(([key, value]) => {
      const cssVar = `--tg-theme-${key}`;
      root.style.setProperty(cssVar, value);
    });
    
    // Set data attribute
    document.body.setAttribute('data-theme', this.tg.colorScheme);
  }
  
  /**
   * Setup default buttons
   */
  setupButtons() {
    this.log('Setting up buttons...');
    
    // Back button
    this.tg.BackButton.show();
    this.tg.BackButton.onClick(() => this.onBackButton());
    
    // Main button
    this.tg.MainButton.show();
  }
  
  /**
   * Handle back button click (override in subclass)
   */
  onBackButton() {
    this.log('Back button clicked');
    this.tg.close();
  }
  
  /**
   * Register event handler
   */
  on(event, handler) {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, []);
    }
    
    this.eventHandlers.get(event).push(handler);
    this.tg.onEvent(event, handler);
  }
  
  /**
   * Unregister event handler
   */
  off(event, handler) {
    if (this.eventHandlers.has(event)) {
      const handlers = this.eventHandlers.get(event);
      const index = handlers.indexOf(handler);
      if (index > -1) {
        handlers.splice(index, 1);
      }
    }
    
    this.tg.offEvent(event, handler);
  }
  
  /**
   * Get user data (unsafe - for UI only)
   */
  getUser() {
    return this.tg.initDataUnsafe?.user || null;
  }
  
  /**
   * Get raw initData for server validation
   */
  getInitData() {
    return this.tg.initData;
  }
  
  /**
   * Show alert dialog
   */
  alert(message) {
    this.tg.showAlert(message);
  }
  
  /**
   * Show confirmation dialog
   */
  confirm(message) {
    return new Promise((resolve) => {
      this.tg.showConfirm(message, (result) => {
        resolve(result);
      });
    });
  }
  
  /**
   * Show popup with buttons
   */
  showPopup(title, message, buttons) {
    return new Promise((resolve) => {
      this.tg.showPopup({
        title,
        message,
        buttons
      }, (id) => {
        resolve(id);
      });
    });
  }
  
  /**
   * Trigger haptic feedback
   */
  haptic(type = 'light') {
    const haptic = this.tg.HapticFeedback;
    
    if (type === 'success') {
      haptic.notificationOccurred('success');
    } else if (type === 'error') {
      haptic.notificationOccurred('error');
    } else if (type === 'warning') {
      haptic.notificationOccurred('warning');
    } else {
      haptic.impactOccurred(type);
    }
  }
  
  /**
   * Set main button text and handler
   */
  setMainButton(text, handler) {
    const btn = this.tg.MainButton;
    btn.setText(text);
    btn.show();
    btn.onClick(handler);
  }
  
  /**
   * Show/hide main button progress
   */
  showMainProgress(show = true) {
    if (show) {
      this.tg.MainButton.showProgress();
    } else {
      this.tg.MainButton.hideProgress();
    }
  }
  
  /**
   * Cloud storage wrapper
   */
  async saveData(key, value) {
    return new Promise((resolve, reject) => {
      this.tg.CloudStorage.setItem(key, JSON.stringify(value), (error) => {
        if (error) reject(error);
        else resolve();
      });
    });
  }
  
  /**
   * Cloud storage read wrapper
   */
  async loadData(key) {
    return new Promise((resolve, reject) => {
      this.tg.CloudStorage.getItem(key, (error, value) => {
        if (error) {
          reject(error);
        } else {
          try {
            resolve(value ? JSON.parse(value) : null);
          } catch (e) {
            reject(e);
          }
        }
      });
    });
  }
  
  /**
   * Check if running on specific platform
   */
  isPlatform(platform) {
    return this.tg.platform === platform;
  }
  
  /**
   * Check API version support
   */
  supports(version) {
    return this.tg.isVersionAtLeast(version);
  }
  
  /**
   * Get viewport information
   */
  getViewport() {
    return {
      height: this.tg.viewportHeight,
      stableHeight: this.tg.viewportStableHeight,
      isExpanded: this.tg.isExpanded,
      isActive: this.tg.isActive
    };
  }
  
  /**
   * Cleanup and unregister handlers
   */
  destroy() {
    this.log('Destroying Mini App manager...');
    
    // Unregister all event handlers
    for (const [event, handlers] of this.eventHandlers) {
      handlers.forEach(handler => {
        this.tg.offEvent(event, handler);
      });
    }
    
    this.eventHandlers.clear();
    this.initialized = false;
  }
  
  /**
   * Debug logging
   */
  log(...args) {
    if (this.options.debugMode) {
      console.log('[TMA]', ...args);
    }
  }
}

// Global instance
let tmApp = null;

/**
 * Initialize global instance
 */
function initTelegramMiniApp(options = {}) {
  if (tmApp) return tmApp;
  
  tmApp = new TelegramMiniAppManager(options);
  tmApp.init();
  
  return tmApp;
}

// Export
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { TelegramMiniAppManager, initTelegramMiniApp };
} else {
  window.TelegramMiniAppManager = TelegramMiniAppManager;
  window.initTelegramMiniApp = initTelegramMiniApp;
}

// Usage example:
/*
// In HTML
<script src="https://telegram.org/js/telegram-web-app.js"></script>
<script src="init-app.js"></script>

// In JavaScript
const tma = initTelegramMiniApp({
  debugMode: true,
  expandOnInit: true,
  setupTheme: true,
  setupButtons: true
});

// Use the API
tma.setMainButton('Send', async () => {
  tma.showMainProgress(true);
  try {
    const data = { message: 'Hello' };
    await tma.saveData('lastMessage', data);
    tma.haptic('success');
  } finally {
    tma.showMainProgress(false);
  }
});

// Cleanup
window.addEventListener('beforeunload', () => {
  tma.destroy();
});
*/
