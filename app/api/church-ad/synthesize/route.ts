import { NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { randomUUID } from 'crypto';
import { synthesizeSegments, concatenateWavs, buildSilentWav } from '@/lib/reels/tts';
import { fetchBgm, bgmToDataUri } from '@/lib/reels/music-fetcher';
import type { ChurchAdSlide } from '@/lib/church/church-ad-structure';

export const runtime = 'nodejs';
export const maxDuration = 600;

const AUDIO_DIR = path.join(process.cwd(), 'public', 'audio');
const BGM_DIR = path.join(process.cwd(), 'public', 'bgm');

const dataUriToBuffer = (uri: string): Buffer => {
  const m = uri.match(/^data:[^;]+;base64,(.+)$/);
  if (!m) throw new Error('invalid data URI');
  return Buffer.from(m[1], 'base64');
};

interface Body {
  slides: ChurchAdSlide[];
  bgmMood?: 'reverent' | 'uplifting' | 'warm' | 'hopeful';
  musicSearchQuery?: string;
  musicGenPrompt?: string;
  /** Audio composition mode. Defaults to voice-bgm.
   *  - voice-bgm  : narration + BGM
   *  - bgm-only   : just BGM, no TTS
   *  - voice-only : just TTS, no BGM
   *  - silent     : nothing — caller should not call this route at all */
  audioMode?: 'voice-bgm' | 'bgm-only' | 'voice-only' | 'silent';
  /** Legacy flag — kept for back-compat, equivalent to audioMode='voice-only'. */
  skipBgm?: boolean;
  /** TTS voice name — e.g. 'ko-KR-Wavenet-A' or 'Kore'. Defaults to 'Kore'. */
  voiceId?: string;
}

const SCENE_GAP_SEC = 0.4;

const moodMap = {
  reverent: 'contemplative',
  uplifting: 'energetic',
  warm: 'emotional',
  hopeful: 'calm',
} as const;

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Body;
    if (!Array.isArray(body?.slides) || body.slides.length === 0) {
      return NextResponse.json({ error: 'slides required' }, { status: 400 });
    }

    await mkdir(AUDIO_DIR, { recursive: true });
    await mkdir(BGM_DIR, { recursive: true });

    const audioMode = body.audioMode ?? (body.skipBgm ? 'voice-only' : 'voice-bgm');
    const wantVoice = audioMode === 'voice-bgm' || audioMode === 'voice-only';
    const wantBgm = audioMode === 'voice-bgm' || audioMode === 'bgm-only';

    // ── TTS ─────────────────────────────────────────────────────────
    let audioUrl: string | undefined;
    let sceneDurationsSec: number[] | undefined;
    let totalAudioSec = 0;

    if (wantVoice) {
      const speakerNotes = body.slides.map(
        (s) => (s.speakerNote && s.speakerNote.trim()) || s.heading || s.subheading || s.cta || ''
      );
      const segments = await synthesizeSegments(speakerNotes, { voiceName: body.voiceId || 'Kore' });
      // Enforce minimum: slide duration is never shorter than intended durationSec.
      sceneDurationsSec = segments.map((s, i) => {
        const ttsDur = s.durationSec + (i < segments.length - 1 ? SCENE_GAP_SEC : 0);
        const intended = body.slides[i]?.durationSec ?? 0;
        return Math.max(ttsDur, intended);
      });
      totalAudioSec = sceneDurationsSec.reduce((a, b) => a + b, 0);

      // Pad EACH segment individually to exactly match `sceneDurationsSec[i]`
      const paddedSegments = segments.map((s, i) => {
        const targetDur = sceneDurationsSec![i];
        const padDur = targetDur - s.durationSec;
        if (padDur > 0.05) {
          return concatenateWavs([s.audioBuffer, buildSilentWav(padDur)]);
        }
        return s.audioBuffer;
      });

      // Combine padded segments with NO additional gap, since the padding includes it.
      let concatenated = concatenateWavs(paddedSegments, 0);
      const audioFile = `${randomUUID()}.wav`;
      await writeFile(path.join(AUDIO_DIR, audioFile), concatenated);
      audioUrl = `/audio/${audioFile}`;
    } else {
      // No TTS — use slide.durationSec for timing so the BGM/visual length
      // still respects per-slide pacing.
      sceneDurationsSec = body.slides.map((s) => s.durationSec ?? 6);
      totalAudioSec = sceneDurationsSec.reduce((a, b) => a + b, 0);
    }

    // ── BGM ─────────────────────────────────────────────────────────
    let bgmUrl: string | undefined;
    let bgmTrackDurationSec: number | undefined;
    let bgmSource: string | undefined;
    // When narration is absent, raise BGM volume so the video isn't silent.
    let bgmVolume = wantVoice ? 0.1 : 0.45;
    if (wantBgm) {
      try {
        const bgm = await fetchBgm({
          mood: moodMap[body.bgmMood ?? 'warm'] ?? 'calm',
          searchQuery: body.musicSearchQuery ?? undefined,
          genPrompt: body.musicGenPrompt ?? undefined,
        } as any);
        const dataUri = await bgmToDataUri(bgm, totalAudioSec + 3);
        const buf = dataUriToBuffer(dataUri.dataUri);
        const bgmFile = `${randomUUID()}.wav`;
        await writeFile(path.join(BGM_DIR, bgmFile), buf);
        bgmUrl = `/bgm/${bgmFile}`;
        bgmTrackDurationSec = dataUri.durationSec;
        bgmSource = bgm.source;
        bgmVolume = wantVoice ? (bgm.volume ?? 0.1) : Math.max(bgm.volume ?? 0.1, 0.4);
      } catch (e) {
        // BGM is optional
      }
    }

    return NextResponse.json({
      audioUrl,
      audioDurationSec: totalAudioSec,
      sceneDurationsSec,
      bgm: bgmUrl
        ? {
            url: bgmUrl,
            trackDurationSec: bgmTrackDurationSec,
            volume: bgmVolume,
            source: bgmSource,
          }
        : null,
    });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message ?? 'synthesize failed' },
      { status: 500 }
    );
  }
}
