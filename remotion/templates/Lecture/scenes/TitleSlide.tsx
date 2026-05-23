import { AbsoluteFill, Img, Video, interpolate, useCurrentFrame } from 'remotion';

interface Props {
  title: string;
  subtitle?: string;
  accentColor?: string;
  mediaDataUri?: string;
  mediaType?: 'image' | 'video';
}

export const TitleSlide: React.FC<Props> = ({
  title,
  subtitle,
  accentColor = '#4f8ef7',
  mediaDataUri,
  mediaType = 'image',
}) => {
  const frame = useCurrentFrame();

  const titleOpacity = interpolate(frame, [0, 24], [0, 1], { extrapolateRight: 'clamp' });
  const titleY = interpolate(frame, [0, 24], [36, 0], { extrapolateRight: 'clamp' });
  const subOpacity = interpolate(frame, [18, 40], [0, 1], { extrapolateRight: 'clamp' });
  const subY = interpolate(frame, [18, 40], [20, 0], { extrapolateRight: 'clamp' });
  const imgScale = interpolate(frame, [0, 150], [1.0, 1.05], { extrapolateRight: 'clamp' });

  const mediaStyle: React.CSSProperties = {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    transform: `scale(${imgScale})`,
    transformOrigin: 'center',
    opacity: 0.3,
  };

  return (
    <AbsoluteFill style={{ background: '#0d0f14', overflow: 'hidden' }}>
      {mediaDataUri && mediaType === 'video' ? (
        <Video src={mediaDataUri} style={mediaStyle} muted loop />
      ) : mediaDataUri ? (
        <Img src={mediaDataUri} style={mediaStyle} />
      ) : (
        <AbsoluteFill
          style={{
            background: `radial-gradient(ellipse at 25% 60%, ${accentColor}1a 0%, #0d0f14 65%)`,
          }}
        />
      )}

      {mediaDataUri && <AbsoluteFill style={{ background: 'rgba(13,15,20,0.70)' }} />}

      {/* Left accent bar */}
      <div
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          bottom: 0,
          width: 6,
          background: accentColor,
        }}
      />

      <AbsoluteFill style={{ justifyContent: 'center', padding: '0 96px' }}>
        <div style={{ opacity: titleOpacity, transform: `translateY(${titleY}px)`, marginBottom: 32 }}>
          <div
            style={{
              fontFamily: 'Pretendard, sans-serif',
              fontWeight: 900,
              fontSize: 96,
              color: '#ffffff',
              lineHeight: 1.15,
              letterSpacing: '-0.03em',
            }}
          >
            {title}
          </div>
        </div>

        {subtitle && (
          <div style={{ opacity: subOpacity, transform: `translateY(${subY}px)` }}>
            <div style={{ width: 72, height: 4, background: accentColor, borderRadius: 2, marginBottom: 24 }} />
            <div
              style={{
                fontFamily: 'Pretendard, sans-serif',
                fontWeight: 500,
                fontSize: 44,
                color: 'rgba(255,255,255,0.70)',
                lineHeight: 1.4,
                letterSpacing: '-0.01em',
              }}
            >
              {subtitle}
            </div>
          </div>
        )}
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
