import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  deleteDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  increment,
  updateDoc,
} from 'firebase/firestore';
import { db, getOrCreateUserId, getOrCreateAvatarColor } from './firebase';
import {
  Party,
  PartyMember,
  PartyPurpose,
  MemberStatus,
  PartyMessage,
  MemberStatsSnapshot,
} from '../types';
import {
  formatDateKey,
  getTodayStats,
  getStoredDailyStats,
  getWeeklyStats,
  getConsecutiveDayStreak,
} from './statsStorage';
import { encryptChatMessage, decryptChatMessage } from './crypto';

const MY_PARTIES_KEY = 'desk_clock_saved_parties';
const ACTIVE_PARTY_ID_KEY = 'desk_clock_active_party_id';

// Check if user has opted into sharing stats with party members
export function getIsStatsSharingAllowed(): boolean {
  try {
    const raw = localStorage.getItem('desk_clock_settings_v1');
    if (!raw) return true;
    const parsed = JSON.parse(raw);
    return parsed.shareStatsWithParty !== false;
  } catch {
    return true;
  }
}

// Generate rich, local stats snapshot for party profile viewing
export function getLocalStatsSnapshot(): MemberStatsSnapshot {
  try {
    const today = getTodayStats();
    const stored = getStoredDailyStats();
    let allTime = 0;
    Object.values(stored).forEach((d) => {
      allTime += (d.focusMinutes || 0);
    });
    allTime = Math.max(allTime, today.focusMinutes);
    const previous = Math.max(0, allTime - today.focusMinutes);
    const weekly = getWeeklyStats(0);
    const streak = getConsecutiveDayStreak();

    return {
      todayFocusMinutes: today.focusMinutes,
      allTimeFocusMinutes: allTime,
      previousFocusMinutes: previous,
      weeklyFocusMinutes: weekly.totalFocusMinutes,
      currentStreak: streak,
      tasksCompleted: weekly.totalTasksCompleted,
      completedPomodoros: today.completedSessions,
    };
  } catch {
    return {
      todayFocusMinutes: 0,
      allTimeFocusMinutes: 0,
      previousFocusMinutes: 0,
      weeklyFocusMinutes: 0,
      currentStreak: 0,
      tasksCompleted: 0,
      completedPomodoros: 0,
    };
  }
}

