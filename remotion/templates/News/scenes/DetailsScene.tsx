import { AbsoluteFill, interpolate, useCurrentFrame, spring, useVideoConfig } from 'remotion';

interface Props {
  when: string;
  where: string;
  what: string;
}

const Card: React.FC<{ icon: string; label: string; value: string; delay: number }> = ({
  icon,
  label,
  value,
  delay,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const s = spring({
    frame: frame - delay,
    fps,
    config: { damping: 14, mass: 0.6, stiffness: 120 },
  });
  const opacity = interpolate(s, [0, 1], [0, 1]);
  const translateX = interpolate(s, [0, 1], [-80, 0]);

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 32,
        backgroundColor: 'rgba(255,255,255,0.98)',
        borderRadius: 24,
        padding: '36px 40px',
        boxShadow: '0 12px 40px rgba(0,0,0,0.15)',
        opacity,
        transform: `translateX(${translateX}px)`,
      }}
    >
      <div
        style={{
          display: 'flex',
          width: 80,
          height: 80,
          backgroundColor: '#1e3a8a',
          borderRadius: 20,
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 44,
          flexShrink: 0,
        }}
      >
        {icon}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontFamily: 'Pretendard, sans-serif',
            fontWeight: 700,
            fontSize: 26,
            color: '#64748b',
            letterSpacing: '0.05em',
          }}
        >
          {label}
        </div>
        <div
          style={{
            fontFamily: 'Pretendard, sans-serif',
            fontWeight: 900,
            fontSize: 42,
            color: '#0f172a',
            lineHeight: 1.3,
            letterSpacing: '-0.02em',
          }}
        >
          {value}
        </div>
      </div>
    </div>
  );
};

export const DetailsScene: React.FC<Props> = ({ when, where, what }) => {
  return (
    <AbsoluteFill
      style={{
        background: 'linear-gradient(180deg, #eff6ff 0%, #dbeafe 100%)',
        padding: '120px 80px',
        justifyContent: 'center',
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
        <Card icon="📅" label="WHEN" value={when} delay={0} />
        <Card icon="📍" label="WHERE" value={where} delay={20} />
        <Card icon="📢" label="WHAT" value={what} delay={40} />
      </div>
    </AbsoluteFill>
  );
};
