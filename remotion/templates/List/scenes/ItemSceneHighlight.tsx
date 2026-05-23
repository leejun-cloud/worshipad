import { AbsoluteFill, interpolate, useCurrentFrame, spring, useVideoConfig } from 'remotion';

interface Props {
  index: number;
  total: number;
  title: string;
  emphasis: string; // the key phrase to highlight
  description: string;
  accentColor?: string;
  bgGradient?: string;
}

export const ItemSceneHighlight: React.FC<Props> = ({ index, total, title, emphasis, description, accentColor, bgGradient }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const accent = accentColor || '#facc15';

  const titleOpacity = interpolate(frame, [0, 20], [0, 1], { extrapolateRight: 'clamp' });
  const titleY = interpolate(frame, [0, 20], [-20, 0], { extrapolateRight: 'clamp' });

  const emphasisSpring = spring({ frame: frame - 20, fps, config: { damping: 12, stiffness: 130 } });
  const emphasisScale = interpolate(emphasisSpring, [0, 1], [0.85, 1]);
  const emphasisOpacity = interpolate(emphasisSpring, [0, 1], [0, 1]);

  const descOpacity = interpolate(frame, [50, 75], [0, 1], { extrapolateRight: 'clamp' });

  return (
    <AbsoluteFill
      style={{
        background: bgGradient ?? 'linear-gradient(135deg, #1c1917 0%, #44403c 100%)',
        padding: '120px 80px',
        flexDirection: 'column',
        justifyContent: 'center',
      }}
    >
      <div
        style={{
          fontFamily: 'Pretendard, sans-serif',
          fontWeight: 700,
          fontSize: 36,
          color: '#a8a29e',
          textAlign: 'center',
          letterSpacing: '0.1em',
          opacity: titleOpacity,
          transform: `translateY(${titleY}px)`,
          marginBottom: 50,
        }}
      >
        {title}
      </div>

      <div
        style={{
          display: 'flex',
          padding: '60px 50px',
          backgroundColor: accent,
          borderRadius: 32,
          margin: '0 auto 60px auto',
          maxWidth: 900,
          opacity: emphasisOpacity,
          transform: `scale(${emphasisScale})`,
          boxShadow: `0 16px 48px ${accent}40`,
        }}
      >
        <div
          style={{
            fontFamily: 'Pretendard, sans-serif',
            fontWeight: 900,
            fontSize: 64,
            color: '#1c1917',
            textAlign: 'center',
            lineHeight: 1.3,
            letterSpacing: '-0.02em',
            width: '100%',
          }}
        >
          {emphasis}
        </div>
      </div>

      <div
        style={{
          fontFamily: 'Pretendard, sans-serif',
          fontWeight: 400,
          fontSize: 38,
          color: '#e7e5e4',
          textAlign: 'center',
          lineHeight: 1.5,
          maxWidth: 900,
          margin: '0 auto',
          opacity: descOpacity,
        }}
      >
        {description}
      </div>

      <div
        style={{
          position: 'absolute',
          bottom: 40,
          left: 0,
          right: 0,
          textAlign: 'center',
          fontFamily: 'Pretendard, sans-serif',
          fontWeight: 700,
          fontSize: 24,
          color: 'rgba(231,229,228,0.6)',
          letterSpacing: '0.1em',
        }}
      >
        {String(index + 1).padStart(2, '0')} / {String(total).padStart(2, '0')}
      </div>
    </AbsoluteFill>
  );
};
