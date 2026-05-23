// Public URL hosting for video files (needed for Instagram Reels Graph API).
// Uses catbox.moe (same service the 위즈비 system uses for images).
// Free, no auth, 200MB limit per file.

import { createReadStream } from 'fs';
import { stat } from 'fs/promises';
import { basename } from 'path';
import FormData from 'form-data';

export interface HostingResult {
  publicUrl: string;
  fileName: string;
}

export const hostVideoOnCatbox = async (filePath: string): Promise<HostingResult> => {
  const fileStat = await stat(filePath);
  if (!fileStat.isFile() || fileStat.size === 0) {
    throw new Error(`Invalid file: ${filePath}`);
  }
  if (fileStat.size > 200 * 1024 * 1024) {
    throw new Error(`File too large for catbox.moe (>200MB): ${filePath}`);
  }

  const form = new FormData();
  form.append('reqtype', 'fileupload');
  form.append('fileToUpload', createReadStream(filePath), basename(filePath));

  const headers = form.getHeaders();
  const buffer = await new Promise<Buffer>((resolve, reject) => {
    const chunks: Buffer[] = [];
    form.on('data', (chunk) => chunks.push(Buffer.from(chunk)));
    form.on('end', () => resolve(Buffer.concat(chunks)));
    form.on('error', reject);
    form.resume();
  });

  const res = await fetch('https://catbox.moe/user/api.php', {
    method: 'POST',
    headers: headers as Record<string, string>,
    body: buffer as unknown as BodyInit,
  });

  if (!res.ok) {
    throw new Error(`catbox upload failed: HTTP ${res.status}`);
  }

  const url = (await res.text()).trim();
  if (!url.startsWith('https://')) {
    throw new Error(`catbox returned invalid URL: ${url}`);
  }

  return {
    publicUrl: url,
    fileName: basename(filePath),
  };
};

/**
 * Upload to Firebase Storage (alternative to catbox).
 * More reliable but requires FIREBASE_ADMIN_KEY_JSON to be set.
 */
export const hostVideoOnFirebase = async (filePath: string): Promise<HostingResult> => {
  const { uploadFileToStorage } = await import('./firebase-admin');
  const fileName = `reels/${Date.now()}-${basename(filePath)}`;
  const publicUrl = await uploadFileToStorage(filePath, fileName, 'video/mp4');
  return { publicUrl, fileName };
};

/**
 * Pick the best available hosting based on env config.
 */
export const hostVideo = async (filePath: string): Promise<HostingResult> => {
  if (process.env.FIREBASE_ADMIN_KEY_JSON) {
    try {
      return await hostVideoOnFirebase(filePath);
    } catch (e) {
      console.warn('[video-hosting] Firebase failed, falling back to catbox:', e);
    }
  }
  return hostVideoOnCatbox(filePath);
};
