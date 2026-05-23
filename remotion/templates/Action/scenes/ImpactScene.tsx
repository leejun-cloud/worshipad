import { AbsoluteFill, interpolate, useCurrentFrame, spring, useVideoConfig } from 'remotion';

interface Props {
  solution: string;
  benefit: string;
}

export const ImpactScene: React.FC<Props> = ({ solution, benefit }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const benefitScale = spring({
    frame,
    fps,
    config: { damping: 10, mass: 0.5, stiffness: 120 },
  });

  const solutionOpacity = interpolate(frame, [30, 50], [0, 1], { extrapolateRight: 'clamp' });
  const solutionY = interpolate(frame, [30, 50], [40, 0], { extrapolateRight: 'clamp' });

  const flashOpacity = interpolate(
    frame,
    [0, 5, 10],
    [0.9, 0.3, 0],
    { extrapolateRight: 'clamp' }
  );

  return (
    <AbsoluteFill
      style={{
        background: 'linear-gradient(180deg, #0f172a 0%, #1e293b 100%)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '80px',
      }}
    >
      <AbsoluteFill
        style={{ backgroundColor: 'white', opacity: flashOpacity, pointerEvents: 'none' }}
      />

      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 40,
        }}
      >
        <div
          style={{
            fontFamily: 'Pretendard, sans-serif',
            fontWeight: 900,
            fontSize: 140,
            color: '#fb923c',
            textAlign: 'center',
            lineHeight: 1.1,
            letterSpacing: '-0.03em',
            transform: `scale(${benefitScale})`,
            textShadow: '0 8px 40px rgba(251,146,60,0.5)',
          }}
        >
          {benefit}
        </div>

        <div
          style={{
            fontFamily: 'Pretendard, sans-serif',
            fontWeight: 700,
            fontSize: 56,
            color: 'white',
            textAlign: 'center',
            lineHeight: 1.4,
            opacity: solutionOpacity,
            transform: `translateY(${solutionY}px)`,
            maxWidth: 900,
          }}
        >
          {solution}
        </div>
      </div>
    </AbsoluteFill>
  );
};
