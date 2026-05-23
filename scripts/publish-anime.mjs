// E형 애니메이션 파이프라인
// 스토리 → Gemini 장면 구성 → GPT-Image-2 이미지 → Wan 2.2 영상 → TTS → FFmpeg 합성 → YouTube 발행
//
// Usage:
//   npx tsx scripts/publish-anime.mjs "@/path/to/story.txt"
//   npx tsx scripts/publish-anime.mjs "스토리 내용..." --title="제목"
//   npx tsx scripts/publish-anime.mjs "@/path/to/story.txt" --skip-publish
//   npx tsx scripts/publish-anime.mjs "@/path/to/story.txt" --text-only  # 영상 없이 이미지+TTS만

import { config as loadEnv } from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { readFile, mkdir, writeFile } from 'fs/promises';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
loadEnv({ path: path.join(__dirname, '..', '.env.local') });
loadEnv({ path: path.join(__dirname, '..', '.env') });

const { structureAnime } = await import('../lib/reels/anime-structure.ts');
const { generateSceneImage, animateImage, generateSceneVideo, downloadBuffer } = await import('../lib/reels/sources/wavespeed.ts');
const { synthesizeSegments, concatenateWavs } = await import('../lib/reels/tts.ts');
const { assembleAnimeVideo } = await import('../lib/reels/anime-assembler.ts');
const { generateMetadata } = await import('../lib/reels/metadata.ts');
const { publishToMultiplePlatforms } = await import('../lib/reels/multi-publish.ts');
const { fetchBgm } = await import('../lib/reels/music-fetcher.ts');

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
const TEXT_ONLY = hasFlag('text-only');   // Skip video gen (image+TTS only)
const NO_SUBTITLE = hasFlag('no-subtitle'); // Disable subtitle burn-in
const YT_PRIVATE = hasFlag('yt-private');
const YT_UNLISTED = hasFlag('yt-unlisted');
const TITLE_ARG = getArg('title');
const ACCENT_ARG = getArg('accent');

// ── Input ────────────────────────────────────────────────────────────
let TEXT, TITLE;
if (argText && argText.startsWith('@')) {
  TEXT = await readFile(argText.slice(1), 'utf-8');
  TITLE = TITLE_ARG;
} else if (argText && !argText.startsWith('--')) {
  TEXT = argText;
  TITLE = TITLE_ARG;
} else {
  console.error('Usage: tsx scripts/publish-anime.mjs "@path/to/story.txt" [--title="..."] [--skip-publish]');
  process.exit(1);
}

// ── Setup ────────────────────────────────────────────────────────────
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('🎬 E형 애니메이션 파이프라인');
console.log('   GPT-Image-2 → Wan 2.2 Ultra Fast → FFmpeg 합성');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log(`📝 스토리 ${TEXT.length}자 / 발행: ${SKIP_PUBLISH ? '❌ 건너뜀' : `YT ${SKIP_YT ? '❌' : '✓'}`}`);
console.log('');

const t0 = Date.now();
const timestamp = Date.now();
const outDir = path.join(__dirname, '..', 'out', `anime-${timestamp}`);
const tmpDir = path.join(outDir, 'tmp');
await mkdir(tmpDir, { recursive: true });

// ── Step 1: 장면 구성 ────────────────────────────────────────────────
console.log('━━━ [1/6] 애니메이션 장면 구성 (Gemini) ━━━');
const structure = await structureAnime(TEXT, TITLE);
console.log(`  ✅ "${structure.title}" — ${structure.scenes.length}개 장면`);
console.log(`  🎨 스타일: ${structure.styleGuide.slice(0, 60)}...`);
const charNames = Object.keys(structure.characterDescriptions);
if (charNames.length > 0) {
  console.log(`  🐰 캐릭터: ${charNames.join(', ')}`);
}
console.log('');
await writeFile(path.join(outDir, 'anime-draft.json'), JSON.stringify(structure, null, 2));

