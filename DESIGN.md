---
version: 1.0
name: DANZZAK Design System
description: >
  DANZZAK의 디자인 언어 — 학습을 게임처럼 느끼게 만드는 에너제틱한 퍼플 기반 시스템.
  10대 학습자와 교사 모두를 위해 "교육 앱 같지 않은 교육 앱"을 지향한다.
  Pretendard 타이포그래피 위에 고채도 바이올렛 프라이머리, 코랄 포인트, 그리고
  게임 피드백을 위한 시맨틱 컬러가 레이어링된다. 라이트/다크 모드 모두 지원.

colors:
  # ── Primary ──────────────────────────────────────────────────────────────
  primary:          "#7C3AED"   # Violet 600 — 브랜드 색, CTA, 링크, 포커스
  primary-hover:    "#6D28D9"   # Violet 700
  primary-active:   "#5B21B6"   # Violet 800
  primary-subtle:   "#EDE9FE"   # Violet 50 — 뱃지 배경, 호버 틴트
  on-primary:       "#FFFFFF"

  # ── Secondary / Game accent ───────────────────────────────────────────────
  secondary:        "#EC4899"   # Pink 500 — 게임 포인트, 콤보 이펙트
  secondary-subtle: "#FCE7F3"   # Pink 50

  # ── Canvas ───────────────────────────────────────────────────────────────
  canvas:           "#FAFAF9"   # 따뜻한 오프화이트 — 페이지 배경
  canvas-dark:      "#0F0F11"   # 다크모드 배경
  surface:          "#FFFFFF"   # 카드, 인풋 필드
  surface-dark:     "#1C1B20"   # 다크모드 카드
  surface-raised:   "#F5F3FF"   # 퍼플 틴트 raised 카드

  # ── Ink ───────────────────────────────────────────────────────────────────
  ink:              "#18181B"   # 최상위 텍스트 (Zinc 900)
  ink-secondary:    "#3F3F46"   # 본문 보조 (Zinc 700)
  ink-muted:        "#71717A"   # 플레이스홀더, 메타 (Zinc 500)
  ink-faint:        "#A1A1AA"   # 비활성 레이블 (Zinc 400)
  ink-on-dark:      "#F4F4F5"   # 다크모드 주 텍스트

  # ── Hairline ─────────────────────────────────────────────────────────────
  hairline:         "#E4E4E7"   # 카드 테두리 (Zinc 200)
  hairline-dark:    "#27272A"   # 다크모드 테두리 (Zinc 800)

  # ── Semantic ─────────────────────────────────────────────────────────────
  success:          "#10B981"   # Emerald 500 — 정답 피드백
  success-subtle:   "#D1FAE5"
  danger:           "#EF4444"   # Red 500 — 오답 피드백
  danger-subtle:    "#FEE2E2"
  warning:          "#F59E0B"   # Amber 500 — 타이머 경고
  warning-subtle:   "#FEF3C7"
  info:             "#3B82F6"   # Blue 500 — 안내

  # ── Game / Accent palette (게임 이펙트, 일러스트, 테마 커스텀용) ──────────
  accent-violet:    "#8B5CF6"   # 게임 콤보 글로우
  accent-coral:     "#F97316"   # 크래싱 게임 단어 블록
  accent-mint:      "#2DD4BF"   # 매칭 게임 연결선
  accent-yellow:    "#FBBF24"   # 별점, 스트릭 아이콘
  accent-rose:      "#FB7185"   # 카드 테마 옵션
  accent-sky:       "#38BDF8"   # 플래시카드 뒷면
  accent-lime:      "#A3E635"   # 스피드 콤보 MAX 이펙트

