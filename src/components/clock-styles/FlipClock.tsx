import React, { memo } from 'react';
import { ClockSettings } from '../../types';
import { getClockDigitTextStyle } from '../../utils/gradientPresets';

interface FlipClockProps {
  hoursStr: string;
  minutesStr: string;
  secondsStr: string;
  ampm: string;
  settings: ClockSettings;
  resolvedTextColor: string;
  resolvedAccentColor: string;
  isLight: boolean;
}

// Single Flip Card Panel with realistic center split line and 3D depth
const FlipDigitCard: React.FC<{
  digit: string;
  label?: string;
  isLight: boolean;
  accentColor: string;
  fontFamily: string;
  cardAlpha: number;
  settings: ClockSettings;
}> = memo(({ digit, label, isLight, accentColor, fontFamily, cardAlpha, settings }) => {
  const digitStyle = getClockDigitTextStyle(settings, accentColor);

  return (
    <div className="flex flex-col items-center">
      <div
        className="relative flex items-center justify-center rounded-xl sm:rounded-2xl border select-none overflow-hidden transition-all duration-300 backdrop-blur-md"
        style={{
          width: 'clamp(54px, 12vw, 130px)',
          height: 'clamp(76px, 16vw, 180px)',
          perspective: '1000px',
          backgroundColor:
            cardAlpha > 0
              ? isLight
                ? `rgba(240, 240, 245, ${(0.95 * cardAlpha).toFixed(3)})`
                : `rgba(20, 20, 26, ${(0.95 * cardAlpha).toFixed(3)})`
              : 'transparent',
          borderColor:
            cardAlpha > 0
              ? isLight
                ? `rgba(0, 0, 0, ${(0.15 * cardAlpha).toFixed(2)})`
                : `${accentColor}35`
              : 'transparent',
          boxShadow:
            cardAlpha > 0
              ? isLight
                ? '0 10px 25px rgba(0,0,0,0.1)'
                : '0 15px 35px rgba(0,0,0,0.7)'
              : 'none',
        }}
      >
        {/* Top Half Highlight Sheen */}
        {cardAlpha > 0 && (
          <div
            className="absolute top-0 left-0 right-0 h-1/2 opacity-30 pointer-events-none"
            style={{
              background: isLight
                ? 'linear-gradient(180deg, rgba(255,255,255,0.8) 0%, rgba(255,255,255,0) 100%)'
                : 'linear-gradient(180deg, rgba(255,255,255,0.15) 0%, rgba(255,255,255,0) 100%)',
            }}
          />
        )}

        {/* Center Split Horizontal Crease Line */}
        <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-[2px] bg-black/60 z-20 shadow-sm opacity-70" />
        <div className="absolute left-0 right-0 top-1/2 h-[1px] bg-white/10 z-20" />

        {/* Side Metallic Pivot Pins */}
        <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 w-2 h-4 rounded-r-md bg-neutral-600/80 z-25 border border-black/40" />
        <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 w-2 h-4 rounded-l-md bg-neutral-600/80 z-25 border border-black/40" />

        {/* Big Digit Character */}
        <span
          className="font-bold tracking-tight font-mono z-10 leading-none"
          style={{
            fontFamily,
            fontSize: 'clamp(44px, 9.5vw, 110px)',
            ...digitStyle,
            textShadow:
              settings.colorMode && settings.colorMode !== 'solid'
                ? 'none'
                : isLight
                ? '0 2px 4px rgba(0,0,0,0.15)'
                : `0 4px 16px rgba(0,0,0,0.8), 0 0 20px ${accentColor}40`,
          }}
        >
          {digit}
        </span>
      </div>

      {label && (
        <span className="text-[10px] sm:text-xs font-mono uppercase tracking-widest text-neutral-400 mt-2 font-bold">
          {label}
        </span>
      )}
    </div>
  );
});

FlipDigitCard.displayName = 'FlipDigitCard';

