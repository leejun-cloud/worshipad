import { GoogleGenAI, Type } from '@google/genai';

export type ReelsTemplate = 'action' | 'emotion' | 'news' | 'insight' | 'list';

export interface ListItem {
  title: string;
  description: string;
  benefit?: string;
}

export type BgmMood = 'energetic' | 'calm' | 'emotional' | 'news' | 'contemplative';

export interface ClassifyResult {
  template: ReelsTemplate;
  data: Record<string, unknown>;
  narration: string;
  /**
   * Narration split per scene (for per-segment TTS to sync audio with scene transitions).
   * Order matches the scene order in the template:
   * - list: [intro, item1, item2, ..., itemN, close]
   * - action: [hook, impact, cta]
   * - emotion: [opening, story, message, closing]
   * - news: [headline, details, action]
   * - insight: [opening, quote, elaboration]
   */
  narrationSegments: string[];
  /**
   * Suggested BGM mood category (for selecting a backing track from public/bgm/{mood}/).
   */
  bgmMood: BgmMood;
  /**
   * Music search query for free music libraries (Jamendo, etc.).
   * Should be 2-4 English keywords that describe instrumentation + mood.
   * Example: "uplifting acoustic guitar", "calm piano lofi", "emotional cinematic strings"
   */
  musicSearchQuery: string;
  /**
   * Detailed text prompt for AI music generation (Lyria 2, Stable Audio).
   * Should describe genre, instruments, mood, tempo, energy.
   * Example: "Calm acoustic piano background music for educational content,
   * gentle melody, no vocals, mid tempo, warm and reflective tone"
   */
  musicGenPrompt: string;
}

const DEFAULT_MODEL = 'gemini-3-flash-preview';

