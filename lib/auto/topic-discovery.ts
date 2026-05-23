// Auto-discover content topics from multiple sources.
// 1) pool   — random pick from config/topic-pool.json
// 2) news   — NewsAPI top headlines (requires NEWS_API_KEY)
// 3) ai     — Gemini generates trending topic from interest area
// 4) hybrid — pool with optional category filtering

import { readFile } from 'fs/promises';
import path from 'path';
import { GoogleGenAI, Type } from '@google/genai';

export type TopicStrategy = 'pool' | 'news' | 'ai' | 'hybrid';

export interface DiscoveredTopic {
  topic: string;
  category?: string;
  source: TopicStrategy;
  contextHint?: string; // optional context (news summary, etc.)
}

interface TopicPool {
  categories: Record<
    string,
    {
      label: string;
      topics: string[];
    }
  >;
}

const POOL_PATH = path.join(process.cwd(), 'config', 'topic-pool.json');

const loadPool = async (): Promise<TopicPool> => {
  const raw = await readFile(POOL_PATH, 'utf-8');
  return JSON.parse(raw);
};

/** Pick random topic from pool. Optional category filter. */
export const discoverFromPool = async (categoryKey?: string): Promise<DiscoveredTopic> => {
  const pool = await loadPool();
  const cats = Object.entries(pool.categories);

  let selectedCat: string;
  if (categoryKey && pool.categories[categoryKey]) {
    selectedCat = categoryKey;
  } else {
    selectedCat = cats[Math.floor(Math.random() * cats.length)][0];
  }

  const topics = pool.categories[selectedCat].topics;
  const topic = topics[Math.floor(Math.random() * topics.length)];

  return {
    topic,
    category: pool.categories[selectedCat].label,
    source: 'pool',
  };
};

/** Fetch top news headlines and return topic candidates. */
export const discoverFromNews = async (
  options: { country?: string; category?: string; limit?: number } = {}
): Promise<DiscoveredTopic[]> => {
  const apiKey = process.env.NEWS_API_KEY;
  if (!apiKey) {
    throw new Error('NEWS_API_KEY 미설정 (https://newsapi.org/ 무료 가입)');
  }

  const country = options.country || 'kr';
  const limit = options.limit || 10;

  const params = new URLSearchParams({
    country,
    apiKey,
    pageSize: String(limit),
  });
  if (options.category) params.set('category', options.category);

  const res = await fetch(`https://newsapi.org/v2/top-headlines?${params}`);
  if (!res.ok) {
    throw new Error(`NewsAPI failed: HTTP ${res.status}`);
  }
  const data = await res.json();
  if (!Array.isArray(data.articles)) {
    throw new Error('NewsAPI 응답 형식 오류');
  }

  return data.articles
    .filter((a: any) => a.title && a.description)
    .slice(0, limit)
    .map((a: any) => ({
      topic: a.title,
      contextHint: a.description,
      source: 'news' as const,
    }));
};

/** Use Gemini to generate a trending/interesting topic in given area. */
export const discoverFromAI = async (
  interestArea?: string
): Promise<DiscoveredTopic> => {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY 미설정');
  }

  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  const model = process.env.GEMINI_MODEL || 'gemini-3-flash-preview';

  const area = interestArea || '자기계발, 생산성, AI, 재테크 중 하나';

  const prompt = `당신은 한국 SNS 콘텐츠 기획자입니다.
${area} 분야에서 시청자가 클릭하고 끝까지 볼 만한 흥미로운 주제 1개를 제안하세요.

조건:
- 너무 흔하지 않은 신선한 앵글
- 실용적이거나 호기심을 자극할 것
- 30초 영상으로 다룰 수 있는 좁은 주제
- 한국어, 15자 이내

JSON 응답:
{ "topic": "주제명", "category": "카테고리" }`;

  const res = await ai.models.generateContent({
    model,
    contents: prompt,
    config: {
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          topic: { type: Type.STRING },
          category: { type: Type.STRING },
        },
        required: ['topic', 'category'],
      },
    },
  });

  const parsed = JSON.parse(res.text || '{}');
  return {
    topic: parsed.topic,
    category: parsed.category,
    source: 'ai',
  };
};

/** High-level: pick a strategy and return a topic. */
export const discoverTopic = async (
  strategy: TopicStrategy = 'pool',
  options: { category?: string; interestArea?: string } = {}
): Promise<DiscoveredTopic> => {
  switch (strategy) {
    case 'news': {
      const candidates = await discoverFromNews({ category: options.category, limit: 5 });
      if (candidates.length === 0) throw new Error('NewsAPI: 결과 없음');
      return candidates[Math.floor(Math.random() * candidates.length)];
    }
    case 'ai':
      return discoverFromAI(options.interestArea);
    case 'hybrid':
    case 'pool':
    default:
      return discoverFromPool(options.category);
  }
};
