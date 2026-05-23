'use client';

import { Player, type PlayerRef } from '@remotion/player';
import { useEffect, useMemo, useRef, useState } from 'react';
import { ChurchAdReel } from '@/remotion/templates/ChurchAd/ChurchAdReel';
import type { ChurchAdProject } from './types';

const FPS = 30;
const W = 1920;
const H = 1080;

interface Props {
  project: ChurchAdProject;
  selectedSlide: number;
  onSelectSlide?: (index: number) => void;
  jumpKey?: number;
}

type AudioReady = 'idle' | 'loading' | 'ready' | 'error';

// Hidden <audio preload="auto"> primes the browser HTTP cache so that when
// Remotion's <Audio> inside <Player> mounts and starts playing it hits an
// already-decoded buffer instead of fetching mid-playback (which is what
// caused the "처음 무음 → 중간쯤 음성 시작" symptom).
const useAudioPreload = (url?: string): { state: AudioReady; pct: number } => {
  const [state, setState] = useState<AudioReady>('idle');
  const [pct, setPct] = useState(0);

  useEffect(() => {
    if (!url) {
      setState('idle');
      setPct(0);
      return;
    }
    setState('loading');
    setPct(0);

    let cancelled = false;
    const audio = new Audio();
    audio.preload = 'auto';
    audio.src = url;

    const onProgress = () => {
      try {
        if (audio.buffered.length > 0 && audio.duration > 0) {
          const end = audio.buffered.end(audio.buffered.length - 1);
          const ratio = Math.min(end / audio.duration, 1);
          setPct(Math.round(ratio * 100));
        }
      } catch {}
    };
    const onCanPlay = () => {
      if (cancelled) return;
      setPct(100);
      setState('ready');
    };
    const onError = () => {
      if (cancelled) return;
      setState('error');
    };

    audio.addEventListener('progress', onProgress);
    audio.addEventListener('canplaythrough', onCanPlay);
    audio.addEventListener('canplay', onCanPlay);
    audio.addEventListener('error', onError);

    // Force the browser to start fetching now.
    audio.load();

    return () => {
      cancelled = true;
      audio.removeEventListener('progress', onProgress);
      audio.removeEventListener('canplaythrough', onCanPlay);
      audio.removeEventListener('canplay', onCanPlay);
      audio.removeEventListener('error', onError);
      audio.src = '';
    };
  }, [url]);

  return { state, pct };
};

