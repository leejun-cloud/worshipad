import { AbsoluteFill, interpolate, useCurrentFrame, spring, useVideoConfig } from 'remotion';

interface Props {
  cta: string;
  itemCount: number;
  bgGradient?: string;
  accentColor?: string;
}

export const CloseScene: React.FC<Props> = ({ cta, itemCount, bgGradient, accentColor }) => {
  const accent = accentColor ?? '#fbbf24';
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const summarySpring = spring({ frame, fps, config: { damping: 12, stiffness: 140 } });
  const summaryScale = interpolate(summarySpring, [0, 1], [0.85, 1]);

  const ctaOpacity = interpolate(frame, [30, 60], [0, 1], { extrapolateRight: 'clamp' });
  const ctaY = interpolate(frame, [30, 60], [40, 0], { extrapolateRight: 'clamp' });

  const arrowBounce = interpolate(
    (frame % 40) / 40,
    [0, 0.5, 1],
    [0, 16, 0],
    { extrapolateRight: 'clamp' }
  );

  return (
    <AbsoluteFill
      style={{
        background: bgGradient ?? 'linear-gradient(135deg, #1e293b 0%, #312e81 50%, #4c1d95 100%)',
        padding: '120px 80px',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 16,
          padding: '24px 48px',
          backgroundColor: `${accent}26`,
          border: `3px solid ${accent}`,
          color: accent,
          borderRadius: 100,
          fontFamily: 'Pretendard, sans-serif',
          fontWeight: 900,
          fontSize: 36,
          letterSpacing: '0.05em',
          transform: `scale(${summaryScale})`,
          marginBottom: 80,
        }}
      >
        ✓ {itemCount}가지 모두 확인
      </div>

      <div
        style={{
          fontFamily: 'Pretendard, sans-serif',
          fontWeight: 900,
          fontSize: 96,
          color: 'white',
          textAlign: 'center',
          lineHeight: 1.25,
          letterSpacing: '-0.03em',
          opacity: ctaOpacity,
          transform: `translateY(${ctaY}px)`,
          marginBottom: 60,
          textShadow: '0 6px 32px rgba(0,0,0,0.4)',
          maxWidth: 920,
        }}
      >
        {cta}
      </div>

      <div
        style={{
          fontFamily: 'Pretendard, sans-serif',
          fontWeight: 900,
          fontSize: 80,
          color: accent,
          opacity: ctaOpacity,
          transform: `translateY(${arrowBounce}px)`,
        }}
      >
        ↓
      </div>
    </AbsoluteFill>
  );
};
