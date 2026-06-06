// Structure church advertisement content into a 9-12 slide ChurchAd reel.
// Output is intentionally tighter (45-90s total) than a generic lecture so
// it works as a YouTube/property ad-style introduction to the church.
//
// Slide vocabulary is church-specific (worship-times, pastor, verse, location,
// invitation) so downstream Remotion scenes can render purpose-built layouts
// instead of reusing generic content slides.

import { GoogleGenAI, Type } from '@google/genai';

export type ChurchSlideType =
  | 'cover'         // hero: 교회 이름 + 슬로건
  | 'welcome'       // 환영 한 줄 + 비전 문장
  | 'worship-times' // 예배 시간표 (요일/시간/장소 row[])
  | 'programs'      // 사역·프로그램 카드 그리드 (3-5개)
  | 'pastor'        // 목회자 소개
  | 'event'         // 특별 이벤트/설교 시리즈
  | 'verse'         // 말씀 인용 (성경 구절)
  | 'location'      // 위치/주소 + 교통 안내
  | 'contact'       // 연락처/홈페이지/SNS
  | 'mission'       // 비전·핵심가치 단문 강조
  | 'gallery'       // 사진 그리드 (3-6장)
  | 'invitation';   // 클로징 CTA — "당신을 초대합니다"

export type SlideLayout =
  | 'center'
  | 'left'
  | 'right'
  | 'split-left'                // 텍스트 좌측 / 이미지 우측
  | 'split-right'               // 이미지 좌측 / 텍스트 우측
  | 'big'                       // mission 전용 — 거대 텍스트
  | 'photo-card'                // 사진 풀블리드 + 텍스트 카드 가운데
  | 'photo-card-bottom'         // 사진 풀블리드 + 텍스트 카드 하단
  | 'photo-card-side'           // 사진 풀블리드 + 텍스트 카드 우측
  | 'photo-card-bottom-left'    // 사진 풀블리드 + 좌측 하단 카드 (이미지 #5)
  | 'full-bleed'               // 사진 전체 화면, 텍스트 그림자만으로 가독성 확보 (사진이 주인공)
  | 'immersive'                // 사진 전체 + 상단 제목 + 하단 자막 바 (영화 스타일)
  | 'news-grid'                 // ProgramsSlide — 2x2 카드 그리드 (이미지 #14)
  | 'list-rows';                // ProgramsSlide — 행 리스트 (이미지 #15)

export interface WorshipServiceRow {
  name: string;       // "주일 1부 예배"
  schedule: string;   // "주일 오전 9:00"
  place?: string;     // "본당" / "교육관 3층"
}

export interface ProgramCard {
  title: string;        // "청년부 모임"
  description: string;  // 한 줄 설명
  schedule?: string;    // "매주 금요일 오후 7:30"
}

export interface ChurchAdSlide {
  type: ChurchSlideType;
  heading: string;
  subheading?: string;
  bullets?: string[];

  // worship-times
  services?: WorshipServiceRow[];

  // programs
  programs?: ProgramCard[];

  // pastor
  pastorName?: string;
  pastorTitle?: string;
  pastorMessage?: string;

  // event
  eventDate?: string;
  eventLocation?: string;

  // verse
  verse?: string;
  verseRef?: string;     // "요한복음 3:16"

  // location
  address?: string;
  transit?: string;      // "지하철 2호선 OO역 3번 출구 도보 5분"

  // contact
  phone?: string;
  website?: string;
  socials?: string[];    // ["@church_ig", "youtube.com/@church"]

  // invitation
  cta?: string;

  // mission
  mission?: string;     // 한 줄 비전 (예: "사랑으로 세우는 공동체")

  // gallery
  galleryUrls?: string[];   // 3-6 이미지 URL

  // layout variant for visual diversity
  layout?: SlideLayout;

  // hero text size multiplier (1.0 default)
  textScale?: number;
  cardScale?: number;
  bgOverlayOpacity?: number;
  imageScale?: number;
  imageX?: number;
  imageY?: number;
  entryEffect?:
    | 'none'
    | 'fade'
    | 'zoom-in'
    | 'close-up'
    | 'slide-top'
    | 'slide-bottom'
    | 'slide-left'
    | 'slide-right'
    | 'scale-up';

