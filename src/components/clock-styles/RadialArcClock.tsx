import React, { memo } from 'react';
import { ClockSettings } from '../../types';

interface RadialArcClockProps {
  date: Date;
  hoursStr: string;
  minutesStr: string;
  secondsStr: string;
  ampm: string;
  settings: ClockSettings;
  resolvedTextColor: string;
  resolvedAccentColor: string;
  isLight: boolean;
}

export const RadialArcClock: React.FC<RadialArcClockProps> = memo(
  ({
    date,
    hoursStr,
    minutesStr,
    secondsStr,
    ampm,
    settings,
    resolvedTextColor,
    resolvedAccentColor,
    isLight,
  }) => {
    const hours = (date.getHours() % (settings.timeFormat === '24h' ? 24 : 12)) || 12;
    const maxHours = settings.timeFormat === '24h' ? 24 : 12;
    const minutes = date.getMinutes();
    const seconds = date.getSeconds();

    // Arc progress calculations (0 to 1)
    const hoursProgress = hours / maxHours;
    const minutesProgress = minutes / 60;
    const secondsProgress = seconds / 60;

    const size = 380;
    const strokeWidth = 10;
    const center = size / 2;

    // Radii for concentric rings
    const rSeconds = 160;
    const rMinutes = 135;
    const rHours = 110;

    const cSeconds = 2 * Math.PI * rSeconds;
    const cMinutes = 2 * Math.PI * rMinutes;
    const cHours = 2 * Math.PI * rHours;

    const transparency = Math.max(0, Math.min(100, settings.clockFaceTransparency ?? 0));
    const faceAlpha = 1 - transparency / 100;

    return (
      <div
        id="radial-arc-clock-display"
        className="relative flex items-center justify-center select-none my-auto rounded-full"
        style={{
          width: 'clamp(260px, 36vw, 340px)',
          height: 'clamp(260px, 36vw, 340px)',
          background: faceAlpha > 0 ? (isLight ? `radial-gradient(circle, rgba(255,255,255,${(0.8 * faceAlpha).toFixed(3)}) 0%, rgba(240,240,245,${(0.6 * faceAlpha).toFixed(3)}) 100%)` : `radial-gradient(circle, rgba(20,20,28,${(0.85 * faceAlpha).toFixed(3)}) 0%, rgba(5,5,10,${(0.7 * faceAlpha).toFixed(3)}) 100%)`) : 'transparent',
          boxShadow: faceAlpha > 0 ? `0 10px 40px rgba(0,0,0,${(0.4 * faceAlpha).toFixed(2)})` : 'none',
        }}
      >
        <svg
          viewBox={`0 0 ${size} ${size}`}
          className="w-full h-full transform -rotate-90"
        >
          {/* Track 1 (Outer - Seconds) */}
          <circle
            cx={center}
            cy={center}
            r={rSeconds}
            fill="transparent"
            stroke={isLight ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.08)'}
            strokeWidth={strokeWidth}
          />
          {/* Progress 1 (Seconds) */}
          <circle
            cx={center}
            cy={center}
            r={rSeconds}
            fill="transparent"
            stroke={resolvedAccentColor}
            strokeWidth={strokeWidth}
            strokeDasharray={cSeconds}
            strokeDashoffset={cSeconds * (1 - secondsProgress)}
            strokeLinecap="round"
            className="transition-all duration-300 ease-linear"
            style={{
              filter: `drop-shadow(0 0 8px ${resolvedAccentColor}90)`,
            }}
          />

          {/* Track 2 (Middle - Minutes) */}
          <circle
            cx={center}
            cy={center}
            r={rMinutes}
            fill="transparent"
            stroke={isLight ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.08)'}
            strokeWidth={strokeWidth}
          />
          {/* Progress 2 (Minutes) */}
          <circle
            cx={center}
            cy={center}
            r={rMinutes}
            fill="transparent"
            stroke={resolvedTextColor}
            strokeWidth={strokeWidth}
            strokeDasharray={cMinutes}
            strokeDashoffset={cMinutes * (1 - minutesProgress)}
            strokeLinecap="round"
            className="transition-all duration-500 ease-out"
            style={{
              opacity: 0.9,
            }}
          />

          {/* Track 3 (Inner - Hours) */}
          <circle
            cx={center}
            cy={center}
            r={rHours}
            fill="transparent"
            stroke={isLight ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.08)'}
            strokeWidth={strokeWidth}
          />
          {/* Progress 3 (Hours) */}
          <circle
            cx={center}
            cy={center}
            r={rHours}
            fill="transparent"
            stroke={resolvedAccentColor}
            strokeWidth={strokeWidth}
            strokeDasharray={cHours}
            strokeDashoffset={cHours * (1 - hoursProgress)}
            strokeLinecap="round"
            className="transition-all duration-700 ease-out"
            style={{
              filter: `drop-shadow(0 0 6px ${resolvedAccentColor}60)`,
            }}
          />
        </svg>

        {/* Center Digital Display Core */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
          <div className="flex items-center gap-1 font-mono font-bold leading-none">
            <span
              className="text-3xl sm:text-5xl"
              style={{ color: resolvedTextColor }}
            >
              {hoursStr}:{minutesStr}
            </span>
            {settings.showSeconds && (
              <span
                className="text-lg sm:text-2xl opacity-75 font-light"
                style={{ color: resolvedAccentColor }}
              >
                .{secondsStr}
              </span>
            )}
          </div>

          {settings.showAmPm && settings.timeFormat === '12h' && (
            <span
              className="text-[10px] sm:text-xs font-mono font-bold uppercase tracking-widest mt-2 px-2 py-0.5 rounded border"
              style={{
                borderColor: `${resolvedAccentColor}40`,
                color: resolvedAccentColor,
              }}
            >
              {ampm}
            </span>
          )}

          {/* Ring Legend */}
          <div className="flex items-center gap-2 mt-2 text-[8px] font-mono uppercase text-neutral-400">
            <span>● SEC</span>
            <span>● MIN</span>
            <span>● HRS</span>
          </div>
        </div>
      </div>
    );
  }
);

RadialArcClock.displayName = 'RadialArcClock';
