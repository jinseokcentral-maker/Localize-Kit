import { Navigate, useLocation } from "react-router";
import { DashboardPage } from "~/pages/dashboard";
import { useTokenStore } from "~/stores/tokenStore";
import type { Route } from "./+types/_app.teams.$teamId.dashboard._index";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Dashboard - LocalizeKit" },
    { name: "description", content: "Manage your localization projects" },
  ];
}

/**
 * Team Dashboard Route
 * URL: /teams/:teamId/dashboard
 *
 * 보호된 라우트: 인증 필요
 * - useBootstrapProfile에서 자동으로 인증 체크 및 리다이렉트 처리
 */
export default function TeamDashboardRoute() {
  const accessToken = useTokenStore((state) => state.accessToken);
  const location = useLocation();

  // Hard guard: prevent dashboard from mounting when logged out
  // (avoids firing queries that would 401 before useBootstrapProfile redirects)
  if (!accessToken) {
    if (typeof window !== "undefined") {
      const isLogout = sessionStorage.getItem("logoutInProgress") === "1";
      if (isLogout) {
        return <Navigate to="/" replace />;
      }
    }

    const params = new URLSearchParams();
    params.set("redirect", `${location.pathname}${location.search}`);
    return <Navigate to={`/login?${params.toString()}`} replace />;
  }

  return <DashboardPage />;
}
