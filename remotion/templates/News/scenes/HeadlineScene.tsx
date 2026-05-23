import { AbsoluteFill, interpolate, useCurrentFrame, spring, useVideoConfig } from 'remotion';

interface Props {
  headline: string;
}

export const HeadlineScene: React.FC<Props> = ({ headline }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const badgeSpring = spring({ frame: frame - 5, fps, config: { damping: 12, mass: 0.5 } });
  const badgeScale = interpolate(badgeSpring, [0, 1], [0, 1]);

  const headlineOpacity = interpolate(frame, [20, 45], [0, 1], { extrapolateRight: 'clamp' });
  const headlineY = interpolate(frame, [20, 45], [40, 0], { extrapolateRight: 'clamp' });

  const tickerX = interpolate(frame, [0, 180], [1080, -1080], { extrapolateRight: 'clamp' });

  return (
    <AbsoluteFill
      style={{
        background: 'linear-gradient(180deg, #0c2850 0%, #1e3a8a 100%)',
        padding: '120px 80px',
        flexDirection: 'column',
        justifyContent: 'center',
      }}
    >
      <div
        style={{
          display: 'inline-flex',
          backgroundColor: '#ef4444',
          color: 'white',
          fontFamily: 'Pretendard, sans-serif',
          fontWeight: 900,
          fontSize: 42,
          padding: '18px 36px',
          borderRadius: 12,
          letterSpacing: '0.1em',
          alignSelf: 'flex-start',
          transform: `scale(${badgeScale})`,
          marginBottom: 60,
          boxShadow: '0 8px 24px rgba(239,68,68,0.4)',
        }}
      >
        NEW
      </div>

      <div
        style={{
          fontFamily: 'Pretendard, sans-serif',
          fontWeight: 900,
          fontSize: 96,
          color: 'white',
          lineHeight: 1.25,
          letterSpacing: '-0.02em',
          opacity: headlineOpacity,
          transform: `translateY(${headlineY}px)`,
          textShadow: '0 4px 24px rgba(0,0,0,0.4)',
        }}
      >
        {headline}
      </div>

      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: 8,
          backgroundColor: '#fbbf24',
        }}
      />
      <div
        style={{
          position: 'absolute',
          bottom: 20,
          left: 0,
          width: '100%',
          overflow: 'hidden',
          display: 'flex',
        }}
      >
        <div
          style={{
            fontFamily: 'Pretendard, sans-serif',
            fontWeight: 700,
            fontSize: 32,
            color: '#fbbf24',
            whiteSpace: 'nowrap',
            transform: `translateX(${tickerX}px)`,
          }}
        >
          BREAKING NEWS · BREAKING NEWS · BREAKING NEWS · BREAKING NEWS
        </div>
      </div>
    </AbsoluteFill>
  );
};
