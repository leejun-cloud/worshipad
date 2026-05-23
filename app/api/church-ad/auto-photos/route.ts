import { NextResponse } from 'next/server';
import { fetchPhoto } from '@/lib/reels/photo-fetcher';
import { GoogleGenAI, Type } from '@google/genai';
import type { ChurchAdSlide } from '@/lib/church/church-ad-structure';
import { persistDataUri } from '@/lib/church/persist-media';

export const runtime = 'nodejs';
export const maxDuration = 300;

interface Body {
  slides: ChurchAdSlide[];
  /** When true, regenerate the search query even if the slide already has one. */
  refreshQueries?: boolean;
  /** When true, replace existing media. Default: only fill empty slots. */
  overwrite?: boolean;
}

const QUERY_SCHEMA = {
  type: Type.ARRAY,
  items: {
    type: Type.OBJECT,
    properties: {
      index: { type: Type.INTEGER },
      query: { type: Type.STRING },
    },
    required: ['index', 'query'],
  },
};

const refineQueries = async (slides: ChurchAdSlide[]): Promise<string[]> => {
  if (!process.env.GEMINI_API_KEY) return slides.map((s) => s.imageSearchQuery ?? '');
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  const model = process.env.GEMINI_MODEL || 'gemini-2.5-flash-preview-04-17';
  const list = slides
    .map((s, i) => `[${i}] type=${s.type} | heading="${s.heading}" | note="${s.speakerNote.slice(0, 60)}"`)
    .join('\n');
  const res = await ai.models.generateContent({
    model,
    contents: `각 교회 광고 슬라이드의 배경에 어울리는 무료 스톡 사진을 검색할 영문 키워드(2-4단어)를 제안하세요.\n사람보다는 분위기·장소(예배당, 빛, 자연, 군중, 차분한 인테리어 등) 중심으로.\n\n${list}\n\n반드시 모든 인덱스에 대해 응답하세요.`,
    config: {
      responseMimeType: 'application/json',
      responseSchema: QUERY_SCHEMA,
    },
  });
  const parsed = JSON.parse(res.text || '[]') as { index: number; query: string }[];
  const out = slides.map((s) => s.imageSearchQuery ?? '');
  for (const { index, query } of parsed) {
    if (index >= 0 && index < out.length) out[index] = query;
  }
  return out;
};

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Body;
    if (!Array.isArray(body?.slides) || body.slides.length === 0) {
      return NextResponse.json({ error: 'slides required' }, { status: 400 });
    }

    const slides = body.slides;
    const queries = body.refreshQueries
      ? await refineQueries(slides)
      : await refineQueries(
          slides.map((s) => (s.imageSearchQuery ? s : { ...s, imageSearchQuery: '' }))
        );

    const updated: ChurchAdSlide[] = [];
    let hits = 0;
    let misses = 0;

    for (let i = 0; i < slides.length; i++) {
      const slide = slides[i];
      const hasMedia = !!(slide.mediaUrl || slide.mediaDataUri);
      if (hasMedia && !body.overwrite) {
        updated.push(slide);
        continue;
      }
      const q = queries[i] || slide.imageSearchQuery;
      if (!q) {
        updated.push(slide);
        misses++;
        continue;
      }
      const media = await fetchPhoto(q);
      if (media) {
        const persisted = await persistDataUri(media.dataUri, media.mediaType, 'stock');
        updated.push({
          ...slide,
          imageSearchQuery: q,
          mediaUrl: persisted.url,
          mediaType: media.mediaType,
          mediaDataUri: undefined,
          isStock: true,
        });
        hits++;
      } else {
        updated.push({ ...slide, imageSearchQuery: q });
        misses++;
      }
    }

    return NextResponse.json({
      slides: updated,
      stats: { total: slides.length, hits, misses, queries },
    });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message ?? 'auto-photos failed' },
      { status: 500 }
    );
  }
}
