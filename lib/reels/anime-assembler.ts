// FFmpeg-based video assembly for E-type anime pipeline.
// Combines WaveSpeed video clips + Gemini TTS audio + BGM into final MP4.

import { execSync } from 'child_process';
import { writeFile, readFile, unlink } from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FONTS_DIR = path.resolve(__dirname, '../../public/fonts');

const ffmpeg = (cmd: string): void => {
  execSync(`ffmpeg -y ${cmd}`, { stdio: ['ignore', 'ignore', 'pipe'] });
};

const ffmpegExists = (): boolean => {
  try {
    execSync('ffmpeg -version', { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
};

export interface SceneClip {
  videoPath: string;    // local path to visual-only MP4
  audioPath: string;    // local path to TTS WAV
  durationSec: number;
}

export interface SubtitleEntry {
  text: string;
  durationSec: number;
}

const toSrtTime = (sec: number): string => {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = Math.floor(sec % 60);
  const ms = Math.round((sec % 1) * 1000);
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')},${String(ms).padStart(3, '0')}`;
};

export const generateSrt = async (entries: SubtitleEntry[], outputPath: string): Promise<void> => {
  let cursor = 0;
  const lines: string[] = [];
  for (let i = 0; i < entries.length; i++) {
    const start = cursor;
    const end = cursor + entries[i].durationSec;
    lines.push(`${i + 1}`);
    lines.push(`${toSrtTime(start)} --> ${toSrtTime(end)}`);
    lines.push(entries[i].text);
    lines.push('');
    cursor = end;
  }
  await writeFile(outputPath, lines.join('\n'), 'utf-8');
};

export const burnSubtitles = (videoPath: string, srtPath: string, outputPath: string): void => {
  // Escape colons and backslashes in paths for FFmpeg filter syntax
  const escapedSrt = srtPath.replace(/\\/g, '/').replace(/:/g, '\\:');
  const style = [
    'FontName=Pretendard Bold',
    'FontSize=24',
    'PrimaryColour=&H00FFFFFF',
    'OutlineColour=&H00000000',
    'BackColour=&H80000000',
    'Outline=2',
    'Shadow=1',
    'Alignment=2',
    'MarginV=50',
    'Bold=1',
  ].join(',');
  ffmpeg(
    `-i "${videoPath}" ` +
    `-vf "subtitles='${escapedSrt}':fontsdir='${FONTS_DIR}':force_style='${style}'" ` +
    `-c:v libx264 -preset fast -crf 22 -c:a copy "${outputPath}"`
  );
};

/**
 * Combine visual video + TTS audio into a single scene clip.
 * Loops the video if it's shorter than the audio.
 */
export const combineSceneClip = async (
  clip: SceneClip,
  outputPath: string
): Promise<void> => {
  if (!ffmpegExists()) throw new Error('ffmpeg가 설치되어 있지 않습니다. brew install ffmpeg 실행 후 재시도하세요.');

  // Loop video to be slightly longer than audio, then trim to audio length
  ffmpeg(
    `-stream_loop -1 -i "${clip.videoPath}" ` +
    `-i "${clip.audioPath}" ` +
    `-c:v libx264 -c:a aac -shortest -t ${clip.durationSec + 0.5} ` +
    `-vf "scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2" ` +
    `"${outputPath}"`
  );
};

/**
 * Concatenate multiple scene clips into one video.
 */
export const concatenateClips = async (
  clipPaths: string[],
  outputPath: string,
  tempDir: string
): Promise<void> => {
  if (!ffmpegExists()) throw new Error('ffmpeg가 없습니다');

  const listFile = path.join(tempDir, `concat-${Date.now()}.txt`);
  const content = clipPaths.map((p) => `file '${p}'`).join('\n');
  await writeFile(listFile, content, 'utf-8');

  ffmpeg(`-f concat -safe 0 -i "${listFile}" -c:v libx264 -c:a aac "${outputPath}"`);

  await unlink(listFile).catch(() => {});
};

/**
 * Mix BGM underneath the main audio track.
 */
export const addBgm = async (
  videoPath: string,
  bgmPath: string,
  outputPath: string,
  bgmVolume = 0.1
): Promise<void> => {
  if (!ffmpegExists()) throw new Error('ffmpeg가 없습니다');

  ffmpeg(
    `-i "${videoPath}" -i "${bgmPath}" ` +
    `-filter_complex "[1:a]volume=${bgmVolume},apad[bgm];[0:a][bgm]amix=inputs=2:duration=first:dropout_transition=2[aout]" ` +
    `-map 0:v -map [aout] -c:v copy -c:a aac -ac 2 "${outputPath}"`
  );
};

/**
 * Full assembly: scene clips → merged → BGM → subtitles → final MP4.
 */
export const assembleAnimeVideo = async (opts: {
  sceneClips: SceneClip[];
  subtitleEntries?: SubtitleEntry[];
  bgmPath?: string;
  bgmVolume?: number;
  outputPath: string;
  tempDir: string;
}): Promise<void> => {
  const { sceneClips, subtitleEntries, bgmPath, bgmVolume = 0.1, outputPath, tempDir } = opts;

  // Step 1: Combine each scene (video + TTS audio)
  console.log(`  🎬 장면 합성 중... (${sceneClips.length}개 클립)`);
  const combinedPaths: string[] = [];
  for (let i = 0; i < sceneClips.length; i++) {
    const combined = path.join(tempDir, `scene-combined-${i}.mp4`);
    await combineSceneClip(sceneClips[i], combined);
    combinedPaths.push(combined);
    process.stdout.write(`     장면 ${i + 1}/${sceneClips.length} 완료\n`);
  }

  // Step 2: Concatenate
  const mergedPath = path.join(tempDir, 'merged.mp4');
  console.log('  🔗 클립 연결 중...');
  await concatenateClips(combinedPaths, mergedPath, tempDir);

  // Step 3: Generate SRT subtitles if provided
  let srtPath: string | undefined;
  if (subtitleEntries && subtitleEntries.length > 0) {
    srtPath = path.join(tempDir, 'subtitles.srt');
    await generateSrt(subtitleEntries, srtPath);
    console.log('  📝 자막 파일 생성');
  }

  // Step 4: Add BGM (optional)
  const beforeSubPath = path.join(tempDir, 'before-sub.mp4');
  if (bgmPath) {
    console.log('  🎵 BGM 믹싱 중...');
    await addBgm(mergedPath, bgmPath, srtPath ? beforeSubPath : outputPath, bgmVolume);
  } else {
    ffmpeg(`-i "${mergedPath}" -c copy "${srtPath ? beforeSubPath : outputPath}"`);
  }

  // Step 5: Burn in subtitles (optional)
  if (srtPath) {
    console.log('  💬 자막 합성 중...');
    burnSubtitles(bgmPath ? beforeSubPath : mergedPath, srtPath, outputPath);
  }
};
