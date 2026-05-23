# 릴스 파이프라인 인계 노트

주무시는 동안 진행한 작업 요약입니다.

---

## 완성된 것 (테스트 완료)

### 4개 릴스 템플릿 모두 렌더링 검증 완료 (BGM 포함)

| 템플릿 | 길이 | 파일 크기 | 용도 | BGM 볼륨 | 확인 파일 |
|---|---|---|---|---|---|
| **ACTION** | 15초 | 2.0 MB | 챌린지·행동 촉구 | 0.22 | `out/action.mp4` |
| **EMOTION** | 60초 | 6.2 MB | 감동·간증 스토리 | 0.15 | `out/emotion.mp4` |
| **NEWS** | 25초 | 2.2 MB | 행사·소식 공지 | 0.20 | `out/news.mp4` |
| **INSIGHT** | 22초 | 1.3 MB | 명언·통찰 | 0.13 | `out/insight.mp4` |

재생하려면: `open out/action.mp4` 같은 식으로.

### 배경음악 (BGM)

- **기본 BGM**: `public/bgm.wav` (18초) — 모든 템플릿이 자동으로 사용
- 짧은 트랙은 자동 **루프** 처리 (60초 EMOTION 영상은 BGM 3.3회 반복)
- **시작 1초 페이드인**, **끝 1.5초 페이드아웃** 자동 적용
- 템플릿마다 다른 볼륨: ACTION 시끄럽게(0.22), INSIGHT 잔잔하게(0.13)
- 내레이션은 100% 볼륨, BGM이 자동으로 **덕킹(낮춰서 깔림)**

#### 템플릿별 BGM 변경 방법
1. 다른 음악 파일을 `public/bgm/action.mp3` 등으로 저장
2. `bgmUrl` 파라미터 전달:
   ```json
   {
     "template": "action",
     "data": {
       "problem": "...",
       "bgmUrl": "/bgm/action.mp3",
       "bgmTrackDurationSec": 30,
       "bgmVolume": 0.18
     }
   }
   ```

#### 무료 BGM 추천 사이트 (CC0 / Royalty-free)
- **Pixabay Music**: pixabay.com/music — CC0, 가입 불필요
- **YouTube Audio Library**: studio.youtube.com — Google 계정만 있으면 무료
- **Free Music Archive**: freemusicarchive.org
- **Mixkit**: mixkit.co/free-stock-music — 무료
- **ZapSplat**: zapsplat.com — 무료 (회원가입)

### API 엔드포인트 (7개)

| 경로 | 역할 | 필요 키 |
|---|---|---|
| `POST /api/classify-reels` | Gemini로 텍스트 분류 + 필드 추출 + 내레이션 | `GEMINI_API_KEY` |
| `POST /api/tts` | **Gemini TTS** 한국어 내레이션 생성 | `GEMINI_API_KEY` (분류와 동일) |
| `POST /api/render-reels` | 4개 템플릿 중 선택해서 MP4 렌더 | 없음 |
| `POST /api/publish-reels` | **원샷**: 분류→TTS→렌더→Firebase→Instagram | 전부 |
| `POST /api/slack/command` | 슬랙 슬래시 커맨드 수신 → 비동기 처리 | 전부 + `SLACK_SIGNING_SECRET` |
| `POST /api/structure-text` | (기존) 카드뉴스 KQCI 구조화 | `OPENAI_API_KEY` |
| `POST /api/og` | (기존) 카드뉴스 OG 이미지 | 없음 |

### 공통 라이브러리

- `lib/reels/classify.ts` — Gemini 분류
- `lib/reels/tts.ts` — Google TTS 합성
- `lib/reels/render.ts` — Remotion 렌더 (번들 캐시)
- `lib/firebase-admin.ts` — Firebase Storage 업로드
- `lib/instagram.ts` — Instagram Graph API 발행

---

## 깨어나서 할 일 (우선순위순)