const SYSTEM_INSTRUCTION = `당신은 한국어 숏폼 영상(릴스) 기획자입니다.
주어진 본문을 다음 5개 템플릿 중 가장 적합한 하나로 분류하고, 해당 템플릿의 **필수 필드만** 정확히 채우세요.

[템플릿 분류 기준]
- list: '5가지 방법', '7단계', 'N가지 비결' 처럼 **번호가 매겨진 항목 3개 이상**이 핵심인 콘텐츠. 각 항목이 별도 카드로 표시될 가치가 있을 때
- action: 단일 행동/실천 권유. 예) 챌린지, 캠페인, 운동·습관 권유 (항목이 적거나 한 가지 핵심 행동)
- emotion: 사람의 감정·공감을 자극하는 서사. 사연, 간증, 감동 스토리
- news: 행사·발표·공지 같은 정보 전달
- insight: 짧은 한 문장 통찰·명언

[필수 필드 — 선택된 템플릿의 필드만 채우고 나머지는 비워둘 것]
- list 선택 시: headline, hook, items (배열, 3-7개), cta
  · headline: 제목 (예: "AI 시대 교실 평가 5가지 방법")
  · hook: 도입 문제 제기 (1줄)
  · items[]: 각 항목 객체. **10가지 카드 스타일** 중 콘텐츠 성격에 가장 맞는 걸 골라서 배정하세요:
    - cardStyle: 'default' | 'stat' | 'quote' | 'bigdata' | 'split' | 'steps' | 'grid' | 'highlight' | 'statgrid' | 'iconfeature'

    [필수 필드 by 스타일 — 빠지면 default로 폴백됨]
    - 'default': title, description, benefit?
    - 'stat': title, description, **statValue** (예: "85%", "3배", "10분") — 단일 핵심 수치 강조
    - 'quote': **quote** (인용문, 1-2줄), attribution (출처/말한 사람) — 명언·간증
    - 'bigdata': title, **bigNumber** (예: "48.8"), **unit** (예: "조 원"), description — 시장규모·금액·인구
    - 'split': title, **leftLabel, leftBody, rightLabel, rightBody** (4개 모두 필수) — A vs B 비교
    - 'steps': title, **steps** (배열, 2-4개 단계 문자열) — 절차/프로세스
    - 'grid': title, **gridItems** (배열, 4개 {icon: 이모지, label: 짧은 라벨}) — 4가지 요소 정리
    - 'highlight': title, **emphasis** (강조할 핵심 한 문장, 10-25자), description — 임팩트 있는 한마디
    - 'statgrid': title, **miniStats** (배열, 2-4개 {value: "85%", label: "효과"}) — 여러 수치 한 번에
    - 'iconfeature': **icon** (적절한 이모지 1개), title, description — 아이콘으로 시각 강조

    **중요 규칙**:
    1. 5개 이상 항목이 있으면 **최소 3가지 다른 스타일** 섞어 쓰세요. 단조롭게 default만 쓰지 말 것
    2. 콘텐츠에 숫자가 있으면 stat·bigdata·statgrid 활용
    3. 콘텐츠에 단계가 있으면 steps 활용
    4. 콘텐츠에 핵심 한 문장이 있으면 highlight 활용
    5. 콘텐츠에 4개 카테고리/요소가 있으면 grid 활용
    6. 어떤 스타일을 선택했으면 **해당 스타일의 필수 필드를 빠짐없이** 채우세요 (특히 split는 4개 필드 전부)
    7. 이모지는 콘텐츠 주제에 맞게 적절히 (운동→🏃, 학습→📚, 비즈니스→💼, AI→🤖, 시간→⏰, 마음→💛 등)
  · cta: 마무리 행동 권유 (1줄)
- action 선택 시: problem, solution, benefit, cta
- emotion 선택 시: opening, story, message, closing
- news 선택 시: headline, when, where, what, action
- insight 선택 시: quote, elaboration, source(선택)

[중요 규칙]
1. 본문에 번호 매겨진 항목이 3개 이상 명확히 있으면 **반드시 list** 선택
2. 각 항목의 title은 핵심을 짧게(15자 이내), description은 한 줄로 풀어쓰기
3. benefit은 본문에 "효과:" 같은 표현이 있으면 그걸 활용, 없으면 추정해서 짧게 작성
4. 다른 템플릿의 필드는 채우지 말 것

[내레이션]
선택된 템플릿에 맞춰 자연스러운 한국어 내레이션을 작성하세요.
TTS가 읽었을 때 자연스럽도록 조사·어미를 다듬으세요.

**중요**: 내레이션은 두 가지 형식으로 모두 작성하세요:
1. \`narration\`: 전체를 이어 붙인 한 덩어리 텍스트
2. \`narrationSegments\`: 각 장면별로 분리된 배열 (영상에서 카드가 바뀌는 타이밍과 음성이 정확히 맞도록)

**narrationSegments 배열 길이는 템플릿의 장면 수와 정확히 일치해야 합니다:**
- list: [도입 안내, 항목1 설명, 항목2 설명, ..., 항목N 설명, 마무리 메시지] → 총 (N+2)개
- action: [문제 제기 멘트, 해결책+임팩트 멘트, 행동 명령 멘트] → 3개
- emotion: [도입 멘트, 이야기 본문, 핵심 메시지, 여운 멘트] → 4개
- news: [헤드라인 멘트, 정보 전달 멘트, 행동 권유 멘트] → 3개
- insight: [도입 멘트, 명언 낭독, 부연 설명] → 3개

각 segment는 해당 장면이 보여지는 동안 자연스럽게 들을 수 있는 길이로 작성하세요 (4-7초 분량 권장, 약 20-50자).
list의 각 item segment는 해당 항목의 핵심을 한두 문장으로 풀어서 설명하세요.

[★ BGM 관련 3개 필드]
1) bgmMood: 무드 카테고리 (5개 중 하나)
   - energetic: 운동·챌린지·동기부여·실천 권유 (드럼·업비트)
   - calm: 학습·정보·차분한 안내 (피아노·어쿠스틱)
   - emotional: 사연·감동·따뜻한 이야기 (스트링·잔잔한 멜로디)
   - news: 발표·공지·뉴스 톤 (코퍼레이트·중성)
   - contemplative: 명언·통찰·생각 전환 (앰비언트·미니멀)
   콘텐츠 톤을 가장 먼저 고려하고, 템플릿은 참고만 하세요.

2) musicSearchQuery: 무료 음악 사이트(Jamendo) 검색용 영어 키워드 2-4개
   포맷: "{instrument} {mood} {style}"
   예시:
   - "uplifting acoustic guitar"
   - "calm piano lofi"
   - "emotional cinematic strings"
   - "corporate background motivational"
   - "ambient minimal contemplative"

3) musicGenPrompt: AI 음악 생성용 영어 프롬프트 (Lyria 2)
   장르·악기·무드·템포·에너지를 구체적으로.
   예시:
   - "Calm acoustic piano background music for educational content, gentle melody, no vocals, mid tempo, warm and reflective tone"
   - "Uplifting electronic motivational track with driving drums and synth pad, instrumental, energetic, building progression"

[★★★ 내레이션 숫자 표기 규칙 — TTS가 자연스럽게 읽도록 반드시 지킬 것]
내레이션 안에서는 숫자를 **한글로 풀어 쓰세요**. 한글 표기를 우선하고, 단위가 한자어 발음이 자연스러우면 한자어 한글로 쓰세요.
- 가지/개/명/번째/시간/달/해 → 고유어(하나·둘·셋·넷·다섯·여섯·일곱·여덟·아홉·열)
  · "5가지" → "다섯 가지"
  · "3명" → "세 명"
  · "1번째" → "첫 번째"
- 분/초/월/일/년/원/킬로/미터 → 한자어 한글 (일·이·삼·사·오·육·칠·팔·구·십)
  · "5분" → "오 분"
  · "10년" → "십 년"
  · "3월 5일" → "삼월 오일"
- 첫째 둘째 셋째: "1번", "2번" → "첫째", "둘째", "셋째" (또는 "첫 번째", "두 번째"...)

**중요**: 화면(headline, items[].title 등)에 보이는 텍스트에는 숫자(5, 7) 그대로 써도 됩니다. 내레이션(narration 필드)에서만 한글로 풀어 쓰세요.

올바른 예시:
- 화면: "5가지 방법"
- 내레이션: "다섯 가지 방법을 소개합니다"

- 화면: "01" "02" "03"
- 내레이션: "첫째, ... 둘째, ... 셋째,"`;

