import { AbsoluteFill, Audio, Sequence, Series } from 'remotion';
import { z } from 'zod';
import { REELS_FPS } from '../../types';
import { useFonts } from '../../fonts';
import { BgmTrack } from '../../components/BgmTrack';
import { IntroScene } from './scenes/IntroScene';
import { ItemScene } from './scenes/ItemScene';
import { ItemSceneStat } from './scenes/ItemSceneStat';
import { ItemSceneQuote } from './scenes/ItemSceneQuote';
import { ItemSceneBigdata } from './scenes/ItemSceneBigdata';
import { ItemSceneSplit } from './scenes/ItemSceneSplit';
import { ItemSceneSteps } from './scenes/ItemSceneSteps';
import { ItemSceneGrid } from './scenes/ItemSceneGrid';
import { ItemSceneHighlight } from './scenes/ItemSceneHighlight';
import { ItemSceneStatGrid } from './scenes/ItemSceneStatGrid';
import { ItemSceneIconFeature } from './scenes/ItemSceneIconFeature';
import { CloseScene } from './scenes/CloseScene';
import { getPalette, paletteGradient } from './palettes';

const listItemSchema = z.object({
  title: z.string(),
  description: z.string().optional(),
  benefit: z.string().optional(),
  /** Visual style for this item card. Default: 'default' */
  cardStyle: z
    .enum([
      'default',
      'stat',
      'quote',
      'bigdata',
      'split',
      'steps',
      'grid',
      'highlight',
      'statgrid',
      'iconfeature',
    ])
    .optional(),
  /** For 'stat' style: percentage or short value (e.g., "85%", "3배") */
  statValue: z.string().optional(),
  /** For 'quote' style: the quote text */
  quote: z.string().optional(),
  attribution: z.string().optional(),
  /** For 'bigdata' style: large number + unit */
  bigNumber: z.string().optional(),
  unit: z.string().optional(),
  /** For 'split' style: A vs B labels and bodies */
  leftLabel: z.string().optional(),
  leftBody: z.string().optional(),
  rightLabel: z.string().optional(),
  rightBody: z.string().optional(),
  /** For 'steps' style: 2-4 step strings */
  steps: z.array(z.string()).optional(),
  /** For 'grid' style: 4 icon+label items */
  gridItems: z
    .array(z.object({ icon: z.string(), label: z.string() }))
    .optional(),
  /** For 'highlight' style: key emphasis phrase */
  emphasis: z.string().optional(),
  /** For 'statgrid' style: 2-4 mini stats */
  miniStats: z
    .array(z.object({ value: z.string(), label: z.string() }))
    .optional(),
  /** For 'iconfeature' style: large emoji icon */
  icon: z.string().optional(),
});

export const listSchema = z.object({
  headline: z.string(),
  hook: z.string(),
  items: z.array(listItemSchema).min(1).max(8),
  cta: z.string(),
  audioUrl: z.string().optional(),
  audioDurationSec: z.number().optional(),
  /**
   * Per-scene durations in seconds, in scene order [intro, item1, ..., itemN, close].
   * When provided, scenes use these durations instead of even slicing.
   */
  sceneDurationsSec: z.array(z.number()).optional(),
  bgmUrl: z.string().optional(),
  bgmVolume: z.number().optional(),
  bgmTrackDurationSec: z.number().optional(),
  /** Optional palette rotation seed (0-9). Different seeds give different feed thumbnails. */
  paletteSeed: z.number().optional(),
});

export type ListData = z.infer<typeof listSchema>;

const INTRO_SEC = 5;
const PER_ITEM_SEC = 5;
const CLOSE_SEC = 4;

export const calculateListDuration = (
  itemCount: number,
  audioDurationSec?: number,
  sceneDurationsSec?: number[]
): number => {
  // If exact scene durations provided, use their sum
  if (sceneDurationsSec && sceneDurationsSec.length === itemCount + 2) {
    const sum = sceneDurationsSec.reduce((a, b) => a + b, 0);
    return Math.round(REELS_FPS * sum);
  }
  const minSec = INTRO_SEC + itemCount * PER_ITEM_SEC + CLOSE_SEC;
  const target = Math.max(minSec, (audioDurationSec ?? 0) + 1);
  return Math.round(REELS_FPS * target);
};

export const LIST_DEFAULT_DURATION = REELS_FPS * (INTRO_SEC + 5 * PER_ITEM_SEC + CLOSE_SEC);

