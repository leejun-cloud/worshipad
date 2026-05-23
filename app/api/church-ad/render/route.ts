import { NextResponse } from 'next/server';
import { startRender } from '@/lib/church/render-jobs';
import type { ChurchAdStructureResult } from '@/lib/church/church-ad-structure';

export const runtime = 'nodejs';
export const maxDuration = 30; // job runs in background, this just returns the id

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as {
      structure: ChurchAdStructureResult & { logoDataUri?: string };
      skipTts?: boolean;
      audioMode?: 'voice-bgm' | 'bgm-only' | 'voice-only' | 'video-audio' | 'silent';
    };
    if (!body?.structure?.slides || body.structure.slides.length === 0) {
      return NextResponse.json({ error: 'structure.slides required' }, { status: 400 });
    }
    const jobId = startRender(body.structure, {
      skipTts: body.skipTts,
      audioMode: body.audioMode,
    });
    return NextResponse.json({ jobId });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? 'render failed' }, { status: 500 });
  }
}
