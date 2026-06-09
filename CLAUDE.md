# DANZZAK — CLAUDE.md

> 이 파일은 Claude(AI)가 DANZZAK 프로젝트를 개발할 때 참조하는 핵심 컨텍스트다.
> 모든 코드 생성, 수정, 리뷰 요청 시 이 파일의 규칙을 우선 적용한다.

---

## 프로젝트 개요

**DANZZAK**는 단어를 입력하면 즉시 퀴즈 게임과 인쇄용 시험지를 제공하는 올인원 단어 학습 플랫폼이다.

- **타겟:** 중·고등 학생(10대) + 교사 / 학원 강사
- **핵심 가치:** 게임처럼 재미있는 단어 암기 + 클릭 몇 번으로 끝나는 시험지 제작
- **경쟁 차별화:** 클래스카드 대비 핵심 기능 완전 무료, 게임 종류 다양, 힙한 디자인
- **PRD:** `/docs/PRD.md` 참조
- **디자인 시스템:** `/docs/DESIGN.md` 참조

---

## 기술 스택

```
Frontend   React 18 + Vite 5
Styling    Tailwind CSS v4
언어       TypeScript (strict mode)
라우팅     React Router v7
상태관리   Zustand (전역) + React Query (서버 상태)
폼         React Hook Form + Zod
AI / OCR   Google Gemini 1.5 Flash — Vercel Edge Function 경유 (무료: 하루 1500회 / 분당 15회)
TTS        Web Speech API (브라우저 내장)
저장소     localStorage (단어 세트, 학습 기록)
인쇄       window.print() + @media print CSS
배포       Vercel (Edge Functions 포함)
패키지     pnpm
```

---

## 프로젝트 구조

