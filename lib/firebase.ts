import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getFirestore, Firestore } from 'firebase/firestore';

// Firebase web config — supplied via env vars (NEXT_PUBLIC_* are exposed to browser).
// These are technically public identifiers (not secrets) but project-specific.
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Lazy init: only when actually used (avoids breaking when Firebase isn't configured).
let cachedApp: FirebaseApp | null = null;
let cachedDb: Firestore | null = null;

const ensureInitialized = () => {
  if (cachedApp) return;
  if (!firebaseConfig.projectId) {
    throw new Error(
      'Firebase 미설정: NEXT_PUBLIC_FIREBASE_* 환경변수를 .env.local에 추가하세요.'
    );
  }
  cachedApp = !getApps().length ? initializeApp(firebaseConfig) : getApp();
  cachedDb = getFirestore(cachedApp);
};

// Proxy exports so legacy imports still work but only initialize on access.
export const app = new Proxy({} as FirebaseApp, {
  get(_, prop) {
    ensureInitialized();
    return (cachedApp as any)[prop];
  },
});

export const db = new Proxy({} as Firestore, {
  get(_, prop) {
    ensureInitialized();
    return (cachedDb as any)[prop];
  },
});
