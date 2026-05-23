// AI image generation via Imagen 3 (Vertex AI).
// Same auth pattern as lyria.ts — reuses VERTEX_AI_* env vars.
// Returns null when Vertex AI is unconfigured (caller uses gradient fallback).

import { GoogleAuth } from 'google-auth-library';

const IMAGEN_MODEL = 'imagen-3.0-generate-001';
const DEFAULT_LOCATION = 'us-central1';

interface ImagenAuth {
  endpoint: string;
  headers: Record<string, string>;
}

const buildAuth = async (): Promise<ImagenAuth> => {
  const location = process.env.VERTEX_AI_LOCATION || DEFAULT_LOCATION;

  // Method 1: API key + project ID (Express Mode)
  const apiKey = process.env.VERTEX_AI_API_KEY;
  const projectFromKey = process.env.VERTEX_AI_PROJECT_ID;
  if (apiKey && projectFromKey) {
    const endpoint = `https://${location}-aiplatform.googleapis.com/v1/projects/${projectFromKey}/locations/${location}/publishers/google/models/${IMAGEN_MODEL}:predict?key=${apiKey}`;
    return { endpoint, headers: { 'Content-Type': 'application/json' } };
  }

  // Method 2: Service account JSON (OAuth bearer token)
  const json =
    process.env.VERTEX_AI_KEY_JSON ||
    process.env.GOOGLE_TTS_KEY_JSON ||
    process.env.FIREBASE_ADMIN_KEY_JSON;
  if (!json) {
    throw new Error('Vertex AI 인증 미설정: VERTEX_AI_API_KEY+VERTEX_AI_PROJECT_ID 또는 VERTEX_AI_KEY_JSON 필요');
  }

  const credentials = JSON.parse(json);
  const projectId = credentials.project_id;
  if (!projectId) throw new Error('서비스 계정 JSON에 project_id 누락');

  const auth = new GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/cloud-platform'],
  });
  const client = await auth.getClient();
  const tokenResponse = await client.getAccessToken();
  if (!tokenResponse.token) throw new Error('Failed to get access token from service account');

  const endpoint = `https://${location}-aiplatform.googleapis.com/v1/projects/${projectId}/locations/${location}/publishers/google/models/${IMAGEN_MODEL}:predict`;
  return {
    endpoint,
    headers: {
      Authorization: `Bearer ${tokenResponse.token}`,
      'Content-Type': 'application/json',
    },
  };
};

export interface GeneratedImage {
  dataUri: string;
  source: 'imagen';
}

/**
 * Generate a 9:16 image with Imagen 3.
 * Returns null when Vertex AI is not configured or generation fails —
 * callers should use a gradient fallback.
 */
export const generateImage = async (prompt: string): Promise<GeneratedImage | null> => {
  // Skip silently if no Vertex AI credentials at all
  const hasAuth =
    (process.env.VERTEX_AI_API_KEY && process.env.VERTEX_AI_PROJECT_ID) ||
    process.env.VERTEX_AI_KEY_JSON ||
    process.env.GOOGLE_TTS_KEY_JSON ||
    process.env.FIREBASE_ADMIN_KEY_JSON;
  if (!hasAuth) return null;

  try {
    const { endpoint, headers } = await buildAuth();
    const body = {
      instances: [{ prompt }],
      parameters: {
        sampleCount: 1,
        aspectRatio: '9:16',
        safetyFilterLevel: 'block_some',
      },
    };

    const res = await fetch(endpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Imagen API HTTP ${res.status}: ${errText.slice(0, 200)}`);
    }

    const data = await res.json();
    const b64: string | undefined = data?.predictions?.[0]?.bytesBase64Encoded;
    if (!b64) throw new Error('No image data in response');

    return { dataUri: `data:image/png;base64,${b64}`, source: 'imagen' };
  } catch (e) {
    console.warn('[image-gen] Imagen failed (gradient fallback will be used):', e instanceof Error ? e.message : e);
    return null;
  }
};

/** Build a cinematic image prompt suitable for Imagen 3 from card context. */
export const buildImagePrompt = (opts: {
  headline: string;
  body?: string;
  topic: string;
  style?: 'dramatic' | 'cinematic' | 'minimal';
}): string => {
  const { headline, body, topic, style = 'dramatic' } = opts;
  const styleDesc = {
    dramatic: 'dramatic moody lighting, deep shadows, intense atmosphere, high contrast, cinematic',
    cinematic: 'cinematic wide shot, soft bokeh, natural lighting, filmic color grade',
    minimal: 'minimalist composition, clean dark background, single subject, high contrast',
  }[style];
  const content = body ? `${headline} — ${body}` : headline;
  return `Dark atmospheric photographic background for Korean social media content. Topic: "${topic}". Concept: "${content}". ${styleDesc}. No text, no words, no letters anywhere. 9:16 portrait format, professional photography.`;
};
