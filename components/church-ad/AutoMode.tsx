'use client';

import { useRef, useState, useEffect } from 'react';
import { PreviewPanel } from './PreviewPanel';
import type { ChurchAdProject, ChurchAdSlide } from './types';
import { SLIDE_TYPE_LABELS } from './types';
import { PresetEditorDrawer, createBlankPreset } from './PresetEditorDrawer';
import { loadPresets, type StylePresetConfig } from '@/lib/church/preset-store';

export interface AutoModeProps {
  project: ChurchAdProject;
  setProject: (updater: (p: ChurchAdProject) => ChurchAdProject) => void;
  selected: number;
  setSelected: (i: number) => void;
  jumpKey: number;
  bumpJumpKey: () => void;

  text: string;
  setText: (v: string) => void;
  sourceMedia: { url: string; mediaType: 'image' | 'video'; filename: string }[];
  setSourceMedia: React.Dispatch<
    React.SetStateAction<{ url: string; mediaType: 'image' | 'video'; filename: string }[]>
  >;

  busy: string | null;
  err: string | null;
  progress: { label: string; pct: number; accent: string } | null;
  renderJob: {
    id: string;
    status: string;
    progress: number;
    step: string;
    videoUrl?: string;
    error?: string;
  } | null;

  uploadSourceMedia: (files: FileList | File[]) => Promise<void>;
  generateFromText: () => Promise<void>;
  renderVideo: () => Promise<void>;
  onSwitchToPro: () => void;
}

// GraceEdit color tokens
const G = {
  primary: '#005863',
  primaryContainer: '#007280',
  onPrimary: '#ffffff',
  onPrimaryContainer: '#aef2ff',
  background: '#f8f9fa',
  surface: '#ffffff',
  surfaceContainerLowest: '#ffffff',
  surfaceContainerLow: '#f3f4f5',
  surfaceContainer: '#edeeef',
  surfaceContainerHigh: '#e7e8e9',
  surfaceContainerHighest: '#e1e3e4',
  onSurface: '#191c1d',
  onSurfaceVariant: '#3e484b',
  outline: '#6e797b',
  outlineVariant: '#bec8cb',
  secondary: '#006875',
};

const VOICES = [
  { id: 'ko-KR-Wavenet-A', label: '부드러운 여성 (지아)' },
  { id: 'ko-KR-Standard-A', label: '차분한 여성 (서연)' },
  { id: 'ko-KR-Standard-D', label: '신뢰감 있는 남성 (민수)' },
  { id: 'ko-KR-Standard-C', label: '밝고 활기찬 (동호)' },
  { id: 'ko-KR-Wavenet-D', label: '깊은 남성 (석준)' },
];