```
DANZZAK/
├── src/
│   ├── pages/                  # 라우팅 단위 페이지
│   │   ├── Home.tsx            # 랜딩 / 세트 목록
│   │   ├── Input.tsx           # 단어 입력 (CSV + 텍스트 방식)
│   │   ├── Study.tsx           # 게임 모드 선택
│   │   ├── EditSet.tsx         # 단어장 편집
│   │   ├── Records.tsx         # 학습 기록
│   │   ├── Worksheet.tsx       # 시험지 빌더
│   │   ├── SharedGame.tsx      # 공유 게임 진입
│   │   ├── SharedSet.tsx       # 공유 단어장 진입
│   │   ├── SharedWorksheet.tsx # 공유 시험지 진입
│   │   └── Game/               # 게임별 페이지
│   │       ├── Flashcard.tsx   # 스와이프 제스처 (위=알아요, 아래=몰라요)
│   │       ├── FillIn.tsx
│   │       ├── MultipleChoice.tsx  # 4지선다 (뜻고르기/단어고르기/랜덤혼합)
│   │       ├── Matching.tsx        # 매칭 게임 (풀 교체, 타이머, 하트 시스템)
│   │       ├── Falling.tsx     # 크래싱 게임 (FallingCard + FallingInput)
│   │       ├── FallingCard.tsx
│   │       ├── FallingInput.tsx
│   │       ├── SpeedQuiz.tsx
│   │       ├── Typewriter.tsx  # 타이핑 암기 게임
│   │       └── CloudJump.tsx   # 구름 점프 게임 (Canvas 기반)
│   │
│   ├── components/
│   │   ├── NavBar.tsx
│   │   ├── input/
│   │   │   ├── CsvUpload.tsx          # CSV / 엑셀 업로드
│   │   │   ├── WordTable.tsx          # 편집 테이블 (추가/삭제/정렬)
│   │   │   └── IncompleteWordsModal.tsx
│   │   │
│   │   ├── games/
│   │   │   ├── AnswerReveal.tsx
│   │   │   ├── CloudJumpHUD.tsx       # 구름 점프 HUD (목숨/점수/콤보)
│   │   │   ├── ProgressBar.tsx
│   │   │   ├── QuizOverlay.tsx        # 구름 점프 4지선다 퀴즈 팝업
│   │   │   ├── ResultScreen.tsx
│   │   │   └── SharedScoreSaver.tsx
│   │   │
│   │   ├── worksheet/
│   │   │   └── SortableItem.tsx
│   │   │
│   │   └── ui/                 # 공통 UI 프리미티브
│   │       ├── Badge.tsx
│   │       ├── Button.tsx
│   │       ├── Input.tsx
│   │       ├── Modal.tsx
│   │       └── Toast.tsx
│   │
│   ├── hooks/
│   │   ├── useCloudJumpGame.ts # 구름 점프 게임 루프/물리/퀴즈 (RAF 기반)
│   │   ├── useGameWordSet.ts   # 게임용 단어 세트 로드 (공유 세션 포함)
│   │   ├── useStudyRecord.ts   # 학습 기록 (정답률, 스트릭)
│   │   ├── useTTS.ts           # Web Speech API 래퍼
│   │   └── useWordSet.ts       # 세트 CRUD (localStorage)
│   │
│   ├── store/
│   │   ├── settingsStore.ts    # Zustand — 앱 설정
│   │   ├── studyRecordStore.ts # Zustand — 학습 기록
│   │   └── wordSetStore.ts     # Zustand — 세트 + 폴더 (folders, moveSetToFolder 등)
│   │
│   ├── utils/
│   │   ├── cn.ts               # clsx + tailwind-merge 유틸
│   │   ├── csvParser.ts        # CSV / TSV 파싱
│   │   ├── feedback.ts         # 효과음(AudioContext) + 파티클/글로우
│   │   ├── gameUtils.ts        # 오답 생성, 단어 셔플
│   │   ├── id.ts               # 고유 ID 생성
│   │   ├── shareGame.ts        # 게임 공유 URL 유틸
│   │   ├── shareWordSet.ts     # 단어장 공유 URL 유틸
│   │   ├── shareWorksheet.ts   # 시험지 공유 URL 유틸
│   │   └── textParser.ts       # 붙여넣기 텍스트 파싱
│   │
│   ├── types/
│   │   ├── game.ts             # GameMode, GameResult 타입
│   │   ├── word.ts             # Word, WordSet 타입
│   │   └── worksheet.ts        # WorksheetType, WorksheetConfig 타입
│   │
│   └── api/                    # Vercel Edge Functions
│       └── ocr.ts              # POST /api/ocr — Claude API 프록시
│
├── docs/
│   ├── PRD.md
│   ├── DESIGN.md
│   └── CLAUDE.md               # 이 파일
│
├── public/
├── index.html
├── vite.config.ts
├── tailwind.config.ts
├── tsconfig.json
└── package.json
```

---

## 핵심 데이터 모델

```typescript
// types/word.ts

export interface Word {
  id: string;
  term: string;           // 영단어
  definition: string;     // 뜻
  isWeak: boolean;        // 취약 단어 여부
  stats: {
    correct: number;
    wrong: number;
  };
}

export interface WordSet {
  id: string;
  title: string;
  emoji: string;          // 단어장 커버 이모지
  theme: ThemePreset;     // 테마 프리셋 키
  words: Word[];
  createdAt: string;      // ISO 날짜
  updatedAt: string;
}

export type ThemePreset =
  | 'violet' | 'coral' | 'mint' | 'rose' | 'sky' | 'black';

// types/game.ts

export type GameMode =
  | 'flashcard'
  | 'fill-in'
  | 'multiple-choice'
  | 'matching'
  | 'falling'
  | 'speed-quiz'
  | 'cloud-jump';

export interface GameResult {
  setId: string;
  mode: GameMode;
  correct: number;
  wrong: number;
  duration: number;       // 초 단위
  combo: number;          // 최대 연속 정답
  playedAt: string;
  score?: number;         // cloud-jump 등 자체 점수 계산 게임에서 사용
}

// types/worksheet.ts

export type WorksheetType =
  | 'fill-blank'          // 빈칸 채우기
  | 'write-repeat'        // 여러 번 쓰기
  | 'checklist'           // 체크리스트
  | 'multiple-choice'     // 객관식
  | 'translation'         // 영작 연습
  | 'dictation';          // 받아쓰기 시트

export interface WorksheetConfig {
  type: WorksheetType;
  title: string;
  columns: 1 | 2 | 4;    // 레이아웃 단수
  repeatCount?: number;   // write-repeat 전용 (기본 3)
  includeAnswer: boolean; // 정답지 포함 여부
  fontSize: 'sm' | 'md' | 'lg';
  lineSpacing: 'normal' | 'wide';
  scramble: boolean;      // 문제 순서 섞기
}
```

