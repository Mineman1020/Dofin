import { doc, getDoc, setDoc, updateDoc, onSnapshot } from 'firebase/firestore';
import { db, getOrCreateAvatarColor } from './firebase';
import { UserAccount, UserCloudSyncData, PomodoroTask } from '../types';
import { DEFAULT_CLOCK_SETTINGS, DEFAULT_POMODORO_SETTINGS } from './constants';
import {
  getStoredDailyStats,
  getConsecutiveDayStreak,
  getTodayCompletedRounds,
} from './statsStorage';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: null,
      email: null,
      emailVerified: false,
      isAnonymous: false,
      tenantId: null,
      providerInfo: [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

/**
 * Recursively remove or convert undefined values to prevent Firestore 'Unsupported field value: undefined' errors
 */
export function sanitizeForFirestore<T>(data: T): T {
  if (data === null || data === undefined) {
    return null as unknown as T;
  }
  return JSON.parse(
    JSON.stringify(data, (_key, value) => {
      if (value === undefined) return null;
      return value;
    })
  );
}

const ACCOUNT_STORAGE_KEY = 'desk_clock_account_v1';
const LAST_SYNC_STORAGE_KEY = 'desk_clock_last_sync_v1';
const PASSWORD_SALT = '_dek_clock_secure_salt_2026_';

// Local storage keys that contain user's progress and custom setup
export const SYNC_KEYS = {
  USER_NAME: 'desk_clock_user_name',
  CLOCK_SETTINGS: 'desk_clock_settings_v1',
  POMODORO_SETTINGS: 'desk_clock_pomodoro_v1',
  DARK_MODE: 'desk_clock_dark_mode_v1',
  TASKS: 'desk_clock_pomodoro_tasks_v1',
  LEGACY_TASKS: 'deskclock_pomodoro_tasks',
  STATS: 'deskclock_daily_stats',
  LEGACY_STATS: 'desk_clock_focus_stats_v1',
  DEVICE_MODE: 'desk_clock_device_mode',
  ACTIVE_SESSION: 'desk_clock_active_session_v1',
  SAVED_PARTIES: 'desk_clock_saved_parties',
  ACTIVE_PARTY_ID: 'desk_clock_active_party_id',
};

/**
 * Hash password with SHA-256 and salt using native browser Web Crypto API
 */
export async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password + PASSWORD_SALT);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Format and normalize username to ensure it ends with @dek
 * e.g. "alex" -> "alex@dek", "john@dek" -> "john@dek"
 */
export function formatUsername(input: string): string {
  const trimmed = input.trim().toLowerCase();
  if (!trimmed) return '';

  let handle = trimmed;

  // If user entered an email address (e.g. name@gmail.com), extract their handle
  if (handle.includes('@') && !handle.endsWith('@dek')) {
    handle = handle.split('@')[0].trim();
  }

  // Strip duplicate or existing @dek suffixes
  while (handle.endsWith('@dek')) {
    handle = handle.slice(0, -4).trim();
  }

  // Strip any trailing @ symbol
  handle = handle.replace(/@+$/, '').trim();
  if (!handle) return '';

  return `${handle}@dek`;
}

/**
 * Validate username format: must end with @dek, contain 2-40 character prefix of [a-z0-9._-]
 */
export function validateUsername(username: string): { isValid: boolean; error?: string } {
  const normalized = formatUsername(username);
  if (!normalized) {
    return { isValid: false, error: 'Please enter a username.' };
  }
  if (!normalized.endsWith('@dek')) {
    return { isValid: false, error: 'Username must end with @dek (e.g. yourname@dek).' };
  }
  const prefix = normalized.slice(0, -4);
  if (prefix.length < 2) {
    return { isValid: false, error: 'Username must have at least 2 characters before @dek.' };
  }
  if (prefix.length > 40) {
    return { isValid: false, error: 'Username is too long (maximum 40 characters).' };
  }
  if (!/^[a-z0-9._-]+@dek$/.test(normalized)) {
    return {
      isValid: false,
      error: 'Username can only contain letters, numbers, dots (.), underscores (_), and hyphens (-).',
    };
  }
  return { isValid: true };
}