typography:
  display-1:
    fontFamily: "'Pretendard Variable', Pretendard, -apple-system, sans-serif"
    fontSize: 64px
    fontWeight: 800
    lineHeight: 1.0
    letterSpacing: -2px
  display-2:
    fontFamily: "'Pretendard Variable', Pretendard, -apple-system, sans-serif"
    fontSize: 48px
    fontWeight: 800
    lineHeight: 1.04
    letterSpacing: -1.5px
  heading-1:
    fontFamily: "'Pretendard Variable', Pretendard, -apple-system, sans-serif"
    fontSize: 36px
    fontWeight: 700
    lineHeight: 1.1
    letterSpacing: -0.75px
  heading-2:
    fontFamily: "'Pretendard Variable', Pretendard, -apple-system, sans-serif"
    fontSize: 24px
    fontWeight: 700
    lineHeight: 1.25
    letterSpacing: -0.5px
  heading-3:
    fontFamily: "'Pretendard Variable', Pretendard, -apple-system, sans-serif"
    fontSize: 20px
    fontWeight: 600
    lineHeight: 1.3
    letterSpacing: -0.25px
  title:
    fontFamily: "'Pretendard Variable', Pretendard, -apple-system, sans-serif"
    fontSize: 18px
    fontWeight: 600
    lineHeight: 1.4
    letterSpacing: -0.125px
  body-md:
    fontFamily: "'Pretendard Variable', Pretendard, -apple-system, sans-serif"
    fontSize: 16px
    fontWeight: 400
    lineHeight: 1.6
    letterSpacing: 0
  body-sm:
    fontFamily: "'Pretendard Variable', Pretendard, -apple-system, sans-serif"
    fontSize: 14px
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: 0
  button:
    fontFamily: "'Pretendard Variable', Pretendard, -apple-system, sans-serif"
    fontSize: 15px
    fontWeight: 600
    lineHeight: 1.4
    letterSpacing: 0
  caption:
    fontFamily: "'Pretendard Variable', Pretendard, -apple-system, sans-serif"
    fontSize: 13px
    fontWeight: 400
    lineHeight: 1.4
    letterSpacing: 0
  eyebrow:
    fontFamily: "'Pretendard Variable', Pretendard, -apple-system, sans-serif"
    fontSize: 11px
    fontWeight: 700
    lineHeight: 1.3
    letterSpacing: 0.5px
    textTransform: uppercase
  mono:
    fontFamily: "'JetBrains Mono', 'Fira Code', monospace"
    fontSize: 14px
    fontWeight: 400
    lineHeight: 1.6

rounded:
  xs:   4px
  sm:   6px
  md:   10px
  lg:   14px
  xl:   20px
  2xl:  28px
  full: 9999px

spacing:
  xxs: 4px
  xs:  8px
  sm:  12px
  md:  16px
  lg:  24px
  xl:  32px
  xxl: 48px
  xxxl: 64px

animation:
  duration-fast:   120ms
  duration-base:   200ms
  duration-slow:   350ms
  duration-game:   600ms    # 카드 플립, 정답 이펙트
  easing-default:  "cubic-bezier(0.4, 0, 0.2, 1)"
  easing-spring:   "cubic-bezier(0.34, 1.56, 0.64, 1)"   # 게임 팝 이펙트
  easing-out:      "cubic-bezier(0, 0, 0.2, 1)"