const RESPONSE_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    template: { type: Type.STRING, enum: ['action', 'emotion', 'news', 'insight', 'list'] },
    data: {
      type: Type.OBJECT,
      properties: {
        // action
        problem: { type: Type.STRING },
        solution: { type: Type.STRING },
        benefit: { type: Type.STRING },
        cta: { type: Type.STRING },
        // emotion
        opening: { type: Type.STRING },
        story: { type: Type.STRING },
        message: { type: Type.STRING },
        closing: { type: Type.STRING },
        // news
        headline: { type: Type.STRING },
        when: { type: Type.STRING },
        where: { type: Type.STRING },
        what: { type: Type.STRING },
        action: { type: Type.STRING },
        // insight
        quote: { type: Type.STRING },
        elaboration: { type: Type.STRING },
        source: { type: Type.STRING },
        // list
        hook: { type: Type.STRING },
        items: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              description: { type: Type.STRING },
              benefit: { type: Type.STRING },
              cardStyle: {
                type: Type.STRING,
                enum: [
                  'default',
                  'stat',
                  'quote',
                  'bigdata',
                  'split',
                  'steps',
                  'grid',
                  'highlight',
                  'statgrid',
                  'iconfeature',
                ],
              },
              // stat
              statValue: { type: Type.STRING },
              // quote
              quote: { type: Type.STRING },
              attribution: { type: Type.STRING },
              // bigdata
              bigNumber: { type: Type.STRING },
              unit: { type: Type.STRING },
              // split
              leftLabel: { type: Type.STRING },
              leftBody: { type: Type.STRING },
              rightLabel: { type: Type.STRING },
              rightBody: { type: Type.STRING },
              // steps
              steps: { type: Type.ARRAY, items: { type: Type.STRING } },
              // grid
              gridItems: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    icon: { type: Type.STRING },
                    label: { type: Type.STRING },
                  },
                  required: ['icon', 'label'],
                },
              },
              // highlight
              emphasis: { type: Type.STRING },
              // statgrid
              miniStats: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    value: { type: Type.STRING },
                    label: { type: Type.STRING },
                  },
                  required: ['value', 'label'],
                },
              },
              // iconfeature
              icon: { type: Type.STRING },
            },
            required: ['title'],
          },
        },
      },
    },
    narration: { type: Type.STRING },
    narrationSegments: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
    },
    bgmMood: {
      type: Type.STRING,
      enum: ['energetic', 'calm', 'emotional', 'news', 'contemplative'],
    },
    musicSearchQuery: { type: Type.STRING },
    musicGenPrompt: { type: Type.STRING },
  },
  required: [
    'template',
    'data',
    'narration',
    'narrationSegments',
    'bgmMood',
    'musicSearchQuery',
    'musicGenPrompt',
  ],
};

