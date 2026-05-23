# Worshipad — Church Ad Editor & Pipeline

card-reels 파이프라인을 베이스로 **교회 광고 영상(1920×1080, D형)** 전용 슬라이드 + **웹 타임라인 에디터**를 추가한 스킬입니다.

## ⚠️ 영상 유형 구분 (중요)

| 요청 키워드 | 스크립트 | 형식 |
|---|---|---|
| **"교회 광고", "교회 홍보영상", "예배 안내 영상"** | **`publish-church-ad.mjs`** | **1920×1080, 교회 전용 10슬라이드** |
| "강의영상", "유튜브영상" | `publish-lecture.mjs` | 1920×1080 가로형, 일반 강의 |
| "릴스", "카드뉴스", "쇼츠", "인스타영상" | `publish-content.mjs` | 9:16 세로형, IG+YouTube Shorts |
| "포토 카드뉴스" | `publish-photo.mjs` | AI 이미지 배경 카드뉴스 |

## 🌐 웹 에디터 — 실시간 미리보기 + 타임라인 (NEW)

```bash
pnpm dev   # → http://localhost:3000/church-ad
```

**3-pane 레이아웃**:
- **좌상**: Remotion Player 실시간 미리보기 (1920×1080 비율 유지, 슬라이드 클릭 시 자동 시킹)
- **우측 Inspector**: 선택된 슬라이드 타입별 폼 — 텍스트, 미디어 교체(드롭/업로드/Pixabay 검색), 내레이션, 재생시간 슬라이더
- **하단 Timeline**: 드래그 재정렬 · 우측 핸들로 길이 조절 · 복제/삭제 · "+ 슬라이드 추가" 메뉴

**상단 바**: 교회 이름·제목 인라인 편집, 강조/배경 컬러피커, "본문에서 생성"(Gemini), "🎬 영상 렌더"(비동기 잡 + 진행률 바).
프로젝트는 `localStorage`(`church-ad-project-v1`)에 자동 저장.

**API 라우트**:
- `POST /api/church-ad/structure` — Gemini로 본문 → 10타입 슬라이드
- `POST /api/church-ad/upload` — 단일 미디어 업로드 (`public/uploads/`, ≤80MB)
- `POST /api/church-ad/upload-batch` — 다중 업로드 (한 번에 20개)
- `GET  /api/church-ad/photo-search?q=...` — Pixabay/Pexels 검색
- `POST /api/church-ad/auto-arrange` — Gemini Vision: 사진 캡션 → 슬라이드 자동 매칭
- `POST /api/church-ad/render` → `{jobId}` (비동기)
- `GET  /api/church-ad/jobs/{id}` — 진행 상태 폴링 (preparing→rendering→ready)

## ✨ 일괄 자동 배치 (NEW — 핵심 기능)

영감: **OpenMontage**(CLIP 기반 의미 매칭) + **waoowaoo**(스토리보드) + **Jellyfish**(샷 단위 에셋 관리).
사진/영상을 한꺼번에 올리고 스크립트를 붙여넣으면, 시스템이:

1. **`autoCaptionMedia`** — Gemini Vision이 각 사진을 한국어 한 문장으로 묘사
2. **`autoStoryboard`** — 캡션 + 스크립트 + 교회 프로필을 통합해서 슬라이드 구성을 생성하고, **각 슬라이드마다 라이브러리 인덱스를 골라 자동 매칭**
3. 결과가 에디터로 로드 — 미리보기 즉시 반영, 마음에 안 들면 인스펙터에서 슬라이드별 미디어 교체

```ts
// 코드에서 직접 호출도 가능
import { autoStoryboard } from '@/lib/church/auto-storyboard';
const project = await autoStoryboard(scriptText, mediaLibrary, profile);
```

웹 에디터의 상단 **✨ 일괄 자동 배치** 버튼 → 드롭존 + 스크립트 textarea → 실행.

## 🎨 영상 퀄리티 부스트

- **Ken Burns 변형**: `pickMotion(slideIndex)`이 zoom-in / zoom-out / pan-left/right/up 6패턴을 슬라이드별로 자동 분배 — 인접 슬라이드끼리 같은 모션 중복 방지 (`remotion/templates/ChurchAd/scenes/_motion.ts`).
- **스마트 길이**: `estimateDurationSec(speakerNote)` — 한국어 3.5음절/초 기준 [3, 14]초 클램프. 새 슬라이드 추가 시 내레이션 길이 따라 자동.
- **크로스페이드**: 각 씬 시작 12프레임 페이드인 + 끝 12프레임 페이드아웃 (Background 헬퍼).
- **타이포 정리**: 한국어에서 부적절했던 `textTransform: uppercase`와 0.18em 이상 letterSpacing 제거 → Pretendard Black 가독성 회복.

