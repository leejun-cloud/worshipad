import { AbsoluteFill, interpolate, useCurrentFrame } from 'remotion';
import {
  Background,
  ChurchBadge,
  FullBleedOverlay,
  ImmersiveOverlay,
  fontStack,
  heavyTextShadow,
  heroScale,
  TextCard,
  type BaseSlideProps,
  renderText,
  KineticText,
} from './_shared';

interface Props extends BaseSlideProps {
  heading: string;
  subheading?: string;
  cta?: string;
  layout?: 'center' | 'photo-card' | 'photo-card-bottom' | 'photo-card-side' | 'full-bleed' | 'immersive';
}

export const InvitationSlide: React.FC<Props> = ({
  heading,
  subheading,
  cta,
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
  const headOp = interpolate(frame, [4, 32], [0, 1], { extrapolateRight: 'clamp' });
  const headY = interpolate(frame, [4, 32], [30, 0], { extrapolateRight: 'clamp' });
  const subOp = interpolate(frame, [22, 50], [0, 1], { extrapolateRight: 'clamp' });
  const ctaOp = interpolate(frame, [40, 70], [0, 1], { extrapolateRight: 'clamp' });
  const ctaScale = interpolate(frame, [40, 70], [0.92, 1], { extrapolateRight: 'clamp' });
  const lineTarget = Math.max(80, Math.min(320, heading.length * 22));
  const lineWidth = interpolate(frame, [16, 40], [0, lineTarget], { extrapolateRight: 'clamp' });

  if (mediaDataUri && layout === 'full-bleed') {
    return (
      <AbsoluteFill>
        <Background {...rest} mediaDataUri={mediaDataUri} mediaType={mediaType} backgroundColor={backgroundColor} accentColor={accentColor} slideIndex={slideIndex} entryEffect={entryEffect} slideType="invitation" photoShowcase motionIntensity={motionIntensity} bgOverlayOpacity={bgOverlayOpacity} />
        <FullBleedOverlay heading={heading} subheading={cta || subheading} accentColor={accentColor} />
        <ChurchBadge churchName={churchName} accentColor={accentColor} logoDataUri={logoDataUri} badge={badge} />
      </AbsoluteFill>
    );
  }
  if (mediaDataUri && layout === 'immersive') {
    return (
      <AbsoluteFill>
        <Background {...rest} mediaDataUri={mediaDataUri} mediaType={mediaType} backgroundColor={backgroundColor} accentColor={accentColor} slideIndex={slideIndex} entryEffect={entryEffect} slideType="invitation" photoShowcase motionIntensity={motionIntensity} bgOverlayOpacity={bgOverlayOpacity} />
        <ImmersiveOverlay heading={heading} subheading={cta || subheading} accentColor={accentColor} />
        <ChurchBadge churchName={churchName} accentColor={accentColor} logoDataUri={logoDataUri} badge={badge} />
      </AbsoluteFill>
    );
  }

  const isCardLayout =
    !!mediaDataUri &&
    (layout === 'photo-card' ||
      layout === 'photo-card-bottom' ||
      layout === 'photo-card-side');

  if (isCardLayout) {
    // Image #11 (다음 주일에 만나요) pattern — photo full-bleed, dark card with
    // cross icon + heading + schedule + tagline.
    const placement =
      layout === 'photo-card-bottom'
        ? 'bottom'
        : layout === 'photo-card-side'
        ? 'side-right'
        : 'center';
    return (
      <AbsoluteFill>
        <Background {...rest}
          mediaDataUri={mediaDataUri}
          mediaType={mediaType}
          backgroundColor={backgroundColor}
          accentColor={accentColor}
          slideIndex={slideIndex}
          entryEffect={entryEffect}
          slideType="invitation"
          photoShowcase
          motionIntensity={motionIntensity}
          bgOverlayOpacity={bgOverlayOpacity}
        />
        <TextCard {...rest} accentColor={accentColor} placement={placement as any} padding={48}>
          <div
            style={{
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
            }}
          >
            <div
              style={{
                fontSize: 56 * s,
                color: accentColor,
                marginBottom: 16,
              }}
            >
              ✟
            </div>
            <KineticText
              text={heading}
              startFrame={6}
              accentColor={accentColor}
              style={{
                display: 'block',
                fontFamily: fontStack,
                fontWeight: 900,
                fontSize: 110 * s,
                color: '#fff',
                lineHeight: 1.1,
                letterSpacing: '-0.03em',
                marginBottom: 22,
              }}
            />
            {subheading && (
              <div
                style={{
                  fontFamily: fontStack,
                  fontWeight: 500,
                  fontSize: 42 * s,
                  color: 'rgba(255,255,255,0.88)',
                  lineHeight: 1.4,
                  marginBottom: cta ? 28 : 0,
                }}
              >
                {subheading}
              </div>
            )}
            {cta && (
              <div
                style={{
                  background: accentColor,
                  color: '#0f1c2e',
                  fontFamily: fontStack,
                  fontWeight: 800,
                  fontSize: 38 * s,
                  padding: '14px 36px',
                  borderRadius: 999,
                }}
              >
                {cta}
              </div>
            )}
          </div>
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

  return (
    <AbsoluteFill>
      <Background {...rest}
        mediaDataUri={mediaDataUri}
        mediaType={mediaType}
        backgroundColor={backgroundColor}
        accentColor={accentColor}
        overlayOpacity={0.82}
        slideIndex={slideIndex}
        entryEffect={entryEffect}
        slideType="invitation"
        scrim="center"
        motionIntensity={motionIntensity}
        bgOverlayOpacity={bgOverlayOpacity}
      />
      <AbsoluteFill
        style={{
          justifyContent: 'center',
          alignItems: 'center',
          textAlign: 'center',
          padding: '0 120px',
        }}
      >
        <KineticText
          text={heading}
          startFrame={6}
          accentColor={accentColor}
          style={{
            display: 'block',
            fontFamily: fontStack,
            fontWeight: 900,
            fontSize: 216 * s,
            color: '#fff',
            lineHeight: 1.1,
            letterSpacing: '-0.03em',
            marginBottom: 32,
            textShadow: heavyTextShadow,
          }}
        />
        <div
          style={{
            width: lineWidth,
            height: 4,
            background: accentColor,
            borderRadius: 2,
            marginBottom: 36,
          }}
        />
        {subheading && (
          <div
            style={{
              opacity: subOp,
              fontFamily: fontStack,
              fontWeight: 500,
              fontSize: 76 * s,
              color: 'rgba(255,255,255,0.92)',
              lineHeight: 1.45,
              maxWidth: 1500,
              marginBottom: 56,
              textShadow: heavyTextShadow,
            }}
          >
            {subheading}
          </div>
        )}
        {cta && (
          <div
            style={{
              opacity: ctaOp,
              transform: `scale(${ctaScale})`,
              background: accentColor,
              color: '#0f1c2e',
              fontFamily: fontStack,
              fontWeight: 800,
              fontSize: 76 * s,
              letterSpacing: '-0.01em',
              padding: '24px 56px',
              borderRadius: 999,
              boxShadow: `0 12px 48px ${accentColor}55`,
            }}
          >
            {cta}
          </div>
        )}
      </AbsoluteFill>
      <ChurchBadge
        churchName={churchName}
        accentColor={accentColor}
        logoDataUri={logoDataUri} badge={badge}
        position="bottom-right"
      />
    </AbsoluteFill>
  );
};
