import { PomodoroTask } from '../types';
import { triggerAutoCloudSync } from './accountService';

export const TASKS_STORAGE_KEY = 'desk_clock_pomodoro_tasks_v1';
export const LEGACY_TASKS_STORAGE_KEY = 'deskclock_pomodoro_tasks';

export const DEFAULT_INITIAL_TASKS: PomodoroTask[] = [
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

/**
 * Filter out tasks that were completed before today's 12:00 AM (midnight).
 * Unfinished / not done tasks are strictly preserved and kept intact.
 * Tasks completed today (after 12:00 AM today) are kept until the next 12:00 AM.
 */
export function pruneExpiredCompletedTasks(tasks: PomodoroTask[]): PomodoroTask[] {
  if (!Array.isArray(tasks)) return [];

  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const startOfTodayMs = startOfToday.getTime();

  return tasks.filter((task) => {
    // Keep all incomplete / to-be-done tasks
    if (!task.isCompleted) {
      return true;
    }

    // For completed tasks:
    // If completed before today's 12:00 AM, remove it.
    // If completed today (>= 12:00 AM today), keep it for the remainder of today.
    const completedTimestamp = task.completedAt || task.createdAt || 0;
    return completedTimestamp >= startOfTodayMs;
  });
}

/**
 * Load tasks from localStorage, automatically pruning tasks completed before 12:00 AM.
 */
export function loadAndPruneTasks(): PomodoroTask[] {
  try {
    const raw =
      localStorage.getItem(TASKS_STORAGE_KEY) ||
      localStorage.getItem(LEGACY_TASKS_STORAGE_KEY);

    if (!raw) {
      return DEFAULT_INITIAL_TASKS;
    }

    const parsed: PomodoroTask[] = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) {
      return DEFAULT_INITIAL_TASKS;
    }

    const pruned = pruneExpiredCompletedTasks(parsed);

    // If any completed tasks were removed by midnight rollover, persist updated list
    if (pruned.length !== parsed.length) {
      persistTasksToStorage(pruned);
    }

    return pruned;
  } catch (e) {
    console.debug('Failed to load and prune tasks from storage:', e);
    return DEFAULT_INITIAL_TASKS;
  }
}

/**
 * Persist tasks to localStorage and notify cloud sync
 */
export function persistTasksToStorage(tasks: PomodoroTask[]): void {
  try {
    const serialized = JSON.stringify(tasks);
    localStorage.setItem(TASKS_STORAGE_KEY, serialized);
    localStorage.setItem(LEGACY_TASKS_STORAGE_KEY, serialized);
    triggerAutoCloudSync();
  } catch (e) {
    console.debug('Failed to persist tasks to storage:', e);
  }
}

/**
 * Hook or helper to schedule automatic task pruning right at 12:00 AM midnight,
 * on page visibility change, and on background periodic check.
 */
export function setupMidnightTaskPruner(
  onTasksPruned: (updatedTasks: PomodoroTask[]) => void
): () => void {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  let intervalId: ReturnType<typeof setInterval> | null = null;

  const runCheck = () => {
    try {
      const raw =
        localStorage.getItem(TASKS_STORAGE_KEY) ||
        localStorage.getItem(LEGACY_TASKS_STORAGE_KEY);
      if (!raw) return;

      const currentTasks: PomodoroTask[] = JSON.parse(raw);
      if (!Array.isArray(currentTasks)) return;

      const pruned = pruneExpiredCompletedTasks(currentTasks);
      if (pruned.length !== currentTasks.length) {
        persistTasksToStorage(pruned);
        onTasksPruned(pruned);
        if (typeof window !== 'undefined') {
          window.dispatchEvent(
            new CustomEvent('desk_clock_data_synced', {
              detail: { tasks: pruned },
            })
          );
        }
      }
    } catch (e) {
      console.debug('Error in midnight task pruner check:', e);
    }
  };

  const scheduleNextMidnight = () => {
    const now = new Date();
    const nextMidnight = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate() + 1,
      0,
      0,
      0,
      100
    );
    const delayMs = Math.max(1000, nextMidnight.getTime() - now.getTime());

    timeoutId = setTimeout(() => {
      runCheck();
      scheduleNextMidnight();
    }, delayMs);
  };

  scheduleNextMidnight();

  // Also check periodically every 60s in case clock changes or device sleeps across midnight
  intervalId = setInterval(runCheck, 60000);

  const handleVisibilityChange = () => {
    if (document.visibilityState === 'visible') {
      runCheck();
    }
  };

  document.addEventListener('visibilitychange', handleVisibilityChange);

  return () => {
    if (timeoutId) clearTimeout(timeoutId);
    if (intervalId) clearInterval(intervalId);
    document.removeEventListener('visibilitychange', handleVisibilityChange);
  };
}
