import { config as loadEnv } from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { readFile, mkdir, copyFile } from 'fs/promises';
import { spawn } from 'child_process';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
loadEnv({ path: path.join(__dirname, '..', '.env.local') });
loadEnv({ path: path.join(__dirname, '..', '.env') });

const { classifyReels } = await import('../lib/reels/classify.ts');
const { synthesizeKoreanNarration, synthesizeSegments, concatenateWavs } = await import('../lib/reels/tts.ts');
const { renderReel, COMPOSITION_MAP } = await import('../lib/reels/render.ts');
const { fetchBgm, bgmToDataUri } = await import('../lib/reels/music-fetcher.ts');
const { REELS_FPS } = await import('../remotion/types.ts');

const SCENE_GAP_SEC = 0.3; // small pause between scene narrations for natural rhythm

const argText = process.argv[2];
let TEXT;
if (argText && argText.startsWith('@')) {
  TEXT = await readFile(argText.slice(1), 'utf-8');
} else if (argText) {
  TEXT = argText;
} else {
  console.error('Usage: tsx scripts/generate-content.mjs "@/path/to/content.txt"');
  process.exit(1);
}

const runRemotionStill = (compositionId, outputPath, frame, propsJson) => {
  return new Promise((resolve, reject) => {
    const args = [
      'remotion',
      'still',
      'remotion/index.ts',
      compositionId,
      outputPath,
      `--frame=${frame}`,
      `--props=${propsJson}`,
    ];
    const p = spawn('npx', args, { stdio: ['ignore', 'pipe', 'pipe'] });
    let err = '';
    p.stderr.on('data', (d) => (err += d.toString()));
    p.on('exit', (code) => (code === 0 ? resolve(true) : reject(new Error(err))));
  });
};

console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('🎬 카드뉴스 + 릴스 통합 생성 (장면별 음성 동기화)');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log(`📝 입력 본문 (${TEXT.length}자):`);
console.log(TEXT.slice(0, 200) + (TEXT.length > 200 ? '...' : ''));
console.log('');

const t0 = Date.now();
const timestamp = Date.now();
const outDir = path.join(__dirname, '..', 'out', `content-${timestamp}`);
await mkdir(outDir, { recursive: true });

// 1. Classify
console.log('━━━ [1/4] Gemini 분류 + 필드 추출 + 내레이션 분할 ━━━');
const cls = await classifyReels(TEXT);
console.log(`  ✅ 템플릿: ${cls.template} / BGM 무드: ${cls.bgmMood}`);
if (cls.data.items && Array.isArray(cls.data.items)) {
  console.log(`  📋 ${cls.data.items.length}개 항목 추출됨`);
}
console.log(`  🎙️  내레이션 ${cls.narration.length}자 / ${cls.narrationSegments.length}개 세그먼트`);
cls.narrationSegments.forEach((seg, i) => {
  console.log(`     ${String(i).padStart(2, '0')}. ${seg.slice(0, 60)}${seg.length > 60 ? '...' : ''}`);
});

const bgm = await fetchBgm({
  mood: cls.bgmMood,
  searchQuery: cls.musicSearchQuery,
  genPrompt: cls.musicGenPrompt,
});
const sourceEmoji = { jamendo: '🎵', lyria: '🤖', local: '📁', default: '🔁' }[bgm.source];
console.log(`  ${sourceEmoji} BGM (${bgm.source}): ${bgm.publicUrl} (${bgm.durationSec.toFixed(1)}초)`);
if (bgm.attribution) console.log(`     ↳ ${bgm.attribution}`);
console.log('');

// 2. Per-segment TTS
console.log('━━━ [2/4] 장면별 TTS 음성 생성 ━━━');
const segments = await synthesizeSegments(cls.narrationSegments, { voiceName: 'Kore' });
const totalAudioSec = segments.reduce((sum, s) => sum + s.durationSec, 0) +
                      SCENE_GAP_SEC * Math.max(0, segments.length - 1);

