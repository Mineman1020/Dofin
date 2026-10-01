import React, { memo, useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, Timer } from 'lucide-react';
import { StopwatchWidgetStyle, WidgetTheme } from '../../types';
import { WidgetAdjustmentDots } from './WidgetAdjustmentDots';
import { calculateWidgetSnap, SnapState } from '../../utils/widgetSnapping';

interface StopwatchWidgetProps {
  style?: StopwatchWidgetStyle;
  theme?: WidgetTheme;
  isCustomLayout?: boolean;
  position?: { x: number; y: number };
  onPositionChange?: (pos: { x: number; y: number }) => void;
  scale?: number;
  onScaleChange?: (scale: number) => void;
  accentColor?: string;
  isLight?: boolean;
  onSnapChange?: (snap: SnapState) => void;
}

export const StopwatchWidget: React.FC<StopwatchWidgetProps> = memo(
  ({
    style = 'compact',
    theme = 'glass',
    isCustomLayout = false,
    position,
    onPositionChange,
    scale = 1,
    onScaleChange,
    accentColor = '#f59e0b',
    isLight = false,
    onSnapChange,
  }) => {
    const [isRunning, setIsRunning] = useState<boolean>(false);
    const [elapsedMs, setElapsedMs] = useState<number>(0);
    const startTimeRef = useRef<number>(0);
    const animFrameRef = useRef<number>(0);

    const [isDragging, setIsDragging] = useState<boolean>(false);
    const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
    const dragBasePosRef = useRef<{ baseX: number; baseY: number; width: number; height: number }>({
      baseX: 0,
      baseY: 0,
      width: 0,
      height: 0,
    });

    const widgetRef = useRef<HTMLDivElement>(null);
    const [isResizing, setIsResizing] = useState<boolean>(false);
    const [resizeStart, setResizeStart] = useState<{ startDist: number; startScale: number }>({
      startDist: 0,
      startScale: 1,
    });
    const rafRef = useRef<number | null>(null);

    const widgetScale = Math.max(0.5, Math.min(2.5, scale));

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
        const newScale = Math.max(0.5, Math.min(2.5, +(resizeStart.startScale * ratio).toFixed(2)));

        if (rafRef.current) cancelAnimationFrame(rafRef.current);
        rafRef.current = requestAnimationFrame(() => {
          onScaleChange?.(newScale);
        });
      };
      const onEnd = () => {
        if (rafRef.current) cancelAnimationFrame(rafRef.current);
        setIsResizing(false);
      };
      window.addEventListener('mousemove', onMove, { passive: true });
      window.addEventListener('mouseup', onEnd);
      window.addEventListener('touchmove', onMove, { passive: true });
      window.addEventListener('touchend', onEnd);
      return () => {
        if (rafRef.current) cancelAnimationFrame(rafRef.current);
        window.removeEventListener('mousemove', onMove);
        window.removeEventListener('mouseup', onEnd);
        window.removeEventListener('touchmove', onMove);
        window.removeEventListener('touchend', onEnd);
      };
    }, [isResizing, resizeStart, onScaleChange]);

    useEffect(() => {
      if (isRunning) {
        startTimeRef.current = performance.now() - elapsedMs;
        const tick = () => {
          setElapsedMs(Math.round(performance.now() - startTimeRef.current));
          animFrameRef.current = requestAnimationFrame(tick);
        };
        animFrameRef.current = requestAnimationFrame(tick);
      } else {
        cancelAnimationFrame(animFrameRef.current);
      }
      return () => cancelAnimationFrame(animFrameRef.current);
    }, [isRunning]);

    const handleToggle = (e: React.MouseEvent) => {
      e.stopPropagation();
      setIsRunning((prev) => !prev);
    };

    const handleReset = (e: React.MouseEvent) => {
      e.stopPropagation();
      setIsRunning(false);
      setElapsedMs(0);
    };

    // Time calculations
    const totalSeconds = Math.floor(elapsedMs / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    const centiseconds = Math.floor((elapsedMs % 1000) / 10);

    const minutesStr = String(minutes).padStart(2, '0');
    const secondsStr = String(seconds).padStart(2, '0');
    const centisStr = String(centiseconds).padStart(2, '0');

    // Drag handling
    const handleMouseDown = (e: React.MouseEvent) => {
      if (!isCustomLayout) return;
      e.stopPropagation();
      setIsDragging(true);
      const curX = position?.x || 0;
      const curY = position?.y || 0;
      setDragStart({
        x: e.clientX - curX,
        y: e.clientY - curY,
      });
      if (widgetRef.current) {
        const rect = widgetRef.current.getBoundingClientRect();
        dragBasePosRef.current = {
          baseX: rect.left - curX,
          baseY: rect.top - curY,
          width: rect.width,
          height: rect.height,
        };
      }
    };

    const handleTouchStart = (e: React.TouchEvent) => {
      if (!isCustomLayout || !e.touches[0]) return;
      e.stopPropagation();
      setIsDragging(true);
      const curX = position?.x || 0;
      const curY = position?.y || 0;
      setDragStart({
        x: e.touches[0].clientX - curX,
        y: e.touches[0].clientY - curY,
      });
      if (widgetRef.current) {
        const rect = widgetRef.current.getBoundingClientRect();
        dragBasePosRef.current = {
          baseX: rect.left - curX,
          baseY: rect.top - curY,
          width: rect.width,
          height: rect.height,
        };
      }
    };

    useEffect(() => {
      if (!isDragging) return;

      const onMouseMove = (e: MouseEvent) => {
        const { nextX, nextY, snap } = calculateWidgetSnap(
          e.clientX,
          e.clientY,
          dragStart,
          dragBasePosRef.current
        );
        onSnapChange?.(snap);
        if (rafRef.current) cancelAnimationFrame(rafRef.current);
        rafRef.current = requestAnimationFrame(() => {
          onPositionChange?.({ x: nextX, y: nextY });
        });
      };

      const onTouchMove = (e: TouchEvent) => {
        if (!e.touches[0]) return;
        const { nextX, nextY, snap } = calculateWidgetSnap(
          e.touches[0].clientX,
          e.touches[0].clientY,
          dragStart,
          dragBasePosRef.current
        );
        onSnapChange?.(snap);
        if (rafRef.current) cancelAnimationFrame(rafRef.current);
        rafRef.current = requestAnimationFrame(() => {
          onPositionChange?.({ x: nextX, y: nextY });
        });
      };

      const onEnd = () => {
        if (rafRef.current) cancelAnimationFrame(rafRef.current);
        setIsDragging(false);
        onSnapChange?.({ snapXCenter: false, snapYCenter: false, corner: null });
      };

      window.addEventListener('mousemove', onMouseMove, { passive: true });
      window.addEventListener('mouseup', onEnd);
      window.addEventListener('touchmove', onTouchMove, { passive: true });
      window.addEventListener('touchend', onEnd);

      return () => {
        if (rafRef.current) cancelAnimationFrame(rafRef.current);
        window.removeEventListener('mousemove', onMouseMove);
        window.removeEventListener('mouseup', onEnd);
        window.removeEventListener('touchmove', onTouchMove);
        window.removeEventListener('touchend', onEnd);
      };
    }, [isDragging, dragStart, onPositionChange, onSnapChange]);

    // Rock-solid flat hover - NO hover:scale or rising transform!
    const baseContainerClass = `select-none ${
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
      transition: isDragging || isResizing ? 'none' : 'transform 0.22s cubic-bezier(0.16, 1, 0.3, 1)',
      willChange: isDragging || isResizing ? 'transform' : 'auto',
      touchAction: isCustomLayout ? 'none' : 'auto',
    };

    const resizeHandle = isCustomLayout ? (
      <WidgetAdjustmentDots onResizeStart={handleResizeMouseDown} />
    ) : null;

    // 1. Ring / Chronograph Dial Style
    if (style === 'ring') {
      const radius = 26;
      const circumference = 2 * Math.PI * radius;
      const progress = (seconds + (elapsedMs % 1000) / 1000) / 60;
      const offset = circumference * (1 - progress);

      return (
        <div
          ref={widgetRef}
          onMouseDown={handleMouseDown}
          onTouchStart={handleTouchStart}
          style={dragStyle}
          className={`${baseContainerClass} relative p-3 rounded-2xl flex flex-col items-center justify-center gap-1.5 min-w-[96px]`}
        >
          {resizeHandle}
          <div className="relative w-16 h-16 flex items-center justify-center">
            <svg className="w-full h-full transform -rotate-90">
              <circle
                cx="32"
                cy="32"
                r={radius}
                stroke={isLight ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.1)'}
                strokeWidth="4"
                fill="transparent"
              />
              <circle
                cx="32"
                cy="32"
                r={radius}
                stroke={accentColor}
                strokeWidth="4"
                strokeDasharray={circumference}
                strokeDashoffset={offset}
                strokeLinecap="round"
                fill="transparent"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center font-mono font-bold leading-none">
              <span className="text-xs">{minutesStr}:{secondsStr}</span>
              <span className="text-[9px] opacity-70">.{centisStr}</span>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={handleToggle}
              className="p-1 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-white cursor-pointer"
            >
              {isRunning ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
            </button>
            <button
              type="button"
              onClick={handleReset}
              className="p-1 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-400 hover:text-white cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" />
            </button>
          </div>
        </div>
      );
    }

    // 2. Card Style
    if (style === 'card') {
      return (
        <div
          ref={widgetRef}
          onMouseDown={handleMouseDown}
          onTouchStart={handleTouchStart}
          style={dragStyle}
          className={`${baseContainerClass} relative p-3.5 rounded-2xl min-w-[150px] space-y-2`}
        >
          {resizeHandle}
          <div className="flex items-center justify-between text-[10px] font-mono uppercase tracking-wider text-neutral-400">
            <span className="flex items-center gap-1">
              <Timer className="w-3 h-3" style={{ color: accentColor }} />
              <span>STOPWATCH</span>
            </span>
            {isRunning && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />}
          </div>
          <div className="font-mono font-bold text-lg leading-none tracking-tight">
            <span>{minutesStr}:{secondsStr}</span>
            <span className="text-xs opacity-70 ml-0.5">.{centisStr}</span>
          </div>
          <div className="flex items-center gap-1.5 pt-1">
            <button
              type="button"
              onClick={handleToggle}
              className="flex-1 py-1 px-2 rounded-lg bg-amber-400 hover:bg-amber-300 text-neutral-950 font-bold text-[11px] flex items-center justify-center gap-1 cursor-pointer transition-colors shadow"
            >
              {isRunning ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
              <span>{isRunning ? 'Pause' : 'Start'}</span>
            </button>
            <button
              type="button"
              onClick={handleReset}
              className="p-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 cursor-pointer transition-colors"
              title="Reset"
            >
              <RotateCcw className="w-3 h-3" />
            </button>
          </div>
        </div>
      );
    }

    // 3. Default Compact Pill Style
    return (
      <div
        ref={widgetRef}
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
        style={dragStyle}
        className={`${baseContainerClass} relative inline-flex items-center gap-2 px-3 py-1.5 rounded-2xl shadow-sm`}
      >
        {resizeHandle}
        <Timer className="w-3.5 h-3.5 shrink-0" style={{ color: accentColor }} />
        <span className="font-mono text-xs font-bold leading-none">
          {minutesStr}:{secondsStr}.<span className="text-[10px] opacity-75">{centisStr}</span>
        </span>
        <div className="flex items-center gap-1 ml-1 border-l border-neutral-700/60 pl-1.5">
          <button
            type="button"
            onClick={handleToggle}
            className="p-1 rounded-md hover:bg-neutral-800/80 text-neutral-200 cursor-pointer transition-colors"
            title={isRunning ? 'Pause stopwatch' : 'Start stopwatch'}
          >
            {isRunning ? <Pause className="w-3 h-3 text-amber-400" /> : <Play className="w-3 h-3" />}
          </button>
          <button
            type="button"
            onClick={handleReset}
            className="p-1 rounded-md hover:bg-neutral-800/80 text-neutral-400 hover:text-white cursor-pointer transition-colors"
            title="Reset stopwatch"
          >
            <RotateCcw className="w-2.5 h-2.5" />
          </button>
        </div>
      </div>
    );
  }
);

StopwatchWidget.displayName = 'StopwatchWidget';