---

## 개발 명령어

```bash
pnpm install          # 의존성 설치
pnpm dev              # 개발 서버 (localhost:5173)
pnpm build            # 프로덕션 빌드
pnpm preview          # 빌드 결과 미리보기
pnpm type-check       # TypeScript 타입 검사
pnpm lint             # ESLint 검사
```

---

## 환경변수

```bash
# .env.local (절대 커밋 금지)
GEMINI_API_KEY=AI...           # Gemini OCR — Google AI Studio 발급, 서버사이드 전용
OCR_ACCESS_CODE=danzzak2024          # OCR 접속 코드
UPSTASH_REDIS_REST_URL=...           # Upstash Redis REST URL
UPSTASH_REDIS_REST_TOKEN=...         # Upstash Redis REST Token

# .env (공개 가능)
VITE_APP_NAME=DANZZAK
VITE_MAX_OCR_PER_DAY=10        # OCR 일일 호출 제한
```

> **중요:** `GEMINI_API_KEY`는 반드시 Vercel Edge Function (`/api/ocr.ts`) 에서만 사용한다. 클라이언트 번들에 절대 포함되면 안 된다. `VITE_` prefix가 붙은 환경변수는 클라이언트에 노출되므로 API 키에 절대 사용하지 않는다.

---

## API — OCR 엔드포인트

```typescript
// api/ocr.ts — Vercel Edge Function
// POST /api/ocr
// Request:  { imageBase64: string, mimeType: string, accessCode: string }
// Response: { words: Array<{ term: string; definition: string }>, used: number, limit: number, remaining: number }
// 인증: OCR_ACCESS_CODE 환경변수와 대조
// 제한: Upstash Redis로 IP별 일일 MAX_PER_DAY회 제한
// 모델: gemini-1.5-flash (@google/generative-ai 패키지)
```

**호출 예시 (클라이언트):**
```typescript
// utils/ocr.ts
export async function extractWordsFromImage(file: File, accessCode: string) {
  const base64 = await fileToBase64(file);
  const res = await fetch('/api/ocr', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ imageBase64: base64, mimeType: file.type, accessCode }),
  });
  if (!res.ok) throw new Error('OCR 실패');
  return res.json() as Promise<{ words: Word[]; used: number; limit: number; remaining: number }>;
}
```

---

## 코딩 컨벤션

### 일반
- **TypeScript strict mode** — `any` 금지, 명시적 타입 선언
- **함수형 컴포넌트** + React Hooks만 사용 (클래스 컴포넌트 금지)
- 파일명: 컴포넌트는 `PascalCase.tsx`, 유틸/훅은 `camelCase.ts`
- **Named export** 우선, default export는 페이지 컴포넌트에만 허용

### 컴포넌트 작성 순서
```typescript
// 1. imports
// 2. types / interfaces
// 3. 컴포넌트 함수
//    a. hooks
//    b. derived state / memo
//    c. handlers
//    d. return JSX
// 4. export
```

### Tailwind 사용 규칙
- 디자인 토큰은 `tailwind.config.ts`에 CSS 변수로 정의 후 사용
- 인라인 스타일(`style={{}}`) 최소화 — 애니메이션처럼 동적 값만 허용
- `cn()` 유틸리티(`clsx` + `tailwind-merge`)로 조건부 클래스 처리
- 색상은 디자인 시스템의 토큰명 그대로 사용 (`text-primary`, `bg-surface` 등)

### 상태관리
- 단어 세트, 학습 기록: **localStorage** (Zustand persist 미들웨어)
- 게임 진행 상태: **컴포넌트 로컬 state** (useReducer)
- 서버 데이터(OCR 결과): **React Query**