  imageSearchQuery?: string;
  speakerNote: string;

  // Per-slide media (set by editor / auto-storyboard, consumed by render)
  mediaUrl?: string;
  mediaDataUri?: string;
  mediaType?: 'image' | 'video';
  isStock?: boolean;
  durationSec?: number;
}

export interface ChurchProfile {
  churchName: string;
  slogan?: string;
  pastorName?: string;
  pastorTitle?: string;
  address?: string;
  transit?: string;
  phone?: string;
  website?: string;
  socials?: string[];
  services?: WorshipServiceRow[];
  programs?: ProgramCard[];
  accentColor?: string;       // hex, default warm gold
  backgroundColor?: string;   // hex, default deep navy
  logoPath?: string;          // optional local logo asset
}

export interface ChurchAdStructureResult {
  title: string;
  churchName: string;
  slogan?: string;
  accentColor: string;
  backgroundColor: string;
  slides: ChurchAdSlide[];
  bgmMood: 'reverent' | 'uplifting' | 'warm' | 'hopeful';
  musicSearchQuery: string;
  musicGenPrompt: string;
}

const SYSTEM = `당신은 교회 홍보 영상 기획자입니다.
교회 정보와 광고 본문을 받아 1920×1080 가로형 광고 영상의 슬라이드 구성을 만드세요.
영상 길이는 약 30-90초로 짧고 따뜻하게 구성합니다.

[적응형 슬라이드 선택 — 매우 중요]
다음은 사용 가능한 슬라이드 메뉴입니다. **본문 또는 프로필에 명확한 정보가 있을 때만** 해당 타입을 포함하세요.
빈 슬라이드를 만들거나 프로필에 없는 정보를 지어내지 마세요. 가장 짧고 응집력 있는 구성을 우선합니다.

| 타입 | 포함 조건 |
|---|---|
| cover (필수) | 항상 포함 — 교회 이름과 슬로건 |
| welcome | 본문에 환영·비전·소속감 메시지가 있을 때 |
| worship-times | 프로필에 services[]가 있거나 본문에서 예배 시간을 명시할 때 (둘 다 없으면 절대 만들지 말 것) |
| programs | 프로필에 programs[]가 있거나 본문에서 사역·프로그램을 구체적으로 언급할 때 |
| pastor | **프로필에 pastorName이 있고 본문에서 목사를 언급할 때만** (없으면 절대 만들지 말 것) |
| event | 본문에 특정 행사·날짜·시리즈가 있을 때만 |
| verse | 본문에 성경 구절이 직접 인용되거나 명시될 때 (지어내지 말 것) |
| location | 프로필에 address가 있거나 본문에서 위치를 명시할 때 |
| contact | 프로필에 phone/website/socials가 있을 때 |
| mission | 본문에 핵심 가치·비전 한 줄이 있을 때 (단문 강조) |
| gallery | 사용자가 이미지를 4장 이상 업로드했을 때만 (storyboard 모드) |
| invitation (필수) | 항상 포함 — 클로징 CTA |

총 5-9장 권장. 본문이 짧으면 5-6장으로 짜되 cover + invitation은 항상 유지.

[layout 옵션 — 매우 중요]
슬라이드 시각 스타일을 다양화하기 위해 layout을 지정하세요. 사진이 있는 슬라이드에는
photo-card 계열을 적극 사용하세요. 사진을 어둡게 깔지 않고, 사진은 그대로 보여주고
텍스트만 어두운 카드에 담아 가독성을 확보합니다.

가능한 layout:
- 'center'             — 텍스트 중앙 정렬, 전체 어두운 오버레이 (기본, 사진 없을 때 좋음)
- 'left' / 'right'     — 텍스트가 좌/우측, 어두운 오버레이
- 'split-left' / 'split-right' — 텍스트와 이미지 좌우 분할
- 'big'                — mission 전용, 거대한 한 줄 텍스트
- 'photo-card'         — ⭐ 사진 풀블리드 + 텍스트는 가운데 어두운 카드 (좋은 사진 + 짧은 메시지)
- 'photo-card-bottom'  — ⭐ 사진 풀블리드 + 텍스트 카드 하단 (이미지가 메인 시각 요소)
- 'photo-card-side'    — ⭐ 사진 풀블리드 + 텍스트 카드 우측 (인물 사진 등 좌측에 시선 집중)
- 'full-bleed'         — 🌟 사진 100% 전체화면, 카드 없음, 텍스트 그림자로만 표시 (사진이 주인공)
- 'immersive'          — 🌟 사진 전체 + 상단에 제목 + 하단에 자막 바 (영화/다큐 스타일)

[layout 선택 규칙 — 필수, 반드시 지정]
layout 필드는 모든 슬라이드에 반드시 지정해야 합니다. 아래 규칙을 따르세요:

슬라이드 타입별 기본 레이아웃 (무조건 이 안에서 다양하게 배분):
- cover         → 'immersive' 또는 'photo-card-bottom' (임팩트 첫 화면)
- welcome       → 'full-bleed' 또는 'photo-card-bottom-left'
- worship-times → 'photo-card-bottom' 또는 'center' (교대로)
- programs      → 'news-grid' 또는 'list-rows' (교대로)
- pastor        → 'split-left' (항상)
- event         → 'full-bleed' 또는 'photo-card-side'
- verse         → 'immersive' 또는 'photo-card'
- location      → 'center' 또는 'left'
- contact       → 'center' 또는 'right'
- mission       → 'full-bleed' 또는 'big'
- gallery       → 'center' (갤러리 고정)
- invitation    → 'immersive' 또는 'photo-card-bottom'

절대 금지: 5개 이상 연속으로 같은 layout 사용. 전체 슬라이드의 최소 50%는 photo-card / full-bleed / immersive 계열이어야 합니다.

photo-card 계열 레이아웃 특성 (반드시 이해하고 사용):
- 'full-bleed'             🌟 — 사진 전체가 완전히 보임, 텍스트는 그림자만 (사진이 주인공, 사진 첨부 시 강력 추천)
- 'immersive'              🌟 — 사진 전체 + 제목은 상단 + 자막은 하단 바 (영화 스타일, 임팩트 있음)
- 'photo-card-bottom'      ⭐ — 사진이 화면 전체에 보이고, 텍스트는 하단 반투명 카드에 (활동사진 메인)
- 'photo-card-side'        ⭐ — 사진 전체 보이고, 텍스트는 우측 반투명 카드 (세로형 사진에 좋음)
- 'photo-card-bottom-left' ⭐ — 사진 전체 보이고, 텍스트는 좌하단 카드
- 'photo-card'             — 사진 전체 + 가운데 텍스트 카드

split 계열:
- 'split-left'  — 좌측 50% 사진 | 우측 50% 텍스트 (세로 분할)
- 'split-right' — 좌측 50% 텍스트 | 우측 50% 사진

기본 계열 (사진 어둡게 깔림):
- 'center' / 'left' / 'right' — 텍스트 중심, 사진 배경으로 어두워짐

[heading 규칙]
- cover: 교회 이름 그대로
- welcome: "환영합니다" 또는 비전 한 줄
- worship-times: "예배 시간"
- programs: "함께하는 사역"
- pastor: "담임목사 소개"
- event: 이벤트 제목
- verse: "오늘의 말씀" 또는 verse 본문
- location: "오시는 길"
- contact: "연락하기"
- invitation: "당신을 초대합니다"

[speakerNote 규칙 — 기본 모드]
- speakerNote는 반드시 입력 본문에 있는 내용만 사용하세요. 본문에 없는 문장("함께기도합시다", "당신을 초대합니다", "환영합니다" 등)을 창작하거나 추가하지 마세요.
- 자연스러운 따뜻한 한국어 구어체
- 각 슬라이드 5-10초 분량 (40-100자)
- cover/invitation은 더 짧게 (3-6초), 본문에 해당 내용이 없으면 speakerNote를 빈 문자열로 두세요.
- 신뢰감 있고 따뜻한 어조 — 강요하지 않는 초대의 문장

[imageSearchQuery]
- 영어 2-4 키워드, 인물보다 분위기 (church, sunday morning, candle, community gathering 등)
- cover, welcome, programs, location 슬라이드에 권장

[bgmMood]
- reverent: 경건한·차분한
- uplifting: 희망찬·격려
- warm: 가족적·따뜻한
- hopeful: 미래지향·새로운 시작`;

