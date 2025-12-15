# Supabase 마이그레이션 리셋 가이드

## 로컬 개발 환경 (Supabase Local)

### 방법 1: DB 리셋 (권장)
모든 데이터를 삭제하고 마이그레이션을 처음부터 다시 실행합니다.

```bash
# 프로젝트 루트에서 실행
cd /Users/miso/Desktop/Development/LocalizeKit

# Supabase 로컬 서비스 중지
supabase stop

# DB 리셋 (모든 데이터 삭제 + 마이그레이션 재실행)
supabase db reset

# 또는 더 강력한 리셋 (볼륨까지 삭제)
supabase stop --no-backup
supabase db reset
```

### 방법 2: 마이그레이션 히스토리 초기화
마이그레이션 히스토리만 초기화하고 싶은 경우:

```bash
# Supabase 로컬 서비스 시작
supabase start

# 마이그레이션 히스토리 초기화 (supabase_migrations 테이블 비우기)
supabase db reset --db-url "postgresql://postgres:postgres@localhost:54322/postgres"
```

### 방법 3: 수동으로 모든 테이블 DROP
완전히 깨끗하게 시작하고 싶은 경우:

```bash
# Supabase 로컬 서비스 시작
supabase start

# SQL Editor에서 실행하거나 psql로 연결
psql "postgresql://postgres:postgres@localhost:54322/postgres"

# SQL 실행
DROP SCHEMA public CASCADE;
CREATE SCHEMA public;
GRANT ALL ON SCHEMA public TO postgres;
GRANT ALL ON SCHEMA public TO public;

# 그 다음 마이그레이션 재실행
supabase db reset
```

---

## 프로덕션 환경 (Supabase Cloud)

### ⚠️ 주의: 프로덕션에서는 데이터 손실이 발생합니다!

### 방법 1: Supabase Dashboard에서 직접 SQL 실행

1. Supabase Dashboard → SQL Editor 접속
2. 다음 SQL 실행:

```sql
-- 모든 테이블 DROP (주의: 모든 데이터 삭제됨!)
DROP SCHEMA public CASCADE;
CREATE SCHEMA public;
GRANT ALL ON SCHEMA public TO postgres;
GRANT ALL ON SCHEMA public TO public;

-- 마이그레이션 히스토리 테이블 재생성
CREATE TABLE IF NOT EXISTS supabase_migrations.schema_migrations (
  version TEXT PRIMARY KEY,
  statements TEXT[],
  name TEXT
);
```

3. Supabase CLI로 마이그레이션 재실행:

```bash
# 프로젝트 연결
supabase link --project-ref your-project-ref

# 마이그레이션 푸시
supabase db push
```

### 방법 2: Supabase CLI로 리셋

```bash
# 프로젝트 연결
supabase link --project-ref your-project-ref

# DB 리셋 (⚠️ 프로덕션 데이터 모두 삭제!)
supabase db reset --linked
```

### 방법 3: 마이그레이션 롤백 후 재실행

```bash
# 프로젝트 연결
supabase link --project-ref your-project-ref

# 마이그레이션 히스토리 확인
supabase migration list

# 특정 마이그레이션까지 롤백 (예: 모든 마이그레이션 롤백)
# 수동으로 SQL 실행 필요
```

---

## 추천 워크플로우

### 로컬 개발 환경

```bash
# 1. 현재 상태 확인
supabase status

# 2. DB 리셋
supabase db reset

# 3. 마이그레이션 상태 확인
supabase migration list

# 4. 새 마이그레이션 추가 시
supabase migration new your_migration_name
```

### 프로덕션 환경

```bash
# 1. 프로젝트 연결
supabase link --project-ref your-project-ref

# 2. 현재 마이그레이션 상태 확인
supabase migration list --linked

# 3. 새 마이그레이션 푸시
supabase db push --linked

# 4. 또는 특정 마이그레이션만 실행
supabase migration up --linked
```

---

## 마이그레이션 파일 순서 확인

현재 마이그레이션 파일들:
1. `20241203000001_initial_schema.sql`
2. `20241203000002_rls_policies.sql`
3. `20241203000003_webhooks_and_api_usage.sql`
4. `20241203000004_webhooks_rls_policies.sql`
5. `20241203000005_audit_logs.sql`
6. `20241203000006_audit_logs_rls_policies.sql`
7. `20241203000007_remove_triggers.sql`

---

## 문제 해결

### 마이그레이션 충돌 오류
```bash
# 마이그레이션 히스토리 확인
supabase migration list

# 특정 마이그레이션 롤백
supabase migration repair --status reverted --version 20241203000001
```

### Supabase CLI가 설치되지 않은 경우
```bash
# Homebrew (macOS)
brew install supabase/tap/supabase

# 또는 npm
npm install -g supabase
```

### 로컬 Supabase가 시작되지 않는 경우
```bash
# 완전히 정리 후 재시작
supabase stop
docker-compose down -v
supabase start
```












