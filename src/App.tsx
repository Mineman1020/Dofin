import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Maximize2, Minimize2, Sparkles, Smartphone, Laptop } from 'lucide-react';
import { ViewMode, ClockSettings, PomodoroSettings, UserAccount, UserCloudSyncData, DeviceType } from './types';
import {
  DEFAULT_CLOCK_SETTINGS,
  DEFAULT_POMODORO_SETTINGS,
} from './utils/constants';
import { WelcomeScreen } from './components/WelcomeScreen';
import { ClockView } from './components/ClockView';
import { PomodoroView } from './components/PomodoroView';
import { TaskTrackerView } from './components/TaskTrackerView';
import { StatsView } from './components/StatsView';
import { SettingsModal } from './components/SettingsModal';
import { NameModal } from './components/NameModal';
import { AccountModal } from './components/AccountModal';
import { PartyModal } from './components/PartyModal';
import { StartupReveal } from './components/StartupReveal';
import { ShortcutsSheet } from './components/ShortcutsSheet';
import { usePomodoroTimer } from './utils/usePomodoroTimer';
import { useFullscreen } from './utils/useFullscreen';
import {
  getActiveAccount,
  signOut,
  syncLocalDataToCloud,
  pullCloudDataToLocal,
  triggerAutoCloudSync,
  forceCloudSyncNow,
  subscribeToAccountCloudSync,
} from './utils/accountService';

const STORAGE_KEYS = {
  USER_NAME: 'desk_clock_user_name',
  CLOCK_SETTINGS: 'desk_clock_settings_v1',
  POMODORO_SETTINGS: 'desk_clock_pomodoro_v1',
  DARK_MODE: 'desk_clock_dark_mode_v1',
};

