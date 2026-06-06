import { AbsoluteFill, interpolate, useCurrentFrame } from 'remotion';
import {
  Background,
  ChurchBadge,
  FullBleedOverlay,
  ImmersiveOverlay,
  fontStack,
  heavyTextShadow,
  heroScale,
  KineticText,
  TextCard,
  type BaseSlideProps,
} from './_shared';

interface Props extends BaseSlideProps {
  title: string;
  subtitle?: string;
  layout?: 'center' | 'photo-card' | 'photo-card-bottom' | 'photo-card-side' | 'full-bleed' | 'immersive';
}

export const CoverSlide: React.FC<Props> = ({
  title,
  subtitle,
  layout = 'center',
  accentColor = '#d4a657',
  backgroundColor,
  churchName,
  logoDataUri,
  mediaDataUri,
  mediaType,
  slideIndex,
  entryEffect,
  badge,
  textScale,
  motionIntensity,
  bgOverlayOpacity,
  ...rest
}) => {
  const s = heroScale(textScale);
  const frame = useCurrentFrame();
  const titleOpacity = interpolate(frame, [4, 28], [0, 1], { extrapolateRight: 'clamp' });
  const titleY = interpolate(frame, [4, 28], [40, 0], { extrapolateRight: 'clamp' });
  const subOpacity = interpolate(frame, [22, 46], [0, 1], { extrapolateRight: 'clamp' });
  const subY = interpolate(frame, [22, 46], [24, 0], { extrapolateRight: 'clamp' });
  // Line width scales with title length: longer title → wider accent bar
  const lineTarget = Math.max(80, Math.min(320, title.length * 22));
  const lineWidth = interpolate(frame, [16, 40], [0, lineTarget], { extrapolateRight: 'clamp' });

  // full-bleed / immersive: photo 100% visible, no card
  if (mediaDataUri && layout === 'full-bleed') {
    return (
      <AbsoluteFill>
        <Background {...rest} mediaDataUri={mediaDataUri} mediaType={mediaType} backgroundColor={backgroundColor} accentColor={accentColor} slideIndex={slideIndex} entryEffect={entryEffect} slideType="cover" photoShowcase motionIntensity={motionIntensity} bgOverlayOpacity={bgOverlayOpacity} />
        <FullBleedOverlay heading={title} subheading={subtitle} accentColor={accentColor} />
        <ChurchBadge churchName={churchName} accentColor={accentColor} logoDataUri={logoDataUri} badge={badge} />
      </AbsoluteFill>
    );
  }
  if (mediaDataUri && layout === 'immersive') {
    return (
      <AbsoluteFill>
        <Background {...rest} mediaDataUri={mediaDataUri} mediaType={mediaType} backgroundColor={backgroundColor} accentColor={accentColor} slideIndex={slideIndex} entryEffect={entryEffect} slideType="cover" photoShowcase motionIntensity={motionIntensity} bgOverlayOpacity={bgOverlayOpacity} />
        <ImmersiveOverlay heading={title} subheading={subtitle} accentColor={accentColor} />
        <ChurchBadge churchName={churchName} accentColor={accentColor} logoDataUri={logoDataUri} badge={badge} />
      </AbsoluteFill>
    );
  }

  // Photo-card layouts: keep the image bright, drop content into a dark card.
  const isCardLayout =
    !!mediaDataUri &&
    (layout === 'photo-card' ||
      layout === 'photo-card-bottom' ||
      layout === 'photo-card-side');

  if (isCardLayout) {
    const placement =
      layout === 'photo-card-bottom'
        ? 'bottom'
        : layout === 'photo-card-side'
        ? 'side-right'
        : 'center';
    return (
      <AbsoluteFill>
        <Background
          {...rest}
          mediaDataUri={mediaDataUri}
          mediaType={mediaType}
          backgroundColor={backgroundColor}
          accentColor={accentColor}
          slideIndex={slideIndex}
          entryEffect={entryEffect}
          slideType="cover"
          photoShowcase
          motionIntensity={motionIntensity}
          bgOverlayOpacity={bgOverlayOpacity}
        />
        <TextCard {...rest} accentColor={accentColor} placement={placement as any}>
          <div
            style={{
              height: 4,
              width: lineWidth,
              background: accentColor,
              borderRadius: 2,
              marginBottom: 24,
            }}
          />
          <KineticText
            text={title}
            startFrame={6}
            accentColor={accentColor}
            style={{
              display: 'block',
              fontFamily: fontStack,
              fontWeight: 900,
              fontSize: 160 * s,
              color: '#fff',
              lineHeight: 1.05,
              letterSpacing: '-0.03em',
              marginBottom: subtitle ? 20 : 0,
            }}
          />
          {subtitle && (
            <div
              style={{
                opacity: subOpacity,
                transform: `translateY(${subY}px)`,
                fontFamily: fontStack,
                fontWeight: 500,
                fontSize: 56 * s,
                color: 'rgba(255,255,255,0.92)',
                lineHeight: 1.4,
                letterSpacing: '-0.01em',
              }}
            >
              {subtitle}
            </div>
          )}
        </TextCard>
        <ChurchBadge
          churchName={churchName}
          accentColor={accentColor}
          logoDataUri={logoDataUri}
          badge={badge}
        />
      </AbsoluteFill>
    );
  }

  // Default centered layout with full overlay.
  return (
    <AbsoluteFill>
      <Background
        {...rest}
        mediaDataUri={mediaDataUri}
        mediaType={mediaType}
        backgroundColor={backgroundColor}
        accentColor={accentColor}
        overlayOpacity={0.55}
        slideIndex={slideIndex}
        entryEffect={entryEffect}
        slideType="cover"
        scrim="bottom"
        motionIntensity={motionIntensity}
        bgOverlayOpacity={bgOverlayOpacity}
      />
      <AbsoluteFill
        style={{
          justifyContent: 'center',
          alignItems: 'center',
          padding: '0 96px',
          textAlign: 'center',
        }}
      >
        <div style={{ height: 4, width: lineWidth, background: accentColor, borderRadius: 2, marginBottom: 32 }} />
        <KineticText
          text={title}
          startFrame={6}
          accentColor={accentColor}
          style={{
            display: 'block',
            fontFamily: fontStack,
            fontWeight: 900,
            fontSize: 220 * s,
            color: '#fff',
            lineHeight: 1.1,
            letterSpacing: '-0.03em',
            marginBottom: 28,
            textShadow: heavyTextShadow,
          }}
        />
        {subtitle && (
          <div
            style={{
              opacity: subOpacity,
              transform: `translateY(${subY}px)`,
              fontFamily: fontStack,
              fontWeight: 500,
              fontSize: 80 * s,
              color: 'rgba(255,255,255,0.92)',
              lineHeight: 1.4,
              letterSpacing: '-0.01em',
              textShadow: heavyTextShadow,
            }}
          >
            {subtitle}
          </div>
        )}
      </AbsoluteFill>
      <ChurchBadge churchName={churchName} accentColor={accentColor} logoDataUri={logoDataUri} badge={badge} />
    </AbsoluteFill>
  );
};
