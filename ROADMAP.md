# 로드맵: 멀티 스킬 구조

## 현재 (v1) — 단일 스킬 레포

```
card-reels-skill/
├── lib/, remotion/, scripts/, ...
└── skill-package/SKILL.md
```

## 미래 (v2) — 멀티 스킬 모노레포

여러 유용한 스킬을 한 곳에서 관리하고 싶을 때:

```
hopelibrary-skills/  (또는 your-name-skills)
├── packages/
│   ├── card-reels/                     # 현재 이 프로젝트
│   │   ├── lib/, remotion/, scripts/
│   │   ├── skill-package/SKILL.md
│   │   └── package.json
│   ├── newsletter-generator/           # 가상 예시
│   │   ├── ...
│   │   └── skill-package/SKILL.md
│   ├── shorts-quote-maker/             # 가상 예시
│   └── ...
├── shared/
│   ├── gemini/                         # 공통 Gemini 헬퍼
│   ├── publish/                        # 공통 발행 로직
│   └── tts/                            # 공통 TTS
├── pnpm-workspace.yaml
├── README.md                           # 스킬 카탈로그
└── install.sh                          # 통합 설치
```

### 모노레포로 전환할 때

1. 새 부모 디렉토리 만들기:
   ```bash
   mkdir hopelibrary-skills
   cd hopelibrary-skills
   pnpm init
   ```

2. `pnpm-workspace.yaml`:
   ```yaml
   packages:
     - 'packages/*'
   ```

3. 현재 프로젝트 이동:
   ```bash
   mv ../card-reels-skill packages/card-reels
   ```

4. 공통 코드를 `shared/`로 추출 (점진적)

5. 통합 README:
   ```markdown
   # Hopelibrary Skills
   
   | 스킬 | 트리거 | 설명 |
   |---|---|---|
   | [card-reels](packages/card-reels) | "카드뉴스 만들어줘" | IG 카드뉴스 + 릴스 자동 |
   | [newsletter](packages/newsletter) | "뉴스레터 작성해줘" | ... |
   ```

### 통합 설치 스크립트
```bash
curl -sSL https://raw.githubusercontent.com/USER/hopelibrary-skills/main/install.sh | bash
```
이 스크립트가 모든 스킬을 한 번에 설치하고 Claude Code 스킬 디렉토리에 등록.

## 추가 가능성 있는 스킬 아이디어

### 콘텐츠 생성
- **카드뉴스 + 릴스** (현재) — 본문 → IG 카드뉴스 + Reels + YouTube Shorts
- **뉴스레터 자동 생성** — 주제 → 메일 본문 + 발송
- **블로그 포스트** — 키워드 → SEO 최적화 글
- **유튜브 롱폼 영상** — 본문 → 5~10분 영상 + 챕터 마크
- **팟캐스트 에피소드** — 스크립트 → 음성 + 챕터 + 발행

### 마케팅 자동화
- **광고 카피 생성기** — 제품 → A/B 광고 카피 10개
- **이메일 시퀀스** — 목표 → 7일 드립 캠페인
- **SNS 캘린더** — 월간 콘텐츠 일정 자동 생성

### 운영 자동화
- **컨텐츠 분석** — 게시물 URL → 인사이트
- **고객 응대** — Q&A → 답변 초안

## 단계적 진행 권장

지금은 **card-reels** 한 스킬만 안정화되어 있어요. 다음 권장 순서:

1. **현재 스킬 v1.0 출시** (card-reels)
2. **사용자 피드백 받기** (1-2주)
3. **두 번째 스킬 만들 때** 모노레포로 전환

너무 일찍 추상화하면 오히려 복잡해져요. 첫 스킬은 단순하게 출시하고, 두 번째가 생기면 그때 공통 부분을 뽑아내는 게 깔끔합니다.