### 텍스트 파싱 (`utils/textParser.ts`)

자유 형식 텍스트에서 영단어-뜻 쌍을 추출하는 5단계 파이프라인.

**지원 구분자**
- 줄 항목 구분자(DELIMITER_PATTERN): `*` `•` `·` `-` `–` `—` `▪` `▸` `►` `◆` `●` `○` `✦` `※` 및 숫자/알파벳 번호(`1.` `1)` `①` `a.` 등)
- term/definition 구분자 (우선순위 순):
  1. 탭(`\t`)
  2. 콜론(`: `) — term이 영단어 1~4개 이하일 때만 적용
  3. 연속 공백 2칸 이상
  4. 한글 첫 등장 위치 기준

**처리 순서**
1. `normalizeInput` — 기호 구분자가 2회 이상 등장하면 줄 분리
2. `stripLeadingSymbols` — 줄 앞 번호/기호 제거
3. `splitMultiplePairs` — 한 줄에 여러 쌍이 있으면 분리 (한글→영문 전환 감지)
4. `splitTermDefinition` — 전략 배열 순서대로 term/definition 분리
5. `detectAndSwap` — 한글 비율 높으면 term↔definition 자동 교체
6. `refineTerm` / `refineDefinition` — 앞뒤 기호·공백 정제

### 에러 처리
- OCR / API 에러: `toast-error` 컴포넌트로 사용자에게 표시
- localStorage 파싱 에러: 빈 배열로 폴백, console.warn
- 게임 중 에러: 게임 중단 없이 해당 단어 스킵

---

## 게임 구현 원칙

### 공통
- 일반 게임(flashcard, fill-in 등): `useReducer` 로컬 state로 진행 상태 관리
- Canvas 기반 게임(cloud-jump): `useCloudJumpGame` 훅에서 RAF + ref로 물리/충돌 처리, React state는 HUD/퀴즈 오버레이에만 사용
- 게임 시작 전 단어 배열 셔플 (`utils/gameUtils.ts > shuffleArray`)
- 게임 종료 시 `GameResult`를 `useStudyRecord` 훅으로 저장
- 단어 세트 로드는 `useGameWordSet` 훅 사용 (공유 게임 세션 자동 처리)

### 오답 보기 생성 (4지선다)
```typescript
// questionType: 'term' → definition 선택지, 'definition' → term 선택지
// 세트가 4개 미만이면 게임 시작 불가 (UI에서 안내)
export function generateChoices(
  correct: Word,
  allWords: Word[],
  questionType: 'term' | 'definition' = 'term'
): string[]
```

### 오답 표시 패턴 (revealWord)
- 오답 발생 시 `setRevealWord(currentWord)` 로 현재 단어를 캡처
- JSX에서 `revealWord?.term`을 사용 — `currentWord`(인덱스 기반)를 직접 참조하면 진행 후 다음 단어 정답이 노출되는 버그 발생
- 입력 게임(SpeedQuiz, FillIn 등): `readOnly={!!feedback}` 패턴으로 오답 중 포커스 유지 (`disabled` 사용 시 포커스 소실)

### 매칭 게임
- `VISIBLE = 5`: 화면에 동시 표시되는 단어 수
- 풀(pool) 기반: 매칭 완료된 쌍 제거 후 pool에서 새 단어 삽입 (`insertAt` 헬퍼)
- `twoDistinctIdx(len)`: term/definition이 같은 위치에 삽입되지 않도록 보장
- 타이머: 10초 카운트다운, 만료/오답 시 하트 차감, `setTimeout` 체인 방식
- 하트: 최대 5개(MAX_HEARTS), 3콤보마다 +1, 0개 시 게임오버
- 점수: `matched * 100 + hearts * 200 + maxCombo * 20`
- 카드 높이: `h-[60px]` 고정 (단어 길이 무관하게 균일)

### 크래싱 게임 (Falling Words)
- `requestAnimationFrame` 기반 낙하 루프
- 속도 레벨 1~5단계: `fallDuration = 8000 - (level - 1) * 1500` ms
- 목숨 3개 시스템: 바닥 도달 시 목숨 1 차감, 0이 되면 게임 오버
- 모바일: 키보드 입력 대신 선택지 탭 방식으로 전환

