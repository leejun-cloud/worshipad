import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { classifyReels } from '@/lib/reels/classify';
import { synthesizeKoreanNarration } from '@/lib/reels/tts';
import { renderReel } from '@/lib/reels/render';
import { fetchBgm, bgmToDataUri } from '@/lib/reels/music-fetcher';
import { uploadFileToStorage } from '@/lib/firebase-admin';
import { publishReelsToInstagram } from '@/lib/instagram';

export const maxDuration = 300;

const verifySlackSignature = (
  body: string,
  signature: string | null,
  timestamp: string | null
): boolean => {
  const secret = process.env.SLACK_SIGNING_SECRET;
  if (!secret) return true; // dev mode: skip
  if (!signature || !timestamp) return false;

  const age = Math.abs(Date.now() / 1000 - Number(timestamp));
  if (age > 60 * 5) return false;

  const baseString = `v0:${timestamp}:${body}`;
  const hmac = crypto.createHmac('sha256', secret).update(baseString).digest('hex');
  const expected = `v0=${hmac}`;

  try {
    return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
  } catch {
    return false;
  }
};

const postToSlackResponseUrl = async (responseUrl: string, payload: unknown) => {
  try {
    await fetch(responseUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
  } catch (e) {
    console.error('[slack] response post failed:', e);
  }
};

const processAndReply = async (text: string, responseUrl: string) => {
  try {
    const classified = await classifyReels(text);
    const tts = await synthesizeKoreanNarration(classified.narration);
    const audioDataUri = `data:audio/wav;base64,${tts.audioBuffer.toString('base64')}`;
    const bgm = await fetchBgm({
      mood: classified.bgmMood,
      searchQuery: classified.musicSearchQuery,
      genPrompt: classified.musicGenPrompt,
    });
    const bgmDataUri = await bgmToDataUri(bgm, tts.durationSec + 2);
    const rendered = await renderReel({
      template: classified.template,
      data: {
        ...classified.data,
        audioUrl: audioDataUri,
        audioDurationSec: tts.durationSec,
        bgmUrl: bgmDataUri.dataUri,
        bgmVolume: bgm.volume,
        bgmTrackDurationSec: bgmDataUri.durationSec,
      },
    });
    const publicVideoUrl = await uploadFileToStorage(
      rendered.localPath,
      `reels/${rendered.fileName}`,
      'video/mp4'
    );

    let igResult = '';
    if (process.env.IG_ACCESS_TOKEN && process.env.IG_USER_ID) {
      try {
        const ig = await publishReelsToInstagram({
          videoUrl: publicVideoUrl,
          caption: classified.narration,
          shareToFeed: true,
        });
        igResult = `\n📱 Instagram: ${ig.permalink || ig.mediaId}`;
      } catch (e) {
        igResult = `\n⚠️ Instagram 발행 실패: ${e instanceof Error ? e.message : e}`;
      }
    }

    await postToSlackResponseUrl(responseUrl, {
      response_type: 'in_channel',
      text: `✅ 릴스 생성 완료 (템플릿: ${classified.template})\n🎬 영상: ${publicVideoUrl}${igResult}`,
    });
  } catch (error) {
    await postToSlackResponseUrl(responseUrl, {
      response_type: 'ephemeral',
      text: `❌ 릴스 생성 실패: ${error instanceof Error ? error.message : error}`,
    });
  }
};

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text();
    const signature = request.headers.get('x-slack-signature');
    const timestamp = request.headers.get('x-slack-request-timestamp');

    if (!verifySlackSignature(rawBody, signature, timestamp)) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    const params = new URLSearchParams(rawBody);
    const text = params.get('text') || '';
    const responseUrl = params.get('response_url') || '';
    const userName = params.get('user_name') || 'unknown';

    if (!text.trim()) {
      return NextResponse.json({
        response_type: 'ephemeral',
        text: '사용법: `/릴스 [본문 내용]`',
      });
    }

    if (!responseUrl) {
      return NextResponse.json({ error: 'response_url missing' }, { status: 400 });
    }

    // Ack immediately, process async (Slack requires response within 3s)
    processAndReply(text, responseUrl).catch((e) => console.error('[slack] async error', e));

    return NextResponse.json({
      response_type: 'ephemeral',
      text: `⏳ ${userName}님, 릴스 생성 중입니다 (약 1~3분 소요)...`,
    });
  } catch (error) {
    console.error('[slack] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '처리 실패' },
      { status: 500 }
    );
  }
}
