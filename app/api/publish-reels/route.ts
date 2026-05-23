import { NextRequest, NextResponse } from 'next/server';
import { classifyReels } from '@/lib/reels/classify';
import { synthesizeKoreanNarration } from '@/lib/reels/tts';
import { renderReel } from '@/lib/reels/render';
import { fetchBgm, bgmToDataUri } from '@/lib/reels/music-fetcher';
import { uploadFileToStorage } from '@/lib/firebase-admin';
import { publishReelsToInstagram } from '@/lib/instagram';

interface PublishBody {
  text: string;
  caption?: string;
  skipInstagram?: boolean;
  skipTTS?: boolean;
}

export const maxDuration = 300;

export async function POST(request: NextRequest) {
  const startedAt = Date.now();
  const logs: string[] = [];
  const log = (msg: string) => {
    const t = ((Date.now() - startedAt) / 1000).toFixed(1);
    const line = `[${t}s] ${msg}`;
    logs.push(line);
    console.log(`[publish-reels] ${line}`);
  };

  try {
    const body: PublishBody = await request.json();
    if (!body.text || typeof body.text !== 'string') {
      return NextResponse.json({ error: 'text 필드 필요' }, { status: 400 });
    }

    // 1. Classify + field extraction + narration
    log('classifying with Gemini');
    const classified = await classifyReels(body.text);
    log(`template=${classified.template} narration=${classified.narration.length}자`);

    // 2. TTS narration (use base64 data URI to bypass bundle static-dir caching)
    let audioUrl: string | undefined;
    let audioDurationSec: number | undefined;
    if (!body.skipTTS) {
      log('generating TTS');
      const tts = await synthesizeKoreanNarration(classified.narration);
      audioUrl = `data:audio/wav;base64,${tts.audioBuffer.toString('base64')}`;
      audioDurationSec = tts.durationSec;
      log(`tts done ${tts.fileName} (${(tts.audioBuffer.length / 1024).toFixed(0)}KB, ${tts.durationSec.toFixed(1)}s)`);
    }

    // 3. Render MP4 with audio + dynamic BGM (Jamendo → Lyria → fallback)
    log(`fetching BGM for mood: ${classified.bgmMood} (query: "${classified.musicSearchQuery}")`);
    const bgm = await fetchBgm({
      mood: classified.bgmMood,
      searchQuery: classified.musicSearchQuery,
      genPrompt: classified.musicGenPrompt,
    });
    log(`bgm source=${bgm.source} ${bgm.publicUrl} (${bgm.durationSec.toFixed(1)}s)`);

    // Embed BGM as data URI (bypasses bundle static-dir caching)
    const targetBgmDuration = (audioDurationSec ?? 30) + 2;
    const bgmDataUri = await bgmToDataUri(bgm, targetBgmDuration);
    log(`bgm embedded as data URI: ${(bgmDataUri.sizeBytes / 1024).toFixed(0)}KB`);

    log('rendering Remotion MP4');
    const renderData = {
      ...classified.data,
      audioUrl,
      audioDurationSec,
      bgmUrl: bgmDataUri.dataUri,
      bgmVolume: bgm.volume,
      bgmTrackDurationSec: bgmDataUri.durationSec,
    };
    const rendered = await renderReel({
      template: classified.template,
      data: renderData,
    });
    log(`render done ${rendered.fileName}`);

    // 4. Upload to Firebase Storage
    log('uploading to Firebase Storage');
    const publicVideoUrl = await uploadFileToStorage(
      rendered.localPath,
      `reels/${rendered.fileName}`,
      'video/mp4'
    );
    log(`uploaded ${publicVideoUrl}`);

    // 5. Publish to Instagram (optional)
    let instagram: { mediaId: string; permalink?: string } | null = null;
    if (!body.skipInstagram) {
      log('publishing to Instagram Reels');
      const caption = body.caption || classified.narration;
      instagram = await publishReelsToInstagram({
        videoUrl: publicVideoUrl,
        caption,
        shareToFeed: true,
      });
      log(`instagram published id=${instagram.mediaId}`);
    }

    return NextResponse.json({
      success: true,
      template: classified.template,
      data: classified.data,
      narration: classified.narration,
      videoUrl: publicVideoUrl,
      instagram,
      elapsedMs: Date.now() - startedAt,
      logs,
    });
  } catch (error) {
    console.error('[publish-reels] Error:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : '발행 실패',
        logs,
        elapsedMs: Date.now() - startedAt,
      },
      { status: 500 }
    );
  }
}
