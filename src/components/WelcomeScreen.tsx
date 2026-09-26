import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import {
  Clock,
  Timer,
  Settings,
  Sun,
  Sunrise,
  Moon,
  Sunset,
  ArrowRight,
  User,
  Users,
  Trophy,
  Plus,
  LogIn,
  CheckCircle2,
  Check,
  BarChart3,
  Keyboard,
  Sparkles,
} from 'lucide-react';
import { ClockSettings, PomodoroSettings, ViewMode } from '../types';
import { THEME_PRESETS, FONT_OPTIONS } from '../utils/constants';
import { PomodoroTimerController } from '../utils/usePomodoroTimer';

interface WelcomeScreenProps {
  userName: string;
  onSelectMode: (mode: ViewMode) => void;
  onOpenSettings: () => void;
  onOpenNameModal: () => void;
  onOpenParties?: (tab?: 'leaderboard' | 'my-parties' | 'create' | 'join') => void;
  onOpenShortcuts?: () => void;
  clockSettings: ClockSettings;
  pomodoroSettings: PomodoroSettings;
  pomodoroTimer?: PomodoroTimerController;
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
}

interface InteractiveModeCardProps {
  id: string;
  onClick: () => void;
  accentGlow: string;
  borderHoverDark: string;
  borderHoverLight: string;
  glowClass: string;
  isDarkMode: boolean;
  itemVariants: any;
  children: React.ReactNode;
}

