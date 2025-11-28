import { isRemoteLogInFlight, isRemoteLoggingEnabled, logError, logEvent } from './remoteLogger';

type ConsoleMethod = 'log' | 'warn' | 'error';

const formatArgs = (args: unknown[]): string =>
  args
    .map((arg) => {
      if (typeof arg === 'string') return arg;
      try {
        return JSON.stringify(arg);
      } catch {
        return String(arg);
      }
    })
    .join(' ');

const levelFromMethod = (method: ConsoleMethod) => {
  if (method === 'warn') return 'warn';
  if (method === 'error') return 'error';
  return 'info';
};

export const installRemoteConsoleForwarding = (): void => {
  if (typeof window === 'undefined' || !isRemoteLoggingEnabled()) {
    return;
  }

  if (window.__remoteConsoleForwardingInstalled) {
    return;
  }

  window.__remoteConsoleForwardingInstalled = true;

  const originalConsole = {
    log: console.log.bind(console),
    warn: console.warn.bind(console),
    error: console.error.bind(console)
  };

  const forward = (method: ConsoleMethod, args: unknown[]) => {
    if (isRemoteLogInFlight()) return;
    void logEvent({
      message: formatArgs(args),
      level: levelFromMethod(method),
      data: args
    });
  };

  (['log', 'warn', 'error'] as ConsoleMethod[]).forEach((method) => {
    (console as Console)[method] = (...args: unknown[]) => {
      originalConsole[method](...args);
      forward(method, args);
    };
  });

  window.addEventListener('error', (event) => {
    void logError('Unhandled error', {
      message: event.message,
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
      stack: event.error instanceof Error ? event.error.stack : undefined
    });
  });

  window.addEventListener('unhandledrejection', (event) => {
    void logError('Unhandled promise rejection', event.reason);
  });
};

declare global {
  interface Window {
    __remoteConsoleForwardingInstalled?: boolean;
  }
}
