// Auto mode: discover topic → generate viral title → write content → run pipeline.
// Usage:
//   npx tsx scripts/publish-auto.mjs                     # 1 video, default settings
//   npx tsx scripts/publish-auto.mjs --count=4           # 4 videos in one run
//   npx tsx scripts/publish-auto.mjs --strategy=news     # use NewsAPI as topic source
//   npx tsx scripts/publish-auto.mjs --category=ai_tech  # filter pool by category
//   npx tsx scripts/publish-auto.mjs --skip-publish      # generate only, no IG/YT publish
//   npx tsx scripts/publish-auto.mjs --cron="0 12 * * *" # schedule daily at noon

import { config as loadEnv } from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { spawn } from 'child_process';
import { writeFile, mkdir, unlink, appendFile } from 'fs/promises';
import cron from 'node-cron';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
loadEnv({ path: path.join(__dirname, '..', '.env.local') });
loadEnv({ path: path.join(__dirname, '..', '.env') });

const { discoverTopic } = await import('../lib/auto/topic-discovery.ts');
const { generateAndPickTitle } = await import('../lib/auto/title-generator.ts');
const { generateContentFromTitle } = await import('../lib/auto/content-from-title.ts');

// ── Args ────────────────────────────────────────────────────────────
const args = process.argv.slice(2);
const getArg = (name, fallback) => {
  const arg = args.find((a) => a.startsWith(`--${name}=`));
  return arg ? arg.split('=').slice(1).join('=') : fallback;
};
const hasFlag = (name) => args.includes(`--${name}`);

const COUNT = parseInt(getArg('count', '1'), 10);
const STRATEGY = getArg('strategy', 'pool'); // pool | news | ai
const CATEGORY = getArg('category', undefined);
const INTEREST = getArg('interest', undefined);
const CRON_EXPR = getArg('cron', undefined);
const SKIP_PUBLISH = hasFlag('skip-publish');
const SKIP_YT = hasFlag('skip-yt');
const SKIP_IG = hasFlag('skip-ig');
const YT_PRIVATE = hasFlag('yt-private');
const YT_UNLISTED = hasFlag('yt-unlisted');

// ── Pipeline ────────────────────────────────────────────────────────
const runPublishContent = (contentPath, extraFlags = []) => {
  return new Promise((resolve, reject) => {
    const flags = [
      'tsx',
      'scripts/publish-content.mjs',
      `@${contentPath}`,
      ...(SKIP_PUBLISH ? ['--skip-publish'] : []),
      ...(SKIP_YT ? ['--skip-yt'] : []),
      ...(SKIP_IG ? ['--skip-ig'] : []),
      ...(YT_PRIVATE ? ['--yt-private'] : []),
      ...(YT_UNLISTED ? ['--yt-unlisted'] : []),
      ...extraFlags,
    ];
    const proc = spawn('npx', flags, { stdio: 'inherit', cwd: path.join(__dirname, '..') });
    proc.on('exit', (code) => (code === 0 ? resolve() : reject(new Error(`exit ${code}`))));
    proc.on('error', reject);
  });
};

/** Run one full auto pipeline iteration. Returns topic/title info for the run log. */
const generateOne = async (index) => {
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`🤖 자동 생성 [${index + 1}] - 토픽 발굴 중...`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  // 1. Topic discovery
  const topic = await discoverTopic(STRATEGY, {
    category: CATEGORY,
    interestArea: INTEREST,
  });
  console.log(`📍 주제 (${topic.source}): "${topic.topic}"${topic.category ? ` [${topic.category}]` : ''}`);
  if (topic.contextHint) {
    console.log(`   참고: ${topic.contextHint.slice(0, 100)}...`);
  }

  // 2. Title generation + ranking
  console.log(`\n🎯 바이럴 제목 8개 생성 + 후킹 점수 평가 중...`);
  const ranking = await generateAndPickTitle(topic.topic, 8, topic.contextHint);
  console.log(`   후보:`);
  ranking.allTitles.forEach((t, i) => {
    const marker = ranking.allTitles.indexOf(ranking.bestTitle) === i ? '👉' : '  ';
    console.log(`   ${marker} ${t}`);
  });
  console.log(`✅ 선택: "${ranking.bestTitle}" (점수: ${ranking.score}/10)`);
  console.log(`   이유: ${ranking.reason}`);

  // 3. Generate full content
  console.log(`\n📝 본문 생성 중...`);
  const content = await generateContentFromTitle(ranking.bestTitle, topic.contextHint);
  console.log(`   ${content.length}자 생성 완료`);
  console.log(`   미리보기: ${content.slice(0, 150)}...`);

  // 4. Save to temp file
  const tmpDir = path.join(__dirname, '..', '.auto-content');
  await mkdir(tmpDir, { recursive: true });
  const tmpPath = path.join(tmpDir, `auto-${Date.now()}-${index}.txt`);
  await writeFile(tmpPath, content, 'utf-8');
  console.log(`   💾 ${tmpPath}`);

  // 5. Run main pipeline
  console.log(`\n🎬 메인 파이프라인 실행 (분류 → TTS → 렌더 → 발행)...\n`);
  await runPublishContent(tmpPath);

  // 6. Clean up temp content file after successful pipeline run
  await unlink(tmpPath).catch(() => {});

  return { topic: topic.topic, title: ranking.bestTitle };
};

