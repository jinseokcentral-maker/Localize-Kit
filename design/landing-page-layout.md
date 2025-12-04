# LocalizeKit Landing Page Layout

## 📋 Figma Make Prompt 용 레이아웃 명세서

---

## 🎨 디자인 가이드라인

### 테마

- **기본**: 다크 모드
- **Primary Color**: Purple/Violet (`oklch(0.62 0.19 259.76)` / `#7c3aed`)
- **Background**: 거의 검정 (`oklch(0.20 0 0)` / `#1a1a1a`)
- **Font**: Geist Sans, JetBrains Mono (코드)

### 스타일 참고

- quicktype.io 스타일
- 미니멀, 개발자 친화적
- 에디터 중심 레이아웃

---

## 📐 레이아웃 구조

```
┌─────────────────────────────────────────────────────────────────┐
│                        HEADER (NAV)                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│                        HERO SECTION                              │
│                  (Title + Subtitle + CTAs)                       │
│                                                                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────────────────┐     ┌─────────────────────────────┐   │
│  │                     │     │                             │   │
│  │    CSV INPUT        │     │      JSON OUTPUT            │   │
│  │    EDITOR           │  →  │      PREVIEW                │   │
│  │                     │     │                             │   │
│  │                     │     │                             │   │
│  └─────────────────────┘     └─────────────────────────────┘   │
│                                                                  │
│            [Options Bar: Output Format, Nested Keys]             │
│                                                                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│                     FEATURES SECTION                             │
│                                                                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│                      CTA SECTION                                 │
│                                                                  │
├─────────────────────────────────────────────────────────────────┤
│                        FOOTER                                    │
└─────────────────────────────────────────────────────────────────┘
```

---

## 1️⃣ HEADER (Navigation)

### 구조

```
[Logo]                                    [GitHub] [Docs] [Login]
```

### 스펙

| 요소           | 설명                               |
| -------------- | ---------------------------------- |
| **높이**       | 64px                               |
| **배경**       | transparent 또는 `--background`    |
| **로고**       | "LocalizeKit" 텍스트 로고 + 아이콘 |
| **네비게이션** | GitHub 아이콘, Docs, Login 버튼    |
| **Login 버튼** | Primary 색상, rounded              |

### Figma Make Prompt

```
Create a minimal dark navigation bar with:
- Left: Logo text "LocalizeKit" with a globe/translate icon in purple
- Right: GitHub icon link, "Docs" text link, "Login" button (purple, rounded)
- Height: 64px
- Transparent background
- Sticky position
```

---

## 2️⃣ HERO SECTION

### 구조

```
            Instantly convert CSV to i18n JSON.

    Transform your spreadsheet translations into ready-to-use
       JSON, YAML, or i18n resource files in seconds.

        [Try it Now ↓]    [View on GitHub]
```

### 스펙

| 요소           | 설명                              |
| -------------- | --------------------------------- |
| **패딩**       | top: 80px, bottom: 48px           |
| **타이틀**     | 48-60px, Bold, White              |
| **서브타이틀** | 18-20px, Muted foreground         |
| **CTA 버튼**   | Primary(보라), Secondary(outline) |

### Figma Make Prompt

```
Create a hero section with:
- Large heading: "Instantly convert CSV to i18n JSON." (48px, bold, white)
- Subtitle: "Transform your spreadsheet translations into ready-to-use JSON, YAML, or i18n resource files in seconds." (18px, gray, centered)
- Two buttons centered:
  1. "Try it Now ↓" - purple filled button
  2. "View on GitHub" - outline/ghost button
- Dark background
- Generous padding (80px top, 48px bottom)
- Text centered
```

---

## 3️⃣ EDITOR SECTION (핵심!)

### 구조

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                  │
│  ┌─────────────────────────┐   ┌─────────────────────────────┐  │
│  │ CSV Input    [⬆ Upload] │   │ [EN] [KO] [JA] [+2 more ▼]  │  │
│  ├─────────────────────────┤   ├─────────────────────────────┤  │
│  │ key,en,ko,ja            │   │ // en.json                  │  │
│  │ hello,Hello,안녕,こんにちは │   │ {                           │  │
│  │ goodbye,Bye,안녕히,さよなら │   │   "hello": "Hello",         │  │
│  │ welcome,Welcome,환영,ようこそ│   │   "goodbye": "Bye",         │  │
│  │ thank_you,Thanks,감사,ありがとう│   │   "welcome": "Welcome",     │  │
│  │                         │   │   "thank_you": "Thanks"     │  │
│  │                         │   │ }                           │  │
│  │                         │   │                             │  │
│  └─────────────────────────┘   └─────────────────────────────┘  │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │ Output: [JSON ▼]  [x] Nested Keys                          ││
│  │                          [📋 Copy] [⬇ Download] [⬇ Download All] ││
│  └─────────────────────────────────────────────────────────────┘│
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 핵심: 언어별 탭 시스템

