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
  heading: string;          // 짧은 라벨 (예: "말씀 묵상" / "우리의 비전")
  mission: string;          // 한 줄 비전 본문
  verseRef?: string;        // 출처가 있으면 인용구 모드
  layout?:
    | 'big'
    | 'center'
    | 'left'
    | 'photo-card'
    | 'photo-card-bottom'
    | 'photo-card-top'
    | 'full-bleed'
    | 'immersive';
}

// Mission slide — single-line vision statement rendered at hero scale.
// 'big' = 가장 크게, 'center' = 가운데 정렬, 'left' = 좌측 정렬.
export const MissionSlide: React.FC<Props> = ({
  heading,
  mission,
  verseRef,
  layout = 'big',
  accentColor = '#d4a657',
  backgroundColor,
  churchName,
  logoDataUri,
  badge,
  mediaDataUri,
  mediaType,
  slideIndex,
  entryEffect,
  textScale,
  motionIntensity,
  bgOverlayOpacity,
  ...rest
}) => {
  const s = heroScale(textScale);
  const frame = useCurrentFrame();
  const labelOp = interpolate(frame, [4, 28], [0, 1], { extrapolateRight: 'clamp' });
  const missionOp = interpolate(frame, [16, 50], [0, 1], { extrapolateRight: 'clamp' });
  const missionScale = interpolate(frame, [16, 50], [0.95, 1], { extrapolateRight: 'clamp' });

  if (mediaDataUri && layout === 'full-bleed') {
    return (
      <AbsoluteFill>
        <Background {...rest} mediaDataUri={mediaDataUri} mediaType={mediaType} backgroundColor={backgroundColor} accentColor={accentColor} slideIndex={slideIndex} entryEffect={entryEffect} slideType="mission" photoShowcase motionIntensity={motionIntensity} bgOverlayOpacity={bgOverlayOpacity} />
        <FullBleedOverlay heading={mission} subheading={verseRef || heading} accentColor={accentColor} />
        <ChurchBadge churchName={churchName} accentColor={accentColor} logoDataUri={logoDataUri} badge={badge} />
      </AbsoluteFill>
    );
  }
  if (mediaDataUri && layout === 'immersive') {
    return (
      <AbsoluteFill>
        <Background {...rest} mediaDataUri={mediaDataUri} mediaType={mediaType} backgroundColor={backgroundColor} accentColor={accentColor} slideIndex={slideIndex} entryEffect={entryEffect} slideType="mission" photoShowcase motionIntensity={motionIntensity} bgOverlayOpacity={bgOverlayOpacity} />
        <ImmersiveOverlay heading={heading} subheading={mission} accentColor={accentColor} />
        <ChurchBadge churchName={churchName} accentColor={accentColor} logoDataUri={logoDataUri} badge={badge} />
      </AbsoluteFill>
    );
  }

  // ── photo-card layouts — image #19 패턴 ──
  const isCardLayout =
    !!mediaDataUri &&
    (layout === 'photo-card' ||
      layout === 'photo-card-bottom' ||
      layout === 'photo-card-top');

  if (isCardLayout) {
    // Header + photo on top, mission card on bottom (Image #19 pattern).
    const placement = layout === 'photo-card-top' ? 'bottom' : 'bottom';
    return (
      <AbsoluteFill>
        <Background {...rest}
          mediaDataUri={mediaDataUri}
          mediaType={mediaType}
          backgroundColor={backgroundColor}
          accentColor={accentColor}
          slideIndex={slideIndex}
          entryEffect={entryEffect}
          slideType="mission"
          photoShowcase
          motionIntensity={motionIntensity}
          bgOverlayOpacity={bgOverlayOpacity}
        />
        {/* Header on top of photo */}
        <div
          style={{
            position: 'absolute',
            top: 60,
            left: 100,
            right: 100,
            opacity: labelOp,
            display: 'flex',
            alignItems: 'baseline',
            gap: 18,
          }}
        >
          <div
            style={{
              background: `${accentColor}33`,
              border: `1px solid ${accentColor}88`,
              color: accentColor,
              fontFamily: fontStack,
              fontWeight: 700,
              fontSize: 32,
              padding: '6px 16px',
              borderRadius: 999,
              textShadow: heavyTextShadow,
            }}
          >
            📖 <KineticText text={heading} startFrame={6} accentColor={accentColor} />
          </div>
        </div>
        {/* Big quote card at bottom */}
        <TextCard {...rest} accentColor={accentColor} placement={placement as any} padding={48}>
          <div
            style={{
              transform: `scale(${missionScale})`,
              fontFamily: fontStack,
              fontWeight: 800,
              fontSize: 72 * s,
              color: '#fff',
              lineHeight: 1.25,
              letterSpacing: '-0.025em',
              marginBottom: verseRef ? 18 : 0,
            }}
          >
            <span style={{ color: accentColor, fontSize: 48 * s, marginRight: 10 }}>"</span>
            <KineticText text={mission} startFrame={16} accentColor={accentColor} />
            <span style={{ color: accentColor, fontSize: 48 * s, marginLeft: 10 }}>"</span>
          </div>
          {verseRef && (
            <div
              style={{
                opacity: missionOp,
                fontFamily: fontStack,
                fontWeight: 700,
                fontSize: 30 * s,
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

  const isCentered = layout !== 'left';
  const justify = layout === 'big' || layout === 'center' ? 'center' : 'flex-start';
  const align = isCentered ? 'center' : 'flex-start';
  const textAlign: React.CSSProperties['textAlign'] = isCentered ? 'center' : 'left';

  // 'big' uses 280px, others 200px.
  const missionSize = layout === 'big' ? 280 : 200;

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
        slideType="mission"
        scrim={isCentered ? 'center' : 'left'}
        motionIntensity={motionIntensity}
        bgOverlayOpacity={bgOverlayOpacity}
      />
      <AbsoluteFill
        style={{
          padding: '0 120px',
          justifyContent: justify,
          alignItems: align,
          textAlign,
        }}
      >
        <KineticText
          text={heading}
          startFrame={6}
          accentColor={accentColor}
          style={{
            display: 'block',
            fontFamily: fontStack,
            fontWeight: 700,
            fontSize: 44,
            color: accentColor,
            letterSpacing: '0.04em',
            marginBottom: 36,
            textShadow: heavyTextShadow,
          }}
        />
        <KineticText
          text={mission}
          startFrame={16}
          accentColor={accentColor}
          style={{
            display: 'block',
            fontFamily: fontStack,
            fontWeight: 900,
            fontSize: missionSize * s,
            color: '#fff',
            lineHeight: 1.05,
            letterSpacing: '-0.035em',
            maxWidth: 1700,
            textShadow: heavyTextShadow,
          }}
        />
        <div
          style={{
            marginTop: 40,
            width: 140,
            height: 6,
            background: accentColor,
            borderRadius: 3,
            opacity: missionOp,
          }}
        />
      </AbsoluteFill>
      <ChurchBadge
        churchName={churchName}
        accentColor={accentColor}
        logoDataUri={logoDataUri}
        badge={badge}
      />
    </AbsoluteFill>
  );
};
