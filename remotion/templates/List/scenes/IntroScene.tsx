import { AbsoluteFill, interpolate, useCurrentFrame, spring, useVideoConfig } from 'remotion';

interface Props {
  headline: string;
  hook: string;
  itemCount: number;
  bgGradient?: string;
  accentColor?: string;
  textMutedColor?: string;
}

export const IntroScene: React.FC<Props> = ({
  headline,
  hook,
  itemCount,
  bgGradient,
  accentColor,
  textMutedColor,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const headlineOpacity = interpolate(frame, [0, 25], [0, 1], { extrapolateRight: 'clamp' });
  const headlineY = interpolate(frame, [0, 25], [40, 0], { extrapolateRight: 'clamp' });

  const badgeSpring = spring({ frame: frame - 25, fps, config: { damping: 12, stiffness: 140 } });
  const badgeScale = interpolate(badgeSpring, [0, 1], [0, 1]);

  const hookOpacity = interpolate(frame, [50, 80], [0, 1], { extrapolateRight: 'clamp' });
  const hookY = interpolate(frame, [50, 80], [30, 0], { extrapolateRight: 'clamp' });

  return (
    <AbsoluteFill
      style={{
        background: bgGradient ?? 'linear-gradient(135deg, #1e293b 0%, #312e81 50%, #4c1d95 100%)',
        padding: '120px 80px',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      <div
        style={{
          fontFamily: 'Pretendard, sans-serif',
          fontWeight: 900,
          fontSize: 84,
          color: 'white',
          textAlign: 'center',
          lineHeight: 1.25,
          letterSpacing: '-0.03em',
          opacity: headlineOpacity,
          transform: `translateY(${headlineY}px)`,
          marginBottom: 60,
          textShadow: '0 4px 24px rgba(0,0,0,0.4)',
        }}
      >
        {headline}
      </div>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 16,
          padding: '20px 40px',
          backgroundColor: accentColor ?? '#fbbf24',
          color: '#1e293b',
          borderRadius: 100,
          fontFamily: 'Pretendard, sans-serif',
          fontWeight: 900,
          fontSize: 48,
          letterSpacing: '-0.02em',
          transform: `scale(${badgeScale})`,
          marginBottom: 60,
          boxShadow: '0 12px 32px rgba(251,191,36,0.4)',
        }}
      >
        {itemCount}가지 방법
      </div>

      <div
        style={{
          fontFamily: 'Pretendard, sans-serif',
          fontWeight: 700,
          fontSize: 44,
          color: textMutedColor ?? '#cbd5e1',
          textAlign: 'center',
          lineHeight: 1.5,
          maxWidth: 880,
          opacity: hookOpacity,
          transform: `translateY(${hookY}px)`,
        }}
      >
        {hook}
      </div>
    </AbsoluteFill>
  );
};
