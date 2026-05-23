import { AbsoluteFill, interpolate, useCurrentFrame, spring, useVideoConfig } from 'remotion';

interface MiniStat {
  value: string; // e.g., "85%", "3배"
  label: string; // e.g., "효과", "성장"
}

interface Props {
  index: number;
  total: number;
  title: string;
  stats: MiniStat[]; // 2-4 mini stats
  accentColors?: string[];
  bgGradient?: string;
}

const DEFAULT_COLORS = ['#ef4444', '#f59e0b', '#10b981', '#3b82f6'];

export const ItemSceneStatGrid: React.FC<Props> = ({ index, total, title, stats, accentColors, bgGradient }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const colors = accentColors || DEFAULT_COLORS;

  const titleOpacity = interpolate(frame, [0, 25], [0, 1], { extrapolateRight: 'clamp' });

  return (
    <AbsoluteFill
      style={{
        background: bgGradient ?? 'linear-gradient(180deg, #0f172a 0%, #1e293b 100%)',
        padding: '100px 60px',
        flexDirection: 'column',
        justifyContent: 'center',
      }}
    >
      <div
        style={{
          fontFamily: 'Pretendard, sans-serif',
          fontWeight: 900,
          fontSize: 56,
          color: 'white',
          textAlign: 'center',
          lineHeight: 1.3,
          letterSpacing: '-0.02em',
          opacity: titleOpacity,
          marginBottom: 100,
          padding: '0 40px',
        }}
      >
        {title}
      </div>

      <div
        style={{
          display: 'flex',
          gap: 24,
          justifyContent: 'center',
          alignItems: 'stretch',
          flexWrap: 'wrap',
        }}
      >
        {stats.slice(0, 4).map((stat, i) => {
          const delay = 25 + i * 12;
          const sp = spring({ frame: frame - delay, fps, config: { damping: 12, stiffness: 130 } });
          const opacity = interpolate(sp, [0, 1], [0, 1]);
          const y = interpolate(sp, [0, 1], [40, 0]);
          const color = colors[i % colors.length];

          return (
            <div
              key={i}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 16,
                padding: '50px 30px',
                backgroundColor: 'rgba(255,255,255,0.06)',
                border: `2px solid ${color}`,
                borderRadius: 24,
                minWidth: 220,
                opacity,
                transform: `translateY(${y}px)`,
              }}
            >
              <div
                style={{
                  fontFamily: 'Pretendard, sans-serif',
                  fontWeight: 900,
                  fontSize: 96,
                  color,
                  lineHeight: 1,
                  letterSpacing: '-0.04em',
                }}
              >
                {stat.value}
              </div>
              <div
                style={{
                  fontFamily: 'Pretendard, sans-serif',
                  fontWeight: 700,
                  fontSize: 28,
                  color: '#cbd5e1',
                  textAlign: 'center',
                  letterSpacing: '0.05em',
                }}
              >
                {stat.label}
              </div>
            </div>
          );
        })}
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
