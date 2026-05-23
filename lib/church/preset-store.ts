/**
 * Custom style preset storage (localStorage).
 * Falls back to the built-in TEMPLATES when localStorage is unavailable.
 */

/** Font sizes in Remotion canvas px (1920×1080 coordinate space) */
export interface FontSizes {
  heading: number;     // 큰 제목  — e.g. cover title
  subheading: number;  // 중간 제목 — e.g. slide section title
  label: number;       // 작은 제목 — e.g. program name, badge
  body: number;        // 본문     — e.g. description text
  caption: number;     // 캡션     — e.g. footnotes, time info
}

export const DEFAULT_FONT_SIZES: FontSizes = {
  heading: 96,
  subheading: 58,
  label: 36,
  body: 26,
  caption: 18,
};

export interface StylePresetConfig {
  id: string;
  label: string;
  icon: string;
  description: string;
  accentColor: string;
  backgroundColor: string;
  /** 0–1: darkness of the media overlay (higher = darker) */
  bgOverlayOpacity: number;
  fontFamily: string;
  fontSizes: FontSizes;
  introSlideType: string;
  outroSlideType: string;
  showChurchNameBadge: boolean;
  /** 배지에 표시할 이름. 비워두면 교회 이름 사용 */
  badgeText: string;
  slogan: string;
  voiceId: string;
  /** Free-form Korean description sent to Gemini TTS prompt */
  voiceStylePrompt: string;
  isCustom: boolean;
}

export const DEFAULT_PRESETS: StylePresetConfig[] = [
  {
    id: 'sunday',
    label: '주일 예배',
    icon: '⛪',
    description: '신뢰감 있는 정통 예배 스타일',
    accentColor: '#d4a657',
    backgroundColor: '#0f1c2e',
    bgOverlayOpacity: 0.65,
    fontFamily: 'Pretendard',
    fontSizes: { ...DEFAULT_FONT_SIZES },
    introSlideType: 'cover',
    outroSlideType: 'invitation',
    showChurchNameBadge: true,
    badgeText: '',
    slogan: '함께 예배하고 함께 살아가는 공동체',
    voiceId: 'ko-KR-Wavenet-A',
    voiceStylePrompt: '따뜻하고 차분한 여성 목소리로, 예배로 초대하는 듯한 부드러운 톤으로 읽어주세요.',
    isCustom: false,
  },
  {
    id: 'school',
    label: '주일 학교',
    icon: '🎒',
    description: '밝고 생동감 있는 어린이·청소년 스타일',
    accentColor: '#f5a623',
    backgroundColor: '#1a0f2e',
    bgOverlayOpacity: 0.55,
    fontFamily: 'Black Han Sans',
    fontSizes: { heading: 108, subheading: 64, label: 40, body: 28, caption: 20 },
    introSlideType: 'cover',
    outroSlideType: 'invitation',
    showChurchNameBadge: true,
    badgeText: '',
    slogan: '다음세대를 하나님의 사랑으로',
    voiceId: 'ko-KR-Standard-C',
    voiceStylePrompt: '밝고 활기찬 목소리로, 어린이와 청소년에게 말하듯 에너지 넘치게 읽어주세요.',
    isCustom: false,
  },
  {
    id: 'praise',
    label: '찬양 집회',
    icon: '🎵',
    description: '감동적이고 역동적인 찬양 특화 스타일',
    accentColor: '#7c3aed',
    backgroundColor: '#0a0d1a',
    bgOverlayOpacity: 0.70,
    fontFamily: 'Pretendard',
    fontSizes: { ...DEFAULT_FONT_SIZES },
    introSlideType: 'cover',
    outroSlideType: 'invitation',
    showChurchNameBadge: true,
    badgeText: '',
    slogan: '찬양으로 하나님께 나아가는 시간',
    voiceId: 'ko-KR-Wavenet-A',
    voiceStylePrompt: '감동적이고 열정적인 톤으로, 찬양의 기대감을 담아 읽어주세요.',
    isCustom: false,
  },
  {
    id: 'news',
    label: '뉴스 리포트',
    icon: '📰',
    description: '간결하고 정보 전달에 집중한 공지 스타일',
    accentColor: '#2563eb',
    backgroundColor: '#0a0d12',
    bgOverlayOpacity: 0.60,
    fontFamily: 'Pretendard',
    fontSizes: { ...DEFAULT_FONT_SIZES },
    introSlideType: 'cover',
    outroSlideType: 'contact',
    showChurchNameBadge: true,
    badgeText: '',
    slogan: '이번 주 교회 소식',
    voiceId: 'ko-KR-Standard-D',
    voiceStylePrompt: '명확하고 신뢰감 있는 아나운서 톤으로, 정보를 명료하게 전달해주세요.',
    isCustom: false,
  },
];

const STORAGE_KEY = 'church-ad-presets-v1';

export function loadPresets(): StylePresetConfig[] {
  if (typeof window === 'undefined') return DEFAULT_PRESETS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_PRESETS;
    const saved = JSON.parse(raw) as StylePresetConfig[];
    // Merge: default presets may have been updated; preserve user customizations
    const map = new Map(saved.map((p) => [p.id, p]));
    return DEFAULT_PRESETS.map((d) => map.get(d.id) ?? d)
      .concat(saved.filter((p) => p.isCustom));
  } catch {
    return DEFAULT_PRESETS;
  }
}

export function savePresets(presets: StylePresetConfig[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(presets));
  } catch {}
}

export function saveOnePreset(preset: StylePresetConfig): void {
  const all = loadPresets();
  const idx = all.findIndex((p) => p.id === preset.id);
  if (idx >= 0) all[idx] = preset;
  else all.push(preset);
  savePresets(all);
}

export function deletePreset(id: string): void {
  const all = loadPresets().filter((p) => p.id !== id || !p.isCustom);
  savePresets(all);
}
