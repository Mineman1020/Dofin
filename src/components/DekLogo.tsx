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

      {/* SVG Bespoke Emblem */}
      <svg
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full relative z-10 drop-shadow-[0_8px_20px_rgba(0,0,0,0.5)]"
      >
        <defs>
          {/* Bezel Gradient */}
          <linearGradient id={`dek-bezel-${idSuffix}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#fde68a" />
            <stop offset="35%" stopColor="#f59e0b" />
            <stop offset="70%" stopColor="#d97706" />
            <stop offset="100%" stopColor="#b45309" />
          </linearGradient>

          {/* Dial Face Obsidian Radial */}
          <radialGradient id={`dek-face-${idSuffix}`} cx="50%" cy="40%" r="60%">
            <stop offset="0%" stopColor="#1e2230" />
            <stop offset="50%" stopColor="#12151f" />
            <stop offset="100%" stopColor="#080a0f" />
          </radialGradient>

          {/* Golden Core Monogram Gradient */}
          <linearGradient id={`dek-gold-core-${idSuffix}`} x1="20%" y1="15%" x2="85%" y2="85%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="25%" stopColor="#fef08a" />
            <stop offset="55%" stopColor="#f59e0b" />
            <stop offset="100%" stopColor="#ea580c" />
          </linearGradient>

          {/* Precision Ring Glow */}
          <linearGradient id={`dek-arc-${idSuffix}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#fbbf24" stopOpacity="0.9" />
            <stop offset="60%" stopColor="#f59e0b" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#f59e0b" stopOpacity="0" />
          </linearGradient>

          {/* Inner Shadow Filter */}
          <filter id={`dek-shadow-${idSuffix}`} x="-10%" y="-10%" width="120%" height="120%">
            <feDropShadow dx="0" dy="2" stdDeviation="2.5" floodColor="#000000" floodOpacity="0.75" />
          </filter>
        </defs>

        {/* Outer Squircle Case with Polished Chamfer */}
        <rect
          x="3"
          y="3"
          width="94"
          height="94"
          rx="27"
          fill={`url(#dek-bezel-${idSuffix})`}
        />

        {/* Obsidian Dial Glass */}
        <rect
          x="5.5"
          y="5.5"
          width="89"
          height="89"
          rx="24.5"
          fill={`url(#dek-face-${idSuffix})`}
        />

        {/* Inner Precision Chronometer Dial Track */}
        <circle
          cx="50"
          cy="50"
          r="38"
          stroke="rgba(245, 158, 11, 0.18)"
          strokeWidth="1.2"
          strokeDasharray="2 3"
        />

        {/* Cardinal Meridian Ticks (12, 3, 6, 9) */}
        <line x1="50" y1="14" x2="50" y2="18" stroke="#fbbf24" strokeWidth="2" strokeLinecap="round" />
        <line x1="86" y1="50" x2="82" y2="50" stroke="rgba(245, 158, 11, 0.5)" strokeWidth="1.5" strokeLinecap="round" />
        <line x1="50" y1="86" x2="50" y2="82" stroke="rgba(245, 158, 11, 0.5)" strokeWidth="1.5" strokeLinecap="round" />
        <line x1="14" y1="50" x2="18" y2="50" stroke="rgba(245, 158, 11, 0.5)" strokeWidth="1.5" strokeLinecap="round" />

        {/* Diagonal Chrono Ticks */}
        <line x1="75.4" y1="24.6" x2="72.6" y2="27.4" stroke="rgba(245, 158, 11, 0.3)" strokeWidth="1.2" strokeLinecap="round" />
        <line x1="75.4" y1="75.4" x2="72.6" y2="72.6" stroke="rgba(245, 158, 11, 0.3)" strokeWidth="1.2" strokeLinecap="round" />
        <line x1="24.6" y1="75.4" x2="27.4" y2="72.6" stroke="rgba(245, 158, 11, 0.3)" strokeWidth="1.2" strokeLinecap="round" />
        <line x1="24.6" y1="24.6" x2="27.4" y2="27.4" stroke="rgba(245, 158, 11, 0.3)" strokeWidth="1.2" strokeLinecap="round" />

        {/* Active Focus Arc Accent */}
        <path
          d="M 50 12 A 38 38 0 0 1 88 50"
          stroke={`url(#dek-arc-${idSuffix})`}
          strokeWidth="2.5"
          strokeLinecap="round"
        />

        {/* Bespoke Geometric DEK 'D' Monogram & Aperture */}
        <g filter={`url(#dek-shadow-${idSuffix})`}>
          {/* Main 'D' Outer Path with Chamfered Precision */}
          <path
            d="M 33 26 
               H 50 
               C 65.5 26, 76 36.5, 76 50 
               C 76 63.5, 65.5 74, 50 74 
               H 33 
               Z"
            fill={`url(#dek-gold-core-${idSuffix})`}
          />

          {/* Inner Negative Space Aperture (Forms the clock face inside the D) */}
          <path
            d="M 42 35 
               H 49.5 
               C 58.5 35, 66 41.5, 66 50 
               C 66 58.5, 58.5 65, 49.5 65 
               H 42 
               Z"
            fill={`url(#dek-face-${idSuffix})`}
          />
        </g>

        {/* Center Golden Pivot Pip */}
        <circle cx="49" cy="50" r="3.2" fill="#fff" />
        <circle cx="49" cy="50" r="2.2" fill="#f59e0b" />

        {/* Precision Watch Needle pointing to 10:10 Focus Vector */}
        <line
          x1="49"
          y1="50"
          x2="59"
          y2="39"
          stroke="#fef08a"
          strokeWidth="2.2"
          strokeLinecap="round"
        />
        <line
          x1="49"
          y1="50"
          x2="38"
          y2="42"
          stroke="#f59e0b"
          strokeWidth="2"
          strokeLinecap="round"
        />

        {/* Lens Glare Highlight Reflection (Diagonal Specular Sheen) */}
        <path
          d="M 8 28 C 8 16 16 8 28 8 L 84 8 C 45 22 22 45 8 84 Z"
          fill="rgba(255, 255, 255, 0.05)"
          pointerEvents="none"
        />
      </svg>
    </div>
  );
};
