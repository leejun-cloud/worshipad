// Photo card news pipeline: structure content → AI images → TTS → render → publish.
// Produces 손힘찬-style cinematic photo cards (AI image background + bold copy).
// Usage:
//   npx tsx scripts/publish-photo.mjs "@/path/to/content.txt"
//   npx tsx scripts/publish-photo.mjs "본문 직접 입력..." --title="후킹 제목"
//   npx tsx scripts/publish-photo.mjs --auto                   # discover topic automatically
//   npx tsx scripts/publish-photo.mjs "@/path/to/content.txt" --skip-publish
//   npx tsx scripts/publish-photo.mjs "@/path/to/content.txt" --yt-private

import { config as loadEnv } from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { readFile, mkdir, copyFile, writeFile } from 'fs/promises';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
loadEnv({ path: path.join(__dirname, '..', '.env.local') });
loadEnv({ path: path.join(__dirname, '..', '.env') });

const { structurePhotoContent } = await import('../lib/reels/photo-structure.ts');
const { fetchPhoto } = await import('../lib/reels/photo-fetcher.ts');
const { synthesizeSegments, concatenateWavs } = await import('../lib/reels/tts.ts');
const { renderReel } = await import('../lib/reels/render.ts');
const { generateMetadata } = await import('../lib/reels/metadata.ts');
const { publishToMultiplePlatforms } = await import('../lib/reels/multi-publish.ts');
const { fetchBgm, bgmToDataUri } = await import('../lib/reels/music-fetcher.ts');
const { REELS_FPS } = await import('../remotion/types.ts');
const { discoverTopic } = await import('../lib/auto/topic-discovery.ts');
const { generateAndPickTitle } = await import('../lib/auto/title-generator.ts');
const { generateContentFromTitle } = await import('../lib/auto/content-from-title.ts');

const SCENE_GAP_SEC = 0.3;

// ── Args ────────────────────────────────────────────────────────────
const args = process.argv.slice(2);
const getArg = (name) => {
  const a = args.find((x) => x.startsWith(`--${name}=`));
  return a ? a.split('=').slice(1).join('=') : undefined;
};
const hasFlag = (name) => args.includes(`--${name}`);
const argText = args.find((a) => !a.startsWith('--'));

const IS_AUTO = hasFlag('auto');
const SKIP_PUBLISH = hasFlag('skip-publish');
const SKIP_YT = hasFlag('skip-yt');
const SKIP_IG = hasFlag('skip-ig');
const YT_PRIVATE = hasFlag('yt-private');
const YT_UNLISTED = hasFlag('yt-unlisted');
const TITLE_ARG = getArg('title');

// ── Input ────────────────────────────────────────────────────────────
let TEXT, TITLE;

if (IS_AUTO) {
  console.log('━━━ 토픽 자동 발굴 중... ━━━');
  const topic = await discoverTopic('pool', {});
  console.log(`📍 토픽: "${topic.topic}"`);
  const ranking = await generateAndPickTitle(topic.topic, 8, topic.contextHint);
  TITLE = ranking.bestTitle;
  TEXT = await generateContentFromTitle(TITLE, topic.contextHint);
  console.log(`🎯 제목: "${TITLE}" (${ranking.score}/10)`);
  console.log('');
} else if (argText && argText.startsWith('@')) {
  TEXT = await readFile(argText.slice(1), 'utf-8');
  TITLE = TITLE_ARG;
} else if (argText && !argText.startsWith('--')) {
  TEXT = argText;
  TITLE = TITLE_ARG;
} else {
  console.error(
    'Usage: tsx scripts/publish-photo.mjs "@path/to/content.txt" [--title="..."] [--auto] [--skip-publish]'
  );
  process.exit(1);
}

// ── Setup ────────────────────────────────────────────────────────────
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('📷 포토 카드뉴스 생성 + 자동 발행 (IG Reels + YouTube Shorts)');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log(`📝 본문 ${TEXT.length}자 / 발행: ${SKIP_PUBLISH ? '❌ 건너뜀' : `IG ${SKIP_IG ? '❌' : '✓'} / YT ${SKIP_YT ? '❌' : '✓'}`}`);
console.log('');

const t0 = Date.now();
const timestamp = Date.now();
const outDir = path.join(__dirname, '..', 'out', `photo-${timestamp}`);
await mkdir(outDir, { recursive: true });

// ── Step 1: Structure for photo cards ────────────────────────────────
console.log('━━━ [1/6] 포토 카드 구조화 (Gemini) ━━━');
const structure = await structurePhotoContent(TEXT, TITLE);
console.log(`  ✅ 표지 후킹: "${structure.hookHeadline}"`);
console.log(`  📋 카드 ${structure.cards.length}장:`);
structure.cards.forEach((c, i) => console.log(`     ${i + 1}. "${c.headline}" — ${c.body}`));
console.log(`  🎯 CTA: "${structure.cta}"`);
console.log(`  🎵 BGM 무드: ${structure.bgmMood}`);
console.log('');

await writeFile(path.join(outDir, 'photo-draft.json'), JSON.stringify(structure, null, 2), 'utf-8');

// ── Step 2: Media fetch (Pixabay → Pexels → Canva → gradient) ────────
console.log('━━━ [2/6] 미디어 검색 (Pixabay / Pexels / Canva) ━━━');

const coverMediaResult = await fetchPhoto(structure.coverImageSearchQuery);
const coverImageDataUri = coverMediaResult?.dataUri;
const coverMediaType = coverMediaResult?.mediaType ?? 'image';
const sourceIcon = { pixabay: '🌐', pexels: '📷', canva: '🎨' };
console.log(
  `  ${coverMediaResult ? `${sourceIcon[coverMediaResult.source] ?? '✅'} 표지 [${coverMediaResult.mediaType}] — ${coverMediaResult.source}: ${coverMediaResult.credit}` : '⚠️  표지: 그라디언트 사용 (미디어 소스 없음)'}`
);