/**
 * Validate password requirements
 */
export function validatePassword(password: string): { isValid: boolean; error?: string } {
  if (!password || password.length < 4) {
    return { isValid: false, error: 'Password must be at least 4 characters long.' };
  }
  if (password.length > 80) {
    return { isValid: false, error: 'Password is too long (maximum 80 characters).' };
  }
  return { isValid: true };
}

/**
 * Safe document ID generator from username
 */
export function getAccountDocId(normalizedUsername: string): string {
  const formatted = formatUsername(normalizedUsername);
  return formatted.toLowerCase().replace(/[^a-z0-9_.-]/g, '_');
}

/**
 * Get active logged-in account from localStorage, or null if guest
 */
export function getActiveAccount(): UserAccount | null {
  try {
    const raw = localStorage.getItem(ACCOUNT_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (e) {
    console.debug('Failed to parse active account:', e);
    return null;
  }
}

/**
 * Check if the user is in Guest Mode
 */
export function isGuestMode(): boolean {
  return getActiveAccount() === null;
}

/**
 * Get last sync timestamp string
 */
export function getLastSyncTime(): string | null {
  return localStorage.getItem(LAST_SYNC_STORAGE_KEY);
}

/**
 * Collect all current local storage data into a sync packet
 */
export function collectCurrentLocalData(): UserCloudSyncData {
  let clockSettings = { ...DEFAULT_CLOCK_SETTINGS };
  let pomodoroSettings = { ...DEFAULT_POMODORO_SETTINGS };
  let tasks: PomodoroTask[] = [];
  let stats: Record<string, { focusMinutes: number; completedSessions: number; tasksCompleted: number }> | null = null;
  let isDarkMode = false;
  let userName = '';
  let completedRounds = 0;
  let consecutiveStreak = 0;
  let deviceMode: 'pc' | 'mobile' = 'pc';
  let savedPartyIds: string[] = [];
  let activePartyId: string | null = null;

  try {
    const rawClock = localStorage.getItem(SYNC_KEYS.CLOCK_SETTINGS);
    if (rawClock) {
      try {
        clockSettings = { ...DEFAULT_CLOCK_SETTINGS, ...JSON.parse(rawClock) };
      } catch (e) {
        console.debug('Error reading clock settings:', e);
      }
    }

    const rawPomo = localStorage.getItem(SYNC_KEYS.POMODORO_SETTINGS);
    if (rawPomo) {
      try {
        pomodoroSettings = { ...DEFAULT_POMODORO_SETTINGS, ...JSON.parse(rawPomo) };
      } catch (e) {
        console.debug('Error reading pomodoro settings:', e);
      }
    }

    // Check both current and legacy keys for tasks
    const rawTasks = localStorage.getItem(SYNC_KEYS.TASKS) || localStorage.getItem(SYNC_KEYS.LEGACY_TASKS);
    if (rawTasks) {
      try {
        tasks = JSON.parse(rawTasks);
      } catch (e) {
        console.debug('Error reading tasks:', e);
      }
    }

    // Check both current and legacy keys for daily focus stats, or load from stats storage
    const rawStats = localStorage.getItem(SYNC_KEYS.STATS) || localStorage.getItem(SYNC_KEYS.LEGACY_STATS);
    if (rawStats) {
      try {
        stats = JSON.parse(rawStats);
      } catch (e) {
        console.debug('Error reading stats:', e);
      }
    }
    if (!stats || Object.keys(stats).length === 0) {
      try {
        stats = getStoredDailyStats();
      } catch {}
    }

    const rawDark = localStorage.getItem(SYNC_KEYS.DARK_MODE);
    if (rawDark !== null) isDarkMode = rawDark === 'true';

    userName = localStorage.getItem(SYNC_KEYS.USER_NAME) || '';

    const rawDevice = localStorage.getItem(SYNC_KEYS.DEVICE_MODE);
    if (rawDevice === 'pc' || rawDevice === 'mobile') {
      deviceMode = rawDevice;
    }

    const rawParties = localStorage.getItem(SYNC_KEYS.SAVED_PARTIES);
    if (rawParties) {
      try {
        savedPartyIds = JSON.parse(rawParties);
      } catch {}
    }

    activePartyId = localStorage.getItem(SYNC_KEYS.ACTIVE_PARTY_ID) || null;

    const rawSession = localStorage.getItem(SYNC_KEYS.ACTIVE_SESSION);
    if (rawSession) {
      try {
        const sess = JSON.parse(rawSession);
        completedRounds = sess.completedRounds || 0;
        consecutiveStreak = sess.consecutiveStreak || 0;
      } catch (e) {
        console.debug('Error reading active session:', e);
      }
    }
    if (completedRounds === 0) {
      try {
        completedRounds = getTodayCompletedRounds();
      } catch {}
    }
    if (consecutiveStreak === 0) {
      try {
        consecutiveStreak = getConsecutiveDayStreak();
      } catch {}
    }
  } catch (e) {
    console.debug('Error collecting local data for sync:', e);
  }

  const result: UserCloudSyncData = {
    userName,
    isDarkMode,
    deviceMode,
    clockSettings,
    pomodoroSettings,
    tasks,
    stats: stats || undefined,
    completedRounds,
    consecutiveStreak,
    savedPartyIds,
    activePartyId,
    syncedAt: new Date().toISOString(),
  };

  return sanitizeForFirestore(result);
}

/**
 * Apply cloud data to localStorage and notify app
 */
export function applySyncDataToLocalStorage(data: UserCloudSyncData): void {
  try {
    if (data.userName) {
      localStorage.setItem(SYNC_KEYS.USER_NAME, data.userName);
    }
    if (data.isDarkMode !== undefined) {
      localStorage.setItem(SYNC_KEYS.DARK_MODE, String(data.isDarkMode));
    }
    if (data.deviceMode) {
      localStorage.setItem(SYNC_KEYS.DEVICE_MODE, data.deviceMode);
    }
    if (data.clockSettings) {
      localStorage.setItem(SYNC_KEYS.CLOCK_SETTINGS, JSON.stringify(data.clockSettings));
    }
    if (data.pomodoroSettings) {
      localStorage.setItem(SYNC_KEYS.POMODORO_SETTINGS, JSON.stringify(data.pomodoroSettings));
    }
    if (data.tasks && Array.isArray(data.tasks)) {
      localStorage.setItem(SYNC_KEYS.TASKS, JSON.stringify(data.tasks));
      localStorage.setItem(SYNC_KEYS.LEGACY_TASKS, JSON.stringify(data.tasks));
    }
    if (data.stats) {
      localStorage.setItem(SYNC_KEYS.STATS, JSON.stringify(data.stats));
      localStorage.setItem(SYNC_KEYS.LEGACY_STATS, JSON.stringify(data.stats));
    }
    if (data.savedPartyIds && Array.isArray(data.savedPartyIds)) {
      localStorage.setItem(SYNC_KEYS.SAVED_PARTIES, JSON.stringify(data.savedPartyIds));
    }
    if (data.activePartyId !== undefined) {
      if (data.activePartyId) {
        localStorage.setItem(SYNC_KEYS.ACTIVE_PARTY_ID, data.activePartyId);
      } else {
        localStorage.removeItem(SYNC_KEYS.ACTIVE_PARTY_ID);
      }
    }
    if (data.completedRounds !== undefined || data.consecutiveStreak !== undefined) {
      const existing = localStorage.getItem(SYNC_KEYS.ACTIVE_SESSION);
      let sessionObj: Record<string, unknown> = {};
      if (existing) {
        try {
          sessionObj = JSON.parse(existing);
        } catch {
          // ignore
        }
      }
      sessionObj.completedRounds = data.completedRounds ?? sessionObj.completedRounds ?? 0;
      sessionObj.consecutiveStreak = data.consecutiveStreak ?? sessionObj.consecutiveStreak ?? 0;
      localStorage.setItem(SYNC_KEYS.ACTIVE_SESSION, JSON.stringify(sessionObj));
    }
    localStorage.setItem(LAST_SYNC_STORAGE_KEY, data.syncedAt || new Date().toISOString());

    // Broadcast event across components so state updates live
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('desk_clock_data_synced', { detail: data }));
    }
  } catch (e) {
    console.error('Failed to apply sync data to localStorage:', e);
  }
}

