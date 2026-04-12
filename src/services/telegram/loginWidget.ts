/**
 * Telegram Login Widget Service
 * Renders the official Telegram Login Widget and handles callbacks.
 * Reference: https://core.telegram.org/widgets/login
 */

export interface TelegramWidgetUser {
  id: string;
  first_name: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
  auth_date: string;
  hash: string;
}

type WidgetCallback = (user: TelegramWidgetUser) => void;

/**
 * Render the Telegram Login Widget into a container element.
 * Uses the official telegram-widget.js script with data-onauth callback.
 */
export function renderLoginWidget(
  containerId: string,
  botUsername: string,
  callback: WidgetCallback,
): void {
  const container = document.getElementById(containerId);
  if (!container) {
    console.error(`Login widget container #${containerId} not found`);
    return;
  }

  // Define global callback that Telegram widget will call
  const callbackName = '__tgLoginCallback';
  (window as any)[callbackName] = callback;

  // Create widget script element
  const script = document.createElement('script');
  script.async = true;
  script.src = 'https://telegram.org/js/telegram-widget.js?22';
  script.setAttribute('data-telegram-login', botUsername);
  script.setAttribute('data-size', 'large');
  script.setAttribute('data-onauth', `${callbackName}(user)`);
  script.setAttribute('data-request-access', 'write');

  container.innerHTML = '';
  container.appendChild(script);
}

/**
 * Remove the login widget and global callback.
 */
export function removeLoginWidget(containerId: string): void {
  const container = document.getElementById(containerId);
  if (container) {
    container.innerHTML = '';
  }
  delete (window as any).__tgLoginCallback;
}
