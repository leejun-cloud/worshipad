import { AbsoluteFill, interpolate, useCurrentFrame, spring, useVideoConfig } from 'remotion';

interface GridItem {
  icon: string;
  label: string;
}

interface Props {
  index: number;
  total: number;
  title: string;
  gridItems: GridItem[]; // 4 items for 2x2 grid
  accentColor?: string;
  bgGradient?: string;
}

export const ItemSceneGrid: React.FC<Props> = ({ index, total, title, gridItems, accentColor, bgGradient }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const accent = accentColor || '#a855f7';

  const titleOpacity = interpolate(frame, [0, 25], [0, 1], { extrapolateRight: 'clamp' });

  // Pad to 4 items
  const items = [...gridItems];
  while (items.length < 4) items.push({ icon: '✨', label: '' });

  return (
    <AbsoluteFill
      style={{
        background: bgGradient ?? 'linear-gradient(135deg, #1e1b4b 0%, #0f172a 100%)',
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
          marginBottom: 80,
        }}
      >
        {title}
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 24,
          maxWidth: 920,
          margin: '0 auto',
          width: '100%',
        }}
      >
        {items.slice(0, 4).map((item, i) => {
          const delay = 25 + i * 8;
          const cellSpring = spring({ frame: frame - delay, fps, config: { damping: 14, stiffness: 130 } });
          const opacity = interpolate(cellSpring, [0, 1], [0, 1]);
          const scale = interpolate(cellSpring, [0, 1], [0.85, 1]);

          return (
            <div
              key={i}
              style={{
                backgroundColor: 'rgba(255,255,255,0.08)',
                border: `2px solid ${accent}`,
                borderRadius: 24,
                padding: '40px 28px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 20,
                opacity,
                transform: `scale(${scale})`,
                minHeight: 240,
                justifyContent: 'center',
              }}
            >
              <div style={{ fontSize: 84, lineHeight: 1 }}>{item.icon}</div>
              <div
                style={{
                  fontFamily: 'Pretendard, sans-serif',
                  fontWeight: 700,
                  fontSize: 30,
                  color: '#f8fafc',
                  textAlign: 'center',
                  lineHeight: 1.3,
                }}
              >
                {item.label}
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
