import { useState, useEffect, useCallback } from 'react';

/**
 * Robust, cross-browser detection of whether the window is currently in fullscreen.
 * Supports:
 * 1. HTML5 standard document.fullscreenElement
 * 2. Vendor prefixed (webkitFullscreenElement, mozFullScreenElement, msFullscreenElement)
 * 3. CSS media query: (display-mode: fullscreen) for PWA / installed app / browser F11
 * 4. Viewport geometry: when inner window dimensions match device screen dimensions
 */
export function isWindowFullscreen(): boolean {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return false;
  }

  // 1. Standard and prefixed Fullscreen API
  const doc = document as any;
  if (
    doc.fullscreenElement ||
    doc.webkitFullscreenElement ||
    doc.mozFullScreenElement ||
    doc.msFullscreenElement
  ) {
    return true;
  }

  // 2. CSS Media Query (display-mode: fullscreen)
  try {
    if (window.matchMedia && window.matchMedia('(display-mode: fullscreen)').matches) {
      return true;
    }
  } catch (e) {
    // Media query matchMedia may fail in older environments
  }

  // 3. Viewport Geometry fallback (detects native F11 or kiosk window where API isn't triggered)
  try {
    if (window.screen && typeof window.innerHeight === 'number') {
      const heightDelta = Math.abs(window.innerHeight - window.screen.height);
      const widthDelta = Math.abs(window.innerWidth - window.screen.width);
      // Tolerance of 4px accounts for subpixel scaling or browser scrollbar edge margins
      if (heightDelta <= 4 && widthDelta <= 4) {
        return true;
      }
    }
  } catch (e) {}

  return false;
}

/**
 * Detect if currently running on mobile device or in mobile optimization mode
 */
export function isMobileDevice(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const saved = localStorage.getItem('desk_clock_device_mode');
    if (saved === 'mobile') return true;
    if (saved === 'pc') return false;
  } catch {}
  return (
    window.innerWidth < 768 ||
    /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent)
  );
}

/**
 * Custom React hook for unified fullscreen state management and scroll locking.
 * For mobile devices, scrolling is preserved even after entering fullscreen!
 */
export function useFullscreen(isMobileOverride?: boolean) {
  const [isFullscreen, setIsFullscreen] = useState<boolean>(() => isWindowFullscreen());

  const applyScrollLock = useCallback((fullscreenActive: boolean) => {
    if (typeof document === 'undefined') return;

    // For the mobile app, allow the user to scroll even after pressing the full screen button!
    const isMobile = isMobileOverride !== undefined ? isMobileOverride : isMobileDevice();

    if (fullscreenActive && !isMobile) {
      document.documentElement.style.overflow = 'hidden';
      document.body.style.overflow = 'hidden';
      document.documentElement.classList.add('app-fullscreen');
      document.body.classList.add('app-fullscreen');
    } else {
      document.documentElement.style.overflow = '';
      document.body.style.overflow = '';
      document.documentElement.classList.remove('app-fullscreen');
      document.body.classList.remove('app-fullscreen');
    }
  }, [isMobileOverride]);

  const updateFullscreen = useCallback(() => {
    const active = isWindowFullscreen();
    setIsFullscreen(active);
    applyScrollLock(active);
  }, [applyScrollLock]);

  const toggleFullscreen = useCallback(async () => {
    if (typeof document === 'undefined') return;
    const doc = document as any;
    const docEl = (document.documentElement || document.body) as any;

    try {
      const hasFullscreenElement = Boolean(
        doc.fullscreenElement ||
        doc.webkitFullscreenElement ||
        doc.mozFullScreenElement ||
        doc.msFullscreenElement
      );

      if (hasFullscreenElement) {
        if (doc.exitFullscreen) {
          await doc.exitFullscreen();
        } else if (doc.webkitExitFullscreen) {
          await doc.webkitExitFullscreen();
        } else if (doc.mozCancelFullScreen) {
          await doc.mozCancelFullScreen();
        } else if (doc.msExitFullscreen) {
          await doc.msExitFullscreen();
        }
      } else {
        if (docEl.requestFullscreen) {
          await docEl.requestFullscreen();
        } else if (docEl.webkitRequestFullscreen) {
          await docEl.webkitRequestFullscreen();
        } else if (docEl.mozRequestFullScreen) {
          await docEl.mozRequestFullScreen();
        } else if (docEl.msRequestFullscreen) {
          await docEl.msRequestFullscreen();
        }
      }
    } catch (err) {
      console.warn('Fullscreen toggle error:', err);
    } finally {
      // Re-check after animation/frame
      setTimeout(updateFullscreen, 50);
      setTimeout(updateFullscreen, 150);
      setTimeout(updateFullscreen, 350);
    }
  }, [updateFullscreen]);

  useEffect(() => {
    updateFullscreen();

    const fsEvents = [
      'fullscreenchange',
      'webkitfullscreenchange',
      'mozfullscreenchange',
      'MSFullscreenChange',
    ];

    fsEvents.forEach((evt) => {
      document.addEventListener(evt, updateFullscreen);
    });

    window.addEventListener('resize', updateFullscreen);

    let mql: MediaQueryList | null = null;
    try {
      if (window.matchMedia) {
        mql = window.matchMedia('(display-mode: fullscreen)');
        if (mql.addEventListener) {
          mql.addEventListener('change', updateFullscreen);
        } else if ((mql as any).addListener) {
          (mql as any).addListener(updateFullscreen);
        }
      }
    } catch (e) {}

    return () => {
      fsEvents.forEach((evt) => {
        document.removeEventListener(evt, updateFullscreen);
      });
      window.removeEventListener('resize', updateFullscreen);
      if (mql) {
        if (mql.removeEventListener) {
          mql.removeEventListener('change', updateFullscreen);
        } else if ((mql as any).removeListener) {
          (mql as any).removeListener(updateFullscreen);
        }
      }
      applyScrollLock(false);
    };
  }, [updateFullscreen, applyScrollLock]);

  return { isFullscreen, toggleFullscreen };
}
