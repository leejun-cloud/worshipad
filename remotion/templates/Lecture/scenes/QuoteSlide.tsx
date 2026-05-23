import { AbsoluteFill, interpolate, useCurrentFrame } from 'remotion';

interface Props {
  quote: string;
  attribution?: string;
  accentColor?: string;
}

export const QuoteSlide: React.FC<Props> = ({
  quote,
  attribution,
  accentColor = '#4f8ef7',
}) => {
  const frame = useCurrentFrame();

  const opacity = interpolate(frame, [0, 24], [0, 1], { extrapolateRight: 'clamp' });
  const quoteY = interpolate(frame, [0, 28], [36, 0], { extrapolateRight: 'clamp' });
  const attrOpacity = interpolate(frame, [30, 48], [0, 1], { extrapolateRight: 'clamp' });

  return (
    <AbsoluteFill
      style={{
        background: '#0d0f14',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '100px 160px',
      }}
    >
      {/* Decorative quote mark */}
      <div
        style={{
          position: 'absolute',
          top: 80,
          left: 120,
          fontFamily: 'Georgia, serif',
          fontSize: 240,
          color: accentColor,
          opacity: 0.08,
          lineHeight: 1,
          userSelect: 'none',
        }}
      >
        "
      </div>

      <div
        style={{
          opacity,
          transform: `translateY(${quoteY}px)`,
          textAlign: 'center',
        }}
      >
        <div
          style={{
            fontFamily: 'Pretendard, sans-serif',
            fontWeight: 700,
            fontSize: 64,
            color: '#ffffff',
            lineHeight: 1.45,
            letterSpacing: '-0.02em',
            marginBottom: 56,
          }}
        >
          {quote}
        </div>

        {attribution && (
          <div
            style={{
              opacity: attrOpacity,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 20,
            }}
          >
            <div style={{ width: 48, height: 2, background: accentColor, borderRadius: 1 }} />
            <div
              style={{
                fontFamily: 'Pretendard, sans-serif',
                fontWeight: 500,
                fontSize: 34,
                color: accentColor,
                letterSpacing: '-0.01em',
              }}
            >
              {attribution}
            </div>
          </div>
        )}
      </div>
    </AbsoluteFill>
  );
};
