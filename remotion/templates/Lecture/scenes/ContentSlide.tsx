import { AbsoluteFill, Img, Video, interpolate, useCurrentFrame, useVideoConfig } from 'remotion';

interface Props {
  heading: string;
  bullets?: string[];
  mediaDataUri?: string;
  mediaType?: 'image' | 'video';
  accentColor?: string;
  slideIndex?: number;
  slideTotal?: number;
}

export const ContentSlide: React.FC<Props> = ({
  heading,
  bullets = [],
  mediaDataUri,
  mediaType = 'image',
  accentColor = '#4f8ef7',
  slideIndex,
  slideTotal,
}) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();

  const headerOpacity = interpolate(frame, [0, 20], [0, 1], { extrapolateRight: 'clamp' });
  const headerY = interpolate(frame, [0, 20], [24, 0], { extrapolateRight: 'clamp' });
  const accentWidth = interpolate(frame, [0, 30], [0, 1], { extrapolateRight: 'clamp' });
  const kenBurns = interpolate(frame, [0, durationInFrames], [1.0, 1.06], { extrapolateRight: 'clamp' });

  const hasSplit = !!mediaDataUri;
  const textWidth = hasSplit ? '52%' : '100%';

  const mediaStyle: React.CSSProperties = {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    transform: `scale(${kenBurns})`,
    transformOrigin: 'center',
  };

  return (
    <AbsoluteFill style={{ background: '#0d0f14', overflow: 'hidden' }}>
      <div style={{ display: 'flex', width: '100%', height: '100%' }}>
        {/* Left: text column */}
        <div
          style={{
            width: textWidth,
            padding: '72px 80px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          {/* Accent line */}
          <div
            style={{
              height: 4,
              width: `${accentWidth * 80}px`,
              background: accentColor,
              borderRadius: 2,
              marginBottom: 36,
            }}
          />

          {/* Heading */}
          <div
            style={{
              opacity: headerOpacity,
              transform: `translateY(${headerY}px)`,
              fontFamily: 'Pretendard, sans-serif',
              fontWeight: 900,
              fontSize: hasSplit ? 56 : 64,
              color: '#ffffff',
              lineHeight: 1.2,
              letterSpacing: '-0.025em',
              marginBottom: 48,
            }}
          >
            {heading}
          </div>

          {/* Divider */}
          <div
            style={{
              height: 1,
              background: 'rgba(255,255,255,0.12)',
              marginBottom: 40,
              opacity: headerOpacity,
            }}
          />

          {/* Bullets */}
          {bullets.map((bullet, i) => {
            const delay = 24 + i * 10;
            const opacity = interpolate(frame, [delay, delay + 16], [0, 1], { extrapolateRight: 'clamp' });
            const y = interpolate(frame, [delay, delay + 16], [18, 0], { extrapolateRight: 'clamp' });

            return (
              <div
                key={i}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 20,
                  marginBottom: 28,
                  opacity,
                  transform: `translateY(${y}px)`,
                }}
              >
                <div
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    background: accentColor,
                    marginTop: 12,
                    flexShrink: 0,
                  }}
                />
                <div
                  style={{
                    fontFamily: 'Pretendard, sans-serif',
                    fontWeight: 500,
                    fontSize: hasSplit ? 34 : 38,
                    color: 'rgba(255,255,255,0.85)',
                    lineHeight: 1.5,
                    letterSpacing: '-0.01em',
                  }}
                >
                  {bullet}
                </div>
              </div>
            );
          })}

          {/* Slide counter */}
          {slideIndex !== undefined && slideTotal !== undefined && (
            <div
              style={{
                position: 'absolute',
                bottom: 48,
                right: hasSplit ? 'auto' : 80,
                left: hasSplit ? 80 : 'auto',
                fontFamily: 'Pretendard, sans-serif',
                fontWeight: 400,
                fontSize: 26,
                color: 'rgba(255,255,255,0.3)',
                letterSpacing: '0.05em',
                opacity: headerOpacity,
              }}
            >
              {slideIndex} / {slideTotal}
            </div>
          )}
        </div>

        {/* Right: image column */}
        {hasSplit && (
          <div
            style={{
              flex: 1,
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            {mediaType === 'video' ? (
              <Video src={mediaDataUri!} style={mediaStyle} muted loop />
            ) : (
              <Img src={mediaDataUri!} style={mediaStyle} />
            )}
            {/* Left fade overlay to blend with text column */}
            <div
              style={{
                position: 'absolute',
                inset: 0,
                background: 'linear-gradient(to right, #0d0f14 0%, transparent 20%)',
              }}
            />
          </div>
        )}
      </div>
    </AbsoluteFill>
  );
};
