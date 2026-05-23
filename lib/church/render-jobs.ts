// Async render job store for the church-ad web editor.
// Inspired by Jellyfish's unified async task tracking — render is too slow for
// a synchronous HTTP request, so we kick off background work, return a jobId,
// and let the editor poll /api/church-ad/jobs/{id} for status until done.
//
// **Stability roadmap applied** (see ROADMAP / chat history):
//   Stage 1 — generous Chromium timeouts; external URLs prefetched to /public.
//   Stage 2 — atomic disk-first job persistence with lease so the polling
//             endpoint never serves a lying in-memory value, and an opt-in
//             child-process worker for crash isolation.
//   Stage 3 — slide-by-slide rendering: each slide is rendered to its own MP4
//             via renderMedia({ frameRange }), failed slides retry in isolation
//             (one bad slide no longer poisons a 60s render), then ffmpeg
//             concats slides and muxes narration + BGM. Cached slices skip
//             re-encode entirely.
//   Stage 4 — per-slice timing/memory metrics + failure inputProps dump.

import { mkdir, writeFile, readFile, stat, copyFile, rename, unlink } from 'fs/promises';
import { createWriteStream, mkdirSync, openSync } from 'fs';
import path from 'path';
import { randomUUID } from 'crypto';
import { spawn } from 'child_process';
import { renderSlice, COMPOSITION_MAP } from '@/lib/reels/render';
import { concatVideos, muxAudio, prefetchUrl } from '@/lib/reels/render-ffmpeg';
import { sliceHash, getCachedSlicePath, storeSlice } from '@/lib/reels/render-cache';
import { recordEvent, persistFailure } from '@/lib/reels/render-metrics';
import { fetchPhoto } from '@/lib/reels/photo-fetcher';
import { synthesizeSegments, concatenateWavs } from '@/lib/reels/tts';
import { fetchBgm, bgmToDataUri } from '@/lib/reels/music-fetcher';
import { enforceEntryEffectVariety } from './church-ad-structure';
import type { ChurchAdStructureResult, ChurchAdSlide } from './church-ad-structure';

export type JobStatus = 'pending' | 'preparing' | 'rendering' | 'ready' | 'failed';

export interface RenderJob {
  id: string;
  status: JobStatus;
  progress: number;
  step: string;
  videoUrl?: string;
  outDir?: string;
  error?: string;
  createdAt: number;
  updatedAt: number;
  /** Stage 2: which process is currently working on this job. */
  claimedBy?: string;
  /** Stage 2: when the claim expires; another worker may re-claim past this. */
  leaseExpiresAt?: number;
  /** Stage 4: per-slide progress for the dashboard. */
  slidesTotal?: number;
  slidesDone?: number;
  slidesFailed?: number;
}

const JOB_DIR = path.join(process.cwd(), 'out', '.jobs');

const jobs = new Map<string, RenderJob>();

// ─── Stage 2: atomic disk-first persistence ──────────────────────────────
// Previously we wrote async-fire-and-forget AFTER mutating the Map, which
// meant pollers reading via cross-worker fallback would see stale state.
// Now disk is the source of truth: we write+rename atomically, then update
// the Map. Polling always sees an at-rest snapshot.

const writeJobAtomic = async (job: RenderJob): Promise<void> => {
  await mkdir(JOB_DIR, { recursive: true });
  const finalPath = path.join(JOB_DIR, `${job.id}.json`);
  const tmpPath = `${finalPath}.${randomUUID()}.tmp`;
  await writeFile(tmpPath, JSON.stringify(job), 'utf-8');
  await rename(tmpPath, finalPath);
};

const persistAndCache = async (job: RenderJob): Promise<void> => {
  job.updatedAt = Date.now();
  await writeJobAtomic(job);
  jobs.set(job.id, job);
};

const update = async (id: string, patch: Partial<RenderJob>): Promise<void> => {
  const j = jobs.get(id) ?? (await loadFromDisk(id));
  if (!j) return;
  Object.assign(j, patch);
  await persistAndCache(j);
};

const loadFromDisk = async (id: string): Promise<RenderJob | null> => {
  try {
    const buf = await readFile(path.join(JOB_DIR, `${id}.json`), 'utf-8');
    return JSON.parse(buf) as RenderJob;
  } catch {
    return null;
  }
};