export const AutoMode: React.FC<AutoModeProps> = ({
  project,
  setProject,
  selected,
  setSelected,
  jumpKey,
  bumpJumpKey,
  text,
  setText,
  sourceMedia,
  setSourceMedia,
  busy,
  err,
  progress,
  renderJob,
  uploadSourceMedia,
  generateFromText,
  renderVideo,
  onSwitchToPro,
}) => {
  const mediaDropRef = useRef<HTMLInputElement | null>(null);
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [presets, setPresets] = useState<StylePresetConfig[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState(0);
  const [editingPreset, setEditingPreset] = useState<StylePresetConfig | null>(null);
  const [voice, setVoice] = useState(VOICES[0].id);

  useEffect(() => { setPresets(loadPresets()); }, []);

  const hasGenerated =
    project.slides.length > 0 && project.slides.some((s) => s.heading !== '교회 이름');

  const advanceTo = (s: 1 | 2 | 3) => setStep(s);

  const applyTemplate = (idx: number) => {
    setSelectedTemplate(idx);
    const t = presets[idx];
    if (!t) return;
    setProject((p) => ({
      ...p,
      accentColor: t.accentColor,
      backgroundColor: t.backgroundColor,
      slogan: t.slogan || p.slogan,
      fontFamily: t.fontFamily,
      bgOverlayOpacity: t.bgOverlayOpacity,
      voiceId: t.voiceId,
      badgeText: t.badgeText || p.badgeText,
    }));
    setVoice(t.voiceId);
  };

  const STEPS = [
    { n: 1, label: '기본 설정 및 업로드' },
    { n: 2, label: 'AI 생성' },
    { n: 3, label: '최종 편집' },
  ];

  return (
    <div style={{ position: 'fixed', inset: 0, background: G.background, color: G.onSurface, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
      {/* Preset editor drawer */}
      {editingPreset && (
        <PresetEditorDrawer
          preset={editingPreset}
          onClose={() => setEditingPreset(null)}
          onSave={(updated) => {
            setPresets((prev) => {
              const next = [...prev];
              const idx = next.findIndex((p) => p.id === updated.id);
              if (idx >= 0) next[idx] = updated;
              else next.push(updated);
              return next;
            });
            // Re-apply if this preset is currently selected
            const selIdx = presets.findIndex((p) => p.id === updated.id);
            if (selIdx === selectedTemplate) {
              setProject((p) => ({
                ...p,
                accentColor: updated.accentColor,
                backgroundColor: updated.backgroundColor,
                slogan: updated.slogan || p.slogan,
                fontFamily: updated.fontFamily,
                bgOverlayOpacity: updated.bgOverlayOpacity,
                voiceId: updated.voiceId,
                badgeText: updated.badgeText || p.badgeText,
              }));
              setVoice(updated.voiceId);
            }
            setEditingPreset(null);
          }}
          onDelete={(id) => {
            setPresets((prev) => prev.filter((p) => p.id !== id));
            if (selectedTemplate >= presets.length - 1) setSelectedTemplate(0);
          }}
        />
      )}
      {/* Top Nav */}
      <header
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 50,
          height: 64,
          background: G.surface,
          borderBottom: `1px solid ${G.surfaceContainerHighest}`,
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 40px',
          gap: 16,
          flexShrink: 0,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <span style={{ fontFamily: 'Hanken Grotesk, sans-serif', fontWeight: 700, fontSize: 20, color: G.primary }}>GraceEdit</span>
          <div style={{ width: 1, height: 24, background: G.surfaceContainerHighest }} />
          <span style={{ fontSize: 14, color: G.onSurfaceVariant }}>새 영상 프로젝트 만들기</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <input
            value={project.churchName}
            onChange={(e) => setProject((p) => ({ ...p, churchName: e.target.value }))}
            placeholder="교회 이름"
            style={{
              background: G.surfaceContainerLow,
              border: `1px solid ${G.outlineVariant}`,
              borderRadius: 8,
              padding: '6px 12px',
              fontSize: 14,
              color: G.onSurface,
              outline: 'none',
              width: 140,
            }}
          />
          <button
            onClick={onSwitchToPro}
            style={{
              padding: '6px 16px',
              border: `1px solid ${G.outlineVariant}`,
              borderRadius: 6,
              background: 'transparent',
              fontSize: 13,
              color: G.onSurface,
              cursor: 'pointer',
              fontWeight: 500,
            }}
          >
            저장
          </button>
          <button
            onClick={onSwitchToPro}
            style={{
              padding: '6px 16px',
              border: 'none',
              borderRadius: 6,
              background: G.primaryContainer,
              fontSize: 13,
              color: G.onPrimary,
              cursor: 'pointer',
              fontWeight: 600,
            }}
          >
            Pro 에디터
          </button>
        </div>
      </header>

      <div style={{ display: 'flex', flex: 1, minHeight: 0 }}>
        {/* Left Sidebar */}
        <aside
          style={{
            width: 64,
            background: G.surface,
            borderRight: `1px solid ${G.surfaceContainerHighest}`,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            padding: '16px 0',
            gap: 8,
            flexShrink: 0,
          }}
        >
          <SideIcon icon="✏️" label="편집" active />
          <SideIcon
            icon="🎨"
            label="스타일 편집"
            onClick={() => presets[selectedTemplate] && setEditingPreset(presets[selectedTemplate])}
          />
          <SideIcon
            icon="🖼️"
            label="미디어 업로드"
            onClick={() => mediaDropRef.current?.click()}
          />
          <div style={{ flex: 1 }} />
          <SideIcon icon="❓" label="도움말" />
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: '50%',
              background: `${G.primary}1a`,
              border: `1px solid ${G.primary}33`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 11,
              fontWeight: 700,
              color: G.primary,
            }}
          >
            JD
          </div>
        </aside>

        {/* Main content */}
        <main style={{ flex: 1, overflowY: 'auto', padding: '32px 40px 80px' }}>
          {/* Stepper */}
          <nav style={{ maxWidth: 700, margin: '0 auto 40px', position: 'relative' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'relative' }}>
              {/* connector line */}
              <div style={{ position: 'absolute', top: 20, left: '10%', right: '10%', height: 1, background: G.surfaceContainerHighest, zIndex: 0 }} />
              {STEPS.map(({ n, label }) => {
                const active = step === n;
                const done = step > n;
                return (
                  <div
                    key={n}
                    style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 1, background: G.background, padding: '0 12px', cursor: 'pointer' }}
                    onClick={() => { if (n === 1 || hasGenerated) advanceTo(n as 1|2|3); }}
                  >
                    <div
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: '50%',
                        background: active ? G.primaryContainer : done ? G.primary : G.surfaceContainerHighest,
                        color: active || done ? G.onPrimary : G.onSurfaceVariant,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 700,
                        fontSize: 15,
                        marginBottom: 6,
                        border: active || done ? 'none' : `1px solid ${G.outlineVariant}`,
                        transition: 'background 0.2s',
                      }}
                    >
                      {done ? '✓' : n}
                    </div>
                    <span style={{ fontSize: 13, fontWeight: active ? 700 : 400, color: active ? G.primary : G.onSurfaceVariant, whiteSpace: 'nowrap' }}>
                      {n}. {label}
                    </span>
                  </div>
                );
              })}
            </div>
          </nav>

          {/* Error / Progress */}
          {err && (
            <div style={{ maxWidth: 1000, margin: '0 auto 16px', padding: '10px 14px', background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 8, color: '#dc2626', fontSize: 13 }}>
              ⚠ {err}
            </div>
          )}
          {progress && (
            <div style={{ maxWidth: 1000, margin: '0 auto 16px' }}>
              <div style={{ fontSize: 12, color: G.onSurfaceVariant, marginBottom: 4 }}>{progress.label} · {progress.pct}%</div>
              <div style={{ height: 4, background: G.surfaceContainerHighest, borderRadius: 2, overflow: 'hidden' }}>
                <div style={{ width: `${progress.pct}%`, height: '100%', background: G.primaryContainer, transition: 'width 0.25s' }} />
              </div>
            </div>
          )}

          {step === 1 && (
            <Step1
              project={project}
              setProject={setProject}
              text={text}
              setText={setText}
              sourceMedia={sourceMedia}
              setSourceMedia={setSourceMedia}
              uploadSourceMedia={uploadSourceMedia}
              generateFromText={async () => { await generateFromText(); advanceTo(2); }}
              busy={busy}
              mediaDropRef={mediaDropRef}
              presets={presets}
              selectedTemplate={selectedTemplate}
              applyTemplate={applyTemplate}
              onEditPreset={(preset) => setEditingPreset(preset)}
              onAddPreset={() => setEditingPreset(createBlankPreset())}
              voice={voice}
              setVoice={setVoice}
            />
          )}
          {step === 2 && (
            <Step2
              project={project}
              setProject={setProject}
              selected={selected}
              setSelected={setSelected}
              jumpKey={jumpKey}
              bumpJumpKey={bumpJumpKey}
              onNext={() => advanceTo(3)}
              onBack={() => advanceTo(1)}
              onSwitchToPro={onSwitchToPro}
            />
          )}
          {step === 3 && (
            <Step3
              project={project}
              renderJob={renderJob}
              renderVideo={renderVideo}
              busy={busy}
              onBack={() => advanceTo(2)}
              onSwitchToPro={onSwitchToPro}
            />
          )}
        </main>
      </div>
    </div>
  );
};

