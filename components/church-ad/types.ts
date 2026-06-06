// Editor-side mirror of ChurchAd slide types — kept in sync with
// lib/church/church-ad-structure.ts but lighter and serializable across the
// network. Each slide carries an optional editor-only `id` for stable React
// keys during reorder/edit.

export type ChurchSlideType =
  | 'cover'
  | 'welcome'
  | 'worship-times'
  | 'programs'
  | 'pastor'
  | 'event'
  | 'verse'
  | 'location'
  | 'contact'
  | 'mission'
  | 'gallery'
  | 'invitation';

export type SlideLayout =
  | 'center'
  | 'left'
  | 'right'
  | 'split-left'
  | 'split-right'
  | 'big'
  | 'photo-card'              // 사진 풀블리드 + 텍스트만 카드
  | 'photo-card-bottom'       // 사진 위, 카드는 하단
  | 'photo-card-side'         // 사진 + 옆 카드
  | 'photo-card-bottom-left'  // 사진 + 좌측 하단 카드 (이미지 #5)
  | 'full-bleed'              // 사진 전체 + 그림자 텍스트
  | 'immersive'               // 상단 제목 + 하단 자막 바
  | 'news-grid'               // ProgramsSlide 전용 — 2x2 카드 그리드
  | 'list-rows';              // ProgramsSlide 전용 — 행 리스트

export interface WorshipServiceRow {
  name: string;
  schedule: string;
  place?: string;
}

export interface ProgramCard {
  title: string;
  description: string;
  schedule?: string;
}

export interface ChurchAdSlide {
  id?: string;
  type: ChurchSlideType;
  heading: string;
  subheading?: string;
  bullets?: string[];

  services?: WorshipServiceRow[];
  programs?: ProgramCard[];

  pastorName?: string;
  pastorTitle?: string;
  pastorMessage?: string;

  eventDate?: string;
  eventLocation?: string;

  verse?: string;
  verseRef?: string;

  address?: string;
  transit?: string;

  phone?: string;
  website?: string;
  socials?: string[];

  cta?: string;

  // mission
  mission?: string;

  // gallery (3-6 image URLs)
  galleryUrls?: string[];

  // visual layout variant
  layout?: SlideLayout;

  /** Font-size multiplier for the slide's hero text. 1.0 = default, 0.5–2.5 clamp.
   *  Wheel-scroll on the layer view's text/overlay clip adjusts this live. */
  textScale?: number;

  /** Scale multiplier for the card overlay. 1.0 = default, 0.4–2.5 clamp.
   *  Wheel-scroll on the layer view's overlay clip adjusts this live. */
  cardScale?: number;

  /** Slide-level overlay darkness (0.0 - 1.0) override. */
  bgOverlayOpacity?: number;

  /** Photo scale multiplier. 1.0 = default, 0.5–3.0 clamp. */
  imageScale?: number;

  /** Photo X position offset in pixels. */
  imageX?: number;

  /** Photo Y position offset in pixels. */
  imageY?: number;

  /** Photo entry animation — applied to the background image when the slide
   *  enters. Inherits from project.stylePreset when unset. */
  entryEffect?: EntryEffect;

  imageSearchQuery?: string;
  speakerNote: string;

  // Media (mutually exclusive — editor can switch between):
  mediaUrl?: string;       // URL (e.g. /uploads/abc.mp4 or external)
  mediaDataUri?: string;   // raw data URI (preview only, e.g. before upload)
  mediaType?: 'image' | 'video';

  // Per-slide duration override (seconds) — used when TTS is disabled.
  durationSec?: number;

  // Lock state — locked slides survive regeneration ("본문에서 생성" / "일괄 자동 배치")
  // and can't be reordered or deleted from the timeline.
  locked?: 'intro' | 'outro' | 'pinned';
}

export interface PinnedBadge {
  show: boolean;
  /** Badge text — defaults to project.churchName when empty. */
  text?: string;
  /** Optional logo (square preferred). Stored as /uploads/...png URL. */
  logoUrl?: string;
  logoDataUri?: string;       // legacy
  /** Optional small photo (round). Stored as /uploads/...jpg URL. */
  photoUrl?: string;
  photoDataUri?: string;      // legacy
  position: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
}

export type AudioMode = 'voice-bgm' | 'bgm-only' | 'voice-only' | 'video-audio' | 'silent';

export type StylePreset =
  | 'cinematic'
  | 'modern'
  | 'warm'
  | 'classic'
  | 'energetic';

export type EntryEffect =
  | 'none'
  | 'fade'
  | 'zoom-in'
  | 'close-up'
  | 'slide-top'
  | 'slide-bottom'
  | 'slide-left'
  | 'slide-right'
  | 'scale-up';