components:
  # ── Navigation ─────────────────────────────────────────────────────────────
  nav-bar:
    backgroundColor: "{colors.surface}"
    borderBottom: "1px solid {colors.hairline}"
    textColor: "{colors.ink}"
    typography: "{typography.body-sm}"
    padding: "12px 16px"
    height: 56px
    backdropFilter: "blur(12px)"   # 스크롤 시 반투명 효과

  # ── Buttons ────────────────────────────────────────────────────────────────
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-primary}"
    typography: "{typography.button}"
    rounded: "{rounded.full}"
    padding: "10px 20px"
    transition: "transform 150ms, background-color 150ms"

  button-primary-hover:
    backgroundColor: "{colors.primary-hover}"

  button-primary-pressed:
    backgroundColor: "{colors.primary-active}"
    transform: "scale(0.96)"

  button-secondary:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.primary}"
    border: "1.5px solid {colors.primary}"
    typography: "{typography.button}"
    rounded: "{rounded.full}"
    padding: "10px 20px"

  button-utility:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    border: "1px solid {colors.hairline}"
    typography: "{typography.button}"
    rounded: "{rounded.md}"
    padding: "6px 14px"

  button-danger:
    backgroundColor: "{colors.danger}"
    textColor: "#FFFFFF"
    typography: "{typography.button}"
    rounded: "{rounded.full}"

  button-icon:
    backgroundColor: "{colors.primary-subtle}"
    textColor: "{colors.primary}"
    rounded: "{rounded.full}"
    size: "40px"

  # ── Game-specific buttons ──────────────────────────────────────────────────
  button-correct:
    backgroundColor: "{colors.success}"
    textColor: "#FFFFFF"
    typography: "{typography.button}"
    rounded: "{rounded.lg}"
    animation: "pulse 300ms {animation.easing-spring}"

  button-wrong:
    backgroundColor: "{colors.danger}"
    textColor: "#FFFFFF"
    typography: "{typography.button}"
    rounded: "{rounded.lg}"
    animation: "shake 300ms ease"

  # ── Cards ──────────────────────────────────────────────────────────────────
  feature-card:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    border: "1px solid {colors.hairline}"
    typography: "{typography.body-md}"
    rounded: "{rounded.lg}"
    padding: "{spacing.lg}"

  feature-card-elevated:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.lg}"
    padding: "{spacing.lg}"
    boxShadow: >
      0 1px 2px rgba(0,0,0,0.04),
      0 4px 12px rgba(124,58,237,0.08),
      0 16px 32px rgba(124,58,237,0.06)

  word-card:
    backgroundColor: "{colors.surface}"
    border: "1px solid {colors.hairline}"
    rounded: "{rounded.xl}"
    padding: "{spacing.lg}"
    minHeight: "200px"
    # 테마 커스텀 시 backgroundColor, border 색상을 교체
    boxShadow: "0 2px 8px rgba(124,58,237,0.10)"

  word-card-flipped:
    backgroundColor: "{colors.primary-subtle}"
    border: "1.5px solid {colors.primary}"
    transition: "transform 600ms cubic-bezier(0.4,0,0.2,1)"
    transform: "rotateY(180deg)"

  game-card:
    backgroundColor: "{colors.surface-raised}"
    border: "1.5px solid {colors.primary}"
    rounded: "{rounded.lg}"
    padding: "{spacing.md}"
    boxShadow: "0 0 0 4px {colors.primary-subtle}"

  worksheet-card:
    backgroundColor: "{colors.surface}"
    border: "1px solid {colors.hairline}"
    rounded: "{rounded.lg}"
    padding: "{spacing.xl}"

  # ── Badges & Tags ──────────────────────────────────────────────────────────
  badge-pill:
    backgroundColor: "{colors.primary-subtle}"
    textColor: "{colors.primary}"
    typography: "{typography.eyebrow}"
    rounded: "{rounded.full}"
    padding: "4px 10px"

  badge-success:
    backgroundColor: "{colors.success-subtle}"
    textColor: "{colors.success}"
    typography: "{typography.eyebrow}"
    rounded: "{rounded.full}"
    padding: "4px 10px"

  badge-danger:
    backgroundColor: "{colors.danger-subtle}"
    textColor: "{colors.danger}"
    typography: "{typography.eyebrow}"
    rounded: "{rounded.full}"
    padding: "4px 10px"

  tag-weak:
    backgroundColor: "{colors.danger-subtle}"
    textColor: "{colors.danger}"
    rounded: "{rounded.sm}"
    padding: "2px 8px"
    typography: "{typography.caption}"

  # ── Inputs ────────────────────────────────────────────────────────────────
  text-input:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    placeholderColor: "{colors.ink-faint}"
    border: "1.5px solid {colors.hairline}"
    rounded: "{rounded.md}"
    padding: "10px 14px"
    typography: "{typography.body-md}"
    focusBorder: "1.5px solid {colors.primary}"
    focusShadow: "0 0 0 3px {colors.primary-subtle}"

  game-input:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    border: "2px solid {colors.primary}"
    rounded: "{rounded.lg}"
    padding: "12px 16px"
    fontSize: 20px
    fontWeight: 600
    textAlign: center

  # ── Progress & Scoring ────────────────────────────────────────────────────
  progress-bar:
    trackColor: "{colors.hairline}"
    fillColor: "{colors.primary}"
    height: 6px
    rounded: "{rounded.full}"

  combo-counter:
    backgroundColor: "{colors.accent-yellow}"
    textColor: "#78350F"
    typography: "{typography.heading-3}"
    rounded: "{rounded.full}"
    padding: "6px 16px"
    boxShadow: "0 0 16px rgba(251,191,36,0.5)"

  streak-indicator:
    iconColor: "{colors.accent-yellow}"
    textColor: "{colors.ink}"
    typography: "{typography.title}"

  # ── Worksheet ─────────────────────────────────────────────────────────────
  worksheet-header:
    backgroundColor: "{colors.surface}"
    borderBottom: "2px solid {colors.ink}"
    padding: "{spacing.md} 0"

  worksheet-row:
    borderBottom: "1px solid {colors.hairline}"
    padding: "10px {spacing.xs}"
    typography: "{typography.body-md}"

  worksheet-blank:
    borderBottom: "2px solid {colors.ink}"
    minWidth: "140px"
    display: inline-block

  # ── Signature Components ───────────────────────────────────────────────────
  hero-band:
    background: "linear-gradient(135deg, #4C1D95 0%, #7C3AED 50%, #A855F7 100%)"
    textColor: "{colors.on-primary}"
    padding: "{spacing.xxxl} {spacing.lg}"

  mode-selector-card:
    backgroundColor: "{colors.surface}"
    border: "1px solid {colors.hairline}"
    rounded: "{rounded.xl}"
    padding: "{spacing.lg}"
    hoverBorder: "2px solid {colors.primary}"
    hoverShadow: "0 4px 20px rgba(124,58,237,0.15)"
    transition: "all 200ms ease"

  footer:
    backgroundColor: "{colors.canvas}"
    borderTop: "1px solid {colors.hairline}"
    textColor: "{colors.ink-muted}"
    typography: "{typography.caption}"
    padding: "{spacing.xl}"

  toast-success:
    backgroundColor: "{colors.success}"
    textColor: "#FFFFFF"
    rounded: "{rounded.lg}"
    padding: "{spacing.sm} {spacing.md}"
    boxShadow: "0 4px 16px rgba(16,185,129,0.3)"

  toast-error:
    backgroundColor: "{colors.danger}"
    textColor: "#FFFFFF"
    rounded: "{rounded.lg}"
    padding: "{spacing.sm} {spacing.md}"

  modal:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.xl}"
    padding: "{spacing.xl}"
    boxShadow: >
      0 8px 32px rgba(0,0,0,0.12),
      0 32px 64px rgba(124,58,237,0.10)
    backdropColor: "rgba(0,0,0,0.5)"

  # ── Theme Customization Presets ────────────────────────────────────────────
  theme-preset-violet:
    primary: "#7C3AED"
    cardBg: "#F5F3FF"
    cardBorder: "#DDD6FE"
  theme-preset-coral:
    primary: "#EA580C"
    cardBg: "#FFF7ED"
    cardBorder: "#FED7AA"
  theme-preset-mint:
    primary: "#0D9488"
    cardBg: "#F0FDFA"
    cardBorder: "#99F6E4"
  theme-preset-rose:
    primary: "#E11D48"
    cardBg: "#FFF1F2"
    cardBorder: "#FECDD3"
  theme-preset-sky:
    primary: "#0284C7"
    cardBg: "#F0F9FF"
    cardBorder: "#BAE6FD"
  theme-preset-black:
    primary: "#18181B"
    cardBg: "#F4F4F5"
    cardBorder: "#D4D4D8"