export const getJob = async (id: string): Promise<RenderJob | null> => {
  // Disk is the source of truth — when the render runs in a spawned worker
  // (default), the worker process is the only one that writes status updates.
  // The Next dev process's in-memory Map only carries the initial seed and
  // would forever return 'pending' if we preferred it.
  const onDisk = await loadFromDisk(id);
  if (onDisk) return onDisk;
  return jobs.get(id) ?? null;
};

const SCENE_GAP_SEC = 0.4;
const RENDER_FPS = 30;
const MAX_SLIDE_RETRIES = Number(process.env.RENDER_SLIDE_RETRIES || 2);
const LEASE_MS = 10 * 60_000; // 10 minutes

const moodMap = {
  reverent: 'contemplative',
  uplifting: 'energetic',
  warm: 'emotional',
  hopeful: 'calm',
} as const;

const isAssetUsable = async (publicUrl: string | undefined): Promise<boolean> => {
  if (!publicUrl) return false;
  if (publicUrl.startsWith('data:')) return true;
  if (!publicUrl.startsWith('/')) return true; // external URL — trust caller
  try {
    const filePath = path.join(process.cwd(), 'public', publicUrl);
    const st = await stat(filePath);
    return st.isFile() && st.size > 0;
  } catch {
    return false;
  }
};

/** Ensure a local video has moov atom at front (faststart) so Chromium can seek instantly.
 *  Returns the path to the faststart-processed copy (in-place if already ok, or a new file). */
const ensureVideoFaststart = async (absPath: string): Promise<string> => {
  const fsPath = absPath.replace(/\.mp4$/, '.fs.mp4');
  try {
    const st = await stat(fsPath);
    if (st.isFile() && st.size > 1000) return fsPath; // already processed
  } catch { /* not cached yet */ }

  await new Promise<void>((resolve) => {
    const ff = spawn('ffmpeg', [
      '-y', '-i', absPath,
      '-c:v', 'copy', '-an',
      '-movflags', '+faststart',
      fsPath,
    ]);
    ff.on('close', () => resolve());
    ff.on('error', () => resolve());
  });

  try {
    const st = await stat(fsPath);
    if (st.isFile() && st.size > 1000) return fsPath;
  } catch { /* faststart failed */ }
  return absPath; // fallback: original
};

/** Extract a JPEG still frame from a video (at 1s) to use as image fallback. */
const extractVideoStill = async (absPath: string): Promise<string | null> => {
  const jpgPath = absPath.replace(/\.[^.]+$/, '.still.jpg');
  try {
    const st = await stat(jpgPath);
    if (st.isFile() && st.size > 100) return jpgPath;
  } catch { /* not cached */ }

  await new Promise<void>((resolve) => {
    const ff = spawn('ffmpeg', [
      '-y', '-ss', '1', '-i', absPath,
      '-vframes', '1', '-q:v', '2',
      jpgPath,
    ]);
    ff.on('close', () => resolve());
    ff.on('error', () => resolve());
  });

  try {
    const st = await stat(jpgPath);
    if (st.isFile() && st.size > 100) return jpgPath;
  } catch { /* failed */ }
  return null;
};

/** Extract audio track from a video into a WAV file.
 *  Duration is matched to `targetSec` — pads silence or trims as needed.
 *  Returns the output WAV path, or null if extraction fails. */
const extractVideoAudio = async (absVideoPath: string, targetSec: number, outPath: string): Promise<string | null> => {
  await new Promise<void>((resolve) => {
    const ff = spawn('ffmpeg', [
      '-y', '-i', absVideoPath,
      '-vn',                        // no video
      '-af', `apad,atrim=end=${targetSec.toFixed(3)}`, // pad/trim to target
      '-ar', '44100', '-ac', '2',   // normalize sample rate
      outPath,
    ]);
    ff.on('close', () => resolve());
    ff.on('error', () => resolve());
  });
  try {
    const st = await stat(outPath);
    if (st.isFile() && st.size > 100) return outPath;
  } catch { /* failed */ }
  return null;
};

/** Concatenate multiple WAV/audio files using ffmpeg concat filter.
 *  Returns the output path or null on failure. */