export interface ChurchAdProject {
  title: string;
  churchName: string;
  slogan?: string;
  accentColor: string;
  backgroundColor: string;
  logoDataUri?: string;
  badge?: PinnedBadge;
  /** Audio rendering mode — controls which of TTS/BGM get generated. */
  audioMode?: AudioMode;
  /** Visual style preset — bundles colors/transitions/effects. */
  stylePreset?: StylePreset;
  /** Font family applied to all slides */
  fontFamily?: string;
  /** Overlay darkness for background media (0–1) */
  bgOverlayOpacity?: number;
  /** TTS voice ID (ko-KR-...) */
  voiceId?: string;
  /** Custom badge text per slide (overrides churchName) */
  badgeText?: string;
  slides: ChurchAdSlide[];
  bgmMood: 'reverent' | 'uplifting' | 'warm' | 'hopeful';
  musicSearchQuery: string;
  musicGenPrompt: string;

  // Generated audio (set by /api/church-ad/synthesize). Stored as URLs so the
  // editor only carries `/audio/...wav` and `/bgm/...wav` strings — keeping
  // localStorage and POST payloads small. Legacy *DataUri fields are kept for
  // back-compat but new code should write *Url.
  audioUrl?: string;
  audioDataUri?: string;     // legacy
  audioDurationSec?: number;
  bgmUrl?: string;
  bgmDataUri?: string;       // legacy
  bgmVolume?: number;
  bgmTrackDurationSec?: number;
  /** TTS-derived per-slide duration (seconds). Overrides slide.durationSec when set. */
  sceneDurationsSec?: number[];
}

export const SLIDE_TYPE_LABELS: Record<ChurchSlideType, string> = {
  cover: '커버',
  welcome: '환영',
  'worship-times': '예배 시간',
  programs: '사역·프로그램',
  pastor: '담임목사',
  event: '특별 행사',
  verse: '말씀',
  location: '오시는 길',
  contact: '연락처',
  mission: '비전',
  gallery: '갤러리',
  invitation: '초대',
};

export const SLIDE_TYPE_ICONS: Record<ChurchSlideType, string> = {
  cover: '⛪',
  welcome: '👋',
  'worship-times': '🕊',
  programs: '✦',
  pastor: '👤',
  event: '🎉',
  verse: '📖',
  location: '📍',
  contact: '☎',
  mission: '✨',
  gallery: '🖼',
  invitation: '💌',
};

// Korean narration: ~3.5 syllables/sec is comfortable; clamp [3, 14] sec.
export const estimateDurationSec = (text: string | undefined): number => {
  const len = (text ?? '').length;
  return Math.max(3, Math.min(14, Math.round((len / 3.5) * 10) / 10));
};

export const newSlide = (type: ChurchSlideType): ChurchAdSlide => {
  const id = crypto.randomUUID();
  switch (type) {
    case 'cover':
      return { id, type, heading: '교회 이름', subheading: '슬로건', speakerNote: '환영합니다.', durationSec: 4 };
    case 'welcome':
      return { id, type, heading: '환영합니다', subheading: '함께 예배드려요', speakerNote: '여러분을 환영합니다.', durationSec: 6 };
    case 'worship-times':
      return {
        id,
        type,
        heading: '예배 시간',
        services: [{ name: '주일 예배', schedule: '주일 오전 11:00', place: '본당' }],
        speakerNote: '예배 시간을 안내드립니다.',
        durationSec: 8,
      };
    case 'programs':
      return {
        id,
        type,
        heading: '함께하는 사역',
        programs: [{ title: '청년부', description: '청년들의 신앙 공동체' }],
        speakerNote: '다양한 사역이 있습니다.',
        durationSec: 8,
      };
    case 'pastor':
      return { id, type, heading: '담임목사 소개', pastorName: '홍길동', pastorTitle: '담임목사', speakerNote: '목회자를 소개합니다.', durationSec: 7 };
    case 'event':
      return { id, type, heading: '특별 행사', eventDate: '2025-12-24', eventLocation: '본당', speakerNote: '특별한 행사가 있습니다.', durationSec: 7 };
    case 'verse':
      return { id, type, heading: '오늘의 말씀', verse: '하나님이 세상을 이처럼 사랑하사', verseRef: '요한복음 3:16', speakerNote: '말씀을 함께 나눕니다.', durationSec: 8 };
    case 'location':
      return { id, type, heading: '오시는 길', address: '서울시 ...', transit: '지하철 ...', speakerNote: '교회 위치를 안내드립니다.', durationSec: 6 };
    case 'contact':
      return { id, type, heading: '연락하기', phone: '02-000-0000', website: 'https://example.com', speakerNote: '문의는 언제든지 연락주세요.', durationSec: 6 };
    case 'mission':
      return { id, type, heading: '우리의 비전', mission: '사랑으로 세우는 공동체', layout: 'big', speakerNote: '사랑으로 세워가는 공동체입니다.', durationSec: 5 };
    case 'gallery':
      return { id, type, heading: '함께한 순간들', galleryUrls: [], speakerNote: '우리 교회의 장면들입니다.', durationSec: 7 };
    case 'invitation':
      return { id, type, heading: '당신을 초대합니다', cta: '이번 주일, 함께해요', speakerNote: '함께 예배드려요.', durationSec: 5 };
  }
};