---

# DANZZAK Design System

> **한 줄 철학:** 교육용 색깔을 빼고, 10대가 SNS 앱처럼 자연스럽게 손이 가는 학습 경험.

---

## Brand Identity

DANZZAK는 두 가지 사용자를 동시에 섬긴다: 시험지를 뽑아야 하는 **선생님**과, 게임하듯 단어를 외우고 싶은 **학생**. 이 둘을 하나의 디자인 언어로 묶는 핵심은 **"단순하지만 에너제틱"**이다. 기능은 직관적이되, 게임 피드백과 색상은 생동감 있어야 한다.

### 브랜드 감성 키워드
- **힙 (Hip)** — 클래스카드보다 스냅챗에 가까운 느낌
- **빠름 (Fast)** — 입력에서 게임까지 탭 3번 이내
- **보람 (Rewarding)** — 정답 이펙트, 스트릭, 콤보가 학습 동기를 강화
- **신뢰 (Trustworthy)** — 선생님이 보기에도 깔끔하고 전문적인 인쇄 결과물

---

## Color System

### Primary — Violet

`{colors.primary}` **#7C3AED** (Violet 600)이 브랜드의 유일한 구조적 컬러다. CTA, 링크, 포커스 링, 활성 상태에만 사용한다. 장식적 fill에 절대 사용하지 않는다.