```
┌─────────────────────────────────────────────────────────────────┐
│  OUTPUT PANEL HEADER                                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌────┐ ┌────┐ ┌────┐ ┌────┐ ┌─────────┐                       │
│  │ EN │ │ KO │ │ JA │ │ FR │ │ +2 more▼│  ← 탭 (스크롤 가능)   │
│  └────┘ └────┘ └────┘ └────┘ └─────────┘                       │
│   ▲                                                              │
│   └── 선택된 탭 (하이라이트)                                      │
│                                                                  │
├─────────────────────────────────────────────────────────────────┤
│  // en.json                      ← 파일명 표시                   │
│  {                                                               │
│    "hello": "Hello",                                             │
│    "goodbye": "Goodbye",                                         │
│    "welcome": "Welcome"                                          │
│  }                                                               │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 탭 동작

| 상태           | 설명                                |
| -------------- | ----------------------------------- |
| **기본**       | 첫 번째 언어(EN) 선택됨             |
| **탭 클릭**    | 해당 언어 JSON으로 전환             |
| **탭 많을 때** | 가로 스크롤 또는 "+N more" 드롭다운 |
| **선택된 탭**  | Primary 색상 하이라이트 + 하단 바   |

### 스펙

#### 컨테이너

| 요소          | 설명                 |
| ------------- | -------------------- |
| **최대 너비** | 1200px               |
| **패딩**      | 24-32px              |
| **배경**      | 카드 배경 (`--card`) |
| **라운드**    | 12-16px              |
| **그림자**    | `--shadow-lg`        |

#### 에디터 패널 (좌우)

| 요소          | 설명                         |
| ------------- | ---------------------------- |
| **비율**      | 1:1 (50% / 50%)              |
| **최소 높이** | 400px                        |
| **헤더**      | 탭 스타일, 드롭다운          |
| **본문**      | 모노스페이스 폰트, 라인 넘버 |
| **배경**      | 더 어두운 색상 (`--muted`)   |

#### 옵션 바

| 요소            | 설명                          |
| --------------- | ----------------------------- |
| **Output 선택** | Dropdown (JSON, YAML, i18n)   |
| **체크박스**    | Nested Keys, TypeScript types |
| **버튼**        | Copy, Download                |

### Figma Make Prompt

```
Create a split-screen code editor interface for CSV to i18n JSON conversion:

