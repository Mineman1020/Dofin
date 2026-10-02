import type { CSSProperties } from 'react';
import { GradientPreset, ClockSettings } from '../types';

export const GRADIENT_PRESETS: GradientPreset[] = [
  {
    id: 'sunset-blaze',
    name: 'Sunset Blaze',
    gradient: 'linear-gradient(135deg, #f59e0b 0%, #f43f5e 50%, #e11d48 100%)',
    preview: 'from-amber-500 via-rose-500 to-rose-600',
  },
  {
    id: 'cyber-neon',
    name: 'Cyber Neon',
    gradient: 'linear-gradient(135deg, #06b6d4 0%, #3b82f6 50%, #a855f7 100%)',
    preview: 'from-cyan-500 via-blue-500 to-purple-500',
  },
  {
    id: 'emerald-mint',
    name: 'Emerald Aurora',
    gradient: 'linear-gradient(135deg, #10b981 0%, #14b8a6 50%, #06b6d4 100%)',
    preview: 'from-emerald-500 via-teal-500 to-cyan-500',
  },
  {
    id: 'electric-gold',
    name: 'Electric Gold',
    gradient: 'linear-gradient(135deg, #fef08a 0%, #eab308 50%, #ca8a04 100%)',
    preview: 'from-yellow-200 via-yellow-500 to-yellow-600',
  },
  {
    id: 'cosmic-nebula',
    name: 'Cosmic Nebula',
    gradient: 'linear-gradient(135deg, #f472b6 0%, #c084fc 50%, #6366f1 100%)',
    preview: 'from-pink-400 via-purple-400 to-indigo-500',
  },
  {
    id: 'nordic-ice',
    name: 'Nordic Frost',
    gradient: 'linear-gradient(135deg, #e0f2fe 0%, #38bdf8 50%, #818cf8 100%)',
    preview: 'from-sky-100 via-sky-400 to-indigo-400',
  },
  {
    id: 'chrome-silver',
    name: 'Lustrous Chrome',
    gradient: 'linear-gradient(135deg, #ffffff 0%, #cbd5e1 50%, #64748b 100%)',
    preview: 'from-white via-slate-300 to-slate-500',
  },
  {
    id: 'solar-flare',
    name: 'Solar Flare',
    gradient: 'linear-gradient(135deg, #fed7aa 0%, #fb923c 50%, #ea580c 100%)',
    preview: 'from-orange-200 via-orange-400 to-orange-600',
  },
  {
    id: 'deep-synthwave',
    name: 'Deep Synthwave',
    gradient: 'linear-gradient(135deg, #ff007f 0%, #7928ca 100%)',
    preview: 'from-pink-600 to-purple-700',
  },
  {
    id: 'amethyst-twilight',
    name: 'Amethyst Twilight',
    gradient: 'linear-gradient(135deg, #c084fc 0%, #ec4899 50%, #06b6d4 100%)',
    preview: 'from-purple-400 via-pink-500 to-cyan-500',
  },
  {
    id: 'matcha-emerald',
    name: 'Matcha Breeze',
    gradient: 'linear-gradient(135deg, #a3e635 0%, #10b981 50%, #06b6d4 100%)',
    preview: 'from-lime-400 via-emerald-500 to-cyan-500',
  },
  {
    id: 'hyper-crimson',
    name: 'Hyper Crimson',
    gradient: 'linear-gradient(135deg, #f43f5e 0%, #e11d48 50%, #ea580c 100%)',
    preview: 'from-rose-500 via-red-600 to-orange-500',
  },
  {
    id: 'prismatic-aurora',
    name: 'Prismatic Aurora',
    gradient: 'linear-gradient(135deg, #2dd4bf 0%, #38bdf8 35%, #818cf8 70%, #f472b6 100%)',
    preview: 'from-teal-400 via-sky-400 to-pink-400',
  },
  {
    id: 'peach-blossom',
    name: 'Peach Blossom',
    gradient: 'linear-gradient(135deg, #fbcfe8 0%, #f472b6 50%, #fb923c 100%)',
    preview: 'from-pink-200 via-pink-400 to-orange-400',
  },
  {
    id: 'copper-patina',
    name: 'Copper & Patina',
    gradient: 'linear-gradient(135deg, #fb923c 0%, #d97706 40%, #14b8a6 100%)',
    preview: 'from-orange-400 via-amber-600 to-teal-500',
  },
  {
    id: 'miami-sunrise',
    name: 'Miami Sunrise',
    gradient: 'linear-gradient(135deg, #ff6b6b 0%, #feca57 50%, #ff9ff3 100%)',
    preview: 'from-rose-400 via-amber-400 to-fuchsia-300',
  },
  {
    id: 'cyber-volt',
    name: 'Cyber Volt Neon',
    gradient: 'linear-gradient(135deg, #fcee0a 0%, #00f0ff 50%, #ff0055 100%)',
    preview: 'from-yellow-300 via-cyan-400 to-pink-600',
  },
  {
    id: 'matcha-pistachio',
    name: 'Matcha Pistachio',
    gradient: 'linear-gradient(135deg, #84cc16 0%, #10b981 50%, #059669 100%)',
    preview: 'from-lime-500 via-emerald-500 to-emerald-700',
  },
  {
    id: 'saturn-rings',
    name: 'Saturn Ring Bronze',
    gradient: 'linear-gradient(135deg, #f59e0b 0%, #d97706 50%, #7c2d12 100%)',
    preview: 'from-amber-500 via-amber-700 to-orange-950',
  },
  {
    id: 'arcane-magic',
    name: 'Arcane Astral',
    gradient: 'linear-gradient(135deg, #818cf8 0%, #c084fc 50%, #f472b6 100%)',
    preview: 'from-indigo-400 via-purple-400 to-pink-400',
  },
  {
    id: 'coral-reef',
    name: 'Deep Coral Reef',
    gradient: 'linear-gradient(135deg, #06b6d4 0%, #14b8a6 50%, #f43f5e 100%)',
    preview: 'from-cyan-500 via-teal-500 to-rose-500',
  },
  {
    id: 'blackberry-jam',
    name: 'Blackberry Velvet',
    gradient: 'linear-gradient(135deg, #a855f7 0%, #ec4899 50%, #be185d 100%)',
    preview: 'from-purple-500 via-pink-500 to-rose-700',
  },
  {
    id: 'volcanic-magma',
    name: 'Volcanic Magma',
    gradient: 'linear-gradient(135deg, #ff0033 0%, #ff6600 50%, #ffcc00 100%)',
    preview: 'from-red-600 via-orange-500 to-yellow-400',
  },
  {
    id: 'glacial-frost',
    name: 'Glacial Permafrost',
    gradient: 'linear-gradient(135deg, #e0f2fe 0%, #7dd3fc 50%, #38bdf8 100%)',
    preview: 'from-sky-100 via-sky-300 to-sky-500',
  },
  {
    id: 'tuscan-wheat',
    name: 'Tuscan Sunset Wheat',
    gradient: 'linear-gradient(135deg, #fef08a 0%, #f59e0b 50%, #b45309 100%)',
    preview: 'from-yellow-200 via-amber-500 to-amber-700',
  },
  {
    id: 'cotton-candy',
    name: 'Cotton Candy Cloud',
    gradient: 'linear-gradient(135deg, #38bdf8 0%, #c084fc 50%, #f472b6 100%)',
    preview: 'from-sky-400 via-purple-300 to-pink-400',
  },
  {
    id: 'emerald-jewel',
    name: 'Imperial Emerald',
    gradient: 'linear-gradient(135deg, #34d399 0%, #10b981 50%, #047857 100%)',
    preview: 'from-emerald-400 via-emerald-500 to-emerald-800',
  },
  {
    id: 'supernova',
    name: 'Cosmic Supernova',
    gradient: 'linear-gradient(135deg, #f43f5e 0%, #a855f7 50%, #3b82f6 100%)',
    preview: 'from-rose-500 via-purple-500 to-blue-500',
  },
  {
    id: 'autumn-hearth',
    name: 'Autumn Hearth Wood',
    gradient: 'linear-gradient(135deg, #ea580c 0%, #d97706 50%, #eab308 100%)',
    preview: 'from-orange-600 via-amber-600 to-yellow-500',
  },
  {
    id: 'peacock-plume',
    name: 'Peacock Plume',
    gradient: 'linear-gradient(135deg, #0284c7 0%, #0d9488 50%, #16a34a 100%)',
    preview: 'from-sky-600 via-teal-600 to-green-600',
  },
];

