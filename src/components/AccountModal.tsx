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
  Laptop,
  Smartphone,
  Save,
  RefreshCw,
} from 'lucide-react';
import { UserAccount, UserCloudSyncData, DeviceType } from '../types';
import {
  createAccount,
  signIn,
  formatUsername,
  validateUsername,
  validatePassword,
  syncLocalDataToCloud,
  collectCurrentLocalData,
} from '../utils/accountService';

interface AccountModalProps {
  isOpen: boolean;
  onClose?: () => void;
  canDismiss?: boolean;
  onAccountSuccess: (account: UserAccount, syncData?: UserCloudSyncData | null, deviceType?: DeviceType) => void;
  onContinueAsGuest: (guestName: string, deviceType?: DeviceType) => void;
  initialMode?: 'create' | 'login' | 'guest';
  currentGuestName?: string;
  isSettingsFlow?: boolean; // When opened from settings to attach current progress
  currentDeviceMode?: DeviceType;
  onSelectDeviceMode?: (device: DeviceType) => void;
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
  currentDeviceMode,
  onSelectDeviceMode,
}) => {
  const [mode, setMode] = useState<'create' | 'login' | 'guest'>(initialMode);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState(currentGuestName || '');
  const [showPassword, setShowPassword] = useState(false);
  const [syncDeviceProgressOnLogin, setSyncDeviceProgressOnLogin] = useState(true);
  const [selectedDevice, setSelectedDevice] = useState<DeviceType>(() => {
    if (currentDeviceMode) return currentDeviceMode;
    try {
      const saved = localStorage.getItem('desk_clock_device_mode');
      if (saved === 'mobile' || saved === 'pc') return saved;
    } catch {}
    const isMobileBrowser =
      typeof window !== 'undefined'
        ? window.innerWidth < 768 || /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent)
        : false;
    return isMobileBrowser ? 'mobile' : 'pc';
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  // Normalized display of what the username will be
  const formattedPreview = formatUsername(username);

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
      const trimmed = displayName.trim() || currentGuestName || 'Guest';
      try {
        localStorage.setItem('desk_clock_device_mode', selectedDevice);
      } catch {}
      onSelectDeviceMode?.(selectedDevice);
      onContinueAsGuest(trimmed, selectedDevice);
      return;
    }

    // Auto-normalize username so if the user typed "alex", it automatically formats to "alex@dek"
    const formatted = formatUsername(username);
    const uCheck = validateUsername(formatted);
    if (!uCheck.isValid) {
      setError(uCheck.error || 'Please enter a valid username ending with @dek');
      return;
    }

    const pCheck = validatePassword(password);
    if (!pCheck.isValid) {
      setError(pCheck.error || 'Please enter a password with at least 4 characters');
      return;
    }

    setIsLoading(true);

    try {
      try {
        localStorage.setItem('desk_clock_device_mode', selectedDevice);
      } catch {}
      onSelectDeviceMode?.(selectedDevice);

      if (mode === 'create') {
        // Collect current local progress (settings, pomodoro sessions, tasks, streaks) gathered so far
        const currentData = collectCurrentLocalData();
        const { account, syncData } = await createAccount(
          formatted,
          password,
          displayName.trim() || undefined,
          currentData
        );
        setSuccessMsg(
          isSettingsFlow
            ? `Account created! All current progress has been synced to ${account.username}.`
            : `Welcome, ${account.displayName}! Your @dek account is ready to use on any device.`
        );
        setTimeout(() => {
          onAccountSuccess(account, syncData, selectedDevice);
        }, 600);
      } else {
        // Sign in
        const { account, syncData } = await signIn(formatted, password);
        
        // If user opted to merge/sync this device's progress to their account
        if (syncDeviceProgressOnLogin) {
          try {
            await syncLocalDataToCloud(account);
          } catch (syncErr) {
            console.debug('Background sync on login notice:', syncErr);
          }
        }

        setSuccessMsg(`Welcome back, ${account.displayName}! Synced with ${account.username}.`);
        setTimeout(() => {
          onAccountSuccess(account, syncData, selectedDevice);
        }, 600);
      }
    } catch (err: unknown) {
      console.error('Account error:', err);
      let rawMsg = '';
      if (err instanceof Error) {
        rawMsg = err.message;
        try {
          const parsed = JSON.parse(err.message);
          if (parsed && typeof parsed === 'object' && parsed.error) {
            rawMsg = parsed.error;
          }
        } catch {
          // not JSON, use standard message
        }
      }

      let userFriendlyMsg = rawMsg || 'An unexpected error occurred. Please check your connection.';
      if (userFriendlyMsg.includes('Unsupported field value: undefined')) {
        userFriendlyMsg = 'Could not save account data due to unformatted settings. Please try again.';
      } else if (userFriendlyMsg.includes('Missing or insufficient permissions')) {
        userFriendlyMsg = 'Permission denied by cloud server. Please ensure your username ends with @dek and contains valid characters.';
      }

      setError(userFriendlyMsg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      id="account-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-fadeIn overflow-y-auto"
    >
      <div
        id="account-modal-card"
        className="w-full max-w-lg bg-neutral-900 border border-neutral-800 text-neutral-100 rounded-3xl p-5 sm:p-7 shadow-2xl relative overflow-hidden flex flex-col gap-4.5 my-auto"
      >
        {/* Ambient Glow Accents */}
        <div className="absolute top-0 right-0 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />

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
                  ? 'Create Account with Existing Progress'
                  : 'Create Your @dek Account'
                : mode === 'login'
                ? 'Sign In to Your @dek Account'
                : 'Continue as Guest'}
            </h2>
            <p className="text-xs text-neutral-400 leading-relaxed mt-0.5">
              {mode === 'create'
                ? isSettingsFlow
                  ? 'Turn your device setup into a portable account to use on any device.'
                  : 'Sync your personalized clocks, tasks, and focus stats across all devices.'
                : mode === 'login'
                ? 'Log in from any device to restore your setups, tasks, and streaks.'
                : 'Use the app offline without an account. The system remembers your progress locally.'}
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
            className={`flex-1 py-2 rounded-lg text-center transition-all cursor-pointer ${
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
            className={`flex-1 py-2 rounded-lg text-center transition-all cursor-pointer ${
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
            className={`flex-1 py-2 rounded-lg text-center transition-all cursor-pointer ${
              mode === 'guest'
                ? 'bg-neutral-800 text-white font-bold shadow-sm'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            Guest Mode
          </button>
        </div>

        {/* EXPLICIT INSTRUCTION CARDS */}
        {mode === 'create' && (
          <div className="bg-amber-500/10 border border-amber-500/25 rounded-2xl p-3.5 space-y-2 text-xs text-amber-200/90 leading-relaxed">
            <div className="flex items-center gap-2 text-amber-300 font-bold">
              <HelpCircle className="w-4 h-4 text-amber-400 shrink-0" />
              <span>Instructions to Create Account:</span>
            </div>
            <ul className="space-y-1.5 pl-6 list-disc text-neutral-300">
              <li>
                Enter a username which will end with <strong className="text-amber-300 font-mono">@dek</strong> (for example:{' '}
                <code className="bg-black/50 px-1 py-0.5 rounded text-amber-300 font-mono text-[11px]">
                  alex@dek
                </code>
                ). If you type <code className="bg-black/50 px-1 py-0.5 rounded text-amber-300 font-mono text-[11px]">alex</code>, we will automatically format it to <code className="bg-black/50 px-1 py-0.5 rounded text-amber-300 font-mono text-[11px]">alex@dek</code>.
              </li>
              <li>
                Create a secure password (minimum 4 characters).
              </li>
              <li className="text-amber-200">
                <strong>Cross-Device Access:</strong> You can use these credentials to log in on any device (laptop, phone, tablet) and access your setup.
              </li>
            </ul>
            {isSettingsFlow && (
              <div className="mt-2 pt-2 border-t border-amber-500/20 flex items-center gap-2 text-emerald-300 font-medium text-xs">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>All progress gathered on this device so far will be automatically linked to your new account.</span>
              </div>
            )}
          </div>
        )}

        {mode === 'login' && (
          <div className="bg-amber-500/10 border border-amber-500/25 rounded-2xl p-3.5 space-y-1.5 text-xs text-amber-200/90 leading-relaxed">
            <div className="flex items-center gap-2 text-amber-300 font-bold">
              <Laptop className="w-4 h-4 text-amber-400 shrink-0" />
              <span>Log In from Any Device:</span>
            </div>
            <p className="text-neutral-300 pl-6">
              Enter your username ending with <strong className="text-amber-300 font-mono">@dek</strong> and your password to sign in and synchronize your clock settings, Pomodoro timers, tasks, and streaks.
            </p>
          </div>
        )}

        {mode === 'guest' && (
          <div className="bg-sky-500/10 border border-sky-500/25 rounded-2xl p-3.5 space-y-2 text-xs text-sky-200/90 leading-relaxed">
            <div className="flex items-center gap-2 text-sky-300 font-bold">
              <User className="w-4 h-4 text-sky-400 shrink-0" />
              <span>Guest Mode (Local Offline Storage):</span>
            </div>
            <ul className="space-y-1.5 pl-6 list-disc text-neutral-300">
              <li>
                You can use the app without signing in.
              </li>
              <li>
                <strong className="text-sky-300">System Remembers Your Data:</strong> All your clock styles, themes, pomodoro intervals, checklists, and streaks will continue to be remembered and saved locally on this device (the way the app works currently).
              </li>
              <li>
                <strong className="text-sky-300">Sync Later Anytime:</strong> If you want, you can create an account or sign in later in Settings to sync the data you have gathered across all your devices.
              </li>
            </ul>
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
                    className="block text-xs font-semibold text-neutral-300 uppercase tracking-wider"
                  >
                    Username (Ends with @dek)
                  </label>
                  {formattedPreview && (
                    <span className="text-[11px] font-mono text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                      Will be: {formattedPreview}
                    </span>
                  )}
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-neutral-500">
                    <User className="w-4 h-4" />
                  </div>
                  <input
                    id="account-username-input"
                    type="text"
                    name="username"
                    autoComplete="username"
                    value={username}
                    onChange={(e) => handleUsernameChange(e.target.value)}
                    placeholder="e.g. yourname or yourname@dek"
                    autoFocus
                    required
                    maxLength={50}
                    className="w-full pl-10 pr-20 py-2.5 bg-neutral-950 border border-neutral-700/80 rounded-xl text-white placeholder-neutral-500 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 text-sm font-mono transition-all"
                  />
                  {!username.toLowerCase().endsWith('@dek') && username.trim().length > 0 && (
                    <button
                      type="button"
                      onClick={() => setUsername(formatUsername(username))}
                      className="absolute right-2 top-1/2 -translate-y-1/2 px-2 py-1 rounded bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 text-xs font-mono border border-amber-500/30 cursor-pointer transition-all"
                      title="Append @dek"
                    >
                      +@dek
                    </button>
                  )}
                </div>
                <p className="text-[11px] text-neutral-500 mt-1">
                  Type your preferred username (e.g. <span className="font-mono text-neutral-400">alex</span> or <span className="font-mono text-neutral-400">alex@dek</span>).
                </p>
              </div>

              {/* Password Field */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label
                    htmlFor="account-password-input"
                    className="block text-xs font-semibold text-neutral-300 uppercase tracking-wider"
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
                    name="password"
                    autoComplete={mode === 'create' ? 'new-password' : 'current-password'}
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
                {mode === 'create' && password.length > 0 && (
                  <div className="flex items-center gap-1.5 text-[11px] text-neutral-400 mt-1.5">
                    <span className={`w-2 h-2 rounded-full ${password.length >= 8 ? 'bg-emerald-400' : password.length >= 4 ? 'bg-amber-400' : 'bg-rose-400'}`} />
                    <span>
                      {password.length < 4
                        ? 'Too short (minimum 4 characters)'
                        : password.length >= 8
                        ? 'Strong & secure password'
                        : 'Good password'}
                    </span>
                  </div>
                )}
              </div>
            </>
          )}

          {/* Optional Display Name (In Create & Guest modes) */}
          {mode !== 'login' && (
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label
                  htmlFor="account-display-name-input"
                  className="block text-xs font-semibold text-neutral-300 uppercase tracking-wider"
                >
                  {mode === 'guest' ? 'Your Name' : 'Display Name (Optional)'}
                </label>
                {mode === 'create' && (
                  <span className="text-[10px] text-neutral-500">Defaults to username prefix</span>
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
                  placeholder={mode === 'guest' ? 'e.g. Alex (shown on your clock)' : 'e.g. Alex'}
                  maxLength={30}
                  className="w-full pl-10 pr-4 py-2.5 bg-neutral-950 border border-neutral-700/80 rounded-xl text-white placeholder-neutral-500 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 text-sm transition-all"
                />
              </div>
            </div>
          )}

          {/* Sync Progress Checkbox when logging in */}
          {mode === 'login' && (
            <label className="flex items-start gap-2.5 p-2.5 rounded-xl bg-neutral-950 border border-neutral-800 cursor-pointer text-xs text-neutral-300">
              <input
                type="checkbox"
                checked={syncDeviceProgressOnLogin}
                onChange={(e) => setSyncDeviceProgressOnLogin(e.target.checked)}
                className="mt-0.5 rounded text-amber-500 focus:ring-amber-400 border-neutral-700"
              />
              <span>
                <strong>Sync device progress:</strong> Merge any clock settings, tasks, and streaks gathered on this device into this account upon logging in.
              </span>
            </label>
          )}

          {/* DEVICE SELECTION & UI OPTIMIZATION (Every user chooses Mobile or PC) */}
          <div className="pt-2 border-t border-neutral-800/80 space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-semibold text-neutral-300 uppercase tracking-wider">
                {mode === 'login'
                  ? 'Which device are you logging in from?'
                  : 'Select Current Device Optimization'}
              </label>
              <span className="text-[10px] font-mono text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                {selectedDevice === 'mobile' ? 'Mobile Mode' : 'PC Desktop Mode'}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                id="device-opt-mobile-btn"
                onClick={() => setSelectedDevice('mobile')}
                className={`p-3 rounded-xl border flex flex-col items-center text-center gap-1.5 transition-all cursor-pointer ${
                  selectedDevice === 'mobile'
                    ? 'border-amber-400 bg-amber-500/15 text-white ring-2 ring-amber-400/40 shadow-sm'
                    : 'border-neutral-800 bg-neutral-900/60 hover:bg-neutral-900 text-neutral-400'
                }`}
              >
                <div className="flex items-center gap-1.5 font-bold text-xs">
                  <Smartphone className="w-4 h-4 text-amber-400" />
                  <span>Mobile Phone</span>
                </div>
                <span className="text-[10px] text-neutral-400 leading-tight">
                  Touch-first, full-screen scroll & tap circle to wake
                </span>
              </button>

              <button
                type="button"
                id="device-opt-pc-btn"
                onClick={() => setSelectedDevice('pc')}
                className={`p-3 rounded-xl border flex flex-col items-center text-center gap-1.5 transition-all cursor-pointer ${
                  selectedDevice === 'pc'
                    ? 'border-amber-400 bg-amber-500/15 text-white ring-2 ring-amber-400/40 shadow-sm'
                    : 'border-neutral-800 bg-neutral-900/60 hover:bg-neutral-900 text-neutral-400'
                }`}
              >
                <div className="flex items-center gap-1.5 font-bold text-xs">
                  <Laptop className="w-4 h-4 text-amber-400" />
                  <span>PC / Laptop</span>
                </div>
                <span className="text-[10px] text-neutral-400 leading-tight">
                  Spacious widescreen & hover access bar
                </span>
              </button>
            </div>
          </div>

          {/* Error & Success Messages */}
          {error && (
            <div className="flex flex-col gap-2 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs animate-fadeIn">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
                <span className="leading-relaxed">{error}</span>
              </div>
              {error.includes('No account found') && mode === 'login' && (
                <button
                  type="button"
                  onClick={() => {
                    setMode('create');
                    setError(null);
                  }}
                  className="self-start text-[11px] font-semibold text-amber-300 hover:text-amber-200 underline cursor-pointer pl-6"
                >
                  Click here to create this @dek account now →
                </button>
              )}
              {error.includes('already exists') && mode === 'create' && (
                <button
                  type="button"
                  onClick={() => {
                    setMode('login');
                    setError(null);
                  }}
                  className="self-start text-[11px] font-semibold text-amber-300 hover:text-amber-200 underline cursor-pointer pl-6"
                >
                  Click here to sign in with this account instead →
                </button>
              )}
            </div>
          )}

          {successMsg && (
            <div className="flex items-center gap-2 p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs animate-fadeIn">
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
                  ? 'bg-neutral-800 hover:bg-neutral-700 text-white border border-neutral-700'
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
                        ? 'Create @dek Account & Sync Progress'
                        : 'Create @dek Account'
                      : mode === 'login'
                      ? 'Sign In & Access on This Device'
                      : 'Continue as Guest (Store on This Device)'}
                  </span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            {/* Quick Guest Mode Alternative */}
            {mode !== 'guest' ? (
              <button
                type="button"
                onClick={() => {
                  setMode('guest');
                  setError(null);
                }}
                className="w-full text-center py-2 text-xs text-neutral-400 hover:text-white transition-colors cursor-pointer"
              >
                Or Continue as Guest (Use offline; system remembers your data locally)
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
                Want to access across devices? Create an @dek account
              </button>
            )}
          </div>
        </form>

        {/* Footer Info */}
        <div className="pt-1 border-t border-neutral-800/80 flex items-center justify-between text-[11px] text-neutral-500">
          <span className="inline-flex items-center gap-1.5 text-emerald-400 font-medium">
            <Shield className="w-3.5 h-3.5" />
            101% Safe &bull; SHA-256 Salted Hash &bull; Anti-Scrape Hardened
          </span>
          <span className="font-mono text-[10px] text-neutral-500">dek2 pro</span>
        </div>
      </div>
    </div>
  );
};