// ── Sidebar icon button ──────────────────────────────────────────────
const SideIcon: React.FC<{ icon: string; label: string; active?: boolean; onClick?: () => void }> = ({ icon, label, active, onClick }) => (
  <button
    title={label}
    onClick={onClick}
    style={{
      width: 44,
      height: 44,
      borderRadius: 10,
      border: active ? `1px solid ${G.primaryContainer}` : 'none',
      background: active ? `${G.primaryContainer}1a` : 'transparent',
      cursor: 'pointer',
      fontSize: 20,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      borderLeft: active ? `3px solid ${G.primaryContainer}` : '3px solid transparent',
    }}
  >
    {icon}
  </button>
);

// ── Step 1: 기본 설정 및 업로드 ──────────────────────────────────────
const Step1: React.FC<{
  project: ChurchAdProject;
  setProject: (u: (p: ChurchAdProject) => ChurchAdProject) => void;
  text: string;
  setText: (v: string) => void;
  sourceMedia: { url: string; mediaType: 'image' | 'video'; filename: string }[];
  setSourceMedia: React.Dispatch<React.SetStateAction<{ url: string; mediaType: 'image' | 'video'; filename: string }[]>>;
  uploadSourceMedia: (files: FileList | File[]) => Promise<void>;
  generateFromText: () => Promise<void>;
  busy: string | null;
  mediaDropRef: React.MutableRefObject<HTMLInputElement | null>;
  presets: StylePresetConfig[];
  selectedTemplate: number;
  applyTemplate: (idx: number) => void;
  onEditPreset: (preset: StylePresetConfig) => void;
  onAddPreset: () => void;
  voice: string;
  setVoice: (v: string) => void;
}> = ({ project, setProject, text, setText, sourceMedia, setSourceMedia, uploadSourceMedia, generateFromText, busy, mediaDropRef, presets, selectedTemplate, applyTemplate, onEditPreset, onAddPreset, voice, setVoice }) => {
  const [dragging, setDragging] = useState(false);

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const files = Array.from(e.dataTransfer.files).filter(f =>
      f.type.startsWith('image/') || f.type.startsWith('video/')
    );
    if (files.length) await uploadSourceMedia(files);
  };

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* ── 상단 컴팩트 설정 바 ── */}
      <section style={card}>
        <div style={{ background: 'linear-gradient(90deg, #007280 0%, #00a0b0 100%)', padding: '5px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderRadius: '8px 8px 0 0', margin: '-20px -20px 16px' }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: '#fff', letterSpacing: '0.06em', textTransform: 'uppercase' }}>✓ 브랜드 설정 적용됨</span>
          <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.8)' }}>메인 컬러: {project.accentColor}</span>
        </div>

        {/* 템플릿 + 컬러 + 성우 — 한 줄 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
          {/* 템플릿 목록 + 편집 + 추가 */}
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
            {presets.map((t, i) => (
              <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: 0 }}>
                <button
                  onClick={() => applyTemplate(i)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    padding: '5px 10px',
                    border: `1.5px solid ${selectedTemplate === i ? G.primaryContainer : G.outlineVariant}`,
                    borderRight: 'none',
                    borderRadius: '8px 0 0 8px',
                    background: selectedTemplate === i ? `${G.primaryContainer}0d` : G.surface,
                    cursor: 'pointer', fontSize: 13,
                    fontWeight: selectedTemplate === i ? 700 : 500,
                    color: selectedTemplate === i ? G.primary : G.onSurface,
                    whiteSpace: 'nowrap', transition: 'all 0.15s',
                  }}
                >
                  <span>{t.icon}</span>
                  <span>{t.label}</span>
                </button>
                {/* Edit button */}
                <button
                  onClick={(e) => { e.stopPropagation(); onEditPreset(t); }}
                  title="스타일 편집"
                  style={{
                    padding: '5px 6px',
                    border: `1.5px solid ${selectedTemplate === i ? G.primaryContainer : G.outlineVariant}`,
                    borderRadius: '0 8px 8px 0',
                    background: selectedTemplate === i ? `${G.primaryContainer}0d` : G.surface,
                    cursor: 'pointer', fontSize: 11, color: G.onSurfaceVariant,
                    transition: 'all 0.15s',
                  }}
                >
                  ✎
                </button>
              </div>
            ))}
            {/* Add new preset */}
            <button
              onClick={onAddPreset}
              title="새 템플릿 추가"
              style={{ padding: '5px 10px', border: `1.5px dashed ${G.outlineVariant}`, borderRadius: 8, background: 'transparent', cursor: 'pointer', fontSize: 13, color: G.onSurfaceVariant, fontWeight: 500, display: 'flex', alignItems: 'center', gap: 4 }}
            >
              + 추가
            </button>
          </div>

          <div style={{ width: 1, height: 28, background: G.outlineVariant, flexShrink: 0 }} />

          {/* 포인트 컬러 */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 12, color: G.onSurfaceVariant, whiteSpace: 'nowrap' }}>컬러</span>
            {[G.primaryContainer, '#d4a657', G.secondary, '#7c3aed'].map((c, i) => (
              <button key={i} onClick={() => setProject((p) => ({ ...p, accentColor: c }))}
                style={{ width: 24, height: 24, borderRadius: '50%', background: c, border: project.accentColor === c ? `2px solid ${G.primary}` : `1px solid ${G.outlineVariant}`, cursor: 'pointer', outline: project.accentColor === c ? `2px solid ${G.primary}` : 'none', outlineOffset: 1 }}
              />
            ))}
            <input type="color" value={project.accentColor} onChange={(e) => setProject((p) => ({ ...p, accentColor: e.target.value }))}
              style={{ width: 24, height: 24, border: `1px solid ${G.outlineVariant}`, borderRadius: '50%', padding: 0, cursor: 'pointer' }} />
          </div>

          <div style={{ width: 1, height: 28, background: G.outlineVariant, flexShrink: 0 }} />

          {/* 성우 */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flex: 1, minWidth: 200 }}>
            <span style={{ fontSize: 12, color: G.onSurfaceVariant, whiteSpace: 'nowrap' }}>🎙 성우</span>
            <select value={voice} onChange={(e) => setVoice(e.target.value)}
              style={{ flex: 1, background: G.surface, border: `1px solid ${G.outlineVariant}`, borderRadius: 8, padding: '6px 10px', fontSize: 13, color: G.onSurface, outline: 'none' }}>
              {VOICES.map((v) => <option key={v.id} value={v.id}>{v.label}</option>)}
            </select>
          </div>

        </div>
      </section>

      {/* ── 메인: 스크립트 (전체 너비) ── */}
      <section style={{ ...card, display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
          <h2 style={{ ...sectionTitle, marginBottom: 0 }}>스크립트 작성</h2>
          <span style={{ fontSize: 12, color: G.onSurfaceVariant }}>💡 거친 메모도 OK — AI가 슬라이드로 자동 변환</span>
        </div>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="교회 소식, 설교 요약, 행사 안내문, 주보 내용 등을 자유롭게 입력하세요.&#10;&#10;예시) 오는 주일 오전 11시 예배에 여러분을 초대합니다. 말씀: 요한복음 15장 / 찬양팀 특별 찬양 / 교육부 여름 캠프 신청 (6월 15일까지)..."
          style={{
            width: '100%',
            background: G.surface,
            border: `1px solid ${G.outlineVariant}`,
            borderRadius: 10,
            padding: '16px 18px',
            fontSize: 15,
            color: G.onSurface,
            lineHeight: 1.8,
            resize: 'vertical',
            outline: 'none',
            fontFamily: 'inherit',
            boxSizing: 'border-box',
            minHeight: 'calc(100vh - 520px)',
          }}
        />
        {/* ── 대형 미디어 드롭존 ── */}
        <div
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          onClick={() => mediaDropRef.current?.click()}
          style={{
            border: `2px dashed ${dragging ? G.primaryContainer : G.outlineVariant}`,
            borderRadius: 12,
            background: dragging ? `${G.primaryContainer}0f` : G.surfaceContainerLow,
            padding: sourceMedia.length > 0 ? '16px' : '36px 20px',
            cursor: 'pointer',
            transition: 'all 0.2s',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 10,
          }}
        >
          {sourceMedia.length === 0 ? (
            <>
              <div style={{ fontSize: 36 }}>🖼️</div>
              <div style={{ fontSize: 15, fontWeight: 700, color: G.onSurface, textAlign: 'center' }}>
                사진·영상 파일을 여기에 끌어다 놓으세요
              </div>
              <div style={{ fontSize: 13, color: G.onSurfaceVariant, textAlign: 'center', lineHeight: 1.6 }}>
                또는 클릭해서 파일 선택 (JPG, PNG, MP4, WebM)<br />
                AI가 각 파일을 분석해 적절한 슬라이드에 자동 배치합니다
              </div>
            </>
          ) : (
            <div style={{ width: '100%' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: G.primary }}>
                  📂 {sourceMedia.length}개 파일 선택됨
                </span>
                <span style={{ fontSize: 12, color: G.onSurfaceVariant }}>클릭해서 추가</span>
              </div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {sourceMedia.map((m, i) => (
                  <div
                    key={m.url}
                    style={{ position: 'relative', width: 80, height: 80, borderRadius: 8, overflow: 'hidden', border: `1px solid ${G.outlineVariant}`, flexShrink: 0 }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    {m.mediaType === 'image'
                      ? <img src={m.url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      : <video src={m.url} muted style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
                    <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'rgba(0,0,0,0.5)', padding: '2px 4px' }}>
                      <div style={{ fontSize: 9, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.filename}</div>
                    </div>
                    <button
                      onClick={(e) => { e.stopPropagation(); setSourceMedia((prev) => prev.filter((_, j) => j !== i)); }}
                      style={{ position: 'absolute', top: 3, right: 3, background: 'rgba(0,0,0,0.7)', color: '#fff', border: 0, borderRadius: '50%', width: 18, height: 18, fontSize: 10, cursor: 'pointer', padding: 0, lineHeight: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    >✕</button>
                  </div>
                ))}
                {/* 추가 버튼 */}
                <div
                  style={{ width: 80, height: 80, borderRadius: 8, border: `2px dashed ${G.outlineVariant}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, color: G.onSurfaceVariant, flexShrink: 0, cursor: 'pointer' }}
                >+</div>
              </div>
            </div>
          )}
          <input ref={mediaDropRef} type="file" multiple accept="image/*,video/mp4,video/webm" style={{ display: 'none' }}
            onChange={(e) => e.target.files && uploadSourceMedia(e.target.files)} />
        </div>

        <button
          onClick={generateFromText}
          disabled={!text.trim() || !!busy}
          style={{
            width: '100%',
            padding: '16px 20px',
            background: !text.trim() || busy ? G.surfaceContainerHigh : G.primary,
            color: !text.trim() || busy ? G.onSurfaceVariant : G.onPrimary,
            border: 'none',
            borderRadius: 10,
            fontSize: 17,
            fontWeight: 700,
            cursor: !text.trim() || busy ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 10,
            transition: 'all 0.2s',
            fontFamily: 'Hanken Grotesk, sans-serif',
            letterSpacing: '-0.01em',
          }}
        >
          <span style={{ fontSize: 20 }}>{busy ? '⏳' : '✨'}</span>
          {busy ? busy : 'AI 영상 생성 시작하기'}
        </button>
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0 2px' }}>
          <span style={{ fontSize: 11, color: G.onSurfaceVariant }}>⏱ 예상 소요 시간: 1~2분</span>
          <span style={{ fontSize: 11, color: G.onSurfaceVariant }}>슬라이드 자동 구성 · 무료 스톡 사진 · TTS · BGM</span>
        </div>
      </section>
    </div>
  );
};

// ── Step 2: AI 생성 결과 미리보기 ──────────────────────────────────
const Step2: React.FC<{
  project: ChurchAdProject;
  setProject: (u: (p: ChurchAdProject) => ChurchAdProject) => void;
  selected: number;
  setSelected: (i: number) => void;
  jumpKey: number;
  bumpJumpKey: () => void;
  onNext: () => void;
  onBack: () => void;
  onSwitchToPro: () => void;
}> = ({ project, setProject, selected, setSelected, jumpKey, bumpJumpKey, onNext, onBack, onSwitchToPro }) => {
  const updateSlide = (i: number, patch: Partial<ChurchAdSlide>) => {
    setProject((p) => ({ ...p, slides: p.slides.map((s, j) => (j === i ? { ...s, ...patch } : s)) }));
  };
  const sel = project.slides[Math.min(selected, project.slides.length - 1)];

  return (
    <div style={{ maxWidth: 1000, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Preview */}
      <div style={{ aspectRatio: '16/9', background: '#000', borderRadius: 10, overflow: 'hidden', border: `3px solid ${G.primaryContainer}` }}>
        <PreviewPanel project={project} selectedSlide={selected} onSelectSlide={setSelected} jumpKey={jumpKey} />
      </div>

      {/* Slide strip */}
      <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4 }}>
        {project.slides.map((s, i) => (
          <button
            key={s.id ?? i}
            onClick={() => { setSelected(i); bumpJumpKey(); }}
            style={{
              flexShrink: 0,
              padding: '8px 12px',
              borderRadius: 8,
              border: `1.5px solid ${i === selected ? G.primaryContainer : G.outlineVariant}`,
              background: i === selected ? `${G.primaryContainer}15` : G.surface,
              color: i === selected ? G.primary : G.onSurfaceVariant,
              fontSize: 12,
              fontWeight: 600,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              minWidth: 70,
              textAlign: 'center',
            }}
          >
            <div style={{ fontSize: 10, opacity: 0.6, marginBottom: 2 }}>{i + 1}</div>
            <div>{SLIDE_TYPE_LABELS[s.type]}</div>
          </button>
        ))}
      </div>

      {/* Inline edit */}
      {sel && (
        <div style={{ ...card, display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: G.primaryContainer, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
            {SLIDE_TYPE_LABELS[sel.type]} 편집
          </div>
          <div>
            <div style={fieldLabel}>제목</div>
            <input value={sel.heading} onChange={(e) => updateSlide(selected, { heading: e.target.value })} style={inputStyle} />
          </div>
          {sel.subheading !== undefined && (
            <div>
              <div style={fieldLabel}>부제목</div>
              <input value={sel.subheading} onChange={(e) => updateSlide(selected, { subheading: e.target.value })} style={inputStyle} />
            </div>
          )}
          <div>
            <div style={fieldLabel}>내레이션 (TTS)</div>
            <textarea value={sel.speakerNote} onChange={(e) => updateSlide(selected, { speakerNote: e.target.value })} rows={3} style={{ ...inputStyle, resize: 'vertical', fontFamily: 'inherit' }} />
          </div>
          {sel.verse !== undefined && (
            <div>
              <div style={fieldLabel}>말씀</div>
              <textarea value={sel.verse} onChange={(e) => updateSlide(selected, { verse: e.target.value })} rows={2} style={{ ...inputStyle, resize: 'vertical', fontFamily: 'inherit' }} />
              <input value={sel.verseRef ?? ''} onChange={(e) => updateSlide(selected, { verseRef: e.target.value })} placeholder="출처 (요한복음 3:16)" style={{ ...inputStyle, marginTop: 6 }} />
            </div>
          )}
        </div>
      )}

      {/* Pro editor CTA */}
      <div style={{ background: `${G.primaryContainer}0d`, border: `1.5px solid ${G.primaryContainer}33`, borderRadius: 12, padding: '20px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
        <div>
          <div style={{ fontSize: 15, fontWeight: 700, color: G.onSurface, marginBottom: 4, fontFamily: 'Hanken Grotesk, sans-serif' }}>
            더 세밀하게 편집하고 싶으신가요?
          </div>
          <div style={{ fontSize: 13, color: G.onSurfaceVariant, lineHeight: 1.5 }}>
            슬라이드별 미디어 교체 · 레이아웃 변경 · 진입 효과 · 타임라인 재정렬
          </div>
        </div>
        <button
          onClick={onSwitchToPro}
          style={{
            flexShrink: 0,
            padding: '12px 24px',
            background: G.primaryContainer,
            color: '#fff',
            border: 'none',
            borderRadius: 10,
            fontSize: 14,
            fontWeight: 700,
            cursor: 'pointer',
            fontFamily: 'Hanken Grotesk, sans-serif',
            whiteSpace: 'nowrap',
            boxShadow: `0 4px 14px ${G.primaryContainer}40`,
          }}
        >
          Pro 에디터에서 편집 →
        </button>
      </div>

      <div style={{ display: 'flex', gap: 10 }}>
        <button onClick={onBack} style={secBtn}>← 되돌리기</button>
        <button onClick={onNext} style={{ ...priBtn, flex: 2 }}>영상 렌더하기 →</button>
      </div>
    </div>
  );
};

// ── Step 3: 렌더 ────────────────────────────────────────────────────
const Step3: React.FC<{
  project: ChurchAdProject;
  renderJob: { id: string; status: string; progress: number; step: string; videoUrl?: string; error?: string } | null;
  renderVideo: () => Promise<void>;
  busy: string | null;
  onBack: () => void;
  onSwitchToPro: () => void;
}> = ({ project, renderJob, renderVideo, busy, onBack, onSwitchToPro }) => {
  const ready = renderJob?.status === 'ready' && renderJob?.videoUrl;
  const rendering = renderJob && !ready && renderJob.status !== 'failed';
  const renderPct = Math.round((renderJob?.progress ?? 0) * 100);

  return (
    <div style={{ maxWidth: 600, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ ...card, textAlign: 'center', padding: '40px 32px' }}>
        <div style={{ fontSize: 56, marginBottom: 12 }}>{ready ? '🎉' : rendering ? '⏳' : '🎬'}</div>
        <div style={{ fontSize: 20, fontWeight: 700, color: G.onSurface, marginBottom: 6, fontFamily: 'Hanken Grotesk, sans-serif' }}>
          {ready ? '완성!' : rendering ? (renderJob?.step ?? '렌더 중…') : '렌더 준비 완료'}
        </div>
        <div style={{ fontSize: 13, color: G.onSurfaceVariant }}>
          {ready
            ? 'MP4 다운로드 또는 유튜브에 업로드하세요'
            : rendering
            ? `약 1~3분 소요 · ${renderPct}%`
            : `${project.slides.length}개 슬라이드 · ${project.slides.reduce((a, s) => a + (s.durationSec ?? 6), 0).toFixed(1)}초`}
        </div>

        {rendering && (
          <div style={{ marginTop: 16, height: 6, background: G.surfaceContainerHigh, borderRadius: 3, overflow: 'hidden' }}>
            <div style={{ width: `${renderPct}%`, height: '100%', background: G.primaryContainer, transition: 'width 0.3s' }} />
          </div>
        )}

        {renderJob?.status === 'failed' && (
          <div style={{ marginTop: 12, color: '#dc2626', fontSize: 12 }}>⚠ {renderJob.error || '렌더 실패'}</div>
        )}

        {ready && renderJob?.videoUrl && (
          <video src={renderJob.videoUrl} controls style={{ width: '100%', borderRadius: 8, marginTop: 16 }} />
        )}
      </div>

      {!renderJob && (
        <button onClick={renderVideo} disabled={!!busy} style={{ ...priBtn, opacity: busy ? 0.5 : 1, cursor: busy ? 'not-allowed' : 'pointer' }}>
          {busy ? `⏳ ${busy}` : '🎬 영상 렌더 시작'}
        </button>
      )}
      {ready && renderJob?.videoUrl && (
        <a href={renderJob.videoUrl} download style={{ ...priBtn, textDecoration: 'none', textAlign: 'center', display: 'block' }}>
          ⬇ MP4 다운로드
        </a>
      )}

      {/* Pro editor CTA */}
      <div style={{ background: `${G.primaryContainer}0d`, border: `1.5px solid ${G.primaryContainer}33`, borderRadius: 12, padding: '20px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
        <div>
          <div style={{ fontSize: 15, fontWeight: 700, color: G.onSurface, marginBottom: 4, fontFamily: 'Hanken Grotesk, sans-serif' }}>
            효과·레이아웃을 직접 다듬고 싶다면
          </div>
          <div style={{ fontSize: 13, color: G.onSurfaceVariant }}>
            타임라인 · 레이어 편집 · 미디어 교체 · 슬라이드 재정렬
          </div>
        </div>
        <button
          onClick={onSwitchToPro}
          style={{
            flexShrink: 0,
            padding: '12px 24px',
            background: G.primaryContainer,
            color: '#fff',
            border: 'none',
            borderRadius: 10,
            fontSize: 14,
            fontWeight: 700,
            cursor: 'pointer',
            fontFamily: 'Hanken Grotesk, sans-serif',
            whiteSpace: 'nowrap',
            boxShadow: `0 4px 14px ${G.primaryContainer}40`,
          }}
        >
          Pro 에디터에서 편집 →
        </button>
      </div>

      <button onClick={onBack} style={secBtn}>← 미리보기로 돌아가기</button>
    </div>
  );
};

// ── Shared styles ────────────────────────────────────────────────────
const card: React.CSSProperties = {
  background: G.surfaceContainerLowest,
  border: `1px solid ${G.outlineVariant}`,
  borderRadius: 12,
  padding: 20,
  boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
};
const sectionTitle: React.CSSProperties = {
  fontSize: 18,
  fontWeight: 600,
  color: G.onSurface,
  marginBottom: 4,
  fontFamily: 'Hanken Grotesk, sans-serif',
};
const sectionSub: React.CSSProperties = {
  fontSize: 13,
  color: G.onSurfaceVariant,
  marginBottom: 16,
  marginTop: 0,
};
const fieldLabel: React.CSSProperties = {
  fontSize: 12,
  fontWeight: 600,
  color: G.onSurface,
  marginBottom: 6,
  letterSpacing: '0.01em',
};
const inputStyle: React.CSSProperties = {
  width: '100%',
  background: G.surface,
  border: `1px solid ${G.outlineVariant}`,
  borderRadius: 8,
  padding: '9px 12px',
  fontSize: 14,
  color: G.onSurface,
  outline: 'none',
  boxSizing: 'border-box',
};
const priBtn: React.CSSProperties = {
  background: G.primary,
  color: G.onPrimary,
  border: 'none',
  borderRadius: 10,
  padding: '13px 20px',
  fontSize: 15,
  fontWeight: 700,
  cursor: 'pointer',
  width: '100%',
  fontFamily: 'Hanken Grotesk, sans-serif',
};
const secBtn: React.CSSProperties = {
  background: 'transparent',
  border: `1px solid ${G.outlineVariant}`,
  borderRadius: 10,
  padding: '12px 18px',
  color: G.onSurfaceVariant,
  fontSize: 14,
  fontWeight: 500,
  cursor: 'pointer',
  flex: 1,
};
