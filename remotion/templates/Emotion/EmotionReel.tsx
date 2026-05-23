import { AbsoluteFill, Audio, Sequence, Series } from 'remotion';
import { z } from 'zod';
import { REELS_FPS } from '../../types';
import { useFonts } from '../../fonts';
import { BgmTrack } from '../../components/BgmTrack';
import { OpeningScene } from './scenes/OpeningScene';
import { StoryScene } from './scenes/StoryScene';
import { MessageScene } from './scenes/MessageScene';
import { ClosingScene } from './scenes/ClosingScene';

export const emotionSchema = z.object({
  opening: z.string(),
  story: z.string(),
  message: z.string(),
  closing: z.string(),
  audioUrl: z.string().optional(),
  audioDurationSec: z.number().optional(),
  bgmUrl: z.string().optional(),
  bgmVolume: z.number().optional(),
  bgmTrackDurationSec: z.number().optional(),
});

const OPENING_RATIO = 8 / 60;
const STORY_RATIO = 28 / 60;
const MESSAGE_RATIO = 14 / 60;
const CLOSING_RATIO = 10 / 60;

export const EMOTION_DEFAULT_SEC = 60;
export const EMOTION_TOTAL_DURATION = REELS_FPS * EMOTION_DEFAULT_SEC;

export const calculateEmotionDuration = (audioDurationSec?: number): number => {
  const target = Math.max(EMOTION_DEFAULT_SEC, (audioDurationSec ?? 0) + 1);
  return Math.round(REELS_FPS * target);
};

export const EmotionReel: React.FC<z.infer<typeof emotionSchema>> = ({
  opening,
  story,
  message,
  closing,
  audioUrl,
  audioDurationSec,
  bgmUrl,
  bgmVolume,
  bgmTrackDurationSec,
}) => {
  useFonts();

  const totalFrames = calculateEmotionDuration(audioDurationSec);
  const openingFrames = Math.round(totalFrames * OPENING_RATIO);
  const storyFrames = Math.round(totalFrames * STORY_RATIO);
  const messageFrames = Math.round(totalFrames * MESSAGE_RATIO);
  const closingFrames = totalFrames - openingFrames - storyFrames - messageFrames;

  const resolvedBgm = bgmUrl ?? '/bgm.wav';

  return (
    <AbsoluteFill style={{ backgroundColor: 'black' }}>
      <Series>
        <Series.Sequence durationInFrames={openingFrames}>
          <OpeningScene opening={opening} />
        </Series.Sequence>
        <Series.Sequence durationInFrames={storyFrames}>
          <StoryScene story={story} />
        </Series.Sequence>
        <Series.Sequence durationInFrames={messageFrames}>
          <MessageScene message={message} />
        </Series.Sequence>
        <Series.Sequence durationInFrames={closingFrames}>
          <ClosingScene closing={closing} />
        </Series.Sequence>
      </Series>

      {resolvedBgm && (
        <BgmTrack
          src={resolvedBgm}
          totalDurationInFrames={totalFrames}
          volume={bgmVolume ?? 0.15}
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