```
primary         #7C3AED   ████  주 CTA, 링크, 포커스
primary-hover   #6D28D9   ████  호버 상태
primary-active  #5B21B6   ████  클릭/눌림 상태
primary-subtle  #EDE9FE   ████  배경 틴트, 뱃지 배경
```

### Canvas & Surface

| 토큰 | 값 | 용도 |
|---|---|---|
| `canvas` | `#FAFAF9` | 페이지 배경 — 순백이 아닌 따뜻한 톤 |
| `surface` | `#FFFFFF` | 카드, 인풋 필드 — 캔버스와 대비 |
| `surface-raised` | `#F5F3FF` | 퍼플 틴트 강조 카드 (게임 선택 화면 등) |
| `canvas-dark` | `#0F0F11` | 다크모드 배경 |
| `surface-dark` | `#1C1B20` | 다크모드 카드 |

### Semantic Colors (게임 피드백)

```
success  #10B981  ████  정답 — Emerald 500
danger   #EF4444  ████  오답, 목숨 감소 — Red 500
warning  #F59E0B  ████  타이머 마지막 10초 — Amber 500
info     #3B82F6  ████  힌트, 안내 — Blue 500
```

시맨틱 컬러는 **게임 피드백과 상태 표시에만** 쓴다. 일반 UI 장식에는 쓰지 않는다.

### Accent Palette (게임 이펙트 & 테마 커스텀 전용)

| 토큰 | 값 | 용도 |
|---|---|---|
| `accent-violet` | `#8B5CF6` | 게임 콤보 글로우 |
| `accent-coral` | `#F97316` | 크래싱 게임 단어 블록 |
| `accent-mint` | `#2DD4BF` | 매칭 게임 연결선 |
| `accent-yellow` | `#FBBF24` | 별점 아이콘, 스트릭 불꽃 |
| `accent-lime` | `#A3E635` | 스피드 MAX 콤보 이펙트 |

> **규칙:** 악센트 색상은 CTA, 텍스트, 구조적 UI에 절대 사용하지 않는다. 게임 이펙트와 일러스트, 테마 커스텀 프리셋 내에서만 사용한다.

### 테마 커스텀 프리셋 (6종)

학생이 단어장 테마를 선택하면 `primary`, `cardBg`, `cardBorder`만 교체된다. 나머지 시스템은 그대로 유지된다.

| 프리셋 | Primary | 느낌 |
|---|---|---|
| 🟣 Violet (기본) | `#7C3AED` | 기본 DANZZAK |
| 🟠 Coral | `#EA580C` | 에너지, 집중 |
| 🟢 Mint | `#0D9488` | 차분, 집중 |
| 🔴 Rose | `#E11D48` | 열정, 개성 |
| 🔵 Sky | `#0284C7` | 클래식, 신뢰 |
| ⚫ Black | `#18181B` | 미니멀, 시크 |

---

## Typography

**폰트:** Pretendard Variable (한국어 최적화, CDN 제공)
**폴백:** `-apple-system, BlinkMacSystemFont, sans-serif`

Notion의 NotionInter 자리에 **Pretendard**를 사용한다. 한글 가독성이 높고, Variable Font라 weight 조절이 자유롭다.

### 스케일

| 토큰 | 크기 | Weight | 용도 |
|---|---|---|---|
| `display-1` | 64px | 800 | 랜딩 히어로 헤드라인 |
| `display-2` | 48px | 800 | 섹션 대형 헤드라인 |
| `heading-1` | 36px | 700 | 페이지 제목 |
| `heading-2` | 24px | 700 | 섹션 소제목 |
| `heading-3` | 20px | 600 | 카드 제목 |
| `title` | 18px | 600 | 컴포넌트 레이블 |
| `body-md` | 16px | 400 | 본문 기본 |
| `body-sm` | 14px | 400 | 보조 텍스트, 메타 |
| `button` | 15px | 600 | 버튼 레이블 |
| `caption` | 13px | 400 | 캡션, 타임스탬프 |
| `eyebrow` | 11px / uppercase | 700 | 뱃지, 카테고리 태그 |
| `mono` | 14px | 400 | 단어 직접 입력 필드 |

### 게임 화면 타이포그래피 규칙
- 단어(term) 표시: `heading-1` 또는 `heading-2`, weight 700
- 뜻(definition) 표시: `body-md`, weight 400, `ink-secondary`
- 점수/타이머: `display-2` 또는 `heading-1`, weight 800, `primary`

