import {
  ClockSettings,
  PomodoroSettings,
  ThemePreset,
  PomodoroThemePreset,
  ClockFontFamily,
  SoundAlertChoice,
  AmbientThemePreset,
  AmbientThemeId,
  ClockStyle,
} from '../types';

export const AMBIENT_THEMES: AmbientThemePreset[] = [
  {
    id: 'none',
    name: 'Minimal Clean (No Ambient)',
    tagline: 'Standard minimalist background with zero atmospheric effects',
    bgGradient: 'transparent',
    textColor: '#ffffff',
    accentColor: '#38bdf8',
    secondaryColor: '#71717a',
    glowColor: 'none',
    recommendedFont: 'outfit',
    isDark: true,
    soundType: 'none',
    soundLabel: 'Muted',
  },
  {
    id: 'beachside-sunset',
    name: 'Beachside Sunset',
    tagline: 'Golden tropical sun sinking over turquoise ocean swells with gentle rolling surf',
    bgGradient: 'linear-gradient(180deg, #170826 0%, #3a1132 28%, #762238 56%, #b54f36 78%, #0d283c 100%)',
    textColor: '#fff1f2',
    accentColor: '#fb923c',
    secondaryColor: '#38bdf8',
    glowColor: 'rgba(251, 146, 60, 0.45)',
    recommendedFont: 'outfit',
    isDark: true,
    soundType: 'ocean-waves',
    soundLabel: 'Ocean Surf & Breakers',
  },
  {
    id: 'rainy-day',
    name: 'Rainy Day Overcast',
    tagline: 'Misty slate skies, soothing raindrops on glass with ground splash ripples',
    bgGradient: 'linear-gradient(180deg, #0d1520 0%, #152232 45%, #1a2a3e 70%, #0e1724 100%)',
    textColor: '#e2e8f0',
    accentColor: '#60a5fa',
    secondaryColor: '#94a3b8',
    glowColor: 'rgba(96, 165, 250, 0.35)',
    recommendedFont: 'jetbrains',
    isDark: true,
    soundType: 'rain',
    soundLabel: 'Soothing Steady Rain',
  },
  {
    id: 'aurora',
    name: 'Aurora Borealis',
    tagline: 'Dancing ribbons of emerald and violet across an arctic midnight sky',
    bgGradient: 'radial-gradient(ellipse at 50% 10%, #09282b 0%, #061423 55%, #020710 100%)',
    textColor: '#ecfdf5',
    accentColor: '#10b981',
    secondaryColor: '#a78bfa',
    glowColor: 'rgba(16, 185, 129, 0.45)',
    recommendedFont: 'outfit',
    isDark: true,
    soundType: 'cosmic-drone',
    soundLabel: 'Cosmic Theta Waves',
  },
  {
    id: 'starlight',
    name: 'Cosmic Starlight',
    tagline: 'Twinkling celestial starfield, distant nebula clouds & silent void',
    bgGradient: 'radial-gradient(ellipse at 50% 30%, #0d1930 0%, #050b18 60%, #02040a 100%)',
    textColor: '#f0f9ff',
    accentColor: '#38bdf8',
    secondaryColor: '#818cf8',
    glowColor: 'rgba(56, 189, 248, 0.4)',
    recommendedFont: 'space-grotesk',
    isDark: true,
    soundType: 'cosmic-drone',
    soundLabel: 'Deep Space Drone',
  },
  {
    id: 'rainy-window',
    name: 'Cozy Lo-Fi Rain',
    tagline: 'Gentle raindrops streaming down a misted evening window with city glow',
    bgGradient: 'radial-gradient(ellipse at 40% 20%, #172738 0%, #0e1722 60%, #070b10 100%)',
    textColor: '#f1f5f9',
    accentColor: '#60a5fa',
    secondaryColor: '#fbbf24',
    glowColor: 'rgba(96, 165, 250, 0.35)',
    recommendedFont: 'jetbrains',
    isDark: true,
    soundType: 'rain',
    soundLabel: 'Gentle Window Rain',
  },
  {
    id: 'campfire',
    name: 'Campfire Embers',
    tagline: 'Warm glowing hearth, rising sparks, and crackling logs in the dark',
    bgGradient: 'radial-gradient(ellipse at 50% 100%, #351508 0%, #180804 55%, #090301 100%)',
    textColor: '#ffedd5',
    accentColor: '#f97316',
    secondaryColor: '#fbbf24',
    glowColor: 'rgba(249, 115, 22, 0.45)',
    recommendedFont: 'montserrat',
    isDark: true,
    soundType: 'campfire',
    soundLabel: 'Crackling Fireplace',
  },
  {
    id: 'cyber-horizon',
    name: 'Synthwave Horizon',
    tagline: 'Neon wireframe horizon grid receding towards a retro synth sun',
    bgGradient: 'linear-gradient(180deg, #0a0319 0%, #1b0936 45%, #2c0b3b 65%, #06010c 100%)',
    textColor: '#fae8ff',
    accentColor: '#06b6d4',
    secondaryColor: '#f43f5e',
    glowColor: 'rgba(6, 182, 212, 0.5)',
    recommendedFont: 'audiowide',
    isDark: true,
    soundType: 'cosmic-drone',
    soundLabel: 'Analog Synth Hum',
  },
  {
    id: 'zen-mist',
    name: 'Zen Bamboo Mist',
    tagline: 'Early morning mountain fog whispering through calm bamboo silhouettes',
    bgGradient: 'radial-gradient(ellipse at 50% 50%, #182720 0%, #0e1813 60%, #060b08 100%)',
    textColor: '#ecfdf5',
    accentColor: '#34d399',
    secondaryColor: '#a7f3d0',
    glowColor: 'rgba(52, 211, 153, 0.35)',
    recommendedFont: 'cinzel',
    isDark: true,
    soundType: 'zen-stream',
    soundLabel: 'Mountain Stream & Mist',
  },
  {
    id: 'golden-hour',
    name: 'Sunset Golden Hour',
    tagline: 'Soft gradient descent from radiant gold to deep dusk plum twilight',
    bgGradient: 'linear-gradient(180deg, #1a112a 0%, #30132f 40%, #4c1e30 70%, #1d0917 100%)',
    textColor: '#fef3c7',
    accentColor: '#f59e0b',
    secondaryColor: '#f43f5e',
    glowColor: 'rgba(245, 158, 11, 0.4)',
    recommendedFont: 'playfair',
    isDark: true,
    soundType: 'zen-stream',
    soundLabel: 'Twilight Breeze',
  },
  {
    id: 'retro-crt',
    name: 'Retro Amber CRT',
    tagline: 'Authentic 1980s computer terminal with phosphor bloom and scanlines',
    bgGradient: 'radial-gradient(circle at 50% 50%, #1b1205 0%, #100b02 70%, #050301 100%)',
    textColor: '#fbbf24',
    accentColor: '#f59e0b',
    secondaryColor: '#b45309',
    glowColor: 'rgba(251, 191, 36, 0.5)',
    recommendedFont: 'vt323',
    isDark: true,
    soundType: 'cosmic-drone',
    soundLabel: 'Cathode Tube Hum',
  },
  {
    id: 'sunbeam',
    name: 'Solarium Sunbeam (Light)',
    tagline: 'Serene warm daylight filtering diagonally across a matte plaster wall',
    bgGradient: 'linear-gradient(135deg, #fdfbf7 0%, #f7f3ec 50%, #ece5d8 100%)',
    textColor: '#1c1917',
    accentColor: '#d97706',
    secondaryColor: '#78716c',
    glowColor: 'rgba(217, 119, 6, 0.2)',
    recommendedFont: 'outfit',
    isDark: false,
    soundType: 'zen-stream',
    soundLabel: 'Morning Solarium',
  },
  {
    id: 'deep-abyss',
    name: 'Deep Ocean Abyss',
    tagline: 'Bioluminescent light filtering into deep midnight sapphire waters',
    bgGradient: 'radial-gradient(ellipse at 50% 0%, #082642 0%, #041528 50%, #010710 100%)',
    textColor: '#e0f2fe',
    accentColor: '#38bdf8',
    secondaryColor: '#2dd4bf',
    glowColor: 'rgba(56, 189, 248, 0.45)',
    recommendedFont: 'orbitron',
    isDark: true,
    soundType: 'cosmic-drone',
    soundLabel: 'Submerged Ambient Drift',
  },
  {
    id: 'cherry-blossom',
    name: 'Sakura Spring Twilight',
    tagline: 'Gentle pink dusk with soft cherry blossom petals floating on a spring breeze',
    bgGradient: 'linear-gradient(180deg, #1c0a1a 0%, #35132d 40%, #521c43 70%, #1a0817 100%)',
    textColor: '#fdf2f8',
    accentColor: '#f472b6',
    secondaryColor: '#fb7185',
    glowColor: 'rgba(244, 114, 182, 0.45)',
    recommendedFont: 'cormorant',
    isDark: true,
    soundType: 'zen-stream',
    soundLabel: 'Spring Blossom Breeze',
  },
  {
    id: 'neon-cyber-city',
    name: 'Neo Tokyo Cyber Rain',
    tagline: 'Futuristic glowing cyber skyline with holographic neon reflections and drizzle',
    bgGradient: 'radial-gradient(ellipse at 50% 100%, #1a0429 0%, #0d0218 50%, #040108 100%)',
    textColor: '#fae8ff',
    accentColor: '#06b6d4',
    secondaryColor: '#e879f9',
    glowColor: 'rgba(6, 182, 212, 0.5)',
    recommendedFont: 'syne',
    isDark: true,
    soundType: 'rain',
    soundLabel: 'Neon City Drizzle',
  },
  {
    id: 'autumn-glade',
    name: 'Golden Autumn Forest',
    tagline: 'Amber and copper foliage silhouettes with golden autumn leaves twirling softly down',
    bgGradient: 'linear-gradient(180deg, #1f1008 0%, #3a1a0b 45%, #4e260e 70%, #180a04 100%)',
    textColor: '#fef3c7',
    accentColor: '#f59e0b',
    secondaryColor: '#ea580c',
    glowColor: 'rgba(245, 158, 11, 0.45)',
    recommendedFont: 'playfair',
    isDark: true,
    soundType: 'campfire',
    soundLabel: 'Autumn Woods & Leaves',
  },
  {
    id: 'emerald-enchanted',
    name: 'Enchanted Firefly Woods',
    tagline: 'Deep mossy primeval forest illuminated by pulsing bioluminescent fireflies',
    bgGradient: 'radial-gradient(ellipse at 50% 70%, #062016 0%, #03140e 55%, #010805 100%)',
    textColor: '#ecfdf5',
    accentColor: '#34d399',
    secondaryColor: '#10b981',
    glowColor: 'rgba(52, 211, 153, 0.5)',
    recommendedFont: 'outfit',
    isDark: true,
    soundType: 'zen-stream',
    soundLabel: 'Nocturnal Glade & Fireflies',
  },
  {
    id: 'desert-dusk',
    name: 'Sonoran Starry Desert',
    tagline: 'Violet desert twilight over rugged mountain ridges with crystalline desert stars',
    bgGradient: 'linear-gradient(180deg, #110d24 0%, #20133a 40%, #431f45 70%, #150917 100%)',
    textColor: '#fae8ff',
    accentColor: '#e879f9',
    secondaryColor: '#f59e0b',
    glowColor: 'rgba(232, 121, 249, 0.45)',
    recommendedFont: 'righteous',
    isDark: true,
    soundType: 'cosmic-drone',
    soundLabel: 'Desert Twilight Wind',
  },
  {
    id: 'pine-rain',
    name: 'Pine Mist Rainfall',
    tagline: 'Deep evergreen pine forests draped in silver mountain clouds and steady rainfall',
    bgGradient: 'linear-gradient(180deg, #091715 0%, #122822 45%, #18382f 70%, #081311 100%)',
    textColor: '#e6fbf3',
    accentColor: '#10b981',
    secondaryColor: '#34d399',
    glowColor: 'rgba(16, 185, 129, 0.4)',
    recommendedFont: 'fraunces',
    isDark: true,
    soundType: 'rain',
    soundLabel: 'Conifer Forest Rain',
  },
  {
    id: 'jazz-cafe',
    name: 'Midnight Jazz Cafe',
    tagline: 'Amber pendant lights glowing through rain-slicked city window with warm vinyl tones',
    bgGradient: 'radial-gradient(ellipse at 50% 30%, #27140b 0%, #140905 55%, #080302 100%)',
    textColor: '#fef3c7',
    accentColor: '#f59e0b',
    secondaryColor: '#fb923c',
    glowColor: 'rgba(245, 158, 11, 0.45)',
    recommendedFont: 'cormorant',
    isDark: true,
    soundType: 'campfire',
    soundLabel: 'Warm Vinyl & Cafe Hearth',
  },
  {
    id: 'volcano-ember',
    name: 'Volcanic Magma Hearth',
    tagline: 'Cracked obsidian crust glowing with fiery magma fissures and ascending embers',
    bgGradient: 'radial-gradient(ellipse at 50% 100%, #3d0d04 0%, #1b0402 55%, #080101 100%)',
    textColor: '#ffedd5',
    accentColor: '#ef4444',
    secondaryColor: '#f97316',
    glowColor: 'rgba(239, 68, 68, 0.5)',
    recommendedFont: 'bungee',
    isDark: true,
    soundType: 'campfire',
    soundLabel: 'Magma Glow & Sparks',
  },
  {
    id: 'celestial-void',
    name: 'Celestial Singularity',
    tagline: 'Gravitational accretion disc with pure starlight halo bending across infinite obsidian',
    bgGradient: 'radial-gradient(circle at 50% 50%, #100624 0%, #070212 50%, #010003 100%)',
    textColor: '#f5f3ff',
    accentColor: '#a855f7',
    secondaryColor: '#06b6d4',
    glowColor: 'rgba(168, 85, 247, 0.45)',
    recommendedFont: 'oxanium',
    isDark: true,
    soundType: 'cosmic-drone',
    soundLabel: 'Gravitational Void Hum',
  },
  {
    id: 'zen-waterfall',
    name: 'Kyoto Moss Waterfall',
    tagline: 'Serene mountain cascades falling onto smooth jade river pebbles in morning mist',
    bgGradient: 'radial-gradient(ellipse at 50% 30%, #0c201a 0%, #061510 55%, #020907 100%)',
    textColor: '#f0fdf4',
    accentColor: '#22c55e',
    secondaryColor: '#38bdf8',
    glowColor: 'rgba(34, 197, 94, 0.4)',
    recommendedFont: 'cinzel',
    isDark: true,
    soundType: 'zen-stream',
    soundLabel: 'Mountain Cascade & Pool',
  },
  {
    id: 'blizzard',
    name: 'Alpine Blizzard Snowfall',
    tagline: 'Gentle crystalline snowflakes swirling against deep arctic midnight pine silhouettes',
    bgGradient: 'linear-gradient(180deg, #091724 0%, #122538 45%, #182e44 70%, #0a131c 100%)',
    textColor: '#f8fafc',
    accentColor: '#38bdf8',
    secondaryColor: '#93c5fd',
    glowColor: 'rgba(56, 189, 248, 0.4)',
    recommendedFont: 'comfortaa',
    isDark: true,
    soundType: 'zen-stream',
    soundLabel: 'Alpine Winter Breeze',
  },
];

