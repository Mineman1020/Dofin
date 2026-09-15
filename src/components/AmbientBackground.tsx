import React, { useMemo } from 'react';
import { AmbientThemeId } from '../types';

interface AmbientBackgroundProps {
  ambientTheme?: AmbientThemeId;
  particles?: boolean;
  className?: string;
}

export const AmbientBackground: React.FC<AmbientBackgroundProps> = ({
  ambientTheme = 'none',
  particles = true,
  className = '',
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

  const raindrops = useMemo(() => {
    return Array.from({ length: 42 }).map((_, i) => ({
      id: i,
      left: `${((i * 29.3) % 100)}%`,
      duration: `${0.75 + ((i * 13) % 0.9)}s`,
      delay: `${((i * 17) % 2.5)}s`,
      height: `${35 + ((i * 19) % 55)}px`,
      opacity: 0.15 + ((i * 7) % 0.35),
    }));
  }, []);

  const embers = useMemo(() => {
    return Array.from({ length: 32 }).map((_, i) => ({
      id: i,
      left: `${15 + ((i * 23.7) % 70)}%`,
      size: `${2 + ((i * 5) % 4)}px`,
      duration: `${4 + ((i * 13) % 4.5)}s`,
      delay: `${((i * 19) % 4.5)}s`,
      driftX: `${((i % 2 === 0 ? 1 : -1) * (15 + ((i * 7) % 40)))}px`,
      opacity: 0.4 + ((i * 11) % 0.5),
    }));
  }, []);

  const sunbeamMotes = useMemo(() => {
    return Array.from({ length: 28 }).map((_, i) => ({
      id: i,
      left: `${20 + ((i * 31) % 60)}%`,
      top: `${15 + ((i * 27) % 70)}%`,
      size: `${1.5 + ((i * 7) % 3)}px`,
      duration: `${6 + ((i * 17) % 5)}s`,
      delay: `${(i * 13) % 6}s`,
    }));
  }, []);

  if (!ambientTheme || ambientTheme === 'none') {
    return null;
  }

  return (
    <div
      id={`ambient-canvas-${ambientTheme}`}
      aria-hidden="true"
      className={`absolute inset-0 w-full h-full overflow-hidden pointer-events-none z-0 select-none ${className}`}
    >
      {/* 1. AURORA BOREALIS */}
      {ambientTheme === 'aurora' && (
        <div className="absolute inset-0 w-full h-full bg-[#020710]">
          {/* Arctic Stars */}
          {particles &&
            starfield.slice(0, 45).map((star) => (
              <div
                key={star.id}
                className="absolute rounded-full bg-white"
                style={{
                  left: star.left,
                  top: star.top,
                  width: star.size,
                  height: star.size,
                  animation: `starTwinkle ${star.duration} ease-in-out infinite`,
                  animationDelay: star.delay,
                  opacity: star.opacity,
                }}
              />
            ))}

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

          {/* Celestial Starfield */}
          {particles &&
            starfield.map((star) => (
              <div
                key={star.id}
                className="absolute rounded-full bg-white shadow-sm"
                style={{
                  left: star.left,
                  top: star.top,
                  width: star.size,
                  height: star.size,
                  boxShadow: `0 0 4px rgba(255, 255, 255, ${star.opacity})`,
                  animation: `starTwinkle ${star.duration} ease-in-out infinite`,
                  animationDelay: star.delay,
                  opacity: star.opacity,
                }}
              />
            ))}

          {/* Occasional Shooting Star */}
          <div
            className="absolute top-12 -left-20 w-36 h-[1.5px] bg-gradient-to-r from-transparent via-sky-300 to-white opacity-0"
            style={{
              transform: 'rotate(-28deg)',
              animation: 'rainFall 10s ease-in infinite',
              animationDelay: '3.5s',
            }}
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

          {/* Diagonal Rain Streaks */}
          {particles && (
            <div className="absolute inset-0 overflow-hidden transform rotate-6 scale-110">
              {raindrops.map((drop) => (
                <div
                  key={drop.id}
                  className="absolute w-[1px] bg-gradient-to-b from-transparent via-sky-200/70 to-transparent"
                  style={{
                    left: drop.left,
                    height: drop.height,
                    animation: `rainFall ${drop.duration} linear infinite`,
                    animationDelay: drop.delay,
                    opacity: drop.opacity,
                  }}
                />
              ))}
            </div>
          )}

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

          {/* Rising Ember Sparks */}
          {particles &&
            embers.map((ember) => (
              <div
                key={ember.id}
                className="absolute bottom-4 rounded-full bg-gradient-to-t from-orange-500 to-amber-300 shadow-sm"
                style={{
                  left: ember.left,
                  width: ember.size,
                  height: ember.size,
                  boxShadow: `0 0 6px rgba(249, 115, 22, ${ember.opacity})`,
                  animation: `emberRise ${ember.duration} ease-out infinite`,
                  animationDelay: ember.delay,
                  ['--ember-drift-x' as string]: ember.driftX,
                }}
              />
            ))}

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

          {/* Floating Twilight Dust */}
          {particles &&
            starfield.slice(0, 30).map((dust) => (
              <div
                key={dust.id}
                className="absolute rounded-full bg-amber-200"
                style={{
                  left: dust.left,
                  top: dust.top,
                  width: dust.size,
                  height: dust.size,
                  animation: `starTwinkle ${dust.duration} ease-in-out infinite`,
                  animationDelay: dust.delay,
                  opacity: 0.35,
                }}
              />
            ))}
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

          {/* Floating Sunlight Dust Motes */}
          {particles &&
            sunbeamMotes.map((mote) => (
              <div
                key={mote.id}
                className="absolute rounded-full bg-amber-300/80 shadow-sm"
                style={{
                  left: mote.left,
                  top: mote.top,
                  width: mote.size,
                  height: mote.size,
                  animation: `starTwinkle ${mote.duration} ease-in-out infinite`,
                  animationDelay: mote.delay,
                  opacity: 0.6,
                }}
              />
            ))}
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

          {/* Bioluminescent floating spores */}
          {particles &&
            starfield.slice(0, 35).map((spore) => (
              <div
                key={spore.id}
                className="absolute rounded-full bg-teal-300"
                style={{
                  left: spore.left,
                  top: spore.top,
                  width: spore.size,
                  height: spore.size,
                  boxShadow: '0 0 8px rgba(45, 212, 191, 0.6)',
                  animation: `starTwinkle ${spore.duration} ease-in-out infinite`,
                  animationDelay: spore.delay,
                  opacity: 0.5,
                }}
              />
            ))}

          {/* Abyss darkness vignette */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#01050a] via-transparent to-transparent" />
        </div>
      )}
    </div>
  );
};
