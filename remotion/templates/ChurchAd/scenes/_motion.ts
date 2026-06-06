// Per-slide Ken Burns / pan motion variants — picked deterministically from
// the slide index so adjacent slides never use the same motion. Keeps the
// look "edited" instead of robotic.

export type MotionVariant = 'pan-left' | 'pan-right' | 'pan-up' | 'pan-down' | 'drift-diagonal' | 'still';

const ORDER: MotionVariant[] = [
  'pan-right',
  'pan-up',
  'pan-left',
  'pan-down',
  'drift-diagonal',
  'still',
];

export const pickMotion = (slideIndex: number): MotionVariant =>
  ORDER[slideIndex % ORDER.length];

/**
 * Returns a CSS transform string given a normalised progress 0..1.
 * All variants keep scale(1.06) constant — no zoom pulsing — so motion
 * reads as a smooth camera glide rather than a breathing effect.
 */
export const motionTransform = (variant: MotionVariant, progress: number, intensity = 1.0): string => {
  const baseScale = 1.0 + 0.06 * intensity;
  const translationRange = 3 * intensity;
  const diagTranslation = 2 * intensity;
  switch (variant) {
    case 'pan-left':
      return `scale(${baseScale}) translateX(${translationRange - (translationRange * 2) * progress}%)`;
    case 'pan-right':
      return `scale(${baseScale}) translateX(${-translationRange + (translationRange * 2) * progress}%)`;
    case 'pan-up':
      return `scale(${baseScale}) translateY(${translationRange - (translationRange * 2) * progress}%)`;
    case 'pan-down':
      return `scale(${baseScale}) translateY(${-translationRange + (translationRange * 2) * progress}%)`;
    case 'drift-diagonal':
      return `scale(${baseScale}) translate(${-diagTranslation + (diagTranslation * 2) * progress}%, ${diagTranslation - (diagTranslation * 2) * progress}%)`;
    case 'still':
      return `scale(${1.0 + 0.04 * intensity})`;
  }
};

/**
 * Korean-narration aware duration estimate.
 *   ~3.5 syllables/sec is a comfortable conversational pace.
 *   Min 3s, max 14s per slide.
 */
export const estimateDurationSec = (text: string | undefined): number => {
  const len = (text ?? '').length;
  return Math.max(3, Math.min(14, Math.round((len / 3.5) * 10) / 10));
};
