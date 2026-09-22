import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  Keyboard,
  Clock,
  Timer,
  CheckCircle2,
  BarChart3,
  Maximize,
  Moon,
  Settings,
  Users,
  CornerDownLeft,
  Sparkles,
} from 'lucide-react';
import { ViewMode } from '../types';

interface ShortcutsSheetProps {
  isOpen: boolean;
  onClose: () => void;
  currentView: ViewMode;
  isDarkMode: boolean;
  onSelectMode?: (mode: ViewMode) => void;
}

interface ShortcutItem {
  keys: string[];
  description: string;
  context?: string;
}

export const ShortcutsSheet: React.FC<ShortcutsSheetProps> = ({
  isOpen,
  onClose,
  currentView,
  isDarkMode,
  onSelectMode,
}) => {
  // When inside an individual view, allow the user to toggle "Show all shortcuts"
  const [showAllOverride, setShowAllOverride] = useState<boolean>(false);

  // Reset override whenever sheet opens or view changes
  useEffect(() => {
    if (isOpen) {
      setShowAllOverride(false);
    }
  }, [isOpen, currentView]);

  if (!isOpen) return null;

  const isFullOverview = currentView === 'welcome' || showAllOverride;

  // Mode title & icon definition
  const viewConfig: Record<ViewMode, { title: string; subtitle: string; icon: React.ReactNode; color: string }> = {
    welcome: {
      title: 'Global Hub Shortcuts',
      subtitle: 'Complete list of navigation and control hotkeys',
      icon: <Keyboard className="w-5 h-5" />,
      color: 'text-amber-500 bg-amber-500/15 border-amber-500/30',
    },
    clock: {
      title: 'Desk Clock Shortcuts',
      subtitle: 'Instant controls for ambient desk display',
      icon: <Clock className="w-5 h-5" />,
      color: 'text-amber-500 bg-amber-500/15 border-amber-500/30',
    },
    pomodoro: {
      title: 'Pomodoro Focus Shortcuts',
      subtitle: 'Hotkeys for session timer and interval workflow',
      icon: <Timer className="w-5 h-5" />,
      color: 'text-sky-500 bg-sky-500/15 border-sky-500/30',
    },
    tasks: {
      title: 'Task Tracker Shortcuts',
      subtitle: 'Quick actions for task lists & organization',
      icon: <CheckCircle2 className="w-5 h-5" />,
      color: 'text-emerald-500 bg-emerald-500/15 border-emerald-500/30',
    },
    stats: {
      title: 'Weekly Stats Shortcuts',
      subtitle: 'Navigation & viewing keys for productivity analytics',
      icon: <BarChart3 className="w-5 h-5" />,
      color: 'text-violet-500 bg-violet-500/15 border-violet-500/30',
    },
  };

  const currentCfg = viewConfig[currentView];

  // Specific shortcuts per view
  const clockShortcuts: ShortcutItem[] = [
    { keys: ['?', '\\'], description: 'Toggle this shortcuts sheet' },
    { keys: ['T'], description: 'Quick switch to Pomodoro Timer' },
    { keys: ['F'], description: 'Toggle Fullscreen display' },
    { keys: ['S'], description: 'Open Wallpaper, Font & Audio Settings' },
    { keys: ['D'], description: 'Toggle Light / Dark mode' },
    { keys: ['Esc'], description: 'Return to Welcome Hub' },
  ];

  const pomodoroShortcuts: ShortcutItem[] = [
    { keys: ['?', '\\'], description: 'Toggle this shortcuts sheet' },
    { keys: ['Space'], description: 'Start or pause focus interval' },
    { keys: ['C'], description: 'Quick switch to Desk Clock' },
    { keys: ['F'], description: 'Toggle Fullscreen display' },
    { keys: ['S'], description: 'Open Pomodoro & Interval Settings' },
    { keys: ['D'], description: 'Toggle Light / Dark mode' },
    { keys: ['Esc'], description: 'Return to Welcome Hub' },
  ];

  const tasksShortcuts: ShortcutItem[] = [
    { keys: ['?', '\\'], description: 'Toggle this shortcuts sheet' },
    { keys: ['A'], description: 'Switch to Weekly Stats & Analytics' },
    { keys: ['F'], description: 'Toggle Fullscreen display' },
    { keys: ['S'], description: 'Open Settings' },
    { keys: ['D'], description: 'Toggle Light / Dark mode' },
    { keys: ['Esc'], description: 'Return to Welcome Hub' },
  ];

  const statsShortcuts: ShortcutItem[] = [
    { keys: ['?', '\\'], description: 'Toggle this shortcuts sheet' },
    { keys: ['T'], description: 'Switch to Task Tracker' },
    { keys: ['F'], description: 'Toggle Fullscreen display' },
    { keys: ['S'], description: 'Open Settings' },
    { keys: ['D'], description: 'Toggle Light / Dark mode' },
    { keys: ['Esc'], description: 'Return to Welcome Hub' },
  ];

  const hubNavigationShortcuts: ShortcutItem[] = [
    { keys: ['1', 'C'], description: 'Launch Desk Clock mode' },
    { keys: ['2', 'T'], description: 'Launch Pomodoro Focus Timer' },
    { keys: ['3', 'K'], description: 'Launch Standalone Task Tracker' },
    { keys: ['4', 'A'], description: 'Launch Weekly Stats & Analytics' },
  ];

  const globalShortcuts: ShortcutItem[] = [
    { keys: ['?', '\\'], description: 'Toggle this shortcuts sheet anytime' },
    { keys: ['S'], description: 'Open Settings Panel' },
    { keys: ['P'], description: 'Open Study & Work Parties and Leaderboard' },
    { keys: ['D'], description: 'Toggle Light / Dark theme' },
    { keys: ['Esc'], description: 'Close any modal or return to Welcome Hub' },
  ];

  const renderShortcutRow = (item: ShortcutItem, idx: number) => (
    <div
      key={idx}
      className={`flex items-center justify-between py-2 px-3 rounded-xl transition-colors ${
        isDarkMode
          ? 'hover:bg-neutral-800/60 bg-neutral-900/30'
          : 'hover:bg-neutral-100/80 bg-neutral-50/60'
      }`}
    >
      <span className="text-xs font-medium text-neutral-700 dark:text-neutral-300">
        {item.description}
      </span>
      <div className="flex items-center gap-1 shrink-0 ml-3">
        {item.keys.map((k, ki) => (
          <React.Fragment key={ki}>
            {ki > 0 && <span className="text-[10px] text-neutral-400">or</span>}
            <kbd
              className={`font-mono text-[11px] font-semibold px-2 py-0.5 rounded-lg border shadow-xs ${
                isDarkMode
                  ? 'bg-neutral-800 text-neutral-200 border-neutral-700'
                  : 'bg-white text-neutral-800 border-neutral-300/90'
              }`}
            >
              {k}
            </kbd>
          </React.Fragment>
        ))}
      </div>
    </div>
  );

  return (
    <AnimatePresence>
      <div
        id="shortcuts-sheet-backdrop"
        className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          id="shortcuts-sheet-container"
          initial={{ opacity: 0, scale: 0.96, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 15 }}
          transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
          onClick={(e) => e.stopPropagation()}
          className={`w-full max-w-xl rounded-3xl border shadow-2xl overflow-hidden flex flex-col max-h-[85vh] transition-colors ${
            isDarkMode
              ? 'bg-neutral-900/95 border-neutral-800 text-neutral-100'
              : 'bg-white/95 border-neutral-200 text-neutral-900'
          }`}
        >
          {/* Header */}
          <div className="p-4 sm:p-5 border-b border-neutral-200/80 dark:border-neutral-800 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <div className={`w-9 h-9 rounded-2xl border flex items-center justify-center shrink-0 ${currentCfg.color}`}>
                {isFullOverview ? <Keyboard className="w-5 h-5" /> : currentCfg.icon}
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-bold tracking-tight leading-tight flex items-center gap-2">
                  <span>{isFullOverview ? 'All Keyboard Shortcuts' : currentCfg.title}</span>
                  {!isFullOverview && (
                    <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-neutral-200 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 font-semibold">
                      This Window
                    </span>
                  )}
                </h3>
                <p className="text-xs text-neutral-500 dark:text-neutral-400">
                  {isFullOverview ? 'Complete hotkey reference for the entire app' : currentCfg.subtitle}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                id="shortcuts-sheet-close-btn"
                type="button"
                onClick={onClose}
                className={`p-2 rounded-xl border transition-colors cursor-pointer ${
                  isDarkMode
                    ? 'border-neutral-800 bg-neutral-800/80 hover:bg-neutral-700 text-neutral-300 hover:text-white'
                    : 'border-neutral-200 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 hover:text-black'
                }`}
                title="Close (Escape or ?)"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Content Body with smooth scroll */}
          <div className="p-4 sm:p-5 overflow-y-auto space-y-4 text-xs">
            {isFullOverview ? (
              // FULL OVERVIEW (Home screen or expanded mode)
              <>
                {/* 1. Global Navigation Launchers */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-neutral-400 font-semibold text-[11px] uppercase tracking-wider px-1">
                    <span>Direct Mode Launchers</span>
                    <span className="font-mono text-[10px] text-neutral-500">From Home</span>
                  </div>
                  <div className="space-y-1.5">
                    {hubNavigationShortcuts.map(renderShortcutRow)}
                  </div>
                </div>

                {/* 2. Window Specific Cards */}
                <div className="space-y-2 pt-2 border-t border-neutral-200/60 dark:border-neutral-800/60">
                  <span className="text-neutral-400 font-semibold text-[11px] uppercase tracking-wider px-1 block">
                    Desk Clock & Ambient
                  </span>
                  <div className="space-y-1.5">
                    {clockShortcuts.map(renderShortcutRow)}
                  </div>
                </div>

                <div className="space-y-2 pt-2 border-t border-neutral-200/60 dark:border-neutral-800/60">
                  <span className="text-neutral-400 font-semibold text-[11px] uppercase tracking-wider px-1 block">
                    Pomodoro Focus Timer
                  </span>
                  <div className="space-y-1.5">
                    {pomodoroShortcuts.map(renderShortcutRow)}
                  </div>
                </div>

                <div className="space-y-2 pt-2 border-t border-neutral-200/60 dark:border-neutral-800/60">
                  <span className="text-neutral-400 font-semibold text-[11px] uppercase tracking-wider px-1 block">
                    Task Tracker & Weekly Stats
                  </span>
                  <div className="space-y-1.5">
                    {tasksShortcuts.slice(1, 3).map(renderShortcutRow)}
                    {statsShortcuts.slice(1, 3).map(renderShortcutRow)}
                  </div>
                </div>

                {/* 3. Global Keys */}
                <div className="space-y-2 pt-2 border-t border-neutral-200/60 dark:border-neutral-800/60">
                  <span className="text-neutral-400 font-semibold text-[11px] uppercase tracking-wider px-1 block">
                    Everywhere
                  </span>
                  <div className="space-y-1.5">
                    {globalShortcuts.map(renderShortcutRow)}
                  </div>
                </div>
              </>
            ) : (
              // WINDOW-SPECIFIC SHORTCUTS (Clock, Pomodoro, Tasks, Stats)
              <div className="space-y-3">
                <div className="space-y-2">
                  <span className="text-neutral-400 font-semibold text-[11px] uppercase tracking-wider px-1 block">
                    Active Hotkeys in this window
                  </span>
                  <div className="space-y-2">
                    {currentView === 'clock' && clockShortcuts.map(renderShortcutRow)}
                    {currentView === 'pomodoro' && pomodoroShortcuts.map(renderShortcutRow)}
                    {currentView === 'tasks' && tasksShortcuts.map(renderShortcutRow)}
                    {currentView === 'stats' && statsShortcuts.map(renderShortcutRow)}
                  </div>
                </div>

                <div className="pt-3 border-t border-neutral-200/60 dark:border-neutral-800/60 flex items-center justify-between text-xs">
                  <button
                    type="button"
                    onClick={() => setShowAllOverride(true)}
                    className="text-amber-500 hover:text-amber-600 dark:text-amber-400 dark:hover:text-amber-300 font-medium underline underline-offset-2 flex items-center gap-1 cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>View all application shortcuts</span>
                  </button>
                  <span className="text-[11px] text-neutral-400">
                    Press <kbd className="font-mono font-bold">Esc</kbd> to return
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Footer Bar */}
          <div
            className={`px-4 sm:px-5 py-3 border-t border-neutral-200/80 dark:border-neutral-800 flex items-center justify-between text-[11px] ${
              isDarkMode ? 'bg-neutral-950/60 text-neutral-400' : 'bg-neutral-50/80 text-neutral-600'
            }`}
          >
            <div className="flex items-center gap-1.5">
              <span>Press</span>
              <kbd className="font-mono font-semibold px-1.5 py-0.5 rounded border border-neutral-300 dark:border-neutral-700 bg-neutral-200 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200">
                ?
              </kbd>
              <span>or</span>
              <kbd className="font-mono font-semibold px-1.5 py-0.5 rounded border border-neutral-300 dark:border-neutral-700 bg-neutral-200 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200">
                \
              </kbd>
              <span>at any time to toggle this sheet</span>
            </div>
            {isFullOverview && currentView !== 'welcome' && (
              <button
                type="button"
                onClick={() => setShowAllOverride(false)}
                className="text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300 font-medium underline cursor-pointer"
              >
                Back to window shortcuts
              </button>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
