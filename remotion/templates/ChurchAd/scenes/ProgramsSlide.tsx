import { AbsoluteFill, interpolate, useCurrentFrame } from 'remotion';
import { Background, ChurchBadge, fontStack, type BaseSlideProps ,
  renderText,
  KineticText,
  heroScale,
} from './_shared';

interface Props extends BaseSlideProps {
  heading: string;
  programs: { title: string; description: string; schedule?: string }[];
  /** 'news-grid' = 이미지 #14 패턴: 2×2 카드 그리드, 항목마다 아이콘 + 제목 + 일시·장소 + "자세히". */
  layout?: 'default' | 'news-grid' | 'list-rows';
}

// Cycle through icons for the news-grid layout — gives each card visual identity.
const NEWS_ICONS = ['📅', '🎁', '❤', '🎓', '📢', '✦', '⛪', '🙏'];

export const ProgramsSlide: React.FC<Props> = ({
  heading,
  programs,
  layout = 'default',
  accentColor = '#d4a657',
  backgroundColor,
  churchName,
  logoDataUri,
  mediaDataUri,
  mediaType,
  slideIndex,
  entryEffect,
  badge,
  motionIntensity,
  bgOverlayOpacity,
  textScale,
  ...rest
}) => {
  const s = heroScale(textScale);
  const frame = useCurrentFrame();
  const cols = programs.length <= 2 ? programs.length : programs.length <= 4 ? 2 : 3;

  if (layout === 'news-grid') {
    // Image #14 — "교회 소식 NEWS" 2x2 grid. Header on left with NEWS tag on
    // right; items rendered as white-ish cards with category icon.
    const items = programs.slice(0, 4);
    return (
      <AbsoluteFill style={{ background: backgroundColor ?? '#0f1c2e' }}>
        <AbsoluteFill style={{ padding: '60px 100px', display: 'flex', flexDirection: 'column' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'baseline',
              justifyContent: 'space-between',
              marginBottom: 32,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 20 }}>
              <KineticText
                text={heading}
                startFrame={4}
                accentColor={accentColor}
                style={{
                  display: 'block',
                  fontFamily: fontStack,
                  fontWeight: 900,
                  fontSize: 110 * s,
                  color: '#fff',
                  letterSpacing: '-0.025em',
                }}
              />
              <div style={{ width: 80, height: 4, background: accentColor, borderRadius: 2 }} />
            </div>
            <div
              style={{
                fontFamily: fontStack,
                fontWeight: 800,
                fontSize: 36 * s,
                color: accentColor,
                letterSpacing: '0.15em',
              }}
            >
              NEWS
            </div>
          </div>

          <div
            style={{
              flex: 1,
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gridTemplateRows: items.length > 2 ? '1fr 1fr' : '1fr',
              gap: 22,
              minHeight: 0,
            }}
          >
            {items.map((p, i) => {
              const delay = 14 + i * 7;
              const op = interpolate(frame, [delay, delay + 22], [0, 1], { extrapolateRight: 'clamp' });
              const y = interpolate(frame, [delay, delay + 22], [16, 0], { extrapolateRight: 'clamp' });
              return (
                <div
                  key={i}
                  style={{
                    opacity: op,
                    transform: `translateY(${y}px)`,
                    background: '#f4f5f8',
                    border: `1px solid ${accentColor}33`,
                    borderRadius: 16,
                    padding: '32px 36px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    boxShadow: '0 8px 24px rgba(0,0,0,0.25)',
                  }}
                >
                  <div>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 18,
                        marginBottom: 16,
                      }}
                    >
                      <div
                        style={{
                          width: 64,
                          height: 64,
                          borderRadius: 14,
                          background: `${accentColor}22`,
                          color: accentColor,
                          fontSize: 34 * s,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        {NEWS_ICONS[i % NEWS_ICONS.length]}
                      </div>
                      <div
                        style={{
                          fontFamily: fontStack,
                          fontWeight: 800,
                          fontSize: 46 * s,
                          color: '#1a2230',
                          letterSpacing: '-0.02em',
                          flex: 1,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {p.title}
                      </div>
                    </div>
                    {p.schedule && (
                      <div
                        style={{
                          fontFamily: fontStack,
                          fontWeight: 700,
                          fontSize: 30 * s,
                          color: accentColor,
                          marginBottom: 6,
                        }}
                      >
                        {p.schedule}
                      </div>
                    )}
                    <div
                      style={{
                        fontFamily: fontStack,
                        fontWeight: 500,
                        fontSize: 28 * s,
                        color: '#3a4252',
                        lineHeight: 1.45,
                      }}
                    >
                      {p.description}
                    </div>
                  </div>
                  <div
                    style={{
                      marginTop: 18,
                      fontFamily: fontStack,
                      fontWeight: 600,
                      fontSize: 22 * s,
                      color: '#7d8696',
                    }}
                  >
                    자세히 보기 →
                  </div>
                </div>
              );
            })}
          </div>

          <div
            style={{
              marginTop: 28,
              textAlign: 'center',
              fontFamily: fontStack,
              fontWeight: 600,
              fontSize: 28 * s,
              color: 'rgba(255,255,255,0.7)',
            }}
          >
            📣 함께 알아가고, 함께 세워가는 우리교회
          </div>
        </AbsoluteFill>
        <ChurchBadge
          churchName={churchName}
          accentColor={accentColor}
          logoDataUri={logoDataUri}
          badge={badge}
        />
      </AbsoluteFill>
    );
  }

  if (layout === 'list-rows') {
    // Image #15 pattern — header on left, 3 rows with icon + title + description.
    return (
      <AbsoluteFill style={{ background: backgroundColor ?? '#0f1c2e' }}>
        <AbsoluteFill style={{ padding: '70px 100px', display: 'flex', flexDirection: 'column', gap: 28 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 20 }}>
            <KineticText
              text={heading}
              startFrame={4}
              accentColor={accentColor}
              style={{
                display: 'block',
                fontFamily: fontStack,
                fontWeight: 900,
                fontSize: 110 * s,
                color: '#fff',
                letterSpacing: '-0.025em',
              }}
            />
            <div style={{ width: 80, height: 4, background: accentColor, borderRadius: 2 }} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18, flex: 1 }}>
            {programs.slice(0, 4).map((p, i) => {
              const delay = 12 + i * 7;
              const op = interpolate(frame, [delay, delay + 22], [0, 1], { extrapolateRight: 'clamp' });
              return (
                <div
                  key={i}
                  style={{
                    opacity: op,
                    background: 'rgba(255,255,255,0.04)',
                    border: `1px solid ${accentColor}33`,
                    borderRadius: 14,
                    padding: '24px 34px',
                    display: 'grid',
                    gridTemplateColumns: `${Math.round(80 * s)}px ${Math.round(360 * s)}px 1fr`,
                    gap: 28,
                    alignItems: 'center',
                  }}
                >
                  <div
                    style={{
                      width: 70,
                      height: 70,
                      borderRadius: 14,
                      background: `${accentColor}22`,
                      color: accentColor,
                      fontSize: 38 * s,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {NEWS_ICONS[i % NEWS_ICONS.length]}
                  </div>
                  <div
                    style={{
                      fontFamily: fontStack,
                      fontWeight: 800,
                      fontSize: 48 * s,
                      color: '#fff',
                      letterSpacing: '-0.02em',
                    }}
                  >
                    {p.title}
                  </div>
                  <div
                    style={{
                      fontFamily: fontStack,
                      fontWeight: 500,
                      fontSize: 34 * s,
                      color: 'rgba(255,255,255,0.8)',
                      lineHeight: 1.45,
                    }}
                  >
                    {p.description}
                    {p.schedule && (
                      <span style={{ color: accentColor, fontWeight: 700, marginLeft: 14 }}>
                        · {p.schedule}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          <div
            style={{
              textAlign: 'center',
              fontFamily: fontStack,
              fontWeight: 500,
              fontSize: 28 * s,
              color: 'rgba(255,255,255,0.55)',
            }}
          >
            더 자세한 내용은 게시판을 확인해주세요
          </div>
        </AbsoluteFill>
        <ChurchBadge
          churchName={churchName}
          accentColor={accentColor}
          logoDataUri={logoDataUri}
          badge={badge}
        />
      </AbsoluteFill>
    );
  }

  return (
    <AbsoluteFill>
      <Background {...rest}
        mediaDataUri={mediaDataUri}
        mediaType={mediaType}
        backgroundColor={backgroundColor}
        accentColor={accentColor}
        overlayOpacity={0.80}
        blur={!!mediaDataUri}
        slideIndex={slideIndex}
        entryEffect={entryEffect}
        slideType="programs"
        scrim="left"
        motionIntensity={motionIntensity}
        bgOverlayOpacity={bgOverlayOpacity}
      />
      <AbsoluteFill style={{ padding: '70px 120px', justifyContent: 'center' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'baseline',
            gap: 24,
            marginBottom: 48,
          }}
        >
          <KineticText
            text={heading}
            startFrame={4}
            accentColor={accentColor}
            style={{
              display: 'block',
              fontFamily: fontStack,
              fontWeight: 900,
              fontSize: 132 * s,
              color: '#fff',
              letterSpacing: '-0.025em',
            }}
          />
          <div style={{ width: 100, height: 4, background: accentColor, borderRadius: 2 }} />
        </div>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${cols}, 1fr)`,
            gap: 28,
          }}
        >
          {programs.map((p, i) => {
            const delay = 12 + i * 8;
            const op = interpolate(frame, [delay, delay + 18], [0, 1], { extrapolateRight: 'clamp' });
            const y = interpolate(frame, [delay, delay + 18], [16, 0], { extrapolateRight: 'clamp' });
            return (
              <div
                key={i}
                style={{
                  opacity: op,
                  transform: `translateY(${y}px)`,
                  background: 'rgba(255,255,255,0.05)',
                  border: `1px solid ${accentColor}40`,
                  borderRadius: 18,
                  padding: '28px 32px',
                }}
              >
                <div
                  style={{
                    fontFamily: fontStack,
                    fontWeight: 700,
                    fontSize: 60 * s,
                    color: '#fff',
                    marginBottom: 12,
                  }}
                >
                  {p.title}
                </div>
                <div
                  style={{
                    fontFamily: fontStack,
                    fontWeight: 400,
                    fontSize: 42 * s,
                    color: 'rgba(255,255,255,0.72)',
                    lineHeight: 1.45,
                    marginBottom: p.schedule ? 14 : 0,
                  }}
                >
                  {p.description}
                </div>
                {p.schedule && (
                  <div
                    style={{
                      fontFamily: fontStack,
                      fontWeight: 600,
                      fontSize: 38 * s,
                      color: accentColor,
                      letterSpacing: '0.01em',
                    }}
                  >
                    {p.schedule}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </AbsoluteFill>
      <ChurchBadge churchName={churchName} accentColor={accentColor} logoDataUri={logoDataUri} badge={badge} />
    </AbsoluteFill>
  );
};
