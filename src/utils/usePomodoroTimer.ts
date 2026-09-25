import { useState, useEffect, useRef, useCallback } from 'react';
import { PomodoroSettings, PomodoroPhase, PomodoroTask } from '../types';
import {
  triggerSoundAlert,
  playPomodoroStart,
  playTickSound,
} from './audio';
import {
  formatDateKey,
  getTodayCompletedRounds,
  getConsecutiveDayStreak,
  recordFocusMinutes,
} from './statsStorage';
import {
  getSavedPartyIds,
  syncFocusTimeToParties,
  updatePartyMemberStatus,
} from './partyService';

const POMODORO_PERSISTENCE_KEY = 'desk_clock_pomodoro_continuous_state_v2';
const TASKS_STORAGE_KEY = 'desk_clock_pomodoro_tasks_v1';

export interface StoredPomodoroState {
  phase: PomodoroPhase;
  timeLeft: number;
  isRunning: boolean;
  endTime: number | null; // epoch ms when current phase will end
  currentRound: number;
  activeTaskId: string | null;
  dateKey: string; // YYYY-MM-DD
  focusSessionStartTime: number | null; // epoch ms when current focus work session began
  lastSavedAt: number;
}

export interface PomodoroTimerController {
  phase: PomodoroPhase;
  timeLeft: number;
  totalTime: number;
  isRunning: boolean;
  isFocusRunning: boolean; // true ONLY when timer is running during 'work' phase
  isInFocusSession: boolean; // true during 'work' phase if session started (even if paused!)
  focusSessionStartTime: number | null; // epoch ms when this focus session began (null when session is over)
  currentRound: number;
  completedRounds: number;
  consecutiveStreak: number;
  activeTaskId: string | null;
  togglePlayPause: () => void;
  pauseTimer: () => void;
  handleReset: () => void;
  handleSkip: () => void;
  handleAddMinute: () => void;
  handleMinusMinute: () => void;
  switchPhase: (nextPhase: PomodoroPhase, autoStart?: boolean) => void;
  setActiveTaskId: (id: string | null) => void;
  getTotalTimeForPhase: (p: PomodoroPhase) => number;
}

