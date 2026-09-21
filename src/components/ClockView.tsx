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
import { getWallpaperItem } from '../utils/wallpaperStorage';
import { AmbientBackground } from './AmbientBackground';

interface ClockViewProps {
  settings: ClockSettings;
  onUpdateSettings?: (updated: Partial<ClockSettings>) => void;
  onOpenSettings: () => void;
  onGoToWelcome: () => void;
  onGoToPomodoro: () => void;
  onGoToTasks?: () => void;
  onGoToStats?: () => void;
  onOpenParties?: () => void;
  userName: string;
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
  userName,
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

  // Load custom wallpaper assets from local high-capacity IndexedDB
  useEffect(() => {
    let active = true;
    let createdBlobUrls: string[] = [];

    async function loadWallpapers() {
      try {
        if (settings.wallpaperMode === 'image') {
          const item = await getWallpaperItem('single-image');
          if (active && item && item.data) {
            if (typeof item.data === 'string') {
              setSingleWallpaperUrl(item.data);
            } else if (item.data instanceof Blob) {
              const url = URL.createObjectURL(item.data);
              createdBlobUrls.push(url);
              setSingleWallpaperUrl(url);
            }
          }
        } else if (settings.wallpaperMode === 'slideshow') {
          const item = await getWallpaperItem('slideshow-images');
          if (active && item && Array.isArray(item.data)) {
            setSlideshowUrls(item.data);
            setCurrentSlideIndex(0);
          }
        } else if (settings.wallpaperMode === 'video') {
          const item = await getWallpaperItem('live-video');
          if (active && item && item.data) {
            if (item.data instanceof Blob) {
              const url = URL.createObjectURL(item.data);
              createdBlobUrls.push(url);
              setVideoUrl(url);
            } else if (typeof item.data === 'string') {
              setVideoUrl(item.data);
            }
          }
        }

        // Check depth mask
        if (settings.depthEffect) {
          const maskItem = await getWallpaperItem('depth-mask');
          if (active && maskItem && maskItem.data) {
            if (maskItem.data instanceof Blob) {
              const url = URL.createObjectURL(maskItem.data);
              createdBlobUrls.push(url);
              setDepthMaskUrl(url);
            } else if (typeof maskItem.data === 'string') {
              setDepthMaskUrl(maskItem.data);
            }
          }
        }
      } catch (e) {
        console.warn('Error loading custom wallpaper:', e);
      }
    }

    loadWallpapers();

    return () => {
      active = false;
      createdBlobUrls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [settings.wallpaperMode, settings.depthEffect]);

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

  // Digit size classes
  const getDigitSizeStyle = () => {
    switch (settings.digitSize) {
      case 'medium':
        return 'text-6xl sm:text-8xl md:text-9xl';
      case 'large':
        return 'text-7xl sm:text-9xl md:text-[11rem] lg:text-[13rem]';
      case 'huge':
        return 'text-8xl sm:text-[11rem] md:text-[14rem] lg:text-[17rem]';
      case 'fill':
        return settings.showSeconds
          ? 'text-[min(16vw,26vh)]'
          : 'text-[min(25vw,42vh)]';
      default:
        return 'text-7xl sm:text-9xl md:text-[11rem]';
    }
  };

  const isLight = isAmbientActive ? !activeAmbient.isDark : !isDarkMode && !activeTheme.isDark;

  // iOS 26 Elongation & Transformation Values
  const fontStretchY = settings.fontStretchY ?? 1.0;
  const letterSpacingPx = settings.letterSpacing ?? 0;
  const fontWeightVal = settings.fontWeight ?? '700';
  const textEffect = settings.textEffect ?? 'none';
  const depthEffect = !!settings.depthEffect;
  const depthIntensity = settings.depthIntensity ?? 60;

  // Calculate text effect styles
  const getTextEffectStyles = (): React.CSSProperties => {
    const base: React.CSSProperties = {
      fontFamily: selectedFont.cssFamily,
      fontWeight: fontWeightVal as any,
      letterSpacing: `${letterSpacingPx}px`,
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
    };

    if (textEffect === 'liquid') {
      // iOS 26 Liquid Refraction & Gloss Effect
      return {
        ...base,
        background: `linear-gradient(180deg, ${resolvedTextColor} 0%, ${resolvedTextColor}dd 45%, ${resolvedAccentColor} 80%, ${resolvedTextColor} 100%)`,
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        filter: `url(#ios26-liquid-filter) drop-shadow(0 15px 30px rgba(0,0,0,0.5))`,
      };
    }

    if (textEffect === 'outline') {
      // Sleek hollow outline typography
      return {
        ...base,
        color: 'transparent',
        WebkitTextStroke: `2.5px ${resolvedTextColor}`,
        filter: `drop-shadow(0 8px 20px rgba(0,0,0,0.4))`,
      };
    }

    if (textEffect === 'glass') {
      // Frosted glass translucent text
      return {
        ...base,
        color: 'rgba(255, 255, 255, 0.82)',
        textShadow: `0 0 20px rgba(255,255,255,0.4), 0 10px 25px rgba(0,0,0,0.6)`,
      };
    }

    if (textEffect === 'glow') {
      // Vibrant glowing neon bloom
      return {
        ...base,
        color: resolvedTextColor,
        textShadow: `0 0 15px ${resolvedAccentColor}, 0 0 35px ${resolvedAccentColor}80, 0 0 65px ${resolvedAccentColor}40`,
      };
    }

    // Default clean solid text
    return {
      ...base,
      color: resolvedTextColor,
      textShadow: isAmbientActive
        ? `0 0 35px ${activeAmbient.glowColor}, 0 0 70px ${activeAmbient.glowColor}80`
        : settings.themeId === 'cyber-neon' || settings.themeId === 'amber-vintage'
        ? `0 0 40px ${resolvedAccentColor}40`
        : hasCustomMediaWallpaper
        ? '0 4px 20px rgba(0,0,0,0.7), 0 12px 35px rgba(0,0,0,0.5)'
        : 'none',
    };
  };

  return (
    <div
      id="clock-view-container"
      className="relative w-full h-screen min-h-screen flex flex-col justify-center items-center select-none overflow-hidden transition-colors duration-700 bg-black"
      style={{
        backgroundColor: hasCustomMediaWallpaper
          ? '#000000'
          : isAmbientActive
          ? undefined
          : (resolvedBg || (isLight ? '#f7f5f0' : '#000000')),
        background: !hasCustomMediaWallpaper && isAmbientActive ? resolvedBg : undefined,
        color: resolvedTextColor,
        filter: `brightness(${settings.brightness}%)`,
      }}
      onClick={handleUserActivity}
    >
      {/* SVG Filters for iOS 26 Liquid Typography & Optical Effects */}
      <svg className="absolute w-0 h-0 pointer-events-none opacity-0" aria-hidden="true">
        <defs>
          <filter id="ios26-liquid-filter" x="-20%" y="-20%" width="140%" height="140%">
            <feTurbulence type="fractalNoise" baseFrequency="0.015" numOctaves="3" result="noise" />
            <feDisplacementMap in="SourceGraphic" in2="noise" scale="5" xChannelSelector="R" yChannelSelector="G" result="displaced" />
            <feGaussianBlur in="displaced" stdDeviation="0.4" result="blurred" />
            <feMerge>
              <feMergeNode in="displaced" />
              <feMergeNode in="blurred" />
            </feMerge>
          </filter>
        </defs>
      </svg>

      {/* 1. MEDIA WALLPAPERS LAYER (Single Image / Slideshow / MP4 Live Video) */}
      {settings.wallpaperMode === 'video' && videoUrl && (
        <video
          ref={videoRef}
          src={videoUrl}
          autoPlay
          loop
          muted
          playsInline
          className="absolute inset-0 w-full h-full object-cover pointer-events-none z-0 transition-opacity duration-700"
          style={{
            filter: settings.wallpaperBlur ? `blur(${settings.wallpaperBlur}px)` : undefined,
            willChange: 'transform',
            transform: 'translateZ(0)',
          }}
        />
      )}

      {settings.wallpaperMode === 'slideshow' && slideshowUrls.length > 0 && (
        <div
          className="absolute inset-0 w-full h-full bg-cover bg-center pointer-events-none z-0 transition-all duration-1000 ease-in-out"
          style={{
            backgroundImage: `url(${slideshowUrls[currentSlideIndex] || slideshowUrls[0]})`,
            filter: settings.wallpaperBlur ? `blur(${settings.wallpaperBlur}px)` : undefined,
          }}
        />
      )}

      {settings.wallpaperMode === 'image' && singleWallpaperUrl && (
        <div
          className="absolute inset-0 w-full h-full bg-cover bg-center pointer-events-none z-0 transition-opacity duration-700"
          style={{
            backgroundImage: `url(${singleWallpaperUrl})`,
            filter: settings.wallpaperBlur ? `blur(${settings.wallpaperBlur}px)` : undefined,
          }}
        />
      )}

      {/* Procedural Ambient Background (When in Theme mode) */}
      {isAmbientActive && !hasCustomMediaWallpaper && (
        <AmbientBackground
          ambientTheme={settings.ambientTheme}
          particles={settings.ambientParticles !== false}
        />
      )}

      {/* 2. WALLPAPER DIMMER / READABILITY OVERLAY */}
      {hasCustomMediaWallpaper && (
        <div
          className="absolute inset-0 pointer-events-none z-[1] transition-opacity duration-500 bg-black"
          style={{
            opacity: (settings.wallpaperOpacity ?? 25) / 100,
          }}
        />
      )}

      {/* 3. OPTICAL DEPTH EFFECT AMBIENT VIGNETTE */}
      {depthEffect && (
        <div
          className="absolute inset-0 pointer-events-none z-[2] transition-opacity duration-700"
          style={{
            background: `radial-gradient(circle at 50% 50%, rgba(0,0,0,0.1) 0%, rgba(0,0,0,${(depthIntensity / 100) * 0.75}) 100%)`,
          }}
        />
      )}

      {/* Top Floating Control Bar */}
      <header
        id="clock-header-controls"
        className={`absolute top-0 left-0 right-0 w-full px-6 py-5 flex items-center justify-between z-40 transition-all duration-300 ${
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
            title="Open Pomodoro Timer"
          >
            <Timer className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Pomodoro</span>
          </button>

          {/* Quick Task Tracker Switch */}
          {onGoToTasks && (
            <button
              id="clock-to-tasks-btn"
              onClick={onGoToTasks}
              className={`apple-hover flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-medium backdrop-blur-md border cursor-pointer shadow-sm ${
                isLight && !hasCustomMediaWallpaper
                  ? 'border-neutral-300/80 bg-white/70 hover:bg-white text-emerald-600'
                  : 'border-white/10 bg-black/40 hover:bg-black/60 text-emerald-400'
              }`}
              title="Open Task Tracker"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Tasks</span>
            </button>
          )}

          {/* Quick Stats & Analytics Switch */}
          {onGoToStats && (
            <button
              id="clock-to-stats-btn"
              onClick={onGoToStats}
              className={`apple-hover flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-medium backdrop-blur-md border cursor-pointer shadow-sm ${
                isLight && !hasCustomMediaWallpaper
                  ? 'border-neutral-300/80 bg-white/70 hover:bg-white text-amber-600'
                  : 'border-white/10 bg-black/40 hover:bg-black/60 text-amber-400'
              }`}
              title="Open Weekly Progress & Analytics"
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Stats</span>
            </button>
          )}

          {/* Study & Work Parties Button */}
          {onOpenParties && (
            <button
              id="clock-parties-btn"
              onClick={onOpenParties}
              className={`apple-hover flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium backdrop-blur-md border cursor-pointer shadow-sm ${
                isLight && !hasCustomMediaWallpaper
                  ? 'border-amber-400/50 bg-amber-50/80 hover:bg-amber-100 text-amber-800'
                  : 'border-amber-400/40 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300'
              }`}
              title="Open Study & Work Parties Leaderboard"
            >
              <Users className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden sm:inline">Parties</span>
            </button>
          )}

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
        {/* OPTIONAL STANDBY DISPLAY WIDGETS ROW (Top bar when enabled) */}
        {settings.showStandbyWidgets && (
          <div
            id="standby-widgets-container"
            className="flex items-center justify-center gap-3 sm:gap-4 mb-4 sm:mb-6 z-30"
          >
            {/* 1. Date & Day Widget */}
            {settings.standbyWidgetsDate !== false && (
              <div
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-2xl border text-xs font-medium backdrop-blur-md shadow-sm ${
                  hasCustomMediaWallpaper || !isLight
                    ? 'bg-black/40 border-white/15 text-white'
                    : 'bg-white/80 border-neutral-300 text-neutral-800'
                }`}
              >
                <Calendar className="w-3.5 h-3.5 text-amber-400" />
                <span>{dayOfWeek.slice(0, 3)}, {monthName.slice(0, 3)} {dateNum}</span>
              </div>
            )}

            {/* 2. Battery Widget */}
            {settings.standbyWidgetsBattery !== false && batteryState && (
              <div
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-2xl border text-xs font-medium backdrop-blur-md shadow-sm font-mono ${
                  hasCustomMediaWallpaper || !isLight
                    ? 'bg-black/40 border-white/15 text-white'
                    : 'bg-white/80 border-neutral-300 text-neutral-800'
                }`}
              >
                {batteryState.charging ? (
                  <BatteryCharging className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
                ) : (
                  <Battery className="w-3.5 h-3.5 text-sky-400" />
                )}
                <span>{batteryState.level}%</span>
                {batteryState.charging && <span className="text-[10px] text-emerald-400">Power</span>}
              </div>
            )}

            {/* 3. Focus Mode Indicator Widget */}
            {settings.standbyWidgetsFocusTask !== false && (
              <div
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-2xl border text-xs font-medium backdrop-blur-md shadow-sm ${
                  hasCustomMediaWallpaper || !isLight
                    ? 'bg-black/40 border-white/15 text-neutral-200'
                    : 'bg-white/80 border-neutral-300 text-neutral-700'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                <span>Standby Ready</span>
              </div>
            )}
          </div>
        )}

        {/* Standard Day & Date Row (If Standby Widgets are disabled) */}
        {!settings.showStandbyWidgets && (settings.showDayOfWeek || settings.showDate) && (
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

        {/* Hero Clock Digits with iOS 26 Vertical Elongation & Layering */}
        <div
          id="clock-digits-wrapper"
          className="relative inline-flex items-center justify-center"
          style={{
            transform: fontStretchY !== 1.0 ? `scale(1, ${fontStretchY})` : undefined,
            transformOrigin: 'center center',
          }}
        >
          <div
            id="clock-primary-time"
            className={`apple-display-hover relative inline-flex items-center justify-center text-center tracking-tight leading-none select-none mx-auto ${getDigitSizeStyle()}`}
            style={{
              ...getTextEffectStyles(),
              filter: depthEffect
                ? `drop-shadow(0 ${20 * (depthIntensity / 100)}px ${30 * (depthIntensity / 100)}px rgba(0,0,0,0.9))`
                : getTextEffectStyles().filter,
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
          className="absolute inset-0 w-full h-full object-cover pointer-events-none z-20 transition-opacity duration-700"
          style={{
            filter: settings.wallpaperBlur ? `blur(${settings.wallpaperBlur}px)` : undefined,
          }}
        />
      )}
    </div>
  );
};