export default function App() {
  // User Account state (null if in Guest Mode)
  const [userAccount, setUserAccount] = useState<UserAccount | null>(() => {
    return getActiveAccount();
  });

  // User name state
  const [userName, setUserName] = useState<string>(() => {
    try {
      const active = getActiveAccount();
      if (active?.displayName) return active.displayName;
      return localStorage.getItem(STORAGE_KEYS.USER_NAME) || '';
    } catch {
      return '';
    }
  });

  // Current Device Optimization State: 'mobile' | 'pc'
  // Persisted in localStorage and chosen on onboarding/sign-in
  const [deviceMode, setDeviceMode] = useState<DeviceType>(() => {
    try {
      const saved = localStorage.getItem('desk_clock_device_mode');
      if (saved === 'mobile' || saved === 'pc') return saved;
    } catch {}
    if (typeof window !== 'undefined') {
      const isMobileScreen =
        window.innerWidth < 768 ||
        /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
      return isMobileScreen ? 'mobile' : 'pc';
    }
    return 'pc';
  });

  const handleSelectDeviceMode = (mode: DeviceType) => {
    setDeviceMode(mode);
    try {
      localStorage.setItem('desk_clock_device_mode', mode);
    } catch (e) {
      console.debug('Failed to save device mode:', e);
    }
  };

  // First-time Entry Account Modal: prompt user on first arrival to create account, sign in, or continue as guest
  const [showStartupReveal, setShowStartupReveal] = useState<boolean>(true);
  const [isAccountModalOpen, setIsAccountModalOpen] = useState<boolean>(false);
  const [accountModalMode, setAccountModalMode] = useState<'create' | 'login' | 'guest'>('create');
  const [isAccountModalSettingsFlow, setIsAccountModalSettingsFlow] = useState<boolean>(false);

  // Check if first-time onboarding prompt should be displayed once reveal is complete
  useEffect(() => {
    if (!showStartupReveal) {
      try {
        const hasAccount = localStorage.getItem('desk_clock_account_v1');
        const hasVisited =
          localStorage.getItem('desk_clock_visited_v1') ||
          localStorage.getItem(STORAGE_KEYS.USER_NAME);
        if (!hasAccount && !hasVisited) {
          setIsAccountModalOpen(true);
        }
      } catch (e) {
        console.debug('Error checking first-time visit status:', e);
      }
    }
  }, [showStartupReveal]);

  const [isNameModalOpen, setIsNameModalOpen] = useState<boolean>(false);

  // Dark Mode State - Default should be LIGHT mode as requested!
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.DARK_MODE);
      if (saved !== null) {
        return saved === 'true';
      }
    } catch {
      // ignore
    }
    return false; // Default theme is Light!
  });

  // Active view: 'welcome' | 'clock' | 'pomodoro'
  const [currentView, setCurrentView] = useState<ViewMode>('welcome');

  // Settings modal visibility
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [settingsModalTab, setSettingsModalTab] = useState<
    'clock' | 'pomodoro' | 'general'
  >('clock');

  const handleOpenSettings = (tab?: 'clock' | 'pomodoro' | 'general') => {
    if (tab) {
      setSettingsModalTab(tab);
    } else if (currentView === 'pomodoro') {
      setSettingsModalTab('pomodoro');
    } else {
      setSettingsModalTab('clock');
    }
    setIsSettingsOpen(true);
  };

  // Study & Work Party Modal visibility and tab
  const [isPartyModalOpen, setIsPartyModalOpen] = useState<boolean>(false);
  const [partyModalTab, setPartyModalTab] = useState<
    'leaderboard' | 'my-parties' | 'create' | 'join'
  >('my-parties');

  // Global Context-Aware Shortcuts Sheet state
  const [isShortcutsOpen, setIsShortcutsOpen] = useState<boolean>(false);

  const handleOpenParties = (
    tab: 'leaderboard' | 'my-parties' | 'create' | 'join' = 'my-parties'
  ) => {
    setPartyModalTab(tab);
    setIsPartyModalOpen(true);
  };

  // Clock settings with local persistence
  const [clockSettings, setClockSettings] = useState<ClockSettings>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.CLOCK_SETTINGS);
      if (saved) {
        return { ...DEFAULT_CLOCK_SETTINGS, ...JSON.parse(saved) };
      }
    } catch (e) {
      console.debug('Error reading clock settings:', e);
    }
    return DEFAULT_CLOCK_SETTINGS;
  });

  // Pomodoro settings with local persistence
  const [pomodoroSettings, setPomodoroSettings] = useState<PomodoroSettings>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.POMODORO_SETTINGS);
      if (saved) {
        return { ...DEFAULT_POMODORO_SETTINGS, ...JSON.parse(saved) };
      }
    } catch (e) {
      console.debug('Error reading pomodoro settings:', e);
    }
    return DEFAULT_POMODORO_SETTINGS;
  });

  // Continuous Pomodoro Engine (resilient to view switching and midnight rollover)
  const pomodoroTimer = usePomodoroTimer(pomodoroSettings);

  // Fullscreen State & Controller using multi-layered detection (Fullscreen API, CSS media queries, and window metrics)
  const { isFullscreen, toggleFullscreen: handleToggleFullscreen } = useFullscreen();

  // User activity tracker for smooth auto-fading in ambient views
  const [isAppIdle, setIsAppIdle] = useState<boolean>(false);
  useEffect(() => {
    let timer: number;
    const handleActivity = () => {
      setIsAppIdle(false);
      window.clearTimeout(timer);
      timer = window.setTimeout(() => {
        setIsAppIdle(true);
      }, 5000);
    };

    window.addEventListener('mousemove', handleActivity, { passive: true });
    window.addEventListener('keydown', handleActivity, { passive: true });
    window.addEventListener('touchstart', handleActivity, { passive: true });
    timer = window.setTimeout(() => setIsAppIdle(true), 5000);

    return () => {
      window.removeEventListener('mousemove', handleActivity);
      window.removeEventListener('keydown', handleActivity);
      window.removeEventListener('touchstart', handleActivity);
      window.clearTimeout(timer);
    };
  }, []);

  // Toggle Dark Mode
  const handleToggleDarkMode = () => {
    setIsDarkMode((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(STORAGE_KEYS.DARK_MODE, String(next));
      } catch (e) {
        console.debug('Failed to save dark mode preference:', e);
      }
      triggerAutoCloudSync();
      return next;
    });
  };

  // Save user name changes
  const handleSaveName = (name: string) => {
    setUserName(name);
    setIsNameModalOpen(false);
    try {
      localStorage.setItem(STORAGE_KEYS.USER_NAME, name);
    } catch (e) {
      console.debug('Failed to save username to localStorage', e);
    }
    triggerAutoCloudSync();
  };

  // Listen for real-time cloud data sync updates across all devices
  useEffect(() => {
    if (!userAccount) return;
    const unsub = subscribeToAccountCloudSync(userAccount, (syncData) => {
      if (syncData.userName) {
        setUserName(syncData.userName);
      }
      if (syncData.clockSettings) {
        setClockSettings((prev) => ({ ...DEFAULT_CLOCK_SETTINGS, ...prev, ...syncData.clockSettings }));
      }
      if (syncData.pomodoroSettings) {
        setPomodoroSettings((prev) => ({ ...DEFAULT_POMODORO_SETTINGS, ...prev, ...syncData.pomodoroSettings }));
      }
      if (syncData.isDarkMode !== undefined) {
        setIsDarkMode(syncData.isDarkMode);
      }
    });
    return () => unsub();
  }, [userAccount]);

  // Also listen for local custom event 'desk_clock_data_synced' (from sign-in, manual pull, etc.)
  useEffect(() => {
    const handleLocalSyncEvent = (e: Event) => {
      const customEvt = e as CustomEvent<UserCloudSyncData>;
      const syncData = customEvt.detail;
      if (!syncData) return;
      if (syncData.userName) setUserName(syncData.userName);
      if (syncData.clockSettings) {
        setClockSettings((prev) => ({ ...DEFAULT_CLOCK_SETTINGS, ...prev, ...syncData.clockSettings }));
      }
      if (syncData.pomodoroSettings) {
        setPomodoroSettings((prev) => ({ ...DEFAULT_POMODORO_SETTINGS, ...prev, ...syncData.pomodoroSettings }));
      }
      if (syncData.isDarkMode !== undefined) setIsDarkMode(syncData.isDarkMode);
    };

    window.addEventListener('desk_clock_data_synced', handleLocalSyncEvent);
    return () => window.removeEventListener('desk_clock_data_synced', handleLocalSyncEvent);
  }, []);

  // Account modal openers & handlers
  const handleOpenAccountModal = (
    mode: 'create' | 'login' | 'guest' = 'create',
    isSettings = false
  ) => {
    setAccountModalMode(mode);
    setIsAccountModalSettingsFlow(isSettings);
    setIsAccountModalOpen(true);
  };

  const handleAccountSuccess = (
    account: UserAccount,
    syncData?: UserCloudSyncData | null,
    deviceType?: DeviceType
  ) => {
    if (deviceType) {
      handleSelectDeviceMode(deviceType);
    }
    setUserAccount(account);
    setUserName(account.displayName);
    try {
      localStorage.setItem('desk_clock_visited_v1', 'true');
      localStorage.setItem(STORAGE_KEYS.USER_NAME, account.displayName);
    } catch (e) {
      console.debug('Failed to save user info to localStorage:', e);
    }

    if (syncData) {
      if (syncData.userName) {
        setUserName(syncData.userName);
      }
      if (syncData.clockSettings) {
        setClockSettings((prev) => ({ ...DEFAULT_CLOCK_SETTINGS, ...prev, ...syncData.clockSettings }));
      }
      if (syncData.pomodoroSettings) {
        setPomodoroSettings((prev) => ({ ...DEFAULT_POMODORO_SETTINGS, ...prev, ...syncData.pomodoroSettings }));
      }
      if (syncData.isDarkMode !== undefined) {
        setIsDarkMode(syncData.isDarkMode);
      }
      if (!deviceType && syncData.deviceMode) {
        setDeviceMode(syncData.deviceMode);
      }
    }
    setIsAccountModalOpen(false);
  };

  const handleContinueAsGuest = (guestName: string, deviceType?: DeviceType) => {
    if (deviceType) {
      handleSelectDeviceMode(deviceType);
    }
    const finalName = guestName.trim() || 'Guest';
    setUserName(finalName);
    try {
      localStorage.setItem(STORAGE_KEYS.USER_NAME, finalName);
      localStorage.setItem('desk_clock_visited_v1', 'true');
    } catch (e) {
      console.debug('Failed to save guest status:', e);
    }
    setIsAccountModalOpen(false);
  };

  const handleSignOutAccount = () => {
    signOut();
    setUserAccount(null);
  };

  const handleSyncAccount = async () => {
    if (!userAccount) return;
    await forceCloudSyncNow(userAccount);
  };

  const handlePullCloudData = async () => {
    if (!userAccount) return;
    const syncData = await pullCloudDataToLocal(userAccount);
    if (syncData) {
      if (syncData.userName) {
        setUserName(syncData.userName);
      }
      if (syncData.clockSettings) {
        setClockSettings((prev) => ({ ...DEFAULT_CLOCK_SETTINGS, ...prev, ...syncData.clockSettings }));
      }
      if (syncData.pomodoroSettings) {
        setPomodoroSettings((prev) => ({ ...DEFAULT_POMODORO_SETTINGS, ...prev, ...syncData.pomodoroSettings }));
      }
      if (syncData.isDarkMode !== undefined) {
        setIsDarkMode(syncData.isDarkMode);
      }
    }
  };

  // Update clock settings
  const handleUpdateClockSettings = (updated: Partial<ClockSettings>) => {
    setClockSettings((prev) => {
      const next = { ...prev, ...updated };
      try {
        localStorage.setItem(STORAGE_KEYS.CLOCK_SETTINGS, JSON.stringify(next));
      } catch (e) {
        console.debug('Failed to save clock settings', e);
      }
      triggerAutoCloudSync();
      return next;
    });
  };

  // Update pomodoro settings
  const handleUpdatePomodoroSettings = (updated: Partial<PomodoroSettings>) => {
    setPomodoroSettings((prev) => {
      const next = { ...prev, ...updated };
      try {
        localStorage.setItem(STORAGE_KEYS.POMODORO_SETTINGS, JSON.stringify(next));
      } catch (e) {
        console.debug('Failed to save pomodoro settings', e);
      }
      triggerAutoCloudSync();
      return next;
    });
  };

  // Reset settings to defaults
  const handleResetDefaults = () => {
    setClockSettings(DEFAULT_CLOCK_SETTINGS);
    setPomodoroSettings(DEFAULT_POMODORO_SETTINGS);
    setIsDarkMode(false);
    try {
      localStorage.setItem(STORAGE_KEYS.CLOCK_SETTINGS, JSON.stringify(DEFAULT_CLOCK_SETTINGS));
      localStorage.setItem(
        STORAGE_KEYS.POMODORO_SETTINGS,
        JSON.stringify(DEFAULT_POMODORO_SETTINGS)
      );
      localStorage.setItem(STORAGE_KEYS.DARK_MODE, 'false');
    } catch (e) {
      console.debug('Failed to reset settings in localStorage', e);
    }
  };

  // Global Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        document.activeElement?.tagName === 'INPUT' ||
        document.activeElement?.tagName === 'TEXTAREA'
      ) {
        return;
      }

      // 1. Context-Aware Shortcuts Sheet: Trigger on '?', '\', or '/'
      if (e.key === '?' || e.key === '\\' || e.key === '/') {
        e.preventDefault();
        setIsShortcutsOpen((prev) => !prev);
        return;
      }

      // 2. Escape: Dismiss top modal or return to Welcome Screen
      if (e.key === 'Escape') {
        if (isShortcutsOpen) {
          setIsShortcutsOpen(false);
          return;
        }
        if (isAccountModalOpen && (userName || userAccount)) {
          setIsAccountModalOpen(false);
          return;
        }
        if (isPartyModalOpen) {
          setIsPartyModalOpen(false);
        } else if (isSettingsOpen) {
          setIsSettingsOpen(false);
        } else if (isNameModalOpen && userName) {
          setIsNameModalOpen(false);
        } else if (currentView !== 'welcome') {
          setCurrentView('welcome');
        }
        return;
      }

      // If shortcuts sheet is open, do not execute other view hotkeys
      if (isShortcutsOpen) return;

      // 3. Settings modal toggle
      if (e.key.toLowerCase() === 's' && !e.ctrlKey && !e.metaKey) {
        if (!isSettingsOpen) {
          handleOpenSettings(currentView === 'pomodoro' ? 'pomodoro' : 'clock');
        } else {
          setIsSettingsOpen(false);
        }
        return;
      }

      // 4. Study party modal toggle
      if (e.key.toLowerCase() === 'p' && !e.ctrlKey && !e.metaKey) {
        setIsPartyModalOpen((prev) => !prev);
        return;
      }

      // 5. Dark mode toggle
      if (e.key.toLowerCase() === 'd' && !e.ctrlKey && !e.metaKey) {
        handleToggleDarkMode();
        return;
      }

      // 6. Fullscreen toggle with F11 (prevent browser default to ensure unified Fullscreen API handling)
      if (e.key === 'F11') {
        e.preventDefault();
        handleToggleFullscreen();
        return;
      }

      // 7. Intro Reveal replay
      if (e.key.toLowerCase() === 'i' && !e.ctrlKey && !e.metaKey && currentView === 'welcome') {
        setShowStartupReveal(true);
        return;
      }

      // 8. Direct view navigation hotkeys
      if (!isSettingsOpen && !isPartyModalOpen && !isNameModalOpen) {
        if (currentView === 'welcome') {
          if (e.key === '1' || e.key.toLowerCase() === 'c') setCurrentView('clock');
          else if (e.key === '2' || e.key.toLowerCase() === 't') setCurrentView('pomodoro');
          else if (e.key === '3' || e.key.toLowerCase() === 'k') setCurrentView('tasks');
          else if (e.key === '4' || e.key.toLowerCase() === 'a') setCurrentView('stats');
        } else if (currentView === 'clock') {
          // Clock view: switch to Pomodoro
          if (e.key.toLowerCase() === 't') setCurrentView('pomodoro');
        } else if (currentView === 'pomodoro') {
          // Pomodoro view: switch to Clock
          if (e.key.toLowerCase() === 'c') setCurrentView('clock');
        } else if (currentView === 'tasks') {
          // Tasks view: switch to Stats
          if (e.key.toLowerCase() === 'a') setCurrentView('stats');
        } else if (currentView === 'stats') {
          // Stats view: switch to Tasks
          if (e.key.toLowerCase() === 't') setCurrentView('tasks');
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isShortcutsOpen, isPartyModalOpen, isSettingsOpen, isNameModalOpen, userName, currentView]);

  // For mobile user only, allow scrolling even in full screen!
  const canScroll =
    deviceMode === 'mobile' || (!isFullscreen && clockSettings.enableScrolling !== false);

  return (
    <div
      id="dek-app"
      className={`relative w-full select-none overflow-x-hidden ${
        canScroll ? 'min-h-screen overflow-y-auto' : 'h-screen overflow-hidden'
      } transition-colors duration-500 ${
        isDarkMode ? 'dark bg-neutral-950 text-neutral-100' : 'bg-[#f7f5f0] text-neutral-900'
      }`}
    >
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={currentView}
          initial={{ opacity: 0, scale: 0.99, y: 4 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 1.008, y: -4 }}
          transition={{ duration: 0.38, ease: [0.16, 1, 0.3, 1] }}
          className={`w-full ${canScroll ? 'min-h-screen flex flex-col' : 'h-full flex flex-col overflow-hidden'}`}
        >
          {/* 1. Welcome Screen */}
          {currentView === 'welcome' && (
            <WelcomeScreen
              userName={userName || 'Friend'}
              userAccount={userAccount}
              onOpenAccountModal={() => handleOpenAccountModal('create', false)}
              onSelectMode={(mode) => setCurrentView(mode)}
              onOpenSettings={() => handleOpenSettings()}
              onOpenParties={handleOpenParties}
              onOpenNameModal={() => setIsNameModalOpen(true)}
              onOpenShortcuts={() => setIsShortcutsOpen(true)}
              clockSettings={clockSettings}
              pomodoroSettings={pomodoroSettings}
              pomodoroTimer={pomodoroTimer}
              isDarkMode={isDarkMode}
              onToggleDarkMode={handleToggleDarkMode}
              deviceMode={deviceMode}
              onToggleDeviceMode={handleSelectDeviceMode}
            />
          )}

          {/* 2. Desk Clock View */}
          {currentView === 'clock' && (
            <ClockView
              settings={clockSettings}
              onUpdateSettings={handleUpdateClockSettings}
              onOpenSettings={() => handleOpenSettings('clock')}
              onOpenParties={() => handleOpenParties('my-parties')}
              onOpenShortcuts={() => setIsShortcutsOpen(true)}
              onGoToWelcome={() => setCurrentView('welcome')}
              onGoToPomodoro={() => setCurrentView('pomodoro')}
              onGoToTasks={() => setCurrentView('tasks')}
              onGoToStats={() => setCurrentView('stats')}
              userName={userName || 'Friend'}
              pomodoroTimer={pomodoroTimer}
              isDarkMode={isDarkMode}
              onToggleDarkMode={handleToggleDarkMode}
              deviceMode={deviceMode}
              onToggleDeviceMode={handleSelectDeviceMode}
            />
          )}

          {/* 3. Pomodoro Timer View */}
          {currentView === 'pomodoro' && (
            <PomodoroView
              settings={pomodoroSettings}
              clockSettings={clockSettings}
              timer={pomodoroTimer}
              onUpdateSettings={handleUpdatePomodoroSettings}
              onOpenSettings={() => handleOpenSettings('pomodoro')}
              onOpenParties={handleOpenParties}
              onOpenShortcuts={() => setIsShortcutsOpen(true)}
              onGoToClock={() => setCurrentView('clock')}
              onGoToWelcome={() => setCurrentView('welcome')}
              onGoToTasks={() => setCurrentView('tasks')}
              onGoToStats={() => setCurrentView('stats')}
              userName={userName || 'Friend'}
              isDarkMode={isDarkMode}
              onToggleDarkMode={handleToggleDarkMode}
              isFullscreen={isFullscreen}
              onToggleFullscreen={handleToggleFullscreen}
              deviceMode={deviceMode}
              onToggleDeviceMode={handleSelectDeviceMode}
            />
          )}

          {/* 4. Standalone Task Tracker View */}
          {currentView === 'tasks' && (
            <TaskTrackerView
              clockSettings={clockSettings}
              pomodoroSettings={pomodoroSettings}
              onGoToWelcome={() => setCurrentView('welcome')}
              onGoToClock={() => setCurrentView('clock')}
              onGoToPomodoro={() => setCurrentView('pomodoro')}
              onGoToStats={() => setCurrentView('stats')}
              onOpenSettings={() => handleOpenSettings()}
              onOpenParties={handleOpenParties}
              onOpenShortcuts={() => setIsShortcutsOpen(true)}
              userName={userName || 'Friend'}
              isDarkMode={isDarkMode}
              onToggleDarkMode={handleToggleDarkMode}
              deviceMode={deviceMode}
              onToggleDeviceMode={handleSelectDeviceMode}
            />
          )}

          {/* 5. Weekly Progress & Data Visualization View */}
          {currentView === 'stats' && (
            <StatsView
              clockSettings={clockSettings}
              pomodoroSettings={pomodoroSettings}
              onGoToWelcome={() => setCurrentView('welcome')}
              onGoToClock={() => setCurrentView('clock')}
              onGoToPomodoro={() => setCurrentView('pomodoro')}
              onGoToTasks={() => setCurrentView('tasks')}
              onOpenSettings={() => handleOpenSettings()}
              onOpenParties={handleOpenParties}
              onOpenShortcuts={() => setIsShortcutsOpen(true)}
              userName={userName || 'Friend'}
              isDarkMode={isDarkMode}
              onToggleDarkMode={handleToggleDarkMode}
              deviceMode={deviceMode}
              onToggleDeviceMode={handleSelectDeviceMode}
            />
          )}
        </motion.div>
      </AnimatePresence>

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        initialTab={settingsModalTab}
        clockSettings={clockSettings}
        onUpdateClockSettings={handleUpdateClockSettings}
        pomodoroSettings={pomodoroSettings}
        onUpdatePomodoroSettings={handleUpdatePomodoroSettings}
        userName={userName}
        onOpenNameModal={() => setIsNameModalOpen(true)}
        userAccount={userAccount}
        onOpenAccountModal={(mode) => handleOpenAccountModal(mode, true)}
        onSignOutAccount={handleSignOutAccount}
        onSyncAccount={handleSyncAccount}
        onPullCloudData={handlePullCloudData}
        onResetDefaults={handleResetDefaults}
        onReplayIntro={() => {
          setIsSettingsOpen(false);
          setShowStartupReveal(true);
        }}
        isDarkMode={isDarkMode}
        onToggleDarkMode={handleToggleDarkMode}
        deviceMode={deviceMode}
        onToggleDeviceMode={handleSelectDeviceMode}
      />

      {/* Account Modal for First-Time Entry, Settings Flow, and Cloud Sync */}
      <AccountModal
        isOpen={isAccountModalOpen}
        onClose={() => setIsAccountModalOpen(false)}
        canDismiss={Boolean(userName || userAccount)}
        initialMode={accountModalMode}
        currentGuestName={userName}
        isSettingsFlow={isAccountModalSettingsFlow}
        currentDeviceMode={deviceMode}
        onSelectDeviceMode={handleSelectDeviceMode}
        onAccountSuccess={handleAccountSuccess}
        onContinueAsGuest={handleContinueAsGuest}
      />

      {/* Study & Work Party & Leaderboard Modal */}
      <PartyModal
        isOpen={isPartyModalOpen}
        onClose={() => setIsPartyModalOpen(false)}
        userName={userName || 'Focus Pioneer'}
        initialTab={partyModalTab}
        onUpdateUserName={handleSaveName}
        onStartPomodoro={() => {
          setIsPartyModalOpen(false);
          setCurrentView('pomodoro');
        }}
        pomodoroTimer={pomodoroTimer}
      />

      {/* Name Input First-Run / Update Modal */}
      <NameModal
        isOpen={isNameModalOpen}
        currentName={userName}
        onSave={handleSaveName}
        onClose={() => setIsNameModalOpen(false)}
        canDismiss={Boolean(userName)}
      />

      {/* Cinematic Startup Reveal */}
      {showStartupReveal && (
        <StartupReveal
          isDarkMode={isDarkMode}
          onComplete={() => {
            setShowStartupReveal(false);
            try {
              const hasAccount = localStorage.getItem('desk_clock_account_v1');
              const hasVisited =
                localStorage.getItem('desk_clock_visited_v1') ||
                localStorage.getItem(STORAGE_KEYS.USER_NAME);
              if (!hasAccount && !hasVisited) {
                setIsAccountModalOpen(true);
              }
            } catch {
              // ignore
            }
          }}
        />
      )}

      {/* Context-Aware Global Shortcuts Sheet */}
      <ShortcutsSheet
        isOpen={isShortcutsOpen}
        onClose={() => setIsShortcutsOpen(false)}
        currentView={currentView}
        isDarkMode={isDarkMode}
        onSelectMode={(mode) => setCurrentView(mode)}
      />

      {/* Floating Bottom Tip Bar: Fullscreen Recommendation & Quick Toggle (Only shown when not in full screen) */}
      {!isFullscreen && (
        <div
          id="app-fullscreen-tip-bar"
          className={`fixed bottom-3 left-1/2 -translate-x-1/2 z-40 max-w-[94vw] sm:max-w-none px-3.5 sm:px-4 py-1.5 rounded-full text-xs font-medium backdrop-blur-md border shadow-lg flex items-center gap-2.5 select-none transition-all duration-300 pointer-events-auto ${
            (currentView === 'clock' || currentView === 'pomodoro') && isAppIdle
              ? 'opacity-0 pointer-events-none translate-y-2'
              : 'opacity-100 translate-y-0'
          } ${
            isDarkMode
              ? 'bg-neutral-900/90 border-neutral-700/80 text-neutral-300'
              : 'bg-white/95 border-neutral-300 text-neutral-700 shadow-neutral-900/10'
          }`}
        >
          <span className="flex items-center gap-1.5 truncate">
            <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0" />
            <span className="truncate hidden sm:inline">Tip: Use the app in full screen for best experience</span>
            <span className="truncate sm:hidden">Full screen mode</span>
          </span>

          {/* Quick Device Mode Indicator & Switcher */}
          <button
            type="button"
            id="global-device-mode-switch-btn"
            onClick={() => handleSelectDeviceMode(deviceMode === 'mobile' ? 'pc' : 'mobile')}
            className={`flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-[11px] font-mono font-medium border cursor-pointer transition-all ${
              deviceMode === 'mobile'
                ? 'border-sky-500/40 bg-sky-500/15 text-sky-300'
                : 'border-neutral-700 bg-neutral-800/80 text-neutral-300 hover:text-white'
            }`}
            title={`Optimized for ${deviceMode === 'mobile' ? 'Mobile' : 'PC'}. Click to switch.`}
          >
            {deviceMode === 'mobile' ? <Smartphone className="w-3 h-3 text-sky-400" /> : <Laptop className="w-3 h-3 text-amber-400" />}
            <span className="capitalize">{deviceMode}</span>
          </button>

          <button
            id="global-fullscreen-tip-btn"
            onClick={handleToggleFullscreen}
            className={`apple-hover flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-[11px] font-bold border cursor-pointer transition-colors shrink-0 ${
              isDarkMode
                ? 'border-amber-500/40 bg-amber-500/15 text-amber-300 hover:bg-amber-500/25'
                : 'border-amber-400 bg-amber-50 text-amber-800 hover:bg-amber-100'
            }`}
            title="Enter Full Screen (Press F11)"
          >
            <Maximize2 className="w-3 h-3" />
            <span>Full Screen</span>
            <kbd className="text-[9px] font-mono px-1 py-0.2 rounded border border-current opacity-70 ml-0.5">F11</kbd>
          </button>
        </div>
      )}
    </div>
  );
}
