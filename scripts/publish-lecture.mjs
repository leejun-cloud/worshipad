// Lecture video pipeline: structure content → fetch media → BGM → TTS → render → publish.
// Produces 1920×1080 landscape lecture video for YouTube.
// Usage:
//   npx tsx scripts/publish-lecture.mjs "@/path/to/content.txt"
//   npx tsx scripts/publish-lecture.mjs "본문 직접 입력..." --title="강의 제목"
//   npx tsx scripts/publish-lecture.mjs "@/path/to/content.txt" --skip-publish
//   npx tsx scripts/publish-lecture.mjs "@/path/to/content.txt" --yt-private

import { config as loadEnv } from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { readFile, mkdir, copyFile, writeFile } from 'fs/promises';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
loadEnv({ path: path.join(__dirname, '..', '.env.local') });
loadEnv({ path: path.join(__dirname, '..', '.env') });

const { structureLecture } = await import('../lib/reels/lecture-structure.ts');
const { fetchPhoto } = await import('../lib/reels/photo-fetcher.ts');
const { synthesizeSegments, concatenateWavs } = await import('../lib/reels/tts.ts');
const { renderReel, renderThumbnail } = await import('../lib/reels/render.ts');
const { generateMetadata } = await import('../lib/reels/metadata.ts');
const { publishToMultiplePlatforms } = await import('../lib/reels/multi-publish.ts');
const { fetchBgm, bgmToDataUri } = await import('../lib/reels/music-fetcher.ts');
const { REELS_FPS } = await import('../remotion/types.ts');

const SCENE_GAP_SEC = 0.5; // slightly longer gap between lecture slides

// ── Args ────────────────────────────────────────────────────────────
const args = process.argv.slice(2);
const getArg = (name) => {
  const a = args.find((x) => x.startsWith(`--${name}=`));
  return a ? a.split('=').slice(1).join('=') : undefined;
};
const hasFlag = (name) => args.includes(`--${name}`);
const argText = args.find((a) => !a.startsWith('--'));

const SKIP_PUBLISH = hasFlag('skip-publish');
const SKIP_YT = hasFlag('skip-yt');
const YT_PRIVATE = hasFlag('yt-private');
const YT_UNLISTED = hasFlag('yt-unlisted');
const TITLE_ARG = getArg('title');
const ACCENT_ARG = getArg('accent'); // hex color, e.g. --accent=#e84393

// ── Input ────────────────────────────────────────────────────────────
let TEXT, TITLE;

if (argText && argText.startsWith('@')) {
  TEXT = await readFile(argText.slice(1), 'utf-8');
  TITLE = TITLE_ARG;
} else if (argText && !argText.startsWith('--')) {
  TEXT = argText;
  TITLE = TITLE_ARG;
} else {
  console.error(
    'Usage: tsx scripts/publish-lecture.mjs "@path/to/content.txt" [--title="..."] [--speaker="..."] [--skip-publish]'
  );
  process.exit(1);
}

// ── Setup ────────────────────────────────────────────────────────────
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('🎓 강의 영상 생성 (D형, 1920×1080 가로형)');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log(`📝 본문 ${TEXT.length}자 / 발행: ${SKIP_PUBLISH ? '❌ 건너뜀' : `YT ${SKIP_YT ? '❌' : '✓'}`}`);
if (ACCENT_ARG) console.log(`🎨 액센트: ${ACCENT_ARG}`);
console.log('');

const t0 = Date.now();
const timestamp = Date.now();
const outDir = path.join(__dirname, '..', 'out', `lecture-${timestamp}`);
await mkdir(outDir, { recursive: true });

// ── Step 1: Structure lecture ─────────────────────────────────────────
console.log('━━━ [1/6] 강의 슬라이드 구조화 (Gemini) ━━━');
const structure = await structureLecture(TEXT, TITLE);
console.log(`  ✅ 제목: "${structure.title}"`);
console.log(`  📋 슬라이드 ${structure.slides.length}장:`);
structure.slides.forEach((s, i) =>
  console.log(`     ${i + 1}. [${s.type}] "${s.heading}"`)
);
console.log(`  🎵 BGM 무드: ${structure.bgmMood}`);
console.log('');

await writeFile(path.join(outDir, 'lecture-draft.json'), JSON.stringify(structure, null, 2), 'utf-8');

// ── Step 2: Fetch background media for content slides ─────────────────
console.log('━━━ [2/6] 배경 미디어 검색 (Pixabay / Pexels) ━━━');
const sourceIcon = { pixabay: '🌐', pexels: '📷', canva: '🎨' };

