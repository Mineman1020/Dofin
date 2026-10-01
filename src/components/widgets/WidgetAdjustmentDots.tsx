import React from 'react';

interface WidgetAdjustmentDotsProps {
  onResizeStart: (e: React.MouseEvent | React.TouchEvent) => void;
}

export const WidgetAdjustmentDots: React.FC<WidgetAdjustmentDotsProps> = ({ onResizeStart }) => {
  const dotClass =
    'absolute w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full bg-amber-400 hover:bg-amber-300 active:bg-amber-200 border-2 border-neutral-950 shadow-[0_0_8px_rgba(251,191,36,0.8)] transition-all hover:scale-125 z-40 select-none flex items-center justify-center cursor-pointer touch-none';

  return (
    <>
      {/* 4 Corners */}
      {/* 1. Top-Left Corner */}
      <div
        onMouseDown={onResizeStart}
        onTouchStart={onResizeStart}
        className={`${dotClass} -top-2 -left-2 cursor-nwse-resize`}
        title="Resize widget (Top-Left corner)"
      >
        <span className="w-1 h-1 rounded-full bg-neutral-950/70 pointer-events-none" />
      </div>

      {/* 2. Top-Right Corner */}
      <div
        onMouseDown={onResizeStart}
        onTouchStart={onResizeStart}
        className={`${dotClass} -top-2 -right-2 cursor-nesw-resize`}
        title="Resize widget (Top-Right corner)"
      >
        <span className="w-1 h-1 rounded-full bg-neutral-950/70 pointer-events-none" />
      </div>

      {/* 3. Bottom-Left Corner */}
      <div
        onMouseDown={onResizeStart}
        onTouchStart={onResizeStart}
        className={`${dotClass} -bottom-2 -left-2 cursor-nesw-resize`}
        title="Resize widget (Bottom-Left corner)"
      >
        <span className="w-1 h-1 rounded-full bg-neutral-950/70 pointer-events-none" />
      </div>

      {/* 4. Bottom-Right Corner */}
      <div
        onMouseDown={onResizeStart}
        onTouchStart={onResizeStart}
        className={`${dotClass} -bottom-2 -right-2 cursor-nwse-resize`}
        title="Resize widget (Bottom-Right corner)"
      >
        <span className="w-1 h-1 rounded-full bg-neutral-950/70 pointer-events-none" />
      </div>

      {/* 4 Edges */}
      {/* 5. Top Edge Center */}
      <div
        onMouseDown={onResizeStart}
        onTouchStart={onResizeStart}
        className={`${dotClass} -top-2 left-1/2 -translate-x-1/2 cursor-ns-resize`}
        title="Resize widget (Top edge)"
      >
        <span className="w-1 h-1 rounded-full bg-neutral-950/70 pointer-events-none" />
      </div>

      {/* 6. Bottom Edge Center */}
      <div
        onMouseDown={onResizeStart}
        onTouchStart={onResizeStart}
        className={`${dotClass} -bottom-2 left-1/2 -translate-x-1/2 cursor-ns-resize`}
        title="Resize widget (Bottom edge)"
      >
        <span className="w-1 h-1 rounded-full bg-neutral-950/70 pointer-events-none" />
      </div>

      {/* 7. Left Edge Center */}
      <div
        onMouseDown={onResizeStart}
        onTouchStart={onResizeStart}
        className={`${dotClass} top-1/2 -left-2 -translate-y-1/2 cursor-ew-resize`}
        title="Resize widget (Left edge)"
      >
        <span className="w-1 h-1 rounded-full bg-neutral-950/70 pointer-events-none" />
      </div>

      {/* 8. Right Edge Center */}
      <div
        onMouseDown={onResizeStart}
        onTouchStart={onResizeStart}
        className={`${dotClass} top-1/2 -right-2 -translate-y-1/2 cursor-ew-resize`}
        title="Resize widget (Right edge)"
      >
        <span className="w-1 h-1 rounded-full bg-neutral-950/70 pointer-events-none" />
      </div>
    </>
  );
};
