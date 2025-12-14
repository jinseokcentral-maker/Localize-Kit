# 라우팅 아키텍처 제안

## 현재 구조

React Router v7 파일 시스템 라우팅 (`@react-router/fs-routes`) 사용 중

## 제안하는 라우팅 구조

### 옵션 1: 단순한 동적 세그먼트 (추천)

**URL 패턴:**
```
/projects/:teamId                    → 팀의 프로젝트 목록
/projects/:teamId/:projectId         → 특정 팀의 특정 프로젝트
/dashboard                           → 현재 활성 팀의 대시보드 (기존)
/login?teamId=:teamId&redirect=...   → 로그인 (쿼리 파라미터)
```

**파일 구조:**
```
routes/
  _app.tsx                                    → App Layout
  _app.dashboard._index.tsx                   → /dashboard (기존)
  _app.projects.$teamId._index.tsx            → /projects/:teamId
  _app.projects.$teamId.$projectId.tsx        → /projects/:teamId/:projectId
  
  _auth.tsx                                   → Auth Layout
  _auth.login._index.tsx                      → /login (기존, 쿼리 파라미터로 teamId 처리)
```

**장점:**
- React Router v7 표준 방식
- URL이 간단하고 깔끔함
- 파일 시스템 라우팅과 잘 맞음

**단점:**
- "team-" 접두사가 URL에 없음 (하지만 실제로 필요하지 않을 수 있음)

---

### 옵션 2: 커스텀 경로 매칭 (고급)

URL에 "team-" 접두사를 포함하고 싶다면, 라우트 매처를 사용할 수 있습니다.

**파일 구조:**
```
routes/
  _app.projects.tsx                           → /projects 레이아웃
  _app.projects.team-$teamId._index.tsx       → /projects/team-:teamId
  _app.projects.team-$teamId.project-$projectId.tsx → /projects/team-:teamId/project-:projectId
```

하지만 React Router v7의 flat routes에서는 경로 매칭이 제한적일 수 있으므로, **옵션 1을 추천**합니다.

---

## 구현 전략

### 1. 라우트 가드 (인증 체크)

모든 보호된 라우트에 인증 체크를 추가합니다.

```typescript
// routes/_app.projects.$teamId._index.tsx
import { useEffect } from "react";
import { useNavigate, useParams } from "react-router";
import { useTokenStore } from "~/stores/tokenStore";

export default function TeamProjectsRoute() {
  const { teamId } = useParams();
  const navigate = useNavigate();
  const accessToken = useTokenStore((state) => state.accessToken);

  useEffect(() => {
    if (!accessToken) {
      // 로그인 안됨 → 로그인 페이지로 리다이렉트
      navigate(`/login?teamId=${teamId}&redirect=${encodeURIComponent(location.pathname)}`);
    }
  }, [accessToken, teamId, navigate]);

  // 로딩 중 표시
  if (!accessToken) {
    return <div>Redirecting to login...</div>;
  }

  // 실제 컴포넌트 렌더링
  return <TeamProjectsPage teamId={teamId!} />;
}
```

또는 라우트 레벨에서 처리:

```typescript
// routes/_app.projects.$teamId._index.tsx
import { redirect } from "react-router";
import { useTokenStore } from "~/stores/tokenStore";

export async function loader({ params, request }: Route.LoaderArgs) {
  const accessToken = useTokenStore.getState().accessToken;
  const { teamId } = params;
  
  if (!accessToken) {
    const url = new URL(request.url);
    throw redirect(`/login?teamId=${teamId}&redirect=${encodeURIComponent(url.pathname)}`);
  }
  
  return { teamId };
}

export default function TeamProjectsRoute() {
  const { teamId } = useLoaderData<typeof loader>();
  return <TeamProjectsPage teamId={teamId} />;
}
```

### 2. 로그인 페이지 쿼리 파라미터 처리

```typescript
// pages/auth/login/index.tsx (수정 예시)
import { useSearchParams, useNavigate } from "react-router";
import { authControllerLoginWithProvider } from "~/api";
import { apiClient } from "~/lib/api/authClient";
import { useTokenStore } from "~/stores/tokenStore";
import { toast } from "sonner";
import { extractApiData, getErrorMessage } from "~/lib/api/apiWrapper";

export default function LoginPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const teamId = searchParams.get("teamId");
  const redirect = searchParams.get("redirect") || "/dashboard";
  const setAccessToken = useTokenStore((state) => state.setAccessToken);
  const setRefreshToken = useTokenStore((state) => state.setRefreshToken);

  async function handleGoogleLogin(googleAccessToken: string) {
    try {
      const { data } = await authControllerLoginWithProvider({
        client: apiClient,
        body: {
          accessToken: googleAccessToken,
          teamId: teamId || undefined, // 쿼리에서 받은 teamId 전달
        },
        throwOnError: true,
      });

      const tokens = extractApiData(data);

      // 토큰 저장
      setAccessToken(tokens.accessToken);
      if (tokens.refreshToken) {
        setRefreshToken(tokens.refreshToken);
      }

      // 원래 가려던 페이지로 이동
      navigate(redirect, { replace: true });
    } catch (error) {
      // teamId가 잘못되었거나 멤버가 아닌 경우 (403)
      if (error instanceof Error && error.message.includes("403")) {
        toast.error("해당 팀의 멤버가 아닙니다. 개인 계정으로 로그인합니다.");
        // teamId 없이 개인 팀으로 로그인 시도
        return handleLoginWithoutTeam(googleAccessToken);
      }

      const errorMessage = getErrorMessage(error);
      toast.error(errorMessage || "로그인에 실패했습니다.");
    }
  }

  // teamId 없이 개인 팀으로 로그인
  async function handleLoginWithoutTeam(googleAccessToken: string) {
    try {
      const { data } = await authControllerLoginWithProvider({
        client: apiClient,
        body: {
          accessToken: googleAccessToken,
          // teamId 없음 → 개인 팀으로 로그인
        },
        throwOnError: true,
      });

      const tokens = extractApiData(data);
      setAccessToken(tokens.accessToken);
      if (tokens.refreshToken) {
        setRefreshToken(tokens.refreshToken);
      }

      navigate("/dashboard", { replace: true });
    } catch (error) {
      const errorMessage = getErrorMessage(error);
      toast.error(errorMessage || "로그인에 실패했습니다.");
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <LoginHeader />
      <main className="flex-1 flex items-center justify-center pb-12">
        {teamId && (
          <div className="mb-4 text-center">
            <p className="text-muted-foreground">
              팀 프로젝트에 접근하기 위해 로그인이 필요합니다.
            </p>
          </div>
        )}
        <LoginCard
          onGoogleLogin={handleGoogleLogin}
          // ... 기타 props
        />
      </main>
      <LoginFooter />
    </div>
  );
}
```

