import React, { useMemo, useState } from 'react';
import { authService } from '../services/sync/auth';

interface LoginScreenProps {
  onLoginSuccess: (userData: any) => void;
  onLoginError?: (message: string) => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLoginSuccess, onLoginError }) => {
  const [code, setCode] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const normalizedCode = useMemo(() => code.trim(), [code]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!normalizedCode) {
      setErrorMessage('Enter the login code from Telegram.');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    const result = await authService.redeemLoginCode(normalizedCode);
    if (!result.success) {
      setIsLoading(false);
      setErrorMessage(result.message || 'Login failed');
      return;
    }

    const currentUser = await authService.getCurrentUser();
    setIsLoading(false);

    if (currentUser) {
      onLoginSuccess(currentUser);
      return;
    }

    setErrorMessage('Session was created but could not be verified. Refresh and try again.');
    onLoginError?.('Session was created but could not be verified. Refresh and try again.');
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 px-4 py-8 text-white">
      <div className="w-full max-w-md rounded-3xl border border-white/10 bg-white/5 p-6 shadow-2xl backdrop-blur">
        <div className="mb-6 text-center">
          <h1 className="text-3xl font-semibold tracking-tight">BudgetBot</h1>
          <p className="mt-2 text-sm text-slate-300">
            Get a short-lived login code from Telegram, then paste it here.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <label className="block">
            <span className="mb-2 block text-sm font-medium text-slate-200">Login code</span>
            <input
              autoFocus
              autoCapitalize="characters"
              autoComplete="one-time-code"
              spellCheck={false}
              value={code}
              onChange={(event) => setCode(event.target.value.toUpperCase())}
              placeholder="ABCD-EFGH-IJKL"
              className="w-full rounded-2xl border border-white/10 bg-slate-900/80 px-4 py-3 text-base tracking-[0.25em] text-white outline-none ring-0 placeholder:text-slate-500 focus:border-cyan-400"
            />
          </label>

          <button
            type="submit"
            disabled={isLoading || !normalizedCode}
            className="w-full rounded-2xl bg-cyan-400 px-4 py-3 text-sm font-semibold text-slate-950 transition disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isLoading ? 'Verifying code...' : 'Sign in'}
          </button>
        </form>

        {errorMessage && (
          <div className="mt-4 rounded-2xl border border-red-500/40 bg-red-950/50 p-3 text-sm text-red-200">
            {errorMessage}
          </div>
        )}

        <div className="mt-5 space-y-2 text-xs leading-5 text-slate-400">
          <p>1. Send /login in Telegram.</p>
          <p>2. Paste the code from the bot message here.</p>
          <p>3. The backend exchanges it for an HttpOnly session cookie.</p>
        </div>
      </div>
    </div>
  );
};

export default LoginScreen;
