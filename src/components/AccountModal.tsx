import React, { useState } from 'react';
import {
  Sparkles,
  User,
  Lock,
  ArrowRight,
  Eye,
  EyeOff,
  Cloud,
  Shield,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  X,
} from 'lucide-react';
import { UserAccount, UserCloudSyncData } from '../types';
import {
  createAccount,
  signIn,
  formatUsername,
  validateUsername,
  validatePassword,
} from '../utils/accountService';

interface AccountModalProps {
  isOpen: boolean;
  onClose?: () => void;
  canDismiss?: boolean;
  onAccountSuccess: (account: UserAccount, syncData?: UserCloudSyncData | null) => void;
  onContinueAsGuest: (guestName: string) => void;
  initialMode?: 'create' | 'login' | 'guest';
  currentGuestName?: string;
  isSettingsFlow?: boolean; // When opened from settings to attach current progress
}

export const AccountModal: React.FC<AccountModalProps> = ({
  isOpen,
  onClose,
  canDismiss = false,
  onAccountSuccess,
  onContinueAsGuest,
  initialMode = 'create',
  currentGuestName = '',
  isSettingsFlow = false,
}) => {
  const [mode, setMode] = useState<'create' | 'login' | 'guest'>(initialMode);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState(currentGuestName || '');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleUsernameChange = (val: string) => {
    setUsername(val);
    if (error) setError(null);
  };

  const handlePasswordChange = (val: string) => {
    setPassword(val);
    if (error) setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    if (mode === 'guest') {
      const trimmed = displayName.trim() || 'Guest';
      onContinueAsGuest(trimmed);
      return;
    }

    const formatted = formatUsername(username);
    const uCheck = validateUsername(formatted);
    if (!uCheck.isValid) {
      setError(uCheck.error || 'Please enter a valid @dek username');
      return;
    }

    const pCheck = validatePassword(password);
    if (!pCheck.isValid) {
      setError(pCheck.error || 'Please enter a password with at least 4 characters');
      return;
    }

    setIsLoading(true);

    try {
      if (mode === 'create') {
        const { account, syncData } = await createAccount(
          formatted,
          password,
          displayName.trim() || undefined
        );
        setSuccessMsg(`Welcome, ${account.displayName}! Your @dek account has been created.`);
        setTimeout(() => {
          onAccountSuccess(account, syncData);
        }, 600);
      } else {
        const { account, syncData } = await signIn(formatted, password);
        setSuccessMsg(`Welcome back, ${account.displayName}! Data synced from cloud.`);
        setTimeout(() => {
          onAccountSuccess(account, syncData);
        }, 600);
      }
    } catch (err: unknown) {
      console.error('Account error:', err);
      if (err instanceof Error) {
        try {
          const parsed = JSON.parse(err.message);
          if (parsed && typeof parsed === 'object' && parsed.error) {
            setError(parsed.error);
            return;
          }
        } catch {
          // not JSON, use standard message
        }
        setError(err.message);
      } else {
        setError('An unexpected error occurred. Please check your connection.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      id="account-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn"
    >
      <div
        id="account-modal-card"
        className="w-full max-w-md bg-neutral-900 border border-neutral-800 text-neutral-100 rounded-3xl p-6 sm:p-7 shadow-2xl relative overflow-hidden flex flex-col gap-5"
      >
        {/* Glow Accents */}
        <div className="absolute top-0 right-0 w-44 h-44 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-44 h-44 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Close Button if dismissible */}
        {canDismiss && onClose && (
          <button
            type="button"
            onClick={onClose}
            className="absolute top-5 right-5 p-1.5 rounded-full text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors cursor-pointer z-10"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>
        )}

        {/* Header */}
        <div className="flex items-center gap-3.5 pr-8">
          <div className="w-11 h-11 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30 shrink-0 shadow-inner">
            {mode === 'guest' ? <User className="w-5 h-5" /> : <Cloud className="w-5 h-5" />}
          </div>
          <div>
            <h2 className="text-lg sm:text-xl font-bold tracking-tight text-white flex items-center gap-2">
              {mode === 'create'
                ? isSettingsFlow
                  ? 'Sync Your Progress to @dek'
                  : 'Create Your @dek Account'
                : mode === 'login'
                ? 'Sign In to @dek'
                : 'Continue as Guest'}
            </h2>
            <p className="text-xs text-neutral-400 leading-relaxed mt-0.5">
              {mode === 'create'
                ? 'Use your @dek handle and password on any phone or desktop to sync progress.'
                : mode === 'login'
                ? 'Sign in to restore all your clock themes, pomodoro tasks, and streaks.'
                : 'Use the app offline without an account. Local progress can be linked anytime.'}
            </p>
          </div>
        </div>

        {/* Mode Navigation Tabs */}
        <div className="flex items-center p-1 bg-neutral-950/80 border border-neutral-800 rounded-xl text-xs font-medium">
          <button
            type="button"
            onClick={() => {
              setMode('create');
              setError(null);
            }}
            className={`flex-1 py-1.5 rounded-lg text-center transition-all cursor-pointer ${
              mode === 'create'
                ? 'bg-amber-500 text-neutral-950 font-bold shadow-sm'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            Create Account
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('login');
              setError(null);
            }}
            className={`flex-1 py-1.5 rounded-lg text-center transition-all cursor-pointer ${
              mode === 'login'
                ? 'bg-amber-500 text-neutral-950 font-bold shadow-sm'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('guest');
              setError(null);
            }}
            className={`flex-1 py-1.5 rounded-lg text-center transition-all cursor-pointer ${
              mode === 'guest'
                ? 'bg-neutral-800 text-white font-bold shadow-sm'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            Guest Mode
          </button>
        </div>

        {/* Instructions Banner for @dek requirement */}
        {mode !== 'guest' ? (
          <div className="bg-amber-500/10 border border-amber-500/25 rounded-2xl p-3 flex items-start gap-2.5 text-xs text-amber-200/90 leading-relaxed">
            <HelpCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <strong className="text-amber-300 font-semibold block mb-0.5">
                Instructions: Username must end with @dek
              </strong>
              <span>
                Enter your username ending with <strong>@dek</strong> (for example:{' '}
                <code className="bg-black/40 px-1 py-0.5 rounded text-amber-300 font-mono text-[11px]">
                  yourname@dek
                </code>
                ) and a password. You can use these credentials to log in on any device.
                {isSettingsFlow && mode === 'create' && (
                  <span className="block mt-1 text-emerald-300 font-medium">
                    ✓ All your existing progress gathered on this device will be automatically linked and synced to your new @dek account.
                  </span>
                )}
              </span>
            </div>
          </div>
        ) : (
          <div className="bg-sky-500/10 border border-sky-500/25 rounded-2xl p-3 flex items-start gap-2.5 text-xs text-sky-200/90 leading-relaxed">
            <User className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
            <div>
              <strong className="text-sky-300 font-semibold block mb-0.5">
                Guest Mode: Local Offline Storage
              </strong>
              <span>
                You can use the app without signing in. The system remembers your clock styles, pomodoro intervals, checklists, and streaks locally on this device. If you want, you can sign in or create an account later in Settings to sync the data you have gathered across all your devices.
              </span>
            </div>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="space-y-3.5">
          {mode !== 'guest' && (
            <>
              {/* Username Field */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label
                    htmlFor="account-username-input"
                    className="block text-xs font-medium text-neutral-300 uppercase tracking-wider"
                  >
                    User (@dek handle)
                  </label>
                  <span className="text-[10px] font-mono text-amber-400/90">Ends with @dek</span>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-neutral-500">
                    <User className="w-4 h-4" />
                  </div>
                  <input
                    id="account-username-input"
                    type="text"
                    value={username}
                    onChange={(e) => handleUsernameChange(e.target.value)}
                    placeholder="e.g. alex@dek"
                    autoFocus
                    required
                    maxLength={44}
                    className="w-full pl-10 pr-16 py-2.5 bg-neutral-950 border border-neutral-700/80 rounded-xl text-white placeholder-neutral-500 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 text-sm font-mono transition-all"
                  />
                  {!username.toLowerCase().endsWith('@dek') && username.trim().length > 0 && (
                    <button
                      type="button"
                      onClick={() => setUsername(formatUsername(username))}
                      className="absolute right-2 top-1/2 -translate-y-1/2 px-2 py-0.5 rounded bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 text-[10px] font-mono border border-amber-500/30 cursor-pointer"
                      title="Append @dek suffix"
                    >
                      +@dek
                    </button>
                  )}
                </div>
              </div>

              {/* Password Field */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label
                    htmlFor="account-password-input"
                    className="block text-xs font-medium text-neutral-300 uppercase tracking-wider"
                  >
                    Password
                  </label>
                  <span className="text-[10px] font-mono text-neutral-500">Min 4 chars</span>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-neutral-500">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    id="account-password-input"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => handlePasswordChange(e.target.value)}
                    placeholder="Enter your password"
                    required
                    maxLength={64}
                    className="w-full pl-10 pr-10 py-2.5 bg-neutral-950 border border-neutral-700/80 rounded-xl text-white placeholder-neutral-500 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 text-sm transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-neutral-400 hover:text-white cursor-pointer"
                    title={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </>
          )}

          {/* Display Name (Only in Create & Guest modes) */}
          {mode !== 'login' && (
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label
                  htmlFor="account-display-name-input"
                  className="block text-xs font-medium text-neutral-300 uppercase tracking-wider"
                >
                  {mode === 'guest' ? 'Your Name' : 'Display Name (Optional)'}
                </label>
                {mode === 'create' && (
                  <span className="text-[10px] text-neutral-500">Defaults to username</span>
                )}
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-neutral-500">
                  <Sparkles className="w-4 h-4" />
                </div>
                <input
                  id="account-display-name-input"
                  type="text"
                  value={displayName}
                  onChange={(e) => {
                    setDisplayName(e.target.value);
                    if (error) setError(null);
                  }}
                  placeholder={mode === 'guest' ? 'e.g. Alex' : 'Name shown on your clock'}
                  maxLength={30}
                  className="w-full pl-10 pr-4 py-2.5 bg-neutral-950 border border-neutral-700/80 rounded-xl text-white placeholder-neutral-500 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 text-sm transition-all"
                />
              </div>
            </div>
          )}

          {/* Error & Success Messages */}
          {error && (
            <div className="flex items-center gap-2 p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="flex items-center gap-2 p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="pt-2 flex flex-col gap-2.5">
            <button
              id="account-submit-btn"
              type="submit"
              disabled={isLoading}
              className={`w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-bold text-xs tracking-wide shadow-lg transition-all cursor-pointer ${
                mode === 'guest'
                  ? 'bg-neutral-800 hover:bg-neutral-700 text-white'
                  : 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-neutral-950 shadow-amber-500/20'
              } ${isLoading ? 'opacity-70 cursor-wait' : 'active:scale-98'}`}
            >
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>
                    {mode === 'create'
                      ? isSettingsFlow
                        ? 'Create & Sync Progress to @dek'
                        : 'Create @dek Account'
                      : mode === 'login'
                      ? 'Sign In & Sync Device'
                      : 'Continue as Guest'}
                  </span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            {/* Quick Guest Mode Alternative for First-Time Entry */}
            {mode !== 'guest' ? (
              <button
                type="button"
                onClick={() => {
                  setMode('guest');
                  setError(null);
                }}
                className="w-full text-center py-2 text-xs text-neutral-400 hover:text-white transition-colors cursor-pointer"
              >
                Or Continue as Guest (Store data locally on this device)
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setMode('create');
                  setError(null);
                }}
                className="w-full text-center py-2 text-xs text-amber-400/90 hover:text-amber-300 transition-colors cursor-pointer"
              >
                Want cloud sync across all devices? Create an @dek account
              </button>
            )}
          </div>
        </form>

        {/* Footer Info */}
        <div className="pt-1 border-t border-neutral-800/80 flex items-center justify-between text-[11px] text-neutral-500">
          <span className="inline-flex items-center gap-1">
            <Shield className="w-3 h-3 text-emerald-500" />
            Zero-leak encrypted SHA-256
          </span>
          <span className="font-mono">Desk Clock • v2.0</span>
        </div>
      </div>
    </div>
  );
};
