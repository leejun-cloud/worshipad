#!/bin/bash
# 더블클릭으로 Worshipad 교회광고 에디터 실행.
# 무엇을 하는가:
#   1. 프로젝트 폴더로 이동
#   2. 포트 3030에서 돌고 있는 기존 서버를 종료
#   3. Next.js dev 서버 시작
#   4. 5초 후 브라우저로 자동 이동
#   5. 창은 계속 열려 있어 — 종료하려면 Ctrl+C 또는 Terminal 창 닫기

set -e

# 이 스크립트가 있는 폴더를 작업 디렉토리로
cd "$(dirname "$0")"

echo "╔══════════════════════════════════════════════════════╗"
echo "║   ⛪  Worshipad — 교회 광고 영상 에디터              ║"
echo "║       http://localhost:3030/church-ad                ║"
echo "╚══════════════════════════════════════════════════════╝"
echo ""

# 1. 같은 포트의 기존 프로세스 종료 (있으면)
OLD=$(lsof -nP -iTCP:3030 -sTCP:LISTEN -t 2>/dev/null || true)
if [ -n "$OLD" ]; then
  echo "🔄  포트 3030에서 돌고 있던 기존 서버 종료 (PID $OLD)"
  kill $OLD 2>/dev/null || true
  sleep 2
fi

# 2. node_modules 확인
if [ ! -d node_modules ]; then
  echo "❌  node_modules가 없어요. 의존성 설치가 필요합니다:"
  echo "    pnpm install"
  read -p "엔터를 누르면 창을 닫습니다 "
  exit 1
fi

# 3. caffeinate (있으면) 6시간 잠금
if command -v caffeinate >/dev/null 2>&1; then
  caffeinate -d -i -m -s -t 21600 >/dev/null 2>&1 &
  echo "💤  화면 절전 6시간 비활성화"
fi

# 4. 브라우저 자동 오픈 (서버 준비된 후)
(
  for i in $(seq 1 60); do
    if lsof -nP -iTCP:3030 -sTCP:LISTEN >/dev/null 2>&1; then
      sleep 1
      open "http://localhost:3030/church-ad"
      break
    fi
    sleep 1
  done
) &

# 5. dev 서버 시작 (포그라운드)
echo "🚀  Next.js dev 서버 시작…"
echo ""
exec ./node_modules/.bin/next dev -p 3030