## ⚠ 알려진 한계 (배포 전 반드시 확인)

이 프로젝트는 **로컬 단일 Node 프로세스 MVP** 전제로 설계됨. 다음은 서버리스/배포 전환 시 교체가 필요:

| 한계 | 위치 | 배포 시 대응 |
|---|---|---|
| **렌더 잡 메모리 저장소** | `lib/church/render-jobs.ts` `Map` | Firestore/PG로 잡 상태 저장 + 별도 worker(예: Cloud Run, EC2)에서 렌더 → 결과 URL을 잡에 update |
| **잡 폴링 다중 인스턴스 미스** | `app/api/church-ad/jobs/[id]` | 동일 — DB 기반 상태 조회 |
| **`ignoreBuildErrors: true`** | `next.config.mjs` | CI에서 `npx tsc --noEmit`을 별도 step으로 강제. 현재 Next 빌드는 타입 검증을 건너뜀 |
| **GEMINI/Pixabay/Jamendo 키 없음** | `.env.local` 누락 시 | `synthesizeSegments` / `fetchPhoto` / `fetchBgm` 모두 graceful 폴백되지만 결과물 품질은 키 보유 시 베이스 |

✅ **이미 적용된 안정성 개선** (피드백 반영):
- 렌더가 프로젝트의 `audioUrl` / `bgmUrl` / `sceneDurationsSec`를 재사용 → 프리뷰와 최종 MP4가 같은 데이터를 사용 (`render-jobs.ts:108-152`)
- TTS/BGM/스톡 사진/photo-search/BadgePanel 로고·사진을 모두 `public/audio`, `public/bgm`, `public/uploads`에 파일로 저장 → localStorage·POST body가 base64 폭주에서 자유로움
- 자동 사진 매칭은 `lib/church/persist-media.ts`로 통일
- localStorage 저장 직전 모든 `*DataUri` 필드 strip — 구버전 잔재가 5MB 쿼터를 침범 못 함 (`ChurchAdEditor.tsx:persist-effect`)
- 자동 일괄 생성 시 사용자 핀 식별자 (`churchName`/`badge`/`accentColor`/`backgroundColor`/`slogan`) 절대 덮어쓰지 않음 — Gemini가 스크립트에서 다른 교회 이름을 추정해도 무시
- 파이프라인 부분 실패는 `partialFailures[]`로 수집해 상단 빨간 배너에 노출 — 침묵 catch{} 제거
- `scripts/cleanup-church-ad.mjs` — `node scripts/cleanup-church-ad.mjs --olderThan=24` 로 자동 사진/TTS/BGM 캐시 정리 (사용자 업로드 파일은 보호)

## 🧪 검증 (자동 QA 결과 — 2026-05-09)

