// Quick Jamendo API test — search and download one track.
import { config as loadEnv } from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
loadEnv({ path: path.join(__dirname, '..', '.env.local') });

const { fetchJamendoTrack, searchJamendoTracks } = await import('../lib/reels/jamendo.ts');

const queries = [
  'uplifting acoustic guitar',
  'calm piano lofi',
  'emotional cinematic strings',
  'corporate background motivational',
  'ambient minimal',
];

const query = process.argv[2] || queries[0];
const outDir = path.join(__dirname, '..', 'out', 'jamendo-test');

console.log(`🔍 검색: "${query}"\n`);

try {
  const tracks = await searchJamendoTracks(query, { limit: 5, minDurationSec: 30, maxDurationSec: 240 });
  console.log(`✅ ${tracks.length}곡 발견:`);
  tracks.forEach((t, i) => {
    console.log(`  ${i + 1}. "${t.name}" by ${t.artistName} (${t.durationSec}초)`);
  });
  console.log('');

  console.log('⬇️  첫 번째 트랙 다운로드 중...');
  const dl = await fetchJamendoTrack(query, outDir, { minDurationSec: 30, maxDurationSec: 240 });
  console.log(`✅ ${dl.filePath}`);
  console.log(`   길이: ${dl.durationSec}초`);
  console.log(`   ${dl.attribution}`);
  console.log(`\n   재생: open "${dl.filePath}"`);
} catch (e) {
  console.error(`❌ ${e.message}`);
  process.exit(1);
}
