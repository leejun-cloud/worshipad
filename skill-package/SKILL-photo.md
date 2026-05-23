---
name: photo-card-news
description: 본문 텍스트로 손힘찬(@ogata_marito) 스타일의 포토 카드뉴스 영상을 생성합니다. AI 이미지 배경 + 굵은 카피 조합. 트리거: "포토 카드뉴스", "사진 카드뉴스", "C형 카드뉴스", "손힘찬 스타일".
---

# Photo Card News Skill

AI 이미지 배경 위에 굵고 임팩트 있는 한국어 카피를 올린 포토 카드뉴스 영상을 생성합니다.
손힘찬(@ogata_marito) 스타일: 표지 강력 후킹 → 2-4장 카드(이미지+카피) → CTA.

## 사용 시점

사용자가 다음과 같이 요청하면 이 스킬 실행:
- "포토 카드뉴스 만들어줘: [본문]"
- "사진 카드뉴스 만들어줘"
- "C형 카드뉴스"
- "손힘찬 스타일로 만들어줘"

## 실행 명령어

```bash
# 기본: 본문 파일 → 포토 카드뉴스 생성 + 발행
npx tsx scripts/publish-photo.mjs "@/path/to/content.txt"

# 본문 직접 입력
npx tsx scripts/publish-photo.mjs "본문 내용..." --title="후킹 제목"

# 발행 안 하고 생성만
npx tsx scripts/publish-photo.mjs "@/path/to/content.txt" --skip-publish

# 자동 모드 (토픽 자동 발굴)
npx tsx scripts/publish-photo.mjs --auto

# YouTube만 / Instagram만
npx tsx scripts/publish-photo.mjs "@/path/to/content.txt" --skip-ig
npx tsx scripts/publish-photo.mjs "@/path/to/content.txt" --skip-yt
```

## 처리 단계

1. **포토 카드 구조화** (`lib/reels/photo-structure.ts`) — 표지 후킹 + 2-4 카드 + CTA + 이미지 프롬프트
2. **AI 이미지 생성** (`lib/reels/image-gen.ts`) — Imagen 3 (Vertex AI). 미설정 시 그라디언트 자동 사용
3. **BGM 검색/생성** — Jamendo → Lyria → 기본값 순서
4. **장면별 TTS** — Gemini 한국어 음성 (Kore)
5. **PhotoReel 렌더링** — Remotion (PhotoReel 컴포지션)
6. **메타데이터 생성** — IG 캡션·해시태그, YT 제목·태그
7. **자동 발행** — IG Reels + YouTube Shorts

## 결과물 위치

```
out/photo-XXXXXX/
  reels.mp4           # 최종 영상
  photo-draft.json    # 구조화 결과 (표지, 카드, 이미지 프롬프트)
  metadata.json       # IG 캡션, YT 제목/태그
  publish-result.json # 발행 결과 (permalink, videoId 등)
```

## 일반 카드뉴스와 차이

| 항목 | 기존 (publish-content.mjs) | 포토 (publish-photo.mjs) |
|---|---|---|
| 배경 | 색상 그라디언트 (typography) | AI 생성 이미지 or 시네마틱 그라디언트 |
| 카드 구조 | 5개 템플릿 (list, action 등) | 표지 + 2-4 body 카드 + CTA |
| 텍스트 양 | 많음 (설명 + 수치) | 적음 (짧고 임팩트 있는 카피) |
| 스타일 | 정보형 카드뉴스 | 감성/후킹형 포토 카드뉴스 |

## AI 이미지 사용 조건

Imagen 3 이미지는 다음 환경변수 중 하나가 있을 때 활성화:
- `VERTEX_AI_API_KEY` + `VERTEX_AI_PROJECT_ID`
- `VERTEX_AI_KEY_JSON` (서비스 계정 JSON)
- `FIREBASE_ADMIN_KEY_JSON` (공유 사용)

미설정 시 시네마틱 다크 그라디언트로 자동 대체 (품질 크게 차이 없음).