export const THEME_PRESETS: ThemePreset[] = [
  {
    id: 'warm-minimal',
    name: 'Warm Paper (Light)',
    bgClass: 'bg-[#f7f5f0]',
    textColor: '#1c1917', // stone-900
    accentColor: '#d97706', // amber-600
    secondaryColor: '#78716c',
    cardBg: 'rgba(255, 255, 255, 0.85)',
    isDark: false,
  },
  {
    id: 'crisp-white',
    name: 'Clean Studio (Light)',
    bgClass: 'bg-[#f8fafc]',
    textColor: '#0f172a', // slate-900
    accentColor: '#2563eb', // blue-600
    secondaryColor: '#64748b',
    cardBg: 'rgba(255, 255, 255, 0.95)',
    isDark: false,
  },
  {
    id: 'nordic-frost',
    name: 'Nordic Frost (Light)',
    bgClass: 'bg-[#eef2f6]',
    textColor: '#1e293b',
    accentColor: '#0284c7',
    secondaryColor: '#64748b',
    cardBg: 'rgba(255, 255, 255, 0.9)',
    isDark: false,
  },
  {
    id: 'matcha-latte',
    name: 'Matcha & Sandstone (Light)',
    bgClass: 'bg-[#f4f6f0]',
    textColor: '#1e2920',
    accentColor: '#4d7c0f',
    secondaryColor: '#65a30d',
    cardBg: 'rgba(255, 255, 255, 0.9)',
    isDark: false,
  },
  {
    id: 'rose-quartz',
    name: 'Rose Quartz & Champagne (Light)',
    bgClass: 'bg-[#fdf7f9]',
    textColor: '#3b1219',
    accentColor: '#e11d48',
    secondaryColor: '#be123c',
    cardBg: 'rgba(255, 255, 255, 0.92)',
    isDark: false,
  },
  {
    id: 'desert-dune',
    name: 'Desert Dune Terracotta (Light)',
    bgClass: 'bg-[#faf4ed]',
    textColor: '#291811',
    accentColor: '#ea580c',
    secondaryColor: '#c2410c',
    cardBg: 'rgba(255, 255, 255, 0.9)',
    isDark: false,
  },
  {
    id: 'oled-black',
    name: 'OLED Midnight (Dark)',
    bgClass: 'bg-black',
    textColor: '#ffffff',
    accentColor: '#38bdf8', // sky-400
    secondaryColor: '#71717a', // zinc-500
    cardBg: 'rgba(24, 24, 27, 0.8)',
    isDark: true,
  },
  {
    id: 'tokyo-night',
    name: 'Tokyo Violet (Dark)',
    bgClass: 'bg-[#0f111a]',
    textColor: '#e2e8f0',
    accentColor: '#a78bfa', // violet-400
    secondaryColor: '#64748b',
    cardBg: 'rgba(23, 25, 40, 0.8)',
    isDark: true,
  },
  {
    id: 'amber-vintage',
    name: 'Amber Vintage CRT (Dark)',
    bgClass: 'bg-[#120e06]',
    textColor: '#fbbf24', // amber-400
    accentColor: '#f59e0b', // amber-500
    secondaryColor: '#92400e',
    cardBg: 'rgba(36, 26, 10, 0.8)',
    isDark: true,
  },
  {
    id: 'cyber-neon',
    name: 'Emerald Matrix (Dark)',
    bgClass: 'bg-[#04130c]',
    textColor: '#34d399', // emerald-400
    accentColor: '#10b981',
    secondaryColor: '#065f46',
    cardBg: 'rgba(6, 30, 20, 0.8)',
    isDark: true,
  },
  {
    id: 'sunset-dusk',
    name: 'Sunset Dusk (Dark)',
    bgClass: 'bg-[#181124]',
    textColor: '#fda4af', // rose-300
    accentColor: '#f43f5e',
    secondaryColor: '#881337',
    cardBg: 'rgba(38, 22, 54, 0.8)',
    isDark: true,
  },
  {
    id: 'deep-ocean',
    name: 'Deep Blue (Dark)',
    bgClass: 'bg-[#071324]',
    textColor: '#7dd3fc', // sky-300
    accentColor: '#0284c7',
    secondaryColor: '#075985',
    cardBg: 'rgba(12, 33, 60, 0.8)',
    isDark: true,
  },
  {
    id: 'midnight-amethyst',
    name: 'Midnight Amethyst (Dark)',
    bgClass: 'bg-[#0d0714]',
    textColor: '#f3e8ff',
    accentColor: '#c084fc',
    secondaryColor: '#9333ea',
    cardBg: 'rgba(25, 14, 40, 0.85)',
    isDark: true,
  },
  {
    id: 'crimson-noir',
    name: 'Crimson Noir (Dark)',
    bgClass: 'bg-[#0c0506]',
    textColor: '#fee2e2',
    accentColor: '#ef4444',
    secondaryColor: '#b91c1c',
    cardBg: 'rgba(28, 12, 14, 0.85)',
    isDark: true,
  },
  {
    id: 'caribbean-cyan',
    name: 'Caribbean Laguna (Dark)',
    bgClass: 'bg-[#03151e]',
    textColor: '#cffafe',
    accentColor: '#06b6d4',
    secondaryColor: '#0891b2',
    cardBg: 'rgba(5, 30, 42, 0.85)',
    isDark: true,
  },
  {
    id: 'monochrome-titanium',
    name: 'Monochrome Titanium (Dark)',
    bgClass: 'bg-[#111317]',
    textColor: '#f8fafc',
    accentColor: '#e2e8f0',
    secondaryColor: '#64748b',
    cardBg: 'rgba(28, 32, 40, 0.85)',
    isDark: true,
  },
  {
    id: 'sakura-porcelain',
    name: 'Sakura Porcelain (Light)',
    bgClass: 'bg-[#faf6f7]',
    textColor: '#291419',
    accentColor: '#e11d48',
    secondaryColor: '#be123c',
    cardBg: 'rgba(255, 255, 255, 0.92)',
    isDark: false,
  },
  {
    id: 'sage-eucalyptus',
    name: 'Sage & Eucalyptus (Light)',
    bgClass: 'bg-[#f2f6f3]',
    textColor: '#14281c',
    accentColor: '#059669',
    secondaryColor: '#166534',
    cardBg: 'rgba(255, 255, 255, 0.92)',
    isDark: false,
  },
  {
    id: 'vanilla-honey',
    name: 'Vanilla Cream & Honey (Light)',
    bgClass: 'bg-[#fefcf6]',
    textColor: '#2c1e10',
    accentColor: '#d97706',
    secondaryColor: '#b45309',
    cardBg: 'rgba(255, 255, 255, 0.94)',
    isDark: false,
  },
  {
    id: 'lavender-haze',
    name: 'Lavender & Periwinkle (Light)',
    bgClass: 'bg-[#f8f7fc]',
    textColor: '#1e1b38',
    accentColor: '#6366f1',
    secondaryColor: '#4f46e5',
    cardBg: 'rgba(255, 255, 255, 0.92)',
    isDark: false,
  },
  {
    id: 'kyoto-moss',
    name: 'Kyoto Moss & Jade (Dark)',
    bgClass: 'bg-[#0a120e]',
    textColor: '#e6fbf2',
    accentColor: '#10b981',
    secondaryColor: '#84cc16',
    cardBg: 'rgba(12, 28, 20, 0.85)',
    isDark: true,
  },
  {
    id: 'espresso-caramel',
    name: 'Roasted Espresso & Caramel (Dark)',
    bgClass: 'bg-[#150d09]',
    textColor: '#ffedd5',
    accentColor: '#f59e0b',
    secondaryColor: '#ea580c',
    cardBg: 'rgba(32, 18, 12, 0.85)',
    isDark: true,
  },
  {
    id: 'pacific-trench',
    name: 'Pacific Marine Abyss (Dark)',
    bgClass: 'bg-[#021822]',
    textColor: '#cffafe',
    accentColor: '#00f5d4',
    secondaryColor: '#06b6d4',
    cardBg: 'rgba(3, 32, 45, 0.85)',
    isDark: true,
  },
  {
    id: 'cyberpunk-2077',
    name: 'Cyberpunk 2077 Night City (Dark)',
    bgClass: 'bg-[#090414]',
    textColor: '#fef08a',
    accentColor: '#fcee0a',
    secondaryColor: '#00f0ff',
    cardBg: 'rgba(22, 10, 36, 0.85)',
    isDark: true,
  },
  {
    id: 'vintage-burgundy',
    name: 'Imperial Burgundy & Velvet (Dark)',
    bgClass: 'bg-[#1a0711]',
    textColor: '#ffe4e6',
    accentColor: '#e11d48',
    secondaryColor: '#f43f5e',
    cardBg: 'rgba(38, 12, 26, 0.85)',
    isDark: true,
  },
  {
    id: 'solar-eclipse',
    name: 'Solar Eclipse Corona (Dark)',
    bgClass: 'bg-[#050505]',
    textColor: '#fef3c7',
    accentColor: '#fbbf24',
    secondaryColor: '#f59e0b',
    cardBg: 'rgba(24, 20, 10, 0.85)',
    isDark: true,
  },
  {
    id: 'sedona-canyon',
    name: 'Sedona Red Rock Canyon (Dark)',
    bgClass: 'bg-[#180a06]',
    textColor: '#ffedd5',
    accentColor: '#f97316',
    secondaryColor: '#ea580c',
    cardBg: 'rgba(36, 14, 8, 0.85)',
    isDark: true,
  },
  {
    id: 'neo-gotham',
    name: 'Neo Gotham Slate (Dark)',
    bgClass: 'bg-[#0c0e12]',
    textColor: '#f1f5f9',
    accentColor: '#38bdf8',
    secondaryColor: '#64748b',
    cardBg: 'rgba(20, 24, 30, 0.85)',
    isDark: true,
  },
  {
    id: 'custom',
    name: 'Custom Theme',
    bgClass: 'bg-[#f7f5f0]',
    textColor: '#1c1917',
    accentColor: '#d97706',
    secondaryColor: '#78716c',
    cardBg: 'rgba(255, 255, 255, 0.9)',
    isDark: false,
  },
];

