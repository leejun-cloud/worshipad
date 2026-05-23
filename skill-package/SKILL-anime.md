---
name: anime-video
description: 스토리/시나리오 텍스트로 E형 애니메이션 영상을 생성합니다. GPT-Image-2 이미지 → Wan 2.2 Ultra Fast 영상 → Gemini TTS → FFmpeg 합성 → YouTube 발행. 트리거: "애니메이션 만들어줘", "E형", "스토리 영상".
---

# Anime Video Skill (E형)

스토리/시나리오를 받아서 AI 애니메이션 영상을 생성합니다.
장면 구성: Gemini → GPT-Image-2 이미지 → Wan 2.2 Ultra Fast 영상 → Gemini TTS → FFmpeg 합성 → YouTube 발행.

## 사용 시점

- "애니메이션 만들어줘: [스토리]"
- "E형 영상 만들어줘"
- "스토리 영상으로 만들어줘"
- "이 이야기로 애니메이션 만들어줘"
- 어린이 콘텐츠, 우화, 동화 등 스토리 기반 영상 요청

## 실행 명령어

```bash
# 기본: 스토리 파일 → 애니메이션 생성 + YouTube 발행
npx tsx scripts/publish-anime.mjs "@/path/to/story.txt"

# 제목 지정
npx tsx scripts/publish-anime.mjs "@/path/to/story.txt" --title="제목"

# 발행 없이 생성만 (검토용)
npx tsx scripts/publish-anime.mjs "@/path/to/story.txt" --skip-publish

# 영상 없이 이미지+TTS만 (비용 절감, 테스트용)
npx tsx scripts/publish-anime.mjs "@/path/to/story.txt" --text-only --skip-publish

# 인라인 스토리
npx tsx scripts/publish-anime.mjs "토끼와 거북이 이야기..." --title="토끼와 거북이"

# YouTube 비공개/미등록
npx tsx scripts/publish-anime.mjs "@story.txt" --yt-private
npx tsx scripts/publish-anime.mjs "@story.txt" --yt-unlisted
```

## 파이프라인 6단계

1. **Gemini 장면 구성** — 스토리를 5-10개 장면으로 분해, 캐릭터 외모/스타일 가이드 확정
2. **GPT-Image-2 이미지 생성** — 장면별 이미지 (16:9, ~$0.06-0.18/장)
3. **Wan 2.2 Ultra Fast 영상 생성** — 이미지→영상(img2vid) 우선, 실패 시 텍스트→영상(t2v) ($0.01/초)
4. **Gemini TTS 내레이션** — 장면별 한국어 음성 합성
5. **FFmpeg 합성** — 영상+TTS+BGM 합성 (클립 루프, 연결, BGM 믹싱)
6. **YouTube 발행** — 메타데이터 생성 후 업로드

## 비용 안내

| 단계 | 비용 |
|---|---|
| GPT-Image-2 이미지 | $0.06-0.18/장 (장면당 1장) |
| Wan 2.2 영상 | $0.01/초 (총 영상 길이 기준) |
| Gemini TTS | 무료 (GEMINI_API_KEY) |
| BGM | 무료 (Jamendo/기본 BGM) |

예: 7장면 × 7초 = 49초 영상 → Wan 2.2 비용 약 $0.49 + 이미지 7장 약 $0.42-1.26

## 필수 환경변수

| 변수 | 용도 |
|---|---|
| `GEMINI_API_KEY` | 장면 구성 + TTS |
| `WAVESPEED_API_KEY` | GPT-Image-2 + Wan 2.2 영상 생성 |

선택: `YOUTUBE_*` (발행), `JAMENDO_CLIENT_ID` (BGM)

## 옵션 플래그

| 플래그 | 설명 |
|---|---|
| `--title="제목"` | YouTube 제목 지정 |
| `--skip-publish` | 발행 없이 파일만 생성 |
| `--skip-yt` | YouTube 발행 건너뜀 |
| `--text-only` | 영상 생성 생략 (이미지+TTS만, 비용 절감) |
| `--yt-private` | YouTube 비공개 업로드 |
| `--yt-unlisted` | YouTube 미등록 업로드 |

## 출력물

```
out/anime-{timestamp}/
  anime.mp4            # 최종 합성 영상
  anime-draft.json     # Gemini 장면 구성 결과
  metadata.json        # YouTube 제목/설명/태그
  publish-result.json  # 발행 결과 (발행 시)
  tmp/
    scene-N-image.jpg  # 장면별 생성 이미지
    scene-N-video.mp4  # 장면별 생성 영상
    scene-N-tts.wav    # 장면별 TTS 오디오
```

## 캐릭터 일관성 원칙

- `styleGuide`: 전체 영상 공통 스타일 (예: "3D Pixar-style animation, vibrant colors")
- `characterDescriptions`: 캐릭터별 외모를 영어로 상세 기술 → 모든 장면 이미지에 포함
- `imagePrompt` 형식: `{styleGuide}, {characterDescription}, {장면 액션}, {배경}, cinematic lighting`

## 주의사항

- Wan 2.2 영상 생성은 장면당 최대 5분 소요 가능
- 전체 파이프라인 소요 시간: 약 10-20분 (장면 수, API 응답 속도 따라 다름)
- `--text-only` 플래그로 영상 비용 없이 먼저 테스트 권장
- WaveSpeed API 키: `.env.local`의 `WAVESPEED_API_KEY`