// ── Step 2: 장면 이미지 생성 (GPT-Image-2) ──────────────────────────
console.log('━━━ [2/6] 장면 이미지 생성 (GPT-Image-2) ━━━');
const sceneImages = await Promise.all(
  structure.scenes.map(async (scene, i) => {
    const result = await generateSceneImage(scene.imagePrompt, '16:9');
    const icon = result ? '✅' : '⚠️ ';
    console.log(`  ${icon} 장면 ${i + 1}: ${scene.description.slice(0, 35)}`);
    if (result) {
      const buf = await downloadBuffer(result.url);
      const imgPath = path.join(tmpDir, `scene-${i}-image.jpg`);
      const { writeFile: wf } = await import('fs/promises');
      await wf(imgPath, buf);
      return { url: result.url, localPath: imgPath };
    }
    return null;
  })
);
const imageCount = sceneImages.filter(Boolean).length;
console.log(`  📊 이미지 ${imageCount}/${structure.scenes.length}개 생성`);
console.log('');

// ── Step 3: 영상 애니메이션 (Wan 2.2 Ultra Fast) ────────────────────
let sceneVideoPaths = [];
if (!TEXT_ONLY) {
  console.log('━━━ [3/6] 영상 애니메이션 (Wan 2.2 Ultra Fast) ━━━');
  sceneVideoPaths = await Promise.all(
    structure.scenes.map(async (scene, i) => {
      const imgData = sceneImages[i];
      let result = null;

      if (imgData) {
        // 이미지 → 영상 (품질 우선)
        result = await animateImage(imgData.url, scene.videoMotionPrompt, scene.durationSec);
        if (result) console.log(`  ✅ 장면 ${i + 1} [img2vid] ${scene.durationSec}초 — $${(scene.durationSec * 0.01).toFixed(2)}`);
      }

      if (!result) {
        // 이미지 없거나 실패 시 텍스트 → 영상
        result = await generateSceneVideo(scene.imagePrompt, scene.durationSec);
        if (result) console.log(`  ✅ 장면 ${i + 1} [t2v] ${scene.durationSec}초 — $${(scene.durationSec * 0.01).toFixed(2)}`);
        else console.log(`  ⚠️  장면 ${i + 1}: 영상 생성 실패 — 이미지 스틸 사용`);
      }

      if (result) {
        const buf = await downloadBuffer(result.url);
        const vidPath = path.join(tmpDir, `scene-${i}-video.mp4`);
        const { writeFile: wf } = await import('fs/promises');
        await wf(vidPath, buf);
        return vidPath;
      }

      // 최후 폴백: 이미지를 5초 스틸로 변환
      if (sceneImages[i]) {
        const { execSync } = await import('child_process');
        const stillPath = path.join(tmpDir, `scene-${i}-video.mp4`);
        try {
          execSync(`ffmpeg -y -loop 1 -i "${sceneImages[i].localPath}" -c:v libx264 -t ${scene.durationSec} -pix_fmt yuv420p "${stillPath}"`, { stdio: 'ignore' });
          return stillPath;
        } catch { return null; }
      }
      return null;
    })
  );

  const videoCount = sceneVideoPaths.filter(Boolean).length;
  const totalSec = structure.scenes.reduce((s, sc) => s + sc.durationSec, 0);
  console.log(`  📊 영상 ${videoCount}/${structure.scenes.length}개 생성 / 예상 비용: $${(totalSec * 0.01).toFixed(2)}`);
  console.log('');
} else {
  console.log('━━━ [3/6] 영상 생성 건너뜀 (--text-only) ━━━');
  sceneVideoPaths = structure.scenes.map((_, i) => sceneImages[i]?.localPath ?? null);
  console.log('');
}

// ── Step 4: TTS 내레이션 ─────────────────────────────────────────────
console.log('━━━ [4/6] 장면별 TTS 생성 ━━━');
// 내레이션 + 대사를 장면별로 합쳐서 하나의 세그먼트로
const narrationSegments = structure.scenes.map((scene) => {
  const dialogueParts = scene.dialogue.map((d) => `${d.character}: "${d.text}"`).join('\n');
  return [scene.narration, dialogueParts].filter(Boolean).join('\n');
});

const segments = await synthesizeSegments(narrationSegments, { voiceName: 'Kore' });
const SCENE_GAP = 0.3;
const totalAudioSec = segments.reduce((s, x) => s + x.durationSec, 0) + SCENE_GAP * (segments.length - 1);
console.log(`  ✅ ${segments.length}개 세그먼트, ${totalAudioSec.toFixed(1)}초`);
console.log('');

