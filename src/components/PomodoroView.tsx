import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  SkipForward,
  Settings,
  ArrowLeft,
  Clock,
  Maximize2,
  Minimize2,
  CheckCircle2,
  Flame,
  Plus,
  Minus,
  CheckSquare,
  Square,
  Trash2,
  ListTodo,
  Check,
  X,
  Users,
  Trophy,
  BarChart3,
  Keyboard,
} from 'lucide-react';
import {
  PomodoroSettings,
  PomodoroPhase,
  ClockSettings,
  PomodoroTask,
  Party,
  AmbientThemeId,
  AmbientThemePreset,
} from '../types';
import {
  triggerSoundAlert,
  playPomodoroStart,
  playTickSound,
  startAmbientSoundscape,
  stopAmbientSoundscape,
  setAmbientSoundscapeVolume,
} from '../utils/audio';
import {
  FONT_OPTIONS,
  getResolvedPomodoroTheme,
  POMODORO_THEME_PRESETS,
  getMaxPomodoroFontSize,
  AMBIENT_THEMES,
} from '../utils/constants';
import {
  getSavedPartyIds,
  getActivePartyId,
  syncFocusTimeToParties,
  updatePartyMemberStatus,
  subscribeToParty,
} from '../utils/partyService';
import { recordTaskCompletion } from '../utils/statsStorage';
import { AmbientBackground } from './AmbientBackground';
import { PomodoroTimerController } from '../utils/usePomodoroTimer';

interface PomodoroViewProps {
  settings: PomodoroSettings;
  clockSettings: ClockSettings;
  timer: PomodoroTimerController;
  onUpdateSettings?: (updated: Partial<PomodoroSettings>) => void;
  onOpenSettings: () => void;
  onGoToClock: () => void;
  onGoToWelcome: () => void;
  onGoToTasks?: () => void;
  onGoToStats?: () => void;
  onOpenParties?: (tab?: 'leaderboard' | 'my-parties' | 'create' | 'join') => void;
  onOpenShortcuts?: () => void;
  userName: string;
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
}

const TASKS_STORAGE_KEY = 'desk_clock_pomodoro_tasks_v1';

