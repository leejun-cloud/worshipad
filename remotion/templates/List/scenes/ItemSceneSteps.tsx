import { AbsoluteFill, interpolate, useCurrentFrame, spring, useVideoConfig } from 'remotion';

interface Props {
  index: number;
  total: number;
  title: string;
  steps: string[]; // 2-4 step strings
  accentColor?: string;
  bgGradient?: string;
}

export const ItemSceneSteps: React.FC<Props> = ({ index, total, title, steps, accentColor, bgGradient }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const accent = accentColor || '#3b82f6';

  const titleOpacity = interpolate(frame, [0, 25], [0, 1], { extrapolateRight: 'clamp' });

  return (
    <AbsoluteFill
      style={{
        background: bgGradient ?? 'linear-gradient(180deg, #1e3a8a 0%, #1e293b 100%)',
        padding: '120px 80px',
        flexDirection: 'column',
        justifyContent: 'center',
      }}
    >
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
          marginBottom: 80,
        }}
      >
        {title}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 32, maxWidth: 920, margin: '0 auto', width: '100%' }}>
        {steps.map((step, i) => {
          const stepDelay = 25 + i * 18;
          const stepSpring = spring({ frame: frame - stepDelay, fps, config: { damping: 12, stiffness: 130 } });
          const stepOpacity = interpolate(stepSpring, [0, 1], [0, 1]);
          const stepX = interpolate(stepSpring, [0, 1], [-60, 0]);

          return (
            <div
              key={i}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 32,
                opacity: stepOpacity,
                transform: `translateX(${stepX}px)`,
              }}
            >
              <div
                style={{
                  width: 100,
                  height: 100,
                  borderRadius: '50%',
                  backgroundColor: accent,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontFamily: 'Pretendard, sans-serif',
                  fontWeight: 900,
                  fontSize: 56,
                  color: '#0f172a',
                  flexShrink: 0,
                }}
              >
                {i + 1}
              </div>
              <div
                style={{
                  flex: 1,
                  fontFamily: 'Pretendard, sans-serif',
                  fontWeight: 700,
                  fontSize: 40,
                  color: '#f8fafc',
                  lineHeight: 1.4,
                }}
              >
                {step}
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
