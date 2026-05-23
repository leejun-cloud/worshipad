// Structure a story/scenario into animation scenes for E-type pipeline.
// Each scene gets image/video prompts + TTS narration + dialogue.

import { GoogleGenAI, Type } from '@google/genai';

export interface AnimeDialogueLine {
  character: string;
  text: string;
}

export interface AnimeScene {
  sceneNumber: number;
  description: string;        // 장면 설명 (한국어)
  imagePrompt: string;        // 영어 — GPT-Image-2용 (캐릭터 묘사 포함)
  videoMotionPrompt: string;  // 영어 — Wan 2.2용 카메라/모션 묘사
  narration: string;          // TTS 내레이션 (한국어)
  dialogue: AnimeDialogueLine[];
  durationSec: number;        // 목표 장면 길이 (5-10초)
  sfxHint?: string;           // 효과음 힌트
}

export interface AnimeStructureResult {
  title: string;
  styleGuide: string;         // 영어 — 모든 이미지에 공통 적용할 스타일
  characterDescriptions: Record<string, string>; // 영어 — 캐릭터별 고정 외모 묘사
  scenes: AnimeScene[];
  bgmMood: 'energetic' | 'calm' | 'emotional' | 'contemplative' | 'news';
  musicSearchQuery: string;
}

const SYSTEM = `당신은 어린이 애니메이션 영상 기획자입니다.
스토리/시나리오를 받아서 AI 영상 생성 파이프라인용 장면 구성을 만드세요.
최종 결과물은 GPT-Image-2(장면 이미지) + Wan 2.2(영상 애니메이션) + Gemini TTS로 만드는 애니메이션 영상입니다.

[구성 원칙]
- 장면 수: 5-10개
- 장면당 길이: 5-8초
- 캐릭터 일관성이 핵심 — characterDescriptions에 매우 상세한 외모 기술
- imagePrompt에는 반드시 캐릭터 묘사를 그대로 복사해서 포함

[styleGuide]
- 전체 영상 스타일을 영어로 1줄 — 모든 imagePrompt 앞에 붙을 스타일
- 예: "3D Pixar-style animation, vibrant colors, soft lighting, children's story aesthetic"

[characterDescriptions]
- 등장 캐릭터별 외모를 영어로 상세히 기술
- 색깔, 옷, 특징을 구체적으로 — 모든 장면에서 동일하게 사용됨
- 예: {"토끼": "anthropomorphic white rabbit with long ears, wearing blue overalls and red scarf"}

[imagePrompt 규칙]
- 반드시 영어
- 형식: "{styleGuide}, {characterDescription(s)}, {scene action}, {background}, cinematic lighting"
- 텍스트/글자 절대 포함 금지 (No text, no letters, no words)
- 배경 환경을 구체적으로 기술

[videoMotionPrompt 규칙]
- 반드시 영어
- 카메라 움직임 + 캐릭터 동작을 구체적으로
- 예: "slow zoom in, rabbit running toward the camera, ears flapping, dynamic motion"

[narration 규칙]
- 한국어, 해당 장면 길이(durationSec)에 맞는 분량
- 5초 → 약 15-25자, 8초 → 약 25-40자

[dialogue 규칙]
- 캐릭터 대사는 narration에 포함하지 말고 별도 dialogue 배열로
- character 필드에 캐릭터 이름, text에 대사`;

const SCHEMA = {
  type: Type.OBJECT,
  properties: {
    title: { type: Type.STRING },
    styleGuide: { type: Type.STRING },
    characterDescriptions: {
      type: Type.OBJECT,
      properties: {},
      additionalProperties: { type: Type.STRING },
    },
    scenes: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          sceneNumber: { type: Type.INTEGER },
          description: { type: Type.STRING },
          imagePrompt: { type: Type.STRING },
          videoMotionPrompt: { type: Type.STRING },
          narration: { type: Type.STRING },
          dialogue: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                character: { type: Type.STRING },
                text: { type: Type.STRING },
              },
              required: ['character', 'text'],
            },
          },
          durationSec: { type: Type.NUMBER },
          sfxHint: { type: Type.STRING },
        },
        required: ['sceneNumber', 'description', 'imagePrompt', 'videoMotionPrompt', 'narration', 'dialogue', 'durationSec'],
      },
    },
    bgmMood: {
      type: Type.STRING,
      enum: ['energetic', 'calm', 'emotional', 'contemplative', 'news'],
    },
    musicSearchQuery: { type: Type.STRING },
  },
  required: ['title', 'styleGuide', 'characterDescriptions', 'scenes', 'bgmMood', 'musicSearchQuery'],
};

export const structureAnime = async (
  story: string,
  titleHint?: string
): Promise<AnimeStructureResult> => {
  if (!process.env.GEMINI_API_KEY) throw new Error('GEMINI_API_KEY 미설정');

  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  const model = process.env.GEMINI_MODEL || 'gemini-2.5-flash-preview-04-17';

  const prompt = titleHint ? `제목 힌트: "${titleHint}"\n\n스토리:\n${story}` : story;

  const res = await ai.models.generateContent({
    model,
    contents: prompt,
    config: {
      systemInstruction: SYSTEM,
      responseMimeType: 'application/json',
      responseSchema: SCHEMA,
      thinkingConfig: { thinkingBudget: 8000 },
    },
  });

  const parsed = JSON.parse(res.text || '{}') as AnimeStructureResult;

  // Ensure imagePrompts include style guide prefix
  if (parsed.styleGuide && Array.isArray(parsed.scenes)) {
    parsed.scenes = parsed.scenes.map((s) => ({
      ...s,
      imagePrompt: s.imagePrompt.startsWith(parsed.styleGuide)
        ? s.imagePrompt
        : `${parsed.styleGuide}, ${s.imagePrompt}`,
    }));
  }

  return parsed;
};
