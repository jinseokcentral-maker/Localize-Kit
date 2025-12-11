// 인증이 필요 없는 경로 (공개 페이지)
export const NOT_AUTH_PATH = [
  "/",
  "/login",
  "/pricing",
  "/converter",
] as const;

// 외부 링크 경로 (인증 체크 제외)
export const EXTERNAL_LINK_PATH = [] as const;






