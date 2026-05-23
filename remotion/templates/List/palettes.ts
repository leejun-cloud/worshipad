// Palette rotation for List template scenes.
// Goal: each card in a single video has a distinct background, dramatically
// improving the IG/YT feed grid look (no more "all blue thumbnails").

export interface ScenePalette {
  bg1: string;
  bg2: string;
  bg3?: string;
  accent: string;       // primary highlight (numbers, key text)
  accentSoft: string;   // soft variant for backgrounds/borders
  surface: string;      // inner card / chip surface
  surfaceBorder: string;
  text: string;
  textMuted: string;
  /** Gradient angle in degrees */
  angle: number;
}

// 10 distinct palettes — warm/cool/dark mix for max grid contrast.
export const PALETTES: ScenePalette[] = [
  // 0. Midnight blue (default)
  {
    bg1: '#1e293b',
    bg2: '#312e81',
    bg3: '#4c1d95',
    accent: '#a78bfa',
    accentSoft: 'rgba(167,139,250,0.15)',
    surface: 'rgba(255,255,255,0.08)',
    surfaceBorder: 'rgba(255,255,255,0.14)',
    text: '#f8fafc',
    textMuted: '#cbd5e1',
    angle: 135,
  },
  // 1. Sunset coral
  {
    bg1: '#7c2d12',
    bg2: '#9f1239',
    bg3: '#831843',
    accent: '#fbbf24',
    accentSoft: 'rgba(251,191,36,0.18)',
    surface: 'rgba(255,255,255,0.10)',
    surfaceBorder: 'rgba(255,255,255,0.18)',
    text: '#fff7ed',
    textMuted: '#fed7aa',
    angle: 145,
  },
  // 2. Forest emerald
  {
    bg1: '#064e3b',
    bg2: '#065f46',
    bg3: '#022c22',
    accent: '#86efac',
    accentSoft: 'rgba(134,239,172,0.16)',
    surface: 'rgba(255,255,255,0.08)',
    surfaceBorder: 'rgba(134,239,172,0.22)',
    text: '#f0fdf4',
    textMuted: '#bbf7d0',
    angle: 165,
  },
  // 3. Cocoa luxe
  {
    bg1: '#1c1917',
    bg2: '#451a03',
    bg3: '#292524',
    accent: '#fbbf24',
    accentSoft: 'rgba(251,191,36,0.16)',
    surface: 'rgba(255,255,255,0.06)',
    surfaceBorder: 'rgba(251,191,36,0.22)',
    text: '#fef3c7',
    textMuted: '#fde68a',
    angle: 135,
  },
  // 4. Ocean teal
  {
    bg1: '#083344',
    bg2: '#155e75',
    bg3: '#0c4a6e',
    accent: '#22d3ee',
    accentSoft: 'rgba(34,211,238,0.16)',
    surface: 'rgba(255,255,255,0.08)',
    surfaceBorder: 'rgba(34,211,238,0.22)',
    text: '#ecfeff',
    textMuted: '#a5f3fc',
    angle: 180,
  },
  // 5. Crimson rose
  {
    bg1: '#450a0a',
    bg2: '#7f1d1d',
    bg3: '#881337',
    accent: '#fda4af',
    accentSoft: 'rgba(253,164,175,0.16)',
    surface: 'rgba(255,255,255,0.08)',
    surfaceBorder: 'rgba(253,164,175,0.22)',
    text: '#fff1f2',
    textMuted: '#fecdd3',
    angle: 155,
  },
  // 6. Royal indigo
  {
    bg1: '#1e1b4b',
    bg2: '#3730a3',
    bg3: '#312e81',
    accent: '#c4b5fd',
    accentSoft: 'rgba(196,181,253,0.16)',
    surface: 'rgba(255,255,255,0.08)',
    surfaceBorder: 'rgba(196,181,253,0.22)',
    text: '#eef2ff',
    textMuted: '#c7d2fe',
    angle: 130,
  },
  // 7. Slate steel
  {
    bg1: '#0f172a',
    bg2: '#334155',
    bg3: '#1e293b',
    accent: '#facc15',
    accentSoft: 'rgba(250,204,21,0.16)',
    surface: 'rgba(255,255,255,0.07)',
    surfaceBorder: 'rgba(250,204,21,0.22)',
    text: '#f1f5f9',
    textMuted: '#cbd5e1',
    angle: 175,
  },
  // 8. Pine deep
  {
    bg1: '#022c22',
    bg2: '#134e4a',
    bg3: '#0f172a',
    accent: '#5eead4',
    accentSoft: 'rgba(94,234,212,0.16)',
    surface: 'rgba(255,255,255,0.07)',
    surfaceBorder: 'rgba(94,234,212,0.22)',
    text: '#f0fdfa',
    textMuted: '#99f6e4',
    angle: 170,
  },
  // 9. Vintage rose-gold
  {
    bg1: '#3f1d1d',
    bg2: '#7c2d12',
    bg3: '#431407',
    accent: '#fb923c',
    accentSoft: 'rgba(251,146,60,0.16)',
    surface: 'rgba(255,255,255,0.07)',
    surfaceBorder: 'rgba(251,146,60,0.22)',
    text: '#fff7ed',
    textMuted: '#fdba74',
    angle: 140,
  },
];

/**
 * Stable rotation: same scene index always gets the same palette per video,
 * but two adjacent scenes never share a palette.
 * `seed` lets you shift the rotation between videos so even similar
 * content gets different feed thumbnails.
 */
export const getPalette = (index: number, seed = 0): ScenePalette => {
  const i = (index + seed) % PALETTES.length;
  return PALETTES[i];
};

/** Build the linear-gradient CSS string for a palette. */
export const paletteGradient = (p: ScenePalette): string => {
  if (p.bg3) {
    return `linear-gradient(${p.angle}deg, ${p.bg1} 0%, ${p.bg2} 50%, ${p.bg3} 100%)`;
  }
  return `linear-gradient(${p.angle}deg, ${p.bg1} 0%, ${p.bg2} 100%)`;
};
