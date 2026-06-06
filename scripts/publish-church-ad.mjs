// Church Ad pipeline: profile + content → structure → fetch media → BGM → TTS → render → (optional) publish.
// Produces 1920×1080 landscape church advertisement video.
//
// Usage:
//   npx tsx scripts/publish-church-ad.mjs "@/path/to/ad-content.txt" --config=config/church.json
//   npx tsx scripts/publish-church-ad.mjs "@/path/to/ad.txt" --skip-publish
//   npx tsx scripts/publish-church-ad.mjs "본문..." --title="우리교회 안내" --accent="#d4a657"
//   npx tsx scripts/publish-church-ad.mjs --slides=out/church-ad-XXXX/slides.json   # render-only mode

import { config as loadEnv } from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { readFile, mkdir, copyFile, writeFile } from 'fs/promises';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
loadEnv({ path: path.join(__dirname, '..', '.env.local') });
loadEnv({ path: path.join(__dirname, '..', '.env') });

const { structureChurchAd } = await import('../lib/church/church-ad-structure.ts');
const { fetchPhoto } = await import('../lib/reels/photo-fetcher.ts');
const { synthesizeSegments, concatenateWavs } = await import('../lib/reels/tts.ts');
const { renderReel } = await import('../lib/reels/render.ts');
const { generateMetadata } = await import('../lib/reels/metadata.ts');
const { publishToMultiplePlatforms } = await import('../lib/reels/multi-publish.ts');
const { fetchBgm, bgmToDataUri } = await import('../lib/reels/music-fetcher.ts');

const SCENE_GAP_SEC = 0.4;

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
const ACCENT_ARG = getArg('accent');
const BG_ARG = getArg('bg');
const CONFIG_PATH = getArg('config');
const SLIDES_PATH = getArg('slides'); // render-only entrypoint from web editor

// ── Load profile (optional) ─────────────────────────────────────────
let profile;
if (CONFIG_PATH) {
  try {
    const raw = await readFile(path.resolve(CONFIG_PATH), 'utf-8');
    profile = JSON.parse(raw);
  } catch (e) {
    console.warn(`⚠️  profile load 실패: ${e.message}`);
  }
}

// ── Resolve structure ───────────────────────────────────────────────
let structure;
let TEXT;

if (SLIDES_PATH) {
  const raw = await readFile(path.resolve(SLIDES_PATH), 'utf-8');
  structure = JSON.parse(raw);
  TEXT = structure.slides.map((s) => s.speakerNote).join('\n');
  console.log('🔁 슬라이드 JSON 로드 (render-only): ', SLIDES_PATH);
} else if (argText && argText.startsWith('@')) {
  TEXT = await readFile(argText.slice(1), 'utf-8');
} else if (argText && !argText.startsWith('--')) {
  TEXT = argText;
} else {
  console.error(
    'Usage: tsx scripts/publish-church-ad.mjs "@path/to/content.txt" [--config=...] [--title="..."] [--skip-publish]\n' +
    '       tsx scripts/publish-church-ad.mjs --slides=out/church-ad-XXXX/slides.json'
  );
  process.exit(1);
}

// ── Setup ────────────────────────────────────────────────────────────
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('⛪ 교회 광고 영상 생성 (1920×1080 가로형)');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
if (profile) console.log(`📇 프로필: ${profile.churchName}`);
console.log(`📝 본문 ${TEXT.length}자 / 발행: ${SKIP_PUBLISH ? '❌ 건너뜀' : `YT ${SKIP_YT ? '❌' : '✓'}`}`);
console.log('');

const t0 = Date.now();
const timestamp = Date.now();
const outDir = path.join(__dirname, '..', 'out', `church-ad-${timestamp}`);
await mkdir(outDir, { recursive: true });

// ── Step 1: Structure ─────────────────────────────────────────────
if (!structure) {
  console.log('━━━ [1/6] 광고 슬라이드 구조화 (Gemini) ━━━');
  structure = await structureChurchAd(TEXT, profile, TITLE_ARG);
  console.log(`  ✅ 제목: "${structure.title}"`);
  console.log(`  ⛪ 교회: "${structure.churchName}"`);
  console.log(`  📋 슬라이드 ${structure.slides.length}장:`);
  structure.slides.forEach((s, i) =>
    console.log(`     ${i + 1}. [${s.type}] "${s.heading}"`)
  );
  console.log(`  🎵 BGM 무드: ${structure.bgmMood}`);
  console.log('');
  await writeFile(path.join(outDir, 'slides.json'), JSON.stringify(structure, null, 2), 'utf-8');
}

