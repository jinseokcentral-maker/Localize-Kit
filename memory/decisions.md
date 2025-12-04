# LocalizeKit - Architecture Decisions

## 2024-XX-XX: Backend 제거 결정

### Context
- 초기 계획: NestJS + Google Cloud Run
- Auth/Payment: Supabase 사용 예정

### Decision
NestJS 백엔드 없이 Supabase만으로 MVP 구현

### Rationale
1. Supabase Auth로 인증 처리 가능
2. Supabase Database + RLS로 보안 처리 가능
3. Supabase Edge Functions로 Delivery API 구현 가능
4. CSV → JSON 변환은 100% 클라이언트에서 처리 가능
5. 인프라 비용 절감 & 개발 속도 향상

### Consequences
- 복잡한 서버 로직이 필요해지면 나중에 추가
- Google Sheets 실시간 동기화 등은 추후 검토

---

## 2024-XX-XX: 배포 전략

### Decision
- Development: Docker Compose (로컬 Supabase)
- Production: Supabase Cloud
- Deployment Tool: Dokploy

### Rationale
- 개발 환경과 프로덕션 환경 분리
- Dokploy로 self-hosted 배포 관리