- TypeScript: church-ad 신규 파일 0 에러
- Remotion 풀 렌더: 1920×1080 H.264 — 5슬라이드/40초 2.2MB, 3슬라이드+미디어/24초 4MB
- 비주얼 QA (test-output/*.png): cover · welcome · worship-times · verse · invitation · pastor 6타입 검수 통과
- 미디어 오버레이: 사진 dataUri + 0.66~0.78 어두운 오버레이 + 블러 배경 정상 합성

## ⛪ 교회 광고 — CLI 사용

```bash
# 1. 프로필 + 본문으로 자동 구성 + 렌더 + 발행 안 함
npx tsx scripts/publish-church-ad.mjs "@/path/to/ad-content.txt" \
  --config=config/church.json --skip-publish

# 2. 본문 직접 입력 + 제목 + 컬러
npx tsx scripts/publish-church-ad.mjs "본문..." \
  --title="우리교회 초대" --accent="#d4a657" --bg="#0f1c2e" --skip-publish

# 3. 웹 에디터에서 슬라이드만 export → 렌더만 (재구조화 X)
npx tsx scripts/publish-church-ad.mjs --slides=out/church-ad-XXXX/slides.json
```

`config/church.example.json`을 복사해서 `config/church.json`을 만들고 교회 정보(이름·주소·예배 시간·사역·SNS·컬러) 채우면 매 영상마다 재사용됩니다.

### 슬라이드 10타입

| type | 용도 |
|---|---|
| `cover` | 교회 이름 + 슬로건 (히어로) |
| `welcome` | 환영 메시지 + 비전 한 줄 |
| `worship-times` | 예배 시간표 (이름/시간/장소 행) |
| `programs` | 사역·프로그램 카드 그리드 (3-5개) |
| `pastor` | 담임목사 소개 (좌측 사진 / 우측 텍스트) |
| `event` | 특별 행사 (날짜·장소 뱃지) |
| `verse` | 말씀 인용 + 출처 |
| `location` | 주소 + 교통 |
| `contact` | 전화·홈페이지·SNS |
| `invitation` | 클로징 CTA |

## 빠른 트리거

사용자가 다음 패턴으로 요청하면 자동 실행:
- "카드뉴스 만들어줘: [본문]"
- "릴스 만들어줘: [본문]"
- "콘텐츠 만들어줘: [본문]"
- "이 글로 영상 만들어"
- "유튜브 강의 영상 만들어줘: [본문]"

→ 스킬 정의: [skill-package/SKILL.md](skill-package/SKILL.md)

## 메인 명령어

```bash
# ── 강의 영상 (YouTube 전용, 1920×1080) ──
npx tsx scripts/publish-lecture.mjs "@/path/to/content.txt"
npx tsx scripts/publish-lecture.mjs "@/path/to/content.txt" --skip-publish
npx tsx scripts/publish-lecture.mjs "@/path/to/content.txt" --yt-private
npx tsx scripts/publish-lecture.mjs "@/path/to/content.txt" --title="강의 제목"

# ── 릴스/쇼츠 (IG + YouTube Shorts, 9:16) ──
# 1. 영상 + 카드뉴스 생성 (검토용, 발행 X)
npx tsx scripts/publish-content.mjs "본문 내용" --skip-publish

# 2. 검토 후 발행만 (재생성 안 함)
npx tsx scripts/publish-existing.mjs out/content-XXXXX

# 3. 한 번에 생성 + 발행
npx tsx scripts/publish-content.mjs "본문 내용"

# 4. 포토 카드뉴스 (AI 이미지 배경 + 굵은 카피, 손힘찬 스타일)
npx tsx scripts/publish-photo.mjs "@/path/to/content.txt"
npx tsx scripts/publish-photo.mjs --auto   # 토픽 자동 발굴

# 5. 자동 모드 (토픽 발굴 → 제목 생성 → 파이프라인)
npx tsx scripts/publish-auto.mjs --count=2 --strategy=pool
```

## 강의 영상 처리 단계 (publish-lecture.mjs)

1. **Gemini 슬라이드 구조화** — title/agenda/content/summary/cta 슬라이드 자동 생성
2. **배경 미디어 검색** — Pixabay/Pexels에서 슬라이드별 배경 이미지/영상 검색
3. **BGM 검색/생성** — Jamendo → Lyria → fallback
4. **슬라이드별 TTS** — Gemini 한국어 음성 (Kore 보이스)
5. **LectureReel MP4 렌더** — Remotion 1920×1080
6. **썸네일 생성** — YouTube용 thumbnail.jpg
7. **YouTube 발행** — 챕터 타임스탬프 자동 생성, Instagram 발행 안 함

강의 영상 결과 경로: `out/lecture-XXXX/`

## 옵션 플래그
- `--skip-publish` — 발행 건너뜀
- `--skip-yt` / `--skip-ig` — 한쪽만
- `--yt-private` — YouTube 비공개
- `--yt-unlisted` — YouTube 미등록

## 처리 단계 (publish-content.mjs)

1. **Gemini 분류** ([lib/reels/classify.ts](lib/reels/classify.ts)) — 5가지 템플릿 + 카드 스타일 자동 결정
   → **표지 후킹 재작성** ([lib/reels/hook-headline.ts](lib/reels/hook-headline.ts)) — list·news의 headline을 6가지 후킹 패턴으로 강화
2. **멀티에이전트 검증** ([lib/reels/review.ts](lib/reels/review.ts)) — 후킹 점수 7점 미만이면 재작성
3. **BGM 검색/생성** ([lib/reels/music-fetcher.ts](lib/reels/music-fetcher.ts)) — Jamendo → Lyria → fallback
4. **장면별 TTS** ([lib/reels/tts.ts](lib/reels/tts.ts)) — Gemini 한국어 음성, 카드와 동기화
5. **MP4 렌더** ([lib/reels/render.ts](lib/reels/render.ts)) — Remotion
6. **PNG 추출** — 각 카드별 정지 이미지
7. **메타데이터 생성** ([lib/reels/metadata.ts](lib/reels/metadata.ts)) — IG 캡션·해시태그, YT 제목·태그
8. **자동 발행** ([lib/reels/multi-publish.ts](lib/reels/multi-publish.ts)) — IG + YouTube

## 5가지 템플릿

| 템플릿 | 자동 선택 시점 |
|---|---|
| `action` | 챌린지·실천 권유 (단일 행동) |
| `emotion` | 감동 스토리·간증 |
| `news` | 행사·공지·발표 |
| `insight` | 명언·통찰 (한 문장) |
| `list` | "5가지 방법", "7단계" 같은 N개 항목 |
| `photo` | 손힘찬 스타일 포토 카드뉴스 (AI 이미지 배경) |

## LIST의 10가지 카드 스타일

`default · stat · quote · bigdata · split · steps · grid · highlight · statgrid · iconfeature`

각 항목마다 자동 분배 ([remotion/templates/List/scenes/](remotion/templates/List/scenes/))

## 환경변수 (필수만 강조)

| 변수 | 필요? | 없으면? |
|---|---|---|
| `GEMINI_API_KEY` | **필수** | 동작 안 함 |
| `JAMENDO_CLIENT_ID` | 선택 | 기본 BGM 사용 |
| `VERTEX_AI_API_KEY`+`VERTEX_AI_PROJECT_ID` | 선택 | Lyria 비활성 |
| `INSTA_ACCESS_TOKEN`+`INSTA_ACCOUNT_ID` | 선택 | IG 발행 안 함 |
| `YOUTUBE_*` (3개) | 선택 | YT 발행 안 함 |
| `FIREBASE_ADMIN_KEY_JSON` | 선택 | catbox.moe로 폴백 |

전체: [.env.example](.env.example)

## 주요 파일 위치

```
lib/reels/
  classify.ts          # Gemini 분류 + 카드 스타일 결정
  hook-headline.ts     # 표지 제목을 바이럴 후킹 패턴으로 재작성
  tts.ts              # Gemini TTS (장면별 합성 + WAV 변환)
  render.ts           # Remotion 렌더링 (번들 캐싱)
  metadata.ts         # 클릭 최적화 카피 생성
  music-fetcher.ts    # BGM 오케스트레이션
  jamendo.ts          # 무료 음악 API
  lyria.ts            # AI 음악 생성 (Vertex AI)
  image-gen.ts        # AI 이미지 생성 (Imagen 3, Vertex AI)
  photo-structure.ts  # 포토 카드뉴스 구조화 (Gemini)
  review.ts           # 멀티에이전트 검증
  multi-publish.ts    # IG + YouTube 동시 발행

lib/auto/
  topic-discovery.ts  # 토픽 자동 발굴 (pool/news/ai)
  title-generator.ts  # 바이럴 제목 생성 + 후킹 랭킹
  content-from-title.ts # 제목으로 본문 자동 생성

scripts/
  publish-content.mjs   # 릴스/쇼츠: 생성 + 발행 통합 (9:16, IG+YT)
  publish-lecture.mjs   # 강의 영상: 1920×1080 가로형, YouTube 전용
  publish-anime.mjs     # 애니메이션 영상
  publish-existing.mjs  # 기존 콘텐츠 발행만
  publish-photo.mjs     # 포토 카드뉴스 생성 + 발행
  publish-auto.mjs      # 자동 모드: 토픽→제목→본문→파이프라인
  youtube-oauth.mjs     # YouTube 1회 인증
  test-*.mjs            # 단위 테스트들

logs/
  auto-YYYY-MM-DD.jsonl # 자동 발행 실행 로그 (배치별 JSONL)

remotion/
  Root.tsx              # 6개 Composition 등록 (Photo 포함)
  fonts.ts              # Pretendard 로딩
  components/
    BgmTrack.tsx        # BGM 페이드인/아웃 + 루프
  templates/
    Action/, Emotion/, News/, Insight/, List/
```

## 디버깅 팁

- 분류 결과만 보기: `out/content-XXX/draft.json`
- 메타데이터 확인: `out/content-XXX/metadata.json`
- 발행 결과: `out/content-XXX/publish-result.json`
- 영상 직접 재생: `open out/content-XXX/reels.mp4`

## 주의사항

- **bgm.wav** (public/) 의 라이선스를 확인 후 공유 (또는 CC0 트랙으로 교체)
- API 키는 `.env.local` 외 어디에도 노출 금지 (`.gitignore` 확인됨)
- 일일 YouTube 업로드 한도 6개 (할당량 1600/upload, 일일 10000)
- Gemini TTS preview 상태이므로 안정성 변동 가능
