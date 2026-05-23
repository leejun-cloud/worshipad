import { AbsoluteFill, interpolate, useCurrentFrame, spring, useVideoConfig } from 'remotion';

interface Props {
  index: number;
  total: number;
  icon: string; // emoji or text icon
  title: string;
  description: string;
  accentColor?: string;
  bgGradient?: string;
}

const PALETTES = [
  { bg: '#0c4a6e', accent: '#06b6d4' },
  { bg: '#581c87', accent: '#a855f7' },
  { bg: '#831843', accent: '#ec4899' },
  { bg: '#365314', accent: '#84cc16' },
  { bg: '#7c2d12', accent: '#f97316' },
];

export const ItemSceneIconFeature: React.FC<Props> = ({ index, total, icon, title, description, accentColor, bgGradient }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const palette = PALETTES[index % PALETTES.length];
  const accent = accentColor || palette.accent;

  const iconSpring = spring({ frame, fps, config: { damping: 10, stiffness: 130, mass: 0.7 } });
  const iconScale = interpolate(iconSpring, [0, 1], [0, 1.1]);
  const iconSettle = spring({ frame: frame - 25, fps, config: { damping: 18, stiffness: 200 } });
  const finalIconScale = interpolate(iconSettle, [0, 1], [1.1, 1]);

  const iconRotate = interpolate(frame, [0, 30], [-15, 0], { extrapolateRight: 'clamp' });

  const titleOpacity = interpolate(frame, [25, 50], [0, 1], { extrapolateRight: 'clamp' });
  const titleY = interpolate(frame, [25, 50], [30, 0], { extrapolateRight: 'clamp' });

  const descOpacity = interpolate(frame, [45, 75], [0, 1], { extrapolateRight: 'clamp' });

  return (
    <AbsoluteFill
      style={{
        background: bgGradient ?? `linear-gradient(180deg, ${palette.bg} 0%, #0f172a 100%)`,
        padding: '120px 80px',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      <div
        style={{
          width: 280,
          height: 280,
          borderRadius: '50%',
          backgroundColor: `${accent}20`,
          border: `4px solid ${accent}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 160,
          marginBottom: 60,
          transform: `scale(${iconScale * finalIconScale}) rotate(${iconRotate}deg)`,
          boxShadow: `0 16px 60px ${accent}40`,
        }}
      >
        {icon}
      </div>

      <div
        style={{
          fontFamily: 'Pretendard, sans-serif',
          fontWeight: 900,
          fontSize: 72,
          color: 'white',
          textAlign: 'center',
          lineHeight: 1.25,
          letterSpacing: '-0.03em',
          opacity: titleOpacity,
          transform: `translateY(${titleY}px)`,
          marginBottom: 32,
          maxWidth: 880,
          textShadow: '0 4px 24px rgba(0,0,0,0.4)',
        }}
      >
        {title}
      </div>

      <div
        style={{
          fontFamily: 'Pretendard, sans-serif',
          fontWeight: 400,
          fontSize: 38,
          color: '#e2e8f0',
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
          bottom: 40,
          left: 0,
          right: 0,
          textAlign: 'center',
          fontFamily: 'Pretendard, sans-serif',
          fontWeight: 700,
          fontSize: 24,
          color: 'rgba(255,255,255,0.6)',
          letterSpacing: '0.1em',
        }}
      >
        {String(index + 1).padStart(2, '0')} / {String(total).padStart(2, '0')}
      </div>
    </AbsoluteFill>
  );
};
