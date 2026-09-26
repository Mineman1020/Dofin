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
} from 'lucide-react';
import { ClockSettings, ThemePreset, AmbientThemePreset, AmbientThemeId } from '../types';
import { THEME_PRESETS, FONT_OPTIONS, AMBIENT_THEMES } from '../utils/constants';
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
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
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

  // Fullscreen management
  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
        setIsFullscreen(true);
      } else {
        if (document.exitFullscreen) {
          await document.exitFullscreen();
          setIsFullscreen(false);
        }
      }
    } catch (e) {
      console.debug('Fullscreen error:', e);
    }
  };

  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  // Resolve theme styles respecting user's explicit theme preset or ambient theme
  const activeTheme: ThemePreset =
    THEME_PRESETS.find((t) => t.id === settings.themeId) || THEME_PRESETS[0];

  const customBg = settings.themeId === 'custom' && settings.customBg ? settings.customBg : null;

  let resolvedBg = customBg;
  let resolvedTextColor =
    settings.themeId === 'custom' && settings.customTextColor
      ? settings.customTextColor
      : activeTheme.textColor;
  let resolvedAccentColor =
    settings.themeId === 'custom' && settings.customAccentColor
      ? settings.customAccentColor
      : activeTheme.accentColor;

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

  // Digit size classes - comfortably proportioned and legible from a distance
  const getDigitSizeStyle = () => {
    switch (settings.digitSize) {
      case 'medium':
        return 'text-7xl sm:text-8xl md:text-9xl lg:text-[10rem]';
      case 'large':
        return 'text-8xl sm:text-9xl md:text-[12rem] lg:text-[14rem]';
      case 'huge':
        return 'text-9xl sm:text-[12rem] md:text-[15rem] lg:text-[18rem]';
      case 'fill':
        return settings.showSeconds
          ? 'text-[min(18vw,28vh)]'
          : 'text-[min(28vw,46vh)]';
      default:
        return 'text-8xl sm:text-9xl md:text-[12rem] lg:text-[14rem]';
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
          : !isAmbientActive
          ? (resolvedBg || (isLight ? '#f7f5f0' : '#000000'))
          : undefined,
        backgroundImage: !hasCustomMediaWallpaper && isAmbientActive ? resolvedBg : undefined,
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
            title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen (Laptop Desk View)'}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
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
            title="Customize Clock & Settings"
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
        {/* Day & Date Row */}
        {(settings.showDayOfWeek || settings.showDate) && (
          <div
            id="clock-date-row"
            className="w-full flex items-center justify-center text-center gap-2.5 sm:gap-3 mb-3 sm:mb-6 font-medium tracking-widest text-sm sm:text-base md:text-lg uppercase opacity-85 font-sans mx-auto"
            style={{
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

        {/* Hero Clock Digits with Clean Authentic Typography */}
        <div
          id="clock-digits-wrapper"
          className="relative inline-flex items-center justify-center"
        >
          <div
            id="clock-primary-time"
            className={`apple-display-hover relative inline-flex items-center justify-center text-center tracking-tight leading-none select-none mx-auto ${getDigitSizeStyle()}`}
            style={{
              fontFamily: selectedFont.cssFamily,
              color: resolvedTextColor,
              textShadow: isAmbientActive
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
                  style={{ color: resolvedAccentColor }}
                >
                  {secondsStr}
                </span>
              </span>
            )}

            {/* Optional AM/PM Tag in standard non-fill layout */}
            {settings.showAmPm && settings.timeFormat === '12h' && settings.digitSize !== 'fill' && (
              <span
                id="clock-ampm"
                className="absolute left-full ml-3 sm:ml-5 text-[0.22em] font-semibold tracking-wider uppercase px-2.5 py-1 rounded-md border border-current opacity-85 self-center font-sans whitespace-nowrap"
                style={{ color: resolvedAccentColor }}
              >
                {ampm}
              </span>
            )}
          </div>
        </div>

        {/* Dedicated Centered AM/PM Tag when in Fill View to preserve geometric center */}
        {settings.digitSize === 'fill' && settings.showAmPm && settings.timeFormat === '12h' && (
          <div className="w-full flex items-center justify-center text-center mt-3 sm:mt-5 mx-auto">
            <span
              id="clock-ampm-fill"
              className="text-xs sm:text-sm md:text-base font-mono font-bold tracking-widest uppercase px-3.5 py-1 rounded-lg border border-current opacity-85 text-center mx-auto"
              style={{ color: resolvedAccentColor }}
            >
              {ampm}
            </span>
          </div>
        )}

        {/* Optional Motivational Quote or Work Mantra - Centered */}
        {settings.showQuote && settings.quoteText && (
          <div
            id="clock-quote-display"
            className={`mt-6 sm:mt-10 max-w-xl mx-auto px-6 py-2.5 rounded-full border text-xs sm:text-sm tracking-wide opacity-85 italic font-sans text-center ${
              hasCustomMediaWallpaper || !isLight
                ? 'border-white/10 bg-black/40 text-neutral-200 backdrop-blur-md shadow-sm'
                : 'border-neutral-300/80 bg-white/70 text-neutral-800 shadow-sm'
            }`}
          >
            &ldquo;{settings.quoteText}&rdquo;
          </div>
        )}
      </main>

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