let autoSyncDebounceTimer: any = null;

/**
 * Automatically debounces and uploads local state to cloud if user is signed in
 */
export function triggerAutoCloudSync(): void {
  const account = getActiveAccount();
  if (!account) return;

  if (autoSyncDebounceTimer) {
    clearTimeout(autoSyncDebounceTimer);
  }

  autoSyncDebounceTimer = setTimeout(async () => {
    try {
      await syncLocalDataToCloud(account);
      console.debug('Cloud sync auto-push complete for', account.username);
    } catch (e) {
      console.debug('Background auto-sync note:', e);
    }
  }, 1000);
}

/**
 * Subscribe to real-time cloud updates for the logged in account (multi-device live sync)
 */
export function subscribeToAccountCloudSync(
  account: UserAccount,
  onRemoteUpdate?: (data: UserCloudSyncData) => void
): () => void {
  const docId = getAccountDocId(account.username);
  const docRef = doc(db, 'accounts', docId);

  return onSnapshot(
    docRef,
    (snap) => {
      if (!snap.exists()) return;
      // Skip local writes that originated from this client to avoid infinite feedback loops
      if (snap.metadata.hasPendingWrites) return;

      const data = snap.data();
      const syncData = data.syncData as UserCloudSyncData | undefined;
      if (!syncData) return;

      const localSyncTime = localStorage.getItem(LAST_SYNC_STORAGE_KEY);
      // If remote timestamp is strictly newer than our last sync time, merge it in!
      if (!localSyncTime || (syncData.syncedAt && syncData.syncedAt > localSyncTime)) {
        applySyncDataToLocalStorage(syncData);
        onRemoteUpdate?.(syncData);
      }
    },
    (err) => {
      console.debug('Error in account cloud sync subscription:', err);
    }
  );
}

