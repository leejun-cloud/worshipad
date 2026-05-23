import { AbsoluteFill, interpolate, useCurrentFrame, spring, useVideoConfig } from 'remotion';

interface Props {
  index: number;
  total: number;
  title: string;
  bigNumber: string; // e.g., "48.8"
  unit: string; // e.g., "조 원", "명"
  description: string;
  accentColor?: string;
  bgGradient?: string;
}

export const ItemSceneBigdata: React.FC<Props> = ({ index, total, title, bigNumber, unit, description, accentColor, bgGradient }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const accent = accentColor || '#06b6d4';

  // Animated counter effect: ease in
  const counterReveal = interpolate(frame, [10, 70], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // Try to animate numeric portion if it's a clean number
  const numericValue = parseFloat(bigNumber);
  const displayNumber = !isNaN(numericValue)
    ? (numericValue * counterReveal).toFixed(numericValue % 1 === 0 ? 0 : 1)
    : bigNumber;

  const titleOpacity = interpolate(frame, [0, 25], [0, 1], { extrapolateRight: 'clamp' });
  const unitSpring = spring({ frame: frame - 65, fps, config: { damping: 12, stiffness: 130 } });
  const unitScale = interpolate(unitSpring, [0, 1], [0, 1]);

  const descOpacity = interpolate(frame, [80, 105], [0, 1], { extrapolateRight: 'clamp' });

  return (
    <AbsoluteFill
      style={{
        background: bgGradient ?? 'linear-gradient(180deg, #0c4a6e 0%, #082f49 100%)',
        padding: '120px 80px',
        flexDirection: 'column',
        justifyContent: 'center',
      }}
    >
      <div
        style={{
          fontFamily: 'Pretendard, sans-serif',
          fontWeight: 700,
          fontSize: 32,
          color: accent,
          letterSpacing: '0.15em',
          marginBottom: 24,
          opacity: titleOpacity,
        }}
      >
        DATA POINT · {String(index + 1).padStart(2, '0')}
      </div>

      <div
        style={{
          fontFamily: 'Pretendard, sans-serif',
          fontWeight: 700,
          fontSize: 50,
          color: 'white',
          lineHeight: 1.3,
          letterSpacing: '-0.02em',
          opacity: titleOpacity,
          marginBottom: 60,
          maxWidth: 880,
        }}
      >
        {title}
      </div>

      <div
        style={{
          display: 'flex',
          alignItems: 'baseline',
          gap: 24,
          marginBottom: 60,
        }}
      >
        <div
          style={{
            fontFamily: 'Pretendard, sans-serif',
            fontWeight: 900,
            fontSize: 320,
            color: accent,
            lineHeight: 1,
            letterSpacing: '-0.06em',
            textShadow: `0 8px 60px ${accent}40`,
          }}
        >
          {displayNumber}
        </div>
        <div
          style={{
            fontFamily: 'Pretendard, sans-serif',
            fontWeight: 700,
            fontSize: 80,
            color: 'white',
            transform: `scale(${unitScale})`,
            transformOrigin: 'left bottom',
          }}
        >
          {unit}
        </div>
      </div>

      <div
        style={{
          fontFamily: 'Pretendard, sans-serif',
          fontWeight: 400,
          fontSize: 36,
          color: '#bae6fd',
          lineHeight: 1.5,
          opacity: descOpacity,
          maxWidth: 900,
        }}
      >
        {description}
      </div>

      <div
        style={{
          position: 'absolute',
          bottom: 60,
          right: 80,
          fontFamily: 'Pretendard, sans-serif',
          fontWeight: 700,
          fontSize: 28,
          color: 'rgba(186,230,253,0.6)',
          letterSpacing: '0.1em',
        }}
      >
        {String(index + 1).padStart(2, '0')} / {String(total).padStart(2, '0')}
      </div>
    </AbsoluteFill>
  );
};
