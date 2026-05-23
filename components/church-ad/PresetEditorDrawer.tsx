'use client';

import { useRef, useState } from 'react';
import { type StylePresetConfig, type FontSizes, DEFAULT_FONT_SIZES, saveOnePreset, deletePreset as deletePresetFromStore } from '@/lib/church/preset-store';

const G = {
  primary: '#005863',
  primaryContainer: '#007280',
  onPrimary: '#ffffff',
  background: '#f8f9fa',
  surface: '#ffffff',
  containerLow: '#f3f4f5',
  container: '#edeeef',
  containerHigh: '#e7e8e9',
  containerHighest: '#e1e3e4',
  onSurface: '#191c1d',
  onSurfaceVariant: '#3e484b',
  outline: '#6e797b',
  outlineVariant: '#bec8cb',
};

export const FONT_OPTIONS = [
  { id: 'Pretendard', label: 'Pretendard (기본)' },
  { id: 'Black Han Sans', label: 'Black Han Sans (임팩트)' },
  { id: 'Noto Serif KR', label: 'Noto Serif KR (고전적)' },
  { id: 'Nanum Gothic', label: 'Nanum Gothic (부드러운)' },
  { id: 'Gamja Flower', label: '감자꽃 (친근한)' },
];

export const VOICE_OPTIONS = [
  { id: 'ko-KR-Wavenet-A', label: '부드러운 여성 (지아)', desc: '따뜻하고 친근한 여성 목소리' },
  { id: 'ko-KR-Standard-A', label: '차분한 여성 (서연)', desc: '안정적이고 신뢰감 있는 여성 목소리' },
  { id: 'ko-KR-Standard-D', label: '신뢰감 있는 남성 (민수)', desc: '권위 있고 차분한 남성 목소리' },
  { id: 'ko-KR-Standard-C', label: '밝고 활기찬 (동호)', desc: '에너지 넘치는 밝은 목소리' },
  { id: 'ko-KR-Wavenet-D', label: '깊은 남성 (석준)', desc: '중후하고 진중한 남성 목소리' },
];

export const INTRO_SLIDE_OPTIONS = [
  { id: 'cover', label: '표지 (Cover) — 교회 이름 + 슬로건' },
  { id: 'welcome', label: '환영 (Welcome) — 환영 메시지 + 비전' },
  { id: 'verse', label: '말씀 (Verse) — 성경 구절로 시작' },
];

export const OUTRO_SLIDE_OPTIONS = [
  { id: 'invitation', label: '초대 (Invitation) — CTA 마무리' },
  { id: 'contact', label: '연락처 (Contact) — 전화·SNS' },
  { id: 'location', label: '위치 (Location) — 주소 + 교통' },
  { id: 'verse', label: '말씀 (Verse) — 말씀으로 마무리' },
];

const VOICE_PROMPT_EXAMPLES = [
  '따뜻하고 차분한 여성 목소리로, 예배로 초대하는 듯한 부드러운 톤으로 읽어주세요.',
  '밝고 활기찬 목소리로, 어린이와 청소년에게 말하듯 에너지 넘치게 읽어주세요.',
  '명확하고 신뢰감 있는 아나운서 톤으로, 정보를 명료하게 전달해주세요.',
  '감동적이고 열정적인 톤으로, 찬양의 기대감을 담아 읽어주세요.',
  '조용하고 경건한 분위기로, 예배 전 묵상을 돕는 듯 읽어주세요.',
];

const COMMON_ICONS = ['⛪', '🎒', '🎵', '📰', '✝️', '🙏', '📖', '🎤', '🌿', '🕊️', '🌟', '❤️', '🎺', '🏠', '🌸'];

interface Props {
  preset: StylePresetConfig;
  onClose: () => void;
  onSave: (updated: StylePresetConfig) => void;
  onDelete?: (id: string) => void;
}

