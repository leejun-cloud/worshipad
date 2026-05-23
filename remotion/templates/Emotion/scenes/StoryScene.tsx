import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from 'remotion';

interface Props {
  story: string;
}

export const StoryScene: React.FC<Props> = ({ story }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();

  const lines = story.split(/(?<=[.!?])\s+|\n/).filter((l) => l.trim().length > 0);
  const perLineFrames = durationInFrames / Math.max(lines.length, 1);

  const kenBurns = interpolate(frame, [0, durationInFrames], [1.0, 1.1]);

  return (
    <AbsoluteFill
      style={{
        background: 'linear-gradient(180deg, #3a2817 0%, #5c3d1f 100%)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '100px',
      }}
    >
      <AbsoluteFill
        style={{
          background: 'radial-gradient(circle at 30% 20%, rgba(255,200,120,0.1), transparent 50%)',
          pointerEvents: 'none',
        }}
      />
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 32,
          maxWidth: 900,
          transform: `scale(${kenBurns})`,
        }}
      >
        {lines.map((line, idx) => {
          const lineStart = idx * perLineFrames;
          const lineFadeIn = interpolate(
            frame,
            [lineStart, lineStart + 20],
            [0, 1],
            { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
          );
          const translateY = interpolate(
            frame,
            [lineStart, lineStart + 20],
            [30, 0],
            { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
          );

          return (
            <div
              key={idx}
              style={{
                fontFamily: 'Pretendard, sans-serif',
                fontWeight: 400,
                fontSize: 52,
                color: '#fde8c9',
                lineHeight: 1.6,
                letterSpacing: '-0.01em',
                opacity: lineFadeIn,
                transform: `translateY(${translateY}px)`,
              }}
            >
              {line}
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