---

## Spacing

```
xxs   4px   아이콘-레이블 간격
xs    8px   인라인 요소 간격
sm    12px  인풋 내부 패딩
md    16px  카드 내부 기본, nav 패딩
lg    24px  카드 패딩, 섹션 내 요소 간격
xl    32px  카드 패딩 (대형), 섹션 헤더 여백
xxl   48px  섹션 간 수직 여백
xxxl  64px  히어로 상하 패딩
```

---

## Border Radius

| 토큰 | 값 | 용도 |
|---|---|---|
| `xs` | 4px | 인풋 필드, 인라인 칩 |
| `sm` | 6px | 작은 태그, 메뉴 아이템 |
| `md` | 10px | 유틸리티 버튼, 드롭다운 |
| `lg` | 14px | 기능 카드, 게임 선택 카드 |
| `xl` | 20px | 플래시카드, 모달, 이미지 프레임 |
| `2xl` | 28px | 대형 히어로 카드 |
| `full` | 9999px | CTA 버튼, 뱃지, 프로그레스 바 |

> Notion과 동일하게: 마케팅 CTA는 `full` 필, 인풋 필드는 `md`(10px)로 대비를 둔다.

---

## Animation

DANZZAK는 게임 앱이다. 애니메이션이 학습 보상 심리에 직결된다.

| 토큰 | 값 | 용도 |
|---|---|---|
| `duration-fast` | 120ms | 버튼 눌림, 토글 |
| `duration-base` | 200ms | 호버, 색상 전환 |
| `duration-slow` | 350ms | 모달 진입, 화면 전환 |
| `duration-game` | 600ms | 카드 플립 3D, 정답 이펙트 |
| `easing-default` | `cubic-bezier(0.4,0,0.2,1)` | 일반 전환 |
| `easing-spring` | `cubic-bezier(0.34,1.56,0.64,1)` | 팝 이펙트 (콤보, 별점) |
| `easing-out` | `cubic-bezier(0,0,0.2,1)` | 진입 애니메이션 |

### 게임 애니메이션 패턴

```css
/* 카드 플립 */
.flashcard { transform-style: preserve-3d; transition: transform 600ms cubic-bezier(0.4,0,0.2,1); }
.flashcard.flipped { transform: rotateY(180deg); }

/* 정답 팝 */
@keyframes correct-pop {
  0%   { transform: scale(1); }
  40%  { transform: scale(1.12); background-color: var(--success); }
  100% { transform: scale(1); }
}

/* 오답 셰이크 */
@keyframes wrong-shake {
  0%, 100% { transform: translateX(0); }
  20%       { transform: translateX(-8px); }
  60%       { transform: translateX(8px); }
}

/* 크래싱 게임 낙하 */
@keyframes word-fall {
  from { transform: translateY(-60px); opacity: 0; }
  to   { transform: translateY(100vh); opacity: 1; }
}
```

> `@media (prefers-reduced-motion: reduce)` 안에서 모든 게임 애니메이션을 비활성화한다.

---

## Elevation & Depth

| 레벨 | 처리 | 용도 |
|---|---|---|
| 0 — Flat | `1px solid {colors.hairline}` | 기본 카드, 테이블 |
| 1 — Soft | `0 2px 8px rgba(124,58,237,0.08)` | 게임 선택 카드, 플로팅 버튼 |
| 2 — Raised | `0 4px 20px rgba(124,58,237,0.12), 0 16px 40px rgba(124,58,237,0.08)` | 플래시카드, 게임 활성 카드 |
| 3 — Modal | `0 8px 32px rgba(0,0,0,0.12), 0 32px 64px rgba(124,58,237,0.10)` | 모달, 드로어 |

그림자의 색조는 Notion의 블랙 기반 그림자와 달리, **바이올렛 틴트**를 사용해 브랜드감을 유지한다.

---

## Grid & Layout

### Container

| 화면 | 컨테이너 너비 | 패딩 |
|---|---|---|
| Wide (1440px+) | 1200px | 0 auto |
| Desktop (1080px+) | 960px | 0 auto |
| Tablet (768px) | 100% | 0 24px |
| Mobile (≤600px) | 100% | 0 16px |

