// Per-slide-type color grading. Applied as a CSS `filter` chain on the
// background photo/video. Goal: each slide type gets a coherent visual
// mood so the whole reel feels art-directed instead of a slideshow.
//
// LUT-equivalent values were eyeballed against reference frames from
// premium church ads (Hillsong, Bethel, North Point). Tweak conservatively.

import type { ChurchSlideType } from '@/components/church-ad/types';

export type ToneGrade =
  | 'warm'      // golden hour, intimate — cover/welcome/invitation
  | 'vivid'    // saturated, alive — programs/event
  | 'cinema'  // teal-orange cinematic — verse/pastor/mission
  | 'cool'    // crisp, factual — location/contact/worship-times
  | 'soft';   // gentle pastels — gallery

export const gradeForSlideType = (type: ChurchSlideType): ToneGrade => {
  switch (type) {
    case 'cover':
    case 'welcome':
    case 'invitation':
      return 'warm';
    case 'programs':
    case 'event':
      return 'vivid';
    case 'verse':
    case 'pastor':
    case 'mission':
      return 'cinema';
    case 'location':
    case 'contact':
    case 'worship-times':
      return 'cool';
    case 'gallery':
      return 'soft';
  }
};

/** CSS `filter` chain — multiplies on top of any existing transform/blur. */
export const filterForGrade = (grade: ToneGrade): string => {
  switch (grade) {
    case 'warm':
      // +contrast, +sat, slight warm hue, gentle highlight
      return 'contrast(1.08) saturate(1.18) brightness(1.04) sepia(0.10) hue-rotate(-6deg)';
    case 'vivid':
      return 'contrast(1.15) saturate(1.35) brightness(1.02)';
    case 'cinema':
      // Teal-orange: drop sat slightly, push shadows cool, mid-tones warm
      return 'contrast(1.14) saturate(0.92) brightness(0.96) hue-rotate(-4deg) sepia(0.08)';
    case 'cool':
      return 'contrast(1.10) saturate(0.95) brightness(1.05) hue-rotate(6deg)';
    case 'soft':
      return 'contrast(0.96) saturate(1.05) brightness(1.06) sepia(0.04)';
  }
};

/** Optional color-overlay gradient — applied as a thin blend layer above the
 *  image. Returns a CSS background string ready to put on an AbsoluteFill. */
export const overlayForGrade = (grade: ToneGrade): string => {
  switch (grade) {
    case 'warm':
      return 'linear-gradient(135deg, rgba(255, 178, 92, 0.10) 0%, rgba(212, 90, 60, 0.06) 100%)';
    case 'vivid':
      return 'linear-gradient(135deg, rgba(255, 80, 80, 0.04) 0%, rgba(50, 130, 255, 0.05) 100%)';
    case 'cinema':
      return 'linear-gradient(135deg, rgba(255, 138, 60, 0.08) 0%, rgba(20, 80, 130, 0.12) 100%)';
    case 'cool':
      return 'linear-gradient(135deg, rgba(120, 180, 255, 0.06) 0%, rgba(180, 210, 255, 0.04) 100%)';
    case 'soft':
      return 'linear-gradient(180deg, rgba(255, 230, 220, 0.06) 0%, rgba(220, 230, 255, 0.04) 100%)';
  }
};
