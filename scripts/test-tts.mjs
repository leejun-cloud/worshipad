import { GoogleGenAI } from '@google/genai';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { config as loadEnv } from 'dotenv';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
loadEnv({ path: path.join(__dirname, '..', '.env.local') });
loadEnv({ path: path.join(__dirname, '..', '.env') });

const TEXT = process.argv[2] || '안녕하세요. 제미나이 한국어 음성 테스트입니다. 지금 이 소리가 잘 들리시나요?';
const VOICE = process.argv[3] || 'Kore';
const MODEL = process.argv[4] || process.env.GEMINI_TTS_MODEL || 'gemini-2.5-flash-preview-tts';

if (!process.env.GEMINI_API_KEY) {
  console.error('\n❌ GEMINI_API_KEY 환경변수가 없습니다.');
  console.error('   .env.local 에 GEMINI_API_KEY=AIza... 로 설정해주세요.\n');
  process.exit(1);
}

console.log(`[Gemini TTS] model=${MODEL}`);
console.log(`[Gemini TTS] voice=${VOICE}`);
console.log(`[Gemini TTS] text="${TEXT}"\n`);

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const response = await ai.models.generateContent({
  model: MODEL,
  contents: [{ parts: [{ text: TEXT }] }],
  config: {
    responseModalities: ['AUDIO'],
    speechConfig: {
      voiceConfig: {
        prebuiltVoiceConfig: { voiceName: VOICE },
      },
    },
  },
});

const part = response?.candidates?.[0]?.content?.parts?.[0];
const inline = part?.inlineData;
if (!inline?.data) {
  console.error('❌ 오디오 응답 없음');
  console.error(JSON.stringify(response, null, 2).slice(0, 800));
  process.exit(1);
}

const mimeType = inline.mimeType || 'audio/L16;rate=24000';
console.log(`[Gemini TTS] mime=${mimeType}`);

const raw = Buffer.from(inline.data, 'base64');

// PCM raw → wrap in WAV header
const rateMatch = mimeType.match(/rate=(\d+)/);
const sampleRate = rateMatch ? Number(rateMatch[1]) : 24000;
const channels = 1;
const bitsPerSample = 16;
const byteRate = (sampleRate * channels * bitsPerSample) / 8;
const blockAlign = (channels * bitsPerSample) / 8;
const dataSize = raw.length;
const fileSize = 44 + dataSize - 8;

const header = Buffer.alloc(44);
header.write('RIFF', 0);
header.writeUInt32LE(fileSize, 4);
header.write('WAVE', 8);
header.write('fmt ', 12);
header.writeUInt32LE(16, 16);
header.writeUInt16LE(1, 20);
header.writeUInt16LE(channels, 22);
header.writeUInt32LE(sampleRate, 24);
header.writeUInt32LE(byteRate, 28);
header.writeUInt16LE(blockAlign, 32);
header.writeUInt16LE(bitsPerSample, 34);
header.write('data', 36);
header.writeUInt32LE(dataSize, 40);

const wav = Buffer.concat([header, raw]);

const outDir = path.join(__dirname, '..', 'out');
await mkdir(outDir, { recursive: true });
const outPath = path.join(outDir, 'tts-test.wav');
await writeFile(outPath, wav);

console.log(`\n✅ 생성 완료: ${outPath}  (${(wav.length / 1024).toFixed(1)} KB)`);
console.log(`   재생: open "${outPath}"\n`);
