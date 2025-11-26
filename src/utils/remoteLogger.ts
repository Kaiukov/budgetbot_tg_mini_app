type LogLevel = 'info' | 'warn' | 'error';

type RemoteLogPayload = {
  message: string;
  level?: LogLevel;
  data?: unknown;
};

const LOG_ENDPOINT = (import.meta.env.VITE_LOG_ENDPOINT as string | undefined) || '/log';

let isSending = false;

const formatError = (error: unknown) => {
  if (error instanceof Error) {
    return { name: error.name, message: error.message, stack: error.stack };
  }

  return error;
};

/**
 * Send a structured log to a remote endpoint together with Telegram initData.
 * Uses navigator.sendBeacon when available to avoid blocking the UI.
 */
export const logEvent = async ({ message, level = 'info', data }: RemoteLogPayload): Promise<void> => {
  if (!LOG_ENDPOINT || typeof window === 'undefined') {
    return;
  }

  const webApp = window.Telegram?.WebApp;
  const payload = {
    message,
    level,
    data,
    time: Date.now(),
    initData: webApp?.initDataUnsafe || webApp?.initData || null
  };

  const body = JSON.stringify(payload);

  isSending = true;

  // Try to use sendBeacon first for reliability on navigation/unload
  if (typeof navigator !== 'undefined' && typeof navigator.sendBeacon === 'function') {
    const blob = new Blob([body], { type: 'application/json' });
    const sent = navigator.sendBeacon(LOG_ENDPOINT, blob);
    if (sent) {
      isSending = false;
      return;
    }
  }

  try {
    await fetch(LOG_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body,
      keepalive: true
    });
  } catch {
    // Swallow errors to avoid log loops
  }

  isSending = false;
};

export const logError = (message: string, error?: unknown): Promise<void> =>
  logEvent({
    message,
    level: 'error',
    data: formatError(error)
  });

export const isRemoteLogInFlight = (): boolean => isSending;

export const isRemoteLoggingEnabled = (): boolean => Boolean(LOG_ENDPOINT);
