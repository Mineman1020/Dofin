import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  BarChart,
  Bar,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Cell,
} from 'recharts';
import {
  ArrowLeft,
  Clock,
  Timer,
  CheckCircle2,
  Settings,
  Maximize,
  Minimize,
  Flame,
  Trophy,
  Calendar,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  Target,
  BarChart3,
  RotateCcw,
  Sparkles,
  Plus,
  Users,
  Keyboard,
} from 'lucide-react';
import { ClockSettings, PomodoroSettings } from '../types';
import {
  getWeeklyStats,
  formatMinutesHuman,
  recordFocusMinutes,
  recordTaskCompletion,
  resetStatsToDemo,
  DayStatsRecord,
  getStreakTelemetry,
} from '../utils/statsStorage';

interface StatsViewProps {
  clockSettings: ClockSettings;
  pomodoroSettings: PomodoroSettings;
  onGoToWelcome: () => void;
  onGoToClock: () => void;
  onGoToPomodoro: () => void;
  onGoToTasks: () => void;
  onOpenSettings: () => void;
  onOpenParties?: (tab?: 'leaderboard' | 'my-parties' | 'create' | 'join') => void;
  onOpenShortcuts?: () => void;
  userName: string;
  isDarkMode: boolean;
  onToggleDarkMode?: () => void;
}