export function usePomodoroTimer(settings: PomodoroSettings): PomodoroTimerController {
  const settingsRef = useRef<PomodoroSettings>(settings);
  settingsRef.current = settings;

  // Helper: compute duration for a phase based on current settings
  const getTotalTimeForPhase = useCallback(
    (p: PomodoroPhase): number => {
      switch (p) {
        case 'work':
          return Math.max(1, (settingsRef.current.workMinutes || 25) * 60);
        case 'shortBreak':
          return Math.max(1, (settingsRef.current.shortBreakMinutes || 5) * 60);
        case 'longBreak':
          return Math.max(1, (settingsRef.current.longBreakMinutes || 15) * 60);
      }
    },
    []
  );

  // Read saved state on first load
  const initialData = useRef<{
    phase: PomodoroPhase;
    timeLeft: number;
    isRunning: boolean;
    endTime: number | null;
    currentRound: number;
    activeTaskId: string | null;
    dateKey: string;
    focusSessionStartTime: number | null;
  } | null>(null);

  if (initialData.current === null) {
    const todayKey = formatDateKey(new Date());
    let restored: StoredPomodoroState | null = null;
    try {
      const raw = localStorage.getItem(POMODORO_PERSISTENCE_KEY);
      if (raw) {
        restored = JSON.parse(raw);
      }
    } catch (e) {
      console.debug('Failed to read pomodoro continuous state', e);
    }

    if (restored && restored.dateKey === todayKey) {
      // Same day restoration
      let restoredTimeLeft = restored.timeLeft;
      let restoredRunning = restored.isRunning;
      let restoredEndTime = restored.endTime;

      if (restoredRunning && restoredEndTime) {
        const remainingMs = restoredEndTime - Date.now();
        const remainingSec = Math.ceil(remainingMs / 1000);
        if (remainingSec > 0) {
          restoredTimeLeft = remainingSec;
        } else {
          // Timer finished while closed: restore at 0 to complete or fresh phase
          restoredTimeLeft = 0;
        }
      }

      initialData.current = {
        phase: restored.phase || 'work',
        timeLeft: restoredTimeLeft,
        isRunning: restoredRunning && restoredEndTime ? restoredEndTime > Date.now() : false,
        endTime: restoredRunning && restoredEndTime && restoredEndTime > Date.now() ? restoredEndTime : null,
        currentRound: restored.currentRound || 1,
        activeTaskId: restored.activeTaskId || null,
        dateKey: todayKey,
        focusSessionStartTime:
          restoredRunning && restoredEndTime && restoredEndTime <= Date.now()
            ? null
            : restored.focusSessionStartTime || null,
      };
    } else {
      // Fresh new day or first load
      initialData.current = {
        phase: 'work',
        timeLeft: getTotalTimeForPhase('work'),
        isRunning: false,
        endTime: null,
        currentRound: 1,
        activeTaskId: null,
        dateKey: todayKey,
        focusSessionStartTime: null,
      };
    }
  }

  const [phase, setPhase] = useState<PomodoroPhase>(initialData.current.phase);
  const [timeLeft, setTimeLeft] = useState<number>(initialData.current.timeLeft);
  const [isRunning, setIsRunning] = useState<boolean>(initialData.current.isRunning);
  const [currentRound, setCurrentRound] = useState<number>(initialData.current.currentRound);
  const [activeTaskId, setActiveTaskId] = useState<string | null>(initialData.current.activeTaskId);
  const [focusSessionStartTime, setFocusSessionStartTime] = useState<number | null>(
    initialData.current.focusSessionStartTime
  );
  
  // Streak & Daily Done states synced with stats
  const [completedRounds, setCompletedRounds] = useState<number>(() => getTodayCompletedRounds());
  const [consecutiveStreak, setConsecutiveStreak] = useState<number>(() => getConsecutiveDayStreak());
  const [currentDateKey, setCurrentDateKey] = useState<string>(() => formatDateKey(new Date()));

  // Wall-Clock Refs
  const endTimeRef = useRef<number | null>(initialData.current.endTime);
  const timeLeftRef = useRef<number>(timeLeft);
  timeLeftRef.current = timeLeft;
  const lastSecondTickRef = useRef<number>(timeLeft);
  const phaseRef = useRef<PomodoroPhase>(phase);
  phaseRef.current = phase;
  const currentRoundRef = useRef<number>(currentRound);
  currentRoundRef.current = currentRound;
  const activeTaskIdRef = useRef<string | null>(activeTaskId);
  activeTaskIdRef.current = activeTaskId;
  const focusSessionStartTimeRef = useRef<number | null>(focusSessionStartTime);
  focusSessionStartTimeRef.current = focusSessionStartTime;
  const secondsFocusedInMinuteRef = useRef<number>(0);
  const currentDateKeyRef = useRef<string>(currentDateKey);
  currentDateKeyRef.current = currentDateKey;

  // Save current continuous state to localStorage
  const saveStateToDisk = useCallback(
    (timeVal: number, runningVal: boolean, endVal: number | null, pVal: PomodoroPhase, roundVal: number, taskVal: string | null, focusStartVal?: number | null) => {
      try {
        const payload: StoredPomodoroState = {
          phase: pVal,
          timeLeft: timeVal,
          isRunning: runningVal,
          endTime: endVal,
          currentRound: roundVal,
          activeTaskId: taskVal,
          dateKey: formatDateKey(new Date()),
          focusSessionStartTime: focusStartVal !== undefined ? focusStartVal : focusSessionStartTimeRef.current,
          lastSavedAt: Date.now(),
        };
        localStorage.setItem(POMODORO_PERSISTENCE_KEY, JSON.stringify(payload));
      } catch (e) {
        console.debug('Failed to save continuous pomodoro state', e);
      }
    },
    []
  );

  // Play appropriate alert chime
  const playAlertForPhase = useCallback((p: PomodoroPhase) => {
    const s = settingsRef.current;
    if (!s.soundAlerts) return;
    if (p === 'work') {
      triggerSoundAlert(s.workSound, s.customWorkSoundData);
    } else if (p === 'shortBreak') {
      triggerSoundAlert(s.shortBreakSound, s.customBreakSoundData);
    } else {
      triggerSoundAlert(s.longBreakSound, s.customLongBreakSoundData);
    }
  }, []);

  // Switch phase
  const switchPhase = useCallback(
    (nextPhase: PomodoroPhase, autoStart: boolean = false) => {
      setPhase(nextPhase);
      phaseRef.current = nextPhase;
      const nextDuration = getTotalTimeForPhase(nextPhase);
      setTimeLeft(nextDuration);
      timeLeftRef.current = nextDuration;
      lastSecondTickRef.current = nextDuration;

      let nextEndTime: number | null = null;
      let newFocusStartTime: number | null = null;

      if (nextPhase !== 'work') {
        // Focus session is over!
        newFocusStartTime = null;
        focusSessionStartTimeRef.current = null;
        setFocusSessionStartTime(null);
      } else {
        if (autoStart) {
          newFocusStartTime = Date.now();
          focusSessionStartTimeRef.current = newFocusStartTime;
          setFocusSessionStartTime(newFocusStartTime);
        } else {
          newFocusStartTime = null;
          focusSessionStartTimeRef.current = null;
          setFocusSessionStartTime(null);
        }
      }

      if (autoStart) {
        nextEndTime = Date.now() + nextDuration * 1000;
        endTimeRef.current = nextEndTime;
        setIsRunning(true);
        if (settingsRef.current.soundAlerts) {
          playPomodoroStart();
        }
      } else {
        endTimeRef.current = null;
        setIsRunning(false);
      }

      saveStateToDisk(
        nextDuration,
        autoStart,
        nextEndTime,
        nextPhase,
        currentRoundRef.current,
        activeTaskIdRef.current,
        newFocusStartTime
      );
    },
    [getTotalTimeForPhase, saveStateToDisk]
  );

  // Phase completion handler
  const handlePhaseComplete = useCallback(() => {
    const currentPhase = phaseRef.current;
    playAlertForPhase(currentPhase);

    if (currentPhase === 'work') {
      // Focus session is over! Reset focus session start time so all quarantined messages unlock
      focusSessionStartTimeRef.current = null;
      setFocusSessionStartTime(null);

      // 1. Record completed session to local daily stats
      recordFocusMinutes(0, true);

      // 2. Sync to today's completed rounds & consecutive streak
      const updatedRounds = getTodayCompletedRounds();
      setCompletedRounds(updatedRounds);
      setConsecutiveStreak(getConsecutiveDayStreak());

      // 3. Credit completed session to party leaderboard
      const partyIds = getSavedPartyIds();
      if (partyIds.length > 0) {
        syncFocusTimeToParties(partyIds, 0, true, 'break');
      }

      // 4. Increment completed pomodoros count on active task
      if (activeTaskIdRef.current) {
        const taskId = activeTaskIdRef.current;
        try {
          const rawTasks = localStorage.getItem(TASKS_STORAGE_KEY);
          if (rawTasks) {
            const parsedTasks: PomodoroTask[] = JSON.parse(rawTasks);
            const updatedTasks = parsedTasks.map((t) =>
              t.id === taskId ? { ...t, completedPomodoros: t.completedPomodoros + 1 } : t
            );
            localStorage.setItem(TASKS_STORAGE_KEY, JSON.stringify(updatedTasks));
          }
        } catch (e) {
          console.debug('Failed to increment task pomodoros', e);
        }
      }

      // 5. Check for long break vs short break
      if (currentRoundRef.current >= settingsRef.current.longBreakInterval) {
        setCurrentRound(1);
        currentRoundRef.current = 1;
        const autoStartLong = settingsRef.current.autoStartLongBreaks ?? settingsRef.current.autoStartBreaks;
        switchPhase('longBreak', Boolean(autoStartLong));
      } else {
        const nextRound = currentRoundRef.current + 1;
        setCurrentRound(nextRound);
        currentRoundRef.current = nextRound;
        switchPhase('shortBreak', Boolean(settingsRef.current.autoStartBreaks));
      }
    } else {
      // Break completed, back to work
      switchPhase('work', Boolean(settingsRef.current.autoStartPomodoros));
    }
  }, [playAlertForPhase, switchPhase]);

  // Midnight 12:00 AM Rollover Verification
  const checkMidnightRollover = useCallback(() => {
    const nowKey = formatDateKey(new Date());
    if (nowKey !== currentDateKeyRef.current) {
      // Midnight 12:00 AM has passed!
      currentDateKeyRef.current = nowKey;
      setCurrentDateKey(nowKey);

      // Reset today's completed rounds to 0 for the fresh new day
      setCompletedRounds(0);

      // Reset round cycle for the new day
      setCurrentRound(1);
      currentRoundRef.current = 1;

      // Recalculate streak (preserves streak if user was active yesterday, resets if missed)
      setConsecutiveStreak(getConsecutiveDayStreak());

      // Save refreshed daily metadata to disk
      saveStateToDisk(
        timeLeftRef.current,
        isRunning,
        endTimeRef.current,
        phaseRef.current,
        1,
        activeTaskIdRef.current
      );
    }
  }, [isRunning, saveStateToDisk]);

  // Precision Midnight Timer Scheduler: fires right at 12:00:00 AM
  useEffect(() => {
    const scheduleNextMidnight = () => {
      const now = new Date();
      // Next midnight: tomorrow at 00:00:00.050
      const nextMidnight = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate() + 1,
        0,
        0,
        0,
        50
      );
      const delayMs = Math.max(1000, nextMidnight.getTime() - now.getTime());

      const timer = setTimeout(() => {
        checkMidnightRollover();
        scheduleNextMidnight();
      }, delayMs);

      return timer;
    };

    const midnightTimer = scheduleNextMidnight();
    return () => clearTimeout(midnightTimer);
  }, [checkMidnightRollover]);

  // High-Precision Real-Time Engine (Continuous across view changes)
  useEffect(() => {
    if (!isRunning) {
      endTimeRef.current = null;
      return;
    }

    // Anchor target wall-clock timestamp
    if (!endTimeRef.current) {
      endTimeRef.current = Date.now() + timeLeftRef.current * 1000;
      lastSecondTickRef.current = timeLeftRef.current;
    }

    const checkTimerTick = () => {
      // 1. Midnight rollover check
      checkMidnightRollover();

      if (!endTimeRef.current) return;
      const now = Date.now();
      const remainingMs = endTimeRef.current - now;
      const calculatedSeconds = Math.max(0, Math.ceil(remainingMs / 1000));

      if (calculatedSeconds !== timeLeftRef.current) {
        const previousTime = timeLeftRef.current;
        const secondsElapsed = Math.max(1, previousTime - calculatedSeconds);
        timeLeftRef.current = calculatedSeconds;
        setTimeLeft(calculatedSeconds);

        // Sound tick on second change
        if (calculatedSeconds < previousTime && settingsRef.current.tickSound && calculatedSeconds > 0) {
          playTickSound();
        }
        lastSecondTickRef.current = calculatedSeconds;

        // Credit focus minutes to daily stats & parties every 60s
        if (phaseRef.current === 'work') {
          secondsFocusedInMinuteRef.current += secondsElapsed;
          if (secondsFocusedInMinuteRef.current >= 60) {
            const minutesToCredit = Math.floor(secondsFocusedInMinuteRef.current / 60);
            secondsFocusedInMinuteRef.current = secondsFocusedInMinuteRef.current % 60;
            recordFocusMinutes(minutesToCredit, false);
            const partyIds = getSavedPartyIds();
            if (partyIds.length > 0) {
              syncFocusTimeToParties(partyIds, minutesToCredit, false, 'focusing');
            }
          }
        }

        // Periodically save state (every 5 seconds) to avoid unnecessary disk writes while running
        if (calculatedSeconds % 5 === 0 || calculatedSeconds <= 2) {
          saveStateToDisk(
            calculatedSeconds,
            true,
            endTimeRef.current,
            phaseRef.current,
            currentRoundRef.current,
            activeTaskIdRef.current
          );
        }

        // Phase finished
        if (calculatedSeconds <= 0) {
          endTimeRef.current = null;
          handlePhaseComplete();
        }
      }
    };

    // Fast 200ms tick for zero jitter and instantaneous reaction
    const interval = window.setInterval(checkTimerTick, 200);

    // Immediate check on tab focus / visibility change
    const handleVisibilityChange = () => {
      checkMidnightRollover();
      if (document.visibilityState === 'visible') {
        checkTimerTick();
      }
    };
    const handleFocus = () => {
      checkMidnightRollover();
      checkTimerTick();
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, [isRunning, handlePhaseComplete, checkMidnightRollover, saveStateToDisk]);

  // Live Browser Tab Title Synchronization (Active across entire app)
  useEffect(() => {
    if (isRunning) {
      const minStr = String(Math.floor(timeLeft / 60)).padStart(2, '0');
      const secStr = String(timeLeft % 60).padStart(2, '0');
      const phaseLabel = phase === 'work' ? 'Focus' : 'Break';
      document.title = `(${minStr}:${secStr}) ${phaseLabel} | Desk Clock`;
    } else {
      document.title = 'Desk Clock & Pomodoro';
    }
    return () => {
      document.title = 'Desk Clock & Pomodoro';
    };
  }, [isRunning, timeLeft, phase]);

  // Party member status sync (focusing, break, idle)
  useEffect(() => {
    const partyIds = getSavedPartyIds();
    if (partyIds.length === 0) return;

    const status = !isRunning
      ? 'idle'
      : phase === 'work'
      ? 'focusing'
      : 'break';

    updatePartyMemberStatus(partyIds, status);
  }, [isRunning, phase]);

  // Controls: Play / Pause toggle
  const togglePlayPause = useCallback(() => {
    setIsRunning((prev) => {
      const next = !prev;
      let nextEnd: number | null = null;
      let currentFocusStart = focusSessionStartTimeRef.current;

      if (next) {
        nextEnd = Date.now() + timeLeftRef.current * 1000;
        endTimeRef.current = nextEnd;
        lastSecondTickRef.current = timeLeftRef.current;

        // If starting a work session and no focus start time set, mark it now
        if (phaseRef.current === 'work' && !currentFocusStart) {
          currentFocusStart = Date.now();
          focusSessionStartTimeRef.current = currentFocusStart;
          setFocusSessionStartTime(currentFocusStart);
        }

        if (settingsRef.current.soundAlerts) {
          playPomodoroStart();
        }
      } else {
        endTimeRef.current = null;
        // NOTE: Pausing does NOT end the focus session! focusSessionStartTime remains intact!
      }

      saveStateToDisk(
        timeLeftRef.current,
        next,
        nextEnd,
        phaseRef.current,
        currentRoundRef.current,
        activeTaskIdRef.current,
        currentFocusStart
      );
      return next;
    });
  }, [saveStateToDisk]);

  // Controls: Explicit Pause helper (pauses without toggling if already paused)
  const pauseTimer = useCallback(() => {
    setIsRunning((prev) => {
      if (!prev) return false;
      endTimeRef.current = null;
      saveStateToDisk(
        timeLeftRef.current,
        false,
        null,
        phaseRef.current,
        currentRoundRef.current,
        activeTaskIdRef.current,
        focusSessionStartTimeRef.current
      );
      return false;
    });
  }, [saveStateToDisk]);

  // Controls: Reset current phase timer (session is over/cancelled)
  const handleReset = useCallback(() => {
    setIsRunning(false);
    endTimeRef.current = null;
    focusSessionStartTimeRef.current = null;
    setFocusSessionStartTime(null);

    const duration = getTotalTimeForPhase(phaseRef.current);
    setTimeLeft(duration);
    timeLeftRef.current = duration;
    lastSecondTickRef.current = duration;
    saveStateToDisk(
      duration,
      false,
      null,
      phaseRef.current,
      currentRoundRef.current,
      activeTaskIdRef.current,
      null
    );
  }, [getTotalTimeForPhase, saveStateToDisk]);

  // Controls: Skip to next phase (current focus session is over)
  const handleSkip = useCallback(() => {
    if (phaseRef.current === 'work') {
      focusSessionStartTimeRef.current = null;
      setFocusSessionStartTime(null);

      if (currentRoundRef.current >= settingsRef.current.longBreakInterval) {
        setCurrentRound(1);
        currentRoundRef.current = 1;
        switchPhase('longBreak');
      } else {
        const nextRound = currentRoundRef.current + 1;
        setCurrentRound(nextRound);
        currentRoundRef.current = nextRound;
        switchPhase('shortBreak');
      }
    } else {
      switchPhase('work');
    }
  }, [switchPhase]);

  // Controls: Quick adjust +1 minute
  const handleAddMinute = useCallback(() => {
    setTimeLeft((prev) => {
      const next = prev + 60;
      timeLeftRef.current = next;
      lastSecondTickRef.current = next;
      if (endTimeRef.current) {
        endTimeRef.current += 60000;
      }
      saveStateToDisk(
        next,
        isRunning,
        endTimeRef.current,
        phaseRef.current,
        currentRoundRef.current,
        activeTaskIdRef.current
      );
      return next;
    });
  }, [isRunning, saveStateToDisk]);

  // Controls: Quick adjust -1 minute
  const handleMinusMinute = useCallback(() => {
    setTimeLeft((prev) => {
      const next = Math.max(60, prev - 60);
      timeLeftRef.current = next;
      lastSecondTickRef.current = next;
      if (endTimeRef.current) {
        endTimeRef.current = Date.now() + next * 1000;
      }
      saveStateToDisk(
        next,
        isRunning,
        endTimeRef.current,
        phaseRef.current,
        currentRoundRef.current,
        activeTaskIdRef.current
      );
      return next;
    });
  }, [isRunning, saveStateToDisk]);

  // Select active task
  const handleSetActiveTaskId = useCallback(
    (id: string | null) => {
      setActiveTaskId(id);
      activeTaskIdRef.current = id;
      saveStateToDisk(
        timeLeftRef.current,
        isRunning,
        endTimeRef.current,
        phaseRef.current,
        currentRoundRef.current,
        id
      );
    },
    [isRunning, saveStateToDisk]
  );

  const totalTime = getTotalTimeForPhase(phase);

  return {
    phase,
    timeLeft,
    totalTime,
    isRunning,
    isFocusRunning: isRunning && phase === 'work',
    isInFocusSession: phase === 'work' && focusSessionStartTime !== null,
    focusSessionStartTime,
    currentRound,
    completedRounds,
    consecutiveStreak,
    activeTaskId,
    togglePlayPause,
    pauseTimer,
    handleReset,
    handleSkip,
    handleAddMinute,
    handleMinusMinute,
    switchPhase,
    setActiveTaskId: handleSetActiveTaskId,
    getTotalTimeForPhase,
  };
}
