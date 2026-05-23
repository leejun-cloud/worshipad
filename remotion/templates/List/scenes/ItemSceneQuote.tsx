import { AbsoluteFill, interpolate, useCurrentFrame, spring, useVideoConfig } from 'remotion';

interface Props {
  index: number;
  total: number;
  quote: string;
  attribution: string; // title or source
  accentColor?: string;
  bgGradient?: string;
}

export const ItemSceneQuote: React.FC<Props> = ({ index, total, quote, attribution, accentColor, bgGradient }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const accent = accentColor || '#fbbf24';

  const quoteMarkSpring = spring({ frame, fps, config: { damping: 12, stiffness: 130 } });
  const quoteMarkScale = interpolate(quoteMarkSpring, [0, 1], [0, 1]);

  const words = quote.split(/\s+/).filter((w) => w.length > 0);
  const wordRevealStart = 15;
  const framesPerWord = 6;

  const attribOpacity = interpolate(
    frame,
    [wordRevealStart + words.length * framesPerWord + 15, wordRevealStart + words.length * framesPerWord + 35],
    [0, 0.8],
    { extrapolateRight: 'clamp' }
  );

  return (
    <AbsoluteFill
      style={{
        background: bgGradient ?? 'linear-gradient(135deg, #1c1410 0%, #2d1f15 50%, #1c1410 100%)',
        padding: '100px 80px',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      <div
        style={{
          fontFamily: 'Georgia, serif',
          fontSize: 280,
          color: accent,
          opacity: 0.4,
          lineHeight: 0.7,
          transform: `scale(${quoteMarkScale})`,
          marginBottom: -40,
          letterSpacing: '-0.1em',
        }}
      >
        "
      </div>

      <div
        style={{
          fontFamily: 'Pretendard, sans-serif',
          fontWeight: 700,
          fontSize: 64,
          color: '#f5e6d3',
          textAlign: 'center',
          lineHeight: 1.4,
          letterSpacing: '-0.02em',
          maxWidth: 920,
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'center',
          gap: '12px 20px',
          marginBottom: 80,
        }}
      >
        {words.map((word, idx) => {
          const wordStart = wordRevealStart + idx * framesPerWord;
          const opacity = interpolate(
            frame,
            [wordStart, wordStart + 12],
            [0, 1],
            { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
          );
          const blur = interpolate(
            frame,
            [wordStart, wordStart + 12],
            [8, 0],
            { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
          );
          return (
            <span key={idx} style={{ opacity, filter: `blur(${blur}px)`, display: 'inline-block' }}>
              {word}
            </span>
          );
        })}
      </div>

      <div
        style={{
          width: 80,
          height: 2,
          backgroundColor: accent,
          opacity: attribOpacity,
          marginBottom: 24,
        }}
      />
      <div
        style={{
          fontFamily: 'Pretendard, sans-serif',
          fontWeight: 400,
          fontSize: 32,
          color: accent,
          letterSpacing: '0.05em',
          opacity: attribOpacity,
          fontStyle: 'italic',
        }}
      >
        — {attribution}
      </div>

      <div
        style={{
          position: 'absolute',
          top: 80,
          right: 80,
          fontFamily: 'Pretendard, sans-serif',
          fontWeight: 700,
          fontSize: 28,
          color: 'rgba(245,230,211,0.5)',
          letterSpacing: '0.1em',
        }}
      >
        {String(index + 1).padStart(2, '0')} / {String(total).padStart(2, '0')}
      </div>
    </AbsoluteFill>
  );
};
