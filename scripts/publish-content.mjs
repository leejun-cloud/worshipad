// End-to-end pipeline: generate reel + card news, then publish to IG Reels and YouTube Shorts.
// Usage:
//   npx tsx scripts/publish-content.mjs "@/path/to/content.txt"
//   npx tsx scripts/publish-content.mjs "본문 직접 입력..." --skip-publish
//   npx tsx scripts/publish-content.mjs "@/path/to/content.txt" --yt-private

import { config as loadEnv } from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { readFile, mkdir, copyFile, writeFile } from 'fs/promises';
import { spawn } from 'child_process';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
loadEnv({ path: path.join(__dirname, '..', '.env.local') });
loadEnv({ path: path.join(__dirname, '..', '.env') });

const { classifyReels } = await import('../lib/reels/classify.ts');
const { runMultiAgentReview, classifyWithFeedback } = await import('../lib/reels/review.ts');
const { synthesizeSegments, concatenateWavs } = await import('../lib/reels/tts.ts');
const { renderReel, COMPOSITION_MAP } = await import('../lib/reels/render.ts');
const { generateMetadata } = await import('../lib/reels/metadata.ts');
const { publishToMultiplePlatforms } = await import('../lib/reels/multi-publish.ts');
const { fetchBgm, bgmToDataUri } = await import('../lib/reels/music-fetcher.ts');
const { REELS_FPS } = await import('../remotion/types.ts');
const { rewriteHeadlineAsHook, HEADLINE_FIELD } = await import('../lib/reels/hook-headline.ts');

const SCENE_GAP_SEC = 0.3;

// Args
const args = process.argv.slice(2);
const argText = args[0];
const skipPublish = args.includes('--skip-publish');
const skipYT = args.includes('--skip-yt');
const skipIG = args.includes('--skip-ig');
const ytPrivate = args.includes('--yt-private');
const ytUnlisted = args.includes('--yt-unlisted');

let TEXT;
if (argText && argText.startsWith('@')) {
  TEXT = await readFile(argText.slice(1), 'utf-8');
} else if (argText && !argText.startsWith('--')) {
  TEXT = argText;
} else {
  console.error('Usage: tsx scripts/publish-content.mjs "@/path/to/content.txt" [--skip-publish] [--skip-yt] [--skip-ig] [--yt-private]');
  process.exit(1);
}

const runRemotionStill = (compositionId, outputPath, frame, propsJson) => {
  return new Promise((resolve, reject) => {
    const p = spawn('npx', [
      'remotion', 'still', 'remotion/index.ts', compositionId, outputPath,
      `--frame=${frame}`, `--props=${propsJson}`,
    ], { stdio: ['ignore', 'pipe', 'pipe'] });
    let err = '';
    p.stderr.on('data', (d) => (err += d.toString()));
    p.on('exit', (code) => (code === 0 ? resolve(true) : reject(new Error(err))));
  });
};

console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('🚀 콘텐츠 생성 + 자동 발행 (IG Reels + YouTube Shorts)');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log(`📝 본문 ${TEXT.length}자 / 발행: ${skipPublish ? '❌ 건너뜀' : `IG ${skipIG ? '❌' : '✓'} / YT ${skipYT ? '❌' : '✓'}`}`);
console.log('');

const t0 = Date.now();
const timestamp = Date.now();
const outDir = path.join(__dirname, '..', 'out', `content-${timestamp}`);
await mkdir(outDir, { recursive: true });

// 1. Classify
console.log('━━━ [1/7] Gemini 분류 + 내레이션 분할 + BGM 무드 선정 ━━━');
let cls = await classifyReels(TEXT);
console.log(`  ✅ 템플릿: ${cls.template} / 세그먼트 ${cls.narrationSegments.length}개 / BGM 무드: ${cls.bgmMood}`);
if (Array.isArray(cls.data.items)) {
  const styles = cls.data.items.map((it) => it.cardStyle || 'default').join(' · ');
  console.log(`  🎨 카드 스타일 믹스: ${styles}`);
}

