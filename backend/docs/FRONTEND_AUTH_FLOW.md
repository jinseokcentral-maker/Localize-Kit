# 프론트엔드 인증 플로우 가이드

## 개요

현재 백엔드 API는 두 가지 인증 시나리오를 지원합니다:

1. **일반 로그인**: 개인 팀으로 로그인
2. **팀 프로젝트 링크 로그인**: 특정 팀으로 바로 로그인

## API 엔드포인트

### 1. 로그인 (팀 선택 가능)

```typescript
POST /auth/login
Body: {
  accessToken: string,  // Google OAuth access token
  teamId?: string       // Optional: 특정 팀으로 로그인하려면 전달
}
Response: {
  data: {
    accessToken: string,
    refreshToken: string
  }
}
```

### 2. 팀 전환 (이미 로그인된 경우)

```typescript
POST /auth/switch-team
Headers: { Authorization: "Bearer <accessToken>" }
Body: {
  teamId: string
}
Response: {
  data: {
    accessToken: string,
    refreshToken: string
  }
}
```

## 프론트엔드 구현 시나리오

### 시나리오 1: 일반 로그인

**플로우:**
```
사용자 → 로그인 버튼 클릭 → Google OAuth → 로그인 API 호출 (teamId 없음) → 개인 팀으로 토큰 받음
```

**구현 예시:**
```typescript
// 로그인 함수
async function handleLogin(googleAccessToken: string) {
  const response = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      accessToken: googleAccessToken,
      // teamId 없음 → 개인 팀으로 로그인
    }),
  });
  
  const { data } = await response.json();
  // 토큰 저장
  localStorage.setItem('accessToken', data.accessToken);
  localStorage.setItem('refreshToken', data.refreshToken);
  
  // 대시보드로 이동
  router.push('/dashboard');
}
```

### 시나리오 2: 팀 프로젝트 링크로 접근 (로그인 안됨)

**플로우:**
```
사용자 → 팀 프로젝트 링크 클릭 (/projects/team-123/project-456)
  → 로그인 체크 → 로그인 안됨
  → 로그인 화면으로 리다이렉트 (/login?teamId=team-123&redirect=/projects/team-123/project-456)
  → 로그인 완료 → teamId와 함께 로그인 API 호출
  → 해당 팀으로 토큰 받음 → 원래 가려던 페이지로 이동
```

**구현 예시:**

#### 1. 라우트 가드 (로그인 체크)

```typescript
// middleware/auth.ts 또는 route guard
export function requireAuth(to: Route, from: Route, next: Function) {
  const accessToken = localStorage.getItem('accessToken');
  
  if (!accessToken) {
    // 로그인 안됨 → 로그인 페이지로 리다이렉트
    // 현재 경로와 teamId를 쿼리 파라미터로 전달
    const teamId = extractTeamIdFromRoute(to.path); // 예: /projects/team-123/... → team-123
    const redirectPath = to.fullPath;
    
    next({
      path: '/login',
      query: {
        teamId: teamId || undefined,
        redirect: redirectPath,
      },
    });
    return;
  }
  
  next();
}

// 팀 ID 추출 헬퍼
function extractTeamIdFromRoute(path: string): string | null {
  // 예: /projects/team-123/project-456 → team-123
  const match = path.match(/\/projects\/team-([^/]+)/);
  return match ? match[1] : null;
}
```

#### 2. 로그인 페이지

```typescript
// pages/login.tsx 또는 components/LoginForm.tsx
export function LoginPage() {
  const router = useRouter();
  const { teamId, redirect } = router.query;
  
  async function handleLogin(googleAccessToken: string) {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accessToken: googleAccessToken,
          teamId: teamId || undefined, // 쿼리에서 받은 teamId 전달
        }),
      });
      
      if (!response.ok) {
        // teamId가 잘못되었거나 멤버가 아닌 경우
        if (response.status === 403) {
          alert('해당 팀의 멤버가 아닙니다.');
          // teamId 없이 개인 팀으로 로그인 시도
          return handleLoginWithoutTeam(googleAccessToken);
        }
        throw new Error('Login failed');
      }
      
      const { data } = await response.json();
      
      // 토큰 저장
      localStorage.setItem('accessToken', data.accessToken);
      localStorage.setItem('refreshToken', data.refreshToken);
      
      // 원래 가려던 페이지로 이동 (또는 대시보드)
      const targetPath = typeof redirect === 'string' ? redirect : '/dashboard';
      router.push(targetPath);
      
    } catch (error) {
      console.error('Login error:', error);
      alert('로그인에 실패했습니다.');
    }
  }
  
  // teamId 없이 개인 팀으로 로그인
  async function handleLoginWithoutTeam(googleAccessToken: string) {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        accessToken: googleAccessToken,
        // teamId 없음
      }),
    });
    
    const { data } = await response.json();
    localStorage.setItem('accessToken', data.accessToken);
    localStorage.setItem('refreshToken', data.refreshToken);
    router.push('/dashboard');
  }
  
  return (
    <div>
      <h1>로그인</h1>
      {teamId && (
        <p>팀 프로젝트에 접근하기 위해 로그인이 필요합니다.</p>
      )}
      <GoogleLoginButton onSuccess={handleLogin} />
    </div>
  );
}
```