const slideMedia = await Promise.all(
  structure.slides.map(async (slide, i) => {
    if (slide.type !== 'content' || !slide.imageSearchQuery) return null;
    const media = await fetchPhoto(slide.imageSearchQuery);
    if (media) {
      console.log(
        `  ${sourceIcon[media.source] ?? '✅'} 슬라이드 ${i + 1} [${media.mediaType}] — ${media.source}: ${media.credit.slice(0, 50)}`
      );
    } else {
      console.log(`  ⚠️  슬라이드 ${i + 1}: 배경 없음 (단색 사용)`);
    }
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

// ── Step 4: TTS per slide ─────────────────────────────────────────────
console.log('━━━ [4/6] 슬라이드별 TTS 음성 생성 ━━━');
const speakerNotes = structure.slides.map((s) => s.speakerNote);
const segments = await synthesizeSegments(speakerNotes, { voiceName: 'Kore' });
const totalAudioSec =
  segments.reduce((s, x) => s + x.durationSec, 0) +
  SCENE_GAP_SEC * Math.max(0, segments.length - 1);
console.log(`  ✅ ${segments.length}개 슬라이드, 총 ${totalAudioSec.toFixed(1)}초 (${(totalAudioSec / 60).toFixed(1)}분)`);
console.log('');

// ── Step 5: Render ───────────────────────────────────────────────────
console.log('━━━ [5/6] LectureReel MP4 렌더링 (1920×1080) ━━━');
const concatenated = concatenateWavs(segments.map((s) => s.audioBuffer), SCENE_GAP_SEC);
const audioDataUri = `data:audio/wav;base64,${concatenated.toString('base64')}`;
const sceneDurations = segments.map(
  (s, i) => s.durationSec + (i < segments.length - 1 ? SCENE_GAP_SEC : 0)
);

const bgmDataUri = await bgmToDataUri(bgm, totalAudioSec + 3);
console.log(`  📦 BGM: ${(bgmDataUri.sizeBytes / 1024).toFixed(0)}KB, ${bgmDataUri.durationSec.toFixed(1)}s`);

const renderData = {
  title: structure.title,
  accentColor: ACCENT_ARG || '#4f8ef7',
  slides: structure.slides.map((slide, i) => ({
    type: slide.type,
    heading: slide.heading,
    subheading: slide.subheading,
    bullets: slide.bullets,
    quote: slide.quote,
    attribution: slide.attribution,
    cta: slide.cta,
    speaker: slide.speaker,
    mediaDataUri: slideMedia[i]?.dataUri,
    mediaType: slideMedia[i]?.mediaType ?? 'image',
  })),
  audioUrl: audioDataUri,
  audioDurationSec: totalAudioSec,
  sceneDurationsSec: sceneDurations,
  bgmUrl: bgmDataUri.dataUri,
  bgmVolume: bgm.volume,
  bgmTrackDurationSec: bgmDataUri.durationSec,
};

const rendered = await renderReel({ template: 'lecture', data: renderData });
const lecturePath = path.join(outDir, 'lecture.mp4');
await copyFile(rendered.localPath, lecturePath);
console.log(`  ✅ ${lecturePath}`);

// ── Thumbnail ────────────────────────────────────────────────────
const thumbnailPath = path.join(outDir, 'thumbnail.jpg');
const titleSlide = structure.slides.find((s) => s.type === 'title');
const coverMedia = slideMedia[0];
await renderThumbnail({
  compositionId: 'LectureThumbnail',
  data: {
    title: structure.title,
    subtitle: titleSlide?.subheading,
    accentColor: ACCENT_ARG || '#4f8ef7',
    mediaDataUri: coverMedia?.dataUri,
    mediaType: coverMedia?.mediaType ?? 'image',
  },
  outputPath: thumbnailPath,
});
console.log(`  🖼  썸네일: ${thumbnailPath}`);
console.log('');

// ── Step 6: Metadata + YouTube chapters ──────────────────────────────
console.log('━━━ [6/6] 메타데이터 생성 (Gemini) ━━━');
const metadata = await generateMetadata({
  text: TEXT,
  template: 'lecture',
  data: {
    title: structure.title,
    slides: structure.slides.map((s) => ({ type: s.type, heading: s.heading, bullets: s.bullets })),
  },
  narration: speakerNotes.join('\n'),
});

// Build YouTube chapter timestamps from cumulative durations
let cumSec = 0;
const chapters = structure.slides
  .filter((s) => s.type !== 'agenda')
  .map((s, i) => {
    const label = s.type === 'title' ? '인트로' : s.type === 'summary' ? '핵심 정리' : s.heading;
    const ts = cumSec;
    // advance by actual duration for this slide
    cumSec += sceneDurations[structure.slides.indexOf(s)] ?? 15;
    const mm = Math.floor(ts / 60).toString().padStart(2, '0');
    const ss = Math.floor(ts % 60).toString().padStart(2, '0');
    return `${mm}:${ss} ${label}`;
  });

// For YouTube: title without #Shorts, with chapters in description
metadata.youtubeTitle = (TITLE || structure.title).slice(0, 100);
metadata.youtubeDescription =
  (metadata.youtubeDescription || '') + '\n\n' + chapters.join('\n');

await writeFile(path.join(outDir, 'metadata.json'), JSON.stringify(metadata, null, 2), 'utf-8');
console.log(`  📺 YT: "${metadata.youtubeTitle}"`);
console.log(`  ⏱  챕터 ${chapters.length}개:\n${chapters.map((c) => '     ' + c).join('\n')}`);
console.log('');

if (SKIP_PUBLISH) {
  console.log('━━━ 발행 건너뜀 (--skip-publish) ━━━');
} else {
  console.log('━━━ YouTube 발행 ━━━');
  const ytPrivacy = YT_PRIVATE ? 'private' : YT_UNLISTED ? 'unlisted' : 'public';
  const pub = await publishToMultiplePlatforms({
    videoPath: lecturePath,
    metadata,
    publishToInstagram: false, // lecture = YouTube only
    publishToYouTube: !SKIP_YT,
    youtubePrivacy: ytPrivacy,
    coverImagePath: thumbnailPath,
  });

  if (pub.publicVideoUrl) console.log(`  🌐 영상 호스팅: ${pub.publicVideoUrl}`);
  if (pub.youtube) {
    if ('error' in pub.youtube) {
      console.log(`  ❌ YouTube 실패: ${pub.youtube.error}`);
    } else {
      console.log(`  ✅ YouTube: ${pub.youtube.videoUrl ?? pub.youtube.videoId}`);
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
console.log(`🎬 ${(totalAudioSec / 60).toFixed(1)}분 강의 영상`);
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