const InteractiveModeCard: React.FC<InteractiveModeCardProps> = ({
  id,
  onClick,
  accentGlow,
  borderHoverDark,
  borderHoverLight,
  glowClass,
  isDarkMode,
  itemVariants,
  children,
}) => {
  const [mousePos, setMousePos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState<boolean>(false);
  const cardRef = React.useRef<HTMLDivElement>(null);

  const updateCoordinates = (clientX: number, clientY: number) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    setMousePos({
      x: clientX - rect.left,
      y: clientY - rect.top,
    });
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    updateCoordinates(e.clientX, e.clientY);
  };

  const handleMouseEnter = (e: React.MouseEvent<HTMLDivElement>) => {
    updateCoordinates(e.clientX, e.clientY);
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
  };

  return (
    <motion.div
      ref={cardRef}
      variants={itemVariants}
      whileHover={{
        y: -8,
        scale: 1.018,
      }}
      whileTap={{
        y: -1,
        scale: 0.985,
      }}
      transition={{
        type: 'spring',
        stiffness: 350,
        damping: 26,
        mass: 0.7,
      }}
      id={id}
      onClick={onClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onMouseMove={handleMouseMove}
      className={`group relative rounded-3xl p-5 sm:p-6 flex flex-col justify-between cursor-pointer border overflow-hidden select-none ${glowClass} ${
        isDarkMode
          ? `bg-neutral-900/80 hover:bg-neutral-900/95 border-white/10 ${borderHoverDark} shadow-[0_8px_30px_rgba(0,0,0,0.4)] hover:shadow-[0_24px_55px_-12px_rgba(0,0,0,0.85),0_0_28px_${accentGlow}]`
          : `bg-white/90 hover:bg-white border-neutral-200/90 ${borderHoverLight} shadow-[0_6px_20px_rgba(0,0,0,0.05)] hover:shadow-[0_20px_45px_-12px_rgba(0,0,0,0.12),0_0_28px_${accentGlow}]`
      } backdrop-blur-2xl transition-[border-color,background-color,box-shadow] duration-300 ease-out will-change-transform`}
    >
      {/* iOS 26 Liquid Glass Specular Reflection Sheen */}
      <div
        className="absolute inset-0 pointer-events-none rounded-3xl z-0 transition-opacity duration-300 ease-out"
        style={{
          opacity: isHovered ? 1 : 0.45,
          background: isDarkMode
            ? 'linear-gradient(135deg, rgba(255, 255, 255, 0.08) 0%, rgba(255, 255, 255, 0.01) 45%, transparent 100%)'
            : 'linear-gradient(135deg, rgba(255, 255, 255, 0.65) 0%, rgba(255, 255, 255, 0.1) 50%, transparent 100%)',
        }}
      />

      {/* iOS 26 Dynamic Cursor Refraction Spotlight */}
      <div
        className="absolute inset-0 pointer-events-none transition-opacity duration-300 ease-out z-0"
        style={{
          opacity: isHovered ? 1 : 0,
          background: `radial-gradient(400px circle at ${mousePos.x}px ${mousePos.y}px, ${accentGlow}, transparent 75%)`,
        }}
      />

      {/* iOS 26 High-Refraction Rim Highlight Along Top Border */}
      <div
        className="absolute top-0 inset-x-5 h-[1px] pointer-events-none z-10 transition-opacity duration-300 ease-out"
        style={{
          opacity: isHovered ? 1 : 0.35,
          background: `linear-gradient(90deg, transparent, ${isDarkMode ? 'rgba(255, 255, 255, 0.5)' : 'rgba(255, 255, 255, 0.95)'}, transparent)`,
        }}
      />

      <div className="relative z-10 flex flex-col justify-between h-full">
        {children}
      </div>
    </motion.div>
  );
};

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({
  userName,
  onSelectMode,
  onOpenSettings,
  onOpenNameModal,
  onOpenParties,
  onOpenShortcuts,
  clockSettings,
  pomodoroSettings,
  pomodoroTimer,
  isDarkMode,
  onToggleDarkMode,
}) => {
  const [currentTime, setCurrentTime] = useState<Date>(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Time of day greeting with explicit hour thresholds:
  // 05:00 - 11:59 -> Good morning
  // 12:00 - 16:59 -> Good afternoon
  // 17:00 - 21:59 -> Good evening
  // 22:00 - 04:59 -> Good night
  const hours = currentTime.getHours();
  let greeting: string;
  let GreetingIcon = Sun;
  let greetingColor = 'text-amber-500';

  if (hours >= 5 && hours < 12) {
    greeting = 'Good morning';
    GreetingIcon = hours < 8 ? Sunrise : Sun;
    greetingColor = 'text-amber-500';
  } else if (hours >= 12 && hours < 17) {
    greeting = 'Good afternoon';
    GreetingIcon = Sun;
    greetingColor = 'text-amber-500';
  } else if (hours >= 17 && hours < 22) {
    greeting = 'Good evening';
    GreetingIcon = Sunset;
    greetingColor = 'text-rose-400';
  } else {
    greeting = 'Good night';
    GreetingIcon = Moon;
    greetingColor = 'text-sky-400';
  }

  // Format live mini clock for preview
  const rawH = currentTime.getHours();
  const displayH = clockSettings.timeFormat === '12h' ? rawH % 12 || 12 : rawH;
  const displayM = String(currentTime.getMinutes()).padStart(2, '0');
  const displayS = String(currentTime.getSeconds()).padStart(2, '0');
  const ampm = clockSettings.timeFormat === '12h' ? (rawH >= 12 ? 'PM' : 'AM') : '';

  const selectedFont =
    FONT_OPTIONS.find((f) => f.id === clockSettings.fontFamily) || FONT_OPTIONS[0];

  const dateOptions: Intl.DateTimeFormatOptions = {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  };
  const formattedDate = currentTime.toLocaleDateString('en-US', dateOptions);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08,
        delayChildren: 0.05,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 12 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.45, ease: [0.16, 1, 0.3, 1] },
    },
  };

  const [isFullscreen, setIsFullscreen] = useState<boolean>(() => {
    return Boolean(typeof document !== 'undefined' && document.fullscreenElement);
  });

  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    document.addEventListener('webkitfullscreenchange', handleFsChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFsChange);
      document.removeEventListener('webkitfullscreenchange', handleFsChange);
    };
  }, []);

  const canScroll = !isFullscreen && clockSettings.enableScrolling !== false;

  return (
    <div
      id="welcome-screen-container"
      className={`relative w-full flex flex-col justify-between overflow-x-hidden transition-colors duration-500 select-none ${
        canScroll
          ? 'min-h-screen overflow-y-auto pb-16'
          : 'h-screen overflow-hidden pb-0'
      } ${
        isDarkMode ? 'bg-[#07090e] text-neutral-100' : 'bg-[#f7f5f0] text-neutral-900'
      }`}
    >
      {/* Ambient background glow - subtle atmospheric illumination */}
      <div
        className={`absolute top-0 left-1/4 w-[650px] h-[350px] rounded-full blur-[140px] pointer-events-none transition-opacity duration-700 ${
          isDarkMode ? 'bg-amber-500/10' : 'bg-amber-500/6'
        }`}
      />
      <div
        className={`absolute bottom-0 right-1/4 w-[650px] h-[350px] rounded-full blur-[150px] pointer-events-none transition-opacity duration-700 ${
          isDarkMode ? 'bg-sky-500/10' : 'bg-sky-500/6'
        }`}
      />

      {/* Top Navbar */}
      <header
        id="welcome-navbar"
        className={`w-full px-4 sm:px-8 lg:px-12 py-3 flex items-center justify-between z-20 border-b transition-colors ${
          isDarkMode
            ? 'border-white/5 bg-neutral-950/60'
            : 'border-neutral-200/70 bg-white/70 shadow-[0_1px_3px_rgba(0,0,0,0.02)]'
        } backdrop-blur-xl`}
      >
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-amber-400 via-amber-500 to-amber-600 text-neutral-950 flex items-center justify-center font-bold shadow-md shadow-amber-500/20">
            <Clock className="w-4.5 h-4.5" />
          </div>
          <div>
            <h1 className="text-sm sm:text-base font-bold tracking-tight">Desk Station</h1>
            <p className="text-[11px] text-neutral-500 dark:text-neutral-400">Ambient Time & Focus</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* User profile button */}
          <button
            id="welcome-user-profile-btn"
            onClick={onOpenNameModal}
            className={`apple-hover flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs cursor-pointer shadow-sm ${
              isDarkMode
                ? 'border-white/10 bg-white/5 hover:bg-white/10 text-neutral-200 hover:text-white'
                : 'border-neutral-200/90 bg-white hover:bg-neutral-50 text-neutral-800'
            }`}
            title="Click to change your name"
          >
            <User className="w-3.5 h-3.5 text-amber-500" />
            <span className="font-medium truncate max-w-[130px]">{userName}</span>
          </button>

          {/* Dark / Light Mode Toggle */}
          <button
            id="welcome-dark-mode-toggle"
            onClick={onToggleDarkMode}
            className={`apple-icon-hover p-2 rounded-xl border text-xs font-medium cursor-pointer shadow-sm ${
              isDarkMode
                ? 'border-white/10 bg-white/5 hover:bg-white/10 text-amber-300'
                : 'border-neutral-200/90 bg-white hover:bg-neutral-50 text-neutral-700'
            }`}
            title={`Switch to ${isDarkMode ? 'Light' : 'Dark'} Mode (D)`}
          >
            {isDarkMode ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
          </button>

          {/* Shortcuts button */}
          {onOpenShortcuts && (
            <button
              id="welcome-shortcuts-btn"
              onClick={onOpenShortcuts}
              className={`apple-icon-hover p-2 rounded-xl border text-xs cursor-pointer shadow-sm hidden sm:flex ${
                isDarkMode
                  ? 'border-white/10 bg-white/5 hover:bg-white/10 text-neutral-300 hover:text-white'
                  : 'border-neutral-200/90 bg-white hover:bg-neutral-50 text-neutral-700 hover:text-black'
              }`}
              title="Keyboard Shortcuts (?)"
            >
              <Keyboard className="w-3.5 h-3.5" />
            </button>
          )}

          {/* Settings button */}
          <button
            id="welcome-settings-btn"
            onClick={onOpenSettings}
            className={`apple-hover flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-medium cursor-pointer shadow-sm ${
              isDarkMode
                ? 'border-amber-500/30 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300'
                : 'border-amber-200 bg-amber-50 hover:bg-amber-100 text-amber-800'
            }`}
            title="Open Display Settings (S)"
          >
            <Settings className="w-3.5 h-3.5" />
            <span className="hidden sm:inline font-sans">Settings</span>
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="w-full max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8 flex-1 flex flex-col justify-center z-10">
        {/* Editorial Greeting Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="text-center space-y-2 mb-6 sm:mb-8"
        >
          {/* Clean Unboxed Editorial Metadata */}
          <div className="flex items-center justify-center gap-2 text-xs font-mono text-neutral-500 dark:text-neutral-400">
            <span>{formattedDate}</span>
            <span aria-hidden="true" className="opacity-40">·</span>
            <span className="font-semibold text-neutral-700 dark:text-neutral-300">
              {String(displayH).padStart(2, '0')}:{displayM} {ampm}
            </span>
          </div>

          <div className="flex items-center justify-center gap-2.5 sm:gap-3.5">
            <GreetingIcon className={`w-8 h-8 sm:w-10 sm:h-10 ${greetingColor}`} />
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight">
              {greeting},{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-500 via-amber-600 to-amber-500 dark:from-amber-300 dark:via-amber-400 dark:to-amber-200">
                {userName}
              </span>
            </h2>
          </div>

          <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 max-w-md mx-auto font-light leading-relaxed">
            Select your workspace mode below to begin.
          </p>
        </motion.div>

        {/* 2x2 Grid of Main Modes with Dynamic Cursor-Tracking Craft */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5 w-full max-w-5xl mx-auto"
        >
          {/* ================= CARD 01: DESK CLOCK ================= */}
          <InteractiveModeCard
            id="welcome-clock-card"
            onClick={() => onSelectMode('clock')}
            accentGlow="rgba(245, 158, 11, 0.22)"
            borderHoverDark="hover:border-amber-500/70"
            borderHoverLight="hover:border-amber-500"
            glowClass="hover-glow-amber"
            isDarkMode={isDarkMode}
            itemVariants={itemVariants}
          >
            <div className="absolute top-0 right-0 w-36 h-36 bg-amber-500/10 rounded-full blur-2xl group-hover:bg-amber-500/25 transition-all pointer-events-none" />

            <div>
              {/* Header: Icon, Title, Editorial Numeral */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-500 dark:text-amber-400 flex items-center justify-center transition-all duration-300 ease-out group-hover:scale-115 group-hover:-rotate-3 group-hover:shadow-[0_0_20px_rgba(245,158,11,0.35)] shrink-0">
                    <Clock className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-lg sm:text-xl font-bold group-hover:text-amber-500 dark:group-hover:text-amber-300 transition-colors duration-300 ease-out leading-tight">
                      Desk Clock
                    </h3>
                    <span className="text-xs text-neutral-500 dark:text-neutral-400 block transition-colors duration-300 ease-out group-hover:text-neutral-600 dark:group-hover:text-neutral-300">
                      Ambient time & curated typography
                    </span>
                  </div>
                </div>
                {/* Clean Editorial Index */}
                <span className="text-xs font-mono font-semibold text-neutral-400 dark:text-neutral-500 group-hover:text-amber-500 dark:group-hover:text-amber-400 transition-colors duration-300 ease-out">
                  01
                </span>
              </div>

              {/* Dynamic Live Digits Preview */}
              <div
                className={`py-3 px-4 rounded-2xl border mb-4 flex items-baseline justify-center gap-1.5 transition-all duration-300 ease-out group-hover:scale-[1.018] group-hover:border-amber-500/40 group-hover:shadow-sm ${
                  isDarkMode
                    ? 'border-white/5 bg-[#0e1118]'
                    : 'border-neutral-200/80 bg-neutral-50/90'
                }`}
                style={{ fontFamily: selectedFont.cssFamily }}
              >
                <span className="text-2xl sm:text-3xl font-black tracking-tight leading-none group-hover:scale-105 transition-transform duration-300 ease-out inline-block">
                  {String(displayH).padStart(2, '0')}:{displayM}
                </span>
                {clockSettings.showSeconds && (
                  <span className="text-sm text-amber-500 dark:text-amber-400 font-bold leading-none">
                    :{displayS}
                  </span>
                )}
                {clockSettings.showAmPm && (
                  <span className="text-xs text-neutral-400 ml-1.5 font-semibold leading-none">
                    {ampm}
                  </span>
                )}
              </div>
            </div>

            {/* Card Footer Action */}
            <div className="pt-3 flex items-center justify-between border-t border-neutral-100 dark:border-white/5">
              <span className="text-xs text-neutral-500 font-mono truncate max-w-[140px]">
                {selectedFont.name}
              </span>
              <div className="flex items-center gap-1.5 text-xs sm:text-sm font-bold text-amber-600 dark:text-amber-400 group-hover:translate-x-2 transition-transform duration-300 ease-out">
                <span>Launch Clock</span>
                <ArrowRight className="w-4 h-4 group-hover:scale-110 transition-transform duration-300 ease-out" />
              </div>
            </div>
          </InteractiveModeCard>

          {/* ================= CARD 02: POMODORO FOCUS ================= */}
          <InteractiveModeCard
            id="welcome-pomodoro-card"
            onClick={() => onSelectMode('pomodoro')}
            accentGlow="rgba(14, 165, 233, 0.22)"
            borderHoverDark="hover:border-sky-500/70"
            borderHoverLight="hover:border-sky-500"
            glowClass="hover-glow-sky"
            isDarkMode={isDarkMode}
            itemVariants={itemVariants}
          >
            <div className="absolute top-0 right-0 w-36 h-36 bg-sky-500/10 rounded-full blur-2xl group-hover:bg-sky-500/25 transition-all duration-300 ease-out pointer-events-none" />

            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-sky-500/15 border border-sky-500/30 text-sky-500 dark:text-sky-400 flex items-center justify-center transition-all duration-300 ease-out group-hover:scale-115 group-hover:-rotate-3 group-hover:shadow-[0_0_20px_rgba(14,165,233,0.35)] shrink-0">
                    <Timer className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-lg sm:text-xl font-bold group-hover:text-sky-500 dark:group-hover:text-sky-300 transition-colors duration-300 ease-out leading-tight">
                      Pomodoro Focus
                    </h3>
                    <span className="text-xs text-neutral-500 dark:text-neutral-400 block transition-colors duration-300 ease-out group-hover:text-neutral-600 dark:group-hover:text-neutral-300">
                      Interval cycles & acoustic alert chimes
                    </span>
                  </div>
                </div>
                <span className="text-xs font-mono font-semibold text-neutral-400 dark:text-neutral-500 group-hover:text-sky-500 dark:group-hover:text-sky-400 transition-colors duration-300 ease-out">
                  02
                </span>
              </div>

              {/* Active Continuous Pomodoro Session Banner or Interval Rhythm Preview */}
              {pomodoroTimer && (pomodoroTimer.isRunning || pomodoroTimer.timeLeft < pomodoroTimer.totalTime) ? (
                <div
                  className={`py-3 px-4 rounded-2xl border mb-4 flex items-center justify-between text-xs font-mono transition-all duration-300 ease-out group-hover:scale-[1.018] group-hover:border-sky-500/40 group-hover:shadow-sm ${
                    isDarkMode
                      ? 'border-sky-500/30 bg-sky-950/20'
                      : 'border-sky-200 bg-sky-50/90'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${pomodoroTimer.isRunning ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
                    <span className={`font-semibold ${pomodoroTimer.isRunning ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}`}>
                      {pomodoroTimer.isRunning ? (pomodoroTimer.phase === 'work' ? 'Focusing' : 'Break') : 'Paused'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-sm text-sky-600 dark:text-sky-400">
                      {String(Math.floor(pomodoroTimer.timeLeft / 60)).padStart(2, '0')}:
                      {String(pomodoroTimer.timeLeft % 60).padStart(2, '0')}
                    </span>
                    <span className="text-[10px] text-neutral-400 font-mono">
                      R{pomodoroTimer.currentRound}/{pomodoroSettings.longBreakInterval}
                    </span>
                  </div>
                </div>
              ) : (
                /* Interval Rhythm Preview */
                <div
                  className={`py-3 px-4 rounded-2xl border mb-4 flex items-center justify-around text-xs font-mono transition-all duration-300 ease-out group-hover:scale-[1.018] group-hover:border-sky-500/40 group-hover:shadow-sm ${
                    isDarkMode
                      ? 'border-white/5 bg-[#0e1118]'
                      : 'border-neutral-200/80 bg-neutral-50/90'
                  }`}
                >
                  <div className="flex items-center gap-1.5">
                    <span className="text-neutral-400">Focus</span>
                    <span className="font-bold text-amber-500 dark:text-amber-400 text-sm">
                      {pomodoroSettings.workMinutes}m
                    </span>
                  </div>
                  <div className="h-4 w-px bg-neutral-300 dark:bg-neutral-800" />
                  <div className="flex items-center gap-1.5">
                    <span className="text-neutral-400">Short</span>
                    <span className="font-bold text-sky-500 dark:text-sky-400 text-sm">
                      {pomodoroSettings.shortBreakMinutes}m
                    </span>
                  </div>
                  <div className="h-4 w-px bg-neutral-300 dark:bg-neutral-800" />
                  <div className="flex items-center gap-1.5">
                    <span className="text-neutral-400">Long</span>
                    <span className="font-bold text-emerald-500 dark:text-emerald-400 text-sm">
                      {pomodoroSettings.longBreakMinutes}m
                    </span>
                  </div>
                </div>
              )}
            </div>

            <div className="pt-3 flex items-center justify-between border-t border-neutral-100 dark:border-white/5">
              <span className="text-xs text-neutral-500 font-mono">
                {pomodoroTimer && pomodoroTimer.isRunning ? 'Timer Active' : 'Auto-Break Engine'}
              </span>
              <div className="flex items-center gap-1.5 text-xs sm:text-sm font-bold text-sky-600 dark:text-sky-400 group-hover:translate-x-2 transition-transform duration-300 ease-out">
                <span>{pomodoroTimer && (pomodoroTimer.isRunning || pomodoroTimer.timeLeft < pomodoroTimer.totalTime) ? 'Continue Timer' : 'Start Focus'}</span>
                <ArrowRight className="w-4 h-4 group-hover:scale-110 transition-transform duration-300 ease-out" />
              </div>
            </div>
          </InteractiveModeCard>

          {/* ================= CARD 03: TASK TRACKER ================= */}
          <InteractiveModeCard
            id="welcome-task-tracker-card"
            onClick={() => onSelectMode('tasks')}
            accentGlow="rgba(16, 185, 129, 0.22)"
            borderHoverDark="hover:border-emerald-500/70"
            borderHoverLight="hover:border-emerald-500"
            glowClass="hover-glow-emerald"
            isDarkMode={isDarkMode}
            itemVariants={itemVariants}
          >
            <div className="absolute top-0 right-0 w-36 h-36 bg-emerald-500/10 rounded-full blur-2xl group-hover:bg-emerald-500/25 transition-all duration-300 ease-out pointer-events-none" />

            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-500 dark:text-emerald-400 flex items-center justify-center transition-all duration-300 ease-out group-hover:scale-115 group-hover:-rotate-3 group-hover:shadow-[0_0_20px_rgba(16,185,129,0.35)] shrink-0">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-lg sm:text-xl font-bold group-hover:text-emerald-500 dark:group-hover:text-emerald-300 transition-colors duration-300 ease-out leading-tight">
                      Task Tracker
                    </h3>
                    <span className="text-xs text-neutral-500 dark:text-neutral-400 block transition-colors duration-300 ease-out group-hover:text-neutral-600 dark:group-hover:text-neutral-300">
                      Priorities, tags & standalone checklists
                    </span>
                  </div>
                </div>
                <span className="text-xs font-mono font-semibold text-neutral-400 dark:text-neutral-500 group-hover:text-emerald-500 dark:group-hover:text-emerald-400 transition-colors duration-300 ease-out">
                  03
                </span>
              </div>

              {/* Task Checklist Preview */}
              <div
                className={`py-3 px-4 rounded-2xl border mb-4 flex items-center justify-between gap-3 text-xs transition-all duration-300 ease-out group-hover:scale-[1.018] group-hover:border-emerald-500/40 group-hover:shadow-sm ${
                  isDarkMode
                    ? 'border-white/5 bg-[#0e1118]'
                    : 'border-neutral-200/80 bg-neutral-50/90'
                }`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-4 h-4 rounded-md bg-emerald-500 text-neutral-950 flex items-center justify-center shrink-0">
                    <Check className="w-3 h-3 stroke-[3]" />
                  </div>
                  <span className="line-through text-neutral-400 text-xs truncate">
                    Finish quarterly roadmap
                  </span>
                </div>
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-4 h-4 rounded-md border border-neutral-400 dark:border-neutral-600 shrink-0" />
                  <span className="text-xs font-medium truncate">Review designs</span>
                </div>
              </div>
            </div>

            <div className="pt-3 flex items-center justify-between border-t border-neutral-100 dark:border-white/5">
              <span className="text-xs text-emerald-600 dark:text-emerald-400 font-mono">
                Standalone Lists
              </span>
              <div className="flex items-center gap-1.5 text-xs sm:text-sm font-bold text-emerald-600 dark:text-emerald-400 group-hover:translate-x-2 transition-transform duration-300 ease-out">
                <span>Open Tasks</span>
                <ArrowRight className="w-4 h-4 group-hover:scale-110 transition-transform duration-300 ease-out" />
              </div>
            </div>
          </InteractiveModeCard>

          {/* ================= CARD 04: WEEKLY ANALYTICS ================= */}
          <InteractiveModeCard
            id="welcome-stats-card"
            onClick={() => onSelectMode('stats')}
            accentGlow="rgba(139, 92, 246, 0.22)"
            borderHoverDark="hover:border-violet-500/70"
            borderHoverLight="hover:border-violet-500"
            glowClass="hover-glow-violet"
            isDarkMode={isDarkMode}
            itemVariants={itemVariants}
          >
            <div className="absolute top-0 right-0 w-36 h-36 bg-violet-500/10 rounded-full blur-2xl group-hover:bg-violet-500/25 transition-all duration-300 ease-out pointer-events-none" />

            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-violet-500/15 border border-violet-500/30 text-violet-500 dark:text-violet-400 flex items-center justify-center transition-all duration-300 ease-out group-hover:scale-115 group-hover:-rotate-3 group-hover:shadow-[0_0_20px_rgba(139,92,246,0.35)] shrink-0">
                    <BarChart3 className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-lg sm:text-xl font-bold group-hover:text-violet-500 dark:group-hover:text-violet-300 transition-colors duration-300 ease-out leading-tight">
                      Weekly Stats
                    </h3>
                    <span className="text-xs text-neutral-500 dark:text-neutral-400 block transition-colors duration-300 ease-out group-hover:text-neutral-600 dark:group-hover:text-neutral-300">
                      {pomodoroTimer && pomodoroTimer.consecutiveStreak > 0
                        ? `Daily focus velocity • ${pomodoroTimer.consecutiveStreak} day streak`
                        : 'Daily focus velocity & streak telemetry'}
                    </span>
                  </div>
                </div>
                <span className="text-xs font-mono font-semibold text-neutral-400 dark:text-neutral-500 group-hover:text-violet-500 dark:group-hover:text-violet-400 transition-colors duration-300 ease-out">
                  04
                </span>
              </div>

              {/* Mini Sparkline Chart Preview */}
              <div
                className={`py-3 px-4 rounded-2xl border mb-4 flex items-center justify-between transition-all duration-300 ease-out group-hover:scale-[1.018] group-hover:border-violet-500/40 group-hover:shadow-sm ${
                  isDarkMode
                    ? 'border-white/5 bg-[#0e1118]'
                    : 'border-neutral-200/80 bg-neutral-50/90'
                }`}
              >
                <div className="flex items-center gap-1.5">
                  <span className="text-xs text-neutral-400 font-mono">Velocity</span>
                  {pomodoroTimer && pomodoroTimer.consecutiveStreak > 0 && (
                    <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-full bg-amber-500/15 text-amber-500 border border-amber-500/30">
                      🔥{pomodoroTimer.consecutiveStreak}d
                    </span>
                  )}
                </div>
                <div className="flex items-end gap-1.5 h-6 px-1">
                  {[
                    { day: 'M', h: '40%' },
                    { day: 'T', h: '65%' },
                    { day: 'W', h: '85%' },
                    { day: 'T', h: '50%' },
                    { day: 'F', h: '100%' },
                    { day: 'S', h: '70%' },
                    { day: 'S', h: '45%' },
                  ].map((bar, i) => (
                    <div key={i} className="flex flex-col items-center h-full justify-end">
                      <div
                        className="w-2 rounded-t bg-gradient-to-t from-violet-600 to-violet-400 group-hover:brightness-125 transition-all duration-300 ease-out"
                        style={{ height: bar.h }}
                      />
                    </div>
                  ))}
                </div>
                <span className="text-xs text-violet-500 dark:text-violet-400 font-semibold font-mono">
                  Weekly
                </span>
              </div>
            </div>

            <div className="pt-3 flex items-center justify-between border-t border-neutral-100 dark:border-white/5">
              <span className="text-xs text-violet-600 dark:text-violet-400 font-mono">
                Telemetry
              </span>
              <div className="flex items-center gap-1.5 text-xs sm:text-sm font-bold text-violet-600 dark:text-violet-400 group-hover:translate-x-2 transition-transform duration-300 ease-out">
                <span>View Analytics</span>
                <ArrowRight className="w-4 h-4 group-hover:scale-110 transition-transform duration-300 ease-out" />
              </div>
            </div>
          </InteractiveModeCard>
        </motion.div>

        {/* Study & Work Party Hub Bar */}
        {onOpenParties && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35, duration: 0.45 }}
            id="welcome-party-hub-compact"
            className={`w-full max-w-5xl mx-auto mt-5 sm:mt-6 p-3.5 sm:p-4 rounded-3xl border flex flex-col sm:flex-row items-center justify-between gap-3.5 transition-all shadow-sm ${
              isDarkMode
                ? 'bg-neutral-900/60 border-white/10 text-neutral-300'
                : 'bg-white border-neutral-200/90 text-neutral-700'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-500 flex items-center justify-center shrink-0">
                <Users className="w-4 h-4" />
              </div>
              <div>
                <span className="font-semibold text-neutral-900 dark:text-white text-xs sm:text-sm block">
                  Study & Work Parties
                </span>
                <span className="text-[11px] text-neutral-500 dark:text-neutral-400">
                  Shared live focus rooms with friends and real-time leaderboard
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => onOpenParties('create')}
                className={`apple-hover px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 cursor-pointer ${
                  isDarkMode
                    ? 'border-white/10 bg-white/5 hover:bg-white/10 text-neutral-200'
                    : 'border-neutral-200 bg-neutral-100/80 hover:bg-neutral-200 text-neutral-800'
                }`}
              >
                <Plus className="w-3.5 h-3.5 text-amber-500" />
                <span>Create</span>
              </button>
              <button
                type="button"
                onClick={() => onOpenParties('join')}
                className={`apple-hover px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 cursor-pointer ${
                  isDarkMode
                    ? 'border-sky-500/40 bg-sky-500/10 hover:bg-sky-500/20 text-sky-300'
                    : 'border-sky-300 bg-sky-50 hover:bg-sky-100 text-sky-800'
                }`}
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Join</span>
              </button>
              <button
                type="button"
                onClick={() => onOpenParties('my-parties')}
                className={`apple-hover px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 cursor-pointer ${
                  isDarkMode
                    ? 'border-white/10 bg-white/5 hover:bg-white/10 text-neutral-200'
                    : 'border-neutral-200 bg-neutral-100/80 hover:bg-neutral-200 text-neutral-800'
                }`}
              >
                <Trophy className="w-3.5 h-3.5 text-amber-400" />
                <span>Leaderboard</span>
              </button>
            </div>
          </motion.div>
        )}

        {/* Subtle Keyboard Shortcuts Hint */}
        <div className="w-full text-center mt-3 sm:mt-4 pb-1">
          <button
            id="welcome-shortcuts-hint-btn"
            type="button"
            onClick={onOpenShortcuts}
            className="inline-flex items-center gap-1.5 text-[11px] text-neutral-400 hover:text-neutral-700 dark:text-neutral-500 dark:hover:text-neutral-300 transition-colors cursor-pointer py-1 px-3 rounded-full hover:bg-neutral-200/50 dark:hover:bg-neutral-800/60"
            title="Open Keyboard Shortcuts (? or \)"
          >
            <Keyboard className="w-3.5 h-3.5 opacity-60" />
            <span>Press</span>
            <kbd className="font-mono font-bold text-[10px] px-1.5 py-0.5 rounded border border-neutral-300 dark:border-neutral-700 bg-neutral-100 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200">
              ?
            </kbd>
            <span>for keyboard navigation</span>
          </button>
        </div>
      </main>
    </div>
  );
};
