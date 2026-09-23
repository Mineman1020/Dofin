import React, { useState, useEffect, useRef } from 'react';
import { Clock } from 'lucide-react';
import { playIntroEffectSound } from '../utils/audio';

interface StartupRevealProps {
  onComplete: () => void;
  isDarkMode?: boolean;
}

export const StartupReveal: React.FC<StartupRevealProps> = ({
  onComplete,
  isDarkMode = false,
}) => {
  // 'initial' -> 'showing' (paused stationary for ~1.1s) -> 'zooming' (smooth hardware-accelerated spread) -> 'complete'
  const [stage, setStage] = useState<'initial' | 'showing' | 'zooming' | 'complete'>('initial');
  const timeoutRefs = useRef<NodeJS.Timeout[]>([]);

  useEffect(() => {
    // 1. Soft audio chime on launch
    try {
      playIntroEffectSound('chronos');
    } catch (e) {
      console.debug('Audio chime error:', e);
    }

    // 2. Fade in the logo immediately
    const tShow = setTimeout(() => {
      setStage('showing');
    }, 40);
    timeoutRefs.current.push(tShow);

    // 3. Keep logo stopped/stationary for a full second so user can see it clearly, then begin the zoom
    const tZoom = setTimeout(() => {
      setStage('zooming');
    }, 1250);
    timeoutRefs.current.push(tZoom);

    // 4. Complete the transition and reveal the welcome screen
    const tComplete = setTimeout(() => {
      setStage('complete');
      onComplete();
    }, 2050);
    timeoutRefs.current.push(tComplete);

    const handleSkip = () => {
      setStage('zooming');
      const tFast = setTimeout(() => {
        setStage('complete');
        onComplete();
      }, 350);
      timeoutRefs.current.push(tFast);
    };

    window.addEventListener('keydown', handleSkip);

    return () => {
      timeoutRefs.current.forEach(clearTimeout);
      window.removeEventListener('keydown', handleSkip);
    };
  }, [onComplete]);

  if (stage === 'complete') return null;

  const isZooming = stage === 'zooming';
  const isShowing = stage === 'showing' || isZooming;

  return (
    <div
      id="zoom-intro-reveal"
      onClick={() => {
        setStage('zooming');
        setTimeout(() => {
          setStage('complete');
          onComplete();
        }, 350);
      }}
      className={`fixed inset-0 z-50 flex items-center justify-center select-none overflow-hidden cursor-pointer transition-opacity duration-700 ease-[cubic-bezier(0.25,1,0.5,1)] ${
        isZooming ? 'opacity-0 pointer-events-none' : 'opacity-100'
      } ${isDarkMode ? 'bg-[#07090e]' : 'bg-[#0b0e14]'}`}
      style={{
        transform: 'translate3d(0, 0, 0)',
        willChange: 'opacity',
      }}
    >
      {/* Ambient background radial glow - stationary, no filter animations for max FPS */}
      <div
        className={`absolute w-[460px] h-[460px] rounded-full bg-radial from-amber-500/18 via-amber-600/5 to-transparent pointer-events-none transition-opacity duration-600 ${
          isZooming ? 'opacity-0' : 'opacity-100'
        }`}
      />

      {/* Main Logo Card - Perfectly Stationary for 1.1s, then smoothly spreads outward */}
      <div
        className="relative z-10 flex flex-col items-center justify-center"
        style={{
          transform: isZooming
            ? 'translate3d(0, 0, 0) scale(8.5)'
            : isShowing
            ? 'translate3d(0, 0, 0) scale(1)'
            : 'translate3d(0, 0, 0) scale(0.92)',
          opacity: isZooming ? 0 : isShowing ? 1 : 0,
          transition: isZooming
            ? 'transform 750ms cubic-bezier(0.4, 0, 0.2, 1), opacity 650ms cubic-bezier(0.4, 0, 0.2, 1)'
            : 'transform 350ms cubic-bezier(0.16, 1, 0.3, 1), opacity 350ms ease-out',
          willChange: 'transform, opacity',
          backfaceVisibility: 'hidden',
        }}
      >
        {/* Emblem Squircle */}
        <div className="relative mb-5">
          <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-[2rem] bg-gradient-to-br from-amber-300 via-amber-500 to-amber-600 p-[2.5px] shadow-[0_16px_40px_rgba(245,158,11,0.35)] flex items-center justify-center">
            {/* Obsidian Inner Face */}
            <div className="w-full h-full rounded-[calc(2rem-2.5px)] bg-[#12151c] flex items-center justify-center relative overflow-hidden">
              {/* Dial Ring */}
              <div className="absolute inset-2.5 rounded-full border border-amber-400/25 pointer-events-none" />

              {/* Glowing Clock Monogram */}
              <Clock className="w-12 h-12 sm:w-14 sm:h-14 text-amber-300 drop-shadow-[0_2px_12px_rgba(245,158,11,0.7)] relative z-10" />
            </div>
          </div>
        </div>

        {/* Brand Text - Fades cleanly during the zoom */}
        <div
          className="text-center space-y-1"
          style={{
            opacity: isZooming ? 0 : 1,
            transition: 'opacity 300ms ease-out',
          }}
        >
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white drop-shadow-sm font-sans">
            Desk Station
          </h1>
          <p className="text-xs text-amber-400/90 font-mono tracking-widest uppercase">
            Ambient Time & Focus
          </p>
        </div>
      </div>
    </div>
  );
};
