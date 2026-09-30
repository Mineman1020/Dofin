import React, { useState, useEffect, useRef } from 'react';
import {
  Maximize2,
  Minimize2,
  Settings,
  ArrowLeft,
  Timer,
  Sparkles,
  Flame,
  CloudRain,
  Compass,
  Monitor,
  Eye,
  Users,
  CheckCircle2,
  BarChart3,
  Battery,
  BatteryCharging,
  Calendar,
  Layers,
  Image as ImageIcon,
  Keyboard,
  Move,
  RotateCcw,
  RotateCw,
  ArrowUpDown,
  ArrowLeftRight,
  Lock,
  Check,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { ClockSettings, ThemePreset, AmbientThemePreset, AmbientThemeId } from '../types';
import { THEME_PRESETS, FONT_OPTIONS, AMBIENT_THEMES, FONT_SCALE_NORMALIZATION } from '../utils/constants';
import {
  playTickSound,
  playHourlyChime,
  startAmbientSoundscape,
  stopAmbientSoundscape,
  setAmbientSoundscapeVolume,
} from '../utils/audio';
import { getWallpaperItem, saveWallpaperItem } from '../utils/wallpaperStorage';
import { processImageFile, isSupportedImageFile } from '../utils/imageProcessor';
import { generateSubjectMask } from '../utils/subjectSegmenter';
import { AmbientBackground } from './AmbientBackground';
import { PomodoroTimerController } from '../utils/usePomodoroTimer';
import { useFullscreen } from '../utils/useFullscreen';
import { FlipClock } from './clock-styles/FlipClock';
import { AnalogClock } from './clock-styles/AnalogClock';
import { SevenSegmentClock } from './clock-styles/SevenSegmentClock';
import { CyberpunkClock } from './clock-styles/CyberpunkClock';
import { RadialArcClock } from './clock-styles/RadialArcClock';
import { BatteryWidget } from './widgets/BatteryWidget';
import { StopwatchWidget } from './widgets/StopwatchWidget';
import { WeatherWidget } from './widgets/WeatherWidget';
import { FocusGoalWidget } from './widgets/FocusGoalWidget';
import { QuickNoteWidget } from './widgets/QuickNoteWidget';
import { getClockDigitTextStyle, getMatchedBackgroundStyle, getClockResolvedColors } from '../utils/gradientPresets';

interface ClockViewProps {
  settings: ClockSettings;
  onUpdateSettings?: (updated: Partial<ClockSettings>) => void;
  onOpenSettings: () => void;
  onGoToWelcome: () => void;
  onGoToPomodoro: () => void;
  onGoToTasks?: () => void;
  onGoToStats?: () => void;
  onOpenParties?: () => void;
  onOpenShortcuts?: () => void;
  userName: string;
  pomodoroTimer?: PomodoroTimerController;
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
}

export const ClockView: React.FC<ClockViewProps> = ({
  settings,
  onUpdateSettings,
  onOpenSettings,
  onGoToWelcome,
  onGoToPomodoro,
  onGoToTasks,
  onGoToStats,
  onOpenParties,
  onOpenShortcuts,
  userName,
  pomodoroTimer,
  isDarkMode,
  onToggleDarkMode,
}) => {
  const [time, setTime] = useState<Date>(new Date());
  const { isFullscreen, toggleFullscreen } = useFullscreen();
  const [controlsVisible, setControlsVisible] = useState<boolean>(true);
  const [driftOffset, setDriftOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Standby Wallpaper State (Single image, Slideshow images, Live MP4 Video, Depth Mask)
  const [singleWallpaperUrl, setSingleWallpaperUrl] = useState<string | null>(null);
  const [slideshowUrls, setSlideshowUrls] = useState<string[]>([]);
  const [currentSlideIndex, setCurrentSlideIndex] = useState<number>(0);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [depthMaskUrl, setDepthMaskUrl] = useState<string | null>(null);

  // Live Battery State for Optional Standby Widget
  const [batteryState, setBatteryState] = useState<{ level: number; charging: boolean } | null>(null);

  // Direct Drag-and-Drop Wallpaper on Clock View
  const [isDraggingOverClock, setIsDraggingOverClock] = useState<boolean>(false);
  const [dragUploadMessage, setDragUploadMessage] = useState<string | null>(null);

  const idleTimerRef = useRef<number | null>(null);
  const lastHourChimedRef = useRef<number | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  // Freeform Layout Customization State (Accessible only when unlocked via Settings)
  const [isEditLayoutMode, setIsEditLayoutMode] = useState<boolean>(Boolean(settings.customLayoutEnabled));

  useEffect(() => {
    setIsEditLayoutMode(Boolean(settings.customLayoutEnabled));
  }, [settings.customLayoutEnabled]);

  type LayoutTarget = 'clock' | 'date' | 'mantra' | 'ampm';
  const [selectedElement, setSelectedElement] = useState<LayoutTarget>('clock');
  const [draggingTarget, setDraggingTarget] = useState<LayoutTarget | null>(null);
  const [dragOrigin, setDragOrigin] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isToolbarCollapsed, setIsToolbarCollapsed] = useState<boolean>(false);

  const isModernDesign = !settings.clockStyle || settings.clockStyle === 'modern';

  useEffect(() => {
    if (!isModernDesign && selectedElement === 'ampm') {
      setSelectedElement('clock');
    }
  }, [isModernDesign, selectedElement]);

  const clockPos = settings.clockPosition || { x: 0, y: 0 };
  const clockScale = settings.clockScale ?? 1;
  const clockScaleX = settings.clockScaleX ?? 1;
  const clockScaleY = settings.clockScaleY ?? 1;
  const clockRotation = settings.clockRotation ?? 0;

  const dateLayout = settings.dateLayout || { x: 0, y: 0, scaleX: 1, scaleY: 1, rotation: 0 };
  const mantraLayout = settings.mantraLayout || { x: 0, y: 0, scaleX: 1, scaleY: 1, rotation: 0 };
  const ampmLayout = settings.ampmLayout || { x: 0, y: 0, scaleX: 1, scaleY: 1, rotation: 0 };

  const clockContainerRef = useRef<HTMLDivElement>(null);

  // Generic Element Drag Handler (Locked when not in layout editing mode)
  const handleStartDrag = (target: LayoutTarget, e: React.MouseEvent | React.TouchEvent) => {
    if (!isEditLayoutMode) return;
    if ((e.target as HTMLElement).closest('button, input, select, a')) return;
    e.stopPropagation();
    setSelectedElement(target);
    setDraggingTarget(target);

    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    let currX = 0;
    let currY = 0;
    if (target === 'clock') {
      currX = clockPos.x;
      currY = clockPos.y;
    } else if (target === 'date') {
      currX = dateLayout.x;
      currY = dateLayout.y;
    } else if (target === 'mantra') {
      currX = mantraLayout.x;
      currY = mantraLayout.y;
    } else if (target === 'ampm') {
      currX = ampmLayout.x;
      currY = ampmLayout.y;
    }

    setDragOrigin({
      x: clientX - currX,
      y: clientY - currY,
    });
  };

  useEffect(() => {
    if (!draggingTarget) return;

    let rafId: number | null = null;
    let latestCoords = { x: 0, y: 0 };

    const scheduleUpdate = () => {
      if (rafId === null) {
        rafId = requestAnimationFrame(() => {
          if (draggingTarget === 'clock') {
            onUpdateSettings?.({ clockPosition: latestCoords });
          } else if (draggingTarget === 'date') {
            onUpdateSettings?.({ dateLayout: { ...dateLayout, x: latestCoords.x, y: latestCoords.y } });
          } else if (draggingTarget === 'mantra') {
            onUpdateSettings?.({ mantraLayout: { ...mantraLayout, x: latestCoords.x, y: latestCoords.y } });
          } else if (draggingTarget === 'ampm') {
            onUpdateSettings?.({ ampmLayout: { ...ampmLayout, x: latestCoords.x, y: latestCoords.y } });
          }
          rafId = null;
        });
      }
    };

    const onMouseMove = (e: MouseEvent) => {
      latestCoords = {
        x: Math.round(e.clientX - dragOrigin.x),
        y: Math.round(e.clientY - dragOrigin.y),
      };
      scheduleUpdate();
    };

    const onTouchMove = (e: TouchEvent) => {
      if (!e.touches[0]) return;
      latestCoords = {
        x: Math.round(e.touches[0].clientX - dragOrigin.x),
        y: Math.round(e.touches[0].clientY - dragOrigin.y),
      };
      scheduleUpdate();
    };

    const onEnd = () => {
      if (rafId !== null) cancelAnimationFrame(rafId);
      setDraggingTarget(null);
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onEnd);
    window.addEventListener('touchmove', onTouchMove, { passive: true });
    window.addEventListener('touchend', onEnd);

    return () => {
      if (rafId !== null) cancelAnimationFrame(rafId);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onEnd);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onEnd);
    };
  }, [draggingTarget, dragOrigin, dateLayout, mantraLayout, ampmLayout, onUpdateSettings]);

  // Corner Radial Outward/Inward Drag Resize Handler (Requirement 9)
  const [isResizingClock, setIsResizingClock] = useState<boolean>(false);
  const [resizeStart, setResizeStart] = useState<{
    centerX: number;
    centerY: number;
    startDist: number;
    initialScale: number;
  }>({
    centerX: 0,
    centerY: 0,
    startDist: 0,
    initialScale: 1,
  });

  const handleResizeStart = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isEditLayoutMode) return;
    e.stopPropagation();
    e.preventDefault();
    setIsResizingClock(true);
    if (!clockContainerRef.current) return;
    const rect = clockContainerRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    const dist = Math.hypot(clientX - centerX, clientY - centerY);
    setResizeStart({
      centerX,
      centerY,
      startDist: Math.max(20, dist),
      initialScale: clockScale,
    });
  };

  useEffect(() => {
    if (!isResizingClock) return;

    let rafId: number | null = null;
    let latestScale = clockScale;

    const scheduleScaleUpdate = () => {
      if (rafId === null) {
        rafId = requestAnimationFrame(() => {
          onUpdateSettings?.({ clockScale: latestScale });
          rafId = null;
        });
      }
    };

    const onMouseMove = (e: MouseEvent) => {
      const dist = Math.hypot(e.clientX - resizeStart.centerX, e.clientY - resizeStart.centerY);
      // Dragging mouse OUTWARD from center increases size; dragging INWARD decreases size
      const ratio = dist / resizeStart.startDist;
      latestScale = Math.max(0.4, Math.min(2.8, +(resizeStart.initialScale * ratio).toFixed(2)));
      scheduleScaleUpdate();
    };

    const onTouchMove = (e: TouchEvent) => {
      if (!e.touches[0]) return;
      const dist = Math.hypot(e.touches[0].clientX - resizeStart.centerX, e.touches[0].clientY - resizeStart.centerY);
      const ratio = dist / resizeStart.startDist;
      latestScale = Math.max(0.4, Math.min(2.8, +(resizeStart.initialScale * ratio).toFixed(2)));
      scheduleScaleUpdate();
    };

    const onEnd = () => {
      if (rafId !== null) cancelAnimationFrame(rafId);
      setIsResizingClock(false);
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onEnd);
    window.addEventListener('touchmove', onTouchMove, { passive: true });
    window.addEventListener('touchend', onEnd);

    return () => {
      if (rafId !== null) cancelAnimationFrame(rafId);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onEnd);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onEnd);
    };
  }, [isResizingClock, resizeStart, onUpdateSettings, clockScale]);

  // Active ambient theme definition
  const activeAmbient: AmbientThemePreset =
    AMBIENT_THEMES.find((a) => a.id === (settings.ambientTheme || 'none')) || AMBIENT_THEMES[0];
  const isAmbientActive =
    (settings.wallpaperMode === 'theme' || !settings.wallpaperMode) &&
    activeAmbient &&
    activeAmbient.id !== 'none';

  // Load custom wallpaper assets from local high-capacity storage
  useEffect(() => {
    let active = true;
    let createdBlobUrls: string[] = [];

    async function loadWallpapers() {
      try {
        if (settings.wallpaperMode === 'image') {
          const item = await getWallpaperItem('single-image');
          if (active) {
            if (item && item.data) {
              if (typeof item.data === 'string') {
                setSingleWallpaperUrl(item.data);
              } else if (item.data instanceof Blob) {
                const url = URL.createObjectURL(item.data);
                createdBlobUrls.push(url);
                setSingleWallpaperUrl(url);
              }
            } else {
              setSingleWallpaperUrl(null);
            }
          }
        } else if (settings.wallpaperMode === 'slideshow') {
          const item = await getWallpaperItem('slideshow-images');
          if (active) {
            if (item && Array.isArray(item.data)) {
              setSlideshowUrls(item.data);
              setCurrentSlideIndex(0);
            } else {
              setSlideshowUrls([]);
            }
          }
        } else if (settings.wallpaperMode === 'video') {
          const item = await getWallpaperItem('live-video');
          if (active) {
            if (item && item.data) {
              if (item.data instanceof Blob) {
                const url = URL.createObjectURL(item.data);
                createdBlobUrls.push(url);
                setVideoUrl(url);
              } else if (typeof item.data === 'string') {
                setVideoUrl(item.data);
              }
            } else {
              setVideoUrl(null);
            }
          }
        }

        // Check depth mask
        if (settings.depthEffect) {
          let maskItem = await getWallpaperItem('depth-mask');
          // If depth effect is enabled, but no mask exists yet and we have a single image wallpaper, auto-extract!
          if (!maskItem) {
            const singleItem = await getWallpaperItem('single-image');
            if (singleItem && singleItem.data) {
              try {
                const sourceUrl =
                  typeof singleItem.data === 'string'
                    ? singleItem.data
                    : URL.createObjectURL(singleItem.data as Blob);
                const autoMask = await generateSubjectMask(sourceUrl);
                await saveWallpaperItem('depth-mask', autoMask, 'auto-detected-subject.png');
                maskItem = { id: 'depth-mask', data: autoMask, name: 'auto-detected-subject.png', updatedAt: Date.now() };
              } catch (err) {
                console.warn('Auto depth masking in ClockView failed:', err);
              }
            }
          }

          if (active && maskItem && maskItem.data) {
            if (maskItem.data instanceof Blob) {
              const url = URL.createObjectURL(maskItem.data);
              createdBlobUrls.push(url);
              setDepthMaskUrl(url);
            } else if (typeof maskItem.data === 'string') {
              setDepthMaskUrl(maskItem.data);
            }
          } else if (!maskItem) {
            setDepthMaskUrl(null);
          }
        } else {
          setDepthMaskUrl(null);
        }
      } catch (e) {
        console.warn('Error loading custom wallpaper:', e);
      }
    }

    loadWallpapers();

    // Listen for real-time wallpaper updates emitted by storage
    const handleWallpaperUpdate = (e: Event) => {
      const customEvent = e as CustomEvent<{ id: string; data?: any; name?: string }>;
      if (!customEvent.detail) return;
      if (
        (settings.wallpaperMode === 'image' && customEvent.detail.id === 'single-image') ||
        (settings.wallpaperMode === 'slideshow' && customEvent.detail.id === 'slideshow-images') ||
        (settings.wallpaperMode === 'video' && customEvent.detail.id === 'live-video') ||
        customEvent.detail.id === 'depth-mask'
      ) {
        loadWallpapers();
      }
    };

    window.addEventListener('standby-wallpaper-updated', handleWallpaperUpdate);

    return () => {
      active = false;
      window.removeEventListener('standby-wallpaper-updated', handleWallpaperUpdate);
      createdBlobUrls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [
    settings.wallpaperMode,
    settings.customWallpaperName,
    settings.wallpaperTimestamp,
    settings.depthEffect,
  ]);

  // Slideshow interval timer (Active ONLY when slideshow mode is selected to conserve battery)
  useEffect(() => {
    if (settings.wallpaperMode !== 'slideshow' || slideshowUrls.length <= 1) return;

    const intervalSec = settings.slideshowIntervalSeconds || 30;
    const timer = setInterval(() => {
      setCurrentSlideIndex((prev) => (prev + 1) % slideshowUrls.length);
    }, intervalSec * 1000);

    return () => clearInterval(timer);
  }, [settings.wallpaperMode, slideshowUrls, settings.slideshowIntervalSeconds]);

  // Battery Conservation & Lifecycle Management for Live Wallpaper (MP4)
  useEffect(() => {
    if (settings.wallpaperMode !== 'video') return;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        videoRef.current?.pause();
      } else {
        videoRef.current?.play().catch(() => {});
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [settings.wallpaperMode]);

  // Optional Battery Widget Level Tracker
  useEffect(() => {
    if (!settings.showStandbyWidgets || !settings.standbyWidgetsBattery) return;

    let batteryInstance: any = null;

    const updateBattery = (b: any) => {
      setBatteryState({
        level: Math.round(b.level * 100),
        charging: b.charging,
      });
    };

    if (typeof navigator !== 'undefined' && 'getBattery' in navigator) {
      (navigator as any).getBattery().then((battery: any) => {
        batteryInstance = battery;
        updateBattery(battery);
        battery.addEventListener('levelchange', () => updateBattery(battery));
        battery.addEventListener('chargingchange', () => updateBattery(battery));
      }).catch(() => {
        setBatteryState({ level: 95, charging: true });
      });
    } else {
      setBatteryState({ level: 98, charging: true });
    }

    return () => {
      if (batteryInstance) {
        try {
          batteryInstance.removeEventListener('levelchange', () => updateBattery(batteryInstance));
          batteryInstance.removeEventListener('chargingchange', () => updateBattery(batteryInstance));
        } catch {}
      }
    };
  }, [settings.showStandbyWidgets, settings.standbyWidgetsBattery]);

  // Ambient soundscape audio coordinator
  useEffect(() => {
    if (settings.ambientSoundEnabled && activeAmbient.soundType && activeAmbient.soundType !== 'none') {
      startAmbientSoundscape(activeAmbient.soundType, settings.ambientSoundVolume ?? 35);
    } else {
      stopAmbientSoundscape();
    }

    return () => {
      stopAmbientSoundscape();
    };
  }, [settings.ambientSoundEnabled, activeAmbient.soundType, activeAmbient.id]);

  // Ambient volume changes
  useEffect(() => {
    if (settings.ambientSoundEnabled && settings.ambientSoundVolume !== undefined) {
      setAmbientSoundscapeVolume(settings.ambientSoundVolume);
    }
  }, [settings.ambientSoundVolume, settings.ambientSoundEnabled]);

  // Time ticker & audio triggers
  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      setTime(now);

      // Hourly chime check
      if (settings.hourlyChime) {
        if (
          now.getMinutes() === 0 &&
          now.getSeconds() === 0 &&
          lastHourChimedRef.current !== now.getHours()
        ) {
          lastHourChimedRef.current = now.getHours();
          playHourlyChime();
        }
      }

      // Tick sound check
      if (settings.tickSound) {
        playTickSound();
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [settings.hourlyChime, settings.tickSound]);

  // Anti burn-in micro-drift
  useEffect(() => {
    if (!settings.antiBurnIn) {
      setDriftOffset({ x: 0, y: 0 });
      return;
    }

    const driftInterval = setInterval(() => {
      const x = Math.floor(Math.random() * 7) - 3;
      const y = Math.floor(Math.random() * 7) - 3;
      setDriftOffset({ x, y });
    }, 240000);

    return () => clearInterval(driftInterval);
  }, [settings.antiBurnIn]);

  // Auto-hide controls when idle (for distraction-free desk display)
  const handleUserActivity = () => {
    setControlsVisible(true);
    if (idleTimerRef.current) {
      window.clearTimeout(idleTimerRef.current);
    }
    idleTimerRef.current = window.setTimeout(() => {
      setControlsVisible(false);
    }, 4500);
  };

  useEffect(() => {
    handleUserActivity();
    const onMouseMove = () => handleUserActivity();
    const onKeyDown = () => handleUserActivity();
    const onTouch = () => handleUserActivity();

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('touchstart', onTouch);

    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('touchstart', onTouch);
      if (idleTimerRef.current) window.clearTimeout(idleTimerRef.current);
    };
  }, []);

  // Resolve theme styles respecting user's explicit theme preset or ambient theme
  const activeTheme: ThemePreset =
    THEME_PRESETS.find((t) => t.id === settings.themeId) || THEME_PRESETS[0];

  const customBg = settings.themeId === 'custom' && settings.customBg ? settings.customBg : null;

  // Robustly resolve colors from theme presets, custom colors, or gradient mixes
  const clockColors = getClockResolvedColors(
    settings,
    isAmbientActive ? activeAmbient.textColor : activeTheme.textColor,
    isAmbientActive ? activeAmbient.accentColor : activeTheme.accentColor
  );

  let resolvedBg = customBg;
  let resolvedTextColor = clockColors.textColor;
  let resolvedAccentColor = clockColors.accentColor;

  if (isAmbientActive) {
    resolvedBg = activeAmbient.bgGradient;
    resolvedTextColor = activeAmbient.textColor;
    resolvedAccentColor = activeAmbient.accentColor;
  } else if (!resolvedBg) {
    resolvedBg = activeTheme.bgClass.includes('bg-[')
      ? activeTheme.bgClass.replace('bg-[', '').replace(']', '')
      : activeTheme.id === 'oled-black'
      ? '#000000'
      : activeTheme.isDark
      ? '#0f111a'
      : '#f7f5f0';
  }

  // If user has custom wallpaper (image/slideshow/video), ensure crisp high contrast on the clock text
  const hasCustomMediaWallpaper =
    (settings.wallpaperMode === 'image' && !!singleWallpaperUrl) ||
    (settings.wallpaperMode === 'slideshow' && slideshowUrls.length > 0) ||
    (settings.wallpaperMode === 'video' && !!videoUrl);

  if (hasCustomMediaWallpaper) {
    // When a wallpaper is active, default text to crisp, luminous white unless user chose custom text color
    if (!settings.customTextColor) {
      resolvedTextColor = '#ffffff';
      resolvedAccentColor = '#38bdf8';
    }
  }

  // Calculate typography gradient or solid text styling
  const digitTextStyle = getClockDigitTextStyle(settings, resolvedTextColor);

  const selectedFont =
    FONT_OPTIONS.find((f) => f.id === settings.fontFamily) || FONT_OPTIONS[0];

  // Format time digits
  const rawHours = time.getHours();
  const rawMinutes = time.getMinutes();
  const rawSeconds = time.getSeconds();

  let displayHours = rawHours;
  let ampm = '';

  if (settings.timeFormat === '12h') {
    ampm = rawHours >= 12 ? 'PM' : 'AM';
    displayHours = rawHours % 12 || 12;
  }

  const hoursStr = String(displayHours).padStart(2, '0');
  const minutesStr = String(rawMinutes).padStart(2, '0');
  const secondsStr = String(rawSeconds).padStart(2, '0');

  // Date formatting
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  const dayOfWeek = dayNames[time.getDay()];
  const monthName = monthNames[time.getMonth()];
  const dateNum = time.getDate();
  const year = time.getFullYear();

  // Digit size classes - calibrated to visually match all clock design footprints
  const getDigitSizeStyle = () => {
    switch (settings.digitSize) {
      case 'medium':
        return 'text-6xl sm:text-7xl md:text-8xl lg:text-9xl';
      case 'large':
        return 'text-7xl sm:text-8xl md:text-9xl lg:text-[11rem]';
      case 'huge':
        return 'text-8xl sm:text-9xl md:text-[11rem] lg:text-[13rem]';
      case 'fill':
        return settings.showSeconds
          ? 'text-[min(16vw,24vh)]'
          : 'text-[min(24vw,36vh)]';
      default:
        return 'text-7xl sm:text-8xl md:text-9xl lg:text-[11rem]';
    }
  };

  const isLight = isAmbientActive ? !activeAmbient.isDark : !isDarkMode && !activeTheme.isDark;
  const depthEffect = !!settings.depthEffect;
  const depthIntensity = settings.depthIntensity ?? 60;

  const handleClockDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingOverClock(false);
    const file = e.dataTransfer.files?.[0];
    if (!file) return;

    if (!isSupportedImageFile(file)) {
      setDragUploadMessage(`"${file.name}" is not a recognized image. Use JPG, PNG, WEBP, AVIF, HEIC, etc.`);
      setTimeout(() => setDragUploadMessage(null), 3500);
      return;
    }

    setDragUploadMessage(`Applying "${file.name}" as wallpaper...`);
    try {
      const processed = await processImageFile(file);
      await saveWallpaperItem('single-image', processed.dataUrl, file.name);
      setSingleWallpaperUrl(processed.dataUrl);

      // If depth effect is enabled, automatically extract and update the subject mask!
      if (settings.depthEffect) {
        setDragUploadMessage('Auto-detecting subject for Depth Effect...');
        try {
          const autoMask = await generateSubjectMask(processed.dataUrl);
          await saveWallpaperItem('depth-mask', autoMask, 'auto-detected-subject.png');
          setDepthMaskUrl(autoMask);
        } catch (e) {
          console.warn('Auto subject mask on drop skipped:', e);
        }
      }

      onUpdateSettings?.({
        wallpaperMode: 'image',
        customWallpaperName: file.name,
        wallpaperTimestamp: Date.now(),
      });
      setDragUploadMessage(`Wallpaper "${file.name}" applied!`);
      setTimeout(() => setDragUploadMessage(null), 3000);
    } catch {
      setDragUploadMessage('Failed to set wallpaper.');
      setTimeout(() => setDragUploadMessage(null), 3000);
    }
  };

  const canScroll = !isFullscreen && settings.enableScrolling !== false;
  const matchedBgStyle = getMatchedBackgroundStyle(settings, resolvedTextColor);

  return (
    <div
      id="clock-view-container"
      className={`relative w-full flex flex-col items-center select-none transition-colors duration-700 bg-black ${
        canScroll
          ? 'min-h-screen justify-between overflow-y-auto overflow-x-hidden pb-16'
          : 'h-screen justify-center overflow-hidden pb-0'
      }`}
      style={{
        backgroundColor: hasCustomMediaWallpaper
          ? '#000000'
          : matchedBgStyle?.backgroundColor || (!isAmbientActive ? (resolvedBg || (isLight ? '#f7f5f0' : '#000000')) : undefined),
        backgroundImage: hasCustomMediaWallpaper
          ? undefined
          : matchedBgStyle?.backgroundImage || (!hasCustomMediaWallpaper && isAmbientActive ? resolvedBg : undefined),
        color: resolvedTextColor,
        filter: `brightness(${settings.brightness}%)`,
      }}
      onClick={handleUserActivity}
      onDragOver={(e) => {
        e.preventDefault();
        setIsDraggingOverClock(true);
      }}
      onDragLeave={(e) => {
        if (e.currentTarget === e.target) {
          setIsDraggingOverClock(false);
        }
      }}
      onDrop={handleClockDrop}
    >
      {/* Drag & Drop Feedback Overlay */}
      {isDraggingOverClock && (
        <div
          id="clock-drop-overlay"
          className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm border-4 border-dashed border-sky-400 flex flex-col items-center justify-center pointer-events-none transition-all duration-200"
        >
          <div className="p-4 rounded-2xl bg-neutral-900/90 border border-sky-500/40 text-center shadow-2xl flex flex-col items-center gap-2 max-w-sm">
            <ImageIcon className="w-10 h-10 text-sky-400 animate-bounce" />
            <h3 className="text-base font-bold text-white">Drop Image to Set Wallpaper</h3>
            <p className="text-xs text-neutral-300">
              Supports JPG, JPEG, PNG, WebP, AVIF, HEIC, GIF, SVG, and more
            </p>
          </div>
        </div>
      )}

      {/* Floating Status Notification */}
      {dragUploadMessage && (
        <div
          id="clock-status-toast"
          className="fixed top-6 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-xl bg-neutral-900/90 backdrop-blur-md border border-neutral-700 text-xs font-medium text-white shadow-2xl animate-fade-in flex items-center gap-2 pointer-events-none"
        >
          <Sparkles className="w-3.5 h-3.5 text-sky-400" />
          <span>{dragUploadMessage}</span>
        </div>
      )}
      {/* 1. MEDIA WALLPAPERS LAYER (Single Image / Slideshow / MP4 Live Video) */}
      {settings.wallpaperMode === 'video' && videoUrl && (
        <video
          ref={videoRef}
          src={videoUrl}
          autoPlay
          loop
          muted
          playsInline
          className="fixed inset-0 w-full h-full object-cover pointer-events-none z-0 transition-opacity duration-700"
          style={{
            filter: settings.wallpaperBlur ? `blur(${settings.wallpaperBlur}px)` : undefined,
            willChange: 'transform',
            transform: 'translateZ(0)',
          }}
        />
      )}

      {settings.wallpaperMode === 'slideshow' && slideshowUrls.length > 0 && (
        <img
          id="clock-wallpaper-slideshow"
          src={slideshowUrls[currentSlideIndex] || slideshowUrls[0]}
          alt="Wallpaper slideshow background"
          crossOrigin="anonymous"
          decoding="async"
          className="fixed inset-0 w-full h-full object-cover object-center pointer-events-none z-0 transition-all duration-1000 ease-in-out"
          style={{
            filter: settings.wallpaperBlur ? `blur(${settings.wallpaperBlur}px)` : undefined,
          }}
        />
      )}

      {settings.wallpaperMode === 'image' && singleWallpaperUrl && (
        <img
          id="clock-wallpaper-image"
          src={singleWallpaperUrl}
          alt="Wallpaper background"
          crossOrigin="anonymous"
          decoding="async"
          className="fixed inset-0 w-full h-full object-cover object-center pointer-events-none z-0 transition-opacity duration-700"
          style={{
            filter: settings.wallpaperBlur ? `blur(${settings.wallpaperBlur}px)` : undefined,
          }}
        />
      )}

      {/* Procedural Ambient Background (When in Theme mode) */}
      {isAmbientActive && !hasCustomMediaWallpaper && (
        <div className="fixed inset-0 pointer-events-none z-0">
          <AmbientBackground
            ambientTheme={settings.ambientTheme}
            particles={settings.ambientParticles !== false}
          />
        </div>
      )}

      {/* 2. WALLPAPER DIMMER / READABILITY OVERLAY */}
      {hasCustomMediaWallpaper && (
        <div
          className="fixed inset-0 pointer-events-none z-[1] transition-opacity duration-500 bg-black"
          style={{
            opacity: (settings.wallpaperOpacity ?? 25) / 100,
          }}
        />
      )}

      {/* 3. OPTICAL DEPTH EFFECT AMBIENT VIGNETTE */}
      {depthEffect && (
        <div
          className="fixed inset-0 pointer-events-none z-[2] transition-opacity duration-700"
          style={{
            background: `radial-gradient(circle at 50% 50%, rgba(0,0,0,0.1) 0%, rgba(0,0,0,${(depthIntensity / 100) * 0.75}) 100%)`,
          }}
        />
      )}

      {/* Top Floating Control Bar */}
      <header
        id="clock-header-controls"
        className={`sticky top-0 left-0 right-0 w-full px-6 py-5 flex items-center justify-between z-40 transition-all duration-300 ${
          controlsVisible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4 pointer-events-none'
        }`}
      >
        <div className="flex items-center gap-3">
          <button
            id="clock-back-welcome-btn"
            onClick={onGoToWelcome}
            className={`apple-hover flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-medium backdrop-blur-md border cursor-pointer shadow-sm ${
              isLight && !hasCustomMediaWallpaper
                ? 'border-neutral-300/80 bg-white/70 hover:bg-white text-neutral-800'
                : 'border-white/10 bg-black/40 hover:bg-black/60 text-white'
            }`}
            title="Return to Welcome Screen"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Welcome Screen</span>
          </button>

          <span className="text-xs tracking-wider opacity-75 hidden md:inline-flex items-center gap-1.5 font-mono">
            <span>Standby Desk</span>
            <span className="font-semibold opacity-90">• {userName}</span>
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Party Leaderboard & Chat Button */}
          {onOpenParties && (
            <button
              id="clock-parties-btn"
              onClick={onOpenParties}
              className={`apple-hover flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium backdrop-blur-md border cursor-pointer shadow-sm transition-colors ${
                isLight && !hasCustomMediaWallpaper
                  ? 'border-neutral-300/80 bg-white/70 hover:bg-white text-neutral-800'
                  : 'border-white/10 bg-black/40 hover:bg-black/60 text-amber-300'
              }`}
              title="Study & Work Parties (Leaderboard & Chat)"
            >
              <Users className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden sm:inline">Parties</span>
            </button>
          )}

          {/* Quick Pomodoro Switch */}
          <button
            id="clock-to-pomodoro-btn"
            onClick={onGoToPomodoro}
            className={`apple-hover flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-medium backdrop-blur-md border cursor-pointer shadow-sm ${
              isLight && !hasCustomMediaWallpaper
                ? 'border-neutral-300/80 bg-white/70 hover:bg-white'
                : 'border-white/10 bg-black/40 hover:bg-black/60'
            }`}
            style={{ color: resolvedAccentColor }}
            title={pomodoroTimer?.isRunning ? 'Pomodoro running in background - Click to view' : 'Open Pomodoro Timer'}
          >
            <Timer className={`w-3.5 h-3.5 ${pomodoroTimer?.isRunning ? 'animate-pulse text-emerald-500' : ''}`} />
            {pomodoroTimer && (pomodoroTimer.isRunning || pomodoroTimer.timeLeft < pomodoroTimer.totalTime) ? (
              <span className="font-mono font-bold">
                {String(Math.floor(pomodoroTimer.timeLeft / 60)).padStart(2, '0')}:
                {String(pomodoroTimer.timeLeft % 60).padStart(2, '0')}
                <span className="hidden sm:inline text-[10px] font-normal opacity-75 ml-1">
                  ({pomodoroTimer.isRunning ? (pomodoroTimer.phase === 'work' ? 'Focus' : 'Break') : 'Paused'})
                </span>
              </span>
            ) : (
              <span className="hidden sm:inline">Pomodoro</span>
            )}
          </button>

          {/* Fullscreen Button */}
          <button
            id="clock-fullscreen-btn"
            onClick={toggleFullscreen}
            className={`apple-icon-hover p-2 rounded-xl text-xs backdrop-blur-md border cursor-pointer shadow-sm ${
              isLight && !hasCustomMediaWallpaper
                ? 'border-neutral-300/80 bg-white/70 hover:bg-white text-neutral-800'
                : 'border-white/10 bg-black/40 hover:bg-black/60 text-white'
            }`}
            title={isFullscreen ? 'Exit Fullscreen (F11)' : 'Enter Fullscreen (F11 - Laptop Desk View)'}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>

          {/* Edit Layout Quick Toggle Button */}
          <button
            id="clock-quick-layout-toggle-btn"
            onClick={() => {
              const next = !isEditLayoutMode;
              setIsEditLayoutMode(next);
              onUpdateSettings?.({ customLayoutEnabled: next });
            }}
            className={`apple-hover flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium backdrop-blur-md border cursor-pointer shadow-sm transition-all ${
              isEditLayoutMode
                ? 'border-amber-400 bg-amber-500 text-neutral-950 font-bold ring-2 ring-amber-400/40'
                : isLight && !hasCustomMediaWallpaper
                ? 'border-neutral-300/80 bg-white/70 hover:bg-white text-neutral-800'
                : 'border-white/10 bg-black/40 hover:bg-black/60 text-white'
            }`}
            title={isEditLayoutMode ? 'Lock Layout & Finish Editing' : 'Reposition Elements & Edit Layout'}
          >
            <Move className="w-4 h-4" />
            <span className="hidden sm:inline">{isEditLayoutMode ? 'Lock Layout' : 'Edit Layout'}</span>
          </button>

          {/* Settings Button */}
          <button
            id="clock-settings-btn"
            onClick={onOpenSettings}
            className={`apple-hover flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium backdrop-blur-md border cursor-pointer shadow-sm ${
              isLight && !hasCustomMediaWallpaper
                ? 'border-neutral-300/80 bg-white/70 hover:bg-white text-neutral-800'
                : 'border-white/10 bg-black/40 hover:bg-black/60 text-white'
            }`}
            title="Customize Clock, Layout & Settings"
          >
            <Settings className="w-4 h-4" />
            <span className="hidden sm:inline">Customize</span>
          </button>

          {/* Shortcuts Button */}
          {onOpenShortcuts && (
            <button
              id="clock-shortcuts-btn"
              onClick={onOpenShortcuts}
              className={`apple-icon-hover p-2 rounded-xl text-xs backdrop-blur-md border cursor-pointer shadow-sm ${
                isLight && !hasCustomMediaWallpaper
                  ? 'border-neutral-300/80 bg-white/70 hover:bg-white text-neutral-800'
                  : 'border-white/10 bg-black/40 hover:bg-black/60 text-white'
              }`}
              title="Keyboard Shortcuts (? or \)"
            >
              <Keyboard className="w-4 h-4" />
            </button>
          )}
        </div>
      </header>

      {/* Floating Layout Toolbar when in Edit Layout Mode (Transparent & Non-obstructive) */}
      {isEditLayoutMode && (
        <div
          id="clock-layout-toolbar"
          className={`fixed top-3 sm:top-4 left-1/2 -translate-x-1/2 z-50 transition-all duration-300 select-none max-w-2xl w-[94vw] sm:w-auto ${
            draggingTarget !== null || isResizingClock
              ? 'opacity-20 pointer-events-none scale-95'
              : 'opacity-90 hover:opacity-100'
          }`}
        >
          {isToolbarCollapsed ? (
            <div className="flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-neutral-950/25 hover:bg-neutral-950/70 backdrop-blur-md border border-white/10 hover:border-amber-400/40 shadow-xl text-xs text-white">
              <Move className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
              <span className="font-mono text-[11px] text-neutral-300">Layout Editing</span>
              <button
                type="button"
                onClick={() => setIsToolbarCollapsed(false)}
                className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-white/10 hover:bg-white/20 text-neutral-200 text-[10px] font-mono transition-colors cursor-pointer"
              >
                <ChevronDown className="w-3 h-3" />
                <span>Show Controls</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsEditLayoutMode(false);
                  onUpdateSettings?.({ customLayoutEnabled: false });
                }}
                className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-[10px] shadow transition-colors cursor-pointer"
              >
                <Lock className="w-2.5 h-2.5" />
                <span>Lock</span>
              </button>
            </div>
          ) : (
            <div className="px-4 py-2 rounded-2xl bg-neutral-950/25 hover:bg-neutral-950/75 backdrop-blur-md border border-white/10 hover:border-amber-500/40 shadow-2xl flex flex-col gap-2 animate-fade-in text-xs text-white">
              {/* Top Row: Title, Element Selectors, and Lock & Done */}
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-1.5">
                <div className="flex items-center gap-1.5 font-bold text-amber-400 font-mono text-[11px] uppercase tracking-wider">
                  <Move className="w-3.5 h-3.5 animate-pulse" />
                  <span>Layout Editor</span>
                </div>

                {/* Element Tabs (Dynamically excludes AM/PM when radial arc or non-modern styles are active) */}
                <div className="flex items-center gap-1 bg-black/30 p-0.5 rounded-xl border border-white/10 backdrop-blur-sm">
                  {(
                    [
                      { id: 'clock' as const, label: 'Clock' },
                      { id: 'date' as const, label: 'Date' },
                      { id: 'mantra' as const, label: 'Mantra' },
                      ...(isModernDesign ? [{ id: 'ampm' as const, label: 'AM/PM' }] : []),
                    ]
                  ).map((tab) => (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setSelectedElement(tab.id)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all cursor-pointer ${
                        selectedElement === tab.id
                          ? 'bg-amber-500 text-neutral-950 font-bold shadow-sm'
                          : 'text-neutral-300 hover:text-white'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-1.5">
                  {/* Minimize / Collapse Button */}
                  <button
                    type="button"
                    onClick={() => setIsToolbarCollapsed(true)}
                    className="p-1 rounded-lg bg-black/30 hover:bg-white/10 text-neutral-300 hover:text-white transition-colors cursor-pointer"
                    title="Collapse toolbar for unobstructed view"
                  >
                    <ChevronUp className="w-3.5 h-3.5" />
                  </button>

                  {/* Lock & Done Button */}
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditLayoutMode(false);
                      onUpdateSettings?.({ customLayoutEnabled: false });
                    }}
                    className="flex items-center gap-1 px-3 py-1 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-xs shadow-md transition-all cursor-pointer"
                    title="Lock layout and finish customization"
                  >
                    <Lock className="w-3 h-3 stroke-[2.5]" />
                    <span>Lock & Done</span>
                  </button>
                </div>
              </div>

              {/* Bottom Row: Selected Element Controls (Laterally, Vertically, Rotate, Reset) */}
              <div className="flex flex-wrap items-center justify-center gap-2.5 text-[11px]">
                {/* Clock Uniform Scale if clock is selected */}
                {selectedElement === 'clock' && (
                  <div className="flex items-center gap-1.5 bg-black/30 px-2.5 py-1 rounded-xl border border-white/10 backdrop-blur-sm">
                    <span className="text-neutral-400">Scale:</span>
                    <button
                      type="button"
                      onClick={() => onUpdateSettings?.({ clockScale: Math.max(0.4, +(clockScale - 0.05).toFixed(2)) })}
                      className="w-5 h-5 rounded bg-white/10 hover:bg-white/20 font-bold flex items-center justify-center text-xs"
                    >
                      -
                    </button>
                    <input
                      type="range"
                      min="40"
                      max="250"
                      value={Math.round(clockScale * 100)}
                      onChange={(e) => onUpdateSettings?.({ clockScale: +(Number(e.target.value) / 100).toFixed(2) })}
                      className="w-16 sm:w-20 accent-amber-400 cursor-pointer h-1.5"
                      title="Drag slider to adjust clock size"
                    />
                    <span className="font-mono text-amber-300 font-bold min-w-[36px] text-center">
                      {Math.round(clockScale * 100)}%
                    </span>
                    <button
                      type="button"
                      onClick={() => onUpdateSettings?.({ clockScale: Math.min(2.8, +(clockScale + 0.05).toFixed(2)) })}
                      className="w-5 h-5 rounded bg-white/10 hover:bg-white/20 font-bold flex items-center justify-center text-xs"
                    >
                      +
                    </button>
                  </div>
                )}

            {/* Lateral Size (Scale X) */}
            <div className="flex items-center gap-1 bg-black/30 px-2 py-1 rounded-xl border border-white/10 backdrop-blur-sm">
              <span className="text-neutral-400 flex items-center gap-0.5">
                <ArrowLeftRight className="w-3 h-3 text-sky-400" />
                <span>Width:</span>
              </span>
              <button
                type="button"
                onClick={() => {
                  if (selectedElement === 'clock') {
                    onUpdateSettings?.({ clockScaleX: Math.max(0.4, +(clockScaleX - 0.05).toFixed(2)) });
                  } else if (selectedElement === 'date') {
                    onUpdateSettings?.({ dateLayout: { ...dateLayout, scaleX: Math.max(0.4, +(dateLayout.scaleX - 0.05).toFixed(2)) } });
                  } else if (selectedElement === 'mantra') {
                    onUpdateSettings?.({ mantraLayout: { ...mantraLayout, scaleX: Math.max(0.4, +(mantraLayout.scaleX - 0.05).toFixed(2)) } });
                  } else if (selectedElement === 'ampm') {
                    onUpdateSettings?.({ ampmLayout: { ...ampmLayout, scaleX: Math.max(0.4, +(ampmLayout.scaleX - 0.05).toFixed(2)) } });
                  }
                }}
                className="w-5 h-5 rounded bg-white/10 hover:bg-white/20 font-bold flex items-center justify-center text-xs"
              >
                -
              </button>
              <span className="font-mono text-amber-300 font-bold min-w-[36px] text-center">
                {Math.round(
                  (selectedElement === 'clock'
                    ? clockScaleX
                    : selectedElement === 'date'
                    ? dateLayout.scaleX
                    : selectedElement === 'mantra'
                    ? mantraLayout.scaleX
                    : ampmLayout.scaleX) * 100
                )}%
              </span>
              <button
                type="button"
                onClick={() => {
                  if (selectedElement === 'clock') {
                    onUpdateSettings?.({ clockScaleX: Math.min(2.5, +(clockScaleX + 0.05).toFixed(2)) });
                  } else if (selectedElement === 'date') {
                    onUpdateSettings?.({ dateLayout: { ...dateLayout, scaleX: Math.min(2.5, +(dateLayout.scaleX + 0.05).toFixed(2)) } });
                  } else if (selectedElement === 'mantra') {
                    onUpdateSettings?.({ mantraLayout: { ...mantraLayout, scaleX: Math.min(2.5, +(mantraLayout.scaleX + 0.05).toFixed(2)) } });
                  } else if (selectedElement === 'ampm') {
                    onUpdateSettings?.({ ampmLayout: { ...ampmLayout, scaleX: Math.min(2.5, +(ampmLayout.scaleX + 0.05).toFixed(2)) } });
                  }
                }}
                className="w-5 h-5 rounded bg-white/10 hover:bg-white/20 font-bold flex items-center justify-center text-xs"
              >
                +
              </button>
            </div>

            {/* Vertical Size (Scale Y) */}
            <div className="flex items-center gap-1 bg-black/30 px-2 py-1 rounded-xl border border-white/10 backdrop-blur-sm">
              <span className="text-neutral-400 flex items-center gap-0.5">
                <ArrowUpDown className="w-3 h-3 text-emerald-400" />
                <span>Height:</span>
              </span>
              <button
                type="button"
                onClick={() => {
                  if (selectedElement === 'clock') {
                    onUpdateSettings?.({ clockScaleY: Math.max(0.4, +(clockScaleY - 0.05).toFixed(2)) });
                  } else if (selectedElement === 'date') {
                    onUpdateSettings?.({ dateLayout: { ...dateLayout, scaleY: Math.max(0.4, +(dateLayout.scaleY - 0.05).toFixed(2)) } });
                  } else if (selectedElement === 'mantra') {
                    onUpdateSettings?.({ mantraLayout: { ...mantraLayout, scaleY: Math.max(0.4, +(mantraLayout.scaleY - 0.05).toFixed(2)) } });
                  } else if (selectedElement === 'ampm') {
                    onUpdateSettings?.({ ampmLayout: { ...ampmLayout, scaleY: Math.max(0.4, +(ampmLayout.scaleY - 0.05).toFixed(2)) } });
                  }
                }}
                className="w-5 h-5 rounded bg-white/10 hover:bg-white/20 font-bold flex items-center justify-center text-xs"
              >
                -
              </button>
              <span className="font-mono text-amber-300 font-bold min-w-[36px] text-center">
                {Math.round(
                  (selectedElement === 'clock'
                    ? clockScaleY
                    : selectedElement === 'date'
                    ? dateLayout.scaleY
                    : selectedElement === 'mantra'
                    ? mantraLayout.scaleY
                    : ampmLayout.scaleY) * 100
                )}%
              </span>
              <button
                type="button"
                onClick={() => {
                  if (selectedElement === 'clock') {
                    onUpdateSettings?.({ clockScaleY: Math.min(2.5, +(clockScaleY + 0.05).toFixed(2)) });
                  } else if (selectedElement === 'date') {
                    onUpdateSettings?.({ dateLayout: { ...dateLayout, scaleY: Math.min(2.5, +(dateLayout.scaleY + 0.05).toFixed(2)) } });
                  } else if (selectedElement === 'mantra') {
                    onUpdateSettings?.({ mantraLayout: { ...mantraLayout, scaleY: Math.min(2.5, +(mantraLayout.scaleY + 0.05).toFixed(2)) } });
                  } else if (selectedElement === 'ampm') {
                    onUpdateSettings?.({ ampmLayout: { ...ampmLayout, scaleY: Math.min(2.5, +(ampmLayout.scaleY + 0.05).toFixed(2)) } });
                  }
                }}
                className="w-5 h-5 rounded bg-white/10 hover:bg-white/20 font-bold flex items-center justify-center text-xs"
              >
                +
              </button>
            </div>

            {/* Rotation Angle */}
            <div className="flex items-center gap-1 bg-black/30 px-2 py-1 rounded-xl border border-white/10 backdrop-blur-sm">
              <span className="text-neutral-400 flex items-center gap-0.5">
                <RotateCw className="w-3 h-3 text-purple-400" />
                <span>Rotate:</span>
              </span>
              <button
                type="button"
                onClick={() => {
                  if (selectedElement === 'clock') {
                    onUpdateSettings?.({ clockRotation: Math.max(-180, clockRotation - 5) });
                  } else if (selectedElement === 'date') {
                    onUpdateSettings?.({ dateLayout: { ...dateLayout, rotation: Math.max(-180, dateLayout.rotation - 5) } });
                  } else if (selectedElement === 'mantra') {
                    onUpdateSettings?.({ mantraLayout: { ...mantraLayout, rotation: Math.max(-180, mantraLayout.rotation - 5) } });
                  } else if (selectedElement === 'ampm') {
                    onUpdateSettings?.({ ampmLayout: { ...ampmLayout, rotation: Math.max(-180, ampmLayout.rotation - 5) } });
                  }
                }}
                className="w-5 h-5 rounded bg-white/10 hover:bg-white/20 font-bold flex items-center justify-center text-xs"
              >
                -
              </button>
              <span className="font-mono text-amber-300 font-bold min-w-[34px] text-center">
                {selectedElement === 'clock'
                  ? clockRotation
                  : selectedElement === 'date'
                  ? dateLayout.rotation
                  : selectedElement === 'mantra'
                  ? mantraLayout.rotation
                  : ampmLayout.rotation}°
              </span>
              <button
                type="button"
                onClick={() => {
                  if (selectedElement === 'clock') {
                    onUpdateSettings?.({ clockRotation: Math.min(180, clockRotation + 5) });
                  } else if (selectedElement === 'date') {
                    onUpdateSettings?.({ dateLayout: { ...dateLayout, rotation: Math.min(180, dateLayout.rotation + 5) } });
                  } else if (selectedElement === 'mantra') {
                    onUpdateSettings?.({ mantraLayout: { ...mantraLayout, rotation: Math.min(180, mantraLayout.rotation + 5) } });
                  } else if (selectedElement === 'ampm') {
                    onUpdateSettings?.({ ampmLayout: { ...ampmLayout, rotation: Math.min(180, ampmLayout.rotation + 5) } });
                  }
                }}
                className="w-5 h-5 rounded bg-white/10 hover:bg-white/20 font-bold flex items-center justify-center text-xs"
              >
                +
              </button>
            </div>

            {/* Reset Element */}
            <button
              type="button"
              onClick={() => {
                if (selectedElement === 'clock') {
                  onUpdateSettings?.({ clockPosition: { x: 0, y: 0 }, clockScale: 1, clockScaleX: 1, clockScaleY: 1, clockRotation: 0 });
                } else if (selectedElement === 'date') {
                  onUpdateSettings?.({ dateLayout: { x: 0, y: 0, scaleX: 1, scaleY: 1, rotation: 0 } });
                } else if (selectedElement === 'mantra') {
                  onUpdateSettings?.({ mantraLayout: { x: 0, y: 0, scaleX: 1, scaleY: 1, rotation: 0 } });
                } else if (selectedElement === 'ampm') {
                  onUpdateSettings?.({ ampmLayout: { x: 0, y: 0, scaleX: 1, scaleY: 1, rotation: 0 } });
                }
              }}
              className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-white/10 hover:bg-white/20 text-neutral-200 text-[11px] font-medium transition-all cursor-pointer border border-white/10"
              title="Reset current element position, scale and rotation"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset {selectedElement.toUpperCase()}</span>
            </button>

            {/* Reset Everything */}
            <button
              type="button"
              onClick={() =>
                onUpdateSettings?.({
                  clockPosition: { x: 0, y: 0 },
                  clockScale: 1,
                  clockScaleX: 1,
                  clockScaleY: 1,
                  clockRotation: 0,
                  dateLayout: { x: 0, y: 0, scaleX: 1, scaleY: 1, rotation: 0 },
                  mantraLayout: { x: 0, y: 0, scaleX: 1, scaleY: 1, rotation: 0 },
                  ampmLayout: { x: 0, y: 0, scaleX: 1, scaleY: 1, rotation: 0 },
                  batteryWidgetPosition: { x: 0, y: 0 },
                  batteryWidgetScale: 1,
                  stopwatchWidgetPosition: { x: 0, y: 0 },
                  stopwatchWidgetScale: 1,
                })
              }
              className="px-2 py-1 rounded-xl bg-white/5 hover:bg-white/15 text-neutral-400 hover:text-neutral-200 text-[10px] transition-all cursor-pointer border border-white/5"
            >
              Reset All
            </button>
          </div>
        </div>
      )}
    </div>
  )}

      {/* Main Center Clock Display */}
      <main
        id="clock-digits-display"
        className="w-full flex-1 flex flex-col items-center justify-center p-4 sm:p-8 text-center mx-auto z-10 transition-transform duration-1000 ease-out"
        style={{
          transform: settings.digitSize === 'fill'
            ? 'none'
            : `translate3d(${driftOffset.x}px, ${driftOffset.y}px, 0)`,
        }}
      >
        {/* Day & Date Row - Individually Draggable & Scalable */}
        {(settings.showDayOfWeek || settings.showDate) && (
          <div
            id="clock-date-row"
            onMouseDown={(e) => handleStartDrag('date', e)}
            onTouchStart={(e) => handleStartDrag('date', e)}
            onClick={() => isEditLayoutMode && setSelectedElement('date')}
            className={`w-full flex items-center justify-center text-center gap-2.5 sm:gap-3 mb-3 sm:mb-6 font-medium tracking-widest text-sm sm:text-base md:text-lg uppercase opacity-85 font-sans mx-auto transition-all ${
              isEditLayoutMode
                ? `cursor-grab active:cursor-grabbing p-2 rounded-2xl border-2 border-dashed ${
                    selectedElement === 'date'
                      ? 'border-amber-400 bg-amber-500/15 ring-2 ring-amber-400/40'
                      : 'border-amber-400/40 bg-amber-500/5 hover:border-amber-400'
                  }`
                : ''
            }`}
            style={{
              transform: `translate3d(${dateLayout.x}px, ${dateLayout.y}px, 0) scale(${dateLayout.scaleX ?? 1}, ${dateLayout.scaleY ?? 1}) rotate(${dateLayout.rotation ?? 0}deg)`,
              transformOrigin: 'center center',
              transition: draggingTarget === 'date' ? 'none' : 'transform 0.15s ease-out',
              textShadow: hasCustomMediaWallpaper ? '0 2px 10px rgba(0,0,0,0.8)' : undefined,
            }}
          >
            {settings.showDayOfWeek && (
              <span id="clock-day-of-week" className="font-semibold tracking-wider text-center">
                {dayOfWeek}
              </span>
            )}
            {settings.showDayOfWeek && settings.showDate && (
              <span className="opacity-40">•</span>
            )}
            {settings.showDate && (
              <span id="clock-full-date" className="text-center">
                {monthName} {dateNum}, {year}
              </span>
            )}
          </div>
        )}

        {/* Freeform Draggable & Resizable Clock Style Container */}
        <div
          id="custom-clock-container"
          ref={clockContainerRef}
          onMouseDown={(e) => handleStartDrag('clock', e)}
          onTouchStart={(e) => handleStartDrag('clock', e)}
          onClick={() => isEditLayoutMode && setSelectedElement('clock')}
          style={{
            transform: `translate3d(${clockPos.x}px, ${clockPos.y}px, 0) scale(${(clockScale * clockScaleX).toFixed(3)}, ${(clockScale * clockScaleY).toFixed(3)}) rotate(${clockRotation}deg)`,
            transformOrigin: 'center center',
            transition: draggingTarget === 'clock' || isResizingClock ? 'none' : 'transform 0.15s ease-out',
          }}
          className={`relative max-w-full flex flex-col items-center justify-center select-none ${
            isEditLayoutMode
              ? `cursor-grab active:cursor-grabbing p-4 sm:p-8 rounded-3xl border-2 border-dashed ${
                  selectedElement === 'clock'
                    ? 'border-amber-400 bg-amber-500/15 ring-2 ring-amber-400/40 shadow-2xl'
                    : 'border-amber-400/60 bg-amber-500/5 hover:border-amber-400 shadow-xl'
                }`
              : ''
          }`}
        >
          {/* Edit Layout Mode Badges & Drag / Resize Handles */}
          {isEditLayoutMode && (
            <>
              {/* Top-Left Drag Reposition Badge */}
              <div className="absolute -top-3.5 left-4 z-30 px-2.5 py-0.5 rounded-full bg-amber-500 text-neutral-950 text-[10px] font-bold font-mono uppercase tracking-wider flex items-center gap-1 shadow-md pointer-events-none">
                <Move className="w-2.5 h-2.5" />
                <span>Drag to Move Clock</span>
              </div>

              {/* Bottom-Right Corner Scaling Handle (Hold and drag outward to enlarge, inward to shrink) */}
              <div
                onMouseDown={handleResizeStart}
                onTouchStart={handleResizeStart}
                className="absolute -bottom-3 -right-3 z-30 w-7 h-7 rounded-full bg-amber-400 hover:bg-amber-300 text-neutral-950 flex items-center justify-center cursor-nwse-resize shadow-xl border-2 border-neutral-900 transition-transform hover:scale-110 active:scale-95 select-none"
                title="Hold and drag mouse outward to enlarge clock, inward to shrink"
              >
                <Maximize2 className="w-3.5 h-3.5 stroke-[2.5]" />
              </div>

              {/* Bottom-Left Corner Scaling Handle */}
              <div
                onMouseDown={handleResizeStart}
                onTouchStart={handleResizeStart}
                className="absolute -bottom-3 -left-3 z-30 w-7 h-7 rounded-full bg-amber-400 hover:bg-amber-300 text-neutral-950 flex items-center justify-center cursor-nesw-resize shadow-xl border-2 border-neutral-900 transition-transform hover:scale-110 active:scale-95 select-none"
                title="Hold and drag mouse outward to enlarge clock, inward to shrink"
              >
                <Maximize2 className="w-3.5 h-3.5 stroke-[2.5]" />
              </div>
            </>
          )}

          {/* RENDER THE ACTIVE CLOCK DESIGN STYLE */}
          {settings.clockStyle === 'flip' ? (
            <FlipClock
              hoursStr={hoursStr}
              minutesStr={minutesStr}
              secondsStr={secondsStr}
              ampm={ampm}
              settings={settings}
              resolvedTextColor={resolvedTextColor}
              resolvedAccentColor={resolvedAccentColor}
              isLight={isLight}
            />
          ) : settings.clockStyle === 'analog' ? (
            <AnalogClock
              date={time}
              ampm={ampm}
              settings={settings}
              resolvedTextColor={resolvedTextColor}
              resolvedAccentColor={resolvedAccentColor}
              isLight={isLight}
            />
          ) : settings.clockStyle === 'seven-segment' ? (
            <SevenSegmentClock
              hoursStr={hoursStr}
              minutesStr={minutesStr}
              secondsStr={secondsStr}
              ampm={ampm}
              settings={settings}
              resolvedAccentColor={resolvedAccentColor}
            />
          ) : settings.clockStyle === 'neon-cyber' ? (
            <CyberpunkClock
              hoursStr={hoursStr}
              minutesStr={minutesStr}
              secondsStr={secondsStr}
              ampm={ampm}
              settings={settings}
              resolvedAccentColor={resolvedAccentColor}
              digitTextStyle={digitTextStyle}
            />
          ) : settings.clockStyle === 'arc-radial' ? (
            <RadialArcClock
              date={time}
              hoursStr={hoursStr}
              minutesStr={minutesStr}
              secondsStr={secondsStr}
              ampm={ampm}
              settings={settings}
              resolvedTextColor={resolvedTextColor}
              resolvedAccentColor={resolvedAccentColor}
              isLight={isLight}
            />
          ) : (
            /* Modern Typographic Clock (Default) with Text Gradients */
            <div
              id="clock-digits-wrapper"
              className="relative inline-flex items-center justify-center"
            >
              <div
                id="clock-primary-time"
                className={`apple-display-hover relative inline-flex items-center justify-center text-center tracking-tight leading-none select-none mx-auto ${getDigitSizeStyle()}`}
                style={{
                  fontFamily: selectedFont.cssFamily,
                  transform: (FONT_SCALE_NORMALIZATION[settings.fontFamily] ?? 1) !== 1
                    ? `scale(${FONT_SCALE_NORMALIZATION[settings.fontFamily]})`
                    : undefined,
                  transformOrigin: 'center center',
                  ...digitTextStyle,
                  textShadow:
                    settings.colorMode && settings.colorMode !== 'solid'
                      ? 'none'
                      : isAmbientActive
                      ? `0 0 35px ${activeAmbient.glowColor}, 0 0 70px ${activeAmbient.glowColor}80`
                      : settings.themeId === 'cyber-neon' || settings.themeId === 'amber-vintage'
                      ? `0 0 40px ${resolvedAccentColor}40`
                      : hasCustomMediaWallpaper
                      ? '0 4px 20px rgba(0,0,0,0.7), 0 12px 35px rgba(0,0,0,0.5)'
                      : 'none',
                  filter: depthEffect
                    ? `drop-shadow(0 ${20 * (depthIntensity / 100)}px ${30 * (depthIntensity / 100)}px rgba(0,0,0,0.9))`
                    : undefined,
                }}
              >
                {/* Hours */}
                <span id="clock-hours">{hoursStr}</span>

                {/* Pulsing Colon Separator */}
                <span
                  id="clock-colon"
                  className="mx-1 sm:mx-2 opacity-75 animate-pulse inline-block"
                  style={{ animationDuration: '2s' }}
                >
                  :
                </span>

                {/* Minutes */}
                <span id="clock-minutes">{minutesStr}</span>

                {/* Optional Seconds */}
                {settings.showSeconds && (
                  <span className="inline-flex items-center">
                    <span
                      id="clock-seconds-colon"
                      className="mx-1 sm:mx-2 opacity-60 text-[0.6em]"
                    >
                      :
                    </span>
                    <span
                      id="clock-seconds"
                      className="opacity-85 text-[0.6em] font-light"
                      style={
                        settings.colorMode && settings.colorMode !== 'solid'
                          ? digitTextStyle
                          : { color: resolvedAccentColor }
                      }
                    >
                      {secondsStr}
                    </span>
                  </span>
                )}

                {/* Optional AM/PM Tag in standard non-fill layout with ampmLayout transform */}
                {settings.showAmPm && settings.timeFormat === '12h' && settings.digitSize !== 'fill' && (
                  <span
                    id="clock-ampm"
                    onMouseDown={(e) => handleStartDrag('ampm', e)}
                    onTouchStart={(e) => handleStartDrag('ampm', e)}
                    onClick={() => isEditLayoutMode && setSelectedElement('ampm')}
                    className={`absolute left-full ml-3 sm:ml-5 text-[0.22em] font-semibold tracking-wider uppercase px-2.5 py-1 rounded-md border border-current opacity-85 self-center font-sans whitespace-nowrap transition-all ${
                      isEditLayoutMode
                        ? `cursor-grab active:cursor-grabbing border-dashed ${
                            selectedElement === 'ampm'
                              ? 'border-amber-400 bg-amber-500/20 ring-1 ring-amber-400'
                              : 'border-amber-400/50 hover:border-amber-400'
                          }`
                        : ''
                    }`}
                    style={{
                      color: resolvedAccentColor,
                      transform: `translate3d(${ampmLayout.x}px, ${ampmLayout.y}px, 0) scale(${ampmLayout.scaleX ?? 1}, ${ampmLayout.scaleY ?? 1}) rotate(${ampmLayout.rotation ?? 0}deg)`,
                      transformOrigin: 'center center',
                    }}
                  >
                    {ampm}
                  </span>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Dedicated Centered AM/PM Tag when in Fill View (only for modern typographic clock) */}
        {isModernDesign && settings.digitSize === 'fill' && settings.showAmPm && settings.timeFormat === '12h' && (
          <div className="w-full flex items-center justify-center text-center mt-3 sm:mt-5 mx-auto">
            <span
              id="clock-ampm-fill"
              onMouseDown={(e) => handleStartDrag('ampm', e)}
              onTouchStart={(e) => handleStartDrag('ampm', e)}
              onClick={() => isEditLayoutMode && setSelectedElement('ampm')}
              className={`text-xs sm:text-sm md:text-base font-mono font-bold tracking-widest uppercase px-3.5 py-1 rounded-lg border border-current opacity-85 text-center mx-auto transition-all ${
                isEditLayoutMode
                  ? `cursor-grab active:cursor-grabbing border-dashed ${
                      selectedElement === 'ampm'
                        ? 'border-amber-400 bg-amber-500/20 ring-1 ring-amber-400'
                        : 'border-amber-400/50 hover:border-amber-400'
                    }`
                  : ''
              }`}
              style={{
                color: resolvedAccentColor,
                transform: `translate3d(${ampmLayout.x}px, ${ampmLayout.y}px, 0) scale(${ampmLayout.scaleX ?? 1}, ${ampmLayout.scaleY ?? 1}) rotate(${ampmLayout.rotation ?? 0}deg)`,
                transformOrigin: 'center center',
              }}
            >
              {ampm}
            </span>
          </div>
        )}

        {/* Optional Motivational Quote or Work Mantra - Individually Draggable & Scalable */}
        {settings.showQuote && settings.quoteText && (
          <div
            id="clock-quote-display"
            onMouseDown={(e) => handleStartDrag('mantra', e)}
            onTouchStart={(e) => handleStartDrag('mantra', e)}
            onClick={() => isEditLayoutMode && setSelectedElement('mantra')}
            className={`mt-6 sm:mt-10 max-w-xl mx-auto px-6 py-2.5 rounded-full border text-xs sm:text-sm tracking-wide opacity-85 italic font-sans text-center transition-all ${
              isEditLayoutMode
                ? `cursor-grab active:cursor-grabbing border-2 border-dashed ${
                    selectedElement === 'mantra'
                      ? 'border-amber-400 bg-amber-500/15 ring-2 ring-amber-400/40'
                      : 'border-amber-400/40 bg-amber-500/5 hover:border-amber-400'
                  }`
                : hasCustomMediaWallpaper || !isLight
                ? 'border-white/10 bg-black/40 text-neutral-200 backdrop-blur-md shadow-sm'
                : 'border-neutral-300/80 bg-white/70 text-neutral-800 shadow-sm'
            }`}
            style={{
              transform: `translate3d(${mantraLayout.x}px, ${mantraLayout.y}px, 0) scale(${mantraLayout.scaleX ?? 1}, ${mantraLayout.scaleY ?? 1}) rotate(${mantraLayout.rotation ?? 0}deg)`,
              transformOrigin: 'center center',
              transition: draggingTarget === 'mantra' ? 'none' : 'transform 0.15s ease-out',
            }}
          >
            &ldquo;{settings.quoteText}&rdquo;
          </div>
        )}
      </main>

      {/* Standby Desktop Widgets Layer (Draggable in Edit Layout Mode) */}
      {(settings.showBatteryWidget ||
        settings.showStopwatchWidget ||
        settings.showWeatherWidget ||
        settings.showFocusGoalWidget ||
        settings.showQuickNoteWidget) && (
        <div
          id="clock-widgets-layer"
          className="fixed bottom-6 left-0 right-0 px-6 flex flex-wrap items-center justify-between gap-4 pointer-events-none z-30"
        >
          {/* Left Widgets Group */}
          <div className="flex flex-wrap items-center gap-3 pointer-events-auto">
            {settings.showBatteryWidget && (
              <BatteryWidget
                style={settings.batteryWidgetStyle || 'pill'}
                theme={settings.widgetTheme || 'glass'}
                isCustomLayout={isEditLayoutMode}
                position={settings.batteryWidgetPosition}
                onPositionChange={(pos) => onUpdateSettings?.({ batteryWidgetPosition: pos })}
                scale={settings.batteryWidgetScale ?? 1}
                onScaleChange={(scale) => onUpdateSettings?.({ batteryWidgetScale: scale })}
                accentColor={resolvedAccentColor}
                isLight={isLight}
              />
            )}

            {settings.showWeatherWidget && (
              <WeatherWidget
                style={settings.weatherWidgetStyle || 'pill'}
                theme={settings.widgetTheme || 'glass'}
                isCustomLayout={isEditLayoutMode}
                position={settings.weatherWidgetPosition}
                onPositionChange={(pos) => onUpdateSettings?.({ weatherWidgetPosition: pos })}
                scale={settings.weatherWidgetScale ?? 1}
                onScaleChange={(scale) => onUpdateSettings?.({ weatherWidgetScale: scale })}
                tempUnit={settings.weatherTempUnit || 'f'}
                city={settings.weatherCity || 'San Francisco'}
                accentColor={resolvedAccentColor}
                isLight={isLight}
              />
            )}

            {settings.showQuickNoteWidget && (
              <QuickNoteWidget
                theme={settings.widgetTheme || 'glass'}
                isCustomLayout={isEditLayoutMode}
                position={settings.quickNoteWidgetPosition}
                onPositionChange={(pos) => onUpdateSettings?.({ quickNoteWidgetPosition: pos })}
                scale={settings.quickNoteWidgetScale ?? 1}
                onScaleChange={(scale) => onUpdateSettings?.({ quickNoteWidgetScale: scale })}
                text={settings.quickNoteText || 'Deep Work Mode • Stay Hydrated 💧'}
                onTextChange={(txt) => onUpdateSettings?.({ quickNoteText: txt })}
                accentColor={resolvedAccentColor}
                isLight={isLight}
              />
            )}
          </div>

          {/* Right Widgets Group */}
          <div className="flex flex-wrap items-center gap-3 pointer-events-auto">
            {settings.showFocusGoalWidget && (
              <FocusGoalWidget
                theme={settings.widgetTheme || 'glass'}
                isCustomLayout={isEditLayoutMode}
                position={settings.focusGoalWidgetPosition}
                onPositionChange={(pos) => onUpdateSettings?.({ focusGoalWidgetPosition: pos })}
                scale={settings.focusGoalWidgetScale ?? 1}
                onScaleChange={(scale) => onUpdateSettings?.({ focusGoalWidgetScale: scale })}
                targetSessions={settings.focusDailyTarget || 4}
                completedSessions={3}
                accentColor={resolvedAccentColor}
                isLight={isLight}
              />
            )}

            {settings.showStopwatchWidget && (
              <StopwatchWidget
                style={settings.stopwatchWidgetStyle || 'compact'}
                theme={settings.widgetTheme || 'glass'}
                isCustomLayout={isEditLayoutMode}
                position={settings.stopwatchWidgetPosition}
                onPositionChange={(pos) => onUpdateSettings?.({ stopwatchWidgetPosition: pos })}
                scale={settings.stopwatchWidgetScale ?? 1}
                onScaleChange={(scale) => onUpdateSettings?.({ stopwatchWidgetScale: scale })}
                accentColor={resolvedAccentColor}
                isLight={isLight}
              />
            )}
          </div>
        </div>
      )}

      {/* 4. FOREGROUND DEPTH MASK (iOS Lockscreen Depth Effect Cutout) */}
      {depthEffect && depthMaskUrl && (
        <img
          src={depthMaskUrl}
          alt="Foreground Depth Cutout"
          className="fixed inset-0 w-full h-full object-cover pointer-events-none z-20 transition-opacity duration-700"
          style={{
            filter: settings.wallpaperBlur ? `blur(${settings.wallpaperBlur}px)` : undefined,
          }}
        />
      )}
    </div>
  );
};
