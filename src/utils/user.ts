/**
 * User Utility Functions
 * Centralized browser mode detection and user validation
 */

/**
 * Browser mode usernames - treat as unknown/guest users
 * These represent fallback users when running outside Telegram environment
 */
const BROWSER_MODE_USERNAMES = new Set(['User', 'Guest']);

/**
 * Checks if a user is in browser mode (unknown/guest user)
 * Browser mode users get all accounts/categories (no user filter)
 *
 * @param userName - The user's name to check
 * @returns true if the user is in browser mode, false otherwise
 *
 * @example
 * isBrowserModeUser('User') // true
 * isBrowserModeUser('Guest') // true
 * isBrowserModeUser('john_doe') // false
 */
export function isBrowserModeUser(userName: string | null | undefined): boolean {
  if (!userName) return false;
  return BROWSER_MODE_USERNAMES.has(userName);
}

/**
 * Gets the effective username for API calls
 * Returns undefined for browser mode users (no filter), username otherwise
 *
 * @param userName - The user's name
 * @returns undefined if browser mode, the username otherwise
 *
 * @example
 * getEffectiveUserName('User') // undefined
 * getEffectiveUserName('john_doe') // 'john_doe'
 */
export function getEffectiveUserName(userName: string | null | undefined): string | undefined {
  return isBrowserModeUser(userName) ? undefined : (userName || undefined);
}
