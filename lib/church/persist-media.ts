// Persist a freshly-fetched data URI (from Pixabay/Pexels/etc.) into
// public/uploads/ so the editor only ever holds a /uploads/...jpg URL,
// never a multi-MB base64 string in localStorage or POST bodies.

import { writeFile, unlink, mkdir } from 'fs/promises';
import path from 'path';
import { randomUUID } from 'crypto';
import { spawn } from 'child_process';

const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads');

export interface PersistedMedia {
  url: string;
  mediaType: 'image' | 'video';
  source: string;
  credit: string;
}

const extFromMime = (mime: string): string => {
  if (mime.includes('jpeg')) return 'jpg';
  if (mime.includes('png')) return 'png';
  if (mime.includes('webp')) return 'webp';
  if (mime.includes('gif')) return 'gif';
  if (mime.includes('mp4')) return 'mp4';
  if (mime.includes('webm')) return 'webm';
  if (mime.includes('quicktime')) return 'mov';
  return 'bin';
};

/**
 * Re-encode an image through ffmpeg to guarantee RGB JPEG output.
 * Pixabay/Pexels images sometimes use CMYK color space or non-standard ICC
 * profiles that cause EncodingError in Chrome's canvas API (both browser
 * preview and headless render). ffmpeg normalises to sRGB JPEG automatically.
 * Falls back to the raw bytes if ffmpeg is unavailable or fails.
 */
const normalizeImageJpeg = (inputPath: string, outputPath: string): Promise<void> =>
  new Promise((resolve) => {
    const ff = spawn('ffmpeg', [
      '-y', '-i', inputPath,
      '-vf', 'scale=iw:ih',   // no-op scale to force decoder
      '-q:v', '2',             // high quality JPEG
      outputPath,
    ]);
    ff.on('close', () => resolve());
    ff.on('error', () => resolve());
  });

export const persistDataUri = async (
  dataUri: string,
  mediaType: 'image' | 'video',
  prefix = 'auto'
): Promise<{ url: string }> => {
  const m = dataUri.match(/^data:([^;]+);base64,(.+)$/);
  if (!m) throw new Error('invalid data URI');
  const mime = m[1];
  const buf = Buffer.from(m[2], 'base64');
  await mkdir(UPLOAD_DIR, { recursive: true });

  const isImage = mediaType === 'image';
  const id = randomUUID();

  if (isImage) {
    // Write raw bytes to a temp file, normalize to RGB JPEG, use result.
    const tmpFile = `${prefix}-${id}.tmp`;
    const finalFile = `${prefix}-${id}.jpg`;
    const tmpPath = path.join(UPLOAD_DIR, tmpFile);
    const finalPath = path.join(UPLOAD_DIR, finalFile);

    await writeFile(tmpPath, buf);
    await normalizeImageJpeg(tmpPath, finalPath);
    try { await unlink(tmpPath); } catch { /* ignore */ }

    // If ffmpeg failed (no output or too small), fall back to raw
    try {
      const { stat } = await import('fs/promises');
      const st = await stat(finalPath);
      if (st.size < 500) throw new Error('empty');
    } catch {
      await writeFile(finalPath, buf);
    }

    return { url: `/uploads/${finalFile}` };
  }

  const file = `${prefix}-${id}.${extFromMime(mime)}`;
  await writeFile(path.join(UPLOAD_DIR, file), buf);
  return { url: `/uploads/${file}` };
};