export const FONT_OPTIONS: { id: ClockFontFamily; name: string; sample: string; cssFamily: string }[] = [
  { id: 'outfit', name: 'Modern Sans', sample: '10:45:22', cssFamily: "'Outfit', sans-serif" },
  { id: 'jetbrains', name: 'JetBrains Terminal', sample: '10:45:22', cssFamily: "'JetBrains Mono', monospace" },
  { id: 'orbitron', name: 'Digital Sci-Fi', sample: '10:45:22', cssFamily: "'Orbitron', sans-serif" },
  { id: 'space-grotesk', name: 'Space Grotesk', sample: '10:45:22', cssFamily: "'Space Grotesk', sans-serif" },
  { id: 'audiowide', name: 'Audiowide Synth', sample: '10:45:22', cssFamily: "'Audiowide', cursive" },
  { id: 'vt323', name: 'Arcade Pixel (VT323)', sample: '10:45:22', cssFamily: "'VT323', monospace" },
  { id: 'cinzel', name: 'Cinzel Classic Luxury', sample: '10:45:22', cssFamily: "'Cinzel', serif" },
  { id: 'playfair', name: 'Playfair Editorial', sample: '10:45:22', cssFamily: "'Playfair Display', serif" },
  { id: 'montserrat', name: 'Montserrat Geometric', sample: '10:45:22', cssFamily: "'Montserrat', sans-serif" },
  { id: 'poppins', name: 'Poppins Soft', sample: '10:45:22', cssFamily: "'Poppins', sans-serif" },
  { id: 'courier', name: 'Courier Prime Serif Type', sample: '10:45:22', cssFamily: "'Courier Prime', monospace" },
  { id: 'share-tech', name: 'Share Tech Mono', sample: '10:45:22', cssFamily: "'Share Tech Mono', monospace" },
  { id: 'bebas', name: 'Bebas Bold Flip', sample: '10:45:22', cssFamily: "'Bebas Neue', sans-serif" },
  { id: 'syne', name: 'Syne Avant-Garde', sample: '10:45:22', cssFamily: "'Syne', sans-serif" },
  { id: 'righteous', name: 'Righteous Streamline', sample: '10:45:22', cssFamily: "'Righteous', cursive" },
  { id: 'silkscreen', name: 'Silkscreen 8-Bit Pixel', sample: '10:45:22', cssFamily: "'Silkscreen', monospace" },
  { id: 'cormorant', name: 'Cormorant Royal Serif', sample: '10:45:22', cssFamily: "'Cormorant Garamond', serif" },
  { id: 'unbounded', name: 'Unbounded Neo-Display', sample: '10:45:22', cssFamily: "'Unbounded', sans-serif" },
  { id: 'major-mono', name: 'Major Mono Minimalist', sample: '10:45:22', cssFamily: "'Major Mono Display', monospace" },
  { id: 'comfortaa', name: 'Comfortaa Neo-Curve', sample: '10:45:22', cssFamily: "'Comfortaa', sans-serif" },
  { id: 'oxanium', name: 'Oxanium Cyber HUD', sample: '10:45:22', cssFamily: "'Oxanium', sans-serif" },
  { id: 'press-start', name: 'Press Start 8-Bit', sample: '10:45:22', cssFamily: "'Press Start 2P', monospace" },
  { id: 'rubik-mono', name: 'Rubik Mono Block', sample: '10:45:22', cssFamily: "'Rubik Mono One', monospace" },
  { id: 'fraunces', name: 'Fraunces Heritage Serif', sample: '10:45:22', cssFamily: "'Fraunces', serif" },
  { id: 'monoton', name: 'Monoton Disco Tri-Line', sample: '10:45:22', cssFamily: "'Monoton', cursive" },
  { id: 'rajdhani', name: 'Rajdhani Mecha Aero', sample: '10:45:22', cssFamily: "'Rajdhani', sans-serif" },
  { id: 'dm-serif', name: 'DM Serif Grand Luxury', sample: '10:45:22', cssFamily: "'DM Serif Display', serif" },
  { id: 'bungee', name: 'Bungee Heavy Urban', sample: '10:45:22', cssFamily: "'Bungee', cursive" },
];

