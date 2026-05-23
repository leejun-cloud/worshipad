// Instagram Graph API (Instagram Business Login flow)
// Uses graph.instagram.com — same endpoint that 위즈비 system uses.

const DEFAULT_API_VERSION = 'v23.0';
const GRAPH_BASE = (version: string) => `https://graph.instagram.com/${version}`;

export interface InstagramReelsPayload {
  videoUrl: string;
  caption: string;
  shareToFeed?: boolean;
  /** Public URL of cover image (9:16 PNG/JPG). Shown in feed grid. */
  coverUrl?: string;
}

export interface InstagramPublishResult {
  mediaId: string;
  permalink?: string;
}

const getCredentials = () => {
  const accessToken = process.env.INSTA_ACCESS_TOKEN || process.env.IG_ACCESS_TOKEN;
  const accountId = process.env.INSTA_ACCOUNT_ID || process.env.IG_USER_ID;
  const version = process.env.INSTA_API_VERSION || DEFAULT_API_VERSION;

  if (!accessToken || !accountId) {
    throw new Error(
      'Instagram 인증 미설정: INSTA_ACCESS_TOKEN, INSTA_ACCOUNT_ID 환경변수 필요'
    );
  }

  return { accessToken, accountId, version };
};

const waitForContainerReady = async (
  creationId: string,
  baseUrl: string,
  accessToken: string,
  maxWaitSec = 180
): Promise<void> => {
  const intervalMs = 5000;
  const maxAttempts = Math.floor((maxWaitSec * 1000) / intervalMs);

  for (let i = 0; i < maxAttempts; i++) {
    const res = await fetch(
      `${baseUrl}/${creationId}?fields=status_code,status&access_token=${accessToken}`
    );
    const data = await res.json();
    const code = data.status_code;
    if (code === 'FINISHED') return;
    if (code === 'ERROR' || code === 'EXPIRED' || data.error) {
      throw new Error(`컨테이너 처리 실패: ${JSON.stringify(data)}`);
    }
    await new Promise((r) => setTimeout(r, intervalMs));
  }
  throw new Error(`컨테이너 ${maxWaitSec}초 내 준비 완료되지 않음`);
};

export const publishReelsToInstagram = async (
  payload: InstagramReelsPayload
): Promise<InstagramPublishResult> => {
  const { accessToken, accountId, version } = getCredentials();
  const baseUrl = GRAPH_BASE(version);

  // Step 1: Create REELS media container
  const containerParams = new URLSearchParams({
    media_type: 'REELS',
    video_url: payload.videoUrl,
    caption: payload.caption,
    share_to_feed: String(payload.shareToFeed ?? true),
    access_token: accessToken,
  });
  if (payload.coverUrl) {
    containerParams.set('cover_url', payload.coverUrl);
  }

  const containerRes = await fetch(`${baseUrl}/${accountId}/media`, {
    method: 'POST',
    body: containerParams,
  });
  const containerData = await containerRes.json();
  if (!containerRes.ok || !containerData.id) {
    throw new Error(`컨테이너 생성 실패: ${JSON.stringify(containerData)}`);
  }
  const creationId = containerData.id as string;

  // Step 2: Poll until ready
  await waitForContainerReady(creationId, baseUrl, accessToken);

  // Step 3: Publish
  const publishParams = new URLSearchParams({
    creation_id: creationId,
    access_token: accessToken,
  });
  const publishRes = await fetch(`${baseUrl}/${accountId}/media_publish`, {
    method: 'POST',
    body: publishParams,
  });
  const publishData = await publishRes.json();
  if (!publishRes.ok || !publishData.id) {
    throw new Error(`발행 실패: ${JSON.stringify(publishData)}`);
  }
  const mediaId = publishData.id as string;

  // Step 4: Fetch permalink
  let permalink: string | undefined;
  try {
    const permalinkRes = await fetch(
      `${baseUrl}/${mediaId}?fields=permalink&access_token=${accessToken}`
    );
    const permalinkData = await permalinkRes.json();
    permalink = permalinkData.permalink;
  } catch {
    // Permalink fetch is non-critical
  }

  return { mediaId, permalink };
};
