import { config as loadEnv } from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { readFile } from 'fs/promises';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
loadEnv({ path: path.join(__dirname, '..', '.env.local') });
loadEnv({ path: path.join(__dirname, '..', '.env') });

// Dynamic import after env loaded
const { classifyReels } = await import('../lib/reels/classify.ts');
const { synthesizeKoreanNarration } = await import('../lib/reels/tts.ts');
const { renderReel } = await import('../lib/reels/render.ts');

const argText = process.argv[2];
let TEXT;
if (argText && argText.startsWith('@')) {
  TEXT = await readFile(argText.slice(1), 'utf-8');
} else if (argText) {
  TEXT = argText;
} else {
  TEXT = '작심삼일 때문에 올해도 운동 못 하셨죠? 하루 10분 스트레칭만 해도 3일이면 몸이 달라져요.';
}

console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('🎬 릴스 자동 생성 파이프라인 테스트');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log(`📝 입력 본문 (${TEXT.length}자):`);
console.log(TEXT.slice(0, 200) + (TEXT.length > 200 ? '...' : ''));
console.log('');

const t0 = Date.now();

// 1. Classify
console.log('━━━ [1/3] Gemini 분류 + 필드 추출 + 내레이션 생성 ━━━');
const cls = await classifyReels(TEXT);
console.log(`  ✅ 템플릿: ${cls.template}`);
console.log(`  📋 추출 필드:`);
for (const [k, v] of Object.entries(cls.data)) {
  if (Array.isArray(v)) {
    console.log(`     ${k}: (${v.length}개 항목)`);
    v.forEach((item, idx) => {
      const preview = typeof item === 'object'
        ? `${item.title} — ${item.description}${item.benefit ? ` [${item.benefit}]` : ''}`
        : String(item);
      console.log(`       ${idx + 1}. ${preview}`);
    });
  } else {
    console.log(`     ${k}: ${v}`);
  }
}
console.log(`  🎙️  내레이션 (${cls.narration.length}자):`);
console.log(`     ${cls.narration}`);
console.log('');

// 2. TTS
console.log('━━━ [2/3] Gemini TTS 음성 생성 ━━━');
const tts = await synthesizeKoreanNarration(cls.narration, { voiceName: 'Kore' });
console.log(`  ✅ 오디오 파일: ${tts.localPath}`);
console.log(`  📦 크기: ${(tts.audioBuffer.length / 1024).toFixed(1)} KB`);
console.log(`  ⏱️  길이: ${tts.durationSec.toFixed(2)}초`);
console.log(`  🌐 URL: ${tts.publicUrl}`);
console.log('');

// 3. Render
// Bundle's static dir is created at bundle time and doesn't pick up freshly-
// written files in public/. Workaround: pass audio as base64 data URI so
// Remotion doesn't have to fetch it from a server.
console.log('━━━ [3/3] Remotion MP4 렌더링 (BGM + 내레이션 합성) ━━━');
const audioBase64 = tts.audioBuffer.toString('base64');
const audioDataUri = `data:audio/wav;base64,${audioBase64}`;
console.log(`  📤 오디오를 data URI로 인코딩 (${(audioDataUri.length / 1024 / 1024).toFixed(2)} MB)`);

const renderData = {
  ...cls.data,
  audioUrl: audioDataUri,
  audioDurationSec: tts.durationSec,
};
const rendered = await renderReel({
  template: cls.template,
  data: renderData,
});
console.log(`  ✅ MP4 파일: ${rendered.localPath}`);
console.log('');

const elapsed = ((Date.now() - t0) / 1000).toFixed(1);
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log(`✅ 완료! ${elapsed}초 소요`);
console.log('');
console.log(`재생: open "${rendered.localPath}"`);
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
