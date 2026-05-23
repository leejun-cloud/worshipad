# 🎬 Card News + Reels Skill

> 한 문단의 본문만 있으면 → **카드뉴스(PNG) + 릴스(MP4)** 자동 생성 + Instagram/YouTube 자동 발행
> 또는 **본문 없이 AI가 토픽 발굴**부터 발행까지 완전 자동

Claude Code 스킬 **5종**으로 패키징.

| 타입 | 이름 | 형식 | 특징 |
|---|---|---|---|
| 🅰️ | card-reels | 세로 1080×1920 | 타이포그래피 카드뉴스, 5가지 템플릿 |
| 🅱️ | auto-shorts | 세로 1080×1920 | 토픽 자동 발굴 → 발행까지 완전 자동 |
| 🅲 | photo-card-news | 세로 1080×1920 | AI 이미지 배경 + 굵은 카피 (손힘찬 스타일) |
| 🅳 | lecture-video | **가로 1920×1080** | 슬라이드 기반 강의 영상, YouTube 전용 |
| 🅴 | anime-video | **가로 1920×1080** | GPT-Image-2 + Wan 2.2 AI 애니메이션 영상 |

---

### 🅰️ card-reels — 본문 → 타이포그래피 영상
```
"카드뉴스 + 릴스 만들어줘:
AI 시대 평가, 무엇이 달라져야 할까?
1. 루브릭 공동 제작 ..."
```
→ 5가지 템플릿 (action/emotion/news/insight/list), 10가지 카드 스타일 자동 선택

### 🅱️ auto-shorts — 자동 토픽 → 영상 (cron 가능)
```
"오늘 영상 자동으로 4개 만들어 발행해줘"
"교육 카테고리에서 자동으로 영상 만들어"
"매일 정오에 자동 발행 시작"
```
→ 토픽 발굴 → 바이럴 제목 → 본문 생성 → 발행까지 완전 자동

### 🅲 photo-card-news — 손힘찬 스타일 포토 카드뉴스
```
"포토 카드뉴스 만들어줘: [본문]"
"손힘찬 스타일로 만들어줘"
"C형 카드뉴스"
```
→ AI 이미지(Pixabay/Pexels) 배경 + 굵은 한 줄 카피. 스크롤을 멈추는 시네마틱 스타일

### 🅳 lecture-video — 가로형 강의 영상 ✨ NEW
```
"강의 영상 만들어줘: [본문]"
"D형 강의"
"유튜브 강의 만들어줘"
```
→ 1920×1080 슬라이드 기반. 제목→목차→본문→요약 구성. YouTube 자동 챕터 생성

### 🅴 anime-video — AI 애니메이션 영상 ✨ NEW
```
"애니메이션 만들어줘: [스토리]"
"E형 영상"
"이 이야기로 애니메이션 만들어줘"
```
→ GPT-Image-2 이미지 + Wan 2.2 Ultra Fast 영상 + 자막 자동 합성. 어린이 콘텐츠·우화·동화에 최적

---

## ✨ 무엇이 만들어지나

| 결과물 | 형식 | 용도 |
|---|---|---|
| 🎬 릴스 영상 | MP4 (1080×1920, 9:16) | Instagram Reels, YouTube Shorts, TikTok |
| 🖼️ 카드뉴스 | PNG (1080×1920) × N장 | Instagram 피드 캐러셀 |
| 🎙️ 내레이션 | WAV (Gemini TTS, 한국어) | 영상 음성 |
| 🎵 배경음악 | 무료 검색 (Jamendo) + AI 생성(Lyria 2) | 콘텐츠 무드 매칭 |
| 📱 캡션·해시태그 | 클릭 최적화 (Gemini) | IG·YT 동시 발행용 |

---

## 🔥 자동 처리되는 것