### 시나리오 3: 이미 로그인된 상태에서 팀 전환

**플로우:**
```
사용자 → 이미 로그인됨 (개인 팀) → 팀 선택 드롭다운에서 다른 팀 선택
  → switch-team API 호출 → 새 토큰 받음 → 페이지 새로고침 또는 상태 업데이트
```

**구현 예시:**

```typescript
// components/TeamSelector.tsx
export function TeamSelector({ teams, currentTeamId }: Props) {
  const router = useRouter();
  
  async function handleTeamSwitch(newTeamId: string) {
    try {
      const accessToken = localStorage.getItem('accessToken');
      
      const response = await fetch('/api/auth/switch-team', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          teamId: newTeamId,
        }),
      });
      
      if (!response.ok) {
        if (response.status === 403) {
          alert('해당 팀의 멤버가 아닙니다.');
          return;
        }
        throw new Error('Team switch failed');
      }
      
      const { data } = await response.json();
      
      // 새 토큰 저장
      localStorage.setItem('accessToken', data.accessToken);
      localStorage.setItem('refreshToken', data.refreshToken);
      
      // 페이지 새로고침 또는 상태 업데이트
      router.reload(); // 또는 상태 관리로 업데이트
      
    } catch (error) {
      console.error('Team switch error:', error);
      alert('팀 전환에 실패했습니다.');
    }
  }
  
  return (
    <select 
      value={currentTeamId || ''} 
      onChange={(e) => handleTeamSwitch(e.target.value)}
    >
      <option value="">개인 프로젝트</option>
      {teams.map(team => (
        <option key={team.teamId} value={team.teamId}>
          {team.teamName}
        </option>
      ))}
    </select>
  );
}
```

## URL 구조 제안

### 팀 프로젝트 URL 패턴

```
/projects/team-{teamId}/project-{projectId}
/projects/team-{teamId}  (팀의 모든 프로젝트)
```

**예시:**
- `/projects/team-abc123/project-xyz789` → 특정 팀의 특정 프로젝트
- `/projects/team-abc123` → 특정 팀의 프로젝트 목록
- `/projects` → 현재 활성 팀의 프로젝트 (JWT의 teamId 사용)

### 로그인 리다이렉트 URL 패턴

```
/login?teamId={teamId}&redirect={encodedPath}
```

**예시:**
- `/login?teamId=abc123&redirect=%2Fprojects%2Fteam-abc123%2Fproject-xyz789`
- `/login?redirect=%2Fdashboard` (일반 로그인)

## 에러 처리

### 1. 팀 멤버가 아닌 경우 (403 Forbidden)

```typescript
if (response.status === 403) {
  // teamId 없이 개인 팀으로 로그인 시도
  // 또는 에러 메시지 표시 후 개인 대시보드로 이동
}
```

### 2. 토큰 만료

```typescript
// API 요청 시 401 에러 발생
if (response.status === 401) {
  // refresh token으로 토큰 갱신 시도
  const refreshed = await refreshAccessToken();
  if (refreshed) {
    // 원래 요청 재시도
    return retryOriginalRequest();
  } else {
    // 로그인 페이지로 리다이렉트
    router.push('/login');
  }
}
```

## 보안 고려사항

1. **토큰 저장**: `localStorage` 또는 `httpOnly` 쿠키 사용
2. **HTTPS 필수**: 프로덕션에서는 반드시 HTTPS 사용
3. **토큰 만료 처리**: 자동 refresh 로직 구현
4. **팀 ID 검증**: 백엔드에서 항상 멤버십 검증 (이미 구현됨)

## 요약

1. **일반 로그인**: `teamId` 없이 `/auth/login` 호출
2. **팀 링크 로그인**: URL에서 `teamId` 추출 → 로그인 시 전달
3. **팀 전환**: 이미 로그인된 경우 `/auth/switch-team` 사용
4. **에러 처리**: 403 에러 시 개인 팀으로 폴백 또는 에러 표시

