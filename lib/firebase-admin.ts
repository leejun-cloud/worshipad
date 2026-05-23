import { getApps, initializeApp, cert, App } from 'firebase-admin/app';
import { getStorage } from 'firebase-admin/storage';
import { readFile } from 'fs/promises';
import path from 'path';

const STORAGE_BUCKET = 'iscardnew-fb-2026.firebasestorage.app';

let cachedApp: App | null = null;

const getAdminApp = (): App => {
  if (cachedApp) return cachedApp;

  const existing = getApps().find((a) => a.name === 'admin');
  if (existing) {
    cachedApp = existing;
    return existing;
  }

  let credentials: Record<string, unknown> | null = null;

  if (process.env.FIREBASE_ADMIN_KEY_JSON) {
    credentials = JSON.parse(process.env.FIREBASE_ADMIN_KEY_JSON);
  } else if (process.env.GOOGLE_TTS_KEY_JSON) {
    // fallback: same service account for both TTS + Firebase Storage works if project matches
    credentials = JSON.parse(process.env.GOOGLE_TTS_KEY_JSON);
  }

  if (!credentials) {
    throw new Error('Firebase Admin credentials missing: set FIREBASE_ADMIN_KEY_JSON or GOOGLE_TTS_KEY_JSON');
  }

  cachedApp = initializeApp(
    {
      credential: cert(credentials as any),
      storageBucket: STORAGE_BUCKET,
    },
    'admin'
  );

  return cachedApp;
};

export const uploadFileToStorage = async (
  localFilePath: string,
  destPath: string,
  contentType = 'video/mp4'
): Promise<string> => {
  const app = getAdminApp();
  const bucket = getStorage(app).bucket();

  const buffer = await readFile(localFilePath);
  const file = bucket.file(destPath);

  await file.save(buffer, {
    contentType,
    metadata: {
      contentType,
      cacheControl: 'public, max-age=31536000',
    },
  });

  await file.makePublic();

  return `https://storage.googleapis.com/${bucket.name}/${destPath}`;
};

export const uploadBufferToStorage = async (
  buffer: Buffer,
  destPath: string,
  contentType = 'video/mp4'
): Promise<string> => {
  const app = getAdminApp();
  const bucket = getStorage(app).bucket();
  const file = bucket.file(destPath);

  await file.save(buffer, {
    contentType,
    metadata: { contentType, cacheControl: 'public, max-age=31536000' },
  });

  await file.makePublic();

  return `https://storage.googleapis.com/${bucket.name}/${destPath}`;
};
