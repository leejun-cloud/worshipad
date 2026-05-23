'use client';

import { useState } from 'react';
import Link from 'next/link';

const G = {
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
  secondary: '#006875',
};

const WORSHIP_TYPES = [
  { id: 'sunday', label: '주일 예배', modified: '2024.05.12', templates: 3, icon: '⛪' },
  { id: 'school', label: '주일 학교', modified: '2024.04.28', templates: 2, icon: '🎒' },
  { id: 'prayer', label: '금요 기도회', modified: '2024.05.01', templates: 1, icon: '🙏' },
];

const NAV = [
  { id: 'general', label: '일반 설정', icon: '⚙️' },
  { id: 'templates', label: '템플릿 및 스타일', icon: '🎨', active: true },
  { id: 'ai', label: 'AI API 설정', icon: '🤖' },
  { id: 'branding', label: '브랜딩 리소스', icon: '🏷️' },
  { id: 'team', label: '팀 관리', icon: '👥' },
];

export default function SettingsClient() {
  const [selectedType, setSelectedType] = useState(0);
  const [accentColor, setAccentColor] = useState('#007280');
  const [voice, setVoice] = useState('bright-female');
  const [churchName, setChurchName] = useState('은혜 공동체 교회');
  const [website, setWebsite] = useState('www.graceedit.church');
  const [social, setSocial] = useState('@grace_community');
  const [apiKey, setApiKey] = useState('sk-grace-edit-xxxxxxxxxxxx');
  const [showKey, setShowKey] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [language, setLanguage] = useState('ko');
  const [section, setSection] = useState('templates');

  return (
    <div style={{ minHeight: '100vh', background: G.bg, color: G.onSurface, fontFamily: 'Inter, sans-serif' }}>
      {/* Top Nav */}
      <header style={{ position: 'fixed', top: 0, left: 0, right: 0, height: 64, background: G.surface, borderBottom: `1px solid ${G.containerHighest}`, boxShadow: '0 1px 3px rgba(0,0,0,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 40px', zIndex: 50 }}>
        <div style={{ fontFamily: 'Hanken Grotesk, sans-serif', fontWeight: 700, fontSize: 20, color: G.primary }}>GraceEdit</div>
        <nav style={{ display: 'flex', gap: 24 }}>
          {['Projects', 'Assets', 'Templates'].map((n) => (
            <a key={n} href="#" style={{ fontSize: 14, color: G.onVariant, textDecoration: 'none', fontWeight: 500 }}>{n}</a>
          ))}
          <a href="#" style={{ fontSize: 14, color: G.primary, textDecoration: 'none', fontWeight: 600, borderBottom: `2px solid ${G.primary}`, paddingBottom: 2 }}>Branding</a>
        </nav>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <span style={{ fontSize: 20, cursor: 'pointer' }}>🔔</span>
          <span style={{ fontSize: 20, cursor: 'pointer' }}>❓</span>
          <div style={{ width: 32, height: 32, borderRadius: '50%', background: G.containerHigh, border: `1px solid ${G.outlineVariant}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: G.onVariant }}>JD</div>
        </div>
      </header>

      <div style={{ display: 'flex', paddingTop: 64 }}>
        {/* Sidebar */}
        <aside style={{ width: 256, position: 'fixed', top: 64, bottom: 0, background: G.containerLow, borderRight: `1px solid ${G.containerHighest}`, padding: '24px 0', display: 'flex', flexDirection: 'column', zIndex: 40 }}>
          <div style={{ padding: '0 16px 24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 40, height: 40, borderRadius: 10, background: G.primary, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>⛪</div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: G.onSurface }}>Grace Community</div>
                <div style={{ fontSize: 11, color: G.onVariant }}>Brand Workspace</div>
              </div>
            </div>
          </div>
          <nav style={{ display: 'flex', flexDirection: 'column', gap: 2, padding: '0 8px' }}>
            {NAV.map((item) => (
              <button
                key={item.id}
                onClick={() => setSection(item.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '10px 12px',
                  borderRadius: 10,
                  border: 'none',
                  background: section === item.id ? `${G.primaryContainer}1a` : 'transparent',
                  borderLeft: section === item.id ? `3px solid ${G.primaryContainer}` : '3px solid transparent',
                  color: section === item.id ? G.primary : G.onVariant,
                  fontSize: 14,
                  fontWeight: section === item.id ? 600 : 400,
                  cursor: 'pointer',
                  textAlign: 'left',
                }}
              >
                <span>{item.icon}</span>
                <span>{item.label}</span>
              </button>
            ))}
          </nav>
          <div style={{ marginTop: 'auto', padding: '0 8px', borderTop: `1px solid ${G.containerHighest}`, paddingTop: 16 }}>
            <Link href="/church-ad" style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', color: G.onVariant, textDecoration: 'none', fontSize: 14, borderRadius: 10 }}>
              ← 에디터로 돌아가기
            </Link>
          </div>
        </aside>

        {/* Main content */}
        <main style={{ marginLeft: 256, flex: 1, padding: '48px 40px 80px', minHeight: 'calc(100vh - 64px)' }}>
          <div style={{ maxWidth: 900 }}>
            <div style={{ marginBottom: 40 }}>
              <h1 style={{ fontSize: 32, fontWeight: 700, fontFamily: 'Hanken Grotesk, sans-serif', color: G.onSurface, marginBottom: 8, letterSpacing: '-0.02em' }}>통합 설정</h1>
              <p style={{ fontSize: 16, color: G.onVariant }}>GraceEdit의 모든 템플릿, AI 모델 및 시스템 설정을 한곳에서 관리하세요.</p>
            </div>

            {/* Section: Templates */}
            {(section === 'templates' || section === 'general') && (
              <section style={{ marginBottom: 48 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 20 }}>
                  <div>
                    <h2 style={sectionH2}>템플릿 및 스타일 관리</h2>
                    <p style={sectionP}>예배 및 콘텐츠 타입별 시각적 스타일을 정의합니다.</p>
                  </div>
                  <button style={priBtn}>+ 스타일 추가</button>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 20 }}>
                  {/* Type list */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {WORSHIP_TYPES.map((t, i) => (
                      <div
                        key={t.id}
                        onClick={() => setSelectedType(i)}
                        style={{
                          padding: '14px 16px',
                          background: G.surface,
                          border: `1px solid ${selectedType === i ? G.primaryContainer : G.outlineVariant}`,
                          borderLeft: `3px solid ${selectedType === i ? G.primaryContainer : 'transparent'}`,
                          borderRadius: 10,
                          cursor: 'pointer',
                          boxShadow: selectedType === i ? '0 2px 8px rgba(0,0,0,0.06)' : 'none',
                        }}
                      >
                        <div style={{ fontSize: 14, fontWeight: 700, color: selectedType === i ? G.primary : G.onSurface }}>{t.icon} {t.label}</div>
                        <div style={{ fontSize: 12, color: G.onVariant, marginTop: 2 }}>최근 수정: {t.modified} · 템플릿 {t.templates}개</div>
                      </div>
                    ))}
                  </div>

                  {/* Editor */}
                  <div style={{ background: G.surface, border: `1px solid ${G.outlineVariant}`, borderRadius: 12, padding: 28, boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
                      <div style={{ width: 48, height: 48, background: `${G.secondary}1a`, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>
                        {WORSHIP_TYPES[selectedType].icon}
                      </div>
                      <div>
                        <h3 style={{ fontSize: 18, fontWeight: 600, fontFamily: 'Hanken Grotesk, sans-serif', margin: 0 }}>{WORSHIP_TYPES[selectedType].label} 스타일 편집</h3>
                        <p style={{ fontSize: 12, color: G.onVariant, margin: 0 }}>기본 브랜드 테마 및 미디어 속성</p>
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
                      <div>
                        <div style={fieldLabel}>포인트 컬러 (Point Color)</div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <input type="color" value={accentColor} onChange={(e) => setAccentColor(e.target.value)} style={{ width: 36, height: 36, border: 'none', borderRadius: 8, cursor: 'pointer', padding: 0 }} />
                          <input value={accentColor.toUpperCase()} onChange={(e) => setAccentColor(e.target.value)} style={inputStyle} />
                        </div>
                      </div>
                      <div>
                        <div style={fieldLabel}>AI 음성 선택</div>
                        <select value={voice} onChange={(e) => setVoice(e.target.value)} style={selectStyle}>
                          <option value="calm-male">차분한 남성 (민수)</option>
                          <option value="bright-female">밝은 여성 (지은)</option>
                          <option value="trust-male">신뢰감 있는 남성 (성진)</option>
                        </select>
                      </div>
                    </div>

                    {/* Cover setting */}
                    <div style={{ paddingTop: 20, borderTop: `1px solid ${G.outlineVariant}`, marginBottom: 20 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                        <div style={fieldLabel}>시작 화면 (Cover) 설정</div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span style={{ fontSize: 12, color: G.onVariant }}>AI 자동 생성 사용</span>
                          <div style={{ width: 36, height: 20, background: G.primaryContainer, borderRadius: 10, position: 'relative', cursor: 'pointer' }}>
                            <div style={{ position: 'absolute', right: 2, top: 2, width: 16, height: 16, background: 'white', borderRadius: '50%' }} />
                          </div>
                        </div>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                          <input value={churchName} onChange={(e) => setChurchName(e.target.value)} placeholder="교회 이름" style={inputStyle} />
                          <div style={{ border: `2px dashed ${G.outlineVariant}`, borderRadius: 10, padding: '20px 16px', textAlign: 'center', cursor: 'pointer', background: G.containerLow }}>
                            <div style={{ fontSize: 20 }}>📎</div>
                            <div style={{ fontSize: 12, color: G.onVariant, marginTop: 4 }}>로고 업로드 (PNG, SVG)</div>
                          </div>
                        </div>
                        <div style={{ borderRadius: 10, overflow: 'hidden', background: G.containerHigh, height: 130, display: 'flex', alignItems: 'center', justifyContent: 'center', color: G.onVariant, fontSize: 13 }}>
                          미리보기
                        </div>
                      </div>
                    </div>

                    {/* Outro setting */}
                    <div style={{ paddingTop: 20, borderTop: `1px solid ${G.outlineVariant}`, marginBottom: 24 }}>
                      <div style={fieldLabel}>종료 화면 (Outro) 설정</div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: G.containerLow, border: `1px solid ${G.outlineVariant}`, borderRadius: 8, padding: '8px 12px' }}>
                          <span>🔗</span>
                          <input value={website} onChange={(e) => setWebsite(e.target.value)} style={{ flex: 1, border: 'none', background: 'transparent', fontSize: 13, color: G.onSurface, outline: 'none' }} />
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: G.containerLow, border: `1px solid ${G.outlineVariant}`, borderRadius: 8, padding: '8px 12px' }}>
                          <span>📢</span>
                          <input value={social} onChange={(e) => setSocial(e.target.value)} style={{ flex: 1, border: 'none', background: 'transparent', fontSize: 13, color: G.onSurface, outline: 'none' }} />
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                      <button style={secBtn}>취소</button>
                      <button style={priBtn}>변경사항 저장</button>
                    </div>
                  </div>
                </div>
              </section>
            )}

            {/* Section: AI API */}
            {(section === 'ai' || section === 'general') && (
              <section style={{ marginBottom: 48 }}>
                <div style={{ marginBottom: 20 }}>
                  <h2 style={sectionH2}>AI API 설정</h2>
                  <p style={sectionP}>텍스트 생성 및 스크립트 정제에 사용되는 AI 모델을 구성합니다.</p>
                </div>
                <div style={{ background: G.surface, border: `1px solid ${G.outlineVariant}`, borderRadius: 12, padding: 28, boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
                  <div style={{ marginBottom: 20 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                      <div style={fieldLabel}>Gemini API Key</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#16a34a', fontWeight: 500 }}>
                        <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#22c55e' }} />
                        정상 연결됨
                      </div>
                    </div>
                    <div style={{ position: 'relative' }}>
                      <input
                        type={showKey ? 'text' : 'password'}
                        value={apiKey}
                        onChange={(e) => setApiKey(e.target.value)}
                        style={{ ...inputStyle, paddingRight: 44 }}
                      />
                      <button onClick={() => setShowKey(!showKey)} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', fontSize: 16 }}>
                        {showKey ? '🙈' : '👁'}
                      </button>
                    </div>
                    <p style={{ fontSize: 12, color: G.onVariant, marginTop: 6 }}>
                      GraceEdit은 Gemini Pro 모델을 사용하여 설교 요약 및 주보 자동 생성을 수행합니다.
                    </p>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                    {[
                      { icon: '✨', title: '자동 텍스트 생성', desc: '입력된 키워드를 바탕으로 세련된 문장을 제안합니다.' },
                      { icon: '✅', title: '스크립트 정제', desc: '말투 교정 및 문법 오류를 실시간으로 수정합니다.' },
                    ].map((item) => (
                      <div key={item.title} style={{ background: G.containerLow, border: `1px solid ${G.outlineVariant}`, borderRadius: 10, padding: 16 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                          <span style={{ fontSize: 18, color: G.primary }}>{item.icon}</span>
                          <span style={{ fontSize: 14, fontWeight: 700 }}>{item.title}</span>
                        </div>
                        <p style={{ fontSize: 12, color: G.onVariant, margin: 0 }}>{item.desc}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </section>
            )}

            {/* Section: General */}
            {section === 'general' && (
              <section style={{ marginBottom: 48 }}>
                <div style={{ marginBottom: 20 }}>
                  <h2 style={sectionH2}>기타 설정</h2>
                </div>
                <div style={{ background: G.surface, border: `1px solid ${G.outlineVariant}`, borderRadius: 12, overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
                  {/* Language */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 24px', borderBottom: `1px solid ${G.outlineVariant}` }}>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 700 }}>기본 언어 (Language)</div>
                      <div style={{ fontSize: 12, color: G.onVariant }}>인터페이스에 표시될 언어를 선택하세요.</div>
                    </div>
                    <select value={language} onChange={(e) => setLanguage(e.target.value)} style={{ ...selectStyle, minWidth: 120 }}>
                      <option value="ko">한국어 (Default)</option>
                      <option value="en">English</option>
                      <option value="ja">日本語</option>
                    </select>
                  </div>
                  {/* Theme */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 24px' }}>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 700 }}>테마 설정 (Theme)</div>
                      <div style={{ fontSize: 12, color: G.onVariant }}>밝은 모드와 어두운 모드를 전환합니다.</div>
                    </div>
                    <div style={{ display: 'flex', background: G.containerHigh, borderRadius: 20, padding: 3, gap: 2 }}>
                      {(['light', 'dark'] as const).map((t) => (
                        <button
                          key={t}
                          onClick={() => setTheme(t)}
                          style={{
                            padding: '6px 16px',
                            borderRadius: 16,
                            border: 'none',
                            background: theme === t ? G.surface : 'transparent',
                            color: theme === t ? G.primary : G.onVariant,
                            fontSize: 13,
                            fontWeight: 600,
                            cursor: 'pointer',
                            boxShadow: theme === t ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
                          }}
                        >
                          {t === 'light' ? '☀️ Light' : '🌙 Dark'}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </section>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

const sectionH2: React.CSSProperties = { fontSize: 20, fontWeight: 600, fontFamily: 'Hanken Grotesk, sans-serif', margin: '0 0 4px', color: '#191c1d' };
const sectionP: React.CSSProperties = { fontSize: 14, color: '#3e484b', margin: 0 };
const fieldLabel: React.CSSProperties = { fontSize: 13, fontWeight: 600, color: '#191c1d', marginBottom: 8 };
const inputStyle: React.CSSProperties = { width: '100%', background: '#f3f4f5', border: '1px solid #bec8cb', borderRadius: 8, padding: '9px 12px', fontSize: 13, color: '#191c1d', outline: 'none', boxSizing: 'border-box' };
const selectStyle: React.CSSProperties = { background: '#f3f4f5', border: '1px solid #bec8cb', borderRadius: 8, padding: '9px 10px', fontSize: 13, color: '#191c1d', outline: 'none', width: '100%' };
const priBtn: React.CSSProperties = { background: '#005863', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 20px', fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'Hanken Grotesk, sans-serif' };
const secBtn: React.CSSProperties = { background: 'transparent', color: '#191c1d', border: '1px solid #bec8cb', borderRadius: 8, padding: '10px 20px', fontSize: 14, fontWeight: 500, cursor: 'pointer' };