export const PreviewPanel: React.FC<Props> = ({
  project,
  selectedSlide,
  onSelectSlide,
  jumpKey = 0,
}) => {
  const ref = useRef<PlayerRef>(null);

  const audioUrl = project.audioUrl ?? project.audioDataUri;
  const bgmUrl = project.bgmUrl ?? project.bgmDataUri;

  const audio = useAudioPreload(audioUrl);
  const bgm = useAudioPreload(bgmUrl);

  // Combined "media ready" — only true once both narration and BGM have been
  // buffered enough to play through. We use this to gate the play button.
  const mediaReady =
    (!audioUrl || audio.state === 'ready' || audio.state === 'error') &&
    (!bgmUrl || bgm.state === 'ready' || bgm.state === 'error');

  const sceneDurationsSec = useMemo(() => {
    if (
      project.sceneDurationsSec &&
      project.sceneDurationsSec.length === project.slides.length
    ) {
      return project.sceneDurationsSec.map((s) => Math.max(s, 1.5));
    }
    return project.slides.map((s) => Math.max(s.durationSec ?? 6, 1.5));
  }, [project.slides, project.sceneDurationsSec]);

  const totalSec = sceneDurationsSec.reduce((a, b) => a + b, 0);
  const totalFrames = Math.max(Math.round(totalSec * FPS), FPS);

  const inputProps = useMemo(
    () => ({
      title: project.title,
      churchName: project.churchName,
      slogan: project.slogan,
      accentColor: project.accentColor,
      backgroundColor: project.backgroundColor,
      fontFamily: project.fontFamily,
      bgOverlayOpacity: project.bgOverlayOpacity,
      logoDataUri: project.logoDataUri,
      badge: project.badge,
      badgeText: project.badgeText,
      audioUrl,
      audioDurationSec: project.audioDurationSec ?? 0,
      bgmUrl,
      bgmVolume:
        project.bgmVolume ?? (project.bgmUrl || project.bgmDataUri ? 0.1 : 0),
      bgmTrackDurationSec: project.bgmTrackDurationSec,
      sceneDurationsSec,
      slides: project.slides.map((s) => ({
        type: s.type,
        heading: s.heading,
        subheading: s.subheading,
        bullets: s.bullets,
        services: s.services,
        programs: s.programs,
        pastorName: s.pastorName,
        pastorTitle: s.pastorTitle,
        pastorMessage: s.pastorMessage,
        eventDate: s.eventDate,
        eventLocation: s.eventLocation,
        verse: s.verse,
        verseRef: s.verseRef,
        address: s.address,
        transit: s.transit,
        phone: s.phone,
        website: s.website,
        socials: s.socials,
        cta: s.cta,
        mediaDataUri: s.mediaDataUri ?? s.mediaUrl,
        mediaType: s.mediaType ?? 'image',
        layout: s.layout,
        textScale: s.textScale,
        entryEffect: s.entryEffect,
      })),
    }),
    [project, sceneDurationsSec, audioUrl, bgmUrl]
  );

  // Seek when a slide is clicked.
  useEffect(() => {
    if (!ref.current) return;
    let frame = 0;
    for (let i = 0; i < selectedSlide; i++) {
      frame += Math.round(sceneDurationsSec[i] * FPS);
    }
    ref.current.seekTo(frame);
  }, [selectedSlide, jumpKey, sceneDurationsSec]);

  // Keep the timeline highlight synced as playback scrubs.
  useEffect(() => {
    if (!ref.current || !onSelectSlide) return;
    const player = ref.current;
    const onFrame = (e: { detail: { frame: number } }) => {
      const f = e.detail.frame;
      let acc = 0;
      for (let i = 0; i < sceneDurationsSec.length; i++) {
        acc += Math.round(sceneDurationsSec[i] * FPS);
        if (f < acc) {
          onSelectSlide(i);
          return;
        }
      }
    };
    player.addEventListener('frameupdate', onFrame as any);
    return () => {
      player.removeEventListener('frameupdate', onFrame as any);
    };
  }, [sceneDurationsSec, onSelectSlide]);

  // Pause the player automatically while audio is still buffering — prevents
  // playback racing ahead of the audio decode and giving the user "silent
  // first half then audio kicks in" surprise.
  useEffect(() => {
    if (!ref.current) return;
    if (!mediaReady) {
      try {
        ref.current.pause();
      } catch {}
    }
  }, [mediaReady]);

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        background: '#0a0d12',
      }}
    >
      {/*
       * Hidden preload elements force the browser to fetch + decode the WAVs
       * the moment a URL is set, so by the time the user clicks ▶ the
       * browser cache is already warm and Remotion's <Audio> inside the Player
       * starts the very first frame in sync with the visuals.
       */}
      {audioUrl && (
        <audio src={audioUrl} preload="auto" style={{ display: 'none' }} />
      )}
      {bgmUrl && (
        <audio src={bgmUrl} preload="auto" style={{ display: 'none' }} />
      )}

      <div
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 16,
          minHeight: 0,
          position: 'relative',
        }}
      >
        <div
          style={{
            width: '100%',
            aspectRatio: `${W} / ${H}`,
            maxHeight: '100%',
            position: 'relative',
          }}
        >
          <Player
            ref={ref}
            component={ChurchAdReel as any}
            inputProps={inputProps as any}
            durationInFrames={totalFrames}
            fps={FPS}
            compositionWidth={W}
            compositionHeight={H}
            controls
            style={{ width: '100%', height: '100%' }}
            acknowledgeRemotionLicense
          />

          {/* Audio buffering overlay — covers the play button until media is
              actually ready, preventing the silent-first-half symptom. */}
          {(audioUrl || bgmUrl) && !mediaReady && (
            <div
              style={{
                position: 'absolute',
                inset: 0,
                background: 'rgba(10, 13, 18, 0.55)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 12,
                pointerEvents: 'none',
              }}
            >
              <div
                style={{
                  background: 'rgba(15, 18, 22, 0.92)',
                  border: `1px solid ${project.accentColor}66`,
                  borderRadius: 10,
                  padding: '14px 22px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 8,
                  minWidth: 260,
                }}
              >
                <div style={{ color: '#fff', fontSize: 13, fontWeight: 700 }}>
                  ⏳ 음성 사전 로드 중…
                </div>
                <div style={{ display: 'flex', gap: 14, fontSize: 11, color: '#a4adba' }}>
                  {audioUrl && (
                    <span style={{ color: audio.state === 'ready' ? project.accentColor : '#a4adba' }}>
                      🎙 {audio.state === 'ready' ? '✓' : `${audio.pct}%`}
                    </span>
                  )}
                  {bgmUrl && (
                    <span style={{ color: bgm.state === 'ready' ? project.accentColor : '#a4adba' }}>
                      🎵 {bgm.state === 'ready' ? '✓' : `${bgm.pct}%`}
                    </span>
                  )}
                </div>
                <div
                  style={{
                    width: 220,
                    height: 4,
                    background: '#0a0d12',
                    borderRadius: 2,
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      width: `${Math.min(
                        100,
                        Math.round(((audio.pct || 100) + (bgm.pct || 100)) / (audioUrl && bgmUrl ? 2 : 1))
                      )}%`,
                      height: '100%',
                      background: project.accentColor,
                      transition: 'width 0.2s',
                    }}
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {!audioUrl && (
        <div
          style={{
            padding: '6px 12px',
            background: '#1a2230',
            color: '#a4adba',
            fontSize: 11,
            textAlign: 'center',
            borderTop: '1px solid #1c2028',
          }}
        >
          🔇 음성/BGM 없음 — 상단 <strong>🔊 음성+BGM 생성</strong> 버튼을 눌러주세요
        </div>
      )}

      {audioUrl && mediaReady && (
        <div
          style={{
            padding: '4px 12px',
            background: '#0f1d12',
            color: '#5cb85c',
            fontSize: 10,
            textAlign: 'center',
            borderTop: '1px solid #1c2028',
            fontWeight: 600,
          }}
        >
          ✓ 음성/BGM 사전 로드 완료 — ▶ 누르면 즉시 재생
        </div>
      )}
    </div>
  );
};
