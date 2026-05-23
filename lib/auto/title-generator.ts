// Generate viral titles using 6 proven hook patterns + AI ranking.
// Korean-optimized adaptations of TikTok/Shorts hook formulas.

import { GoogleGenAI, Type } from '@google/genai';

const SYSTEM_PROMPT = `당신은 한국 SNS 콘텐츠 후킹 전문가입니다.
주제를 받아서 시청자가 스크롤을 멈추고 끝까지 볼 만한 강력한 후킹 제목을 만듭니다.

[★ 가장 중요한 원칙]
첫 3-5단어가 모든 것을 결정합니다. 시청자는 이 짧은 시간에 계속 볼지 스킵할지 정해요.

[6가지 검증된 후킹 패턴]
1. **충격/미스터리** — "당신이 몰랐던...", "이거 모르면 손해...", "충격적인 사실..."
2. **수치/통계** — "97%가 모르는...", "단 3분 만에...", "1000명 중 1명만 아는..."
3. **직접 질문** — "혹시 알고 계셨나요?", "왜 사람들은 ~할까?", "당신은 어떤 타입?"
4. **긴급성** — "스크롤 내리기 전에 보세요", "지금 당장 멈추세요", "이게 마지막 기회"
5. **권위** — "10년 경력자가 알려준...", "전문가만 아는...", "교사가 절대 안 알려주는..."
6. **반전/모순** — "다들 X 라고 하지만, 사실은...", "이거 정상 같지만, 실제론...", "모두가 틀렸다"

[제목 작성 규칙]
- 길이 30자 이내 (모바일에서 안 잘림)
- 구체적 숫자 사용 ("몇 가지" → "5가지", "잠깐" → "30초")
- 한국어 자연스러운 어투 (번역체 X)
- 호기심 유발하되 어그로/낚시는 피함
- 끝에 "..." 사용 OK (다음을 보고 싶게)

[권력 단어]
비밀, 진짜, 충격, 절대, 반드시, 단 한 번, 처음 공개, 이거 하나로, 알고 보면, 사실은`;

const TITLE_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    titles: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
    },
  },
  required: ['titles'],
};

export const generateViralTitles = async (
  topic: string,
  count = 8,
  contextHint?: string
): Promise<string[]> => {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY 미설정');
  }

  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  const model = process.env.GEMINI_MODEL || 'gemini-3-flash-preview';

  const userPrompt = `주제: "${topic}"${contextHint ? `\n\n참고 정보:\n${contextHint}` : ''}

위 주제로 6가지 후킹 패턴을 활용해 **${count}개**의 서로 다른 제목을 만드세요.
- 같은 패턴 반복 X (각 제목이 다른 패턴)
- 단조롭지 않게 (수치, 질문, 충격 골고루)
- 한국어, 30자 이내`;

  const res = await ai.models.generateContent({
    model,
    contents: userPrompt,
    config: {
      systemInstruction: SYSTEM_PROMPT,
      responseMimeType: 'application/json',
      responseSchema: TITLE_SCHEMA,
    },
  });

  const parsed = JSON.parse(res.text || '{}');
  return Array.isArray(parsed.titles) ? parsed.titles : [];
};

const RANKING_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    bestTitleIndex: { type: Type.INTEGER },
    score: { type: Type.INTEGER },
    reason: { type: Type.STRING },
  },
  required: ['bestTitleIndex', 'score', 'reason'],
};

export interface TitleRanking {
  bestTitle: string;
  score: number;
  reason: string;
  allTitles: string[];
}

export const pickBestTitle = async (titles: string[]): Promise<TitleRanking> => {
  if (titles.length === 0) {
    throw new Error('No titles to rank');
  }
  if (titles.length === 1) {
    return { bestTitle: titles[0], score: 7, reason: '단일 후보', allTitles: titles };
  }

  if (!process.env.GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY 미설정');
  }

  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  const model = process.env.GEMINI_MODEL || 'gemini-3-flash-preview';

  const numbered = titles.map((t, i) => `${i}. ${t}`).join('\n');

  const prompt = `당신은 한국 SNS 후킹 전문가입니다.
아래 제목 목록 중 시청자가 가장 클릭할 만한 것을 골라주세요.

평가 기준:
- 첫 3단어 임팩트
- 호기심 유발 강도
- 명확한 가치 제안
- 어그로/낚시 아닌 진짜 매력

제목 목록:
${numbered}

JSON 응답:
{
  "bestTitleIndex": (0-${titles.length - 1}),
  "score": 1-10 점수,
  "reason": "선택 이유 한 문장"
}`;

  const res = await ai.models.generateContent({
    model,
    contents: prompt,
    config: {
      responseMimeType: 'application/json',
      responseSchema: RANKING_SCHEMA,
    },
  });

  const parsed = JSON.parse(res.text || '{}');
  const idx = parsed.bestTitleIndex ?? 0;
  return {
    bestTitle: titles[Math.max(0, Math.min(idx, titles.length - 1))],
    score: parsed.score ?? 7,
    reason: parsed.reason ?? '',
    allTitles: titles,
  };
};

/** End-to-end: generate N titles, pick best. */
export const generateAndPickTitle = async (
  topic: string,
  candidateCount = 8,
  contextHint?: string
): Promise<TitleRanking> => {
  const titles = await generateViralTitles(topic, candidateCount, contextHint);
  return pickBestTitle(titles);
};
