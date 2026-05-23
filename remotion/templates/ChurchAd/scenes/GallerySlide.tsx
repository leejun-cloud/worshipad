import { AbsoluteFill, Img, interpolate, useCurrentFrame } from 'remotion';
import { ChurchBadge, fontStack, heavyTextShadow, type BaseSlideProps ,
  renderText,
} from './_shared';

interface Props extends BaseSlideProps {
  heading: string;
  galleryUrls: string[];   // 3-6 image URLs
  caption?: string;
}

// Gallery slide — grid of 3-6 photos with a heading. Used when the storyboard
// flow has more uploaded images than slots in regular slides.
export const GallerySlide: React.FC<Props> = ({
  heading,
  galleryUrls,
  caption,
  accentColor = '#d4a657',
  backgroundColor = '#0f1c2e',
  churchName,
  logoDataUri,
  badge,
  slideIndex,
}) => {
  const frame = useCurrentFrame();
  const headOp = interpolate(frame, [4, 24], [0, 1], { extrapolateRight: 'clamp' });

  const items = galleryUrls.slice(0, 6);
  const cols = items.length <= 2 ? items.length : items.length === 3 ? 3 : items.length === 4 ? 2 : 3;

  return (
    <AbsoluteFill style={{ background: backgroundColor }}>
      <AbsoluteFill style={{ padding: '60px 100px', display: 'flex', flexDirection: 'column' }}>
        <div
          style={{
            opacity: headOp,
            display: 'flex',
            alignItems: 'baseline',
            gap: 28,
            marginBottom: 36,
          }}
        >
          <div
            style={{
              fontFamily: fontStack,
              fontWeight: 900,
              fontSize: 110,
              color: '#fff',
              letterSpacing: '-0.025em',
              textShadow: heavyTextShadow,
            }}
          >
            {renderText(heading)}
          </div>
          <div style={{ width: 120, height: 5, background: accentColor, borderRadius: 3 }} />
        </div>

        <div
          style={{
            flex: 1,
            display: 'grid',
            gridTemplateColumns: `repeat(${cols}, 1fr)`,
            gap: 18,
            minHeight: 0,
          }}
        >
          {items.map((url, i) => {
            const delay = 12 + i * 6;
            const op = interpolate(frame, [delay, delay + 22], [0, 1], { extrapolateRight: 'clamp' });
            const scale = interpolate(frame, [delay, delay + 22], [0.96, 1], { extrapolateRight: 'clamp' });
            const kenScale = interpolate(frame, [0, 240], [1.0, 1.04], { extrapolateRight: 'clamp' });
            return (
              <div
                key={url + i}
                style={{
                  position: 'relative',
                  borderRadius: 12,
                  overflow: 'hidden',
                  background: `${accentColor}11`,
                  border: `1px solid ${accentColor}55`,
                  opacity: op,
                  transform: `scale(${scale})`,
                }}
              >
                <Img
                  src={url}
                  onError={() => {
                    /* swallow */
                  }}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    transform: `scale(${kenScale})`,
                    transformOrigin: 'center',
                  }}
                />
              </div>
            );
          })}
        </div>

        {caption && (
          <div
            style={{
              marginTop: 24,
              fontFamily: fontStack,
              fontWeight: 500,
              fontSize: 36,
              color: 'rgba(255,255,255,0.78)',
              textShadow: heavyTextShadow,
            }}
          >
            {caption}
          </div>
        )}
      </AbsoluteFill>
      <ChurchBadge
        churchName={churchName}
        accentColor={accentColor}
        logoDataUri={logoDataUri}
        badge={badge}
      />
    </AbsoluteFill>
  );
};
