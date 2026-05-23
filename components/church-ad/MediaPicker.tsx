'use client';

import { useRef, useState } from 'react';

interface Props {
  mediaUrl?: string;
  mediaType?: 'image' | 'video';
  imageSearchQuery?: string;
  accentColor: string;
  onChange: (
    next: { mediaUrl?: string; mediaDataUri?: string; mediaType: 'image' | 'video'; imageSearchQuery?: string }
  ) => void;
}

export const MediaPicker: React.FC<Props> = ({
  mediaUrl,
  mediaType = 'image',
  imageSearchQuery,
  accentColor,
  onChange,
}) => {
  const fileRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [query, setQuery] = useState(imageSearchQuery ?? '');

  const handleFile = async (file: File) => {
    setBusy('업로드 중…');
    setErr(null);
    try {
      const fd = new FormData();
      fd.set('file', file);
      const res = await fetch('/api/church-ad/upload', { method: 'POST', body: fd });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error || 'upload failed');
      onChange({ mediaUrl: j.url, mediaType: j.mediaType, mediaDataUri: undefined });
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setBusy(null);
    }
  };

  const handleStockSearch = async () => {
    if (!query.trim()) return;
    setBusy('검색 중…');
    setErr(null);
    try {
      const res = await fetch(`/api/church-ad/photo-search?q=${encodeURIComponent(query)}`);
      const j = await res.json();
      if (!res.ok) throw new Error(j.error || 'search failed');
      if (!j.media) {
        setErr('검색 결과 없음');
      } else {
        onChange({
          mediaUrl: j.media.url,
          mediaDataUri: undefined,
          mediaType: j.media.mediaType,
          imageSearchQuery: query,
        });
      }
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setBusy(null);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          const f = e.dataTransfer.files[0];
          if (f) handleFile(f);
        }}
        style={{
          border: `1px dashed ${accentColor}88`,
          borderRadius: 10,
          padding: 16,
          textAlign: 'center',
          background: '#0f1216',
          cursor: 'pointer',
          color: '#c5cdd9',
          fontSize: 12,
        }}
        onClick={() => fileRef.current?.click()}
      >
        {mediaUrl ? (
          mediaType === 'video' ? (
            <video
              src={mediaUrl}
              muted
              loop
              autoPlay
              playsInline
              style={{ width: '100%', borderRadius: 6, maxHeight: 180, objectFit: 'cover' }}
            />
          ) : (
            <img
              src={mediaUrl}
              alt=""
              style={{ width: '100%', borderRadius: 6, maxHeight: 180, objectFit: 'cover' }}
            />
          )
        ) : (
          <div>
            <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 6 }}>클릭 또는 드롭</div>
            <div>jpg · png · webp · mp4 · webm  (최대 80MB)</div>
          </div>
        )}
        <input
          ref={fileRef}
          type="file"
          accept="image/*,video/mp4,video/webm,video/quicktime"
          style={{ display: 'none' }}
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) handleFile(f);
          }}
        />
      </div>

      <div style={{ display: 'flex', gap: 6 }}>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Pixabay/Pexels 키워드 (영문)"
          style={{
            flex: 1,
            background: '#0f1216',
            border: '1px solid #232a36',
            color: '#fff',
            borderRadius: 6,
            padding: '8px 10px',
            fontSize: 12,
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleStockSearch();
          }}
        />
        <button
          onClick={handleStockSearch}
          disabled={!!busy}
          style={{
            background: '#232a36',
            color: '#fff',
            border: '1px solid #2c3340',
            borderRadius: 6,
            padding: '8px 12px',
            fontSize: 12,
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          검색
        </button>
      </div>

      {mediaUrl || query ? (
        <button
          onClick={() => {
            onChange({ mediaUrl: undefined, mediaDataUri: undefined, mediaType: 'image' });
            setQuery('');
          }}
          style={{
            background: 'transparent',
            color: '#7d8696',
            border: '1px solid #2a3140',
            borderRadius: 6,
            padding: '6px 12px',
            fontSize: 11,
            cursor: 'pointer',
          }}
        >
          미디어 제거
        </button>
      ) : null}

      {busy && <div style={{ color: accentColor, fontSize: 11 }}>{busy}</div>}
      {err && <div style={{ color: '#e87474', fontSize: 11 }}>⚠ {err}</div>}
    </div>
  );
};
