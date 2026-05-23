'use client';

import { useRef, useState } from 'react';
import type { ChurchAdProject, ChurchAdSlide } from './types';

export interface MediaLibraryItem {
  url: string;
  mediaType: 'image' | 'video';
  contentType: string;
  filename: string;
  size: number;
  caption?: string;
}

interface Props {
  accentColor: string;
  profile: {
    churchName: string;
    slogan?: string;
    accentColor: string;
    backgroundColor: string;
  };
  onResult: (project: Partial<ChurchAdProject> & { slides: ChurchAdSlide[] }) => void;
  onClose: () => void;
}

export const BundlePanel: React.FC<Props> = ({ accentColor, profile, onResult, onClose }) => {
  const fileRef = useRef<HTMLInputElement>(null);
  const [library, setLibrary] = useState<MediaLibraryItem[]>([]);
  const [script, setScript] = useState('');
  const [busy, setBusy] = useState<string | null>(null);
  const [verbatim, setVerbatim] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const handleFiles = async (files: FileList | File[]) => {
    const arr = Array.from(files);
    if (arr.length === 0) return;
    setBusy(`업로드 중… (${arr.length}개)`);
    setErr(null);
    try {
      const fd = new FormData();
      for (const f of arr) fd.append('files', f);
      const res = await fetch('/api/church-ad/upload-batch', { method: 'POST', body: fd });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error || 'upload failed');
      setLibrary((prev) => [...prev, ...j.files]);
      if (j.errors?.length) {
        setErr(`일부 파일 실패: ${j.errors.map((e: any) => `${e.filename}(${e.error})`).join(', ')}`);
      }
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setBusy(null);
    }
  };

  const removeFromLibrary = (i: number) =>
    setLibrary((prev) => prev.filter((_, j) => j !== i));

  const runAutoArrange = async () => {
    if (!script.trim()) {
      setErr('스크립트가 비어 있습니다');
      return;
    }
    if (library.length === 0) {
      setErr('미디어를 한 장 이상 업로드하세요');
      return;
    }
    setBusy('Gemini가 자동 배치 중… (캡션 → 매칭)');
    setErr(null);
    try {
      const res = await fetch('/api/church-ad/auto-arrange', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          script,
          library: library.map((m) => ({
            url: m.url,
            mediaType: m.mediaType,
            contentType: m.contentType,
            filename: m.filename,
          })),
          profile: {
            churchName: profile.churchName,
            slogan: profile.slogan,
            accentColor: profile.accentColor,
            backgroundColor: profile.backgroundColor,
          },
          titleHint: profile.churchName,
          verbatim,
        }),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error || 'auto-arrange failed');
      const slides: ChurchAdSlide[] = (j.slides || []).map((s: any) => ({
        id: crypto.randomUUID(),
        durationSec: s.durationSec ?? estimateSec(s.speakerNote),
        ...s,
      }));
      onResult({
        title: j.title,
        churchName: j.churchName,
        slogan: j.slogan,
        accentColor: j.accentColor,
        backgroundColor: j.backgroundColor,
        bgmMood: j.bgmMood,
        musicSearchQuery: j.musicSearchQuery,
        musicGenPrompt: j.musicGenPrompt,
        slides,
      });
      onClose();
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setBusy(null);
    }
  };

  return (
    <div
      style={{
        background: '#13171e',
        borderBottom: '1px solid #1c2028',
        padding: '14px 16px',
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
        maxHeight: '60vh',
        overflowY: 'auto',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ color: accentColor, fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
            📸 사진으로 영상 만들기
          </div>
          <div style={{ color: '#a4adba', fontSize: 12, marginTop: 4 }}>
            <strong style={{ color: '#fff' }}>사진을 올리면 AI가 보고 광고문까지 알아서 작성합니다.</strong>{' '}
            글은 안 써도 OK — 짧은 키워드만 있어도 충분.
          </div>
        </div>
        <button
          onClick={onClose}
          style={{ background: 'transparent', border: 0, color: '#7d8696', fontSize: 18, cursor: 'pointer' }}
        >
          ×
        </button>
      </div>

      {/* Drop zone */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          e.dataTransfer.dropEffect = 'copy';
        }}
        onDrop={(e) => {
          e.preventDefault();
          if (e.dataTransfer.files.length) handleFiles(e.dataTransfer.files);
        }}
        onClick={() => fileRef.current?.click()}
        style={{
          border: `1.5px dashed ${accentColor}88`,
          borderRadius: 10,
          padding: 18,
          textAlign: 'center',
          background: '#0f1216',
          cursor: 'pointer',
          color: '#c5cdd9',
          fontSize: 13,
        }}
      >
        <div style={{ fontSize: 16, fontWeight: 700, color: '#fff', marginBottom: 4 }}>
          📸 ① 사진·영상 한꺼번에 드롭 (최대 20개)
        </div>
        <div style={{ fontSize: 12, color: '#7d8696' }}>
          AI가 각 사진을 캡션으로 분석 → 분위기 파악 → 어울리는 광고문 + 슬라이드 자동 생성
        </div>
        <div style={{ fontSize: 11, color: '#5a6470', marginTop: 4 }}>
          jpg · png · webp · mp4 · webm (각 ≤ 80MB)
        </div>
        <input
          ref={fileRef}
          type="file"
          multiple
          accept="image/*,video/mp4,video/webm,video/quicktime"
          style={{ display: 'none' }}
          onChange={(e) => e.target.files && handleFiles(e.target.files)}
        />
      </div>

      {/* Library tray */}
      {library.length > 0 && (
        <div>
          <div style={{ color: '#a4adba', fontSize: 12, marginBottom: 6 }}>
            라이브러리 {library.length}개
          </div>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))',
              gap: 8,
            }}
          >
            {library.map((m, i) => (
              <div
                key={m.url}
                style={{
                  position: 'relative',
                  aspectRatio: '1 / 1',
                  borderRadius: 6,
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
                    bottom: 0,
                    left: 0,
                    right: 0,
                    padding: '2px 6px',
                    fontSize: 10,
                    background: 'rgba(0,0,0,0.6)',
                    color: '#fff',
                    overflow: 'hidden',
                    whiteSpace: 'nowrap',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {m.mediaType === 'video' ? '🎬 ' : ''}
                  {m.filename}
                </div>
                <button
                  onClick={() => removeFromLibrary(i)}
                  style={{
                    position: 'absolute',
                    top: 4,
                    right: 4,
                    background: 'rgba(0,0,0,0.6)',
                    color: '#fff',
                    border: 0,
                    borderRadius: '50%',
                    width: 20,
                    height: 20,
                    fontSize: 12,
                    cursor: 'pointer',
                  }}
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Script — OPTIONAL hint */}
      <div>
        <div style={{ color: '#7d8696', fontSize: 11, fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase', marginBottom: 4 }}>
          ② 메모 또는 키워드{' '}
          <span style={{ color: accentColor, textTransform: 'none', letterSpacing: 0 }}>
            (선택 — 비워둬도 OK)
          </span>
        </div>
        <textarea
          value={script}
          onChange={(e) => setScript(e.target.value)}
          placeholder="짧은 키워드도 됩니다 — 예: '봄 부활절 특별 안내', '새가족 환영회', '청년부 수련회'. 비워두면 사진만 보고 광고문 자동 작성."
          rows={3}
          style={{
            width: '100%',
            background: '#0f1216',
            color: '#fff',
            border: '1px solid #232a36',
            borderRadius: 6,
            padding: 10,
            fontFamily: 'inherit',
            fontSize: 13,
            resize: 'vertical',
            boxSizing: 'border-box',
          }}
        />
        <label
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            marginTop: 8,
            padding: '8px 10px',
            background: verbatim ? `${accentColor}22` : '#0f1216',
            border: `1px solid ${verbatim ? accentColor : '#232a36'}`,
            borderRadius: 6,
            cursor: 'pointer',
            fontSize: 12,
            color: verbatim ? '#fff' : '#a4adba',
          }}
        >
          <input
            type="checkbox"
            checked={verbatim}
            onChange={(e) => setVerbatim(e.target.checked)}
            style={{ accentColor: accentColor, transform: 'scale(1.1)' }}
          />
          <strong style={{ color: verbatim ? accentColor : '#dde3ec' }}>
            📋 원문 그대로 (TTS가 입력 본문을 글자 그대로 읽음)
          </strong>
        </label>
      </div>

      <div style={{ display: 'flex', gap: 10, alignItems: 'center', justifyContent: 'flex-end' }}>
        {busy && <span style={{ color: accentColor, fontSize: 12 }}>{busy}</span>}
        {err && !busy && <span style={{ color: '#e87474', fontSize: 12 }}>⚠ {err}</span>}
        <button
          onClick={runAutoArrange}
          disabled={!!busy || library.length === 0}
          style={{
            background: accentColor,
            color: '#0f1c2e',
            border: 0,
            borderRadius: 6,
            padding: '10px 18px',
            fontWeight: 800,
            fontSize: 13,
            cursor: busy ? 'wait' : 'pointer',
            opacity: !script.trim() || library.length === 0 ? 0.5 : 1,
          }}
        >
          📸 사진으로 영상 만들기
        </button>
      </div>
    </div>
  );
};

const estimateSec = (text: string | undefined): number => {
  // Korean: ~3.5 syllables per second of comfortable narration.
  const len = (text ?? '').length;
  return Math.max(3, Math.min(14, Math.round((len / 3.5) * 10) / 10));
};
