import { AbsoluteFill, interpolate, useCurrentFrame } from 'remotion';
import {
  Background,
  ChurchBadge,
  FullBleedOverlay,
  ImmersiveOverlay,
  fontStack,
  heroScale,
  KineticText,
  TextCard,
  type BaseSlideProps,
  renderText,
} from './_shared';

interface Props extends BaseSlideProps {
  heading: string;
  verse: string;
  verseRef?: string;
  layout?: 'center' | 'photo-card' | 'photo-card-bottom' | 'photo-card-side' | 'full-bleed' | 'immersive';
}

export const VerseSlide: React.FC<Props> = ({
  heading,
  verse,
  verseRef,
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
  ...rest
}) => {
  const s = heroScale(textScale);
  const frame = useCurrentFrame();
  const op = interpolate(frame, [4, 30], [0, 1], { extrapolateRight: 'clamp' });
  const verseOp = interpolate(frame, [16, 50], [0, 1], { extrapolateRight: 'clamp' });
  const refOp = interpolate(frame, [44, 70], [0, 1], { extrapolateRight: 'clamp' });

  if (mediaDataUri && layout === 'full-bleed') {
    return (
      <AbsoluteFill>
        <Background {...rest} mediaDataUri={mediaDataUri} mediaType={mediaType} backgroundColor={backgroundColor} accentColor={accentColor} slideIndex={slideIndex} entryEffect={entryEffect} slideType="verse" photoShowcase />
        <FullBleedOverlay heading={verse || heading} subheading={verseRef} accentColor={accentColor} />
        <ChurchBadge churchName={churchName} accentColor={accentColor} logoDataUri={logoDataUri} badge={badge} />
      </AbsoluteFill>
    );
  }
  if (mediaDataUri && layout === 'immersive') {
    return (
      <AbsoluteFill>
        <Background {...rest} mediaDataUri={mediaDataUri} mediaType={mediaType} backgroundColor={backgroundColor} accentColor={accentColor} slideIndex={slideIndex} entryEffect={entryEffect} slideType="verse" photoShowcase />
        <ImmersiveOverlay heading={heading} subheading={`"${verse}"${verseRef ? ' — ' + verseRef : ''}`} accentColor={accentColor} />
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
    // Image #5 (말씀 묵상 sunset path) / Image #19 patterns: photo full-bleed +
    // bottom verse card with book icon, quote, and reference.
    const placement = layout === 'photo-card-side' ? 'side-right' : 'bottom';
    return (
      <AbsoluteFill>
        <Background {...rest}
          mediaDataUri={mediaDataUri}
          mediaType={mediaType}
          backgroundColor={backgroundColor}
          accentColor={accentColor}
          slideIndex={slideIndex}
        entryEffect={entryEffect}
        slideType="verse"
          photoShowcase
        />
        <TextCard {...rest} accentColor={accentColor} placement={placement as any} padding={40}>
          <div
            style={{
              opacity: op,
              display: 'flex',
              alignItems: 'center',
              gap: 14,
              marginBottom: 18,
            }}
          >
            <span style={{ fontSize: 36 }}>📖</span>
            <span
              style={{
                fontFamily: fontStack,
                fontWeight: 800,
                fontSize: 38,
                color: accentColor,
                letterSpacing: '0.02em',
              }}
            >
              {renderText(heading)}
            </span>
          </div>
          <div
            style={{
              opacity: verseOp,
              fontFamily: fontStack,
              fontWeight: 600,
              fontSize: 52,
              color: '#fff',
              lineHeight: 1.45,
              fontStyle: 'italic',
              marginBottom: 16,
            }}
          >
            "{verse}"
          </div>
          {verseRef && (
            <div
              style={{
                opacity: refOp,
                fontFamily: fontStack,
                fontWeight: 700,
                fontSize: 32,
                color: accentColor,
                textAlign: 'right',
              }}
            >
              — {verseRef}
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

  return (
    <AbsoluteFill>
      <Background {...rest}
        mediaDataUri={mediaDataUri}
        mediaType={mediaType}
        backgroundColor={backgroundColor}
        accentColor={accentColor}
        overlayOpacity={0.82}
        blur={!!mediaDataUri}
        slideIndex={slideIndex}
        entryEffect={entryEffect}
        slideType="verse"
        scrim="center"
      />
      <AbsoluteFill
        style={{
          padding: '0 180px',
          justifyContent: 'center',
          alignItems: 'center',
          textAlign: 'center',
        }}
      >
        <div
          style={{
            opacity: op,
            fontFamily: fontStack,
            fontWeight: 700,
            fontSize: 48,
            color: accentColor,
            letterSpacing: '0.04em',
            marginBottom: 36,
          }}
        >
          {renderText(heading)}
        </div>
        <div
          style={{
            fontSize: 320,
            color: accentColor,
            opacity: 0.18,
            fontFamily: 'Georgia, serif',
            lineHeight: 0.5,
            marginBottom: 30,
            fontWeight: 700,
          }}
        >
          “
        </div>
        <KineticText
          text={verse}
          startFrame={20}
          staggerFrames={4}
          accentColor={accentColor}
          style={{
            display: 'block',
            fontFamily: fontStack,
            fontWeight: 500,
            fontSize: 96 * s,
            color: '#fff',
            lineHeight: 1.45,
            letterSpacing: '-0.015em',
            maxWidth: 1500,
            marginBottom: 40,
          }}
        />
        {verseRef && (
          <div
            style={{
              opacity: refOp,
              fontFamily: fontStack,
              fontWeight: 700,
              fontSize: 56,
              color: accentColor,
              letterSpacing: '0.04em',
            }}
          >
            — {verseRef}
          </div>
        )}
      </AbsoluteFill>
      <ChurchBadge churchName={churchName} accentColor={accentColor} logoDataUri={logoDataUri} badge={badge} />
    </AbsoluteFill>
  );
};
