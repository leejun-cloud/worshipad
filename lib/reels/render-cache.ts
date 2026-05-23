// Per-slide render cache. A slide's MP4 is deterministic given its inputProps,
// duration, accent/background colors, and slideIndex — so we hash that tuple
// and reuse the file across retries. Stage 4 of the stability roadmap.
import { createHash } from 'crypto';
import { mkdir, stat, copyFile } from 'fs/promises';
import path from 'path';

const CACHE_DIR = path.join(process.cwd(), 'out', '.slice-cache');

export interface SliceCacheKey {
  template: string;
  slideIndex: number;
  durationInFrames: number;
  slide: unknown;
  // Globals the slide actually depends on (theme + branding only — audio/bgm
  // are added post-render, so they MUST NOT be in the key).
  accentColor?: string;
  backgroundColor?: string;
  churchName?: string;
  logoDataUri?: string;
  badge?: unknown;
}

const stableStringify = (obj: unknown): string => {
  const seen = new WeakSet();
  return JSON.stringify(obj, (_k, v) => {
    if (v && typeof v === 'object') {
      if (seen.has(v)) return undefined;
      seen.add(v);
      if (!Array.isArray(v)) {
        return Object.keys(v as object)
          .sort()
          .reduce<Record<string, unknown>>((acc, k) => {
            acc[k] = (v as Record<string, unknown>)[k];
            return acc;
          }, {});
      }
    }
    return v;
  });
};

export const sliceHash = (key: SliceCacheKey): string =>
  createHash('sha256').update(stableStringify(key)).digest('hex').slice(0, 24);

export const getCachedSlicePath = async (hash: string): Promise<string | null> => {
  const p = path.join(CACHE_DIR, `${hash}.mp4`);
  try {
    const s = await stat(p);
    if (s.isFile() && s.size > 0) return p;
  } catch {
    // miss
  }
  return null;
};

export const storeSlice = async (hash: string, srcPath: string): Promise<string> => {
  await mkdir(CACHE_DIR, { recursive: true });
  const dest = path.join(CACHE_DIR, `${hash}.mp4`);
  await copyFile(srcPath, dest);
  return dest;
};
