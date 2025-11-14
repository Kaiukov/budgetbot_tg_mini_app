// setup-app.js - Telegram Mini App Initialization Utilities

/**
 * Initialize Mini App with automatic setup
 */
function initializeMiniApp(options = {}) {
  const defaults = {
    expandApp: true,
    setupBackButton: true,
    setupTheme: true,
    enableHaptic: true,
    headerColor: 'bg_color',
    debug: false,
    onReady: null,
    onError: null
  };
  
  const config = { ...defaults, ...options };
  const tg = window.Telegram.WebApp;
  
  try {
    tg.ready();
    config.debug && console.log('[TMA] App initialized');
    
    if (config.expandApp) {
      tg.expand();
      config.debug && console.log('[TMA] App expanded');
    }
    
    if (config.headerColor) {
      if (config.headerColor.startsWith('#')) {
        tg.setHeaderColor(config.headerColor);
      } else {
        tg.setHeaderColor(config.headerColor);
      }
      config.debug && console.log('[TMA] Header color set');
    }
    
    if (config.setupBackButton) {
      tg.BackButton.show();
      tg.BackButton.onClick(() => {
        config.debug && console.log('[TMA] Back button clicked');
        if (window.history.length > 1) {
          window.history.back();
        } else {
          tg.close();
        }
      });
      config.debug && console.log('[TMA] Back button setup');
    }
    
    if (config.setupTheme) {
      applyTheme(tg);
      tg.onEvent('themeChanged', () => {
        config.debug && console.log('[TMA] Theme changed');
        applyTheme(tg);
      });
      config.debug && console.log('[TMA] Theme support enabled');
    }
    
    const user = tg.initDataUnsafe.user;
    if (user) {
      config.debug && console.log(`[TMA] User: ${user.first_name} (ID: ${user.id})`);
    }
    
    if (config.onReady) {
      config.onReady(tg);
    }
    
    return tg;
  } catch (error) {
    console.error('[TMA] Initialization error:', error);
    if (config.onError) {
      config.onError(error);
    }
    throw error;
  }
}

/**
 * Apply Telegram theme to document
 */
function applyTheme(tg = window.Telegram.WebApp) {
  const theme = tg.themeParams;
  const root = document.documentElement;
  const body = document.body;
  
  const cssVars = {
    '--tg-bg': theme.bg_color,
    '--tg-text': theme.text_color,
    '--tg-hint': theme.hint_color,
    '--tg-link': theme.link_color,
    '--tg-button-bg': theme.button_color,
    '--tg-button-text': theme.button_text_color,
    '--tg-secondary-bg': theme.secondary_bg_color,
    '--tg-section-bg': theme.section_bg_color,
    '--tg-destructive': theme.destructive_text_color
  };
  
  Object.entries(cssVars).forEach(([key, value]) => {
    root.style.setProperty(key, value);
  });
  
  body.style.backgroundColor = theme.bg_color;
  body.style.color = theme.text_color;
  body.setAttribute('data-theme', tg.colorScheme);
}

/**
 * Setup main button with loading state
 */
function setupMainButton(text = 'Send', callback = null) {
  const tg = window.Telegram.WebApp;
  const button = tg.MainButton;
  
  button.setText(text);
  button.show();
  
  button.onClick(async () => {
    if (callback) {
      button.showProgress();
      try {
        await callback();
      } catch (error) {
        console.error('Button callback error:', error);
        tg.showAlert('An error occurred. Please try again.');
      } finally {
        button.hideProgress();
      }
    }
  });
  
  return button;
}

/**
 * Create API client with initData validation
 */
class TelegramApiClient {
  constructor(baseURL = '/api', options = {}) {
    this.baseURL = baseURL;
    this.tg = window.Telegram.WebApp;
    this.debug = options.debug || false;
    this.timeout = options.timeout || 10000;
  }
  
  async request(endpoint, options = {}) {
    const {
      method = 'GET',
      body = null,
      headers = {}
    } = options;
    
    const url = `${this.baseURL}${endpoint}`;
    const requestHeaders = {
      'Content-Type': 'application/json',
      'X-Telegram-Init-Data': this.tg.initData,
      ...headers
    };
    
    const config = {
      method,
      headers: requestHeaders
    };
    
    if (body) {
      config.body = JSON.stringify(body);
    }
    
    this.debug && console.log(`[API] ${method} ${url}`, body);
    
    try {
      const response = await Promise.race([
        fetch(url, config),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Request timeout')), this.timeout)
        )
      ]);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      this.debug && console.log(`[API] Response:`, data);
      return data;
    } catch (error) {
      console.error(`[API] Error: ${error.message}`);
      throw error;
    }
  }
  
  get(endpoint) {
    return this.request(endpoint, { method: 'GET' });
  }
  
  post(endpoint, body) {
    return this.request(endpoint, { method: 'POST', body });
  }
  
  put(endpoint, body) {
    return this.request(endpoint, { method: 'PUT', body });
  }
  
  delete(endpoint) {
    return this.request(endpoint, { method: 'DELETE' });
  }
}

/**
 * Storage manager with CloudStorage
 */
class AppStorage {
  constructor(prefix = 'app_') {
    this.prefix = prefix;
    this.storage = window.Telegram.WebApp.CloudStorage;
    this.cache = new Map();
  }
  
  async set(key, value) {
    const fullKey = this.prefix + key;
    const json = JSON.stringify(value);
    this.cache.set(key, value);
    
    return new Promise((resolve, reject) => {
      this.storage.setItem(fullKey, json, (error) => {
        if (error) reject(error);
        else resolve();
      });
    });
  }
  
  async get(key, defaultValue = null) {
    if (this.cache.has(key)) {
      return this.cache.get(key);
    }
    
    const fullKey = this.prefix + key;
    
    return new Promise((resolve, reject) => {
      this.storage.getItem(fullKey, (error, value) => {
        if (error) {
          reject(error);
        } else {
          try {
            const parsed = value ? JSON.parse(value) : defaultValue;
            this.cache.set(key, parsed);
            resolve(parsed);
          } catch (e) {
            reject(e);
          }
        }
      });
    });
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    initializeMiniApp,
    applyTheme,
    setupMainButton,
    TelegramApiClient,
    AppStorage
  };
}
