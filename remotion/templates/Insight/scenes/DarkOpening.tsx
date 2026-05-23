import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from 'remotion';

export const DarkOpening: React.FC = () => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();

  const dotOpacity = interpolate(
    frame,
    [30, 60, durationInFrames - 20, durationInFrames],
    [0, 1, 1, 0],
    { extrapolateRight: 'clamp' }
  );

  return (
    <AbsoluteFill
      style={{
        backgroundColor: '#000',
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      <div
        style={{
          display: 'flex',
          gap: 24,
          opacity: dotOpacity,
        }}
      >
        {[0, 1, 2].map((i) => {
          const phase = (frame / 30 + i * 0.3) % 2;
          const dotScale = phase < 1 ? interpolate(phase, [0, 1], [0.5, 1.2]) : interpolate(phase, [1, 2], [1.2, 0.5]);
          return (
            <div
              key={i}
              style={{
                width: 20,
                height: 20,
                borderRadius: '50%',
                backgroundColor: '#94a3b8',
                transform: `scale(${dotScale})`,
              }}
            />
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
