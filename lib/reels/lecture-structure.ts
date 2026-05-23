// Structure raw content into lecture slides for LectureReel.
// Gemini produces a title slide + agenda + content slides + optional quote + summary.

import { GoogleGenAI, Type } from '@google/genai';

export type SlideType = 'title' | 'agenda' | 'content' | 'quote' | 'summary';

export interface LectureSlide {
  type: SlideType;
  heading: string;
  subheading?: string;
  bullets?: string[];
  quote?: string;
  attribution?: string;
  cta?: string;
  imageSearchQuery?: string; // English keywords for Pixabay/Pexels
  speakerNote: string;       // TTS narration for this slide
}

export interface LectureStructureResult {
  title: string;
  slides: LectureSlide[];
  bgmMood: 'energetic' | 'calm' | 'emotional' | 'contemplative' | 'news';
  musicSearchQuery: string;
  musicGenPrompt: string;
}

const SYSTEM = `당신은 온라인 강의 기획자입니다.
본문을 받아서 유튜브 강의 영상용 슬라이드 구성을 만드세요.
최종 출력은 1920×1080 가로형 강의 영상으로 렌더링됩니다.

[슬라이드 구성 원칙]
- 첫 슬라이드: type=title (제목, 부제목 포함)
- 두 번째 슬라이드: type=agenda (목차 - 본문 섹션 이름들을 bullets로)
- 본문: type=content 슬라이드 4-8장 (핵심 개념마다 1장)
- 중간에 type=quote 1-2장 삽입 가능 (명언·핵심 원칙 강조)
- 마지막 슬라이드: type=summary (핵심 정리 3-5줄 + CTA)
- 총 슬라이드: 7-12장 권장

[heading 규칙]
- type=title: 강의 전체 제목 (30자 이내)
- type=agenda: "목차" 고정
- type=content: 해당 섹션 핵심 제목 (20자 이내, 명사형)
- type=quote: 인용구나 핵심 문장 그대로 (quote 필드에도 동일하게)
- type=summary: "핵심 정리" 고정

[bullets 규칙]
- content 슬라이드: 핵심 포인트 2-4개 (한 줄씩, 40자 이내)
- agenda 슬라이드: 목차 항목들 (content 슬라이드 heading과 일치)
- summary 슬라이드: 전체 핵심 요약 3-5줄

[speakerNote 규칙]
- 해당 슬라이드 재생 시간 동안 읽을 내레이션
- title/agenda: 10-20초 분량 (50-100자)
- content: 20-40초 분량 (100-200자) — 설명을 풍부하게
- quote: 10-15초 분량
- summary: 20-30초 분량
- 자연스러운 구어체 한국어

[imageSearchQuery 규칙]
- 영어로, 2-4 키워드
- content 슬라이드에만 제공 (배경 이미지 검색용)
- 예: "person studying desk focus", "team collaboration whiteboard"
- 인물보다 장면/사물 중심

[bgmMood]
- energetic: 동기부여 강의
- calm: 정보·학습 콘텐츠
- contemplative: 철학·인사이트
- news: 트렌드·시사`;

const SCHEMA = {
  type: Type.OBJECT,
  properties: {
    title: { type: Type.STRING },
    slides: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          type: { type: Type.STRING, enum: ['title', 'agenda', 'content', 'quote', 'summary'] },
          heading: { type: Type.STRING },
          subheading: { type: Type.STRING },
          bullets: { type: Type.ARRAY, items: { type: Type.STRING } },
          quote: { type: Type.STRING },
          attribution: { type: Type.STRING },
          cta: { type: Type.STRING },
          speaker: { type: Type.STRING },
          imageSearchQuery: { type: Type.STRING },
          speakerNote: { type: Type.STRING },
        },
        required: ['type', 'heading', 'speakerNote'],
      },
    },
    bgmMood: {
      type: Type.STRING,
      enum: ['energetic', 'calm', 'emotional', 'contemplative', 'news'],
    },
    musicSearchQuery: { type: Type.STRING },
    musicGenPrompt: { type: Type.STRING },
  },
  required: ['title', 'slides', 'bgmMood', 'musicSearchQuery', 'musicGenPrompt'],
};

export const structureLecture = async (
  text: string,
  titleHint?: string
): Promise<LectureStructureResult> => {
  if (!process.env.GEMINI_API_KEY) throw new Error('GEMINI_API_KEY 미설정');

  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  const model = process.env.GEMINI_MODEL || 'gemini-2.5-flash-preview-04-17';

  const prompt = [
    titleHint ? `강의 제목 힌트: "${titleHint}"` : '',
    '본문:',
    text,
  ]
    .filter(Boolean)
    .join('\n');

  const res = await ai.models.generateContent({
    model,
    contents: prompt,
    config: {
      systemInstruction: SYSTEM,
      responseMimeType: 'application/json',
      responseSchema: SCHEMA,
      thinkingConfig: { thinkingBudget: 5000 },
    },
  });

  const parsed = JSON.parse(res.text || '{}') as LectureStructureResult;

  // Fallbacks
  if (!parsed.title) parsed.title = titleHint || '강의';
  if (!Array.isArray(parsed.slides) || parsed.slides.length < 2) {
    parsed.slides = [
      { type: 'title', heading: parsed.title, speakerNote: '안녕하세요. 오늘 강의를 시작하겠습니다.' },
      { type: 'summary', heading: '핵심 정리', bullets: [text.slice(0, 40)], speakerNote: '오늘 내용을 정리해보겠습니다.' },
    ];
  }

  return parsed;
};