const concatAudioFiles = async (audioPaths: string[], outPath: string): Promise<string | null> => {
  if (audioPaths.length === 0) return null;
  if (audioPaths.length === 1) {
    await copyFile(audioPaths[0], outPath);
    return outPath;
  }
  const inputs = audioPaths.flatMap((p) => ['-i', p]);
  const filter = audioPaths.map((_, i) => `[${i}:a]`).join('') + `concat=n=${audioPaths.length}:v=0:a=1[aout]`;
  await new Promise<void>((resolve) => {
    const ff = spawn('ffmpeg', [
      '-y', ...inputs,
      '-filter_complex', filter,
      '-map', '[aout]',
      '-ar', '44100', '-ac', '2',
      outPath,
    ]);
    ff.on('close', () => resolve());
    ff.on('error', () => resolve());
  });
  try {
    const st = await stat(outPath);
    if (st.isFile() && st.size > 100) return outPath;
  } catch { /* failed */ }
  return null;
};

/** Convert a local public/ URL like /uploads/foo.jpg to a data URI so
 *  Remotion's Chromium can load it without hitting the Next.js dev server. */
const localUrlToDataUri = async (publicUrl: string): Promise<string | null> => {
  try {
    const decodedUrl = decodeURIComponent(publicUrl);
    const absPath = path.join(process.cwd(), 'public', decodedUrl);
    const buf = await readFile(absPath);
    const ext = path.extname(decodedUrl).toLowerCase().replace('.', '');
    const mimeMap: Record<string, string> = {
      jpg: 'image/jpeg',
      jpeg: 'image/jpeg',
      png: 'image/png',
      webp: 'image/webp',
      gif: 'image/gif',
      avif: 'image/avif',
    };
    const mime = mimeMap[ext] ?? 'image/jpeg';
    return `data:${mime};base64,${buf.toString('base64')}`;
  } catch (e: any) {
    console.error(`[localUrlToDataUri] Failed to read local asset: ${publicUrl}`, e.message || e);
    return null;
  }
};

const resolveMedia = async (
  slide: ChurchAdSlide & {
    mediaUrl?: string;
    mediaDataUri?: string;
    mediaType?: 'image' | 'video';
    isStock?: boolean;
  }
): Promise<{ url?: string; dataUri?: string; mediaType: 'image' | 'video' } | null> => {
  const isStock = slide.isStock || !!(slide.mediaUrl && (slide.mediaUrl.includes('stock-') || slide.mediaUrl.includes('stock')));
  const suffix = isStock ? '#stock' : '';

  if (slide.mediaUrl) {
    if (await isAssetUsable(slide.mediaUrl)) {
      const mediaType = slide.mediaType ?? 'image';
      if (mediaType === 'video' && slide.mediaUrl.startsWith('/')) {
        const absPath = path.join(process.cwd(), 'public', slide.mediaUrl);
        const fsPath = await ensureVideoFaststart(absPath);
        // Use still image fallback for render — more reliable than video in headless Chromium
        const stillAbs = await extractVideoStill(fsPath);
        if (stillAbs) {
          const dataUri = await localUrlToDataUri('/uploads/' + path.basename(stillAbs));
          if (dataUri) return { dataUri: dataUri + suffix, mediaType: 'image' };
        }
        return null; // video without still → gradient fallback
      }
      // Local image: embed as data URI so Remotion doesn't need the Next.js dev server
      if (mediaType === 'image' && slide.mediaUrl.startsWith('/')) {
        const dataUri = await localUrlToDataUri(slide.mediaUrl);
        if (dataUri) return { dataUri: dataUri + suffix, mediaType: 'image' };
      }
      return { url: slide.mediaUrl, mediaType };
    }
  }
  if (slide.mediaDataUri) {
    return { dataUri: slide.mediaDataUri + suffix, mediaType: slide.mediaType ?? 'image' };
  }
  if (slide.imageSearchQuery) {
    const m = await fetchPhoto(slide.imageSearchQuery);
    if (m) {
      slide.isStock = true;
      return { dataUri: m.dataUri + '#stock', mediaType: m.mediaType };
    }
  }
  return null;
};

