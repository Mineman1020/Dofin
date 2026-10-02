import React, { useMemo } from 'react';
import { AmbientThemeId, PomodoroPhase } from '../types';

interface AmbientBackgroundProps {
  ambientTheme?: AmbientThemeId;
  particles?: boolean;
  className?: string;
  pomodoroPhase?: PomodoroPhase;
  syncPhase?: boolean;
}

export const AmbientBackground: React.FC<AmbientBackgroundProps> = ({
  ambientTheme = 'none',
  particles = true,
  className = '',
  pomodoroPhase,
  syncPhase = false,
}) => {
  // Pre-generate stable random distributions for particles
  const starfield = useMemo(() => {
    return Array.from({ length: 75 }).map((_, i) => ({
      id: i,
      left: `${(Math.sin(i * 997.3) * 0.5 + 0.5) * 100}%`,
      top: `${(Math.cos(i * 613.7) * 0.5 + 0.5) * 100}%`,
      size: `${0.8 + ((i * 17) % 2.2)}px`,
      duration: `${2.5 + ((i * 23) % 4.5)}s`,
      delay: `${(i * 11) % 5}s`,
      opacity: 0.2 + ((i * 31) % 0.8),
    }));
  }, []);

  if (!ambientTheme || ambientTheme === 'none') {
    return null;
  }

  // Phase-adaptive subtle color shift parameters
  // Work: Rich focus intensity, warm/sharp clarity
  // Short Break: Calming cyan/teal cooling wash, gentle relaxed luminescence
  // Long Break: Soothing emerald/sage restorative depth, deep calm
  const phaseFilter = useMemo(() => {
    if (!syncPhase || !pomodoroPhase) return undefined;
    switch (pomodoroPhase) {
      case 'work':
        // Crisper, slightly warmer focus contrast
        return 'contrast(102%) saturate(104%)';
      case 'shortBreak':
        // Calming cool relaxation: slight hue rotation towards cool cyan/blue, soft luminous glow
        return 'hue-rotate(18deg) saturate(92%) brightness(98%)';
      case 'longBreak':
        // Deep restorative rest: gentle emerald/teal shift, soothing ambient softness
        return 'hue-rotate(36deg) saturate(88%) brightness(96%)';
    }
  }, [syncPhase, pomodoroPhase]);

  return (
    <div
      id={`ambient-canvas-${ambientTheme}`}
      aria-hidden="true"
      className={`absolute inset-0 w-full h-full overflow-hidden pointer-events-none z-0 select-none transition-all duration-1000 ease-in-out ${className}`}
      style={{ filter: phaseFilter }}
    >
      {/* Subtle Chromatic Phase Mood Atmospheric Wash */}
      {syncPhase && pomodoroPhase && (
        <div
          className={`absolute inset-0 z-10 pointer-events-none transition-all duration-1000 ease-in-out ${
            pomodoroPhase === 'work'
              ? 'opacity-0 bg-transparent'
              : pomodoroPhase === 'shortBreak'
              ? 'opacity-25 bg-gradient-to-b from-sky-900/30 via-cyan-950/20 to-teal-900/35 mix-blend-color'
              : 'opacity-30 bg-gradient-to-b from-emerald-950/35 via-teal-900/25 to-slate-950/40 mix-blend-color'
          }`}
        />
      )}

      {/* Universal Ambient Starfield (Only stars remain across all ambient themes) */}
      {particles && (
        <div className="absolute inset-0 pointer-events-none z-10">
          {starfield.map((star) => (
            <div
              key={star.id}
              className="absolute rounded-full pointer-events-none"
              style={{
                left: star.left,
                top: star.top,
                width: star.size,
                height: star.size,
                backgroundColor:
                  ambientTheme === 'aurora'
                    ? '#a7f3d0'
                    : ambientTheme === 'campfire' || ambientTheme === 'autumn-glade'
                    ? '#fef08a'
                    : ambientTheme === 'beachside-sunset' || ambientTheme === 'cherry-blossom'
                    ? '#fce7f3'
                    : ambientTheme === 'rainy-day' || ambientTheme === 'rainy-window'
                    ? '#93c5fd'
                    : '#ffffff',
                boxShadow: `0 0 5px ${
                  ambientTheme === 'aurora'
                    ? '#34d399'
                    : ambientTheme === 'campfire'
                    ? '#f59e0b'
                    : 'rgba(255, 255, 255, 0.7)'
                }`,
                opacity: star.opacity,
                animation: `starTwinkle ${star.duration} ease-in-out infinite`,
                animationDelay: star.delay,
              }}
            />
          ))}
        </div>
      )}

      {/* BEACHSIDE SUNSET */}
      {ambientTheme === 'beachside-sunset' && (
        <div className="absolute inset-0 w-full h-full bg-[#120720] overflow-hidden">
          {/* 1. Tropical Sunset Sky Gradient */}
          <div
            className="absolute inset-0 w-full h-full"
            style={{
              background:
                'linear-gradient(180deg, #170826 0%, #351034 26%, #6e203b 50%, #b84f35 68%, #ea7a32 76%, #1a3c54 82%, #081d2e 100%)',
            }}
          />

          {/* 2. Soft Twilight Sky Clouds */}
          <div
            className="absolute top-1/4 -left-1/4 w-[150%] h-36 blur-[55px] opacity-40"
            style={{
              background: 'linear-gradient(90deg, transparent, #c026d3, #f97316, transparent)',
              animation: 'rainCloudDrift 30s ease-in-out infinite alternate',
            }}
          />
          <div
            className="absolute top-1/3 -left-1/3 w-[160%] h-44 blur-[65px] opacity-35"
            style={{
              background: 'linear-gradient(90deg, transparent, #fb923c, #fb7185, transparent)',
              animation: 'rainCloudDrift 22s ease-in-out infinite alternate-reverse',
            }}
          />

          {/* 3. Soaring Distant Seabirds Silhouette */}
          <div className="absolute top-[28%] left-[28%] opacity-35">
            <svg width="28" height="12" viewBox="0 0 28 12" fill="none" className="text-rose-950">
              <path
                d="M1 9C5 3 10 3 14 7C18 3 23 3 27 9"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
              />
            </svg>
          </div>
          <div className="absolute top-[33%] left-[34%] opacity-25 scale-75">
            <svg width="28" height="12" viewBox="0 0 28 12" fill="none" className="text-rose-950">
              <path
                d="M1 9C5 3 10 3 14 7C18 3 23 3 27 9"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
              />
            </svg>
          </div>
          <div className="absolute top-[24%] right-[32%] opacity-30 scale-90">
            <svg width="28" height="12" viewBox="0 0 28 12" fill="none" className="text-rose-950">
              <path
                d="M1 9C5 3 10 3 14 7C18 3 23 3 27 9"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
              />
            </svg>
          </div>

          {/* 4. Glowing Sunset Sun Disk */}
          <div
            className="absolute left-1/2 -translate-x-1/2 top-[60%] w-40 h-40 sm:w-56 sm:h-56 rounded-full -translate-y-1/2"
            style={{
              background:
                'radial-gradient(circle, #fffbeb 0%, #fef08a 25%, #f59e0b 60%, #ea580c 85%, transparent 100%)',
              boxShadow:
                '0 0 80px rgba(251, 146, 60, 0.75), 0 0 140px rgba(249, 115, 22, 0.5), 0 0 200px rgba(236, 72, 153, 0.3)',
              animation: 'sunGlowPulse 8s ease-in-out infinite',
            }}
          />

          {/* 5. Deep Horizon Water Base (from 68% height to bottom) */}
          <div
            className="absolute top-[68%] left-0 right-0 bottom-0"
            style={{
              background:
                'linear-gradient(180deg, #16364c 0%, #0d283c 35%, #081d2e 65%, #051420 100%)',
            }}
          />

          {/* 6. Vertical Sun Reflection Column across the Water */}
          <div
            className="absolute left-1/2 -translate-x-1/2 top-[68%] bottom-0 w-48 sm:w-72 opacity-65 pointer-events-none blur-[14px]"
            style={{
              background:
                'linear-gradient(180deg, rgba(253, 224, 71, 0.7) 0%, rgba(251, 146, 60, 0.5) 40%, rgba(244, 63, 94, 0.25) 80%, transparent 100%)',
            }}
          />

          {/* 8. Layered SVG Ocean Waves Swelling and Rolling */}
          {/* Swell Wave 1 (Midground deep turquoise swell) */}
          <div
            className="absolute top-[69%] left-[-5%] w-[110%] h-32 opacity-75"
            style={{
              animation: 'oceanWaveSwell1 9s ease-in-out infinite alternate',
            }}
          >
            <svg
              viewBox="0 0 1440 160"
              preserveAspectRatio="none"
              className="w-full h-full text-[#123e54] fill-current"
            >
              <path d="M0,48 C240,110 480,10 720,55 C960,100 1200,20 1440,65 L1440,160 L0,160 Z" />
            </svg>
            {/* Wave Foam Crest Highlight */}
            <div
              className="absolute top-[38%] left-0 right-0 h-[2px] opacity-60"
              style={{
                background:
                  'linear-gradient(90deg, transparent 0%, rgba(254, 240, 138, 0.8) 40%, rgba(255, 255, 255, 0.9) 55%, transparent 100%)',
              }}
            />
          </div>

          {/* Swell Wave 2 (Rolling surf with cyan seafoam wash) */}
          <div
            className="absolute top-[76%] left-[-8%] w-[116%] h-36 opacity-85"
            style={{
              animation: 'oceanWaveSwell2 8s ease-in-out infinite alternate',
            }}
          >
            <svg
              viewBox="0 0 1440 180"
              preserveAspectRatio="none"
              className="w-full h-full text-[#0d2a3c] fill-current"
            >
              <path d="M0,60 C320,120 640,25 960,85 C1200,130 1360,40 1440,75 L1440,180 L0,180 Z" />
            </svg>
          </div>

          {/* Beachshore Advancing Surf Wave (Washing onto the sand) */}
          <div
            className="absolute bottom-0 left-[-4%] w-[108%] h-28 opacity-90"
            style={{
              animation: 'beachSurfAdvance 10s cubic-bezier(0.4, 0, 0.2, 1) infinite',
            }}
          >
            <svg
              viewBox="0 0 1440 140"
              preserveAspectRatio="none"
              className="w-full h-full text-[#071d2b] fill-current"
            >
              <path d="M0,40 C360,85 720,10 1080,60 C1260,85 1380,30 1440,50 L1440,140 L0,140 Z" />
            </svg>
            {/* Gentle Seafoam Rim */}
            <div className="absolute top-[28%] left-0 right-0 h-[3px] bg-gradient-to-r from-transparent via-amber-100/60 to-transparent blur-[1px]" />
          </div>

          {/* 9. Wet Shoreline Reflection at the very bottom */}
          <div
            className="absolute bottom-0 left-0 right-0 h-10 pointer-events-none"
            style={{
              background:
                'linear-gradient(180deg, transparent 0%, rgba(251, 146, 60, 0.15) 60%, rgba(244, 63, 94, 0.1) 100%)',
            }}
          />

          {/* 10. Framing Tropical Palm Frond Silhouettes */}
          <div className="absolute -top-6 -left-6 sm:top-0 sm:left-0 w-36 h-36 sm:w-56 sm:h-56 opacity-45 pointer-events-none">
            <svg viewBox="0 0 200 200" fill="none" className="w-full h-full text-black/80">
              <path
                d="M0,0 Q60,20 120,60 Q150,90 170,140 C140,110 110,95 80,85 C50,75 25,72 0,70 Z"
                fill="currentColor"
              />
              <path
                d="M0,0 Q70,35 110,90 Q130,130 140,180 C120,135 95,110 65,95 C40,82 20,80 0,78 Z"
                fill="currentColor"
              />
              <path
                d="M0,0 Q40,40 65,100 Q80,145 85,195 C75,145 60,120 40,100 C25,85 10,82 0,80 Z"
                fill="currentColor"
              />
            </svg>
          </div>
          <div className="absolute -top-6 -right-6 sm:top-0 sm:right-0 w-32 h-32 sm:w-48 sm:h-48 opacity-35 pointer-events-none transform -scale-x-100">
            <svg viewBox="0 0 200 200" fill="none" className="w-full h-full text-black/75">
              <path
                d="M0,0 Q60,20 120,60 Q150,90 170,140 C140,110 110,95 80,85 C50,75 25,72 0,70 Z"
                fill="currentColor"
              />
              <path
                d="M0,0 Q70,35 110,90 Q130,130 140,180 C120,135 95,110 65,95 C40,82 20,80 0,78 Z"
                fill="currentColor"
              />
            </svg>
          </div>
        </div>
      )}

      {/* RAINY DAY OVERCAST */}
      {ambientTheme === 'rainy-day' && (
        <div className="absolute inset-0 w-full h-full bg-[#0d1520] overflow-hidden">
          {/* 1. Overcast Slate-Blue Sky Gradient */}
          <div
            className="absolute inset-0 w-full h-full"
            style={{
              background:
                'linear-gradient(180deg, #09111b 0%, #111c2a 35%, #18273a 65%, #0d1622 100%)',
            }}
          />

          {/* 2. Soft Thunder Glow Pulse (Occasional atmospheric sheet lightning pulse) */}
          <div
            className="absolute inset-0 bg-sky-200 pointer-events-none"
            style={{ animation: 'softThunderPulse 14s ease-in-out infinite' }}
          />

          {/* 3. Rolling Overcast Fog & Mist Clouds */}
          <div
            className="absolute -top-12 -left-1/4 w-[150%] h-72 blur-[75px] opacity-40"
            style={{
              background: 'linear-gradient(90deg, #1e293b, #334155, #1e293b)',
              animation: 'rainCloudDrift 28s ease-in-out infinite alternate',
            }}
          />
          <div
            className="absolute top-1/4 -right-1/4 w-[140%] h-64 blur-[85px] opacity-30"
            style={{
              background: 'linear-gradient(90deg, #0f172a, #1e293b, #0f172a)',
              animation: 'rainCloudDrift 34s ease-in-out infinite alternate-reverse',
            }}
          />

          {/* 4. Distant Blurred City Lights through Rain */}
          <div className="absolute bottom-1/4 left-1/5 w-48 h-48 rounded-full blur-[85px] bg-amber-400/15" />
          <div className="absolute bottom-1/3 right-1/4 w-56 h-56 rounded-full blur-[95px] bg-sky-500/15" />
          <div className="absolute bottom-1/6 left-2/3 w-40 h-40 rounded-full blur-[70px] bg-rose-500/10" />

          {/* 7. Fine Mist Droplet Condensation Grid Overlay */}
          <div
            className="absolute inset-0 opacity-25 mix-blend-overlay pointer-events-none"
            style={{
              backgroundImage:
                'radial-gradient(circle at 12px 12px, rgba(255,255,255,0.45) 1.2px, transparent 1.6px)',
              backgroundSize: '28px 28px',
            }}
          />

          {/* 8. Cozy Warm Desk Candle / Lamp Glow in bottom corner */}
          <div className="absolute -bottom-12 -left-12 w-80 h-80 rounded-full blur-[110px] bg-amber-500/20" />
        </div>
      )}

      {/* 1. AURORA BOREALIS */}
      {ambientTheme === 'aurora' && (
        <div className="absolute inset-0 w-full h-full bg-[#020710]">
          {/* Primary Aurora Emerald Curtain */}
          <div
            className="absolute -top-[20%] left-[-10%] w-[120%] h-[85%] blur-[90px] opacity-60 mix-blend-screen"
            style={{
              background:
                'radial-gradient(ellipse at 35% 20%, rgba(16, 185, 129, 0.75) 0%, rgba(6, 182, 212, 0.4) 45%, transparent 70%)',
              animation: 'auroraWave1 18s ease-in-out infinite alternate',
            }}
          />

          {/* Secondary Aurora Violet Ribbon */}
          <div
            className="absolute -top-[10%] right-[-15%] w-[115%] h-[80%] blur-[100px] opacity-50 mix-blend-screen"
            style={{
              background:
                'radial-gradient(ellipse at 65% 25%, rgba(139, 92, 246, 0.7) 0%, rgba(20, 184, 166, 0.35) 45%, transparent 72%)',
              animation: 'auroraWave2 22s ease-in-out infinite alternate',
            }}
          />

          {/* Tertiary Subtle Cyan Wave */}
          <div
            className="absolute top-[10%] left-[15%] w-[70%] h-[55%] blur-[80px] opacity-40 mix-blend-screen"
            style={{
              background:
                'radial-gradient(ellipse at 50% 30%, rgba(52, 211, 153, 0.6) 0%, transparent 65%)',
              animation: 'auroraWave1 14s ease-in-out infinite alternate-reverse',
            }}
          />

          {/* Dark ground vignette */}
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[#020710]/90" />
        </div>
      )}

      {/* 2. COSMIC STARLIGHT */}
      {ambientTheme === 'starlight' && (
        <div className="absolute inset-0 w-full h-full bg-[#02040a]">
          {/* Distant Nebula Dust */}
          <div
            className="absolute top-1/4 left-1/3 w-[550px] h-[350px] rounded-full blur-[140px] opacity-25"
            style={{ background: 'radial-gradient(circle, #38bdf8 0%, #6366f1 50%, transparent 80%)' }}
          />
          <div
            className="absolute bottom-1/3 right-1/4 w-[450px] h-[300px] rounded-full blur-[120px] opacity-20"
            style={{ background: 'radial-gradient(circle, #a855f7 0%, #3b82f6 60%, transparent 80%)' }}
          />
        </div>
      )}

      {/* 3. COZY LO-FI RAIN */}
      {ambientTheme === 'rainy-window' && (
        <div className="absolute inset-0 w-full h-full bg-[#070b10]">
          {/* Moody Window Glass Bokeh Lights */}
          <div
            className="absolute top-1/3 left-1/4 w-72 h-72 rounded-full blur-[95px] opacity-20"
            style={{ background: '#fbbf24' }}
          />
          <div
            className="absolute bottom-1/4 right-1/3 w-80 h-80 rounded-full blur-[110px] opacity-20"
            style={{ background: '#3b82f6' }}
          />
          <div
            className="absolute top-2/3 left-1/2 w-64 h-64 rounded-full blur-[85px] opacity-15"
            style={{ background: '#f43f5e' }}
          />

          {/* Soft condensation droplets layer */}
          <div
            className="absolute inset-0 opacity-20 mix-blend-overlay pointer-events-none"
            style={{
              backgroundImage:
                'radial-gradient(circle at 10px 10px, rgba(255,255,255,0.4) 1px, transparent 1.5px)',
              backgroundSize: '36px 36px',
            }}
          />

          {/* Warm desk lamp glow in bottom corner */}
          <div className="absolute -bottom-10 -left-10 w-96 h-96 rounded-full blur-[130px] bg-amber-500/15" />
        </div>
      )}

      {/* 4. CAMPFIRE EMBERS */}
      {ambientTheme === 'campfire' && (
        <div className="absolute inset-0 w-full h-full bg-[#090301]">
          {/* Warm Hearth Breathing Glow */}
          <div
            className="absolute -bottom-20 left-1/2 -translate-x-1/2 w-[700px] h-[360px] rounded-full blur-[120px] bg-gradient-to-t from-orange-600/45 via-amber-500/30 to-transparent"
            style={{
              animation: 'hearthBreathe 3.5s ease-in-out infinite',
            }}
          />

          {/* Deep glowing core */}
          <div
            className="absolute -bottom-10 left-1/2 -translate-x-1/2 w-[420px] h-[180px] rounded-full blur-[70px] bg-amber-400/40"
            style={{
              animation: 'hearthBreathe 2.4s ease-in-out infinite alternate',
            }}
          />

          {/* Subtle charred vignette */}
          <div className="absolute inset-0 bg-gradient-to-t from-transparent via-transparent to-black/80" />
        </div>
      )}

      {/* 5. SYNTHWAVE HORIZON */}
      {ambientTheme === 'cyber-horizon' && (
        <div className="absolute inset-0 w-full h-full bg-[#06010c] overflow-hidden flex flex-col justify-end">
          {/* Retro Synth Sun on Horizon */}
          <div className="absolute top-[38%] left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 sm:w-80 sm:h-80 rounded-full blur-none z-0">
            <div
              className="w-full h-full rounded-full shadow-2xl"
              style={{
                background: 'linear-gradient(180deg, #f43f5e 0%, #fb923c 45%, #fde047 90%)',
                boxShadow: '0 0 60px rgba(244, 63, 94, 0.45)',
              }}
            />
            {/* Horizon Sun Blinds Horizontal Slices */}
            <div
              className="absolute inset-0 w-full h-full rounded-full"
              style={{
                backgroundImage:
                  'repeating-linear-gradient(180deg, transparent, transparent 10px, #06010c 10px, #06010c 14px)',
                maskImage: 'linear-gradient(180deg, transparent 40%, black 100%)',
                WebkitMaskImage: 'linear-gradient(180deg, transparent 40%, black 100%)',
              }}
            />
          </div>

          {/* Neon Horizon Glow Bar */}
          <div className="absolute top-[48%] left-0 right-0 h-[2px] bg-cyan-400 shadow-[0_0_15px_#22d3ee] z-10" />

          {/* 3D Perspective Grid Plane */}
          <div
            className="w-full h-[52%] relative origin-top z-1"
            style={{
              perspective: '350px',
            }}
          >
            <div
              className="w-full h-full origin-top"
              style={{
                transform: 'rotateX(68deg)',
                backgroundImage: `
                  linear-gradient(to right, rgba(6, 182, 212, 0.4) 1px, transparent 1px),
                  linear-gradient(to bottom, rgba(6, 182, 212, 0.4) 1px, transparent 1px)
                `,
                backgroundSize: '48px 48px',
                animation: 'synthGridMove 1.8s linear infinite',
              }}
            />
          </div>

          {/* Scanline CRT overlay */}
          <div
            className="absolute inset-0 pointer-events-none opacity-20 z-20"
            style={{
              backgroundImage:
                'repeating-linear-gradient(0deg, rgba(0,0,0,0.6) 0px, rgba(0,0,0,0.6) 1px, transparent 1px, transparent 3px)',
            }}
          />
        </div>
      )}

      {/* 6. ZEN BAMBOO MIST */}
      {ambientTheme === 'zen-mist' && (
        <div className="absolute inset-0 w-full h-full bg-[#060b08] overflow-hidden">
          {/* Subtle Bamboo Stalks Silhouette in Distance */}
          <div className="absolute inset-0 opacity-15 flex justify-around pointer-events-none px-12">
            <div className="w-4 h-full bg-emerald-950 border-r border-emerald-800/30" />
            <div className="w-3 h-full bg-emerald-950 border-r border-emerald-800/30 ml-8" />
            <div className="w-5 h-full bg-emerald-950 border-r border-emerald-800/30 hidden md:block" />
            <div className="w-3.5 h-full bg-emerald-950 border-r border-emerald-800/30" />
            <div className="w-4.5 h-full bg-emerald-950 border-r border-emerald-800/30 mr-12" />
          </div>

          {/* Layer 1 Fog */}
          <div
            className="absolute -top-20 -left-[20%] w-[140%] h-[70%] blur-[80px] opacity-40 bg-gradient-to-r from-emerald-900/20 via-teal-800/35 to-emerald-950/20"
            style={{
              animation: 'fogDrift 28s ease-in-out infinite',
            }}
          />

          {/* Layer 2 Lower Fog Bank */}
          <div
            className="absolute bottom-0 -left-[15%] w-[130%] h-[55%] blur-[90px] opacity-35 bg-gradient-to-r from-teal-900/30 via-emerald-800/40 to-slate-900/30"
            style={{
              animation: 'fogDrift 34s ease-in-out infinite reverse',
            }}
          />

          {/* Gentle morning light ray */}
          <div className="absolute -top-10 right-1/4 w-96 h-96 rounded-full blur-[140px] bg-emerald-400/10" />
        </div>
      )}

      {/* 7. SUNSET GOLDEN HOUR */}
      {ambientTheme === 'golden-hour' && (
        <div className="absolute inset-0 w-full h-full bg-gradient-to-b from-[#140b20] via-[#33112c] via-[#521d31] to-[#1c0817] overflow-hidden">
          {/* Radiant Sunset Sun Dip on Horizon */}
          <div
            className="absolute -bottom-24 left-1/2 -translate-x-1/2 w-[750px] h-[350px] rounded-full blur-[100px] bg-gradient-to-t from-amber-500/50 via-rose-500/35 to-transparent"
            style={{
              animation: 'hearthBreathe 6s ease-in-out infinite',
            }}
          />

          {/* Sun Halo */}
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-64 h-32 rounded-t-full blur-[40px] bg-amber-300/40" />
        </div>
      )}

      {/* 8. RETRO CRT TERMINAL */}
      {ambientTheme === 'retro-crt' && (
        <div
          className="absolute inset-0 w-full h-full bg-[#050301] overflow-hidden"
          style={{ animation: 'crtFlicker 0.15s infinite' }}
        >
          {/* Center Phosphor Bloom */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-[680px] h-[480px] rounded-full blur-[130px] bg-amber-500/15 pointer-events-none" />
          </div>

          {/* Authentic CRT Horizontal Scanlines */}
          <div
            className="absolute inset-0 pointer-events-none z-10 opacity-40"
            style={{
              backgroundImage:
                'repeating-linear-gradient(0deg, rgba(0,0,0,0.8) 0px, rgba(0,0,0,0.8) 1.5px, transparent 1.5px, transparent 3.5px)',
            }}
          />

          {/* Screen Curvature Vignette */}
          <div
            className="absolute inset-0 pointer-events-none z-20"
            style={{
              boxShadow: 'inset 0 0 140px rgba(0,0,0,0.95), inset 0 0 60px rgba(0,0,0,0.95)',
            }}
          />
        </div>
      )}

      {/* 9. SOLARIUM SUNBEAM (LIGHT AMBIENT) */}
      {ambientTheme === 'sunbeam' && (
        <div className="absolute inset-0 w-full h-full bg-[#faf7f2] overflow-hidden">
          {/* Subtle Plaster Texture */}
          <div
            className="absolute inset-0 opacity-[0.035] pointer-events-none"
            style={{
              backgroundImage:
                'radial-gradient(circle at 1px 1px, #292524 1px, transparent 0)',
              backgroundSize: '16px 16px',
            }}
          />

          {/* Angled Sunlight Shaft Beam */}
          <div
            className="absolute -top-32 -left-20 w-[150%] h-[150%] blur-[75px] pointer-events-none"
            style={{
              background:
                'linear-gradient(118deg, rgba(254, 240, 138, 0.45) 0%, rgba(253, 230, 138, 0.25) 30%, rgba(255, 255, 255, 0) 55%)',
              animation: 'sunbeamPulse 12s ease-in-out infinite alternate',
            }}
          />
        </div>
      )}

      {/* 10. DEEP OCEAN ABYSS */}
      {ambientTheme === 'deep-abyss' && (
        <div className="absolute inset-0 w-full h-full bg-[#010710] overflow-hidden">
          {/* Surface Caustic Rays Ripple from Above */}
          <div
            className="absolute -top-24 left-0 right-0 h-96 blur-[80px] opacity-40"
            style={{
              background:
                'radial-gradient(ellipse at 50% 0%, #38bdf8 0%, #0369a1 45%, transparent 75%)',
              animation: 'auroraWave1 16s ease-in-out infinite alternate',
            }}
          />

          {/* Abyss darkness vignette */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#01050a] via-transparent to-transparent" />
        </div>
      )}

      {/* 11. SAKURA SPRING TWILIGHT (Cherry Blossom) */}
      {ambientTheme === 'cherry-blossom' && (
        <div className="absolute inset-0 w-full h-full bg-[#180918] overflow-hidden">
          {/* Soft Evening Sakura Sky Glow */}
          <div
            className="absolute inset-0 w-full h-full"
            style={{
              background:
                'radial-gradient(ellipse at 50% 30%, #3d1434 0%, #20081d 50%, #0d030c 100%)',
            }}
          />

          {/* Luminous Soft Spring Moon Glow */}
          <div
            className="absolute top-12 right-1/4 w-72 h-72 rounded-full blur-[90px] opacity-40 pointer-events-none"
            style={{
              background: 'radial-gradient(circle, #fbcfe8 0%, #f472b6 40%, transparent 70%)',
            }}
          />

          {/* Vignette */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#10040f]/90 via-transparent to-[#10040f]/40 pointer-events-none" />
        </div>
      )}

      {/* 12. NEO TOKYO CYBER RAIN */}
      {ambientTheme === 'neon-cyber-city' && (
        <div className="absolute inset-0 w-full h-full bg-[#05010a] overflow-hidden">
          {/* Cyber Neon Gradient Atmosphere */}
          <div
            className="absolute inset-0 w-full h-full"
            style={{
              background:
                'radial-gradient(ellipse at 50% 100%, #200535 0%, #0d0218 55%, #030007 100%)',
            }}
          />

          {/* Holographic Skyline Grid Horizon */}
          <div
            className="absolute bottom-0 left-0 right-0 h-64 opacity-35 pointer-events-none"
            style={{
              backgroundImage:
                'linear-gradient(rgba(6, 182, 212, 0.4) 1px, transparent 1px), linear-gradient(90deg, rgba(6, 182, 212, 0.4) 1px, transparent 1px)',
              backgroundSize: '48px 48px',
              perspective: '350px',
              transform: 'rotateX(60deg)',
              transformOrigin: 'bottom center',
            }}
          />

          {/* Neon Light Flares */}
          <div
            className="absolute bottom-20 left-1/4 w-80 h-44 rounded-full blur-[80px] opacity-35"
            style={{
              background: 'radial-gradient(circle, #06b6d4 0%, transparent 70%)',
              animation: 'cyberNeonPulse 5s ease-in-out infinite alternate',
            }}
          />
          <div
            className="absolute bottom-28 right-1/4 w-80 h-44 rounded-full blur-[80px] opacity-35"
            style={{
              background: 'radial-gradient(circle, #ec4899 0%, transparent 70%)',
              animation: 'cyberNeonPulse 6s ease-in-out infinite alternate 1.5s',
            }}
          />
        </div>
      )}

      {/* 13. GOLDEN AUTUMN FOREST */}
      {ambientTheme === 'autumn-glade' && (
        <div className="absolute inset-0 w-full h-full bg-[#150a04] overflow-hidden">
          {/* Warm Amber Sunset Sky */}
          <div
            className="absolute inset-0 w-full h-full"
            style={{
              background:
                'radial-gradient(ellipse at 50% 20%, #3e1b09 0%, #240d04 55%, #0e0501 100%)',
            }}
          />

          {/* Golden Twilight Horizon Glow */}
          <div
            className="absolute -bottom-16 left-0 right-0 h-80 blur-[90px] opacity-45 pointer-events-none"
            style={{
              background:
                'radial-gradient(ellipse at 50% 100%, #ea580c 0%, #b45309 45%, transparent 75%)',
            }}
          />

          <div className="absolute inset-0 bg-gradient-to-t from-[#100602]/85 via-transparent to-[#100602]/30 pointer-events-none" />
        </div>
      )}

      {/* 14. ENCHANTED FIREFLY WOODS */}
      {ambientTheme === 'emerald-enchanted' && (
        <div className="absolute inset-0 w-full h-full bg-[#020b07] overflow-hidden">
          {/* Deep Forest Canopy Radial */}
          <div
            className="absolute inset-0 w-full h-full"
            style={{
              background:
                'radial-gradient(ellipse at 50% 60%, #07281c 0%, #03140e 55%, #010805 100%)',
            }}
          />

          {/* Mossy Atmospheric Canopy Fog */}
          <div
            className="absolute inset-0 w-full h-full opacity-25 pointer-events-none blur-3xl"
            style={{
              background:
                'radial-gradient(circle at 30% 70%, #10b981 0%, transparent 50%), radial-gradient(circle at 75% 30%, #34d399 0%, transparent 50%)',
              animation: 'fogDrift 24s ease-in-out infinite alternate',
            }}
          />
        </div>
      )}

      {/* 15. SONORAN STARRY DESERT */}
      {ambientTheme === 'desert-dusk' && (
        <div className="absolute inset-0 w-full h-full bg-[#0d091e] overflow-hidden">
          {/* Desert Dusk Violet-to-Plum Sky */}
          <div
            className="absolute inset-0 w-full h-full"
            style={{
              background:
                'linear-gradient(180deg, #090518 0%, #1a0f30 35%, #35153b 65%, #591b38 82%, #180718 100%)',
            }}
          />

          {/* Desert Mountain Silhouettes Horizon */}
          <div
            className="absolute bottom-0 left-0 right-0 h-44 pointer-events-none"
            style={{
              clipPath:
                'polygon(0% 100%, 0% 70%, 14% 50%, 28% 65%, 45% 35%, 62% 60%, 78% 38%, 90% 52%, 100% 45%, 100% 100%)',
              backgroundColor: '#0c0514',
            }}
          />
        </div>
      )}

      {/* 16. PINE MIST RAINFALL */}
      {ambientTheme === 'pine-rain' && (
        <div className="absolute inset-0 w-full h-full bg-[#081513] overflow-hidden">
          <div
            className="absolute inset-0 w-full h-full"
            style={{
              background:
                'linear-gradient(180deg, #06110f 0%, #0d221c 40%, #16362d 70%, #071310 100%)',
            }}
          />
          {/* Misty evergreen tree silhouettes */}
          <div
            className="absolute bottom-0 left-0 right-0 h-48 pointer-events-none opacity-80"
            style={{
              clipPath:
                'polygon(0% 100%, 0% 60%, 8% 35%, 12% 50%, 20% 25%, 26% 45%, 35% 20%, 42% 48%, 52% 22%, 60% 45%, 70% 18%, 78% 42%, 88% 28%, 95% 50%, 100% 30%, 100% 100%)',
              backgroundColor: '#040b09',
            }}
          />
          <div
            className="absolute inset-0 opacity-20 blur-2xl pointer-events-none"
            style={{
              background: 'radial-gradient(ellipse at 50% 20%, #10b981 0%, transparent 60%)',
            }}
          />
        </div>
      )}

      {/* 17. MIDNIGHT JAZZ CAFE */}
      {ambientTheme === 'jazz-cafe' && (
        <div className="absolute inset-0 w-full h-full bg-[#120804] overflow-hidden">
          <div
            className="absolute inset-0 w-full h-full"
            style={{
              background:
                'radial-gradient(ellipse at 50% 20%, #2c150b 0%, #170a05 50%, #070302 100%)',
            }}
          />
          {/* Warm Amber Bokeh Lights */}
          <div
            className="absolute top-12 left-1/4 w-40 h-40 rounded-full bg-amber-500/15 blur-2xl pointer-events-none animate-pulse"
            style={{ animationDuration: '6s' }}
          />
          <div
            className="absolute top-20 right-1/4 w-48 h-48 rounded-full bg-orange-500/15 blur-3xl pointer-events-none animate-pulse"
            style={{ animationDuration: '8s' }}
          />
          {/* Window Sill Vignette */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/40 pointer-events-none" />
        </div>
      )}

      {/* 18. VOLCANIC MAGMA HEARTH */}
      {ambientTheme === 'volcano-ember' && (
        <div className="absolute inset-0 w-full h-full bg-[#0a0201] overflow-hidden">
          <div
            className="absolute inset-0 w-full h-full"
            style={{
              background:
                'radial-gradient(ellipse at 50% 100%, #3e0c03 0%, #1f0502 50%, #070101 100%)',
            }}
          />
          {/* Magma Fissure Horizon */}
          <div
            className="absolute bottom-0 left-0 right-0 h-32 pointer-events-none opacity-40 blur-xl"
            style={{
              background:
                'linear-gradient(90deg, #ef4444 0%, #f97316 25%, #eab308 50%, #f97316 75%, #ef4444 100%)',
            }}
          />
          {/* Rising Ember Glow */}
          <div
            className="absolute -bottom-10 left-1/2 -translate-x-1/2 w-96 h-56 rounded-full bg-red-600/20 blur-3xl pointer-events-none animate-pulse"
            style={{ animationDuration: '4s' }}
          />
        </div>
      )}

      {/* 19. CELESTIAL SINGULARITY */}
      {ambientTheme === 'celestial-void' && (
        <div className="absolute inset-0 w-full h-full bg-[#030108] overflow-hidden">
          <div
            className="absolute inset-0 w-full h-full"
            style={{
              background:
                'radial-gradient(circle at 50% 50%, #15062e 0%, #090216 45%, #020005 100%)',
            }}
          />
          {/* Gravitational Accretion Disc Halo */}
          <div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[420px] h-[420px] rounded-full border border-purple-500/20 pointer-events-none animate-spin"
            style={{ animationDuration: '45s' }}
          />
          <div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[340px] h-[340px] rounded-full border border-cyan-400/25 blur-[1px] pointer-events-none animate-spin"
            style={{ animationDuration: '30s', animationDirection: 'reverse' }}
          />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 rounded-full bg-purple-600/15 blur-2xl pointer-events-none" />
        </div>
      )}

      {/* 20. KYOTO MOSS WATERFALL */}
      {ambientTheme === 'zen-waterfall' && (
        <div className="absolute inset-0 w-full h-full bg-[#030f0a] overflow-hidden">
          <div
            className="absolute inset-0 w-full h-full"
            style={{
              background:
                'radial-gradient(ellipse at 50% 25%, #0e2b20 0%, #061811 50%, #010805 100%)',
            }}
          />
          {/* Gentle Waterfall Mist Glow */}
          <div
            className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-full bg-gradient-to-b from-emerald-400/10 via-teal-400/15 to-transparent blur-2xl pointer-events-none"
          />
          {/* Mountain Silhouettes */}
          <div
            className="absolute bottom-0 left-0 right-0 h-40 pointer-events-none"
            style={{
              clipPath:
                'polygon(0% 100%, 0% 55%, 22% 35%, 45% 60%, 65% 30%, 85% 50%, 100% 40%, 100% 100%)',
              backgroundColor: '#020c08',
            }}
          />
        </div>
      )}

      {/* 21. ALPINE BLIZZARD SNOWFALL */}
      {ambientTheme === 'blizzard' && (
        <div className="absolute inset-0 w-full h-full bg-[#07131d] overflow-hidden">
          <div
            className="absolute inset-0 w-full h-full"
            style={{
              background:
                'linear-gradient(180deg, #050d15 0%, #0c1c2a 45%, #14293c 70%, #08131e 100%)',
            }}
          />
          {/* Alpine Mountain Ridges */}
          <div
            className="absolute bottom-0 left-0 right-0 h-44 pointer-events-none opacity-85"
            style={{
              clipPath:
                'polygon(0% 100%, 0% 50%, 18% 25%, 35% 45%, 55% 15%, 72% 38%, 88% 22%, 100% 45%, 100% 100%)',
              backgroundColor: '#040b12',
            }}
          />
          {/* Cold Arctic Atmosphere Glow */}
          <div className="absolute inset-0 bg-cyan-400/5 blur-3xl pointer-events-none" />
        </div>
      )}
    </div>
  );
};
