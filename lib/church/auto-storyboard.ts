// Auto-storyboard: given a script + a library of uploaded media, ask Gemini
// (multimodal) to (a) understand each image's content, then (b) plan a church
// ad slide structure where each slide is paired with the most fitting media.
//
// Inspired by:
//   - OpenMontage: CLIP-based semantic retrieval for "best footage per intent"
//     → here we replace CLIP with Gemini's native vision + text reasoning so
//       we don't add a separate embedding service.
//   - waoowaoo:   storyboard-from-script (script → ordered shot list).
//   - Jellyfish:  shot ↔ asset binding stays explicit (`mediaIndex` references
//                 the user's library, not anonymous URLs).

import { GoogleGenAI, Type } from '@google/genai';
import { readFile } from 'fs/promises';
import path from 'path';
import {
  type ChurchAdStructureResult,
  type ChurchAdSlide,
  type ChurchProfile,
  enforceEntryEffectVariety,
  enforceLayoutVariety,
} from './church-ad-structure';

export interface MediaLibraryItem {
  url: string;                   // /uploads/xxx.jpg or external https://
  mediaType: 'image' | 'video';
  contentType: string;           // mime
  filename?: string;
  /** Filled by autoCaptionMedia. */
  caption?: string;
}

const SYSTEM = `당신은 교회 홍보 영상 감독입니다.
사용자가 업로드한 미디어 라이브러리(사진/영상)와 선택적으로 짧은 메모/스크립트를
받아서, 1920×1080 가로형 광고 영상의 슬라이드 구성을 만들고 각 슬라이드에 가장
어울리는 미디어 1장을 라이브러리에서 골라 매핑하세요.

[입력 모드]
- 스크립트가 있는 경우: 스크립트의 흐름을 따르되, 사진과 매칭이 잘 되도록 슬라이드 분할
- 스크립트가 비어있거나 짧은 키워드/메모만 있는 경우: **사진 캡션을 분석해 광고문을 직접
  작성**하세요. 사진들이 어떤 분위기/주제(예배·환영·행사·풍경)인지 보고 그에 맞는 자연스러운
  교회 홍보 문장을 만들어 speakerNote/heading에 채워 넣으세요.

[슬라이드 타입 권장 순서]
cover → welcome → worship-times → programs → pastor → (event) → verse → location → contact → invitation
총 8-11장. 각 슬라이드의 type/heading/speakerNote는 LectureSlide 규칙과 동일.

[mediaIndex 규칙]
- 0부터 시작하는 정수, 라이브러리 인덱스
- 사진의 caption과 슬라이드 의도가 가장 잘 맞는 항목 선택
- 같은 미디어를 두 번 이상 쓰지 마세요 (라이브러리에 없을 때만 -1)
- 어울리는 미디어가 없으면 -1
- 인물 사진은 pastor / cover 슬라이드 우선
- 건물/예배당 사진은 cover / location / welcome 우선
- 군중·예배 장면은 welcome / programs / invitation 우선
- 풍경/단순 배경 사진은 verse / closing 우선

[speakerNote — 기본 모드]
- 자연스럽고 따뜻한 한국어 구어체
- 슬라이드당 5-9초 분량 (40-90자)

[출력 JSON 스키마] structureChurchAd 결과와 동일하되, 각 slide에 mediaIndex 필드 추가.`;

const SYSTEM_VERBATIM_OVERRIDE = `

⚠️ 중요 — 원문 보존 모드 (VERBATIM):
- speakerNote는 입력 본문의 문장을 **글자 그대로** 옮기세요.
- 단어 추가·삭제·재구성·요약·말투 변경 절대 금지.
- 슬라이드 단위로 본문을 자연스럽게 분할만 하면 됩니다.
- 본문에 없는 새 표현(예: "환영합니다", "이번 주일 함께해요") 만들지 마세요.
- 본문이 짧아 슬라이드를 다 못 채우면 speakerNote를 빈 문자열로 두세요.`;

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
              'full-bleed',
              'immersive',
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
              'zoom-in',
              'close-up',
              'slide-top',
              'slide-bottom',
              'slide-left',
              'slide-right',
              'scale-up',
            ],
          },
          speakerNote: { type: Type.STRING },
          mediaIndex: { type: Type.INTEGER },
        },
        required: ['type', 'heading', 'speakerNote', 'mediaIndex'],
      },
    },
    bgmMood: {
      type: Type.STRING,
      enum: ['reverent', 'uplifting', 'warm', 'hopeful'],
    },
    musicSearchQuery: { type: Type.STRING },
    musicGenPrompt: { type: Type.STRING },
  },
  required: ['title', 'churchName', 'slides', 'bgmMood', 'musicSearchQuery', 'musicGenPrompt'],
};

const localUrlToInline = async (url: string, contentType: string) => {
  if (!url.startsWith('/')) return null; // external, skip — Gemini doesn't fetch URLs
  const filePath = path.join(process.cwd(), 'public', url);
  const buf = await readFile(filePath);
  return { mimeType: contentType, data: buf.toString('base64') };
};

/**
 * Step 1: caption every image so the planning prompt has something concrete to
 * reason about (and so users can debug why a particular image got picked).
 * Videos are passed as text-only ("video clip: xxx") — we don't transcode here.
 */