/** Run a batch with retry-on-failure and structured run logging. */
const generateBatch = async () => {
  const batchStart = Date.now();
  let succeeded = 0;
  let failed = 0;
  const logItems = [];

  for (let i = 0; i < COUNT; i++) {
    const itemStart = Date.now();
    let status = 'success';
    let errorMsg = null;
    let result = null;

    try {
      result = await generateOne(i);
      succeeded++;
    } catch (firstErr) {
      console.warn(`\n  ⚠️  [${i + 1}/${COUNT}] 1차 실패: ${firstErr.message}`);
      console.warn(`  30초 후 재시도...`);
      await new Promise((r) => setTimeout(r, 30_000));
      try {
        result = await generateOne(i);
        succeeded++;
        status = 'retry_success';
      } catch (retryErr) {
        console.error(`\n❌ [${i + 1}/${COUNT}] 최종 실패:`, retryErr.message);
        failed++;
        status = 'failed';
        errorMsg = retryErr.message;
      }
    }

    logItems.push({
      index: i + 1,
      topic: result?.topic ?? null,
      title: result?.title ?? null,
      status,
      error: errorMsg,
      elapsedSec: parseFloat(((Date.now() - itemStart) / 1000).toFixed(1)),
    });
  }

  const elapsed = ((Date.now() - batchStart) / 1000).toFixed(1);
  console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`✅ 배치 완료: ${succeeded}/${COUNT} 성공, ${failed}/${COUNT} 실패 (${elapsed}초)`);
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);

  // Save structured run log (JSONL — one entry per batch run)
  try {
    const logDir = path.join(__dirname, '..', 'logs');
    await mkdir(logDir, { recursive: true });
    const today = new Date().toISOString().slice(0, 10);
    const logPath = path.join(logDir, `auto-${today}.jsonl`);
    const entry = {
      startedAt: new Date(batchStart).toISOString(),
      completedAt: new Date().toISOString(),
      elapsedSec: parseFloat(elapsed),
      strategy: STRATEGY,
      count: COUNT,
      succeeded,
      failed,
      items: logItems,
    };
    await appendFile(logPath, JSON.stringify(entry) + '\n', 'utf-8');
    console.log(`📄 실행 로그: ${logPath}`);
  } catch (logErr) {
    console.warn('[auto] 로그 저장 실패 (non-fatal):', logErr.message);
  }
};

// ── Main ────────────────────────────────────────────────────────────
const printConfig = () => {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🤖 자동 콘텐츠 생성 모드');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`전략: ${STRATEGY}${CATEGORY ? ` (카테고리: ${CATEGORY})` : ''}${INTEREST ? ` (관심사: ${INTEREST})` : ''}`);
  console.log(`개수: ${COUNT}개/실행`);
  console.log(`발행: ${SKIP_PUBLISH ? '❌ 건너뜀' : `IG ${SKIP_IG ? '❌' : '✓'} / YT ${SKIP_YT ? '❌' : YT_PRIVATE ? '비공개' : YT_UNLISTED ? '미등록' : '공개'}`}`);
  if (CRON_EXPR) console.log(`스케줄: ${CRON_EXPR}`);
  console.log('');
};

if (CRON_EXPR) {
  if (!cron.validate(CRON_EXPR)) {
    console.error(`❌ 잘못된 cron 표현식: ${CRON_EXPR}`);
    process.exit(1);
  }
  printConfig();
  console.log(`⏰ 스케줄러 시작. Ctrl+C로 종료.`);
  console.log(`다음 실행 예정: ${CRON_EXPR}`);

  cron.schedule(CRON_EXPR, async () => {
    console.log(`\n🔔 [${new Date().toLocaleString('ko-KR')}] 스케줄 트리거`);
    try {
      await generateBatch();
    } catch (e) {
      console.error(`스케줄 실행 실패:`, e);
    }
  });

  // Keep alive
  process.stdin.resume();
} else {
  printConfig();
  await generateBatch();
}
