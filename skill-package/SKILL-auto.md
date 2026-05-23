---
name: auto-shorts
description: 본문 없이 자동으로 토픽을 발굴하고, 바이럴 제목을 생성한 뒤, 영상 콘텐츠를 만들어 IG Reels + YouTube Shorts에 발행. 트리거 — "오늘 영상 자동으로", "자동 릴스 만들어줘", "토픽 자동으로 골라서 영상", "매일 자동 발행".
---

# Auto-Shorts Skill

본문 입력 없이도 AI가 토픽을 자동 발굴해서 콘텐츠 → 영상 → 발행까지 자동.

## 트리거

- "오늘 영상 자동으로 만들어줘"
- "자동 릴스 만들어줘"
- "토픽 자동으로 골라서 4개 영상"
- "매일 정오에 자동 발행 시작"

## 토픽 발굴 전략

| 전략 | 동작 | 환경변수 필요 |
|---|---|---|
| `pool` (기본) | `config/topic-pool.json`에서 랜덤 픽 | 없음 |
| `news` | NewsAPI 헤드라인에서 픽 | `NEWS_API_KEY` |
| `ai` | Gemini가 트렌딩 토픽 자체 생성 | `GEMINI_API_KEY` |

## 명령어

```bash
# 1개 영상 자동 생성 (pool, 발행)
npx tsx scripts/publish-auto.mjs

# 4개 영상 한 번에
npx tsx scripts/publish-auto.mjs --count=4

# NewsAPI 사용
npx tsx scripts/publish-auto.mjs --strategy=news

# 특정 카테고리에서만
npx tsx scripts/publish-auto.mjs --category=ai_tech

# 발행 안 하고 검토
npx tsx scripts/publish-auto.mjs --skip-publish

# 매일 정오 자동 4개 발행 (스케줄러)
npx tsx scripts/publish-auto.mjs --cron="0 12 * * *" --count=4
```

## 옵션 전체

| 옵션 | 기본값 | 효과 |
|---|---|---|
| `--count=N` | 1 | 한 번 실행 시 영상 N개 |
| `--strategy=...` | pool | pool / news / ai |
| `--category=...` | (랜덤) | 토픽 풀 카테고리 키 |
| `--interest=...` | (광범위) | AI 전략 시 관심 분야 |
| `--cron="..."` | (즉시) | cron 표현식, 스케줄 모드 |
| `--skip-publish` | - | 영상만 생성 |
| `--skip-yt` / `--skip-ig` | - | 한쪽 발행 건너뜀 |
| `--yt-private` / `--yt-unlisted` | - | YouTube 공개 범위 |

## 자동 처리 흐름

```
1. 토픽 발굴 (pool/news/ai)
2. 바이럴 제목 8개 생성 + 후킹 점수 평가
3. 최고 점수 제목 선택
4. AI가 본문 자동 작성 (도입 + N가지 + 마무리)
5. 본문 파일로 저장
6. publish-content.mjs 파이프라인 실행
   (분류 → 멀티에이전트 검증 → BGM → TTS → 렌더 → 발행)
```

## 카테고리 (config/topic-pool.json 기본 제공)

- `self_dev` — 자기계발
- `productivity` — 생산성
- `ai_tech` — AI · 기술
- `finance` — 재테크
- `health` — 건강
- `relationships` — 인간관계
- `education` — 교육 · 학습

각 카테고리의 토픽은 자유롭게 추가/수정 가능 (`config/topic-pool.json`).

## card-reels와의 차이

| | card-reels | auto-shorts |
|---|---|---|
| 입력 | 사용자 본문 필수 | 자동 발굴 |
| 용도 | 본인 콘텐츠 영상화 | 채널 자동 운영 |
| 트리거 | "이 글로 영상" | "오늘 영상 자동" |

두 스킬은 같은 인프라 공유 (TTS, 렌더, 발행). 입력 모드만 다름.
