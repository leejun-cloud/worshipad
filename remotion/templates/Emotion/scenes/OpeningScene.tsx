import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from 'remotion';

interface Props {
  opening: string;
}

export const OpeningScene: React.FC<Props> = ({ opening }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();

  const fadeIn = interpolate(frame, [0, 60], [0, 1], { extrapolateRight: 'clamp' });
  const fadeOut = interpolate(
    frame,
    [durationInFrames - 30, durationInFrames],
    [1, 0.7],
    { extrapolateLeft: 'clamp' }
  );
  const opacity = Math.min(fadeIn, fadeOut);

  const kenBurns = interpolate(frame, [0, durationInFrames], [1.0, 1.08]);
  const vignette = interpolate(frame, [0, 30], [0, 1], { extrapolateRight: 'clamp' });

  return (
    <AbsoluteFill
      style={{
        background: 'linear-gradient(180deg, #1c1410 0%, #2d1f15 100%)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '120px',
      }}
    >
      <AbsoluteFill
        style={{
          background: `radial-gradient(circle, transparent 40%, rgba(0,0,0,${vignette * 0.6}) 100%)`,
          pointerEvents: 'none',
        }}
      />
      <div
        style={{
          fontFamily: 'Pretendard, sans-serif',
          fontWeight: 400,
          fontSize: 60,
          color: '#f5e6d3',
          textAlign: 'center',
          lineHeight: 1.6,
          letterSpacing: '-0.01em',
          opacity,
          transform: `scale(${kenBurns})`,
          maxWidth: 840,
        }}
      >
        {opening}
      </div>
    </AbsoluteFill>
  );
};
