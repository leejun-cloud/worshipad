'use client';

import { useRef, useState } from 'react';
import type { PinnedBadge } from './types';

interface Props {
  badge?: PinnedBadge;
  defaultText: string;
  accentColor: string;
  onChange: (badge: PinnedBadge) => void;
  onClose: () => void;
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
  boxSizing: 'border-box',
};

const labelStyle: React.CSSProperties = {
  fontSize: 11,
  color: '#7d8696',
  fontWeight: 600,
  letterSpacing: '0.04em',
  textTransform: 'uppercase',
  marginBottom: 6,
  display: 'block',
};

const POSITIONS: { value: PinnedBadge['position']; label: string }[] = [
  { value: 'top-right', label: '↗ 우측 상단' },
  { value: 'top-left', label: '↖ 좌측 상단' },
  { value: 'bottom-right', label: '↘ 우측 하단' },
  { value: 'bottom-left', label: '↙ 좌측 하단' },
];

// Send the file to /api/church-ad/upload and return the persisted URL
// (e.g. "/uploads/abc.png"). Avoids stuffing base64 into localStorage.
const uploadFile = async (f: File): Promise<string> => {
  const fd = new FormData();
  fd.set('file', f);
  const res = await fetch('/api/church-ad/upload', { method: 'POST', body: fd });
  const j = await res.json();
  if (!res.ok) throw new Error(j.error || 'upload failed');
  return j.url as string;
};