export const PresetEditorDrawer: React.FC<Props> = ({ preset, onClose, onSave, onDelete }) => {
  const [form, setForm] = useState<StylePresetConfig>({ ...preset });
  const [previewAudio, setPreviewAudio] = useState<string | null>(null);
  const [previewBusy, setPreviewBusy] = useState(false);
  const [previewErr, setPreviewErr] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState<string>('basic');

  const patch = (p: Partial<StylePresetConfig>) => setForm((f) => ({ ...f, ...p }));

  const handleSave = () => {
    saveOnePreset(form);
    onSave(form);
  };

  const handleDelete = () => {
    if (!form.isCustom) return;
    if (!confirm(`"${form.label}" 템플릿을 삭제할까요?`)) return;
    deletePresetFromStore(form.id);
    onDelete?.(form.id);
    onClose();
  };

  const handleVoicePreview = async () => {
    const sampleText = form.voiceStylePrompt
      ? `안녕하세요. ${form.label} 템플릿 음성 미리 듣기입니다. ${form.slogan || '함께 예배하는 공동체에 여러분을 초대합니다.'}`
      : '안녕하세요. 교회 광고 영상 음성 미리 듣기입니다.';
    setPreviewBusy(true);
    setPreviewErr(null);
    setPreviewAudio(null);
    try {
      const res = await fetch('/api/church-ad/voice-preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: sampleText, voiceId: form.voiceId }),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error || 'preview failed');
      setPreviewAudio(j.audioUrl);
    } catch (e: any) {
      setPreviewErr(e.message);
    } finally {
      setPreviewBusy(false);
    }
  };

  const SECTIONS = [
    { id: 'basic', label: '기본 정보', icon: '📋' },
    { id: 'color', label: '색상 & 배경', icon: '🎨' },
    { id: 'typo', label: '타이포그래피', icon: '🔤' },
    { id: 'slide', label: '슬라이드 구성', icon: '📑' },
    { id: 'voice', label: '음성 나레이션', icon: '🎙' },
  ];

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 200,
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'flex-end',
        background: 'rgba(0,0,0,0.35)',
        backdropFilter: 'blur(2px)',
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        style={{
          width: 520,
          height: '100vh',
          background: G.surface,
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '-4px 0 24px rgba(0,0,0,0.15)',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div style={{ padding: '16px 20px', borderBottom: `1px solid ${G.outlineVariant}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, color: G.onSurfaceVariant, padding: '2px 4px' }}>←</button>
            <div>
              <div style={{ fontSize: 16, fontWeight: 700, color: G.onSurface, fontFamily: 'Hanken Grotesk, sans-serif' }}>
                {form.icon} {form.label}
              </div>
              <div style={{ fontSize: 12, color: G.onSurfaceVariant }}>스타일 템플릿 편집</div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            {form.isCustom && (
              <button onClick={handleDelete} style={{ padding: '7px 12px', border: `1px solid #fca5a5`, borderRadius: 6, background: 'transparent', color: '#dc2626', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                삭제
              </button>
            )}
            <button onClick={handleSave} style={{ padding: '7px 16px', border: 'none', borderRadius: 6, background: G.primaryContainer, color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
              저장
            </button>
          </div>
        </div>

        {/* Section tabs */}
        <div style={{ display: 'flex', borderBottom: `1px solid ${G.outlineVariant}`, background: G.containerLow, flexShrink: 0, overflowX: 'auto' }}>
          {SECTIONS.map((s) => (
            <button
              key={s.id}
              onClick={() => setActiveSection(s.id)}
              style={{
                padding: '8px 14px',
                border: 'none',
                borderBottom: `2px solid ${activeSection === s.id ? G.primaryContainer : 'transparent'}`,
                background: 'transparent',
                fontSize: 12,
                fontWeight: activeSection === s.id ? 700 : 400,
                color: activeSection === s.id ? G.primaryContainer : G.onSurfaceVariant,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                display: 'flex',
                alignItems: 'center',
                gap: 5,
              }}
            >
              <span>{s.icon}</span>
              <span>{s.label}</span>
            </button>
          ))}
        </div>

        {/* Scrollable body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>

          {/* ── 기본 정보 ── */}
          {activeSection === 'basic' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <Field label="아이콘">
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {COMMON_ICONS.map((ic) => (
                    <button
                      key={ic}
                      onClick={() => patch({ icon: ic })}
                      style={{
                        width: 36, height: 36, borderRadius: 8, fontSize: 18,
                        border: `1.5px solid ${form.icon === ic ? G.primaryContainer : G.outlineVariant}`,
                        background: form.icon === ic ? `${G.primaryContainer}15` : G.surface,
                        cursor: 'pointer',
                      }}
                    >
                      {ic}
                    </button>
                  ))}
                  <input
                    value={form.icon}
                    onChange={(e) => patch({ icon: e.target.value })}
                    placeholder="직접 입력"
                    style={{ ...inputSt, width: 60, textAlign: 'center', fontSize: 18 }}
                  />
                </div>
              </Field>
              <Field label="템플릿 이름">
                <input value={form.label} onChange={(e) => patch({ label: e.target.value })} style={inputSt} />
              </Field>
              <Field label="설명 (목록에 표시)">
                <input value={form.description} onChange={(e) => patch({ description: e.target.value })} style={inputSt} />
              </Field>
              <Field label="표어 (매 영상 하단에 표시)">
                <input value={form.slogan} onChange={(e) => patch({ slogan: e.target.value })} placeholder="예: 함께 예배하고 함께 살아가는 공동체" style={inputSt} />
              </Field>
              <Field label="슬라이드 배지 이름">
                <div style={{ fontSize: 12, color: G.onSurfaceVariant, marginBottom: 4 }}>
                  각 슬라이드 우측 상단에 표시할 이름입니다. 비워두면 프로젝트의 교회 이름이 사용됩니다.
                </div>
                <input
                  value={form.badgeText}
                  onChange={(e) => patch({ badgeText: e.target.value })}
                  placeholder="예: 주일학교·사랑부 (비워두면 교회 이름 자동 사용)"
                  style={inputSt}
                />
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', marginTop: 8 }}>
                  <input
                    type="checkbox"
                    checked={form.showChurchNameBadge}
                    onChange={(e) => patch({ showChurchNameBadge: e.target.checked })}
                    style={{ width: 16, height: 16, accentColor: G.primaryContainer }}
                  />
                  <span style={{ fontSize: 13, color: G.onSurface }}>배지 표시 (체크 해제 시 숨김)</span>
                </label>
              </Field>
            </div>
          )}

          {/* ── 색상 & 배경 ── */}
          {activeSection === 'color' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div style={{ display: 'flex', gap: 16 }}>
                <Field label="강조 색상 (텍스트·아이콘)">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <input type="color" value={form.accentColor} onChange={(e) => patch({ accentColor: e.target.value })}
                      style={{ width: 40, height: 40, border: `1px solid ${G.outlineVariant}`, borderRadius: 8, cursor: 'pointer', padding: 2 }} />
                    <input value={form.accentColor} onChange={(e) => patch({ accentColor: e.target.value })} style={{ ...inputSt, width: 100, fontFamily: 'monospace' }} />
                  </div>
                  <QuickColors value={form.accentColor} onChange={(c) => patch({ accentColor: c })} palette={['#d4a657', '#f5a623', '#7c3aed', '#2563eb', '#e63946', '#10b981', '#f472b6', '#facc15']} />
                </Field>
                <Field label="배경 색상 (영상 기본 색)">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <input type="color" value={form.backgroundColor} onChange={(e) => patch({ backgroundColor: e.target.value })}
                      style={{ width: 40, height: 40, border: `1px solid ${G.outlineVariant}`, borderRadius: 8, cursor: 'pointer', padding: 2 }} />
                    <input value={form.backgroundColor} onChange={(e) => patch({ backgroundColor: e.target.value })} style={{ ...inputSt, width: 100, fontFamily: 'monospace' }} />
                  </div>
                  <QuickColors value={form.backgroundColor} onChange={(c) => patch({ backgroundColor: c })} palette={['#0f1c2e', '#1a0f2e', '#0a0d1a', '#0a0d12', '#111827', '#1e3a2f', '#1a1a2e', '#0d0d0d']} />
                </Field>
              </div>

              {/* Live slide preview */}
              <SlideColorPreview form={form} patch={patch} />
            </div>
          )}

          {/* ── 타이포그래피 ── */}
          {activeSection === 'typo' && (
            <TypographyEditor form={form} patch={patch} />
          )}

          {/* ── 슬라이드 구성 ── */}
          {activeSection === 'slide' && (
            <SlideStructureEditor form={form} patch={patch} />
          )}

          {/* ── 음성 나레이션 ── */}
          {activeSection === 'voice' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <Field label="성우 선택">
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {VOICE_OPTIONS.map((v) => (
                    <label key={v.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', border: `1.5px solid ${form.voiceId === v.id ? G.primaryContainer : G.outlineVariant}`, borderRadius: 8, background: form.voiceId === v.id ? `${G.primaryContainer}0d` : G.surface, cursor: 'pointer' }}>
                      <input type="radio" name="voice" value={v.id} checked={form.voiceId === v.id} onChange={() => patch({ voiceId: v.id })} style={{ accentColor: G.primaryContainer }} />
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: G.onSurface }}>{v.label}</div>
                        <div style={{ fontSize: 11, color: G.onSurfaceVariant }}>{v.desc}</div>
                      </div>
                    </label>
                  ))}
                </div>
              </Field>

              <Field label="음성 스타일 묘사 (Gemini TTS 프롬프트)">
                <div style={{ fontSize: 12, color: G.onSurfaceVariant, marginBottom: 6, lineHeight: 1.5 }}>
                  어떤 톤·감정·분위기로 읽어야 하는지 한국어로 설명하세요. Gemini가 이 지시에 맞춰 음성을 생성합니다.
                </div>
                <textarea
                  value={form.voiceStylePrompt}
                  onChange={(e) => patch({ voiceStylePrompt: e.target.value })}
                  rows={4}
                  placeholder="예: 따뜻하고 차분한 여성 목소리로, 예배로 초대하는 듯한 부드러운 톤으로 읽어주세요."
                  style={{ ...inputSt, resize: 'vertical', fontFamily: 'inherit', lineHeight: 1.6 }}
                />
                {/* 예시 프롬프트 */}
                <div style={{ marginTop: 8 }}>
                  <div style={{ fontSize: 11, color: G.onSurfaceVariant, marginBottom: 4 }}>💡 예시 클릭해서 적용:</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    {VOICE_PROMPT_EXAMPLES.map((ex, i) => (
                      <button
                        key={i}
                        onClick={() => patch({ voiceStylePrompt: ex })}
                        style={{
                          textAlign: 'left', padding: '6px 10px', borderRadius: 6, cursor: 'pointer',
                          border: `1px solid ${G.outlineVariant}`, background: G.containerLow,
                          fontSize: 12, color: G.onSurfaceVariant, lineHeight: 1.5,
                        }}
                      >
                        "{ex}"
                      </button>
                    ))}
                  </div>
                </div>
              </Field>

              {/* 미리 듣기 */}
              <div style={{ padding: 16, background: G.containerLow, borderRadius: 12, border: `1px solid ${G.outlineVariant}` }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: G.onSurface, marginBottom: 8 }}>🎧 미리 듣기</div>
                <div style={{ fontSize: 12, color: G.onSurfaceVariant, marginBottom: 10 }}>
                  선택한 성우로 샘플 문장을 생성해 들어볼 수 있습니다.<br />
                  <em>샘플: "{form.slogan || '함께 예배하는 공동체에 여러분을 초대합니다.'}"</em>
                </div>
                <button
                  onClick={handleVoicePreview}
                  disabled={previewBusy}
                  style={{
                    padding: '8px 18px', borderRadius: 8, border: 'none',
                    background: previewBusy ? G.containerHigh : G.primaryContainer,
                    color: previewBusy ? G.onSurfaceVariant : '#fff',
                    fontSize: 13, fontWeight: 700, cursor: previewBusy ? 'not-allowed' : 'pointer',
                    display: 'flex', alignItems: 'center', gap: 6,
                  }}
                >
                  {previewBusy ? '⏳ 생성 중…' : '▶ 미리 듣기'}
                </button>
                {previewErr && <div style={{ marginTop: 8, color: '#dc2626', fontSize: 12 }}>⚠ {previewErr}</div>}
                {previewAudio && (
                  <audio
                    key={previewAudio}
                    controls
                    autoPlay
                    src={previewAudio}
                    style={{ width: '100%', marginTop: 10, borderRadius: 8 }}
                  />
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: '12px 20px', borderTop: `1px solid ${G.outlineVariant}`, display: 'flex', justifyContent: 'flex-end', gap: 8, flexShrink: 0, background: G.containerLow }}>
          <button onClick={onClose} style={{ padding: '7px 14px', border: `1px solid ${G.outlineVariant}`, borderRadius: 6, background: 'transparent', color: G.onSurfaceVariant, fontSize: 13, cursor: 'pointer' }}>
            취소
          </button>
          <button onClick={handleSave} style={{ padding: '7px 20px', border: 'none', borderRadius: 6, background: G.primaryContainer, color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
            ✓ 저장
          </button>
        </div>
      </div>
    </div>
  );
};

// ── New blank preset ─────────────────────────────────────────────────
export function createBlankPreset(): StylePresetConfig {
  return {
    id: `custom-${Date.now()}`,
    label: '새 템플릿',
    icon: '✝️',
    description: '커스텀 스타일',
    accentColor: '#d4a657',
    backgroundColor: '#0f1c2e',
    bgOverlayOpacity: 0.65,
    fontFamily: 'Pretendard',
    fontSizes: { ...DEFAULT_FONT_SIZES },
    introSlideType: 'cover',
    outroSlideType: 'invitation',
    showChurchNameBadge: true,
    badgeText: '',
    slogan: '',
    voiceId: 'ko-KR-Wavenet-A',
    voiceStylePrompt: '',
    isCustom: true,
  };
}

// ── Shared micro-components ──────────────────────────────────────────
const Field: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
    <label style={{ fontSize: 12, fontWeight: 600, color: G.onSurfaceVariant, letterSpacing: '0.03em' }}>{label}</label>
    {children}
  </div>
);

const QuickColors: React.FC<{ value: string; onChange: (c: string) => void; palette: string[] }> = ({ value, onChange, palette }) => (
  <div style={{ display: 'flex', gap: 5, marginTop: 6, flexWrap: 'wrap' }}>
    {palette.map((c) => (
      <button
        key={c}
        onClick={() => onChange(c)}
        style={{ width: 22, height: 22, borderRadius: 4, background: c, border: value === c ? `2px solid ${G.primary}` : `1px solid ${G.outlineVariant}`, cursor: 'pointer', outline: value === c ? `2px solid ${G.primary}` : 'none', outlineOffset: 1 }}
      />
    ))}
  </div>
);

// ── Typography editor ────────────────────────────────────────────────
const FONT_LEVELS: { key: keyof FontSizes; label: string; desc: string; sampleText: string }[] = [
  { key: 'heading',    label: '큰 제목',   desc: '커버·슬라이드 메인 타이틀', sampleText: '주일 예배 안내' },
  { key: 'subheading', label: '중간 제목', desc: '섹션 제목·프로그램 이름',    sampleText: '오전 11시 본당 예배' },
  { key: 'label',      label: '작은 제목', desc: '항목 레이블·뱃지',          sampleText: '6월 셋째 주' },
  { key: 'body',       label: '본문',      desc: '일반 설명 텍스트',           sampleText: '담임목사 홍길동 목사' },
  { key: 'caption',    label: '캡션',      desc: '날짜·위치·작은 메모',        sampleText: '서울시 강남구 123번지' },
];

// Scale factor: preview is 460px wide for a 1920px canvas → 0.2396
const SCALE = 460 / 1920;

const TypographyEditor: React.FC<{
  form: StylePresetConfig;
  patch: (p: Partial<StylePresetConfig>) => void;
}> = ({ form, patch }) => {
  const [selected, setSelected] = useState<keyof FontSizes>('heading');
  const sizes = form.fontSizes ?? DEFAULT_FONT_SIZES;

  const patchSize = (key: keyof FontSizes, delta: number) => {
    const next = Math.max(10, Math.min(200, (sizes[key] ?? DEFAULT_FONT_SIZES[key]) + delta));
    patch({ fontSizes: { ...sizes, [key]: next } });
  };

  const setSize = (key: keyof FontSizes, val: number) => {
    const clamped = Math.max(10, Math.min(200, val));
    patch({ fontSizes: { ...sizes, [key]: clamped } });
  };

  const selLevel = FONT_LEVELS.find((l) => l.key === selected)!;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Font family picker */}
      <Field label="폰트">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {FONT_OPTIONS.map((f) => (
            <label key={f.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', border: `1.5px solid ${form.fontFamily === f.id ? G.primaryContainer : G.outlineVariant}`, borderRadius: 8, background: form.fontFamily === f.id ? `${G.primaryContainer}0d` : G.surface, cursor: 'pointer' }}>
              <input type="radio" name="font" value={f.id} checked={form.fontFamily === f.id} onChange={() => patch({ fontFamily: f.id })} style={{ accentColor: G.primaryContainer }} />
              <span style={{ fontSize: 14, fontWeight: 700, fontFamily: `${f.id}, sans-serif`, color: G.onSurface }}>{f.id}</span>
              <span style={{ fontSize: 12, color: G.onSurfaceVariant }}>— {f.label.split('(')[1]?.replace(')', '') ?? f.label}</span>
            </label>
          ))}
        </div>
      </Field>

      {/* Slide preview */}
      <Field label="글자 크기 — 슬라이드를 클릭해서 선택 후 조절">
        <div style={{ fontSize: 11, color: G.onSurfaceVariant, marginBottom: 6 }}>
          실제 영상(1920×1080) 기준 px · 클릭하면 선택됩니다
        </div>

        {/* Mini slide canvas */}
        <div
          style={{
            width: 460,
            height: 259,  // 460 * 9/16
            background: form.backgroundColor,
            borderRadius: 10,
            border: `2px solid ${G.outlineVariant}`,
            position: 'relative',
            overflow: 'hidden',
            cursor: 'default',
            flexShrink: 0,
          }}
        >
          {/* Dark overlay to simulate media bg */}
          <div style={{ position: 'absolute', inset: 0, background: `rgba(0,0,0,${form.bgOverlayOpacity * 0.6})` }} />

          {/* Decorative accent bar */}
          <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 4 * SCALE * 10, background: form.accentColor }} />

          {/* Text layers — each clickable */}
          <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: `0 ${28 * SCALE * 10}px`, gap: `${6 * SCALE * 10}px` }}>
            {FONT_LEVELS.map((lvl) => {
              const px = (sizes[lvl.key] ?? DEFAULT_FONT_SIZES[lvl.key]) * SCALE;
              const isSel = selected === lvl.key;
              return (
                <div
                  key={lvl.key}
                  onClick={() => setSelected(lvl.key)}
                  style={{
                    fontFamily: `${form.fontFamily}, sans-serif`,
                    fontSize: px,
                    fontWeight: lvl.key === 'heading' ? 800 : lvl.key === 'subheading' ? 700 : lvl.key === 'label' ? 600 : 400,
                    color: lvl.key === 'heading' || lvl.key === 'label' ? form.accentColor : '#ffffff',
                    lineHeight: 1.2,
                    cursor: 'pointer',
                    outline: isSel ? `2px solid ${form.accentColor}` : '2px solid transparent',
                    outlineOffset: 2,
                    borderRadius: 3,
                    padding: `1px ${3 * SCALE * 10}px`,
                    transition: 'outline 0.15s',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    maxWidth: '100%',
                  }}
                >
                  {lvl.sampleText}
                </div>
              );
            })}
          </div>

          {/* Selection indicator overlay */}
          {selected && (
            <div style={{ position: 'absolute', top: 6, right: 8, background: form.accentColor, color: '#fff', fontSize: 9, fontWeight: 700, padding: '2px 6px', borderRadius: 4, pointerEvents: 'none' }}>
              {selLevel.label} 선택됨
            </div>
          )}
        </div>

        {/* Size control for selected level */}
        <div style={{ marginTop: 10, padding: '12px 14px', background: G.containerLow, borderRadius: 10, border: `1.5px solid ${G.primaryContainer}33` }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
            <div>
              <span style={{ fontSize: 13, fontWeight: 700, color: G.primaryContainer }}>{selLevel.label}</span>
              <span style={{ fontSize: 12, color: G.onSurfaceVariant, marginLeft: 8 }}>{selLevel.desc}</span>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button onClick={() => patchSize(selected, -2)} style={sizeBtn}>−2</button>
            <button onClick={() => patchSize(selected, -1)} style={sizeBtn}>−1</button>
            <input
              type="number"
              min={10} max={200}
              value={sizes[selected] ?? DEFAULT_FONT_SIZES[selected]}
              onChange={(e) => setSize(selected, parseInt(e.target.value) || 0)}
              style={{
                width: 64, textAlign: 'center', fontSize: 22, fontWeight: 800,
                border: `2px solid ${G.primaryContainer}`,
                borderRadius: 8, padding: '4px 0', color: G.primaryContainer,
                background: G.surface, outline: 'none',
              }}
            />
            <span style={{ fontSize: 12, color: G.onSurfaceVariant }}>px</span>
            <button onClick={() => patchSize(selected, 1)} style={sizeBtn}>+1</button>
            <button onClick={() => patchSize(selected, 2)} style={sizeBtn}>+2</button>
            <button onClick={() => setSize(selected, DEFAULT_FONT_SIZES[selected])} style={{ ...sizeBtn, marginLeft: 'auto', color: G.outline, fontSize: 11 }}>초기화</button>
          </div>

          {/* All levels at a glance */}
          <div style={{ display: 'flex', gap: 6, marginTop: 10, flexWrap: 'wrap' }}>
            {FONT_LEVELS.map((lvl) => (
              <button
                key={lvl.key}
                onClick={() => setSelected(lvl.key)}
                style={{
                  padding: '4px 10px', borderRadius: 6, cursor: 'pointer', fontSize: 12,
                  border: `1.5px solid ${selected === lvl.key ? G.primaryContainer : G.outlineVariant}`,
                  background: selected === lvl.key ? `${G.primaryContainer}12` : G.surface,
                  color: selected === lvl.key ? G.primaryContainer : G.onSurfaceVariant,
                  fontWeight: selected === lvl.key ? 700 : 400,
                }}
              >
                {lvl.label} <span style={{ opacity: 0.6 }}>{sizes[lvl.key]}px</span>
              </button>
            ))}
          </div>
        </div>
      </Field>
    </div>
  );
};

