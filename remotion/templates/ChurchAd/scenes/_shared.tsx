import { AbsoluteFill, Img, Video, interpolate, useCurrentFrame, useVideoConfig } from 'remotion';
import { motionTransform, pickMotion, type MotionVariant } from './_motion';
import { filterForGrade, gradeForSlideType, overlayForGrade, type ToneGrade } from './_tonemap';
import type { ChurchSlideType } from '@/components/church-ad/types';

export interface BaseSlideProps {
  accentColor?: string;
  backgroundColor?: string;
  churchName?: string;
  logoDataUri?: string;
  badge?: BadgeConfig;
  mediaDataUri?: string;
  mediaType?: 'image' | 'video';
  motionVariant?: MotionVariant;
  slideIndex?: number;
  /** Hero-text size multiplier. 1.0 = default. */
  textScale?: number;
  /** Scale multiplier for the card overlay. 1.0 = default. */
  cardScale?: number;
  /** Photo scale multiplier. 1.0 = default. */
  imageScale?: number;
  /** Photo X position offset in pixels. */
  imageX?: number;
  /** Photo Y position offset in pixels. */
  imageY?: number;
  /** Photo entry animation. */
  entryEffect?: EntryEffect;
  /** Slide type — used to pick a tone-mapping grade for the bg media. */
  slideType?: ChurchSlideType;
  /** Override tone-mapping grade. When omitted, inferred from slideType. */
  toneGrade?: ToneGrade;
  isStock?: boolean;
  motionIntensity?: number;
  bgOverlayOpacity?: number;
}

/** Clamp + default for the hero-text multiplier. */
export const heroScale = (s?: number) => Math.max(0.4, Math.min(2.5, s ?? 1));

export type EntryEffect =
  | 'none'
  | 'fade'
  | 'zoom-in'
  | 'close-up'
  | 'slide-top'
  | 'slide-bottom'
  | 'slide-left'
  | 'slide-right'
  | 'scale-up';

/**
 * Returns a CSS transform + opacity string for the background image during the
 * first ~24 frames of a scene, based on the chosen entry effect.
 *
 * Usage: multiplied into the existing Ken Burns transform.
 */
export const entryTransform = (
  effect: EntryEffect | undefined,
  frame: number,
  fps = 30
): { transform: string; opacity: number } => {
  if (!effect || effect === 'none')
    return { transform: '', opacity: 1 };
  // 0.8s entry window.
  const dur = Math.round(fps * 0.8);
  const p = Math.max(0, Math.min(1, frame / dur));
  // ease-out cubic
  const e = 1 - Math.pow(1 - p, 3);
  switch (effect) {
    case 'fade':
      return { transform: '', opacity: 1 };
    case 'zoom-in':
      // Treated the same as fade — no scale change, just opacity
      return { transform: '', opacity: 1 };
    case 'close-up':
      // Heavy zoom in from 1.35 to 1.0 — cinematic.
      return { transform: `scale(${1.35 - 0.35 * e})`, opacity: e };
    case 'slide-top':
      return { transform: `translateY(${-30 + 30 * e}%)`, opacity: e };
    case 'slide-bottom':
      return { transform: `translateY(${30 - 30 * e}%)`, opacity: e };
    case 'slide-left':
      return { transform: `translateX(${-25 + 25 * e}%)`, opacity: e };
    case 'slide-right':
      return { transform: `translateX(${25 - 25 * e}%)`, opacity: e };
    case 'scale-up':
      return { transform: `scale(${0.85 + 0.15 * e})`, opacity: e };
    default:
      return { transform: '', opacity: 1 };
  }
};

export const fontStack = 'Pretendard, sans-serif';

export const useFadeUp = (start = 0, end = 22) => {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [start, end], [0, 1], { extrapolateRight: 'clamp' });
  const y = interpolate(frame, [start, end], [24, 0], { extrapolateRight: 'clamp' });
  return { opacity, y, frame };
};

export type ScrimDirection = 'left' | 'right' | 'bottom' | 'center' | 'none';

/**
 * Dark rounded card overlay — the "photo-card" pattern from the user's
 * reference templates (예: 청년부 예배 카드, 다음 주일에 만나요 카드).
 * The photo behind stays fully visible; only the area where text sits gets a
 * tinted card with subtle backdrop-filter blur and accent border.
 */
