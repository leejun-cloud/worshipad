// Housekeeping for the church-ad pipeline.
//
// Removes stock photos / generated audio / BGM that the editor produced more
// than `--olderThan` hours ago. User-uploaded files (those that don't start
// with the auto/stock prefixes) are kept by default — pass `--all` to wipe
// everything in the directory.
//
// Usage:
//   node scripts/cleanup-church-ad.mjs --olderThan=24
//   node scripts/cleanup-church-ad.mjs --olderThan=0 --all   # nuke
//   node scripts/cleanup-church-ad.mjs --dryRun

import { readdir, stat, unlink } from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');

const args = process.argv.slice(2);
const getArg = (name, dflt) => {
  const a = args.find((x) => x.startsWith(`--${name}=`));
  return a ? a.split('=').slice(1).join('=') : dflt;
};
const has = (name) => args.includes(`--${name}`);

const olderThanH = Number(getArg('olderThan', '24'));
const wipeAll = has('all');
const dry = has('dryRun');

const cutoff = Date.now() - olderThanH * 3600 * 1000;
let totalBytes = 0;
let totalCount = 0;

const sweep = async (dir, predicate) => {
  let entries;
  try {
    entries = await readdir(dir);
  } catch {
    return;
  }
  for (const name of entries) {
    const full = path.join(dir, name);
    let st;
    try {
      st = await stat(full);
    } catch {
      continue;
    }
    if (!st.isFile()) continue;
    if (st.mtimeMs > cutoff) continue;
    if (!wipeAll && !predicate(name)) continue;
    totalBytes += st.size;
    totalCount += 1;
    if (dry) {
      console.log(`would delete: ${path.relative(ROOT, full)}  (${(st.size / 1024).toFixed(0)}KB)`);
    } else {
      await unlink(full);
      console.log(`deleted: ${path.relative(ROOT, full)}`);
    }
  }
};

console.log(
  `🧹 cleanup — older than ${olderThanH}h${wipeAll ? ', ALL files' : ', auto/stock prefixed only'}${dry ? ', DRY RUN' : ''}`
);

await sweep(path.join(ROOT, 'public', 'uploads'), (n) => n.startsWith('stock-') || n.startsWith('auto-'));
await sweep(path.join(ROOT, 'public', 'audio'), () => true); // generated, safe to wipe
await sweep(path.join(ROOT, 'public', 'bgm'), (n) => n.endsWith('.wav') && /^[0-9a-f-]{36}\.wav$/i.test(n));
await sweep(path.join(ROOT, 'out', '.jobs'), () => true); // job state files

console.log(
  `\n${dry ? '예상 회수' : '회수 완료'}: ${totalCount}개 파일, ${(totalBytes / 1024 / 1024).toFixed(1)}MB`
);