export const PomodoroView: React.FC<PomodoroViewProps> = ({
  settings,
  clockSettings,
  timer,
  onUpdateSettings,
  onOpenSettings,
  onGoToClock,
  onGoToWelcome,
  onGoToTasks,
  onGoToStats,
  onOpenParties,
  onOpenShortcuts,
  userName,
  isDarkMode,
  onToggleDarkMode,
}) => {
  const {
    phase,
    timeLeft,
    totalTime,
    isRunning,
    currentRound,
    completedRounds,
    consecutiveStreak,
    activeTaskId,
    togglePlayPause,
    handleReset,
    handleSkip,
    handleAddMinute,
    handleMinusMinute,
    switchPhase,
    setActiveTaskId,
  } = timer;

  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  // Active ambient theme definition for Pomodoro
  const effectiveAmbientId: AmbientThemeId =
    settings.ambientTheme && settings.ambientTheme !== 'none'
      ? settings.ambientTheme
      : settings.themeId === 'sync' && clockSettings.ambientTheme && clockSettings.ambientTheme !== 'none'
      ? clockSettings.ambientTheme
      : 'none';

  const activeAmbient: AmbientThemePreset =
    AMBIENT_THEMES.find((a) => a.id === effectiveAmbientId) || AMBIENT_THEMES[0];
  const isAmbientActive = activeAmbient && activeAmbient.id !== 'none';

  // Ambient soundscape audio coordinator for Pomodoro
  useEffect(() => {
    if (
      isAmbientActive &&
      settings.ambientSoundEnabled &&
      activeAmbient.soundType &&
      activeAmbient.soundType !== 'none'
    ) {
      startAmbientSoundscape(activeAmbient.soundType, settings.ambientSoundVolume ?? 35);
    } else {
      stopAmbientSoundscape();
    }

    return () => {
      stopAmbientSoundscape();
    };
  }, [isAmbientActive, settings.ambientSoundEnabled, activeAmbient.soundType, activeAmbient.id]);

  // Ambient volume changes
  useEffect(() => {
    if (settings.ambientSoundEnabled && settings.ambientSoundVolume !== undefined) {
      setAmbientSoundscapeVolume(settings.ambientSoundVolume);
    }
  }, [settings.ambientSoundVolume, settings.ambientSoundEnabled]);

  // Task Management State
  const [tasks, setTasks] = useState<PomodoroTask[]>(() => {
    try {
      const saved = localStorage.getItem(TASKS_STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.debug('Failed to load tasks:', e);
    }
    return [
      {
        id: '1',
        title: 'Deep study & complete assignments',
        estimatedPomodoros: 2,
        completedPomodoros: 0,
        isCompleted: false,
        createdAt: Date.now(),
      },
    ];
  });

  const [newTaskTitle, setNewTaskTitle] = useState<string>('');
  const [newTaskDescription, setNewTaskDescription] = useState<string>('');
  const [newTaskEst, setNewTaskEst] = useState<number>(1);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState<boolean>(false);
  const [hoveredTask, setHoveredTask] = useState<PomodoroTask | null>(null);
  const [displayTask, setDisplayTask] = useState<PomodoroTask | null>(null);
  const [isIdle, setIsIdle] = useState<boolean>(false);

  // Active Party state for header badge & live sync
  const [activeParty, setActiveParty] = useState<Party | null>(null);
  const activePartyId = getActivePartyId();

  useEffect(() => {
    if (!activePartyId) {
      setActiveParty(null);
      return;
    }
    const unsub = subscribeToParty(activePartyId, (p) => {
      setActiveParty(p);
    });
    return () => unsub();
  }, [activePartyId]);

  // Set default active task if none selected yet
  useEffect(() => {
    if (!activeTaskId && tasks.length > 0) {
      const firstIncomplete = tasks.find((t) => !t.isCompleted);
      if (firstIncomplete) {
        setActiveTaskId(firstIncomplete.id);
      }
    }
  }, [activeTaskId, tasks, setActiveTaskId]);

  // Smoothly keep display task for soft exit transitions
  useEffect(() => {
    if (hoveredTask) {
      setDisplayTask(hoveredTask);
    }
  }, [hoveredTask]);

  // Idle timer: hide non-essential elements when user is inactive, keep clock, counter, controls & tasks visible
  useEffect(() => {
    if (isTaskModalOpen) {
      setIsIdle(false);
      return;
    }

    let idleTimer: ReturnType<typeof setTimeout>;

    const resetIdle = () => {
      setIsIdle(false);
      clearTimeout(idleTimer);
      idleTimer = setTimeout(() => {
        setIsIdle(true);
      }, 3500);
    };

    // Initial timeout
    idleTimer = setTimeout(() => {
      setIsIdle(true);
    }, 3500);

    const onActivity = () => resetIdle();

    window.addEventListener('mousemove', onActivity, { passive: true });
    window.addEventListener('mousedown', onActivity, { passive: true });
    window.addEventListener('keydown', onActivity, { passive: true });
    window.addEventListener('touchstart', onActivity, { passive: true });

    return () => {
      clearTimeout(idleTimer);
      window.removeEventListener('mousemove', onActivity);
      window.removeEventListener('mousedown', onActivity);
      window.removeEventListener('keydown', onActivity);
      window.removeEventListener('touchstart', onActivity);
    };
  }, [isTaskModalOpen]);

  // Save tasks to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(TASKS_STORAGE_KEY, JSON.stringify(tasks));
    } catch (e) {
      console.debug('Failed to save tasks:', e);
    }
  }, [tasks]);

  const activeTask = tasks.find((t) => t.id === activeTaskId);
  const activeTasksList = tasks.filter((t) => !t.isCompleted);
  const completedTasksList = tasks.filter((t) => t.isCompleted);

  // Sync tasks state when pomodoro sessions complete
  useEffect(() => {
    try {
      const saved = localStorage.getItem(TASKS_STORAGE_KEY);
      if (saved) {
        setTasks(JSON.parse(saved));
      }
    } catch (e) {
      console.debug('Failed to sync tasks from storage', e);
    }
  }, [completedRounds]);

  // Spacebar shortcut to pause / play
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.code === 'Space' &&
        document.activeElement?.tagName !== 'INPUT' &&
        document.activeElement?.tagName !== 'TEXTAREA'
      ) {
        e.preventDefault();
        togglePlayPause();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [togglePlayPause]);

  // Fullscreen handler
  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
        setIsFullscreen(true);
      } else {
        if (document.exitFullscreen) {
          await document.exitFullscreen();
          setIsFullscreen(false);
        }
      }
    } catch {
      // ignore
    }
  };

  // Add task handler
  const handleAddTask = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = newTaskTitle.trim();
    if (!trimmed) return;

    const newTask: PomodoroTask = {
      id: Date.now().toString(),
      title: trimmed,
      description: newTaskDescription.trim() || undefined,
      estimatedPomodoros: Math.max(1, newTaskEst),
      completedPomodoros: 0,
      isCompleted: false,
      createdAt: Date.now(),
    };

    setTasks((prev) => [...prev, newTask]);
    if (!activeTaskId) {
      setActiveTaskId(newTask.id);
    }
    setNewTaskTitle('');
    setNewTaskDescription('');
    setNewTaskEst(1);
    setIsTaskModalOpen(false);
  };

  // Mark task completed / incomplete
  const handleToggleTaskCompleted = (taskId: string) => {
    setTasks((prev) => {
      const updated = prev.map((t) => {
        if (t.id === taskId) {
          const nextCompleted = !t.isCompleted;
          if (nextCompleted) {
            recordTaskCompletion(1);
          }
          return {
            ...t,
            isCompleted: nextCompleted,
            completedAt: nextCompleted ? Date.now() : undefined,
          };
        }
        return t;
      });

      // If active task was completed, pick next incomplete task
      if (taskId === activeTaskId) {
        const nextIncomplete = updated.find((t) => !t.isCompleted);
        setActiveTaskId(nextIncomplete ? nextIncomplete.id : null);
      }

      return updated;
    });
  };

  // Delete task
  const handleDeleteTask = (taskId: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== taskId));
    if (activeTaskId === taskId) {
      const remaining = tasks.filter((t) => t.id !== taskId && !t.isCompleted);
      setActiveTaskId(remaining[0]?.id || null);
    }
  };

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const formattedMinutes = String(minutes).padStart(2, '0');
  const formattedSeconds = String(seconds).padStart(2, '0');

  // Percentage for progress ring (0 to 1)
  const progress = totalTime > 0 ? (totalTime - timeLeft) / totalTime : 0;

  // Resolve active theme styling for Pomodoro
  const resolvedTheme = getResolvedPomodoroTheme(settings, clockSettings, isDarkMode);

  // Colors based on phase
  const getPhaseTheme = () => {
    switch (phase) {
      case 'work':
        return {
          label: 'Focus Session',
          accent: resolvedTheme.workColor,
          badgeBg: `${resolvedTheme.workColor}22`,
          badgeBorder: `${resolvedTheme.workColor}50`,
          badgeText: resolvedTheme.workColor,
          ringColor: resolvedTheme.workColor,
        };
      case 'shortBreak':
        return {
          label: 'Short Break',
          accent: resolvedTheme.shortBreakColor,
          badgeBg: `${resolvedTheme.shortBreakColor}22`,
          badgeBorder: `${resolvedTheme.shortBreakColor}50`,
          badgeText: resolvedTheme.shortBreakColor,
          ringColor: resolvedTheme.shortBreakColor,
        };
      case 'longBreak':
        return {
          label: 'Long Break',
          accent: resolvedTheme.longBreakColor,
          badgeBg: `${resolvedTheme.longBreakColor}22`,
          badgeBorder: `${resolvedTheme.longBreakColor}50`,
          badgeText: resolvedTheme.longBreakColor,
          ringColor: resolvedTheme.longBreakColor,
        };
    }
  };

  const currentTheme = getPhaseTheme();

  const selectedFont =
    FONT_OPTIONS.find((f) => f.id === (settings.fontFamily || 'outfit')) || FONT_OPTIONS[0];

  const circleDiameter = settings.circleSize || 320;
  const strokeWidth = settings.ringWidth || 8;
  const radius = Math.max(60, (circleDiameter - strokeWidth * 2 - 16) / 2);
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - circumference * progress;

  // Exact inner void diameter inside the stroke ring (accounting for both sides of stroke)
  const innerCircleDiameter = Math.max(100, Math.floor((radius - strokeWidth / 2) * 2));

  // Maximum safe font size dynamically limited with respect to the ring size to prevent text from merging into the ring
  const maxSafeFontSize = getMaxPomodoroFontSize(circleDiameter, strokeWidth);

  // Custom or auto digit font size: safely bounded so the timer never collides with or merges into the ring
  const rawFontSize =
    settings.timerFontSize && settings.timerFontSize > 0
      ? settings.timerFontSize
      : Math.max(36, Math.round(circleDiameter * 0.22));
  const digitFontSize = Math.min(rawFontSize, maxSafeFontSize);

  // Screen resize tracking to only apply horizontal shift when in side-by-side row layout (lg: breakpoint)
  const [isLgScreen, setIsLgScreen] = useState<boolean>(() =>
    typeof window !== 'undefined' ? window.innerWidth >= 1024 : true
  );

  useEffect(() => {
    const handleResize = () => {
      setIsLgScreen(window.innerWidth >= 1024);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Proportional left shift for the timer circle on desktop, so larger circle sizes never look clumsy or crowded against controls
  const timerLeftShift = isLgScreen
    ? Math.max(18, Math.min(84, Math.round(22 + Math.max(0, circleDiameter - 320) * 0.14)))
    : 0;

  // Dynamic typography calculation for task preview inside the circle:
  // Scales up generously for short content and comfortably adjusts for longer content,
  // keeping everything strictly within a safe circular zone so text never touches or crowds the ring.
  const taskTypography = useMemo(() => {
    if (!displayTask) {
      return { titleSize: 24, descSize: 14, badgeSize: 11, gap: 8, maxDescLines: 3 };
    }

    const title = displayTask.title.trim();
    const desc = (displayTask.description || '').trim();
    const titleLen = title.length;
    const descLen = desc.length;
    const hasDesc = Boolean(descLen);

    let titleSize: number;
    let descSize: number;
    const badgeSize = Math.max(10, Math.min(13, Math.round(circleDiameter * 0.034)));
    let gap = 8;
    let maxDescLines = 3;

    if (!hasDesc) {
      // No description: title can be large, clear, and impactful
      if (titleLen <= 12) {
        titleSize = Math.max(26, Math.min(52, Math.round(circleDiameter * 0.13)));
      } else if (titleLen <= 24) {
        titleSize = Math.max(22, Math.min(44, Math.round(circleDiameter * 0.11)));
      } else if (titleLen <= 45) {
        titleSize = Math.max(19, Math.min(34, Math.round(circleDiameter * 0.088)));
      } else {
        titleSize = Math.max(16, Math.min(26, Math.round(circleDiameter * 0.07)));
      }
      descSize = 0;
    } else {
      // Both title and description present: adjust based on total text volume
      if (titleLen <= 20 && descLen <= 40) {
        // Short title + short description
        titleSize = Math.max(22, Math.min(38, Math.round(circleDiameter * 0.098)));
        descSize = Math.max(13, Math.min(18, Math.round(circleDiameter * 0.046)));
        gap = 8;
        maxDescLines = 2;
      } else if (titleLen <= 35 && descLen <= 80) {
        // Medium title + medium description
        titleSize = Math.max(18, Math.min(32, Math.round(circleDiameter * 0.082)));
        descSize = Math.max(12, Math.min(16, Math.round(circleDiameter * 0.040)));
        gap = 6;
        maxDescLines = 3;
      } else if (titleLen > 35 && descLen <= 60) {
        // Long title + medium description
        titleSize = Math.max(16, Math.min(26, Math.round(circleDiameter * 0.068)));
        descSize = Math.max(11, Math.min(14, Math.round(circleDiameter * 0.036)));
        gap = 6;
        maxDescLines = 2;
      } else {
        // Longer title + longer description: clean with strict clamp
        titleSize = Math.max(15, Math.min(24, Math.round(circleDiameter * 0.060)));
        descSize = Math.max(11, Math.min(13, Math.round(circleDiameter * 0.032)));
        gap = 5;
        maxDescLines = 2;
      }
    }

    return { titleSize, descSize, badgeSize, gap, maxDescLines };
  }, [displayTask, circleDiameter]);

  const canScroll = !isFullscreen && clockSettings?.enableScrolling !== false;

  return (
    <div
      id="pomodoro-view-container"
      className={`relative w-full flex flex-col justify-between select-none overflow-x-hidden transition-colors duration-500 ${
        canScroll
          ? 'min-h-screen overflow-y-auto pb-16'
          : 'h-screen overflow-hidden pb-0'
      } ${
        isIdle ? 'cursor-none' : ''
      }`}
      style={{
        backgroundColor: isAmbientActive ? 'transparent' : resolvedTheme.bg,
        backgroundImage: isAmbientActive ? activeAmbient.bgGradient : undefined,
        color: resolvedTheme.textColor,
      }}
    >
      {/* 0. Dynamic Ambient Atmospheric Canvas (Beachside Sunset, Rainy Day, Aurora, etc.) */}
      {isAmbientActive && (
        <div className="fixed inset-0 pointer-events-none z-0">
          <AmbientBackground
            ambientTheme={effectiveAmbientId}
            particles={settings.ambientParticles !== false}
            pomodoroPhase={phase}
            syncPhase={settings.ambientPhaseSync !== false}
          />
        </div>
      )}

      {/* Ambient lighting backdrop (Hidden when idle or when ambient theme is active) */}
      {!isAmbientActive && resolvedTheme.enableGlow && (
        <div
          className={`absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[550px] rounded-full blur-[150px] pointer-events-none transition-all duration-1000 ${
            isIdle ? 'opacity-10' : 'opacity-25'
          }`}
          style={{ backgroundColor: currentTheme.accent }}
        />
      )}

      {/* Top Header Bar (Disappears when left idle) */}
      <header
        id="pomodoro-header"
        className={`sticky top-0 left-0 right-0 px-6 py-4 flex items-center justify-between z-20 border-b backdrop-blur-md transition-all duration-700 ease-in-out ${
          isIdle
            ? 'opacity-0 -translate-y-full pointer-events-none'
            : 'opacity-100 translate-y-0 pointer-events-auto'
        } ${
          resolvedTheme.isDark
            ? 'border-neutral-900/80 bg-neutral-950/60 text-white'
            : 'border-neutral-200/80 bg-white/70 text-neutral-900'
        }`}
      >
        <div className="flex items-center gap-3">
          <button
            id="pomo-back-welcome-btn"
            onClick={onGoToWelcome}
            className={`apple-hover flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-medium border cursor-pointer ${
              resolvedTheme.isDark
                ? 'border-neutral-800 bg-neutral-900/80 hover:bg-neutral-800 text-neutral-300 hover:text-white'
                : 'border-neutral-300/80 bg-white hover:bg-neutral-50 text-neutral-800'
            }`}
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Welcome Screen</span>
          </button>

          <span className="text-xs text-neutral-500 hidden md:inline font-mono">
            {userName}&apos;s Pomodoro
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Party Leaderboard & Chat Button */}
          {onOpenParties && (
            <button
              id="pomo-party-btn"
              onClick={() => onOpenParties('leaderboard')}
              className={`apple-hover flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium border cursor-pointer transition-colors ${
                activeParty
                  ? 'border-amber-400/40 bg-amber-400/10 text-amber-300 hover:bg-amber-400/20'
                  : resolvedTheme.isDark
                  ? 'border-neutral-800 bg-neutral-900/80 hover:bg-neutral-800 text-neutral-300 hover:text-white'
                  : 'border-neutral-300/80 bg-white hover:bg-neutral-50 text-neutral-800'
              }`}
              title={activeParty ? `Party: ${activeParty.name} (Click to open Leaderboard & Chat)` : 'Study & Work Parties'}
            >
              <Users className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden sm:inline">{activeParty ? activeParty.name : 'Party'}</span>
              <span className="text-[10px] font-mono opacity-70 hidden md:inline">• Leaderboard & Chat</span>
            </button>
          )}

          {/* Quick Desk Clock Switch */}
          <button
            id="pomo-to-clock-btn"
            onClick={onGoToClock}
            className={`apple-hover flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-medium border cursor-pointer ${
              resolvedTheme.isDark
                ? 'border-neutral-800 bg-neutral-900/80 hover:bg-neutral-800 text-neutral-300 hover:text-white'
                : 'border-neutral-300/80 bg-white hover:bg-neutral-50 text-neutral-800'
            }`}
          >
            <Clock className="w-3.5 h-3.5 text-amber-500" />
            <span className="hidden sm:inline">Desk Clock</span>
          </button>

          {/* Fullscreen */}
          <button
            id="pomo-fullscreen-btn"
            onClick={toggleFullscreen}
            className={`apple-icon-hover p-2 rounded-xl text-xs border cursor-pointer ${
              resolvedTheme.isDark
                ? 'border-neutral-800 bg-neutral-900/80 hover:bg-neutral-800 text-neutral-300 hover:text-white'
                : 'border-neutral-300/80 bg-white hover:bg-neutral-50 text-neutral-800'
            }`}
            title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>

          {/* Settings */}
          <button
            id="pomo-settings-btn"
            onClick={onOpenSettings}
            className={`apple-hover flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium border cursor-pointer ${
              resolvedTheme.isDark
                ? 'border-neutral-800 bg-neutral-900/80 hover:bg-neutral-800 text-neutral-300 hover:text-white'
                : 'border-neutral-300/80 bg-white hover:bg-neutral-50 text-neutral-800'
            }`}
          >
            <Settings className="w-4 h-4" />
            <span className="hidden sm:inline">Settings</span>
          </button>

          {/* Shortcuts Guide Button */}
          {onOpenShortcuts && (
            <button
              id="pomo-shortcuts-btn"
              onClick={onOpenShortcuts}
              className={`apple-icon-hover p-2 rounded-xl text-xs border cursor-pointer ${
                resolvedTheme.isDark
                  ? 'border-neutral-800 bg-neutral-900/80 hover:bg-neutral-800 text-neutral-300 hover:text-white'
                  : 'border-neutral-300/80 bg-white hover:bg-neutral-50 text-neutral-800'
              }`}
              title="Keyboard Shortcuts (? or \)"
            >
              <Keyboard className="w-4 h-4" />
            </button>
          )}
        </div>
      </header>

      {/* Main Pomodoro & Controls Container */}
      <main
        className={`flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 flex flex-col items-center justify-center z-10 transition-all duration-500 ${
          isIdle ? 'py-4' : 'py-6'
        }`}
      >
        {/* Phase Pill Selector */}
        <div
          id="pomodoro-phase-pills"
          className={`flex items-center gap-1.5 p-1.5 border rounded-2xl shadow-inner transition-all duration-700 ease-in-out shrink-0 ${
            isIdle
              ? 'opacity-0 -translate-y-4 pointer-events-none max-h-0 mb-0 py-0 border-transparent overflow-hidden'
              : 'opacity-100 translate-y-0 pointer-events-auto max-h-16 mb-5'
          }`}
          style={{
            backgroundColor: resolvedTheme.cardBg,
            borderColor: resolvedTheme.isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.12)',
          }}
        >
          <button
            id="phase-work-btn"
            onClick={() => switchPhase('work')}
            className={`apple-hover px-4 py-2 rounded-xl text-xs font-semibold tracking-wide cursor-pointer ${
              phase === 'work'
                ? 'shadow-md font-bold'
                : 'opacity-70 hover:opacity-100'
            }`}
            style={{
              backgroundColor: phase === 'work' ? resolvedTheme.workColor : 'transparent',
              color: phase === 'work' ? (resolvedTheme.isDark ? '#000000' : '#ffffff') : resolvedTheme.textColor,
            }}
          >
            Focus ({settings.workMinutes}m)
          </button>

          <button
            id="phase-short-break-btn"
            onClick={() => switchPhase('shortBreak')}
            className={`apple-hover px-4 py-2 rounded-xl text-xs font-semibold tracking-wide cursor-pointer ${
              phase === 'shortBreak'
                ? 'shadow-md font-bold'
                : 'opacity-70 hover:opacity-100'
            }`}
            style={{
              backgroundColor: phase === 'shortBreak' ? resolvedTheme.shortBreakColor : 'transparent',
              color: phase === 'shortBreak' ? (resolvedTheme.isDark ? '#000000' : '#ffffff') : resolvedTheme.textColor,
            }}
          >
            Short Break ({settings.shortBreakMinutes}m)
          </button>

          <button
            id="phase-long-break-btn"
            onClick={() => switchPhase('longBreak')}
            className={`apple-hover px-4 py-2 rounded-xl text-xs font-semibold tracking-wide cursor-pointer ${
              phase === 'longBreak'
                ? 'shadow-md font-bold'
                : 'opacity-70 hover:opacity-100'
            }`}
            style={{
              backgroundColor: phase === 'longBreak' ? resolvedTheme.longBreakColor : 'transparent',
              color: phase === 'longBreak' ? (resolvedTheme.isDark ? '#000000' : '#ffffff') : resolvedTheme.textColor,
            }}
          >
            Long Break ({settings.longBreakMinutes}m)
          </button>
        </div>

        {/* Central Display: Circle on Left/Center, and Vertical Controls + Tasks on the Right */}
        <div className="flex flex-col lg:flex-row items-center justify-center gap-6 sm:gap-8 lg:gap-10 my-auto w-full transition-all duration-700">
          {/* 1. Timer Circle (Centrally aligned with square aspect ratio) */}
          <div
            id="pomodoro-timer-circle"
            className="relative flex items-center justify-center transition-all duration-300 shrink-0 aspect-square"
            style={{
              width: circleDiameter,
              height: circleDiameter,
              maxWidth: 'min(94vw, calc(100vh - 140px))',
              maxHeight: 'min(94vw, calc(100vh - 140px))',
              aspectRatio: '1 / 1',
              transform: timerLeftShift > 0 ? `translateX(-${timerLeftShift}px)` : undefined,
            }}
          >
            <svg
              width="100%"
              height="100%"
              viewBox={`0 0 ${circleDiameter} ${circleDiameter}`}
              preserveAspectRatio="xMidYMid meet"
              className="transform -rotate-90 transition-all duration-300 w-full h-full aspect-square"
            >
              {/* Background Circle */}
              <circle
                cx={circleDiameter / 2}
                cy={circleDiameter / 2}
                r={radius}
                stroke={resolvedTheme.isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.08)'}
                strokeWidth={strokeWidth}
                fill="transparent"
              />
              {/* Animated Progress Ring */}
              <circle
                cx={circleDiameter / 2}
                cy={circleDiameter / 2}
                r={radius}
                stroke={currentTheme.ringColor}
                strokeWidth={strokeWidth}
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                fill="transparent"
                className="transition-all duration-1000 ease-linear"
                style={{
                  filter: resolvedTheme.enableGlow
                    ? `drop-shadow(0 0 12px ${currentTheme.ringColor}90)`
                    : 'none',
                }}
              />
            </svg>

            {/* Center Info inside ring: Geometrically bounded strictly to inner circle void */}
            <div
              className="absolute select-none overflow-hidden rounded-full pointer-events-none flex items-center justify-center"
              style={{
                width: `${innerCircleDiameter}px`,
                height: `${innerCircleDiameter}px`,
              }}
            >
              {/* LAYER 1: Task Preview on Hover (Smoothly fades in with zero positional shift) */}
              <div
                className={`absolute inset-0 flex flex-col items-center justify-center text-center transition-opacity duration-200 ease-out ${
                  hoveredTask
                    ? 'opacity-100 pointer-events-auto'
                    : 'opacity-0 pointer-events-none'
                }`}
              >
                {displayTask && (
                  <div
                    className="flex flex-col items-center justify-center text-center max-w-[76%] max-h-[76%] px-2 overflow-hidden pointer-events-auto"
                    style={{ gap: `${taskTypography.gap}px` }}
                  >
                    <span
                      className="uppercase tracking-widest font-mono font-bold px-2.5 py-0.5 rounded-full border shrink-0 transition-all truncate max-w-full"
                      style={{
                        fontSize: `${taskTypography.badgeSize}px`,
                        backgroundColor: `${currentTheme.accent}20`,
                        borderColor: `${currentTheme.accent}50`,
                        color: currentTheme.accent,
                      }}
                    >
                      Task #{tasks.findIndex((t) => t.id === displayTask.id) + 1}
                    </span>
                    <h4
                      className="font-bold tracking-tight text-center leading-tight line-clamp-3 break-words max-w-full"
                      style={{
                        fontFamily: selectedFont.cssFamily,
                        fontSize: `${taskTypography.titleSize}px`,
                        color: resolvedTheme.textColor,
                      }}
                    >
                      {displayTask.title}
                    </h4>
                    {displayTask.description && (
                      <p
                        className="text-center leading-relaxed break-words max-w-full"
                        style={{
                          fontSize: `${taskTypography.descSize}px`,
                          color: resolvedTheme.isDark ? 'rgba(255, 255, 255, 0.75)' : 'rgba(0, 0, 0, 0.75)',
                          display: '-webkit-box',
                          WebkitLineClamp: taskTypography.maxDescLines,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                        }}
                      >
                        {displayTask.description}
                      </p>
                    )}
                    {displayTask.isCompleted && (
                      <span className="inline-flex items-center gap-1 text-[11px] text-emerald-400 font-semibold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 shrink-0">
                        <CheckCircle2 className="w-3 h-3" /> Completed
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* LAYER 2: Normal Timer Display (Zero positional shift, strictly bounded inside inner circle) */}
              <div
                className={`absolute inset-0 flex flex-col items-center justify-center text-center p-2.5 transition-opacity duration-200 ease-out ${
                  hoveredTask
                    ? 'opacity-0 pointer-events-none'
                    : 'opacity-100 pointer-events-auto'
                }`}
              >
                {/* Phase Badge - Sized and clamped to stay well within upper circular chord */}
                <span
                  id="pomodoro-phase-badge"
                  className="font-semibold uppercase tracking-widest px-2.5 py-0.5 rounded-full border mb-1 transition-all select-none truncate max-w-[74%]"
                  style={{
                    fontSize: `${Math.max(9, Math.min(15, Math.round(circleDiameter * 0.032)))}px`,
                    backgroundColor: currentTheme.badgeBg,
                    borderColor: currentTheme.badgeBorder,
                    color: currentTheme.badgeText,
                  }}
                >
                  {currentTheme.label}
                </span>

                {/* Timer Digits using Pomodoro Font & Size: tabular-nums & width constrained */}
                <div
                  id="pomodoro-time-digits"
                  className="font-bold tracking-tight flex items-center justify-center select-none w-full max-w-[82%] mx-auto overflow-hidden text-center"
                  style={{
                    fontFamily: selectedFont.cssFamily,
                    color: resolvedTheme.textColor,
                    fontSize: `${digitFontSize}px`,
                    lineHeight: 1,
                  }}
                >
                  <span className="tabular-nums">{formattedMinutes}</span>
                  <span className="opacity-60 mx-0.5 select-none">:</span>
                  <span className="tabular-nums">{formattedSeconds}</span>
                </div>

                {/* Quick Adjust Buttons (Disappears when idle, tight padding) */}
                <div
                  className={`flex items-center gap-2 mt-1 transition-all duration-500 ${
                    isIdle ? 'opacity-0 pointer-events-none' : 'opacity-70 hover:opacity-100'
                  }`}
                >
                  <button
                    id="pomo-minus-time-btn"
                    onClick={handleMinusMinute}
                    className="p-1 rounded-lg border text-xs cursor-pointer transition-colors"
                    style={{
                      backgroundColor: resolvedTheme.isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
                      borderColor: resolvedTheme.isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.12)',
                      color: resolvedTheme.textColor,
                    }}
                    title="-1 minute"
                  >
                    <Minus className="w-3 h-3" />
                  </button>
                  <span className="text-[10px] font-mono text-neutral-500">±1m</span>
                  <button
                    id="pomo-plus-time-btn"
                    onClick={handleAddMinute}
                    className="p-1 rounded-lg border text-xs cursor-pointer transition-colors"
                    style={{
                      backgroundColor: resolvedTheme.isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
                      borderColor: resolvedTheme.isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.12)',
                      color: resolvedTheme.textColor,
                    }}
                    title="+1 minute"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* 2. Side Section: Controls and Tasks Columns Side-by-Side */}
          <div className="flex flex-row items-stretch gap-4 sm:gap-5">
            {/* Column A: Big Counter & Vertical Controls */}
            <div
              id="pomo-right-panel"
              className="flex flex-col items-center justify-between gap-5 p-5 rounded-3xl border transition-all shadow-xl"
              style={{
                backgroundColor: resolvedTheme.cardBg,
                borderColor: resolvedTheme.isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.12)',
              }}
            >
              {/* BIG COUNTER */}
              <div id="pomo-big-counter" className="flex flex-col items-center text-center px-2">
                <span className="text-[10px] font-mono uppercase tracking-widest text-neutral-400 font-bold mb-0.5">
                  SESSION
                </span>

                <div className="flex items-baseline justify-center gap-1 my-0.5">
                  <span
                    className="text-4xl sm:text-5xl font-black font-mono tracking-tight"
                    style={{ color: currentTheme.accent }}
                  >
                    {currentRound}
                  </span>
                  <span className="text-lg sm:text-xl font-mono text-neutral-400 font-medium">
                    /{settings.longBreakInterval}
                  </span>
                </div>

                <div className="flex items-center gap-2 mt-1.5 flex-wrap justify-center">
                  <div
                    className="flex items-center gap-1.5 px-3 py-1 rounded-full border font-mono font-bold text-xs shadow-sm transition-all"
                    title={`${completedRounds} focus session${completedRounds === 1 ? '' : 's'} completed today (resets at 12:00 AM midnight)`}
                    style={{
                      backgroundColor: `${currentTheme.accent}18`,
                      borderColor: `${currentTheme.accent}35`,
                      color: currentTheme.accent,
                    }}
                  >
                    <Flame className="w-3.5 h-3.5" />
                    <span className="text-sm font-extrabold">{completedRounds}</span>
                    <span className="text-[10px] uppercase font-medium opacity-80">Today</span>
                  </div>

                  {consecutiveStreak > 0 && (
                    <div
                      className="flex items-center gap-1 px-2.5 py-1 rounded-full border font-mono font-bold text-xs bg-amber-500/10 border-amber-500/30 text-amber-500 shadow-sm"
                      title={`${consecutiveStreak} consecutive day focus streak! Resets at 12:00 AM midnight if a full day is missed.`}
                    >
                      <span className="text-xs">🔥</span>
                      <span className="text-xs font-black">{consecutiveStreak}d</span>
                      <span className="text-[10px] uppercase font-medium opacity-80">Streak</span>
                    </div>
                  )}
                </div>

                {/* Progress Dots */}
                <div className="flex items-center gap-1.5 mt-3">
                  {Array.from({ length: settings.longBreakInterval }).map((_, i) => {
                    const isFilled = i < currentRound - 1;
                    const isCurrent = i === currentRound - 1;
                    return (
                      <div
                        key={i}
                        className={`h-2 rounded-full transition-all duration-300 ${
                          isFilled
                            ? 'w-4 shadow-sm'
                            : isCurrent
                            ? 'w-5 ring-1 ring-offset-1'
                            : resolvedTheme.isDark
                            ? 'w-2 bg-neutral-800'
                            : 'w-2 bg-neutral-300'
                        }`}
                        style={
                          isFilled || isCurrent
                            ? { backgroundColor: currentTheme.accent }
                            : undefined
                        }
                      />
                    );
                  })}
                </div>
              </div>

              {/* Divider */}
              <div className="w-full h-px bg-neutral-200 dark:bg-neutral-800" />

              {/* VERTICAL CONTROLS (SMALL BUTTONS) */}
              <div id="pomo-vertical-controls" className="flex flex-col items-center gap-2.5">
                {/* Play / Pause */}
                <button
                  id="pomo-play-pause-btn"
                  onClick={togglePlayPause}
                  className={`apple-hover w-10 h-10 rounded-xl flex items-center justify-center shadow-md cursor-pointer ${
                    isRunning
                      ? resolvedTheme.isDark
                        ? 'bg-neutral-800 hover:bg-neutral-700 border border-neutral-700'
                        : 'bg-neutral-100 hover:bg-neutral-200 border border-neutral-300'
                      : 'text-white font-bold'
                  }`}
                  style={
                    isRunning
                      ? { color: currentTheme.accent }
                      : { backgroundColor: currentTheme.accent, boxShadow: `0 4px 14px ${currentTheme.accent}40` }
                  }
                  title={isRunning ? 'Pause (Space)' : 'Start (Space)'}
                >
                  {isRunning ? (
                    <Pause className="w-4 h-4 fill-current" />
                  ) : (
                    <Play className="w-4 h-4 fill-current ml-0.5" />
                  )}
                </button>

                {/* Skip */}
                <button
                  id="pomo-skip-btn"
                  onClick={handleSkip}
                  className={`apple-icon-hover w-9 h-9 rounded-xl border flex items-center justify-center cursor-pointer ${
                    isDarkMode
                      ? 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:text-white hover:bg-neutral-800'
                      : 'bg-white border-neutral-300 text-neutral-600 hover:text-black hover:bg-neutral-50 shadow-sm'
                  }`}
                  title="Skip to next phase"
                >
                  <SkipForward className="w-4 h-4" />
                </button>

                {/* Reset */}
                <button
                  id="pomo-reset-btn"
                  onClick={handleReset}
                  className={`apple-icon-hover w-9 h-9 rounded-xl border flex items-center justify-center cursor-pointer ${
                    isDarkMode
                      ? 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:text-white hover:bg-neutral-800'
                      : 'bg-white border-neutral-300 text-neutral-600 hover:text-black hover:bg-neutral-50 shadow-sm'
                  }`}
                  title="Reset this session"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Column B: Vertical Tasks Tab beside the controls */}
            <div
              id="pomo-tasks-column"
              className="flex flex-col items-center justify-between p-4 sm:p-5 rounded-3xl border transition-all min-w-[90px] sm:min-w-[100px] shadow-xl"
              style={{
                backgroundColor: resolvedTheme.cardBg,
                borderColor: resolvedTheme.isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.12)',
              }}
            >
              {/* Tasks Header */}
              <div className="flex flex-col items-center gap-1.5 w-full">
                <span className="text-[10px] font-mono uppercase tracking-widest text-neutral-400 font-bold text-center">
                  TASKS
                </span>
                {/* Add Task Button */}
                <button
                  id="pomo-add-task-open-btn"
                  onClick={() => setIsTaskModalOpen(true)}
                  className="apple-icon-hover w-8 h-8 rounded-xl border flex items-center justify-center cursor-pointer shadow-sm"
                  style={{
                    backgroundColor: `${currentTheme.accent}18`,
                    borderColor: `${currentTheme.accent}45`,
                    color: currentTheme.accent,
                  }}
                  title="Add New Task (Name & Description)"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              {/* Numbered Task Buttons: 1, 2, 3... */}
              <div className="flex flex-col items-center gap-2.5 my-3 max-h-56 overflow-y-auto w-full py-1">
                {tasks.length === 0 ? (
                  <span className="text-[10px] text-neutral-500 text-center py-4">
                    Empty
                  </span>
                ) : (
                  tasks.map((task, idx) => {
                    const isHovered = hoveredTask?.id === task.id;
                    const isDone = task.isCompleted;
                    return (
                      <div
                        key={task.id}
                        className="relative group flex items-center"
                        onMouseEnter={() => setHoveredTask(task)}
                        onMouseLeave={() => setHoveredTask(null)}
                        onTouchStart={() => setHoveredTask(task)}
                        onTouchEnd={() => setHoveredTask(null)}
                      >
                        <button
                          id={`task-num-btn-${idx + 1}`}
                          onClick={() => handleToggleTaskCompleted(task.id)}
                          className={`apple-hover w-9 h-9 sm:w-10 sm:h-10 rounded-xl border flex items-center justify-center font-mono font-bold text-sm cursor-pointer select-none ${
                            isDone ? 'line-through' : ''
                          }`}
                          style={
                            isDone
                              ? {
                                  backgroundColor: 'rgba(16, 185, 129, 0.18)',
                                  borderColor: 'rgba(16, 185, 129, 0.45)',
                                  color: '#10b981',
                                }
                              : isHovered
                              ? {
                                  backgroundColor: currentTheme.accent,
                                  borderColor: currentTheme.accent,
                                  color: resolvedTheme.isDark ? '#000000' : '#ffffff',
                                  boxShadow: `0 4px 12px ${currentTheme.accent}40`,
                                  transform: 'scale(1.05)',
                                }
                              : {
                                  backgroundColor: resolvedTheme.isDark
                                    ? 'rgba(255, 255, 255, 0.06)'
                                    : 'rgba(0, 0, 0, 0.04)',
                                  borderColor: resolvedTheme.isDark
                                    ? 'rgba(255, 255, 255, 0.12)'
                                    : 'rgba(0, 0, 0, 0.12)',
                                  color: resolvedTheme.textColor,
                                }
                          }
                          title={`Task ${idx + 1}: ${task.title}. Click to toggle completed.`}
                        >
                          {isDone ? (
                            <Check className="w-4 h-4 stroke-[3]" />
                          ) : (
                            idx + 1
                          )}
                        </button>

                        {/* Quick Delete on hover */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteTask(task.id);
                            if (hoveredTask?.id === task.id) setHoveredTask(null);
                          }}
                          className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer shadow"
                          title="Delete task"
                        >
                          <Trash2 className="w-2.5 h-2.5" />
                        </button>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Task Count Indicator */}
              <span className="text-[10px] font-mono text-neutral-500">
                {tasks.filter((t) => t.isCompleted).length}/{tasks.length}
              </span>
            </div>
          </div>
        </div>

        {/* Task Creation Dialog (Asks 1. Task Name, 2. Task Description) */}
        {isTaskModalOpen && (
          <div
            id="task-create-modal"
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn"
            onClick={(e) => {
              if (e.target === e.currentTarget) setIsTaskModalOpen(false);
            }}
          >
            <div
              className="w-full max-w-md p-6 rounded-2xl border shadow-2xl space-y-4"
              style={{
                backgroundColor: resolvedTheme.isDark ? '#11121a' : '#ffffff',
                borderColor: resolvedTheme.isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.15)',
                color: resolvedTheme.textColor,
              }}
            >
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold flex items-center gap-2">
                  <Plus className="w-4 h-4" style={{ color: currentTheme.accent }} />
                  <span>Create Task #{tasks.length + 1}</span>
                </h3>
                <button
                  onClick={() => setIsTaskModalOpen(false)}
                  className="p-1 rounded-lg hover:bg-neutral-800/20 text-neutral-400 hover:text-white cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleAddTask} className="space-y-4">
                {/* 1. Task Name */}
                <div className="space-y-1.5">
                  <label htmlFor="new-task-name-input" className="text-xs font-semibold text-neutral-400 uppercase tracking-wider block">
                    1. Task Name <span style={{ color: currentTheme.accent }}>*</span>
                  </label>
                  <input
                    id="new-task-name-input"
                    type="text"
                    required
                    placeholder="What are you working on?"
                    value={newTaskTitle}
                    onChange={(e) => setNewTaskTitle(e.target.value)}
                    maxLength={80}
                    className={`w-full px-3.5 py-2.5 rounded-xl text-sm border focus:outline-none ${
                      resolvedTheme.isDark ? 'bg-neutral-950 border-neutral-800 text-white' : 'bg-neutral-50 border-neutral-300 text-neutral-900'
                    }`}
                    style={{
                      focusRingColor: currentTheme.accent,
                    }}
                    autoFocus
                  />
                </div>

                {/* 2. Task Description */}
                <div className="space-y-1.5">
                  <label htmlFor="new-task-desc-input" className="text-xs font-semibold text-neutral-400 uppercase tracking-wider block">
                    2. Task Description
                  </label>
                  <textarea
                    id="new-task-desc-input"
                    rows={3}
                    placeholder="Details, key goals, or notes for this task..."
                    value={newTaskDescription}
                    onChange={(e) => setNewTaskDescription(e.target.value)}
                    maxLength={200}
                    className={`w-full px-3.5 py-2.5 rounded-xl text-xs border focus:outline-none resize-none ${
                      resolvedTheme.isDark ? 'bg-neutral-950 border-neutral-800 text-white' : 'bg-neutral-50 border-neutral-300 text-neutral-900'
                    }`}
                  />
                </div>

                <div className="flex items-center justify-end gap-2.5 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsTaskModalOpen(false)}
                    className="px-4 py-2 rounded-xl border text-xs font-medium cursor-pointer hover:bg-neutral-800/10"
                    style={{
                      borderColor: resolvedTheme.isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.15)',
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={!newTaskTitle.trim()}
                    className="px-5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer disabled:opacity-40 shadow-md"
                    style={{
                      backgroundColor: currentTheme.accent,
                      color: resolvedTheme.isDark ? '#000000' : '#ffffff',
                      boxShadow: `0 4px 14px ${currentTheme.accent}35`,
                    }}
                  >
                    Save Task
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};
