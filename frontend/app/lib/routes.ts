/**
 * 인증이 필요 없는 공개 라우트
 * 이 경로들은 teamId 없이 접근 가능
 */
export const UNPROTECTED_ROUTES = [
    "/",
    "/login",
    "/pricing",
    "/converter",
    "/auth",
    "/verify",
] as const;

/**
 * 인증이 필요한 보호된 라우트 패턴
 * 모든 보호된 라우트는 /teams/:teamId/... 형태로 접근
 * startsWith로 매칭하므로 하위 경로도 자동으로 보호됨
 * 예: /teams/team-123/dashboard
 *     /teams/team-123/projects
 *     /teams/team-123/settings
 */
export const PROTECTED_ROUTES = [
    "/teams",
] as const;

/**
 * 경로가 보호된 라우트인지 확인
 * @param path - 확인할 경로
 * @returns 보호된 라우트이면 true
 */
export const isProtectedRoute = (path: string): boolean => {
    return PROTECTED_ROUTES.some((route) => path.startsWith(route));
};

/**
 * 경로가 공개 라우트인지 확인
 * @param path - 확인할 경로
 * @returns 공개 라우트이면 true
 */
export const isUnprotectedRoute = (path: string): boolean => {
    return UNPROTECTED_ROUTES.some((route) => path.startsWith(route));
};
