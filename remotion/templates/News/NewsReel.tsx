import { AbsoluteFill, Audio, Sequence, Series } from 'remotion';
import { z } from 'zod';
import { REELS_FPS } from '../../types';
import { useFonts } from '../../fonts';
import { BgmTrack } from '../../components/BgmTrack';
import { HeadlineScene } from './scenes/HeadlineScene';
import { DetailsScene } from './scenes/DetailsScene';
import { ActionScene } from './scenes/ActionScene';

export const newsSchema = z.object({
  headline: z.string(),
  when: z.string(),
  where: z.string(),
  what: z.string(),
  action: z.string(),
  audioUrl: z.string().optional(),
  audioDurationSec: z.number().optional(),
  bgmUrl: z.string().optional(),
  bgmVolume: z.number().optional(),
  bgmTrackDurationSec: z.number().optional(),
});

const HEADLINE_RATIO = 6 / 25;
const DETAILS_RATIO = 12 / 25;
const ACTION_RATIO = 7 / 25;

export const NEWS_DEFAULT_SEC = 25;
export const NEWS_TOTAL_DURATION = REELS_FPS * NEWS_DEFAULT_SEC;

export const calculateNewsDuration = (audioDurationSec?: number): number => {
  const target = Math.max(NEWS_DEFAULT_SEC, (audioDurationSec ?? 0) + 1);
  return Math.round(REELS_FPS * target);
};

export const NewsReel: React.FC<z.infer<typeof newsSchema>> = ({
  headline,
  when,
  where,
  what,
  action,
  audioUrl,
  audioDurationSec,
  bgmUrl,
  bgmVolume,
  bgmTrackDurationSec,
}) => {
  useFonts();

  const totalFrames = calculateNewsDuration(audioDurationSec);
  const headlineFrames = Math.round(totalFrames * HEADLINE_RATIO);
  const detailsFrames = Math.round(totalFrames * DETAILS_RATIO);
  const actionFrames = totalFrames - headlineFrames - detailsFrames;

  const resolvedBgm = bgmUrl ?? '/bgm.wav';

  return (
    <AbsoluteFill style={{ backgroundColor: 'black' }}>
      <Series>
        <Series.Sequence durationInFrames={headlineFrames}>
          <HeadlineScene headline={headline} />
        </Series.Sequence>
        <Series.Sequence durationInFrames={detailsFrames}>
          <DetailsScene when={when} where={where} what={what} />
        </Series.Sequence>
        <Series.Sequence durationInFrames={actionFrames}>
          <ActionScene action={action} />
        </Series.Sequence>
      </Series>

      {resolvedBgm && (
        <BgmTrack
          src={resolvedBgm}
          totalDurationInFrames={totalFrames}
          volume={bgmVolume ?? 0.20}
          trackDurationSec={bgmTrackDurationSec ?? 18}
        />
      )}

      {audioUrl && (
        <Sequence from={0}>
          <Audio src={audioUrl} volume={1.0} />
        </Sequence>
      )}
    </AbsoluteFill>
  );
};