const sizeBtn: React.CSSProperties = {
  width: 36, height: 36, borderRadius: 6, border: `1px solid ${G.outlineVariant}`,
  background: G.surface, cursor: 'pointer', fontSize: 13, fontWeight: 700,
  color: G.onSurface, display: 'flex', alignItems: 'center', justifyContent: 'center',
};

const inputSt: React.CSSProperties = {
  width: '100%',
  background: G.surface,
  border: `1px solid ${G.outlineVariant}`,
  borderRadius: 8,
  padding: '8px 12px',
  fontSize: 14,
  color: G.onSurface,
  outline: 'none',
  boxSizing: 'border-box',
};

const selectSt: React.CSSProperties = {
  width: '100%',
  background: G.surface,
  border: `1px solid ${G.outlineVariant}`,
  borderRadius: 8,
  padding: '8px 12px',
  fontSize: 14,
  color: G.onSurface,
  outline: 'none',
  cursor: 'pointer',
};


// ── Slide Color Preview (색상·배경 탭) ───────────────────────────────
const SlideColorPreview: React.FC<{
  form: StylePresetConfig;
  patch: (p: Partial<StylePresetConfig>) => void;
}> = ({ form, patch }) => {
  const [bgImage, setBgImage] = useState<string | null>(null);
  const bgRef = useRef<HTMLInputElement | null>(null);

  const handleBgUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const url = URL.createObjectURL(f);
    setBgImage(url);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* Color pickers row */}
      <div style={{ display: 'flex', gap: 14 }}>
        <Field label="강조색">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <input type="color" value={form.accentColor} onChange={(e) => patch({ accentColor: e.target.value })}
              style={{ width: 36, height: 36, borderRadius: 6, border: `1px solid ${G.outlineVariant}`, padding: 2, cursor: 'pointer' }} />
            <input value={form.accentColor} onChange={(e) => patch({ accentColor: e.target.value })}
              style={{ ...inputSt, width: 90, fontFamily: 'monospace', fontSize: 13 }} />
          </div>
          <QuickColors value={form.accentColor} onChange={(c) => patch({ accentColor: c })} palette={['#d4a657','#f5a623','#7c3aed','#2563eb','#e63946','#10b981','#f472b6','#facc15']} />
        </Field>
        <Field label="배경색">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <input type="color" value={form.backgroundColor} onChange={(e) => patch({ backgroundColor: e.target.value })}
              style={{ width: 36, height: 36, borderRadius: 6, border: `1px solid ${G.outlineVariant}`, padding: 2, cursor: 'pointer' }} />
            <input value={form.backgroundColor} onChange={(e) => patch({ backgroundColor: e.target.value })}
              style={{ ...inputSt, width: 90, fontFamily: 'monospace', fontSize: 13 }} />
          </div>
          <QuickColors value={form.backgroundColor} onChange={(c) => patch({ backgroundColor: c })} palette={['#0f1c2e','#1a0f2e','#0a0d1a','#0a0d12','#111827','#1e3a2f','#1a1a2e','#0d0d0d']} />
        </Field>
      </div>

      {/* Live slide preview */}
      <Field label="슬라이드 미리보기 (배경 이미지/영상 업로드 가능)">
        <div
          style={{
            width: '100%',
            aspectRatio: '16/9',
            background: form.backgroundColor,
            borderRadius: 10,
            border: `2px solid ${G.outlineVariant}`,
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {/* Bg image */}
          {bgImage && (
            <img src={bgImage} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
          )}
          {/* Overlay */}
          <div style={{ position: 'absolute', inset: 0, background: `rgba(0,0,0,${form.bgOverlayOpacity})` }} />
          {/* Accent bar */}
          <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '1.2%', background: form.accentColor }} />
          {/* Sample text */}
          <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '0 6%', gap: '1%' }}>
            <div style={{ fontSize: 'clamp(10px, 3vw, 22px)', fontWeight: 800, color: form.accentColor, fontFamily: `${form.fontFamily}, sans-serif` }}>
              {form.label}
            </div>
            <div style={{ fontSize: 'clamp(8px, 2vw, 14px)', fontWeight: 700, color: '#fff', fontFamily: `${form.fontFamily}, sans-serif` }}>
              {form.slogan || '슬로건이 여기에 표시됩니다'}
            </div>
            {form.showChurchNameBadge && (
              <div style={{ position: 'absolute', top: '8%', right: '4%', fontSize: 'clamp(7px, 1.5vw, 11px)', color: form.accentColor, fontWeight: 700, background: 'rgba(0,0,0,0.5)', padding: '2px 6px', borderRadius: 4 }}>
                {form.badgeText || '교회 이름'}
              </div>
            )}
          </div>
          {/* Upload hint */}
          {!bgImage && (
            <button
              onClick={() => bgRef.current?.click()}
              style={{ position: 'absolute', bottom: 8, right: 8, padding: '4px 10px', background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.3)', borderRadius: 6, color: '#fff', fontSize: 11, cursor: 'pointer', backdropFilter: 'blur(4px)' }}
            >
              🖼 배경 업로드
            </button>
          )}
          {bgImage && (
            <button
              onClick={() => setBgImage(null)}
              style={{ position: 'absolute', bottom: 8, right: 8, padding: '4px 8px', background: 'rgba(0,0,0,0.5)', border: 'none', borderRadius: 6, color: '#fff', fontSize: 11, cursor: 'pointer' }}
            >
              ✕ 제거
            </button>
          )}
        </div>
        <input ref={bgRef} type="file" accept="image/*,video/mp4" style={{ display: 'none' }} onChange={handleBgUpload} />
      </Field>

      {/* Overlay opacity with live feedback */}
      <Field label={`배경 오버레이 투명도 — ${Math.round(form.bgOverlayOpacity * 100)}% (높을수록 어두움)`}>
        <input
          type="range" min={0} max={95} step={5}
          value={Math.round(form.bgOverlayOpacity * 100)}
          onChange={(e) => patch({ bgOverlayOpacity: parseInt(e.target.value) / 100 })}
          style={{ width: '100%', accentColor: G.primaryContainer }}
        />
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: G.onSurfaceVariant, marginTop: 2 }}>
          <span>0% — 배경 원본 그대로</span>
          <span>95% — 거의 검정</span>
        </div>
        {/* Visual opacity bar */}
        <div style={{ marginTop: 6, height: 28, borderRadius: 8, overflow: 'hidden', border: `1px solid ${G.outlineVariant}`, display: 'flex' }}>
          {[0, 20, 40, 60, 80].map((pct) => (
            <div
              key={pct}
              onClick={() => patch({ bgOverlayOpacity: pct / 100 })}
              title={`${pct}%`}
              style={{
                flex: 1, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: `rgba(0,0,0,${pct / 100})`,
                borderRight: pct < 80 ? `1px solid ${G.outlineVariant}` : 'none',
                fontSize: 9, color: pct > 40 ? '#fff' : '#333', fontWeight: 700,
                outline: Math.abs(form.bgOverlayOpacity * 100 - pct) < 10 ? `2px solid ${G.primaryContainer}` : 'none',
              }}
            >{pct}%</div>
          ))}
        </div>
      </Field>
    </div>
  );
};

