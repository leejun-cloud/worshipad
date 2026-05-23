import { AbsoluteFill, interpolate, useCurrentFrame, spring, useVideoConfig } from 'remotion';

interface Props {
  index: number;
  total: number;
  title: string;
  statValue: string; // e.g., "85%", "3배"
  description: string;
  accentColor?: string;
  bgGradient?: string;
}

const PALETTES = [
  { bg1: '#1e3a8a', bg2: '#0f172a', accent: '#fbbf24' },
  { bg1: '#7c2d12', bg2: '#0f172a', accent: '#f97316' },
  { bg1: '#14532d', bg2: '#0f172a', accent: '#84cc16' },
  { bg1: '#581c87', bg2: '#0f172a', accent: '#a855f7' },
  { bg1: '#831843', bg2: '#0f172a', accent: '#ec4899' },
  { bg1: '#155e75', bg2: '#0f172a', accent: '#06b6d4' },
];

export const ItemSceneStat: React.FC<Props> = ({ index, total, title, statValue, description, accentColor, bgGradient }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const palette = PALETTES[index % PALETTES.length];
  const accent = accentColor || palette.accent;

  const statSpring = spring({ frame: frame - 5, fps, config: { damping: 10, stiffness: 130, mass: 0.7 } });
  const statScale = interpolate(statSpring, [0, 1], [0, 1.1]);
  const statSettle = spring({ frame: frame - 25, fps, config: { damping: 18, stiffness: 200 } });
  const finalScale = interpolate(statSettle, [0, 1], [1.1, 1]);

  const titleOpacity = interpolate(frame, [25, 50], [0, 1], { extrapolateRight: 'clamp' });
  const descOpacity = interpolate(frame, [40, 65], [0, 1], { extrapolateRight: 'clamp' });

  return (
    <AbsoluteFill
      style={{
        background: bgGradient ?? `linear-gradient(180deg, ${palette.bg1} 0%, ${palette.bg2} 100%)`,
        padding: '120px 90px',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      <div
        style={{
          display: 'flex',
          fontFamily: 'Pretendard, sans-serif',
          fontWeight: 700,
          fontSize: 28,
          color: accent,
          letterSpacing: '0.2em',
          marginBottom: 20,
        }}
      >
        {String(index + 1).padStart(2, '0')} / {String(total).padStart(2, '0')}
      </div>

      <div
        style={{
          fontFamily: 'Pretendard, sans-serif',
          fontWeight: 900,
          fontSize: 280,
          color: accent,
          lineHeight: 1,
          letterSpacing: '-0.06em',
          transform: `scale(${statScale * finalScale})`,
          textShadow: `0 12px 60px ${accent}40`,
          marginBottom: 50,
        }}
      >
        {statValue}
      </div>

      <div
        style={{
          fontFamily: 'Pretendard, sans-serif',
          fontWeight: 900,
          fontSize: 60,
          color: 'white',
          textAlign: 'center',
          lineHeight: 1.3,
          letterSpacing: '-0.02em',
          opacity: titleOpacity,
          marginBottom: 32,
          maxWidth: 880,
        }}
      >
        {title}
      </div>

      <div
        style={{
          fontFamily: 'Pretendard, sans-serif',
          fontWeight: 400,
          fontSize: 36,
          color: '#cbd5e1',
          textAlign: 'center',
          lineHeight: 1.5,
          opacity: descOpacity,
          maxWidth: 880,
        }}
      >
        {description}
      </div>

      <div
        style={{
          position: 'absolute',
          bottom: 60,
          left: 90,
          right: 90,
          height: 6,
          backgroundColor: 'rgba(255,255,255,0.15)',
          borderRadius: 3,
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            width: `${((index + 1) / total) * 100}%`,
            height: '100%',
            backgroundColor: accent,
          }}
        />
      </div>
    </AbsoluteFill>
  );
};
