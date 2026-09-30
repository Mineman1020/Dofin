import React, { memo, useState, useRef, useEffect } from 'react';
import { Flame, Target, CheckCircle2, Maximize2 } from 'lucide-react';
import { WidgetTheme } from '../../types';

interface FocusGoalWidgetProps {
  theme?: WidgetTheme;
  isCustomLayout?: boolean;
  position?: { x: number; y: number };
  onPositionChange?: (pos: { x: number; y: number }) => void;
  scale?: number;
  onScaleChange?: (scale: number) => void;
  targetSessions?: number;
  completedSessions?: number;
  accentColor?: string;
  isLight?: boolean;
}

export const FocusGoalWidget: React.FC<FocusGoalWidgetProps> = memo(
  ({
    theme = 'glass',
    isCustomLayout = false,
    position,
    onPositionChange,
    scale = 1,
    onScaleChange,
    targetSessions = 4,
    completedSessions = 3,
    accentColor = '#f59e0b',
    isLight = false,
  }) => {
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

    const progressPct = Math.min(100, Math.round((completedSessions / Math.max(1, targetSessions)) * 100));

    const baseContainerClass = `select-none ${isDragging ? '!transition-none' : 'transition-colors duration-200'} ${
      isCustomLayout
        ? 'cursor-grab active:cursor-grabbing border-2 border-dashed border-amber-400/80 bg-amber-500/10 shadow-lg ring-2 ring-amber-400/30'
        : theme === 'solid'
        ? isLight
          ? 'bg-neutral-100 text-neutral-800 border border-neutral-300 shadow-md'
          : 'bg-neutral-900 text-neutral-100 border border-neutral-800 shadow-md'
        : theme === 'glow'
        ? 'bg-black/60 text-white border border-amber-500/50 shadow-[0_0_15px_rgba(245,158,11,0.25)]'
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
        className="absolute -bottom-2.5 -right-2.5 z-40 w-5 h-5 rounded-full bg-amber-400 hover:bg-amber-300 text-neutral-950 flex items-center justify-center cursor-nwse-resize shadow-md border border-neutral-900 transition-transform hover:scale-110 active:scale-95"
        title="Drag corner outward/inward to resize widget"
      >
        <Maximize2 className="w-2.5 h-2.5 stroke-[3]" />
      </div>
    );

    return (
      <div
        ref={widgetRef}
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
        style={dragStyle}
        className={`${baseContainerClass} relative px-3 py-2 rounded-2xl flex items-center gap-2.5 min-w-[130px] font-sans`}
      >
        {resizeHandle}
        <div className="relative w-8 h-8 flex items-center justify-center shrink-0">
          <svg className="w-full h-full transform -rotate-90">
            <circle
              cx="16"
              cy="16"
              r="13"
              stroke={isLight ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.15)'}
              strokeWidth="3"
              fill="none"
            />
            <circle
              cx="16"
              cy="16"
              r="13"
              stroke={accentColor || '#f59e0b'}
              strokeWidth="3"
              strokeDasharray={2 * Math.PI * 13}
              strokeDashoffset={2 * Math.PI * 13 * (1 - progressPct / 100)}
              strokeLinecap="round"
              fill="none"
              className="transition-all duration-500"
            />
          </svg>
          <Flame className="w-3.5 h-3.5 text-amber-400 absolute" />
        </div>
        <div className="flex flex-col">
          <div className="flex items-center gap-1">
            <span className="font-mono text-xs font-bold">{completedSessions}/{targetSessions}</span>
            <span className="text-[10px] opacity-70">Goals</span>
          </div>
          <span className="text-[9px] font-medium opacity-60">
            {progressPct >= 100 ? 'Target Hit! 🎯' : `${progressPct}% Done`}
          </span>
        </div>
      </div>
    );
  }
);

FocusGoalWidget.displayName = 'FocusGoalWidget';
