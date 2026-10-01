export interface SnapState {
  snapXCenter: boolean;
  snapYCenter: boolean;
  corner: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | null;
}

export function calculateWidgetSnap(
  clientX: number,
  clientY: number,
  dragStart: { x: number; y: number },
  basePos: { baseX: number; baseY: number; width: number; height: number }
): { nextX: number; nextY: number; snap: SnapState } {
  let nextX = Math.round(clientX - dragStart.x);
  let nextY = Math.round(clientY - dragStart.y);

  const visualX = basePos.baseX + nextX;
  const visualY = basePos.baseY + nextY;
  const visualCenterX = visualX + basePos.width / 2;
  const visualCenterY = visualY + basePos.height / 2;

  const screenCenterX = window.innerWidth / 2;
  const screenCenterY = window.innerHeight / 2;
  const SNAP_THRESHOLD = 32;
  const CORNER_MARGIN = 24;

  let snapXCenter = false;
  let snapYCenter = false;
  let corner: SnapState['corner'] = null;

  // 1. Check Corner Snaps first (All 4 Corners)
  // Top-Left Corner
  if (
    Math.abs(visualX - CORNER_MARGIN) < SNAP_THRESHOLD &&
    Math.abs(visualY - CORNER_MARGIN) < SNAP_THRESHOLD
  ) {
    nextX = Math.round(CORNER_MARGIN - basePos.baseX);
    nextY = Math.round(CORNER_MARGIN - basePos.baseY);
    corner = 'top-left';
  }
  // Top-Right Corner
  else if (
    Math.abs(visualX + basePos.width - (window.innerWidth - CORNER_MARGIN)) < SNAP_THRESHOLD &&
    Math.abs(visualY - CORNER_MARGIN) < SNAP_THRESHOLD
  ) {
    nextX = Math.round(window.innerWidth - CORNER_MARGIN - basePos.width - basePos.baseX);
    nextY = Math.round(CORNER_MARGIN - basePos.baseY);
    corner = 'top-right';
  }
  // Bottom-Left Corner
  else if (
    Math.abs(visualX - CORNER_MARGIN) < SNAP_THRESHOLD &&
    Math.abs(visualY + basePos.height - (window.innerHeight - CORNER_MARGIN)) < SNAP_THRESHOLD
  ) {
    nextX = Math.round(CORNER_MARGIN - basePos.baseX);
    nextY = Math.round(window.innerHeight - CORNER_MARGIN - basePos.height - basePos.baseY);
    corner = 'bottom-left';
  }
  // Bottom-Right Corner
  else if (
    Math.abs(visualX + basePos.width - (window.innerWidth - CORNER_MARGIN)) < SNAP_THRESHOLD &&
    Math.abs(visualY + basePos.height - (window.innerHeight - CORNER_MARGIN)) < SNAP_THRESHOLD
  ) {
    nextX = Math.round(window.innerWidth - CORNER_MARGIN - basePos.width - basePos.baseX);
    nextY = Math.round(window.innerHeight - CORNER_MARGIN - basePos.height - basePos.baseY);
    corner = 'bottom-right';
  }

  // 2. If not locked to a corner, check Center Grid Snapping (Horizontal Center, Vertical Center, or Both)
  if (!corner) {
    // Vertical Center Snap (Center X)
    if (Math.abs(visualCenterX - screenCenterX) < SNAP_THRESHOLD) {
      nextX = Math.round(screenCenterX - basePos.baseX - basePos.width / 2);
      snapXCenter = true;
    }

    // Horizontal Center Snap (Center Y)
    if (Math.abs(visualCenterY - screenCenterY) < SNAP_THRESHOLD) {
      nextY = Math.round(screenCenterY - basePos.baseY - basePos.height / 2);
      snapYCenter = true;
    }
  }

  return {
    nextX,
    nextY,
    snap: { snapXCenter, snapYCenter, corner },
  };
}
