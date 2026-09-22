/**
 * IndexedDB Utility for High-Capacity Offline Wallpaper & Video Storage
 * Allows storing 500MB - 2GB+ of high-resolution photos and MP4 video clips
 * completely offline without exceeding localStorage limits.
 */

const DB_NAME = 'standby-clock-storage';
const DB_VERSION = 1;
const STORE_NAME = 'wallpapers';

export interface StoredWallpaperData {
  id: string; // 'single-image' | 'slideshow-images' | 'live-video' | 'depth-mask'
  data: string | Blob | Array<string>;
  name?: string;
  sizeBytes?: number;
  mimeType?: string;
  updatedAt: number;
}

// In-Memory cache for zero-latency synchronous access and sandbox fallback
const memoryCache = new Map<string, StoredWallpaperData>();

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB is not supported in this environment.'));
      return;
    }

    try {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        }
      };

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    } catch (err) {
      reject(err);
    }
  });
}

function broadcastWallpaperUpdate(id: string, data?: any, name?: string) {
  if (typeof window !== 'undefined') {
    try {
      window.dispatchEvent(
        new CustomEvent('standby-wallpaper-updated', {
          detail: { id, data, name, timestamp: Date.now() },
        })
      );
    } catch {
      // Ignore
    }
  }
}

/**
 * Store a wallpaper item in IndexedDB with memory and localStorage fallbacks
 */
export async function saveWallpaperItem(
  id: 'single-image' | 'slideshow-images' | 'live-video' | 'depth-mask',
  data: string | Blob | Array<string>,
  name?: string
): Promise<void> {
  let sizeBytes = 0;
  if (typeof data === 'string') {
    sizeBytes = data.length;
  } else if (data instanceof Blob) {
    sizeBytes = data.size;
  } else if (Array.isArray(data)) {
    sizeBytes = data.reduce((acc, item) => acc + (typeof item === 'string' ? item.length : 0), 0);
  }

  const record: StoredWallpaperData = {
    id,
    data,
    name,
    sizeBytes,
    updatedAt: Date.now(),
  };

  // 1. Immediately store in memory cache
  memoryCache.set(id, record);

  // 2. Also backup to localStorage if string data is small enough (< 3MB)
  if (typeof data === 'string' && data.length < 3 * 1024 * 1024) {
    try {
      localStorage.setItem(`standby_wp_${id}`, JSON.stringify(record));
    } catch {
      // LocalStorage full or blocked - proceed safely
    }
  }

  // 3. Persist to IndexedDB
  try {
    const db = await openDB();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const request = store.put(record);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } catch (err) {
    console.warn('Could not persist to IndexedDB, fallback stored in memory:', err);
  }

  // 4. Notify all components immediately
  broadcastWallpaperUpdate(id, data, name);
}

/**
 * Retrieve a wallpaper item from Memory, IndexedDB, or localStorage
 */
export async function getWallpaperItem(
  id: 'single-image' | 'slideshow-images' | 'live-video' | 'depth-mask'
): Promise<StoredWallpaperData | null> {
  // Check memory cache first
  if (memoryCache.has(id)) {
    return memoryCache.get(id) || null;
  }

  // Try IndexedDB
  try {
    const db = await openDB();
    const item = await new Promise<StoredWallpaperData | null>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const request = store.get(id);

      request.onsuccess = () => {
        resolve(request.result || null);
      };
      request.onerror = () => reject(request.error);
    });

    if (item) {
      memoryCache.set(id, item);
      return item;
    }
  } catch (err) {
    console.warn('Could not read wallpaper item from IndexedDB:', err);
  }

  // Fallback to localStorage
  try {
    const raw = localStorage.getItem(`standby_wp_${id}`);
    if (raw) {
      const parsed = JSON.parse(raw) as StoredWallpaperData;
      memoryCache.set(id, parsed);
      return parsed;
    }
  } catch {
    // Ignore
  }

  return null;
}

/**
 * Remove a specific wallpaper item
 */
export async function removeWallpaperItem(
  id: 'single-image' | 'slideshow-images' | 'live-video' | 'depth-mask'
): Promise<void> {
  memoryCache.delete(id);

  try {
    localStorage.removeItem(`standby_wp_${id}`);
  } catch {
    // Ignore
  }

  try {
    const db = await openDB();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const request = store.delete(id);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } catch (err) {
    console.warn('Could not delete wallpaper from IndexedDB:', err);
  }

  broadcastWallpaperUpdate(id, null, undefined);
}

/**
 * Estimate total storage currently used by the app's wallpapers and device quota
 */
export async function getStorageUsage(): Promise<{
  usedBytes: number;
  formattedUsed: string;
  quotaFormatted: string;
  isHighCapacity: boolean;
}> {
  try {
    let usedBytes = 0;
    const db = await openDB();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const request = store.openCursor();

      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest<IDBCursorWithValue>).result;
        if (cursor) {
          const item = cursor.value as StoredWallpaperData;
          usedBytes += item.sizeBytes || 0;
          cursor.continue();
        } else {
          resolve();
        }
      };
      request.onerror = () => reject(request.error);
    });

    let quotaFormatted = '500MB - 2GB+';
    if (navigator.storage && navigator.storage.estimate) {
      const estimate = await navigator.storage.estimate();
      if (estimate.quota) {
        const quotaMB = Math.round(estimate.quota / (1024 * 1024));
        if (quotaMB > 1000) {
          quotaFormatted = `~${(quotaMB / 1024).toFixed(1)} GB`;
        } else {
          quotaFormatted = `~${quotaMB} MB`;
        }
      }
    }

    const formattedUsed =
      usedBytes > 1024 * 1024
        ? `${(usedBytes / (1024 * 1024)).toFixed(1)} MB`
        : `${Math.round(usedBytes / 1024)} KB`;

    return {
      usedBytes,
      formattedUsed,
      quotaFormatted,
      isHighCapacity: true,
    };
  } catch {
    return {
      usedBytes: 0,
      formattedUsed: '0 KB',
      quotaFormatted: '500MB+ (IndexedDB)',
      isHighCapacity: true,
    };
  }
}