export interface RenderStructure extends ChurchAdStructureResult {
  logoDataUri?: string;
  badge?: any;
  audioUrl?: string;
  audioDataUri?: string;
  audioDurationSec?: number;
  bgmUrl?: string;
  bgmDataUri?: string;
  bgmVolume?: number;
  bgmTrackDurationSec?: number;
  sceneDurationsSec?: number[];
}

export interface StartRenderOptions {
  skipTts?: boolean;
  previewOnly?: boolean;
  audioMode?: 'voice-bgm' | 'bgm-only' | 'voice-only' | 'video-audio' | 'silent';
}

/**
 * Compute the frame range for each slide based on sceneDurationsSec (or even
 * split of total audio duration). Mirrors the math inside ChurchAdReel so
 * boundaries line up exactly with what the preview shows.
 */
const computeFrameRanges = (
  durations: number[]
): Array<{ start: number; end: number; durationFrames: number }> => {
  const out: Array<{ start: number; end: number; durationFrames: number }> = [];
  let cursor = 0;
  for (const sec of durations) {
    const frames = Math.max(Math.round(sec * RENDER_FPS), Math.round(RENDER_FPS * 1.5));
    out.push({ start: cursor, end: cursor + frames - 1, durationFrames: frames });
    cursor += frames;
  }
  return out;
};

/**
 * The actual render driver. Exported so the optional child-process worker
 * (scripts/render-worker.mjs) can invoke it directly with a jobId.
 */
