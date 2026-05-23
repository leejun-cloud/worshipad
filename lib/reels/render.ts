import { bundle } from '@remotion/bundler';
import { renderMedia, renderStill, selectComposition } from '@remotion/renderer';
import { mkdir } from 'fs/promises';
import path from 'path';

export type ReelsTemplate =
  | 'action'
  | 'emotion'
  | 'news'
  | 'insight'
  | 'list'
  | 'photo'
  | 'lecture'
  | 'church-ad';

export const COMPOSITION_MAP: Record<ReelsTemplate, string> = {
  action: 'ActionReel',
  emotion: 'EmotionReel',
  news: 'NewsReel',
  insight: 'InsightReel',
  list: 'ListReel',
  photo: 'PhotoReel',
  lecture: 'LectureReel',
  'church-ad': 'ChurchAdReel',
};

const PUBLIC_DIR = path.join(process.cwd(), 'public');

let cachedServeUrl: string | null = null;
let cachedBundleAt = 0;

/**
 * Returns a Remotion bundle URL.
 * Cache invalidates when forceRefresh=true (e.g. after writing new files to public/).
 */
export const getRemotionBundle = async (forceRefresh = false): Promise<string> => {
  if (cachedServeUrl && !forceRefresh) return cachedServeUrl;
  cachedServeUrl = await bundle({
    entryPoint: path.join(process.cwd(), 'remotion', 'index.ts'),
    webpackOverride: (config) => config,
    publicDir: PUBLIC_DIR,
  });
  cachedBundleAt = Date.now();
  return cachedServeUrl;
};

/**
 * Stage 1 — generous timeouts. The Chromium default delayRender deadline (28s)
 * fails the entire job if a single <Img> or font fetch is slow. We're not
 * latency-bound here so a 60s asset deadline is far safer.
 */
const ASSET_TIMEOUT_MS = Number(process.env.RENDER_ASSET_TIMEOUT_MS || 60_000);
const TOTAL_TIMEOUT_MS = Number(process.env.RENDER_TOTAL_TIMEOUT_MS || 300_000);

const baseRenderOptions = (template: ReelsTemplate) => ({
  // Church-ad bundles many assets per slide — keep concurrency modest globally.
  concurrency: template === 'church-ad' ? 2 : 3,
  timeoutInMilliseconds: TOTAL_TIMEOUT_MS,
  delayRenderTimeoutInMilliseconds: ASSET_TIMEOUT_MS,
  // Surface Chromium console errors instead of swallowing them. Captured in
  // worker logs so we can see WHY a slide failed, not just that it did.
  logLevel: 'info' as const,
  onBrowserLog: (log: { type: string; text: string }) => {
    if (log.type === 'error' || log.type === 'warning') {
      // eslint-disable-next-line no-console
      console.warn(`[chromium ${log.type}]`, log.text);
    }
  },
});

export interface RenderOptions {
  template: ReelsTemplate;
  data: Record<string, unknown>;
  outputFileName?: string;
  /** Force a fresh bundle (use after writing new files to public/) */
  forceRebundle?: boolean;
  /** Stage 1: progress 0..1 from Chromium during encoding. */
  onProgress?: (progress: number) => void;
}

export interface RenderResult {
  localPath: string;
  fileName: string;
  publicUrl: string;
}

export const renderReel = async (options: RenderOptions): Promise<RenderResult> => {
  const { template, data, onProgress } = options;
  const compositionId = COMPOSITION_MAP[template];
  if (!compositionId) {
    throw new Error(`지원하지 않는 템플릿: ${template}`);
  }

  const outDir = path.join(process.cwd(), 'public', 'reels');
  await mkdir(outDir, { recursive: true });
  const fileName = options.outputFileName || `reel-${template}-${Date.now()}.mp4`;
  const localPath = path.join(outDir, fileName);

  const serveUrl = await getRemotionBundle(options.forceRebundle ?? false);

  const composition = await selectComposition({
    serveUrl,
    id: compositionId,
    inputProps: data,
    chromiumOptions: {},
  });

  await renderMedia({
    serveUrl,
    composition,
    codec: 'h264',
    outputLocation: localPath,
    inputProps: data,
    ...baseRenderOptions(template),
    onProgress: onProgress
      ? ({ progress }) => {
          try {
            onProgress(progress);
          } catch {
            // ignore — never let a progress handler crash the render
          }
        }
      : undefined,
  });

  return {
    localPath,
    fileName,
    publicUrl: `/reels/${fileName}`,
  };
};

export interface ThumbnailOptions {
  compositionId: string;
  data: Record<string, unknown>;
  outputPath: string;
  frame?: number;
}

/** Render a single-frame JPEG thumbnail using renderStill. */
export const renderThumbnail = async (opts: ThumbnailOptions): Promise<string> => {
  const serveUrl = await getRemotionBundle();
  const composition = await selectComposition({
    serveUrl,
    id: opts.compositionId,
    inputProps: opts.data,
    chromiumOptions: {},
  });
  await renderStill({
    composition,
    serveUrl,
    output: opts.outputPath,
    inputProps: opts.data,
    imageFormat: 'jpeg',
    jpegQuality: 92,
    frame: opts.frame ?? 0,
  });
  return opts.outputPath;
};

// ────────────────────────────────────────────────────────────────────────
// Stage 3: per-slide rendering via frameRange.
//
// renderSlice renders ONE slide of the full composition by limiting Chromium
// to that slide's frame window. The composition is the same — we just slice
// off a subrange — so motion patterns and global state stay consistent with
// the full preview. Audio/BGM are stripped from sliceInputs (caller's job)
// and muxed back on after concat.
// ────────────────────────────────────────────────────────────────────────
export interface RenderSliceOptions {
  template: ReelsTemplate;
  /** Full composition input props with audio/bgm fields cleared. */
  inputProps: Record<string, unknown>;
  frameRange: [number, number];
  outputPath: string;
  /** Optional progress 0..1 within this slice. */
  onProgress?: (progress: number) => void;
  forceRebundle?: boolean;
}

export const renderSlice = async (opts: RenderSliceOptions): Promise<void> => {
  const compositionId = COMPOSITION_MAP[opts.template];
  if (!compositionId) throw new Error(`unsupported template: ${opts.template}`);

  const serveUrl = await getRemotionBundle(opts.forceRebundle ?? false);
  const props = opts.inputProps as any;
  // eslint-disable-next-line no-console
  console.log(`[renderSlice] sceneDurationsSec=${JSON.stringify(props.sceneDurationsSec)} audioDurationSec=${props.audioDurationSec} slides=${props.slides?.length} frameRange=${JSON.stringify(opts.frameRange)}`);
  const composition = await selectComposition({
    serveUrl,
    id: compositionId,
    inputProps: opts.inputProps,
    chromiumOptions: {},
  });
  // eslint-disable-next-line no-console
  console.log(`[renderSlice] composition.durationInFrames=${composition.durationInFrames}`);

  await renderMedia({
    serveUrl,
    composition,
    codec: 'h264',
    outputLocation: opts.outputPath,
    inputProps: opts.inputProps,
    frameRange: opts.frameRange,
    ...baseRenderOptions(opts.template),
    onProgress: opts.onProgress
      ? ({ progress }) => {
          try {
            opts.onProgress!(progress);
          } catch {
            // ignore
          }
        }
      : undefined,
  });
};
