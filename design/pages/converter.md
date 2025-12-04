# LocalizeKit - Converter App Page

## 📋 페이지 개요

**URL**: `/app` 또는 `app.localizekit.com`  
**참고**: [app.quicktype.io](https://app.quicktype.io/?l=ts)  
**목적**: CSV → i18n JSON 변환 전용 앱 (에디터 풀스크린)  
**특징**: 미니멀 헤더, 에디터가 화면 90% 차지

---

## 📐 페이지 레이아웃 (app.quicktype.io 스타일)

**특징**: 에디터가 화면 전체를 차지, 헤더 미니멀

```
┌─────────────────────────────────────────────────────────────────┐
│ 🌐 LocalizeKit    [JSON▼] [☑Nested]      [GitHub] [Pro] [Login] │  ← 미니 헤더 (48px)
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────────────────────┐ │ ┌─────────────────────────────┐  │
│  │ CSV Input    [⬆Upload]  │ │ │ [EN] [KO] [JA] [FR] [Copy]  │  │
│  ├─────────────────────────┤ │ ├─────────────────────────────┤  │
│  │ 1│ key,en,ko,ja         │ │ │ // en.json                  │  │
│  │ 2│ hello,Hello,안녕,...  │ │ │ {                           │  │
│  │ 3│ goodbye,Bye,안녕히,...│ │ │   "hello": "Hello",         │  │
│  │ 4│ welcome,Welcome,...  │ │ │   "goodbye": "Bye",         │  │
│  │ 5│                      │ │ │   "welcome": "Welcome"      │  │
│  │ 6│                      │ │ │ }                           │  │
│  │  │                      │ │ │                             │  │
│  │  │                      │ │ │                             │  │
│  │  │                      │ │ │                             │  │
│  │  │  [Drop CSV here]     │ │ │                             │  │
│  │  │                      │ │ │                             │  │
│  └─────────────────────────┘ │ └─────────────────────────────┘  │
│                              │                                   │
├──────────────────────────────┴───────────────────────────────────┤
│  💡 Save projects & get API access         [⬇ Download All] [Pro]│  ← 미니 풋터/CTA (40px)
└─────────────────────────────────────────────────────────────────┘
```

### 핵심 차이점 (vs Landing Page)

| 요소 | Landing Page | Converter App |
|------|--------------|---------------|
| 헤더 높이 | 64px | **48px** (미니멀) |
| Hero | ✅ 있음 | ❌ 없음 |
| Features | ✅ 있음 | ❌ 없음 |
| 에디터 높이 | 400-500px | **calc(100vh - 88px)** 풀스크린 |
| 옵션 위치 | 에디터 아래 | **헤더에 통합** |
| 푸터 | 전체 푸터 | **미니 CTA 바** |

---

## 1️⃣ HEADER

### 구조
```
┌─────────────────────────────────────────────────────────────────┐
│ 🌐 LocalizeKit                          [⭐ GitHub] [Docs] [Login] │
└─────────────────────────────────────────────────────────────────┘
```

### 스펙
| 요소 | 값 |
|------|-----|
| 높이 | 64px |
| 배경 | `--background` (다크) |
| 로고 | 아이콘 + "LocalizeKit" 텍스트 |
| 네비게이션 | GitHub (별 아이콘), Docs, Login 버튼 |

### 컴포넌트
```tsx
<header className="h-16 flex items-center justify-between px-6 border-b border-border">
  <Logo />
  <nav className="flex items-center gap-4">
    <GitHubButton />
    <Link href="/docs">Docs</Link>
    <Button variant="default">Login</Button>
  </nav>
</header>
```

---

## 2️⃣ HERO (미니)

### 구조
```
┌─────────────────────────────────────────────────────────────────┐
│                                                                  │
│              CSV to i18n JSON Converter                         │
│     Transform your spreadsheet translations into                 │
│          ready-to-use JSON files instantly.                     │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 스펙
| 요소 | 값 |
|------|-----|
| 패딩 | `py-8` ~ `py-12` |
| 타이틀 | `text-3xl` / `font-bold` |
| 서브타이틀 | `text-muted-foreground` / `text-lg` |
| 정렬 | 중앙 |

### 컴포넌트
```tsx
<section className="text-center py-10">
  <h1 className="text-3xl font-bold mb-2">
    CSV to i18n JSON Converter
  </h1>
  <p className="text-muted-foreground text-lg">
    Transform your spreadsheet translations into ready-to-use JSON files instantly.
  </p>
</section>
```

---

## 3️⃣ EDITOR SECTION (핵심!)

### 전체 구조
```
┌─────────────────────────────────────────────────────────────────┐
│  EDITOR CONTAINER                                                │
│                                                                  │
│  ┌─────────────────────┐   ┌─────────────────────────────────┐  │
│  │   CSV INPUT PANEL   │   │      JSON OUTPUT PANEL          │  │
│  └─────────────────────┘   └─────────────────────────────────┘  │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │                    OPTIONS BAR                               ││
│  └─────────────────────────────────────────────────────────────┘│
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 3-A. CSV INPUT PANEL

```
┌─────────────────────────────────────────────────────────────────┐
│  CSV Input                                    [⬆ Upload CSV]    │
├─────────────────────────────────────────────────────────────────┤
│  1 │ key,en,ko,ja                                               │
│  2 │ hello,Hello,안녕하세요,こんにちは                             │
│  3 │ goodbye,Goodbye,안녕히 가세요,さようなら                       │
│  4 │ welcome,Welcome,환영합니다,ようこそ                           │
│  5 │ thank_you,Thank you,감사합니다,ありがとう                     │
│  6 │                                                            │
│  7 │                                                            │
│    │                                                            │
│    │  [Drag & drop CSV file here or click to upload]           │
│    │                                                            │
└─────────────────────────────────────────────────────────────────┘
```

#### 스펙
| 요소 | 값 |
|------|-----|
| 너비 | 50% (flex-1) |
| 최소 높이 | 400px |
| 배경 | `--card` 또는 더 어두운 색 |
| 폰트 | `--font-mono` (JetBrains Mono) |
| 라인 넘버 | 좌측, `text-muted-foreground` |
| 헤더 높이 | 48px |

#### 기능
- [ ] 텍스트 직접 입력
- [ ] 파일 드래그 & 드롭
- [ ] "Upload CSV" 버튼 클릭
- [ ] 실시간 파싱 (입력 시 즉시 변환)

---

### 3-B. JSON OUTPUT PANEL

```
┌─────────────────────────────────────────────────────────────────┐
│  [EN] [KO] [JA]                                    [📋 Copy]    │
├─────────────────────────────────────────────────────────────────┤
│  // en.json                                                     │
│  {                                                              │
│    "hello": "Hello",                                            │
│    "goodbye": "Goodbye",                                        │
│    "welcome": "Welcome",                                        │
│    "thank_you": "Thank you"                                     │
│  }                                                              │
│                                                                 │
│                                                                 │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

#### 언어 탭 상세
```
┌─────────────────────────────────────────────────────────────────┐
│  ┌────┐ ┌────┐ ┌────┐ ┌────┐                         [📋]      │
│  │ EN │ │ KO │ │ JA │ │ FR │  ← 가로 스크롤 가능               │
│  └────┘ └────┘ └────┘ └────┘                                    │
│    ▲                                                            │
│    └── 선택됨 (보라색 하단 바, 또는 배경 하이라이트)               │
└─────────────────────────────────────────────────────────────────┘
```

#### 탭 스타일
| 상태 | 스타일 |
|------|--------|
| 기본 | `text-muted-foreground`, `bg-transparent` |
| 호버 | `text-foreground`, `bg-muted` |
| 선택됨 | `text-primary`, `border-b-2 border-primary` |

#### JSON 출력 스타일
| 요소 | 값 |
|------|-----|
| 파일명 주석 | `// en.json` - `text-muted-foreground` |
| 키 | `text-primary` (보라색) |
| 문자열 값 | `text-green-400` (녹색) |
| 괄호/콜론 | `text-foreground` |

---

### 3-C. OPTIONS BAR

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                  │
│  Output: [JSON ▼]   [☑ Nested Keys]       [Copy] [Download All] │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

#### 요소별 스펙

| 요소 | 타입 | 옵션 |
|------|------|------|
| Output Format | Dropdown | JSON, YAML, TypeScript |
| Nested Keys | Checkbox | `common.button.submit` → nested |
| Copy | Button (outline) | 현재 탭 JSON 복사 |
| Download All | Button (primary) | 모든 언어 ZIP 다운로드 |

#### 레이아웃
```tsx
<div className="flex items-center justify-between px-4 py-3 border-t border-border">
  {/* Left */}
  <div className="flex items-center gap-4">
    <Select defaultValue="json">
      <SelectTrigger className="w-32">
        <SelectValue placeholder="Output" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="json">JSON</SelectItem>
        <SelectItem value="yaml">YAML</SelectItem>
        <SelectItem value="typescript">TypeScript</SelectItem>
      </SelectContent>
    </Select>
    
    <label className="flex items-center gap-2 text-sm">
      <Checkbox id="nested" />
      <span>Nested Keys</span>
    </label>
  </div>
  
  {/* Right */}
  <div className="flex items-center gap-2">
    <Button variant="outline" size="sm">
      <Copy className="w-4 h-4 mr-2" />
      Copy
    </Button>
    <Button size="sm">
      <Download className="w-4 h-4 mr-2" />
      Download All
    </Button>
  </div>
</div>
```

---

## 4️⃣ PRO BANNER (CTA)

### 구조
```
┌─────────────────────────────────────────────────────────────────┐
│                                                                  │
│  💡 Need to save projects and deliver via API?                  │
│     Get LocalizeKit Pro for real-time translation management.   │
│                                                                  │
│                    [Get Started Free →]                         │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 스펙
| 요소 | 값 |
|------|-----|
| 배경 | `--muted` 또는 gradient |
| 패딩 | `py-8` |
| 텍스트 | 중앙 정렬 |
| 버튼 | Primary, 화살표 아이콘 |

---

## 5️⃣ FOOTER (미니)

### 구조
```
┌─────────────────────────────────────────────────────────────────┐
│  © 2024 LocalizeKit          [GitHub] [Twitter] [Terms] [Privacy] │
└─────────────────────────────────────────────────────────────────┘
```

### 스펙
| 요소 | 값 |
|------|-----|
| 높이 | 48-64px |
| 배경 | `--background` |
| 텍스트 | `text-muted-foreground`, `text-sm` |

---

## 📱 반응형

### Desktop (≥1024px)
- 에디터 좌우 분할 (50/50)
- 옵션 바 가로 배치

### Tablet (768-1023px)
- 에디터 좌우 분할 유지
- 간격 줄임

### Mobile (<768px)
- 에디터 상하 스택
- 탭으로 Input/Output 전환
- 옵션 바 세로 스택

```
┌─────────────────────┐
│  [Input] [Output]   │  ← 탭 전환
├─────────────────────┤
│                     │
│   현재 선택된       │
│   패널 내용         │
│                     │
├─────────────────────┤
│  Options...         │
└─────────────────────┘
```

---

## 🎨 Figma Make Prompt

```
Design a CSV to i18n JSON converter page:

HEADER (64px):
- Logo "LocalizeKit" with globe icon (purple) on left
- GitHub star button, "Docs" link, "Login" button on right
- Dark background

MINI HERO:
- Title: "CSV to i18n JSON Converter" (30px, bold)
- Subtitle: "Transform your spreadsheet translations instantly" (gray)
- Centered, padding 32px vertical

EDITOR (main section):
Split into two panels side by side:

LEFT - CSV Input:
- Header: "CSV Input" + "Upload CSV" button
- Code editor with line numbers
- Sample CSV data with translations
- Placeholder text for drag & drop

RIGHT - JSON Output:
- Language tabs at top: [EN] [KO] [JA] - EN is selected (purple underline)
- Shows "// en.json" comment
- JSON code with syntax highlighting
- Copy button in header

OPTIONS BAR (below editors):
- Left: "Output: JSON" dropdown, "Nested Keys" checkbox
- Right: "Copy" outline button, "Download All" purple button

PRO BANNER:
- Light purple/muted background
- Text: "Need to save projects? Get LocalizeKit Pro"
- "Get Started Free" button

FOOTER:
- Copyright, social links
- Minimal, dark

Dark theme throughout (#1a1a1a background, purple accent #7c3aed)
```

---

## ✅ 구현 체크리스트

### 컴포넌트
- [ ] `Header` - 로고, 네비게이션
- [ ] `MiniHero` - 타이틀, 서브타이틀
- [ ] `EditorContainer` - 전체 에디터 래퍼
- [ ] `CsvInputPanel` - CSV 입력 에디터
- [ ] `JsonOutputPanel` - JSON 출력 + 탭
- [ ] `LanguageTabs` - 언어 탭 컴포넌트
- [ ] `OptionsBar` - 옵션 바
- [ ] `ProBanner` - CTA 배너
- [ ] `Footer` - 푸터

### 기능
- [ ] CSV 파싱 (Papa Parse)
- [ ] JSON 생성 (언어별 분리)
- [ ] Nested Keys 변환
- [ ] 클립보드 복사
- [ ] ZIP 다운로드 (JSZip)
- [ ] 파일 업로드
- [ ] 드래그 & 드롭

### 라이브러리
```bash
npm install papaparse jszip file-saver
npm install @types/papaparse --save-dev
```

