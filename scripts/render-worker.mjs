#!/usr/bin/env node
// Stage 2 — crash-isolated render worker.
//
// Usage: node scripts/render-worker.mjs <jobId>
//
// Reads the queued job payload from out/.jobs/<jobId>.payload.json, runs the
// full render pipeline, and writes status updates to out/.jobs/<jobId>.json.
// Spawned as a detached child by lib/church/render-jobs.ts when
// RENDER_WORKER=spawn. Decoupled from Next so a Chromium crash here cannot
// take down the web server.
//
// Because the render code is TypeScript with @-aliased imports, we run via
// tsx — install with `pnpm add -D tsx` (already a devDependency).

import { spawn } from 'child_process';
import { readFile, writeFile, mkdir, rename } from 'fs/promises';
import path from 'path';
import { randomUUID } from 'crypto';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '..');
const JOB_DIR = path.join(REPO_ROOT, 'out', '.jobs');

const jobId = process.argv[2];
if (!jobId) {
  console.error('usage: node render-worker.mjs <jobId>');
  process.exit(2);
}

const writeStatus = async (patch) => {
  const jobPath = path.join(JOB_DIR, `${jobId}.json`);
  let existing = {};
  try {
    existing = JSON.parse(await readFile(jobPath, 'utf-8'));
  } catch {
    /* first write */
  }
  const next = { ...existing, ...patch, updatedAt: Date.now() };
  const tmp = `${jobPath}.${randomUUID()}.tmp`;
  await mkdir(JOB_DIR, { recursive: true });
  await writeFile(tmp, JSON.stringify(next), 'utf-8');
  await rename(tmp, jobPath);
};

const main = async () => {
  const payloadPath = path.join(JOB_DIR, `${jobId}.payload.json`);
  let payload;
  try {
    payload = JSON.parse(await readFile(payloadPath, 'utf-8'));
  } catch (e) {
    await writeStatus({
      status: 'failed',
      step: '페이로드 로드 실패',
      error: e?.message ?? 'payload read failed',
    });
    process.exit(1);
  }

  // Delegate to a tsx subprocess that imports the TS pipeline directly. Using
  // a thin shim keeps the worker entrypoint as plain ESM that needs no build
  // step in production.
  const tsx = path.join(REPO_ROOT, 'node_modules', '.bin', 'tsx');
  const shim = path.join(REPO_ROOT, 'scripts', '_run-render-job.ts');
  const nodeDir = path.dirname(process.execPath);

  const child = spawn(tsx, [shim, jobId, payloadPath], {
    cwd: REPO_ROOT,
    stdio: 'inherit',
    env: {
      ...process.env,
      PATH: `${nodeDir}:${process.env.PATH || ''}`,
      RENDER_WORKER: 'child',
    },
  });

  child.on('exit', async (code) => {
    if (code !== 0) {
      // The shim should have already written 'failed' status; this is a
      // belt-and-braces guard for hard crashes (segfault, OOM).
      await writeStatus({
        status: 'failed',
        step: `워커 프로세스 종료 코드 ${code}`,
        error: `worker exited with code ${code}`,
      });
    }
    process.exit(code ?? 0);
  });
};

main().catch(async (e) => {
  await writeStatus({
    status: 'failed',
    step: '워커 초기화 실패',
    error: e?.message ?? 'worker init failed',
  });
  process.exit(1);
});