const SYSTEM_VERBATIM_OVERRIDE = `

⚠️ 중요 — 원문 보존 모드 (VERBATIM):
- speakerNote에는 입력 본문의 문장을 **글자 그대로** 옮기세요.
- 단어 추가·삭제·재구성·요약·말투 변경 절대 금지.
- 슬라이드 단위로 본문을 자연스럽게 분할만 하면 됩니다.
- 본문에 없는 새로운 표현(예: "환영합니다", "이번 주일 함께해요")을 만들어내지 마세요.
- heading / subheading / cta 등 시각적 요소는 본문에서 발췌하거나 짧게 다듬어도 되지만 speakerNote는 100% 본문 원문이어야 합니다.
- 본문이 너무 짧아 슬라이드를 다 못 채우면 speakerNote를 빈 문자열로 두세요.`;

const SCHEMA = {
  type: Type.OBJECT,
  properties: {
    title: { type: Type.STRING },
    churchName: { type: Type.STRING },
    slogan: { type: Type.STRING },
    accentColor: { type: Type.STRING },
    backgroundColor: { type: Type.STRING },
    slides: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          type: {
            type: Type.STRING,
            enum: [
              'cover',
              'welcome',
              'worship-times',
              'programs',
              'pastor',
              'event',
              'verse',
              'location',
              'contact',
              'mission',
              'gallery',
              'invitation',
            ],
          },
          layout: {
            type: Type.STRING,
            enum: [
              'center',
              'left',
              'right',
              'split-left',
              'split-right',
              'big',
              'photo-card',
              'photo-card-bottom',
              'photo-card-side',
              'photo-card-bottom-left',
              'news-grid',
              'list-rows',
            ],
          },
          mission: { type: Type.STRING },
          heading: { type: Type.STRING },
          subheading: { type: Type.STRING },
          bullets: { type: Type.ARRAY, items: { type: Type.STRING } },
          services: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING },
                schedule: { type: Type.STRING },
                place: { type: Type.STRING },
              },
              required: ['name', 'schedule'],
            },
          },
          programs: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING },
                description: { type: Type.STRING },
                schedule: { type: Type.STRING },
              },
              required: ['title', 'description'],
            },
          },
          pastorName: { type: Type.STRING },
          pastorTitle: { type: Type.STRING },
          pastorMessage: { type: Type.STRING },
          eventDate: { type: Type.STRING },
          eventLocation: { type: Type.STRING },
          verse: { type: Type.STRING },
          verseRef: { type: Type.STRING },
          address: { type: Type.STRING },
          transit: { type: Type.STRING },
          phone: { type: Type.STRING },
          website: { type: Type.STRING },
          socials: { type: Type.ARRAY, items: { type: Type.STRING } },
          cta: { type: Type.STRING },
          imageSearchQuery: { type: Type.STRING },
          entryEffect: {
            type: Type.STRING,
            enum: [
              'none',
              'fade',
              'close-up',
              'slide-top',
              'slide-bottom',
              'slide-left',
              'slide-right',
              'scale-up',
            ],
          },
          speakerNote: { type: Type.STRING },
        },
        required: ['type', 'heading', 'speakerNote', 'layout'],
      },
    },
    bgmMood: {
      type: Type.STRING,
      enum: ['reverent', 'uplifting', 'warm', 'hopeful'],
    },
    musicSearchQuery: { type: Type.STRING },
    musicGenPrompt: { type: Type.STRING },
  },
  required: [
    'title',
    'churchName',
    'slides',
    'bgmMood',
    'musicSearchQuery',
    'musicGenPrompt',
  ],
};

