'use client';

import { useRef, useState } from 'react';
import {
  type ChurchAdSlide,
  type ChurchSlideType,
  SLIDE_TYPE_ICONS,
  SLIDE_TYPE_LABELS,
} from './types';

interface Props {
  slides: ChurchAdSlide[];
  selected: number;
  accentColor: string;
  onSelect: (i: number) => void;
  onReorder: (from: number, to: number) => void;
  onDuplicate: (i: number) => void;
  onDelete: (i: number) => void;
  onAdd: (type: ChurchSlideType) => void;
  onDurationChange: (i: number, sec: number) => void;
}

const ALL_TYPES: ChurchSlideType[] = [
  'cover',
  'welcome',
  'worship-times',
  'programs',
  'pastor',
  'event',
  'verse',
  'location',
  'contact',
  'invitation',
];

const PX_PER_SEC = 28;
const MIN_W = 110;

export const Timeline: React.FC<Props> = ({
  slides,
  selected,
  accentColor,
  onSelect,
  onReorder,
  onDuplicate,
  onDelete,
  onAdd,
  onDurationChange,
}) => {
  const [dragFrom, setDragFrom] = useState<number | null>(null);
  const [dragOver, setDragOver] = useState<number | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [resizing, setResizing] = useState<{ index: number; sec: number } | null>(null);

  const handleResizeStart = (e: React.MouseEvent, i: number) => {
    e.stopPropagation();
    e.preventDefault();
    const startX = e.clientX;
    const startSec = slides[i].durationSec ?? 6;
    setResizing({ index: i, sec: startSec });
    const move = (ev: MouseEvent) => {
      const dx = ev.clientX - startX;
      const next = Math.max(1.5, Math.round((startSec + dx / PX_PER_SEC) * 10) / 10);
      onDurationChange(i, next);
      setResizing({ index: i, sec: next });
    };
    const up = () => {
      setResizing(null);
      window.removeEventListener('mousemove', move);
      window.removeEventListener('mouseup', up);
    };
    window.addEventListener('mousemove', move);
    window.addEventListener('mouseup', up);
  };

  const totalSec = slides.reduce((a, s) => a + (s.durationSec ?? 6), 0);

  return (
    <div
      style={{
        background: '#0f1216',
        borderTop: '1px solid #1c2028',
        padding: '12px 16px',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ color: '#fff', fontWeight: 700, fontSize: 13 }}>타임라인</span>
          <span style={{ color: '#7d8696', fontSize: 12 }}>
            {slides.length}개 슬라이드 · 총 {totalSec.toFixed(1)}초
          </span>
          <span style={{ color: '#5a6470', fontSize: 11 }}>
            ↔ 드래그로 길이 조절 · 카드 드래그로 순서 변경
          </span>
        </div>
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => setShowAdd((v) => !v)}
            style={{
              background: accentColor,
              color: '#0f1c2e',
              border: 0,
              borderRadius: 6,
              padding: '6px 12px',
              fontWeight: 700,
              fontSize: 12,
              cursor: 'pointer',
            }}
          >
            + 슬라이드 추가
          </button>
          {showAdd && (
            <div
              style={{
                position: 'absolute',
                top: '110%',
                right: 0,
                background: '#181c24',
                border: '1px solid #2a3140',
                borderRadius: 8,
                padding: 6,
                width: 200,
                zIndex: 20,
                boxShadow: '0 12px 32px rgba(0,0,0,0.4)',
              }}
            >
              {ALL_TYPES.map((t) => (
                <button
                  key={t}
                  onClick={() => {
                    onAdd(t);
                    setShowAdd(false);
                  }}
                  style={{
                    display: 'block',
                    width: '100%',
                    textAlign: 'left',
                    background: 'transparent',
                    color: '#dde3ec',
                    border: 0,
                    padding: '8px 10px',
                    borderRadius: 4,
                    fontSize: 12,
                    cursor: 'pointer',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = '#222836')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                >
                  {SLIDE_TYPE_ICONS[t]}  {SLIDE_TYPE_LABELS[t]}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div
        style={{
          flex: 1,
          overflowX: 'auto',
          overflowY: 'hidden',
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          paddingBottom: 6,
        }}
      >
        {slides.map((slide, i) => {
          const w = Math.max(MIN_W, (slide.durationSec ?? 6) * PX_PER_SEC);
          const isSelected = i === selected;
          const isResizing = resizing?.index === i;
          const isDropTarget = dragOver === i && dragFrom !== null && dragFrom !== i;
          const thumbBg = slide.mediaDataUri ?? slide.mediaUrl;
          return (
            <div
              key={slide.id ?? i}
              draggable
              onDragStart={(e) => {
                if (resizing) {
                  e.preventDefault();
                  return;
                }
                setDragFrom(i);
                e.dataTransfer.effectAllowed = 'move';
              }}
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(i);
              }}
              onDragEnd={() => {
                if (dragFrom !== null && dragOver !== null && dragFrom !== dragOver) {
                  const fromLocked = slides[dragFrom]?.locked;
                  const toLocked = slides[dragOver]?.locked;
                  if (!fromLocked && !toLocked) onReorder(dragFrom, dragOver);
                }
                setDragFrom(null);
                setDragOver(null);
              }}
              onClick={() => onSelect(i)}
              style={{
                position: 'relative',
                flexShrink: 0,
                width: w,
                height: 92,
                borderRadius: 8,
                background: thumbBg
                  ? `linear-gradient(rgba(15,18,22,0.55), rgba(15,18,22,0.85)), url(${thumbBg}) center/cover`
                  : isSelected
                  ? `linear-gradient(135deg, ${accentColor}33, #1a212c)`
                  : '#181c24',
                border: isSelected
                  ? `2px solid ${accentColor}`
                  : isDropTarget
                  ? '2px dashed #4f8ef7'
                  : '1px solid #232a36',
                cursor: 'grab',
                padding: '8px 10px',
                display: 'flex',
                flexDirection: 'column',
                gap: 4,
                color: '#fff',
                boxSizing: 'border-box',
                overflow: 'hidden',
                transition: 'border 0.12s',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: 'rgba(255,255,255,0.7)' }}>
                <span style={{ opacity: 0.8 }}>{i + 1}</span>
                <span>{SLIDE_TYPE_ICONS[slide.type]}</span>
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {SLIDE_TYPE_LABELS[slide.type]}
                </span>
                {slide.locked && (
                  <span
                    title={
                      slide.locked === 'intro'
                        ? '시작 페이지 고정'
                        : slide.locked === 'outro'
                        ? '마지막 페이지 고정'
                        : '고정'
                    }
                    style={{ color: accentColor }}
                  >
                    🔒
                  </span>
                )}
              </div>
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 700,
                  lineHeight: 1.25,
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                  textShadow: thumbBg ? '0 1px 4px rgba(0,0,0,0.5)' : 'none',
                }}
              >
                {slide.heading || '(제목 없음)'}
              </div>
              <div style={{ marginTop: 'auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 10, color: accentColor, fontWeight: 800 }}>
                  {(slide.durationSec ?? 6).toFixed(1)}s
                </span>
                <div style={{ display: 'flex', gap: 4 }}>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDuplicate(i);
                    }}
                    title="복제"
                    style={{
                      background: 'transparent',
                      border: '1px solid #2a3140',
                      color: '#a4adba',
                      borderRadius: 4,
                      width: 22,
                      height: 22,
                      fontSize: 12,
                      cursor: 'pointer',
                    }}
                  >
                    ⎘
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete(i);
                    }}
                    title="삭제"
                    style={{
                      background: 'transparent',
                      border: '1px solid #2a3140',
                      color: '#a4adba',
                      borderRadius: 4,
                      width: 22,
                      height: 22,
                      fontSize: 12,
                      cursor: 'pointer',
                    }}
                  >
                    ✕
                  </button>
                </div>
              </div>

              {/* Resize handle — visible accent strip on right edge */}
              <div
                onMouseDown={(e) => handleResizeStart(e, i)}
                style={{
                  position: 'absolute',
                  right: 0,
                  top: 0,
                  bottom: 0,
                  width: 10,
                  cursor: 'ew-resize',
                  background: isResizing
                    ? accentColor
                    : `linear-gradient(to right, transparent, ${accentColor}55)`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
                onClick={(e) => e.stopPropagation()}
                title="드래그해서 길이 조절"
              >
                <div
                  style={{
                    width: 2,
                    height: 28,
                    background: isResizing ? '#0f1c2e' : '#fff',
                    opacity: isResizing ? 1 : 0.5,
                    borderRadius: 1,
                  }}
                />
              </div>

              {/* Live duration tooltip while resizing */}
              {isResizing && (
                <div
                  style={{
                    position: 'absolute',
                    top: -28,
                    right: 0,
                    background: accentColor,
                    color: '#0f1c2e',
                    fontSize: 12,
                    fontWeight: 800,
                    padding: '3px 8px',
                    borderRadius: 4,
                    whiteSpace: 'nowrap',
                    pointerEvents: 'none',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
                  }}
                >
                  {resizing!.sec.toFixed(1)}s
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
