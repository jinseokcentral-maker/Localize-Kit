# LocalizeKit MVP 출시 계획 (20일)

## 목표
1월 초 출시를 위한 전체 기능 구현 (Free/Pro/Team 플랜 + 모든 핵심 기능)

---

## Phase 1: 기반 구축 (1-3일)

### 1.1 Supabase 마이그레이션 적용
- [ ] Supabase Cloud에 마이그레이션 실행
  - `supabase/migrations/20241203000001_initial_schema.sql` 실행
  - `supabase/migrations/20241203000002_rls_policies.sql` 실행
- [ ] Supabase Studio에서 테이블/RLS 정책 검증
- [ ] 환경 변수 설정 (`frontend/.env.production`)

**파일**: `supabase/migrations/*.sql`

### 1.2 인증 시스템 완성
- [ ] 세션 관리 훅 생성 (`frontend/app/hooks/useAuth.ts`)
- [ ] 보호된 라우트 래퍼 (`frontend/app/components/auth/ProtectedRoute.tsx`)
- [ ] 로그인 후 리다이렉트 처리 (`frontend/app/pages/auth/login/index.tsx`)
- [ ] 로그아웃 기능 구현
- [ ] 인증 상태 전역 관리 (Zustand 스토어)

**파일**: 
- `frontend/app/hooks/useAuth.ts` (신규)
- `frontend/app/components/auth/ProtectedRoute.tsx` (신규)
- `frontend/app/stores/authStore.ts` (신규)

### 1.3 프로젝트 관리 API
- [ ] 프로젝트 CRUD 서비스 (`frontend/app/lib/services/projectService.ts`)
- [ ] 프로젝트 목록 페이지 (`frontend/app/pages/projects/index.tsx`)
- [ ] 프로젝트 생성 페이지 (`frontend/app/pages/projects/new.tsx`)
- [ ] 프로젝트 설정 페이지 (`frontend/app/pages/projects/[id]/settings.tsx`)

**파일**:
- `frontend/app/lib/services/projectService.ts` (신규)
- `frontend/app/pages/projects/index.tsx` (신규)

---

## Phase 2: 핵심 기능 (4-10일)

### 2.1 번역 관리 대시보드 (Pro+)
- [ ] 번역 테이블 UI (`frontend/app/components/translations/TranslationTable.tsx`)
- [ ] 인라인 편집 기능
- [ ] 번역 키 추가/삭제
- [ ] 언어 추가/제거
- [ ] 번역 서비스 (`frontend/app/lib/services/translationService.ts`)

**파일**:
- `frontend/app/lib/services/translationService.ts` (신규)
- `frontend/app/components/translations/TranslationTable.tsx` (신규)
- `frontend/app/pages/projects/[id]/translations.tsx` (신규)

### 2.2 CSV/Excel → DB 임포트
- [ ] 컨버터에서 프로젝트 선택 UI 추가
- [ ] 파싱 결과를 DB에 저장하는 함수 (`frontend/app/lib/services/importService.ts`)
- [ ] 키 충돌 처리 (덮어쓰기/건너뛰기 옵션)
- [ ] 임포트 진행 상태 표시

**파일**:
- `frontend/app/lib/services/importService.ts` (신규)
- `frontend/app/components/landing/editor/EditorSection.tsx` (수정)

### 2.3 Delivery API (Supabase Edge Functions)
- [ ] Edge Function 생성 (`supabase/functions/deliver-translations/index.ts`)
- [ ] API 키 검증 로직
- [ ] 요청 제한 (Pro: 50k/mo, Team: 200k/mo)
- [ ] 캐싱 전략 (선택사항)

**파일**:
- `supabase/functions/deliver-translations/index.ts` (신규)

### 2.4 API 키 관리
- [ ] API 키 생성/삭제 UI (`frontend/app/pages/projects/[id]/api-keys.tsx`)
- [ ] API 키 서비스 (`frontend/app/lib/services/apiKeyService.ts`)
- [ ] 키 생성 시 해시 처리

**파일**:
- `frontend/app/lib/services/apiKeyService.ts` (신규)
- `frontend/app/pages/projects/[id]/api-keys.tsx` (신규)

