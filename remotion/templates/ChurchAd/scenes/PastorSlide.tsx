import { AbsoluteFill, Img, Video, interpolate, useCurrentFrame } from 'remotion';
import { ChurchBadge, fontStack, type BaseSlideProps ,
  renderText,
} from './_shared';

interface Props extends BaseSlideProps {
  heading: string;
  pastorName?: string;
  pastorTitle?: string;
  pastorMessage?: string;
}

export const PastorSlide: React.FC<Props> = ({
  heading,
  pastorName,
  pastorTitle = '담임목사',
  pastorMessage,
  accentColor = '#d4a657',
  backgroundColor = '#0f1c2e',
  churchName,
  logoDataUri,
  badge,
  mediaDataUri,
  mediaType = 'image',
}) => {
  const frame = useCurrentFrame();
  const op = interpolate(frame, [4, 26], [0, 1], { extrapolateRight: 'clamp' });
  const scale = interpolate(frame, [0, 220], [1.0, 1.06], { extrapolateRight: 'clamp' });

  return (
    <AbsoluteFill style={{ background: backgroundColor }}>
      <div style={{ display: 'flex', width: '100%', height: '100%' }}>
        <div style={{ width: '50%', position: 'relative', overflow: 'hidden' }}>
          {mediaDataUri && mediaType === 'video' ? (
            <Video
              src={mediaDataUri}
              muted
              loop
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                transform: `scale(${scale})`,
              }}
            />
          ) : mediaDataUri ? (
            <Img
              src={mediaDataUri}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                transform: `scale(${scale})`,
              }}
            />
          ) : (
            <div
              style={{
                width: '100%',
                height: '100%',
                background: `linear-gradient(135deg, ${accentColor}33, ${backgroundColor})`,
              }}
            />
          )}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: `linear-gradient(to right, transparent 60%, ${backgroundColor} 100%)`,
            }}
          />
        </div>
        <div
          style={{
            width: '50%',
            padding: '0 80px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            opacity: op,
          }}
        >
          <div
            style={{
              fontFamily: fontStack,
              fontWeight: 700,
              fontSize: 48,
              color: accentColor,
              letterSpacing: '0.04em',
              marginBottom: 18,
            }}
          >
            {renderText(heading)}
          </div>
          {pastorName && (
            <div
              style={{
                fontFamily: fontStack,
                fontWeight: 900,
                fontSize: 144,
                color: '#fff',
                lineHeight: 1.05,
                letterSpacing: '-0.025em',
                marginBottom: 8,
              }}
            >
              {pastorName}
            </div>
          )}
          {pastorTitle && (
            <div
              style={{
                fontFamily: fontStack,
                fontWeight: 400,
                fontSize: 52,
                color: 'rgba(255,255,255,0.6)',
                marginBottom: 32,
              }}
            >
              {pastorTitle}
            </div>
          )}
          <div style={{ width: 80, height: 3, background: accentColor, borderRadius: 2, marginBottom: 28 }} />
          {pastorMessage && (
            <div
              style={{
                fontFamily: fontStack,
                fontWeight: 400,
                fontSize: 52,
                color: 'rgba(255,255,255,0.82)',
                lineHeight: 1.5,
                fontStyle: 'italic',
              }}
            >
              "{pastorMessage}"
            </div>
          )}
        </div>
      </div>
      <ChurchBadge churchName={churchName} accentColor={accentColor} logoDataUri={logoDataUri} badge={badge} />
    </AbsoluteFill>
  );
};
