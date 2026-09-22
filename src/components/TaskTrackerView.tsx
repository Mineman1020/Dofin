import React, { useState, useEffect } from 'react';
import {
  CheckCircle2,
  Circle,
  Plus,
  Trash2,
  Calendar,
  Clock,
  Timer,
  Settings,
  ArrowLeft,
  Filter,
  Check,
  Sparkles,
  Tag,
  AlignLeft,
  X,
  Maximize,
  Minimize,
  Trophy,
  BarChart3,
  Keyboard,
} from 'lucide-react';
import { ClockSettings, PomodoroSettings, PomodoroTask } from '../types';
import { recordTaskCompletion } from '../utils/statsStorage';

interface TaskTrackerViewProps {
  clockSettings: ClockSettings;
  pomodoroSettings: PomodoroSettings;
  onGoToWelcome: () => void;
  onGoToClock: () => void;
  onGoToPomodoro: () => void;
  onGoToStats?: () => void;
  onOpenSettings: () => void;
  onOpenParties?: (tab?: 'leaderboard' | 'my-parties' | 'create' | 'join') => void;
  onOpenShortcuts?: () => void;
  userName: string;
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
}

const TASKS_STORAGE_KEY = 'desk_clock_pomodoro_tasks_v1';

export const TaskTrackerView: React.FC<TaskTrackerViewProps> = ({
  clockSettings,
  pomodoroSettings,
  onGoToWelcome,
  onGoToClock,
  onGoToPomodoro,
  onGoToStats,
  onOpenSettings,
  onOpenParties,
  onOpenShortcuts,
  userName,
  isDarkMode,
  onToggleDarkMode,
}) => {
  // Shared task store across app
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
        description: 'Review lecture notes and complete project milestones.',
        estimatedPomodoros: 2,
        completedPomodoros: 0,
        isCompleted: false,
        createdAt: Date.now(),
      },
    ];
  });

  // Persist tasks whenever they change
  useEffect(() => {
    try {
      localStorage.setItem(TASKS_STORAGE_KEY, JSON.stringify(tasks));
    } catch (e) {
      console.debug('Failed to persist tasks:', e);
    }
  }, [tasks]);

  // Live mini time for header
  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  useEffect(() => {
    const interval = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  // Filter state: 'all' | 'pending' | 'completed'
  const [filter, setFilter] = useState<'all' | 'pending' | 'completed'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Task creation inputs
  const [newTitle, setNewTitle] = useState<string>('');
  const [newDescription, setNewDescription] = useState<string>('');
  const [newEst, setNewEst] = useState<number>(1);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);

  // Fullscreen state
  const [isFullscreen, setIsFullscreen] = useState<boolean>(() => !!document.fullscreenElement);
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const task: PomodoroTask = {
      id: Date.now().toString(),
      title: newTitle.trim(),
      description: newDescription.trim() || undefined,
      estimatedPomodoros: Number(newEst) || 1,
      completedPomodoros: 0,
      isCompleted: false,
      createdAt: Date.now(),
    };

    setTasks((prev) => [task, ...prev]);
    setNewTitle('');
    setNewDescription('');
    setNewEst(1);
    setIsCreateModalOpen(false);
  };

  const handleToggleCompleted = (taskId: string) => {
    setTasks((prev) =>
      prev.map((t) => {
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
      })
    );
  };

  const handleDeleteTask = (taskId: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== taskId));
  };

  const handleClearCompleted = () => {
    setTasks((prev) => prev.filter((t) => !t.isCompleted));
  };

  // Filtered task list
  const filteredTasks = tasks.filter((task) => {
    const matchesFilter =
      filter === 'all'
        ? true
        : filter === 'pending'
        ? !task.isCompleted
        : task.isCompleted;

    const matchesSearch =
      searchQuery.trim() === '' ||
      task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (task.description &&
        task.description.toLowerCase().includes(searchQuery.toLowerCase()));

    return matchesFilter && matchesSearch;
  });

  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((t) => t.isCompleted).length;
  const pendingTasks = totalTasks - completedTasks;
  const progressPercent = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  // Mini clock format
  const rawH = currentTime.getHours();
  const displayH = clockSettings.timeFormat === '12h' ? rawH % 12 || 12 : rawH;
  const displayM = String(currentTime.getMinutes()).padStart(2, '0');
  const ampm = clockSettings.timeFormat === '12h' ? (rawH >= 12 ? 'PM' : 'AM') : '';

  const dateStr = currentTime.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });

  return (
    <div
      id="task-tracker-view"
      className={`relative min-h-screen w-full flex flex-col justify-between overflow-x-hidden transition-colors duration-500 ${
        isDarkMode ? 'bg-neutral-950 text-neutral-100' : 'bg-[#f7f5f0] text-neutral-900'
      }`}
    >
      {/* Ambient background soft glow */}
      <div
        className={`absolute top-0 right-1/4 w-[500px] h-[350px] rounded-full blur-[150px] pointer-events-none ${
          isDarkMode ? 'bg-emerald-500/10' : 'bg-emerald-500/5'
        }`}
      />
      <div
        className={`absolute bottom-0 left-1/4 w-[500px] h-[350px] rounded-full blur-[150px] pointer-events-none ${
          isDarkMode ? 'bg-amber-500/10' : 'bg-amber-500/5'
        }`}
      />

      {/* Top Navbar */}
      <header
        id="task-tracker-navbar"
        className={`w-full px-4 sm:px-8 py-3.5 sm:py-4 flex items-center justify-between z-20 border-b backdrop-blur-md transition-colors ${
          isDarkMode
            ? 'border-neutral-900 bg-neutral-950/80'
            : 'border-neutral-200/80 bg-white/80'
        }`}
      >
        {/* Left: Back & Breadcrumb */}
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            id="task-tracker-back-welcome-btn"
            onClick={onGoToWelcome}
            className={`apple-hover flex items-center gap-2 px-3 sm:px-3.5 py-2 rounded-xl text-xs font-medium border cursor-pointer shadow-sm ${
              isDarkMode
                ? 'border-neutral-800 bg-neutral-900/80 hover:bg-neutral-800 text-neutral-300 hover:text-white'
                : 'border-neutral-300/80 bg-white hover:bg-neutral-50 text-neutral-800'
            }`}
            title="Back to Welcome Hub (Escape)"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Hub</span>
          </button>

          <div className="flex items-center gap-2 pl-1 sm:pl-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/15 text-emerald-500 border border-emerald-500/30 flex items-center justify-center font-bold">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <div>
              <h1 className="text-sm sm:text-base font-bold tracking-tight flex items-center gap-2">
                <span>Task Tracker</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 font-semibold">
                  Independent
                </span>
              </h1>
            </div>
          </div>
        </div>

        {/* Center: Real-time Mini Clock & Date */}
        <div
          className={`hidden md:flex items-center gap-3 px-3.5 py-1.5 rounded-xl border text-xs font-mono select-none ${
            isDarkMode
              ? 'border-neutral-800 bg-neutral-900/60 text-neutral-300'
              : 'border-neutral-200 bg-neutral-100/80 text-neutral-700'
          }`}
        >
          <Calendar className="w-3.5 h-3.5 text-emerald-500" />
          <span>{dateStr}</span>
          <span className="text-neutral-400 font-bold">·</span>
          <span className="font-semibold text-neutral-100 dark:text-neutral-100 text-neutral-900">
            {String(displayH).padStart(2, '0')}:{displayM} {ampm}
          </span>
        </div>

        {/* Right Toolbar: Quick Launch to Stats, Fullscreen, Settings */}
        <div className="flex items-center gap-2">
          {/* Weekly Stats & Analytics Switch */}
          {onGoToStats && (
            <button
              id="tracker-stats-btn"
              onClick={onGoToStats}
              className={`apple-hover flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium border cursor-pointer ${
                isDarkMode
                  ? 'border-neutral-800 bg-neutral-900/80 hover:bg-neutral-800 text-amber-400 hover:text-amber-300'
                  : 'border-neutral-300/80 bg-white hover:bg-neutral-50 text-amber-600'
              }`}
              title="Open Weekly Progress & Analytics"
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Stats</span>
            </button>
          )}

          {/* Fullscreen */}
          <button
            id="tracker-fullscreen-btn"
            onClick={toggleFullscreen}
            className={`apple-icon-hover p-2 rounded-xl text-xs border cursor-pointer shadow-sm ${
              isDarkMode
                ? 'border-neutral-800 bg-neutral-900/80 hover:bg-neutral-800 text-neutral-300'
                : 'border-neutral-300/80 bg-white hover:bg-neutral-50 text-neutral-800'
            }`}
            title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
          >
            {isFullscreen ? <Minimize className="w-3.5 h-3.5" /> : <Maximize className="w-3.5 h-3.5" />}
          </button>

          {/* Settings */}
          <button
            id="tracker-settings-btn"
            onClick={onOpenSettings}
            className={`apple-hover flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium border cursor-pointer shadow-sm ${
              isDarkMode
                ? 'border-neutral-800 bg-neutral-900/80 hover:bg-neutral-800 text-neutral-300'
                : 'border-neutral-300/80 bg-white hover:bg-neutral-50 text-neutral-800'
            }`}
            title="Settings (S)"
          >
            <Settings className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Settings</span>
          </button>

          {/* Shortcuts Guide Button */}
          {onOpenShortcuts && (
            <button
              id="tasks-shortcuts-btn"
              onClick={onOpenShortcuts}
              className={`apple-icon-hover p-2 rounded-xl border text-xs cursor-pointer shadow-sm ${
                isDarkMode
                  ? 'border-neutral-800 bg-neutral-900/80 hover:bg-neutral-800 text-neutral-300'
                  : 'border-neutral-300/80 bg-white hover:bg-neutral-50 text-neutral-800'
              }`}
              title="Keyboard Shortcuts (? or \)"
            >
              <Keyboard className="w-4 h-4" />
            </button>
          )}
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-8 py-8 sm:py-10 flex flex-col gap-6 z-10">
        {/* Top Summary & Actions Banner */}
        <div
          className={`p-6 sm:p-8 rounded-3xl border shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6 transition-all ${
            isDarkMode
              ? 'bg-neutral-900/80 border-neutral-800/90'
              : 'bg-white border-neutral-200/90'
          }`}
        >
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono uppercase tracking-wider text-emerald-500 font-bold">
                Focus & Productivity
              </span>
              <span className="text-neutral-400">·</span>
              <span className="text-xs text-neutral-400">{userName}&apos;s Workspace</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Task Tracker
            </h2>
            <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 max-w-md">
              Keep full track of your daily checklist, homework, and projects anytime without running an active Pomodoro timer.
            </p>
          </div>

          {/* Quick Metrics & New Task CTA */}
          <div className="flex flex-wrap items-center gap-4 w-full md:w-auto">
            {/* Stat Capsules */}
            <div className="flex items-center gap-3">
              <div
                className={`px-4 py-2.5 rounded-2xl border flex flex-col items-center min-w-[75px] ${
                  isDarkMode ? 'bg-neutral-950 border-neutral-800' : 'bg-neutral-50 border-neutral-200'
                }`}
              >
                <span className="text-[10px] uppercase font-mono text-neutral-400">Total</span>
                <span className="text-base font-bold">{totalTasks}</span>
              </div>
              <div
                className={`px-4 py-2.5 rounded-2xl border flex flex-col items-center min-w-[75px] ${
                  isDarkMode ? 'bg-neutral-950 border-neutral-800' : 'bg-neutral-50 border-neutral-200'
                }`}
              >
                <span className="text-[10px] uppercase font-mono text-neutral-400">Pending</span>
                <span className="text-base font-bold text-amber-500">{pendingTasks}</span>
              </div>
              <div
                className={`px-4 py-2.5 rounded-2xl border flex flex-col items-center min-w-[75px] ${
                  isDarkMode ? 'bg-neutral-950 border-neutral-800' : 'bg-neutral-50 border-neutral-200'
                }`}
              >
                <span className="text-[10px] uppercase font-mono text-neutral-400">Done</span>
                <span className="text-base font-bold text-emerald-500">{completedTasks}</span>
              </div>
            </div>

            {/* Add Task Primary Button */}
            <button
              id="tracker-add-task-btn"
              onClick={() => setIsCreateModalOpen(true)}
              className="apple-hover px-5 py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-emerald-500/20"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>Add New Task</span>
            </button>
          </div>
        </div>

        {/* Progress Bar */}
        {totalTasks > 0 && (
          <div
            className={`p-4 rounded-2xl border flex flex-col gap-2 ${
              isDarkMode ? 'bg-neutral-900/50 border-neutral-800' : 'bg-white border-neutral-200'
            }`}
          >
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-neutral-400 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
                Completion Progress
              </span>
              <span className="font-mono font-bold text-emerald-500">
                {completedTasks} of {totalTasks} ({progressPercent}%)
              </span>
            </div>
            <div className="w-full h-2 rounded-full bg-neutral-200 dark:bg-neutral-800 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 transition-all duration-500 rounded-full"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        )}

        {/* Search, Filters, and Bulk Actions Toolbar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Left: Filter Buttons */}
          <div
            className={`inline-flex p-1 rounded-2xl border self-start ${
              isDarkMode ? 'bg-neutral-900 border-neutral-800' : 'bg-neutral-100 border-neutral-200'
            }`}
          >
            <button
              onClick={() => setFilter('all')}
              className={`apple-pill-hover px-3.5 py-1.5 rounded-xl text-xs font-semibold cursor-pointer transition-all ${
                filter === 'all'
                  ? isDarkMode
                    ? 'bg-neutral-800 text-white shadow-sm'
                    : 'bg-white text-neutral-900 shadow-sm'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              All ({totalTasks})
            </button>
            <button
              onClick={() => setFilter('pending')}
              className={`apple-pill-hover px-3.5 py-1.5 rounded-xl text-xs font-semibold cursor-pointer transition-all ${
                filter === 'pending'
                  ? isDarkMode
                    ? 'bg-neutral-800 text-amber-400 shadow-sm'
                    : 'bg-white text-amber-600 shadow-sm'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              Pending ({pendingTasks})
            </button>
            <button
              onClick={() => setFilter('completed')}
              className={`apple-pill-hover px-3.5 py-1.5 rounded-xl text-xs font-semibold cursor-pointer transition-all ${
                filter === 'completed'
                  ? isDarkMode
                    ? 'bg-neutral-800 text-emerald-400 shadow-sm'
                    : 'bg-white text-emerald-600 shadow-sm'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              Completed ({completedTasks})
            </button>
          </div>

          {/* Right: Search Input & Clear Completed */}
          <div className="flex items-center gap-3">
            <input
              type="text"
              placeholder="Search tasks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`px-3.5 py-2 rounded-xl text-xs border focus:outline-none transition-colors w-full sm:w-56 ${
                isDarkMode
                  ? 'bg-neutral-900 border-neutral-800 text-white placeholder-neutral-500 focus:border-emerald-500/60'
                  : 'bg-white border-neutral-200 text-neutral-900 placeholder-neutral-400 focus:border-emerald-500/60'
              }`}
            />

            {completedTasks > 0 && (
              <button
                onClick={handleClearCompleted}
                className="apple-hover text-xs text-rose-500 hover:text-rose-400 px-3 py-2 rounded-xl border border-rose-500/20 hover:border-rose-500/40 bg-rose-500/5 cursor-pointer whitespace-nowrap"
                title="Remove completed tasks"
              >
                Clear Done
              </button>
            )}
          </div>
        </div>

        {/* Task List Items */}
        <div className="flex flex-col gap-3">
          {filteredTasks.length === 0 ? (
            <div
              className={`py-16 px-6 rounded-3xl border text-center flex flex-col items-center justify-center gap-3 ${
                isDarkMode ? 'bg-neutral-900/40 border-neutral-800/80' : 'bg-white/60 border-neutral-200/80'
              }`}
            >
              <div className="w-12 h-12 rounded-2xl bg-neutral-500/10 text-neutral-400 flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <p className="text-sm font-semibold">
                {searchQuery ? 'No tasks matched your search' : 'No tasks in this view'}
              </p>
              <p className="text-xs text-neutral-500 max-w-sm">
                {searchQuery
                  ? 'Try modifying your search keywords or resetting your filter.'
                  : 'Add a new task to organize your study, work, reading, or coding checklist.'}
              </p>
              {!searchQuery && (
                <button
                  onClick={() => setIsCreateModalOpen(true)}
                  className="apple-hover mt-2 px-4 py-2 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-500 font-semibold text-xs cursor-pointer"
                >
                  Create your first task
                </button>
              )}
            </div>
          ) : (
            filteredTasks.map((task, idx) => {
              const isDone = task.isCompleted;
              return (
                <div
                  key={task.id}
                  id={`tracker-task-item-${task.id}`}
                  className={`apple-card-hover group p-4 sm:p-5 rounded-2xl border transition-all flex items-start justify-between gap-4 cursor-pointer ${
                    isDone
                      ? isDarkMode
                        ? 'bg-neutral-900/30 border-neutral-850 opacity-60 hover:opacity-100'
                        : 'bg-neutral-50 border-neutral-200 opacity-60 hover:opacity-100'
                      : isDarkMode
                      ? 'bg-neutral-900/80 hover:bg-neutral-900 border-neutral-800 hover:border-emerald-500/40'
                      : 'bg-white hover:bg-neutral-50/90 border-neutral-200 hover:border-emerald-500/40'
                  }`}
                  onClick={() => handleToggleCompleted(task.id)}
                >
                  <div className="flex items-start gap-3.5 flex-1 min-w-0">
                    {/* Checkbox */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggleCompleted(task.id);
                      }}
                      className={`apple-icon-hover mt-0.5 w-6 h-6 rounded-lg flex items-center justify-center border transition-colors cursor-pointer shrink-0 ${
                        isDone
                          ? 'bg-emerald-500 border-emerald-500 text-neutral-950'
                          : isDarkMode
                          ? 'border-neutral-700 hover:border-emerald-400 bg-neutral-800/60'
                          : 'border-neutral-300 hover:border-emerald-500 bg-neutral-100'
                      }`}
                      title={isDone ? 'Mark as incomplete' : 'Mark as completed'}
                    >
                      {isDone && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                    </button>

                    {/* Title & Description */}
                    <div className="flex-1 min-w-0 pr-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[11px] font-mono font-bold text-neutral-400">
                          #{idx + 1}
                        </span>
                        <h4
                          className={`text-sm sm:text-base font-semibold break-words transition-colors ${
                            isDone
                              ? 'line-through text-neutral-500 dark:text-neutral-500'
                              : isDarkMode
                              ? 'text-neutral-100'
                              : 'text-neutral-900'
                          }`}
                        >
                          {task.title}
                        </h4>
                      </div>

                      {task.description && (
                        <p
                          className={`mt-1 text-xs break-words leading-relaxed ${
                            isDone
                              ? 'line-through text-neutral-500 dark:text-neutral-500'
                              : 'text-neutral-500 dark:text-neutral-400'
                          }`}
                        >
                          {task.description}
                        </p>
                      )}

                      {/* Pomodoro link badge */}
                      <div className="mt-2.5 flex items-center gap-2 flex-wrap">
                        {task.estimatedPomodoros > 0 && (
                          <span
                            className={`inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded-md border ${
                              isDarkMode
                                ? 'bg-neutral-800/80 text-neutral-400 border-neutral-700'
                                : 'bg-neutral-100 text-neutral-600 border-neutral-300'
                            }`}
                            title="Estimated Pomodoros if run in Pomodoro mode"
                          >
                            <Timer className="w-3 h-3 text-sky-500" />
                            <span>{task.estimatedPomodoros} pomodoro est.</span>
                          </span>
                        )}
                        {task.completedAt && (
                          <span className="text-[10px] font-mono text-emerald-500">
                            Completed {new Date(task.completedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right Actions: Delete */}
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteTask(task.id);
                      }}
                      className="apple-icon-hover p-2 rounded-xl text-neutral-400 hover:text-rose-500 hover:bg-rose-500/10 cursor-pointer transition-colors"
                      title="Delete task"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </main>

      {/* Bottom Footer */}
      <footer
        className={`w-full py-4 px-6 border-t text-center text-xs text-neutral-500 transition-colors ${
          isDarkMode ? 'border-neutral-900 bg-neutral-950/60' : 'border-neutral-200/80 bg-white/60'
        }`}
      >
        <span>
          Task Tracker · Seamlessly shares your task database with Pomodoro Timer whenever you want to switch.
        </span>
      </footer>

      {/* Task Creation Modal */}
      {isCreateModalOpen && (
        <div
          id="task-tracker-create-modal"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsCreateModalOpen(false);
          }}
        >
          <div
            className={`w-full max-w-md p-6 rounded-3xl border shadow-2xl space-y-4 ${
              isDarkMode ? 'bg-neutral-900 border-neutral-800 text-white' : 'bg-white border-neutral-200 text-neutral-900'
            }`}
          >
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold flex items-center gap-2">
                <Plus className="w-4 h-4 text-emerald-500" />
                <span>Add Task #{tasks.length + 1}</span>
              </h3>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="p-1 rounded-lg hover:bg-neutral-800/20 text-neutral-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddTask} className="space-y-4">
              {/* Task Title */}
              <div className="space-y-1.5">
                <label
                  htmlFor="tracker-task-title-input"
                  className="text-xs font-semibold text-neutral-400 uppercase tracking-wider block"
                >
                  1. Task Title <span className="text-emerald-500">*</span>
                </label>
                <input
                  id="tracker-task-title-input"
                  type="text"
                  required
                  placeholder="What do you need to get done?"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  maxLength={100}
                  autoFocus
                  className={`w-full px-3.5 py-2.5 rounded-xl text-sm border focus:outline-none ${
                    isDarkMode
                      ? 'bg-neutral-950 border-neutral-800 text-white focus:border-emerald-500/60'
                      : 'bg-neutral-50 border-neutral-300 text-neutral-900 focus:border-emerald-500/60'
                  }`}
                />
              </div>

              {/* Task Description */}
              <div className="space-y-1.5">
                <label
                  htmlFor="tracker-task-desc-input"
                  className="text-xs font-semibold text-neutral-400 uppercase tracking-wider block"
                >
                  2. Description / Notes (Optional)
                </label>
                <textarea
                  id="tracker-task-desc-input"
                  placeholder="Add details, steps, or reference links..."
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  maxLength={300}
                  rows={3}
                  className={`w-full px-3.5 py-2 rounded-xl text-sm border focus:outline-none resize-none ${
                    isDarkMode
                      ? 'bg-neutral-950 border-neutral-800 text-white focus:border-emerald-500/60'
                      : 'bg-neutral-50 border-neutral-300 text-neutral-900 focus:border-emerald-500/60'
                  }`}
                />
              </div>

              {/* Estimated Pomodoro intervals (optional) */}
              <div className="space-y-1.5">
                <label
                  htmlFor="tracker-task-est-input"
                  className="text-xs font-semibold text-neutral-400 uppercase tracking-wider block"
                >
                  3. Estimated Focus Intervals (Optional)
                </label>
                <div className="flex items-center gap-3">
                  <input
                    id="tracker-task-est-input"
                    type="number"
                    min={1}
                    max={12}
                    value={newEst}
                    onChange={(e) => setNewEst(Math.max(1, parseInt(e.target.value) || 1))}
                    className={`w-24 px-3 py-2 rounded-xl text-sm border font-mono font-bold text-center focus:outline-none ${
                      isDarkMode
                        ? 'bg-neutral-950 border-neutral-800 text-white'
                        : 'bg-neutral-50 border-neutral-300 text-neutral-900'
                    }`}
                  />
                  <span className="text-xs text-neutral-500">
                    sessions (~{(newEst * pomodoroSettings.workMinutes)} mins if timed)
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className={`px-4 py-2 rounded-xl text-xs font-semibold border cursor-pointer ${
                    isDarkMode
                      ? 'border-neutral-800 hover:bg-neutral-800 text-neutral-300'
                      : 'border-neutral-300 hover:bg-neutral-100 text-neutral-700'
                  }`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!newTitle.trim()}
                  className="apple-hover px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-neutral-950 font-bold text-xs cursor-pointer shadow-md shadow-emerald-500/20"
                >
                  Create Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