**주의사항:**
- 현재 로그인 페이지는 Supabase를 사용하고 있으므로, 백엔드 API로 전환해야 합니다.
- Google OAuth 토큰을 받는 부분은 기존 로직을 재사용하되, 백엔드 API 호출로 변경해야 합니다.

### 3. 팀 전환 기능

이미 로그인된 상태에서 팀을 전환하는 경우, `switch-team` API를 사용합니다.

```typescript
// components/dashboard/TeamSwitcher.tsx (기존 컴포넌트 수정)
import { useNavigate } from "react-router";
import { authControllerSwitchTeam } from "~/api";

export function TeamSwitcher() {
  const navigate = useNavigate();
  const { teams, currentTeamId } = useTeam();

  async function handleTeamSwitch(newTeamId: string) {
    try {
      const response = await authControllerSwitchTeam({
        client: apiClient,
        body: { teamId: newTeamId },
      });

      // 새 토큰 저장
      useTokenStore.getState().setAccessToken(response.data.data.accessToken);
      useTokenStore.getState().setRefreshToken(response.data.data.refreshToken);

      // 현재 경로를 유지하거나 팀 프로젝트 페이지로 이동
      if (location.pathname.startsWith("/projects/")) {
        // 팀 ID만 업데이트
        const newPath = location.pathname.replace(/^\/projects\/[^/]+/, `/projects/${newTeamId}`);
        navigate(newPath);
      } else {
        // 대시보드로 이동
        navigate("/dashboard");
      }
    } catch (error) {
      toast.error("팀 전환에 실패했습니다.");
    }
  }

  return (
    <DropdownMenu>
      {/* ... 기존 UI ... */}
    </DropdownMenu>
  );
}
```

## 권장 라우팅 구조 (최종)

```
/                                    → Landing Page
/login                               → Login Page (쿼리 파라미터로 teamId, redirect 처리)
/dashboard                           → 현재 활성 팀의 대시보드 (기존)
/projects/:teamId                    → 특정 팀의 프로젝트 목록
/projects/:teamId/:projectId         → 특정 팀의 특정 프로젝트 상세
```

**파일 구조:**
```
routes/
  _marketing._index.tsx              → /
  _marketing.tsx                     → Marketing Layout
  
  _auth.tsx                          → Auth Layout
  _auth.login._index.tsx             → /login (쿼리 파라미터: teamId, redirect)
  
  _app.tsx                           → App Layout (인증 필요)
  _app.dashboard._index.tsx          → /dashboard (기존)
  _app.projects.$teamId._index.tsx   → /projects/:teamId (새로 생성됨)
  _app.projects.$teamId.$projectId.tsx → /projects/:teamId/:projectId (새로 생성됨)
```

## 플로우 다이어그램

### 시나리오 1: 일반 로그인
```
사용자 → /login 방문
     → Google OAuth 로그인
     → POST /auth/login (teamId 없음)
     → 개인 팀 토큰 받음
     → /dashboard로 이동
```

### 시나리오 2: 팀 링크로 접근 (로그인 안됨)
```
사용자 → /projects/team-123/project-456 클릭
     → 인증 체크 → 로그인 안됨
     → /login?teamId=team-123&redirect=/projects/team-123/project-456로 리다이렉트
     → Google OAuth 로그인
     → POST /auth/login (teamId=team-123)
     → 팀 토큰 받음
     → /projects/team-123/project-456로 이동
```

### 시나리오 3: 이미 로그인된 상태에서 팀 전환
```
사용자 → 대시보드에서 팀 선택 드롭다운 클릭
     → 다른 팀 선택
     → POST /auth/switch-team (teamId=새팀ID)
     → 새 토큰 받음
     → 현재 페이지 유지 또는 /projects/:teamId로 이동
```

## 구현 체크리스트

- [x] 라우트 파일 생성 (`_app.projects.$teamId._index.tsx`, `_app.projects.$teamId.$projectId.tsx`)
- [ ] 로그인 페이지 수정 (백엔드 API 연동)
- [ ] 팀 전환 기능 구현 (TeamSwitcher 컴포넌트 수정)
- [ ] 인증 가드 로직 개선 (재사용 가능한 훅 또는 유틸리티)
- [ ] 에러 처리 (403 Forbidden 처리)
- [ ] 토큰 갱신 로직 (401 에러 처리)

이 구조가 React Router v7의 파일 시스템 라우팅과 가장 잘 맞고, 구현도 간단합니다.

