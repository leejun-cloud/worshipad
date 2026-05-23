import { NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { randomUUID } from 'crypto';
import { synthesizeSegments } from '@/lib/reels/tts';

export const runtime = 'nodejs';
export const maxDuration = 30;

const AUDIO_DIR = path.join(process.cwd(), 'public', 'audio');

interface Body {
  text: string;
  voiceId: string;
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Body;
    const text = (body.text ?? '').trim().slice(0, 200);
    const voiceId = body.voiceId ?? 'ko-KR-Wavenet-A';
    if (!text) return NextResponse.json({ error: 'text required' }, { status: 400 });

    await mkdir(AUDIO_DIR, { recursive: true });

    const [result] = await synthesizeSegments([text], { voiceName: voiceId });
    const fileName = `preview-${randomUUID()}.wav`;
    const filePath = path.join(AUDIO_DIR, fileName);
    await writeFile(filePath, result.audioBuffer);

    return NextResponse.json({ audioUrl: `/audio/${fileName}`, durationSec: result.durationSec });
  } catch (e: any) {
    return NextResponse.json({ error: e.message ?? 'voice-preview failed' }, { status: 500 });
  }
}
