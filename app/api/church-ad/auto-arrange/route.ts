import { NextResponse } from 'next/server';
import { autoStoryboard, type MediaLibraryItem } from '@/lib/church/auto-storyboard';
import type { ChurchProfile } from '@/lib/church/church-ad-structure';

export const runtime = 'nodejs';
export const maxDuration = 300;

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as {
      script: string;
      library: MediaLibraryItem[];
      profile?: ChurchProfile;
      titleHint?: string;
      verbatim?: boolean;
    };
    // Script is now OPTIONAL — photo-only mode is allowed. Library is the
    // primary input; AI captions photos and writes ad copy from them.
    if (!Array.isArray(body.library) || body.library.length === 0) {
      return NextResponse.json({ error: 'library is required (≥1 photo/video)' }, { status: 400 });
    }
    const photoOnly = !body.script || body.script.trim().length < 20;
    const result = await autoStoryboard(
      body.script ?? '',
      body.library,
      body.profile,
      body.titleHint,
      { verbatim: photoOnly ? false : (body.verbatim ?? true) }
    );
    return NextResponse.json(result);
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message ?? 'auto-arrange failed' },
      { status: 500 }
    );
  }
}