/**
 * Returns CSS properties for gradient or solid text based on settings.
 */
export function getClockDigitTextStyle(
  settings: ClockSettings,
  resolvedSolidColor: string
): CSSProperties {
  if (settings.colorMode === 'gradient') {
    const preset =
      GRADIENT_PRESETS.find((p) => p.id === settings.gradientPresetId) ||
      GRADIENT_PRESETS[0];
    return {
      backgroundImage: preset.gradient,
      WebkitBackgroundClip: 'text',
      WebkitTextFillColor: 'transparent',
      backgroundClip: 'text',
      color: 'transparent',
    };
  }

  if (settings.colorMode === 'custom-gradient') {
    const start = settings.customGradientStart || '#f59e0b';
    const end = settings.customGradientEnd || '#f43f5e';
    const angle = settings.customGradientAngle ?? 135;
    const gradient = `linear-gradient(${angle}deg, ${start} 0%, ${end} 100%)`;

    return {
      backgroundImage: gradient,
      WebkitBackgroundClip: 'text',
      WebkitTextFillColor: 'transparent',
      backgroundClip: 'text',
      color: 'transparent',
    };
  }

  // Solid color fallback
  return {
    color: resolvedSolidColor,
  };
}

/**
 * Convert hex color to HSL
 */
export function hexToHsl(hex: string): { h: number; s: number; l: number } {
  let c = hex.replace('#', '').trim();
  if (c.length === 3) c = c[0] + c[0] + c[1] + c[1] + c[2] + c[2];
  const num = parseInt(c, 16);
  if (isNaN(num)) return { h: 38, s: 92, l: 50 }; // default amber
  const r = (num >> 16) / 255;
  const g = ((num >> 8) & 255) / 255;
  const b = (num & 255) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      case b:
        h = (r - g) / d + 4;
        break;
    }
    h = Math.round(h * 60);
  }
  return { h, s: Math.round(s * 100), l: Math.round(l * 100) };
}

