'use client';

import { useState } from 'react';
import { type ChurchAdProject, type ChurchAdSlide, SLIDE_TYPE_ICONS } from './types';

type EditingTarget = {
  slideIndex: number;
  field: 'heading' | 'subheading' | 'cta' | 'verseRef' | 'speakerNote' | 'mission';
  initial: string;
} | null;

interface Props {
  project: ChurchAdProject;
  selected: number;
  onSelect: (i: number) => void;
  onSlideChange: (i: number, patch: Partial<ChurchAdSlide>) => void;
  accentColor: string;
}

type LayerKey = 'bgm' | 'tts' | 'media' | 'text' | 'overlay';

interface CustomLayer {
  id: string;
  name: string;
  color: string;
}

const PX_PER_SEC = 30;
const ROW_HEIGHT = 56;
const RULER_HEIGHT = 24;
const SLIDE_HEAD_HEIGHT = 26;
const LABEL_W = 130;

const baseLayers: { key: LayerKey; label: string; color: string; icon: string }[] = [
  { key: 'media', label: '배경 미디어', color: '#5a8dee', icon: '🖼' },
  { key: 'text', label: '텍스트', color: '#d4a657', icon: '✎' },
  { key: 'overlay', label: '오버레이', color: '#a872d4', icon: '◇' },
  { key: 'tts', label: '나레이션 (TTS)', color: '#5cb85c', icon: '🎙' },
  { key: 'bgm', label: '배경 음악', color: '#e87474', icon: '🎵' },
];