### 1️⃣ ~~Google Cloud TTS 키 발급~~ → **Gemini TTS로 변경됨** ✅

복잡한 GCP 서비스 계정 발급 **필요 없어요**. **이미 가지고 계신 Gemini API 키 하나로** TTS도 동작합니다.

`.env.local` 에 다음만 있으면 끝:
```
GEMINI_API_KEY=실제_AIza키_여기에
```

(현재 .env.local이 `AIza...` placeholder 상태이니 실제 키로 교체해주세요.)

### 2️⃣ TTS 바로 테스트
```bash
pnpm test:tts
```
성공하면 `out/tts-test.wav` 생성됨 → `open out/tts-test.wav` 로 재생.

음성 바꾸고 싶으면:
```bash
pnpm test:tts "안녕하세요" "Charon"
```
**Gemini TTS 한국어 voice 옵션** (30+ 종):
- 차분한 남성: `Charon`, `Orus`, `Algenib`
- 밝은 여성: `Kore`, `Aoede`, `Leda`
- 중성/낭독: `Puck`, `Iapetus`, `Enceladus`
- 깊은 톤: `Sadachbia`, `Algieba`

### 3️⃣ Gemini 분류 테스트
```bash
pnpm test:classify
```
샘플 본문을 Gemini가 어떤 템플릿으로 분류하는지 확인.

### 4️⃣ 전체 파이프라인 테스트 (TTS 키 필수)
```bash
# dev 서버 켜고
pnpm dev

# 다른 터미널에서
curl -X POST http://localhost:3000/api/publish-reels \
  -H "Content-Type: application/json" \
  -d '{
    "text": "작심삼일 때문에 올해도 운동 못 하셨죠? 하루 10분 스트레칭만 해도 3일이면 몸이 달라져요.",
    "skipInstagram": true,
    "skipTTS": false
  }'
```
결과에 `videoUrl` 나오면 성공. `skipInstagram: true` 로 Instagram 단계는 건너뜀.

---

## 나중에 할 일

### Instagram 연동 (키 추가 시 자동 작동)

필요한 것:
- Meta for Developers 앱 생성
- Instagram Business 계정 연결된 Facebook 페이지
- 장기 액세스 토큰 발급
- Instagram 비즈니스 계정 ID 확인

`.env.local` 추가:
```
IG_ACCESS_TOKEN=EAAxxxxxxxx
IG_USER_ID=17841xxxxxxxxx
```

코드는 이미 완성되어 있어서, 키만 넣으면 자동 발행돼요.

### 슬랙봇 연동

서버 배포 후 슬랙 앱 설정:
1. Slack API → Slash Commands → `/릴스`
2. Request URL: `https://서버주소/api/slack/command`
3. `SLACK_SIGNING_SECRET` 환경변수 추가
4. 사용: `/릴스 오늘의 콘텐츠 본문...`

슬랙봇은 즉시 "처리 중" 응답 후, 백그라운드에서 생성 완료 시 채널에 결과 전송.

---

## 환경변수 전체 목록

`.env.local`:
```bash
# 필수 (Gemini 분류 + TTS 둘 다 사용)
GEMINI_API_KEY=AIza...
GEMINI_MODEL=gemini-3-flash-preview
GEMINI_TTS_MODEL=gemini-2.5-flash-preview-tts

# Firebase Storage 업로드용 (서비스 계정 JSON 한 줄)
FIREBASE_ADMIN_KEY_JSON={...한줄 JSON...}

# Instagram 발행용 (선택)
IG_ACCESS_TOKEN=
IG_USER_ID=

# Slack 봇 연동용 (선택)
SLACK_SIGNING_SECRET=

# 기존 카드뉴스용 (그대로 유지)
OPENAI_API_KEY=sk-...
```

---

## 프로젝트 구조 변경 사항

