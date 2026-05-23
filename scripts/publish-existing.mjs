// Publish a previously-generated content folder to IG + YouTube.
// Usage:
//   npx tsx scripts/publish-existing.mjs out/content-XXXXXX [--skip-yt] [--skip-ig] [--yt-private]

import { config as loadEnv } from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { readFile, writeFile, stat } from 'fs/promises';
import { existsSync } from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
loadEnv({ path: path.join(__dirname, '..', '.env.local') });
loadEnv({ path: path.join(__dirname, '..', '.env') });

const { publishToMultiplePlatforms } = await import('../lib/reels/multi-publish.ts');

const args = process.argv.slice(2);
const folderArg = args.find((a) => !a.startsWith('--'));
const skipYT = args.includes('--skip-yt');
const skipIG = args.includes('--skip-ig');
const ytPrivate = args.includes('--yt-private');
const ytUnlisted = args.includes('--yt-unlisted');

if (!folderArg) {
  console.error('Usage: tsx scripts/publish-existing.mjs <folder-path> [--skip-yt] [--skip-ig] [--yt-private]');
  process.exit(1);
}

const folder = path.resolve(folderArg);
const reelsPath = path.join(folder, 'reels.mp4');
const metadataPath = path.join(folder, 'metadata.json');

// Verify files exist
try {
  await stat(reelsPath);
  await stat(metadataPath);
} catch {
  console.error(`❌ ${folder} 에 reels.mp4 또는 metadata.json 이 없습니다.`);
  process.exit(1);
}

const metadata = JSON.parse(await readFile(metadataPath, 'utf-8'));

console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('📤 기존 콘텐츠 자동 발행');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log(`📁 폴더: ${folder}`);
console.log(`🎬 영상: ${reelsPath}`);
console.log(`📺 YT 제목: "${metadata.youtubeTitle}"`);
console.log(`📱 IG 캡션: ${metadata.instagramCaption.length}자, 해시태그 ${metadata.instagramHashtags?.length || 0}개`);
console.log('');

const ytPrivacy = ytPrivate ? 'private' : ytUnlisted ? 'unlisted' : 'public';
const t0 = Date.now();

console.log('📤 발행 중... (수십 초 소요될 수 있음)');
console.log('');

// Use intro card PNG as cover (improves feed grid CTR).
// Falls back to no-cover if file missing.
const coverPath = path.join(folder, 'card-00-intro.png');
const pub = await publishToMultiplePlatforms({
  videoPath: reelsPath,
  metadata,
  publishToInstagram: !skipIG,
  publishToYouTube: !skipYT,
  youtubePrivacy: ytPrivacy,
  coverImagePath: existsSync(coverPath) ? coverPath : undefined,
});

console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log(`✅ 발행 완료 (${((Date.now() - t0) / 1000).toFixed(1)}초)`);
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

if (pub.publicVideoUrl) {
  console.log(`🌐 영상 호스팅: ${pub.publicVideoUrl}`);
}
if (pub.instagram) {
  if ('error' in pub.instagram) {
    console.log(`❌ Instagram 실패:`);
    console.log(`   ${pub.instagram.error}`);
  } else {
    console.log(`✅ Instagram 발행: ${pub.instagram.permalink || `(media id: ${pub.instagram.mediaId})`}`);
  }
}
if (pub.youtube) {
  if ('error' in pub.youtube) {
    console.log(`❌ YouTube 실패:`);
    console.log(`   ${pub.youtube.error}`);
  } else {
    console.log(`✅ YouTube Shorts: ${pub.youtube.shortsUrl}`);
  }
}

await writeFile(
  path.join(folder, 'publish-result.json'),
  JSON.stringify(pub, null, 2),
  'utf-8'
);
console.log('');
console.log(`📄 결과 저장: ${path.join(folder, 'publish-result.json')}`);
