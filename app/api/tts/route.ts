import { NextRequest, NextResponse } from 'next/server';
import { synthesizeKoreanNarration } from '@/lib/reels/tts';

export async function POST(request: NextRequest) {
  try {
    const { text, voiceName, model } = await request.json();

    if (!text || typeof text !== 'string') {
      return NextResponse.json({ error: '유효한 텍스트 필요' }, { status: 400 });
    }

    const result = await synthesizeKoreanNarration(text, { voiceName, model });

    return NextResponse.json({
      success: true,
      audioUrl: result.publicUrl,
      fileName: result.fileName,
      sizeBytes: result.audioBuffer.length,
      mimeType: result.mimeType,
    });
  } catch (error) {
    console.error('[tts] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'TTS 생성 실패' },
      { status: 500 }
    );
  }
}