### 플래시카드 스와이프 제스처
- 카드 자체를 **위로 스와이프 → 알아요(정답)**, **아래로 스와이프 → 몰라요(오답)**
- 버튼 없이 드래그만으로 판정 (임계값 80px)
- 탭하면 카드 뒤집기 유지
- 모바일 대응: `touchAction: 'none'` + `setPointerCapture` 사용
- 인라인 `transform` 스타일은 드래그 중(`dragY !== 0`)일 때만 적용 (CSS flip 클래스와 충돌 방지)

### 플래시카드 3D 플립
```css
/* 반드시 GPU 가속 사용 */
.card-flip {
  transform-style: preserve-3d;
  transition: transform 600ms cubic-bezier(0.4, 0, 0.2, 1);
}
.card-flip.flipped { transform: rotateY(180deg); }
.card-back { transform: rotateY(180deg); backface-visibility: hidden; }
```

### 구름 점프 게임 (CloudJump)
- Canvas API + `requestAnimationFrame` 기반, React와 렌더링 완전 분리
- 물리: 중력(`GRAVITY=0.2`), 점프력(`JUMP_FORCE=-13`), 좌우 이동(`MOVE_SPEED=4`)
- 구름 너비가 점수에 따라 축소: 500점 미만 2배 → 500점 1.5배 → 1000점 1배 → 2000점 이상 0.5배
- 퀴즈: 새 구름 3~4개 밟을 때마다 4지선다 팝업 (5초 제한시간)
- 구름은 2번 밟으면 사라짐. 오답 복귀 시 직전 구름 복원 (다시 2번 밟으면 제거)
- 콤보 10배수마다 하트 아이템 등장 (목숨 최대 3개)
- 500/1000/1500/2000점 마일스톤 도달 시 축하 메시지

---

## 시험지 구현 원칙

### 인쇄 CSS 격리
```css
/* 인쇄 시 UI 요소 제거 */
@media print {
  .no-print { display: none !important; }
  .print-only { display: block !important; }
  body { background: white; }
  .worksheet-container { box-shadow: none; border: none; }
}
```

### 인라인 편집
- 시험지 미리보기 내 모든 텍스트는 `contenteditable="true"` 또는 오버레이 input으로 편집 가능
- 편집 모드(연필 아이콘 활성) ↔ 미리보기 모드 토글
- 문항 드래그 재정렬: `@dnd-kit/sortable` 사용

### 레이아웃 전환
```typescript
// 1단 / 2단 / 3단 CSS Grid
const gridClass = {
  1: 'grid-cols-1',
  2: 'grid-cols-2',
  3: 'grid-cols-3',
}[config.columns];
```

---

## 접근성 & 성능

### 접근성
- 모든 인터랙티브 요소: `aria-label` 또는 시각적 레이블
- 색상만으로 정보 전달 금지 (아이콘 또는 텍스트 병행)
- 키보드 네비게이션: `Tab`, `Enter`, `Space`, `Escape` 전체 지원
- `prefers-reduced-motion`: 게임 애니메이션 전체 비활성화

### 성능
- 초기 번들: 코드 스플리팅 (`React.lazy` + `Suspense`) — 게임 컴포넌트 각각 lazy load
- 이미지: `<img loading="lazy">` 기본 적용
- localStorage: 단어 세트는 최대 50개, 학습 기록은 최근 100개만 유지
- 크래싱 게임: `requestAnimationFrame` + `will-change: transform`으로 60fps 유지

---

## 개발 단계 (Phase)

### Phase 1 — MVP ✅ 완료
- [x] 텍스트 입력 (타이핑 + 붙여넣기)
- [x] 단어 목록 편집 테이블
- [x] 플래시카드 게임
- [x] 빈칸 채우기 시험지
- [x] 여러 번 쓰기 시험지
- [x] 인쇄 기능 (`window.print()`)
- [x] 세트 localStorage 저장/불러오기
- [x] 기본 라우팅 구조

