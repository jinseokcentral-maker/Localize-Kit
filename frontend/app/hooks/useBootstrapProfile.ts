import { useEffect, useRef } from "react";
import { Effect } from "effect";
import { useLocation, useNavigate } from "react-router";
import { supabase } from "~/lib/supabaseClient";
import { apiClient, publicApiClient } from "~/lib/api/authClient";
import { extractApiData } from "~/lib/api/apiWrapper";
import { useTokenStore } from "../stores/tokenStore";
import { useSupabase } from "./useAuth";
import { authControllerLoginWithProvider, userControllerGetMe } from "~/api";
import { isProtectedRoute, isUnprotectedRoute } from "~/lib/routes";
import type { UserData } from "./useGetMe";

/**
 * 경로에서 teamId 추출
 * 예: /teams/team-123/dashboard → "team-123"
 *     /teams/team-456/projects/xyz → "team-456"
 */
function extractTeamIdFromPath(pathname: string): string | null {
  const match = pathname.match(/^\/teams\/([^/]+)/);
  return match ? match[1] : null;
}

/**
 * 로그인 페이지로 리다이렉트 (원래 가려던 곳을 redirect로 전달)
 */
function redirectToLogin(
  pathname: string,
  navigate: (path: string, options?: { replace?: boolean }) => void,
): Effect.Effect<void, never> {
  return Effect.sync(() => {
    const params = new URLSearchParams();
    params.set("redirect", pathname);
    navigate(`/login?${params.toString()}`, { replace: true });
  });
}

function getPendingRedirect(): string | null {
  if (typeof window === "undefined") return null;
  const value = sessionStorage.getItem("pendingRedirect");
  return typeof value === "string" && value.trim() ? value : null;
}

function clearPendingRedirect(): void {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem("pendingRedirect");
}

function clearPendingTeamId(): void {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem("pendingTeamId");
}

function isLogoutInProgress(): boolean {
  if (typeof window === "undefined") return false;
  return sessionStorage.getItem("logoutInProgress") === "1";
}

// Note: we intentionally do NOT clear `logoutInProgress` here.
// It is cleared by the explicit logout handler after navigation stabilizes,
// to avoid a race where guards redirect to /login while still on a protected route.

function getActiveTeamIdFromMeEffect(): Effect.Effect<string | null, Error> {
  return Effect.tryPromise({
    try: async () => {
      const { data } = await userControllerGetMe({
        client: apiClient,
        throwOnError: true,
      });
      const me = extractApiData<UserData>(data);
      const activeTeamId = me.activeTeamId ?? null;
      return activeTeamId;
    },
    catch: (err) =>
      new Error(
        err instanceof Error ? err.message : "Failed to fetch /users/me",
      ),
  });
}

function navigateAfterBootstrapEffect(
  navigate: (path: string, options?: { replace?: boolean }) => void,
): Effect.Effect<void, Error> {
  return Effect.gen(function* (_) {
    const pendingRedirect = yield* _(Effect.sync(() => getPendingRedirect()));

    // If we have a pending redirect (e.g. team deep-link), honor it first.
    if (pendingRedirect) {
      yield* _(
        Effect.sync(() => {
          clearPendingRedirect();
          clearPendingTeamId();
          navigate(pendingRedirect, { replace: true });
        }),
      );
      return;
    }

    // Otherwise, fetch /users/me to get activeTeamId and go to team dashboard.
    const activeTeamId = yield* _(getActiveTeamIdFromMeEffect());
    if (activeTeamId) {
      yield* _(
        Effect.sync(() =>
          navigate(`/teams/${activeTeamId}/dashboard`, { replace: true })
        ),
      );
      return;
    }

    // Last fallback
    yield* _(Effect.sync(() => navigate("/login", { replace: true })));
  });
}

/**
 * Supabase 세션 동기화 및 백엔드 토큰 획득
 */
function syncSupabaseSessionEffect(
  setAccessToken: (token: string | null) => void,
  setRefreshToken: (token: string | null) => void,
  clear: () => void,
  teamId?: string | null,
  navigate?: (path: string, options?: { replace?: boolean }) => void,
): Effect.Effect<void, Error> {
  return Effect.gen(function* (_) {
    const sessionRes = yield* _(
      Effect.tryPromise({
        try: () => supabase.auth.getSession(),
        catch: (err) =>
          new Error(`Failed to get Supabase session: ${String(err)}`),
      }),
    );

    // Our backend verifies a Supabase session JWT via `supabase.auth.getUser(jwt)`.
    // Therefore we must send `session.access_token` (Supabase JWT), not Google `provider_token`.
    const supabaseJwt = sessionRes.data.session?.access_token;
    if (!supabaseJwt) {
      yield* _(Effect.sync(() => clear()));
      return;
    }

    const loginRes = yield* _(
      Effect.tryPromise({
        try: async () => {
          const response = await authControllerLoginWithProvider({
            client: publicApiClient,
            body: {
              accessToken: supabaseJwt,
              teamId: teamId || undefined,
            },
            throwOnError: true,
          });
          return extractApiData<{
            accessToken: string;
            refreshToken: string;
          }>(response.data);
        },
        catch: (err) =>
          new Error(`Failed to login with provider: ${String(err)}`),
      }),
    );

    const accessToken = loginRes.accessToken;
    const refreshToken = loginRes.refreshToken;

    if (!accessToken) {
      yield* _(Effect.sync(() => clear()));
      return;
    }

    yield* _(
      Effect.sync(() => {
        setAccessToken(accessToken ?? null);
        setRefreshToken(refreshToken ?? null);
      }),
    );

    // After storing tokens, redirect to original destination (or active team dashboard).
    if (navigate) {
      yield* _(navigateAfterBootstrapEffect(navigate));
    }
  });
}

