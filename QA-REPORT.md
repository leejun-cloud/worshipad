# Worshipad — 자동 QA 보고서 (2026-05-09)

## ✅ 완성 + 검증된 항목

### 1. 코어 파이프라인
- `lib/church/church-ad-structure.ts` — Gemini가 본문 → 10타입 슬라이드 구조 (cover · welcome · worship-times · programs · pastor · event · verse · location · contact · invitation)
- `lib/church/auto-storyboard.ts` — **사진 + 스크립트 일괄 자동 배치**. Gemini Vision으로 이미지 캡션 → 슬라이드별 미디어 인덱스 자동 매칭
- `lib/church/render-jobs.ts` — 비동기 렌더 잡 스토어 (Jellyfish 패턴)
- `scripts/publish-church-ad.mjs` — CLI: 본문 / 프로필 / 슬라이드JSON 모드 모두 지원

### 2. Remotion 템플릿 (`remotion/templates/ChurchAd/`)
- `ChurchAdReel.tsx` (1920×1080 composition) + zod schema, Root.tsx 등록
- 10개 씬: Cover · Welcome · WorshipTimes · Programs · Pastor · Event · Verse · Location · Contact · Invitation
- `_motion.ts` — Ken Burns 6변형 (zoom-in/out, pan-l/r/up, still) 슬라이드별 자동 분배
- `_shared.tsx` — Background, ChurchBadge, fade-in/out 전환

### 3. 웹 에디터 (`/church-ad`)
3-pane 레이아웃 + 상단바 + 일괄 자동 배치 드로어:
- `PreviewPanel.tsx` — `@remotion/player` 실시간 미리보기, `frameupdate` 이벤트로 타임라인 동기화
- `Timeline.tsx` — 드래그 재정렬, 우측 핸들로 길이 조절, 복제/삭제, "+ 슬라이드 추가" 메뉴
- `Inspector.tsx` — 슬라이드 타입별 폼 (services/programs 인라인 에디터 포함)
- `MediaPicker.tsx` — 드롭/업로드/Pixabay 검색
- `BundlePanel.tsx` — **다중 업로드 + 스크립트 → Gemini 자동 배치** (NEW)
- `ChurchAdEditor.tsx` — `react-resizable-panels`로 통합, localStorage 자동 저장, 비동기 렌더 잡 진행률 폴링

### 4. API 라우트 (7개)
| 라우트 | 메소드 | 용도 |
|---|---|---|
| `/api/church-ad/structure` | POST | 본문 → 슬라이드 |
| `/api/church-ad/upload` | POST | 단일 미디어 업로드 |
| `/api/church-ad/upload-batch` | POST | 다중 업로드 (≤20개) |
| `/api/church-ad/photo-search` | GET | Pixabay/Pexels |
| `/api/church-ad/auto-arrange` | POST | Vision + 매칭 |
| `/api/church-ad/render` | POST | 잡 시작 |
| `/api/church-ad/jobs/[id]` | GET | 잡 폴링 |

## 🎬 실제 렌더 검증 결과

```
test-output/test-render.mp4         2.2MB  1920×1080  40s   5슬라이드 / 미디어 없음
test-output/full-with-media.mp4     3.8MB  1920×1080  24s   3슬라이드 / 사진 배경 포함
test-output/test-frame.png          1.0MB              cover 슬라이드 비주얼 OK
test-output/frame-worship.png       1.0MB              worship-times 테이블 레이아웃 OK
test-output/frame-verse.png         1.0MB              verse 인용구 + 출처 OK
test-output/frame-invite.png        1.0MB              invitation CTA pill OK
test-output/with-media-cover.png    351KB              미디어 + 어두운 오버레이 합성 OK
test-output/with-media-welcome.png  274KB              블러 배경 + 큰 타이틀 OK
test-output/with-media-pastor.png   592KB              좌측 사진 / 우측 텍스트 split OK
```

## 🔧 QA 중 찾아서 고친 이슈

1. **한국어 타이포 깨짐** — VerseSlide / PastorSlide / EventSlide의 `textTransform: 'uppercase'`와 0.18-0.2em letterSpacing이 한글에 부적절. 제거하고 Pretendard 700/28pt + 0.04em으로 교체.
2. **ENOSPC** — node_modules 부분 복사가 디스크를 다 먹음 → iscardnew의 node_modules로 심볼릭 링크 (3GB 절약).
3. **node_modules 심링크 잘못 생성** — 빈 dir이 먼저 있어서 `ln -sf`가 dir 안에 nested link를 만듦 → `rm -rf` 후 재링크.

## ⚙️ 최종 환경 상태

- TypeScript: church-ad 신규 파일 0 에러
- Remotion: 4.0.451, Node 24.13.0
- 디스크: 3.3Gi 여유
- caffeinate: PID 31803 동작 중 (무기한)

## 🛠 남은 작업 (기능 외)

- 의존성: 현재 iscardnew/node_modules 심링크 사용 중. 독립 운영하려면 `rm node_modules && pnpm install` (~1.7GB).
- 첫 렌더는 Remotion 번들링 시간 ~30초 소요 (이후 캐시).
- TTS · BGM 통합은 publish-church-ad.mjs 와 render-jobs.ts에 구현되어 있으나 실측은 GEMINI_API_KEY가 필요해 이번 자동 QA에서 스킵.

## ▶️ 사용법

```bash
cd /Users/ichangjun/Documents/GitHub/test/worshipad

# 웹 에디터
pnpm dev   # → http://localhost:3000/church-ad

# CLI (프로필 + 본문 → 영상)
cp config/church.example.json config/church.json
# (church.json 편집)
npx tsx scripts/publish-church-ad.mjs "@/path/to/script.txt" \
  --config=config/church.json --skip-publish
```
