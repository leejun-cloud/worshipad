import { GoogleGenAI } from '@google/genai';
import { mkdir, writeFile } from 'fs/promises';
import path from 'path';
import { convertNumerals } from './korean-numerals';

const DEFAULT_MODEL = 'gemini-2.5-flash-preview-tts';
const DEFAULT_VOICE = 'Kore';

export interface TTSOptions {
  voiceName?: string;
  model?: string;
}

export interface TTSResult {
  audioBuffer: Buffer;
  localPath: string;
  publicUrl: string;
  fileName: string;
  mimeType: string;
  durationSec: number;
}

const getWavDurationSec = (wavBuffer: Buffer): number => {
  // PCM WAV: read sample rate (offset 24), bits per sample (34), channels (22), data size (40)
  if (wavBuffer.length < 44 || wavBuffer.subarray(0, 4).toString() !== 'RIFF') {
    return 0;
  }
  const channels = wavBuffer.readUInt16LE(22);
  const sampleRate = wavBuffer.readUInt32LE(24);
  const bitsPerSample = wavBuffer.readUInt16LE(34);
  const dataSize = wavBuffer.readUInt32LE(40);
  const bytesPerSample = (bitsPerSample / 8) * channels;
  if (bytesPerSample === 0 || sampleRate === 0) return 0;
  return dataSize / bytesPerSample / sampleRate;
};

const parsePcmRateFromMime = (mime: string): number => {
  const match = mime.match(/rate=(\d+)/);
  return match ? Number(match[1]) : 24000;
};

const wrapPcmAsWav = (
  pcmBuffer: Buffer,
  sampleRate: number,
  bitsPerSample = 16,
  channels = 1
): Buffer => {
  const byteRate = (sampleRate * channels * bitsPerSample) / 8;
  const blockAlign = (channels * bitsPerSample) / 8;
  const dataSize = pcmBuffer.length;
  const fileSize = 44 + dataSize - 8;

  const header = Buffer.alloc(44);
  header.write('RIFF', 0);
  header.writeUInt32LE(fileSize, 4);
  header.write('WAVE', 8);
  header.write('fmt ', 12);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20);
  header.writeUInt16LE(channels, 22);
  header.writeUInt32LE(sampleRate, 24);
  header.writeUInt32LE(byteRate, 28);
  header.writeUInt16LE(blockAlign, 32);
  header.writeUInt16LE(bitsPerSample, 34);
  header.write('data', 36);
  header.writeUInt32LE(dataSize, 40);

  return Buffer.concat([header, pcmBuffer]);
};

export const synthesizeKoreanNarration = async (
  text: string,
  opts: TTSOptions = {}
): Promise<TTSResult> => {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY 미설정');
  }

  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  const model = opts.model || process.env.GEMINI_TTS_MODEL || DEFAULT_MODEL;
  const voiceName = opts.voiceName || DEFAULT_VOICE;

  const processedText = convertNumerals(text);

  const response = await ai.models.generateContent({
    model,
    contents: [{ parts: [{ text: processedText }] }],
    config: {
      responseModalities: ['AUDIO'],
      speechConfig: {
        voiceConfig: {
          prebuiltVoiceConfig: { voiceName },
        },
      },
    },
  });

  const part = response?.candidates?.[0]?.content?.parts?.[0];
  const inline = part?.inlineData;
  if (!inline?.data) {
    throw new Error('Gemini TTS 응답에 오디오 데이터 없음');
  }

  const mimeType = inline.mimeType || 'audio/L16;rate=24000';
  const rawBuffer = Buffer.from(inline.data, 'base64');

  // Gemini TTS returns raw PCM (audio/L16) — wrap in WAV header for playback
  let audioBuffer: Buffer;
  let extension: string;
  if (mimeType.includes('pcm') || mimeType.includes('L16')) {
    const sampleRate = parsePcmRateFromMime(mimeType);
    audioBuffer = wrapPcmAsWav(rawBuffer, sampleRate);
    extension = 'wav';
  } else if (mimeType.includes('mpeg') || mimeType.includes('mp3')) {
    audioBuffer = rawBuffer;
    extension = 'mp3';
  } else {
    audioBuffer = rawBuffer;
    extension = 'wav';
  }

  const fileName = `tts-${Date.now()}.${extension}`;
  const outDir = path.join(process.cwd(), 'public', 'tts');
  await mkdir(outDir, { recursive: true });
  const localPath = path.join(outDir, fileName);
  await writeFile(localPath, audioBuffer);

  const durationSec = extension === 'wav' ? getWavDurationSec(audioBuffer) : 0;

  return {
    audioBuffer,
    localPath,
    publicUrl: `/tts/${fileName}`,
    fileName,
    mimeType,
    durationSec,
  };
};

