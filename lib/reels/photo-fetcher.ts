// Media fetcher for photo card backgrounds.
// Chain: Pixabay → Pexels → Canva → null (gradient fallback in Remotion).
//
// Default behaviour: PREFER IMAGES. Pixabay/Pexels stock videos often ship in
// codecs (HEVC/VP9 high-profile) that <video> in chromium refuses to decode
// inline → MEDIA_ELEMENT_ERROR Format error in the editor preview AND in the
// Remotion render. Until we add a transcode step, we keep videos out of the
// auto-pipeline. Callers that explicitly want video can pass `allowVideo:true`.

import { fetchFromPixabay } from './sources/pixabay';
import { fetchFromPexels } from './sources/pexels';
import { fetchFromCanva } from './sources/canva-assets';

export interface FetchedMedia {
  dataUri: string;
  mediaType: 'image' | 'video';
  source: 'pixabay' | 'pexels' | 'canva';
  credit: string;
}

export interface FetchOptions {
  /** Allow video stock results. Default false (image-only) — see header. */
  allowVideo?: boolean;
}

const tryAll = async (query: string): Promise<FetchedMedia | null> => {
  const pix = await fetchFromPixabay(query);
  if (pix) return pix;
  const pex = await fetchFromPexels(query);
  if (pex) return pex;
  const can = await fetchFromCanva(query);
  if (can) return can;
  return null;
};

export const fetchPhoto = async (
  query: string,
  opts: FetchOptions = {}
): Promise<FetchedMedia | null> => {
  // Try once. If we got back a video and the caller didn't ask for it, retry
  // a couple of refined queries that bias toward photo-only results before
  // giving up.
  let media = await tryAll(query);
  if (!media) return null;
  if (media.mediaType === 'image' || opts.allowVideo) return media;

  // Got a video but caller wants images only. Retry with explicit "photo"
  // hint; many providers return image hits when "photo" / "still" is in the
  // query. After 2 retries fall through to whatever we have (caller can still
  // skip videos at a higher layer).
  for (const suffix of ['photo', 'still', 'background photo']) {
    const refined = await tryAll(`${query} ${suffix}`);
    if (refined?.mediaType === 'image') return refined;
  }
  // Final fallback: skip the video to avoid breaking the renderer with an
  // undecodeable stream.
  return null;
};
