import { AbsoluteFill, interpolate, useCurrentFrame, spring, useVideoConfig } from 'remotion';

interface Props {
  index: number;
  total: number;
  title: string;
  description: string;
  benefit?: string;
  bgGradient?: string;
}

const ACCENT_COLORS = [
  { bg: '#dc2626', text: '#fee2e2' },
  { bg: '#ea580c', text: '#ffedd5' },
  { bg: '#ca8a04', text: '#fef9c3' },
  { bg: '#16a34a', text: '#dcfce7' },
  { bg: '#0891b2', text: '#cffafe' },
  { bg: '#7c3aed', text: '#ede9fe' },
  { bg: '#db2777', text: '#fce7f3' },
];

export const ItemScene: React.FC<Props> = ({ index, total, title, description, benefit, bgGradient }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const accent = ACCENT_COLORS[index % ACCENT_COLORS.length];
  const number = String(index + 1).padStart(2, '0');

  const numberSpring = spring({ frame, fps, config: { damping: 12, stiffness: 140, mass: 0.6 } });
  const numberScale = interpolate(numberSpring, [0, 1], [0.3, 1]);

  const titleOpacity = interpolate(frame, [10, 30], [0, 1], { extrapolateRight: 'clamp' });
  const titleY = interpolate(frame, [10, 30], [30, 0], { extrapolateRight: 'clamp' });

  const descOpacity = interpolate(frame, [25, 50], [0, 1], { extrapolateRight: 'clamp' });
  const descY = interpolate(frame, [25, 50], [20, 0], { extrapolateRight: 'clamp' });

  const benefitSpring = spring({ frame: frame - 50, fps, config: { damping: 12, stiffness: 140 } });
  const benefitScale = interpolate(benefitSpring, [0, 1], [0, 1]);

  const progress = (index + 1) / total;

  return (
    <AbsoluteFill
      style={{
        background: bgGradient ?? `linear-gradient(160deg, ${accent.bg} 0%, #0f172a 100%)`,
        padding: '120px 90px',
        flexDirection: 'column',
        justifyContent: 'center',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'baseline',
          gap: 28,
          marginBottom: 60,
        }}
      >
        <div
          style={{
            fontFamily: 'Pretendard, sans-serif',
            fontWeight: 900,
            fontSize: 220,
            color: accent.text,
            lineHeight: 1,
            letterSpacing: '-0.05em',
            transform: `scale(${numberScale})`,
            transformOrigin: 'left bottom',
            textShadow: '0 8px 32px rgba(0,0,0,0.3)',
          }}
        >
          {number}
        </div>
        <div
          style={{
            fontFamily: 'Pretendard, sans-serif',
            fontWeight: 700,
            fontSize: 36,
            color: 'rgba(255,255,255,0.7)',
            letterSpacing: '0.05em',
          }}
        >
          / {String(total).padStart(2, '0')}
        </div>
      </div>

      <div
        style={{
          fontFamily: 'Pretendard, sans-serif',
          fontWeight: 900,
          fontSize: 68,
          color: 'white',
          lineHeight: 1.3,
          letterSpacing: '-0.02em',
          opacity: titleOpacity,
          transform: `translateY(${titleY}px)`,
          marginBottom: 40,
          textShadow: '0 4px 16px rgba(0,0,0,0.3)',
        }}
      >
        {title}
      </div>

      <div
        style={{
          fontFamily: 'Pretendard, sans-serif',
          fontWeight: 400,
          fontSize: 40,
          color: '#e2e8f0',
          lineHeight: 1.55,
          letterSpacing: '-0.01em',
          opacity: descOpacity,
          transform: `translateY(${descY}px)`,
          marginBottom: benefit ? 50 : 0,
        }}
      >
        {description}
      </div>

      {benefit && (
        <div
          style={{
            display: 'inline-flex',
            alignSelf: 'flex-start',
            backgroundColor: 'rgba(255,255,255,0.15)',
            padding: '18px 32px',
            borderRadius: 16,
            border: `2px solid ${accent.text}`,
            fontFamily: 'Pretendard, sans-serif',
            fontWeight: 700,
            fontSize: 32,
            color: accent.text,
            transform: `scale(${benefitScale})`,
            backdropFilter: 'blur(8px)',
          }}
        >
          ✨ {benefit}
        </div>
      )}

      {/* Progress bar */}
      <div
        style={{
          position: 'absolute',
          bottom: 60,
          left: 90,
          right: 90,
          height: 8,
          backgroundColor: 'rgba(255,255,255,0.2)',
          borderRadius: 4,
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            width: `${progress * 100}%`,
            height: '100%',
            backgroundColor: accent.text,
            borderRadius: 4,
            transition: 'width 0.5s',
          }}
        />
      </div>
      <div
        style={{
          position: 'absolute',
          bottom: 90,
          right: 90,
          fontFamily: 'Pretendard, sans-serif',
          fontWeight: 700,
          fontSize: 28,
          color: 'rgba(255,255,255,0.8)',
        }}
      >
        {index + 1} / {total}
      </div>
    </AbsoluteFill>
  );
};