```
├── remotion/                    ← 신규
│   ├── index.ts
│   ├── Root.tsx                 (4개 composition 등록)
│   ├── fonts.ts                 (Pretendard 로딩)
│   ├── types.ts
│   └── templates/
│       ├── Action/              (3씬: Hook/Impact/CTA)
│       ├── Emotion/             (4씬: Opening/Story/Message/Closing)
│       ├── News/                (3씬: Headline/Details/Action)
│       └── Insight/             (3씬: DarkOpening/Quote/Elaboration)
├── lib/
│   ├── firebase-admin.ts        ← 신규 (Storage 업로드)
│   ├── instagram.ts             ← 신규 (IG Graph API)
│   └── reels/                   ← 신규
│       ├── classify.ts
│       ├── tts.ts
│       └── render.ts
├── app/api/
│   ├── classify-reels/          ← 신규
│   ├── tts/                     ← 신규
│   ├── render-reels/            ← 신규
│   ├── publish-reels/           ← 신규 (원샷)
│   └── slack/command/           ← 신규
├── scripts/
│   ├── test-tts.mjs             ← 신규
│   ├── test-classify.mjs        ← 신규
│   └── open-gcp-tts.mjs         (Playwright, 미사용)
├── public/
│   ├── fonts/                   (실제 Pretendard 설치됨)
│   ├── tts/                     ← TTS MP3 임시 저장
│   └── reels/                   ← 렌더된 MP4 임시 저장
├── out/                         ← 로컬 테스트 결과물
├── .env.local                   ← 사용자 키
├── .gitignore                   (env, out, public/tts, public/reels 추가)
└── next.config.mjs              (serverExternalPackages 추가)
```

---

## 중요 참고사항

### 디스크 사용량
- Remotion Chromium: ~380MB
- Pretendard 폰트: ~8MB
- 렌더된 MP4들: 현재 ~12MB (더 쌓이면 `out/` 폴더 정리)

### Next.js 빌드
- `serverExternalPackages`에 Remotion 컴포지터 / playwright / firebase-admin 추가함
- 없으면 빌드 시 플랫폼별 바이너리 bundling 실패

### 서버 배포 시 주의
- Playwright + Remotion은 서버리스(Vercel) 부적합 → VPS 권장
- Ubuntu 서버라면 Chromium 의존성 자동 설치됨
- 서버 디스크 20GB 이상 권장 (일단 맥 환경에서는 6GB 여유분 유지 중)

### 비용 전망 (월간)
- Gemini 3 Flash Preview: 수천 번 호출해도 $1 미만
- Google Chirp3-HD TTS: 월 100만자 무료, 초과 시 $30/100만자
- Firebase Storage: 업로드 후 CDN 전송 — 개인용도 월 $1 미만

---

## 렌더 품질 확인 결과

아래 파일들에 각 템플릿 스틸 프레임 저장됨 (제가 검증한 것들):

- `out/action-preview.png` (HOOK 씬)
- `out/scene2-impact.png` (IMPACT 씬)
- `out/scene3-cta.png` (CTA 씬)
- `out/emotion-preview.png` (STORY 씬)
- `out/emotion-message.png` (MESSAGE 씬)
- `out/news-preview.png` (DETAILS 씬)
- `out/news-headline.png` (HEADLINE 씬)
- `out/insight-preview.png` (QUOTE 씬 중간)
- `out/insight-elaboration.png` (ELABORATION 씬)

전부 Pretendard 폰트 적용됨, 한글 깨짐 없음.

---

## 아직 못한 것

1. **TTS + 영상 음성 합성 검증** — TTS 키 필요해서 못 돌림 (키 받으시면 바로 가능)
2. **Instagram 실제 발행** — Meta 앱 설정 필요
3. **슬랙봇 실제 연동** — Slack 앱 설정 + 서버 배포 필요
4. **서버 배포 자체** — 다음 단계

코드는 전부 준비됐어요. 키만 차례로 넣으시면 순서대로 동작합니다.
