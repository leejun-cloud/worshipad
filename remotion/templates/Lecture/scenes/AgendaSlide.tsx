import { AbsoluteFill, interpolate, useCurrentFrame } from 'remotion';

interface Props {
  items: string[];
  accentColor?: string;
  activeIndex?: number; // highlight current section (-1 = none)
}

export const AgendaSlide: React.FC<Props> = ({
  items,
  accentColor = '#4f8ef7',
  activeIndex = -1,
}) => {
  const frame = useCurrentFrame();

  const headerOpacity = interpolate(frame, [0, 18], [0, 1], { extrapolateRight: 'clamp' });
  const headerY = interpolate(frame, [0, 18], [20, 0], { extrapolateRight: 'clamp' });

  return (
    <AbsoluteFill style={{ background: '#0d0f14', padding: '80px 120px' }}>
      {/* Top accent line */}
      <div
        style={{
          height: 4,
          width: interpolate(frame, [0, 25], [0, 200], { extrapolateRight: 'clamp' }),
          background: accentColor,
          borderRadius: 2,
          marginBottom: 48,
        }}
      />

      {/* Header */}
      <div
        style={{
          opacity: headerOpacity,
          transform: `translateY(${headerY}px)`,
          fontFamily: 'Pretendard, sans-serif',
          fontWeight: 900,
          fontSize: 52,
          color: '#ffffff',
          letterSpacing: '-0.02em',
          marginBottom: 56,
        }}
      >
        목차
      </div>

      {/* Agenda items */}
      {items.map((item, i) => {
        const delay = 20 + i * 12;
        const opacity = interpolate(frame, [delay, delay + 18], [0, 1], { extrapolateRight: 'clamp' });
        const y = interpolate(frame, [delay, delay + 18], [20, 0], { extrapolateRight: 'clamp' });
        const isActive = i === activeIndex;

        return (
          <div
            key={i}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 36,
              marginBottom: 32,
              opacity,
              transform: `translateY(${y}px)`,
            }}
          >
            <div
              style={{
                fontFamily: 'Pretendard, sans-serif',
                fontWeight: 700,
                fontSize: 32,
                color: isActive ? accentColor : 'rgba(255,255,255,0.35)',
                minWidth: 48,
                letterSpacing: '0.02em',
              }}
            >
              {String(i + 1).padStart(2, '0')}
            </div>
            <div
              style={{
                height: 1,
                width: 24,
                background: isActive ? accentColor : 'rgba(255,255,255,0.2)',
              }}
            />
            <div
              style={{
                fontFamily: 'Pretendard, sans-serif',
                fontWeight: isActive ? 700 : 500,
                fontSize: 40,
                color: isActive ? '#ffffff' : 'rgba(255,255,255,0.62)',
                letterSpacing: '-0.015em',
                lineHeight: 1.3,
              }}
            >
              {item}
            </div>
          </div>
        );
      })}
    </AbsoluteFill>
  );
};
