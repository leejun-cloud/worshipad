'use client';

import { STYLE_PRESETS } from './style-presets';
import type { StylePreset } from './types';

interface Props {
  selected?: StylePreset;
  onPick: (p: StylePreset) => void;
}

export const StylePresetPicker: React.FC<Props> = ({ selected, onPick }) => {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
        gap: 8,
      }}
    >
      {STYLE_PRESETS.map((p) => {
        const active = selected === p.id;
        return (
          <button
            key={p.id}
            onClick={() => onPick(p.id)}
            style={{
              position: 'relative',
              background: active ? `${p.accentColor}12` : '#ffffff',
              border: active ? `2px solid ${p.accentColor}` : '1px solid #bec8cb',
              borderRadius: 10,
              padding: '12px 12px',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-start',
              gap: 6,
              textAlign: 'left',
              transition: 'all 0.15s',
              boxShadow: active ? `0 0 0 3px ${p.accentColor}22` : '0 1px 3px rgba(0,0,0,0.06)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%' }}>
              {/* Color preview swatch: shows the actual video bg/accent colors */}
              <span
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 6,
                  background: p.backgroundColor,
                  border: `2px solid ${p.accentColor}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 15,
                  flexShrink: 0,
                }}
              >
                {p.swatch}
              </span>
              <span style={{ fontSize: 13, fontWeight: 700, color: active ? p.accentColor : '#191c1d' }}>
                {p.label}
              </span>
              {active && (
                <span style={{ marginLeft: 'auto', fontSize: 12, fontWeight: 700, color: p.accentColor }}>✓</span>
              )}
            </div>
            <div style={{ fontSize: 11, color: '#6e797b', lineHeight: 1.4 }}>
              {p.description}
            </div>
          </button>
        );
      })}
    </div>
  );
};