// 1b. Hook headline rewrite (list/news only — non-fatal)
const _headlineField = HEADLINE_FIELD[cls.template];
if (_headlineField && cls.data[_headlineField]) {
  const hookResult = await rewriteHeadlineAsHook({
    headline: cls.data[_headlineField],
    template: cls.template,
    narration: cls.narration,
  });
  cls.data[_headlineField] = hookResult.headline;
  if (hookResult.wasRewritten) {
    console.log(`  🎯 표지 후킹: "${hookResult.headline}" (${hookResult.score}/10)`);
    console.log(`     원본: "${hookResult.original}" — ${hookResult.reason}`);
  }
}
console.log('');

// 2. Multi-agent review (hooking expert + copy editor in parallel)
console.log('━━━ [2/7] 멀티에이전트 검증 (후킹 전문가 + 카피 에디터 병렬) ━━━');
let review = await runMultiAgentReview(cls);
console.log(review.combinedFeedback.split('\n').map((l) => `  ${l}`).join('\n'));

if (review.needsRegeneration) {
  console.log(`\n  🔄 후킹/카피 약함 → 피드백 반영해서 재작성...`);
  cls = await classifyWithFeedback(TEXT, review.combinedFeedback);
  review = await runMultiAgentReview(cls);
  console.log(`  📊 재작성 후 후킹 ${review.hooking.score}/10`);
}
console.log('');

// 3. BGM
console.log('━━━ [3/7] BGM 검색/생성 ━━━');
const bgm = await fetchBgm({
  mood: cls.bgmMood,
  searchQuery: cls.musicSearchQuery,
  genPrompt: cls.musicGenPrompt,
});
const sourceEmoji = { jamendo: '🎵', lyria: '🤖', local: '📁', default: '🔁' }[bgm.source];
console.log(`  ${sourceEmoji} BGM (${bgm.source}): ${bgm.publicUrl} (${bgm.durationSec.toFixed(1)}초)`);
if (bgm.attribution) console.log(`     ↳ ${bgm.attribution}`);
console.log('');

// Save workspace draft (for review/audit)
await writeFile(
  path.join(outDir, 'draft.json'),
  JSON.stringify({
    template: cls.template,
    bgmMood: cls.bgmMood,
    data: cls.data,
    narrationSegments: cls.narrationSegments,
    review: { hookingScore: review.hooking.score, copyPass: review.copy.pass },
  }, null, 2),
  'utf-8'
);
console.log(`  💾 draft.json 저장: ${path.join(outDir, 'draft.json')}`);
console.log('');

// 4. Per-segment TTS
console.log('━━━ [4/7] 장면별 TTS 음성 생성 ━━━');
const segments = await synthesizeSegments(cls.narrationSegments, { voiceName: 'Kore' });
const totalAudioSec = segments.reduce((s, x) => s + x.durationSec, 0) +
                      SCENE_GAP_SEC * Math.max(0, segments.length - 1);
console.log(`  ✅ ${segments.length}개 세그먼트, 합계 ${totalAudioSec.toFixed(1)}초`);
console.log('');

// 5. Render MP4
console.log('━━━ [5/7] Reels MP4 렌더링 ━━━');
const concatenated = concatenateWavs(segments.map((s) => s.audioBuffer), SCENE_GAP_SEC);
const audioDataUri = `data:audio/wav;base64,${concatenated.toString('base64')}`;
const sceneDurations = segments.map((s, i) =>
  s.durationSec + (i < segments.length - 1 ? SCENE_GAP_SEC : 0)
);
// Trim BGM to ~video length and convert to data URI (avoids bundle static-dir issue)
const bgmDataUri = await bgmToDataUri(bgm, totalAudioSec + 2);
console.log(`  📦 BGM data URI: ${(bgmDataUri.sizeBytes / 1024).toFixed(0)}KB, ${bgmDataUri.durationSec.toFixed(1)}s`);
// Palette seed: random per video so each new video uses a different
// rotation start, ensuring the IG/YT feed grid stays visually diverse
// even across multiple posts.
const paletteSeed = Math.floor(Math.random() * 10);
const renderData = {
  ...cls.data,
  audioUrl: audioDataUri,
  audioDurationSec: totalAudioSec,
  sceneDurationsSec: sceneDurations,
  bgmUrl: bgmDataUri.dataUri,
  bgmVolume: bgm.volume,
  bgmTrackDurationSec: bgmDataUri.durationSec,
  paletteSeed,
};
const rendered = await renderReel({ template: cls.template, data: renderData });
const reelsPath = path.join(outDir, `reels.mp4`);
await copyFile(rendered.localPath, reelsPath);
console.log(`  ✅ ${reelsPath}`);
console.log('');

