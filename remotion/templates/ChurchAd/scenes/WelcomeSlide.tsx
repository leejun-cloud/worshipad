import { AbsoluteFill, interpolate, useCurrentFrame } from 'remotion';
import {
  Background,
  ChurchBadge,
  FullBleedOverlay,
  fontStack,
  heavyTextShadow,
  heroScale,
  ImmersiveOverlay,
  TextCard,
  type BaseSlideProps,
  renderText,
} from './_shared';

interface Props extends BaseSlideProps {
  heading: string;
  message?: string;
  bullets?: string[];
  layout?:
    | 'center'
    | 'left'
    | 'right'
    | 'photo-card'
    | 'photo-card-bottom'
    | 'photo-card-side'
    | 'photo-card-bottom-left'
    | 'full-bleed'
    | 'immersive';
}

export const WelcomeSlide: React.FC<Props> = ({
  heading,
  message,
  bullets = [],
  layout = 'left',
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
}) => {
  const s = heroScale(textScale);
  const frame = useCurrentFrame();
  const headOpacity = interpolate(frame, [4, 26], [0, 1], { extrapolateRight: 'clamp' });
  const headY = interpolate(frame, [4, 26], [22, 0], { extrapolateRight: 'clamp' });
  const msgOpacity = interpolate(frame, [22, 44], [0, 1], { extrapolateRight: 'clamp' });

  if (mediaDataUri && layout === 'full-bleed') {
    return (
      <AbsoluteFill>
        <Background mediaDataUri={mediaDataUri} mediaType={mediaType} backgroundColor={backgroundColor} accentColor={accentColor} slideIndex={slideIndex} entryEffect={entryEffect} slideType="welcome" photoShowcase />
        <FullBleedOverlay heading={heading} subheading={message} accentColor={accentColor} />
        <ChurchBadge churchName={churchName} accentColor={accentColor} logoDataUri={logoDataUri} badge={badge} />
      </AbsoluteFill>
    );
  }

  if (mediaDataUri && layout === 'immersive') {
    return (
      <AbsoluteFill>
        <Background mediaDataUri={mediaDataUri} mediaType={mediaType} backgroundColor={backgroundColor} accentColor={accentColor} slideIndex={slideIndex} entryEffect={entryEffect} slideType="welcome" photoShowcase />
        <ImmersiveOverlay heading={heading} subheading={message} accentColor={accentColor} />
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
    const placement =
      layout === 'photo-card-side'
        ? 'side-right'
        : layout === 'photo-card'
        ? 'center'
        : layout === 'photo-card-bottom-left'
        ? 'bottom-left'
        : 'bottom';
    return (
      <AbsoluteFill>
        <Background
          mediaDataUri={mediaDataUri}
          mediaType={mediaType}
          backgroundColor={backgroundColor}
          accentColor={accentColor}
          slideIndex={slideIndex}
          entryEffect={entryEffect}
          slideType="welcome"
          photoShowcase
        />
        <TextCard accentColor={accentColor} placement={placement as any} padding={48}>
          <div
            style={{
              opacity: headOpacity,
              transform: `translateY(${headY}px)`,
              fontFamily: fontStack,
              fontWeight: 900,
              fontSize: 112 * s,
              color: '#fff',
              letterSpacing: '-0.03em',
              lineHeight: 1.1,
              marginBottom: 22,
            }}
          >
            {renderText(heading)}
          </div>
          <div style={{ width: Math.max(60, Math.min(260, heading.length * 18)), height: 4, background: accentColor, borderRadius: 2, marginBottom: message ? 24 : 0 }} />
          {message && (
            <div
              style={{
                opacity: msgOpacity,
                fontFamily: fontStack,
                fontWeight: 500,
                fontSize: 46 * s,
                color: 'rgba(255,255,255,0.9)',
                lineHeight: 1.45,
              }}
            >
              {message}
            </div>
          )}
        </TextCard>
        <ChurchBadge churchName={churchName} accentColor={accentColor} logoDataUri={logoDataUri} badge={badge} />
      </AbsoluteFill>
    );
  }

  const alignRight = layout === 'right';

  return (
    <AbsoluteFill>
      <Background
        mediaDataUri={mediaDataUri}
        mediaType={mediaType}
        backgroundColor={backgroundColor}
        accentColor={accentColor}
        overlayOpacity={0.74}
        blur={!!mediaDataUri}
        slideIndex={slideIndex}
        entryEffect={entryEffect}
        slideType="welcome"
        scrim={alignRight ? 'right' : 'left'}
      />
      <AbsoluteFill
        style={{
          padding: '0 120px',
          justifyContent: 'center',
          alignItems: alignRight ? 'flex-end' : 'flex-start',
          textAlign: alignRight ? 'right' : 'left',
        }}
      >
        <div
          style={{
            opacity: headOpacity,
            transform: `translateY(${headY}px)`,
            fontFamily: fontStack,
            fontWeight: 900,
            fontSize: 180 * s,
            color: '#fff',
            letterSpacing: '-0.03em',
            lineHeight: 1.1,
            marginBottom: 32,
            textShadow: heavyTextShadow,
          }}
        >
          {renderText(heading)}
        </div>
        <div style={{ width: Math.max(60, Math.min(280, heading.length * 20)), height: 4, background: accentColor, borderRadius: 2, marginBottom: 32 }} />
        {message && (
          <div
            style={{
              opacity: msgOpacity,
              fontFamily: fontStack,
              fontWeight: 500,
              fontSize: 76 * s,
              color: 'rgba(255,255,255,0.95)',
              lineHeight: 1.5,
              maxWidth: 1200,
              marginBottom: bullets.length ? 36 : 0,
              textShadow: heavyTextShadow,
            }}
          >
            {message}
          </div>
        )}
        {bullets.map((b, i) => {
          const d = 32 + i * 10;
          const op = interpolate(frame, [d, d + 16], [0, 1], { extrapolateRight: 'clamp' });
          return (
            <div
              key={i}
              style={{
                opacity: op,
                display: 'flex',
                alignItems: 'flex-start',
                gap: 18,
                flexDirection: alignRight ? 'row-reverse' : 'row',
                marginBottom: 18,
                fontFamily: fontStack,
                fontWeight: 500,
                fontSize: 56,
                color: 'rgba(255,255,255,0.78)',
              }}
            >
              <span style={{ color: accentColor }}>✦</span>
              <span>{b}</span>
            </div>
          );
        })}
      </AbsoluteFill>
      <ChurchBadge churchName={churchName} accentColor={accentColor} logoDataUri={logoDataUri} badge={badge} />
    </AbsoluteFill>
  );
};
