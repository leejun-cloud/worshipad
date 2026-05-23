// Orchestrate publishing a video to multiple platforms in parallel.
// Currently supports: Instagram Reels, YouTube Shorts.

import { hostVideo } from '../video-hosting';
import { publishReelsToInstagram, InstagramPublishResult } from '../instagram';
import { uploadShortsToYouTube, YouTubeUploadResult } from '../youtube';
import { PlatformMetadata } from './metadata';

export interface MultiPublishOptions {
  videoPath: string;
  metadata: PlatformMetadata;
  /** Default: true for both. */
  publishToInstagram?: boolean;
  publishToYouTube?: boolean;
  /** YouTube privacy. Default 'public'. */
  youtubePrivacy?: 'public' | 'unlisted' | 'private';
  /** Local path to a cover image (9:16 PNG). Used as IG cover_url + YouTube custom thumbnail. */
  coverImagePath?: string;
}

export interface MultiPublishResult {
  publicVideoUrl?: string;
  instagram?: InstagramPublishResult | { error: string };
  youtube?: YouTubeUploadResult | { error: string };
  elapsedMs: number;
}

export const publishToMultiplePlatforms = async (
  opts: MultiPublishOptions
): Promise<MultiPublishResult> => {
  const t0 = Date.now();
  const result: MultiPublishResult = { elapsedMs: 0 };

  const wantsInstagram = opts.publishToInstagram !== false;
  const wantsYouTube = opts.publishToYouTube !== false;

  // Step 1: Host video publicly (only needed for Instagram)
  if (wantsInstagram) {
    const hosted = await hostVideo(opts.videoPath);
    result.publicVideoUrl = hosted.publicUrl;
  }

  // Step 1b: Host cover image publicly (for IG cover_url) — runs in parallel with video host above
  let coverImageUrl: string | undefined;
  if (opts.coverImagePath && wantsInstagram) {
    try {
      const hostedCover = await hostVideo(opts.coverImagePath);
      coverImageUrl = hostedCover.publicUrl;
    } catch (e) {
      console.warn(`[multi-publish] cover hosting failed (non-fatal):`, e instanceof Error ? e.message : e);
    }
  }

  // Step 2: Parallel publish
  const tasks: Promise<unknown>[] = [];

  if (wantsInstagram && result.publicVideoUrl) {
    const igTask = publishReelsToInstagram({
      videoUrl: result.publicVideoUrl,
      caption: opts.metadata.instagramCaption,
      shareToFeed: true,
      coverUrl: coverImageUrl,
    })
      .then((r) => {
        result.instagram = r;
      })
      .catch((e) => {
        result.instagram = { error: e instanceof Error ? e.message : String(e) };
      });
    tasks.push(igTask);
  }

  if (wantsYouTube) {
    const ytTask = uploadShortsToYouTube({
      videoPath: opts.videoPath,
      title: opts.metadata.youtubeTitle,
      description: opts.metadata.youtubeDescription,
      tags: opts.metadata.youtubeTags,
      privacy: opts.youtubePrivacy || 'public',
      categoryId: '27', // Education
      thumbnailPath: opts.coverImagePath,
    })
      .then((r) => {
        result.youtube = r;
      })
      .catch((e) => {
        result.youtube = { error: e instanceof Error ? e.message : String(e) };
      });
    tasks.push(ytTask);
  }

  await Promise.all(tasks);
  result.elapsedMs = Date.now() - t0;
  return result;
};
