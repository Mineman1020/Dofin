import React, { memo, useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, Timer as TimerIcon, Sparkles } from 'lucide-react';
import { PomodoroSettings, WidgetTheme } from '../../types';
import { PomodoroTimerController } from '../../utils/usePomodoroTimer';

interface PomodoroWidgetProps {
  timer: PomodoroTimerController;
  settings: PomodoroSettings;
  onUpdateSettings?: (updated: Partial<PomodoroSettings>) => void;
  isCustomLayout?: boolean;
  position?: { x: number; y: number };
  onPositionChange?: (pos: { x: number; y: number }) => void;
  scale?: number;
  onScaleChange?: (scale: number) => void;
  accentColor?: string;
  isLight?: boolean;
  theme?: WidgetTheme;
  onOpenPomodoro?: () => void;
}

export const PomodoroWidget: React.FC<PomodoroWidgetProps> = memo(
  ({
    timer,
    settings,
    onUpdateSettings,
    isCustomLayout = false,
    position,
    onPositionChange,
    scale = 1,
    onScaleChange,
    accentColor = '#ef4444',
    isLight = false,
    theme = 'glass',
    onOpenPomodoro,
  }) => {
    const {
      phase,
      timeLeft,
      totalTime,
      isRunning,
      currentRound,
      togglePlayPause,
      handleReset,
      startPresetTimer,
    } = timer;

    const [isDragging, setIsDragging] = useState<boolean>(false);
    const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

    const widgetRef = useRef<HTMLDivElement>(null);
    const [isResizing, setIsResizing] = useState<boolean>(false);
    const [resizeStart, setResizeStart] = useState<{ startDist: number; startScale: number }>({
      startDist: 0,
      startScale: 1,
    });

    const widgetScale = Math.max(0.6, Math.min(2.5, scale));
    // Size is considered increased when scale > 1.05
    const isEnlarged = widgetScale > 1.05;

    const handleResizeMouseDown = (e: React.MouseEvent | React.TouchEvent) => {
      e.stopPropagation();
      setIsResizing(true);
      if (!widgetRef.current) return;
      const rect = widgetRef.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
      const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
      const dist = Math.hypot(clientX - centerX, clientY - centerY);
      setResizeStart({
        startDist: Math.max(10, dist),
        startScale: widgetScale,
      });
    };

    useEffect(() => {
      if (!isResizing) return;
      const onMove = (e: MouseEvent | TouchEvent) => {
        if (!widgetRef.current) return;
        const rect = widgetRef.current.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
        const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
        const dist = Math.hypot(clientX - centerX, clientY - centerY);
        const ratio = dist / resizeStart.startDist;
        const newScale = Math.max(0.6, Math.min(2.5, +(resizeStart.startScale * ratio).toFixed(2)));
        onScaleChange?.(newScale);
      };
      const onEnd = () => setIsResizing(false);
      window.addEventListener('mousemove', onMove);
      window.addEventListener('mouseup', onEnd);
      window.addEventListener('touchmove', onMove);
      window.addEventListener('touchend', onEnd);
      return () => {
        window.removeEventListener('mousemove', onMove);
        window.removeEventListener('mouseup', onEnd);
        window.removeEventListener('touchmove', onMove);
        window.removeEventListener('touchend', onEnd);
      };
    }, [isResizing, resizeStart, onScaleChange]);

    const handleMouseDown = (e: React.MouseEvent) => {
      if (!isCustomLayout || (e.target as HTMLElement).closest('button')) return;
      e.preventDefault();
      setIsDragging(true);
      setDragStart({
        x: e.clientX - (position?.x || 0),
        y: e.clientY - (position?.y || 0),
      });
    };

    const handleTouchStart = (e: React.TouchEvent) => {
      if (!isCustomLayout || (e.target as HTMLElement).closest('button')) return;
      setIsDragging(true);
      setDragStart({
        x: e.touches[0].clientX - (position?.x || 0),
        y: e.touches[0].clientY - (position?.y || 0),
      });
    };

    useEffect(() => {
      if (!isDragging) return;

      let rafId: number | null = null;
      let latestPos = { x: 0, y: 0 };

      const scheduleUpdate = () => {
        if (rafId === null) {
          rafId = requestAnimationFrame(() => {
            onPositionChange?.(latestPos);
            rafId = null;
          });
        }
      };

      const onMouseMove = (e: MouseEvent) => {
        latestPos = {
          x: Math.round(e.clientX - dragStart.x),
          y: Math.round(e.clientY - dragStart.y),
        };
        scheduleUpdate();
      };

      const onTouchMove = (e: TouchEvent) => {
        latestPos = {
          x: Math.round(e.touches[0].clientX - dragStart.x),
          y: Math.round(e.touches[0].clientY - dragStart.y),
        };
        scheduleUpdate();
      };

      const onEnd = () => {
        if (rafId !== null) cancelAnimationFrame(rafId);
        setIsDragging(false);
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
    }, [isDragging, dragStart, onPositionChange]);

    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    const formattedMinutes = String(minutes).padStart(2, '0');
    const formattedSeconds = String(seconds).padStart(2, '0');

    const progress = totalTime > 0 ? (totalTime - timeLeft) / totalTime : 0;

    const baseContainerClass = `select-none ${isDragging ? '!transition-none' : 'transition-colors duration-200'} ${
      isCustomLayout
        ? 'cursor-grab active:cursor-grabbing border-2 border-dashed border-amber-400/80 z-30'
        : 'z-10'
    } ${
      theme === 'glass'
        ? isLight
          ? 'bg-white/80 border border-neutral-300/80 backdrop-blur-md shadow-lg text-neutral-800'
          : 'bg-neutral-900/80 border border-white/10 backdrop-blur-md shadow-2xl text-white'
        : theme === 'solid'
        ? isLight
          ? 'bg-neutral-100 border border-neutral-300 text-neutral-900'
          : 'bg-neutral-950 border border-neutral-800 text-white'
        : theme === 'glow'
        ? 'bg-black/90 border border-amber-500/40 shadow-[0_0_20px_rgba(245,158,11,0.25)] text-white'
        : 'bg-transparent text-current'
    }`;

    const dragStyle: React.CSSProperties = {
      transform: `translate3d(${position?.x || 0}px, ${position?.y || 0}px, 0) scale(${widgetScale})`,
      transformOrigin: 'center center',
      transition: isDragging || isResizing ? 'none' : 'transform 0.15s ease-out',
    };

    const resizeHandle = isCustomLayout ? (
      <div
        onMouseDown={handleResizeMouseDown}
        onTouchStart={handleResizeMouseDown}
        className="absolute -bottom-2.5 -right-2.5 z-40 w-5 h-5 rounded-full bg-amber-400 hover:bg-amber-300 text-neutral-950 flex items-center justify-center cursor-nwse-resize shadow-xl border border-neutral-900 transition-transform hover:scale-125 select-none"
        title="Hold & drag mouse outward to increase widget size, inward to decrease"
      >
        <span className="text-[10px] font-bold leading-none">⤡</span>
      </div>
    ) : null;

    const handleLaunchPreset = (presetMinutes: number, e?: React.MouseEvent) => {
      e?.stopPropagation();
      onUpdateSettings?.({
        workMinutes: presetMinutes,
        presetTimerDefault: presetMinutes,
      });
      startPresetTimer(presetMinutes, 'work');
    };

    // When timer is started (isRunning is true), requirement specifies: "when the timer is started show only countdown in that widget"
    if (isRunning) {
      return (
        <div
          ref={widgetRef}
          id="pomodoro-widget-running"
          onMouseDown={handleMouseDown}
          onTouchStart={handleTouchStart}
          style={dragStyle}
          onClick={onOpenPomodoro}
          className={`${baseContainerClass} relative px-4 py-2 rounded-2xl flex items-center gap-3 cursor-pointer group`}
          title="Pomodoro Active - Click to open full view"
        >
          {resizeHandle}
          <div className="relative w-8 h-8 flex items-center justify-center shrink-0">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 32 32">
              <circle
                cx="16"
                cy="16"
                r="13"
                stroke={isLight ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.1)'}
                strokeWidth="2.5"
                fill="none"
              />
              <circle
                cx="16"
                cy="16"
                r="13"
                stroke={accentColor}
                strokeWidth="2.5"
                strokeDasharray={2 * Math.PI * 13}
                strokeDashoffset={2 * Math.PI * 13 * (1 - progress)}
                strokeLinecap="round"
                fill="none"
                className="transition-all duration-1000 ease-linear"
              />
            </svg>
            <TimerIcon className="w-3.5 h-3.5 absolute text-emerald-400 animate-pulse" />
          </div>

          {/* Show ONLY countdown */}
          <div className="flex flex-col items-start leading-none">
            <span className="font-mono text-lg font-bold tracking-tight text-white drop-shadow">
              {formattedMinutes}:{formattedSeconds}
            </span>
            <span className="text-[9px] uppercase font-mono text-emerald-400 font-semibold tracking-wider mt-0.5">
              {phase === 'work' ? 'Focusing' : 'Break'}
            </span>
          </div>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              togglePlayPause();
            }}
            className="w-7 h-7 rounded-xl bg-white/10 hover:bg-white/20 text-white flex items-center justify-center cursor-pointer transition-colors ml-1"
            title="Pause timer"
          >
            <Pause className="w-3.5 h-3.5" />
          </button>
        </div>
      );
    }

    // Timer is IDLE / PAUSED
    // If kept small (isEnlarged is false): remove preset clock options
    if (!isEnlarged) {
      return (
        <div
          ref={widgetRef}
          id="pomodoro-widget-compact"
          onMouseDown={handleMouseDown}
          onTouchStart={handleTouchStart}
          style={dragStyle}
          onClick={onOpenPomodoro}
          className={`${baseContainerClass} relative px-3.5 py-2 rounded-2xl flex items-center gap-2.5 cursor-pointer group`}
          title="Pomodoro Timer - Drag corner in layout editor to enlarge & show preset options"
        >
          {resizeHandle}
          <div className="w-6 h-6 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0 border border-amber-500/30">
            <TimerIcon className="w-3.5 h-3.5" />
          </div>

          <div className="flex flex-col items-start leading-none">
            <span className="font-mono text-sm font-bold tracking-tight">
              {formattedMinutes}:{formattedSeconds}
            </span>
            <span className="text-[8px] font-mono uppercase text-neutral-400 mt-0.5">
              {phase === 'work' ? 'Focus' : 'Break'}
            </span>
          </div>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              togglePlayPause();
            }}
            className="w-6 h-6 rounded-lg bg-amber-500 hover:bg-amber-400 text-neutral-950 flex items-center justify-center cursor-pointer transition-colors ml-0.5 shadow-sm"
            title="Start session"
          >
            <Play className="w-3 h-3 ml-0.5" />
          </button>
        </div>
      );
    }

    // Size is INCREASED (isEnlarged is true) & Timer is not running:
    // "Show the preset timer options only when the size of the clock is increased"
    return (
      <div
        ref={widgetRef}
        id="pomodoro-widget-enlarged"
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
        style={dragStyle}
        className={`${baseContainerClass} relative p-3 rounded-2xl flex flex-col gap-2.5 min-w-[200px] shadow-xl`}
      >
        {resizeHandle}
        <div className="flex items-center justify-between gap-2 border-b border-white/10 pb-1.5">
          <div className="flex items-center gap-1.5 cursor-pointer" onClick={onOpenPomodoro}>
            <TimerIcon className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-amber-300">
              Preset Timers
            </span>
          </div>
          <span className="text-[10px] font-mono text-neutral-400">
            {formattedMinutes}:{formattedSeconds}
          </span>
        </div>

        {/* Preset Timer Options (5m, 15m, 25m, 50m) */}
        <div className="grid grid-cols-4 gap-1.5">
          {[
            { label: '5m', minutes: 5 },
            { label: '15m', minutes: 15 },
            { label: '25m', minutes: 25 },
            { label: '50m', minutes: 50 },
          ].map((preset) => {
            const isCurrent = settings.workMinutes === preset.minutes;
            return (
              <button
                key={preset.minutes}
                id={`widget-preset-${preset.minutes}m-btn`}
                type="button"
                onClick={(e) => handleLaunchPreset(preset.minutes, e)}
                className={`py-1.5 rounded-lg text-xs font-mono font-bold tracking-tight border cursor-pointer transition-all active:scale-95 text-center ${
                  isCurrent
                    ? 'border-amber-400 bg-amber-500/20 text-amber-300 ring-1 ring-amber-400/50 shadow-sm'
                    : 'border-white/10 hover:border-amber-400/50 bg-black/30 hover:bg-black/60 text-neutral-300 hover:text-white'
                }`}
                title={`Launch ${preset.minutes}m focus session immediately`}
              >
                {preset.label}
              </button>
            );
          })}
        </div>

        {/* Start / Resume Current Duration Button */}
        <div className="flex items-center gap-1.5 pt-0.5">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              togglePlayPause();
            }}
            className="flex-1 py-1.5 px-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-sm"
          >
            <Play className="w-3 h-3 fill-current ml-0.5" />
            <span>Start {settings.workMinutes}m</span>
          </button>
          {timeLeft < totalTime && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleReset();
              }}
              className="p-1.5 rounded-xl border border-white/10 hover:bg-white/10 text-neutral-400 hover:text-white transition-colors cursor-pointer"
              title="Reset timer"
            >
              <RotateCcw className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>
    );
  }
);

PomodoroWidget.displayName = 'PomodoroWidget';
