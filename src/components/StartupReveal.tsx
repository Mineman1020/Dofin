import React, { useState, useEffect, useRef } from 'react';
import { playIntroEffectSound } from '../utils/audio';
import { DekLogo } from './DekLogo';

interface StartupRevealProps {
  onComplete: () => void;
  isDarkMode?: boolean;
}

export const StartupReveal: React.FC<StartupRevealProps> = ({
  onComplete,
  isDarkMode = false,
}) => {
  // 'initial' -> 'showing' -> 'expanding' -> 'complete'
  const [stage, setStage] = useState<'initial' | 'showing' | 'expanding' | 'complete'>('initial');
  const timeoutRefs = useRef<NodeJS.Timeout[]>([]);

  useEffect(() => {
    // 1. Soft audio chime on launch
    try {
      playIntroEffectSound('chronos');
    } catch (e) {
      console.debug('Audio chime error:', e);
    }

    // 2. Entrance phase
    const tShow = setTimeout(() => {
      setStage('showing');
    }, 50);
    timeoutRefs.current.push(tShow);

    // 3. Keep logo steady for full appreciation, then expand into app
    const tExpand = setTimeout(() => {
      setStage('expanding');
    }, 1450);
    timeoutRefs.current.push(tExpand);

    // 4. Complete transition and reveal the workspace
    const tComplete = setTimeout(() => {
      setStage('complete');
      onComplete();
    }, 2250);
    timeoutRefs.current.push(tComplete);

    // Skip handler on Space, Enter, or Escape
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['Space', 'Enter', 'Escape'].includes(e.code) || e.key === ' ' || e.key === 'Enter' || e.key === 'Escape') {
        e.preventDefault();
        setStage('expanding');
        const tFast = setTimeout(() => {
          setStage('complete');
          onComplete();
        }, 320);
        timeoutRefs.current.push(tFast);
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      timeoutRefs.current.forEach(clearTimeout);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onComplete]);

  if (stage === 'complete') return null;

  const isExpanding = stage === 'expanding';
  const isShowing = stage === 'showing' || isExpanding;

  const handleSkipClick = () => {
    setStage('expanding');
    const tFast = setTimeout(() => {
      setStage('complete');
      onComplete();
    }, 320);
    timeoutRefs.current.push(tFast);
  };

  return (
    <div
      id="zoom-intro-reveal"
      onClick={handleSkipClick}
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center select-none overflow-hidden cursor-pointer transition-opacity duration-700 ease-[cubic-bezier(0.25,1,0.5,1)] ${
        isExpanding ? 'opacity-0 pointer-events-none' : 'opacity-100'
      } ${isDarkMode ? 'bg-[#06080d]' : 'bg-[#090c12]'}`}
      style={{
        transform: 'translate3d(0, 0, 0)',
        willChange: 'opacity',
      }}
    >
      {/* Background Animated Subtle Atmospheric Light */}
      <div
        className={`absolute w-[600px] h-[600px] rounded-full pointer-events-none transition-all duration-1000 ${
          isShowing ? 'opacity-100 scale-100' : 'opacity-0 scale-75'
        } ${isExpanding ? 'scale-150 opacity-0' : ''}`}
        style={{
          background: 'radial-gradient(circle, rgba(245, 158, 11, 0.16) 0%, rgba(217, 119, 6, 0.06) 45%, rgba(0, 0, 0, 0) 70%)',
        }}
      />

      {/* Orbit Chrono Background Track */}
      <div
        className={`absolute w-[360px] h-[360px] sm:w-[420px] sm:h-[420px] rounded-full border border-amber-500/10 pointer-events-none transition-all duration-1000 ${
          isShowing ? 'opacity-100 rotate-0' : 'opacity-0 -rotate-45'
        } ${isExpanding ? 'scale-125 opacity-0' : ''}`}
      />
      <div
        className={`absolute w-[460px] h-[460px] sm:w-[540px] sm:h-[540px] rounded-full border border-dashed border-amber-500/8 pointer-events-none transition-all duration-1000 ${
          isShowing ? 'opacity-100 rotate-0' : 'opacity-0 rotate-45'
        } ${isExpanding ? 'scale-125 opacity-0' : ''}`}
      />

      {/* Main Logo Card & Typography Stage */}
      <div
        className="relative z-10 flex flex-col items-center justify-center"
        style={{
          transform: isExpanding
            ? 'translate3d(0, 0, 0) scale(8.5)'
            : isShowing
            ? 'translate3d(0, 0, 0) scale(1)'
            : 'translate3d(0, 0, 0) scale(0.92)',
          opacity: isExpanding ? 0 : isShowing ? 1 : 0,
          transition: isExpanding
            ? 'transform 750ms cubic-bezier(0.4, 0, 0.2, 1), opacity 650ms cubic-bezier(0.4, 0, 0.2, 1)'
            : 'transform 420ms cubic-bezier(0.16, 1, 0.3, 1), opacity 420ms ease-out',
          willChange: 'transform, opacity',
          backfaceVisibility: 'hidden',
        }}
      >
        {/* Emblem */}
        <div className="relative mb-5.5">
          <DekLogo size={124} glow={true} animated={true} />
        </div>

        {/* Brand Text */}
        <div
          className="text-center space-y-2"
          style={{
            opacity: isExpanding ? 0 : isShowing ? 1 : 0,
            transform: isExpanding ? 'translateY(10px)' : isShowing ? 'translateY(0)' : 'translateY(8px)',
            transition: 'opacity 350ms ease-out 100ms, transform 400ms ease-out 100ms',
          }}
        >
          <div className="flex items-center justify-center gap-2">
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-[0.2em] uppercase text-transparent bg-clip-text bg-gradient-to-r from-amber-100 via-amber-300 to-amber-500 drop-shadow-[0_2px_16px_rgba(245,158,11,0.4)] font-sans">
              Dek
            </h1>
          </div>

          <div className="flex items-center justify-center gap-2 text-xs font-mono tracking-[0.25em] text-neutral-400 uppercase">
            <span className="text-amber-400">Ambient</span>
            <span className="text-neutral-600">•</span>
            <span>Time</span>
            <span className="text-neutral-600">•</span>
            <span className="text-amber-400">Focus</span>
          </div>
        </div>
      </div>

      {/* Subtle Bottom Skip Hint */}
      <div
        className={`absolute bottom-8 z-10 text-[11px] font-mono tracking-wider text-neutral-500 transition-opacity duration-500 flex items-center gap-2 ${
          isExpanding ? 'opacity-0' : isShowing ? 'opacity-70 hover:opacity-100' : 'opacity-0'
        }`}
      >
        <span className="px-2 py-0.5 rounded-md bg-neutral-900 border border-neutral-800 text-neutral-400 text-[10px]">
          Space
        </span>
        <span>or click to enter</span>
      </div>
    </div>
  );
};