export const TextCard: React.FC<{
  accentColor?: string;
  children: React.ReactNode;
  style?: React.CSSProperties;
  /** Card placement preset. */
  placement?: 'bottom' | 'bottom-left' | 'side-right' | 'side-left' | 'center' | 'corner-tl';
  padding?: number;
  cardScale?: number;
}> = ({ accentColor = '#d4a657', children, style, placement = 'bottom', padding = 56, cardScale = 1.0 }) => {
  const placementStyle: React.CSSProperties = (() => {
    switch (placement) {
      case 'bottom':
        return { left: 80, right: 80, bottom: 80, transformOrigin: 'bottom center' };
      case 'bottom-left':
        return { left: 80, bottom: 80, maxWidth: 1200, transformOrigin: 'bottom left' };
      case 'side-right':
        return { right: 80, top: '50%', maxWidth: 760, transformOrigin: 'center right' };
      case 'side-left':
        return { left: 80, top: '50%', maxWidth: 760, transformOrigin: 'center left' };
      case 'corner-tl':
        return { top: 80, left: 80, maxWidth: 900, transformOrigin: 'top left' };
      case 'center':
      default:
        return {
          left: '50%',
          top: '50%',
          maxWidth: 1400,
          transformOrigin: 'center center',
        };
    }
  })();

  const finalTransform = (() => {
    const scaleStr = cardScale !== 1 ? `scale(${cardScale})` : '';
    if (placement === 'center') {
      return `translate(-50%, -50%) ${scaleStr}`.trim();
    }
    if (placement === 'side-right' || placement === 'side-left') {
      return `translateY(-50%) ${scaleStr}`.trim();
    }
    return scaleStr || undefined;
  })();

  return (
    <div
      onClick={(e) => {
        e.stopPropagation();
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('editor-edit-slide'));
        }
      }}
      style={{
        position: 'absolute',
        ...placementStyle,
        transform: finalTransform,
        padding,
        background: 'rgba(15, 28, 46, 0.86)',
        backdropFilter: 'blur(14px)',
        WebkitBackdropFilter: 'blur(14px)',
        border: `1px solid ${accentColor}55`,
        borderRadius: 28,
        boxShadow: '0 24px 80px rgba(0,0,0,0.55)',
        cursor: 'pointer',
        ...style,
      }}
    >
      {children}
    </div>
  );
};