export const structureChurchAd = async (
  text: string,
  profile?: ChurchProfile,
  titleHint?: string,
  opts: { verbatim?: boolean } = {}
): Promise<ChurchAdStructureResult> => {
  if (!process.env.GEMINI_API_KEY) throw new Error('GEMINI_API_KEY 미설정');

  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  const model = process.env.GEMINI_MODEL || 'gemini-2.5-flash-preview-04-17';
  const systemInstruction = opts.verbatim ? SYSTEM + SYSTEM_VERBATIM_OVERRIDE : SYSTEM;

  const profileBlock = profile
    ? [
        '[교회 프로필]',
        `이름: ${profile.churchName}`,
        profile.slogan ? `슬로건: ${profile.slogan}` : '',
        profile.pastorName ? `목사: ${profile.pastorTitle ?? '담임목사'} ${profile.pastorName}` : '',
        profile.address ? `주소: ${profile.address}` : '',
        profile.transit ? `교통: ${profile.transit}` : '',
        profile.phone ? `전화: ${profile.phone}` : '',
        profile.website ? `홈페이지: ${profile.website}` : '',
        profile.socials?.length ? `SNS: ${profile.socials.join(', ')}` : '',
        profile.services?.length
          ? '예배:\n' +
            profile.services
              .map((s) => `- ${s.name} | ${s.schedule}${s.place ? ` | ${s.place}` : ''}`)
              .join('\n')
          : '',
        profile.programs?.length
          ? '프로그램:\n' +
            profile.programs
              .map((p) => `- ${p.title}: ${p.description}${p.schedule ? ` (${p.schedule})` : ''}`)
              .join('\n')
          : '',
      ]
        .filter(Boolean)
        .join('\n')
    : '';

  const prompt = [
    titleHint ? `영상 제목 힌트: "${titleHint}"` : '',
    profileBlock,
    '[광고 본문 / 메모]',
    text,
  ]
    .filter(Boolean)
    .join('\n\n');

  const res = await ai.models.generateContent({
    model,
    contents: prompt,
    config: {
      systemInstruction,
      responseMimeType: 'application/json',
      responseSchema: SCHEMA,
      thinkingConfig: { thinkingBudget: 1024 },
    },
  });

  const parsed = JSON.parse(res.text || '{}') as ChurchAdStructureResult;

  // Defaults
  if (!parsed.churchName) parsed.churchName = profile?.churchName || '우리교회';
  if (!parsed.title) parsed.title = titleHint || `${parsed.churchName} 안내`;
  if (!parsed.accentColor) parsed.accentColor = profile?.accentColor || '#d4a657';      // warm gold
  if (!parsed.backgroundColor) parsed.backgroundColor = profile?.backgroundColor || '#0f1c2e';

  // Backfill service/program rows from profile if Gemini omitted them
  for (const slide of parsed.slides) {
    if (slide.type === 'worship-times' && (!slide.services || slide.services.length === 0)) {
      slide.services = profile?.services ?? [];
    }
    if (slide.type === 'programs' && (!slide.programs || slide.programs.length === 0)) {
      slide.programs = profile?.programs ?? [];
    }
    if (slide.type === 'pastor') {
      slide.pastorName ??= profile?.pastorName;
      slide.pastorTitle ??= profile?.pastorTitle;
    }
    if (slide.type === 'location') {
      slide.address ??= profile?.address;
      slide.transit ??= profile?.transit;
    }
    if (slide.type === 'contact') {
      slide.phone ??= profile?.phone;
      slide.website ??= profile?.website;
      slide.socials ??= profile?.socials;
    }
  }

  // ── Adaptive prune: drop slides Gemini included anyway despite no real
  // information available. Most common offender is `pastor` showing up with
  // no name even when the profile has none.
  parsed.slides = parsed.slides.filter((slide) => {
    switch (slide.type) {
      case 'pastor':
        return !!slide.pastorName?.trim();
      case 'worship-times':
        return Array.isArray(slide.services) && slide.services.length > 0;
      case 'programs':
        return Array.isArray(slide.programs) && slide.programs.length > 0;
      case 'location':
        return !!(slide.address?.trim() || slide.transit?.trim());
      case 'contact':
        return !!(slide.phone?.trim() || slide.website?.trim() || slide.socials?.length);
      case 'verse':
        return !!slide.verse?.trim();
      case 'event':
        return !!(slide.eventDate || slide.eventLocation || slide.heading?.trim());
      case 'mission':
        return !!slide.mission?.trim();
      case 'gallery':
        return Array.isArray(slide.galleryUrls) && slide.galleryUrls.length >= 3;
      case 'cover':
      case 'welcome':
      case 'invitation':
      default:
        return true; // structural / always-keep slides
    }
  });

  // Guarantee a cover slide is present — speakerNote left empty so TTS
  // doesn't read content that isn't in the user's script.
  if (!parsed.slides.some((s) => s.type === 'cover')) {
    parsed.slides.unshift({
      type: 'cover',
      heading: parsed.churchName,
      subheading: parsed.slogan || profile?.slogan,
      speakerNote: '',
    });
  }
  // Do NOT force-add an invitation slide — if it's not in the script,
  // it should not appear. Gemini will include it when the script warrants it.

  if (!Array.isArray(parsed.slides) || parsed.slides.length < 2) {
    parsed.slides = [
      {
        type: 'cover',
        heading: parsed.churchName,
        subheading: parsed.slogan || profile?.slogan,
        speakerNote: '',
      },
    ];
  }

  // ── Verbatim verification & auto-correction ─────────────────────────────
  // If the user asked for verbatim narration, sanity-check that each
  // speakerNote actually appears in their input text. If Gemini paraphrased
  // anyway, fall back to a sentence-by-sentence split of the original so the
  // TTS at least reads real user content. Heading/subheading/cta visual
  // fields are left as Gemini wrote them.
  if (opts.verbatim) {
    const norm = (s: string) =>
      s.replace(/\s+/g, '').replace(/[.,!?·…"'""''「」『』()()\-]/g, '');
    const sourceNorm = norm(text);
    const sentences = text
      .split(/(?<=[.!?。…])\s+|\n+/)
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    let cursor = 0;
    let needsFallback = false;
    for (const slide of parsed.slides) {
      const note = slide.speakerNote || '';
      if (!note) continue;
      const noteNorm = norm(note);
      if (!sourceNorm.includes(noteNorm)) {
        needsFallback = true;
        break;
      }
    }

    if (needsFallback && sentences.length > 0) {
      // Allocate sentences round-robin across slides so every slide gets
      // some user-original content, in order.
      const perSlide = Math.max(1, Math.ceil(sentences.length / parsed.slides.length));
      for (let i = 0; i < parsed.slides.length; i++) {
        const chunk = sentences.slice(cursor, cursor + perSlide);
        cursor += perSlide;
        if (chunk.length > 0) {
          parsed.slides[i].speakerNote = chunk.join(' ');
        } else {
          parsed.slides[i].speakerNote = '';
        }
      }
    }
  }

  // ── Layout diversity enforcement ─────────────────────────────────────
  // Guarantee every slide has a layout, and that photo-card variants are
  // distributed throughout (not just at the end or default-skipped).
  parsed.slides = enforceEntryEffectVariety(enforceLayoutVariety(parsed.slides));

  return parsed;
};

// ─────────────────────────────────────────────────────────────────────────────
// Layout variety enforcer
// Runs as post-processing to guarantee visual diversity regardless of what
// Gemini chose. Rules:
//  1. Every slide gets a layout (fill missing with type-appropriate default).
//  2. No more than 2 consecutive slides share the same layout.
//  3. photo-card variants cover at least 40% of slides (when ≥4 slides total).
// ─────────────────────────────────────────────────────────────────────────────
const PHOTO_CARD_LAYOUTS: SlideLayout[] = [
  'photo-card-bottom',
  'photo-card-side',
  'photo-card-bottom-left',
  'photo-card',
  'full-bleed',
  'immersive',
];

// Best layout for each slide type when none is specified
const TYPE_DEFAULT_LAYOUT: Record<string, SlideLayout[]> = {
  'cover':         ['immersive', 'photo-card-bottom', 'photo-card-side'],
  'welcome':       ['full-bleed', 'photo-card-bottom-left', 'photo-card-bottom'],
  'worship-times': ['photo-card-bottom', 'center', 'photo-card-bottom-left'],
  'programs':      ['news-grid', 'list-rows'],
  'pastor':        ['split-left'],
  'event':         ['full-bleed', 'photo-card-side', 'photo-card-bottom'],
  'verse':         ['immersive', 'photo-card', 'photo-card-bottom'],
  'location':      ['center', 'left'],
  'contact':       ['center', 'right'],
  'mission':       ['full-bleed', 'big', 'photo-card'],
  'gallery':       ['center'],
  'invitation':    ['immersive', 'photo-card-bottom', 'full-bleed'],
};

export function enforceLayoutVariety(slides: ChurchAdSlide[]): ChurchAdSlide[] {
  if (slides.length === 0) return slides;

  // Step 1: fill missing layouts with type-appropriate values
  slides = slides.map((s, i) => {
    if (!s.layout) {
      const options = TYPE_DEFAULT_LAYOUT[s.type] ?? ['center'];
      // Rotate through options so adjacent same-type slides differ
      s = { ...s, layout: options[i % options.length] };
    }
    return s;
  });

  // Step 2: break up 3+ consecutive identical layouts
  for (let i = 2; i < slides.length; i++) {
    if (slides[i].layout === slides[i - 1].layout && slides[i].layout === slides[i - 2].layout) {
      const options = TYPE_DEFAULT_LAYOUT[slides[i].type] ?? ['center', 'left', 'photo-card-bottom'];
      const current = slides[i].layout!;
      const alt = options.find((o) => o !== current) ?? (current === 'center' ? 'left' : 'center');
      slides[i] = { ...slides[i], layout: alt };
    }
  }

  // Step 3: ensure photo-card coverage for longer decks
  if (slides.length >= 4) {
    const photoCardCount = slides.filter((s) => s.layout && PHOTO_CARD_LAYOUTS.includes(s.layout)).length;
    const target = Math.ceil(slides.length * 0.4);
    if (photoCardCount < target) {
      // Promote center/left slides that aren't structural minimums to photo-card-bottom
      let promoted = 0;
      slides = slides.map((s, i) => {
        if (promoted >= target - photoCardCount) return s;
        if (['cover', 'invitation'].includes(s.type)) return s; // structural, already photo-card
        if (s.layout && PHOTO_CARD_LAYOUTS.includes(s.layout)) return s; // already photo-card
        if (['programs', 'pastor', 'gallery'].includes(s.type)) return s; // fixed layout types
        const nextLayout = PHOTO_CARD_LAYOUTS[promoted % PHOTO_CARD_LAYOUTS.length];
        promoted++;
        return { ...s, layout: nextLayout };
      });
    }
  }

  return slides;
}

const ENTRY_EFFECTS: NonNullable<ChurchAdSlide['entryEffect']>[] = [
  'fade',
  'slide-left',
  'slide-right',
  'slide-top',
  'slide-bottom',
  'close-up',
  'scale-up',
];

export function enforceEntryEffectVariety(slides: ChurchAdSlide[]): ChurchAdSlide[] {
  let mediaIndex = 0;
  return slides.map((slide) => {
    const hasMediaIntent = !!(slide.mediaUrl || slide.mediaDataUri || slide.imageSearchQuery || slide.galleryUrls?.length);
    if (!hasMediaIntent || slide.entryEffect) return slide;
    const entryEffect = ENTRY_EFFECTS[mediaIndex % ENTRY_EFFECTS.length];
    mediaIndex++;
    return { ...slide, entryEffect };
  });
}
