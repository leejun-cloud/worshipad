import { config as loadEnv } from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
loadEnv({ path: path.join(__dirname, '..', '.env.local') });

const { generateLyriaMusic } = await import('../lib/reels/lyria.ts');

const prompt =
  process.argv[2] ||
  'Calm acoustic piano background music for educational content, gentle melody, no vocals, mid tempo, warm and reflective';

const outDir = path.join(__dirname, '..', 'out', 'lyria-test');

console.log(`🎵 Lyria 2 음악 생성 테스트`);
console.log(`프롬프트: "${prompt}"\n`);

const t0 = Date.now();
try {
  const result = await generateLyriaMusic(prompt, outDir);
  const elapsed = ((Date.now() - t0) / 1000).toFixed(1);
  console.log(`✅ 생성 완료 (${elapsed}초)`);
  console.log(`   파일: ${result.filePath}`);
  console.log(`   길이: ${result.durationSec}초`);
  console.log(`   ${result.attribution}`);
  console.log(`\n   재생: open "${result.filePath}"`);
} catch (e) {
  console.error(`❌ ${e.message}`);
  process.exit(1);
}