/**
 * Optical scale normalization factors across different typeface metrics.
 * Ensures the physical and visual bounding clock size remains strictly identical (1.0)
 * for every font option across all size settings (medium, large, huge, fill).
 */
export const FONT_OPTICAL_SCALES: Record<ClockFontFamily, number> = {
  outfit: 1.0,
  jetbrains: 1.02,
  orbitron: 0.98,
  'space-grotesk': 1.0,
  audiowide: 0.98,
  vt323: 1.32,
  cinzel: 1.02,
  playfair: 0.98,
  montserrat: 1.0,
  poppins: 0.98,
  courier: 1.06,
  'share-tech': 1.04,
  bebas: 0.86,
  syne: 0.96,
  righteous: 0.98,
  silkscreen: 1.28,
  cormorant: 1.08,
  unbounded: 0.90,
  'major-mono': 1.05,
  comfortaa: 0.98,
  oxanium: 0.98,
  'press-start': 1.34,
  'rubik-mono': 0.92,
  fraunces: 0.96,
  monoton: 0.95,
  rajdhani: 1.02,
  'dm-serif': 0.96,
  bungee: 0.86,
};

export const SOUND_ALERT_OPTIONS: { id: SoundAlertChoice; name: string; desc: string }[] = [
  { id: 'zen-bell', name: 'Zen Meditation Bell', desc: 'Soothing Tibetan singing bowl resonance' },
  { id: 'gentle-marimba', name: 'Gentle Marimba', desc: 'Warm wooden acoustic chime sequence' },
  { id: 'digital-beep', name: 'Digital Cyber Beep', desc: 'Futuristic crisp three-pulse chime' },
  { id: 'crystal-harp', name: 'Crystal Harp', desc: 'Celestial ascending harp arpeggio' },
  { id: 'classic-alarm', name: 'Gentle Vintage Alarm', desc: 'Soft classic mechanical two-tone chime' },
  { id: 'custom', name: 'Custom Uploaded Sound', desc: 'Your own uploaded MP3/WAV/OGG sound file' },
];

