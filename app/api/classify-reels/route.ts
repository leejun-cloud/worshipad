import { NextRequest, NextResponse } from 'next/server';
import { classifyReels } from '@/lib/reels/classify';

export async function POST(request: NextRequest) {
  try {
    const { text } = await request.json();

    if (!text || typeof text !== 'string') {
      return NextResponse.json({ error: '유효한 텍스트가 필요합니다' }, { status: 400 });
    }

    const result = await classifyReels(text);

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error('[classify-reels] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '분류 실패' },
      { status: 500 }
    );
  }
}
