import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from 'remotion';

interface Props {
  quote: string;
}

export const QuoteScene: React.FC<Props> = ({ quote }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();

  const words = quote.split(/\s+/).filter((w) => w.length > 0);
  const wordRevealStart = 20;
  const framesPerWord = Math.max(10, Math.floor((durationInFrames - wordRevealStart - 40) / words.length));

  const scale = interpolate(frame, [0, durationInFrames], [1.0, 1.04]);

  return (
    <AbsoluteFill
      style={{
        backgroundColor: '#0a0a0a',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '100px',
      }}
    >
      <div
        style={{
          fontFamily: 'Pretendard, sans-serif',
          fontWeight: 700,
          fontSize: 88,
          color: 'white',
          textAlign: 'center',
          lineHeight: 1.4,
          letterSpacing: '-0.02em',
          maxWidth: 940,
          transform: `scale(${scale})`,
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'center',
          gap: '16px 24px',
        }}
      >
        {words.map((word, idx) => {
          const wordStart = wordRevealStart + idx * framesPerWord;
          const wordOpacity = interpolate(
            frame,
            [wordStart, wordStart + 15],
            [0, 1],
            { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
          );
          const wordBlur = interpolate(
            frame,
            [wordStart, wordStart + 15],
            [10, 0],
            { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
          );

          return (
            <span
              key={idx}
              style={{
                opacity: wordOpacity,
                filter: `blur(${wordBlur}px)`,
                display: 'inline-block',
              }}
            >
              {word}
            </span>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