// ── Slide Structure Editor (슬라이드 구성 탭) ────────────────────────
const SlideStructureEditor: React.FC<{
  form: StylePresetConfig;
  patch: (p: Partial<StylePresetConfig>) => void;
}> = ({ form, patch }) => {
  const [introBg, setIntroBg] = useState<string | null>(null);
  const [outroBg, setOutroBg] = useState<string | null>(null);
  const introRef = useRef<HTMLInputElement | null>(null);
  const outroRef = useRef<HTMLInputElement | null>(null);

  const SLIDE_W = 200;
  const SLIDE_H = 113;

  const renderMiniSlide = (type: string, bgUrl: string | null, label: string, fileRef: React.RefObject<HTMLInputElement | null>, onClear: () => void) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <div style={{ fontSize: 12, fontWeight: 600, color: G.onSurfaceVariant }}>{label}</div>
      <div
        style={{
          width: SLIDE_W, height: SLIDE_H,
          background: form.backgroundColor,
          borderRadius: 8, border: `2px solid ${G.outlineVariant}`,
          position: 'relative', overflow: 'hidden',
        }}
      >
        {bgUrl && <img src={bgUrl} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />}
        <div style={{ position: 'absolute', inset: 0, background: `rgba(0,0,0,${form.bgOverlayOpacity})` }} />
        <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 3, background: form.accentColor }} />
        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '0 10px', gap: 3 }}>
          <div style={{ fontSize: 9, fontWeight: 700, color: form.accentColor, fontFamily: `${form.fontFamily}, sans-serif`, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            {type.toUpperCase()}
          </div>
          <div style={{ fontSize: 13, fontWeight: 800, color: '#fff', fontFamily: `${form.fontFamily}, sans-serif` }}>
            {type === 'cover' ? '교회 이름' : type === 'invitation' ? '함께 예배해요' : type === 'contact' ? '📞 연락하기' : type === 'verse' ? '"말씀 인용"' : '슬라이드'}
          </div>
          <div style={{ fontSize: 8, color: 'rgba(255,255,255,0.7)', fontFamily: `${form.fontFamily}, sans-serif` }}>
            {form.slogan?.slice(0, 24) || '슬로건'}
          </div>
        </div>
        {/* Upload / clear */}
        {!bgUrl ? (
          <button onClick={() => fileRef.current?.click()} style={{ position: 'absolute', bottom: 4, right: 4, padding: '2px 6px', background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.3)', borderRadius: 4, color: '#fff', fontSize: 9, cursor: 'pointer' }}>
            🖼 배경
          </button>
        ) : (
          <button onClick={onClear} style={{ position: 'absolute', bottom: 4, right: 4, padding: '2px 6px', background: 'rgba(0,0,0,0.5)', border: 'none', borderRadius: 4, color: '#fff', fontSize: 9, cursor: 'pointer' }}>
            ✕
          </button>
        )}
      </div>
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Intro/outro side by side */}
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        <div>
          {renderMiniSlide(form.introSlideType, introBg, '첫 번째 슬라이드', introRef, () => setIntroBg(null))}
          <select value={form.introSlideType} onChange={(e) => patch({ introSlideType: e.target.value })} style={{ ...selectSt, marginTop: 6, width: SLIDE_W }}>
            {INTRO_SLIDE_OPTIONS.map((o) => <option key={o.id} value={o.id}>{o.label.split('—')[0].trim()}</option>)}
          </select>
          <input ref={introRef} type="file" accept="image/*,video/mp4" style={{ display: 'none' }}
            onChange={(e) => { const f = e.target.files?.[0]; if (f) setIntroBg(URL.createObjectURL(f)); }} />
        </div>
        <div>
          {renderMiniSlide(form.outroSlideType, outroBg, '마지막 슬라이드', outroRef, () => setOutroBg(null))}
          <select value={form.outroSlideType} onChange={(e) => patch({ outroSlideType: e.target.value })} style={{ ...selectSt, marginTop: 6, width: SLIDE_W }}>
            {OUTRO_SLIDE_OPTIONS.map((o) => <option key={o.id} value={o.id}>{o.label.split('—')[0].trim()}</option>)}
          </select>
          <input ref={outroRef} type="file" accept="image/*,video/mp4" style={{ display: 'none' }}
            onChange={(e) => { const f = e.target.files?.[0]; if (f) setOutroBg(URL.createObjectURL(f)); }} />
        </div>
      </div>

      <div style={{ padding: 12, background: G.containerLow, borderRadius: 10, fontSize: 12, color: G.onSurfaceVariant, lineHeight: 1.7 }}>
        💡 배경 이미지/영상을 클릭해 미리보기에서 확인하세요.<br />
        실제 영상 렌더 시에는 스크립트에서 업로드한 미디어가 자동 배치됩니다.
      </div>
    </div>
  );
};
