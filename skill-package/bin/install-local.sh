#!/usr/bin/env bash
# 로컬 설치: 현재 프로젝트를 Claude Code 스킬로 등록
# 사용법: bash skill-package/bin/install-local.sh

set -e

# 1. Find project root (one level up from this script's bin dir)
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$( cd "$SCRIPT_DIR/../.." && pwd )"

# 2. Target Claude Code skill dir
SKILL_DIR="$HOME/.claude/skills/card-reels"
mkdir -p "$SKILL_DIR"

# 3. Generate localized SKILL.md with project path baked in
cat > "$SKILL_DIR/SKILL.md" << EOF
---
name: card-reels
description: 한국어 본문에서 인스타그램 카드뉴스(PNG)와 릴스 영상(MP4)을 자동 생성하고 IG Reels + YouTube Shorts에 발행. 트리거 키워드 — "카드뉴스 만들어줘", "릴스 만들어줘", "콘텐츠 만들어줘", "릴스 + 카드뉴스".
---

# Card News + Reels Skill (로컬 설치)

**프로젝트 위치**: \`$PROJECT_ROOT\`

## 트리거

사용자가 다음과 같이 요청하면 이 스킬 실행:
- "카드뉴스 만들어줘: [본문]"
- "릴스 만들어줘: [본문]"
- "콘텐츠 만들어줘: [본문]"
- "이 글로 릴스 + 카드뉴스 만들어"

## 실행 절차

### 1단계: 본문 추출
사용자 메시지에서 본문만 추출. 트리거 키워드("카드뉴스 만들어줘:" 등)는 제거.

### 2단계: 임시 파일에 저장
\`\`\`bash
cat > /tmp/skill-content.txt << 'CONTENT'
[본문]
CONTENT
\`\`\`

### 3단계: 옵션 결정
사용자 명시 없으면 기본:
- **첫 실행**: \`--skip-publish\` (검토용)
- "발행해줘" 명시: 발행 모드
- "비공개로": \`--yt-private\`
- "인스타만": \`--skip-yt\`
- "유튜브만": \`--skip-ig\`

### 4단계: 파이프라인 실행
\`\`\`bash
cd "$PROJECT_ROOT"
npx tsx scripts/publish-content.mjs "@/tmp/skill-content.txt" [옵션]
\`\`\`

처리 시간: 약 2~4분.

### 5단계: 결과 안내
\`out/content-XXXX/\` 폴더 위치 안내:
- 영상: \`reels.mp4\`
- 카드뉴스: \`card-*.png\` (7~10장)
- 메타데이터: \`metadata.json\`
- 발행 결과 (있으면): \`publish-result.json\`

\`\`\`bash
open "out/content-XXXX/reels.mp4"
\`\`\`

## 검토 후 발행 워크플로우

먼저 \`--skip-publish\`로 만들고 사용자 확인 후 OK면:
\`\`\`bash
cd "$PROJECT_ROOT"
npx tsx scripts/publish-existing.mjs out/content-XXXX
\`\`\`
재생성 없이 동일 영상으로 IG + YouTube 발행만 진행.

## 옵션 전체

| 옵션 | 효과 |
|---|---|
| (없음) | 발행까지 전체 진행 |
| \`--skip-publish\` | 영상만 생성 |
| \`--skip-yt\` | YouTube 건너뜀 |
| \`--skip-ig\` | Instagram 건너뜀 |
| \`--yt-private\` | YouTube 비공개 |
| \`--yt-unlisted\` | YouTube 미등록 |

## 트러블슈팅

| 에러 | 해결 |
|---|---|
| GEMINI_API_KEY 미설정 | https://aistudio.google.com/apikey 발급 후 .env.local에 추가 |
| Jamendo failed | 정상. 자동으로 다른 BGM으로 폴백 |
| browser crashed | Chromium 메모리 이슈, 재실행하면 보통 해결 |
| YouTube 할당량 초과 | 일 6개 한도. 24시간 후 리셋 |

## 환경변수 필수

\`$PROJECT_ROOT/.env.local\`에 최소 \`GEMINI_API_KEY\` 필요.
EOF

# 4. Also install auto-shorts skill (uses same project)
AUTO_SKILL_DIR="$HOME/.claude/skills/auto-shorts"
mkdir -p "$AUTO_SKILL_DIR"

# Substitute project path placeholder in SKILL-auto.md template
sed "s|\\\$PROJECT_ROOT|$PROJECT_ROOT|g" "$PROJECT_ROOT/skill-package/SKILL-auto.md" > "$AUTO_SKILL_DIR/SKILL.md"

# Append local-install path note to auto skill
cat >> "$AUTO_SKILL_DIR/SKILL.md" << EOF

---
## 로컬 설치 정보

**프로젝트 위치**: \`$PROJECT_ROOT\`

스킬 실행 시 이 경로로 자동 cd 후 명령 실행:
\`\`\`bash
cd "$PROJECT_ROOT"
npx tsx scripts/publish-auto.mjs [옵션]
\`\`\`
EOF

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ 스킬 2개 로컬 설치 완료!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📍 card-reels:   $SKILL_DIR/SKILL.md"
echo "    → \"카드뉴스 만들어줘: [본문]\""
echo ""
echo "📍 auto-shorts:  $AUTO_SKILL_DIR/SKILL.md"
echo "    → \"오늘 영상 자동으로 만들어줘\""
echo ""
echo "📍 프로젝트 위치: $PROJECT_ROOT"
echo ""
echo "스킬 제거하려면:"
echo "  rm -rf \"$SKILL_DIR\" \"$AUTO_SKILL_DIR\""
echo ""