segments.forEach((s, i) => {
  console.log(`  ${String(i).padStart(2, '0')}. ${s.durationSec.toFixed(2)}초`);
});
console.log(`  ✅ 총 ${segments.length}개 세그먼트, 합계 ${totalAudioSec.toFixed(2)}초`);
console.log('');

// 3. Concatenate audio + render
console.log('━━━ [3/4] Reels MP4 렌더링 (장면 = 세그먼트 길이) ━━━');
const concatenated = concatenateWavs(
  segments.map((s) => s.audioBuffer),
  SCENE_GAP_SEC
);
const audioDataUri = `data:audio/wav;base64,${concatenated.toString('base64')}`;

// Per-scene durations: each scene = its TTS duration + half of gap on each side
// (Order matches scene order in template)
const sceneDurations = segments.map((s, i) => {
  // Add gap to all but last
  return s.durationSec + (i < segments.length - 1 ? SCENE_GAP_SEC : 0);
});

// Trim BGM and embed as data URI to bypass bundle static-dir caching
const bgmDataUri = await bgmToDataUri(bgm, totalAudioSec + 2);
const renderData = {
  ...cls.data,
  audioUrl: audioDataUri,
  audioDurationSec: totalAudioSec,
  sceneDurationsSec: sceneDurations,
  bgmUrl: bgmDataUri.dataUri,
  bgmVolume: bgm.volume,
  bgmTrackDurationSec: bgmDataUri.durationSec,
};
const rendered = await renderReel({ template: cls.template, data: renderData });
const reelsPath = path.join(outDir, `reels.mp4`);
await copyFile(rendered.localPath, reelsPath);
console.log(`  ✅ 영상 ${reelsPath}`);
console.log('');

// 4. Card news (still PNGs at midpoint of each scene)
console.log('━━━ [4/4] 카드뉴스 PNG 렌더링 (각 장면 중앙) ━━━');
const compositionId = COMPOSITION_MAP[cls.template];
const cardNewsData = {
  ...cls.data,
  audioDurationSec: totalAudioSec,
  sceneDurationsSec: sceneDurations,
};
const cardNewsPropsJson = JSON.stringify(cardNewsData);

if (cls.template === 'list') {
  const itemCount = cls.data.items.length;

  // Compute midpoint frame for each scene
  let cursor = 0;
  const sceneTimes = [];
  // Intro
  sceneTimes.push({
    name: '00-intro',
    frame: Math.round((cursor + sceneDurations[0] / 2) * REELS_FPS),
  });
  cursor += sceneDurations[0];
  // Items
  for (let i = 0; i < itemCount; i++) {
    sceneTimes.push({
      name: `${String(i + 1).padStart(2, '0')}-item`,
      frame: Math.round((cursor + sceneDurations[i + 1] / 2) * REELS_FPS),
    });
    cursor += sceneDurations[i + 1];
  }
  // Close
  sceneTimes.push({
    name: `${String(itemCount + 1).padStart(2, '0')}-close`,
    frame: Math.round((cursor + sceneDurations[itemCount + 1] / 2) * REELS_FPS),
  });

  for (const scene of sceneTimes) {
    const outPath = path.join(outDir, `card-${scene.name}.png`);
    process.stdout.write(`  rendering ${scene.name} (frame ${scene.frame})... `);
    await runRemotionStill(compositionId, outPath, scene.frame, cardNewsPropsJson);
    console.log('✓');
  }
  console.log(`  ✅ ${sceneTimes.length}장의 카드 PNG 생성`);
}

const elapsed = ((Date.now() - t0) / 1000).toFixed(1);
console.log('');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log(`✅ 전체 완료! ${elapsed}초 소요`);
console.log(`📁 출력 폴더: ${outDir}`);
console.log('');
console.log(`🎬 릴스: open "${reelsPath}"`);
console.log(`🖼️  카드뉴스: open "${outDir}"`);
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
