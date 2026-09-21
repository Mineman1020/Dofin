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
} from 'lucide-react';
import { ClockSettings, PomodoroSettings } from '../types';
import {
  getWeeklyStats,
  formatMinutesHuman,
  recordFocusMinutes,
  recordTaskCompletion,
  resetStatsToDemo,
  DayStatsRecord,
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
  userName,
  isDarkMode,
}) => {
  const [weekOffset, setWeekOffset] = useState<number>(0);
  const [chartViewMode, setChartViewMode] = useState<'combined' | 'focus' | 'tasks'>('combined');
  const [unitMode, setUnitMode] = useState<'minutes' | 'hours'>('minutes');
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [refreshTrigger, setRefreshTrigger] = useState<number>(0);

  // Compute weekly statistics
  const weeklyData = useMemo(() => {
    return getWeeklyStats(weekOffset);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [weekOffset, refreshTrigger]);

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
    : 'bg-neutral-50 text-neutral-900';
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
    <div className={`min-h-screen w-full flex flex-col font-sans transition-colors duration-300 ${bgClass}`}>
      {/* Top Header & Navigation Bar */}
      <header className="w-full max-w-7xl mx-auto px-4 sm:px-8 py-4 sm:py-6 flex items-center justify-between z-20">
        <div className="flex items-center gap-3">
          <button
            id="stats-back-to-welcome-btn"
            onClick={onGoToWelcome}
            className={`apple-hover flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold border cursor-pointer shadow-sm ${
              isDarkMode
                ? 'border-neutral-800 bg-neutral-900/80 hover:bg-neutral-800 text-neutral-300 hover:text-white'
                : 'border-neutral-300/80 bg-white hover:bg-neutral-50 text-neutral-700 hover:text-black'
            }`}
            title="Return to Hub"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Hub</span>
          </button>

          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 text-white flex items-center justify-center shadow-md">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-base sm:text-lg font-bold tracking-tight leading-tight">
                Weekly Insights & Progress
              </h1>
              <p className={`text-[11px] ${subtextClass} hidden sm:block`}>
                Daily focus time, task completion velocity, and weekly rhythm
              </p>
            </div>
          </div>
        </div>

        {/* Action Controls & Navigation Shortcuts */}
        <div className="flex items-center gap-2">
          {/* Quick Desk Clock Switch */}
          <button
            id="stats-to-clock-btn"
            onClick={onGoToClock}
            className={`apple-hover flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium border cursor-pointer shadow-sm ${
              isDarkMode
                ? 'border-neutral-800 bg-neutral-900/80 hover:bg-neutral-800 text-neutral-300'
                : 'border-neutral-300/80 bg-white hover:bg-neutral-50 text-neutral-800'
            }`}
            title="Switch to Desk Clock"
          >
            <Clock className="w-3.5 h-3.5 text-amber-500" />
            <span className="hidden md:inline">Clock</span>
          </button>

          {/* Quick Pomodoro Switch */}
          <button
            id="stats-to-pomodoro-btn"
            onClick={onGoToPomodoro}
            className={`apple-hover flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium border cursor-pointer shadow-sm ${
              isDarkMode
                ? 'border-neutral-800 bg-neutral-900/80 hover:bg-neutral-800 text-neutral-300'
                : 'border-neutral-300/80 bg-white hover:bg-neutral-50 text-neutral-800'
            }`}
            title="Switch to Pomodoro Timer"
          >
            <Timer className="w-3.5 h-3.5 text-rose-500" />
            <span className="hidden md:inline">Pomodoro</span>
          </button>

          {/* Quick Task Tracker Switch */}
          <button
            id="stats-to-tasks-btn"
            onClick={onGoToTasks}
            className={`apple-hover flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium border cursor-pointer shadow-sm ${
              isDarkMode
                ? 'border-neutral-800 bg-neutral-900/80 hover:bg-neutral-800 text-neutral-300'
                : 'border-neutral-300/80 bg-white hover:bg-neutral-50 text-neutral-800'
            }`}
            title="Switch to Task Tracker"
          >
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
            <span className="hidden md:inline">Tasks</span>
          </button>

          {/* Study & Work Parties */}
          {onOpenParties && (
            <button
              id="stats-parties-btn"
              onClick={() => onOpenParties('my-parties')}
              className={`apple-hover flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border cursor-pointer shadow-sm ${
                isDarkMode
                  ? 'border-amber-400/40 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300'
                  : 'border-amber-400/50 bg-amber-50/80 hover:bg-amber-100 text-amber-800'
              }`}
              title="Open Study & Work Parties & Leaderboard"
            >
              <Users className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden sm:inline">Parties</span>
            </button>
          )}

          {/* Fullscreen Toggle */}
          <button
            id="stats-fullscreen-btn"
            onClick={toggleFullscreen}
            className={`apple-icon-hover p-2 rounded-xl border text-xs cursor-pointer shadow-sm ${
              isDarkMode
                ? 'border-neutral-800 bg-neutral-900/80 hover:bg-neutral-800 text-neutral-300 hover:text-white'
                : 'border-neutral-300/80 bg-white hover:bg-neutral-50 text-neutral-700'
            }`}
            title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
          >
            {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
          </button>

          {/* Settings */}
          <button
            id="stats-settings-btn"
            onClick={onOpenSettings}
            className={`apple-icon-hover p-2 rounded-xl border text-xs cursor-pointer shadow-sm ${
              isDarkMode
                ? 'border-neutral-800 bg-neutral-900/80 hover:bg-neutral-800 text-neutral-300 hover:text-white'
                : 'border-neutral-300/80 bg-white hover:bg-neutral-50 text-neutral-700'
            }`}
            title="Open Display Settings"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main Dashboard Content */}
      <main className="w-full max-w-7xl mx-auto px-4 sm:px-8 pb-12 flex-1 flex flex-col gap-6">
        {/* Date Selector & Top Controls Row */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-neutral-200/60 dark:border-neutral-800/60">
          {/* Week Navigation */}
          <div className="flex items-center gap-2">
            <div
              className={`flex items-center rounded-2xl border p-1 shadow-sm ${
                isDarkMode ? 'bg-neutral-900/80 border-neutral-800' : 'bg-white border-neutral-300'
              }`}
            >
              <button
                id="stats-prev-week-btn"
                onClick={() => setWeekOffset((prev) => prev - 1)}
                className={`p-1.5 rounded-xl transition-colors cursor-pointer ${
                  isDarkMode ? 'hover:bg-neutral-800 text-neutral-300' : 'hover:bg-neutral-100 text-neutral-700'
                }`}
                title="Previous Week"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <div className="px-3 text-xs font-semibold flex items-center gap-2">
                <Calendar className="w-3.5 h-3.5 text-amber-500" />
                <span>{weeklyData.weekRangeLabel}</span>
                {weekOffset === 0 && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] bg-amber-500/15 text-amber-500 font-bold border border-amber-500/30">
                    Current
                  </span>
                )}
              </div>

              <button
                id="stats-next-week-btn"
                onClick={() => setWeekOffset((prev) => Math.min(1, prev + 1))}
                className={`p-1.5 rounded-xl transition-colors cursor-pointer ${
                  isDarkMode ? 'hover:bg-neutral-800 text-neutral-300' : 'hover:bg-neutral-100 text-neutral-700'
                }`}
                title="Next Week"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {weekOffset !== 0 && (
              <button
                onClick={() => setWeekOffset(0)}
                className={`text-xs px-3 py-1.5 rounded-xl border font-medium cursor-pointer ${
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
          <div className="flex items-center gap-2.5 flex-wrap">
            {/* Minutes vs Hours toggle */}
            <div
              className={`flex items-center rounded-xl border p-1 text-xs font-medium shadow-sm ${
                isDarkMode ? 'bg-neutral-900/80 border-neutral-800' : 'bg-white border-neutral-300'
              }`}
            >
              <button
                onClick={() => setUnitMode('minutes')}
                className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                  unitMode === 'minutes'
                    ? 'bg-amber-500 text-white font-bold shadow-sm'
                    : 'text-neutral-500 hover:text-neutral-300'
                }`}
              >
                Minutes
              </button>
              <button
                onClick={() => setUnitMode('hours')}
                className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                  unitMode === 'hours'
                    ? 'bg-amber-500 text-white font-bold shadow-sm'
                    : 'text-neutral-500 hover:text-neutral-300'
                }`}
              >
                Hours
              </button>
            </div>

            {/* Quick Log Test Buttons */}
            <div className="flex items-center gap-1.5">
              <button
                id="stats-add-session-btn"
                onClick={() => handleQuickAddSession(25)}
                className={`apple-hover flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold border cursor-pointer ${
                  isDarkMode
                    ? 'border-amber-500/40 bg-amber-500/10 text-amber-400 hover:bg-amber-500/20'
                    : 'border-amber-500/40 bg-amber-50 text-amber-600 hover:bg-amber-100'
                }`}
                title="Simulate recording a 25-minute completed focus session"
              >
                <Plus className="w-3 h-3" />
                <span>+25m Focus</span>
              </button>

              <button
                id="stats-add-task-btn"
                onClick={handleQuickAddTask}
                className={`apple-hover flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold border cursor-pointer ${
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
                className={`apple-icon-hover p-1.5 rounded-xl border text-neutral-400 hover:text-neutral-200 cursor-pointer ${
                  isDarkMode ? 'border-neutral-800 hover:bg-neutral-800' : 'border-neutral-300 hover:bg-neutral-100'
                }`}
                title="Reset or refresh default statistics"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* 4 Summary KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
          {/* Card 1: Total Focus Time */}
          <div className={`rounded-3xl p-5 sm:p-6 border flex flex-col justify-between ${cardBgClass}`}>
            <div className="flex items-center justify-between mb-3">
              <span className={`text-xs font-semibold uppercase tracking-wider ${subtextClass}`}>
                Total Focus Time
              </span>
              <div className="w-10 h-10 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-500 flex items-center justify-center">
                <Clock className="w-5 h-5" />
              </div>
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-extrabold tracking-tight font-mono">
                {formatMinutesHuman(weeklyData.totalFocusMinutes)}
              </div>
              <p className={`text-xs mt-1 flex items-center gap-1.5 ${subtextClass}`}>
                <span className="font-semibold text-amber-500">{weeklyData.totalSessions} sessions</span>
                <span>completed this week</span>
              </p>
            </div>
          </div>

          {/* Card 2: Completed Tasks */}
          <div className={`rounded-3xl p-5 sm:p-6 border flex flex-col justify-between ${cardBgClass}`}>
            <div className="flex items-center justify-between mb-3">
              <span className={`text-xs font-semibold uppercase tracking-wider ${subtextClass}`}>
                Completed Tasks
              </span>
              <div className="w-10 h-10 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-500 flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5" />
              </div>
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-extrabold tracking-tight font-mono text-emerald-500 dark:text-emerald-400">
                {weeklyData.totalTasksCompleted}
                <span className="text-sm font-normal text-neutral-500 ml-1.5">tasks</span>
              </div>
              <p className={`text-xs mt-1 flex items-center gap-1.5 ${subtextClass}`}>
                <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
                <span>Across 7 days tracking</span>
              </p>
            </div>
          </div>

          {/* Card 3: Daily Average Focus */}
          <div className={`rounded-3xl p-5 sm:p-6 border flex flex-col justify-between ${cardBgClass}`}>
            <div className="flex items-center justify-between mb-3">
              <span className={`text-xs font-semibold uppercase tracking-wider ${subtextClass}`}>
                Daily Average
              </span>
              <div className="w-10 h-10 rounded-2xl bg-sky-500/15 border border-sky-500/30 text-sky-500 flex items-center justify-center">
                <Target className="w-5 h-5" />
              </div>
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-extrabold tracking-tight font-mono">
                {formatMinutesHuman(weeklyData.averageDailyMinutes)}
                <span className="text-xs font-normal text-neutral-500 ml-1">/ day</span>
              </div>
              <p className={`text-xs mt-1 flex items-center gap-1.5 ${subtextClass}`}>
                <span className="text-sky-500 font-semibold">{weeklyData.activeDaysCount} of 7 days</span>
                <span>active focus recorded</span>
              </p>
            </div>
          </div>

          {/* Card 4: Peak Productive Day */}
          <div className={`rounded-3xl p-5 sm:p-6 border flex flex-col justify-between ${cardBgClass}`}>
            <div className="flex items-center justify-between mb-3">
              <span className={`text-xs font-semibold uppercase tracking-wider ${subtextClass}`}>
                Most Productive Day
              </span>
              <div className="w-10 h-10 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-500 flex items-center justify-center">
                <Flame className="w-5 h-5" />
              </div>
            </div>
            <div>
              <div className="text-xl sm:text-2xl font-extrabold tracking-tight truncate">
                {weeklyData.peakDay ? weeklyData.peakDay.fullDateLabel : 'Pending'}
              </div>
              <p className={`text-xs mt-1 flex items-center gap-1.5 ${subtextClass}`}>
                {weeklyData.peakDay ? (
                  <>
                    <span className="font-semibold text-rose-500">
                      {formatMinutesHuman(weeklyData.peakDay.focusMinutes)}
                    </span>
                    <span>• {weeklyData.peakDay.tasksCompleted} tasks</span>
                  </>
                ) : (
                  <span>Log focus time to see your peak</span>
                )}
              </p>
            </div>
          </div>
        </div>

        {/* Primary Data Visualization Card: Recharts Composed Chart */}
        <div className={`rounded-3xl p-6 sm:p-8 border ${cardBgClass}`}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-bold tracking-tight">
                  Daily Focus & Completed Tasks Distribution
                </h2>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-500 font-bold border border-amber-500/30">
                  Recharts Visualizer
                </span>
              </div>
              <p className={`text-xs ${subtextClass} mt-1`}>
                Compare daily focus duration against task completions across the week
              </p>
            </div>

            {/* Chart Mode Filter Tabs */}
            <div
              className={`flex items-center rounded-2xl border p-1 text-xs font-semibold self-start sm:self-auto ${
                isDarkMode ? 'bg-neutral-950 border-neutral-800' : 'bg-neutral-100 border-neutral-300'
              }`}
            >
              <button
                onClick={() => setChartViewMode('combined')}
                className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                  chartViewMode === 'combined'
                    ? 'bg-amber-500 text-white shadow-sm'
                    : 'text-neutral-500 hover:text-neutral-300'
                }`}
              >
                Combined View
              </button>
              <button
                onClick={() => setChartViewMode('focus')}
                className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                  chartViewMode === 'focus'
                    ? 'bg-amber-500 text-white shadow-sm'
                    : 'text-neutral-500 hover:text-neutral-300'
                }`}
              >
                Focus Time
              </button>
              <button
                onClick={() => setChartViewMode('tasks')}
                className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                  chartViewMode === 'tasks'
                    ? 'bg-emerald-500 text-white shadow-sm'
                    : 'text-neutral-500 hover:text-neutral-300'
                }`}
              >
                Tasks Done
              </button>
            </div>
          </div>

          {/* Recharts Canvas */}
          <div className="w-full h-[320px] sm:h-[380px]">
            <ResponsiveContainer width="100%" height="100%">
              {chartViewMode === 'combined' ? (
                <ComposedChart data={chartData} margin={{ top: 20, right: 20, bottom: 20, left: 0 }}>
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
                    fontSize={12}
                    tickLine={false}
                    axisLine={{ stroke: gridStroke }}
                  />
                  <YAxis
                    yAxisId="left"
                    stroke={tickFill}
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    unit={unitMode === 'hours' ? 'h' : 'm'}
                  />
                  <YAxis
                    yAxisId="right"
                    orientation="right"
                    stroke={tickFill}
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    unit=" tasks"
                    allowDecimals={false}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend
                    verticalAlign="top"
                    height={36}
                    wrapperStyle={{ fontSize: '12px', paddingBottom: '10px' }}
                  />
                  <Bar
                    yAxisId="left"
                    dataKey="focusDisplay"
                    name={unitMode === 'hours' ? 'Focus Time (hrs)' : 'Focus Time (min)'}
                    radius={[8, 8, 0, 0]}
                    maxBarSize={48}
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
                    strokeWidth={3}
                    dot={{ r: 5, fill: '#10b981', strokeWidth: 2, stroke: isDarkMode ? '#171717' : '#ffffff' }}
                    activeDot={{ r: 8, stroke: '#10b981', strokeWidth: 3 }}
                  />
                </ComposedChart>
              ) : chartViewMode === 'focus' ? (
                <BarChart data={chartData} margin={{ top: 20, right: 20, bottom: 20, left: 0 }}>
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
                    fontSize={12}
                    tickLine={false}
                    axisLine={{ stroke: gridStroke }}
                  />
                  <YAxis
                    stroke={tickFill}
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    unit={unitMode === 'hours' ? 'h' : 'm'}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar
                    dataKey="focusDisplay"
                    name={unitMode === 'hours' ? 'Focus Time (hrs)' : 'Focus Time (min)'}
                    fill="url(#focusSingleGradient)"
                    radius={[8, 8, 0, 0]}
                    maxBarSize={56}
                  />
                </BarChart>
              ) : (
                <BarChart data={chartData} margin={{ top: 20, right: 20, bottom: 20, left: 0 }}>
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
                    fontSize={12}
                    tickLine={false}
                    axisLine={{ stroke: gridStroke }}
                  />
                  <YAxis
                    stroke={tickFill}
                    fontSize={12}
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
                    radius={[8, 8, 0, 0]}
                    maxBarSize={56}
                  />
                </BarChart>
              )}
            </ResponsiveContainer>
          </div>

          <div className="flex items-center justify-between text-xs pt-4 border-t border-neutral-200/60 dark:border-neutral-800/60 text-neutral-500">
            <span>Tip: Click on "+25m Focus" or "+1 Task" above to test live data updates.</span>
            <span className="font-mono text-[11px]">Dynamic Local Persistence</span>
          </div>
        </div>

        {/* Secondary Grid: Cumulative Momentum Curve & Detailed Daily Roster */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Cumulative Progress Curve (Recharts AreaChart) */}
          <div className={`rounded-3xl p-6 sm:p-7 border flex flex-col justify-between ${cardBgClass}`}>
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-amber-500" />
                  <h3 className="text-base font-bold">Cumulative Weekly Momentum</h3>
                </div>
                <span className="text-xs font-mono font-bold text-amber-500">
                  {formatMinutesHuman(weeklyData.totalFocusMinutes)}
                </span>
              </div>
              <p className={`text-xs ${subtextClass} mb-4`}>
                Day-by-day accumulation of focused effort towards your weekly goals
              </p>

              <div className="w-full h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={cumulativeData} margin={{ top: 10, right: 10, bottom: 10, left: 0 }}>
                    <defs>
                      <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
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
                        borderRadius: '12px',
                        fontSize: '12px',
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="cumulativeMinutes"
                      stroke="#f59e0b"
                      strokeWidth={3}
                      fill="url(#areaGradient)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="pt-3 border-t border-neutral-200/50 dark:border-neutral-800/50 flex items-center justify-between text-xs text-neutral-400">
              <span>Goal trajectory: Steady progression</span>
              <span className="font-semibold text-amber-500">{weeklyData.activeDaysCount} active days</span>
            </div>
          </div>

          {/* Daily Productivity Breakdown List */}
          <div className={`rounded-3xl p-6 sm:p-7 border flex flex-col justify-between ${cardBgClass}`}>
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Trophy className="w-4 h-4 text-emerald-500" />
                  <h3 className="text-base font-bold">Daily Rhythm & Breakdown</h3>
                </div>
                <span className="text-xs font-semibold text-neutral-400">7-Day Overview</span>
              </div>
              <p className={`text-xs ${subtextClass} mb-4`}>
                Individual breakdown of focus minutes, sessions, and task completion
              </p>

              {/* Day rows */}
              <div className="space-y-2.5 max-h-64 overflow-y-auto pr-1">
                {weeklyData.days.map((day) => {
                  const maxMinutesInWeek = Math.max(120, ...weeklyData.days.map((d) => d.focusMinutes));
                  const progressPct = Math.min(100, Math.round((day.focusMinutes / maxMinutesInWeek) * 100));

                  return (
                    <div
                      key={day.date}
                      className={`p-2.5 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                        day.isToday
                          ? 'border-amber-500/50 bg-amber-500/10'
                          : isDarkMode
                          ? 'border-neutral-800/80 bg-neutral-900/50 hover:bg-neutral-800/60'
                          : 'border-neutral-200 bg-neutral-50 hover:bg-neutral-100'
                      }`}
                    >
                      <div className="w-24 flex items-center gap-2">
                        <span className="font-bold text-xs">{day.dayName}</span>
                        {day.isToday && (
                          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-amber-500 text-white">
                            Today
                          </span>
                        )}
                      </div>

                      {/* Progress Bar */}
                      <div className="flex-1 max-w-xs">
                        <div className="w-full bg-neutral-200 dark:bg-neutral-800 h-2 rounded-full overflow-hidden">
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
                      <div className="flex items-center gap-3 text-right">
                        <span className="font-mono text-xs font-bold w-16">
                          {formatMinutesHuman(day.focusMinutes)}
                        </span>
                        <div className="flex items-center gap-1 w-12 text-[11px] text-emerald-500 font-semibold justify-end">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>{day.tasksCompleted}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="pt-3 border-t border-neutral-200/50 dark:border-neutral-800/50 flex items-center justify-between text-xs text-neutral-400">
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