---

## Phase 3: 결제 시스템 (11-15일)

### 3.1 Stripe 설정
- [ ] Stripe 계정 생성 및 테스트 키 발급
- [ ] Stripe Products/Prices 생성 (Pro, Team)
- [ ] 환경 변수 설정

### 3.2 결제 플로우
- [ ] Pricing 페이지에 "Upgrade" 버튼 연결
- [ ] Stripe Checkout 세션 생성 (`supabase/functions/create-checkout/index.ts`)
- [ ] 결제 성공 페이지 (`frontend/app/pages/billing/success.tsx`)
- [ ] 결제 취소 페이지 (`frontend/app/pages/billing/cancel.tsx`)

**파일**:
- `supabase/functions/create-checkout/index.ts` (신규)
- `frontend/app/pages/billing/success.tsx` (신규)
- `frontend/app/pages/billing/cancel.tsx` (신규)

### 3.3 Stripe Webhook
- [ ] Webhook 엔드포인트 (`supabase/functions/stripe-webhook/index.ts`)
- [ ] 구독 생성/갱신/취소 이벤트 처리
- [ ] `subscriptions` 테이블 동기화
- [ ] `profiles.plan` 업데이트

**파일**:
- `supabase/functions/stripe-webhook/index.ts` (신규)

### 3.4 플랜별 기능 제한
- [ ] 플랜 체크 유틸리티 (`frontend/app/lib/utils/planLimits.ts`)
- [ ] 프로젝트 수 제한 (Free: 1, Pro: 10, Team: 무제한)
- [ ] 언어 수 제한 (Free: 2, Pro/Team: 무제한)
- [ ] 기능 제한 UI (업그레이드 프롬프트)

**파일**:
- `frontend/app/lib/utils/planLimits.ts` (신규)

---

## Phase 4: 고급 기능 (16-18일)

### 4.1 팀 기능 (Team 플랜)
- [ ] 팀 멤버 초대 UI (`frontend/app/pages/projects/[id]/team.tsx`)
- [ ] 이메일 초대 발송 (Supabase Edge Function)
- [ ] 초대 수락/거절 기능
- [ ] 역할 기반 접근 제어 (RLS 정책 활용)

**파일**:
- `frontend/app/lib/services/teamService.ts` (신규)
- `supabase/functions/invite-team-member/index.ts` (신규)
- `frontend/app/pages/projects/[id]/team.tsx` (신규)

### 4.2 번역 히스토리 (Pro+)
- [ ] 히스토리 조회 UI (`frontend/app/pages/projects/[id]/history.tsx`)
- [ ] 변경 이력 표시 (트리거로 자동 기록됨)
- [ ] 롤백 기능 (선택사항)

**파일**:
- `frontend/app/pages/projects/[id]/history.tsx` (신규)

### 4.3 Code Snippets
- [ ] 프레임워크별 스니펫 생성 (`frontend/app/lib/utils/codeSnippets.ts`)
- [ ] React, Next.js, React Native, Vanilla JS 지원
- [ ] 스니펫 표시 UI (`frontend/app/components/projects/CodeSnippet.tsx`)

**파일**:
- `frontend/app/lib/utils/codeSnippets.ts` (신규)
- `frontend/app/components/projects/CodeSnippet.tsx` (신규)

---

## Phase 5: 마무리 및 배포 (19-20일)

### 5.1 에러 핸들링 및 검증
- [ ] 전역 에러 바운더리
- [ ] 폼 유효성 검사
- [ ] API 에러 처리

### 5.2 성능 최적화
- [ ] 번역 테이블 가상화 (대용량 데이터)
- [ ] 이미지 최적화
- [ ] 번들 크기 최적화

### 5.3 배포 준비
- [ ] 프로덕션 빌드 테스트
- [ ] 환경 변수 최종 확인
- [ ] Dokploy 배포 설정 (또는 Vercel/Netlify)
- [ ] 도메인 연결 및 SSL

---

## 우선순위 매트릭스

