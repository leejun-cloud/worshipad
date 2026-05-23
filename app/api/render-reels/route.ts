import { NextRequest, NextResponse } from 'next/server';
import { renderReel, COMPOSITION_MAP, ReelsTemplate } from '@/lib/reels/render';

export async function POST(request: NextRequest) {
  try {
    const { template, data } = await request.json();

    if (!template || !(template in COMPOSITION_MAP)) {
      return NextResponse.json(
        { error: `지원하지 않는 템플릿: ${template}. 지원: ${Object.keys(COMPOSITION_MAP).join(', ')}` },
        { status: 400 }
      );
    }

    if (!data || typeof data !== 'object') {
      return NextResponse.json({ error: 'data 필드 필요' }, { status: 400 });
    }

    const result = await renderReel({ template: template as ReelsTemplate, data });

    return NextResponse.json({
      success: true,
      videoUrl: result.publicUrl,
      fileName: result.fileName,
    });
  } catch (error) {
    console.error('[render-reels] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '렌더링 실패' },
      { status: 500 }
    );
  }
}
