'use client';

import { useRef, useState } from 'react';
import { type ChurchAdSlide, SLIDE_TYPE_LABELS } from './types';
import { MediaPicker } from './MediaPicker';

interface Props {
  slide: ChurchAdSlide;
  accentColor: string;
  onChange: (patch: Partial<ChurchAdSlide>) => void;
}

const fieldStyle: React.CSSProperties = {
  width: '100%',
  background: '#0f1216',
  border: '1px solid #232a36',
  color: '#fff',
  borderRadius: 6,
  padding: '8px 10px',
  fontSize: 13,
  fontFamily: 'inherit',
};

const labelStyle: React.CSSProperties = {
  fontSize: 11,
  color: '#7d8696',
  fontWeight: 600,
  letterSpacing: '0.04em',
  textTransform: 'uppercase',
  marginBottom: 4,
  display: 'block',
};

const GalleryUrlsEditor: React.FC<{
  urls: string[];
  accentColor: string;
  onChange: (urls: string[]) => void;
}> = ({ urls, accentColor, onChange }) => {
  const fileRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const handleUpload = async (file: File) => {
    setBusy('업로드 중…');
    setErr(null);
    try {
      const fd = new FormData();
      fd.set('file', file);
      const res = await fetch('/api/church-ad/upload', { method: 'POST', body: fd });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error || 'upload failed');
      onChange([...urls, j.url]);
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setBusy(null);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
        {urls.map((url, i) => (
          <div key={url + i} style={{ position: 'relative', aspectRatio: '1', borderRadius: 6, overflow: 'hidden', border: '1px solid #232a36' }}>
            <img src={url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            <button
              onClick={() => onChange(urls.filter((_, idx) => idx !== i))}
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
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 10,
                cursor: 'pointer',
                zIndex: 5,
              }}
            >
              ✕
            </button>
          </div>
        ))}
        {urls.length < 6 && (
          <button
            onClick={() => fileRef.current?.click()}
            style={{
              aspectRatio: '1',
              borderRadius: 6,
              border: '1px dashed #2a3140',
              background: '#0f1216',
              color: '#7d8696',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 11,
              cursor: 'pointer',
              gap: 4,
            }}
          >
            <span style={{ fontSize: 16 }}>+</span>
            사진 추가
          </button>
        )}
      </div>
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        style={{ display: 'none' }}
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) handleUpload(f);
        }}
      />
      {busy && <div style={{ color: accentColor, fontSize: 11 }}>{busy}</div>}
      {err && <div style={{ color: '#e87474', fontSize: 11 }}>⚠ {err}</div>}
    </div>
  );
};