// Default to Light theme as requested!
export const DEFAULT_CLOCK_SETTINGS: ClockSettings = {
  themeId: 'warm-minimal',
  customBg: '',
  customTextColor: '',
  customAccentColor: '',
  fontFamily: 'outfit',
  digitSize: 'large',
  timeFormat: '12h',
  showSeconds: true,
  showAmPm: true,
  showDate: true,
  showDayOfWeek: true,
  showQuote: true,
  quoteText: 'Focus on being productive instead of busy.',
  tickSound: false,
  hourlyChime: true,
  brightness: 100,
  antiBurnIn: true,
  enableScrolling: true,
  ambientTheme: 'none',
  ambientSoundEnabled: false,
  ambientSoundVolume: 35,
  ambientParticles: true,

  // Wallpaper Modes & Depth Effect
  wallpaperMode: 'theme',
  wallpaperOpacity: 25,
  wallpaperBlur: 0,
  slideshowIntervalSeconds: 30,
  depthEffect: false,
  depthIntensity: 60,
  introEffect: 'chronos',
  introSound: true,
  shareStatsWithParty: true,

  // Clock Style Design
  clockStyle: 'modern',
  clockFaceTransparency: 0,

  // Freeform Layout & Scaling
  customLayoutEnabled: false,
  clockPosition: { x: 0, y: 0 },
  clockScale: 1,
  clockScaleX: 1,
  clockScaleY: 1,
  clockRotation: 0,

  // Individual Element Adjustments
  dateLayout: { x: 0, y: 0, scaleX: 1, scaleY: 1, rotation: 0 },
  mantraLayout: { x: 0, y: 0, scaleX: 1, scaleY: 1, rotation: 0 },
  ampmLayout: { x: 0, y: 0, scaleX: 1, scaleY: 1, rotation: 0 },

  // Color Mixes & Gradients & Matched Background
  colorMode: 'solid',
  gradientPresetId: 'sunset-blaze',
  customGradientStart: '#f59e0b',
  customGradientEnd: '#f43f5e',
  customGradientAngle: 135,
  matchedBackground: 'off',

  // Widgets
  showBatteryWidget: true,
  batteryWidgetStyle: 'pill',
  batteryWidgetPosition: { x: 0, y: 0 },
  batteryWidgetScale: 1,

  showStopwatchWidget: false,
  stopwatchWidgetStyle: 'compact',
  stopwatchWidgetPosition: { x: 0, y: 0 },
  stopwatchWidgetScale: 1,

  showWeatherWidget: true,
  weatherLocation: 'San Francisco, CA',
  weatherLatitude: 37.7749,
  weatherLongitude: -122.4194,
  weatherUnit: 'fahrenheit',
  weatherWidgetStyle: 'pill',
  weatherWidgetPosition: { x: 0, y: 0 },
  weatherWidgetScale: 1,

  widgetTheme: 'glass',
  widgetEditMode: false,
};