export interface TTSSegmentResult {
  audioBuffer: Buffer;
  durationSec: number;
}

/**
 * Synthesize each text segment separately. Used to align scene transitions
 * with narration timing in segmented videos (LIST template).
 * Runs sequentially to avoid rate limits, but each segment is fast.
 */
/**
 * Build a silent WAV (24kHz mono 16-bit PCM) of the given duration. Used as a
 * placeholder when a segment's text is empty — Gemini TTS rejects empty input
 * with a "Model tried to generate text" error, so we never call it.
 */
export const buildSilentWav = (durationSec: number): Buffer => {
  const sampleRate = 24000;
  const channels = 1;
  const bitsPerSample = 16;
  const samples = Math.max(1, Math.round(durationSec * sampleRate));
  const pcm = Buffer.alloc(samples * (bitsPerSample / 8) * channels);
  return wrapPcmAsWav(pcm, sampleRate, bitsPerSample, channels);
};

const isUsableTtsInput = (s: string): boolean => {
  const t = (s ?? '').trim();
  // Need actual readable content; pure punctuation or whitespace confuses the
  // TTS model into generating text instead of audio.
  return t.length > 0 && /[\p{L}\p{N}]/u.test(t);
};

export const synthesizeSegments = async (
  segments: string[],
  opts: TTSOptions = {}
): Promise<TTSSegmentResult[]> => {
  const results: TTSSegmentResult[] = [];
  for (const segment of segments) {
    const trimmed = (segment ?? '').trim();
    if (!isUsableTtsInput(trimmed)) {
      // Empty / non-textual segment → 0.6s silence placeholder.
      const buf = buildSilentWav(0.6);
      results.push({ audioBuffer: buf, durationSec: getWavDurationSec(buf) });
      continue;
    }
    try {
      const r = await synthesizeKoreanNarration(trimmed, opts);
      results.push({ audioBuffer: r.audioBuffer, durationSec: r.durationSec });
    } catch (e: any) {
      // If a single segment fails (e.g. the TTS model got confused), don't
      // abort the whole render — substitute silence the length of a typical
      // Korean reading of that text (~3.5 syllables/sec) so timing stays sane.
      console.warn(`[tts] segment failed: ${e?.message}. Using silence.`);
      const estDur = Math.max(1, Math.min(8, trimmed.length / 3.5));
      const buf = buildSilentWav(estDur);
      results.push({ audioBuffer: buf, durationSec: getWavDurationSec(buf) });
    }
  }
  return results;
};

/**
 * Concatenate multiple PCM-WAV buffers into a single WAV.
 * All inputs must have the same sample rate / channels / bit depth.
 * Adds optional silence (in seconds) between segments.
 */
export const concatenateWavs = (
  wavBuffers: Buffer[],
  silenceBetweenSec = 0
): Buffer => {
  if (wavBuffers.length === 0) return Buffer.alloc(0);
  if (wavBuffers.length === 1) return wavBuffers[0];

  // Read format from first buffer
  const first = wavBuffers[0];
  const channels = first.readUInt16LE(22);
  const sampleRate = first.readUInt32LE(24);
  const bitsPerSample = first.readUInt16LE(34);
  const bytesPerSample = (bitsPerSample / 8) * channels;
  const byteRate = sampleRate * bytesPerSample;

  // Extract PCM data from each buffer (skip 44-byte header)
  const dataParts: Buffer[] = [];
  const silenceBytes = Math.round(silenceBetweenSec * byteRate);
  const silence = silenceBytes > 0 ? Buffer.alloc(silenceBytes) : null;

  wavBuffers.forEach((buf, i) => {
    const data = buf.subarray(44);
    dataParts.push(data);
    if (silence && i < wavBuffers.length - 1) {
      dataParts.push(silence);
    }
  });

  const pcmCombined = Buffer.concat(dataParts);
  const dataSize = pcmCombined.length;
  const fileSize = 44 + dataSize - 8;

  const header = Buffer.alloc(44);
  header.write('RIFF', 0);
  header.writeUInt32LE(fileSize, 4);
  header.write('WAVE', 8);
  header.write('fmt ', 12);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20);
  header.writeUInt16LE(channels, 22);
  header.writeUInt32LE(sampleRate, 24);
  header.writeUInt32LE(byteRate, 28);
  header.writeUInt16LE(bytesPerSample, 32);
  header.writeUInt16LE(bitsPerSample, 34);
  header.write('data', 36);
  header.writeUInt32LE(dataSize, 40);

  return Buffer.concat([header, pcmCombined]);
};
