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
  Users,
  Trophy,
  Plus,
  LogIn,
  Sparkles,
  CheckCircle2,
  Check,
  BarChart3,
  Keyboard,
} from 'lucide-react';
import { ClockSettings, PomodoroSettings, ViewMode } from '../types';
import { THEME_PRESETS, FONT_OPTIONS } from '../utils/constants';

interface WelcomeScreenProps {
  userName: string;
  onSelectMode: (mode: ViewMode) => void;
  onOpenSettings: () => void;
  onOpenNameModal: () => void;
  onOpenParties?: (tab?: 'leaderboard' | 'my-parties' | 'create' | 'join') => void;
  onOpenShortcuts?: () => void;
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
  onOpenParties,
  onOpenShortcuts,
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
        className={`w-full px-4 sm:px-8 lg:px-12 py-2.5 sm:py-3 flex items-center justify-between z-20 border-b transition-colors ${
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
            className={`apple-hover flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-medium cursor-pointer shadow-sm ${
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
            className={`apple-hover flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs cursor-pointer shadow-sm ${
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
            className={`apple-icon-hover p-2 rounded-xl border text-xs cursor-pointer ${
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

      {/* Main Container - Balanced 2x2 Grid with comfortable, clean proportions */}
      <main className="w-full max-w-5xl mx-auto px-4 sm:px-6 py-4 sm:py-6 flex-1 flex flex-col justify-center z-10">
        <div className="text-center space-y-1.5 sm:space-y-2 mb-4 sm:mb-5">
          <div
            className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border text-xs font-medium ${
              isDarkMode
                ? 'bg-neutral-900/80 border-neutral-800 text-neutral-400'
                : 'bg-white border-neutral-300 text-neutral-600 shadow-sm'
            }`}
          >
            <Calendar className="w-3.5 h-3.5 text-amber-500" />
            <span>{formattedDate}</span>
          </div>

          <div className="flex items-center justify-center gap-3">
            <GreetingIcon className={`w-7 h-7 sm:w-9 sm:h-9 ${iconColor}`} />
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight">
              {greeting},{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-500 to-amber-600 dark:from-amber-400 dark:to-amber-200">
                {userName}
              </span>
            </h2>
          </div>

          <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 max-w-xl mx-auto font-light leading-relaxed">
            Choose your mode below to get started.
          </p>
        </div>

        {/* The Four Main Options arranged in a clean, balanced 2x2 Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-4.5 w-full max-w-5xl mx-auto">
          {/* OPTION 1: DESK CLOCK */}
          <div
            id="welcome-clock-card"
            onClick={() => onSelectMode('clock')}
            className={`apple-card-hover group relative rounded-3xl p-5 sm:p-5.5 flex flex-col justify-between cursor-pointer shadow-lg overflow-hidden border min-h-[180px] sm:min-h-[195px] ${
              isDarkMode
                ? 'bg-neutral-900/75 hover:bg-neutral-900/95 border-neutral-800 hover:border-amber-500/60 hover:shadow-amber-500/15'
                : 'bg-white hover:bg-neutral-50/95 border-neutral-200/90 hover:border-amber-500/60 hover:shadow-amber-500/15'
            }`}
          >
            <div className="absolute top-0 right-0 w-36 h-36 bg-amber-500/10 rounded-full blur-2xl group-hover:bg-amber-500/20 transition-all pointer-events-none" />

            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-500 dark:text-amber-400 flex items-center justify-center transition-transform duration-300 group-hover:scale-110 shrink-0">
                    <Clock className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-lg sm:text-xl font-bold group-hover:text-amber-600 dark:group-hover:text-amber-300 transition-colors leading-tight">
                      Desk Clock
                    </h3>
                    <span className="text-xs text-neutral-500 dark:text-neutral-400 block line-clamp-1">
                      Distraction-free ambient clock & curated typography
                    </span>
                  </div>
                </div>
                <span
                  className={`text-xs font-mono font-bold px-2.5 py-1 rounded-full border shrink-0 ${
                    isDarkMode
                      ? 'bg-neutral-800 text-neutral-300 border-neutral-700'
                      : 'bg-neutral-100 text-neutral-700 border-neutral-300'
                  }`}
                >
                  Option 1
                </span>
              </div>

              {/* Clean Preview Box */}
              <div
                className={`py-2 px-3.5 rounded-2xl border mb-3 flex items-baseline justify-center gap-1.5 transition-colors ${
                  isDarkMode
                    ? 'border-neutral-800 bg-black/60'
                    : 'border-neutral-200 bg-neutral-100/85'
                }`}
                style={{ fontFamily: selectedFont.cssFamily }}
              >
                <span className="text-2xl sm:text-3xl font-black tracking-tight leading-none">
                  {String(displayH).padStart(2, '0')}:{displayM}
                </span>
                {clockSettings.showSeconds && (
                  <span className="text-sm text-amber-500 dark:text-amber-400 font-bold leading-none">:{displayS}</span>
                )}
                {clockSettings.showAmPm && (
                  <span className="text-xs text-neutral-400 ml-1.5 font-semibold leading-none">{ampm}</span>
                )}
              </div>
            </div>

            <div className="pt-2.5 flex items-center justify-between border-t border-neutral-200/60 dark:border-neutral-800/70">
              <span className="text-xs text-neutral-500 font-mono truncate max-w-[140px]">
                {selectedFont.name}
              </span>
              <div className="flex items-center gap-1.5 text-xs sm:text-sm font-bold text-amber-500 dark:text-amber-400 group-hover:translate-x-1.5 transition-transform">
                <span>Launch Clock</span>
                <ArrowRight className="w-4 h-4" />
              </div>
            </div>
          </div>

          {/* OPTION 2: POMODORO TIMER */}
          <div
            id="welcome-pomodoro-card"
            onClick={() => onSelectMode('pomodoro')}
            className={`apple-card-hover group relative rounded-3xl p-5 sm:p-5.5 flex flex-col justify-between cursor-pointer shadow-lg overflow-hidden border min-h-[180px] sm:min-h-[195px] ${
              isDarkMode
                ? 'bg-neutral-900/75 hover:bg-neutral-900/95 border-neutral-800 hover:border-sky-500/60 hover:shadow-sky-500/15'
                : 'bg-white hover:bg-neutral-50/95 border-neutral-200/90 hover:border-sky-500/60 hover:shadow-sky-500/15'
            }`}
          >
            <div className="absolute top-0 right-0 w-36 h-36 bg-sky-500/10 rounded-full blur-2xl group-hover:bg-sky-500/20 transition-all pointer-events-none" />

            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-sky-500/15 border border-sky-500/30 text-sky-500 dark:text-sky-400 flex items-center justify-center transition-transform duration-300 group-hover:scale-110 shrink-0">
                    <Timer className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-lg sm:text-xl font-bold group-hover:text-sky-600 dark:group-hover:text-sky-300 transition-colors leading-tight">
                      Pomodoro Focus
                    </h3>
                    <span className="text-xs text-neutral-500 dark:text-neutral-400 block line-clamp-1">
                      Timed work intervals, breaks & alerts
                    </span>
                  </div>
                </div>
                <span
                  className={`text-xs font-mono font-bold px-2.5 py-1 rounded-full border shrink-0 ${
                    isDarkMode
                      ? 'bg-neutral-800 text-neutral-300 border-neutral-700'
                      : 'bg-neutral-100 text-neutral-700 border-neutral-300'
                  }`}
                >
                  Option 2
                </span>
              </div>

              {/* Clean Preview Box */}
              <div
                className={`py-2 px-3.5 rounded-2xl border mb-3 flex items-center justify-around text-xs font-mono transition-colors ${
                  isDarkMode
                    ? 'border-neutral-800 bg-black/60'
                    : 'border-neutral-200 bg-neutral-100/85'
                }`}
              >
                <div className="flex items-center gap-1.5">
                  <span className="text-xs text-neutral-400">Work</span>
                  <span className="font-bold text-amber-500 dark:text-amber-400 text-sm sm:text-base">
                    {pomodoroSettings.workMinutes}m
                  </span>
                </div>
                <div className="h-4 w-px bg-neutral-300 dark:bg-neutral-800" />
                <div className="flex items-center gap-1.5">
                  <span className="text-xs text-neutral-400">Short</span>
                  <span className="font-bold text-sky-500 dark:text-sky-400 text-sm sm:text-base">
                    {pomodoroSettings.shortBreakMinutes}m
                  </span>
                </div>
                <div className="h-4 w-px bg-neutral-300 dark:bg-neutral-800" />
                <div className="flex items-center gap-1.5">
                  <span className="text-xs text-neutral-400">Long</span>
                  <span className="font-bold text-emerald-500 dark:text-emerald-400 text-sm sm:text-base">
                    {pomodoroSettings.longBreakMinutes}m
                  </span>
                </div>
              </div>
            </div>

            <div className="pt-2.5 flex items-center justify-between border-t border-neutral-200/60 dark:border-neutral-800/70">
              <span className="text-xs text-neutral-500 font-mono truncate max-w-[140px]">
                Interval Engine
              </span>
              <div className="flex items-center gap-1.5 text-xs sm:text-sm font-bold text-sky-500 dark:text-sky-400 group-hover:translate-x-1.5 transition-transform">
                <span>Launch Timer</span>
                <ArrowRight className="w-4 h-4" />
              </div>
            </div>
          </div>

          {/* OPTION 3: TASK TRACKER */}
          <div
            id="welcome-task-tracker-card"
            onClick={() => onSelectMode('tasks')}
            className={`apple-card-hover group relative rounded-3xl p-5 sm:p-5.5 flex flex-col justify-between cursor-pointer shadow-lg overflow-hidden border min-h-[180px] sm:min-h-[195px] ${
              isDarkMode
                ? 'bg-neutral-900/75 hover:bg-neutral-900/95 border-neutral-800 hover:border-emerald-500/60 hover:shadow-emerald-500/15'
                : 'bg-white hover:bg-neutral-50/95 border-neutral-200/90 hover:border-emerald-500/60 hover:shadow-emerald-500/15'
            }`}
          >
            <div className="absolute top-0 right-0 w-36 h-36 bg-emerald-500/10 rounded-full blur-2xl group-hover:bg-emerald-500/20 transition-all pointer-events-none" />

            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-500 dark:text-emerald-400 flex items-center justify-center transition-transform duration-300 group-hover:scale-110 shrink-0">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-lg sm:text-xl font-bold group-hover:text-emerald-600 dark:group-hover:text-emerald-300 transition-colors leading-tight">
                      Task Tracker
                    </h3>
                    <span className="text-xs text-neutral-500 dark:text-neutral-400 block line-clamp-1">
                      Standalone to-dos, priorities & projects
                    </span>
                  </div>
                </div>
                <span
                  className={`text-xs font-mono font-bold px-2.5 py-1 rounded-full border shrink-0 ${
                    isDarkMode
                      ? 'bg-neutral-800 text-emerald-400 border-neutral-700'
                      : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  }`}
                >
                  Option 3
                </span>
              </div>

              {/* Clean Preview Box */}
              <div
                className={`py-2 px-3.5 rounded-2xl border mb-3 flex items-center justify-between gap-3 text-xs transition-colors ${
                  isDarkMode
                    ? 'border-neutral-800 bg-black/60'
                    : 'border-neutral-200 bg-neutral-100/85'
                }`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-4 h-4 rounded bg-emerald-500 text-neutral-950 flex items-center justify-center shrink-0">
                    <Check className="w-3 h-3 stroke-[3]" />
                  </div>
                  <span className="line-through text-neutral-400 text-xs truncate">Research assignment</span>
                </div>
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-4 h-4 rounded border border-neutral-400 dark:border-neutral-600 shrink-0" />
                  <span className="text-xs font-medium truncate">Submit presentation</span>
                </div>
              </div>
            </div>

            <div className="pt-2.5 flex items-center justify-between border-t border-neutral-200/60 dark:border-neutral-800/70">
              <span className="text-xs text-emerald-500 font-mono font-semibold">
                Tasks Only
              </span>
              <div className="flex items-center gap-1.5 text-xs sm:text-sm font-bold text-emerald-500 dark:text-emerald-400 group-hover:translate-x-1.5 transition-transform">
                <span>Open Tracker</span>
                <ArrowRight className="w-4 h-4" />
              </div>
            </div>
          </div>

          {/* OPTION 4: WEEKLY STATS */}
          <div
            id="welcome-stats-card"
            onClick={() => onSelectMode('stats')}
            className={`apple-card-hover group relative rounded-3xl p-5 sm:p-5.5 flex flex-col justify-between cursor-pointer shadow-lg overflow-hidden border min-h-[180px] sm:min-h-[195px] ${
              isDarkMode
                ? 'bg-neutral-900/75 hover:bg-neutral-900/95 border-neutral-800 hover:border-violet-500/60 hover:shadow-violet-500/15'
                : 'bg-white hover:bg-neutral-50/95 border-neutral-200/90 hover:border-violet-500/60 hover:shadow-violet-500/15'
            }`}
          >
            <div className="absolute top-0 right-0 w-36 h-36 bg-violet-500/10 rounded-full blur-2xl group-hover:bg-violet-500/20 transition-all pointer-events-none" />

            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-violet-500/15 border border-violet-500/30 text-violet-500 dark:text-violet-400 flex items-center justify-center transition-transform duration-300 group-hover:scale-110 shrink-0">
                    <BarChart3 className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-lg sm:text-xl font-bold group-hover:text-violet-600 dark:group-hover:text-violet-300 transition-colors leading-tight">
                      Weekly Stats
                    </h3>
                    <span className="text-xs text-neutral-500 dark:text-neutral-400 block line-clamp-1">
                      Daily velocity, focus time & charts
                    </span>
                  </div>
                </div>
                <span
                  className={`text-xs font-mono font-bold px-2.5 py-1 rounded-full border shrink-0 ${
                    isDarkMode
                      ? 'bg-neutral-800 text-violet-400 border-neutral-700'
                      : 'bg-violet-50 text-violet-700 border-violet-200'
                  }`}
                >
                  Option 4
                </span>
              </div>

              {/* Clean Preview Box */}
              <div
                className={`py-2 px-3.5 rounded-2xl border mb-3 flex items-center justify-between transition-colors ${
                  isDarkMode
                    ? 'border-neutral-800 bg-black/60'
                    : 'border-neutral-200 bg-neutral-100/85'
                }`}
              >
                <span className="text-xs text-neutral-400 font-mono">Velocity</span>
                <div className="flex items-end gap-2 h-6 px-1">
                  {[
                    { day: 'M', h: '40%' },
                    { day: 'T', h: '65%' },
                    { day: 'W', h: '85%' },
                    { day: 'T', h: '50%' },
                    { day: 'F', h: '100%' },
                    { day: 'S', h: '70%' },
                    { day: 'S', h: '45%' },
                  ].map((bar, i) => (
                    <div key={i} className="flex flex-col items-center h-full justify-end">
                      <div
                        className="w-2 rounded-t bg-gradient-to-t from-violet-600 to-violet-400"
                        style={{ height: bar.h }}
                      />
                    </div>
                  ))}
                </div>
                <span className="text-xs text-violet-500 dark:text-violet-400 font-semibold font-mono">Recharts</span>
              </div>
            </div>

            <div className="pt-2.5 flex items-center justify-between border-t border-neutral-200/60 dark:border-neutral-800/70">
              <span className="text-xs text-violet-500 font-mono font-semibold">
                Interactive Charts
              </span>
              <div className="flex items-center gap-1.5 text-xs sm:text-sm font-bold text-violet-500 dark:text-violet-400 group-hover:translate-x-1.5 transition-transform">
                <span>Open Stats</span>
                <ArrowRight className="w-4 h-4" />
              </div>
            </div>
          </div>
        </div>

        {/* Study & Work Party Hub Bar - Balanced and clearly visible below the 2x2 grid */}
        {onOpenParties && (
          <div
            id="welcome-party-hub-compact"
            className={`w-full max-w-5xl mx-auto mt-4 sm:mt-5 p-3 sm:p-3.5 rounded-2xl border flex flex-col sm:flex-row items-center justify-between gap-3 text-xs ${
              isDarkMode
                ? 'bg-neutral-900/70 border-neutral-800 text-neutral-300'
                : 'bg-white/95 border-neutral-200 text-neutral-700 shadow-sm'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-500 flex items-center justify-center shrink-0">
                <Users className="w-4 h-4" />
              </div>
              <span className="font-semibold text-neutral-900 dark:text-white text-xs sm:text-sm">Study & Work Parties</span>
              <span className="hidden md:inline text-neutral-500 dark:text-neutral-400 text-xs">
                — Focus rooms with friends & live leaderboard
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                id="welcome-create-party-pill"
                onClick={() => onOpenParties('create')}
                className={`apple-hover px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 cursor-pointer ${
                  isDarkMode
                    ? 'border-neutral-700 bg-neutral-800 hover:bg-neutral-700 text-neutral-200'
                    : 'border-neutral-300 bg-neutral-100 hover:bg-neutral-200 text-neutral-800'
                }`}
              >
                <Plus className="w-3.5 h-3.5 text-amber-500" />
                <span>Create</span>
              </button>
              <button
                id="welcome-join-party-pill"
                onClick={() => onOpenParties('join')}
                className={`apple-hover px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 cursor-pointer ${
                  isDarkMode
                    ? 'border-sky-500/40 bg-sky-500/10 hover:bg-sky-500/20 text-sky-300'
                    : 'border-sky-300 bg-sky-50 hover:bg-sky-100 text-sky-800'
                }`}
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Join</span>
              </button>
              <button
                id="welcome-my-parties-pill"
                onClick={() => onOpenParties('my-parties')}
                className={`apple-hover px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 cursor-pointer ${
                  isDarkMode
                    ? 'border-neutral-700 bg-neutral-800 hover:bg-neutral-700 text-neutral-200'
                    : 'border-neutral-300 bg-neutral-100 hover:bg-neutral-200 text-neutral-800'
                }`}
              >
                <Trophy className="w-3.5 h-3.5 text-amber-400" />
                <span>Rooms</span>
              </button>
            </div>
          </div>
        )}

        {/* Subtle Keyboard Shortcuts Hint below parties tile */}
        <div className="w-full text-center mt-3 sm:mt-4 pb-1">
          <button
            id="welcome-shortcuts-hint-btn"
            type="button"
            onClick={onOpenShortcuts}
            className="inline-flex items-center gap-1.5 text-[11px] sm:text-xs text-neutral-400 hover:text-neutral-700 dark:text-neutral-500 dark:hover:text-neutral-300 transition-colors cursor-pointer group py-1 px-3 rounded-full hover:bg-neutral-200/50 dark:hover:bg-neutral-800/60"
            title="Open Keyboard Shortcuts Guide (? or \)"
          >
            <Keyboard className="w-3.5 h-3.5 opacity-60 group-hover:opacity-100 transition-opacity" />
            <span>Press</span>
            <kbd className="font-mono font-bold text-[10px] sm:text-[11px] px-1.5 py-0.5 rounded border border-neutral-300 dark:border-neutral-700 bg-neutral-100 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 shadow-2xs">
              ?
            </kbd>
            <span>or</span>
            <kbd className="font-mono font-bold text-[10px] sm:text-[11px] px-1.5 py-0.5 rounded border border-neutral-300 dark:border-neutral-700 bg-neutral-100 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 shadow-2xs">
              \
            </kbd>
            <span>to display shortcuts</span>
          </button>
        </div>
      </main>
    </div>
  );
};
