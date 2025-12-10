# 인증 시스템 분석 (staffsales 프로젝트 참고)

## 핵심 패턴

### 1. 전역 인증 체크 (root.tsx)
- `root.tsx`에서 모든 라우트에 대해 인증 상태 체크
- 인증되지 않은 사용자는 자동으로 `/login`으로 리다이렉트
- 인증된 사용자가 로그인 페이지 접근 시 홈으로 리다이렉트

### 2. Zustand + localStorage
- 사용자 정보와 토큰을 별도 스토어로 관리
- 초기 상태는 localStorage에서 복원
- SSR 안전성: `typeof window !== "undefined"` 체크

### 3. API 클라이언트 (ky)
- 자동 토큰 갱신 로직
- 401 에러 시 refresh token으로 재시도
- 동시 요청 큐 처리 (중복 refresh 방지)

### 4. React Query
- 전역 QueryClient 설정
- 적절한 캐싱 전략

---

## LocalizeKit 적용 방안

### 차이점
- staffsales: JWT 토큰 기반 (accessToken + refreshToken)
- LocalizeKit: Supabase Auth (세션 기반)

### 적용할 패턴
1. ✅ root.tsx에서 전역 인증 체크
2. ✅ Zustand 스토어로 사용자 상태 관리
3. ✅ Supabase 세션 관리 (토큰 대신 세션)
4. ✅ API 클라이언트는 Supabase 클라이언트 사용 (별도 ky 불필요)




