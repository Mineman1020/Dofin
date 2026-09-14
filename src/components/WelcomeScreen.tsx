import React, { useState, useEffect } from 'react';
import {
  Clock,
  Timer,
  Settings,
  Sun,
  Moon,
  Sunset,
  ArrowRight,
  User,
  Calendar,
} from 'lucide-react';
import { ClockSettings, PomodoroSettings } from '../types';
import { THEME_PRESETS, FONT_OPTIONS } from '../utils/constants';

interface WelcomeScreenProps {
  userName: string;
  onSelectMode: (mode: 'clock' | 'pomodoro') => void;
  onOpenSettings: () => void;
  onOpenNameModal: () => void;
  clockSettings: ClockSettings;
  pomodoroSettings: PomodoroSettings;
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
}

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({
  userName,
  onSelectMode,
  onOpenSettings,
  onOpenNameModal,
  clockSettings,
  pomodoroSettings,
  isDarkMode,
  onToggleDarkMode,
}) => {
  const [currentTime, setCurrentTime] = useState<Date>(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Time of day greeting
  const hours = currentTime.getHours();
  let greeting = 'Good morning';
  let GreetingIcon = Sun;
  let iconColor = 'text-amber-500';

  if (hours >= 12 && hours < 17) {
    greeting = 'Good afternoon';
    GreetingIcon = Sun;
    iconColor = 'text-amber-500';
  } else if (hours >= 17 && hours < 21) {
    greeting = 'Good evening';
    GreetingIcon = Sunset;
    iconColor = 'text-rose-400';
  } else if (hours >= 21 || hours < 5) {
    greeting = 'Good night';
    GreetingIcon = Moon;
    iconColor = 'text-indigo-400';
  }

  // Format live mini clock for preview
  const rawH = currentTime.getHours();
  const displayH = clockSettings.timeFormat === '12h' ? rawH % 12 || 12 : rawH;
  const displayM = String(currentTime.getMinutes()).padStart(2, '0');
  const displayS = String(currentTime.getSeconds()).padStart(2, '0');
  const ampm = clockSettings.timeFormat === '12h' ? (rawH >= 12 ? 'PM' : 'AM') : '';

  const activeTheme =
    THEME_PRESETS.find((t) => t.id === clockSettings.themeId) || THEME_PRESETS[0];
  const selectedFont =
    FONT_OPTIONS.find((f) => f.id === clockSettings.fontFamily) || FONT_OPTIONS[0];

  const dateOptions: Intl.DateTimeFormatOptions = {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  };
  const formattedDate = currentTime.toLocaleDateString('en-US', dateOptions);

  return (
    <div
      id="welcome-screen-container"
      className={`relative min-h-screen w-full flex flex-col justify-between overflow-x-hidden overflow-y-auto transition-colors duration-500 ${
        isDarkMode ? 'bg-neutral-950 text-neutral-100' : 'bg-[#f7f5f0] text-neutral-900'
      }`}
    >
      {/* Ambient background glow */}
      <div
        className={`absolute top-0 left-1/4 w-[600px] h-[350px] rounded-full blur-[160px] pointer-events-none ${
          isDarkMode ? 'bg-amber-500/10' : 'bg-amber-500/5'
        }`}
      />
      <div
        className={`absolute bottom-0 right-1/4 w-[600px] h-[350px] rounded-full blur-[160px] pointer-events-none ${
          isDarkMode ? 'bg-sky-500/10' : 'bg-sky-500/5'
        }`}
      />

      {/* Top Navbar - Full screen edge-to-edge width */}
      <header
        id="welcome-navbar"
        className={`w-full px-6 sm:px-10 lg:px-16 py-4 sm:py-5 flex items-center justify-between z-20 border-b transition-colors ${
          isDarkMode
            ? 'border-neutral-900 bg-neutral-950/70'
            : 'border-neutral-200/80 bg-white/70'
        } backdrop-blur-md`}
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 text-neutral-950 flex items-center justify-center font-bold shadow-md shadow-amber-500/20">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base font-bold tracking-tight">Desk Clock</h1>
            <p className="text-xs text-neutral-500">Ambient Clock & Focus Timer</p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          {/* Dark / Light Mode Toggle */}
          <button
            id="welcome-dark-mode-toggle"
            onClick={onToggleDarkMode}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-medium transition-all cursor-pointer shadow-sm ${
              isDarkMode
                ? 'border-neutral-800 bg-neutral-900/80 hover:bg-neutral-800 text-neutral-200'
                : 'border-neutral-300/80 bg-white hover:bg-neutral-50 text-neutral-800'
            }`}
            title={`Switch to ${isDarkMode ? 'Light' : 'Dark'} Mode`}
          >
            {isDarkMode ? (
              <>
                <Sun className="w-3.5 h-3.5 text-amber-400" />
                <span className="hidden sm:inline">Light</span>
              </>
            ) : (
              <>
                <Moon className="w-3.5 h-3.5 text-sky-500" />
                <span className="hidden sm:inline">Dark</span>
              </>
            )}
          </button>

          {/* User profile pill */}
          <button
            id="welcome-user-profile-btn"
            onClick={onOpenNameModal}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs transition-all cursor-pointer shadow-sm ${
              isDarkMode
                ? 'border-neutral-800 bg-neutral-900/80 hover:bg-neutral-800 text-neutral-300 hover:text-white'
                : 'border-neutral-300/80 bg-white hover:bg-neutral-50 text-neutral-800'
            }`}
            title="Click to change your name"
          >
            <User className="w-3.5 h-3.5 text-amber-500" />
            <span className="font-medium truncate max-w-[140px]">{userName}</span>
            <span className="text-[10px] text-neutral-400 underline ml-1">Edit</span>
          </button>

          {/* Settings button */}
          <button
            id="welcome-settings-btn"
            onClick={onOpenSettings}
            className={`p-2 rounded-xl border text-xs transition-colors cursor-pointer ${
              isDarkMode
                ? 'border-neutral-800 bg-neutral-900/80 hover:bg-neutral-800 text-neutral-400 hover:text-white'
                : 'border-neutral-300/80 bg-white hover:bg-neutral-50 text-neutral-700 hover:text-black'
            }`}
            title="Open Display Settings"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Hero Welcome Banner */}
      <main className="w-full max-w-7xl mx-auto px-6 sm:px-10 lg:px-16 py-8 sm:py-12 flex-1 flex flex-col justify-center z-10">
        <div className="text-center space-y-3 mb-8 sm:mb-12">
          <div
            className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full border text-xs ${
              isDarkMode
                ? 'bg-neutral-900/80 border-neutral-800 text-neutral-400'
                : 'bg-white border-neutral-300 text-neutral-600 shadow-sm'
            }`}
          >
            <Calendar className="w-3.5 h-3.5 text-amber-500" />
            <span>{formattedDate}</span>
          </div>

          <div className="flex items-center justify-center gap-3">
            <GreetingIcon className={`w-8 h-8 sm:w-10 sm:h-10 ${iconColor}`} />
            <h2 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight">
              {greeting},{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-500 to-amber-600 dark:from-amber-400 dark:to-amber-200">
                {userName}
              </span>
            </h2>
          </div>

          <p className="text-sm sm:text-lg text-neutral-500 dark:text-neutral-400 max-w-xl mx-auto font-light leading-relaxed">
            Choose your mode below to get started.
          </p>
        </div>

        {/* The Two Main Option Cards: 1. Clock & 2. Pomodoro (Expansive Full Width) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12 w-full max-w-6xl mx-auto">
          {/* OPTION 1: DESK CLOCK */}
          <div
            id="welcome-clock-card"
            onClick={() => onSelectMode('clock')}
            className={`group relative rounded-3xl p-8 sm:p-10 flex flex-col justify-between transition-all duration-300 cursor-pointer shadow-2xl hover:-translate-y-1.5 overflow-hidden border min-h-[440px] sm:min-h-[470px] ${
              isDarkMode
                ? 'bg-neutral-900/70 hover:bg-neutral-900/95 border-neutral-800 hover:border-amber-500/60 hover:shadow-amber-500/15'
                : 'bg-white hover:bg-neutral-50/95 border-neutral-200/90 hover:border-amber-500/60 hover:shadow-amber-500/15'
            }`}
          >
            <div className="absolute top-0 right-0 w-44 h-44 bg-amber-500/10 rounded-full blur-3xl group-hover:bg-amber-500/25 transition-all pointer-events-none" />

            <div>
              <div className="flex items-center justify-between mb-5">
                <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-500 dark:text-amber-400 flex items-center justify-center transition-transform group-hover:scale-105">
                  <Clock className="w-7 h-7 sm:w-8 sm:h-8" />
                </div>
                <span
                  className={`text-xs font-mono font-bold px-3 py-1.5 rounded-full border ${
                    isDarkMode
                      ? 'bg-neutral-800 text-neutral-300 border-neutral-700'
                      : 'bg-neutral-100 text-neutral-700 border-neutral-300'
                  }`}
                >
                  Option 1
                </span>
              </div>

              <h3 className="text-2xl sm:text-3xl font-extrabold mb-3 group-hover:text-amber-600 dark:group-hover:text-amber-300 transition-colors">
                Desk Clock
              </h3>

              <p className="text-sm text-neutral-500 dark:text-neutral-400 leading-relaxed mb-6">
                Turn your laptop into an ambient, distraction-free desk clock. Fully centered typography, customizable digits, OLED midnight/vintage colors, and hourly chimes.
              </p>

              {/* Mini Preview Box */}
              <div
                className={`p-4 sm:p-5 rounded-2xl border mb-6 flex items-baseline justify-center gap-2 transition-colors ${
                  isDarkMode
                    ? 'border-neutral-800 bg-black/70'
                    : 'border-neutral-200 bg-neutral-100/90 shadow-inner'
                }`}
                style={{ fontFamily: selectedFont.cssFamily }}
              >
                <span className="text-3xl sm:text-4xl font-black tracking-tight">
                  {String(displayH).padStart(2, '0')}:{displayM}
                </span>
                {clockSettings.showSeconds && (
                  <span className="text-lg text-amber-500 dark:text-amber-400 font-bold">:{displayS}</span>
                )}
                {clockSettings.showAmPm && (
                  <span className="text-xs text-neutral-400 ml-1 font-semibold">{ampm}</span>
                )}
              </div>
            </div>

            <div className="pt-3 flex items-center justify-between border-t border-neutral-200/60 dark:border-neutral-800/80">
              <span className="text-xs text-neutral-500 font-mono">
                Font: {selectedFont.name}
              </span>
              <div className="flex items-center gap-2 text-sm font-bold text-amber-500 dark:text-amber-400 group-hover:translate-x-1.5 transition-transform">
                <span>Launch Clock</span>
                <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
            </div>
          </div>

          {/* OPTION 2: POMODORO TIMER */}
          <div
            id="welcome-pomodoro-card"
            onClick={() => onSelectMode('pomodoro')}
            className={`group relative rounded-3xl p-8 sm:p-10 flex flex-col justify-between transition-all duration-300 cursor-pointer shadow-2xl hover:-translate-y-1.5 overflow-hidden border min-h-[440px] sm:min-h-[470px] ${
              isDarkMode
                ? 'bg-neutral-900/70 hover:bg-neutral-900/95 border-neutral-800 hover:border-sky-500/60 hover:shadow-sky-500/15'
                : 'bg-white hover:bg-neutral-50/95 border-neutral-200/90 hover:border-sky-500/60 hover:shadow-sky-500/15'
            }`}
          >
            <div className="absolute top-0 right-0 w-44 h-44 bg-sky-500/10 rounded-full blur-3xl group-hover:bg-sky-500/25 transition-all pointer-events-none" />

            <div>
              <div className="flex items-center justify-between mb-5">
                <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-sky-500/15 border border-sky-500/30 text-sky-500 dark:text-sky-400 flex items-center justify-center transition-transform group-hover:scale-105">
                  <Timer className="w-7 h-7 sm:w-8 sm:h-8" />
                </div>
                <span
                  className={`text-xs font-mono font-bold px-3 py-1.5 rounded-full border ${
                    isDarkMode
                      ? 'bg-neutral-800 text-neutral-300 border-neutral-700'
                      : 'bg-neutral-100 text-neutral-700 border-neutral-300'
                  }`}
                >
                  Option 2
                </span>
              </div>

              <h3 className="text-2xl sm:text-3xl font-extrabold mb-3 group-hover:text-sky-600 dark:group-hover:text-sky-300 transition-colors">
                Pomodoro Focus Timer
              </h3>

              <p className="text-sm text-neutral-500 dark:text-neutral-400 leading-relaxed mb-6">
                Organize work with a task list, interval assignments, custom audio alerts, and restorative breaks to learn things effectively on time.
              </p>

              {/* Mini Preview Box */}
              <div
                className={`p-4 sm:p-5 rounded-2xl border mb-6 flex items-center justify-around text-xs sm:text-sm font-mono ${
                  isDarkMode
                    ? 'border-neutral-800 bg-black/70'
                    : 'border-neutral-200 bg-neutral-100/90 shadow-inner'
                }`}
              >
                <div className="text-center">
                  <span className="text-[11px] text-neutral-500 block">Work</span>
                  <span className="font-bold text-amber-500 dark:text-amber-400 text-sm sm:text-base">
                    {pomodoroSettings.workMinutes}m
                  </span>
                </div>
                <div className="h-5 w-px bg-neutral-300 dark:bg-neutral-800" />
                <div className="text-center">
                  <span className="text-[11px] text-neutral-500 block">Short Break</span>
                  <span className="font-bold text-sky-500 dark:text-sky-400 text-sm sm:text-base">
                    {pomodoroSettings.shortBreakMinutes}m
                  </span>
                </div>
                <div className="h-5 w-px bg-neutral-300 dark:bg-neutral-800" />
                <div className="text-center">
                  <span className="text-[11px] text-neutral-500 block">Long Break</span>
                  <span className="font-bold text-emerald-500 dark:text-emerald-400 text-sm sm:text-base">
                    {pomodoroSettings.longBreakMinutes}m
                  </span>
                </div>
              </div>
            </div>

            <div className="pt-3 flex items-center justify-between border-t border-neutral-200/60 dark:border-neutral-800/80">
              <span className="text-xs text-neutral-500 font-mono">
                Task List & Sound Alerts
              </span>
              <div className="flex items-center gap-2 text-sm font-bold text-sky-500 dark:text-sky-400 group-hover:translate-x-1.5 transition-transform">
                <span>Launch Pomodoro</span>
                <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};
