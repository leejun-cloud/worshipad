// Multi-agent review: parallel "hooking expert" + "copy editor" agents.
// Returns scores and feedback. If hooking score < threshold, caller should regenerate.

import { GoogleGenAI, Type } from '@google/genai';
import type { ClassifyResult } from './classify';

const DEFAULT_MODEL = 'gemini-3-flash-preview';

export interface HookingReview {
  score: number; // 1-10
  hookSummary: string;
  feedback: string;
  pass: boolean;
}

export interface CopyReview {
  toneConsistent: boolean;
  flowsWell: boolean;
  issues: string[]; // specific problems
  feedback: string;
  pass: boolean;
}

export interface ReviewResult {
  hooking: HookingReview;
  copy: CopyReview;
  needsRegeneration: boolean;
  combinedFeedback: string;
}

const HOOKING_PROMPT = `당신은 한국 SNS 콘텐츠 후킹 전문가입니다.
주어진 릴스 콘텐츠의 **첫 카드(hook/intro)와 전체 흐름**이 시청자가 스크롤을 멈추고 끝까지 볼 만큼 매력적인지 평가합니다.

평가 기준:
1. 첫 3초 후킹: "이걸 왜 봐야 하지?"에 즉시 답하는가
2. 호기심 유발: 다음 카드를 넘기고 싶게 만드는가
3. 명확한 가치: 시청자가 얻을 게 분명히 보이는가
4. CTA 임팩트: 마지막 행동 유도가 구체적이고 즉각적인가

점수 7점 미만이면 재작성 필요. 단순히 "괜찮다"가 아니라 무엇이 약한지, 어떻게 강하게 만들지 구체적으로 피드백.

응답 형식:
{
  "score": 1-10 정수,
  "hookSummary": "첫 카드 후킹 한 줄 요약",
  "feedback": "구체적 개선 제안 (2-3문장)",
  "pass": score >= 7
}`;

const COPY_PROMPT = `당신은 한국어 카피 에디터입니다.
주어진 릴스 콘텐츠의 **글쓰기 품질, 톤 일관성, 카드 간 흐름**을 평가합니다.

평가 기준:
1. 톤 일관성: 모든 카드가 같은 톤(전문/캐주얼/감성 등)인지
2. 글자수 적정성: 한 카드당 30자 이내, 한 줄 15자 이내 권장
3. 슬라이드 흐름: 도입 → 본문 → 마무리가 논리적으로 연결되는가
4. 중복/불필요한 표현: 같은 내용 반복, 군더더기 식별
5. 한국어 자연스러움: 어색한 번역체, 부자연스러운 어미 식별

응답 형식:
{
  "toneConsistent": true/false,
  "flowsWell": true/false,
  "issues": ["구체적 문제점 배열"],
  "feedback": "전체 개선 제안 (2-3문장)",
  "pass": issues.length <= 1 && toneConsistent && flowsWell
}`;

const HOOKING_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    score: { type: Type.INTEGER },
    hookSummary: { type: Type.STRING },
    feedback: { type: Type.STRING },
    pass: { type: Type.BOOLEAN },
  },
  required: ['score', 'hookSummary', 'feedback', 'pass'],
};

const COPY_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    toneConsistent: { type: Type.BOOLEAN },
    flowsWell: { type: Type.BOOLEAN },
    issues: { type: Type.ARRAY, items: { type: Type.STRING } },
    feedback: { type: Type.STRING },
    pass: { type: Type.BOOLEAN },
  },
  required: ['toneConsistent', 'flowsWell', 'issues', 'feedback', 'pass'],
};

const formatContentForReview = (cls: ClassifyResult): string => {
  const lines: string[] = [];
  lines.push(`[템플릿] ${cls.template}`);
  lines.push(`[데이터]`);
  for (const [k, v] of Object.entries(cls.data)) {
    if (Array.isArray(v)) {
      lines.push(`  ${k}:`);
      v.forEach((item, i) => {
        if (typeof item === 'object' && item !== null) {
          lines.push(`    [${i + 1}] ${JSON.stringify(item)}`);
        } else {
          lines.push(`    [${i + 1}] ${item}`);
        }
      });
    } else {
      lines.push(`  ${k}: ${v}`);
    }
  }
  lines.push(`[내레이션]`);
  cls.narrationSegments.forEach((seg, i) => {
    lines.push(`  [${i}] ${seg}`);
  });
  return lines.join('\n');
};

export const runMultiAgentReview = async (cls: ClassifyResult): Promise<ReviewResult> => {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY 미설정');
  }

  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  const model = process.env.GEMINI_MODEL || DEFAULT_MODEL;
  const content = formatContentForReview(cls);

  // Parallel review by 2 agents
  const [hookingRes, copyRes] = await Promise.all([
    ai.models.generateContent({
      model,
      contents: content,
      config: {
        systemInstruction: HOOKING_PROMPT,
        responseMimeType: 'application/json',
        responseSchema: HOOKING_SCHEMA,
      },
    }),
    ai.models.generateContent({
      model,
      contents: content,
      config: {
        systemInstruction: COPY_PROMPT,
        responseMimeType: 'application/json',
        responseSchema: COPY_SCHEMA,
      },
    }),
  ]);

  const hooking: HookingReview = JSON.parse(hookingRes.text || '{}');
  const copy: CopyReview = JSON.parse(copyRes.text || '{}');

  const needsRegeneration = !hooking.pass || (!copy.pass && copy.issues.length > 1);

  const combinedFeedback = [
    `[후킹 점수 ${hooking.score}/10] ${hooking.hookSummary}`,
    `   ${hooking.feedback}`,
    `[카피 ${copy.pass ? 'OK' : '문제 있음'}]`,
    ...(copy.issues.length > 0 ? copy.issues.map((i) => `   • ${i}`) : []),
    `   ${copy.feedback}`,
  ].join('\n');

  return { hooking, copy, needsRegeneration, combinedFeedback };
};

/**
 * Re-run classify with feedback to improve weak hooks/copy.
 */
export const classifyWithFeedback = async (
  originalText: string,
  feedback: string
): Promise<ClassifyResult> => {
  const { classifyReels } = await import('./classify');
  const augmented = `${originalText}

---
[이전 결과 개선 피드백 — 이번에는 반드시 반영하세요]
${feedback}`;
  return classifyReels(augmented);
};
