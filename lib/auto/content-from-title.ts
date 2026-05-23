// Generate full body content from a viral title.
// Output: structured Korean text suitable for the existing classify pipeline.

import { GoogleGenAI } from '@google/genai';

const SYSTEM_PROMPT = `당신은 한국어 SNS 콘텐츠 작가입니다.
주어진 제목에 맞는 30~60초 영상용 본문을 작성합니다.

[작성 원칙]
1. 사실 기반 작성 — 검증 가능한 정보, 통계, 실제 사례 활용
2. 구조화된 콘텐츠 — 도입, 본론(N가지 항목), 마무리
3. 자연스러운 한국어 — 번역체·과한 영어 단어 금지
4. 시청자 가치 — "내가 이걸 알면 뭐가 좋지?"에 즉시 답
5. 행동 유도 — 마지막에 시청자가 할 수 있는 행동 제시

[형식 권장]
- 제목 + 짧은 도입 (1-2줄, 후킹)
- 핵심 N가지 (3-5개 권장, 각 항목 제목 + 설명 1-2줄)
- 마무리 메시지

[금지 사항]
- 거짓·과장된 통계 (확실하지 않으면 수치 없이 작성)
- "충격적인" 같은 어그로성 부풀리기
- 익명 인용 ("어떤 전문가가...")
- 너무 일반적인 조언

[톤]
주제와 시청자에 맞춰 자동 조절 (자기계발은 동기부여형, 학습은 차분형 등).`;

const buildUserPrompt = (title: string, contextHint?: string): string => {
  return `제목: "${title}"${contextHint ? `\n\n관련 배경 정보:\n${contextHint}` : ''}

위 제목으로 30~60초 영상에 적합한 본문을 작성하세요.
- 도입(1-2줄) → 핵심 ${3 + Math.floor(Math.random() * 3)}가지 → 마무리 (1줄) 구조
- 각 핵심 항목은 짧은 제목 + 설명 1-2줄
- 한국어, 800자 이내`;
};

export const generateContentFromTitle = async (
  title: string,
  contextHint?: string
): Promise<string> => {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY 미설정');
  }

  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  const model = process.env.GEMINI_MODEL || 'gemini-3-flash-preview';

  const res = await ai.models.generateContent({
    model,
    contents: buildUserPrompt(title, contextHint),
    config: {
      systemInstruction: SYSTEM_PROMPT,
    },
  });

  const text = (res.text || '').trim();
  if (!text) {
    throw new Error('Gemini가 본문 생성 실패');
  }
  return text;
};