export const autoCaptionMedia = async (
  library: MediaLibraryItem[]
): Promise<MediaLibraryItem[]> => {
  if (!process.env.GEMINI_API_KEY) throw new Error('GEMINI_API_KEY 미설정');
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  const model = process.env.GEMINI_MODEL || 'gemini-2.5-flash-preview-04-17';

  const out: MediaLibraryItem[] = [];
  for (const item of library) {
    if (item.mediaType !== 'image') {
      out.push({ ...item, caption: `(영상 클립: ${item.filename ?? item.url})` });
      continue;
    }
    try {
      const inline = await localUrlToInline(item.url, item.contentType);
      if (!inline) {
        out.push({ ...item, caption: `(외부 이미지: ${item.url})` });
        continue;
      }
      const res = await ai.models.generateContent({
        model,
        contents: [
          {
            role: 'user',
            parts: [
              {
                text:
                  '교회 광고 영상 편집자가 활용할 수 있도록 이 사진을 한국어로 한 문장(40자 이내)으로 묘사하세요. 사람 수, 분위기, 장소(실내/실외/예배당/카페 등), 색감의 분위기를 짧게.',
              },
              { inlineData: inline },
            ],
          },
        ],
      });
      const caption = (res.text || '').trim().slice(0, 80) || '(설명 없음)';
      out.push({ ...item, caption });
    } catch {
      out.push({ ...item, caption: '(캡션 실패)' });
    }
  }
  return out;
};

/**
 * Step 2: ask Gemini to design slides that reference media by index. Returns a
 * standard ChurchAdStructureResult with `mediaUrl`/`mediaType` already filled
 * in from the library on each slide.
 */
export const autoStoryboard = async (
  script: string,
  library: MediaLibraryItem[],
  profile?: ChurchProfile,
  titleHint?: string,
  opts: { verbatim?: boolean } = {}
): Promise<ChurchAdStructureResult> => {
  if (!process.env.GEMINI_API_KEY) throw new Error('GEMINI_API_KEY 미설정');
  if (library.length === 0) throw new Error('미디어 라이브러리가 비어있습니다');

  // Photo-only mode: when the script is empty/very short, the verbatim
  // constraint would force empty speakerNotes. Turn it off so Gemini can
  // generate ad copy from the captions.
  const photoOnly = !script || script.trim().length < 20;
  if (photoOnly) opts.verbatim = false;

  // Caption pass (so the planning prompt is text-only and cheap).
  const captioned = library.some((l) => l.caption)
    ? library
    : await autoCaptionMedia(library);

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
        profile.phone ? `전화: ${profile.phone}` : '',
        profile.website ? `홈페이지: ${profile.website}` : '',
        profile.services?.length
          ? '예배:\n' +
            profile.services
              .map((s) => `- ${s.name} | ${s.schedule}${s.place ? ` | ${s.place}` : ''}`)
              .join('\n')
          : '',
      ]
        .filter(Boolean)
        .join('\n')
    : '';

  const libBlock = captioned
    .map((m, i) => `[${i}] (${m.mediaType}) ${m.caption ?? '(설명 없음)'} — ${m.filename ?? m.url}`)
    .join('\n');

  const prompt = [
    titleHint ? `영상 제목 힌트: "${titleHint}"` : '',
    profileBlock,
    '[미디어 라이브러리]',
    libBlock,
    photoOnly
      ? '[광고 본문 / 메모]\n(없음 — 사진 캡션을 보고 자연스러운 교회 홍보 광고문을 직접 작성하세요. 사진들의 분위기·주제를 종합해 어울리는 슬라이드 구성 + speakerNote를 채워 넣으세요.)' +
        (script ? `\n\n사용자 힌트 키워드: "${script.trim()}"` : '')
      : `[광고 본문 / 메모]\n${script}`,
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
      thinkingConfig: { thinkingBudget: 6000 },
    },
  });

  const parsed = JSON.parse(res.text || '{}') as ChurchAdStructureResult & {
    slides: (ChurchAdSlide & { mediaIndex?: number })[];
  };

  if (!parsed.churchName) parsed.churchName = profile?.churchName ?? '우리교회';
  if (!parsed.title) parsed.title = titleHint ?? `${parsed.churchName} 안내`;
  if (!parsed.accentColor) parsed.accentColor = profile?.accentColor ?? '#d4a657';
  if (!parsed.backgroundColor) parsed.backgroundColor = profile?.backgroundColor ?? '#0f1c2e';

  // Resolve mediaIndex → mediaUrl
  const used = new Set<number>();
  for (const slide of parsed.slides) {
    const idx = (slide as any).mediaIndex;
    if (typeof idx === 'number' && idx >= 0 && idx < captioned.length) {
      const item = captioned[idx];
      slide.mediaUrl = item.url;
      slide.mediaType = item.mediaType;
      used.add(idx);
    }
    delete (slide as any).mediaIndex;
  }

  // Backfill profile data the same way structureChurchAd does.
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

  parsed.slides = enforceEntryEffectVariety(enforceLayoutVariety(parsed.slides));

  return parsed;
};