export const Inspector: React.FC<Props> = ({ slide, accentColor, onChange }) => {
  return (
    <div
      style={{
        height: '100%',
        overflowY: 'auto',
        padding: 18,
        display: 'flex',
        flexDirection: 'column',
        gap: 16,
        background: '#13171e',
        borderLeft: '1px solid #1c2028',
      }}
    >
      <div>
        <div style={{ color: accentColor, fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 4 }}>
          {SLIDE_TYPE_LABELS[slide.type]} {slide.locked && '🔒'}
        </div>
        <div style={{ color: '#fff', fontSize: 16, fontWeight: 700 }}>슬라이드 편집</div>
      </div>

      {/* Lock controls — preserve this slide during auto-regeneration */}
      <div
        style={{
          background: slide.locked ? `${accentColor}11` : '#0f1216',
          borderRadius: 8,
          padding: 10,
          border: slide.locked ? `1px solid ${accentColor}88` : '1px solid #232a36',
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
        }}
      >
        <div
          style={{
            fontSize: 11,
            color: slide.locked ? accentColor : '#7d8696',
            fontWeight: 700,
            letterSpacing: '0.04em',
            textTransform: 'uppercase',
          }}
        >
          📌 슬라이드 고정 (재생성 시 보호)
        </div>

        <div style={{ display: 'flex', gap: 6 }}>
          {(['intro', 'outro', 'pinned'] as const).map((kind) => {
            const labels = {
              intro: '🔒 시작 페이지로',
              outro: '🔒 마지막 페이지로',
              pinned: '🔒 위치 고정',
            };
            const active = slide.locked === kind;
            return (
              <button
                key={kind}
                onClick={() => onChange({ locked: active ? undefined : kind })}
                style={{
                  flex: 1,
                  background: active ? accentColor : 'transparent',
                  color: active ? '#0f1c2e' : '#a4adba',
                  border: active ? 0 : '1px solid #2a3140',
                  borderRadius: 5,
                  padding: '7px 4px',
                  fontSize: 11,
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
                title={
                  kind === 'intro'
                    ? '본문 재생성해도 이 슬라이드는 영상 맨 앞에 유지됨'
                    : kind === 'outro'
                    ? '본문 재생성해도 이 슬라이드는 영상 맨 뒤에 유지됨'
                    : '본문 재생성해도 이 슬라이드 자체와 위치가 보존됨'
                }
              >
                {labels[kind]}
              </button>
            );
          })}
        </div>

        {slide.locked ? (
          <div
            style={{
              background: '#13171e',
              border: `1px dashed ${accentColor}66`,
              borderRadius: 6,
              padding: '8px 10px',
              fontSize: 11,
              color: '#dde3ec',
              lineHeight: 1.55,
            }}
          >
            <div style={{ color: accentColor, fontWeight: 700, marginBottom: 4 }}>
              ✓ 이 슬라이드는{' '}
              {slide.locked === 'intro'
                ? '시작 페이지'
                : slide.locked === 'outro'
                ? '마지막 페이지'
                : '고정 슬라이드'}{' '}
              상태입니다
            </div>
            ① <strong>아래 폼에서 자유롭게 편집</strong> 가능 (텍스트·미디어·길이 모두) <br />
            ② "✦ 본문에서 생성"을 다시 눌러도{' '}
            <strong>이 슬라이드는 사라지지 않고 같은 위치에 유지</strong> <br />
            ③ 타임라인에서 드래그 재정렬·삭제 불가 (잠금 해제 후 가능)
          </div>
        ) : (
          <div
            style={{
              fontSize: 11,
              color: '#7d8696',
              lineHeight: 1.55,
            }}
          >
            💡 이 슬라이드(예: 교회 인사말, 클로징 멘트 등)를 다듬은 뒤 고정하면,
            나중에 "✦ 본문에서 생성"으로 본문을 갈아끼워도 이 슬라이드는 그대로 유지됩니다.
          </div>
        )}
      </div>

      {/* Layout picker — options depend on slide type */}
      {slide.type === 'programs' ? (
        <Field label="📐 레이아웃 (사역·프로그램)">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 6 }}>
            {(
              [
                { v: 'default', label: '⬛ 기본 (배경 + 카드)' },
                { v: 'news-grid', label: '🗞 NEWS 2×2 그리드' },
                { v: 'list-rows', label: '📋 리스트 행 (가로형)' },
              ] as const
            ).map((opt) => {
              const active = (slide.layout ?? 'default') === opt.v;
              return (
                <button
                  key={opt.v}
                  onClick={() => onChange({ layout: opt.v as any })}
                  style={{
                    background: active ? accentColor : 'transparent',
                    color: active ? '#0f1c2e' : '#a4adba',
                    border: active ? 0 : '1px solid #2a3140',
                    borderRadius: 5,
                    padding: '7px 8px',
                    fontSize: 11,
                    fontWeight: 700,
                    cursor: 'pointer',
                    textAlign: 'left',
                  }}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
        </Field>
      ) : slide.type === 'mission' ? (
        <Field label="📐 레이아웃 (비전·말씀)">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 6 }}>
            {(
              [
                { v: 'big', label: '🔠 거대한 한 줄' },
                { v: 'center', label: '⬛ 가운데' },
                { v: 'left', label: '⬛ 좌측' },
                { v: 'photo-card-bottom', label: '🖼 사진 + 인용 카드' },
              ] as const
            ).map((opt) => {
              const active = (slide.layout ?? 'big') === opt.v;
              return (
                <button
                  key={opt.v}
                  onClick={() => onChange({ layout: opt.v as any })}
                  style={{
                    background: active ? accentColor : 'transparent',
                    color: active ? '#0f1c2e' : '#a4adba',
                    border: active ? 0 : '1px solid #2a3140',
                    borderRadius: 5,
                    padding: '7px 8px',
                    fontSize: 11,
                    fontWeight: 700,
                    cursor: 'pointer',
                    textAlign: 'left',
                  }}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
        </Field>
      ) : slide.type !== 'gallery' ? (
        <Field label="📐 레이아웃 (프레임 선택)">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 6 }}>
            {(
              [
                { v: 'center', label: '⬛ 중앙 정렬' },
                { v: 'left', label: '⬛ 좌측 정렬' },
                { v: 'right', label: '⬛ 우측 정렬' },
                { v: 'split-left', label: '🔲 좌우 분할 (텍스트 좌)' },
                { v: 'split-right', label: '🔲 좌우 분할 (텍스트 우)' },
                { v: 'photo-card', label: '🖼 사진 + 가운데 카드' },
                { v: 'photo-card-bottom', label: '🖼 사진 + 하단 카드' },
                { v: 'photo-card-side', label: '🖼 사진 + 우측 카드' },
                { v: 'full-bleed', label: '🖼 사진 메인 + 그림자 글자' },
                { v: 'immersive', label: '🎬 상단 제목 + 하단 자막' },
                ...(slide.type === 'event' || slide.type === 'welcome'
                  ? ([{ v: 'photo-card-bottom-left', label: '🖼 사진 + 좌하단 카드' }] as const)
                  : ([] as const)),
              ] as const
            ).map((opt) => {
              const active = (slide.layout ?? 'center') === opt.v;
              return (
                <button
                  key={opt.v}
                  onClick={() => onChange({ layout: opt.v as any })}
                  style={{
                    background: active ? accentColor : 'transparent',
                    color: active ? '#0f1c2e' : '#a4adba',
                    border: active ? 0 : '1px solid #2a3140',
                    borderRadius: 5,
                    padding: '7px 8px',
                    fontSize: 11,
                    fontWeight: 700,
                    cursor: 'pointer',
                    textAlign: 'left',
                  }}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
        </Field>
      ) : null}

      {/* Photo entry effect — only shown when slide has media */}
      {(slide.mediaUrl || slide.mediaDataUri) && (
        <Field label="✨ 사진 등장 효과">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 5 }}>
            {(
              [
                { v: 'none', label: '✕ 없음' },
                { v: 'fade', label: '○ 페이드' },
                { v: 'zoom-in', label: '⊕ 줌인' },
                { v: 'close-up', label: '◉ 클로즈업' },
                { v: 'slide-top', label: '↓ 위에서' },
                { v: 'slide-bottom', label: '↑ 아래에서' },
                { v: 'slide-left', label: '→ 왼쪽에서' },
                { v: 'slide-right', label: '← 오른쪽에서' },
                { v: 'scale-up', label: '⤢ 확대' },
              ] as const
            ).map((opt) => {
              const active = (slide.entryEffect ?? 'none') === opt.v;
              return (
                <button
                  key={opt.v}
                  onClick={() => onChange({ entryEffect: opt.v as any })}
                  style={{
                    background: active ? accentColor : 'transparent',
                    color: active ? '#0f1c2e' : '#a4adba',
                    border: active ? 0 : '1px solid #2a3140',
                    borderRadius: 5,
                    padding: '6px 4px',
                    fontSize: 10.5,
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
        </Field>
      )}

      {/* Heading is universal — textarea so Enter = line break in slide */}
      <Field label="제목 (heading)">
        <textarea
          id="heading-input"
          value={slide.heading}
          onChange={(e) => onChange({ heading: e.target.value })}
          rows={slide.heading.includes('\n') ? slide.heading.split('\n').length + 1 : 2}
          placeholder="Enter 키로 줄바꿈 — 슬라이드에 그대로 반영됩니다"
          style={{ ...fieldStyle, resize: 'vertical', lineHeight: 1.6 }}
        />
        <div style={{ fontSize: 10, color: '#7d8696', marginTop: 4 }}>
          💡 Enter로 줄바꿈 가능 — 긴 제목은 원하는 위치에서 직접 나눠보세요
        </div>
      </Field>

      {/* Subheading on most types */}
      {['cover', 'welcome', 'event', 'invitation'].includes(slide.type) && (
        <Field label="부제 (subheading)">
          <textarea
            value={slide.subheading ?? ''}
            onChange={(e) => onChange({ subheading: e.target.value })}
            rows={2}
            style={{ ...fieldStyle, resize: 'vertical', lineHeight: 1.6 }}
          />
        </Field>
      )}

      {/* Bullets for welcome / event */}
      {(slide.type === 'welcome' || slide.type === 'event') && (
        <Field label="포인트 (bullets)">
          <BulletEditor
            items={slide.bullets ?? []}
            onChange={(items) => onChange({ bullets: items })}
          />
        </Field>
      )}

      {/* Worship times */}
      {slide.type === 'worship-times' && (
        <Field label="예배 (services)">
          <ServiceEditor
            items={slide.services ?? []}
            onChange={(services) => onChange({ services })}
          />
        </Field>
      )}

      {/* Programs */}
      {slide.type === 'programs' && (
        <Field label="사역 (programs)">
          <ProgramEditor
            items={slide.programs ?? []}
            onChange={(programs) => onChange({ programs })}
          />
        </Field>
      )}

      {/* Pastor */}
      {slide.type === 'pastor' && (
        <>
          <Field label="이름">
            <input
              value={slide.pastorName ?? ''}
              onChange={(e) => onChange({ pastorName: e.target.value })}
              style={fieldStyle}
            />
          </Field>
          <Field label="직책">
            <input
              value={slide.pastorTitle ?? ''}
              onChange={(e) => onChange({ pastorTitle: e.target.value })}
              style={fieldStyle}
            />
          </Field>
          <Field label="한 줄 메시지">
            <textarea
              value={slide.pastorMessage ?? ''}
              onChange={(e) => onChange({ pastorMessage: e.target.value })}
              rows={3}
              style={{ ...fieldStyle, resize: 'vertical' }}
            />
          </Field>
        </>
      )}

      {/* Event */}
      {slide.type === 'event' && (
        <>
          <Field label="날짜">
            <input
              value={slide.eventDate ?? ''}
              onChange={(e) => onChange({ eventDate: e.target.value })}
              style={fieldStyle}
              placeholder="2025-12-24 오후 7시"
            />
          </Field>
          <Field label="장소">
            <input
              value={slide.eventLocation ?? ''}
              onChange={(e) => onChange({ eventLocation: e.target.value })}
              style={fieldStyle}
            />
          </Field>
        </>
      )}

      {/* Verse */}
      {slide.type === 'verse' && (
        <>
          <Field label="말씀 본문">
            <textarea
              value={slide.verse ?? ''}
              onChange={(e) => onChange({ verse: e.target.value })}
              rows={4}
              style={{ ...fieldStyle, resize: 'vertical' }}
            />
          </Field>
          <Field label="출처 (요한복음 3:16)">
            <input
              value={slide.verseRef ?? ''}
              onChange={(e) => onChange({ verseRef: e.target.value })}
              style={fieldStyle}
            />
          </Field>
        </>
      )}

      {/* Location */}
      {slide.type === 'location' && (
        <>
          <Field label="주소">
            <textarea
              value={slide.address ?? ''}
              onChange={(e) => onChange({ address: e.target.value })}
              rows={2}
              style={{ ...fieldStyle, resize: 'vertical' }}
            />
          </Field>
          <Field label="교통">
            <textarea
              value={slide.transit ?? ''}
              onChange={(e) => onChange({ transit: e.target.value })}
              rows={2}
              style={{ ...fieldStyle, resize: 'vertical' }}
            />
          </Field>
        </>
      )}

      {/* Contact */}
      {slide.type === 'contact' && (
        <>
          <Field label="전화">
            <input
              value={slide.phone ?? ''}
              onChange={(e) => onChange({ phone: e.target.value })}
              style={fieldStyle}
            />
          </Field>
          <Field label="홈페이지">
            <input
              value={slide.website ?? ''}
              onChange={(e) => onChange({ website: e.target.value })}
              style={fieldStyle}
            />
          </Field>
          <Field label="SNS (한 줄에 하나)">
            <BulletEditor
              items={slide.socials ?? []}
              onChange={(socials) => onChange({ socials })}
            />
          </Field>
        </>
      )}

      {/* Invitation */}
      {slide.type === 'invitation' && (
        <Field label="CTA 버튼 문구">
          <input
            value={slide.cta ?? ''}
            onChange={(e) => onChange({ cta: e.target.value })}
            style={fieldStyle}
          />
        </Field>
      )}

      {/* Gallery urls for gallery type */}
      {slide.type === 'gallery' && (
        <Field label="갤러리 사진 목록 (3~6장)">
          <GalleryUrlsEditor
            urls={slide.galleryUrls ?? []}
            accentColor={accentColor}
            onChange={(urls) => onChange({ galleryUrls: urls })}
          />
        </Field>
      )}

      {/* Media — universal, with upload + stock search (hide for gallery slide) */}
      {slide.type !== 'gallery' && (
        <div style={{ borderTop: '1px solid #232a36', paddingTop: 14 }}>
          <span style={labelStyle}>배경 미디어</span>
          <MediaPicker
            mediaUrl={slide.mediaUrl}
            mediaType={slide.mediaType}
            imageSearchQuery={slide.imageSearchQuery}
            accentColor={accentColor}
            onChange={(next) => onChange(next)}
          />
        </div>
      )}

      {/* 상세 디자인 조절 (글자/카드/사진 크기 및 위치) */}
      <div style={{ borderTop: '1px solid #232a36', paddingTop: 14, display: 'flex', flexDirection: 'column', gap: 12 }}>
        <span style={labelStyle}>상세 디자인 조절</span>
        
        <Field label={`글자 크기 조절 — ${Math.round((slide.textScale ?? 1.0) * 100)}%`}>
          <input
            type="range"
            min={0.4}
            max={2.5}
            step={0.05}
            value={slide.textScale ?? 1.0}
            onChange={(e) => onChange({ textScale: parseFloat(e.target.value) })}
            style={{ width: '100%', accentColor }}
          />
        </Field>

        <Field label={`배경 카드 크기 조절 — ${Math.round((slide.cardScale ?? 1.0) * 100)}%`}>
          <input
            type="range"
            min={0.4}
            max={2.5}
            step={0.05}
            value={slide.cardScale ?? 1.0}
            onChange={(e) => onChange({ cardScale: parseFloat(e.target.value) })}
            style={{ width: '100%', accentColor }}
          />
        </Field>

        {slide.type !== 'gallery' && (slide.mediaUrl || slide.mediaDataUri) && (
          <>
            <Field label={`배경 어두움 (오버레이 투명도) — ${Math.round((slide.bgOverlayOpacity ?? 0.74) * 100)}%`}>
              <input
                type="range"
                min={0.0}
                max={1.0}
                step={0.02}
                value={slide.bgOverlayOpacity ?? 0.74}
                onChange={(e) => onChange({ bgOverlayOpacity: parseFloat(e.target.value) })}
                style={{ width: '100%', accentColor }}
              />
            </Field>

            <Field label={`사진 크기 (줌) — ${Math.round((slide.imageScale ?? 1.0) * 100)}%`}>
              <input
                type="range"
                min={0.5}
                max={3.0}
                step={0.05}
                value={slide.imageScale ?? 1.0}
                onChange={(e) => onChange({ imageScale: parseFloat(e.target.value) })}
                style={{ width: '100%', accentColor }}
              />
            </Field>

            <Field label={`사진 가로 이동 — ${slide.imageX ?? 0}px`}>
              <input
                type="range"
                min={-1000}
                max={1000}
                step={5}
                value={slide.imageX ?? 0}
                onChange={(e) => onChange({ imageX: parseInt(e.target.value, 10) })}
                style={{ width: '100%', accentColor }}
              />
            </Field>

            <Field label={`사진 세로 이동 — ${slide.imageY ?? 0}px`}>
              <input
                type="range"
                min={-1000}
                max={1000}
                step={5}
                value={slide.imageY ?? 0}
                onChange={(e) => onChange({ imageY: parseInt(e.target.value, 10) })}
                style={{ width: '100%', accentColor }}
              />
            </Field>
          </>
        )}
      </div>

      {/* Speaker note + duration */}
      <Field label="내레이션 (TTS)">
        <textarea
          value={slide.speakerNote}
          onChange={(e) => onChange({ speakerNote: e.target.value })}
          rows={3}
          style={{ ...fieldStyle, resize: 'vertical' }}
        />
      </Field>
      <Field label={`재생 시간 — ${(slide.durationSec ?? 6).toFixed(1)}초`}>
        <input
          type="range"
          min={1.5}
          max={20}
          step={0.5}
          value={slide.durationSec ?? 6}
          onChange={(e) => onChange({ durationSec: parseFloat(e.target.value) })}
          style={{ width: '100%', accentColor }}
        />
      </Field>
    </div>
  );
};

const Field: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <div>
    <span style={labelStyle}>{label}</span>
    {children}
  </div>
);

const BulletEditor: React.FC<{ items: string[]; onChange: (items: string[]) => void }> = ({
  items,
  onChange,
}) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
    {items.map((it, i) => (
      <div key={i} style={{ display: 'flex', gap: 6 }}>
        <input
          value={it}
          onChange={(e) => {
            const next = [...items];
            next[i] = e.target.value;
            onChange(next);
          }}
          style={fieldStyle}
        />
        <button
          onClick={() => onChange(items.filter((_, j) => j !== i))}
          style={{
            background: 'transparent',
            border: '1px solid #2a3140',
            color: '#a4adba',
            borderRadius: 4,
            padding: '0 10px',
            cursor: 'pointer',
          }}
        >
          ✕
        </button>
      </div>
    ))}
    <button
      onClick={() => onChange([...items, ''])}
      style={{
        background: 'transparent',
        border: '1px dashed #2a3140',
        color: '#7d8696',
        borderRadius: 4,
        padding: '6px 0',
        fontSize: 12,
        cursor: 'pointer',
      }}
    >
      + 항목 추가
    </button>
  </div>
);

const ServiceEditor: React.FC<{
  items: { name: string; schedule: string; place?: string }[];
  onChange: (items: { name: string; schedule: string; place?: string }[]) => void;
}> = ({ items, onChange }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
    {items.map((it, i) => (
      <div
        key={i}
        style={{
          background: '#0f1216',
          border: '1px solid #232a36',
          borderRadius: 6,
          padding: 8,
          display: 'flex',
          flexDirection: 'column',
          gap: 6,
        }}
      >
        <input
          value={it.name}
          placeholder="예배 이름"
          onChange={(e) => {
            const next = [...items];
            next[i] = { ...it, name: e.target.value };
            onChange(next);
          }}
          style={{ ...fieldStyle, padding: '6px 8px' }}
        />
        <input
          value={it.schedule}
          placeholder="시간 (예: 주일 오전 11:00)"
          onChange={(e) => {
            const next = [...items];
            next[i] = { ...it, schedule: e.target.value };
            onChange(next);
          }}
          style={{ ...fieldStyle, padding: '6px 8px' }}
        />
        <input
          value={it.place ?? ''}
          placeholder="장소 (선택)"
          onChange={(e) => {
            const next = [...items];
            next[i] = { ...it, place: e.target.value };
            onChange(next);
          }}
          style={{ ...fieldStyle, padding: '6px 8px' }}
        />
        <button
          onClick={() => onChange(items.filter((_, j) => j !== i))}
          style={{
            background: 'transparent',
            border: '1px solid #2a3140',
            color: '#a4adba',
            borderRadius: 4,
            padding: '4px 8px',
            cursor: 'pointer',
            fontSize: 11,
            alignSelf: 'flex-end',
          }}
        >
          삭제
        </button>
      </div>
    ))}
    <button
      onClick={() => onChange([...items, { name: '', schedule: '' }])}
      style={{
        background: 'transparent',
        border: '1px dashed #2a3140',
        color: '#7d8696',
        borderRadius: 4,
        padding: '6px 0',
        fontSize: 12,
        cursor: 'pointer',
      }}
    >
      + 예배 추가
    </button>
  </div>
);

const ProgramEditor: React.FC<{
  items: { title: string; description: string; schedule?: string }[];
  onChange: (items: { title: string; description: string; schedule?: string }[]) => void;
}> = ({ items, onChange }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
    {items.map((it, i) => (
      <div
        key={i}
        style={{
          background: '#0f1216',
          border: '1px solid #232a36',
          borderRadius: 6,
          padding: 8,
          display: 'flex',
          flexDirection: 'column',
          gap: 6,
        }}
      >
        <input
          value={it.title}
          placeholder="이름 (예: 청년부)"
          onChange={(e) => {
            const next = [...items];
            next[i] = { ...it, title: e.target.value };
            onChange(next);
          }}
          style={{ ...fieldStyle, padding: '6px 8px' }}
        />
        <input
          value={it.description}
          placeholder="한 줄 설명"
          onChange={(e) => {
            const next = [...items];
            next[i] = { ...it, description: e.target.value };
            onChange(next);
          }}
          style={{ ...fieldStyle, padding: '6px 8px' }}
        />
        <input
          value={it.schedule ?? ''}
          placeholder="시간 (선택)"
          onChange={(e) => {
            const next = [...items];
            next[i] = { ...it, schedule: e.target.value };
            onChange(next);
          }}
          style={{ ...fieldStyle, padding: '6px 8px' }}
        />
        <button
          onClick={() => onChange(items.filter((_, j) => j !== i))}
          style={{
            background: 'transparent',
            border: '1px solid #2a3140',
            color: '#a4adba',
            borderRadius: 4,
            padding: '4px 8px',
            cursor: 'pointer',
            fontSize: 11,
            alignSelf: 'flex-end',
          }}
        >
          삭제
        </button>
      </div>
    ))}
    <button
      onClick={() => onChange([...items, { title: '', description: '' }])}
      style={{
        background: 'transparent',
        border: '1px dashed #2a3140',
        color: '#7d8696',
        borderRadius: 4,
        padding: '6px 0',
        fontSize: 12,
        cursor: 'pointer',
      }}
    >
      + 사역 추가
    </button>
  </div>
);
