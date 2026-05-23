import { chromium } from 'playwright';
import { mkdir } from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROFILE_DIR = path.join(__dirname, '..', '.playwright-profile');
const SCREENSHOT_DIR = path.join(__dirname, '..', '.playwright-shots');
const DOWNLOAD_DIR = path.join(__dirname, '..', '.playwright-downloads');

await mkdir(PROFILE_DIR, { recursive: true });
await mkdir(SCREENSHOT_DIR, { recursive: true });
await mkdir(DOWNLOAD_DIR, { recursive: true });

const context = await chromium.launchPersistentContext(PROFILE_DIR, {
  headless: false,
  channel: 'chrome',
  viewport: { width: 1400, height: 900 },
  acceptDownloads: true,
  downloadsPath: DOWNLOAD_DIR,
});

const page = context.pages()[0] || (await context.newPage());

page.on('download', async (download) => {
  const filename = download.suggestedFilename();
  const savePath = path.join(DOWNLOAD_DIR, filename);
  await download.saveAs(savePath);
  console.log(`[DOWNLOADED] ${savePath}`);
});

await page.goto('https://console.cloud.google.com/iam-admin/serviceaccounts', {
  waitUntil: 'domcontentloaded',
});

console.log('[READY] Browser opened. Log in if prompted.');
console.log(`[PROFILE] ${PROFILE_DIR}`);
console.log(`[DOWNLOADS] ${DOWNLOAD_DIR}`);

setInterval(async () => {
  try {
    const url = page.url();
    const shotPath = path.join(SCREENSHOT_DIR, 'current.png');
    await page.screenshot({ path: shotPath, fullPage: false });
    console.log(`[SHOT] ${new Date().toISOString()} url=${url}`);
  } catch {}
}, 5000);

await new Promise(() => {});