/**
 * Gets the dominant primary color for clock elements from settings
 */
export function getDominantClockColor(settings: ClockSettings, fallbackSolidColor: string): string {
  if (settings.colorMode === 'gradient') {
    const preset =
      GRADIENT_PRESETS.find((p) => p.id === settings.gradientPresetId) ||
      GRADIENT_PRESETS[0];
    if (preset) {
      const hexMatch = preset.gradient.match(/#(?:[0-9a-fA-F]{3}){1,2}/);
      if (hexMatch) return hexMatch[0];
    }
  } else if (settings.colorMode === 'custom-gradient') {
    if (settings.customGradientStart) return settings.customGradientStart;
  }
  return settings.customTextColor || fallbackSolidColor || '#f59e0b';
}

/**
 * Computes the matched or contrast background styling based on font color
 */
export function getMatchedBackgroundStyle(
  settings: ClockSettings,
  fallbackSolidColor: string
): CSSProperties | null {
  if (!settings.matchedBackground || settings.matchedBackground === 'off') {
    return null;
  }

  const primaryColor = getDominantClockColor(settings, fallbackSolidColor);
  const { h, s } = hexToHsl(primaryColor);

  if (settings.matchedBackground === 'matched') {
    return {
      backgroundColor: `hsl(${h}, ${Math.min(45, Math.round(s * 0.5))}%, 6%)`,
      backgroundImage: `radial-gradient(circle at 50% 50%, hsl(${h}, ${Math.min(65, Math.round(s * 0.75))}%, 13%) 0%, hsl(${h}, ${Math.min(40, Math.round(s * 0.4))}%, 4%) 100%)`,
    };
  }

  if (settings.matchedBackground === 'contrast') {
    const contrastHue = (h + 180) % 360;
    return {
      backgroundColor: `hsl(${contrastHue}, ${Math.min(50, Math.round(s * 0.6))}%, 5%)`,
      backgroundImage: `radial-gradient(circle at 50% 50%, hsl(${contrastHue}, ${Math.min(70, Math.round(s * 0.8))}%, 14%) 0%, hsl(${contrastHue}, ${Math.min(45, Math.round(s * 0.5))}%, 4%) 100%)`,
    };
  }

  return null;
}
