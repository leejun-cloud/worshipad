// Visual style presets ("쇼폼"). A single click bundles colors + default entry
// effect + Ken Burns intensity. Per-slide overrides still win.
//
// Inspired by:
//   - OpenMontage's scored provider profiles (each preset bundles many choices)
//   - waoowaoo's storyboard "look" templates
// We keep it minimal — 5 named presets that cover the common church-ad moods.

import type { EntryEffect, StylePreset } from './types';

export interface StylePresetDef {
  id: StylePreset;
  label: string;
  description: string;
  /** Preview thumbnail emoji/style chip */
  swatch: string;
  /** Default accent + bg if user hasn't customised yet. */
  accentColor: string;
  backgroundColor: string;
  /** Default photo entry animation when a slide doesn't override. */
  defaultEntry: EntryEffect;
  /** Hint to Ken Burns intensity — multiplied into the scale range. */
  motionIntensity: number;
}

export const STYLE_PRESETS: StylePresetDef[] = [
  {
    id: 'cinematic',
    label: '시네마틱',
    description: '느린 줌·진한 색감 · 영화 같은 무게감',
    swatch: '🎬',
    accentColor: '#d4a657',
    backgroundColor: '#0a1220',
    defaultEntry: 'close-up',
    motionIntensity: 1.2,
  },
  {
    id: 'modern',
    label: '모던',
    description: '깔끔한 슬라이드 전환 · 미니멀 디자인',
    swatch: '◇',
    accentColor: '#5a8dee',
    backgroundColor: '#11151c',
    defaultEntry: 'slide-left',
    motionIntensity: 0.9,
  },
  {
    id: 'warm',
    label: '따뜻한',
    description: '부드러운 페이드 · 가족적 골드 톤',
    swatch: '☀',
    accentColor: '#d4a657',
    backgroundColor: '#1a1410',
    defaultEntry: 'fade',
    motionIntensity: 1.0,
  },
  {
    id: 'classic',
    label: '클래식',
    description: '정적인 등장 · 진중한 분위기 (장년 대상)',
    swatch: '⛪',
    accentColor: '#c4b078',
    backgroundColor: '#0f1c2e',
    defaultEntry: 'none',
    motionIntensity: 0.7,
  },
  {
    id: 'energetic',
    label: '에너제틱',
    description: '강한 줌인·위에서 등장 · 청년 대상',
    swatch: '⚡',
    accentColor: '#f76860',
    backgroundColor: '#15131a',
    defaultEntry: 'zoom-in',
    motionIntensity: 1.4,
  },
];

export const getPreset = (id?: StylePreset): StylePresetDef =>
  STYLE_PRESETS.find((p) => p.id === id) ?? STYLE_PRESETS[2]; // 'warm' default
