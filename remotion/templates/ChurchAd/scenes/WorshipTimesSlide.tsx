import { AbsoluteFill, interpolate, useCurrentFrame } from 'remotion';
import {
  Background,
  ChurchBadge,
  fontStack,
  TextCard,
  type BaseSlideProps,
  renderText,
} from './_shared';

interface Props extends BaseSlideProps {
  heading: string;
  services: { name: string; schedule: string; place?: string }[];
  layout?: 'default' | 'photo-card' | 'photo-card-bottom' | 'photo-card-side';
}

export const WorshipTimesSlide: React.FC<Props> = ({
  heading,
  services,
  layout = 'default',
  accentColor = '#d4a657',
  backgroundColor,
  churchName,
  logoDataUri,
  mediaDataUri,
  mediaType,
  slideIndex,
  entryEffect,
  badge,
}) => {
  const frame = useCurrentFrame();
  const headOpacity = interpolate(frame, [4, 24], [0, 1], { extrapolateRight: 'clamp' });

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
        : 'bottom-left';
    return (
      <AbsoluteFill>
        <Background
          mediaDataUri={mediaDataUri}
          mediaType={mediaType}
          backgroundColor={backgroundColor}
          accentColor={accentColor}
          slideIndex={slideIndex}
        entryEffect={entryEffect}
        slideType="worship-times"
          photoShowcase
        />
        <TextCard accentColor={accentColor} placement={placement as any} padding={40}>
          <div
            style={{
              display: 'flex',
              alignItems: 'baseline',
              gap: 14,
              marginBottom: 24,
              opacity: headOpacity,
            }}
          >
            <div
              style={{
                fontFamily: fontStack,
                fontWeight: 900,
                fontSize: 72,
                color: '#fff',
                letterSpacing: '-0.02em',
              }}
            >
              {renderText(heading)}
            </div>
            <div style={{ width: Math.max(48, Math.min(240, (heading?.length ?? 4) * 18)), height: 4, background: accentColor, borderRadius: 2 }} />
          </div>
          {services.map((s, i) => {
            const delay = 14 + i * 8;
            const op = interpolate(frame, [delay, delay + 18], [0, 1], { extrapolateRight: 'clamp' });
            return (
              <div
                key={i}
                style={{
                  opacity: op,
                  display: 'flex',
                  alignItems: 'baseline',
                  gap: 18,
                  marginBottom: 14,
                  flexWrap: 'wrap',
                }}
              >
                <span
                  style={{
                    fontFamily: fontStack,
                    fontWeight: 700,
                    fontSize: 38,
                    color: '#fff',
                    minWidth: 220,
                  }}
                >
                  {s.name}
                </span>
                <span
                  style={{
                    fontFamily: fontStack,
                    fontWeight: 600,
                    fontSize: 36,
                    color: accentColor,
                  }}
                >
                  🕐 {s.schedule}
                </span>
                {s.place && (
                  <span
                    style={{
                      fontFamily: fontStack,
                      fontWeight: 500,
                      fontSize: 30,
                      color: 'rgba(255,255,255,0.75)',
                    }}
                  >
                    📍 {s.place}
                  </span>
                )}
              </div>
            );
          })}
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
      <Background
        mediaDataUri={mediaDataUri}
        mediaType={mediaType}
        backgroundColor={backgroundColor}
        accentColor={accentColor}
        overlayOpacity={0.82}
        blur={!!mediaDataUri}
        slideIndex={slideIndex}
        entryEffect={entryEffect}
        slideType="worship-times"
        scrim="left"
      />
      <AbsoluteFill style={{ padding: '80px 120px', justifyContent: 'center' }}>
        <div
          style={{
            opacity: headOpacity,
            display: 'flex',
            alignItems: 'baseline',
            gap: 24,
            marginBottom: 48,
          }}
        >
          <div
            style={{
              fontFamily: fontStack,
              fontWeight: 900,
              fontSize: 144,
              color: '#fff',
              letterSpacing: '-0.025em',
            }}
          >
            {renderText(heading)}
          </div>
          <div style={{ width: 100, height: 4, background: accentColor, borderRadius: 2 }} />
        </div>
        <div
          style={{
            background: 'rgba(255,255,255,0.04)',
            border: `1px solid ${accentColor}55`,
            borderRadius: 24,
            padding: '40px 56px',
            maxWidth: 1500,
          }}
        >
          {services.map((s, i) => {
            const delay = 16 + i * 12;
            const op = interpolate(frame, [delay, delay + 18], [0, 1], { extrapolateRight: 'clamp' });
            const x = interpolate(frame, [delay, delay + 18], [-12, 0], { extrapolateRight: 'clamp' });
            return (
              <div
                key={i}
                style={{
                  opacity: op,
                  transform: `translateX(${x}px)`,
                  display: 'grid',
                  gridTemplateColumns: '420px 1fr auto',
                  gap: 32,
                  alignItems: 'center',
                  padding: '24px 0',
                  borderBottom:
                    i < services.length - 1 ? '1px solid rgba(255,255,255,0.10)' : 'none',
                }}
              >
                <div
                  style={{
                    fontFamily: fontStack,
                    fontWeight: 700,
                    fontSize: 64,
                    color: '#fff',
                  }}
                >
                  {s.name}
                </div>
                <div
                  style={{
                    fontFamily: fontStack,
                    fontWeight: 500,
                    fontSize: 60,
                    color: accentColor,
                  }}
                >
                  {s.schedule}
                </div>
                {s.place && (
                  <div
                    style={{
                      fontFamily: fontStack,
                      fontWeight: 400,
                      fontSize: 48,
                      color: 'rgba(255,255,255,0.65)',
                    }}
                  >
                    {s.place}
                  </div>
                )}
              </div>
            );
          })}
          {services.length === 0 && (
            <div
              style={{
                fontFamily: fontStack,
                fontWeight: 400,
                fontSize: 52,
                color: 'rgba(255,255,255,0.5)',
                textAlign: 'center',
                padding: '40px 0',
              }}
            >
              예배 시간 정보를 입력해주세요
            </div>
          )}
        </div>
      </AbsoluteFill>
      <ChurchBadge churchName={churchName} accentColor={accentColor} logoDataUri={logoDataUri} badge={badge} />
    </AbsoluteFill>
  );
};
