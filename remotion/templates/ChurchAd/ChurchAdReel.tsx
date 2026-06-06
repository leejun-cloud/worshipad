import { AbsoluteFill, Audio, Series } from 'remotion';
import { z } from 'zod';
import { REELS_FPS } from '../../types';
import { useFonts } from '../../fonts';
import { BgmTrack } from '../../components/BgmTrack';
import { CoverSlide } from './scenes/CoverSlide';
import { WelcomeSlide } from './scenes/WelcomeSlide';
import { WorshipTimesSlide } from './scenes/WorshipTimesSlide';
import { ProgramsSlide } from './scenes/ProgramsSlide';
import { PastorSlide } from './scenes/PastorSlide';
import { EventSlide } from './scenes/EventSlide';
import { VerseSlide } from './scenes/VerseSlide';
import { LocationSlide } from './scenes/LocationSlide';
import { ContactSlide } from './scenes/ContactSlide';
import { InvitationSlide } from './scenes/InvitationSlide';
import { MissionSlide } from './scenes/MissionSlide';
import { GallerySlide } from './scenes/GallerySlide';
import { getPreset } from '../../../components/church-ad/style-presets';

export const CHURCH_AD_FPS = REELS_FPS;
export const CHURCH_AD_WIDTH = 1920;
export const CHURCH_AD_HEIGHT = 1080;

const serviceRowSchema = z.object({
  name: z.string(),
  schedule: z.string(),
  place: z.string().optional(),
});

const programCardSchema = z.object({
  title: z.string(),
  description: z.string(),
  schedule: z.string().optional(),
});

const slideSchema = z.object({
  type: z.enum([
    'cover',
    'welcome',
    'worship-times',
    'programs',
    'pastor',
    'event',
    'verse',
    'location',
    'contact',
    'mission',
    'gallery',
    'invitation',
  ]),
  layout: z
    .enum([
      'center',
      'left',
      'right',
      'split-left',
      'split-right',
      'big',
      'photo-card',
      'photo-card-bottom',
      'photo-card-side',
      'photo-card-bottom-left',
      'full-bleed',
      'immersive',
      'news-grid',
      'list-rows',
    ])
    .optional(),
  textScale: z.number().optional(),
  cardScale: z.number().optional(),
  bgOverlayOpacity: z.number().optional(),
  imageScale: z.number().optional(),
  imageX: z.number().optional(),
  imageY: z.number().optional(),
  entryEffect: z
    .enum([
      'none',
      'fade',
      'zoom-in',
      'close-up',
      'slide-top',
      'slide-bottom',
      'slide-left',
      'slide-right',
      'scale-up',
    ])
    .optional(),
  heading: z.string(),
  subheading: z.string().optional(),
  bullets: z.array(z.string()).optional(),
  services: z.array(serviceRowSchema).optional(),
  programs: z.array(programCardSchema).optional(),
  pastorName: z.string().optional(),
  pastorTitle: z.string().optional(),
  pastorMessage: z.string().optional(),
  eventDate: z.string().optional(),
  eventLocation: z.string().optional(),
  verse: z.string().optional(),
  verseRef: z.string().optional(),
  address: z.string().optional(),
  transit: z.string().optional(),
  phone: z.string().optional(),
  website: z.string().optional(),
  socials: z.array(z.string()).optional(),
  cta: z.string().optional(),
  mission: z.string().optional(),
  galleryUrls: z.array(z.string()).optional(),
  mediaDataUri: z.string().optional(),
  mediaType: z.enum(['image', 'video']).optional().default('image'),
  isStock: z.boolean().optional(),
});

const badgeSchema = z.object({
  show: z.boolean().optional().default(true),
  text: z.string().optional(),
  logoUrl: z.string().optional(),
  logoDataUri: z.string().optional(),
  photoUrl: z.string().optional(),
  photoDataUri: z.string().optional(),
  position: z.enum(['top-right', 'top-left', 'bottom-right', 'bottom-left']).optional().default('top-right'),
});

