import { AbsoluteFill, interpolate, useCurrentFrame } from 'remotion';
import { Background, ChurchBadge, fontStack, TextCard, type BaseSlideProps ,
  renderText,
} from './_shared';

interface Props extends BaseSlideProps {
  heading: string;
  phone?: string;
  website?: string;
  socials?: string[];
  layout?: 'center' | 'left' | 'right' | 'photo-card' | 'photo-card-bottom' | 'photo-card-side';
}

export const ContactSlide: React.FC<Props> = ({
  heading,
  phone,
  website,
  socials = [],
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
  const op = interpolate(frame, [4, 26], [0, 1], { extrapolateRight: 'clamp' });
  const items = [
    phone ? { icon: '☎', label: phone } : null,
    website ? { icon: '🌐', label: website } : null,
    ...socials.map((s) => ({ icon: '✦', label: s })),
  ].filter(Boolean) as { icon: string; label: string }[];
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
          slideType="contact"
          photoShowcase
        />
        <TextCard accentColor={accentColor} placement={placement as any} padding={44}>
          <div style={{ opacity: op, display: 'flex', alignItems: 'baseline', gap: 18, marginBottom: 24 }}>
            <div style={{ fontFamily: fontStack, fontWeight: 900, fontSize: 82, color: '#fff', letterSpacing: '-0.025em' }}>
              {renderText(heading)}
            </div>
            <div style={{ width: 80, height: 4, background: accentColor, borderRadius: 2 }} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {items.map((it, i) => {
              const d = 16 + i * 10;
              const o = interpolate(frame, [d, d + 16], [0, 1], { extrapolateRight: 'clamp' });
              return (
                <div key={i} style={{ opacity: o, display: 'flex', alignItems: 'center', gap: 16 }}>
                  <div style={{ fontSize: 38, color: accentColor }}>{it.icon}</div>
                  <div style={{ fontFamily: fontStack, fontWeight: 650, fontSize: 38, color: '#fff' }}>
                    {it.label}
                  </div>
                </div>
              );
            })}
          </div>
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
        overlayOpacity={0.80}
        blur={!!mediaDataUri}
        slideIndex={slideIndex}
        entryEffect={entryEffect}
        slideType="contact"
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
            marginBottom: 56,
          }}
        >
          <div
            style={{
              fontFamily: fontStack,
              fontWeight: 900,
              fontSize: 152,
              color: '#fff',
              letterSpacing: '-0.025em',
            }}
          >
            {renderText(heading)}
          </div>
          <div style={{ width: 100, height: 4, background: accentColor, borderRadius: 2 }} />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 26, maxWidth: 1500 }}>
          {items.map((it, i) => {
            const d = 16 + i * 10;
            const o = interpolate(frame, [d, d + 16], [0, 1], { extrapolateRight: 'clamp' });
            const x = interpolate(frame, [d, d + 16], [-12, 0], { extrapolateRight: 'clamp' });
            return (
              <div
                key={i}
                style={{
                  opacity: o,
                  transform: `translateX(${x}px)`,
                  display: 'flex',
                  alignItems: 'center',
                  flexDirection: alignRight ? 'row-reverse' : 'row',
                  gap: 24,
                  background: 'rgba(255,255,255,0.04)',
                  border: `1px solid ${accentColor}40`,
                  borderRadius: 14,
                  padding: '20px 32px',
                }}
              >
                <div style={{ fontSize: 64, color: accentColor }}>{it.icon}</div>
                <div
                  style={{
                    fontFamily: fontStack,
                    fontWeight: 600,
                    fontSize: 64,
                    color: '#fff',
                  }}
                >
                  {it.label}
                </div>
              </div>
            );
          })}
        </div>
      </AbsoluteFill>
      <ChurchBadge churchName={churchName} accentColor={accentColor} logoDataUri={logoDataUri} badge={badge} />
    </AbsoluteFill>
  );
};
