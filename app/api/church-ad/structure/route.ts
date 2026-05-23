import { NextResponse } from 'next/server';
import { structureChurchAd, type ChurchProfile } from '@/lib/church/church-ad-structure';

export const runtime = 'nodejs';
export const maxDuration = 300;

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as {
      text: string;
      profile?: ChurchProfile;
      titleHint?: string;
      verbatim?: boolean;
    };
    if (!body?.text || body.text.trim().length === 0) {
      return NextResponse.json({ error: 'text is required' }, { status: 400 });
    }
    const result = await structureChurchAd(body.text, body.profile, body.titleHint, {
      verbatim: body.verbatim ?? true, // default ON — preserve user's text
    });
    return NextResponse.json(result);
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message ?? 'structure failed' },
      { status: 500 }
    );
  }
}