export const churchAdSchema = z.object({
  title: z.string(),
  churchName: z.string(),
  slogan: z.string().optional(),
  accentColor: z.string().optional().default('#d4a657'),
  backgroundColor: z.string().optional().default('#0f1c2e'),
  logoDataUri: z.string().optional(),
  badge: badgeSchema.optional(),
  slides: z.array(slideSchema).min(1).max(20),
  audioUrl: z.string().optional(),
  audioDurationSec: z.number().optional().default(0),
  sceneDurationsSec: z.array(z.number()).optional(),
  bgmUrl: z.string().optional(),
  bgmVolume: z.number().optional().default(0.1),
  bgmTrackDurationSec: z.number().optional(),
  stylePreset: z.enum(['cinematic', 'modern', 'warm', 'classic', 'energetic']).optional(),
  bgOverlayOpacity: z.number().optional(),
});

export type ChurchAdReelProps = z.infer<typeof churchAdSchema>;

export const CHURCH_AD_DEFAULT_DURATION = Math.round(75 * CHURCH_AD_FPS);

export const calculateChurchAdDuration = (
  slideCount: number,
  audioDurationSec?: number,
  sceneDurationsSec?: number[]
): number => {
  // Must match the per-slide minimum applied in ChurchAdReel (1.5s min per slide).
  const MIN_SLIDE_FRAMES = Math.round(CHURCH_AD_FPS * 1.5);
  if (Array.isArray(sceneDurationsSec) && sceneDurationsSec.length > 0) {
    return Math.max(
      sceneDurationsSec.reduce(
        (sum, s) => sum + Math.max(Math.round(s * CHURCH_AD_FPS), MIN_SLIDE_FRAMES),
        0
      ),
      CHURCH_AD_FPS
    );
  }
  if (typeof audioDurationSec === 'number' && audioDurationSec > 0) {
    return Math.round(audioDurationSec * CHURCH_AD_FPS) + CHURCH_AD_FPS;
  }
  return Math.round(slideCount * 8 * CHURCH_AD_FPS);
};

