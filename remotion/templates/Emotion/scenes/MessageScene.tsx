import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig, spring } from 'remotion';

interface Props {
  message: string;
}

export const MessageScene: React.FC<Props> = ({ message }) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  const reveal = spring({
    frame,
    fps,
    config: { damping: 20, mass: 1, stiffness: 80 },
  });

  const scale = interpolate(reveal, [0, 1], [0.92, 1]);
  const opacity = interpolate(reveal, [0, 1], [0, 1]);

  const glow = interpolate(
    frame % 60,
    [0, 30, 60],
    [0.4, 0.8, 0.4],
    { extrapolateRight: 'clamp' }
  );

  const fadeOut = interpolate(
    frame,
    [durationInFrames - 20, durationInFrames],
    [1, 0.8],
    { extrapolateLeft: 'clamp' }
  );

  return (
    <AbsoluteFill
      style={{
        background: 'linear-gradient(180deg, #2d1f15 0%, #4a301a 50%, #2d1f15 100%)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '100px',
      }}
    >
      <AbsoluteFill
        style={{
          background: `radial-gradient(circle at 50% 50%, rgba(255,180,80,${glow * 0.15}), transparent 60%)`,
          pointerEvents: 'none',
        }}
      />
      <div
        style={{
          fontFamily: 'Pretendard, sans-serif',
          fontWeight: 700,
          fontSize: 80,
          color: '#fef3e0',
          textAlign: 'center',
          lineHeight: 1.4,
          letterSpacing: '-0.02em',
          opacity: opacity * fadeOut,
          transform: `scale(${scale})`,
          maxWidth: 900,
          textShadow: `0 0 40px rgba(255,180,80,${glow * 0.3})`,
        }}
      >
        {message}
      </div>
    </AbsoluteFill>
  );
};
