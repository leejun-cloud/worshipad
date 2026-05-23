import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from 'remotion';

interface Props {
  closing: string;
}

export const ClosingScene: React.FC<Props> = ({ closing }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();

  const fadeIn = interpolate(frame, [0, 40], [0, 1], { extrapolateRight: 'clamp' });
  const fadeToBlack = interpolate(
    frame,
    [durationInFrames - 40, durationInFrames],
    [1, 0],
    { extrapolateLeft: 'clamp' }
  );
  const opacity = Math.min(fadeIn, fadeToBlack);

  const bgOpacity = interpolate(
    frame,
    [durationInFrames - 40, durationInFrames],
    [1, 0],
    { extrapolateLeft: 'clamp' }
  );

  return (
    <AbsoluteFill style={{ backgroundColor: 'black' }}>
      <AbsoluteFill
        style={{
          background: 'linear-gradient(180deg, #1c1410 0%, #0a0706 100%)',
          opacity: bgOpacity,
        }}
      />
      <AbsoluteFill
        style={{
          justifyContent: 'center',
          alignItems: 'center',
          padding: '100px',
        }}
      >
        <div
          style={{
            fontFamily: 'Pretendard, sans-serif',
            fontWeight: 400,
            fontSize: 56,
            color: '#d4a574',
            textAlign: 'center',
            lineHeight: 1.5,
            letterSpacing: '0.02em',
            opacity,
            fontStyle: 'italic',
            maxWidth: 800,
          }}
        >
          {closing}
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