export const Background: React.FC<{
  mediaDataUri?: string;
  mediaType?: 'image' | 'video';
  backgroundColor?: string;
  accentColor?: string;
  overlayOpacity?: number;
  blur?: boolean;
  motionVariant?: MotionVariant;
  slideIndex?: number;
  /** Where the slide's text sits — adds extra darkening there for guaranteed contrast. */
  scrim?: ScrimDirection;
  /**
   * `photoShowcase` mode = skip the full dark overlay so the photo stays
   * visible. The scene is responsible for placing a <TextCard> over the
   * area where text sits. A very subtle bottom vignette is still added so
   * accent stripes/badges remain legible on bright photos.
   */
  photoShowcase?: boolean;
  /** Per-slide entry animation (close-up, slide-top, etc.). */
  entryEffect?: EntryEffect;
  /** Slide type — picks a tone-mapping grade. */
  slideType?: ChurchSlideType;
  /** Override tone grade. */
  toneGrade?: ToneGrade;
  isStock?: boolean;
  motionIntensity?: number;
  bgOverlayOpacity?: number;
  imageScale?: number;
  imageX?: number;
  imageY?: number;
}> = ({
  mediaDataUri,
  mediaType = 'image',
  backgroundColor = '#0f1c2e',
  accentColor = '#d4a657',
  overlayOpacity = 0.74,
  blur = false,
  motionVariant,
  slideIndex,
  scrim = 'left',
  photoShowcase = false,
  entryEffect,
  slideType,
  toneGrade,
  isStock = false,
  motionIntensity = 1.0,
  bgOverlayOpacity,
  imageScale = 1.0,
  imageX = 0,
  imageY = 0,
}) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const variant = motionVariant ?? pickMotion(slideIndex ?? 0);
  const progress = interpolate(frame, [0, Math.max(durationInFrames, 1)], [0, 1], {
    extrapolateRight: 'clamp',
  });
  // Premium scene transitions — replaces the old flat 12-frame fade.
  //
  // ENTER (0 → 12f): the bg image arrives blurred + slightly scaled-up, then
  // resolves to crisp. Feels like a film cut into focus, not a crossfade.
  // EXIT  (last 12f): image gently blurs out + scales down + fades to ~0.0.
  // Because Series renders strictly sequential (no overlap), the asymmetric
  // enter/exit creates a perceptual "wipe-through-blur" handoff.
  const entry = entryTransform(entryEffect, frame);
  const isStockMedia = isStock || !!(mediaDataUri && mediaDataUri.includes('#stock'));
  const isShowcase = photoShowcase && !isStockMedia;
  const finalOpacity = isStockMedia ? 0.22 : entry.opacity;

  const ENTER_FRAMES = 12;
  const EXIT_FRAMES = 12;

  const transitionOpacity = interpolate(
    frame,
    [0, ENTER_FRAMES, Math.max(0, durationInFrames - EXIT_FRAMES), durationInFrames],
    [0, 1, 1, 0],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );

  const transitionBlurPx = interpolate(
    frame,
    [0, ENTER_FRAMES, Math.max(0, durationInFrames - EXIT_FRAMES), durationInFrames],
    [15, 0, 0, 15],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );

  const transitionScale = interpolate(
    frame,
    [0, ENTER_FRAMES, Math.max(0, durationInFrames - EXIT_FRAMES), durationInFrames],
    [1.06, 1.0, 1.0, 0.96],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );

  const grade = toneGrade ?? (slideType ? gradeForSlideType(slideType) : 'warm');
  const toneFilter = filterForGrade(grade);
  const baseBlur = blur ? 8 : 0;
  const totalBlur = baseBlur + transitionBlurPx;
  const mediaStyle: React.CSSProperties = {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    transform: `${motionTransform(variant, progress, motionIntensity)} scale(${transitionScale}) ${entry.transform} translate(${imageX}px, ${imageY}px) scale(${imageScale})`.trim(),
    transformOrigin: 'center',
    filter: `${toneFilter}${totalBlur > 0.1 ? ` blur(${totalBlur.toFixed(1)}px)` : ''}`,
    opacity: Math.min(transitionOpacity, finalOpacity),
    willChange: 'transform, filter, opacity',
  };
  const finalOverlayOpacity = bgOverlayOpacity !== undefined ? bgOverlayOpacity : overlayOpacity;

  return (
    <AbsoluteFill style={{ background: backgroundColor, overflow: 'hidden' }}>
      {mediaDataUri && mediaType === 'video' ? (
        // onError swallow — undecodable codec (HEVC/VP9 from some stock APIs)
        // would throw MEDIA_ELEMENT_ERROR and crash the whole render. Falling
        // back to the gradient backdrop keeps the slide watchable.
        <Video
          src={mediaDataUri}
          style={mediaStyle}
          muted
          loop
          onError={() => {
            /* swallow */
          }}
        />
      ) : mediaDataUri ? (
        <Img
          src={mediaDataUri}
          style={mediaStyle}
          onError={() => {
            /* swallow undecodable image */
          }}
        />
      ) : (
        <AbsoluteFill
          style={{
            background: `radial-gradient(ellipse at 30% 60%, ${accentColor}1f 0%, ${backgroundColor} 70%)`,
          }}
        />
      )}
      {mediaDataUri && (
        // Tone-grade color overlay — thin tint layer that gives each slide
        // type its mood (warm / cinema / cool / etc). Sits above the image
        // but below any darkening scrims, so its hue mixes into the photo
        // rather than the dark plate.
        <AbsoluteFill
          style={{
            background: overlayForGrade(grade),
            mixBlendMode: 'soft-light',
            opacity: Math.min(transitionOpacity, 1),
            pointerEvents: 'none',
          }}
        />
      )}
      {mediaDataUri && isShowcase && (
        // Photo-showcase mode: keep the image bright. Just a soft bottom
        // vignette + edge gradient so any text on top still has minimum
        // contrast and the photo's edges don't fight with adjacent slides.
        <>
          <AbsoluteFill
            style={{
              background:
                'linear-gradient(to top, rgba(15,28,46,0.55) 0%, rgba(15,28,46,0.0) 35%, rgba(15,28,46,0.0) 70%, rgba(15,28,46,0.25) 100%)',
            }}
          />
        </>
      )}
      {mediaDataUri && !isShowcase && (
        <>
          {/* Base flat overlay — guarantees a minimum darkness against bright photos. */}
          <AbsoluteFill style={{ background: `rgba(15,28,46,${finalOverlayOpacity})` }} />
          {/* Directional scrim toward text region for extra contrast. */}
          {scrim !== 'none' && (
            <AbsoluteFill
              style={{
                background:
                  scrim === 'left'
                    ? 'linear-gradient(to right, rgba(15,28,46,0.78) 0%, rgba(15,28,46,0.45) 55%, rgba(15,28,46,0.20) 100%)'
                    : scrim === 'right'
                    ? 'linear-gradient(to left, rgba(15,28,46,0.78) 0%, rgba(15,28,46,0.45) 55%, rgba(15,28,46,0.20) 100%)'
                    : scrim === 'bottom'
                    ? 'linear-gradient(to top, rgba(15,28,46,0.85) 0%, rgba(15,28,46,0.30) 55%, rgba(15,28,46,0.0) 100%)'
                    : 'radial-gradient(ellipse at center, rgba(15,28,46,0.30) 0%, rgba(15,28,46,0.78) 70%)',
              }}
            />
          )}
        </>
      )}
    </AbsoluteFill>
  );
};