if (ACCENT_ARG) structure.accentColor = ACCENT_ARG;
if (BG_ARG) structure.backgroundColor = BG_ARG;

// ── Step 2: Background media ─────────────────────────────────────
console.log('━━━ [2/6] 배경 미디어 로드 ━━━');
const sourceIcon = { pixabay: '🌐', pexels: '📷', canva: '🎨', local: '📁' };

const slideMedia = await Promise.all(
  structure.slides.map(async (slide, i) => {
    // Already-resolved data URI from web editor (uploads or external URL)
    if (slide.mediaDataUri) {
      console.log(`  📁 슬라이드 ${i + 1} [${slide.mediaType ?? 'image'}] — 사용자 미디어`);
      return { dataUri: slide.mediaDataUri, mediaType: slide.mediaType ?? 'image', source: 'local', credit: '' };
    }
    // Local upload URL
    if (slide.mediaUrl && slide.mediaUrl.startsWith('/uploads/')) {
      const filePath = path.join(__dirname, '..', 'public', slide.mediaUrl);
      try {
        const buf = await readFile(filePath);
        const ext = path.extname(filePath).slice(1).toLowerCase();
        const mime = ext === 'mp4' ? 'video/mp4' : ext === 'webm' ? 'video/webm' : `image/${ext === 'jpg' ? 'jpeg' : ext}`;
        const mediaType = mime.startsWith('video') ? 'video' : 'image';
        console.log(`  📁 슬라이드 ${i + 1} [${mediaType}] — 업로드 파일`);
        return { dataUri: `data:${mime};base64,${buf.toString('base64')}`, mediaType, source: 'local', credit: '' };
      } catch {
        console.log(`  ⚠️  슬라이드 ${i + 1}: 업로드 파일 누락 — 검색으로 대체`);
      }
    }
    if (!slide.imageSearchQuery) return null;
    const media = await fetchPhoto(slide.imageSearchQuery);
    if (media) {
      console.log(
        `  ${sourceIcon[media.source] ?? '✅'} 슬라이드 ${i + 1} [${media.mediaType}] — ${media.source}: ${media.credit.slice(0, 50)}`
      );
      slide.isStock = true;
      return { dataUri: media.dataUri + '#stock', mediaType: media.mediaType, source: media.source, credit: media.credit };
    } else {
      console.log(`  ⚠️  슬라이드 ${i + 1}: 배경 없음 (단색)`);
    }
    return media;
  })
);
console.log('');

// ── Step 3: BGM ──────────────────────────────────────────────────────
console.log('━━━ [3/6] BGM 검색/생성 ━━━');
const bgm = await fetchBgm({
  mood: mapMood(structure.bgmMood),
  searchQuery: structure.musicSearchQuery,
  genPrompt: structure.musicGenPrompt,
});
const bgmIcon = { jamendo: '🎵', lyria: '🤖', local: '📁', default: '🔁' }[bgm.source];
console.log(`  ${bgmIcon} BGM (${bgm.source}): ${bgm.durationSec.toFixed(1)}초`);
console.log('');

// ── Step 4: TTS per slide ─────────────────────────────────────────────
console.log('━━━ [4/6] 슬라이드별 TTS ━━━');
const speakerNotes = structure.slides.map((s) => s.speakerNote);
const segments = await synthesizeSegments(speakerNotes, { voiceName: 'Kore' });
const totalAudioSec =
  segments.reduce((s, x) => s + x.durationSec, 0) +
  SCENE_GAP_SEC * Math.max(0, segments.length - 1);
console.log(`  ✅ ${segments.length}개 슬라이드 / ${totalAudioSec.toFixed(1)}초`);
console.log('');

// ── Step 5: Render ───────────────────────────────────────────────────
console.log('━━━ [5/6] ChurchAdReel MP4 렌더 (1920×1080) ━━━');
const concatenated = concatenateWavs(segments.map((s) => s.audioBuffer), SCENE_GAP_SEC);
const audioDataUri = `data:audio/wav;base64,${concatenated.toString('base64')}`;
const sceneDurations = segments.map(
  (s, i) => s.durationSec + (i < segments.length - 1 ? SCENE_GAP_SEC : 0)
);