const FIELDS_BY_TEMPLATE: Record<ReelsTemplate, string[]> = {
  action: ['problem', 'solution', 'benefit', 'cta'],
  emotion: ['opening', 'story', 'message', 'closing'],
  news: ['headline', 'when', 'where', 'what', 'action'],
  insight: ['quote', 'elaboration', 'source'],
  list: ['headline', 'hook', 'items', 'cta'],
};

const REQUIRED_BY_TEMPLATE: Record<ReelsTemplate, string[]> = {
  action: ['problem', 'solution', 'benefit', 'cta'],
  emotion: ['opening', 'story', 'message', 'closing'],
  news: ['headline', 'when', 'where', 'what', 'action'],
  insight: ['quote', 'elaboration'],
  list: ['headline', 'hook', 'items', 'cta'],
};

/**
 * Detect cardStyle from present fields when Gemini omitted it.
 */
const detectCardStyle = (item: any): string => {
  if (Array.isArray(item.steps) && item.steps.length >= 2) return 'steps';
  if (Array.isArray(item.gridItems) && item.gridItems.length >= 2) return 'grid';
  if (Array.isArray(item.miniStats) && item.miniStats.length >= 2) return 'statgrid';
  if (item.quote) return 'quote';
  if (item.emphasis) return 'highlight';
  if (item.leftLabel && item.rightLabel) return 'split';
  if (item.bigNumber) return 'bigdata';
  // Stat needs a numeric/percent-like value, not just any text
  if (item.statValue && /[\d%]/.test(String(item.statValue))) return 'stat';
  if (item.icon && /\p{Emoji}/u.test(String(item.icon))) return 'iconfeature';
  return 'default';
};

/**
 * Validate item required fields based on cardStyle.
 * Auto-fills missing fields when possible, otherwise demotes to 'default'.
 */
const validateAndCompleteItem = (item: any): any => {
  const out = { ...item };

  // Strip statValue/unit if they don't look like real stats (e.g. "자기평가"/"강조")
  // These confuse the renderer when Gemini misuses them as labels.
  if (out.statValue && !/[\d%]/.test(String(out.statValue))) {
    delete out.statValue;
  }

  // Auto-detect cardStyle if missing
  if (!out.cardStyle) {
    out.cardStyle = detectCardStyle(out);
  }

  const style = out.cardStyle || 'default';
  const desc = (out.description || out.benefit || out.title || '') as string;

  switch (style) {
    case 'stat':
      if (!out.statValue) out.cardStyle = 'default';
      break;

    case 'quote':
      if (!out.quote) {
        // If no quote, fall back to default
        out.cardStyle = 'default';
      } else if (!out.attribution) {
        out.attribution = out.title || '관련 자료';
      }
      break;

    case 'bigdata':
      if (!out.bigNumber) out.cardStyle = 'default';
      else if (!out.unit) out.unit = '';
      break;

    case 'split':
      // Smart fill for missing bodies
      if (!out.leftLabel || !out.rightLabel) {
        out.cardStyle = 'default';
        break;
      }
      if (!out.leftBody && desc) {
        out.leftBody = desc.slice(0, 60);
      }
      if (!out.rightBody && out.benefit) {
        out.rightBody = out.benefit;
      }
      // Last-resort defaults
      if (!out.leftBody) out.leftBody = '기존의 한계를 드러냄';
      if (!out.rightBody) out.rightBody = '새로운 가능성으로 전환';
      break;

    case 'steps':
      if (!Array.isArray(out.steps) || out.steps.length < 2) {
        out.cardStyle = 'default';
      }
      break;

    case 'grid':
      if (!Array.isArray(out.gridItems) || out.gridItems.length < 2) {
        out.cardStyle = 'default';
      } else {
        // Pad to 4 if needed
        const fillers = ['✨', '⭐', '💎', '🌟'];
        while (out.gridItems.length < 4) {
          out.gridItems.push({
            icon: fillers[out.gridItems.length % fillers.length],
            label: '',
          });
        }
      }
      break;

    case 'highlight':
      if (!out.emphasis) {
        // Try to extract from description
        if (desc) out.emphasis = desc.slice(0, 30);
        else out.cardStyle = 'default';
      }
      break;

    case 'statgrid':
      if (!Array.isArray(out.miniStats) || out.miniStats.length < 2) {
        out.cardStyle = 'default';
      }
      break;

    case 'iconfeature':
      if (!out.icon) out.icon = '✨';
      break;
  }

  // Ensure description is present for fallback default rendering
  if (!out.description) out.description = desc;

  return out;
};

