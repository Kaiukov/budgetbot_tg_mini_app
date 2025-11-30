/**
 * Fake initData Generator for Browser Debug Mode
 *
 * Uses real, validated Telegram initData for testing in browser environment.
 * This allows backend signature validation to pass successfully.
 */

/**
 * Real, validated initData from Telegram user
 * Contains authentic signature and hash that will pass backend validation
 */
const REAL_VALID_INIT_DATA = 'query_id=AAFDB9IDAAAAAEMH0gMDmPQ6&user=%7B%22id%22%3A64096067%2C%22first_name%22%3A%22Oleksandr%20%F0%9F%87%BA%F0%9F%87%A6%22%2C%22last_name%22%3A%22Kaiukov%22%2C%22username%22%3A%22Kaiukov%22%2C%22language_code%22%3A%22en%22%2C%22allows_write_to_pm%22%3Atrue%2C%22photo_url%22%3A%22https%3A%5C%2F%5C%2Ft.me%5C%2Fi%5C%2Fuserpic%5C%2F320%5C%2FAyfgVwqy5YooVVuJxfezMWbRFecSbkvy1hbcMUD2QNE.svg%22%7D&auth_date=1764441286&signature=2w3bI7ByYsdpzadrgwCsArVwSsMT1ekBKQJ78xIiitOVCWvSX2-0R2nyiABOj10tCrUFYlmaNDC4qu3daWPPDg&hash=81bfcd7a6a2840830370fdf6da147b0c6e21f2fafc6baf9091b7a7f8ecb56b74';

/**
 * Generate real initData string for browser debug mode
 * Uses authenticated Telegram data that passes backend validation
 *
 * @returns Real, validated initData string with authentic signature
 */
export function generateFakeInitData(): string {
  return REAL_VALID_INIT_DATA;
}

/**
 * Generate initDataUnsafe object for browser debug mode
 * Parses the real initData and returns the parsed version used by Telegram WebApp
 *
 * @returns Parsed initDataUnsafe object with real user data
 */
export function generateFakeInitDataUnsafe() {
  // Parse the real initData string
  const params = new URLSearchParams(REAL_VALID_INIT_DATA);
  const userJson = params.get('user');

  const user = userJson ? JSON.parse(userJson) : {
    id: 64096067,
    first_name: 'Oleksandr 🇺🇦',
    last_name: 'Kaiukov',
    username: 'Kaiukov',
    language_code: 'en',
    allows_write_to_pm: true,
    photo_url: 'https://t.me/i/userpic/320/AyfgVwqy5YooVVuJxfezMWbRFecSbkvy1hbcMUD2QNE.svg'
  };

  return {
    query_id: params.get('query_id') || '',
    user: user,
    auth_date: parseInt(params.get('auth_date') || '0'),
    hash: params.get('hash') || ''
  };
}

/**
 * Check if we're in browser debug mode
 */
export function isBrowserMode(): boolean {
  return import.meta.env.VITE_WEB_APP_MODE === 'browser';
}

/**
 * Get the real initData from Telegram or validated initData in browser mode
 */
export function getInitData(): string {
  // Check if we're in browser mode
  if (isBrowserMode()) {
    console.log('🔧 Browser debug mode: Using real validated initData with authentic signature');
    return generateFakeInitData();
  }

  // Return real Telegram initData
  if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
    return window.Telegram.WebApp.initData || '';
  }

  return '';
}

/**
 * Get the real initDataUnsafe from Telegram or parsed real version in browser mode
 */
export function getInitDataUnsafe() {
  // Check if we're in browser mode
  if (isBrowserMode()) {
    console.log('🔧 Browser debug mode: Using real validated initDataUnsafe');
    return generateFakeInitDataUnsafe();
  }

  // Return real Telegram initDataUnsafe
  if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
    return window.Telegram.WebApp.initDataUnsafe || {};
  }

  return {};
}
