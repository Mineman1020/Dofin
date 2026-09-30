import React, { memo, useState, useRef, useEffect } from 'react';
import { StickyNote, Edit3, Check, Maximize2 } from 'lucide-react';
import { WidgetTheme } from '../../types';

interface QuickNoteWidgetProps {
  theme?: WidgetTheme;
  isCustomLayout?: boolean;
  position?: { x: number; y: number };
  onPositionChange?: (pos: { x: number; y: number }) => void;
  scale?: number;
  onScaleChange?: (scale: number) => void;
  text?: string;
  onTextChange?: (text: string) => void;
  accentColor?: string;
  isLight?: boolean;
}

export const QuickNoteWidget: React.FC<QuickNoteWidgetProps> = memo(
  ({
    theme = 'glass',
    isCustomLayout = false,
    position,
    onPositionChange,
    scale = 1,
    onScaleChange,
    text = 'Deep Work Mode • Stay Hydrated 💧',
    onTextChange,
    accentColor = '#10b981',
    isLight = false,
  }) => {
    const [isEditing, setIsEditing] = useState<boolean>(false);
    const [noteText, setNoteText] = useState<string>(text);

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
      if (!isCustomLayout || isEditing) return;
      e.stopPropagation();
      setIsDragging(true);
      setDragStart({
        x: e.clientX - (position?.x || 0),
        y: e.clientY - (position?.y || 0),
      });
    };

    const handleTouchStart = (e: React.TouchEvent) => {
      if (!isCustomLayout || isEditing || !e.touches[0]) return;
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

    const baseContainerClass = `select-none ${isDragging ? '!transition-none' : 'transition-colors duration-200'} ${
      isCustomLayout
        ? 'cursor-grab active:cursor-grabbing border-2 border-dashed border-emerald-400/80 bg-emerald-500/10 shadow-lg ring-2 ring-emerald-400/30'
        : theme === 'solid'
        ? isLight
          ? 'bg-neutral-100 text-neutral-800 border border-neutral-300 shadow-md'
          : 'bg-neutral-900 text-neutral-100 border border-neutral-800 shadow-md'
        : theme === 'glow'
        ? 'bg-black/60 text-white border border-emerald-500/50 shadow-[0_0_15px_rgba(16,185,129,0.25)]'
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
        className="absolute -bottom-2.5 -right-2.5 z-40 w-5 h-5 rounded-full bg-emerald-400 hover:bg-emerald-300 text-neutral-950 flex items-center justify-center cursor-nwse-resize shadow-md border border-neutral-900 transition-transform hover:scale-110 active:scale-95"
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
        className={`${baseContainerClass} relative px-3 py-1.5 rounded-full inline-flex items-center gap-2 max-w-xs font-sans text-xs`}
      >
        {resizeHandle}
        <StickyNote className="w-3.5 h-3.5 text-amber-400 shrink-0" />
        {isEditing ? (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              setIsEditing(false);
              onTextChange?.(noteText);
            }}
            className="flex items-center gap-1"
          >
            <input
              type="text"
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              className="bg-black/40 text-white px-2 py-0.5 rounded text-xs outline-none border border-emerald-400/50 w-36"
              autoFocus
              onBlur={() => {
                setIsEditing(false);
                onTextChange?.(noteText);
              }}
            />
            <button type="submit" className="p-0.5 rounded hover:bg-white/20">
              <Check className="w-3 h-3 text-emerald-400" />
            </button>
          </form>
        ) : (
          <div
            onClick={() => setIsEditing(true)}
            className="flex items-center gap-1.5 cursor-pointer hover:opacity-100 opacity-90 truncate"
            title="Click to edit desk note"
          >
            <span className="truncate">{noteText}</span>
            <Edit3 className="w-2.5 h-2.5 opacity-60 hover:opacity-100 shrink-0" />
          </div>
        )}
      </div>
    );
  }
);

QuickNoteWidget.displayName = 'QuickNoteWidget';
