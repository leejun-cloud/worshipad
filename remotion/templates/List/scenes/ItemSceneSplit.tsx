import { AbsoluteFill, interpolate, useCurrentFrame, spring, useVideoConfig } from 'remotion';

interface Props {
  index: number;
  total: number;
  title: string;
  leftLabel: string;
  leftBody: string;
  rightLabel: string;
  rightBody: string;
  bgGradient?: string;
}

export const ItemSceneSplit: React.FC<Props> = ({ index, total, title, leftLabel, leftBody, rightLabel, rightBody, bgGradient }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleOpacity = interpolate(frame, [0, 20], [0, 1], { extrapolateRight: 'clamp' });

  const leftSpring = spring({ frame: frame - 15, fps, config: { damping: 12, stiffness: 130 } });
  const leftX = interpolate(leftSpring, [0, 1], [-100, 0]);
  const leftOpacity = interpolate(leftSpring, [0, 1], [0, 1]);

  const rightSpring = spring({ frame: frame - 30, fps, config: { damping: 12, stiffness: 130 } });
  const rightX = interpolate(rightSpring, [0, 1], [100, 0]);
  const rightOpacity = interpolate(rightSpring, [0, 1], [0, 1]);

  const vsOpacity = interpolate(frame, [40, 60], [0, 1], { extrapolateRight: 'clamp' });

  return (
    <AbsoluteFill
      style={{
        background: bgGradient ?? 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
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
          padding: '0 40px',
        }}
      >
        {title}
      </div>

      <div
        style={{
          display: 'flex',
          gap: 24,
          alignItems: 'stretch',
          flex: 1,
          maxHeight: 1000,
        }}
      >
        {/* Left side */}
        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            backgroundColor: 'rgba(239,68,68,0.15)',
            border: '3px solid #ef4444',
            borderRadius: 32,
            padding: 60,
            opacity: leftOpacity,
            transform: `translateX(${leftX}px)`,
          }}
        >
          <div
            style={{
              fontFamily: 'Pretendard, sans-serif',
              fontWeight: 900,
              fontSize: 64,
              color: '#ef4444',
              marginBottom: 40,
              letterSpacing: '-0.02em',
            }}
          >
            {leftLabel}
          </div>
          <div
            style={{
              fontFamily: 'Pretendard, sans-serif',
              fontWeight: 400,
              fontSize: 36,
              color: '#fef2f2',
              lineHeight: 1.5,
            }}
          >
            {leftBody}
          </div>
        </div>

        {/* VS divider */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            opacity: vsOpacity,
          }}
        >
          <div
            style={{
              width: 80,
              height: 80,
              borderRadius: '50%',
              backgroundColor: '#fbbf24',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontFamily: 'Pretendard, sans-serif',
              fontWeight: 900,
              fontSize: 32,
              color: '#0f172a',
            }}
          >
            VS
          </div>
        </div>

        {/* Right side */}
        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            backgroundColor: 'rgba(34,197,94,0.15)',
            border: '3px solid #22c55e',
            borderRadius: 32,
            padding: 60,
            opacity: rightOpacity,
            transform: `translateX(${rightX}px)`,
          }}
        >
          <div
            style={{
              fontFamily: 'Pretendard, sans-serif',
              fontWeight: 900,
              fontSize: 64,
              color: '#22c55e',
              marginBottom: 40,
              letterSpacing: '-0.02em',
            }}
          >
            {rightLabel}
          </div>
          <div
            style={{
              fontFamily: 'Pretendard, sans-serif',
              fontWeight: 400,
              fontSize: 36,
              color: '#f0fdf4',
              lineHeight: 1.5,
            }}
          >
            {rightBody}
          </div>
        </div>
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
