import React, { memo } from 'react';
import { ClockSettings } from '../../types';

interface SevenSegmentClockProps {
  hoursStr: string;
  minutesStr: string;
  secondsStr: string;
  ampm: string;
  settings: ClockSettings;
  resolvedAccentColor: string;
}

// 7-segment LED lookup table (true = active segment)
// Segments: [a: top, b: top-right, c: bottom-right, d: bottom, e: bottom-left, f: top-left, g: center]
const SEGMENT_MAP: Record<string, boolean[]> = {
  '0': [true, true, true, true, true, true, false],
  '1': [false, true, true, false, false, false, false],
  '2': [true, true, false, true, true, false, true],
  '3': [true, true, true, true, false, false, true],
  '4': [false, true, true, false, false, true, true],
  '5': [true, false, true, true, false, true, true],
  '6': [true, false, true, true, true, true, true],
  '7': [true, true, true, false, false, false, false],
  '8': [true, true, true, true, true, true, true],
  '9': [true, true, true, true, false, true, true],
};

const SevenSegmentDigit: React.FC<{
  digit: string;
  color: string;
}> = memo(({ digit, color }) => {
  const segments = SEGMENT_MAP[digit] || SEGMENT_MAP['0'];

  return (
    <div
      className="relative select-none"
      style={{
        width: 'clamp(32px, 8vw, 84px)',
        height: 'clamp(60px, 15vw, 150px)',
      }}
    >
      <svg
        viewBox="0 0 100 180"
        className="w-full h-full"
        style={{ filter: `drop-shadow(0 0 12px ${color}80)` }}
      >
        {/* Segment a (Top horizontal) */}
        <polygon
          points="20,12 80,12 72,24 28,24"
          fill={color}
          opacity={segments[0] ? 0.95 : 0.08}
        />
        {/* Segment b (Top-right vertical) */}
        <polygon
          points="84,18 84,82 72,74 72,28"
          fill={color}
          opacity={segments[1] ? 0.95 : 0.08}
        />
        {/* Segment c (Bottom-right vertical) */}
        <polygon
          points="84,98 84,162 72,152 72,106"
          fill={color}
          opacity={segments[2] ? 0.95 : 0.08}
        />
        {/* Segment d (Bottom horizontal) */}
        <polygon
          points="28,156 72,156 80,168 20,168"
          fill={color}
          opacity={segments[3] ? 0.95 : 0.08}
        />
        {/* Segment e (Bottom-left vertical) */}
        <polygon
          points="16,98 28,106 28,152 16,162"
          fill={color}
          opacity={segments[4] ? 0.95 : 0.08}
        />
        {/* Segment f (Top-left vertical) */}
        <polygon
          points="16,18 28,28 28,74 16,82"
          fill={color}
          opacity={segments[5] ? 0.95 : 0.08}
        />
        {/* Segment g (Center horizontal) */}
        <polygon
          points="22,90 30,84 70,84 78,90 70,96 30,96"
          fill={color}
          opacity={segments[6] ? 0.95 : 0.08}
        />
      </svg>
    </div>
  );
});

SevenSegmentDigit.displayName = 'SevenSegmentDigit';

export const SevenSegmentClock: React.FC<SevenSegmentClockProps> = memo(
  ({ hoursStr, minutesStr, secondsStr, ampm, settings, resolvedAccentColor }) => {
    const hours = hoursStr.padStart(2, '0');
    const minutes = minutesStr.padStart(2, '0');
    const seconds = secondsStr.padStart(2, '0');

    // Default to classic alarm clock red or user's chosen accent color
    const ledColor = resolvedAccentColor || '#ef4444';
    const transparency = Math.max(0, Math.min(100, settings.clockFaceTransparency ?? 0));
    const bgAlpha = (0.9 * (1 - transparency / 100)).toFixed(3);

    return (
      <div
        id="seven-segment-display"
        className="flex items-center justify-center gap-1.5 sm:gap-3 p-4 sm:p-8 rounded-3xl border shadow-2xl my-auto select-none backdrop-blur-md transition-all duration-200"
        style={{
          backgroundColor: `rgba(0, 0, 0, ${bgAlpha})`,
          borderColor: Number(bgAlpha) > 0 ? `${ledColor}30` : 'transparent',
          boxShadow:
            Number(bgAlpha) > 0
              ? `0 20px 60px rgba(0,0,0,0.9), inset 0 0 40px rgba(0,0,0,0.8), 0 0 30px ${ledColor}20`
              : 'none',
        }}
      >
        {/* Hours */}
        <div className="flex items-center gap-1 sm:gap-2">
          <SevenSegmentDigit digit={hours[0]} color={ledColor} />
          <SevenSegmentDigit digit={hours[1]} color={ledColor} />
        </div>

        {/* Blinking Colon Dots */}
        <div className="flex flex-col gap-4 sm:gap-6 mx-1 sm:mx-3">
          <div
            className="w-2.5 h-2.5 sm:w-4 sm:h-4 rounded-full animate-pulse"
            style={{
              backgroundColor: ledColor,
              boxShadow: `0 0 12px ${ledColor}`,
            }}
          />
          <div
            className="w-2.5 h-2.5 sm:w-4 sm:h-4 rounded-full animate-pulse"
            style={{
              backgroundColor: ledColor,
              boxShadow: `0 0 12px ${ledColor}`,
            }}
          />
        </div>

        {/* Minutes */}
        <div className="flex items-center gap-1 sm:gap-2">
          <SevenSegmentDigit digit={minutes[0]} color={ledColor} />
          <SevenSegmentDigit digit={minutes[1]} color={ledColor} />
        </div>

        {/* Optional Seconds */}
        {settings.showSeconds && (
          <>
            <div className="flex flex-col gap-3 sm:gap-4 mx-1 sm:mx-2 opacity-80">
              <div
                className="w-1.5 h-1.5 sm:w-2.5 sm:h-2.5 rounded-full"
                style={{
                  backgroundColor: ledColor,
                  boxShadow: `0 0 8px ${ledColor}`,
                }}
              />
              <div
                className="w-1.5 h-1.5 sm:w-2.5 sm:h-2.5 rounded-full"
                style={{
                  backgroundColor: ledColor,
                  boxShadow: `0 0 8px ${ledColor}`,
                }}
              />
            </div>
            <div className="flex items-center gap-1 sm:gap-1.5 scale-90 sm:scale-95 origin-left">
              <SevenSegmentDigit digit={seconds[0]} color={ledColor} />
              <SevenSegmentDigit digit={seconds[1]} color={ledColor} />
            </div>
          </>
        )}

        {/* AM/PM */}
        {settings.showAmPm && settings.timeFormat === '12h' && (
          <div className="self-end pb-3 ml-2 sm:ml-4">
            <span
              className="font-mono text-xs sm:text-sm font-bold tracking-widest uppercase px-2 py-1 rounded border"
              style={{
                color: ledColor,
                borderColor: `${ledColor}60`,
                boxShadow: `0 0 10px ${ledColor}40`,
              }}
            >
              {ampm}
            </span>
          </div>
        )}
      </div>
    );
  }
);

SevenSegmentClock.displayName = 'SevenSegmentClock';
