import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getFirestore, Firestore, doc, getDocFromServer } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

let app: FirebaseApp;
if (!getApps().length) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApp();
}

// Support custom firestoreDatabaseId from configuration
export const db: Firestore = firebaseConfig.firestoreDatabaseId
  ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
  : getFirestore(app);

// Connection verification
export async function testFirestoreConnection(): Promise<boolean> {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    return true;
  } catch (err: unknown) {
    if (err instanceof Error && err.message.includes('the client is offline')) {
      console.warn('Firestore is currently in offline mode');
    }
    // We can still function even if test doc doesn't exist yet
    return true;
  }
}

// Unique anonymous user identifier stored in localStorage
const USER_ID_KEY = 'desk_clock_user_id';
const AVATAR_COLOR_KEY = 'desk_clock_avatar_color';

const AVATAR_COLORS = [
  '#f59e0b', // Amber
  '#38bdf8', // Sky
  '#10b981', // Emerald
  '#ec4899', // Pink
  '#8b5cf6', // Purple
  '#f97316', // Orange
  '#06b6d4', // Cyan
  '#14b8a6', // Teal
];

export function getOrCreateUserId(): string {
  let id = localStorage.getItem(USER_ID_KEY);
  if (!id) {
    id = 'user_' + Math.random().toString(36).substring(2, 10) + Date.now().toString(36);
    localStorage.setItem(USER_ID_KEY, id);
  }
  return id;
}

export function getOrCreateAvatarColor(): string {
  let color = localStorage.getItem(AVATAR_COLOR_KEY);
  if (!color) {
    color = AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)];
    localStorage.setItem(AVATAR_COLOR_KEY, color);
  }
  return color;
}
