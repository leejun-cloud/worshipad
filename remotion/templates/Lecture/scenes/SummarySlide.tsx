import { AbsoluteFill, interpolate, useCurrentFrame } from 'remotion';

interface Props {
  bullets: string[];
  cta?: string;
  accentColor?: string;
}

export const SummarySlide: React.FC<Props> = ({
  bullets,
  cta,
  accentColor = '#4f8ef7',
}) => {
  const frame = useCurrentFrame();

  const headerOpacity = interpolate(frame, [0, 20], [0, 1], { extrapolateRight: 'clamp' });
  const headerY = interpolate(frame, [0, 20], [20, 0], { extrapolateRight: 'clamp' });
  const accentWidth = interpolate(frame, [0, 28], [0, 180], { extrapolateRight: 'clamp' });
  const ctaOpacity = interpolate(frame, [bullets.length * 12 + 30, bullets.length * 12 + 50], [0, 1], { extrapolateRight: 'clamp' });

  return (
    <AbsoluteFill style={{ background: '#0d0f14', padding: '72px 120px' }}>
      {/* Right accent bar */}
      <div
        style={{
          position: 'absolute',
          right: 0,
          top: 0,
          bottom: 0,
          width: 6,
          background: accentColor,
          opacity: headerOpacity,
        }}
      />

      {/* Header */}
      <div
        style={{
          opacity: headerOpacity,
          transform: `translateY(${headerY}px)`,
          marginBottom: 40,
        }}
      >
        <div
          style={{
            fontFamily: 'Pretendard, sans-serif',
            fontWeight: 900,
            fontSize: 52,
            color: '#ffffff',
            letterSpacing: '-0.02em',
            marginBottom: 16,
          }}
        >
          핵심 정리
        </div>
        <div style={{ width: accentWidth, height: 3, background: accentColor, borderRadius: 2 }} />
      </div>

      {/* Summary bullets with checkmark */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        {bullets.map((bullet, i) => {
          const delay = 18 + i * 12;
          const opacity = interpolate(frame, [delay, delay + 18], [0, 1], { extrapolateRight: 'clamp' });
          const x = interpolate(frame, [delay, delay + 18], [-24, 0], { extrapolateRight: 'clamp' });

          return (
            <div
              key={i}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 24,
                marginBottom: 36,
                opacity,
                transform: `translateX(${x}px)`,
              }}
            >
              {/* Checkmark circle */}
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: '50%',
                  background: accentColor,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  marginTop: 4,
                }}
              >
                <svg width="18" height="14" viewBox="0 0 18 14" fill="none">
                  <path d="M1.5 7L6.5 12L16.5 2" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <div
                style={{
                  fontFamily: 'Pretendard, sans-serif',
                  fontWeight: 500,
                  fontSize: 40,
                  color: 'rgba(255,255,255,0.88)',
                  lineHeight: 1.45,
                  letterSpacing: '-0.015em',
                }}
              >
                {bullet}
              </div>
            </div>
          );
        })}
      </div>

      {/* CTA */}
      {cta && (
        <div
          style={{
            opacity: ctaOpacity,
            padding: '28px 48px',
            background: accentColor,
            borderRadius: 12,
            display: 'inline-block',
            alignSelf: 'flex-start',
          }}
        >
          <div
            style={{
              fontFamily: 'Pretendard, sans-serif',
              fontWeight: 700,
              fontSize: 36,
              color: '#ffffff',
              letterSpacing: '-0.01em',
            }}
          >
            {cta}
          </div>
        </div>
      )}
    </AbsoluteFill>
  );
};
