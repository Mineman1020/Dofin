import React, { useState, useEffect } from 'react';
import { ViewMode, ClockSettings, PomodoroSettings } from './types';
import {
  DEFAULT_CLOCK_SETTINGS,
  DEFAULT_POMODORO_SETTINGS,
} from './utils/constants';
import { WelcomeScreen } from './components/WelcomeScreen';
import { ClockView } from './components/ClockView';
import { PomodoroView } from './components/PomodoroView';
import { SettingsModal } from './components/SettingsModal';
import { NameModal } from './components/NameModal';

const STORAGE_KEYS = {
  USER_NAME: 'desk_clock_user_name',
  CLOCK_SETTINGS: 'desk_clock_settings_v1',
  POMODORO_SETTINGS: 'desk_clock_pomodoro_v1',
  DARK_MODE: 'desk_clock_dark_mode_v1',
};

export default function App() {
  // User name state
  const [userName, setUserName] = useState<string>(() => {
    try {
      return localStorage.getItem(STORAGE_KEYS.USER_NAME) || '';
    } catch {
      return '';
    }
  });

  const [isNameModalOpen, setIsNameModalOpen] = useState<boolean>(() => {
    try {
      return !localStorage.getItem(STORAGE_KEYS.USER_NAME);
    } catch {
      return true;
    }
  });

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

  // Toggle Dark Mode
  const handleToggleDarkMode = () => {
    setIsDarkMode((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(STORAGE_KEYS.DARK_MODE, String(next));
      } catch (e) {
        console.debug('Failed to save dark mode preference:', e);
      }
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

      if (e.key === 'Escape') {
        if (isSettingsOpen) {
          setIsSettingsOpen(false);
        } else if (isNameModalOpen && userName) {
          setIsNameModalOpen(false);
        } else if (currentView !== 'welcome') {
          setCurrentView('welcome');
        }
      } else if (e.key.toLowerCase() === 's' && !e.ctrlKey && !e.metaKey) {
        setIsSettingsOpen((prev) => !prev);
      } else if (e.key.toLowerCase() === 'd' && !e.ctrlKey && !e.metaKey) {
        handleToggleDarkMode();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isSettingsOpen, isNameModalOpen, userName, currentView]);

  return (
    <div
      id="desk-station-app"
      className={`relative w-full h-full min-h-screen select-none overflow-hidden transition-colors duration-500 ${
        isDarkMode ? 'dark bg-neutral-950 text-neutral-100' : 'bg-[#f7f5f0] text-neutral-900'
      }`}
    >
      {/* 1. Welcome Screen */}
      {currentView === 'welcome' && (
        <WelcomeScreen
          userName={userName || 'Friend'}
          onSelectMode={(mode) => setCurrentView(mode)}
          onOpenSettings={() => setIsSettingsOpen(true)}
          onOpenNameModal={() => setIsNameModalOpen(true)}
          clockSettings={clockSettings}
          pomodoroSettings={pomodoroSettings}
          isDarkMode={isDarkMode}
          onToggleDarkMode={handleToggleDarkMode}
        />
      )}

      {/* 2. Desk Clock View */}
      {currentView === 'clock' && (
        <ClockView
          settings={clockSettings}
          onOpenSettings={() => setIsSettingsOpen(true)}
          onGoToWelcome={() => setCurrentView('welcome')}
          onGoToPomodoro={() => setCurrentView('pomodoro')}
          userName={userName || 'Friend'}
          isDarkMode={isDarkMode}
          onToggleDarkMode={handleToggleDarkMode}
        />
      )}

      {/* 3. Pomodoro Timer View */}
      {currentView === 'pomodoro' && (
        <PomodoroView
          settings={pomodoroSettings}
          clockSettings={clockSettings}
          onOpenSettings={() => setIsSettingsOpen(true)}
          onGoToClock={() => setCurrentView('clock')}
          onGoToWelcome={() => setCurrentView('welcome')}
          userName={userName || 'Friend'}
          isDarkMode={isDarkMode}
          onToggleDarkMode={handleToggleDarkMode}
        />
      )}

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        clockSettings={clockSettings}
        onUpdateClockSettings={handleUpdateClockSettings}
        pomodoroSettings={pomodoroSettings}
        onUpdatePomodoroSettings={handleUpdatePomodoroSettings}
        userName={userName}
        onOpenNameModal={() => setIsNameModalOpen(true)}
        onResetDefaults={handleResetDefaults}
        isDarkMode={isDarkMode}
        onToggleDarkMode={handleToggleDarkMode}
      />

      {/* Name Input First-Run / Update Modal */}
      <NameModal
        isOpen={isNameModalOpen}
        currentName={userName}
        onSave={handleSaveName}
        onClose={() => setIsNameModalOpen(false)}
        canDismiss={Boolean(userName)}
      />
    </div>
  );
}