export const ListReel: React.FC<ListData> = ({
  headline,
  hook,
  items,
  cta,
  audioUrl,
  audioDurationSec,
  sceneDurationsSec,
  bgmUrl,
  bgmVolume,
  bgmTrackDurationSec,
  paletteSeed,
}) => {
  useFonts();

  const itemCount = items.length;
  const totalFrames = calculateListDuration(itemCount, audioDurationSec, sceneDurationsSec);

  // Per-scene durations: use sceneDurationsSec if it matches expected length,
  // otherwise fall back to even slicing.
  const expectedSceneCount = itemCount + 2;
  const useExact =
    Array.isArray(sceneDurationsSec) && sceneDurationsSec.length === expectedSceneCount;

  let introFrames: number;
  let itemFramesArr: number[];
  let closeFrames: number;

  if (useExact) {
    introFrames = Math.max(REELS_FPS, Math.round(sceneDurationsSec![0] * REELS_FPS));
    itemFramesArr = sceneDurationsSec!
      .slice(1, 1 + itemCount)
      .map((s) => Math.max(REELS_FPS, Math.round(s * REELS_FPS)));
    closeFrames = Math.max(REELS_FPS, Math.round(sceneDurationsSec![1 + itemCount] * REELS_FPS));
  } else {
    const introRatio = INTRO_SEC / (INTRO_SEC + itemCount * PER_ITEM_SEC + CLOSE_SEC);
    const itemRatio = PER_ITEM_SEC / (INTRO_SEC + itemCount * PER_ITEM_SEC + CLOSE_SEC);
    introFrames = Math.round(totalFrames * introRatio);
    const evenItem = Math.round(totalFrames * itemRatio);
    itemFramesArr = Array(itemCount).fill(evenItem);
    closeFrames = totalFrames - introFrames - evenItem * itemCount;
  }

  const resolvedBgm = bgmUrl ?? '/bgm.wav';

  // Per-scene palette: intro=0, items=1..N, close=N+1. Each scene gets a
  // different gradient so the IG/YT feed grid no longer looks monotone.
  const seed = paletteSeed ?? 0;
  const introPalette = getPalette(0, seed);
  const closePalette = getPalette(itemCount + 1, seed);

  return (
    <AbsoluteFill style={{ backgroundColor: 'black' }}>
      <Series>
        <Series.Sequence durationInFrames={introFrames}>
          <IntroScene
            headline={headline}
            hook={hook}
            itemCount={itemCount}
            bgGradient={paletteGradient(introPalette)}
            accentColor={introPalette.accent}
            textMutedColor={introPalette.textMuted}
          />
        </Series.Sequence>

        {items.map((item, idx) => {
          const style = item.cardStyle || 'default';
          const desc = item.description || '';
          // Each item card gets its own palette (offset by 1 to skip intro's palette)
          const itemPalette = getPalette(idx + 1, seed);
          const bg = paletteGradient(itemPalette);
          let scene: React.ReactNode;
          if (style === 'stat' && item.statValue) {
            scene = <ItemSceneStat index={idx} total={itemCount} title={item.title} statValue={item.statValue} description={desc} bgGradient={bg} accentColor={itemPalette.accent} />;
          } else if (style === 'quote' && item.quote) {
            scene = <ItemSceneQuote index={idx} total={itemCount} quote={item.quote} attribution={item.attribution || item.title} bgGradient={bg} accentColor={itemPalette.accent} />;
          } else if (style === 'bigdata' && item.bigNumber) {
            scene = <ItemSceneBigdata index={idx} total={itemCount} title={item.title} bigNumber={item.bigNumber} unit={item.unit || ''} description={desc} bgGradient={bg} accentColor={itemPalette.accent} />;
          } else if (style === 'split' && item.leftLabel && item.rightLabel) {
            scene = (
              <ItemSceneSplit
                index={idx}
                total={itemCount}
                title={item.title}
                leftLabel={item.leftLabel}
                leftBody={item.leftBody || desc.slice(0, 50) || '기존의 방식으로는 한계가 있습니다'}
                rightLabel={item.rightLabel}
                rightBody={item.rightBody || item.benefit || '새로운 접근으로 더 나은 결과'}
                bgGradient={bg}
              />
            );
          } else if (style === 'steps' && item.steps && item.steps.length >= 2) {
            scene = <ItemSceneSteps index={idx} total={itemCount} title={item.title} steps={item.steps} bgGradient={bg} accentColor={itemPalette.accent} />;
          } else if (style === 'grid' && item.gridItems && item.gridItems.length >= 2) {
            scene = <ItemSceneGrid index={idx} total={itemCount} title={item.title} gridItems={item.gridItems} bgGradient={bg} accentColor={itemPalette.accent} />;
          } else if (style === 'highlight' && item.emphasis) {
            scene = <ItemSceneHighlight index={idx} total={itemCount} title={item.title} emphasis={item.emphasis} description={desc || item.benefit || ''} bgGradient={bg} accentColor={itemPalette.accent} />;
          } else if (style === 'statgrid' && item.miniStats && item.miniStats.length >= 2) {
            scene = <ItemSceneStatGrid index={idx} total={itemCount} title={item.title} stats={item.miniStats} bgGradient={bg} />;
          } else if (style === 'iconfeature' && item.icon) {
            scene = <ItemSceneIconFeature index={idx} total={itemCount} icon={item.icon} title={item.title} description={desc} bgGradient={bg} accentColor={itemPalette.accent} />;
          } else {
            scene = <ItemScene index={idx} total={itemCount} title={item.title} description={desc} benefit={item.benefit} bgGradient={bg} />;
          }
          return (
            <Series.Sequence key={idx} durationInFrames={itemFramesArr[idx]}>
              {scene}
            </Series.Sequence>
          );
        })}

        <Series.Sequence durationInFrames={Math.max(closeFrames, REELS_FPS * 2)}>
          <CloseScene
            cta={cta}
            itemCount={itemCount}
            bgGradient={paletteGradient(closePalette)}
            accentColor={closePalette.accent}
          />
        </Series.Sequence>
      </Series>

      {resolvedBgm && (
        <BgmTrack
          src={resolvedBgm}
          totalDurationInFrames={totalFrames}
          volume={bgmVolume ?? 0.18}
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
