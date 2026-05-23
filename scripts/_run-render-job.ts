// Internal tsx shim called by scripts/render-worker.mjs. Lives in scripts/
// because Next.js' compiler ignores files outside of app/, lib/, components/
// — we want this excluded from the production bundle but still importable
// at the TypeScript layer for @-aliased paths.
import { readFile } from 'fs/promises';
import { runRenderJob } from '../lib/church/render-jobs';

const [, , jobId, payloadPath] = process.argv;

const main = async () => {
  if (!jobId || !payloadPath) {
    console.error('usage: tsx _run-render-job.ts <jobId> <payloadPath>');
    process.exit(2);
  }
  const { structure, options } = JSON.parse(await readFile(payloadPath, 'utf-8'));
  await runRenderJob(jobId, structure, options ?? {});
};

main().catch((e) => {
  console.error('[render-worker shim] fatal:', e);
  process.exit(1);
});