### 게임 화면 레이아웃
- 게임 카드: 화면 중앙 정렬, `max-width: 480px`
- 하단 컨트롤 버튼: `position: fixed; bottom: 0;` — 안전 영역(safe-area) 대응
- 진행률 바: 상단 고정 (`position: sticky; top: 56px`)

### 시험지 레이아웃 (인쇄)
- `@media print` 에서만 활성화
- A4 기준: `width: 210mm; padding: 15mm 20mm`
- 1단 / 2단 / 3단 CSS Grid로 전환
- 인쇄 시 배경색, 그림자 제거 (`print-color-adjust: exact` 예외 처리)

---

## Responsive Strategy

### Breakpoints

| 이름 | 너비 | 주요 변경 |
|---|---|---|
| Wide | 1440px+ | 풀 멀티컬럼, 최대 컨테이너 |
| Desktop | 1080px+ | 3-up 카드 그리드, 사이드바 |
| Tablet | 768px | 2-up 그리드, 탭 네비 |
| Mobile | ≤600px | 단일 컬럼, 하단 탭바, 풀너비 CTA |

### 터치 타겟
- 모든 인터랙티브 요소: 최소 `44 × 44px`
- 게임 버튼(정답/오답): 최소 `56 × 56px` (빠른 탭 대응)
- 플래시카드 스와이프: `touch-action: pan-y` 허용, 좌우 스와이프는 `pan-x`

### 아이패드 최적화
- 가로 모드: 2단 레이아웃 (왼쪽 단어 목록, 오른쪽 게임 영역)
- 외장 키보드 지원: `Enter` → 정답 제출, `Space` → 플래시카드 뒤집기, `→/←` → 다음/이전 카드

---

## Components

> Default 및 Active/Pressed 상태만 문서화. Hover는 개발 구현 시 `{colors.primary-hover}` 또는 `opacity: 0.9` 적용.

### Navigation

**`nav-bar`** — 상단 고정 네비게이션
- `{colors.surface}` 배경 + `backdrop-filter: blur(12px)` (스크롤 시 반투명)
- 높이 56px, 하단 `{colors.hairline}` 1px 보더
- 좌: 워드마크(DANZZAK 로고), 우: 세트 저장 버튼 + 프로필 아이콘
- 모바일: 하단 탭바(`홈 / 학습 / 시험지 / 내 기록`)로 대체

### Buttons

**`button-primary`** — 주 CTA ("시작하기", "게임 선택")
- `{colors.primary}` 배경, `{colors.on-primary}` 텍스트, `{typography.button}`, `{rounded.full}`
- 눌림: `scale(0.96)` + `{colors.primary-active}` 전환 (150ms)

**`button-secondary`** — 보조 CTA
- 흰 배경, `{colors.primary}` 텍스트 + 1.5px 보더, `{rounded.full}`
- 히어로에서 `button-primary` 옆에 쌍으로 사용

**`button-utility`** — 필터, 설정, 정렬 버튼
- 흰 배경, `{colors.hairline}` 보더, `{rounded.md}` — 마케팅 필보다 조밀

**`button-correct / button-wrong`** — 게임 전용
- 정답: `{colors.success}` + `correct-pop` 애니메이션
- 오답: `{colors.danger}` + `wrong-shake` 애니메이션 (300ms)

### Cards

**`word-card`** — 플래시카드 기본
- `{rounded.xl}`, 최소 높이 200px, `{colors.surface}`, 레벨-2 그림자
- 뒤집힘: `rotateY(180deg)`, 뒷면 배경 `{colors.primary-subtle}`
- 테마 프리셋 적용 시 배경/보더 색상만 교체

**`game-card`** — 게임 선택 화면 카드
- `{colors.surface-raised}` 배경, `{colors.primary}` 1.5px 보더
- 호버: 보더 2px + 레벨-1 그림자 (200ms ease)

**`mode-selector-card`** — 게임 모드 선택
- 기본: `{colors.surface}` + `{colors.hairline}` 보더
- 호버: `{colors.primary}` 2px 보더 + `0 4px 20px rgba(124,58,237,0.15)` 그림자

**`worksheet-card`** — 시험지 미리보기/편집
- 인쇄 mock: A4 비율 카드 (`aspect-ratio: 1 / 1.414`)
- 인쇄 모드: 그림자/보더 제거

### Inputs

