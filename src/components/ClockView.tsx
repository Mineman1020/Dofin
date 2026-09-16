import React, { useState, useEffect, useRef } from 'react';
import {
  Maximize2,
  Minimize2,
  Settings,
  ArrowLeft,
  Timer,
  Volume2,
  VolumeX,
  Sparkles,
  Sun,
  Moon,
  Headphones,
  Check,
  Flame,
  CloudRain,
  Compass,
  Monitor,
  Eye,
  Users,
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
import { AmbientBackground } from './AmbientBackground';

interface ClockViewProps {
  settings: ClockSettings;
  onUpdateSettings?: (updated: Partial<ClockSettings>) => void;
  onOpenSettings: () => void;
  onGoToWelcome: () => void;
  onGoToPomodoro: () => void;
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
  onOpenParties,
  userName,
  isDarkMode,
  onToggleDarkMode,
}) => {
  const [time, setTime] = useState<Date>(new Date());
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [controlsVisible, setControlsVisible] = useState<boolean>(true);
  const [driftOffset, setDriftOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [ambientMenuOpen, setAmbientMenuOpen] = useState<boolean>(false);
  const [soundMenuOpen, setSoundMenuOpen] = useState<boolean>(false);
  const idleTimerRef = useRef<number | null>(null);
  const lastHourChimedRef = useRef<number | null>(null);

  // Active ambient theme definition
  const activeAmbient: AmbientThemePreset =
    AMBIENT_THEMES.find((a) => a.id === (settings.ambientTheme || 'none')) || AMBIENT_THEMES[0];
  const isAmbientActive = activeAmbient && activeAmbient.id !== 'none';

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
    // Only auto-hide if submenus are closed
    if (!ambientMenuOpen && !soundMenuOpen) {
      idleTimerRef.current = window.setTimeout(() => {
        setControlsVisible(false);
      }, 4500);
    }
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
  }, [ambientMenuOpen, soundMenuOpen]);

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

  return (
    <div
      id="clock-view-container"
      className="relative w-full h-screen min-h-screen flex flex-col justify-center items-center select-none overflow-hidden transition-colors duration-700"
      style={{
        backgroundColor: isAmbientActive ? undefined : (resolvedBg || (isLight ? '#f7f5f0' : '#000000')),
        background: isAmbientActive ? resolvedBg : undefined,
        color: resolvedTextColor,
        filter: `brightness(${settings.brightness}%)`,
      }}
      onClick={handleUserActivity}
    >
      {/* Immersive Animated Ambient Theme Background Canvas */}
      {isAmbientActive && (
        <AmbientBackground
          ambientTheme={settings.ambientTheme}
          particles={settings.ambientParticles !== false}
        />
      )}

      {/* Top Ambient Floating Control Bar (Floats above so main digits stay geometrically centered) */}
      <header
        id="clock-header-controls"
        className={`absolute top-0 left-0 right-0 w-full px-6 py-5 flex items-center justify-between z-30 transition-all duration-300 ${
          controlsVisible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4 pointer-events-none'
        }`}
      >
        <div className="flex items-center gap-3">
          <button
            id="clock-back-welcome-btn"
            onClick={onGoToWelcome}
            className={`apple-hover flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-medium backdrop-blur-md border cursor-pointer shadow-sm ${
              isLight
                ? 'border-neutral-300/80 bg-white/70 hover:bg-white text-neutral-800'
                : 'border-white/10 bg-white/5 hover:bg-white/10 text-white'
            }`}
            title="Return to Welcome Screen"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Welcome Screen</span>
          </button>

          <span className="text-xs tracking-wider opacity-60 hidden md:inline-flex items-center gap-1.5 font-mono">
            <span>Desk of</span>
            <span className="font-semibold opacity-90">{userName}</span>
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Quick Ambient Themes Dropdown Trigger */}
          <div className="relative">
            <button
              id="clock-ambient-theme-btn"
              onClick={(e) => {
                e.stopPropagation();
                setAmbientMenuOpen((prev) => !prev);
                setSoundMenuOpen(false);
              }}
              className={`apple-hover flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium backdrop-blur-md border cursor-pointer shadow-sm ${
                isAmbientActive
                  ? 'border-amber-400/60 bg-amber-400/15 text-amber-300 ring-1 ring-amber-400/30'
                  : isLight
                  ? 'border-neutral-300/80 bg-white/70 hover:bg-white text-neutral-800'
                  : 'border-white/10 bg-white/5 hover:bg-white/10 text-white'
              }`}
              title="Select Ambient Theme & Desk Atmosphere"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
              <span className="hidden sm:inline">
                {isAmbientActive ? activeAmbient.name : 'Ambient Mood'}
              </span>
            </button>

            {/* Floating Ambient Theme Popover */}
            {ambientMenuOpen && (
              <div
                id="ambient-theme-popover"
                onClick={(e) => e.stopPropagation()}
                className="absolute right-0 mt-2 w-80 sm:w-96 max-h-[82vh] overflow-y-auto rounded-2xl p-3 sm:p-4 bg-neutral-900/98 backdrop-blur-2xl border border-neutral-700/80 shadow-2xl z-50 text-neutral-200 animate-fadeIn"
              >
                <div className="flex items-center justify-between pb-2.5 mb-3 border-b border-neutral-800">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-400" />
                    <span className="text-xs font-semibold text-neutral-100 uppercase tracking-wider">
                      Atmospheres & Ambient Themes
                    </span>
                  </div>
                  <button
                    onClick={() => {
                      onUpdateSettings?.({ ambientTheme: 'none', ambientSoundEnabled: false });
                      setAmbientMenuOpen(false);
                    }}
                    className={`text-[11px] px-2.5 py-1 rounded-lg border transition-colors cursor-pointer ${
                      settings.ambientTheme === 'none' || !settings.ambientTheme
                        ? 'border-neutral-500 bg-neutral-800 text-white font-medium'
                        : 'border-neutral-800 hover:border-neutral-700 text-neutral-400 hover:text-neutral-200'
                    }`}
                  >
                    Minimal Clean (Off)
                  </button>
                </div>

                {/* Ambient Themes List */}
                <div className="space-y-1.5 max-h-[65vh] overflow-y-auto pr-1">
                  {AMBIENT_THEMES.filter((t) => t.id !== 'none').map((theme) => {
                    const isSelected = (settings.ambientTheme || 'none') === theme.id;
                    return (
                      <button
                        key={theme.id}
                        id={`ambient-quick-btn-${theme.id}`}
                        onClick={() => {
                          onUpdateSettings?.({
                            ambientTheme: theme.id,
                            ...(theme.soundType && theme.soundType !== 'none'
                              ? { ambientSoundEnabled: settings.ambientSoundEnabled }
                              : {}),
                          });
                          setAmbientMenuOpen(false);
                        }}
                        className={`w-full flex items-center justify-between p-2.5 rounded-xl text-left transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-amber-400/15 text-white border border-amber-400/40 shadow-sm'
                            : 'hover:bg-neutral-800/70 text-neutral-300 border border-transparent'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div
                            className="w-7 h-7 rounded-lg border border-neutral-700 flex-shrink-0 relative overflow-hidden"
                            style={{ background: theme.bgGradient }}
                          >
                            <span
                              className="absolute inset-0 m-auto w-2 h-2 rounded-full"
                              style={{ backgroundColor: theme.accentColor }}
                            />
                          </div>

                          <div className="truncate">
                            <div className="text-xs font-semibold truncate flex items-center gap-1.5">
                              <span>{theme.name}</span>
                              {theme.soundType && theme.soundType !== 'none' && (
                                <Headphones className="w-3 h-3 text-sky-400 opacity-85 shrink-0" />
                              )}
                            </div>
                            <div className="text-[11px] text-neutral-400 truncate mt-0.5">
                              {theme.tagline}
                            </div>
                          </div>
                        </div>

                        {isSelected && (
                          <Check className="w-4 h-4 text-amber-400 flex-shrink-0 ml-2" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Quick Ambient Audio Toggle / Volume Popover */}
          {isAmbientActive && activeAmbient.soundType && activeAmbient.soundType !== 'none' && (
            <div className="relative">
              <button
                id="clock-ambient-sound-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  setSoundMenuOpen((prev) => !prev);
                  setAmbientMenuOpen(false);
                }}
                className={`apple-hover flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium backdrop-blur-md border cursor-pointer shadow-sm ${
                  settings.ambientSoundEnabled
                    ? 'border-sky-400/60 bg-sky-500/15 text-sky-300 ring-1 ring-sky-400/30'
                    : isLight
                    ? 'border-neutral-300/80 bg-white/70 hover:bg-white text-neutral-800'
                    : 'border-white/10 bg-white/5 hover:bg-white/10 text-white'
                }`}
                title="Ambient Soundscape Controls"
              >
                {settings.ambientSoundEnabled ? (
                  <Volume2 className="w-3.5 h-3.5 text-sky-400 animate-pulse" />
                ) : (
                  <VolumeX className="w-3.5 h-3.5 text-neutral-400" />
                )}
                <span className="hidden sm:inline">
                  {settings.ambientSoundEnabled ? activeAmbient.soundLabel : 'Soundscape Muted'}
                </span>
              </button>

              {/* Sound Settings Popover */}
              {soundMenuOpen && (
                <div
                  id="ambient-sound-popover"
                  onClick={(e) => e.stopPropagation()}
                  className="absolute right-0 mt-2 w-64 rounded-2xl p-3 bg-neutral-900/95 backdrop-blur-xl border border-neutral-700/80 shadow-2xl z-50 text-neutral-200 animate-fadeIn space-y-3"
                >
                  <div className="flex items-center justify-between pb-1 border-b border-neutral-800">
                    <span className="text-xs font-semibold text-neutral-200">
                      Ambient Soundscape
                    </span>
                    <button
                      id="ambient-sound-mute-toggle"
                      onClick={() =>
                        onUpdateSettings?.({
                          ambientSoundEnabled: !settings.ambientSoundEnabled,
                        })
                      }
                      className={`text-[10px] px-2 py-0.5 rounded font-mono uppercase cursor-pointer ${
                        settings.ambientSoundEnabled
                          ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40'
                          : 'bg-neutral-800 text-neutral-400'
                      }`}
                    >
                      {settings.ambientSoundEnabled ? 'Active' : 'Off'}
                    </button>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-[11px] text-neutral-400">
                      <span>{activeAmbient.soundLabel}</span>
                      <span className="font-mono">{settings.ambientSoundVolume ?? 35}%</span>
                    </div>
                    <input
                      type="range"
                      min="5"
                      max="100"
                      value={settings.ambientSoundVolume ?? 35}
                      onChange={(e) =>
                        onUpdateSettings?.({
                          ambientSoundVolume: Number(e.target.value),
                          ambientSoundEnabled: true,
                        })
                      }
                      className="w-full accent-sky-400 cursor-pointer h-1.5 bg-neutral-800 rounded-lg"
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Dark Mode Toggle Button */}
          <button
            id="clock-dark-mode-btn"
            onClick={onToggleDarkMode}
            className={`apple-hover flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium backdrop-blur-md border cursor-pointer shadow-sm ${
              isLight
                ? 'border-neutral-300/80 bg-white/70 hover:bg-white text-neutral-800'
                : 'border-white/10 bg-white/5 hover:bg-white/10 text-white'
            }`}
            title={`Switch to ${isDarkMode ? 'Light' : 'Dark'} Mode`}
          >
            {isDarkMode ? (
              <>
                <Sun className="w-3.5 h-3.5 text-amber-400" />
                <span className="hidden sm:inline">Light</span>
              </>
            ) : (
              <>
                <Moon className="w-3.5 h-3.5 text-sky-500" />
                <span className="hidden sm:inline">Dark</span>
              </>
            )}
          </button>

          {/* Quick Pomodoro Switch */}
          <button
            id="clock-to-pomodoro-btn"
            onClick={onGoToPomodoro}
            className={`apple-hover flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-medium backdrop-blur-md border cursor-pointer shadow-sm ${
              isLight
                ? 'border-neutral-300/80 bg-white/70 hover:bg-white'
                : 'border-white/10 bg-white/5 hover:bg-white/10'
            }`}
            style={{ color: resolvedAccentColor }}
            title="Open Pomodoro Timer"
          >
            <Timer className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Pomodoro</span>
          </button>

          {/* Study & Work Parties Button */}
          {onOpenParties && (
            <button
              id="clock-parties-btn"
              onClick={onOpenParties}
              className={`apple-hover flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium backdrop-blur-md border cursor-pointer shadow-sm ${
                isLight
                  ? 'border-amber-400/50 bg-amber-50/80 hover:bg-amber-100 text-amber-800'
                  : 'border-amber-400/40 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300'
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
              isLight
                ? 'border-neutral-300/80 bg-white/70 hover:bg-white text-neutral-800'
                : 'border-white/10 bg-white/5 hover:bg-white/10 text-white'
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
              isLight
                ? 'border-neutral-300/80 bg-white/70 hover:bg-white text-neutral-800'
                : 'border-white/10 bg-white/5 hover:bg-white/10 text-white'
            }`}
            title="Customize Clock & Settings"
          >
            <Settings className="w-4 h-4" />
            <span className="hidden sm:inline">Customize</span>
          </button>
        </div>
      </header>

      {/* Main Center Clock Display - Strictly Centered Vertically & Horizontally */}
      <main
        id="clock-digits-display"
        className="w-full flex-1 flex flex-col items-center justify-center p-4 sm:p-8 text-center mx-auto z-10 transition-transform duration-1000 ease-out"
        style={{
          transform: settings.digitSize === 'fill'
            ? 'none'
            : `translate3d(${driftOffset.x}px, ${driftOffset.y}px, 0)`,
        }}
      >
        {/* Day & Date Row - Strictly centered */}
        {(settings.showDayOfWeek || settings.showDate) && (
          <div
            id="clock-date-row"
            className="w-full flex items-center justify-center text-center gap-2.5 sm:gap-3 mb-3 sm:mb-6 font-medium tracking-widest text-sm sm:text-base md:text-lg uppercase opacity-75 font-sans mx-auto"
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

        {/* Hero Clock Digits - Horizontally & Vertically Centered */}
        <div
          id="clock-primary-time"
          className={`apple-display-hover relative inline-flex items-center justify-center text-center tracking-tight leading-none select-none mx-auto ${getDigitSizeStyle()}`}
          style={{
            fontFamily: selectedFont.cssFamily,
            textShadow: isAmbientActive
              ? `0 0 35px ${activeAmbient.glowColor}, 0 0 70px ${activeAmbient.glowColor}80`
              : settings.themeId === 'cyber-neon' || settings.themeId === 'amber-vintage'
              ? `0 0 40px ${resolvedAccentColor}40`
              : 'none',
          }}
        >
          {/* Hours */}
          <span id="clock-hours">{hoursStr}</span>

          {/* Pulsing Colon Separator */}
          <span
            id="clock-colon"
            className="mx-1 sm:mx-2 opacity-70 animate-pulse inline-block"
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
                className="mx-1 sm:mx-2 opacity-50 text-[0.6em]"
              >
                :
              </span>
              <span
                id="clock-seconds"
                className="opacity-80 text-[0.6em] font-light"
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
              className="absolute left-full ml-3 sm:ml-5 text-[0.22em] font-semibold tracking-wider uppercase px-2.5 py-1 rounded-md border border-current opacity-80 self-center font-sans whitespace-nowrap"
              style={{ color: resolvedAccentColor }}
            >
              {ampm}
            </span>
          )}
        </div>

        {/* Dedicated Centered AM/PM Tag when in Fill View to preserve perfect geometric center alignment */}
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
            className={`mt-6 sm:mt-10 max-w-xl mx-auto px-6 py-2.5 rounded-full border text-xs sm:text-sm tracking-wide opacity-80 italic font-sans text-center ${
              isLight
                ? 'border-neutral-300/80 bg-white/60 text-neutral-800 shadow-sm'
                : 'border-white/5 bg-white/[0.03] text-neutral-200 backdrop-blur-sm'
            }`}
          >
            &ldquo;{settings.quoteText}&rdquo;
          </div>
        )}
      </main>
    </div>
  );
};