const bgmDataUri = await bgmToDataUri(bgm, totalAudioSec + 3);

const renderData = {
  title: structure.title,
  churchName: structure.churchName,
  slogan: structure.slogan,
  accentColor: structure.accentColor,
  backgroundColor: structure.backgroundColor,
  logoDataUri: structure.logoDataUri,
  stylePreset: structure.stylePreset,
  bgOverlayOpacity: structure.bgOverlayOpacity,
  slides: structure.slides.map((slide, i) => ({
    type: slide.type,
    heading: slide.heading,
    subheading: slide.subheading,
    bullets: slide.bullets,
    services: slide.services,
    programs: slide.programs,
    pastorName: slide.pastorName,
    pastorTitle: slide.pastorTitle,
    pastorMessage: slide.pastorMessage,
    eventDate: slide.eventDate,
    eventLocation: slide.eventLocation,
    verse: slide.verse,
    verseRef: slide.verseRef,
    address: slide.address,
    transit: slide.transit,
    phone: slide.phone,
    website: slide.website,
    socials: slide.socials,
    cta: slide.cta,
    mediaDataUri: slideMedia[i]?.dataUri,
    mediaType: slideMedia[i]?.mediaType ?? 'image',
  })),
  audioUrl: audioDataUri,
  audioDurationSec: totalAudioSec,
  sceneDurationsSec: sceneDurations,
  bgmUrl: bgmDataUri.dataUri,
  bgmVolume: bgm.volume ?? 0.1,
  bgmTrackDurationSec: bgmDataUri.durationSec,
};

const rendered = await renderReel({ template: 'church-ad', data: renderData });
const videoPath = path.join(outDir, 'church-ad.mp4');
await copyFile(rendered.localPath, videoPath);
console.log(`  ✅ ${videoPath}`);
console.log('');

// ── Step 6: Metadata + publish ────────────────────────────────────────
console.log('━━━ [6/6] 메타데이터 ━━━');
const metadata = await generateMetadata({
  text: TEXT,
  template: 'church-ad',
  data: {
    title: structure.title,
    churchName: structure.churchName,
    slides: structure.slides.map((s) => ({ type: s.type, heading: s.heading })),
  },
  narration: speakerNotes.join('\n'),
}).catch(() => ({
  // Minimal fallback so render-only flow keeps working without Gemini metadata wiring
  youtubeTitle: (TITLE_ARG || structure.title).slice(0, 100),
  youtubeDescription: `${structure.churchName} 광고 영상\n\n${speakerNotes.join('\n')}`,
  youtubeTags: ['교회', '광고', structure.churchName],
}));

metadata.youtubeTitle = (TITLE_ARG || metadata.youtubeTitle || structure.title).slice(0, 100);
await writeFile(path.join(outDir, 'metadata.json'), JSON.stringify(metadata, null, 2), 'utf-8');
console.log(`  📺 YT: "${metadata.youtubeTitle}"`);
console.log('');

if (SKIP_PUBLISH) {
  console.log('━━━ 발행 건너뜀 (--skip-publish) ━━━');
} else {
  console.log('━━━ YouTube 발행 ━━━');
  const ytPrivacy = YT_PRIVATE ? 'private' : YT_UNLISTED ? 'unlisted' : 'public';
  const pub = await publishToMultiplePlatforms({
    videoPath,
    metadata,
    publishToInstagram: false,
    publishToYouTube: !SKIP_YT,
    youtubePrivacy: ytPrivacy,
  });
  if (pub.youtube) {
    if ('error' in pub.youtube) console.log(`  ❌ YouTube: ${pub.youtube.error}`);
    else console.log(`  ✅ YouTube: ${pub.youtube.videoUrl ?? pub.youtube.videoId}`);
  }
  await writeFile(path.join(outDir, 'publish-result.json'), JSON.stringify(pub, null, 2), 'utf-8');
}

console.log('');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log(`✅ 완료! ${((Date.now() - t0) / 1000).toFixed(1)}초 소요`);
console.log(`📁 ${outDir}`);
console.log(`🎬 ${(totalAudioSec / 60).toFixed(2)}분 광고`);
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

function mapMood(churchMood) {
  // Map church-ad moods → BGM library moods
  switch (churchMood) {
    case 'reverent': return 'contemplative';
    case 'uplifting': return 'energetic';
    case 'warm': return 'emotional';
    case 'hopeful': return 'calm';
    default: return 'calm';
  }
}
