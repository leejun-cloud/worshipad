#!/usr/bin/env bash
# Card-Reels Skill Installer
# 사용법: curl -sSL https://raw.githubusercontent.com/YOUR_USER/card-reels-skill/main/skill-package/bin/install.sh | bash

set -e

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🎬 Card News + Reels Skill — Installer"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# 1. Check prerequisites
echo "▶ 사전 요구사항 확인 중..."

if ! command -v node &> /dev/null; then
  echo "❌ Node.js 필요. https://nodejs.org/ 에서 설치 (v20+)"
  exit 1
fi

NODE_MAJOR=$(node -v | sed 's/v\([0-9]*\).*/\1/')
if [ "$NODE_MAJOR" -lt 20 ]; then
  echo "❌ Node.js v20 이상 필요. 현재: $(node -v)"
  exit 1
fi

if ! command -v ffmpeg &> /dev/null; then
  echo "⚠️  ffmpeg 없음. macOS: brew install ffmpeg / Linux: apt install ffmpeg"
  echo "   ffmpeg 없이도 설치는 진행하지만 BGM 트림 기능이 제한됩니다."
fi

PKG_MANAGER="npm"
if command -v pnpm &> /dev/null; then
  PKG_MANAGER="pnpm"
elif command -v yarn &> /dev/null; then
  PKG_MANAGER="yarn"
fi
echo "   패키지 매니저: $PKG_MANAGER"

# 2. Clone or update repo
TARGET_DIR="${CARD_REELS_DIR:-$HOME/card-reels-skill}"
REPO_URL="${CARD_REELS_REPO:-https://github.com/YOUR_USER/card-reels-skill.git}"

if [ -d "$TARGET_DIR" ]; then
  echo "▶ 기존 설치 발견: $TARGET_DIR"
  echo "   업데이트 중..."
  cd "$TARGET_DIR"
  git pull
else
  echo "▶ Clone 중: $REPO_URL → $TARGET_DIR"
  git clone "$REPO_URL" "$TARGET_DIR"
  cd "$TARGET_DIR"
fi

# 3. Install dependencies
echo "▶ 의존성 설치 중 ($PKG_MANAGER)..."
$PKG_MANAGER install

# 4. Setup .env.local
if [ ! -f .env.local ]; then
  cp .env.example .env.local
  echo ""
  echo "▶ .env.local 생성됨. 키 추가 필요:"
  echo "   $TARGET_DIR/.env.local"
  echo ""
  echo "   최소 필수: GEMINI_API_KEY"
  echo "   발급: https://aistudio.google.com/apikey"
fi

# 5. Install Claude Code skill (optional)
SKILL_DIR="$HOME/.claude/skills/card-reels"
if [ -d "$HOME/.claude/skills" ]; then
  mkdir -p "$SKILL_DIR"
  cp "$TARGET_DIR/skill-package/SKILL.md" "$SKILL_DIR/SKILL.md"
  echo "▶ Claude Code 스킬 설치됨: $SKILL_DIR"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ 설치 완료!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "다음 단계:"
echo "  1. $TARGET_DIR/.env.local 에 GEMINI_API_KEY 추가"
echo "  2. cd $TARGET_DIR"
echo "  3. npx tsx scripts/publish-content.mjs \"본문 내용\" --skip-publish"
echo ""
echo "Claude Code 사용 시:"
echo "  \"카드뉴스 + 릴스 만들어줘: [본문]\""
echo ""
