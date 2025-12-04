# LocalizeKit - Environment Setup

## 폴더별 환경 변수

### 1. 프로젝트 루트 (`/.env`)

Docker Compose에서 사용하는 환경 변수입니다.

```env
# Database
POSTGRES_PASSWORD=localizekit_dev

# JWT Secret (minimum 32 characters)
JWT_SECRET=super-secret-jwt-token-with-at-least-32-characters

# API Keys (default demo keys for local development)
ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0
SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU
```

---

### 2. Frontend (`/frontend/.env.development`)

Vite에서 사용하는 환경 변수입니다. `VITE_` 접두사가 필요합니다.

#### Development (로컬 Docker)

```env
# Supabase Local (Docker)
VITE_SUPABASE_URL=http://localhost:8000
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0

# App Config
VITE_APP_NAME=LocalizeKit
VITE_APP_URL=http://localhost:5173
```

#### Production (Supabase Cloud) - `/frontend/.env.production`

```env
# Supabase Cloud
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here

# App Config
VITE_APP_NAME=LocalizeKit
VITE_APP_URL=https://localizekit.com

# Stripe (Public Key only - safe to expose)
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_xxx
```

---

### 3. Supabase Edge Functions (선택사항)

Edge Functions에서 사용하는 환경 변수 (Supabase Dashboard에서 설정)

```env
# Stripe (Secret - never expose to frontend)
STRIPE_SECRET_KEY=sk_live_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx
STRIPE_PRICE_PRO=price_xxx
STRIPE_PRICE_TEAM=price_xxx

# Supabase Service Role (for admin operations)
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

---

## API Keys 정리

| Key                      | 용도                    | 노출 가능?             |
| ------------------------ | ----------------------- | ---------------------- |
| `ANON_KEY`               | 클라이언트에서 API 호출 | ✅ Yes (RLS로 보호)    |
| `SERVICE_ROLE_KEY`       | 서버에서 관리자 작업    | ❌ No (절대 노출 금지) |
| `STRIPE_PUBLISHABLE_KEY` | Stripe 결제 UI          | ✅ Yes                 |
| `STRIPE_SECRET_KEY`      | Stripe 서버 작업        | ❌ No                  |

---

## Docker Compose 실행

### 시작

```bash
cd /Users/miso/Desktop/Development/LocalizeKit
docker-compose up -d
```

### 서비스 URL (Development)

| 서비스               | URL                   | 설명                       |
| -------------------- | --------------------- | -------------------------- |
| **Kong API Gateway** | http://localhost:8000 | Main Supabase API endpoint |
| **Supabase Studio**  | http://localhost:3100 | Database Dashboard         |
| **Inbucket**         | http://localhost:9000 | Email Testing UI           |
| **Frontend (예정)**  | http://localhost:5173 | Vite Dev Server            |

### API 엔드포인트

```
http://localhost:8000/auth/v1/    # Authentication
http://localhost:8000/rest/v1/    # REST API (PostgREST)
http://localhost:8000/storage/v1/ # Storage
```

### 종료

```bash
docker-compose down
```

### 데이터 초기화 (볼륨 삭제)

```bash
docker-compose down -v
```

---

## Frontend에서 Supabase 연결

```typescript
// src/lib/supabase.ts
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
```

---

## Production 배포 (Dokploy)

> TODO: Dokploy 설정 추가 예정

### 체크리스트

- [ ] Supabase Cloud 프로젝트 생성
- [ ] Production 환경 변수 설정
- [ ] Stripe Live 키 설정
- [ ] 도메인 연결
- [ ] SSL 인증서
