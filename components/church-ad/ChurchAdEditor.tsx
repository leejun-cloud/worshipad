'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { PanelGroup, Panel, PanelResizeHandle } from 'react-resizable-panels';
import { PreviewPanel } from './PreviewPanel';
import { Timeline } from './Timeline';
import { LayerTimeline } from './LayerTimeline';
import { Inspector } from './Inspector';
import { BundlePanel } from './BundlePanel';
import { BadgePanel } from './BadgePanel';
import { StylePresetPicker } from './StylePresetPicker';
import { AutoMode } from './AutoMode';
import { getPreset } from './style-presets';
import { newSlide, type ChurchAdProject, type ChurchAdSlide, type ChurchSlideType, type PinnedBadge } from './types';

const DEFAULT_PROJECT: ChurchAdProject = {
  title: '우리교회 안내',
  churchName: '우리교회',
  slogan: '함께 예배하고 함께 살아가는 공동체',
  accentColor: '#d4a657',
  backgroundColor: '#0f1c2e',
  bgmMood: 'warm',
  musicSearchQuery: 'gentle worship piano',
  musicGenPrompt: 'gentle warm piano background, hopeful church ambient',
  slides: [
    newSlide('cover'),
    newSlide('welcome'),
    newSlide('worship-times'),
    newSlide('programs'),
    newSlide('pastor'),
    newSlide('verse'),
    newSlide('location'),
    newSlide('contact'),
    newSlide('invitation'),
  ],
};

const ENTRY_EFFECT_CYCLE: ChurchAdSlide['entryEffect'][] = [
  'fade',
  'slide-left',
  'slide-right',
  'slide-top',
  'slide-bottom',
  'close-up',
  'scale-up',
];

const applyEntryEffectVariety = (slides: ChurchAdSlide[]): ChurchAdSlide[] => {
  let mediaIndex = 0;
  return slides.map((slide) => {
    const hasMedia = !!(slide.mediaUrl || slide.mediaDataUri || slide.galleryUrls?.length || slide.imageSearchQuery);
    if (!hasMedia || slide.entryEffect) return slide;
    const entryEffect = ENTRY_EFFECT_CYCLE[mediaIndex % ENTRY_EFFECT_CYCLE.length];
    mediaIndex++;
    return { ...slide, entryEffect };
  });
};

const STORAGE_KEY = 'church-ad-project-v1';
const MODE_KEY = 'church-ad-mode-v1';
const PROFILE_KEY = 'church-ad-profile-v1';
type EditorMode = 'auto' | 'pro';

