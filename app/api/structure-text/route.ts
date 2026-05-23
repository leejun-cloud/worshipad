import { OpenAI } from 'openai';
import { NextRequest, NextResponse } from 'next/server';

const KQCI_STRUCTURE_PROMPT = `다음 텍스트를 KQCI 구조로 변환해주세요.

KQCI 구조:
- K (Key): 핵심 메시지 (1-2줄)
- Q (Question): 핵심 질문 (1줄)
- C (Character/Characteristic): 품성/특징 (2-3줄)
- I (Implementation): 실행 방법 (2-3가지 포인트)

JSON 형식으로 다음과 같이 반환하세요:
{
  "key": "핵심 메시지",
  "question": "핵심 질문",
  "character": "품성/특징",
  "implementation": ["실행방법1", "실행방법2", "실행방법3"]
}

텍스트를 읽고 위 구조에 맞게 추출해서 반환하세요:`;

export async function POST(request: NextRequest) {
  try {
    const { text } = await request.json();

    if (!text || typeof text !== 'string') {
      return NextResponse.json(
        { error: '유효한 텍스트가 필요합니다' },
        { status: 400 }
      );
    }

    if (!process.env.OPENAI_API_KEY) {
      console.error('[v0] OPENAI_API_KEY is not set');
      return NextResponse.json(
        { error: 'API 키 설정 오류' },
        { status: 500 }
      );
    }

    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    const message = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: `${KQCI_STRUCTURE_PROMPT}\n\n텍스트:\n${text}`,
        },
      ],
    });

    // Extract text content from response
    const responseText = message.choices[0].message.content || '';

    // Parse JSON from response
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('응답 형식이 올바르지 않습니다');
    }

    const structuredData = JSON.parse(jsonMatch[0]);

    return NextResponse.json({
      success: true,
      ...structuredData,
      originalText: text,
    });
  } catch (error) {
    console.error('[v0] Error in structure-text API:', error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : '텍스트 구조화 실패',
      },
      { status: 500 }
    );
  }
}
