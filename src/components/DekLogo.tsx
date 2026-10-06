import React from 'react';

interface DekLogoProps {
  size?: number | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  glow?: boolean;
  animated?: boolean;
  onClick?: () => void;
}

export const DekLogo: React.FC<DekLogoProps> = ({
  size = 'md',
  className = '',
  glow = true,
  animated = false,
  onClick,
}) => {
  const pixelSize =
    typeof size === 'number'
      ? size
      : size === 'sm'
      ? 36
      : size === 'md'
      ? 48
      : size === 'lg'
      ? 96
      : 128;

  const idSuffix = React.useId().replace(/[^a-zA-Z0-9]/g, '');

  return (
    <div
      onClick={onClick}
      className={`relative inline-flex items-center justify-center shrink-0 select-none ${className}`}
      style={{ width: pixelSize, height: pixelSize }}
    >
      {/* Ambient Outer Aura Glow */}
      {glow && (
        <div
          className={`absolute inset-0 rounded-[28%] bg-gradient-to-br from-amber-500/35 via-amber-600/20 to-orange-600/10 blur-xl pointer-events-none ${
            animated ? 'animate-pulse' : ''
          }`}
          style={{ transform: 'scale(1.18)' }}
        />
      )}

      {/* SVG Bespoke Clock Emblem */}
      <svg
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full relative z-10 drop-shadow-[0_8px_20px_rgba(0,0,0,0.5)]"
      >
        <defs>
          {/* Bezel Gradient */}
          <linearGradient id={`clock-bezel-${idSuffix}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#fde68a" />
            <stop offset="35%" stopColor="#f59e0b" />
            <stop offset="70%" stopColor="#d97706" />
            <stop offset="100%" stopColor="#b45309" />
          </linearGradient>

          {/* Dial Face Obsidian Radial */}
          <radialGradient id={`clock-face-${idSuffix}`} cx="50%" cy="40%" r="62%">
            <stop offset="0%" stopColor="#1e2230" />
            <stop offset="50%" stopColor="#12151f" />
            <stop offset="100%" stopColor="#080a0f" />
          </radialGradient>

          {/* Golden Hand Gradient */}
          <linearGradient id={`clock-gold-hand-${idSuffix}`} x1="0%" y1="100%" x2="0%" y2="0%">
            <stop offset="0%" stopColor="#f59e0b" />
            <stop offset="50%" stopColor="#fbbf24" />
            <stop offset="100%" stopColor="#ffffff" />
          </linearGradient>

          {/* Minute Hand Gradient */}
          <linearGradient id={`clock-min-hand-${idSuffix}`} x1="0%" y1="100%" x2="0%" y2="0%">
            <stop offset="0%" stopColor="#d97706" />
            <stop offset="50%" stopColor="#f59e0b" />
            <stop offset="100%" stopColor="#fef08a" />
          </linearGradient>

          {/* Precision Ring Glow Arc */}
          <linearGradient id={`clock-arc-${idSuffix}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#fbbf24" stopOpacity="0.95" />
            <stop offset="60%" stopColor="#f59e0b" stopOpacity="0.45" />
            <stop offset="100%" stopColor="#f59e0b" stopOpacity="0" />
          </linearGradient>

          {/* Soft Shadow Filter for Hands */}
          <filter id={`clock-shadow-${idSuffix}`} x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="1.5" stdDeviation="2" floodColor="#000000" floodOpacity="0.8" />
          </filter>
        </defs>

        {/* Outer Squircle Chassis with Chamfered Warm Gold Bezel */}
        <rect
          x="3"
          y="3"
          width="94"
          height="94"
          rx="27"
          fill={`url(#clock-bezel-${idSuffix})`}
        />

        {/* Obsidian Glass Dial Face */}
        <rect
          x="5.5"
          y="5.5"
          width="89"
          height="89"
          rx="24.5"
          fill={`url(#clock-face-${idSuffix})`}
        />

        {/* Outer Circular Bezel Groove */}
        <circle
          cx="50"
          cy="50"
          r="41"
          stroke="rgba(245, 158, 11, 0.15)"
          strokeWidth="0.8"
        />

        {/* Inner Precision Chronometer Chapter Ring */}
        <circle
          cx="50"
          cy="50"
          r="37.5"
          stroke="rgba(245, 158, 11, 0.22)"
          strokeWidth="1"
          strokeDasharray="1.5 2.5"
        />

        {/* Concentric Inner Dial Track */}
        <circle
          cx="50"
          cy="50"
          r="26"
          stroke="rgba(245, 158, 11, 0.14)"
          strokeWidth="0.8"
        />

        {/* Active Focus Arc Accent along top perimeter */}
        <path
          d="M 50 12.5 A 37.5 37.5 0 0 1 87.5 50"
          stroke={`url(#clock-arc-${idSuffix})`}
          strokeWidth="2.5"
          strokeLinecap="round"
        />

        {/* 12 Hour Index Markers */}
        {/* 12 o'clock Crown Double Baton */}
        <line x1="48.2" y1="13" x2="48.2" y2="20" stroke="#fef08a" strokeWidth="1.8" strokeLinecap="round" />
        <line x1="51.8" y1="13" x2="51.8" y2="20" stroke="#fef08a" strokeWidth="1.8" strokeLinecap="round" />

        {/* Cardinal Markers: 3, 6, 9 */}
        <line x1="87" y1="50" x2="80" y2="50" stroke="#fbbf24" strokeWidth="2.2" strokeLinecap="round" />
        <line x1="50" y1="87" x2="50" y2="80" stroke="#fbbf24" strokeWidth="2.2" strokeLinecap="round" />
        <line x1="13" y1="50" x2="20" y2="50" stroke="#fbbf24" strokeWidth="2.2" strokeLinecap="round" />

        {/* Hour Batons: 1, 2, 4, 5, 7, 8, 10, 11 */}
        {[30, 60, 120, 150, 210, 240, 300, 330].map((deg) => (
          <line
            key={deg}
            x1="50"
            y1="13.5"
            x2="50"
            y2="18.5"
            stroke="rgba(245, 158, 11, 0.55)"
            strokeWidth="1.6"
            strokeLinecap="round"
            transform={`rotate(${deg} 50 50)`}
          />
        ))}

        {/* Subtle 60-Second Minute Dots around rim */}
        {[15, 45, 75, 105, 135, 165, 195, 225, 255, 285, 315, 345].map((deg) => (
          <circle
            key={deg}
            cx="50"
            cy="13.5"
            r="0.8"
            fill="rgba(245, 158, 11, 0.4)"
            transform={`rotate(${deg} 50 50)`}
          />
        ))}

        {/* Hands Group with Realistic Watch Shadow */}
        <g filter={`url(#clock-shadow-${idSuffix})`}>
          {/* Hour Hand (Classic 10:10 stance - pointing at ~10:08 / 304°) */}
          <g transform="rotate(304 50 50)">
            {/* Counterweight */}
            <line x1="50" y1="50" x2="50" y2="56" stroke="#b45309" strokeWidth="2.4" strokeLinecap="round" />
            {/* Main Hand Blade */}
            <line
              x1="50"
              y1="50"
              x2="50"
              y2="29"
              stroke={`url(#clock-gold-hand-${idSuffix})`}
              strokeWidth="2.8"
              strokeLinecap="round"
            />
            {/* Luminous Channel Core */}
            <line x1="50" y1="46" x2="50" y2="31" stroke="#ffffff" strokeWidth="1" strokeLinecap="round" opacity="0.9" />
          </g>

          {/* Minute Hand (pointing at ~2:10 / 56°) */}
          <g transform="rotate(56 50 50)">
            {/* Counterweight */}
            <line x1="50" y1="50" x2="50" y2="58" stroke="#92400e" strokeWidth="2" strokeLinecap="round" />
            {/* Main Hand Blade */}
            <line
              x1="50"
              y1="50"
              x2="50"
              y2="21"
              stroke={`url(#clock-min-hand-${idSuffix})`}
              strokeWidth="2.2"
              strokeLinecap="round"
            />
            {/* Luminous Channel Core */}
            <line x1="50" y1="46" x2="50" y2="23" stroke="#ffffff" strokeWidth="0.8" strokeLinecap="round" opacity="0.9" />
          </g>

          {/* Second Hand (High-visibility slim needle with open-ring counterweight pointing at ~18°) */}
          <g transform="rotate(18 50 50)">
            {/* Ring Counterbalance */}
            <circle cx="50" cy="59" r="2.4" fill="none" stroke="#f97316" strokeWidth="1" />
            <line x1="50" y1="50" x2="50" y2="56.6" stroke="#f97316" strokeWidth="1" />
            {/* Needle shaft */}
            <line x1="50" y1="50" x2="50" y2="15" stroke="#f97316" strokeWidth="1" strokeLinecap="round" />
            {/* Arrowhead / Needle Tip Accent */}
            <line x1="50" y1="18" x2="50" y2="15" stroke="#fbbf24" strokeWidth="1.5" strokeLinecap="round" />
          </g>

          {/* Center Multi-Tier Watch Pinion */}
          <circle cx="50" cy="50" r="4.2" fill="#78350f" />
          <circle cx="50" cy="50" r="3.2" fill={`url(#clock-bezel-${idSuffix})`} />
          <circle cx="50" cy="50" r="1.5" fill="#ffffff" />
        </g>

        {/* Curved Lens Glare Reflection (Crystal Glass Reflection across top) */}
        <path
          d="M 8 28 C 8 16 16 8 28 8 L 84 8 C 45 22 22 45 8 84 Z"
          fill="rgba(255, 255, 255, 0.05)"
          pointerEvents="none"
        />
      </svg>
    </div>
  );
};