export const runRenderJob = async (
  jobId: string,
  structure: RenderStructure,
  options: StartRenderOptions = {}
): Promise<void> => {
  const startedAt = Date.now();
  const workerId = `${process.pid}-${randomUUID().slice(0, 8)}`;
  const renewLease = () =>
    update(jobId, {
      claimedBy: workerId,
      leaseExpiresAt: Date.now() + LEASE_MS,
    });

  try {
    const outDir = path.join(process.cwd(), 'out', `church-ad-${Date.now()}`);
    await mkdir(outDir, { recursive: true });
    await update(jobId, {
      status: 'preparing',
      step: '슬라이드 저장',
      progress: 0.05,
      outDir,
    });
    await renewLease();
    await writeFile(
      path.join(outDir, 'slides.json'),
      JSON.stringify(structure, null, 2),
      'utf-8'
    );

    await update(jobId, { step: '배경 미디어 로드', progress: 0.12 });
    const slideMedia = await Promise.all(
      structure.slides.map((s) => resolveMedia(s as any))
    );

    // Stage 1: prefetch any remaining external URLs so Chromium fetches stay
    // local during render.
    await update(jobId, { step: '외부 URL 캐시', progress: 0.18 });
    for (let i = 0; i < slideMedia.length; i++) {
      const m = slideMedia[i];
      if (m?.url && /^https?:\/\//i.test(m.url)) {
        const cached = await prefetchUrl(m.url, (s) => console.log('[prefetch]', s));
        if (cached) m.url = cached;
      }
    }

    // Audio resolution
    let audioForRender: string | undefined;
    if (structure.audioUrl && (await isAssetUsable(structure.audioUrl))) {
      audioForRender = structure.audioUrl;
    } else if (structure.audioDataUri) {
      audioForRender = structure.audioDataUri;
    }
    let totalAudioSec = structure.audioDurationSec ?? 0;
    let sceneDurationsSec: number[] | undefined = structure.sceneDurationsSec;

    const audioMode = options.audioMode ?? 'voice-bgm';

    // ── video-audio mode: extract original audio from uploaded video slides ──
    if (audioMode === 'video-audio') {
      await update(jobId, { step: '영상 원본 음성 추출', progress: 0.28 });
      const durations = sceneDurationsSec && sceneDurationsSec.length === structure.slides.length
        ? sceneDurationsSec
        : structure.slides.map((s) => (s as any).durationSec ?? 6);
      const audioDir = path.join(process.cwd(), 'public', 'audio');
      await mkdir(audioDir, { recursive: true });
      const perSlideAudios: string[] = [];
      let allSilent = true;
      for (let i = 0; i < structure.slides.length; i++) {
        const slide = structure.slides[i] as any;
        const targetSec = durations[i] ?? 6;
        let extracted = false;
        // Try original mediaUrl (before still-image conversion).
        // Prefer .orig.mp4 which retains the original audio track.
        const rawUrl = slide.mediaUrl as string | undefined;
        if (rawUrl && rawUrl.startsWith('/') && /\.(mp4|mov|webm)$/i.test(rawUrl)) {
          const origUrl = rawUrl.replace(/\.mp4$/i, '.orig.mp4');
          const origAbs = path.join(process.cwd(), 'public', origUrl);
          let absPath: string;
          try {
            const st = await stat(origAbs);
            absPath = st.isFile() && st.size > 0 ? origAbs : path.join(process.cwd(), 'public', rawUrl);
          } catch {
            absPath = path.join(process.cwd(), 'public', rawUrl);
          }
          const outWav = path.join(audioDir, `vid-audio-${jobId}-${i}.wav`);
          const result = await extractVideoAudio(absPath, targetSec, outWav);
          if (result) { perSlideAudios.push(result); extracted = true; allSilent = false; }
        }
        if (!extracted) {
          // Generate silence for this slide duration
          const silenceWav = path.join(audioDir, `silence-${jobId}-${i}.wav`);
          await new Promise<void>((resolve) => {
            const ff = spawn('ffmpeg', [
              '-y', '-f', 'lavfi', '-i', `anullsrc=r=44100:cl=stereo`,
              '-t', targetSec.toFixed(3), silenceWav,
            ]);
            ff.on('close', () => resolve());
            ff.on('error', () => resolve());
          });
          perSlideAudios.push(silenceWav);
        }
      }
      if (!allSilent) {
        const concatWav = path.join(audioDir, `vid-audio-concat-${jobId}.wav`);
        const result = await concatAudioFiles(perSlideAudios, concatWav);
        if (result) {
          audioForRender = `/audio/${path.basename(concatWav)}`;
          totalAudioSec = durations.reduce((a, d) => a + d, 0);
          sceneDurationsSec = durations;
        }
      }
      // No BGM in video-audio mode (original audio is the sound design)
    }

    if (!audioForRender && !options.skipTts && audioMode !== 'video-audio' && audioMode !== 'bgm-only' && audioMode !== 'silent') {
      await update(jobId, { step: 'TTS 음성 합성', progress: 0.3 });
      const speakerNotes = structure.slides.map((s) => s.speakerNote);
      const segments = await synthesizeSegments(speakerNotes, { voiceName: 'Kore' });
      totalAudioSec =
        segments.reduce((a, x) => a + x.durationSec, 0) +
        SCENE_GAP_SEC * Math.max(0, segments.length - 1);
      const concatenated = concatenateWavs(
        segments.map((s) => s.audioBuffer),
        SCENE_GAP_SEC
      );
      const audioFile = `${randomUUID()}.wav`;
      await mkdir(path.join(process.cwd(), 'public', 'audio'), { recursive: true });
      await writeFile(
        path.join(process.cwd(), 'public', 'audio', audioFile),
        concatenated
      );
      audioForRender = `/audio/${audioFile}`;
      sceneDurationsSec = segments.map(
        (s, i) => s.durationSec + (i < segments.length - 1 ? SCENE_GAP_SEC : 0)
      );
    } else if (audioForRender) {
      await update(jobId, { step: '기존 음성 재사용', progress: 0.3 });
    }

    // BGM resolution (skipped in video-audio mode — original sound is used)
    let bgmForRender: string | undefined;
    if (audioMode !== 'video-audio' && audioMode !== 'voice-only') {
      if (structure.bgmUrl && (await isAssetUsable(structure.bgmUrl))) {
        bgmForRender = structure.bgmUrl;
      } else if (structure.bgmDataUri) {
        // data: URIs can't be passed to ffmpeg — save to file first.
        const m = structure.bgmDataUri.match(/^data:[^;]+;base64,(.+)$/);
        if (m) {
          const bgmFile = `${randomUUID()}.wav`;
          await mkdir(path.join(process.cwd(), 'public', 'bgm'), { recursive: true });
          await writeFile(path.join(process.cwd(), 'public', 'bgm', bgmFile), Buffer.from(m[1], 'base64'));
          bgmForRender = `/bgm/${bgmFile}`;
        }
      }
    }
    let bgmVolume = structure.bgmVolume ?? 0.1;
    let bgmTrackDurationSec: number | undefined = structure.bgmTrackDurationSec;

    if (!bgmForRender && audioMode !== 'video-audio' && audioMode !== 'voice-only' && audioMode !== 'silent') {
      await update(jobId, { step: 'BGM 검색/생성', progress: 0.4 });
      try {
        const bgm = await fetchBgm({
          mood: moodMap[structure.bgmMood] ?? 'calm',
          searchQuery: structure.musicSearchQuery,
          genPrompt: structure.musicGenPrompt,
        });
        const bgmDU = await bgmToDataUri(bgm, (totalAudioSec || 60) + 3);
        const bgmFile = `${randomUUID()}.wav`;
        await mkdir(path.join(process.cwd(), 'public', 'bgm'), { recursive: true });
        const m = bgmDU.dataUri.match(/^data:[^;]+;base64,(.+)$/);
        if (m) {
          await writeFile(
            path.join(process.cwd(), 'public', 'bgm', bgmFile),
            Buffer.from(m[1], 'base64')
          );
          bgmForRender = `/bgm/${bgmFile}`;
        } else {
          bgmForRender = bgmDU.dataUri;
        }
        bgmTrackDurationSec = bgmDU.durationSec;
        bgmVolume = bgm.volume ?? 0.1;
      } catch {
        // BGM optional
      }
    } else {
      await update(jobId, { step: '기존 BGM 재사용', progress: 0.4 });
    }

    // ── Build per-slide input props ────────────────────────────────────
    const slidesWithMedia = structure.slides.map((slide, i) => {
      const m = slideMedia[i];
      return {
        ...slide,
        mediaDataUri: m?.url ?? m?.dataUri,
        mediaType: m?.mediaType ?? 'image',
      };
    });
    const slidesForRender = enforceEntryEffectVariety(slidesWithMedia);

    // Durations used by both computeFrameRanges (server) and calculateMetadata (Remotion).
    // Must match exactly — derive from sceneDurationsSec if available, else from
    // slide.durationSec, else fall back to even split / 8s default.
    // When TTS-derived durations are shorter than the intended durationSec, use the
    // larger of the two so slides are never shorter than the editor intended.
    const rawSceneDurations: number[] =
      sceneDurationsSec && sceneDurationsSec.length === slidesForRender.length
        ? sceneDurationsSec
        : slidesForRender.every((s) => typeof (s as any).durationSec === 'number')
        ? slidesForRender.map((s) => (s as any).durationSec as number)
        : Array(slidesForRender.length).fill(
            totalAudioSec > 0 ? totalAudioSec / slidesForRender.length : 8
          );
    // Enforce minimum: never shorter than the slide's own durationSec.
    const finalSceneDurations: number[] = rawSceneDurations.map((dur, i) => {
      const intended = (slidesForRender[i] as any).durationSec;
      return typeof intended === 'number' ? Math.max(dur, intended) : dur;
    });
    const ranges = computeFrameRanges(finalSceneDurations);

    // Audio/BGM are stripped from sliceInputs — we mux them on later.
    // sceneDurationsSec MUST be passed so calculateMetadata computes the same
    // total duration as computeFrameRanges above — mismatch → "frame out of range".
    const sliceInputs = {
      title: structure.title,
      churchName: structure.churchName,
      slogan: structure.slogan,
      accentColor: structure.accentColor,
      backgroundColor: structure.backgroundColor,
      logoDataUri: structure.logoDataUri,
      badge: structure.badge,
      slides: slidesForRender,
      audioDurationSec: totalAudioSec,
      sceneDurationsSec: finalSceneDurations,
      bgmVolume,
      bgmTrackDurationSec,
      // audioUrl / bgmUrl deliberately omitted
    };

    await update(jobId, {
      status: 'rendering',
      step: '슬라이드 렌더',
      progress: 0.5,
      slidesTotal: slidesForRender.length,
      slidesDone: 0,
      slidesFailed: 0,
    });
    await renewLease();

    // ── Stage 3: render slides in parallel (max 2 at a time) with retry + cache ─
    const sliceDir = path.join(outDir, 'slices');
    await mkdir(sliceDir, { recursive: true });
    const slicePaths: string[] = new Array(slidesForRender.length);
    let slidesDone = 0;
    let slidesFailed = 0;

    // Build the bundle once with slide 0 before launching parallel workers,
    // so concurrent workers all reuse the same cached bundle.
    const PARALLEL = 2;

    const renderOneSlide = async (i: number, forceRebundle: boolean): Promise<void> => {
      const range = ranges[i];
      const hashKey = sliceHash({
        template: 'church-ad',
        slideIndex: i,
        durationInFrames: range.durationFrames,
        slide: slidesForRender[i],
        accentColor: structure.accentColor,
        backgroundColor: structure.backgroundColor,
        churchName: structure.churchName,
        logoDataUri: structure.logoDataUri,
        badge: structure.badge,
      });

      const sliceStart = Date.now();
      await recordEvent({ type: 'slice_start', jobId, slideIndex: i, ts: sliceStart });

      const cachedPath = await getCachedSlicePath(hashKey);
      const localPath = path.join(sliceDir, `slide-${i}.mp4`);
      let cached = false;

      if (cachedPath) {
        await copyFile(cachedPath, localPath);
        cached = true;
      } else {
        let attempt = 0;
        let lastError: Error | undefined;
        while (attempt <= MAX_SLIDE_RETRIES) {
          attempt++;
          try {
            await renderSlice({
              template: 'church-ad',
              inputProps: sliceInputs,
              frameRange: [range.start, range.end],
              outputPath: localPath,
              forceRebundle: attempt === 1 ? forceRebundle : true,
            });
            await storeSlice(hashKey, localPath);
            lastError = undefined;
            break;
          } catch (e: any) {
            lastError = e instanceof Error ? e : new Error(String(e));
            await recordEvent({
              type: 'slice_failed',
              jobId, slideIndex: i, ts: Date.now(),
              durationMs: Date.now() - sliceStart,
              error: lastError.message, attempt,
            });
            if (attempt > MAX_SLIDE_RETRIES) break;
          }
        }

        if (lastError) {
          slidesFailed++;
          await persistFailure(jobId, i, {
            error: lastError.message,
            stack: lastError.stack,
            inputProps: { slide: slidesForRender[i], frameRange: [range.start, range.end] },
          });
          await update(jobId, { slidesFailed });
          throw new Error(`slide ${i} failed after ${MAX_SLIDE_RETRIES + 1} attempts: ${lastError.message}`);
        }
      }

      slicePaths[i] = localPath;
      const mem = process.memoryUsage();
      await recordEvent({
        type: 'slice_done', jobId, slideIndex: i,
        ts: Date.now(), durationMs: Date.now() - sliceStart,
        cached, rssBytes: mem.rss,
      });

      slidesDone++;
      const sliceProgress = 0.5 + 0.35 * (slidesDone / slidesForRender.length);
      await update(jobId, {
        slidesDone,
        progress: sliceProgress,
        step: cached
          ? `슬라이드 ${slidesDone}/${slidesForRender.length} (캐시)`
          : `슬라이드 ${slidesDone}/${slidesForRender.length} 렌더`,
      });
      await renewLease();
    };

    // Render slide 0 first to warm the bundle, then remaining slides in batches.
    await renderOneSlide(0, true);
    const remaining = Array.from({ length: slidesForRender.length - 1 }, (_, k) => k + 1);
    for (let b = 0; b < remaining.length; b += PARALLEL) {
      await Promise.all(remaining.slice(b, b + PARALLEL).map((i) => renderOneSlide(i, false)));
    }

    // ── Stage 3: ffmpeg concat slides ──────────────────────────────────
    await update(jobId, { step: '슬라이드 합치기', progress: 0.88 });
    const concatPath = path.join(outDir, 'concat.mp4');
    await concatVideos(slicePaths, concatPath, (s) => console.log('[ffmpeg concat]', s));

    // Resolve audio/bgm to absolute file paths for ffmpeg mux.
    const toAbs = (publicUrl: string | undefined): string | undefined => {
      if (!publicUrl) return undefined;
      if (publicUrl.startsWith('data:')) return undefined; // ffmpeg can't read data: URIs
      if (publicUrl.startsWith('/')) return path.join(process.cwd(), 'public', publicUrl);
      return publicUrl;
    };

    await update(jobId, { step: '오디오 믹스', progress: 0.94 });
    const finalLocalName = `reel-church-ad-${Date.now()}.mp4`;
    const reelsDir = path.join(process.cwd(), 'public', 'reels');
    await mkdir(reelsDir, { recursive: true });
    const finalLocalPath = path.join(reelsDir, finalLocalName);
    await muxAudio(
      concatPath,
      toAbs(audioForRender),
      toAbs(bgmForRender),
      bgmVolume,
      finalLocalPath,
      (s) => console.log('[ffmpeg mux]', s)
    );

    // Copy a stable name into the job's outDir for archival.
    await copyFile(finalLocalPath, path.join(outDir, 'church-ad.mp4'));
    // Clean intermediate concat to save disk.
    try {
      await unlink(concatPath);
    } catch {
      /* ignore */
    }

    await recordEvent({
      type: 'job_done',
      jobId,
      ts: Date.now(),
      totalMs: Date.now() - startedAt,
      slideCount: slidesForRender.length,
    });

    await update(jobId, {
      status: 'ready',
      progress: 1,
      step: '완료',
      videoUrl: `/reels/${finalLocalName}`,
      slidesDone,
      slidesFailed,
      claimedBy: undefined,
      leaseExpiresAt: undefined,
    });
  } catch (e: any) {
    const msg = e?.message ?? 'render failed';
    await recordEvent({ type: 'job_failed', jobId, ts: Date.now(), error: msg });
    await update(jobId, {
      status: 'failed',
      step: '실패',
      error: msg,
      claimedBy: undefined,
      leaseExpiresAt: undefined,
    });
  }
};