interface BootstrapEffectParams {
  pathname: string;
  accessToken: string | null;
  isInitialized: boolean;
  isSupabaseReady: boolean;
  isAuthenticated: boolean;
  setAccessToken: (token: string | null) => void;
  setRefreshToken: (token: string | null) => void;
  clear: () => void;
  navigate: (path: string, options?: { replace?: boolean }) => void;
  lastPathnameRef: React.MutableRefObject<string | null>;
  bootstrappedRef: React.MutableRefObject<boolean>;
}

/**
 * Bootstrap 프로필 로직을 Effect로 통합
 */
function bootstrapProfileEffect(
  params: BootstrapEffectParams,
): Effect.Effect<void, Error> {
  return Effect.gen(function* (_) {
    const {
      pathname,
      accessToken,
      isInitialized,
      isSupabaseReady,
      isAuthenticated,
      setAccessToken,
      setRefreshToken,
      clear,
      navigate,
      lastPathnameRef,
      bootstrappedRef,
    } = params;

    // During logout we force landing and skip any auth redirects.
    if (isLogoutInProgress()) {
      lastPathnameRef.current = pathname;
      yield* _(
        Effect.sync(() => {
          clearPendingRedirect();
          clearPendingTeamId();
          navigate("/", { replace: true });
        }),
      );
      return;
    }

    // /verify 페이지는 공개 라우트이지만 세션 동기화가 필요함
    const isVerifyPage = pathname === "/verify";

    // 공개 라우트인데 /verify가 아니면 인증 체크 불필요 (초기화 전이라도 공개 라우트는 허용)
    if (isUnprotectedRoute(pathname) && !isVerifyPage) {
      lastPathnameRef.current = pathname;
      return;
    }

    // 초기화 전이고 보호된 라우트인 경우, accessToken 확인 후 리다이렉트
    if (!isInitialized) {
      if (isProtectedRoute(pathname) && !accessToken) {
        lastPathnameRef.current = pathname;
        yield* _(redirectToLogin(pathname, navigate));
        return;
      }
      lastPathnameRef.current = pathname;
      return;
    }

    // 경로가 변경되지 않았으면 무한 리다이렉트 방지 (단, /verify는 제외)
    if (lastPathnameRef.current === pathname && !isVerifyPage) {
      return;
    }

    // 보호된 라우트이고 accessToken이 없는 경우 로그인 페이지로 리다이렉트
    if (isProtectedRoute(pathname) && !accessToken) {
      lastPathnameRef.current = pathname;
      yield* _(redirectToLogin(pathname, navigate));
      return;
    }

    // 경로 업데이트
    lastPathnameRef.current = pathname;

    // Supabase 세션 동기화 처리
    if (!isSupabaseReady) {
      return;
    }

    if (!isAuthenticated) {
      yield* _(Effect.sync(() => clear()));
      return;
    }

    // 이미 부트스트랩이 완료되었으면 재실행하지 않음 (단, /verify는 항상 체크)
    if (bootstrappedRef.current && !isVerifyPage) {
      return;
    }

    // accessToken이 이미 있으면 세션 동기화 건너뛰기
    if (accessToken) {
      bootstrappedRef.current = true;
      return;
    }

    // 세션 동기화 실행
    // /verify 페이지인 경우 URL에서 teamId를 가져올 수 없으므로
    // sessionStorage에서 가져옴 (로그인 페이지에서 저장)
    const teamId = typeof window !== "undefined"
      ? sessionStorage.getItem("pendingTeamId")
      : null;

    bootstrappedRef.current = true;
    yield* _(
      syncSupabaseSessionEffect(
        setAccessToken,
        setRefreshToken,
        clear,
        teamId,
        navigate,
      )
        .pipe(
          Effect.tap(() => {
            // 성공 후 sessionStorage 정리
            if (typeof window !== "undefined" && teamId) {
              sessionStorage.removeItem("pendingTeamId");
            }
            return Effect.void;
          }),
        ),
    );
  });
}

export function useBootstrapProfile() {
  const { isInitialized, isSupabaseReady, isAuthenticated } = useSupabase();
  const { accessToken, setAccessToken, setRefreshToken, clear } =
    useTokenStore();
  const bootstrappedRef = useRef(false);
  const navigate = useNavigate();
  const location = useLocation();
  const lastPathnameRef = useRef<string | null>(null);

  useEffect(() => {
    const effect = bootstrapProfileEffect({
      pathname: location.pathname,
      accessToken,
      isInitialized,
      isSupabaseReady,
      isAuthenticated,
      setAccessToken,
      setRefreshToken,
      clear,
      navigate,
      lastPathnameRef,
      bootstrappedRef,
    });

    Effect.runPromise(
      effect.pipe(
        Effect.catchAll((err) => {
          console.error("Bootstrap profile failed", err);
          return Effect.sync(() => clear());
        }),
      ),
    );
  }, [
    location.pathname,
    accessToken,
    isInitialized,
    isSupabaseReady,
    isAuthenticated,
    setAccessToken,
    setRefreshToken,
    clear,
    navigate,
  ]);
}
