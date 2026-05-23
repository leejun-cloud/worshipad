import { AbsoluteFill, interpolate, useCurrentFrame } from 'remotion';
import { Background, ChurchBadge, fontStack, TextCard, type BaseSlideProps ,
  renderText,
} from './_shared';

interface Props extends BaseSlideProps {
  heading: string;
  address?: string;
  transit?: string;
  layout?: 'center' | 'left' | 'right' | 'photo-card' | 'photo-card-bottom' | 'photo-card-side';
}

export const LocationSlide: React.FC<Props> = ({
  heading,
  address,
  transit,
  layout = 'left',
  accentColor = '#d4a657',
  backgroundColor,
  churchName,
  logoDataUri,
  mediaDataUri,
  mediaType,
  slideIndex,
  entryEffect,
  badge,
}) => {
  const frame = useCurrentFrame();
  const op = interpolate(frame, [4, 28], [0, 1], { extrapolateRight: 'clamp' });
  const addrOp = interpolate(frame, [18, 44], [0, 1], { extrapolateRight: 'clamp' });
  const transOp = interpolate(frame, [34, 60], [0, 1], { extrapolateRight: 'clamp' });
  const alignRight = layout === 'right' || layout === 'photo-card-side';

  if (
    mediaDataUri &&
    (layout === 'photo-card' || layout === 'photo-card-bottom' || layout === 'photo-card-side')
  ) {
    const placement = layout === 'photo-card-side' ? 'side-right' : layout === 'photo-card' ? 'center' : 'bottom';
    return (
      <AbsoluteFill>
        <Background
          mediaDataUri={mediaDataUri}
          mediaType={mediaType}
          backgroundColor={backgroundColor}
          accentColor={accentColor}
          slideIndex={slideIndex}
          entryEffect={entryEffect}
          slideType="location"
          photoShowcase
        />
        <TextCard accentColor={accentColor} placement={placement as any} padding={44}>
          <div style={{ opacity: op, display: 'flex', alignItems: 'baseline', gap: 18, marginBottom: 24 }}>
            <div style={{ fontFamily: fontStack, fontWeight: 900, fontSize: 82, color: '#fff', letterSpacing: '-0.025em' }}>
              {renderText(heading)}
            </div>
            <div style={{ width: 80, height: 4, background: accentColor, borderRadius: 2 }} />
          </div>
          {address && (
            <div style={{ opacity: addrOp, fontFamily: fontStack, fontWeight: 700, fontSize: 44, color: '#fff', lineHeight: 1.35, marginBottom: transit ? 18 : 0 }}>
              <span style={{ color: accentColor }}>📍 </span>{address}
            </div>
          )}
          {transit && (
            <div style={{ opacity: transOp, fontFamily: fontStack, fontWeight: 500, fontSize: 36, color: 'rgba(255,255,255,0.82)', lineHeight: 1.45 }}>
              <span style={{ color: accentColor }}>🚇 </span>{transit}
            </div>
          )}
        </TextCard>
        <ChurchBadge churchName={churchName} accentColor={accentColor} logoDataUri={logoDataUri} badge={badge} />
      </AbsoluteFill>
    );
  }

  return (
    <AbsoluteFill>
      <Background
        mediaDataUri={mediaDataUri}
        mediaType={mediaType}
        backgroundColor={backgroundColor}
        accentColor={accentColor}
        overlayOpacity={0.78}
        slideIndex={slideIndex}
        entryEffect={entryEffect}
        slideType="location"
        scrim={alignRight ? 'right' : 'left'}
      />
      <AbsoluteFill
        style={{
          padding: '0 120px',
          justifyContent: 'center',
          alignItems: alignRight ? 'flex-end' : 'flex-start',
          textAlign: alignRight ? 'right' : 'left',
        }}
      >
        <div
          style={{
            opacity: op,
              display: 'flex',
              alignItems: 'baseline',
              flexDirection: alignRight ? 'row-reverse' : 'row',
              gap: 24,
            marginBottom: 60,
          }}
        >
          <div
            style={{
              fontFamily: fontStack,
              fontWeight: 900,
              fontSize: 168,
              color: '#fff',
              letterSpacing: '-0.025em',
            }}
          >
            {renderText(heading)}
          </div>
          <div style={{ width: 100, height: 4, background: accentColor, borderRadius: 2 }} />
        </div>
        {address && (
          <div
            style={{
              opacity: addrOp,
              display: 'flex',
              alignItems: 'flex-start',
              flexDirection: alignRight ? 'row-reverse' : 'row',
              gap: 20,
              marginBottom: 32,
              maxWidth: 1500,
            }}
          >
            <div
              style={{
                fontSize: 70,
                color: accentColor,
                marginTop: 4,
              }}
            >
              📍
            </div>
            <div
              style={{
                fontFamily: fontStack,
                fontWeight: 700,
                fontSize: 80,
                color: '#fff',
                lineHeight: 1.4,
              }}
            >
              {address}
            </div>
          </div>
        )}
        {transit && (
          <div
            style={{
              opacity: transOp,
              display: 'flex',
              alignItems: 'flex-start',
              flexDirection: alignRight ? 'row-reverse' : 'row',
              gap: 20,
              maxWidth: 1500,
            }}
          >
            <div
              style={{
                fontSize: 60,
                color: accentColor,
                marginTop: 4,
              }}
            >
              🚇
            </div>
            <div
              style={{
                fontFamily: fontStack,
                fontWeight: 400,
                fontSize: 60,
                color: 'rgba(255,255,255,0.78)',
                lineHeight: 1.5,
              }}
            >
              {transit}
            </div>
          </div>
        )}
      </AbsoluteFill>
      <ChurchBadge churchName={churchName} accentColor={accentColor} logoDataUri={logoDataUri} badge={badge} />
    </AbsoluteFill>
  );
};