export const FlipClock: React.FC<FlipClockProps> = memo(
  ({
    hoursStr,
    minutesStr,
    secondsStr,
    ampm,
    settings,
    resolvedTextColor,
    resolvedAccentColor,
    isLight,
  }) => {
    const hours = hoursStr.padStart(2, '0');
    const minutes = minutesStr.padStart(2, '0');
    const seconds = secondsStr.padStart(2, '0');
    const transparency = Math.max(0, Math.min(100, settings.clockFaceTransparency ?? 0));
    const cardAlpha = 1 - transparency / 100;

    return (
      <div
        id="flip-clock-display"
        className="flex items-center justify-center gap-2 sm:gap-4 md:gap-6 my-auto select-none"
      >
        {/* Hours Pair */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          <FlipDigitCard
            digit={hours[0]}
            isLight={isLight}
            accentColor={resolvedTextColor}
            fontFamily={settings.fontFamily}
            cardAlpha={cardAlpha}
            settings={settings}
          />
          <FlipDigitCard
            digit={hours[1]}
            label="HOURS"
            isLight={isLight}
            accentColor={resolvedTextColor}
            fontFamily={settings.fontFamily}
            cardAlpha={cardAlpha}
            settings={settings}
          />
        </div>

        {/* Colon Divider Dots */}
        <div className="flex flex-col gap-3 sm:gap-4 mx-1 sm:mx-2 z-10">
          <div
            className="w-2.5 h-2.5 sm:w-3.5 sm:h-3.5 rounded-full shadow-lg transition-transform animate-pulse"
            style={{ backgroundColor: resolvedAccentColor }}
          />
          <div
            className="w-2.5 h-2.5 sm:w-3.5 sm:h-3.5 rounded-full shadow-lg transition-transform animate-pulse"
            style={{ backgroundColor: resolvedAccentColor }}
          />
        </div>

        {/* Minutes Pair */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          <FlipDigitCard
            digit={minutes[0]}
            isLight={isLight}
            accentColor={resolvedTextColor}
            fontFamily={settings.fontFamily}
            cardAlpha={cardAlpha}
            settings={settings}
          />
          <FlipDigitCard
            digit={minutes[1]}
            label="MINUTES"
            isLight={isLight}
            accentColor={resolvedTextColor}
            fontFamily={settings.fontFamily}
            cardAlpha={cardAlpha}
            settings={settings}
          />
        </div>

        {/* Optional Seconds Pair */}
        {settings.showSeconds && (
          <>
            <div className="flex flex-col gap-3 sm:gap-4 mx-1 sm:mx-2 z-10 opacity-75">
              <div
                className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full"
                style={{ backgroundColor: resolvedAccentColor }}
              />
              <div
                className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full"
                style={{ backgroundColor: resolvedAccentColor }}
              />
            </div>

            <div className="flex items-center gap-1.5 sm:gap-2">
              <FlipDigitCard
                digit={seconds[0]}
                isLight={isLight}
                accentColor={resolvedAccentColor}
                fontFamily={settings.fontFamily}
                cardAlpha={cardAlpha}
                settings={settings}
              />
              <FlipDigitCard
                digit={seconds[1]}
                label="SECONDS"
                isLight={isLight}
                accentColor={resolvedAccentColor}
                fontFamily={settings.fontFamily}
                cardAlpha={cardAlpha}
                settings={settings}
              />
            </div>
          </>
        )}

        {/* AM / PM Badge */}
        {settings.showAmPm && settings.timeFormat === '12h' && (
          <div className="self-center ml-2 sm:ml-4">
            <span
              className="font-mono text-xs sm:text-sm font-bold uppercase tracking-widest px-3 py-1.5 rounded-xl border shadow-md inline-block"
              style={{
                borderColor: `${resolvedAccentColor}50`,
                backgroundColor: `${resolvedAccentColor}15`,
                color: resolvedAccentColor,
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

FlipClock.displayName = 'FlipClock';