// Local storage helpers to track parties user belongs to
export function getSavedPartyIds(): string[] {
  try {
    const raw = localStorage.getItem(MY_PARTIES_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function savePartyId(partyId: string) {
  const current = getSavedPartyIds();
  if (!current.includes(partyId)) {
    const updated = [...current, partyId];
    localStorage.setItem(MY_PARTIES_KEY, JSON.stringify(updated));
  }
}

export function removeSavedPartyId(partyId: string) {
  const current = getSavedPartyIds();
  const updated = current.filter((id) => id !== partyId);
  localStorage.setItem(MY_PARTIES_KEY, JSON.stringify(updated));
  if (getActivePartyId() === partyId) {
    setActivePartyId(null);
  }
}

export function getActivePartyId(): string | null {
  return localStorage.getItem(ACTIVE_PARTY_ID_KEY);
}

export function setActivePartyId(partyId: string | null) {
  if (partyId) {
    localStorage.setItem(ACTIVE_PARTY_ID_KEY, partyId);
  } else {
    localStorage.removeItem(ACTIVE_PARTY_ID_KEY);
  }
}

// Generate memorable 6-character party codes
export function generatePartyCode(): string {
  const prefixes = ['ST', 'FC', 'WK', 'ZM', 'CD', 'RD'];
  const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
  const num = Math.floor(1000 + Math.random() * 9000);
  return `${prefix}-${num}`;
}

export interface CreatePartyInput {
  name: string;
  description: string;
  purpose: PartyPurpose;
  userName: string;
}

// Create a new Study & Work Party
export async function createParty(input: CreatePartyInput): Promise<Party> {
  const userId = getOrCreateUserId();
  const avatarColor = getOrCreateAvatarColor();
  const code = generatePartyCode();
  const partyRef = doc(collection(db, 'parties'));
  const partyId = partyRef.id;

  const partyData: Omit<Party, 'id'> = {
    code,
    name: input.name.trim(),
    description: input.description.trim(),
    purpose: input.purpose,
    createdBy: userId,
    createdByName: input.userName.trim() || 'Anonymous Host',
    createdAt: new Date().toISOString(),
    memberCount: 1,
  };

  await setDoc(partyRef, partyData);

  // Add creator as the initial member
  const memberRef = doc(db, 'parties', partyId, 'members', userId);
  const todayKey = formatDateKey(new Date());
  const shareStats = getIsStatsSharingAllowed();
  const statsSnapshot = getLocalStatsSnapshot();

  const memberData: PartyMember = {
    id: userId,
    userId,
    name: input.userName.trim() || 'Host',
    avatarColor,
    dailyFocusMinutes: 0,
    lastFocusDate: todayKey,
    totalFocusMinutes: 0,
    completedSessions: 0,
    currentStatus: 'idle',
    lastActiveAt: new Date().toISOString(),
    joinedAt: new Date().toISOString(),
    shareStats,
    ...(shareStats ? { statsSnapshot } : {}),
  };
  await setDoc(memberRef, memberData);

  savePartyId(partyId);
  setActivePartyId(partyId);

  return { id: partyId, ...partyData };
}

// Join an existing party with a code
export async function joinParty(code: string, userName: string): Promise<Party> {
  const cleanCode = code.trim().toUpperCase();
  const userId = getOrCreateUserId();
  const avatarColor = getOrCreateAvatarColor();
  const todayKey = formatDateKey(new Date());
  const shareStats = getIsStatsSharingAllowed();
  const statsSnapshot = getLocalStatsSnapshot();

  const partiesRef = collection(db, 'parties');
  const q = query(partiesRef, where('code', '==', cleanCode));
  const snap = await getDocs(q);

  if (snap.empty) {
    throw new Error(`Party with code "${cleanCode}" was not found. Please check the code and try again.`);
  }

  const partyDoc = snap.docs[0];
  const partyId = partyDoc.id;
  const partyData = partyDoc.data() as Omit<Party, 'id'>;

  // Add or update participant doc in subcollection
  const memberRef = doc(db, 'parties', partyId, 'members', userId);
  const existingMemberSnap = await getDoc(memberRef);

  if (!existingMemberSnap.exists()) {
    const memberData: PartyMember = {
      id: userId,
      userId,
      name: userName.trim() || 'Focus Friend',
      avatarColor,
      dailyFocusMinutes: 0,
      lastFocusDate: todayKey,
      totalFocusMinutes: 0,
      completedSessions: 0,
      currentStatus: 'idle',
      lastActiveAt: new Date().toISOString(),
      joinedAt: new Date().toISOString(),
      shareStats,
      ...(shareStats ? { statsSnapshot } : {}),
    };
    await setDoc(memberRef, memberData);

    // Update member count
    try {
      await updateDoc(partyDoc.ref, {
        memberCount: increment(1),
      });
    } catch (e) {
      console.warn('Could not update member count:', e);
    }
  } else {
    // Refresh user name, stats, and last active
    await updateDoc(memberRef, {
      name: userName.trim() || existingMemberSnap.data()?.name || 'Focus Friend',
      lastActiveAt: new Date().toISOString(),
      shareStats,
      ...(shareStats ? { statsSnapshot } : {}),
    });
  }

  savePartyId(partyId);
  setActivePartyId(partyId);

  return { id: partyId, ...partyData };
}

// Leave a party
export async function leaveParty(partyId: string): Promise<void> {
  const userId = getOrCreateUserId();
  const memberRef = doc(db, 'parties', partyId, 'members', userId);

  try {
    await deleteDoc(memberRef);
  } catch (e) {
    console.warn('Could not remove member record:', e);
  }

  try {
    const partyRef = doc(db, 'parties', partyId);
    await updateDoc(partyRef, {
      memberCount: increment(-1),
    });
  } catch (e) {
    // If party deleted or update failed, continue
  }

  removeSavedPartyId(partyId);
}

// Real-time listener for party details
export function subscribeToParty(
  partyId: string,
  onUpdate: (party: Party | null) => void
): () => void {
  const partyRef = doc(db, 'parties', partyId);
  return onSnapshot(
    partyRef,
    (snap) => {
      if (snap.exists()) {
        onUpdate({ id: snap.id, ...(snap.data() as Omit<Party, 'id'>) });
      } else {
        onUpdate(null);
      }
    },
    (err) => {
      console.warn('Error subscribing to party:', err);
    }
  );
}

// Real-time listener for party leaderboard members
export function subscribeToLeaderboard(
  partyId: string,
  onUpdate: (members: PartyMember[]) => void
): () => void {
  const membersRef = collection(db, 'parties', partyId, 'members');
  const todayKey = formatDateKey(new Date());

  return onSnapshot(
    membersRef,
    (snap) => {
      const list: PartyMember[] = [];
      snap.forEach((docSnap) => {
        const raw = docSnap.data() as Omit<PartyMember, 'id'>;
        // Daily reset: if member's last focus date is from a previous calendar day, daily minutes is 0
        const isToday = raw.lastFocusDate === todayKey;
        const dailyFocusMinutes = isToday
          ? (typeof raw.dailyFocusMinutes === 'number' ? raw.dailyFocusMinutes : raw.totalFocusMinutes)
          : 0;

        list.push({
          id: docSnap.id,
          ...raw,
          dailyFocusMinutes,
        });
      });

      // Sort members primarily by today's daily focus minutes descending, then by all-time total
      list.sort((a, b) => {
        const aDaily = a.dailyFocusMinutes || 0;
        const bDaily = b.dailyFocusMinutes || 0;
        if (bDaily !== aDaily) {
          return bDaily - aDaily;
        }
        if (b.totalFocusMinutes !== a.totalFocusMinutes) {
          return b.totalFocusMinutes - a.totalFocusMinutes;
        }
        return b.completedSessions - a.completedSessions;
      });
      onUpdate(list);
    },
    (err) => {
      console.warn('Error subscribing to leaderboard members:', err);
    }
  );
}

// Sync focus minutes from Pomodoro session
export async function syncFocusTimeToParties(
  partyIds: string[],
  minutesToAdd: number,
  isSessionCompleted: boolean,
  currentStatus: MemberStatus = 'idle'
) {
  if (minutesToAdd <= 0 && !isSessionCompleted) return;
  const userId = getOrCreateUserId();
  const todayKey = formatDateKey(new Date());
  const shareStats = getIsStatsSharingAllowed();
  const statsSnapshot = getLocalStatsSnapshot();

  for (const partyId of partyIds) {
    try {
      const memberRef = doc(db, 'parties', partyId, 'members', userId);
      const memberSnap = await getDoc(memberRef);
      const currentData = memberSnap.exists() ? (memberSnap.data() as PartyMember) : null;
      const isSameDay = currentData?.lastFocusDate === todayKey;

      const dailyUpdate = isSameDay
        ? increment(Math.max(0, minutesToAdd))
        : Math.max(0, minutesToAdd);

      await updateDoc(memberRef, {
        dailyFocusMinutes: dailyUpdate,
        lastFocusDate: todayKey,
        totalFocusMinutes: increment(Math.max(0, minutesToAdd)),
        ...(isSessionCompleted ? { completedSessions: increment(1) } : {}),
        currentStatus,
        lastActiveAt: new Date().toISOString(),
        shareStats,
        ...(shareStats ? { statsSnapshot } : {}),
      });
    } catch (e) {
      console.warn(`Could not sync focus minutes to party ${partyId}:`, e);
    }
  }
}

// Update current active status (focusing, break, idle)
export async function updatePartyMemberStatus(
  partyIds: string[],
  status: MemberStatus
) {
  const userId = getOrCreateUserId();
  const shareStats = getIsStatsSharingAllowed();
  const statsSnapshot = getLocalStatsSnapshot();

  for (const partyId of partyIds) {
    try {
      const memberRef = doc(db, 'parties', partyId, 'members', userId);
      await updateDoc(memberRef, {
        currentStatus: status,
        lastActiveAt: new Date().toISOString(),
        shareStats,
        ...(shareStats ? { statsSnapshot } : {}),
      });
    } catch (e) {
      // Ignored if offline or not member
    }
  }
}

// Fetch all parties the user belongs to
export async function fetchUserParties(savedIds: string[]): Promise<Party[]> {
  const results: Party[] = [];
  for (const id of savedIds) {
    try {
      const partyRef = doc(db, 'parties', id);
      const snap = await getDoc(partyRef);
      if (snap.exists()) {
        results.push({ id: snap.id, ...(snap.data() as Omit<Party, 'id'>) });
      }
    } catch (e) {
      console.warn(`Could not fetch party ${id}:`, e);
    }
  }
  return results;
}

// Send an end-to-end encrypted chat message in a party room
export async function sendPartyMessage(
  partyId: string,
  partyCode: string,
  text: string,
  userName: string,
  avatarColor?: string
): Promise<PartyMessage> {
  const cleanText = text.trim();
  if (!cleanText) {
    throw new Error('Message cannot be empty');
  }
  const userId = getOrCreateUserId();
  const color = avatarColor || getOrCreateAvatarColor();
  const messagesRef = collection(db, 'parties', partyId, 'messages');
  const messageDoc = doc(messagesRef);

  // Client-side AES-GCM 256-bit encryption before writing to Firestore
  let encryptedText = cleanText;
  let isEncrypted = false;
  if (partyCode) {
    try {
      encryptedText = await encryptChatMessage(cleanText, partyId, partyCode);
      isEncrypted = encryptedText.startsWith('E2E:');
    } catch (e) {
      console.warn('E2EE encryption fallback to plaintext:', e);
      encryptedText = cleanText;
    }
  }

  const messageData: PartyMessage = {
    id: messageDoc.id,
    partyId,
    senderId: userId,
    senderName: userName.trim() || 'Focus Friend',
    ...(color ? { senderAvatarColor: color } : {}),
    text: encryptedText,
    createdAt: new Date().toISOString(),
    isEncrypted,
  };

  await setDoc(messageDoc, messageData);
  // Return message with local decrypted plaintext for instant user experience
  return { ...messageData, text: cleanText };
}

// Subscribe to real-time chat messages with client-side E2EE decryption
export function subscribeToPartyMessages(
  partyId: string,
  partyCode: string,
  onUpdate: (messages: PartyMessage[]) => void
): () => void {
  const messagesRef = collection(db, 'parties', partyId, 'messages');
  const q = query(messagesRef, orderBy('createdAt', 'asc'));

  const decryptAndNotify = async (docs: any[]) => {
    const list: PartyMessage[] = [];
    for (const docSnap of docs) {
      const data = docSnap.data() as Omit<PartyMessage, 'id'>;
      let text = data.text;
      let isEncrypted = false;

      if (text && text.startsWith('E2E:')) {
        isEncrypted = true;
        if (partyCode) {
          text = await decryptChatMessage(text, partyId, partyCode);
        }
      }

      list.push({
        id: docSnap.id,
        ...data,
        text,
        isEncrypted,
      });
    }
    onUpdate(list);
  };

  return onSnapshot(
    q,
    (snap) => {
      decryptAndNotify(snap.docs);
    },
    (err) => {
      console.warn('Error subscribing to party messages with query, falling back:', err);
      // Fallback in case of index delay
      return onSnapshot(messagesRef, (fSnap) => {
        const sortedDocs = [...fSnap.docs].sort((a, b) => {
          const aTime = new Date(a.data().createdAt).getTime();
          const bTime = new Date(b.data().createdAt).getTime();
          return aTime - bTime;
        });
        decryptAndNotify(sortedDocs);
      });
    }
  );
}
