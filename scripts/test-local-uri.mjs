import { config as loadEnv } from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs/promises';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
loadEnv({ path: path.join(__dirname, '..', '.env.local') });
loadEnv({ path: path.join(__dirname, '..', '.env') });

const { getJob } = await import('../lib/church/render-jobs.ts');

console.log('CWD:', process.cwd());
const publicUrl = '/uploads/8f5320bb-9801-461d-b8da-ec9e2b257ad0.jpg';
const absPath = path.join(process.cwd(), 'public', publicUrl);

try {
  const st = await fs.stat(absPath);
  console.log('Stat success. Size:', st.size);
  
  const buf = await fs.readFile(absPath);
  console.log('Read success. Buf length:', buf.length);
  
  const ext = path.extname(publicUrl).toLowerCase().replace('.', '');
  const mimeMap = {
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    webp: 'image/webp',
    gif: 'image/gif',
    avif: 'image/avif',
  };
  const mime = mimeMap[ext] ?? 'image/jpeg';
  const dataUri = `data:${mime};base64,${buf.toString('base64')}`;
  console.log('Data URI created successfully, length:', dataUri.length);
} catch (e) {
  console.error('Error occurred:', e);
}
