import { AbsoluteFill, interpolate, useCurrentFrame, spring, useVideoConfig } from 'remotion';

interface Props {
  cta: string;
}

export const CTAScene: React.FC<Props> = ({ cta }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const ctaScale = spring({
    frame,
    fps,
    config: { damping: 12, mass: 0.6, stiffness: 180 },
  });

  const arrowBounce = interpolate(
    (frame % 30) / 30,
    [0, 0.5, 1],
    [0, 20, 0],
    { extrapolateRight: 'clamp' }
  );

  const bgShift = interpolate(frame, [0, 60], [0, 100], { extrapolateRight: 'clamp' });

  return (
    <AbsoluteFill
      style={{
        background: `linear-gradient(${135 + bgShift * 0.5}deg, #dc2626 0%, #ea580c 50%, #f59e0b 100%)`,
        justifyContent: 'center',
        alignItems: 'center',
        padding: '80px',
      }}
    >
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 60,
          transform: `scale(${ctaScale})`,
        }}
      >
        <div
          style={{
            fontFamily: 'Pretendard, sans-serif',
            fontWeight: 900,
            fontSize: 120,
            color: 'white',
            textAlign: 'center',
            lineHeight: 1.2,
            letterSpacing: '-0.03em',
            textShadow: '0 6px 32px rgba(0,0,0,0.3)',
          }}
        >
          {cta}
        </div>

        <div
          style={{
            fontFamily: 'Pretendard, sans-serif',
            fontWeight: 900,
            fontSize: 100,
            color: 'white',
            transform: `translateY(${arrowBounce}px)`,
          }}
        >
          ↓
        </div>
      </div>
    </AbsoluteFill>
  );
};