1. **콘텐츠 분류** — 본문 보고 6가지 템플릿 (action/emotion/news/insight/list/**photo**) 중 자동 선택
2. **카드 스타일 다양화** — 항목별로 10가지 스타일 (stat/quote/grid/steps/highlight 등) 자동 매칭
3. **장면별 음성 동기화** — 카드가 멘트 끝까지 머무름, 빨리 안 넘어감
4. **숫자 한글 변환** — TTS가 "5"를 "다섯"으로 자연스럽게 읽음
5. **멀티에이전트 검증** — 후킹 점수 7점 미만이면 자동 재작성
6. **무드 매칭 BGM** — 콘텐츠에 어울리는 음악 자동 검색/생성
7. **클릭 최적화 메타데이터** — IG 캡션, YT 제목 자동 작성
8. **자동 발행** — Instagram + YouTube 동시 업로드

---

## 🚀 빠른 시작

### 사전 요구사항
- Node.js 20+
- ffmpeg (`brew install ffmpeg` 또는 `apt-get install ffmpeg`)
- Claude Code (https://claude.com/claude-code)

### 1) 설치

```bash
git clone https://github.com/YOUR_USERNAME/card-reels-skill.git
cd card-reels-skill
pnpm install   # 또는 npm install
```

### 2) 최소 설정 (Gemini API 키만 필요)

[Google AI Studio](https://aistudio.google.com/apikey)에서 무료로 API 키 발급:

```bash
cp .env.example .env.local
# .env.local 열어서 GEMINI_API_KEY 만 채우기
```

### 3) 실행

```bash
# 본문 직접 입력
npx tsx scripts/publish-content.mjs "오늘의 콘텐츠 본문..." --skip-publish

# 또는 파일에서
npx tsx scripts/publish-content.mjs "@/path/to/content.txt" --skip-publish
```

→ `out/content-XXXX/` 폴더에 영상 + 카드뉴스 PNG + 메타데이터 JSON 생성됨.

### 4) Claude Code에서 자동 호출 (선택)

```bash
# 스킬 설치
cp skill-package/SKILL.md ~/.claude/skills/card-reels/SKILL.md
```

이제 Claude Code에서 자연어로:
```
"카드뉴스 + 릴스 만들어줘: [본문]"
```

---

## 🔧 추가 기능 활성화 (선택)

`.env.local`에 키만 추가하면 자동 작동.

| 기능 | 환경변수 | 발급처 | 비용 |
|---|---|---|---|
| **무료 BGM 검색** | `JAMENDO_CLIENT_ID` | https://devportal.jamendo.com/ | 무료 |
| **AI 음악 생성** | `VERTEX_AI_API_KEY` + `VERTEX_AI_PROJECT_ID` | GCP + Vertex AI 활성화 | $0.06/30s |
| **Instagram 자동 발행** | `INSTA_ACCESS_TOKEN` + `INSTA_ACCOUNT_ID` | Meta for Developers | 무료 |
| **YouTube 자동 발행** | `YOUTUBE_*` (3개) | GCP OAuth | 무료 |

→ 키 없으면 해당 단계만 건너뛰고 계속 진행 (시스템은 멈추지 않음).

---

## 🎨 5가지 영상 템플릿

콘텐츠 성격에 맞춰 자동 선택:

| 템플릿 | 용도 | 길이 |
|---|---|---|
| **ACTION** | 챌린지·운동·실천 권유 | 15~25초 |
| **EMOTION** | 사연·간증·감동 스토리 | 40~60초 |
| **NEWS** | 행사·공지·발표 | 25~35초 |
| **INSIGHT** | 명언·통찰·짧은 교훈 | 20~30초 |
| **LIST** | "5가지 방법", "7단계" 등 | 30~90초 |

---

## 🎴 LIST 템플릿 — 10가지 카드 스타일

각 항목마다 콘텐츠 성격에 맞춰 자동 선택:

- `default` — 번호 + 제목 + 설명
- `stat` — 큰 퍼센트/수치 강조
- `quote` — 인용구 (Georgia serif)
- `bigdata` — 거대 숫자 + 단위 (예: "48.8조 원")
- `split` — A vs B 비교
- `steps` — 단계별 프로세스 (1→2→3)
- `grid` — 2x2 아이콘 그리드
- `highlight` — 핵심 한 문장 강조 박스
- `statgrid` — 미니 통계 3-4개 동시
- `iconfeature` — 거대 이모지 + 설명

---

## 📋 명령어 옵션

### 🅰️ 본문 모드 (card-reels)

```bash
npx tsx scripts/publish-content.mjs <본문> [옵션]

옵션:
  --skip-publish    발행 안 함 (영상만 생성, 메타데이터 검토용)
  --skip-yt         YouTube 발행 건너뜀
  --skip-ig         Instagram 발행 건너뜀
  --yt-private      YouTube 비공개 업로드 (테스트용)
  --yt-unlisted     YouTube 미등록 업로드
```

### 🅱️ 자동 모드 (auto-shorts)

```bash
npx tsx scripts/publish-auto.mjs [옵션]

옵션:
  --count=N         한 번 실행 시 영상 N개 생성 (기본: 1)
  --strategy=...    pool / news / ai (기본: pool)
  --category=...    토픽 풀 카테고리 (self_dev, ai_tech, education 등)
  --interest=...    AI 전략 시 관심 분야
  --cron="..."      cron 표현식, 스케줄 모드 (예: "0 12 * * *")
  --skip-publish    영상만 생성
  --skip-yt / --skip-ig / --yt-private / --yt-unlisted
```

### 자동 모드 흐름

```
1. 토픽 발굴 (config/topic-pool.json 또는 NewsAPI 또는 Gemini)
2. 바이럴 제목 8개 생성 + 후킹 점수 평가
3. 최고 점수 제목 선택
4. AI가 본문 자동 작성
5. card-reels 파이프라인 실행 (분류 → TTS → 렌더 → 발행)
```

### 🅲 포토 카드뉴스 — 손힘찬(@ogata_marito) 스타일

AI 이미지를 배경으로 굵고 짧은 카피를 올리는 감성·후킹형 영상.
타이포그래피 카드보다 인스타그램 피드에서 더 강하게 눈에 띔.

```bash
npx tsx scripts/publish-photo.mjs "@/path/to/content.txt" --skip-publish
npx tsx scripts/publish-photo.mjs --auto   # 토픽 자동 발굴
```

**구조**: 표지(후킹 1줄) → 카드 2-4장(이미지+카피) → CTA  
**배경**: Pixabay/Pexels 이미지·영상 자동 검색 → Canva → 그라디언트 폴백

| 기존 카드뉴스 (A형) | 포토 카드뉴스 (C형) |
|---|---|
| 색상 그라디언트 배경 | 실사 이미지·영상 배경 |
| 정보 위주 (설명·수치) | 감성/후킹 위주 (짧은 카피) |
| 세로 9:16, 텍스트 많음 | 세로 9:16, 텍스트 최소화 |

결과물: `out/photo-XXXXXX/reels.mp4`

---

### 🅳 강의 영상 (D형) — 가로형 슬라이드 YouTube 전용

1920×1080 가로형. 슬라이드 기반 구성으로 강의·교육 콘텐츠에 최적화.  
YouTube 자동 챕터(타임스탬프) 생성, 썸네일 자동 제작.

```bash
# 기본 생성 + 발행
npx tsx scripts/publish-lecture.mjs "@/path/to/content.txt"

# 발행 없이 생성만 (검토용)
npx tsx scripts/publish-lecture.mjs "@/path/to/content.txt" --skip-publish

# 제목·액센트 색상 지정
npx tsx scripts/publish-lecture.mjs "@content.txt" --title="강의 제목" --accent="#FF6B35"

# YouTube 미등록 (비공개 테스트)
npx tsx scripts/publish-lecture.mjs "@content.txt" --yt-unlisted
```

| 항목 | 내용 |
|---|---|
| 해상도 | 1920×1080 (16:9 가로형) |
| 슬라이드 구성 | 제목 → 목차 → 본문(4-8장) → 인용 → 요약 |
| 자동 챕터 | TTS 시간 기반 YouTube 챕터 타임스탬프 |
| 썸네일 | Remotion renderStill (1280×720) |
| 발행 | YouTube 전용 (Instagram은 세로형만 지원) |

결과물: `out/lecture-XXXXXX/lecture.mp4` + `thumbnail.jpg`

---

### 🅴 AI 애니메이션 (E형) — 스토리 → 움직이는 영상

스토리·시나리오를 AI가 장면으로 분해하고, 이미지→영상→TTS→자막을 자동 합성.  
어린이 콘텐츠, 우화, 동화, 교육 애니메이션에 최적화.

```bash
# 기본 생성 + 발행
npx tsx scripts/publish-anime.mjs "@/path/to/story.txt"

# 발행 없이 생성만 (검토용)
npx tsx scripts/publish-anime.mjs "@story.txt" --skip-publish

# 비용 절감 테스트 (영상 생성 생략, 이미지 스틸만)
npx tsx scripts/publish-anime.mjs "@story.txt" --text-only --skip-publish

# 자막 없이 생성
npx tsx scripts/publish-anime.mjs "@story.txt" --no-subtitle --skip-publish
```

| 항목 | 내용 |
|---|---|
| 해상도 | 1920×1080 (16:9 가로형) |
| 이미지 생성 | GPT-Image-2 via WaveSpeed ($0.06-0.18/장) |
| 영상 생성 | Wan 2.2 Ultra Fast via WaveSpeed ($0.01/초) |
| 자막 | FFmpeg 자동 번인, Pretendard Bold 폰트 |
| 캐릭터 일관성 | styleGuide + characterDescriptions 전 장면 공유 |
| 발행 | YouTube 전용 |

**비용 예시**: 8장면 × 7초 = 56초 → 이미지 ~$0.48-1.44 + 영상 $0.56

결과물: `out/anime-XXXXXX/anime.mp4` + `subtitles.srt`

---

### 자동 모드 예시

```bash
# 즉시 1개 자동 생성
npx tsx scripts/publish-auto.mjs

# 매일 정오에 4개 자동 발행 (Ctrl+C로 종료)
npx tsx scripts/publish-auto.mjs --cron="0 12 * * *" --count=4

# AI/기술 카테고리에서만, 비공개 테스트
npx tsx scripts/publish-auto.mjs --category=ai_tech --yt-private

# NewsAPI로 트렌딩 토픽 활용 (NEWS_API_KEY 필요)
npx tsx scripts/publish-auto.mjs --strategy=news --count=3
```

### 토픽 풀 커스터마이징
[config/topic-pool.json](config/topic-pool.json) 파일에서 카테고리·토픽 자유롭게 추가/수정.

### 검토 후 발행 워크플로우

```bash
# 1단계: 영상 생성 + 메타데이터 검토 (발행 X)
npx tsx scripts/publish-content.mjs "@/path/to/content.txt" --skip-publish

# 2단계: out/content-XXX/metadata.json 확인 → OK면 발행만
npx tsx scripts/publish-existing.mjs out/content-XXX
```

---

## 📁 프로젝트 구조

```
card-reels-skill/
├── remotion/                 # 영상 템플릿 (6종)
│   └── templates/
│       ├── Action/
│       ├── Emotion/
│       ├── News/
│       ├── Insight/
│       ├── List/             # 10가지 카드 스타일
│       └── Photo/            # ✨ NEW: 포토 카드뉴스 (이미지 배경)
├── lib/
│   ├── reels/
│   │   ├── classify.ts       # Gemini 분류 + 카드 스타일 결정
│   │   ├── hook-headline.ts  # ✨ 표지 제목 바이럴 후킹 패턴 강화
│   │   ├── photo-structure.ts # ✨ 포토 카드 구조화 (Gemini)
│   │   ├── image-gen.ts      # ✨ AI 이미지 생성 (Imagen 3, Vertex AI)
│   │   ├── tts.ts            # Gemini TTS 한국어 합성
│   │   ├── render.ts         # Remotion 렌더링
│   │   ├── metadata.ts       # 클릭 최적화 카피·해시태그
│   │   ├── music-fetcher.ts  # Jamendo + Lyria 음악
│   │   ├── lyria.ts          # AI 음악 생성
│   │   ├── multi-publish.ts  # IG + YouTube 동시 발행
│   │   └── review.ts         # 멀티에이전트 검증
│   └── auto/
│       ├── topic-discovery.ts # 토픽 자동 발굴
│       ├── title-generator.ts # 바이럴 제목 생성 + 랭킹
│       └── content-from-title.ts # 제목→본문 자동 생성
├── scripts/                  # 실행 스크립트
│   ├── publish-content.mjs   # 🅰️ 타이포그래피 카드뉴스 파이프라인
│   ├── publish-photo.mjs     # 🅲 포토 카드뉴스 파이프라인
│   ├── publish-lecture.mjs   # 🅳 가로형 강의 영상 파이프라인
│   ├── publish-anime.mjs     # 🅴 AI 애니메이션 파이프라인
│   ├── publish-existing.mjs  # 기존 영상 발행만
│   ├── publish-auto.mjs      # 🅱️ 자동 모드 (토픽→발행)
│   └── youtube-oauth.mjs     # YouTube 1회 인증
├── logs/                     # 자동 발행 실행 로그 (JSONL)
├── config/
│   └── topic-pool.json       # 자동 모드 토픽 풀 (커스터마이징 가능)
├── public/
│   ├── fonts/                # Pretendard 폰트
│   └── bgm/                  # BGM 라이브러리 (선택)
└── skill-package/            # Claude Code 스킬 패키지 (5종)
    ├── SKILL.md              # 🅰️ card-reels (타이포그래피)
    ├── SKILL-auto.md         # 🅱️ auto-shorts (자동 발행)
    ├── SKILL-photo.md        # 🅲 photo-card-news (포토 배경)
    ├── SKILL-lecture.md      # 🅳 lecture-video (가로형 강의)
    └── SKILL-anime.md        # 🅴 anime-video (AI 애니메이션)
```

---

## 🔐 환경변수 전체

[.env.example](.env.example) 참고. 필수는 `GEMINI_API_KEY` 1개.

---

## 💸 비용 추산

### 🅰️🅱️🅲 세로형 (카드뉴스·포토·자동) — 월 30개 기준

| 항목 | 무료 옵션 | 유료 옵션 |
|---|---|---|
| 분류·내레이션 (Gemini) | ✅ 무료 | - |
| TTS (Gemini) | ✅ 무료 | - |
| 배경 이미지·영상 | Pixabay/Pexels 무료 | - |
| BGM | Jamendo 무료 | Lyria $1.80/월 |
| 영상 호스팅 | catbox.moe 무료 | Firebase 무료~$1 |
| Instagram·YouTube 발행 | ✅ 무료 | - |
| **합계** | **0원** | **약 $3/월** |

### 🅳 강의 영상 (D형) — 영상 1개 기준

| 항목 | 비용 |
|---|---|
| Gemini 구성·TTS | 무료 |
| 배경 미디어 (Pixabay/Pexels) | 무료 |
| BGM | 무료 (Jamendo) |
| **합계** | **0원** |

### 🅴 AI 애니메이션 (E형) — 영상 1개(8장면 56초) 기준

| 항목 | 비용 |
|---|---|
| GPT-Image-2 이미지 8장 | $0.48 ~ $1.44 |
| Wan 2.2 Ultra Fast 영상 56초 | $0.56 |
| Gemini 구성·TTS·BGM | 무료 |
| **합계** | **약 $1 ~ $2/개** |

---

## 🤝 기여

이슈와 PR 환영합니다.

---

## 📄 라이선스

MIT License. [LICENSE](LICENSE) 참고.

생성되는 음악·콘텐츠는 각각의 라이선스를 따릅니다 (Jamendo CC-BY 등).

---

## 🙏 크레딧

- **Pretendard** by orioncactus
- **Remotion** by Remotion team
- **Jamendo** for CC music
- **Google Gemini / Lyria** for AI generation

---

## 🌟 만든 사람

작은 본문 한 줄을 영상까지 자동화하고 싶었던 분들을 위해.

> **다음 콘텐츠는 손이 아닌 한 줄로.**
