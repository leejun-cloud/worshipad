---
name: lecture-video
description: 본문 텍스트로 가로형(1920×1080) 강의 영상을 생성합니다. 슬라이드 기반, YouTube 발행. 트리거: "강의 영상", "강의 만들어줘", "D형", "유튜브 강의".
---

# Lecture Video Skill (D형)

본문을 받아서 1920×1080 가로형 강의 영상을 생성합니다.
슬라이드 구성: 제목 → 목차 → 본문 슬라이드(4-8장) → 요약 → YouTube 발행.

## 사용 시점

- "강의 영상 만들어줘: [본문]"
- "D형 카드뉴스"
- "유튜브 강의 만들어줘"
- "강의 영상으로 만들어줘"

## 실행 명령어

```bash
# 기본: 파일 → 강의 영상 생성 + 발행
npx tsx scripts/publish-lecture.mjs "@/path/to/content.txt"

# 제목 + 강사명 지정
npx tsx scripts/publish-lecture.mjs "@/path/to/content.txt" --title="강의 제목" --speaker="강사명"

# 발행 없이 생성만
npx tsx scripts/publish-lecture.mjs "@/path/to/content.txt" --skip-publish

# 액센트 색상 변경
npx tsx scripts/publish-lecture.mjs "@/path/to/content.txt" --accent=#e84393

# YouTube 비공개/미등록
npx tsx scripts/publish-lecture.mjs "@/path/to/content.txt" --yt-private
npx tsx scripts/publish-lecture.mjs "@/path/to/content.txt" --yt-unlisted
```

## 처리 단계

1. **슬라이드 구조화** (`lib/reels/lecture-structure.ts`) — Gemini: 제목+목차+본문+요약 슬라이드
2. **배경 미디어** (`lib/reels/photo-fetcher.ts`) — Pixabay/Pexels 이미지 또는 영상
3. **BGM** — Jamendo → Lyria → 기본값
4. **슬라이드별 TTS** — Gemini 한국어 음성 (Kore)
5. **렌더링** — Remotion LectureReel (1920×1080)
6. **메타데이터 + 챕터** — YouTube 챕터 타임스탬프 자동 생성
7. **YouTube 발행** — Instagram 제외 (강의는 YT only)

## 결과물 위치

```
out/lecture-XXXXXX/
  lecture.mp4           # 최종 영상 (1920×1080)
  lecture-draft.json    # 슬라이드 구성
  metadata.json         # YT 제목/태그/챕터
  publish-result.json   # 발행 결과
```

## 포토 카드뉴스(C형)와 차이

| 항목 | C형 (photo) | D형 (lecture) |
|---|---|---|
| 비율 | 9:16 세로 | 16:9 가로 |
| 용도 | Instagram Reels, YouTube Shorts | YouTube 강의 |
| 슬라이드 수 | 4-6장 (4-7초씩) | 7-12장 (20-40초씩) |
| 텍스트 양 | 적음 (임팩트 카피) | 많음 (설명 + 불릿) |
| 발행 플랫폼 | IG + YT Shorts | YouTube 일반 영상 |
| 챕터 | 없음 | 자동 생성 |

## 슬라이드 타입

| 타입 | 역할 |
|---|---|
| `title` | 제목, 부제목, 강사명 |
| `agenda` | 목차 (번호 + 항목) |
| `content` | 헤딩 + 불릿 2-4개 + 선택적 배경 이미지/영상 |
| `quote` | 큰 인용구 강조 |
| `summary` | 핵심 정리 + CTA 버튼 |