export const StatsView: React.FC<StatsViewProps> = ({
  clockSettings,
  onGoToWelcome,
  onGoToClock,
  onGoToPomodoro,
  onGoToTasks,
  onOpenSettings,
  onOpenParties,
  onOpenShortcuts,
  userName,
  isDarkMode,
  onToggleDarkMode,
}) => {
  const [weekOffset, setWeekOffset] = useState<number>(0);
  const [chartViewMode, setChartViewMode] = useState<'combined' | 'focus' | 'tasks' | 'cumulative'>('combined');
  const [unitMode, setUnitMode] = useState<'minutes' | 'hours'>('minutes');
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [refreshTrigger, setRefreshTrigger] = useState<number>(0);

  // Compute weekly statistics
  const weeklyData = useMemo(() => {
    return getWeeklyStats(weekOffset);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [weekOffset, refreshTrigger]);

  // Compute live streak and today's telemetry
  const streakInfo = useMemo(() => {
    return getStreakTelemetry();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshTrigger]);

  // Fullscreen toggle handler
  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
        setIsFullscreen(true);
      } else {
        await document.exitFullscreen();
        setIsFullscreen(false);
      }
    } catch (e) {
      console.warn('Fullscreen error:', e);
    }
  };

  // Add quick simulated focus session for rapid testing
  const handleQuickAddSession = (minutes: number = 25) => {
    recordFocusMinutes(minutes, true);
    setRefreshTrigger((prev) => prev + 1);
  };

  // Add quick simulated completed task
  const handleQuickAddTask = () => {
    recordTaskCompletion(1);
    setRefreshTrigger((prev) => prev + 1);
  };

  // Reset demo stats
  const handleResetData = () => {
    if (window.confirm('Reset weekly focus & task statistics to default baseline?')) {
      resetStatsToDemo();
      setRefreshTrigger((prev) => prev + 1);
    }
  };

  // Chart data formatted for Recharts
  const chartData = useMemo(() => {
    return weeklyData.days.map((d) => ({
      ...d,
      focusDisplay:
        unitMode === 'hours' ? +(d.focusMinutes / 60).toFixed(1) : d.focusMinutes,
      tasksDisplay: d.tasksCompleted,
    }));
  }, [weeklyData.days, unitMode]);

  // Cumulative data for progression curve
  const cumulativeData = useMemo(() => {
    let accMinutes = 0;
    let accTasks = 0;
    return weeklyData.days.map((d) => {
      accMinutes += d.focusMinutes;
      accTasks += d.tasksCompleted;
      return {
        dayName: d.dayName,
        date: d.date,
        cumulativeMinutes: unitMode === 'hours' ? +(accMinutes / 60).toFixed(1) : accMinutes,
        cumulativeTasks: accTasks,
        isToday: d.isToday,
      };
    });
  }, [weeklyData.days, unitMode]);

  // Theme styling helpers
  const bgClass = isDarkMode
    ? 'bg-neutral-950 text-neutral-100'
    : 'bg-[#f7f5f0] text-neutral-900';
  const cardBgClass = isDarkMode
    ? 'bg-neutral-900/70 border-neutral-800/80 shadow-lg'
    : 'bg-white border-neutral-200/90 shadow-sm';
  const subtextClass = isDarkMode ? 'text-neutral-400' : 'text-neutral-500';
  const gridStroke = isDarkMode ? 'rgba(255, 255, 255, 0.07)' : 'rgba(0, 0, 0, 0.06)';
  const tickFill = isDarkMode ? '#a3a3a3' : '#737373';

  // Custom Tooltip for Recharts
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const dataItem: DayStatsRecord = payload[0].payload;
      return (
        <div
          className={`p-3.5 rounded-2xl shadow-xl backdrop-blur-xl border text-xs space-y-1.5 ${
            isDarkMode
              ? 'bg-neutral-900/95 border-neutral-700/80 text-white'
              : 'bg-white/95 border-neutral-200 text-neutral-900 shadow-neutral-200'
          }`}
        >
          <div className="flex items-center justify-between gap-4 border-b pb-1.5 border-neutral-700/40">
            <span className="font-bold text-sm">{dataItem.fullDateLabel}</span>
            {dataItem.isToday && (
              <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-500 font-bold text-[10px]">
                Today
              </span>
            )}
          </div>
          <div className="flex items-center justify-between gap-4 pt-1">
            <span className="flex items-center gap-1.5 text-amber-500 font-medium">
              <Clock className="w-3.5 h-3.5" /> Focus Time:
            </span>
            <span className="font-mono font-bold text-sm">
              {formatMinutesHuman(dataItem.focusMinutes)}
            </span>
          </div>
          <div className="flex items-center justify-between gap-4">
            <span className="flex items-center gap-1.5 text-emerald-500 font-medium">
              <CheckCircle2 className="w-3.5 h-3.5" /> Completed Tasks:
            </span>
            <span className="font-mono font-bold text-sm">{dataItem.tasksCompleted} tasks</span>
          </div>
          <div className="flex items-center justify-between gap-4">
            <span className="flex items-center gap-1.5 text-sky-400 font-medium">
              <Timer className="w-3.5 h-3.5" /> Focus Sessions:
            </span>
            <span className="font-mono font-bold text-sm">{dataItem.completedSessions} rounds</span>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div
      id="stats-view-container"
      className={`relative w-full h-screen overflow-hidden flex flex-col justify-between font-sans select-none transition-colors duration-500 ${bgClass}`}
    >
      {/* Ambient background soft glow */}
      <div
        className={`absolute top-0 right-1/4 w-[500px] h-[350px] rounded-full blur-[150px] pointer-events-none ${
          isDarkMode ? 'bg-amber-500/10' : 'bg-amber-500/5'
        }`}
      />
      <div
        className={`absolute bottom-0 left-1/4 w-[500px] h-[350px] rounded-full blur-[150px] pointer-events-none ${
          isDarkMode ? 'bg-sky-500/10' : 'bg-sky-500/5'
        }`}
      />

      {/* Top Header & Navigation Bar */}
      <header className="w-full px-4 sm:px-8 py-2.5 sm:py-3 flex items-center justify-between z-20 shrink-0 border-b border-neutral-200/50 dark:border-neutral-800/50">
        <div className="flex items-center gap-3">
          <button
            id="stats-back-to-welcome-btn"
            onClick={onGoToWelcome}
            className={`apple-hover flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold border cursor-pointer shadow-xs ${
              isDarkMode
                ? 'border-neutral-800 bg-neutral-900/80 hover:bg-neutral-800 text-neutral-300 hover:text-white'
                : 'border-neutral-300/80 bg-white hover:bg-neutral-50 text-neutral-700 hover:text-black'
            }`}
            title="Return to Hub (Esc)"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Hub</span>
          </button>

          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 text-white flex items-center justify-center shadow-md shrink-0">
              <BarChart3 className="w-4 h-4" />
            </div>
            <div>
              <h1 className="text-sm sm:text-base font-bold tracking-tight leading-tight">
                Weekly Insights & Progress
              </h1>
              <p className={`text-[10px] sm:text-[11px] ${subtextClass} hidden sm:block`}>
                Focus time, task completion velocity, and weekly rhythm
              </p>
            </div>
          </div>
        </div>

        {/* Action Controls & Navigation Shortcuts */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Quick Task Tracker Switch */}
          <button
            id="stats-to-tasks-btn"
            onClick={onGoToTasks}
            className={`apple-hover flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-medium border cursor-pointer shadow-xs ${
              isDarkMode
                ? 'border-neutral-800 bg-neutral-900/80 hover:bg-neutral-800 text-neutral-300'
                : 'border-neutral-300/80 bg-white hover:bg-neutral-50 text-neutral-800'
            }`}
            title="Switch to Task Tracker (T)"
          >
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
            <span className="hidden sm:inline">Tasks</span>
          </button>

          {/* Fullscreen Toggle */}
          <button
            id="stats-fullscreen-btn"
            onClick={toggleFullscreen}
            className={`apple-icon-hover p-2 rounded-xl border text-xs cursor-pointer shadow-xs ${
              isDarkMode
                ? 'border-neutral-800 bg-neutral-900/80 hover:bg-neutral-800 text-neutral-300 hover:text-white'
                : 'border-neutral-300/80 bg-white hover:bg-neutral-50 text-neutral-700'
            }`}
            title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
          >
            {isFullscreen ? <Minimize className="w-3.5 h-3.5" /> : <Maximize className="w-3.5 h-3.5" />}
          </button>

          {/* Shortcuts Guide Button */}
          {onOpenShortcuts && (
            <button
              id="stats-shortcuts-btn"
              onClick={onOpenShortcuts}
              className={`apple-icon-hover p-2 rounded-xl border text-xs cursor-pointer shadow-xs ${
                isDarkMode
                  ? 'border-neutral-800 bg-neutral-900/80 hover:bg-neutral-800 text-neutral-300 hover:text-white'
                  : 'border-neutral-300/80 bg-white hover:bg-neutral-50 text-neutral-700'
              }`}
              title="Keyboard Shortcuts (? or \)"
            >
              <Keyboard className="w-4 h-4" />
            </button>
          )}

          {/* Settings */}
          <button
            id="stats-settings-btn"
            onClick={onOpenSettings}
            className={`apple-icon-hover p-2 rounded-xl border text-xs cursor-pointer shadow-xs ${
              isDarkMode
                ? 'border-neutral-800 bg-neutral-900/80 hover:bg-neutral-800 text-neutral-300 hover:text-white'
                : 'border-neutral-300/80 bg-white hover:bg-neutral-50 text-neutral-700'
            }`}
            title="Open Display Settings (S)"
          >
            <Settings className="w-3.5 h-3.5" />
          </button>
        </div>
      </header>

      {/* Main Dashboard Content - Viewport Fitted Full Width */}
      <main className="w-full px-4 sm:px-8 py-2 sm:py-3 flex-1 min-h-0 flex flex-col gap-2.5 overflow-y-auto lg:overflow-hidden">
        {/* Date Selector & Top Controls Row */}
        <div className="flex flex-wrap items-center justify-between gap-2 pb-1.5 border-b border-neutral-200/50 dark:border-neutral-800/50 shrink-0">
          {/* Week Navigation */}
          <div className="flex items-center gap-2">
            <div
              className={`flex items-center rounded-xl border p-0.5 shadow-xs ${
                isDarkMode ? 'bg-neutral-900/80 border-neutral-800' : 'bg-white border-neutral-300'
              }`}
            >
              <button
                id="stats-prev-week-btn"
                onClick={() => setWeekOffset((prev) => prev - 1)}
                className={`p-1 rounded-lg transition-colors cursor-pointer ${
                  isDarkMode ? 'hover:bg-neutral-800 text-neutral-300' : 'hover:bg-neutral-100 text-neutral-700'
                }`}
                title="Previous Week"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>

              <div className="px-2.5 text-xs font-semibold flex items-center gap-1.5">
                <Calendar className="w-3 h-3 text-amber-500" />
                <span>{weeklyData.weekRangeLabel}</span>
                {weekOffset === 0 && (
                  <span className="px-1.5 py-0.2 rounded-full text-[9px] bg-amber-500/15 text-amber-500 font-bold border border-amber-500/30">
                    Current
                  </span>
                )}
              </div>

              <button
                id="stats-next-week-btn"
                onClick={() => setWeekOffset((prev) => Math.min(1, prev + 1))}
                className={`p-1 rounded-lg transition-colors cursor-pointer ${
                  isDarkMode ? 'hover:bg-neutral-800 text-neutral-300' : 'hover:bg-neutral-100 text-neutral-700'
                }`}
                title="Next Week"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {weekOffset !== 0 && (
              <button
                onClick={() => setWeekOffset(0)}
                className={`text-xs px-2.5 py-1 rounded-xl border font-medium cursor-pointer ${
                  isDarkMode
                    ? 'border-neutral-800 bg-neutral-900 hover:bg-neutral-800 text-neutral-300'
                    : 'border-neutral-300 bg-white hover:bg-neutral-50 text-neutral-700'
                }`}
              >
                Today
              </button>
            )}
          </div>

          {/* Quick Actions & Units */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Minutes vs Hours toggle */}
            <div
              className={`flex items-center rounded-xl border p-0.5 text-xs font-medium shadow-xs ${
                isDarkMode ? 'bg-neutral-900/80 border-neutral-800' : 'bg-white border-neutral-300'
              }`}
            >
              <button
                onClick={() => setUnitMode('minutes')}
                className={`px-2 py-0.5 rounded-lg transition-all cursor-pointer ${
                  unitMode === 'minutes'
                    ? 'bg-amber-500 text-white font-bold shadow-xs'
                    : 'text-neutral-500 hover:text-neutral-300'
                }`}
              >
                Min
              </button>
              <button
                onClick={() => setUnitMode('hours')}
                className={`px-2 py-0.5 rounded-lg transition-all cursor-pointer ${
                  unitMode === 'hours'
                    ? 'bg-amber-500 text-white font-bold shadow-xs'
                    : 'text-neutral-500 hover:text-neutral-300'
                }`}
              >
                Hrs
              </button>
            </div>

            {/* Quick Log Test Buttons */}
            <div className="flex items-center gap-1.5">
              <button
                id="stats-add-session-btn"
                onClick={() => handleQuickAddSession(25)}
                className={`apple-hover flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-semibold border cursor-pointer ${
                  isDarkMode
                    ? 'border-amber-500/40 bg-amber-500/10 text-amber-400 hover:bg-amber-500/20'
                    : 'border-amber-500/40 bg-amber-50 text-amber-600 hover:bg-amber-100'
                }`}
                title="Simulate recording a 25-minute completed focus session"
              >
                <Plus className="w-3 h-3" />
                <span>+25m</span>
              </button>

              <button
                id="stats-add-task-btn"
                onClick={handleQuickAddTask}
                className={`apple-hover flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-semibold border cursor-pointer ${
                  isDarkMode
                    ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20'
                    : 'border-emerald-500/40 bg-emerald-50 text-emerald-600 hover:bg-emerald-100'
                }`}
                title="Simulate completing a task"
              >
                <Plus className="w-3 h-3" />
                <span>+1 Task</span>
              </button>

              <button
                id="stats-reset-btn"
                onClick={handleResetData}
                className={`apple-icon-hover p-1 rounded-xl border text-neutral-400 hover:text-neutral-200 cursor-pointer ${
                  isDarkMode ? 'border-neutral-800 hover:bg-neutral-800' : 'border-neutral-300 hover:bg-neutral-100'
                }`}
                title="Reset statistics to default baseline"
              >
                <RotateCcw className="w-3 h-3" />
              </button>
            </div>
          </div>
        </div>

        {/* 4 Summary KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-2.5 shrink-0">
          {/* Card 1: Total Focus Time */}
          <div className={`rounded-2xl p-2.5 sm:p-3 border flex flex-col justify-between ${cardBgClass}`}>
            <div className="flex items-center justify-between mb-1">
              <span className={`text-[10px] sm:text-xs font-semibold uppercase tracking-wider ${subtextClass}`}>
                Total Focus Time
              </span>
              <div className="w-6 h-6 rounded-lg bg-amber-500/15 border border-amber-500/30 text-amber-500 flex items-center justify-center shrink-0">
                <Clock className="w-3 h-3" />
              </div>
            </div>
            <div>
              <div className="text-base sm:text-xl font-extrabold tracking-tight font-mono leading-tight">
                {formatMinutesHuman(weeklyData.totalFocusMinutes)}
              </div>
              <p className={`text-[10px] sm:text-[11px] mt-0.5 flex items-center gap-1 ${subtextClass} truncate`}>
                <span className="font-semibold text-amber-500">{weeklyData.totalSessions} sessions</span>
                <span>completed</span>
              </p>
            </div>
          </div>

          {/* Card 2: Completed Tasks */}
          <div className={`rounded-2xl p-2.5 sm:p-3 border flex flex-col justify-between ${cardBgClass}`}>
            <div className="flex items-center justify-between mb-1">
              <span className={`text-[10px] sm:text-xs font-semibold uppercase tracking-wider ${subtextClass}`}>
                Completed Tasks
              </span>
              <div className="w-6 h-6 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-500 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-3 h-3" />
              </div>
            </div>
            <div>
              <div className="text-base sm:text-xl font-extrabold tracking-tight font-mono text-emerald-500 dark:text-emerald-400 leading-tight">
                {weeklyData.totalTasksCompleted}
                <span className="text-xs font-normal text-neutral-500 ml-1">tasks</span>
              </div>
              <p className={`text-[10px] sm:text-[11px] mt-0.5 flex items-center gap-1 ${subtextClass} truncate`}>
                <TrendingUp className="w-3 h-3 text-emerald-500 shrink-0" />
                <span>Across 7 days tracking</span>
              </p>
            </div>
          </div>

          {/* Card 3: Daily Average Focus */}
          <div className={`rounded-2xl p-2.5 sm:p-3 border flex flex-col justify-between ${cardBgClass}`}>
            <div className="flex items-center justify-between mb-1">
              <span className={`text-[10px] sm:text-xs font-semibold uppercase tracking-wider ${subtextClass}`}>
                Daily Average
              </span>
              <div className="w-6 h-6 rounded-lg bg-sky-500/15 border border-sky-500/30 text-sky-500 flex items-center justify-center shrink-0">
                <Target className="w-3 h-3" />
              </div>
            </div>
            <div>
              <div className="text-base sm:text-xl font-extrabold tracking-tight font-mono leading-tight">
                {formatMinutesHuman(weeklyData.averageDailyMinutes)}
                <span className="text-[10px] font-normal text-neutral-500 ml-1">/day</span>
              </div>
              <p className={`text-[10px] sm:text-[11px] mt-0.5 flex items-center gap-1 ${subtextClass} truncate`}>
                <span className="text-sky-500 font-semibold">{weeklyData.activeDaysCount} of 7 days</span>
                <span>active focus</span>
              </p>
            </div>
          </div>

          {/* Card 4: Peak Productive Day & Streak */}
          <div className={`rounded-2xl p-2.5 sm:p-3 border flex flex-col justify-between ${cardBgClass}`}>
            <div className="flex items-center justify-between mb-1">
              <span className={`text-[10px] sm:text-xs font-semibold uppercase tracking-wider ${subtextClass}`}>
                Peak Day & Streak
              </span>
              <div className="w-6 h-6 rounded-lg bg-rose-500/15 border border-rose-500/30 text-rose-500 flex items-center justify-center shrink-0">
                <Flame className="w-3 h-3" />
              </div>
            </div>
            <div>
              <div className="flex items-baseline justify-between gap-1">
                <div className="text-sm sm:text-base font-extrabold tracking-tight truncate leading-tight">
                  {weeklyData.peakDay ? weeklyData.peakDay.dayName : 'Pending'}
                </div>
                {streakInfo.consecutiveDays > 0 && (
                  <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-full bg-amber-500/15 text-amber-500 border border-amber-500/30">
                    🔥 {streakInfo.consecutiveDays}d streak
                  </span>
                )}
              </div>
              <p className={`text-[10px] sm:text-[11px] mt-0.5 flex items-center gap-1 ${subtextClass} truncate`}>
                <span>Today: {streakInfo.todayCompletedRounds} rounds completed</span>
                <span className="text-neutral-400">• resets 12:00 AM</span>
              </p>
            </div>
          </div>
        </div>

        {/* Main Dashboard Interactive Grid: Chart & Daily Breakdown */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-2.5 sm:gap-3 flex-1 min-h-0">
          {/* Left: Interactive Recharts Visualizer */}
          <div
            className={`lg:col-span-7 xl:col-span-8 rounded-2xl sm:rounded-3xl p-3 sm:p-4 border flex flex-col justify-between ${cardBgClass} min-h-[250px]`}
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 mb-1 shrink-0">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xs sm:text-sm font-bold tracking-tight">
                    {chartViewMode === 'cumulative'
                      ? 'Cumulative Weekly Momentum'
                      : 'Daily Focus & Completed Tasks Distribution'}
                  </h2>
                  <span className="text-[9px] font-mono px-1.5 py-0.2 rounded-full bg-amber-500/15 text-amber-500 font-bold border border-amber-500/30">
                    Recharts
                  </span>
                </div>
                <p className={`text-[10px] sm:text-[11px] ${subtextClass}`}>
                  {chartViewMode === 'cumulative'
                    ? 'Day-by-day accumulation of focused time'
                    : 'Compare daily focus duration against task completions'}
                </p>
              </div>

              {/* Chart Mode Filter Tabs */}
              <div
                className={`flex items-center rounded-xl border p-0.5 text-[10px] sm:text-[11px] font-semibold self-start sm:self-auto shrink-0 ${
                  isDarkMode ? 'bg-neutral-950 border-neutral-800' : 'bg-neutral-100 border-neutral-300'
                }`}
              >
                <button
                  onClick={() => setChartViewMode('combined')}
                  className={`px-2 py-0.5 rounded-lg transition-all cursor-pointer ${
                    chartViewMode === 'combined'
                      ? 'bg-amber-500 text-white shadow-xs'
                      : 'text-neutral-500 hover:text-neutral-300'
                  }`}
                >
                  Combined
                </button>
                <button
                  onClick={() => setChartViewMode('focus')}
                  className={`px-2 py-0.5 rounded-lg transition-all cursor-pointer ${
                    chartViewMode === 'focus'
                      ? 'bg-amber-500 text-white shadow-xs'
                      : 'text-neutral-500 hover:text-neutral-300'
                  }`}
                >
                  Focus
                </button>
                <button
                  onClick={() => setChartViewMode('tasks')}
                  className={`px-2 py-0.5 rounded-lg transition-all cursor-pointer ${
                    chartViewMode === 'tasks'
                      ? 'bg-emerald-500 text-white shadow-xs'
                      : 'text-neutral-500 hover:text-neutral-300'
                  }`}
                >
                  Tasks
                </button>
                <button
                  onClick={() => setChartViewMode('cumulative')}
                  className={`px-2 py-0.5 rounded-lg transition-all cursor-pointer ${
                    chartViewMode === 'cumulative'
                      ? 'bg-amber-500 text-white shadow-xs'
                      : 'text-neutral-500 hover:text-neutral-300'
                  }`}
                >
                  Momentum
                </button>
              </div>
            </div>

            {/* Recharts Canvas */}
            <div className="w-full flex-1 min-h-[180px]">
              <ResponsiveContainer width="100%" height="100%">
                {chartViewMode === 'combined' ? (
                  <ComposedChart data={chartData} margin={{ top: 10, right: 10, bottom: 5, left: -10 }}>
                    <defs>
                      <linearGradient id="focusGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#f59e0b" stopOpacity={0.9} />
                        <stop offset="100%" stopColor="#f59e0b" stopOpacity={0.35} />
                      </linearGradient>
                      <linearGradient id="focusTodayGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#fbbf24" stopOpacity={1} />
                        <stop offset="100%" stopColor="#d97706" stopOpacity={0.7} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridStroke} />
                    <XAxis
                      dataKey="dayName"
                      stroke={tickFill}
                      fontSize={11}
                      tickLine={false}
                      axisLine={{ stroke: gridStroke }}
                    />
                    <YAxis
                      yAxisId="left"
                      stroke={tickFill}
                      fontSize={11}
                      tickLine={false}
                      axisLine={false}
                      unit={unitMode === 'hours' ? 'h' : 'm'}
                    />
                    <YAxis
                      yAxisId="right"
                      orientation="right"
                      stroke={tickFill}
                      fontSize={11}
                      tickLine={false}
                      axisLine={false}
                      unit=" t"
                      allowDecimals={false}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend
                      verticalAlign="top"
                      height={28}
                      wrapperStyle={{ fontSize: '11px', paddingBottom: '4px' }}
                    />
                    <Bar
                      yAxisId="left"
                      dataKey="focusDisplay"
                      name={unitMode === 'hours' ? 'Focus (hrs)' : 'Focus (min)'}
                      radius={[6, 6, 0, 0]}
                      maxBarSize={40}
                    >
                      {chartData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={entry.isToday ? 'url(#focusTodayGradient)' : 'url(#focusGradient)'}
                        />
                      ))}
                    </Bar>
                    <Line
                      yAxisId="right"
                      type="monotone"
                      dataKey="tasksDisplay"
                      name="Completed Tasks"
                      stroke="#10b981"
                      strokeWidth={2.5}
                      dot={{ r: 4, fill: '#10b981', strokeWidth: 2, stroke: isDarkMode ? '#171717' : '#ffffff' }}
                      activeDot={{ r: 6, stroke: '#10b981', strokeWidth: 2 }}
                    />
                  </ComposedChart>
                ) : chartViewMode === 'focus' ? (
                  <BarChart data={chartData} margin={{ top: 10, right: 10, bottom: 5, left: -10 }}>
                    <defs>
                      <linearGradient id="focusSingleGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#f59e0b" stopOpacity={0.9} />
                        <stop offset="100%" stopColor="#b45309" stopOpacity={0.3} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridStroke} />
                    <XAxis
                      dataKey="dayName"
                      stroke={tickFill}
                      fontSize={11}
                      tickLine={false}
                      axisLine={{ stroke: gridStroke }}
                    />
                    <YAxis
                      stroke={tickFill}
                      fontSize={11}
                      tickLine={false}
                      axisLine={false}
                      unit={unitMode === 'hours' ? 'h' : 'm'}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar
                      dataKey="focusDisplay"
                      name={unitMode === 'hours' ? 'Focus Time (hrs)' : 'Focus Time (min)'}
                      fill="url(#focusSingleGradient)"
                      radius={[6, 6, 0, 0]}
                      maxBarSize={48}
                    />
                  </BarChart>
                ) : chartViewMode === 'tasks' ? (
                  <BarChart data={chartData} margin={{ top: 10, right: 10, bottom: 5, left: -10 }}>
                    <defs>
                      <linearGradient id="taskSingleGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#10b981" stopOpacity={0.9} />
                        <stop offset="100%" stopColor="#047857" stopOpacity={0.3} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridStroke} />
                    <XAxis
                      dataKey="dayName"
                      stroke={tickFill}
                      fontSize={11}
                      tickLine={false}
                      axisLine={{ stroke: gridStroke }}
                    />
                    <YAxis
                      stroke={tickFill}
                      fontSize={11}
                      tickLine={false}
                      axisLine={false}
                      unit=" tasks"
                      allowDecimals={false}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar
                      dataKey="tasksDisplay"
                      name="Completed Tasks"
                      fill="url(#taskSingleGradient)"
                      radius={[6, 6, 0, 0]}
                      maxBarSize={48}
                    />
                  </BarChart>
                ) : (
                  <AreaChart data={cumulativeData} margin={{ top: 10, right: 10, bottom: 5, left: -10 }}>
                    <defs>
                      <linearGradient id="momentumGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#f59e0b" stopOpacity={0.5} />
                        <stop offset="100%" stopColor="#f59e0b" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridStroke} />
                    <XAxis dataKey="dayName" stroke={tickFill} fontSize={11} tickLine={false} />
                    <YAxis stroke={tickFill} fontSize={11} tickLine={false} unit={unitMode === 'hours' ? 'h' : 'm'} />
                    <Tooltip
                      formatter={(value: any) => [
                        unitMode === 'hours' ? `${value} hrs` : `${value} mins`,
                        'Cumulative Focus',
                      ]}
                      contentStyle={{
                        backgroundColor: isDarkMode ? '#171717' : '#ffffff',
                        borderColor: isDarkMode ? '#404040' : '#e5e5e5',
                        borderRadius: '10px',
                        fontSize: '11px',
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="cumulativeMinutes"
                      stroke="#f59e0b"
                      strokeWidth={2.5}
                      fill="url(#momentumGradient)"
                    />
                  </AreaChart>
                )}
              </ResponsiveContainer>
            </div>

            <div className="flex items-center justify-between text-[10px] pt-1.5 border-t border-neutral-200/50 dark:border-neutral-800/50 text-neutral-400 shrink-0">
              <span>Click "+25m" or "+1 Task" to test live updates</span>
              <span className="font-semibold text-amber-500">{weeklyData.activeDaysCount} active days recorded</span>
            </div>
          </div>

          {/* Right: Daily Rhythm & Breakdown */}
          <div
            className={`lg:col-span-5 xl:col-span-4 rounded-2xl sm:rounded-3xl p-3 sm:p-4 border flex flex-col justify-between ${cardBgClass} min-h-[250px]`}
          >
            <div className="flex items-center justify-between mb-1.5 shrink-0">
              <div className="flex items-center gap-1.5">
                <Trophy className="w-4 h-4 text-emerald-500" />
                <h3 className="text-xs sm:text-sm font-bold">Daily Rhythm & Breakdown</h3>
              </div>
              <span className="text-[9px] font-semibold px-2 py-0.5 rounded-full border border-neutral-300 dark:border-neutral-700 bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400">
                7-Day Overview
              </span>
            </div>

            {/* 7 Day Rows */}
            <div className="flex-1 min-h-0 space-y-1.5 overflow-y-auto pr-0.5 py-0.5">
              {weeklyData.days.map((day) => {
                const maxMinutesInWeek = Math.max(120, ...weeklyData.days.map((d) => d.focusMinutes));
                const progressPct = Math.min(100, Math.round((day.focusMinutes / maxMinutesInWeek) * 100));

                return (
                  <div
                    key={day.date}
                    className={`px-2 py-1.5 rounded-xl border transition-all flex items-center justify-between gap-2 text-xs ${
                      day.isToday
                        ? 'border-amber-500/50 bg-amber-500/10'
                        : isDarkMode
                        ? 'border-neutral-800/80 bg-neutral-900/50 hover:bg-neutral-800/60'
                        : 'border-neutral-200 bg-neutral-50 hover:bg-neutral-100'
                    }`}
                  >
                    <div className="w-20 flex items-center gap-1.5 shrink-0">
                      <span className="font-bold text-[11px]">{day.dayName}</span>
                      {day.isToday && (
                        <span className="text-[8px] font-bold px-1.5 py-0.2 rounded-full bg-amber-500 text-white">
                          Today
                        </span>
                      )}
                    </div>

                    {/* Progress Bar */}
                    <div className="flex-1">
                      <div className="w-full bg-neutral-200 dark:bg-neutral-800 h-1.5 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            day.isToday
                              ? 'bg-amber-400'
                              : day.focusMinutes > 0
                              ? 'bg-amber-500/80'
                              : 'bg-transparent'
                          }`}
                          style={{ width: `${progressPct}%` }}
                        />
                      </div>
                    </div>

                    {/* Metrics */}
                    <div className="flex items-center gap-2 text-right shrink-0">
                      <span className="font-mono text-[11px] font-bold w-12">
                        {formatMinutesHuman(day.focusMinutes)}
                      </span>
                      <div className="flex items-center gap-1 w-9 text-[10px] text-emerald-500 font-semibold justify-end">
                        <CheckCircle2 className="w-3 h-3 shrink-0" />
                        <span>{day.tasksCompleted}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="pt-1.5 border-t border-neutral-200/50 dark:border-neutral-800/50 flex items-center justify-between text-[10px] sm:text-[11px] text-neutral-400 shrink-0">
              <span>Weekly Completion Velocity</span>
              <span className="font-bold text-emerald-500 font-mono">
                {weeklyData.totalTasksCompleted} tasks done
              </span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};