export interface ClockStyleOption {
  id: ClockStyle;
  name: string;
  tagline: string;
  category: 'digital' | 'mechanical' | 'analog' | 'futuristic';
  badge?: string;
}

export const CLOCK_STYLE_OPTIONS: ClockStyleOption[] = [
  {
    id: 'modern',
    name: 'Modern Minimal',
    tagline: 'Clean typographic digital standby display with ambient glow & custom gradients',
    category: 'digital',
    badge: 'Popular',
  },
  {
    id: 'flip',
    name: 'Retro Flip Clock',
    tagline: '3D split-flap mechanical flip cards with center crease & realistic pivot pins',
    category: 'mechanical',
    badge: 'Vintage',
  },
  {
    id: 'analog',
    name: 'Precision Analog',
    tagline: 'Luxury Swiss-inspired analog chronograph with smooth sweeping second hand',
    category: 'analog',
  },
  {
    id: 'seven-segment',
    name: '7-Segment LED',
    tagline: 'Retro futuristic digital alarm LED tube display with authentic illuminated segments',
    category: 'digital',
  },
  {
    id: 'neon-cyber',
    name: 'Cyberpunk HUD',
    tagline: 'Sci-fi telemetry terminal with neon brackets, scanner grid, and cyber HUD',
    category: 'futuristic',
    badge: 'Sci-Fi',
  },
  {
    id: 'arc-radial',
    name: 'Radial Arc Gauge',
    tagline: 'Concentric orbital circular arcs tracking hours, minutes, and seconds',
    category: 'futuristic',
  },
];

