import { AbsoluteFill, interpolate, useCurrentFrame, spring, useVideoConfig } from 'remotion';

interface Props {
  action: string;
}

export const ActionScene: React.FC<Props> = ({ action }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const ctaSpring = spring({ frame, fps, config: { damping: 12, stiffness: 140 } });
  const scale = interpolate(ctaSpring, [0, 1], [0.85, 1]);

  const arrowPulse = interpolate(
    frame % 40,
    [0, 20, 40],
    [1, 1.15, 1],
    { extrapolateRight: 'clamp' }
  );

  return (
    <AbsoluteFill
      style={{
        background: 'linear-gradient(180deg, #1e3a8a 0%, #0c2850 100%)',
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
          gap: 48,
          transform: `scale(${scale})`,
        }}
      >
        <div
          style={{
            fontFamily: 'Pretendard, sans-serif',
            fontWeight: 700,
            fontSize: 36,
            color: '#fbbf24',
            letterSpacing: '0.2em',
          }}
        >
          HOW TO JOIN
        </div>

        <div
          style={{
            fontFamily: 'Pretendard, sans-serif',
            fontWeight: 900,
            fontSize: 88,
            color: 'white',
            textAlign: 'center',
            lineHeight: 1.3,
            letterSpacing: '-0.02em',
            maxWidth: 900,
            textShadow: '0 4px 20px rgba(0,0,0,0.4)',
          }}
        >
          {action}
        </div>

        <div
          style={{
            fontFamily: 'Pretendard, sans-serif',
            fontWeight: 900,
            fontSize: 72,
            color: '#fbbf24',
            transform: `scale(${arrowPulse})`,
          }}
        >
          →
        </div>
      </div>
    </AbsoluteFill>
  );
};
