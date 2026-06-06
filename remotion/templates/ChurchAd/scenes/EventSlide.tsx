import { AbsoluteFill, interpolate, useCurrentFrame } from 'remotion';
import {
  Background,
  ChurchBadge,
  FullBleedOverlay,
  ImmersiveOverlay,
  fontStack,
  TextCard,
  type BaseSlideProps,
  renderText,
  KineticText,
  heroScale,
} from './_shared';

interface Props extends BaseSlideProps {
  heading: string;
  subheading?: string;
  date?: string;
  location?: string;
  bullets?: string[];
  layout?:
    | 'default'
    | 'photo-card'
    | 'photo-card-bottom'
    | 'photo-card-side'
    | 'photo-card-bottom-left'
    | 'full-bleed'
    | 'immersive';
  /** Optional small label shown at top of the card (e.g. "행사 안내"). */
  eventBadge?: string;
}

export const EventSlide: React.FC<Props> = ({
  heading,
  subheading,
  date,
  location,
  bullets = [],
  layout = 'default',
  eventBadge,
  accentColor = '#d4a657',
  backgroundColor,
  churchName,
  logoDataUri,
  mediaDataUri,
  mediaType,
  slideIndex,
  entryEffect,
  badge,
  motionIntensity,
  bgOverlayOpacity,
  textScale,
  ...rest
}) => {
  const s = heroScale(textScale);
  const frame = useCurrentFrame();
  const op = interpolate(frame, [4, 26], [0, 1], { extrapolateRight: 'clamp' });
  const y = interpolate(frame, [4, 26], [22, 0], { extrapolateRight: 'clamp' });

  if (mediaDataUri && layout === 'full-bleed') {
    return (
      <AbsoluteFill>
        <Background {...rest} mediaDataUri={mediaDataUri} mediaType={mediaType} backgroundColor={backgroundColor} accentColor={accentColor} slideIndex={slideIndex} entryEffect={entryEffect} slideType="event" photoShowcase motionIntensity={motionIntensity} bgOverlayOpacity={bgOverlayOpacity} />
        <FullBleedOverlay heading={heading} subheading={subheading || (date ? `${date}${location ? ' · ' + location : ''}` : undefined)} accentColor={accentColor} />
        <ChurchBadge churchName={churchName} accentColor={accentColor} logoDataUri={logoDataUri} badge={badge} />
      </AbsoluteFill>
    );
  }
  if (mediaDataUri && layout === 'immersive') {
    return (
      <AbsoluteFill>
        <Background {...rest} mediaDataUri={mediaDataUri} mediaType={mediaType} backgroundColor={backgroundColor} accentColor={accentColor} slideIndex={slideIndex} entryEffect={entryEffect} slideType="event" photoShowcase motionIntensity={motionIntensity} bgOverlayOpacity={bgOverlayOpacity} />
        <ImmersiveOverlay heading={heading} subheading={subheading || (date ? `${date}${location ? ' · ' + location : ''}` : undefined)} accentColor={accentColor} />
        <ChurchBadge churchName={churchName} accentColor={accentColor} logoDataUri={logoDataUri} badge={badge} />
      </AbsoluteFill>
    );
  }

  const isCardLayout =
    !!mediaDataUri &&
    (layout === 'photo-card' ||
      layout === 'photo-card-bottom' ||
      layout === 'photo-card-side' ||
      layout === 'photo-card-bottom-left');

  if (isCardLayout) {
    // Image #5 (봄나들이) / #7 (새가족 환영) patterns — photo full-bleed, info
    // card with category badge + heading + date/location icons.
    const placement =
      layout === 'photo-card-bottom'
        ? 'bottom'
        : layout === 'photo-card-side'
        ? 'side-right'
        : layout === 'photo-card-bottom-left'
        ? 'bottom-left'
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
          slideType="event"
          photoShowcase
          motionIntensity={motionIntensity}
          bgOverlayOpacity={bgOverlayOpacity}
        />
        <TextCard {...rest} accentColor={accentColor} placement={placement as any} padding={44}>
          {eventBadge && (
            <div
              style={{
                opacity: op,
                display: 'inline-block',
                background: `${accentColor}33`,
                border: `1px solid ${accentColor}88`,
                color: accentColor,
                fontFamily: fontStack,
                fontWeight: 700,
                fontSize: 26 * s,
                padding: '6px 14px',
                borderRadius: 999,
                marginBottom: 18,
              }}
            >
              {eventBadge}
            </div>
          )}
          <KineticText
            text={heading}
            startFrame={6}
            accentColor={accentColor}
            style={{
              display: 'block',
              fontFamily: fontStack,
              fontWeight: 900,
              fontSize: 96 * s,
              color: '#fff',
              lineHeight: 1.05,
              letterSpacing: '-0.025em',
              marginBottom: subheading ? 14 : 22,
            }}
          />
          {subheading && (
            <div
              style={{
                opacity: op,
                fontFamily: fontStack,
                fontWeight: 500,
                fontSize: 38 * s,
                color: 'rgba(255,255,255,0.85)',
                lineHeight: 1.4,
                marginBottom: 22,
              }}
            >
              {subheading}
            </div>
          )}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {date && (
              <div
                style={{
                  fontFamily: fontStack,
                  fontWeight: 600,
                  fontSize: 34 * s,
                  color: '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                }}
              >
                <span style={{ color: accentColor }}>📅</span> {date}
              </div>
            )}
            {location && (
              <div
                style={{
                  fontFamily: fontStack,
                  fontWeight: 600,
                  fontSize: 34 * s,
                  color: '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                }}
              >
                <span style={{ color: accentColor }}>📍</span> {location}
              </div>
            )}
            {bullets.map((b, i) => (
              <div
                key={i}
                style={{
                  fontFamily: fontStack,
                  fontWeight: 500,
                  fontSize: 30 * s,
                  color: 'rgba(255,255,255,0.82)',
                }}
              >
                · {b}
              </div>
            ))}
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
        overlayOpacity={0.78}
        slideIndex={slideIndex}
        entryEffect={entryEffect}
        slideType="event"
        scrim="left"
        motionIntensity={motionIntensity}
        bgOverlayOpacity={bgOverlayOpacity}
      />
      <AbsoluteFill style={{ padding: '0 120px', justifyContent: 'center' }}>
        <div
          style={{
            opacity: op,
            transform: `translateY(${y}px)`,
            fontFamily: fontStack,
            fontWeight: 700,
            fontSize: 46 * s,
            color: accentColor,
            letterSpacing: '0.06em',
            marginBottom: 22,
          }}
        >
          ✦ 특별 안내
        </div>
        <KineticText
          text={heading}
          startFrame={6}
          accentColor={accentColor}
          style={{
            display: 'block',
            fontFamily: fontStack,
            fontWeight: 900,
            fontSize: 184 * s,
            color: '#fff',
            lineHeight: 1.05,
            letterSpacing: '-0.03em',
            marginBottom: 24,
            maxWidth: 1500,
          }}
        />
        {subheading && (
          <div
            style={{
              opacity: op,
              fontFamily: fontStack,
              fontWeight: 400,
              fontSize: 64 * s,
              color: 'rgba(255,255,255,0.78)',
              lineHeight: 1.4,
              maxWidth: 1400,
              marginBottom: 36,
            }}
          >
            {subheading}
          </div>
        )}
        {(date || location) && (
          <div
            style={{
              display: 'flex',
              gap: 40,
              marginBottom: bullets.length ? 32 : 0,
            }}
          >
            {date && (
              <div
                style={{
                  background: accentColor,
                  color: '#0f1c2e',
                  padding: '16px 28px',
                  borderRadius: 12,
                  fontFamily: fontStack,
                  fontWeight: 800,
                  fontSize: 56 * s,
                }}
              >
                {date}
              </div>
            )}
            {location && (
              <div
                style={{
                  border: `2px solid ${accentColor}`,
                  color: '#fff',
                  padding: '16px 28px',
                  borderRadius: 12,
                  fontFamily: fontStack,
                  fontWeight: 600,
                  fontSize: 56 * s,
                }}
              >
                📍 {location}
              </div>
            )}
          </div>
        )}
        {bullets.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {bullets.map((b, i) => (
              <div
                key={i}
                style={{
                  fontFamily: fontStack,
                  fontWeight: 500,
                  fontSize: 52 * s,
                  color: 'rgba(255,255,255,0.78)',
                }}
              >
                • {b}
              </div>
            ))}
          </div>
        )}
      </AbsoluteFill>
      <ChurchBadge churchName={churchName} accentColor={accentColor} logoDataUri={logoDataUri} badge={badge} />
    </AbsoluteFill>
  );
};