export const BadgePanel: React.FC<Props> = ({
  badge,
  defaultText,
  accentColor,
  onChange,
  onClose,
}) => {
  // `cur` is what we render. When `badge` isn't saved yet we synthesise a
  // display object using `defaultText`, BUT the saved object — what `patch`
  // composes against — must NOT carry that fallback or we'd lock the badge to
  // a stale churchName the moment the user toggles position/show.
  const saved: PinnedBadge = badge ?? { show: true, position: 'top-right' };
  const cur: PinnedBadge = badge ?? {
    show: true,
    text: defaultText,
    position: 'top-right',
  };
  const logoRef = useRef<HTMLInputElement>(null);
  const photoRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState<string | null>(null);

  // Compose patches against the *saved* state (not display), so leaving the
  // text input untouched keeps `text` undefined and the rendered badge keeps
  // tracking project.churchName automatically.
  const patch = (p: Partial<PinnedBadge>) => onChange({ ...saved, ...p });

  const isAutoTracking = !saved.text || saved.text === defaultText;

  const [err, setErr] = useState<string | null>(null);

  const handleLogoFile = async (f: File) => {
    setBusy('로고 업로드…');
    setErr(null);
    try {
      const url = await uploadFile(f);
      patch({ logoUrl: url, logoDataUri: undefined });
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setBusy(null);
    }
  };

  const handlePhotoFile = async (f: File) => {
    setBusy('사진 업로드…');
    setErr(null);
    try {
      const url = await uploadFile(f);
      patch({ photoUrl: url, photoDataUri: undefined });
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
        gap: 14,
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div
            style={{
              color: accentColor,
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
            }}
          >
            📌 고정 배지 (모든 슬라이드)
          </div>
          <div style={{ color: '#a4adba', fontSize: 12, marginTop: 4 }}>
            교회 이름·로고·사진을 한 번 설정하면 모든 슬라이드에 동일하게 표시됩니다.
          </div>
        </div>
        <button
          onClick={onClose}
          style={{ background: 'transparent', border: 0, color: '#7d8696', fontSize: 18, cursor: 'pointer' }}
        >
          ×
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14 }}>
        <div>
          <span style={labelStyle}>
            배지 텍스트{' '}
            {isAutoTracking && (
              <span style={{ color: accentColor, fontWeight: 700, marginLeft: 4 }}>
                · 자동(교회이름 따라감)
              </span>
            )}
          </span>
          <input
            value={saved.text ?? ''}
            placeholder={`${defaultText} (자동)`}
            onChange={(e) => patch({ text: e.target.value || undefined })}
            style={fieldStyle}
          />
          {!isAutoTracking && (
            <button
              onClick={() => patch({ text: undefined })}
              style={{
                marginTop: 4,
                background: 'transparent',
                border: 0,
                color: accentColor,
                fontSize: 11,
                cursor: 'pointer',
                padding: 0,
              }}
            >
              ↻ 교회이름 자동 추적으로 되돌리기
            </button>
          )}
        </div>
        <div>
          <span style={labelStyle}>위치</span>
          <select
            value={cur.position}
            onChange={(e) => patch({ position: e.target.value as PinnedBadge['position'] })}
            style={{ ...fieldStyle, height: 36 }}
          >
            {POSITIONS.map((p) => (
              <option key={p.value} value={p.value}>
                {p.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <span style={labelStyle}>표시</span>
          <button
            onClick={() => patch({ show: !cur.show })}
            style={{
              ...fieldStyle,
              cursor: 'pointer',
              fontWeight: 700,
              background: cur.show ? `${accentColor}33` : '#0f1216',
              borderColor: cur.show ? accentColor : '#232a36',
              color: cur.show ? accentColor : '#7d8696',
            }}
          >
            {cur.show ? '✓ 모든 슬라이드에 표시' : '✕ 숨김'}
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        <div>
          <span style={labelStyle}>로고 (square, ≤500KB)</span>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <button
              onClick={() => logoRef.current?.click()}
              style={{
                background: '#0f1216',
                border: `1px dashed ${accentColor}77`,
                color: '#dde3ec',
                padding: '12px 14px',
                borderRadius: 6,
                cursor: 'pointer',
                fontSize: 12,
                flex: 1,
              }}
            >
              {cur.logoUrl || cur.logoDataUri ? '🔁 다른 로고 선택' : '📁 로고 업로드'}
            </button>
            {(cur.logoUrl || cur.logoDataUri) && (
              <>
                <img
                  src={(cur.logoUrl ?? cur.logoDataUri)!}
                  alt="logo"
                  style={{ width: 40, height: 40, objectFit: 'contain', background: '#0f1216', borderRadius: 4 }}
                />
                <button
                  onClick={() => patch({ logoUrl: undefined, logoDataUri: undefined })}
                  style={{
                    background: 'transparent',
                    border: '1px solid #2a3140',
                    color: '#a4adba',
                    borderRadius: 4,
                    padding: '6px 10px',
                    fontSize: 11,
                    cursor: 'pointer',
                  }}
                >
                  제거
                </button>
              </>
            )}
            <input
              ref={logoRef}
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleLogoFile(f);
              }}
            />
          </div>
        </div>
        <div>
          <span style={labelStyle}>사진 (목회자/공동체, 둥근 썸네일)</span>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <button
              onClick={() => photoRef.current?.click()}
              style={{
                background: '#0f1216',
                border: `1px dashed ${accentColor}77`,
                color: '#dde3ec',
                padding: '12px 14px',
                borderRadius: 6,
                cursor: 'pointer',
                fontSize: 12,
                flex: 1,
              }}
            >
              {cur.photoUrl || cur.photoDataUri ? '🔁 다른 사진 선택' : '📁 사진 업로드'}
            </button>
            {(cur.photoUrl || cur.photoDataUri) && (
              <>
                <img
                  src={(cur.photoUrl ?? cur.photoDataUri)!}
                  alt="photo"
                  style={{ width: 40, height: 40, objectFit: 'cover', borderRadius: '50%' }}
                />
                <button
                  onClick={() => patch({ photoUrl: undefined, photoDataUri: undefined })}
                  style={{
                    background: 'transparent',
                    border: '1px solid #2a3140',
                    color: '#a4adba',
                    borderRadius: 4,
                    padding: '6px 10px',
                    fontSize: 11,
                    cursor: 'pointer',
                  }}
                >
                  제거
                </button>
              </>
            )}
            <input
              ref={photoRef}
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handlePhotoFile(f);
              }}
            />
          </div>
        </div>
      </div>

      {busy && <span style={{ color: accentColor, fontSize: 11 }}>{busy}</span>}
      {err && !busy && (
        <span style={{ color: '#e87474', fontSize: 11 }}>⚠ {err}</span>
      )}
    </div>
  );
};
