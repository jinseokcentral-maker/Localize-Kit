# LocalizeKit - Login Page

## 📋 페이지 개요

**URL**: `/login`  
**목적**: 사용자 인증 (Pro/Team 기능 사용을 위한 로그인)  
**인증 방식**:
1. Google OAuth
2. Passwordless (Magic Link)

---

## 📐 페이지 레이아웃

### 옵션 A: 중앙 카드 (권장)

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                  │
│ 🌐 LocalizeKit                                          [← Back] │
│                                                                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│                                                                  │
│                                                                  │
│              ┌─────────────────────────────────┐                │
│              │                                 │                │
│              │      🌐 LocalizeKit             │                │
│              │                                 │                │
│              │      Welcome back               │                │
│              │      Sign in to your account    │                │
│              │                                 │                │
│              │  ┌─────────────────────────┐   │                │
│              │  │  🔵 Continue with Google │   │                │
│              │  └─────────────────────────┘   │                │
│              │                                 │                │
│              │  ──────── or ────────          │                │
│              │                                 │                │
│              │  Email                          │                │
│              │  ┌─────────────────────────┐   │                │
│              │  │ you@example.com         │   │                │
│              │  └─────────────────────────┘   │                │
│              │                                 │                │
│              │  ┌─────────────────────────┐   │                │
│              │  │   Send Magic Link       │   │                │
│              │  └─────────────────────────┘   │                │
│              │                                 │                │
│              │  Don't have an account?        │                │
│              │  Sign up for free →            │                │
│              │                                 │                │
│              └─────────────────────────────────┘                │
│                                                                  │
│                                                                  │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 옵션 B: 좌우 분할 (브랜딩 강조)

```
┌─────────────────────────────────────────────────────────────────┐
│                              │                                   │
│                              │                                   │
│     ┌─────────────────┐     │       Welcome back                │
│     │                 │     │       Sign in to continue         │
│     │   LocalizeKit   │     │                                   │
│     │                 │     │   ┌─────────────────────────┐    │
│     │   Transform     │     │   │ 🔵 Continue with Google │    │
│     │   your i18n     │     │   └─────────────────────────┘    │
│     │   workflow      │     │                                   │
│     │                 │     │   ──────── or ────────           │
│     └─────────────────┘     │                                   │
│                              │   Email                          │
│     "Best tool for          │   ┌─────────────────────────┐    │
│      managing               │   │ you@example.com         │    │
│      translations"          │   └─────────────────────────┘    │
│      - Happy User           │                                   │
│                              │   ┌─────────────────────────┐    │
│                              │   │   Send Magic Link       │    │
│                              │   └─────────────────────────┘    │
│                              │                                   │
│                              │   New here? Sign up free →       │
│                              │                                   │
└──────────────────────────────┴───────────────────────────────────┘
```

---

## 📐 상세 레이아웃 (옵션 A - 중앙 카드)

### 전체 구조

```
┌─────────────────────────────────────────────────────────────────┐
│  HEADER (미니멀)                                                 │
│  Logo                                              [← Back]     │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│                    LOGIN CARD (중앙)                             │
│                                                                  │
├─────────────────────────────────────────────────────────────────┤
│  FOOTER (미니멀)                                                 │
│  © 2024 LocalizeKit     Terms · Privacy                         │
└─────────────────────────────────────────────────────────────────┘
```

---

## 1️⃣ HEADER (미니멀)

```
┌─────────────────────────────────────────────────────────────────┐
│  🌐 LocalizeKit                                    [← Back]     │
└─────────────────────────────────────────────────────────────────┘
```

| 요소 | 값 |
|------|-----|
| 높이 | 64px |
| 로고 | 클릭 시 `/` 이동 |
| Back 버튼 | 이전 페이지 또는 `/` 이동 |
| 배경 | transparent |

---

## 2️⃣ LOGIN CARD

### 구조

```
┌─────────────────────────────────────────┐
│                                         │
│            🌐                           │  ← 로고 아이콘 (40px)
│                                         │
│         Welcome back                    │  ← 타이틀 (24px, bold)
│     Sign in to your account             │  ← 서브타이틀 (muted)
│                                         │
│  ┌───────────────────────────────────┐  │
│  │  🔵  Continue with Google         │  │  ← Google OAuth 버튼
│  └───────────────────────────────────┘  │
│                                         │
│  ─────────────  or  ─────────────      │  ← 구분선
│                                         │
│  Email                                  │  ← 라벨
│  ┌───────────────────────────────────┐  │
│  │  you@example.com                  │  │  ← Input
│  └───────────────────────────────────┘  │
│                                         │
│  ┌───────────────────────────────────┐  │
│  │       Send Magic Link             │  │  ← Primary 버튼
│  └───────────────────────────────────┘  │
│                                         │
│  Don't have an account? Sign up →       │  ← 링크 (같은 페이지)
│                                         │
└─────────────────────────────────────────┘
```

### 스펙

| 요소 | 값 |
|------|-----|
| 카드 너비 | 400px (max) |
| 카드 패딩 | 32px ~ 40px |
| 카드 배경 | `--card` |
| 카드 라운드 | `--radius-xl` (12px) |
| 카드 그림자 | `--shadow-lg` |

### 컴포넌트별 상세

#### 로고 아이콘
```tsx
<div className="flex justify-center mb-6">
  <Globe className="w-10 h-10 text-primary" />
</div>
```

#### 타이틀
```tsx
<div className="text-center mb-6">
  <h1 className="text-2xl font-bold mb-2">Welcome back</h1>
  <p className="text-muted-foreground">Sign in to your account</p>
</div>
```

