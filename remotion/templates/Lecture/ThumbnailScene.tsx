import { AbsoluteFill, Img, Video } from 'remotion';
import { z } from 'zod';

export const thumbnailSchema = z.object({
  title: z.string(),
  subtitle: z.string().optional(),
  accentColor: z.string().optional().default('#4f8ef7'),
  mediaDataUri: z.string().optional(),
  mediaType: z.enum(['image', 'video']).optional().default('image'),
});

export type ThumbnailProps = z.infer<typeof thumbnailSchema>;

export const ThumbnailScene: React.FC<ThumbnailProps> = ({
  title,
  subtitle,
  accentColor = '#4f8ef7',
  mediaDataUri,
  mediaType = 'image',
}) => {
  const mediaStyle: React.CSSProperties = {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    opacity: 0.4,
  };

  // Split title for emphasis: last 2 words get accent color
  const words = title.split(' ');
  const emphasisCount = Math.min(2, Math.floor(words.length / 2));
  const normalPart = words.slice(0, words.length - emphasisCount).join(' ');
  const accentPart = words.slice(words.length - emphasisCount).join(' ');

  return (
    <AbsoluteFill style={{ background: '#0d0f14', overflow: 'hidden' }}>
      {/* Background media */}
      {mediaDataUri && mediaType === 'video' ? (
        <Video src={mediaDataUri} style={mediaStyle} muted loop />
      ) : mediaDataUri ? (
        <Img src={mediaDataUri} style={mediaStyle} />
      ) : (
        <AbsoluteFill
          style={{
            background: `linear-gradient(135deg, #0d0f14 0%, ${accentColor}22 50%, #0d0f14 100%)`,
          }}
        />
      )}

      {/* Left accent column */}
      <div
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          bottom: 0,
          width: 8,
          background: accentColor,
        }}
      />

      {/* Overlay gradient */}
      <AbsoluteFill
        style={{
          background:
            'linear-gradient(to right, rgba(13,15,20,0.95) 0%, rgba(13,15,20,0.75) 60%, rgba(13,15,20,0.4) 100%)',
        }}
      />

      {/* Content */}
      <AbsoluteFill style={{ padding: '64px 80px', justifyContent: 'center' }}>
        {/* Main title */}
        <div
          style={{
            fontFamily: 'Pretendard, sans-serif',
            fontWeight: 900,
            fontSize: 88,
            lineHeight: 1.15,
            letterSpacing: '-0.03em',
            maxWidth: 860,
          }}
        >
          {normalPart && (
            <span style={{ color: '#ffffff' }}>{normalPart} </span>
          )}
          {accentPart && (
            <span style={{ color: accentColor }}>{accentPart}</span>
          )}
        </div>

        {/* Subtitle */}
        {subtitle && (
          <div
            style={{
              marginTop: 28,
              fontFamily: 'Pretendard, sans-serif',
              fontWeight: 500,
              fontSize: 38,
              color: 'rgba(255,255,255,0.68)',
              lineHeight: 1.4,
              letterSpacing: '-0.01em',
              maxWidth: 760,
            }}
          >
            {subtitle}
          </div>
        )}

        {/* Bottom accent bar */}
        <div
          style={{
            position: 'absolute',
            bottom: 56,
            left: 80,
            right: 80,
            height: 2,
            background: `linear-gradient(to right, ${accentColor}, transparent)`,
          }}
        />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