// 6. Card news PNGs
console.log('━━━ [6/7] 카드뉴스 PNG ━━━');
const compositionId = COMPOSITION_MAP[cls.template];
const cardNewsData = { ...cls.data, audioDurationSec: totalAudioSec, sceneDurationsSec: sceneDurations, paletteSeed };
const cardNewsPropsJson = JSON.stringify(cardNewsData);

if (cls.template === 'list') {
  const itemCount = cls.data.items.length;
  let cursor = 0;
  const sceneTimes = [
    { name: '00-intro', frame: Math.round((cursor + sceneDurations[0] / 2) * REELS_FPS) },
  ];
  cursor += sceneDurations[0];
  for (let i = 0; i < itemCount; i++) {
    sceneTimes.push({
      name: `${String(i + 1).padStart(2, '0')}-item`,
      frame: Math.round((cursor + sceneDurations[i + 1] / 2) * REELS_FPS),
    });
    cursor += sceneDurations[i + 1];
  }
  sceneTimes.push({
    name: `${String(itemCount + 1).padStart(2, '0')}-close`,
    frame: Math.round((cursor + sceneDurations[itemCount + 1] / 2) * REELS_FPS),
  });

  for (const scene of sceneTimes) {
    const outPath = path.join(outDir, `card-${scene.name}.png`);
    await runRemotionStill(compositionId, outPath, scene.frame, cardNewsPropsJson);
  }
  console.log(`  ✅ ${sceneTimes.length}장 PNG 생성`);
}
console.log('');

// 5. Click-optimized metadata
console.log('━━━ [7/7] 클릭 최적화 메타데이터 생성 (Gemini) ━━━');
const metadata = await generateMetadata({
  text: TEXT,
  template: cls.template,
  data: cls.data,
  narration: cls.narration,
});
console.log(`  📱 IG 캡션: ${metadata.instagramCaption.length}자, 해시태그 ${metadata.instagramHashtags.length}개`);
console.log(`  📺 YT 제목: "${metadata.youtubeTitle}"`);
console.log(`  📺 YT 태그: ${metadata.youtubeTags.length}개`);

// Save metadata for review
await writeFile(
  path.join(outDir, 'metadata.json'),
  JSON.stringify(metadata, null, 2),
  'utf-8'
);
console.log(`  💾 ${path.join(outDir, 'metadata.json')}`);
console.log('');

// 6. Publish
if (skipPublish) {
  console.log('━━━ 발행 건너뜀 (--skip-publish) ━━━');
} else {
  console.log('━━━ 자동 발행 ━━━');
  const ytPrivacy = ytPrivate ? 'private' : ytUnlisted ? 'unlisted' : 'public';
  // Use intro card PNG as cover image (IG cover_url + YT custom thumbnail).
  // This gives the feed grid a striking, content-specific thumbnail.
  const coverPath = path.join(outDir, 'card-00-intro.png');
  const pub = await publishToMultiplePlatforms({
    videoPath: reelsPath,
    metadata,
    publishToInstagram: !skipIG,
    publishToYouTube: !skipYT,
    youtubePrivacy: ytPrivacy,
    coverImagePath: coverPath,
  });

  if (pub.publicVideoUrl) {
    console.log(`  🌐 영상 호스팅: ${pub.publicVideoUrl}`);
  }
  if (pub.instagram) {
    if ('error' in pub.instagram) {
      console.log(`  ❌ Instagram 실패: ${pub.instagram.error}`);
    } else {
      console.log(`  ✅ Instagram: ${pub.instagram.permalink || pub.instagram.mediaId}`);
    }
  }
  if (pub.youtube) {
    if ('error' in pub.youtube) {
      console.log(`  ❌ YouTube 실패: ${pub.youtube.error}`);
    } else {
      console.log(`  ✅ YouTube: ${pub.youtube.shortsUrl}`);
    }
  }

  await writeFile(
    path.join(outDir, 'publish-result.json'),
    JSON.stringify(pub, null, 2),
    'utf-8'
  );
}

const elapsed = ((Date.now() - t0) / 1000).toFixed(1);
console.log('');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log(`✅ 전체 완료! ${elapsed}초 소요`);
console.log(`📁 ${outDir}`);
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
