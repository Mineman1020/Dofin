import React, { memo } from 'react';
import { ClockSettings } from '../../types';

interface CyberpunkClockProps {
  hoursStr: string;
  minutesStr: string;
  secondsStr: string;
  ampm: string;
  settings: ClockSettings;
  resolvedAccentColor: string;
  digitTextStyle: React.CSSProperties;
}

export const CyberpunkClock: React.FC<CyberpunkClockProps> = memo(
  ({
    hoursStr,
    minutesStr,
    secondsStr,
    ampm,
    settings,
    resolvedAccentColor,
    digitTextStyle,
  }) => {
    const cyberColor = resolvedAccentColor || '#06b6d4';
    const transparency = Math.max(0, Math.min(100, settings.clockFaceTransparency ?? 0));
    const bgAlpha = (0.85 * (1 - transparency / 100)).toFixed(3);

    return (
      <div
        id="cyberpunk-hud-display"
        className="relative p-5 sm:p-7 rounded-2xl border shadow-2xl backdrop-blur-xl select-none my-auto max-w-xl sm:max-w-2xl mx-auto transition-all duration-200"
        style={{
          backgroundColor: `rgba(0, 0, 0, ${bgAlpha})`,
          borderColor: `${cyberColor}40`,
          boxShadow: `0 0 50px ${cyberColor}25, inset 0 0 30px ${cyberColor}10`,
        }}
      >
        {/* HUD Corner Brackets */}
        <div className="absolute top-2 left-2 w-4 h-4 border-t-2 border-l-2" style={{ borderColor: cyberColor }} />
        <div className="absolute top-2 right-2 w-4 h-4 border-t-2 border-r-2" style={{ borderColor: cyberColor }} />
        <div className="absolute bottom-2 left-2 w-4 h-4 border-b-2 border-l-2" style={{ borderColor: cyberColor }} />
        <div className="absolute bottom-2 right-2 w-4 h-4 border-b-2 border-r-2" style={{ borderColor: cyberColor }} />

        {/* Top HUD Telemetry Bar */}
        <div
          className="flex items-center justify-between text-[10px] font-mono uppercase tracking-widest border-b pb-2 mb-4"
          style={{ color: cyberColor, borderColor: `${cyberColor}30` }}
        >
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full animate-ping" style={{ backgroundColor: cyberColor }} />
            <span>SYS.CHRONO // V.4.2</span>
          </div>
          <div className="flex items-center gap-3">
            <span>SYNC: 100%</span>
            <span className="text-emerald-400">ONLINE</span>
          </div>
        </div>

        {/* Big Neon Time Readout */}
        <div className="flex items-center justify-center gap-2 sm:gap-4 font-mono font-black tracking-wider leading-none py-2">
          {/* Hours */}
          <span
            className="text-5xl sm:text-7xl md:text-8xl lg:text-9xl"
            style={{
              ...digitTextStyle,
              filter: `drop-shadow(0 0 25px ${cyberColor}80)`,
            }}
          >
            {hoursStr}
          </span>

          {/* Glitch Colon */}
          <span
            className="text-4xl sm:text-6xl md:text-7xl lg:text-8xl animate-pulse"
            style={{ color: cyberColor, textShadow: `0 0 20px ${cyberColor}` }}
          >
            :
          </span>

          {/* Minutes */}
          <span
            className="text-5xl sm:text-7xl md:text-8xl lg:text-9xl"
            style={{
              ...digitTextStyle,
              filter: `drop-shadow(0 0 25px ${cyberColor}80)`,
            }}
          >
            {minutesStr}
          </span>

          {/* Seconds */}
          {settings.showSeconds && (
            <div className="flex items-baseline">
              <span className="text-2xl sm:text-4xl md:text-5xl mr-1 opacity-70" style={{ color: cyberColor }}>:</span>
              <span
                className="text-3xl sm:text-5xl md:text-6xl"
                style={{ color: cyberColor, textShadow: `0 0 15px ${cyberColor}` }}
              >
                {secondsStr}
              </span>
            </div>
          )}

          {/* AM / PM */}
          {settings.showAmPm && settings.timeFormat === '12h' && (
            <span
              className="text-xs sm:text-sm font-bold tracking-widest px-2.5 py-1 rounded ml-2 self-start mt-2 border"
              style={{
                color: cyberColor,
                borderColor: `${cyberColor}60`,
                backgroundColor: `${cyberColor}15`,
              }}
            >
              {ampm}
            </span>
          )}
        </div>

        {/* Bottom HUD Bar */}
        <div
          className="flex items-center justify-between text-[9px] font-mono uppercase tracking-widest border-t pt-2 mt-4 opacity-75"
          style={{ color: cyberColor, borderColor: `${cyberColor}30` }}
        >
          <span>SEC: ENCRYPTED // AES-256</span>
          <span>LOCATION: LOCAL HOST</span>
        </div>
      </div>
    );
  }
);

CyberpunkClock.displayName = 'CyberpunkClock';