export const LayerTimeline: React.FC<Props> = ({
  project,
  selected,
  onSelect,
  onSlideChange,
  accentColor,
}) => {
  const [customLayers, setCustomLayers] = useState<CustomLayer[]>([]);
  const [hidden, setHidden] = useState<Set<string>>(new Set());
  const [editing, setEditing] = useState<EditingTarget>(null);
  const [editValue, setEditValue] = useState('');
  // Live feedback while wheel-resizing.
  const [wheelHint, setWheelHint] = useState<{
    slideIndex: number;
    layerKey: string;
    label: string;
  } | null>(null);

  const startEdit = (slideIndex: number, field: NonNullable<EditingTarget>['field'], initial: string) => {
    onSelect(slideIndex);
    setEditing({ slideIndex, field, initial });
    setEditValue(initial);
  };
  const commitEdit = () => {
    if (!editing) return;
    onSlideChange(editing.slideIndex, { [editing.field]: editValue || undefined } as Partial<ChurchAdSlide>);
    setEditing(null);
  };
  const cancelEdit = () => setEditing(null);

  const clampScale = (v: number) => Math.max(0.4, Math.min(2.5, v));
  const clampDur = (v: number) => Math.max(1.5, Math.min(20, v));

  /** Adjust the right field for this layer in response to a wheel event. */
  const handleWheel = (
    e: any,
    slideIndex: number,
    layerKey: string
  ) => {
    const slide = project.slides[slideIndex];
    if (!slide) return;
    
    if (layerKey === 'text') {
      const delta = -e.deltaY * 0.001;
      const next = clampScale((slide.textScale ?? 1) + delta);
      onSlideChange(slideIndex, { textScale: next });
      setWheelHint({
        slideIndex,
        layerKey,
        label: `글자 크기 ${Math.round(next * 100)}%`,
      });
    } else if (layerKey === 'overlay') {
      const delta = -e.deltaY * 0.001;
      const next = clampScale((slide.cardScale ?? 1) + delta);
      onSlideChange(slideIndex, { cardScale: next });
      setWheelHint({
        slideIndex,
        layerKey,
        label: `배경 카드 크기 ${Math.round(next * 100)}%`,
      });
    } else if (layerKey === 'tts') {
      const delta = -e.deltaY * 0.01;
      const next = Math.round(clampDur((slide.durationSec ?? 6) + delta) * 10) / 10;
      onSlideChange(slideIndex, { durationSec: next });
      setWheelHint({ slideIndex, layerKey, label: `${next.toFixed(1)}초` });
    }
    // Auto-hide hint after a moment.
    setTimeout(() => {
      setWheelHint((prev) =>
        prev && prev.slideIndex === slideIndex && prev.layerKey === layerKey ? null : prev
      );
    }, 1200);
  };

  const sceneDurations =
    project.sceneDurationsSec && project.sceneDurationsSec.length === project.slides.length
      ? project.sceneDurationsSec
      : project.slides.map((s) => s.durationSec ?? 6);
  const totalSec = sceneDurations.reduce((a, b) => a + b, 0);

  const slideStart = (idx: number) =>
    sceneDurations.slice(0, idx).reduce((a, b) => a + b, 0);

  const trackWidth = Math.max(totalSec * PX_PER_SEC, 600);

  const allLayers = [
    ...baseLayers,
    ...customLayers.map((l) => ({ key: `custom:${l.id}` as const, label: l.name, color: l.color, icon: '✦' })),
  ];

  const visibleLayers = allLayers.filter((l) => !hidden.has(l.key));

  const renderClipForLayer = (layer: typeof allLayers[number], slide: ChurchAdSlide, i: number) => {
    const start = slideStart(i);
    const dur = sceneDurations[i];
    const left = start * PX_PER_SEC;
    const w = Math.max(dur * PX_PER_SEC - 2, 24);
    const isSelected = i === selected;

    let label = '';
    let preview: React.ReactNode = null;

    switch (layer.key) {
      case 'media': {
        const src = slide.mediaDataUri ?? slide.mediaUrl;
        label = src ? (slide.mediaType === 'video' ? '🎬 비디오' : '🖼 사진') : '— 비어있음';
        preview = src ? (
          slide.mediaType === 'video' ? (
            <video
              src={src}
              muted
              style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.55 }}
            />
          ) : (
            <img
              src={src}
              alt=""
              style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.55 }}
            />
          )
        ) : null;
        break;
      }
      case 'text':
        label = slide.heading || '(제목 없음)';
        break;
      case 'overlay':
        label =
          slide.subheading ||
          slide.cta ||
          slide.verseRef ||
          slide.mission ||
          '— 없음';
        break;
      case 'tts':
        label = slide.speakerNote ? `🎙 ${slide.speakerNote.slice(0, 28)}${slide.speakerNote.length > 28 ? '…' : ''}` : '— 없음';
        break;
      case 'bgm':
        // BGM is one continuous clip across all slides — only render on first slide.
        if (i !== 0) return null;
        return (
          <div
            key={`bgm-${i}`}
            onClick={() => onSelect(0)}
            style={{
              position: 'absolute',
              left: 0,
              top: 6,
              bottom: 6,
              width: trackWidth,
              borderRadius: 6,
              background: project.bgmDataUri
                ? `repeating-linear-gradient(135deg, ${layer.color}40, ${layer.color}40 6px, ${layer.color}55 6px, ${layer.color}55 12px)`
                : '#181c24',
              border: project.bgmDataUri ? `1px solid ${layer.color}` : '1px dashed #2a3140',
              padding: '4px 10px',
              display: 'flex',
              alignItems: 'center',
              fontSize: 11,
              color: '#fff',
              fontWeight: 600,
              cursor: 'pointer',
              boxSizing: 'border-box',
            }}
          >
            🎵 {project.bgmDataUri
              ? `BGM (${totalSec.toFixed(1)}s)`
              : '— 음성 + BGM 생성 버튼을 눌러주세요'}
          </div>
        );
      default:
        if (layer.key.startsWith('custom:')) {
          label = '+ 커스텀';
        }
    }

    // Map layer kind → which slide field we'd edit if user double-clicks.
    const editableField: NonNullable<EditingTarget>['field'] | null =
      layer.key === 'text'
        ? 'heading'
        : layer.key === 'tts'
        ? 'speakerNote'
        : layer.key === 'overlay'
        ? slide.type === 'invitation'
          ? 'cta'
          : slide.type === 'verse'
          ? 'verseRef'
          : slide.type === 'mission'
          ? 'mission'
          : 'subheading'
        : null;

    const isEditingHere =
      editing?.slideIndex === i && editing.field === editableField;

    const wheelEnabled =
      layer.key === 'text' || layer.key === 'overlay' || layer.key === 'tts';
    const isHinting =
      wheelHint?.slideIndex === i && wheelHint.layerKey === layer.key;

    return (
      <div
        key={`${layer.key}-${i}`}
        ref={(el) => {
          if (!el) return;
          if (wheelEnabled) {
            el.onwheel = (e) => {
              e.preventDefault();
              e.stopPropagation();
              handleWheel(e, i, layer.key);
            };
          } else {
            el.onwheel = null;
          }
        }}
        onClick={() => onSelect(i)}
        onDoubleClick={(e) => {
          if (!editableField) return;
          e.stopPropagation();
          const initial = (slide[editableField] as string | undefined) ?? '';
          startEdit(i, editableField, initial);
        }}
        title={
          editableField
            ? wheelEnabled
              ? '더블클릭 = 텍스트 수정 · 휠 스크롤 = 크기 조정'
              : '더블클릭해서 수정'
            : wheelEnabled
            ? '휠 스크롤로 시간 조정'
            : undefined
        }
        style={{
          position: 'absolute',
          left,
          top: 6,
          bottom: 6,
          width: w,
          borderRadius: 6,
          background: layer.color + (isSelected ? 'cc' : '55'),
          border: isSelected ? `2px solid ${layer.color}` : `1px solid ${layer.color}80`,
          padding: '4px 8px',
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          fontSize: 11,
          color: '#fff',
          fontWeight: 600,
          cursor: editableField ? 'text' : 'pointer',
          overflow: 'hidden',
          boxSizing: 'border-box',
          textShadow: '0 1px 2px rgba(0,0,0,0.5)',
          zIndex: isEditingHere ? 10 : 1,
        }}
      >
        {preview && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              borderRadius: 6,
              overflow: 'hidden',
              zIndex: 0,
            }}
          >
            {preview}
          </div>
        )}
        {isEditingHere ? (
          <textarea
            autoFocus
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onBlur={commitEdit}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                commitEdit();
              } else if (e.key === 'Escape') {
                e.preventDefault();
                cancelEdit();
              }
            }}
            onClick={(e) => e.stopPropagation()}
            style={{
              position: 'relative',
              zIndex: 2,
              flex: 1,
              minWidth: 0,
              minHeight: 0,
              background: 'rgba(15,18,22,0.92)',
              color: '#fff',
              border: `1px solid ${accentColor}`,
              borderRadius: 4,
              padding: '4px 6px',
              fontSize: 12,
              fontFamily: 'inherit',
              fontWeight: 500,
              resize: 'none',
              outline: 'none',
            }}
          />
        ) : (
          <span
            style={{
              position: 'relative',
              zIndex: 1,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {label}
          </span>
        )}

        {isHinting && (
          <div
            style={{
              position: 'absolute',
              top: -26,
              left: 0,
              background: accentColor,
              color: '#0f1c2e',
              fontSize: 11,
              fontWeight: 800,
              padding: '3px 8px',
              borderRadius: 4,
              whiteSpace: 'nowrap',
              pointerEvents: 'none',
              boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
              zIndex: 100,
            }}
          >
            {wheelHint!.label}
          </div>
        )}
      </div>
    );
  };

  return (
    <div
      style={{
        background: '#0f1216',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '10px 14px',
          borderBottom: '1px solid #1c2028',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ color: '#fff', fontWeight: 700, fontSize: 13 }}>레이어 타임라인</span>
          <span style={{ color: '#7d8696', fontSize: 12 }}>
            {project.slides.length}개 슬라이드 · 총 {totalSec.toFixed(1)}초
          </span>
          <span style={{ color: '#5a6470', fontSize: 11 }}>
            ✎ 더블클릭 = 텍스트 수정 · 🖱 휠 = 글자 크기/시간 조정 · ⌘/Ctrl+Enter 저장
          </span>
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          <button
            onClick={() => {
              const id = crypto.randomUUID();
              setCustomLayers((prev) => [
                ...prev,
                { id, name: `레이어 ${prev.length + 1}`, color: '#7baaff' },
              ]);
            }}
            style={{
              background: 'transparent',
              border: '1px solid #2a3140',
              color: '#a4adba',
              borderRadius: 5,
              padding: '4px 10px',
              fontSize: 11,
              cursor: 'pointer',
            }}
          >
            + 커스텀 레이어
          </button>
        </div>
      </div>

      <div style={{ flex: 1, overflow: 'auto', display: 'flex' }}>
        {/* Sticky label column */}
        <div
          style={{
            width: LABEL_W,
            flexShrink: 0,
            position: 'sticky',
            left: 0,
            zIndex: 5,
            background: '#0f1216',
            borderRight: '1px solid #1c2028',
          }}
        >
          <div style={{ height: RULER_HEIGHT + SLIDE_HEAD_HEIGHT, borderBottom: '1px solid #1c2028' }} />
          {visibleLayers.map((layer) => (
            <div
              key={layer.key}
              style={{
                height: ROW_HEIGHT,
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '0 12px',
                borderBottom: '1px solid #1c2028',
                fontSize: 12,
                color: '#dde3ec',
                fontWeight: 600,
              }}
            >
              <span style={{ color: layer.color, fontSize: 14 }}>{layer.icon}</span>
              <span>{layer.label}</span>
              <button
                onClick={() => {
                  setHidden((prev) => {
                    const n = new Set(prev);
                    n.has(layer.key) ? n.delete(layer.key) : n.add(layer.key);
                    return n;
                  });
                }}
                style={{
                  marginLeft: 'auto',
                  background: 'transparent',
                  border: 0,
                  color: '#7d8696',
                  fontSize: 12,
                  cursor: 'pointer',
                }}
                title="숨기기/보이기"
              >
                ◐
              </button>
            </div>
          ))}
        </div>

        {/* Tracks area */}
        <div style={{ minWidth: trackWidth, position: 'relative' }}>
          {/* Ruler */}
          <div
            style={{
              height: RULER_HEIGHT,
              display: 'flex',
              borderBottom: '1px solid #1c2028',
              position: 'relative',
            }}
          >
            {Array.from({ length: Math.ceil(totalSec) + 1 }).map((_, sec) => (
              <div
                key={sec}
                style={{
                  position: 'absolute',
                  left: sec * PX_PER_SEC,
                  top: 0,
                  bottom: 0,
                  borderLeft: sec % 5 === 0 ? '1px solid #2a3140' : '1px solid #1a1e26',
                  paddingLeft: 4,
                  fontSize: 9,
                  color: sec % 5 === 0 ? '#7d8696' : '#3a4252',
                  display: 'flex',
                  alignItems: 'flex-end',
                  paddingBottom: 2,
                }}
              >
                {sec % 5 === 0 ? `${sec}s` : ''}
              </div>
            ))}
          </div>

          {/* Slide-head row */}
          <div
            style={{
              height: SLIDE_HEAD_HEIGHT,
              borderBottom: '1px solid #1c2028',
              position: 'relative',
            }}
          >
            {project.slides.map((slide, i) => {
              const left = slideStart(i) * PX_PER_SEC;
              const w = sceneDurations[i] * PX_PER_SEC;
              const isSelected = i === selected;
              return (
                <div
                  key={slide.id ?? i}
                  onClick={() => onSelect(i)}
                  style={{
                    position: 'absolute',
                    left,
                    top: 2,
                    bottom: 2,
                    width: Math.max(w - 2, 30),
                    background: isSelected ? `${accentColor}33` : '#181c24',
                    border: isSelected ? `1px solid ${accentColor}` : '1px solid #232a36',
                    borderRadius: 4,
                    padding: '0 8px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    fontSize: 11,
                    color: '#dde3ec',
                    fontWeight: 600,
                    cursor: 'pointer',
                    overflow: 'hidden',
                  }}
                >
                  <span>{SLIDE_TYPE_ICONS[slide.type]}</span>
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {i + 1}. {slide.heading}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Layer rows */}
          {visibleLayers.map((layer) => (
            <div
              key={layer.key}
              style={{
                height: ROW_HEIGHT,
                position: 'relative',
                borderBottom: '1px solid #1c2028',
                background: '#0d1015',
              }}
            >
              {project.slides.map((slide, i) => renderClipForLayer(layer, slide, i))}
            </div>
          ))}

          {/* Slide-boundary vertical lines */}
          {project.slides.map((_, i) =>
            i === 0 ? null : (
              <div
                key={`bnd-${i}`}
                style={{
                  position: 'absolute',
                  top: RULER_HEIGHT,
                  bottom: 0,
                  left: slideStart(i) * PX_PER_SEC,
                  width: 1,
                  background: '#2a3140',
                  pointerEvents: 'none',
                }}
              />
            )
          )}
        </div>
      </div>
    </div>
  );
};
