// Selects a backing music track based on classified content mood.
// Looks for mp3/wav files in public/bgm/{mood}/, picks one randomly.
// Falls back to public/bgm.wav if no mood-specific track found.

import { readdir, stat } from 'fs/promises';
import path from 'path';
import type { BgmMood } from './classify';

export interface BgmSelection {
  /** URL relative to public/ (e.g. "/bgm/calm/study.mp3") */
  publicUrl: string;
  /** Track duration in seconds (used by Remotion's BgmTrack to size the loop block) */
  durationSec: number;
  /** Mood the track was selected from */
  mood: BgmMood | 'default';
  /** Volume level recommendation (0.0-1.0) */
  volume: number;
}

const MOOD_VOLUMES: Record<BgmMood, number> = {
  energetic: 0.20,
  calm: 0.15,
  emotional: 0.13,
  news: 0.18,
  contemplative: 0.12,
};

const SUPPORTED_EXTS = new Set(['.mp3', '.wav', '.m4a', '.ogg']);

/** Read WAV duration from header (PCM only). Returns 0 for non-WAV. */
const getWavDurationSec = (filePath: string): Promise<number> => {
  return new Promise(async (resolve) => {
    try {
      const fs = await import('fs/promises');
      const buf = await fs.readFile(filePath);
      if (buf.subarray(0, 4).toString() !== 'RIFF') return resolve(0);
      const channels = buf.readUInt16LE(22);
      const sampleRate = buf.readUInt32LE(24);
      const bitsPerSample = buf.readUInt16LE(34);
      const dataSize = buf.readUInt32LE(40);
      const bps = (bitsPerSample / 8) * channels;
      resolve(bps && sampleRate ? dataSize / bps / sampleRate : 0);
    } catch {
      resolve(0);
    }
  });
};

/** Get duration via ffprobe (handles MP3, M4A, OGG). */
const getDurationViaFfprobe = (filePath: string): Promise<number> => {
  return new Promise((resolve) => {
    const { spawn } = require('child_process');
    const proc = spawn('ffprobe', [
      '-v', 'error',
      '-show_entries', 'format=duration',
      '-of', 'default=noprint_wrappers=1:nokey=1',
      filePath,
    ]);
    let out = '';
    proc.stdout.on('data', (d: Buffer) => (out += d.toString()));
    proc.on('exit', () => {
      const n = parseFloat(out.trim());
      resolve(isFinite(n) ? n : 0);
    });
    proc.on('error', () => resolve(0));
  });
};

const PUBLIC_DIR = path.join(process.cwd(), 'public');

/**
 * Select a BGM track for the given mood.
 * Tries public/bgm/{mood}/ folder first, falls back to public/bgm.wav.
 */
export const selectBgm = async (mood: BgmMood): Promise<BgmSelection> => {
  const moodDir = path.join(PUBLIC_DIR, 'bgm', mood);

  let pickedPath: string | null = null;
  try {
    const files = await readdir(moodDir);
    const audioFiles = files.filter(
      (f) => SUPPORTED_EXTS.has(path.extname(f).toLowerCase()) && !f.startsWith('.')
    );
    if (audioFiles.length > 0) {
      const pick = audioFiles[Math.floor(Math.random() * audioFiles.length)];
      pickedPath = path.join(moodDir, pick);
    }
  } catch {
    // Folder doesn't exist or unreadable
  }

  if (pickedPath) {
    const ext = path.extname(pickedPath).toLowerCase();
    const durationSec =
      ext === '.wav' ? await getWavDurationSec(pickedPath) : await getDurationViaFfprobe(pickedPath);

    const relativeUrl = '/' + path.relative(PUBLIC_DIR, pickedPath).replace(/\\/g, '/');
    return {
      publicUrl: relativeUrl,
      durationSec: durationSec || 60,
      mood,
      volume: MOOD_VOLUMES[mood],
    };
  }

  // Fallback to default bgm.wav
  const fallbackPath = path.join(PUBLIC_DIR, 'bgm.wav');
  let fallbackDuration = 18;
  try {
    await stat(fallbackPath);
    fallbackDuration = await getWavDurationSec(fallbackPath) || 18;
  } catch {
    // No fallback either
  }
  return {
    publicUrl: '/bgm.wav',
    durationSec: fallbackDuration,
    mood: 'default',
    volume: MOOD_VOLUMES[mood],
  };
};