// Save per-scene TTS audio
const audioFilePaths = [];
for (let i = 0; i < segments.length; i++) {
  const { writeFile: wf } = await import('fs/promises');
  const audioPath = path.join(tmpDir, `scene-${i}-tts.wav`);
  await wf(audioPath, segments[i].audioBuffer);
  audioFilePaths.push(audioPath);
}

// ── Step 5: FFmpeg 합성 ──────────────────────────────────────────────
console.log('━━━ [5/6] FFmpeg 합성 ━━━');
const bgm = await fetchBgm({ mood: structure.bgmMood, searchQuery: structure.musicSearchQuery });
const bgmPath = path.join(tmpDir, 'bgm.wav');
const { bgmToDataUri } = await import('../lib/reels/music-fetcher.ts');
const bgmData = await bgmToDataUri(bgm, totalAudioSec + 3);
const { writeFile: wf2 } = await import('fs/promises');
await wf2(bgmPath, Buffer.from(bgmData.dataUri.split(',')[1], 'base64'));

const sceneClips = structure.scenes.map((scene, i) => ({
  videoPath: sceneVideoPaths[i] ?? audioFilePaths[i], // fallback
  audioPath: audioFilePaths[i],
  durationSec: segments[i].durationSec,
})).filter((c) => c.videoPath);

// Build subtitle entries from narration text + actual TTS durations
const subtitleEntries = NO_SUBTITLE ? undefined : sceneClips.map((clip, i) => ({
  text: narrationSegments[i] ?? '',
  durationSec: clip.durationSec,
}));

const finalPath = path.join(outDir, 'anime.mp4');
await assembleAnimeVideo({
  sceneClips,
  subtitleEntries,
  bgmPath,
  bgmVolume: 0.12,
  outputPath: finalPath,
  tempDir: tmpDir,
});
console.log(`  ✅ ${finalPath}`);
console.log('');

// ── Step 6: 메타데이터 + 발행 ────────────────────────────────────────
console.log('━━━ [6/6] 메타데이터 생성 ━━━');
const metadata = await generateMetadata({
  text: TEXT,
  template: 'lecture',
  data: { title: structure.title, scenes: structure.scenes.map((s) => ({ description: s.description })) },
  narration: narrationSegments.join('\n'),
});
metadata.youtubeTitle = (TITLE || structure.title).slice(0, 100);

await writeFile(path.join(outDir, 'metadata.json'), JSON.stringify(metadata, null, 2));
console.log(`  📺 YT: "${metadata.youtubeTitle}"`);
console.log('');

if (SKIP_PUBLISH) {
  console.log('━━━ 발행 건너뜀 (--skip-publish) ━━━');
} else {
  console.log('━━━ YouTube 발행 ━━━');
  const ytPrivacy = YT_PRIVATE ? 'private' : YT_UNLISTED ? 'unlisted' : 'public';
  const pub = await publishToMultiplePlatforms({
    videoPath: finalPath,
    metadata,
    publishToInstagram: false,
    publishToYouTube: !SKIP_YT,
    youtubePrivacy: ytPrivacy,
  });
  if (pub.youtube && !('error' in pub.youtube)) {
    console.log(`  ✅ YouTube: ${pub.youtube.videoUrl ?? pub.youtube.videoId}`);
  } else if (pub.youtube && 'error' in pub.youtube) {
    console.log(`  ❌ YouTube: ${pub.youtube.error}`);
  }
  await writeFile(path.join(outDir, 'publish-result.json'), JSON.stringify(pub, null, 2));
}

const totalSec2 = structure.scenes.reduce((s, sc) => s + sc.durationSec, 0);
console.log('');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log(`✅ 완료! ${((Date.now() - t0) / 1000).toFixed(0)}초 소요`);
console.log(`📁 ${outDir}`);
console.log(`🎬 ${structure.scenes.length}개 장면 / 약 ${(totalSec2 / 60).toFixed(1)}분`);
console.log(`💰 Wan 2.2 비용 추산: $${(totalSec2 * 0.01).toFixed(2)}`);
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