export const ChurchAdEditor: React.FC = () => {
  const [project, setProject] = useState<ChurchAdProject>(DEFAULT_PROJECT);
  const [selected, setSelected] = useState(0);
  const [jumpKey, setJumpKey] = useState(0);
  const [text, setText] = useState('');
  // Optional user-uploaded media for the auto-pipeline. The pipeline assigns
  // these to slides FIRST (in upload order), then fills remaining slots from
  // free stock photo APIs via /api/church-ad/auto-photos.
  const [sourceMedia, setSourceMedia] = useState<
    { url: string; mediaType: 'image' | 'video'; filename: string }[]
  >([]);
  const sourceFileRef = useRef<HTMLInputElement | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [renderJob, setRenderJob] = useState<{ id: string; status: string; progress: number; step: string; videoUrl?: string; error?: string } | null>(null);
  const [showSourcePanel, setShowSourcePanel] = useState(false);
  const [showBundlePanel, setShowBundlePanel] = useState(false);
  const [synthBusy, setSynthBusy] = useState<string | null>(null);
  const [photoBusy, setPhotoBusy] = useState<string | null>(null);
  // Server-side TTS / BGM / photo calls return only when fully done — there's
  // no streaming progress. We estimate elapsed/expected so the user gets a
  // moving % bar instead of staring at a static spinner.
  const [progress, setProgress] = useState<{
    label: string;
    pct: number;
    accent: string;
  } | null>(null);

  // Drives a faux-progress bar over `expectedMs` until canceled.
  const driveProgress = (label: string, expectedMs: number, accent = '#a872d4') => {
    const startedAt = Date.now();
    setProgress({ label, pct: 0, accent });
    const timer = setInterval(() => {
      const elapsed = Date.now() - startedAt;
      // Asymptotic — climbs fast at first, slows near 95% (so it never falsely
      // claims 100% before the server actually responds).
      const pct = Math.min(95, Math.round((elapsed / expectedMs) * 95));
      setProgress({ label, pct, accent });
    }, 250);
    return () => {
      clearInterval(timer);
      setProgress(null);
    };
  };
  const [timelineMode, setTimelineMode] = useState<'slide' | 'layer'>('slide');
  const [showBadgePanel, setShowBadgePanel] = useState(false);
  const [showStylePicker, setShowStylePicker] = useState(false);
  // Verbatim mode = TTS narration uses the user's exact input text (no Gemini
  // rewording). Default ON because users were surprised when their script got
  // paraphrased.
  const [verbatim, setVerbatim] = useState(true);
  // Auto = CapCut-simpler 3-step flow for new users (default).
  // Pro  = the full timeline+inspector+panels editor for power users.
  const [mode, setMode] = useState<EditorMode>('auto');

  useEffect(() => {
    try {
      const m = localStorage.getItem(MODE_KEY);
      if (m === 'auto' || m === 'pro') setMode(m);
    } catch {}
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(MODE_KEY, mode);
    } catch {}
  }, [mode]);

  useEffect(() => {
    const onEditSlide = () => {
      const el = document.getElementById('heading-input');
      if (el) {
        el.focus();
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    };
    window.addEventListener('editor-edit-slide', onEditSlide as EventListener);
    return () => window.removeEventListener('editor-edit-slide', onEditSlide as EventListener);
  }, []);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      // Always load saved church profile first so new projects inherit it
      const profileRaw = localStorage.getItem(PROFILE_KEY);
      const savedProfile = profileRaw ? JSON.parse(profileRaw) as { churchName?: string; slogan?: string; accentColor?: string; backgroundColor?: string; logoDataUri?: string } : null;

      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as ChurchAdProject;
        if (parsed?.slides?.length) {
          // Migrate legacy badge.text — earlier builds wrote the project's
          // churchName into badge.text on first open which then froze the
          // displayed badge to the old name even after the user changed
          // churchName. Drop badge.text when:
          //   (a) it matches the current churchName (auto-tracking is
          //       indistinguishable, so prefer the live value), OR
          //   (b) it matches the well-known stale default '우리교회' from the
          //       initial project state.
          if (
            parsed.badge?.text &&
            (parsed.badge.text === parsed.churchName ||
              parsed.badge.text === DEFAULT_PROJECT.churchName)
          ) {
            parsed.badge = { ...parsed.badge, text: undefined };
          }
          // Restore church profile fields in case they got reset
          if (savedProfile?.churchName && (!parsed.churchName || parsed.churchName === DEFAULT_PROJECT.churchName)) {
            parsed.churchName = savedProfile.churchName;
          }
          if (savedProfile?.slogan && (!parsed.slogan || parsed.slogan === DEFAULT_PROJECT.slogan)) {
            parsed.slogan = savedProfile.slogan;
          }
          setProject(parsed);
          return;
        }
      }
      // Fresh project — use saved profile if available
      if (savedProfile) {
        setProject((p) => ({
          ...p,
          churchName: savedProfile.churchName || p.churchName,
          slogan: savedProfile.slogan || p.slogan,
          accentColor: savedProfile.accentColor || p.accentColor,
          backgroundColor: savedProfile.backgroundColor || p.backgroundColor,
          logoDataUri: savedProfile.logoDataUri || p.logoDataUri,
        }));
      }
      // Fresh project — surface the auto-generation entry point right away.
      setShowSourcePanel(true);
    } catch {}
  }, []);

  // Persist on change — strip legacy data URIs before save so localStorage
  // never balloons past its ~5MB quota even if some old code path slipped a
  // base64 blob into the project state.
  useEffect(() => {
    try {
      const stripped: ChurchAdProject = {
        ...project,
        audioDataUri: undefined,
        bgmDataUri: undefined,
        logoDataUri: undefined,
        badge: project.badge
          ? { ...project.badge, logoDataUri: undefined, photoDataUri: undefined }
          : undefined,
        slides: project.slides.map((s) => ({ ...s, mediaDataUri: undefined })),
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(stripped));
      // Persist church identity separately so new projects always inherit it
      localStorage.setItem(PROFILE_KEY, JSON.stringify({
        churchName: project.churchName,
        slogan: project.slogan,
        accentColor: project.accentColor,
        backgroundColor: project.backgroundColor,
      }));
    } catch (e) {
      console.warn('localStorage save failed:', e);
    }
  }, [project]);

  // Poll render job
  useEffect(() => {
    if (!renderJob || renderJob.status === 'ready' || renderJob.status === 'failed') return;
    const t = setInterval(async () => {
      try {
        const res = await fetch(`/api/church-ad/jobs/${renderJob.id}`);
        const j = await res.json();
        if (res.ok) setRenderJob(j);
      } catch {}
    }, 1500);
    return () => clearInterval(t);
  }, [renderJob]);

  const selectedSlide = project.slides[Math.min(selected, project.slides.length - 1)];

  const updateSlide = (i: number, patch: Partial<ChurchAdSlide>) => {
    setProject((p) => ({
      ...p,
      slides: p.slides.map((s, j) => (j === i ? { ...s, ...patch } : s)),
    }));
  };

  const reorder = (from: number, to: number) => {
    setProject((p) => {
      const moving = p.slides[from];
      const target = p.slides[to];
      // Don't move into/across locked slides — they keep their position.
      if (moving?.locked || target?.locked) return p;
      const next = [...p.slides];
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved);
      return { ...p, slides: next };
    });
    setSelected(to);
  };

  const duplicate = (i: number) => {
    setProject((p) => {
      const next = [...p.slides];
      const copy = { ...p.slides[i], id: crypto.randomUUID() };
      next.splice(i + 1, 0, copy);
      return { ...p, slides: next };
    });
  };

  const deleteSlide = (i: number) => {
    setProject((p) => {
      if (p.slides.length <= 1) return p;
      if (p.slides[i]?.locked) {
        if (typeof window !== 'undefined') {
          alert('🔒 고정된 슬라이드는 삭제할 수 없어요. 인스펙터에서 잠금을 먼저 풀어주세요.');
        }
        return p;
      }
      return { ...p, slides: p.slides.filter((_, j) => j !== i) };
    });
    setSelected((s) => Math.max(0, s - 1));
  };

  const addSlide = (type: ChurchSlideType) => {
    setProject((p) => {
      const next = [...p.slides, newSlide(type)];
      setSelected(next.length - 1);
      return { ...p, slides: next };
    });
  };

  const generateFromText = async (opts: { autoPipeline?: boolean } = { autoPipeline: true }) => {
    if (!text.trim()) return;
    setBusy('① Gemini로 슬라이드 구조 생성 중…');
    setErr(null);
    // Gemini structure call ~ 15-40s depending on thinking budget.
    let stopProgress = driveProgress('① 슬라이드 구조화', 60000, project.accentColor);
    try {
      const structureAbort = new AbortController();
      const structureTimer = setTimeout(() => structureAbort.abort(), 90_000);
      let res: Response;
      try {
        res = await fetch('/api/church-ad/structure', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          signal: structureAbort.signal,
          body: JSON.stringify({
            text,
            profile: {
              churchName: project.churchName,
              slogan: project.slogan,
              accentColor: project.accentColor,
              backgroundColor: project.backgroundColor,
            },
            titleHint: project.title,
            verbatim,
          }),
        });
      } finally {
        clearTimeout(structureTimer);
      }
      const j = await res.json();
      if (!res.ok) throw new Error(j.error || 'structure failed');
      // Merge structure result back into editor project — preserve locked
      // slides AND user-set identity (churchName/badge/colors). The Gemini
      // structure call returns its own guesses for churchName/slogan/colors
      // but those are derived from the script and must NEVER overwrite values
      // the user has already pinned in the top bar / 📌 badge panel.
      const generated = (j.slides || []).map((s: any) => ({
        id: crypto.randomUUID(),
        ...s,
        durationSec: s.durationSec ?? 6,
      }));
      // Compute synchronously so the chained pipeline below sees the real
      // slide list (React's setProject updater isn't guaranteed to run before
      // we hit the next fetch — when it ran lazily we sent slides=[] to the
      // photo API and got "slides required").
      const intros = project.slides.filter((s) => s.locked === 'intro');
      const outros = project.slides.filter((s) => s.locked === 'outro');
      const pins = project.slides.filter((s) => s.locked === 'pinned');
      let mergedSlides: ChurchAdSlide[] = [...intros, ...generated, ...pins, ...outros];
      // Re-stamp churchName on every generated cover slide so a stray Gemini
      // guess doesn't slip in.
      for (const slide of mergedSlides) {
        if (slide.type === 'cover' && project.churchName && !slide.locked) {
          slide.heading = project.churchName;
        }
      }
      setProject((p) => ({
        ...p,
        // Title fall-through is OK (user-typed title or generated)
        title: p.title || j.title,
        // ── PINNED IDENTITY — never overwrite from Gemini ──
        churchName: p.churchName,
        slogan: p.slogan,
        accentColor: p.accentColor,
        backgroundColor: p.backgroundColor,
        badge: p.badge,
        // BGM hints are safe to refresh from Gemini
        bgmMood: j.bgmMood || p.bgmMood,
        musicSearchQuery: j.musicSearchQuery || p.musicSearchQuery,
        musicGenPrompt: j.musicGenPrompt || p.musicGenPrompt,
        slides: mergedSlides,
      }));
      setSelected(0);
      setShowSourcePanel(false);

      // Chained auto-pipeline: photos → TTS+BGM. Each step is best-effort
      // (the user can still ship without them) but failures must surface so
      // they don't silently degrade the project.
      const partialFailures: string[] = [];
      if (opts.autoPipeline) {
        // ── Step 2a: distribute user-uploaded media to slides first ────
        // The user's own photos always win over stock results. We assign in
        // upload order, skipping locked slides (whose media the user already
        // pinned). Remaining slides will be filled by auto-photos.
        if (sourceMedia.length > 0) {
          const queue = [...sourceMedia];
          const updated = mergedSlides.map((s) => {
            if (queue.length === 0) return s;
            if (s.mediaUrl || s.mediaDataUri) return s; // respect existing
            // gallery slides take multiple at once
            if (s.type === 'gallery') {
              const take = queue.splice(0, Math.min(6, queue.length));
              return { ...s, galleryUrls: take.map((m) => m.url) };
            }
            const m = queue.shift()!;
            return {
              ...s,
              mediaUrl: m.url,
              mediaType: m.mediaType,
              mediaDataUri: undefined,
            };
          });
          mergedSlides = applyEntryEffectVariety(updated);
          setProject((p) => ({ ...p, slides: mergedSlides }));
        }

        // ── Step 2b: backfill remaining empty slides with stock photos ──
        stopProgress();
        stopProgress = driveProgress(
          sourceMedia.length > 0
            ? '② 사용자 미디어 배치 + 부족분 스톡 검색'
            : '② 무료 스톡 사진 검색',
          mergedSlides.length * 4000,
          '#5a8dee'
        );
        try {
          setBusy(
            sourceMedia.length > 0
              ? '② 사용자 미디어 배치 후 부족분 스톡 검색 중…'
              : '② 무료 스톡 사진 자동 채우는 중…'
          );
          const photoRes = await fetch('/api/church-ad/auto-photos', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ slides: mergedSlides, refreshQueries: true, overwrite: false }),
          });
          const photoJ = await photoRes.json();
          if (!photoRes.ok) {
            throw new Error(photoJ.error || '사진 검색 실패');
          }
          if (photoJ.slides) {
            const withPhotos: ChurchAdSlide[] = photoJ.slides.map((s: any, i: number) => ({
              ...mergedSlides[i],
              ...s,
              id: mergedSlides[i]?.id ?? crypto.randomUUID(),
            }));
            mergedSlides = applyEntryEffectVariety(withPhotos);
            setProject((p) => ({ ...p, slides: mergedSlides }));
          }
        } catch (e: any) {
          partialFailures.push(`사진 자동 채우기 실패: ${e?.message ?? e}`);
        }

        stopProgress();
        stopProgress = driveProgress(
          '③ TTS · BGM 합성',
          mergedSlides.length * 8000 + 12000,
          '#a872d4'
        );
        try {
          setBusy('③ TTS 음성 + BGM 합성 중… (40초~2분)');
          const synRes = await fetch('/api/church-ad/synthesize', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              slides: mergedSlides,
              bgmMood: j.bgmMood,
              musicSearchQuery: j.musicSearchQuery,
              musicGenPrompt: j.musicGenPrompt,
              audioMode: project.audioMode ?? 'voice-bgm',
              voiceId: project.voiceId,
            }),
          });
          const synJ = await synRes.json();
          if (!synRes.ok) {
            throw new Error(synJ.error || 'TTS+BGM 합성 실패');
          }
          setProject((p) => ({
            ...p,
            audioUrl: synJ.audioUrl,
            audioDataUri: undefined,
            audioDurationSec: synJ.audioDurationSec,
            sceneDurationsSec: synJ.sceneDurationsSec,
            bgmUrl: synJ.bgm?.url,
            bgmDataUri: undefined,
            bgmTrackDurationSec: synJ.bgm?.trackDurationSec,
            bgmVolume: synJ.bgm?.volume ?? 0.1,
            slides: p.slides.map((s, i) => ({
              ...s,
              durationSec: synJ.sceneDurationsSec?.[i] ?? s.durationSec,
            })),
          }));
        } catch (e: any) {
          partialFailures.push(`음성/BGM 생성 실패: ${e?.message ?? e}`);
        }
      }
      if (partialFailures.length > 0) {
        setErr(partialFailures.join(' · '));
      }
    } catch (e: any) {
      setErr(e.message);
    } finally {
      stopProgress();
      setBusy(null);
    }
  };

  const uploadSourceMedia = async (files: FileList | File[]) => {
    const arr = Array.from(files);
    if (arr.length === 0) return;
    setErr(null);
    setBusy(`사진/영상 업로드 중… (${arr.length}개)`);
    try {
      const fd = new FormData();
      for (const f of arr) fd.append('files', f);
      const res = await fetch('/api/church-ad/upload-batch', { method: 'POST', body: fd });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error || 'upload failed');
      setSourceMedia((prev) => [
        ...prev,
        ...(j.files || []).map((m: any) => ({
          url: m.url,
          mediaType: m.mediaType,
          filename: m.filename,
        })),
      ]);
      if (j.errors?.length) {
        setErr(
          `일부 실패: ${(j.errors as any[])
            .map((e) => `${e.filename}(${e.error})`)
            .join(', ')}`
        );
      }
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setBusy(null);
    }
  };

  const autoFillPhotos = async () => {
    setPhotoBusy('스톡 사진 자동 채우는 중…');
    setErr(null);
    // Photo fetch is roughly 4s per slide.
    const stop = driveProgress('🖼 무료 사진 검색', project.slides.length * 4000, '#5a8dee');
    try {
      const res = await fetch('/api/church-ad/auto-photos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slides: project.slides,
          refreshQueries: true,
          overwrite: false,
        }),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error || 'auto-photos failed');
      setProject((p) => ({
        ...p,
        slides: applyEntryEffectVariety(
          j.slides.map((s: any, i: number) => ({
            ...p.slides[i],
            ...s,
            id: p.slides[i]?.id ?? crypto.randomUUID(),
          }))
        ),
      }));
    } catch (e: any) {
      setErr(e.message);
    } finally {
      stop();
      setPhotoBusy(null);
    }
  };

  const synthesizeAudio = async () => {
    const mode = project.audioMode ?? 'voice-bgm';
    if (mode === 'silent') {
      // Nothing to synthesize — just clear any prior audio so preview is silent.
      clearAudio();
      return;
    }
    if (mode === 'video-audio') {
      // Video audio is extracted during render — no separate synthesis needed.
      clearAudio();
      setSynthBusy(null);
      return;
    }
    const label =
      mode === 'voice-bgm'
        ? 'TTS 음성 + BGM 생성 중…'
        : mode === 'voice-only'
        ? 'TTS 음성 합성 중…'
        : 'BGM 검색·생성 중…';
    setSynthBusy(label);
    setErr(null);
    const expected =
      mode === 'voice-bgm'
        ? project.slides.length * 8000 + 12000
        : mode === 'voice-only'
        ? project.slides.length * 8000
        : 12000;
    const stop = driveProgress(`🔊 ${label}`, expected, '#a872d4');
    try {
      const res = await fetch('/api/church-ad/synthesize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slides: project.slides,
          bgmMood: project.bgmMood,
          musicSearchQuery: project.musicSearchQuery,
          musicGenPrompt: project.musicGenPrompt,
          audioMode: mode,
          voiceId: project.voiceId,
        }),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error || 'synthesize failed');
      setProject((p) => ({
        ...p,
        audioUrl: j.audioUrl,
        audioDataUri: undefined,
        audioDurationSec: j.audioDurationSec,
        sceneDurationsSec: j.sceneDurationsSec,
        bgmUrl: j.bgm?.url,
        bgmDataUri: undefined,
        bgmTrackDurationSec: j.bgm?.trackDurationSec,
        bgmVolume: j.bgm?.volume ?? 0.1,
        // Reflect TTS-derived durations onto each slide so timeline + render agree.
        slides: p.slides.map((s, i) => ({
          ...s,
          durationSec: j.sceneDurationsSec?.[i] ?? s.durationSec,
        })),
      }));
    } catch (e: any) {
      setErr(e.message);
    } finally {
      stop();
      setSynthBusy(null);
    }
  };

  const clearAudio = () => {
    setProject((p) => ({
      ...p,
      audioUrl: undefined,
      audioDataUri: undefined,
      audioDurationSec: undefined,
      sceneDurationsSec: undefined,
      bgmUrl: undefined,
      bgmDataUri: undefined,
      bgmTrackDurationSec: undefined,
    }));
  };

  const renderVideo = async () => {
    setBusy('렌더 준비 중…');
    setErr(null);
    let currentProject = project;
    try {
      const mode = project.audioMode ?? 'voice-bgm';
      const needsAudio = mode !== 'silent' && mode !== 'video-audio';
      const hasAudio = !!(project.audioUrl || project.audioDataUri || project.bgmUrl || project.bgmDataUri);

      // Auto-synthesize audio if needed but not yet done.
      if (needsAudio && !hasAudio) {
        const stop = driveProgress('🎙 음성·BGM 자동 합성 중…', project.slides.length * 8000 + 12000, '#a872d4');
        try {
          setBusy('🎙 음성·BGM 자동 합성 중…');
          const synRes = await fetch('/api/church-ad/synthesize', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              slides: project.slides,
              bgmMood: project.bgmMood,
              musicSearchQuery: project.musicSearchQuery,
              musicGenPrompt: project.musicGenPrompt,
              audioMode: mode,
              voiceId: project.voiceId,
            }),
          });
          const synJ = await synRes.json();
          if (synRes.ok && synJ.audioUrl) {
            const patch = {
              audioUrl: synJ.audioUrl,
              audioDataUri: undefined as undefined,
              audioDurationSec: synJ.audioDurationSec,
              sceneDurationsSec: synJ.sceneDurationsSec,
              bgmUrl: synJ.bgm?.url,
              bgmDataUri: undefined as undefined,
              bgmTrackDurationSec: synJ.bgm?.trackDurationSec,
              bgmVolume: synJ.bgm?.volume ?? 0.1,
            };
            setProject((p) => ({
              ...p,
              ...patch,
              slides: p.slides.map((s, i) => ({
                ...s,
                durationSec: synJ.sceneDurationsSec?.[i] ?? s.durationSec,
              })),
            }));
            currentProject = { ...project, ...patch };
          }
        } catch {
          // Audio synthesis failed — render will synthesize TTS itself
        } finally {
          stop();
        }
      }

      setBusy('🎬 렌더 작업 시작…');
      const res = await fetch('/api/church-ad/render', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ structure: currentProject, audioMode: mode }),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error || 'render failed');
      setRenderJob({ id: j.jobId, status: 'pending', progress: 0, step: '대기 중' });
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setBusy(null);
    }
  };

  const totalSec = useMemo(
    () => project.slides.reduce((a, s) => a + (s.durationSec ?? 6), 0),
    [project.slides]
  );

  if (mode === 'auto') {
    return (
      <AutoMode
        project={project}
        setProject={setProject}
        selected={selected}
        setSelected={setSelected}
        jumpKey={jumpKey}
        bumpJumpKey={() => setJumpKey((k) => k + 1)}
        text={text}
        setText={setText}
        sourceMedia={sourceMedia}
        setSourceMedia={setSourceMedia}
        busy={busy}
        err={err}
        progress={progress}
        renderJob={renderJob}
        uploadSourceMedia={uploadSourceMedia}
        generateFromText={() => generateFromText({ autoPipeline: true })}
        renderVideo={renderVideo}
        onSwitchToPro={() => setMode('pro')}
      />
    );
  }

  // GraceEdit color tokens (Pro mode)
  const GE = {
    primary: '#005863',
    primaryContainer: '#007280',
    bg: '#f8f9fa',
    surface: '#ffffff',
    containerLow: '#f3f4f5',
    container: '#edeeef',
    containerHigh: '#e7e8e9',
    containerHighest: '#e1e3e4',
    onSurface: '#191c1d',
    onVariant: '#3e484b',
    outline: '#6e797b',
    outlineVariant: '#bec8cb',
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: GE.bg,
        color: GE.onSurface,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* ── Top bar: 2-row layout ── */}
      <div style={{ background: GE.surface, borderBottom: `1px solid ${GE.containerHighest}`, boxShadow: '0 1px 3px rgba(0,0,0,0.06)', flexShrink: 0 }}>

        {/* Row 1 — Logo · Project info · Nav actions */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 16px', height: 52, gap: 12 }}>
          {/* Left: brand + project name/title */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
            <span style={{ fontFamily: 'Hanken Grotesk, sans-serif', fontWeight: 700, fontSize: 18, color: GE.primary, flexShrink: 0 }}>GraceEdit</span>
            <div style={{ width: 1, height: 18, background: GE.containerHighest, flexShrink: 0 }} />
            <input
              value={project.churchName}
              onChange={(e) => setProject((p) => ({ ...p, churchName: e.target.value }))}
              title="교회 이름"
              style={{ background: 'transparent', border: 'none', color: GE.onSurface, fontSize: 14, fontWeight: 700, outline: 'none', minWidth: 70, maxWidth: 140 }}
            />
            <div style={{ width: 1, height: 14, background: GE.outlineVariant, flexShrink: 0 }} />
            <input
              value={project.title}
              onChange={(e) => setProject((p) => ({ ...p, title: e.target.value }))}
              placeholder="영상 제목"
              title="영상 제목"
              style={{ background: 'transparent', border: 'none', color: GE.onVariant, fontSize: 13, outline: 'none', minWidth: 100, maxWidth: 220 }}
            />
            <span style={{ color: GE.outline, fontSize: 11, background: GE.containerLow, padding: '2px 7px', borderRadius: 10, flexShrink: 0 }}>
              {totalSec.toFixed(1)}s
            </span>
          </div>

          {/* Right: Auto mode toggle · Settings · Render */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
            <button
              onClick={() => setMode('auto')}
              title="Auto 모드 — 간단한 3-step 흐름"
              style={{ background: 'transparent', border: `1px solid ${GE.outlineVariant}`, borderRadius: 6, padding: '5px 11px', color: GE.onVariant, fontSize: 12, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }}
            >
              ✨ Auto 모드
            </button>
            <Link href="/church-ad/settings" style={{ padding: '5px 11px', border: `1px solid ${GE.outlineVariant}`, borderRadius: 6, fontSize: 12, color: GE.onVariant, textDecoration: 'none', fontWeight: 500 }}>
              ⚙ 설정
            </Link>
            <button
              onClick={renderVideo}
              disabled={!!busy || (!!renderJob && renderJob.status !== 'ready' && renderJob.status !== 'failed')}
              style={{ background: GE.primaryContainer, color: '#fff', border: 'none', borderRadius: 6, padding: '7px 16px', fontSize: 13, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' }}
            >
              🎬 영상 렌더
            </button>
          </div>
        </div>

        {/* Row 2 — Action toolbar */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '4px 16px', minHeight: 40, gap: 8, background: GE.containerLow, borderTop: `1px solid ${GE.containerHighest}`, overflow: 'visible', flexWrap: 'wrap' }}>
          {/* Left cluster: content generation */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <button onClick={() => { setShowBundlePanel((v) => !v); setShowSourcePanel(false); }} style={toolBtn(showBundlePanel, GE)}>
              📸 사진으로
            </button>
            <button onClick={() => { setShowSourcePanel((v) => !v); setShowBundlePanel(false); }} style={toolBtn(showSourcePanel, GE)}>
              📝 글로
            </button>
            <button onClick={autoFillPhotos} disabled={!!photoBusy} style={toolBtn(false, GE)} title="이미지가 비어 있는 슬라이드에 무료 스톡 사진을 채웁니다">
              {photoBusy ? '⏳…' : '🖼 자동 사진'}
            </button>
            <div style={{ width: 1, height: 20, background: GE.outlineVariant }} />
            <ColorField label="강조" value={project.accentColor} onChange={(v) => setProject((p) => ({ ...p, accentColor: v }))} />
            <ColorField label="배경" value={project.backgroundColor} onChange={(v) => setProject((p) => ({ ...p, backgroundColor: v }))} />
            <button onClick={() => setShowStylePicker((v) => !v)} style={toolBtn(showStylePicker, GE)} title="시각 스타일 프리셋">
              🎨 {getPreset(project.stylePreset).label}
            </button>
            <div style={{ width: 1, height: 20, background: GE.outlineVariant }} />
            <button onClick={() => setShowBadgePanel((v) => !v)} style={toolBtn(showBadgePanel, GE)} title="우측 상단 고정 배지">
              📌 배지
            </button>
            <button
              onClick={() => { if (confirm('현재 작업을 모두 지우고 새로 시작할까요?')) { localStorage.removeItem(STORAGE_KEY); location.reload(); } }}
              style={toolBtn(false, GE)}
              title="저장된 프로젝트를 비우고 새로 시작"
            >
              ⟲ 초기화
            </button>
          </div>

          {/* Right cluster: audio */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
            <select
              value={project.audioMode ?? 'voice-bgm'}
              onChange={(e) => setProject((p) => ({ ...p, audioMode: e.target.value as any }))}
              style={{ background: GE.surface, color: GE.onSurface, border: `1px solid ${GE.outlineVariant}`, borderRadius: 6, padding: '4px 7px', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}
              title="음성 / 음악 합성 모드"
            >
              <option value="voice-bgm">🎙 음성+BGM</option>
              <option value="voice-only">🎙 음성만</option>
              <option value="bgm-only">🎵 BGM만</option>
              <option value="video-audio">🎬 영상 원본 음성</option>
              <option value="silent">🔇 무음</option>
            </select>
            <button
              onClick={synthesizeAudio}
              disabled={!!synthBusy || project.audioMode === 'silent'}
              style={toolBtn(false, GE, project.audioUrl || project.audioDataUri ? '#5cb85c' : '#a872d4')}
              title={project.audioMode === 'silent' ? '무음 모드' : '음성·BGM 합성'}
            >
              {synthBusy ? '⏳ 합성 중…'
                : project.audioMode === 'video-audio' ? '🎬 영상음성 (렌더 시 자동)'
                : project.audioMode === 'silent' ? '🔇 무음'
                : project.audioUrl || project.audioDataUri || project.bgmUrl || project.bgmDataUri ? '🔁 재합성'
                : project.audioMode === 'bgm-only' ? '🎵 BGM'
                : project.audioMode === 'voice-only' ? '🎙 음성'
                : '🔊 음성+BGM'}
            </button>
            {(project.audioUrl || project.audioDataUri) && (
              <button onClick={clearAudio} disabled={!!synthBusy} style={toolBtn(false, GE)} title="음성·BGM 제거">
                ✕ 음성 제거
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Style preset drawer */}
      {showStylePicker && (
        <div
          style={{
            background: GE.containerLow,
            borderBottom: `1px solid ${GE.containerHighest}`,
            padding: '12px 16px',
            display: 'flex',
            flexDirection: 'column',
            gap: 10,
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <div>
              <div
                style={{
                  color: project.accentColor,
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                }}
              >
                🎨 시각 스타일 프리셋 (쇼폼)
              </div>
              <div style={{ color: GE.onVariant, fontSize: 12, marginTop: 4 }}>
                한 번 클릭하면 강조색·배경색·기본 등장 효과가 한꺼번에 적용됩니다.
                개별 슬라이드는 인스펙터에서 따로 덮어쓸 수 있어요.
              </div>
            </div>
            <button
              onClick={() => setShowStylePicker(false)}
              style={{ background: 'transparent', border: 0, color: '#7d8696', fontSize: 18, cursor: 'pointer' }}
            >
              ×
            </button>
          </div>
          <StylePresetPicker
            selected={project.stylePreset}
            onPick={(id) => {
              const def = getPreset(id);
              setProject((p) => ({
                ...p,
                stylePreset: id,
                accentColor: def.accentColor,
                backgroundColor: def.backgroundColor,
                // Apply default entry effect to slides that don't have a custom one.
                slides: p.slides.map((s) =>
                  s.entryEffect ? s : { ...s, entryEffect: def.defaultEntry }
                ),
              }));
            }}
          />
        </div>
      )}

      {/* Badge (pinned top-right) drawer */}
      {showBadgePanel && (
        <BadgePanel
          badge={project.badge}
          defaultText={project.churchName}
          accentColor={project.accentColor}
          onChange={(badge) => setProject((p) => ({ ...p, badge }))}
          onClose={() => setShowBadgePanel(false)}
        />
      )}

      {/* Bundle (multi-upload + auto-arrange) drawer */}
      {showBundlePanel && (
        <BundlePanel
          accentColor={project.accentColor}
          profile={{
            churchName: project.churchName,
            slogan: project.slogan,
            accentColor: project.accentColor,
            backgroundColor: project.backgroundColor,
          }}
          onClose={() => setShowBundlePanel(false)}
          onResult={(patch) => {
            setProject((p) => {
              const intros = p.slides.filter((s) => s.locked === 'intro');
              const outros = p.slides.filter((s) => s.locked === 'outro');
              const pins = p.slides.filter((s) => s.locked === 'pinned');
              const generated = (patch.slides ?? []).map((s) => {
                if (s.type === 'cover' && p.churchName && !s.locked) {
                  return { ...s, heading: p.churchName };
                }
                return s;
              });
              return {
                ...p,
                // Allow Gemini suggestions for non-identity fields…
                ...patch,
                // …but pin user identity & theme back on top.
                churchName: p.churchName,
                slogan: p.slogan,
                accentColor: p.accentColor,
                backgroundColor: p.backgroundColor,
                badge: p.badge,
                slides: [...intros, ...generated, ...pins, ...outros],
              } as ChurchAdProject;
            });
            setSelected(0);
          }}
        />
      )}

      {/* Optional source-text drawer */}
      {showSourcePanel && (
        <div
          style={{
            background: GE.containerLow,
            borderBottom: `1px solid ${GE.containerHighest}`,
            padding: '12px 16px',
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ color: project.accentColor, fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                📝 글로 영상 만들기
              </div>
              <div style={{ color: '#a4adba', fontSize: 12, marginTop: 4 }}>
                <strong style={{ color: '#fff' }}>거친 메모도 OK — AI가 다듬어 슬라이드로.</strong>{' '}
                사진은 무료 스톡에서 자동 검색·매칭.
              </div>
            </div>
            <button
              onClick={() => setShowSourcePanel(false)}
              style={{ background: 'transparent', border: 0, color: '#7d8696', fontSize: 18, cursor: 'pointer' }}
            >
              ×
            </button>
          </div>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="예: 우리교회는 강남에 위치한 공동체로, 매주 주일 오전 11시에 예배를 드립니다. 청년부는 금요일 저녁..."
            rows={5}
            style={{
              background: GE.surface,
              color: GE.onSurface,
              border: `1px solid ${GE.outlineVariant}`,
              borderRadius: 6,
              padding: 10,
              resize: 'vertical',
              fontFamily: 'inherit',
              fontSize: 13,
              width: '100%',
              boxSizing: 'border-box',
            }}
          />

          {/* ── Optional user-media upload (your photos first, stock fills the rest) ── */}
          <div
            onDragOver={(e) => {
              e.preventDefault();
              e.dataTransfer.dropEffect = 'copy';
            }}
            onDrop={(e) => {
              e.preventDefault();
              if (e.dataTransfer.files.length) uploadSourceMedia(e.dataTransfer.files);
            }}
            onClick={() => sourceFileRef.current?.click()}
            style={{
              border: `1.5px dashed ${project.accentColor}77`,
              borderRadius: 8,
              padding: 12,
              background: '#0f1216',
              cursor: 'pointer',
              color: '#c5cdd9',
              fontSize: 12,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 12,
            }}
          >
            <div>
              <span style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>
                📁 내 사진·영상 추가 (선택)
              </span>
              <span style={{ marginLeft: 10, color: '#7d8696', fontSize: 11 }}>
                · 업로드한 미디어를 먼저 슬라이드에 배치, 부족하면 무료 스톡으로 채움
              </span>
            </div>
            <span style={{ color: project.accentColor, fontWeight: 700, fontSize: 12 }}>
              {sourceMedia.length > 0 ? `${sourceMedia.length}개 추가됨` : '드롭 또는 클릭'}
            </span>
            <input
              ref={sourceFileRef}
              type="file"
              multiple
              accept="image/*,video/mp4,video/webm,video/quicktime"
              style={{ display: 'none' }}
              onChange={(e) => e.target.files && uploadSourceMedia(e.target.files)}
            />
          </div>

          {sourceMedia.length > 0 && (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(80px, 1fr))',
                gap: 6,
              }}
            >
              {sourceMedia.map((m, i) => (
                <div
                  key={m.url}
                  style={{
                    position: 'relative',
                    aspectRatio: '1 / 1',
                    borderRadius: 5,
                    overflow: 'hidden',
                    background: '#0a0d12',
                    border: '1px solid #232a36',
                  }}
                >
                  {m.mediaType === 'image' ? (
                    <img
                      src={m.url}
                      alt=""
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  ) : (
                    <video
                      src={m.url}
                      muted
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  )}
                  <div
                    style={{
                      position: 'absolute',
                      top: 2,
                      left: 4,
                      color: '#fff',
                      fontSize: 10,
                      fontWeight: 800,
                      textShadow: '0 1px 3px rgba(0,0,0,0.7)',
                    }}
                  >
                    {i + 1}
                  </div>
                  <button
                    onClick={() =>
                      setSourceMedia((prev) => prev.filter((_, j) => j !== i))
                    }
                    style={{
                      position: 'absolute',
                      top: 2,
                      right: 2,
                      background: 'rgba(0,0,0,0.6)',
                      color: '#fff',
                      border: 0,
                      borderRadius: '50%',
                      width: 18,
                      height: 18,
                      fontSize: 10,
                      cursor: 'pointer',
                      padding: 0,
                    }}
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}
          <label
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '8px 10px',
              background: verbatim ? `${project.accentColor}22` : '#0f1216',
              border: `1px solid ${verbatim ? project.accentColor : '#232a36'}`,
              borderRadius: 6,
              cursor: 'pointer',
              fontSize: 12,
              color: verbatim ? '#fff' : '#a4adba',
            }}
            title={
              verbatim
                ? 'TTS 나레이션이 입력 본문을 그대로 읽습니다. Gemini는 슬라이드 분할만 담당.'
                : 'Gemini가 본문을 자연스러운 구어체로 다시 풀어 씁니다.'
            }
          >
            <input
              type="checkbox"
              checked={verbatim}
              onChange={(e) => setVerbatim(e.target.checked)}
              style={{ accentColor: project.accentColor, transform: 'scale(1.1)' }}
            />
            <strong style={{ color: verbatim ? project.accentColor : '#dde3ec' }}>
              📋 원문 그대로 (TTS가 입력 본문을 글자 그대로 읽음)
            </strong>
            {verbatim ? (
              <span style={{ color: '#a4adba', fontSize: 11 }}>
                · 내레이션 = 입력 텍스트 100% 일치
              </span>
            ) : (
              <span style={{ color: '#a4adba', fontSize: 11 }}>
                · Gemini가 자연스러운 구어체로 재작성
              </span>
            )}
          </label>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
            <button
              onClick={() => generateFromText({ autoPipeline: true })}
              disabled={!!busy}
              style={btn(true, project.accentColor)}
              title="구조 생성 → 자동 사진 → TTS+BGM까지 한 번에"
            >
              {busy ?? '✨ 슬라이드 + 사진 + 음성 한 번에'}
            </button>
            <button
              onClick={() => generateFromText({ autoPipeline: false })}
              disabled={!!busy}
              style={btn(false, '#3a4252')}
              title="슬라이드 구조만 생성 (사진/음성은 직접)"
            >
              슬라이드만 생성
            </button>
            <span style={{ color: '#7d8696', fontSize: 11 }}>
              자동 모드: 구조화 → 무료 스톡 사진 → TTS · BGM (전체 1~3분 소요)
            </span>
          </div>
        </div>
      )}

      {/* Synthesis / photo / pipeline progress banner */}
      {progress && (
        <div
          style={{
            background: GE.containerLow,
            color: GE.onSurface,
            padding: '8px 16px',
            display: 'flex',
            alignItems: 'center',
            gap: 16,
            fontSize: 12,
            borderBottom: '1px solid #1c2028',
          }}
        >
          <span style={{ fontWeight: 700 }}>
            ⏳ {progress.label}
          </span>
          <div
            style={{
              flex: 1,
              height: 8,
              background: GE.containerHighest,
              borderRadius: 4,
              overflow: 'hidden',
              maxWidth: 480,
              border: `1px solid ${GE.outlineVariant}`,
            }}
          >
            <div
              style={{
                width: `${progress.pct}%`,
                height: '100%',
                background: GE.primaryContainer,
                transition: 'width 0.25s',
              }}
            />
          </div>
          <span
            style={{
              fontWeight: 800,
              color: progress.accent,
              minWidth: 36,
              textAlign: 'right',
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            {progress.pct}%
          </span>
        </div>
      )}

      {/* Render job status banner */}
      {renderJob && (
        <div
          style={{
            background:
              renderJob.status === 'failed'
                ? '#fef2f2'
                : renderJob.status === 'ready'
                ? '#f0fdf4'
                : GE.containerLow,
            color: GE.onSurface,
            padding: '8px 16px',
            display: 'flex',
            alignItems: 'center',
            gap: 16,
            fontSize: 12,
          }}
        >
          <span>
            {renderJob.status === 'ready' ? '✅' : renderJob.status === 'failed' ? '❌' : '⏳'} {renderJob.step}
          </span>
          {renderJob.status !== 'ready' && renderJob.status !== 'failed' && (
            <>
              <div
                style={{
                  flex: 1,
                  height: 8,
                  background: GE.containerHighest,
                  borderRadius: 4,
                  overflow: 'hidden',
                  maxWidth: 400,
                  border: `1px solid ${GE.outlineVariant}`,
                }}
              >
                <div
                  style={{
                    width: `${Math.round(renderJob.progress * 100)}%`,
                    height: '100%',
                    background: project.accentColor,
                    transition: 'width 0.3s',
                  }}
                />
              </div>
              <span
                style={{
                  fontWeight: 800,
                  color: project.accentColor,
                  minWidth: 36,
                  textAlign: 'right',
                  fontVariantNumeric: 'tabular-nums',
                }}
              >
                {Math.round(renderJob.progress * 100)}%
              </span>
            </>
          )}
          {renderJob.videoUrl && (
            <>
              <a
                href={renderJob.videoUrl}
                target="_blank"
                style={{ color: project.accentColor, fontWeight: 700 }}
                rel="noreferrer"
              >
                새 탭 열기
              </a>
              <a
                href={renderJob.videoUrl}
                download="church-ad.mp4"
                style={{ color: project.accentColor, fontWeight: 700 }}
              >
                다운로드
              </a>
            </>
          )}
          {renderJob.error && <span style={{ color: '#e87474' }}>{renderJob.error}</span>}
          <button
            onClick={() => setRenderJob(null)}
            style={{ background: 'transparent', border: 0, color: '#a4adba', fontSize: 14, cursor: 'pointer', marginLeft: 'auto' }}
          >
            ×
          </button>
        </div>
      )}

      {err && (
        <div style={{ background: '#fef2f2', color: '#dc2626', padding: '8px 16px', fontSize: 12, borderBottom: '1px solid #fca5a5' }}>
          ⚠ {err}
        </div>
      )}

      {/* Body — sidebar + (preview | inspector → timeline) */}
      <div style={{ flex: 1, minHeight: 0, display: 'flex' }}>
        {/* Left sidebar */}
        <aside style={{ width: 56, background: GE.surface, borderRight: `1px solid ${GE.containerHighest}`, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '12px 0', gap: 6, flexShrink: 0 }}>
          {[
            { icon: '📋', label: '콘텐츠', id: 'content' },
            { icon: '🎨', label: '템플릿', id: 'template' },
            { icon: '🎙', label: '음성', id: 'voice' },
            { icon: '🎵', label: '배경음악', id: 'bgm' },
            { icon: '📚', label: '레이어', id: 'layer' },
          ].map((item) => (
            <button
              key={item.id}
              title={item.label}
              onClick={() => {
                if (item.id === 'layer') setTimelineMode('layer');
                else if (item.id === 'content') setTimelineMode('slide');
                else if (item.id === 'template') setShowStylePicker((v) => !v);
                else if (item.id === 'bgm') setShowSourcePanel((v) => !v);
                else if (item.id === 'voice') synthesizeAudio();
              }}
              style={{
                width: 42,
                height: 42,
                borderRadius: 10,
                border: 'none',
                background: 'transparent',
                cursor: 'pointer',
                fontSize: 18,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderLeft: '3px solid transparent',
              }}
            >
              {item.icon}
            </button>
          ))}
          <div style={{ flex: 1 }} />
          <button
            onClick={() => setMode('auto')}
            title="설정 모드로"
            style={{ width: 42, height: 42, borderRadius: 10, border: 'none', background: 'transparent', cursor: 'pointer', fontSize: 18, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            ✨
          </button>
        </aside>

        <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
        <PanelGroup direction="vertical">
          <Panel defaultSize={70} minSize={40}>
            <PanelGroup direction="horizontal">
              <Panel defaultSize={70} minSize={40}>
                <PreviewPanel
                  project={project}
                  selectedSlide={selected}
                  jumpKey={jumpKey}
                  onSelectSlide={setSelected}
                />
              </Panel>
              <PanelResizeHandle style={{ width: 4, background: GE.containerHighest }} />
              <Panel defaultSize={30} minSize={22}>
                {selectedSlide && (
                  <Inspector
                    slide={selectedSlide}
                    accentColor={project.accentColor}
                    onChange={(patch) => updateSlide(selected, patch)}
                  />
                )}
              </Panel>
            </PanelGroup>
          </Panel>
          <PanelResizeHandle style={{ height: 4, background: GE.containerHighest }} />
          <Panel defaultSize={30} minSize={20}>
            <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              <div
                style={{
                  display: 'flex',
                  gap: 4,
                  padding: '6px 12px 0 12px',
                  background: GE.surface,
                  borderTop: `1px solid ${GE.containerHighest}`,
                }}
              >
                <button
                  onClick={() => setTimelineMode('slide')}
                  style={{
                    background: timelineMode === 'slide' ? GE.containerLow : 'transparent',
                    color: timelineMode === 'slide' ? GE.primary : GE.outline,
                    border: timelineMode === 'slide' ? `1px solid ${GE.outlineVariant}` : '1px solid transparent',
                    borderBottom: 'none',
                    borderRadius: '6px 6px 0 0',
                    padding: '5px 14px',
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  📋 슬라이드 뷰
                </button>
                <button
                  onClick={() => setTimelineMode('layer')}
                  style={{
                    background: timelineMode === 'layer' ? GE.containerLow : 'transparent',
                    color: timelineMode === 'layer' ? GE.primary : GE.outline,
                    border: timelineMode === 'layer' ? `1px solid ${GE.outlineVariant}` : '1px solid transparent',
                    borderBottom: 'none',
                    borderRadius: '6px 6px 0 0',
                    padding: '5px 14px',
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  📚 레이어 뷰
                </button>
              </div>
              <div style={{ flex: 1, minHeight: 0 }}>
                {timelineMode === 'slide' ? (
                  <Timeline
                    slides={project.slides}
                    selected={selected}
                    accentColor={project.accentColor}
                    onSelect={(i) => {
                      setSelected(i);
                      setJumpKey((k) => k + 1);
                    }}
                    onReorder={reorder}
                    onDuplicate={duplicate}
                    onDelete={deleteSlide}
                    onAdd={addSlide}
                    onDurationChange={(i, sec) => updateSlide(i, { durationSec: sec })}
                  />
                ) : (
                  <LayerTimeline
                    project={project}
                    selected={selected}
                    accentColor={project.accentColor}
                    onSelect={(i) => {
                      setSelected(i);
                      setJumpKey((k) => k + 1);
                    }}
                    onSlideChange={(i, patch) => updateSlide(i, patch)}
                  />
                )}
              </div>
            </div>
          </Panel>
        </PanelGroup>
        </div>
      </div>
    </div>
  );
};

// Compact toolbar button for Row 2
const toolBtn = (active: boolean, GE: Record<string, string>, accentColor?: string): React.CSSProperties => ({
  background: active ? `${accentColor ?? GE.primaryContainer}22` : GE.surface,
  color: active ? (accentColor ?? GE.primaryContainer) : GE.onVariant,
  border: `1px solid ${active ? `${accentColor ?? GE.primaryContainer}66` : GE.outlineVariant}`,
  borderRadius: 6,
  padding: '4px 10px',
  fontSize: 12,
  fontWeight: active ? 700 : 500,
  cursor: 'pointer',
  whiteSpace: 'nowrap' as const,
  transition: 'all 0.15s',
});

const btn = (primary: boolean, color: string): React.CSSProperties => ({
  background: primary ? color : 'transparent',
  color: primary ? '#fff' : '#3e484b',
  border: primary ? 0 : `1px solid #bec8cb`,
  borderRadius: 6,
  padding: '7px 12px',
  fontSize: 12,
  fontWeight: 600,
  cursor: 'pointer',
  whiteSpace: 'nowrap' as const,
});

const ColorField: React.FC<{ label: string; value: string; onChange: (v: string) => void }> = ({
  label,
  value,
  onChange,
}) => (
  <label
    style={{
      display: 'flex',
      alignItems: 'center',
      gap: 6,
      background: '#f3f4f5',
      border: '1px solid #bec8cb',
      borderRadius: 6,
      padding: '4px 8px',
      cursor: 'pointer',
    }}
  >
    <span style={{ color: '#3e484b', fontSize: 11 }}>{label}</span>
    <input
      type="color"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      style={{ width: 22, height: 22, border: 0, background: 'transparent', padding: 0, cursor: 'pointer' }}
    />
  </label>
);
