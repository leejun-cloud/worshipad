import { Audio, Loop, Sequence, staticFile, useVideoConfig } from 'remotion';

interface Props {
  src: string;
  totalDurationInFrames: number;
  volume?: number;
  /**
   * Actual length of the track. Used to decide whether to loop.
   * - If >= video duration: track plays once, gets trimmed at the end (clean).
   * - If < video duration: track loops (boundary may be slightly noticeable).
   */
  trackDurationSec?: number;
  /**
   * Frame range during which narration is playing. BGM volume is ducked
   * inside this range with a short ramp at each edge, so the music sits
   * cleanly under the voice (~-8dB) and rises back up at the head + tail.
   */
  duckRange?: { startFrame: number; endFrame: number };
  /** How much to attenuate to during ducking. Keep high enough for preview audibility. */
  duckTo?: number;
}

export const BgmTrack: React.FC<Props> = ({
  src,
  totalDurationInFrames,
  volume = 0.18,
  trackDurationSec = 18,
  duckRange,
  duckTo = 0.8,
}) => {
  const { fps } = useVideoConfig();
  const trackFrames = Math.max(1, Math.round(trackDurationSec * fps));
  const fadeInFrames = Math.round(fps * 0.25);
  const fadeOutFrames = Math.round(fps * 1.5);
  // 0.4s ramp into/out of the ducked level — smooth enough to be inaudible
  // as a transition while still landing the voice cleanly on top.
  const duckRampFrames = Math.round(fps * 0.4);

  const resolvedSrc =
    src.startsWith('http') || src.startsWith('data:')
      ? src
      : staticFile(src.replace(/^\//, ''));

  const volumeFn = (frame: number) => {
    const fadeIn = Math.min(1, frame / fadeInFrames);
    const fadeOut = Math.min(
      1,
      Math.max(0, (totalDurationInFrames - frame) / fadeOutFrames)
    );
    let duck = 1;
    if (duckRange) {
      const { startFrame, endFrame } = duckRange;
      if (frame >= startFrame - duckRampFrames && frame <= endFrame + duckRampFrames) {
        // Ramp down at the head of the narration, hold at duckTo across the
        // narration body, ramp back up at the tail.
        if (frame < startFrame) {
          const p = (frame - (startFrame - duckRampFrames)) / duckRampFrames;
          duck = 1 - (1 - duckTo) * p;
        } else if (frame > endFrame) {
          const p = (frame - endFrame) / duckRampFrames;
          duck = duckTo + (1 - duckTo) * p;
        } else {
          duck = duckTo;
        }
      }
    }
    return volume * fadeIn * fadeOut * duck;
  };

  // If track is at least as long as the video, play once (no awkward loop).
  if (trackFrames >= totalDurationInFrames) {
    return (
      <Sequence from={0} durationInFrames={totalDurationInFrames}>
        <Audio src={resolvedSrc} volume={volumeFn} />
      </Sequence>
    );
  }

  // Otherwise loop (with fade-in/out applied via volumeFn).
  return (
    <Sequence from={0} durationInFrames={totalDurationInFrames}>
      <Loop durationInFrames={trackFrames}>
        <Audio src={resolvedSrc} volume={volumeFn} />
      </Loop>
    </Sequence>
  );
};
