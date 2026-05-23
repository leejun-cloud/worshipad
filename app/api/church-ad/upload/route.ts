import { NextResponse } from 'next/server';
import { writeFile, unlink, mkdir } from 'fs/promises';
import path from 'path';
import { randomUUID } from 'crypto';
import { spawn } from 'child_process';

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
  'video/quicktime': 'mp4', // re-encode MOV → MP4
} as const;

/** Run ffmpeg to move moov atom to front (faststart) for instant seek in Chromium.
 *  Also strips audio track — render pipeline muxes its own narration+BGM later.
 *  Falls back gracefully: if ffmpeg fails we keep the original file.
 */
const applyFaststart = (inputPath: string, outputPath: string): Promise<void> =>
  new Promise((resolve) => {
    const args = [
      '-y',
      '-i', inputPath,
      '-c:v', 'copy',   // no re-encode
      '-an',            // strip audio — BGM is muxed separately
      '-movflags', '+faststart',
      outputPath,
    ];
    const ff = spawn('ffmpeg', args);
    ff.on('close', (code) => {
      if (code !== 0) {
        // ffmpeg failed — keep the original (upload still succeeds)
        resolve();
      } else {
        resolve();
      }
    });
    ff.on('error', () => resolve()); // ffmpeg not found — ignore
  });

export async function POST(req: Request) {
  try {
    const form = await req.formData();
    const file = form.get('file') as File | null;
    if (!file) {
      return NextResponse.json({ error: 'file required' }, { status: 400 });
    }
    const ext = ALLOWED[file.type as keyof typeof ALLOWED];
    if (!ext) {
      return NextResponse.json(
        { error: `허용되지 않은 파일 형식: ${file.type}` },
        { status: 415 }
      );
    }
    if (file.size > 80 * 1024 * 1024) {
      return NextResponse.json({ error: '파일이 80MB를 초과합니다' }, { status: 413 });
    }
    await mkdir(UPLOAD_DIR, { recursive: true });
    const id = randomUUID();
    const isVideo = file.type.startsWith('video');

    if (isVideo) {
      // Write raw upload to a temp file, then faststart → final file (video only, no audio)
      const tmpName = `${id}.tmp.${ext}`;
      const tmpPath = path.join(UPLOAD_DIR, tmpName);
      const finalName = `${id}.mp4`;
      const finalPath = path.join(UPLOAD_DIR, finalName);
      // Keep original with audio for video-audio render mode
      const origName = `${id}.orig.mp4`;
      const origPath = path.join(UPLOAD_DIR, origName);

      const buf = Buffer.from(await file.arrayBuffer());
      await writeFile(tmpPath, buf);
      // Save original (with audio) before stripping
      await writeFile(origPath, buf);
      await applyFaststart(tmpPath, finalPath);

      // Clean up temp; if faststart produced nothing fall back to raw
      try {
        const { stat } = await import('fs/promises');
        const st = await stat(finalPath);
        if (st.size < 1000) throw new Error('empty output');
      } catch {
        // faststart failed — use raw file as-is
        await writeFile(finalPath, buf);
      }
      try { await unlink(tmpPath); } catch { /* ignore */ }

      return NextResponse.json({ url: `/uploads/${finalName}`, mediaType: 'video', size: file.size, contentType: 'video/mp4' });
    }

    // Image — save as-is
    const fileName = `${id}.${ext}`;
    const filePath = path.join(UPLOAD_DIR, fileName);
    const buf = Buffer.from(await file.arrayBuffer());
    await writeFile(filePath, buf);
    return NextResponse.json({ url: `/uploads/${fileName}`, mediaType: 'image', size: file.size, contentType: file.type });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? 'upload failed' }, { status: 500 });
  }
}
