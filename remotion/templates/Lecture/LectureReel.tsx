import { AbsoluteFill, Audio, Series } from 'remotion';
import { z } from 'zod';
import { REELS_FPS } from '../../types';
import { useFonts } from '../../fonts';
import { BgmTrack } from '../../components/BgmTrack';
import { TitleSlide } from './scenes/TitleSlide';
import { AgendaSlide } from './scenes/AgendaSlide';
import { ContentSlide } from './scenes/ContentSlide';
import { QuoteSlide } from './scenes/QuoteSlide';
import { SummarySlide } from './scenes/SummarySlide';

export const LECTURE_FPS = REELS_FPS;
export const LECTURE_WIDTH = 1920;
export const LECTURE_HEIGHT = 1080;

const lectureSlideSchema = z.object({
  type: z.enum(['title', 'agenda', 'content', 'quote', 'summary']),
  heading: z.string(),
  subheading: z.string().optional(),
  bullets: z.array(z.string()).optional(),
  quote: z.string().optional(),
  attribution: z.string().optional(),
  cta: z.string().optional(),
  mediaDataUri: z.string().optional(),
  mediaType: z.enum(['image', 'video']).optional().default('image'),
});

export const lectureSchema = z.object({
  title: z.string(),
  accentColor: z.string().optional().default('#4f8ef7'),
  slides: z.array(lectureSlideSchema).min(2).max(20),
  audioUrl: z.string().optional(),
  audioDurationSec: z.number().optional().default(0),
  sceneDurationsSec: z.array(z.number()).optional(),
  bgmUrl: z.string().optional(),
  bgmVolume: z.number().optional().default(0.08),
  bgmTrackDurationSec: z.number().optional(),
});

export type LectureReelProps = z.infer<typeof lectureSchema>;

export const LECTURE_DEFAULT_DURATION = Math.round(60 * LECTURE_FPS);

export const calculateLectureDuration = (
  slideCount: number,
  audioDurationSec?: number,
  sceneDurationsSec?: number[]
): number => {
  if (typeof audioDurationSec === 'number' && audioDurationSec > 0) {
    return Math.max(Math.round(audioDurationSec * LECTURE_FPS) + LECTURE_FPS, 90);
  }
  if (Array.isArray(sceneDurationsSec) && sceneDurationsSec.length > 0) {
    return Math.round(sceneDurationsSec.reduce((a, b) => a + b, 0) * LECTURE_FPS);
  }
  // Default: 15 seconds per slide
  return Math.round(slideCount * 15 * LECTURE_FPS);
};

export const LectureReel: React.FC<LectureReelProps> = (props) => {
  const {
    accentColor = '#4f8ef7',
    slides,
    audioUrl,
    audioDurationSec = 0,
    sceneDurationsSec,
    bgmUrl,
    bgmVolume = 0.08,
    bgmTrackDurationSec,
  } = props;

  useFonts();

  const totalScenes = slides.length;

  let durations: number[];
  if (Array.isArray(sceneDurationsSec) && sceneDurationsSec.length === totalScenes) {
    durations = sceneDurationsSec.map((s) => Math.max(Math.round(s * LECTURE_FPS), LECTURE_FPS));
  } else {
    const evenSec = audioDurationSec > 0 ? audioDurationSec / totalScenes : 15;
    durations = Array(totalScenes).fill(Math.round(evenSec * LECTURE_FPS));
  }

  const totalFrames = durations.reduce((a, b) => a + b, 0);

  // Count non-title/agenda/quote/summary slides for numbering
  const contentSlides = slides.filter((s) => s.type === 'content');
  let contentIndex = 0;

  return (
    <AbsoluteFill style={{ backgroundColor: '#0d0f14' }}>
      {bgmUrl && (
        <BgmTrack
          src={bgmUrl}
          totalDurationInFrames={totalFrames}
          volume={bgmVolume ?? 0.08}
          trackDurationSec={bgmTrackDurationSec ?? 30}
        />
      )}
      {audioUrl && <Audio src={audioUrl} volume={1.0} />}

      <Series>
        {slides.map((slide, i) => {
          let idx: number | undefined;
          if (slide.type === 'content') {
            idx = ++contentIndex;
          }

          return (
            <Series.Sequence key={i} durationInFrames={durations[i]}>
              {slide.type === 'title' && (
                <TitleSlide
                  title={slide.heading}
                  subtitle={slide.subheading}
                  accentColor={accentColor}
                  mediaDataUri={slide.mediaDataUri}
                  mediaType={slide.mediaType ?? 'image'}
                />
              )}
              {slide.type === 'agenda' && (
                <AgendaSlide
                  items={slide.bullets ?? []}
                  accentColor={accentColor}
                />
              )}
              {slide.type === 'content' && (
                <ContentSlide
                  heading={slide.heading}
                  bullets={slide.bullets ?? []}
                  mediaDataUri={slide.mediaDataUri}
                  mediaType={slide.mediaType ?? 'image'}
                  accentColor={accentColor}
                  slideIndex={idx}
                  slideTotal={contentSlides.length}
                />
              )}
              {slide.type === 'quote' && (
                <QuoteSlide
                  quote={slide.quote ?? slide.heading}
                  attribution={slide.attribution}
                  accentColor={accentColor}
                />
              )}
              {slide.type === 'summary' && (
                <SummarySlide
                  bullets={slide.bullets ?? []}
                  cta={slide.cta}
                  accentColor={accentColor}
                />
              )}
            </Series.Sequence>
          );
        })}
      </Series>
    </AbsoluteFill>
  );
};
