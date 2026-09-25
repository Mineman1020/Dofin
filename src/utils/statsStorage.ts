import { PomodoroTask } from '../types';

export interface DayStatsRecord {
  date: string; // YYYY-MM-DD
  dayName: string; // 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'
  fullDateLabel: string; // 'Mon, Sep 21'
  focusMinutes: number;
  completedSessions: number;
  tasksCompleted: number;
  isToday: boolean;
}

export interface WeeklyStatsSummary {
  days: DayStatsRecord[];
  totalFocusMinutes: number;
  totalTasksCompleted: number;
  totalSessions: number;
  averageDailyMinutes: number;
  peakDay: DayStatsRecord | null;
  completionRatePercent: number;
  activeDaysCount: number;
  weekRangeLabel: string;
}

const STATS_STORAGE_KEY = 'deskclock_daily_stats';
const TASKS_STORAGE_KEY = 'deskclock_pomodoro_tasks';

// Format Date helper to YYYY-MM-DD
export function formatDateKey(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

// Get all logged stats from localStorage
export function getStoredDailyStats(): Record<string, { focusMinutes: number; completedSessions: number; tasksCompleted: number }> {
  try {
    const raw = localStorage.getItem(STATS_STORAGE_KEY);
    if (!raw) {
      // Seed initial realistic baseline for current week so chart is instantly meaningful
      const seeded = seedInitialWeekStats();
      localStorage.setItem(STATS_STORAGE_KEY, JSON.stringify(seeded));
      return seeded;
    }
    return JSON.parse(raw);
  } catch (e) {
    console.error('Error reading stats from storage', e);
    return {};
  }
}

// Seed realistic initial stats for the current week
function seedInitialWeekStats(): Record<string, { focusMinutes: number; completedSessions: number; tasksCompleted: number }> {
  const result: Record<string, { focusMinutes: number; completedSessions: number; tasksCompleted: number }> = {};
  const today = new Date();
  
  // Seed Monday to Sunday of the current week with realistic productivity distribution
  const currentDayIndex = today.getDay(); // 0 = Sun, 1 = Mon ...
  // Calculate distance from Monday (1)
  const diffToMonday = (currentDayIndex + 6) % 7;
  const monday = new Date(today);
  monday.setDate(today.getDate() - diffToMonday);

  const baselineTemplate = [
    { focusMin: 50, sessions: 2, tasks: 3 },  // Mon
    { focusMin: 75, sessions: 3, tasks: 4 },  // Tue
    { focusMin: 110, sessions: 4, tasks: 5 }, // Wed
    { focusMin: 65, sessions: 2, tasks: 2 },  // Thu
    { focusMin: 90, sessions: 3, tasks: 4 },  // Fri
    { focusMin: 40, sessions: 1, tasks: 1 },  // Sat
    { focusMin: 25, sessions: 1, tasks: 2 },  // Sun
  ];

  for (let i = 0; i < 7; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    const key = formatDateKey(d);
    
    // If date is in the future relative to today, give 0 or light baseline
    if (d > today && formatDateKey(d) !== formatDateKey(today)) {
      result[key] = { focusMin: 0, sessions: 0, tasksCompleted: 0 } as any;
      result[key].focusMinutes = 0;
    } else {
      const template = baselineTemplate[i] || { focusMin: 45, sessions: 2, tasks: 2 };
      result[key] = {
        focusMinutes: template.focusMin,
        completedSessions: template.sessions,
        tasksCompleted: template.tasks,
      };
    }
  }

  return result;
}

// Record focus minutes into today's log
export function recordFocusMinutes(minutes: number, isCompletedSession: boolean = false): void {
  try {
    if (minutes <= 0 && !isCompletedSession) return;
    const stats = getStoredDailyStats();
    const todayKey = formatDateKey(new Date());
    const current = stats[todayKey] || { focusMinutes: 0, completedSessions: 0, tasksCompleted: 0 };
    
    stats[todayKey] = {
      focusMinutes: Math.max(0, current.focusMinutes + minutes),
      completedSessions: isCompletedSession ? current.completedSessions + 1 : current.completedSessions,
      tasksCompleted: current.tasksCompleted || 0,
    };
    
    localStorage.setItem(STATS_STORAGE_KEY, JSON.stringify(stats));
  } catch (e) {
    console.error('Error recording focus minutes', e);
  }
}

// Record completed task into today's log
export function recordTaskCompletion(increment: number = 1): void {
  try {
    const stats = getStoredDailyStats();
    const todayKey = formatDateKey(new Date());
    const current = stats[todayKey] || { focusMinutes: 0, completedSessions: 0, tasksCompleted: 0 };
    
    stats[todayKey] = {
      ...current,
      tasksCompleted: Math.max(0, (current.tasksCompleted || 0) + increment),
    };
    
    localStorage.setItem(STATS_STORAGE_KEY, JSON.stringify(stats));
  } catch (e) {
    console.error('Error recording task completion', e);
  }
}

// Reset stats to fresh demo baseline or clear
export function resetStatsToDemo(): void {
  const seeded = seedInitialWeekStats();
  localStorage.setItem(STATS_STORAGE_KEY, JSON.stringify(seeded));
}

// Get weekly stats breakdown for a week (offset: 0 = current week, -1 = last week, etc.)
export function getWeeklyStats(weekOffset: number = 0): WeeklyStatsSummary {
  const storedStats = getStoredDailyStats();
  const today = new Date();
  const todayKey = formatDateKey(today);

  // Also read stored tasks to enrich task metrics
  let storedTasks: PomodoroTask[] = [];
  try {
    const rawTasks = localStorage.getItem('desk_clock_pomodoro_tasks_v1') || localStorage.getItem(TASKS_STORAGE_KEY);
    if (rawTasks) {
      storedTasks = JSON.parse(rawTasks);
    }
  } catch (e) {
    // Ignore task parse error
  }

  // Calculate Monday of the target week
  const currentDayIndex = today.getDay(); // 0 = Sun, 1 = Mon ...
  const diffToMonday = (currentDayIndex + 6) % 7;
  const monday = new Date(today);
  monday.setDate(today.getDate() - diffToMonday + weekOffset * 7);

  const days: DayStatsRecord[] = [];
  let totalFocusMinutes = 0;
  let totalTasksCompleted = 0;
  let totalSessions = 0;
  let activeDaysCount = 0;

  for (let i = 0; i < 7; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    const dateKey = formatDateKey(d);
    const dayName = DAY_NAMES[d.getDay()];
    const isToday = dateKey === todayKey;

    const monthShort = d.toLocaleString('en-US', { month: 'short' });
    const fullDateLabel = `${dayName}, ${monthShort} ${d.getDate()}`;

    const logged = storedStats[dateKey] || { focusMinutes: 0, completedSessions: 0, tasksCompleted: 0 };
    
    // Count tasks completed on this specific day from task store if timestamp matches
    const dayTasksFromStorage = storedTasks.filter((t) => {
      if (!t.isCompleted || !t.completedAt) return false;
      return formatDateKey(new Date(t.completedAt)) === dateKey;
    }).length;

    // Use max between logged tasks and calculated tasks
    const tasksCount = Math.max(logged.tasksCompleted || 0, dayTasksFromStorage);
    const focusMin = logged.focusMinutes || 0;
    const sessions = logged.completedSessions || 0;

    if (focusMin > 0 || tasksCount > 0) {
      activeDaysCount++;
    }

    totalFocusMinutes += focusMin;
    totalTasksCompleted += tasksCount;
    totalSessions += sessions;

    days.push({
      date: dateKey,
      dayName,
      fullDateLabel,
      focusMinutes: focusMin,
      completedSessions: sessions,
      tasksCompleted: tasksCount,
      isToday,
    });
  }

  // Peak day
  let peakDay: DayStatsRecord | null = null;
  for (const d of days) {
    if (!peakDay || d.focusMinutes > peakDay.focusMinutes) {
      if (d.focusMinutes > 0) {
        peakDay = d;
      }
    }
  }

  // Average daily focus minutes (over active days or 7 days)
  const averageDailyMinutes = Math.round(totalFocusMinutes / 7);

  // Total tasks vs pending tasks
  const allTasksCount = storedTasks.length;
  const completedAllTime = storedTasks.filter((t) => t.isCompleted).length;
  const completionRatePercent =
    allTasksCount > 0 ? Math.round((completedAllTime / allTasksCount) * 100) : 100;

  // Week range label
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  const startMonth = monday.toLocaleString('en-US', { month: 'short' });
  const endMonth = sunday.toLocaleString('en-US', { month: 'short' });
  const weekRangeLabel =
    startMonth === endMonth
      ? `${startMonth} ${monday.getDate()} – ${sunday.getDate()}, ${monday.getFullYear()}`
      : `${startMonth} ${monday.getDate()} – ${endMonth} ${sunday.getDate()}, ${sunday.getFullYear()}`;

  return {
    days,
    totalFocusMinutes,
    totalTasksCompleted,
    totalSessions,
    averageDailyMinutes,
    peakDay,
    completionRatePercent,
    activeDaysCount,
    weekRangeLabel,
  };
}

// Convert minutes to human readable string: e.g. "2h 45m" or "45m"
export function formatMinutesHuman(totalMinutes: number): string {
  if (totalMinutes <= 0) return '0m';
  const hours = Math.floor(totalMinutes / 60);
  const mins = totalMinutes % 60;
  if (hours === 0) return `${mins}m`;
  if (mins === 0) return `${hours}h`;
  return `${hours}h ${mins}m`;
}

// Get stats for today specifically
export function getTodayStats(): { focusMinutes: number; completedSessions: number; tasksCompleted: number } {
  try {
    const stats = getStoredDailyStats();
    const todayKey = formatDateKey(new Date());
    return stats[todayKey] || { focusMinutes: 0, completedSessions: 0, tasksCompleted: 0 };
  } catch (e) {
    console.debug('Error getting today stats:', e);
    return { focusMinutes: 0, completedSessions: 0, tasksCompleted: 0 };
  }
}

// Get number of completed pomodoro sessions today (resets at 12:00 AM)
export function getTodayCompletedRounds(): number {
  return getTodayStats().completedSessions;
}

// Calculate consecutive active days streak ending today (or yesterday if today is still in progress)
export function getConsecutiveDayStreak(): number {
  try {
    const stats = getStoredDailyStats();
    const today = new Date();
    const todayKey = formatDateKey(today);
    const todayStats = stats[todayKey];
    const hasTodayActivity = Boolean(
      todayStats && ((todayStats.completedSessions || 0) > 0 || (todayStats.focusMinutes || 0) > 0)
    );

    let streak = hasTodayActivity ? 1 : 0;

    // Check consecutive days backwards starting from yesterday
    const checkDate = new Date(today);
    checkDate.setDate(today.getDate() - 1);

    for (let i = 0; i < 365; i++) {
      const key = formatDateKey(checkDate);
      const dayStats = stats[key];
      const hadActivity = Boolean(
        dayStats && ((dayStats.completedSessions || 0) > 0 || (dayStats.focusMinutes || 0) > 0)
      );

      if (hadActivity) {
        streak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    }

    return streak;
  } catch (e) {
    console.debug('Error calculating consecutive streak:', e);
    return 0;
  }
}

// Full telemetry summary
export function getStreakTelemetry(): {
  consecutiveDays: number;
  todayCompletedRounds: number;
  todayFocusMinutes: number;
  isStreakActive: boolean;
} {
  const today = getTodayStats();
  const consecutiveDays = getConsecutiveDayStreak();
  return {
    consecutiveDays,
    todayCompletedRounds: today.completedSessions,
    todayFocusMinutes: today.focusMinutes,
    isStreakActive: consecutiveDays > 0,
  };
}
