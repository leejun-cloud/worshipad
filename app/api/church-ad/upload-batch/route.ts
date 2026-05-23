import { NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { randomUUID } from 'crypto';

export const runtime = 'nodejs';
export const maxDuration = 120;

const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads');

const ALLOWED = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
  'video/mp4': 'mp4',
  'video/webm': 'webm',
  'video/quicktime': 'mov',
} as const;

type AllowedMime = keyof typeof ALLOWED;
const MAX_FILE = 80 * 1024 * 1024;
const MAX_BATCH = 20;

export async function POST(req: Request) {
  try {
    const form = await req.formData();
    const files = form.getAll('files').filter((x): x is File => x instanceof File);
    if (files.length === 0) {
      return NextResponse.json({ error: 'no files' }, { status: 400 });
    }
    if (files.length > MAX_BATCH) {
      return NextResponse.json({ error: `최대 ${MAX_BATCH}개까지` }, { status: 400 });
    }

    await mkdir(UPLOAD_DIR, { recursive: true });

    const results: {
      url: string;
      mediaType: 'image' | 'video';
      contentType: string;
      filename: string;
      size: number;
    }[] = [];
    const errors: { filename: string; error: string }[] = [];

    for (const file of files) {
      const ext = ALLOWED[file.type as AllowedMime];
      if (!ext) {
        errors.push({ filename: file.name, error: `허용되지 않은 형식 ${file.type}` });
        continue;
      }
      if (file.size > MAX_FILE) {
        errors.push({ filename: file.name, error: '80MB 초과' });
        continue;
      }
      const id = randomUUID();
      const fileName = `${id}.${ext}`;
      const filePath = path.join(UPLOAD_DIR, fileName);
      const buf = Buffer.from(await file.arrayBuffer());
      await writeFile(filePath, buf);
      results.push({
        url: `/uploads/${fileName}`,
        mediaType: file.type.startsWith('video') ? 'video' : 'image',
        contentType: file.type,
        filename: file.name,
        size: file.size,
      });
    }

    return NextResponse.json({ files: results, errors });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? 'upload failed' }, { status: 500 });
  }
}
