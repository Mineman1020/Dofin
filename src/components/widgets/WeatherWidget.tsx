import React, { memo, useState, useRef, useEffect } from 'react';
import { CloudSun, Sun, CloudRain, Wind, Droplets, Maximize2, Move } from 'lucide-react';
import { WeatherWidgetStyle, WidgetTheme } from '../../types';

interface WeatherWidgetProps {
  style?: WeatherWidgetStyle;
  theme?: WidgetTheme;
  isCustomLayout?: boolean;
  position?: { x: number; y: number };
  onPositionChange?: (pos: { x: number; y: number }) => void;
  scale?: number;
  onScaleChange?: (scale: number) => void;
  tempUnit?: 'c' | 'f';
  city?: string;
  accentColor?: string;
  isLight?: boolean;
}

export const WeatherWidget: React.FC<WeatherWidgetProps> = memo(
  ({
    style = 'pill',
    theme = 'glass',
    isCustomLayout = false,
    position,
    onPositionChange,
    scale = 1,
    onScaleChange,
    tempUnit = 'f',
    city = 'San Francisco',
    accentColor = '#38bdf8',
    isLight = false,
  }) => {
    const [unit, setUnit] = useState<'c' | 'f'>(tempUnit);
    const [isDragging, setIsDragging] = useState<boolean>(false);
    const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

    const [isResizing, setIsResizing] = useState<boolean>(false);
    const [resizeStart, setResizeStart] = useState<{ startDist: number; startScale: number }>({
      startDist: 0,
      startScale: 1,
    });
    const widgetRef = useRef<HTMLDivElement>(null);

    const widgetScale = Math.max(0.5, Math.min(2.5, scale));

    const handleResizeStart = (e: React.MouseEvent | React.TouchEvent) => {
      if (!isCustomLayout) return;
      e.stopPropagation();
      e.preventDefault();
      setIsResizing(true);
      if (!widgetRef.current) return;
      const rect = widgetRef.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
      const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
      const dist = Math.hypot(clientX - centerX, clientY - centerY);
      setResizeStart({
        startDist: Math.max(15, dist),
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
      if (!isCustomLayout) return;
      e.stopPropagation();
      setIsDragging(true);
      setDragStart({
        x: e.clientX - (position?.x || 0),
        y: e.clientY - (position?.y || 0),
      });
    };

    const handleTouchStart = (e: React.TouchEvent) => {
      if (!isCustomLayout || !e.touches[0]) return;
      e.stopPropagation();
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
        if (!e.touches[0]) return;
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

    const tempVal = unit === 'f' ? 72 : 22;

    const toggleUnit = (e: React.MouseEvent) => {
      e.stopPropagation();
      setUnit((prev) => (prev === 'f' ? 'c' : 'f'));
    };

    const baseContainerClass = `select-none ${isDragging ? '!transition-none' : 'transition-colors duration-200'} ${
      isCustomLayout
        ? 'cursor-grab active:cursor-grabbing border-2 border-dashed border-sky-400/80 bg-sky-500/10 shadow-lg ring-2 ring-sky-400/30'
        : theme === 'solid'
        ? isLight
          ? 'bg-neutral-100 text-neutral-800 border border-neutral-300 shadow-md'
          : 'bg-neutral-900 text-neutral-100 border border-neutral-800 shadow-md'
        : theme === 'glow'
        ? 'bg-black/60 text-white border border-sky-500/50 shadow-[0_0_15px_rgba(56,189,248,0.25)]'
        : theme === 'minimal'
        ? 'bg-transparent text-current'
        : isLight
        ? 'bg-white/70 backdrop-blur-md text-neutral-800 border border-neutral-300/80 shadow-md'
        : 'bg-black/40 backdrop-blur-md text-white border border-white/10 shadow-md'
    }`;

    const dragStyle: React.CSSProperties = {
      transform: `translate3d(${position?.x || 0}px, ${position?.y || 0}px, 0) scale(${widgetScale})`,
      transformOrigin: 'center center',
      transition: isDragging || isResizing ? 'none' : 'transform 0.15s ease-out',
    };

    const resizeHandle = isCustomLayout && (
      <div
        onMouseDown={handleResizeStart}
        onTouchStart={handleResizeStart}
        className="absolute -bottom-2.5 -right-2.5 z-40 w-5 h-5 rounded-full bg-sky-400 hover:bg-sky-300 text-neutral-950 flex items-center justify-center cursor-nwse-resize shadow-md border border-neutral-900 transition-transform hover:scale-110 active:scale-95"
        title="Drag corner outward/inward to resize widget"
      >
        <Maximize2 className="w-2.5 h-2.5 stroke-[3]" />
      </div>
    );

    // 1. Pill Style
    if (style === 'pill') {
      return (
        <div
          ref={widgetRef}
          onMouseDown={handleMouseDown}
          onTouchStart={handleTouchStart}
          style={dragStyle}
          className={`${baseContainerClass} relative inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-sans`}
        >
          {resizeHandle}
          <CloudSun className="w-4 h-4 text-amber-400 shrink-0" />
          <span className="font-semibold">{city}</span>
          <button
            type="button"
            onClick={toggleUnit}
            className="font-mono font-bold hover:text-sky-300 transition-colors cursor-pointer"
          >
            {tempVal}°{unit.toUpperCase()}
          </button>
        </div>
      );
    }

    // 2. Minimal Style
    if (style === 'minimal') {
      return (
        <div
          ref={widgetRef}
          onMouseDown={handleMouseDown}
          onTouchStart={handleTouchStart}
          style={dragStyle}
          className={`${baseContainerClass} relative inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-mono`}
        >
          {resizeHandle}
          <Sun className="w-3.5 h-3.5 text-amber-400" />
          <button type="button" onClick={toggleUnit} className="font-bold cursor-pointer">
            {tempVal}°{unit.toUpperCase()}
          </button>
          <span className="opacity-60 text-[10px]">Sunny</span>
        </div>
      );
    }

    // 3. Card Style
    return (
      <div
        ref={widgetRef}
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
        style={dragStyle}
        className={`${baseContainerClass} relative p-3 rounded-2xl flex flex-col gap-1.5 min-w-[120px] text-xs font-sans`}
      >
        {resizeHandle}
        <div className="flex items-center justify-between gap-2">
          <span className="text-[11px] font-semibold opacity-75 truncate">{city}</span>
          <CloudSun className="w-4 h-4 text-amber-400 shrink-0" />
        </div>
        <div className="flex items-baseline justify-between">
          <button
            type="button"
            onClick={toggleUnit}
            className="text-xl font-bold font-mono tracking-tight hover:text-sky-300 transition-colors cursor-pointer"
          >
            {tempVal}°{unit.toUpperCase()}
          </button>
          <span className="text-[10px] opacity-70">Clear</span>
        </div>
        <div className="flex items-center gap-2 text-[10px] opacity-65 pt-0.5 border-t border-current/10">
          <span className="flex items-center gap-0.5">
            <Droplets className="w-2.5 h-2.5 text-sky-400" /> 48%
          </span>
          <span className="flex items-center gap-0.5">
            <Wind className="w-2.5 h-2.5 text-emerald-400" /> 6mph
          </span>
        </div>
      </div>
    );
  }
);

WeatherWidget.displayName = 'WeatherWidget';
