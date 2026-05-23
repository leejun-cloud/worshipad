import { AbsoluteFill, Audio, Sequence, Series } from 'remotion';
import { z } from 'zod';
import { REELS_FPS } from '../../types';
import { useFonts } from '../../fonts';
import { BgmTrack } from '../../components/BgmTrack';
import { HookScene } from './scenes/HookScene';
import { ImpactScene } from './scenes/ImpactScene';
import { CTAScene } from './scenes/CTAScene';

export const actionSchema = z.object({
  problem: z.string(),
  solution: z.string(),
  benefit: z.string(),
  cta: z.string(),
  audioUrl: z.string().optional(),
  audioDurationSec: z.number().optional(),
  bgmUrl: z.string().optional(),
  bgmVolume: z.number().optional(),
  bgmTrackDurationSec: z.number().optional(),
});

const HOOK_RATIO = 4 / 15;
const IMPACT_RATIO = 6 / 15;
const CTA_RATIO = 5 / 15;

export const ACTION_DEFAULT_SEC = 15;
export const ACTION_TOTAL_DURATION = REELS_FPS * ACTION_DEFAULT_SEC;

export const calculateActionDuration = (audioDurationSec?: number): number => {
  const target = Math.max(ACTION_DEFAULT_SEC, (audioDurationSec ?? 0) + 1);
  return Math.round(REELS_FPS * target);
};

export const ActionReel: React.FC<z.infer<typeof actionSchema>> = ({
  problem,
  solution,
  benefit,
  cta,
  audioUrl,
  audioDurationSec,
  bgmUrl,
  bgmVolume,
  bgmTrackDurationSec,
}) => {
  useFonts();

  const totalFrames = calculateActionDuration(audioDurationSec);
  const hookFrames = Math.round(totalFrames * HOOK_RATIO);
  const impactFrames = Math.round(totalFrames * IMPACT_RATIO);
  const ctaFrames = totalFrames - hookFrames - impactFrames;

  const resolvedBgm = bgmUrl ?? '/bgm.wav';

  return (
    <AbsoluteFill style={{ backgroundColor: 'black' }}>
      <Series>
        <Series.Sequence durationInFrames={hookFrames}>
          <HookScene problem={problem} />
        </Series.Sequence>

        <Series.Sequence durationInFrames={impactFrames}>
          <ImpactScene solution={solution} benefit={benefit} />
        </Series.Sequence>

        <Series.Sequence durationInFrames={ctaFrames}>
          <CTAScene cta={cta} />
        </Series.Sequence>
      </Series>

      {resolvedBgm && (
        <BgmTrack
          src={resolvedBgm}
          totalDurationInFrames={totalFrames}
          volume={bgmVolume ?? 0.22}
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
