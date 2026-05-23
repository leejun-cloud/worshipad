---
name: card-reels
description: 한국어 본문에서 인스타그램 카드뉴스(PNG)와 릴스 영상(MP4)을 자동 생성하고, Instagram Reels와 YouTube Shorts에 발행합니다. 트리거: "카드뉴스 만들어줘", "릴스 만들어줘", "콘텐츠 만들어줘", "릴스+카드뉴스".
---

# Card News + Reels Skill

본문 텍스트를 받아서 자동으로:
1. Gemini로 콘텐츠 분류 (5가지 템플릿 중 자동 선택)
2. 장면별 한국어 TTS 내레이션 생성
3. Remotion으로 1080×1920 MP4 영상 렌더링
4. 각 카드를 PNG로 추출 (카드뉴스 캐러셀용)
5. 클릭 최적화 캡션·해시태그 생성
6. Instagram Reels + YouTube Shorts 자동 발행 (선택)

## 사용 시점

사용자가 다음과 같이 요청하면 이 스킬 실행:
- "카드뉴스 만들어줘: [본문]"
- "릴스 만들어줘: [본문]"
- "콘텐츠 만들어줘: [본문]"
- "이 글로 릴스 + 카드뉴스 만들어"

## 프로젝트 위치 확인

스킬을 실행하기 전에 프로젝트가 설치되어 있는지 확인:

1. 현재 작업 디렉토리에 `package.json`이 있고 `"name": "card-reels-skill"` 또는 유사한 이름인지
2. `lib/reels/classify.ts`, `scripts/publish-content.mjs`, `remotion/index.ts` 파일 존재 여부

설치 안 되어 있으면:
```bash
git clone https://github.com/YOUR_USERNAME/card-reels-skill.git
cd card-reels-skill
pnpm install
```

## 환경변수 확인

`.env.local` 파일이 없거나 `GEMINI_API_KEY`가 비어 있으면 사용자에게 안내:
```
Gemini API 키 필요: https://aistudio.google.com/apikey 에서 무료 발급
.env.local 에 GEMINI_API_KEY=AIza... 추가
```

## 실행 순서

### 1단계: 본문 추출
사용자 메시지에서 본문 부분만 추출.
- "카드뉴스 만들어줘:" 같은 프리픽스 제거
- 멀티라인 본문 그대로 보존

### 2단계: 임시 파일에 저장
```bash
cat > /tmp/skill-content.txt << 'EOF'
[본문]
EOF
```

### 3단계: 옵션 결정
사용자가 명시 안 했으면 기본:
- **첫 실행**: `--skip-publish` (검토용 — 영상만 생성)
- **"발행해줘"라고 명시**: 발행 모드 (`--skip-publish` 빼기)
- **"비공개로"**: `--yt-private`
- **"미등록"**: `--yt-unlisted`
- **"인스타만"**: `--skip-yt`
- **"유튜브만"**: `--skip-ig`

### 4단계: 파이프라인 실행
```bash
npx tsx scripts/publish-content.mjs "@/tmp/skill-content.txt" [옵션]
```

전체 처리 시간: 약 2~4분.

### 5단계: 결과 안내
출력 폴더 경로와 함께:
- 영상: `out/content-XXX/reels.mp4`
- 카드뉴스: `out/content-XXX/card-*.png`
- 메타데이터: `out/content-XXX/metadata.json`
- (발행 시) Instagram URL, YouTube URL

사용자에게 영상을 직접 열어서 확인할 수 있도록 안내:
```bash
open "out/content-XXX/reels.mp4"
```

## 검토 후 발행 워크플로우

`--skip-publish`로 먼저 만들고 사용자가 메타데이터·영상 확인 후 OK 하면:
```bash
npx tsx scripts/publish-existing.mjs out/content-XXX
```

이러면 동일한 영상·메타데이터로 IG + YouTube에 발행만 진행 (재생성 없음).

## 트러블슈팅

### "GEMINI_API_KEY 미설정"
→ https://aistudio.google.com/apikey 에서 발급 후 `.env.local`에 추가

### "Jamendo failed, falling back"
→ 정상 동작. 무료 음악 서버 일시적 이슈, 자동으로 기본 BGM 사용

### "browser crashed during render"
→ Chromium 메모리 이슈. 보통 재실행하면 해결

### Instagram 발행 실패
→ 토큰 만료. https://developers.facebook.com/ 에서 access token 갱신

### YouTube 업로드 실패: 할당량 초과
→ 일일 6개 한도. 24시간 후 자동 리셋, 또는 GCP에서 quota 증가 신청

## 사용 가능한 옵션 전체

| 옵션 | 효과 |
|---|---|
| (없음) | 발행까지 전체 진행 |
| `--skip-publish` | 영상·카드뉴스만 생성 (검토용) |
| `--skip-yt` | YouTube 건너뜀 |
| `--skip-ig` | Instagram 건너뜀 |
| `--yt-private` | YouTube 비공개 업로드 |
| `--yt-unlisted` | YouTube 미등록 업로드 |
