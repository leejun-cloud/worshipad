// YouTube Shorts upload via Data API v3 + OAuth 2.0
// Vertical video (9:16) is auto-detected as Shorts when uploaded with #Shorts in title or description.

import { google, youtube_v3 } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';
import { createReadStream } from 'fs';
import { stat } from 'fs/promises';

const REQUIRED_ENVS = ['YOUTUBE_CLIENT_ID', 'YOUTUBE_CLIENT_SECRET', 'YOUTUBE_REFRESH_TOKEN'];

export interface YouTubeUploadPayload {
  videoPath: string;
  title: string;
  description: string;
  tags?: string[];
  /** YouTube category ID (default 22 = People & Blogs). 27 = Education. */
  categoryId?: string;
  /** 'public' | 'unlisted' | 'private'. Default 'public'. */
  privacy?: 'public' | 'unlisted' | 'private';
  madeForKids?: boolean;
  /** Local path to a custom thumbnail (PNG/JPG, ≤2MB, 16:9 or 9:16). */
  thumbnailPath?: string;
}

export interface YouTubeUploadResult {
  videoId: string;
  url: string;
  shortsUrl: string;
}

const getAuthClient = (): OAuth2Client => {
  for (const k of REQUIRED_ENVS) {
    if (!process.env[k]) {
      throw new Error(`YouTube 인증 미설정: ${k} 누락`);
    }
  }

  const oauth2 = new google.auth.OAuth2(
    process.env.YOUTUBE_CLIENT_ID,
    process.env.YOUTUBE_CLIENT_SECRET
  );
  oauth2.setCredentials({ refresh_token: process.env.YOUTUBE_REFRESH_TOKEN });
  return oauth2;
};

export const uploadShortsToYouTube = async (
  payload: YouTubeUploadPayload
): Promise<YouTubeUploadResult> => {
  const auth = getAuthClient();
  const youtube = google.youtube({ version: 'v3', auth });

  // Verify file exists
  const fileStat = await stat(payload.videoPath);
  if (!fileStat.isFile() || fileStat.size === 0) {
    throw new Error(`Invalid video file: ${payload.videoPath}`);
  }

  // Ensure #Shorts is somewhere in title or description (helps YouTube classify as Short)
  const hasShortsTag =
    /#shorts/i.test(payload.title) || /#shorts/i.test(payload.description);
  const description = hasShortsTag
    ? payload.description
    : `${payload.description}\n\n#Shorts`;

  const requestBody: youtube_v3.Schema$Video = {
    snippet: {
      title: payload.title.slice(0, 100), // YT title max 100 chars
      description: description.slice(0, 5000), // YT description max 5000 chars
      tags: (payload.tags || []).slice(0, 30),
      categoryId: payload.categoryId || '22',
      defaultLanguage: 'ko',
      defaultAudioLanguage: 'ko',
    },
    status: {
      privacyStatus: payload.privacy || 'public',
      selfDeclaredMadeForKids: payload.madeForKids ?? false,
    },
  };

  const res = await youtube.videos.insert({
    part: ['snippet', 'status'],
    requestBody,
    media: {
      body: createReadStream(payload.videoPath),
    },
  });

  const videoId = res.data.id;
  if (!videoId) {
    throw new Error(`Upload returned no videoId: ${JSON.stringify(res.data)}`);
  }

  // Set custom thumbnail if provided. Channel must be verified (most are);
  // failure is non-fatal — we still return the upload result.
  if (payload.thumbnailPath) {
    try {
      const thumbStat = await stat(payload.thumbnailPath);
      if (thumbStat.isFile() && thumbStat.size > 0 && thumbStat.size < 2 * 1024 * 1024) {
        await youtube.thumbnails.set({
          videoId,
          media: { body: createReadStream(payload.thumbnailPath) },
        });
      }
    } catch (e) {
      console.warn(`[youtube] thumbnail set failed (non-fatal):`, e instanceof Error ? e.message : e);
    }
  }

  return {
    videoId,
    url: `https://www.youtube.com/watch?v=${videoId}`,
    shortsUrl: `https://www.youtube.com/shorts/${videoId}`,
  };
};
