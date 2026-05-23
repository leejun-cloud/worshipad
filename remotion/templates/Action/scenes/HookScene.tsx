import { AbsoluteFill, interpolate, useCurrentFrame, spring, useVideoConfig } from 'remotion';

interface Props {
  problem: string;
}

export const HookScene: React.FC<Props> = ({ problem }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const chars = Array.from(problem);
  const charsPerFrame = 0.8;
  const visibleChars = Math.min(chars.length, Math.floor(frame * charsPerFrame));

  const cursorVisible = Math.floor(frame / 15) % 2 === 0;

  const shake = spring({ frame: frame - 10, fps, config: { damping: 8, mass: 0.3 } });
  const shakeX = interpolate(shake, [0, 1], [0, 0]);

  const bgPulse = interpolate(
    frame % 30,
    [0, 15, 30],
    [1, 1.02, 1],
    { extrapolateRight: 'clamp' }
  );

  return (
    <AbsoluteFill
      style={{
        background: 'linear-gradient(135deg, #dc2626 0%, #ea580c 100%)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '80px',
        transform: `scale(${bgPulse}) translateX(${shakeX}px)`,
      }}
    >
      <div
        style={{
          fontFamily: 'Pretendard, sans-serif',
          fontWeight: 900,
          fontSize: 96,
          color: 'white',
          textAlign: 'center',
          lineHeight: 1.3,
          letterSpacing: '-0.02em',
          textShadow: '0 4px 24px rgba(0,0,0,0.3)',
        }}
      >
        {chars.slice(0, visibleChars).join('')}
        <span
          style={{
            opacity: cursorVisible ? 1 : 0,
            marginLeft: 8,
            borderRight: '6px solid white',
          }}
        >
          &nbsp;
        </span>
      </div>
    </AbsoluteFill>
  );
};