export const POMODORO_THEME_PRESETS: PomodoroThemePreset[] = [
  {
    id: 'classic-tomato',
    name: 'Classic Tomato',
    bgClass: 'bg-[#fbf7f5]',
    bgColor: '#fbf7f5',
    textColor: '#1c1917',
    workColor: '#ef4444', // crimson red
    shortBreakColor: '#0ea5e9', // cyan
    longBreakColor: '#10b981', // emerald
    cardBg: 'rgba(255, 255, 255, 0.9)',
    isDark: false,
  },
  {
    id: 'warm-amber',
    name: 'Warm Amber (Light)',
    bgClass: 'bg-[#f7f5f0]',
    bgColor: '#f7f5f0',
    textColor: '#1c1917',
    workColor: '#f59e0b', // amber
    shortBreakColor: '#0284c7', // sky
    longBreakColor: '#059669', // green
    cardBg: 'rgba(255, 255, 255, 0.9)',
    isDark: false,
  },
  {
    id: 'clean-studio',
    name: 'Clean Studio (Light)',
    bgClass: 'bg-[#f8fafc]',
    bgColor: '#f8fafc',
    textColor: '#0f172a',
    workColor: '#2563eb', // blue
    shortBreakColor: '#06b6d4', // cyan
    longBreakColor: '#10b981', // emerald
    cardBg: 'rgba(255, 255, 255, 0.95)',
    isDark: false,
  },
  {
    id: 'nordic-sage',
    name: 'Nordic Sage (Light)',
    bgClass: 'bg-[#f0f5f2]',
    bgColor: '#f0f5f2',
    textColor: '#14291f',
    workColor: '#059669', // emerald
    shortBreakColor: '#0284c7', // blue
    longBreakColor: '#7c3aed', // purple
    cardBg: 'rgba(255, 255, 255, 0.9)',
    isDark: false,
  },
  {
    id: 'oled-crimson',
    name: 'OLED Ruby (Dark)',
    bgClass: 'bg-black',
    bgColor: '#000000',
    textColor: '#ffffff',
    workColor: '#f43f5e', // rose
    shortBreakColor: '#38bdf8', // sky
    longBreakColor: '#34d399', // emerald
    cardBg: 'rgba(24, 24, 27, 0.8)',
    isDark: true,
  },
  {
    id: 'tokyo-violet',
    name: 'Tokyo Violet (Dark)',
    bgClass: 'bg-[#0f111a]',
    bgColor: '#0f111a',
    textColor: '#e2e8f0',
    workColor: '#a78bfa', // violet
    shortBreakColor: '#38bdf8', // sky
    longBreakColor: '#4ade80', // green
    cardBg: 'rgba(23, 25, 40, 0.8)',
    isDark: true,
  },
  {
    id: 'cyber-emerald',
    name: 'Cyber Matrix (Dark)',
    bgClass: 'bg-[#04130c]',
    bgColor: '#04130c',
    textColor: '#34d399',
    workColor: '#10b981', // emerald
    shortBreakColor: '#06b6d4', // cyan
    longBreakColor: '#a3e635', // lime
    cardBg: 'rgba(6, 30, 20, 0.8)',
    isDark: true,
  },
  {
    id: 'amber-vintage',
    name: 'Amber Vintage CRT (Dark)',
    bgClass: 'bg-[#120e06]',
    bgColor: '#120e06',
    textColor: '#fbbf24',
    workColor: '#f59e0b', // amber
    shortBreakColor: '#60a5fa', // blue
    longBreakColor: '#34d399', // emerald
    cardBg: 'rgba(36, 26, 10, 0.8)',
    isDark: true,
  },
  {
    id: 'sunset-dusk',
    name: 'Sunset Dusk (Dark)',
    bgClass: 'bg-[#181124]',
    bgColor: '#181124',
    textColor: '#fda4af',
    workColor: '#fb7185', // rose
    shortBreakColor: '#818cf8', // indigo
    longBreakColor: '#2dd4bf', // teal
    cardBg: 'rgba(38, 22, 54, 0.8)',
    isDark: true,
  },
  {
    id: 'deep-ocean',
    name: 'Deep Blue Abyss (Dark)',
    bgClass: 'bg-[#071324]',
    bgColor: '#071324',
    textColor: '#7dd3fc',
    workColor: '#38bdf8', // sky
    shortBreakColor: '#a78bfa', // violet
    longBreakColor: '#34d399', // emerald
    cardBg: 'rgba(12, 33, 60, 0.8)',
    isDark: true,
  },
  {
    id: 'sakura-porcelain',
    name: 'Sakura Porcelain (Light)',
    bgClass: 'bg-[#faf6f7]',
    bgColor: '#faf6f7',
    textColor: '#291419',
    workColor: '#e11d48',
    shortBreakColor: '#38bdf8',
    longBreakColor: '#10b981',
    cardBg: 'rgba(255, 255, 255, 0.92)',
    isDark: false,
  },
  {
    id: 'sage-eucalyptus',
    name: 'Sage & Eucalyptus (Light)',
    bgClass: 'bg-[#f2f6f3]',
    bgColor: '#f2f6f3',
    textColor: '#14281c',
    workColor: '#059669',
    shortBreakColor: '#0ea5e9',
    longBreakColor: '#8b5cf6',
    cardBg: 'rgba(255, 255, 255, 0.92)',
    isDark: false,
  },
  {
    id: 'vanilla-honey',
    name: 'Vanilla Cream & Honey (Light)',
    bgClass: 'bg-[#fefcf6]',
    bgColor: '#fefcf6',
    textColor: '#2c1e10',
    workColor: '#d97706',
    shortBreakColor: '#0284c7',
    longBreakColor: '#16a34a',
    cardBg: 'rgba(255, 255, 255, 0.94)',
    isDark: false,
  },
  {
    id: 'lavender-haze',
    name: 'Lavender & Periwinkle (Light)',
    bgClass: 'bg-[#f8f7fc]',
    bgColor: '#f8f7fc',
    textColor: '#1e1b38',
    workColor: '#6366f1',
    shortBreakColor: '#06b6d4',
    longBreakColor: '#10b981',
    cardBg: 'rgba(255, 255, 255, 0.92)',
    isDark: false,
  },
  {
    id: 'kyoto-moss',
    name: 'Kyoto Moss & Jade (Dark)',
    bgClass: 'bg-[#0a120e]',
    bgColor: '#0a120e',
    textColor: '#e6fbf2',
    workColor: '#10b981',
    shortBreakColor: '#84cc16',
    longBreakColor: '#06b6d4',
    cardBg: 'rgba(12, 28, 20, 0.85)',
    isDark: true,
  },
  {
    id: 'espresso-caramel',
    name: 'Roasted Espresso & Caramel (Dark)',
    bgClass: 'bg-[#150d09]',
    bgColor: '#150d09',
    textColor: '#ffedd5',
    workColor: '#f59e0b',
    shortBreakColor: '#ea580c',
    longBreakColor: '#10b981',
    cardBg: 'rgba(32, 18, 12, 0.85)',
    isDark: true,
  },
  {
    id: 'pacific-trench',
    name: 'Pacific Marine Abyss (Dark)',
    bgClass: 'bg-[#021822]',
    bgColor: '#021822',
    textColor: '#cffafe',
    workColor: '#00f5d4',
    shortBreakColor: '#38bdf8',
    longBreakColor: '#818cf8',
    cardBg: 'rgba(3, 32, 45, 0.85)',
    isDark: true,
  },
  {
    id: 'cyberpunk-2077',
    name: 'Cyberpunk 2077 Night City (Dark)',
    bgClass: 'bg-[#090414]',
    bgColor: '#090414',
    textColor: '#fef08a',
    workColor: '#fcee0a',
    shortBreakColor: '#00f0ff',
    longBreakColor: '#ff007f',
    cardBg: 'rgba(22, 10, 36, 0.85)',
    isDark: true,
  },
  {
    id: 'vintage-burgundy',
    name: 'Imperial Burgundy & Velvet (Dark)',
    bgClass: 'bg-[#1a0711]',
    bgColor: '#1a0711',
    textColor: '#ffe4e6',
    workColor: '#e11d48',
    shortBreakColor: '#f43f5e',
    longBreakColor: '#fb923c',
    cardBg: 'rgba(38, 12, 26, 0.85)',
    isDark: true,
  },
  {
    id: 'solar-eclipse',
    name: 'Solar Eclipse Corona (Dark)',
    bgClass: 'bg-[#050505]',
    bgColor: '#050505',
    textColor: '#fef3c7',
    workColor: '#fbbf24',
    shortBreakColor: '#f59e0b',
    longBreakColor: '#38bdf8',
    cardBg: 'rgba(24, 20, 10, 0.85)',
    isDark: true,
  },
  {
    id: 'custom',
    name: 'Custom Theme',
    bgClass: 'bg-[#f7f5f0]',
    bgColor: '#f7f5f0',
    textColor: '#1c1917',
    workColor: '#ef4444',
    shortBreakColor: '#38bdf8',
    longBreakColor: '#34d399',
    cardBg: 'rgba(255, 255, 255, 0.9)',
    isDark: false,
  },
];

export const DEFAULT_POMODORO_SETTINGS: PomodoroSettings = {
  workMinutes: 25,
  shortBreakMinutes: 5,
  longBreakMinutes: 15,
  longBreakInterval: 4,
  autoStartBreaks: false,
  autoStartLongBreaks: false,
  autoStartPomodoros: false,
  soundAlerts: true,
  tickSound: false,
  workSound: 'zen-bell',
  shortBreakSound: 'gentle-marimba',
  longBreakSound: 'crystal-harp',
  fontFamily: 'outfit',
  circleSize: 320,
  timerFontSize: 0,
  verticalOffset: 0,
  themeId: 'classic-tomato',
  customBg: '',
  customTextColor: '',
  customWorkColor: '#ef4444',
  customShortBreakColor: '#0ea5e9',
  customLongBreakColor: '#10b981',
  ringWidth: 8,
  enableGlow: true,
  idleMinimalMode: true,
  ambientTheme: 'none',
  ambientSoundEnabled: false,
  ambientSoundVolume: 35,
  ambientParticles: true,
  ambientPhaseSync: true,
};

