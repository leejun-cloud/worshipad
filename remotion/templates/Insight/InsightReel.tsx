import { AbsoluteFill, Audio, Sequence, Series } from 'remotion';
import { z } from 'zod';
import { REELS_FPS } from '../../types';
import { useFonts } from '../../fonts';
import { BgmTrack } from '../../components/BgmTrack';
import { DarkOpening } from './scenes/DarkOpening';
import { QuoteScene } from './scenes/QuoteScene';
import { ElaborationScene } from './scenes/ElaborationScene';

export const insightSchema = z.object({
  quote: z.string(),
  elaboration: z.string(),
  source: z.string().optional(),
  audioUrl: z.string().optional(),
  audioDurationSec: z.number().optional(),
  bgmUrl: z.string().optional(),
  bgmVolume: z.number().optional(),
  bgmTrackDurationSec: z.number().optional(),
});

const OPENING_RATIO = 3 / 22;
const QUOTE_RATIO = 12 / 22;
const ELABORATION_RATIO = 7 / 22;

export const INSIGHT_DEFAULT_SEC = 22;
export const INSIGHT_TOTAL_DURATION = REELS_FPS * INSIGHT_DEFAULT_SEC;

export const calculateInsightDuration = (audioDurationSec?: number): number => {
  const target = Math.max(INSIGHT_DEFAULT_SEC, (audioDurationSec ?? 0) + 1);
  return Math.round(REELS_FPS * target);
};

export const InsightReel: React.FC<z.infer<typeof insightSchema>> = ({
  quote,
  elaboration,
  source,
  audioUrl,
  audioDurationSec,
  bgmUrl,
  bgmVolume,
  bgmTrackDurationSec,
}) => {
  useFonts();

  const totalFrames = calculateInsightDuration(audioDurationSec);
  const openingFrames = Math.round(totalFrames * OPENING_RATIO);
  const quoteFrames = Math.round(totalFrames * QUOTE_RATIO);
  const elaborationFrames = totalFrames - openingFrames - quoteFrames;

  const resolvedBgm = bgmUrl ?? '/bgm.wav';

  return (
    <AbsoluteFill style={{ backgroundColor: '#0a0a0a' }}>
      <Series>
        <Series.Sequence durationInFrames={openingFrames}>
          <DarkOpening />
        </Series.Sequence>
        <Series.Sequence durationInFrames={quoteFrames}>
          <QuoteScene quote={quote} />
        </Series.Sequence>
        <Series.Sequence durationInFrames={elaborationFrames}>
          <ElaborationScene elaboration={elaboration} source={source} />
        </Series.Sequence>
      </Series>

      {resolvedBgm && (
        <BgmTrack
          src={resolvedBgm}
          totalDurationInFrames={totalFrames}
          volume={bgmVolume ?? 0.13}
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