export const ChurchAdReel: React.FC<ChurchAdReelProps> = (props) => {
  const {
    accentColor = '#d4a657',
    backgroundColor = '#0f1c2e',
    churchName,
    logoDataUri,
    badge,
    slides,
    audioUrl,
    audioDurationSec = 0,
    sceneDurationsSec,
    bgmUrl,
    bgmVolume = 0.1,
    bgmTrackDurationSec,
    stylePreset,
    bgOverlayOpacity,
  } = props;

  useFonts();

  const presetDef = stylePreset ? getPreset(stylePreset) : null;
  const defaultEntry = presetDef?.defaultEntry;
  const motionIntensity = presetDef?.motionIntensity ?? 1.0;

  const totalScenes = slides.length;
  let durations: number[];
  if (Array.isArray(sceneDurationsSec) && sceneDurationsSec.length === totalScenes) {
    durations = sceneDurationsSec.map((s) =>
      Math.max(Math.round(s * CHURCH_AD_FPS), Math.round(CHURCH_AD_FPS * 1.5))
    );
  } else {
    const evenSec = audioDurationSec > 0 ? audioDurationSec / totalScenes : 8;
    durations = Array(totalScenes).fill(Math.round(evenSec * CHURCH_AD_FPS));
  }
  const totalFrames = durations.reduce((a, b) => a + b, 0);

  return (
    <AbsoluteFill style={{ backgroundColor }}>
      {bgmUrl && (
        <BgmTrack
          src={bgmUrl}
          totalDurationInFrames={totalFrames}
          volume={bgmVolume ?? 0.1}
          trackDurationSec={bgmTrackDurationSec ?? 30}
          // Duck BGM while narration plays so the voice stays present without
          // having to crank narration volume past clipping.
          duckRange={
            audioUrl && audioDurationSec > 0
              ? { startFrame: 0, endFrame: Math.round(audioDurationSec * CHURCH_AD_FPS) }
              : undefined
          }
        />
      )}
      {audioUrl && <Audio src={audioUrl} volume={1.0} />}
      <Series>
        {slides.map((slide, i) => {
          const isStock = !!slide.isStock;
          let resolvedMediaDataUri = slide.mediaDataUri;
          if (resolvedMediaDataUri && isStock && !resolvedMediaDataUri.includes('#stock')) {
            resolvedMediaDataUri = resolvedMediaDataUri + '#stock';
          }
          const common = {
            accentColor,
            backgroundColor,
            churchName,
            logoDataUri,
            badge,
            mediaDataUri: resolvedMediaDataUri,
            mediaType: (slide.mediaType ?? 'image') as 'image' | 'video',
            slideIndex: i,
            textScale: slide.textScale,
            cardScale: slide.cardScale,
            imageScale: slide.imageScale,
            imageX: slide.imageX,
            imageY: slide.imageY,
            entryEffect: slide.entryEffect ?? defaultEntry,
            isStock,
            motionIntensity,
            bgOverlayOpacity: slide.bgOverlayOpacity ?? bgOverlayOpacity,
          };
          return (
            <Series.Sequence key={i} durationInFrames={durations[i]}>
              {slide.type === 'cover' && (
                <CoverSlide
                  {...common}
                  title={slide.heading}
                  subtitle={slide.subheading}
                  layout={slide.layout as any}
                />
              )}
              {slide.type === 'welcome' && (
                <WelcomeSlide
                  {...common}
                  heading={slide.heading}
                  message={slide.subheading}
                  bullets={slide.bullets}
                  layout={slide.layout as any}
                />
              )}
              {slide.type === 'worship-times' && (
                <WorshipTimesSlide
                  {...common}
                  heading={slide.heading}
                  services={slide.services ?? []}
                  layout={slide.layout as any}
                />
              )}
              {slide.type === 'programs' && (
                <ProgramsSlide
                  {...common}
                  heading={slide.heading}
                  programs={slide.programs ?? []}
                  layout={slide.layout as any}
                />
              )}
              {slide.type === 'pastor' && (
                <PastorSlide
                  {...common}
                  heading={slide.heading}
                  pastorName={slide.pastorName}
                  pastorTitle={slide.pastorTitle}
                  pastorMessage={slide.pastorMessage}
                />
              )}
              {slide.type === 'event' && (
                <EventSlide
                  {...common}
                  heading={slide.heading}
                  subheading={slide.subheading}
                  date={slide.eventDate}
                  location={slide.eventLocation}
                  bullets={slide.bullets}
                  layout={slide.layout as any}
                />
              )}
              {slide.type === 'verse' && (
                <VerseSlide
                  {...common}
                  heading={slide.heading}
                  verse={slide.verse ?? slide.heading}
                  verseRef={slide.verseRef}
                  layout={slide.layout as any}
                />
              )}
              {slide.type === 'location' && (
                <LocationSlide
                  {...common}
                  heading={slide.heading}
                  address={slide.address}
                  transit={slide.transit}
                  layout={slide.layout as any}
                />
              )}
              {slide.type === 'contact' && (
                <ContactSlide
                  {...common}
                  heading={slide.heading}
                  phone={slide.phone}
                  website={slide.website}
                  socials={slide.socials}
                  layout={slide.layout as any}
                />
              )}
              {slide.type === 'mission' && (
                <MissionSlide
                  {...common}
                  heading={slide.heading}
                  mission={slide.mission ?? slide.heading}
                  verseRef={slide.verseRef}
                  layout={(slide.layout as any) ?? 'big'}
                />
              )}
              {slide.type === 'gallery' && (
                <GallerySlide
                  {...common}
                  heading={slide.heading}
                  galleryUrls={slide.galleryUrls ?? []}
                  caption={slide.subheading}
                />
              )}
              {slide.type === 'invitation' && (
                <InvitationSlide
                  {...common}
                  heading={slide.heading}
                  cta={slide.cta}
                  subheading={slide.subheading}
                  layout={slide.layout as any}
                />
              )}
            </Series.Sequence>
          );
        })}
      </Series>
    </AbsoluteFill>
  );
};