export const heavyTextShadow = '0 2px 12px rgba(0,0,0,0.55), 0 1px 3px rgba(0,0,0,0.4)';

/** Render text with \n → <br/> and word-break: keep-all for Korean */
export const renderText = (text: string): React.ReactNode =>
  text.split('\n').map((line, i, arr) => (
    <span key={i}>
      {line}
      {i < arr.length - 1 && <br />}
    </span>
  ));

/**
 * Kinetic typography — splits a phrase into space-delimited chunks (Korean
 * 어절 or English words) and staggers each chunk's fade+rise entrance.
 *
 * Why this matters for the 95+ design score: a flat title that fades in as
 * a whole feels like a slideshow; a title where each word arrives 2-3 frames
 * later than the previous reads as broadcast-grade motion design.
 */
export const KineticText: React.FC<{
  text: string;
  /** Frame at which the first word starts animating. */
  startFrame?: number;
  /** Frame gap between successive words. Default 3 frames @ 30fps = 100ms. */
  staggerFrames?: number;
  /** How long each word's animation takes. Default 14 frames. */
  durationFrames?: number;
  /** Optional accent color — used to briefly tint the first keyword (the
   *  longest word) for emphasis. Pass undefined to disable. */
  accentColor?: string;
  style?: React.CSSProperties;
  /** Vertical rise distance in px. Default 18. */
  rise?: number;
}> = ({
  text,
  startFrame = 0,
  staggerFrames = 3,
  durationFrames = 14,
  accentColor,
  style,
  rise = 18,
}) => {
  const frame = useCurrentFrame();
  if (!text) return null;
  // Support explicit \n line breaks entered by users
  const lines = text.split('\n');
  const parts = lines.flatMap((line, li) => {
    const words = line.split(/(\s+)/);
    return li < lines.length - 1 ? [...words, '\n'] : words;
  });
  // Find the longest non-whitespace chunk to highlight.
  let longestIdx = -1;
  let longestLen = 0;
  parts.forEach((p, i) => {
    if (!/\s/.test(p) && p.length > longestLen) {
      longestLen = p.length;
      longestIdx = i;
    }
  });
  let wordCounter = 0;
  return (
    <div style={{ display: 'inline', wordBreak: 'keep-all', overflowWrap: 'break-word', ...style }}>
      {parts.map((part, i) => {
        if (part === '\n') return <br key={i} />;
        if (/\s/.test(part)) {
          return <span key={i}>{part}</span>;
        }
        const wi = wordCounter++;
        const begin = startFrame + wi * staggerFrames;
        const opacity = interpolate(frame, [begin, begin + durationFrames], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
        const y = interpolate(frame, [begin, begin + durationFrames], [rise, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
        const isAccent = accentColor && i === longestIdx;
        // Brief accent tint that fades back to white after the word lands.
        const tintP = interpolate(frame, [begin + durationFrames, begin + durationFrames + 18], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
        const color = isAccent ? `color-mix(in oklab, ${accentColor} ${tintP * 100}%, #fff)` : undefined;
        return (
          <span
            key={i}
            style={{
              display: 'inline-block',
              opacity,
              transform: `translateY(${y}px)`,
              color,
              willChange: 'transform, opacity',
            }}
          >
            {part}
          </span>
        );
      })}
    </div>
  );
};

export interface BadgeConfig {
  show?: boolean;
  text?: string;
  logoUrl?: string;
  logoDataUri?: string;
  photoUrl?: string;
  photoDataUri?: string;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
}

export const ChurchBadge: React.FC<{
  churchName?: string;
  accentColor?: string;
  logoDataUri?: string;
  position?: 'top-left' | 'top-right' | 'bottom-right' | 'bottom-left';
  badge?: BadgeConfig;
}> = ({ churchName, accentColor = '#d4a657', logoDataUri, position, badge }) => {
  // Project-level badge wins; fall back to churchName/logo for backward compat.
  const cfg: BadgeConfig =
    badge && badge.show !== false
      ? {
          show: true,
          text: badge.text ?? churchName,
          logoUrl: badge.logoUrl,
          logoDataUri: badge.logoDataUri ?? logoDataUri,
          photoUrl: badge.photoUrl,
          photoDataUri: badge.photoDataUri,
          position: badge.position ?? position ?? 'top-right',
        }
      : {
          show: badge?.show !== false,
          text: churchName,
          logoDataUri,
          position: position ?? 'top-right',
        };

  if (cfg.show === false) return null;
  const hasLogo = cfg.logoUrl || cfg.logoDataUri;
  const hasPhoto = cfg.photoUrl || cfg.photoDataUri;
  if (!cfg.text && !hasLogo && !hasPhoto) return null;

  const pos: React.CSSProperties =
    cfg.position === 'top-left'
      ? { top: 48, left: 56 }
      : cfg.position === 'top-right'
      ? { top: 48, right: 56 }
      : cfg.position === 'bottom-left'
      ? { bottom: 48, left: 56 }
      : { bottom: 48, right: 56 };

  return (
    <div
      style={{
        position: 'absolute',
        ...pos,
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        opacity: 0.92,
        background: 'rgba(15,28,46,0.55)',
        border: `1px solid ${accentColor}55`,
        borderRadius: 999,
        padding: '8px 14px',
        backdropFilter: 'blur(6px)',
      }}
    >
      {hasPhoto && (
        <Img
          src={(cfg.photoUrl ?? cfg.photoDataUri)!}
          style={{
            width: 36,
            height: 36,
            objectFit: 'cover',
            borderRadius: '50%',
            border: `1.5px solid ${accentColor}`,
          }}
        />
      )}
      {hasLogo && (
        <Img
          src={(cfg.logoUrl ?? cfg.logoDataUri)!}
          style={{ width: 32, height: 32, objectFit: 'contain' }}
        />
      )}
      {cfg.text && (
        <div
          style={{
            fontFamily: fontStack,
            fontWeight: 700,
            fontSize: 20,
            color: '#fff',
            letterSpacing: '0.02em',
          }}
        >
          {cfg.text}
        </div>
      )}
      <div
        style={{
          width: 4,
          height: 20,
          background: accentColor,
          borderRadius: 2,
        }}
      />
    </div>
  );
};

/**
 * full-bleed layout: photo fills the entire frame with NO card overlay.
 * Text floats with heavy drop-shadow for readability. Suitable for slides
 * where the photo is the primary message.
 */
export const FullBleedOverlay: React.FC<{
  heading: string;
  subheading?: string;
  accentColor?: string;
  startFrame?: number;
}> = ({ heading, subheading, accentColor = '#d4a657', startFrame = 4 }) => {
  const frame = useCurrentFrame();
  const headOpacity = interpolate(frame, [startFrame, startFrame + 20], [0, 1], { extrapolateRight: 'clamp' });
  const headY = interpolate(frame, [startFrame, startFrame + 20], [40, 0], { extrapolateRight: 'clamp' });
  const subOpacity = interpolate(frame, [startFrame + 18, startFrame + 38], [0, 1], { extrapolateRight: 'clamp' });
  const textShadow = '0 4px 32px rgba(0,0,0,0.85), 0 2px 8px rgba(0,0,0,0.9)';
  return (
    <AbsoluteFill
      onClick={(e) => {
        e.stopPropagation();
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('editor-edit-slide'));
        }
      }}
      style={{ justifyContent: 'center', alignItems: 'center', padding: '0 100px', textAlign: 'center', cursor: 'pointer' }}
    >
      {/* Very subtle center vignette for contrast — keeps photo mostly visible */}
      <AbsoluteFill style={{
        background: 'radial-gradient(ellipse at 50% 50%, rgba(0,0,0,0.25) 0%, rgba(0,0,0,0.0) 70%)',
        pointerEvents: 'none',
      }} />
      <div style={{ position: 'relative', zIndex: 1 }}>
        <div style={{
          height: 4,
          width: interpolate(frame, [startFrame, startFrame + 24], [0, Math.max(80, heading.length * 18)], { extrapolateRight: 'clamp' }),
          background: accentColor,
          borderRadius: 2,
          margin: '0 auto 28px',
        }} />
        <div style={{
          opacity: headOpacity,
          transform: `translateY(${headY}px)`,
          fontFamily: 'Pretendard, sans-serif',
          fontWeight: 900,
          fontSize: 160,
          color: '#fff',
          lineHeight: 1.1,
          letterSpacing: '-0.03em',
          textShadow,
          wordBreak: 'keep-all',
        }}>
          {renderText(heading)}
        </div>
        {subheading && (
          <div style={{
            opacity: subOpacity,
            marginTop: 24,
            fontFamily: 'Pretendard, sans-serif',
            fontWeight: 500,
            fontSize: 64,
            color: 'rgba(255,255,255,0.95)',
            lineHeight: 1.4,
            textShadow,
            wordBreak: 'keep-all',
          }}>
            {renderText(subheading)}
          </div>
        )}
      </div>
    </AbsoluteFill>
  );
};

/**
 * immersive layout: photo full-screen, title anchored at top, subtitle bar at bottom.
 * Film/documentary aesthetic — photo is the hero, text frames it like subtitles.
 */
export const ImmersiveOverlay: React.FC<{
  heading: string;
  subheading?: string;
  accentColor?: string;
  startFrame?: number;
}> = ({ heading, subheading, accentColor = '#d4a657', startFrame = 4 }) => {
  const frame = useCurrentFrame();
  const topOpacity = interpolate(frame, [startFrame, startFrame + 22], [0, 1], { extrapolateRight: 'clamp' });
  const botOpacity = interpolate(frame, [startFrame + 16, startFrame + 36], [0, 1], { extrapolateRight: 'clamp' });
  const textShadow = '0 3px 20px rgba(0,0,0,0.9)';
  return (
    <AbsoluteFill
      onClick={(e) => {
        e.stopPropagation();
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('editor-edit-slide'));
        }
      }}
      style={{ cursor: 'pointer' }}
    >
      {/* Top gradient bar */}
      <AbsoluteFill style={{
        background: 'linear-gradient(to bottom, rgba(0,0,0,0.62) 0%, rgba(0,0,0,0.0) 35%)',
        pointerEvents: 'none',
      }} />
      {/* Bottom gradient bar */}
      <AbsoluteFill style={{
        background: 'linear-gradient(to top, rgba(0,0,0,0.78) 0%, rgba(0,0,0,0.0) 40%)',
        pointerEvents: 'none',
      }} />
      {/* Title — top */}
      <div style={{
        position: 'absolute',
        top: 72,
        left: 96,
        right: 96,
        opacity: topOpacity,
        fontFamily: 'Pretendard, sans-serif',
        fontWeight: 900,
        fontSize: 120,
        color: '#fff',
        lineHeight: 1.1,
        letterSpacing: '-0.03em',
        textShadow,
        wordBreak: 'keep-all',
      }}>
        <div style={{ height: 4, width: interpolate(frame, [startFrame, startFrame + 22], [0, 200], { extrapolateRight: 'clamp' }), background: accentColor, borderRadius: 2, marginBottom: 20 }} />
        {renderText(heading)}
      </div>
      {/* Subtitle — bottom */}
      {subheading && (
        <div style={{
          position: 'absolute',
          bottom: 72,
          left: 96,
          right: 96,
          opacity: botOpacity,
          fontFamily: 'Pretendard, sans-serif',
          fontWeight: 500,
          fontSize: 58,
          color: 'rgba(255,255,255,0.95)',
          lineHeight: 1.5,
          textShadow,
          wordBreak: 'keep-all',
        }}>
          {renderText(subheading)}
        </div>
      )}
    </AbsoluteFill>
  );
};