/**
 * Create a new @dek user account with optional current device data attached
 */
export async function createAccount(
  rawUsername: string,
  rawPassword: string,
  rawDisplayName?: string,
  currentLocalData?: UserCloudSyncData
): Promise<{ account: UserAccount; syncData: UserCloudSyncData }> {
  const username = formatUsername(rawUsername);
  const uCheck = validateUsername(username);
  if (!uCheck.isValid) {
    throw new Error(uCheck.error || 'Invalid username');
  }

  const pCheck = validatePassword(rawPassword);
  if (!pCheck.isValid) {
    throw new Error(pCheck.error || 'Invalid password');
  }

  const docId = getAccountDocId(username);
  const docRef = doc(db, 'accounts', docId);

  // Check if account already exists
  let existingDoc;
  try {
    existingDoc = await getDoc(docRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, `accounts/${docId}`);
  }

  if (existingDoc && existingDoc.exists()) {
    throw new Error(`An account with username "${username}" already exists. Please sign in instead.`);
  }

  const passwordHash = await hashPassword(rawPassword);
  const displayName = (rawDisplayName?.trim() || username.replace(/@dek$/, '') || 'User').slice(0, 40);
  const now = new Date().toISOString();
  const avatarColor = getOrCreateAvatarColor();

  const syncData = sanitizeForFirestore(currentLocalData || collectCurrentLocalData());
  // Ensure the user's name is in sync with displayName
  syncData.userName = displayName;
  syncData.syncedAt = now;

  const account: UserAccount = {
    username,
    displayName,
    avatarColor,
    createdAt: now,
    lastLoginAt: now,
    updatedAt: now,
  };

  const payload = sanitizeForFirestore({
    ...account,
    passwordHash,
    syncData,
  });

  // Save to Firestore
  try {
    await setDoc(docRef, payload);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `accounts/${docId}`);
  }

  // Save active session in localStorage
  localStorage.setItem(ACCOUNT_STORAGE_KEY, JSON.stringify(account));
  localStorage.setItem(SYNC_KEYS.USER_NAME, displayName);
  localStorage.setItem(LAST_SYNC_STORAGE_KEY, now);

  return { account, syncData };
}

