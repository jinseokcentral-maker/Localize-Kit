# LocalizeKit - Project Context

## 프로젝트 개요
CSV / Excel / Google Sheet 업로드 기반 다국어 관리 MicroSaaS

## 핵심 가치
- "Notion-like Translation CMS" + "i18n Delivery API"
- Developer-First, Lightweight i18n Management

## Target Users
- Solo Dev / Small Startup (MAU ≤ 5K / 팀원 ≤ 5명)
- Side Project 팀
- React/Next.js 기반 제품 개발 팀

---

## Tech Stack

### Frontend
- React (Vite)
- Shadcn/ui
- React Query
- React Router v7
- CSR Only

### Backend (Serverless)
- **Supabase** (No custom backend server)
  - Supabase Auth
  - Supabase Database (PostgreSQL + RLS)
  - Supabase Storage
  - Supabase Edge Functions

### Payment
- Stripe + Supabase Webhook 연동

### Deployment
- **Dokploy** (예정)
- Docker Compose (개발 환경)

---

## 환경 구성

| 환경 | 설명 |
|------|------|
| Development | Docker Compose로 로컬 Supabase 실행 |
| Production | Supabase Cloud |

---

## Pricing Model

| Tier | 가격 | 기능 |
|------|------|------|
| Free | $0 | 프로젝트 1개, 언어 2개, 파일 다운로드만 |
| Pro | $10-19/월 | 프로젝트 5개, 언어 무제한, API, Webhook |
| Team | $39-99/월 | 프로젝트 20개, 멤버 초대, Role-based Access |

---

## Core Features (MVP)

### Free Tier
- [ ] CSV / Excel 업로드 & 파싱
- [ ] Google Sheets URL Import
- [ ] JSON / YAML 변환 & 다운로드
- [ ] Nested key 자동 처리
- [ ] Key 충돌 탐지

### Paid Tier
- [ ] Dashboard (테이블 기반 번역 관리 UI)
- [ ] 실시간 인라인 편집
- [ ] Delivery API (`/v1/translations/:projectId?lang=en`)
- [ ] Snippet 자동 생성 (React, Next.js, RN, Vanilla JS)
- [ ] Webhooks

---

## 폴더 구조

```
LocalizeKit/
├── frontend/     # React + Vite + Shadcn
├── marketing/    # 랜딩 페이지, SEO 컨버터 페이지
├── supabase/     # Edge Functions, Migrations, RLS
├── design/       # 디자인 에셋
└── memory/       # 프로젝트 메모리 (.md)
```

---

## Notes
- Backend 서버 없이 Supabase만으로 MVP 구현
- 추후 필요 시 (Google Sheets 동기화, AI 번역 등) 백엔드 추가 고려

