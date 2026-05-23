import { NextResponse } from 'next/server';
import { fetchPhoto } from '@/lib/reels/photo-fetcher';
import { persistDataUri } from '@/lib/church/persist-media';

export const runtime = 'nodejs';
export const maxDuration = 30;

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const query = (url.searchParams.get('q') || '').trim();
    if (!query) {
      return NextResponse.json({ error: 'q is required' }, { status: 400 });
    }
    const media = await fetchPhoto(query);
    if (!media) {
      return NextResponse.json({ media: null });
    }
    // Persist to /public/uploads so the editor only stores a URL.
    const persisted = await persistDataUri(media.dataUri, media.mediaType, 'stock');
    return NextResponse.json({
      media: {
        url: persisted.url,
        mediaType: media.mediaType,
        source: media.source,
        credit: media.credit,
      },
    });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? 'search failed' }, { status: 500 });
  }
}
