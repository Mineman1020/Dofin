import React, { memo, useEffect, useState } from 'react';
import { ClockSettings } from '../../types';

interface AnalogClockProps {
  date: Date;
  ampm: string;
  settings: ClockSettings;
  resolvedTextColor: string;
  resolvedAccentColor: string;
  isLight: boolean;
}

export const AnalogClock: React.FC<AnalogClockProps> = memo(
  ({ date, ampm, settings, resolvedTextColor, resolvedAccentColor, isLight }) => {
    const [smoothTime, setSmoothTime] = useState<Date>(date);

    useEffect(() => {
      let animId: number;
      const updateSmooth = () => {
        setSmoothTime(new Date());
        animId = requestAnimationFrame(updateSmooth);
      };
      animId = requestAnimationFrame(updateSmooth);
      return () => cancelAnimationFrame(animId);
    }, []);

    const hours = smoothTime.getHours() % 12;
    const minutes = smoothTime.getMinutes();
    const seconds = smoothTime.getSeconds();
    const millis = smoothTime.getMilliseconds();

    // Smooth rotations in degrees
    const secondsAngle = ((seconds + millis / 1000) / 60) * 360;
    const minutesAngle = ((minutes + seconds / 60) / 60) * 360;
    const hoursAngle = ((hours + minutes / 60 + seconds / 3600) / 12) * 360;

    const transparency = Math.max(0, Math.min(100, settings.clockFaceTransparency ?? 0));
    const faceAlpha = 1 - transparency / 100;

    return (
      <div
        id="analog-clock-display"
        className="relative flex items-center justify-center select-none my-auto"
        style={{
          width: 'clamp(260px, 36vw, 340px)',
          height: 'clamp(260px, 36vw, 340px)',
        }}
      >
        {/* Watch Outer Bezel & Case */}
        <div
          className="relative w-full h-full rounded-full border-4 shadow-2xl transition-all duration-300 flex items-center justify-center backdrop-blur-md"
          style={{
            borderColor: `${resolvedAccentColor}50`,
            background: isLight
              ? `radial-gradient(circle, rgba(255,255,255,${(0.95 * faceAlpha).toFixed(3)}) 0%, rgba(230,230,235,${(0.85 * faceAlpha).toFixed(3)}) 100%)`
              : `radial-gradient(circle, rgba(25,25,32,${(0.95 * faceAlpha).toFixed(3)}) 0%, rgba(5,5,10,${(0.9 * faceAlpha).toFixed(3)}) 100%)`,
            boxShadow: isLight
              ? `0 20px 50px rgba(0,0,0,0.15), inset 0 2px 6px rgba(255,255,255,0.8), 0 0 30px ${resolvedAccentColor}15`
              : `0 25px 60px rgba(0,0,0,0.9), inset 0 2px 8px rgba(255,255,255,0.1), 0 0 35px ${resolvedAccentColor}20`,
          }}
        >
          {/* Radial Hour Markers 1 to 12 */}
          {Array.from({ length: 12 }).map((_, i) => {
            const num = i + 1;
            const angle = (num / 12) * 360;
            const isQuarter = num % 3 === 0;

            return (
              <div
                key={num}
                className="absolute inset-0 flex items-start justify-center pointer-events-none"
                style={{ transform: `rotate(${angle}deg)` }}
              >
                {/* Marker Pip */}
                <div
                  className={`mt-3 rounded-full transition-all ${
                    isQuarter ? 'w-2 h-5' : 'w-1 h-3.5'
                  }`}
                  style={{
                    backgroundColor: isQuarter ? resolvedAccentColor : resolvedTextColor,
                    opacity: isQuarter ? 0.95 : 0.65,
                    boxShadow: isQuarter ? `0 0 10px ${resolvedAccentColor}60` : undefined,
                  }}
                />
              </div>
            );
          })}

          {/* Subdial Center: AM/PM & Brand Mark */}
          <div className="flex flex-col items-center justify-center gap-1 z-10 pointer-events-none">
            <span
              className="text-[10px] sm:text-xs font-mono font-bold tracking-widest uppercase opacity-80"
              style={{ color: resolvedTextColor }}
            >
              CHRONOS
            </span>
            {settings.showAmPm && (
              <span
                className="text-[9px] font-mono font-bold px-2 py-0.5 rounded-full border"
                style={{
                  color: resolvedAccentColor,
                  borderColor: `${resolvedAccentColor}40`,
                  backgroundColor: `${resolvedAccentColor}15`,
                }}
              >
                {ampm}
              </span>
            )}
          </div>

          {/* Hour Hand */}
          <div
            className="absolute inset-0 flex items-center justify-center pointer-events-none z-20"
            style={{ transform: `rotate(${hoursAngle}deg)` }}
          >
            <div
              className="w-2.5 sm:w-3 rounded-full shadow-lg origin-bottom -translate-y-1/2"
              style={{
                height: '28%',
                backgroundColor: resolvedTextColor,
                boxShadow: '0 2px 8px rgba(0,0,0,0.5)',
              }}
            />
          </div>

          {/* Minute Hand */}
          <div
            className="absolute inset-0 flex items-center justify-center pointer-events-none z-25"
            style={{ transform: `rotate(${minutesAngle}deg)` }}
          >
            <div
              className="w-1.5 sm:w-2 rounded-full shadow-lg origin-bottom -translate-y-1/2"
              style={{
                height: '40%',
                backgroundColor: resolvedTextColor,
                boxShadow: '0 3px 10px rgba(0,0,0,0.5)',
              }}
            />
          </div>

          {/* Optional Second Hand with Sweeping Motion */}
          {settings.showSeconds && (
            <div
              className="absolute inset-0 flex items-center justify-center pointer-events-none z-30"
              style={{ transform: `rotate(${secondsAngle}deg)` }}
            >
              <div
                className="w-0.5 sm:w-1 rounded-full origin-bottom -translate-y-1/2"
                style={{
                  height: '46%',
                  backgroundColor: resolvedAccentColor,
                  boxShadow: `0 0 12px ${resolvedAccentColor}`,
                }}
              />
              {/* Counter-balance tail */}
              <div
                className="w-1 sm:w-1.5 rounded-full origin-top translate-y-1"
                style={{
                  height: '10%',
                  backgroundColor: resolvedAccentColor,
                }}
              />
            </div>
          )}

          {/* Center Pivot Pin Cap */}
          <div
            className="absolute w-4 h-4 sm:w-5 sm:h-5 rounded-full z-40 border-2 shadow-md"
            style={{
              backgroundColor: resolvedAccentColor,
              borderColor: isLight ? '#ffffff' : '#000000',
              boxShadow: '0 2px 6px rgba(0,0,0,0.6)',
            }}
          />
        </div>
      </div>
    );
  }
);

AnalogClock.displayName = 'AnalogClock';