### Phase 2 — 핵심 차별화 ✅ 완료 (OCR 제외)
- [ ] OCR 입력 (Claude API + Edge Function) — API 키 필요, 별도 진행
- [x] CSV 업로드
- [x] 4지선다 게임 (뜻고르기 / 단어고르기 / 랜덤혼합 모드)
- [x] 빈칸 채우기 게임 (타이핑)
- [x] 인쇄 편집 (인라인 수정, 드래그 재정렬)
- [x] 체크리스트 + 객관식 시험지
- [x] 단어장 테마 커스텀 (6종 프리셋 — 플래시카드/게임 뷰 적용)
- [x] 학습 기록 (정답률, 취약 단어, 스트릭)
- [x] 개별 단어장 학습 기록 페이지 (`/records?setId=xxx`)

### Phase 3 — 게임 확장 ✅ 완료 (받아쓰기·다크모드 제외)
- [x] 매칭 게임 (풀 교체 방식, 10초 타이머, 하트 시스템, 콤보 보너스, 점수 결과)
- [x] 크래싱 게임 (Falling Words)
- [x] 스피드 퀴즈 (타이머 + 콤보)
- [x] 타이핑 암기 게임 (Typewriter — 단어 노출 후 타이핑)
- [x] 구름 점프 게임 (CloudJump — Canvas 기반)
- [x] 영작 연습 시트
- [ ] 받아쓰기 시트 (TTS 연동)
- [ ] 다크 모드

### Phase 4 — UX 개선
- [x] 홈 화면 폴더 기능 (단어장 그룹화)
- [x] 드래그로 폴더 이동 (`@dnd-kit/core`)
- [x] 4지선다 공유 시 출제 방식 선택 (뜻고르기/단어고르기/혼합)
- [x] 게임 오답 시 정답 표시 시간 연장
- [x] 크래싱 게임 오답 시 낙하 위치에서 정답 표시
- [x] 오답 표시 중 다음 문제 정답 노출 버그 수정 (revealWord 패턴)
- [x] 타이핑 게임 엔터 후 입력창 포커스 유지 (readOnly 패턴)

---

## 자주 묻는 질문 (Claude에게)

**Q: 새 컴포넌트를 만들 때 어떤 파일 위치에 만들어야 해?**
공통 재사용 UI → `src/components/ui/`
게임 전용 → `src/components/games/`
시험지 전용 → `src/components/worksheet/`
페이지 전용 (재사용 없음) → 해당 페이지 파일 내 or `src/pages/` 하위 폴더

**Q: 단어 데이터를 어디서 읽고 저장해?**
`useWordSet` 훅을 통해서만 접근. 훅 내부에서 Zustand store + localStorage를 처리한다. 컴포넌트에서 localStorage를 직접 호출하지 않는다.

**Q: 게임 상태(현재 문제 인덱스, 점수 등)는 어디서 관리해?**
일반 게임: `useReducer` 로컬 state (게임 컴포넌트 내). Canvas 게임(cloud-jump): `useCloudJumpGame` 훅의 `gsRef`(ref 기반 뮤터블 상태). 두 경우 모두 Zustand store에 올리지 않는다 — 게임 종료 후 `GameResult`만 전역 저장.

**Q: Tailwind에서 디자인 시스템 색상을 어떻게 써?**
`tailwind.config.ts`에 CSS 변수로 매핑된 커스텀 컬러를 사용한다.
예: `bg-primary`, `text-ink-muted`, `border-hairline`
하드코딩(`bg-[#7C3AED]`) 지양 — 다크모드 전환이 안 됨.

**Q: OCR이 실패하면?**
`/api/ocr` 에러 → `toast-error("이미지를 인식하지 못했어요. 다시 시도하거나 직접 입력해주세요.")` 표시. 게임/작업 흐름은 중단하지 않는다.

**Q: 인쇄할 때 배경색이 안 나와요.**
`@media print` CSS에 `print-color-adjust: exact; -webkit-print-color-adjust: exact;` 추가. 단, 기본적으로 인쇄 시 배경 불필요한 그림자/색상은 제거하고 흑백 출력에 최적화한다.