**`text-input`** — 단어 입력 필드
- 흰 배경, `{colors.hairline}` 1.5px 보더, `{rounded.md}` (10px)
- 포커스: `{colors.primary}` 보더 + `0 0 0 3px {colors.primary-subtle}` 링

**`game-input`** — 게임 내 타이핑 필드 (빈칸 채우기, 받아쓰기)
- `{colors.primary}` 2px 보더, `{rounded.lg}`, `font-size: 20px`, `text-align: center`
- 정답 시: `{colors.success}` 보더 + `correct-pop`, 오답 시: `{colors.danger}` 보더 + `wrong-shake`

### Progress & Scoring

**`progress-bar`** — 게임 진행률
- 트랙: `{colors.hairline}`, 6px 높이, `{rounded.full}`
- 채움: `{colors.primary}` → 80% 이상에서 `{colors.success}`로 전환

**`combo-counter`** — 연속 정답 콤보 표시
- `{colors.accent-yellow}` 배경, 텍스트 `#78350F`
- 콤보 증가 시 `easing-spring` 팝 애니메이션

### Worksheet Components

**`worksheet-header`** — 시험지 상단 (제목, 이름, 날짜 칸)
- 흰 배경, 하단 `{colors.ink}` 2px 보더
- 편집 가능: 클릭 시 인라인 텍스트 편집 활성화

**`worksheet-blank`** — 빈칸 언더라인
- `{colors.ink}` 2px 하단 보더, `min-width: 140px`

### Signature Components

**`hero-band`** — 랜딩 히어로
- 바이올렛 그라디언트 (`135deg, #4C1D95 → #7C3AED → #A855F7`)
- `{typography.display-1}` 흰 헤드라인 + `button-primary` & `button-secondary` CTA 쌍
- Notion의 딥인디고 히어로와 동일한 역할 — 페이지의 유일한 강조 밴드

**`toast-success / toast-error`** — 게임 피드백 토스트
- 정답: `{colors.success}` 배경, 오답: `{colors.danger}` 배경
- 상단 중앙 슬라이드 인 (350ms), 1.5초 후 자동 사라짐

---

## Do's and Don'ts

### Do ✅
- `{colors.primary}` (Violet 600)은 주 CTA, 링크, 포커스 링에만 사용한다.
- 페이지 배경은 따뜻한 `{colors.canvas}` (#FAFAF9), 카드는 순백 `{colors.surface}` — 이 대비가 figure/ground를 만든다.
- 게임 피드백(정답/오답)은 반드시 `{colors.success}` / `{colors.danger}` 시맨틱 컬러를 사용한다.
- 악센트 팔레트는 게임 이펙트와 테마 커스텀 내에서만 쓴다.
- 마케팅 CTA는 `{rounded.full}`, 인풋/유틸리티 버튼은 `{rounded.md}` — 의도적인 대비다.
- 그림자에 바이올렛 틴트(`rgba(124,58,237,…)`)를 사용해 브랜드 일관성을 유지한다.
- 모든 게임 애니메이션은 `@media (prefers-reduced-motion)` 대응을 포함한다.
- 터치 타겟은 최소 44px, 게임 버튼은 56px 이상 유지한다.

### Don't ❌
- `{colors.primary}`를 배경 fill이나 장식에 사용하지 않는다. 구조적 강조 컬러가 두 개 이상 생기면 안 된다.
- 악센트 컬러(coral, mint, yellow 등)를 CTA나 텍스트에 사용하지 않는다 — 장식 전용이다.
- 인풋 필드에 `{rounded.full}` pill을 적용하지 않는다 — 인풋은 항상 `{rounded.md}` 이하.
- 하드 드롭섀도(`box-shadow: 0 8px 16px rgba(0,0,0,0.3)`)를 쓰지 않는다. 그림자는 항상 다단 레이어, 낮은 opacity.
- 본문 텍스트에 weight 700+ 쓰지 않는다 — 굵은 체는 헤드라인 전용.
- 순백(#FFFFFF)을 페이지 배경으로 쓰지 않는다 — 항상 따뜻한 `{colors.canvas}` (#FAFAF9).
- `{colors.secondary}` (#EC4899, Pink)를 구조적 강조 컬러로 반복 사용하지 않는다 — 게임 포인트 이펙트에만 쓴다.
- 시맨틱 컬러(success, danger, warning)를 게임 피드백 외 일반 UI에 장식으로 사용하지 않는다.