export const classifyReels = async (text: string): Promise<ClassifyResult> => {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY 미설정');
  }

  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  const model = process.env.GEMINI_MODEL || DEFAULT_MODEL;

  const response = await ai.models.generateContent({
    model,
    contents: text,
    config: {
      systemInstruction: SYSTEM_INSTRUCTION,
      responseMimeType: 'application/json',
      responseSchema: RESPONSE_SCHEMA,
    },
  });

  const parsed = JSON.parse(response.text || '{}');
  if (!parsed.template || !parsed.data || !parsed.narration) {
    throw new Error('Gemini 응답 형식 오류');
  }

  // narrationSegments fallback: split single narration into sentences if missing
  let segments: string[] = Array.isArray(parsed.narrationSegments)
    ? parsed.narrationSegments.filter((s: unknown) => typeof s === 'string' && s.trim().length > 0)
    : [];
  if (segments.length === 0) {
    segments = parsed.narration
      .split(/(?<=[.!?])\s+|\n+/)
      .map((s: string) => s.trim())
      .filter((s: string) => s.length > 0);
  }

  const template = parsed.template as ReelsTemplate;
  const allowedFields = FIELDS_BY_TEMPLATE[template] || [];
  const filteredData: Record<string, unknown> = {};

  for (const f of allowedFields) {
    const v = parsed.data[f];
    if (Array.isArray(v) && v.length > 0) {
      filteredData[f] = v;
    } else if (typeof v === 'string' && v.trim().length > 0) {
      filteredData[f] = v;
    }
  }

  // Apply sensible fallbacks for missing optional/derived fields
  const narration = parsed.narration as string;
  // Helper: get last sentence of narration as fallback CTA
  const lastSentence = () => {
    const sentences = narration.split(/(?<=[.!?])\s+|\n/).filter((s) => s.trim());
    return sentences[sentences.length - 1]?.trim() || '';
  };

  if (template === 'action') {
    if (!filteredData.cta) {
      filteredData.cta = lastSentence() || '지금 시작하세요';
    }
    if (!filteredData.benefit) {
      // Derive a short impact phrase from solution or generic fallback
      const sol = (filteredData.solution as string) || '';
      filteredData.benefit = sol.length > 12 ? sol.slice(0, 12) + '…' : sol || '바로 효과';
    }
    if (!filteredData.problem) {
      filteredData.problem = (parsed.data.headline as string) || '지금 무엇을 미루고 있나요?';
    }
    if (!filteredData.solution) {
      filteredData.solution = (parsed.data.message as string) || (parsed.data.what as string) || '단순한 한 가지 행동을 시작하세요';
    }
  }

  if (template === 'insight') {
    if (!filteredData.quote) {
      filteredData.quote = (parsed.data.message as string) || lastSentence();
    }
    if (!filteredData.elaboration) {
      filteredData.elaboration = (parsed.data.description as string) || narration.slice(0, 100);
    }
  }

  if (template === 'emotion') {
    if (!filteredData.opening) filteredData.opening = (parsed.data.hook as string) || lastSentence();
    if (!filteredData.story) filteredData.story = (parsed.data.description as string) || narration.slice(0, 200);
    if (!filteredData.message) filteredData.message = (parsed.data.cta as string) || lastSentence();
    if (!filteredData.closing) filteredData.closing = lastSentence() || '잊지 마세요';
  }

  if (template === 'news') {
    if (!filteredData.headline) filteredData.headline = (parsed.data.title as string) || (parsed.data.hook as string) || '새 소식';
    if (!filteredData.what) filteredData.what = (parsed.data.description as string) || narration.slice(0, 100);
    if (!filteredData.when) filteredData.when = '발표됨';
    if (!filteredData.where) filteredData.where = '온라인';
    if (!filteredData.action) filteredData.action = lastSentence() || '자세히 알아보세요';
  }

  if (template === 'list') {
    if (!filteredData.cta) {
      filteredData.cta = lastSentence() || '지금 저장하고 활용해 보세요';
    }
    if (!filteredData.hook && parsed.data.problem) {
      filteredData.hook = parsed.data.problem;
    }
    if (!filteredData.headline && parsed.data.what) {
      filteredData.headline = parsed.data.what;
    }
  }

  // Validate required fields after fallbacks
  const required = REQUIRED_BY_TEMPLATE[template] || [];
  const missing = required.filter((f) => {
    const v = filteredData[f];
    if (Array.isArray(v)) return v.length === 0;
    return !v;
  });
  if (missing.length > 0) {
    throw new Error(
      `Gemini 응답: ${template} 템플릿 필수 필드 누락 [${missing.join(', ')}]`
    );
  }

  // For list template: validate item card styles + apply fallbacks
  if (template === 'list' && Array.isArray(filteredData.items)) {
    const validatedItems = (filteredData.items as any[]).map((item) =>
      validateAndCompleteItem(item)
    );
    filteredData.items = validatedItems;

    const itemCount = validatedItems.length;
    const expectedSegments = itemCount + 2;
    if (segments.length !== expectedSegments) {
      console.warn(
        `[classify] segment count mismatch (got ${segments.length}, expected ${expectedSegments}); will best-effort align`
      );
    }
  }

  // BGM mood with fallback (Gemini may not always provide it)
  const validMoods: BgmMood[] = ['energetic', 'calm', 'emotional', 'news', 'contemplative'];
  const moodFallback: Record<ReelsTemplate, BgmMood> = {
    action: 'energetic',
    emotion: 'emotional',
    news: 'news',
    insight: 'contemplative',
    list: 'calm',
  };
  const bgmMood: BgmMood = validMoods.includes(parsed.bgmMood)
    ? parsed.bgmMood
    : moodFallback[template];

  // Music prompt fallbacks
  const moodSearchFallback: Record<BgmMood, string> = {
    energetic: 'uplifting motivational background',
    calm: 'calm acoustic piano',
    emotional: 'emotional cinematic strings',
    news: 'corporate background',
    contemplative: 'ambient minimal',
  };
  const moodGenFallback: Record<BgmMood, string> = {
    energetic: 'Energetic instrumental background music with driving drums and uplifting synths, motivational, no vocals',
    calm: 'Calm acoustic piano background, gentle melody, mid tempo, reflective and warm, no vocals',
    emotional: 'Emotional cinematic background with soft strings and piano, slow tempo, heartwarming, no vocals',
    news: 'Corporate neutral background music, mid tempo, professional, no vocals',
    contemplative: 'Ambient minimal background, slow evolving pad, contemplative and serene, no vocals',
  };
  const musicSearchQuery: string =
    typeof parsed.musicSearchQuery === 'string' && parsed.musicSearchQuery.trim()
      ? parsed.musicSearchQuery
      : moodSearchFallback[bgmMood];
  const musicGenPrompt: string =
    typeof parsed.musicGenPrompt === 'string' && parsed.musicGenPrompt.trim()
      ? parsed.musicGenPrompt
      : moodGenFallback[bgmMood];

  return {
    template,
    data: filteredData,
    narration,
    narrationSegments: segments,
    bgmMood,
    musicSearchQuery,
    musicGenPrompt,
  };
};