// Resolves actual effective Pomodoro styling, colors, and background
export function getResolvedPomodoroTheme(
  pomoSettings: PomodoroSettings,
  clockSettings: ClockSettings,
  isDarkMode: boolean
) {
  // If ambient atmosphere is explicitly set on Pomodoro or synced with Clock
  const activeAmbientId =
    pomoSettings.ambientTheme && pomoSettings.ambientTheme !== 'none'
      ? pomoSettings.ambientTheme
      : pomoSettings.themeId === 'sync' && clockSettings.ambientTheme && clockSettings.ambientTheme !== 'none'
      ? clockSettings.ambientTheme
      : null;

  if (activeAmbientId) {
    const ambientPreset = AMBIENT_THEMES.find((a) => a.id === activeAmbientId);
    if (ambientPreset && ambientPreset.id !== 'none') {
      return {
        id: ambientPreset.id,
        name: ambientPreset.name,
        bg: 'transparent',
        textColor: ambientPreset.textColor,
        workColor: ambientPreset.accentColor,
        shortBreakColor: ambientPreset.secondaryColor,
        longBreakColor: ambientPreset.glowColor !== 'none' ? ambientPreset.accentColor : '#34d399',
        isDark: ambientPreset.isDark,
        cardBg: ambientPreset.isDark ? 'rgba(15, 15, 20, 0.6)' : 'rgba(255, 255, 255, 0.75)',
        ringWidth: pomoSettings.ringWidth || 8,
        enableGlow: pomoSettings.enableGlow !== false,
      };
    }
  }

  // If synced with Desk Clock
  if (pomoSettings.themeId === 'sync') {
    const clockTheme =
      THEME_PRESETS.find((t) => t.id === clockSettings.themeId) || THEME_PRESETS[0];

    let clockBg =
      clockSettings.themeId === 'custom' && clockSettings.customBg
        ? clockSettings.customBg
        : clockTheme.bgClass.includes('bg-[')
        ? clockTheme.bgClass.replace('bg-[', '').replace(']', '')
        : clockTheme.id === 'oled-black'
        ? '#000000'
        : clockTheme.isDark
        ? '#0f111a'
        : '#f7f5f0';

    const clockText =
      clockSettings.themeId === 'custom' && clockSettings.customTextColor
        ? clockSettings.customTextColor
        : clockTheme.textColor;

    const clockAccent =
      clockSettings.themeId === 'custom' && clockSettings.customAccentColor
        ? clockSettings.customAccentColor
        : clockTheme.accentColor;

    return {
      id: 'sync',
      name: `Synced with Clock (${clockTheme.name})`,
      bg: clockBg,
      textColor: clockText,
      workColor: clockAccent,
      shortBreakColor: clockTheme.isDark ? '#38bdf8' : '#0284c7',
      longBreakColor: clockTheme.isDark ? '#34d399' : '#059669',
      isDark: clockTheme.isDark || (clockTheme.id === 'custom' ? isDarkMode : false),
      cardBg: clockTheme.cardBg,
      ringWidth: pomoSettings.ringWidth || 8,
      enableGlow: pomoSettings.enableGlow !== false,
    };
  }

  // Custom Pomodoro theme
  if (pomoSettings.themeId === 'custom') {
    const bg = pomoSettings.customBg || (isDarkMode ? '#0f111a' : '#f7f5f0');
    const isDark =
      bg === '#000000' ||
      bg === '#0f111a' ||
      bg.startsWith('#0') ||
      bg.startsWith('#1') ||
      bg.startsWith('#2') ||
      isDarkMode;

    return {
      id: 'custom',
      name: 'Custom Theme',
      bg: pomoSettings.customBg || (isDarkMode ? '#09090b' : '#f7f5f0'),
      textColor: pomoSettings.customTextColor || (isDark ? '#f8fafc' : '#1c1917'),
      workColor: pomoSettings.customWorkColor || '#ef4444',
      shortBreakColor: pomoSettings.customShortBreakColor || '#38bdf8',
      longBreakColor: pomoSettings.customLongBreakColor || '#34d399',
      isDark,
      cardBg: isDark ? 'rgba(24, 24, 27, 0.8)' : 'rgba(255, 255, 255, 0.9)',
      ringWidth: pomoSettings.ringWidth || 8,
      enableGlow: pomoSettings.enableGlow !== false,
    };
  }

  // Preset match
  const preset =
    POMODORO_THEME_PRESETS.find((t) => t.id === pomoSettings.themeId) ||
    POMODORO_THEME_PRESETS[0];

  return {
    id: preset.id,
    name: preset.name,
    bg: preset.bgColor,
    textColor: preset.textColor,
    workColor: preset.workColor,
    shortBreakColor: preset.shortBreakColor,
    longBreakColor: preset.longBreakColor,
    isDark: preset.isDark,
    cardBg: preset.cardBg,
    ringWidth: pomoSettings.ringWidth || 8,
    enableGlow: pomoSettings.enableGlow !== false,
  };
}

export const SAMPLE_QUOTES = [
  'Focus on being productive instead of busy.',
  'One thing at a time, done with excellence.',
  'The secret of getting ahead is getting started.',
  'Deep work produces rare and valuable results.',
  'Small daily efforts compound into extraordinary skills.',
  'Your future is created by what you do today.',
  'Stay calm, breathe, and conquer this session.',
];

/**
 * Calculates the maximum safe font size for Pomodoro timer digits ("00:00")
 * with respect to the circle diameter (ring size) and stroke width.
 * Uses exact Pythagorean circular chord inscription to guarantee that
 * the entire text bounding box (digits, badge, buttons, and safe padding)
 * stays strictly within the inner circle stroke with no edge bleeding or overflow.
 */
export function getMaxPomodoroFontSize(circleDiameter: number = 320, strokeWidth: number = 8): number {
  const safeDiameter = Math.max(160, circleDiameter);
  const radius = Math.max(60, (safeDiameter - strokeWidth * 2 - 16) / 2);
  const innerRadius = radius - strokeWidth / 2;
  
  // Generous safety margin from inner stroke edge (14px to 28px depending on diameter)
  const safetyMargin = Math.max(12, Math.min(28, Math.round(safeDiameter * 0.035)));
  const safeRadius = Math.max(30, innerRadius - safetyMargin);
  
  // Digits width "00:00": W ≈ 3.15 * F
  // Stack height (digits + badge + buttons + gap): H ≈ 1.12 * F + 48px
  // Condition for rectangular box inside circle: (W / 2)^2 + (H / 2)^2 <= safeRadius^2
  // (1.575 * F)^2 + (0.56 * F + 24)^2 <= safeRadius^2
  // 2.79 * F^2 + 27 * F + (576 - safeRadius^2) <= 0
  const a = 2.79;
  const b = 27;
  const c = 576 - safeRadius * safeRadius;
  
  const discriminant = b * b - 4 * a * c;
  if (discriminant <= 0) return 36;
  
  const maxSafeF = Math.floor((-b + Math.sqrt(discriminant)) / (2 * a));
  
  // Clamp between 36px (readable floor) and 200px (aesthetic ceiling for massive rings)
  return Math.max(36, Math.min(200, maxSafeF));
}