/**
 * Stage 2: enqueue a render. Set RENDER_WORKER=spawn to run the render in a
 * separate Node process via scripts/render-worker.mjs (crash-isolated). The
 * default 'inproc' mode keeps the existing dev UX intact.
 */
export const startRender = (
  structure: RenderStructure,
  options: StartRenderOptions = {}
): string => {
  const id = randomUUID();
  const job: RenderJob = {
    id,
    status: 'pending',
    progress: 0,
    step: '대기 중',
    createdAt: Date.now(),
    updatedAt: Date.now(),
    slidesTotal: structure.slides?.length ?? 0,
    slidesDone: 0,
    slidesFailed: 0,
  };

  // Synchronously seed in-memory + disk so the polling endpoint can find us
  // immediately. (Disk write is awaited inside, so we kick it off async.)
  jobs.set(id, job);
  void writeJobAtomic(job);

  // Persist structure separately so a worker process can pick it up.
  void (async () => {
    try {
      await mkdir(JOB_DIR, { recursive: true });
      await writeFile(
        path.join(JOB_DIR, `${id}.payload.json`),
        JSON.stringify({ structure, options }),
        'utf-8'
      );
    } catch {
      // best-effort
    }
  })();

  // Default to spawn — keeps the Next dev server responsive while Remotion +
  // headless Chromium consume a full CPU core in a sibling Node. Set
  // RENDER_WORKER=inproc to fall back to the old in-process mode (useful when
  // debugging the render pipeline with the same V8 instance as Next).
  const mode = process.env.RENDER_WORKER || 'spawn';
  if (mode === 'spawn') {
    // Stage 2 — crash-isolated worker. If the child segfaults Chromium, the
    // Next process keeps serving. A separate reaper would re-claim expired
    // leases; for now a human can re-run.
    const workerScript = path.join(process.cwd(), 'scripts', 'render-worker.mjs');
    mkdirSync(JOB_DIR, { recursive: true });
    const logPath = path.join(JOB_DIR, `${id}.worker.log`);
    // openSync gives an immediately valid fd — createWriteStream opens lazily
    // and spawn rejects a stream whose fd is still null.
    const logFd = openSync(logPath, 'a');
    const nodeDir = path.dirname(process.execPath);
    const child = spawn(process.execPath, [workerScript, id], {
      detached: true,
      stdio: ['ignore', logFd, logFd],
      env: {
        ...process.env,
        PATH: `${nodeDir}:${process.env.PATH || ''}`,
        RENDER_WORKER: 'child',
      },
    });
    child.unref();
  } else {
    // Stage 2 fallback — in-process render. Run in background; never blocks
    // the HTTP response.
    void runRenderJob(id, structure, options);
  }

  return id;
};
