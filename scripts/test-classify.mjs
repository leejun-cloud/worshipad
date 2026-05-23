import { GoogleGenAI, Type } from '@google/genai';
import { config as loadEnv } from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
loadEnv({ path: path.join(__dirname, '..', '.env.local') });
loadEnv({ path: path.join(__dirname, '..', '.env') });

const TEXT = process.argv[2] || '작심삼일 때문에 올해도 운동 못 하셨죠? 하루 10분 스트레칭만 해도 3일이면 몸이 달라져요. 오늘부터 시작해보세요.';

if (!process.env.GEMINI_API_KEY) {
  console.error('\n❌ GEMINI_API_KEY 환경변수가 없습니다. .env.local 에 설정해주세요.\n');
  process.exit(1);
}

const MODEL = process.env.GEMINI_MODEL || 'gemini-3-flash-preview';
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

console.log(`[Gemini] model=${MODEL}`);
console.log(`[Gemini] text="${TEXT}"\n`);

const response = await ai.models.generateContent({
  model: MODEL,
  contents: TEXT,
  config: {
    systemInstruction: `주어진 본문을 action/emotion/news/insight 중 하나로 분류하고 필드 추출 + 내레이션 작성. JSON만 응답.`,
    responseMimeType: 'application/json',
    responseSchema: {
      type: Type.OBJECT,
      properties: {
        template: { type: Type.STRING, enum: ['action', 'emotion', 'news', 'insight'] },
        data: {
          type: Type.OBJECT,
          properties: {
            problem: { type: Type.STRING },
            solution: { type: Type.STRING },
            benefit: { type: Type.STRING },
            cta: { type: Type.STRING },
            opening: { type: Type.STRING },
            story: { type: Type.STRING },
            message: { type: Type.STRING },
            closing: { type: Type.STRING },
            headline: { type: Type.STRING },
            when: { type: Type.STRING },
            where: { type: Type.STRING },
            what: { type: Type.STRING },
            action: { type: Type.STRING },
            quote: { type: Type.STRING },
            elaboration: { type: Type.STRING },
            source: { type: Type.STRING },
          },
        },
        narration: { type: Type.STRING },
      },
      required: ['template', 'data', 'narration'],
    },
  },
});

const result = JSON.parse(response.text || '{}');
console.log('✅ 분류 결과:');
console.log(JSON.stringify(result, null, 2));