/**
 * Sign in with @dek credentials and sync cloud data to this device
 */
export async function signIn(
  rawUsername: string,
  rawPassword: string
): Promise<{ account: UserAccount; syncData: UserCloudSyncData | null }> {
  const username = formatUsername(rawUsername);
  const uCheck = validateUsername(username);
  if (!uCheck.isValid) {
    throw new Error(uCheck.error || 'Invalid username');
  }

  const pCheck = validatePassword(rawPassword);
  if (!pCheck.isValid) {
    throw new Error(pCheck.error || 'Invalid password');
  }

  const docId = getAccountDocId(username);
  const docRef = doc(db, 'accounts', docId);
  let docSnap;
  try {
    docSnap = await getDoc(docRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, `accounts/${docId}`);
  }

  if (!docSnap.exists()) {
    throw new Error(`No account found for "${username}". Please check your username or create an account.`);
  }

  const data = docSnap.data();
  const computedHash = await hashPassword(rawPassword);

  if (data.passwordHash !== computedHash) {
    throw new Error('Incorrect password. Please verify and try again.');
  }

  const now = new Date().toISOString();
  const account: UserAccount = {
    username: data.username,
    displayName: data.displayName,
    avatarColor: data.avatarColor || getOrCreateAvatarColor(),
    createdAt: data.createdAt,
    lastLoginAt: now,
    updatedAt: data.updatedAt || now,
  };

  // Update last login in Firestore
  try {
    await updateDoc(docRef, { lastLoginAt: now });
  } catch (e) {
    console.debug('Failed to update lastLoginAt in Firestore:', e);
  }

  // Restore sync data to localStorage
  const syncData: UserCloudSyncData | null = data.syncData || null;
  if (syncData) {
    applySyncDataToLocalStorage(syncData);
  }

  // Save active account
  localStorage.setItem(ACCOUNT_STORAGE_KEY, JSON.stringify(account));
  localStorage.setItem(SYNC_KEYS.USER_NAME, account.displayName);
  localStorage.setItem(LAST_SYNC_STORAGE_KEY, syncData?.syncedAt || now);

  return { account, syncData };
}

/**
 * Force cloud sync immediately without debounce delay
 */
export async function forceCloudSyncNow(account?: UserAccount | null): Promise<void> {
  const target = account || getActiveAccount();
  if (!target) return;
  if (autoSyncDebounceTimer) {
    clearTimeout(autoSyncDebounceTimer);
    autoSyncDebounceTimer = null;
  }
  await syncLocalDataToCloud(target);
}

/**
 * Sync current local device data to cloud
 */
export async function syncLocalDataToCloud(
  account: UserAccount,
  customData?: UserCloudSyncData
): Promise<void> {
  const docId = getAccountDocId(account.username);
  const docRef = doc(db, 'accounts', docId);
  const now = new Date().toISOString();

  const syncData = sanitizeForFirestore(customData || collectCurrentLocalData());
  syncData.syncedAt = now;

  try {
    await updateDoc(docRef, {
      syncData,
      updatedAt: now,
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `accounts/${docId}`);
  }

  localStorage.setItem(LAST_SYNC_STORAGE_KEY, now);
}

/**
 * Pull latest cloud data and restore locally
 */
export async function pullCloudDataToLocal(account: UserAccount): Promise<UserCloudSyncData | null> {
  const docId = getAccountDocId(account.username);
  const docRef = doc(db, 'accounts', docId);
  let docSnap;
  try {
    docSnap = await getDoc(docRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, `accounts/${docId}`);
  }

  if (!docSnap.exists()) return null;

  const data = docSnap.data();
  const syncData = data.syncData as UserCloudSyncData | undefined;

  if (syncData) {
    applySyncDataToLocalStorage(syncData);
    return syncData;
  }
  return null;
}

/**
 * Sign out of account and revert to guest mode
 */
export function signOut(): void {
  localStorage.removeItem(ACCOUNT_STORAGE_KEY);
  localStorage.removeItem(LAST_SYNC_STORAGE_KEY);
}