LEFT PANEL (CSV Input):
- Header: "CSV Input" label + "Upload" button on right
- Code editor area with monospace font
- Sample CSV: "key,en,ko,ja" with 4-5 translation rows
- Dark background (#1e1e1e)

RIGHT PANEL (JSON Output) - WITH LANGUAGE TABS:
- Header: Language tabs [EN] [KO] [JA] - horizontally scrollable
- Selected tab is highlighted with primary color (purple)
- Shows "// en.json" filename comment at top
- Code editor showing ONLY selected language's JSON:
  {
    "hello": "Hello",
    "goodbye": "Goodbye",
    "welcome": "Welcome"
  }
- Syntax highlighting (keys in purple, strings in green)
- Dark background

TAB BEHAVIOR:
- Tabs are horizontally scrollable when many languages
- Selected tab has purple underline/background
- Each tab shows language code (EN, KO, JA, FR, etc.)
- If too many tabs, show "+N more" dropdown

OPTIONS BAR (below editors):
- Left: Dropdown "Output: JSON", Checkbox "Nested Keys"
- Right: "Copy" button, "Download" button, "Download All" button

Make it dark theme, minimal, developer-focused.
```

---

## 4️⃣ FEATURES SECTION

### 구조

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                  │
│                   Why LocalizeKit?                               │
│                                                                  │
│   ┌─────────────┐  ┌─────────────┐  ┌─────────────┐            │
│   │ 🚀          │  │ 📁          │  │ 🔄          │            │
│   │ Instant     │  │ Multiple    │  │ Real-time   │            │
│   │ Convert     │  │ Formats     │  │ API         │            │
│   │             │  │             │  │ (Pro)       │            │
│   │ CSV to JSON │  │ JSON, YAML  │  │ Live sync   │            │
│   │ in seconds  │  │ i18n files  │  │ to your app │            │
│   └─────────────┘  └─────────────┘  └─────────────┘            │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 스펙

| 요소              | 설명                    |
| ----------------- | ----------------------- |
| **배경**          | 약간 다른 색상 (구분용) |
| **카드 개수**     | 3개                     |
| **카드 레이아웃** | 그리드, 균등 분할       |
| **아이콘**        | 32-40px, Primary 색상   |

### Features 내용

| 아이콘 | 타이틀               | 설명                                                        |
| ------ | -------------------- | ----------------------------------------------------------- |
| 🚀     | **Instant Convert**  | Transform CSV/Excel to JSON in seconds. No signup required. |
| 📁     | **Multiple Formats** | Export to JSON, YAML, or framework-specific i18n files.     |
| 🔄     | **Real-time API**    | Deliver translations directly to your app. (Pro)            |
| 🔑     | **Nested Keys**      | Automatically parse dot-notation keys into nested objects.  |
| 📋     | **Code Snippets**    | Get ready-to-use React, Next.js, Vue integration code.      |
| 🌍     | **Any Language**     | Support unlimited languages in your projects.               |

### Figma Make Prompt

```
Create a features section with:
- Section title: "Why LocalizeKit?" (32px, bold, centered)
- 3-column grid of feature cards
- Each card has:
  - Icon (emoji or simple icon) in purple
  - Title (18px, bold)
  - Description (14px, muted gray)
- Cards have subtle borders or backgrounds
- Dark theme consistent with page
```

---

## 5️⃣ CTA SECTION

### 구조

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                  │
│           Need more than just conversion?                        │
│                                                                  │
│     Save your projects, edit in dashboard, and deliver           │
│        translations via API with LocalizeKit Pro.                │
│                                                                  │
│              [Get Started Free]  [View Pricing]                  │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Figma Make Prompt

```
Create a CTA section:
- Heading: "Need more than just conversion?" (28px, bold)
- Subtext explaining Pro features (16px, gray)
- Two buttons: "Get Started Free" (purple filled), "View Pricing" (outline)
- Centered layout
- Slightly different background shade for visual separation
```

---

## 6️⃣ FOOTER

### 구조

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                  │
│  LocalizeKit          Product        Resources      Company     │
│  © 2024              Converter       Docs          About       │
│                      Dashboard       Blog          Contact     │
│                      Pricing         GitHub        Twitter     │
│                      API                                        │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Figma Make Prompt

```
Create a minimal dark footer with:
- Left: Logo and copyright "© 2024 LocalizeKit"
- Right: 3 columns of links (Product, Resources, Company)
- Very subtle, dark background
- Small text (14px)
- Links in muted gray, hover to white
```

---

## 📱 반응형 브레이크포인트

| 브레이크포인트          | 레이아웃 변경                    |
| ----------------------- | -------------------------------- |
| **Desktop (>1024px)**   | 에디터 좌우 분할                 |
| **Tablet (768-1024px)** | 에디터 좌우 분할 유지, 간격 줄임 |
| **Mobile (<768px)**     | 에디터 상하 스택, 탭 전환 방식   |

---

## 🎯 전체 페이지 Figma Make Prompt

```
Design a landing page for "LocalizeKit" - a CSV to i18n JSON converter tool.

STYLE:
- Dark theme (background: #1a1a1a)
- Primary color: Purple/Violet (#7c3aed)
- Clean, minimal, developer-focused like quicktype.io
- Monospace font for code areas

LAYOUT (top to bottom):

1. HEADER:
- Logo "LocalizeKit" with globe icon (purple)
- Navigation: GitHub icon, Docs, Login button

2. HERO:
- Title: "Instantly convert CSV to i18n JSON."
- Subtitle: "Transform spreadsheet translations into JSON, YAML, or i18n files."
- Buttons: "Try it Now ↓" (purple), "View on GitHub" (outline)

3. MAIN EDITOR (most important):
- Split screen: CSV input (left) | JSON output (right)
- LEFT: CSV editor with sample data (key,en,ko,ja columns)
- RIGHT: **Language tabs** [EN] [KO] [JA] at top, scrollable
  - Shows ONE language's JSON at a time (not all languages combined)
  - Example for EN tab: {"hello": "Hello", "goodbye": "Goodbye"}
  - Filename comment "// en.json" at top
- Options bar below: format dropdown, "Nested Keys" checkbox, Copy/Download/Download All buttons

4. FEATURES:
- 3 cards: Instant Convert, Multiple Formats, Real-time API
- Icons, titles, descriptions

5. CTA:
- "Need more?" heading
- Pro features description
- Get Started / Pricing buttons

6. FOOTER:
- Logo, copyright
- Link columns (Product, Resources, Company)

Make it look modern, professional, and focused on the editor experience.
The language tabs in the output panel are the KEY feature - each language gets its own JSON file.
```

---

## ✅ 체크리스트

- [ ] Header/Nav 생성
- [ ] Hero Section 생성
- [ ] Editor Section 생성 (핵심!)
- [ ] Features Section 생성
- [ ] CTA Section 생성
- [ ] Footer 생성
- [ ] 반응형 확인
- [ ] 다크/라이트 모드 확인