#### Google OAuth 버튼
```tsx
<Button 
  variant="outline" 
  className="w-full h-11 gap-3"
  onClick={handleGoogleLogin}
>
  <GoogleIcon className="w-5 h-5" />
  Continue with Google
</Button>
```

#### 구분선 (Divider)
```tsx
<div className="relative my-6">
  <div className="absolute inset-0 flex items-center">
    <span className="w-full border-t border-border" />
  </div>
  <div className="relative flex justify-center text-xs uppercase">
    <span className="bg-card px-2 text-muted-foreground">or</span>
  </div>
</div>
```

#### Magic Link Form
```tsx
<form onSubmit={handleMagicLink}>
  <div className="space-y-4">
    <div className="space-y-2">
      <Label htmlFor="email">Email</Label>
      <Input 
        id="email"
        type="email"
        placeholder="you@example.com"
        required
      />
    </div>
    <Button type="submit" className="w-full h-11">
      Send Magic Link
    </Button>
  </div>
</form>
```

#### 하단 링크
```tsx
<p className="text-center text-sm text-muted-foreground mt-6">
  Don't have an account?{' '}
  <Link href="/signup" className="text-primary hover:underline">
    Sign up for free
  </Link>
</p>
```

---

## 3️⃣ MAGIC LINK 전송 후 상태

### 이메일 전송 완료 화면

```
┌─────────────────────────────────────────┐
│                                         │
│              ✉️                         │  ← 이메일 아이콘
│                                         │
│         Check your email                │
│                                         │
│   We've sent a magic link to            │
│   you@example.com                       │
│                                         │
│   Click the link in the email to        │
│   sign in to your account.              │
│                                         │
│  ┌───────────────────────────────────┐  │
│  │       Resend email                │  │  ← 재전송 버튼 (outline)
│  └───────────────────────────────────┘  │
│                                         │
│  ← Back to login                        │  ← 뒤로가기 링크
│                                         │
└─────────────────────────────────────────┘
```

---

## 4️⃣ FOOTER (미니멀)

```
┌─────────────────────────────────────────────────────────────────┐
│              © 2024 LocalizeKit · Terms · Privacy               │
└─────────────────────────────────────────────────────────────────┘
```

| 요소 | 값 |
|------|-----|
| 위치 | 화면 하단 고정 또는 카드 아래 |
| 텍스트 | `text-sm text-muted-foreground` |
| 링크 | Terms, Privacy |

---

## 📱 반응형

### Desktop (≥768px)
- 카드 중앙 배치
- 카드 너비 400px

### Mobile (<768px)
- 카드 전체 너비
- 패딩 줄임 (24px)
- 풀스크린 느낌

```
┌─────────────────────┐
│ Logo        [Back]  │
├─────────────────────┤
│                     │
│    Welcome back     │
│                     │
│ [Continue w/ Google]│
│                     │
│ ────── or ──────── │
│                     │
│ Email               │
│ [________________]  │
│                     │
│ [Send Magic Link  ] │
│                     │
│ Sign up →           │
│                     │
├─────────────────────┤
│ © 2024 · Terms      │
└─────────────────────┘
```

---

## 🔄 페이지 상태 (States)

| 상태 | 화면 |
|------|------|
| **기본** | 로그인 폼 |
| **로딩** | Google 로그인 중 / Magic Link 전송 중 |
| **성공** | Magic Link 전송 완료 (이메일 확인 안내) |
| **에러** | 에러 메시지 표시 (toast 또는 inline) |

---

## 🎨 Figma Make Prompt

```
Design a login page for "LocalizeKit":

LAYOUT: Centered card on dark background

HEADER (minimal):
- Logo "LocalizeKit" on left
- "← Back" button on right
- Transparent background

LOGIN CARD (center, 400px width):
- Globe icon at top (purple)
- Title: "Welcome back" (24px, bold)
- Subtitle: "Sign in to your account" (gray)

- Google OAuth button (outline, full width):
  "Continue with Google" with Google icon

- Divider: "or" with lines on each side

- Email input with label
- "Send Magic Link" button (purple, full width)

- Bottom text: "Don't have an account? Sign up →"

FOOTER (minimal):
- "© 2024 LocalizeKit · Terms · Privacy"
- Centered, small text

STYLE:
- Dark theme (#1a1a1a background)
- Card: slightly lighter background (#262626)
- Primary: purple (#7c3aed)
- Clean, minimal, modern
```

---

## ✅ 체크리스트

### 컴포넌트
- [ ] `LoginPage` - 페이지 컴포넌트
- [ ] `LoginCard` - 로그인 카드
- [ ] `GoogleButton` - Google OAuth 버튼
- [ ] `MagicLinkForm` - 이메일 폼
- [ ] `EmailSentView` - 이메일 전송 완료 화면

### 기능
- [ ] Google OAuth (Supabase Auth)
- [ ] Magic Link (Supabase Auth)
- [ ] 로딩 상태
- [ ] 에러 처리
- [ ] 리다이렉트 (로그인 후)

### Supabase 연동
```typescript
// Google OAuth
const { data, error } = await supabase.auth.signInWithOAuth({
  provider: 'google',
  options: {
    redirectTo: `${window.location.origin}/auth/callback`
  }
})

// Magic Link
const { data, error } = await supabase.auth.signInWithOtp({
  email: email,
  options: {
    emailRedirectTo: `${window.location.origin}/auth/callback`
  }
})
```

---

## 📁 라우팅 구조

```
/                  → Landing Page
/app               → Converter App
/login             → Login Page ← NEW
/auth/callback     → OAuth/Magic Link 콜백 처리
/dashboard         → (나중에) Pro 대시보드
```

