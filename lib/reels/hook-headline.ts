// Rewrites a classified headline using viral hook patterns for stronger CTR.
// Falls back to the original headline on error (non-fatal).

import { generateViralTitles, pickBestTitle } from '../auto/title-generator';
import { ReelsTemplate } from './classify';

export interface HookHeadlineResult {
  headline: string;
  score: number;
  reason: string;
  original: string;
  wasRewritten: boolean;
}

/** Templates where the intro card headline is click-optimizable */
const HOOKABLE: Set<ReelsTemplate> = new Set(['list', 'news']);

/** Data field key that holds the hookable headline per template */
export const HEADLINE_FIELD: Partial<Record<ReelsTemplate, string>> = {
  list: 'headline',
  news: 'headline',
};

export const rewriteHeadlineAsHook = async (opts: {
  headline: string;
  template: ReelsTemplate;
  narration: string;
  candidateCount?: number;
}): Promise<HookHeadlineResult> => {
  const { headline, template, narration, candidateCount = 6 } = opts;

  if (!HOOKABLE.has(template)) {
    return { headline, score: 7, reason: '후킹 최적화 불필요', original: headline, wasRewritten: false };
  }

  try {
    const contextHint = `원본 제목: "${headline}"\n내레이션 요약: ${narration.slice(0, 120)}`;
    const titles = await generateViralTitles(headline, candidateCount, contextHint);
    const allCandidates = [headline, ...titles.filter((t) => t && t !== headline)];
    const ranking = await pickBestTitle(allCandidates);
    const wasRewritten = ranking.bestTitle !== headline;
    return {
      headline: ranking.bestTitle,
      score: ranking.score,
      reason: ranking.reason,
      original: headline,
      wasRewritten,
    };
  } catch (e) {
    console.warn('[hook-headline] fallback to original:', e instanceof Error ? e.message : e);
    return { headline, score: 7, reason: '오류 → 원본 유지', original: headline, wasRewritten: false };
  }
};
