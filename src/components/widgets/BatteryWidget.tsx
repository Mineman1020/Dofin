import React, { memo, useEffect, useState, useRef } from 'react';
import { Battery, BatteryCharging, BatteryWarning, Zap } from 'lucide-react';
import { BatteryWidgetStyle, WidgetTheme } from '../../types';
import { WidgetAdjustmentDots } from './WidgetAdjustmentDots';
import { calculateWidgetSnap, SnapState } from '../../utils/widgetSnapping';

interface BatteryWidgetProps {
  style?: BatteryWidgetStyle;
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

export const BatteryWidget: React.FC<BatteryWidgetProps> = memo(
  ({
    style = 'pill',
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
    const [level, setLevel] = useState<number>(85);
    const [charging, setCharging] = useState<boolean>(false);
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
      let batteryRef: any = null;
      if (typeof navigator !== 'undefined' && 'getBattery' in navigator) {
        (navigator as any)
          .getBattery()
          .then((battery: any) => {
            batteryRef = battery;
            const updateBattery = () => {
              setLevel(Math.round(battery.level * 100));
              setCharging(Boolean(battery.charging));
            };
            updateBattery();
            battery.addEventListener('levelchange', updateBattery);
            battery.addEventListener('chargingchange', updateBattery);
          })
          .catch(() => {
            // Default 85% fallback if permission denied or desktop
          });
      }
      return () => {
        if (batteryRef) {
          batteryRef.removeEventListener('levelchange', () => {});
          batteryRef.removeEventListener('chargingchange', () => {});
        }
      };
    }, []);

    // Drag handling when in Custom Layout Edit mode
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

    const isLow = level <= 20 && !charging;
    const isFull = level >= 95;
    const batteryColor = isLow
      ? '#ef4444'
      : charging
      ? '#10b981'
      : isFull
      ? '#10b981'
      : accentColor;

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

    // 1. Minimal Style
    if (style === 'minimal') {
      return (
        <div
          ref={widgetRef}
          onMouseDown={handleMouseDown}
          onTouchStart={handleTouchStart}
          style={dragStyle}
          className={`${baseContainerClass} relative inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full font-mono text-xs`}
        >
          {resizeHandle}
          <div
            className="w-2 h-2 rounded-full"
            style={{ backgroundColor: batteryColor }}
          />
          <span className="font-bold">{level}%</span>
          {charging && <Zap className="w-3 h-3 text-emerald-400 fill-emerald-400" />}
        </div>
      );
    }

    // 2. Circular Gauge Style
    if (style === 'gauge') {
      const radius = 22;
      const circumference = 2 * Math.PI * radius;
      const offset = circumference * (1 - level / 100);

      return (
        <div
          ref={widgetRef}
          onMouseDown={handleMouseDown}
          onTouchStart={handleTouchStart}
          style={dragStyle}
          className={`${baseContainerClass} relative p-3 rounded-2xl flex flex-col items-center justify-center gap-1 min-w-[76px]`}
        >
          {resizeHandle}
          <div className="relative w-12 h-12 flex items-center justify-center">
            <svg className="w-full h-full transform -rotate-90">
              <circle
                cx="24"
                cy="24"
                r={radius}
                stroke={isLight ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.1)'}
                strokeWidth="4"
                fill="transparent"
              />
              <circle
                cx="24"
                cy="24"
                r={radius}
                stroke={batteryColor}
                strokeWidth="4"
                strokeDasharray={circumference}
                strokeDashoffset={offset}
                strokeLinecap="round"
                fill="transparent"
                className="transition-all duration-700 ease-out"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center text-[10px] font-mono font-bold leading-none">
              <span>{level}%</span>
            </div>
          </div>
          <span className="text-[9px] font-mono uppercase tracking-wider text-neutral-400 flex items-center gap-0.5">
            {charging ? <Zap className="w-2.5 h-2.5 text-emerald-400" /> : null}
            <span>{charging ? 'CHARGING' : 'BATTERY'}</span>
          </span>
        </div>
      );
    }

    // 3. Cyber Segmented HUD Style
    if (style === 'cyber') {
      return (
        <div
          ref={widgetRef}
          onMouseDown={handleMouseDown}
          onTouchStart={handleTouchStart}
          style={dragStyle}
          className={`${baseContainerClass} relative px-3 py-2 rounded-xl font-mono text-[11px] min-w-[130px]`}
        >
          {resizeHandle}
          <div className="flex items-center justify-between gap-2 text-[9px] uppercase tracking-wider text-neutral-400 mb-1">
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
              <span>PWR.CELL</span>
            </span>
            <span className="font-bold text-white">{level}%</span>
          </div>
          {/* Segmented Bar */}
          <div className="flex items-center gap-1 w-full h-2 rounded bg-neutral-950 p-0.5 border border-neutral-800">
            {Array.from({ length: 10 }).map((_, i) => {
              const active = i < Math.round(level / 10);
              return (
                <div
                  key={i}
                  className="flex-1 h-full rounded-xs transition-all duration-300"
                  style={{
                    backgroundColor: active ? batteryColor : 'transparent',
                    opacity: active ? 1 : 0.2,
                  }}
                />
              );
            })}
          </div>
        </div>
      );
    }

    // 4. Default Sleek Pill Style
    return (
      <div
        ref={widgetRef}
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
        style={dragStyle}
        className={`${baseContainerClass} relative inline-flex items-center gap-2 px-3.5 py-1.5 rounded-2xl shadow-sm`}
        title={`Battery: ${level}% ${charging ? '(Charging)' : ''}`}
      >
        {resizeHandle}
        {charging ? (
          <BatteryCharging className="w-4 h-4 text-emerald-400 animate-pulse shrink-0" />
        ) : isLow ? (
          <BatteryWarning className="w-4 h-4 text-rose-500 animate-bounce shrink-0" />
        ) : (
          <Battery className="w-4 h-4 shrink-0" style={{ color: batteryColor }} />
        )}
        <div className="flex items-center gap-1 font-mono text-xs font-bold leading-none">
          <span>{level}%</span>
          {charging && <span className="text-[10px] text-emerald-400 font-semibold font-sans">⚡</span>}
        </div>
      </div>
    );
  }
);

BatteryWidget.displayName = 'BatteryWidget';
