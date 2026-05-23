import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from 'remotion';

interface Props {
  elaboration: string;
  source?: string;
}

export const ElaborationScene: React.FC<Props> = ({ elaboration, source }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();

  const elaborationOpacity = interpolate(frame, [10, 40], [0, 1], { extrapolateRight: 'clamp' });
  const elaborationY = interpolate(frame, [10, 40], [20, 0], { extrapolateRight: 'clamp' });

  const sourceOpacity = interpolate(
    frame,
    [60, 90],
    [0, source ? 0.7 : 0],
    { extrapolateRight: 'clamp' }
  );

  const fadeOut = interpolate(
    frame,
    [durationInFrames - 30, durationInFrames],
    [1, 0],
    { extrapolateLeft: 'clamp' }
  );

  return (
    <AbsoluteFill
      style={{
        backgroundColor: '#0a0a0a',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '100px',
        opacity: fadeOut,
      }}
    >
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 80,
          maxWidth: 900,
        }}
      >
        <div
          style={{
            width: 80,
            height: 2,
            backgroundColor: '#64748b',
            opacity: elaborationOpacity,
          }}
        />
        <div
          style={{
            fontFamily: 'Pretendard, sans-serif',
            fontWeight: 400,
            fontSize: 44,
            color: '#cbd5e1',
            textAlign: 'center',
            lineHeight: 1.6,
            letterSpacing: '-0.01em',
            opacity: elaborationOpacity,
            transform: `translateY(${elaborationY}px)`,
          }}
        >
          {elaboration}
        </div>
        {source && (
          <div
            style={{
              fontFamily: 'Pretendard, sans-serif',
              fontWeight: 400,
              fontSize: 32,
              color: '#64748b',
              textAlign: 'center',
              letterSpacing: '0.05em',
              opacity: sourceOpacity,
              fontStyle: 'italic',
            }}
          >
            — {source}
          </div>
        )}
      </div>
    </AbsoluteFill>
  );
};