const cardMediaResults = await Promise.all(
  structure.cards.map(async (card, i) => {
    const media = await fetchPhoto(card.imageSearchQuery);
    console.log(
      `  ${media ? `${sourceIcon[media.source] ?? '✅'} 카드 ${i + 1} [${media.mediaType}] — ${media.source}` : `⚠️  카드 ${i + 1}: 그라디언트`} — "${card.headline}"`
    );
    return media;
  })
);
console.log('');

// ── Step 3: BGM ──────────────────────────────────────────────────────
console.log('━━━ [3/6] BGM 검색/생성 ━━━');
const bgm = await fetchBgm({
  mood: structure.bgmMood,
  searchQuery: structure.musicSearchQuery,
  genPrompt: structure.musicGenPrompt,
});
const sourceEmoji = { jamendo: '🎵', lyria: '🤖', local: '📁', default: '🔁' }[bgm.source];
console.log(`  ${sourceEmoji} BGM (${bgm.source}): ${bgm.durationSec.toFixed(1)}초`);
if (bgm.attribution) console.log(`     ↳ ${bgm.attribution}`);
console.log('');

// ── Step 4: TTS ──────────────────────────────────────────────────────
console.log('━━━ [4/6] 장면별 TTS 음성 생성 ━━━');
const segments = await synthesizeSegments(structure.narrationSegments, { voiceName: 'Kore' });
const totalAudioSec =
  segments.reduce((s, x) => s + x.durationSec, 0) +
  SCENE_GAP_SEC * Math.max(0, segments.length - 1);
console.log(`  ✅ ${segments.length}개 세그먼트, ${totalAudioSec.toFixed(1)}초`);
console.log('');

// ── Step 5: Render ───────────────────────────────────────────────────
console.log('━━━ [5/6] PhotoReel MP4 렌더링 ━━━');
const concatenated = concatenateWavs(segments.map((s) => s.audioBuffer), SCENE_GAP_SEC);
const audioDataUri = `data:audio/wav;base64,${concatenated.toString('base64')}`;
const sceneDurations = segments.map(
  (s, i) => s.durationSec + (i < segments.length - 1 ? SCENE_GAP_SEC : 0)
);
const bgmDataUri = await bgmToDataUri(bgm, totalAudioSec + 2);
console.log(`  📦 BGM data URI: ${(bgmDataUri.sizeBytes / 1024).toFixed(0)}KB, ${bgmDataUri.durationSec.toFixed(1)}s`);

const renderData = {
  hookHeadline: structure.hookHeadline,
  coverImageDataUri,
  coverMediaType,
  cards: structure.cards.map((card, i) => ({
    headline: card.headline,
    body: card.body,
    imageDataUri: cardMediaResults[i]?.dataUri,
    mediaType: cardMediaResults[i]?.mediaType ?? 'image',
  })),
  cta: structure.cta,
  audioUrl: audioDataUri,
  audioDurationSec: totalAudioSec,
  sceneDurationsSec: sceneDurations,
  bgmUrl: bgmDataUri.dataUri,
  bgmVolume: bgm.volume,
  bgmTrackDurationSec: bgmDataUri.durationSec,
};

const rendered = await renderReel({ template: 'photo', data: renderData });
const reelsPath = path.join(outDir, 'reels.mp4');
await copyFile(rendered.localPath, reelsPath);
console.log(`  ✅ ${reelsPath}`);
console.log('');

// ── Step 6: Metadata + publish ───────────────────────────────────────
console.log('━━━ [6/6] 클릭 최적화 메타데이터 생성 (Gemini) ━━━');
const metadata = await generateMetadata({
  text: TEXT,
  template: 'photo',
  data: {
    hookHeadline: structure.hookHeadline,
    cards: structure.cards.map((c) => ({ headline: c.headline, body: c.body })),
    cta: structure.cta,
  },
  narration: structure.narration,
});

// Override YT title with hook headline for maximum CTR
if (!metadata.youtubeTitle.includes(structure.hookHeadline)) {
  const hook = structure.hookHeadline.slice(0, 70);
  metadata.youtubeTitle = `${hook} #Shorts`.slice(0, 100);
}

await writeFile(path.join(outDir, 'metadata.json'), JSON.stringify(metadata, null, 2), 'utf-8');
console.log(`  📺 YT: "${metadata.youtubeTitle}"`);
console.log(`  📱 IG: ${metadata.instagramCaption.length}자, 해시태그 ${metadata.instagramHashtags?.length || 0}개`);
console.log('');

if (SKIP_PUBLISH) {
  console.log('━━━ 발행 건너뜀 (--skip-publish) ━━━');
} else {
  console.log('━━━ 자동 발행 ━━━');
  const ytPrivacy = YT_PRIVATE ? 'private' : YT_UNLISTED ? 'unlisted' : 'public';
  const pub = await publishToMultiplePlatforms({
    videoPath: reelsPath,
    metadata,
    publishToInstagram: !SKIP_IG,
    publishToYouTube: !SKIP_YT,
    youtubePrivacy: ytPrivacy,
  });

  if (pub.publicVideoUrl) console.log(`  🌐 영상 호스팅: ${pub.publicVideoUrl}`);
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

console.log('');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log(`✅ 전체 완료! ${((Date.now() - t0) / 1000).toFixed(1)}초 소요`);
console.log(`📁 ${outDir}`);
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
