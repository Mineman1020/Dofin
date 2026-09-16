import React, { useState, useEffect } from 'react';
import { Clock, Sparkles } from 'lucide-react';

interface StartupRevealProps {
  onComplete: () => void;
  userName?: string;
  isDarkMode?: boolean;
}

export const StartupReveal: React.FC<StartupRevealProps> = ({
  onComplete,
  userName,
  isDarkMode = false,
}) => {
  const [phase, setPhase] = useState<'entering' | 'holding' | 'exiting'>('entering');
  const [greeting, setGreeting] = useState<string>('Welcome');

  useEffect(() => {
    const hours = new Date().getHours();
    if (hours >= 5 && hours < 12) setGreeting('Good morning');
    else if (hours >= 12 && hours < 17) setGreeting('Good afternoon');
    else if (hours >= 17 && hours < 21) setGreeting('Good evening');
    else setGreeting('Good night');

    // Phase 1: Entering (0ms - 400ms)
    const tHold = setTimeout(() => {
      setPhase('holding');
    }, 450);

    // Phase 2: Exiting (1450ms)
    const tExit = setTimeout(() => {
      setPhase('exiting');
    }, 1500);

    // Phase 3: Complete (1950ms)
    const tComplete = setTimeout(() => {
      onComplete();
    }, 1950);

    const handleKeyDown = () => {
      setPhase('exiting');
      setTimeout(onComplete, 300);
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      clearTimeout(tHold);
      clearTimeout(tExit);
      clearTimeout(tComplete);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onComplete]);

  const handleSkip = () => {
    setPhase('exiting');
    setTimeout(onComplete, 250);
  };

  return (
    <div
      id="cinematic-startup-reveal"
      onClick={handleSkip}
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center select-none cursor-pointer overflow-hidden transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${
        phase === 'exiting'
          ? 'opacity-0 scale-[1.03] blur-sm pointer-events-none'
          : 'opacity-100 scale-100'
      } bg-neutral-950 text-white`}
    >
      {/* Ambient background lighting with Apple-like specular diffusion */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full bg-radial from-amber-500/15 via-sky-500/5 to-transparent blur-[140px] animate-pulse" />
        <div className="absolute -top-32 left-1/4 w-[400px] h-[400px] rounded-full bg-amber-400/10 blur-[120px]" />
        <div className="absolute -bottom-32 right-1/4 w-[400px] h-[400px] rounded-full bg-sky-400/10 blur-[120px]" />
      </div>

      {/* Main Center Content */}
      <div className="relative z-10 flex flex-col items-center text-center px-6 max-w-md w-full">
        {/* Apple-style Illuminated Monoline Clock Emblem */}
        <div className="relative mb-8 group">
          {/* Soft back aura */}
          <div className="absolute inset-0 rounded-full bg-amber-400/20 blur-2xl transform scale-150 animate-pulse" />

          <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-3xl bg-neutral-900/90 border border-white/20 shadow-2xl flex items-center justify-center backdrop-blur-xl transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] hover:scale-105">
            {/* Outer subtle ticks ring */}
            <svg
              className="absolute inset-0 w-full h-full p-2.5 transform -rotate-90"
              viewBox="0 0 100 100"
            >
              <circle
                cx="50"
                cy="50"
                r="42"
                stroke="rgba(255, 255, 255, 0.15)"
                strokeWidth="2.5"
                fill="none"
              />
              <circle
                cx="50"
                cy="50"
                r="42"
                stroke="url(#apple-startup-glow)"
                strokeWidth="3"
                strokeDasharray="264"
                strokeDashoffset={phase === 'entering' ? '264' : '0'}
                strokeLinecap="round"
                fill="none"
                className="transition-all duration-1000 ease-out"
              />
              <defs>
                <linearGradient id="apple-startup-glow" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#f59e0b" />
                  <stop offset="100%" stopColor="#38bdf8" />
                </linearGradient>
              </defs>
            </svg>

            {/* Glowing Center Icon */}
            <Clock className="w-10 h-10 sm:w-12 sm:h-12 text-white drop-shadow-[0_0_16px_rgba(245,158,11,0.6)]" />
          </div>
        </div>

        {/* Brand & Personal Greeting */}
        <div className="space-y-2 mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[11px] font-mono tracking-widest uppercase text-neutral-300 backdrop-blur-md">
            <Sparkles className="w-3 h-3 text-amber-400 animate-pulse" />
            <span>Desk Station</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white drop-shadow-sm">
            {greeting}
            {userName ? `, ${userName}` : ''}
          </h1>

          <p className="text-xs sm:text-sm text-neutral-400 font-light tracking-wide">
            Precision • Ambiance • Focus
          </p>
        </div>

        {/* Minimal Hairline Progress Beam */}
        <div className="w-48 h-1 bg-white/10 rounded-full overflow-hidden relative">
          <div
            className="h-full bg-gradient-to-r from-amber-400 via-amber-200 to-sky-400 rounded-full transition-all duration-[1400ms] ease-out shadow-[0_0_10px_rgba(245,158,11,0.8)]"
            style={{ width: phase === 'entering' ? '20%' : '100%' }}
          />
        </div>

        {/* Apple-style Skip Hint */}
        <div className="mt-12 text-[11px] font-mono text-neutral-500 tracking-wider flex items-center justify-center gap-1.5 opacity-80 hover:opacity-100 transition-opacity">
          <span>Click anywhere to start</span>
          <span className="hidden sm:inline">•</span>
          <span className="hidden sm:inline">Press any key</span>
        </div>
      </div>
    </div>
  );
};