| 기능 | 우선순위 | 예상 소요 | 의존성 |
|------|---------|----------|--------|
| Supabase 마이그레이션 | 🔴 Critical | 0.5일 | - |
| 인증 시스템 | 🔴 Critical | 1일 | Supabase |
| 프로젝트 관리 | 🔴 Critical | 1.5일 | 인증 |
| 번역 대시보드 | 🔴 Critical | 2일 | 프로젝트 |
| CSV 임포트 | 🔴 Critical | 1일 | 프로젝트 |
| Delivery API | 🟡 High | 1.5일 | 프로젝트 |
| Stripe 결제 | 🟡 High | 3일 | 인증 |
| 플랜 제한 | 🟡 High | 1일 | 결제 |
| 팀 기능 | 🟢 Medium | 2일 | 결제 |
| 히스토리 | 🟢 Medium | 1일 | 번역 |
| Code Snippets | 🟢 Medium | 1일 | - |
| 배포 | 🔴 Critical | 1일 | 모든 기능 |

---

## 주요 기술 스택

- **Frontend**: React 19, React Router v7, Zustand, Shadcn/ui
- **Backend**: Supabase (Auth, Database, Storage, Edge Functions)
- **Payment**: Stripe Checkout + Webhooks
- **Deployment**: Dokploy (또는 Vercel/Netlify)

---

## 리스크 관리

1. **Stripe 계정 생성 지연**: 가능한 빨리 Stripe 계정 생성 및 테스트 키 발급
2. **Supabase Edge Functions 학습 곡선**: 공식 문서 참고, 간단한 함수부터 시작
3. **RLS 정책 복잡도**: 단계적으로 테스트하며 정책 추가
4. **성능 이슈**: 대용량 번역 데이터 처리를 위한 가상화 고려

---

## 체크리스트 (매일 확인)

- [ ] Supabase 마이그레이션 적용 완료
- [ ] 인증 플로우 테스트 완료
- [ ] 프로젝트 CRUD 동작 확인
- [ ] 번역 대시보드 기본 기능 완료
- [ ] CSV 임포트 동작 확인
- [ ] Delivery API 테스트 완료
- [ ] Stripe 결제 플로우 완료
- [ ] 플랜 제한 로직 검증
- [ ] 팀 기능 테스트 완료
- [ ] 프로덕션 배포 완료

---

## TODO 리스트

### Phase 1: 기반 구축
- [ ] `supabase-migration`: Supabase Cloud에 마이그레이션 실행 및 검증
- [ ] `auth-system`: 인증 시스템 완성 (세션 관리, 보호된 라우트, 로그아웃)
- [ ] `project-crud`: 프로젝트 관리 CRUD 구현 (목록, 생성, 설정)

### Phase 2: 핵심 기능
- [ ] `translation-dashboard`: 번역 관리 대시보드 구현 (테이블, 인라인 편집, 키 추가/삭제)
- [ ] `csv-import`: CSV/Excel → DB 임포트 기능 구현
- [ ] `delivery-api`: Delivery API 구현 (Supabase Edge Functions, API 키 검증, 요청 제한)
- [ ] `api-keys`: API 키 관리 UI 및 서비스 구현

### Phase 3: 결제 시스템
- [ ] `stripe-setup`: Stripe 계정 생성 및 Products/Prices 설정
- [ ] `stripe-checkout`: Stripe Checkout 플로우 구현 (세션 생성, 성공/취소 페이지)
- [ ] `stripe-webhook`: Stripe Webhook 구현 (구독 이벤트 처리, DB 동기화)
- [ ] `plan-limits`: 플랜별 기능 제한 로직 구현 (프로젝트 수, 언어 수, 기능 제한)

### Phase 4: 고급 기능
- [ ] `team-features`: 팀 기능 구현 (멤버 초대, 역할 관리, 초대 수락)
- [ ] `translation-history`: 번역 히스토리 조회 UI 구현
- [ ] `code-snippets`: Code Snippets 생성 기능 구현 (React, Next.js, RN, Vanilla JS)

### Phase 5: 배포
- [ ] `deployment`: 프로덕션 배포 준비 및 실행 (환경 변수, 빌드, 도메인)











