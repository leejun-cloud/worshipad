# Contributing

기여 환영합니다!

## 새 기능 추가하기

### 새 영상 템플릿 추가
1. `remotion/templates/<name>/` 디렉토리 생성
2. `<Name>Reel.tsx` 메인 컴포지션 작성
3. `scenes/` 안에 씬 컴포넌트들
4. `remotion/Root.tsx`에 Composition 등록
5. `lib/reels/render.ts`의 `COMPOSITION_MAP`에 매핑 추가
6. `lib/reels/classify.ts` 프롬프트에 분류 기준 추가

### 새 카드 스타일 (LIST 템플릿)
1. `remotion/templates/List/scenes/ItemSceneXxx.tsx` 작성
2. `ListReel.tsx`에 import + dispatch 로직 추가
3. `listItemSchema`에 필요한 필드 추가
4. `lib/reels/classify.ts`의 cardStyle enum에 추가
5. 시스템 프롬프트에 사용 시점 안내 추가
6. `validateAndCompleteItem`에 폴백 로직 추가

### 새 발행 플랫폼 (TikTok 등)
1. `lib/<platform>.ts` 작성 (auth + upload 로직)
2. `lib/reels/multi-publish.ts`에 통합
3. `publish-content.mjs`에 옵션 추가
4. `.env.example`에 필요한 환경변수 문서화

## 코드 스타일
- TypeScript strict mode
- Korean comments OK (사용자가 한국어 콘텐츠 제작자라)
- 함수명·변수명은 영어
- 사용자 향 메시지는 한국어

## 테스트 전 확인
```bash
npx tsc --noEmit       # 타입 체크
npx next build          # Next.js 빌드 확인
npx tsx scripts/publish-content.mjs "테스트 본문" --skip-publish  # 통합 테스트
```

## PR 가이드
- 커밋 메시지: 한국어 또는 영어 OK
- 스크린샷·영상 첨부 환영 (특히 새 템플릿)
- README/SKILL.md 업데이트 잊지 말기
