# LocalizeKit - Design Tokens

## 개요

Shadcn Theme Generator 기반 디자인 토큰  
OKLCH 컬러 스페이스 사용 (더 넓은 색 영역, 일관된 밝기)

---

## 1. 컬러 토큰

### Primary (Brand)

| 토큰 | Light | Dark | 설명 |
|------|-------|------|------|
| `--primary` | `oklch(0.62 0.19 259.76)` | 동일 | 퍼플/바이올렛 |
| `--primary-foreground` | `oklch(1.00 0 0)` | 동일 | 흰색 |

**HEX 근사값**: `#7c3aed` (Violet 600)

### Background & Surface

| 토큰 | Light | Dark |
|------|-------|------|
| `--background` | `oklch(1.00 0 0)` 흰색 | `oklch(0.20 0 0)` 거의 검정 |
| `--foreground` | `oklch(0.32 0 0)` 진한 회색 | `oklch(0.92 0 0)` 밝은 회색 |
| `--card` | `oklch(1.00 0 0)` | `oklch(0.27 0 0)` |
| `--popover` | `oklch(1.00 0 0)` | `oklch(0.27 0 0)` |

### Semantic Colors

| 토큰 | 값 | 용도 |
|------|-----|------|
| `--destructive` | `oklch(0.64 0.21 25.39)` | 에러, 삭제 (Red) |
| `--success` | `oklch(0.62 0.17 145)` | 성공 (Green) |
| `--warning` | `oklch(0.75 0.15 85)` | 경고 (Yellow) |
| `--info` | `--primary` | 정보 |

### Chart Colors (그라데이션)

```
--chart-1: oklch(0.62 0.19 259.76)  // 가장 밝음
--chart-2: oklch(0.55 0.22 262.96)
--chart-3: oklch(0.49 0.22 264.43)
--chart-4: oklch(0.42 0.18 265.55)
--chart-5: oklch(0.38 0.14 265.59)  // 가장 어두움
```

---

## 2. 타이포그래피 토큰

### Font Families

| 토큰 | 값 | 용도 |
|------|-----|------|
| `--font-sans` | Geist, system-ui | 본문, UI |
| `--font-serif` | Source Serif 4 | 강조 텍스트 |
| `--font-mono` | JetBrains Mono | 코드, 키 |

### Font Size Scale

| 토큰 | 크기 | px | 용도 |
|------|------|-----|------|
| `--text-xs` | 0.75rem | 12px | 캡션, 배지 |
| `--text-sm` | 0.875rem | 14px | 작은 텍스트, 라벨 |
| `--text-base` | 1rem | 16px | 본문 기본 |
| `--text-lg` | 1.125rem | 18px | 강조 본문 |
| `--text-xl` | 1.25rem | 20px | 서브헤딩 |
| `--text-2xl` | 1.5rem | 24px | 헤딩 H4 |
| `--text-3xl` | 1.875rem | 30px | 헤딩 H3 |
| `--text-4xl` | 2.25rem | 36px | 헤딩 H2 |
| `--text-5xl` | 3rem | 48px | 헤딩 H1 |
| `--text-6xl` | 3.75rem | 60px | 히어로 |

### Font Weight

| 토큰 | 값 | 용도 |
|------|-----|------|
| `--font-normal` | 400 | 본문 |
| `--font-medium` | 500 | 라벨, 버튼 |
| `--font-semibold` | 600 | 강조 |
| `--font-bold` | 700 | 헤딩 |

### Line Height

| 토큰 | 값 | 용도 |
|------|-----|------|
| `--leading-none` | 1 | 헤딩 |
| `--leading-tight` | 1.25 | 짧은 텍스트 |
| `--leading-normal` | 1.5 | 본문 기본 |
| `--leading-relaxed` | 1.625 | 긴 문단 |

---

## 3. 스페이싱 토큰

### Base Unit: 4px

| 토큰 | 값 | px |
|------|-----|-----|
| `--space-1` | 0.25rem | 4px |
| `--space-2` | 0.5rem | 8px |
| `--space-3` | 0.75rem | 12px |
| `--space-4` | 1rem | 16px |
| `--space-5` | 1.25rem | 20px |
| `--space-6` | 1.5rem | 24px |
| `--space-8` | 2rem | 32px |
| `--space-10` | 2.5rem | 40px |
| `--space-12` | 3rem | 48px |
| `--space-16` | 4rem | 64px |
| `--space-20` | 5rem | 80px |
| `--space-24` | 6rem | 96px |

### 용도별 권장값

| 용도 | 토큰 |
|------|------|
| 컴포넌트 내부 패딩 | `--space-2` ~ `--space-4` |
| 카드 패딩 | `--space-4` ~ `--space-6` |
| 섹션 간격 | `--space-8` ~ `--space-16` |
| 페이지 마진 | `--space-4` ~ `--space-8` |

---

## 4. Border Radius 토큰

| 토큰 | 값 | px | 용도 |
|------|-----|-----|------|
| `--radius-sm` | calc(0.375rem - 4px) | 2px | 작은 요소 |
| `--radius-md` | calc(0.375rem - 2px) | 4px | 인풋, 배지 |
| `--radius-lg` | 0.375rem | 6px | 버튼, 카드 |
| `--radius-xl` | calc(0.375rem + 4px) | 10px | 모달, 큰 카드 |
| `--radius-full` | 9999px | - | 원형, 필 |

---

## 5. Shadow 토큰

| 토큰 | 용도 |
|------|------|
| `--shadow-xs` | 미세한 구분선 |
| `--shadow-sm` | 호버 효과 |
| `--shadow` | 카드 기본 |
| `--shadow-md` | 드롭다운 |
| `--shadow-lg` | 모달 |
| `--shadow-xl` | 팝오버 |
| `--shadow-2xl` | 강조 요소 |

---

## 6. Z-Index 토큰

| 토큰 | 값 | 용도 |
|------|-----|------|
| `--z-dropdown` | 1000 | 드롭다운 메뉴 |
| `--z-sticky` | 1020 | 스티키 헤더 |
| `--z-fixed` | 1030 | 고정 요소 |
| `--z-modal-backdrop` | 1040 | 모달 배경 |
| `--z-modal` | 1050 | 모달 |
| `--z-popover` | 1060 | 팝오버 |
| `--z-tooltip` | 1070 | 툴팁 |
| `--z-toast` | 1080 | 토스트 알림 |

---

## 7. Transition 토큰

| 토큰 | 값 | 용도 |
|------|-----|------|
| `--duration-150` | 150ms | 빠른 전환 (호버) |
| `--duration-200` | 200ms | 기본 전환 |
| `--duration-300` | 300ms | 모달, 드로어 |
| `--ease-in-out` | cubic-bezier(0.4, 0, 0.2, 1) | 기본 |
| `--ease-bounce` | cubic-bezier(0.68, -0.55, 0.265, 1.55) | 강조 애니메이션 |

---

## 8. Breakpoints

| 이름 | 값 | 용도 |
|------|-----|------|
| `sm` | 640px | 모바일 가로 |
| `md` | 768px | 태블릿 |
| `lg` | 1024px | 작은 데스크톱 |
| `xl` | 1280px | 데스크톱 |
| `2xl` | 1536px | 큰 화면 |

---

## 파일 위치

```
design/
└── tokens.css    # CSS 변수 정의
```

---

## Tailwind 사용 예시

```tsx
// 컬러 사용
<div className="bg-background text-foreground">
<button className="bg-primary text-primary-foreground">

// 간격 사용
<div className="p-4 gap-2">

// 라운드 사용
<div className="rounded-lg">

// 그림자 사용
<div className="shadow-md">
```


