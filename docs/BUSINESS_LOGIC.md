# LocalizeKit 비즈니스 로직 명세서

> **목적**: 백엔드 및 프론트엔드 개발자를 위한 상세한 비즈니스 로직 명세서  
> **최종 업데이트**: 2024-12-03  
> **버전**: 1.0

---

## 목차

1. [개요](#1-개요)
2. [플랜별 제한사항](#2-플랜별-제한사항)
3. [인증 및 프로필 관리](#3-인증-및-프로필-관리)
4. [프로젝트 관리](#4-프로젝트-관리)
5. [팀 멤버십 및 권한 관리](#5-팀-멤버십-및-권한-관리)
6. [번역 관리](#6-번역-관리)
7. [API 키 및 사용량 추적](#7-api-키-및-사용량-추적)
8. [Rate Limiting 로직](#8-rate-limiting-로직)
9. [웹훅 관리](#9-웹훅-관리)
10. [과금/구독 관리](#10-과금구독-관리)
11. [감사 로그](#11-감사-로그)
12. [데이터베이스 트리거 및 자동화](#12-데이터베이스-트리거-및-자동화)
13. [RLS 정책 및 보안](#13-rls-정책-및-보안)
14. [에러 처리](#14-에러-처리)

---

## 1. 개요

### 1.1 시스템 아키텍처

- **인증**: Supabase Auth (Google OAuth + Magic Link)
- **데이터베이스**: Supabase PostgreSQL (RLS 활성화)
- **백엔드**: NestJS + Effect (비동기 처리)
- **프론트엔드**: React + TanStack Query

### 1.2 핵심 도메인

1. **Projects**: 번역 프로젝트
2. **Translations**: 번역 키-값 쌍
3. **Team Members**: 프로젝트 팀 멤버 (Team 플랜)
4. **API Keys**: Delivery API 키 (Pro+)
5. **API Usage**: API 사용량 추적
6. **Webhooks**: 번역 변경 이벤트 (Pro+)
7. **Subscriptions**: Stripe 구독 관리
8. **Audit Logs**: 감사 로그 (Team/Pro)

---

## 2. 플랜별 제한사항

### 2.1 플랜 정의

| 플랜 | 프로젝트 수 | API 요청/월 | 팀 멤버 | 웹훅 | 번역 히스토리 |
|------|------------|------------|---------|------|--------------|
| **Free** | 1 | 제한 없음 (또는 낮은 제한) | ❌ | ❌ | ❌ |
| **Pro** | 10 | 50,000 | ❌ | ✅ | ✅ |
| **Team** | ∞ | 200,000 | ✅ | ✅ | ✅ |

### 2.2 플랜 제한 상수

**위치**: `backend/src/project/plan/plan.types.ts`

```typescript
export const PLAN_LIMITS = {
  free: 1,      // 프로젝트 개수
  pro: 10,      // 프로젝트 개수
  team: Infinity, // 프로젝트 개수 (무제한)
} as const;

export type PlanName = keyof typeof PLAN_LIMITS;
```

### 2.3 API 사용량 제한 (프로젝트별 월간)

```typescript
const API_QUOTA_LIMITS = {
  free: undefined,      // 제한 없음 (또는 낮은 제한)
  pro: 50_000,         // 50k/월
  team: 200_000,       // 200k/월
} as const;
```

### 2.4 플랜 체크 함수

**위치**: `backend/src/project/plan/plan.util.ts`

```typescript
export function getProjectLimit(plan: PlanName): number {
  return PLAN_LIMITS[plan];
}

export function canCreateProject(
  plan: PlanName,
  currentCount: number,
): boolean {
  const limit = getProjectLimit(plan);
  if (!Number.isFinite(limit)) {
    return true; // Infinity = 무제한
  }
  return currentCount < limit;
}
```

**비즈니스 로직**:
- Free: 현재 소유한 프로젝트 수가 1개 미만이면 생성 가능
- Pro: 현재 소유한 프로젝트 수가 10개 미만이면 생성 가능
- Team: 항상 생성 가능 (Infinity)

---

## 3. 인증 및 프로필 관리

### 3.1 사용자 프로필 자동 생성

**트리거**: `on_auth_user_created` (auth.users INSERT 후)

**동작**:
1. `auth.users`에 새 사용자 생성 시 자동 실행
2. `profiles` 테이블에 레코드 자동 생성
3. Magic Link 사용자: `full_name`이 없으면 랜덤 생성 (`user_xxxxx`)

**SQL 함수**: `handle_new_user()`

```sql
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  user_name TEXT;
BEGIN
  user_name := NEW.raw_user_meta_data->>'full_name';
  
  IF user_name IS NULL OR user_name = '' THEN
    user_name := generate_random_username(); -- 'user_' || substr(md5(random()::text), 1, 8)
  END IF;

  INSERT INTO public.profiles (id, email, full_name, avatar_url, plan)
  VALUES (
    NEW.id,
    NEW.email,
    user_name,
    NEW.raw_user_meta_data->>'avatar_url',
    'free' -- 기본값
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### 3.2 프로필 조회 및 업데이트

**비즈니스 로직**:
- 사용자는 자신의 프로필만 조회 가능 (RLS 정책)
- 사용자는 자신의 프로필만 수정 가능
- `plan` 필드는 Stripe 웹훅을 통해서만 업데이트 (백엔드 서비스 역할)

**API**: `GET /users/me`, `PATCH /users/me`

---

## 4. 프로젝트 관리

### 4.1 프로젝트 생성

**API**: `POST /projects`

**비즈니스 로직**:

1. **인증 체크**
   - JWT 토큰 검증 필수
   - 사용자 ID 추출 (`req.user.sub`)

2. **플랜 제한 체크**
   ```typescript
   const plan = userProfile.plan; // 'free' | 'pro' | 'team'
   const currentCount = await countProjects(userId);
   
   if (!canCreateProject(plan, currentCount)) {
     throw new ForbiddenProjectAccessError();
   }
   ```

3. **Slug 유효성 검증**
   - Slug는 전역적으로 고유해야 함 (UNIQUE 제약)
   - 제공되지 않으면 `name`을 slug로 사용 (소문자, 공백 → 하이픈 변환)
   - 정규식: `^[a-z0-9-]+$`

4. **프로젝트 생성**
   ```sql
   INSERT INTO projects (
     name,
     description,
     slug,
     default_language,
     languages,
     owner_id
   ) VALUES (
     $1, -- name
     $2, -- description (nullable)
     $3, -- slug (unique)
     $4, -- defaultLanguage (nullable, default: 'en')
     $5, -- languages (nullable, default: ['en'])
     $6  -- owner_id (auth.uid())
   );
   ```

5. **자동 동작** (트리거)
   - `on_project_created`: `team_members`에 owner 자동 추가

**에러 케이스**:
- `400 Bad Request`: 잘못된 입력값
- `403 Forbidden`: 플랜 제한 초과
- `409 Conflict`: Slug 중복

### 4.2 프로젝트 목록 조회

**API**: `GET /projects?pageSize=15&index=0`

**비즈니스 로직**:

1. **조회 범위**
   - 사용자가 **소유한** 프로젝트 (`owner_id = userId`)
   - 사용자가 **멤버로 속한** 프로젝트 (`team_members` + `joined_at IS NOT NULL`)

2. **정렬**
   - 기본: `created_at DESC` (최신순)

3. **페이지네이션**
   ```typescript
   interface ListProjectsInput {
     pageSize: number; // 기본값: 15
     index: number;    // 0부터 시작
   }
   
   const from = index * pageSize;
   const to = from + pageSize - 1;
   ```

4. **응답에 포함할 추가 필드** (계산 필요)
   - `apiUsage`: 프로젝트별 현재 월 API 사용량
     - SQL 함수: `get_project_api_usage(project_uuid)`
     - 또는 직접 집계:
       ```sql
       SELECT COALESCE(SUM(request_count), 0)
       FROM api_usage
       WHERE project_id = $1
         AND year = EXTRACT(YEAR FROM NOW())
         AND month = EXTRACT(MONTH FROM NOW());
       ```

**SQL 쿼리 예시**:
```sql
SELECT *
FROM projects
WHERE owner_id = $1
   OR id IN (
     SELECT project_id
     FROM team_members
     WHERE user_id = $1
       AND joined_at IS NOT NULL
   )
ORDER BY created_at DESC
LIMIT $2 OFFSET $3;
```

### 4.3 프로젝트 수정

**API**: `PATCH /projects/:id`

**비즈니스 로직**:

1. **권한 체크**
   - 프로젝트 owner만 수정 가능
   - RLS 정책: `projects_update` (owner_id = auth.uid())

2. **수정 가능한 필드**
   - `name`
   - `description`
   - `slug` (유니크 체크 필요)
   - `defaultLanguage`
   - `languages`

3. **제약사항**
   - Slug 변경 시 전역 유니크 체크
   - `languages` 배열에 `defaultLanguage`가 포함되어야 함 (선택적 검증)

**에러 케이스**:
- `401 Unauthorized`: 인증되지 않음
- `403 Forbidden`: owner가 아님
- `404 Not Found`: 프로젝트 없음
- `409 Conflict`: Slug 중복

### 4.4 프로젝트 삭제

**API**: `DELETE /projects/:id`

**비즈니스 로직**:

1. **권한 체크**
   - 프로젝트 owner만 삭제 가능

2. **CASCADE 삭제** (DB 제약)
   - `team_members` 삭제
   - `translations` 삭제
   - `translation_history` 삭제 (CASCADE)
   - `api_keys` 삭제
   - `api_usage` 삭제 (CASCADE)
   - `webhooks` 삭제 (CASCADE)

**주의**: 삭제는 복구 불가능하므로 프론트엔드에서 확인 다이얼로그 필수

---

## 5. 팀 멤버십 및 권한 관리

### 5.1 역할(Role) 계층

```
owner > editor > viewer
```

| 역할 | 권한 |
|------|------|
| **owner** | 프로젝트 모든 권한 (수정, 삭제, 멤버 초대/제거, API 키 관리) |
| **editor** | 번역 CRUD 권한 (프로젝트 설정 수정 불가) |
| **viewer** | 읽기 전용 (번역 조회만 가능) |

**중요**: 프로젝트 `owner_id`와 `team_members.role='owner'`는 다름
- `projects.owner_id`: 프로젝트 소유자 (변경 불가, 삭제 시 CASCADE)
- `team_members.role='owner'`: 팀 내 owner 역할 (Team 플랜 전용)

### 5.2 팀 멤버 초대

**API**: `POST /projects/:id/members`

**비즈니스 로직**:

1. **권한 체크**
   - 프로젝트 owner만 초대 가능 (`has_project_access(project_id, 'owner')`)

2. **플랜 체크**
   - Team 플랜만 멤버 초대 가능 (Free/Pro는 불가)
   - 실제 체크는 백엔드 서비스에서 수행

3. **제약사항**
   - 동일 프로젝트에 동일 사용자 중복 초대 불가 (UNIQUE: `project_id, user_id`)
   - `role='owner'`로 초대 불가 (RLS 정책: `role != 'owner'`)
   - 프로젝트 소유자(`owner_id`)는 자동으로 `team_members`에 포함됨 (트리거)

4. **초대 생성**
   ```sql
   INSERT INTO team_members (
     project_id,
     user_id,
     role,
     invited_by
   ) VALUES (
     $1, -- project_id
     $2, -- user_id (UUID)
     $3, -- role: 'editor' | 'viewer'
     $4  -- invited_by (auth.uid())
   );
   -- joined_at은 NULL (수락 전)
   ```

### 5.3 초대 수락

**API**: `PATCH /projects/:id/members/accept` (또는 `PATCH /team-members/:id`)

**비즈니스 로직**:

1. **권한 체크**
   - 초대받은 사용자 본인만 수락 가능 (`user_id = auth.uid()`)
   - RLS 정책: `team_members_accept_invite`

2. **수락 처리**
   ```sql
   UPDATE team_members
   SET joined_at = NOW()
   WHERE id = $1
     AND user_id = auth.uid()
     AND joined_at IS NULL; -- 아직 수락 안 함
   ```

3. **수락 후 권한**
   - `joined_at IS NOT NULL`이어야 `has_project_access`에서 인정
   - 수락 전에는 프로젝트 접근 불가

### 5.4 멤버 역할 변경

**API**: `PATCH /projects/:id/members/:userId`

**비즈니스 로직**:

1. **권한 체크**
   - 프로젝트 owner만 역할 변경 가능

2. **제약사항**
   - `role='owner'`로 변경 불가 (RLS 정책: `role != 'owner'`)
   - 프로젝트 소유자(`owner_id`)는 역할 변경 불가

### 5.5 멤버 제거

**API**: `DELETE /projects/:id/members/:userId`

**비즈니스 로직**:

1. **권한 체크**
   - 프로젝트 owner만 제거 가능

2. **제약사항**
   - 프로젝트 소유자(`owner_id`)는 제거 불가
   - `role='owner'`인 멤버는 제거 불가 (RLS 정책)

### 5.6 권한 체크 함수

**SQL 함수**: `has_project_access(project_uuid, required_role)`

```sql
CREATE OR REPLACE FUNCTION has_project_access(
  project_uuid UUID,
  required_role TEXT DEFAULT 'viewer'
)
RETURNS BOOLEAN AS $$
DECLARE
  user_role TEXT;
BEGIN
  -- 1. 프로젝트 소유자 체크
  IF EXISTS (
    SELECT 1 FROM projects
    WHERE id = project_uuid
      AND owner_id = auth.uid()
  ) THEN
    RETURN TRUE; -- 소유자는 모든 권한
  END IF;
  
  -- 2. 팀 멤버십 체크
  SELECT role INTO user_role
  FROM team_members
  WHERE project_id = project_uuid
    AND user_id = auth.uid()
    AND joined_at IS NOT NULL; -- 수락 필수
  
  IF user_role IS NULL THEN
    RETURN FALSE; -- 멤버가 아님
  END IF;
  
  -- 3. 역할 계층 체크
  CASE required_role
    WHEN 'viewer' THEN RETURN TRUE; -- 모든 역할 가능
    WHEN 'editor' THEN RETURN user_role IN ('owner', 'editor');
    WHEN 'owner' THEN RETURN user_role = 'owner';
    ELSE RETURN FALSE;
  END CASE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

---

## 6. 번역 관리

### 6.1 번역 데이터 구조

**테이블**: `translations`

```sql
CREATE TABLE translations (
  id UUID PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES projects(id),
  key TEXT NOT NULL,                    -- 예: "common.buttons.submit"
  values JSONB DEFAULT '{}',            -- 예: {"en": "Submit", "ko": "제출"}
  context TEXT,                         -- 번역가용 설명
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  updated_by UUID REFERENCES auth.users(id),
  UNIQUE(project_id, key)               -- 프로젝트 내 키 유니크
);
```

**JSONB 구조**:
```json
{
  "en": "Submit",
  "ko": "제출",
  "ja": "送信"
}
```

### 6.2 번역 조회

**API**: `GET /projects/:id/translations`

**비즈니스 로직**:

1. **권한 체크**
   - `viewer` 이상 권한 필요 (`has_project_access(project_id, 'viewer')`)

2. **필터링** (선택적)
   - 언어별 필터: `?lang=en`
   - 키 검색: `?search=button`
   - 페이지네이션

3. **응답 형식**
   ```typescript
   {
     items: [
       {
         id: "uuid",
         key: "common.buttons.submit",
         values: { "en": "Submit", "ko": "제출" },
         context: "Submit button text",
         updatedAt: "2024-12-03T10:00:00Z",
         updatedBy: "user-uuid"
       }
     ],
     meta: { index, pageSize, hasNext }
   }
   ```

### 6.3 번역 생성

**API**: `POST /projects/:id/translations`

**비즈니스 로직**:

1. **권한 체크**
   - `editor` 이상 권한 필요 (`has_project_access(project_id, 'editor')`)

2. **유효성 검증**
   - `key`: 프로젝트 내 유니크
   - `values`: JSONB 형식, 최소 1개 언어 포함
   - `values`의 키가 `projects.languages`에 포함되어야 함 (선택적 검증)

3. **생성**
   ```sql
   INSERT INTO translations (
     project_id,
     key,
     values,
     context,
     updated_by
   ) VALUES (
     $1, -- project_id
     $2, -- key
     $3, -- values (JSONB)
     $4, -- context (nullable)
     auth.uid()
   );
   ```

4. **히스토리 기록** (Pro+ 플랜)
   - 트리거: `on_translation_change` (INSERT)
   - `translation_history`에 `change_type='create'` 기록

### 6.4 번역 수정

**API**: `PATCH /translations/:id`

**비즈니스 로직**:

1. **권한 체크**
   - `editor` 이상 권한 필요

2. **부분 업데이트 지원**
   - `values` JSONB 병합 (기존 언어 유지, 새 언어 추가/수정)
   - 예: `{"en": "Submit", "ko": "제출"}` → `{"en": "Submit", "ko": "제출", "ja": "送信"}`

3. **히스토리 기록** (Pro+ 플랜)
   - `previous_values`와 `new_values` 비교
   - 변경사항이 있을 때만 기록

**SQL 예시**:
```sql
UPDATE translations
SET
  values = values || $1::jsonb, -- JSONB 병합
  context = COALESCE($2, context),
  updated_by = auth.uid(),
  updated_at = NOW()
WHERE id = $3
  AND has_project_access(project_id, 'editor');
```

### 6.5 번역 삭제

**API**: `DELETE /translations/:id`

**비즈니스 로직**:

1. **권한 체크**
   - `editor` 이상 권한 필요

2. **CASCADE 삭제**
   - `translation_history` 레코드 자동 삭제 (CASCADE)

3. **히스토리 기록** (Pro+ 플랜)
   - `change_type='delete'` 기록

### 6.6 번역 히스토리 (Pro+)

**테이블**: `translation_history`

**트리거**: `on_translation_change`

**비즈니스 로직**:

1. **플랜 체크**
   - Pro 또는 Team 플랜 사용자만 기록
   - Free 플랜: 히스토리 미기록

2. **기록 조건**
   - INSERT: `change_type='create'`, `new_values` 저장
   - UPDATE: `previous_values`와 `new_values` 모두 저장 (변경 시만)
   - DELETE: `previous_values`만 저장

3. **조회**
   - `viewer` 이상 권한으로 조회 가능
   - API: `GET /translations/:id/history`

---

## 7. API 키 및 사용량 추적

### 7.1 API 키 생성

**API**: `POST /projects/:id/api-keys`

**비즈니스 로직**:

1. **권한 체크**
   - 프로젝트 owner만 생성 가능

2. **플랜 체크**
   - Pro 또는 Team 플랜만 생성 가능 (Free 불가)

3. **제약사항**
   - 프로젝트당 1개 API 키만 허용 (`api_keys.project_id UNIQUE`)

4. **키 생성 및 저장**
   ```typescript
   // 1. 랜덤 키 생성
   const apiKey = `lk_${generateRandomString(32)}`; // 예: lk_abc123...
   
   // 2. 해시 저장 (보안)
   const keyHash = await hash(apiKey); // bcrypt 또는 SHA-256
   const keyPrefix = apiKey.substring(0, 8); // 표시용: lk_abc1...
   
   // 3. DB 저장
   INSERT INTO api_keys (
     project_id,
     key_hash,
     key_prefix,
     created_by
   ) VALUES (
     $1, -- project_id
     $2, -- key_hash
     $3, -- key_prefix
     auth.uid()
   );
   ```

5. **응답**
   - API 키는 생성 시 **단 한 번**만 반환
   - 이후 조회 시에는 `key_prefix`만 반환 (예: `lk_abc1...`)

### 7.2 API 키 조회

**API**: `GET /projects/:id/api-keys`

**비즈니스 로직**:
- 프로젝트 owner만 조회 가능
- 실제 키는 반환하지 않음 (`key_prefix`만 반환)
- `last_used_at` 포함 (마지막 사용 시간)

### 7.3 API 키 삭제

**API**: `DELETE /api-keys/:id`

**비즈니스 로직**:
- 프로젝트 owner만 삭제 가능
- 삭제 시 관련 `api_usage` 레코드도 CASCADE 삭제

### 7.4 API 사용량 추적

**테이블**: `api_usage`

**구조**:
```sql
CREATE TABLE api_usage (
  id UUID PRIMARY KEY,
  api_key_id UUID NOT NULL REFERENCES api_keys(id),
  project_id UUID NOT NULL REFERENCES projects(id),
  year INT NOT NULL,
  month INT NOT NULL, -- 1-12
  request_count INT DEFAULT 0,
  updated_at TIMESTAMPTZ,
  UNIQUE(api_key_id, year, month) -- 월별 1개 레코드
);
```

**비즈니스 로직**:

1. **요청 시 증가**
   - Delivery API 요청 시마다 `request_count` 증가
   - 같은 월이면 기존 레코드 업데이트, 아니면 새 레코드 생성

2. **집계 함수**
   ```sql
   -- 프로젝트별 현재 월 사용량
   SELECT get_project_api_usage(project_uuid);
   
   -- 또는 직접 집계
   SELECT COALESCE(SUM(request_count), 0)
   FROM api_usage
   WHERE project_id = $1
     AND year = EXTRACT(YEAR FROM NOW())
     AND month = EXTRACT(MONTH FROM NOW());
   ```

3. **월별 리셋**
   - 매월 1일 자정 자동으로 새 레코드 생성 (별도 작업 필요)
   - 또는 쿼리 시 동적으로 월별 집계

---

## 8. Rate Limiting 로직

### 8.1 Rate Limiting 체크

**위치**: Delivery API 엔드포인트 (Edge Functions 또는 NestJS 미들웨어)

**비즈니스 로직**:

1. **API 키 검증**
   ```typescript
   // 1. API 키로 api_keys 조회
   const apiKey = req.headers['x-api-key'];
   const keyHash = hash(apiKey);
   
   const apiKeyRecord = await db
     .from('api_keys')
     .select('*, projects!inner(*)')
     .eq('key_hash', keyHash)
     .single();
   
   if (!apiKeyRecord) {
     throw new UnauthorizedError('Invalid API key');
   }
   
   const { project_id, projects } = apiKeyRecord;
   const ownerPlan = await getOwnerPlan(projects.owner_id);
   ```

2. **사용량 조회**
   ```typescript
   const currentUsage = await getProjectApiUsage(project_id);
   const quotaLimit = API_QUOTA_LIMITS[ownerPlan];
   ```

3. **제한 체크**
   ```typescript
   if (quotaLimit !== undefined && currentUsage >= quotaLimit) {
     throw new TooManyRequestsError({
       message: 'API quota exceeded',
       limit: quotaLimit,
       usage: currentUsage,
       resetAt: getNextMonthStart(), // 다음 달 1일 자정
     });
   }
   ```

4. **사용량 증가**
   ```typescript
   await incrementApiUsage(apiKeyRecord.id, project_id);
   ```

### 8.2 사용량 증가 함수

```typescript
async function incrementApiUsage(
  apiKeyId: string,
  projectId: string,
): Promise<void> {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  
  // UPSERT
  await db
    .from('api_usage')
    .upsert({
      api_key_id: apiKeyId,
      project_id: projectId,
      year,
      month,
      request_count: db.raw('request_count + 1'),
      updated_at: now.toISOString(),
    }, {
      onConflict: 'api_key_id,year,month',
    });
}
```

### 8.3 에러 응답 형식

```json
{
  "error": "TooManyRequests",
  "message": "API quota exceeded",
  "limit": 50000,
  "usage": 50001,
  "resetAt": "2024-01-01T00:00:00Z"
}
```

**HTTP 상태 코드**: `429 Too Many Requests`

---

## 9. 웹훅 관리

### 9.1 웹훅 생성

**API**: `POST /projects/:id/webhooks`

**비즈니스 로직**:

1. **권한 체크**
   - 프로젝트 owner만 생성 가능

2. **플랜 체크**
   - Pro 또는 Team 플랜만 생성 가능

3. **웹훅 생성**
   ```sql
   INSERT INTO webhooks (
     project_id,
     url,
     secret, -- HMAC 서명용 (선택)
     events, -- 예: ['translation.updated', 'translation.created']
     is_active,
     created_by
   ) VALUES (
     $1, -- project_id
     $2, -- url (HTTPS 필수)
     $3, -- secret (nullable)
     $4, -- events (TEXT[])
     TRUE,
     auth.uid()
   );
   ```

### 9.2 웹훅 이벤트 발송

**트리거**: 번역 변경 시

**비즈니스 로직**:

1. **이벤트 큐잉**
   ```sql
   INSERT INTO webhook_events (
     webhook_id,
     event_type, -- 'translation.created', 'translation.updated', etc.
     payload,    -- JSONB
     status      -- 'pending'
   ) VALUES (
     $1, -- webhook_id
     $2, -- event_type
     $3, -- payload
     'pending'
   );
   ```

2. **백그라운드 워커 처리**
   - 큐에서 `status='pending'` 이벤트 조회
   - HTTP POST 요청 전송
   - 재시도 로직 (최대 3회)
   - 성공/실패 상태 업데이트

3. **HMAC 서명** (secret이 있는 경우)
   ```typescript
   const signature = createHmac('sha256', secret)
     .update(JSON.stringify(payload))
     .digest('hex');
   
   headers['X-LocalizeKit-Signature'] = `sha256=${signature}`;
   ```

---

## 10. 과금/구독 관리

### 10.1 Stripe 웹훅 처리

**API**: `POST /billing/webhook` (Stripe)

**비즈니스 로직**:

1. **웹훅 검증**
   - Stripe 서명 검증 필수

2. **이벤트별 처리**
   - `customer.subscription.created`: 구독 생성
   - `customer.subscription.updated`: 구독 업데이트 (플랜 변경, 취소 등)
   - `customer.subscription.deleted`: 구독 삭제
   - `invoice.payment_succeeded`: 결제 성공
   - `invoice.payment_failed`: 결제 실패

3. **프로필 업데이트**
   ```sql
   -- 구독 활성화 시
   UPDATE profiles
   SET plan = $1 -- 'pro' | 'team'
   WHERE id = (
     SELECT user_id
     FROM subscriptions
     WHERE stripe_subscription_id = $2
   );
   ```

4. **구독 상태 동기화**
   ```sql
   UPDATE subscriptions
   SET
     status = $1, -- 'active' | 'canceled' | 'past_due'
     current_period_start = $2,
     current_period_end = $3,
     cancel_at_period_end = $4
   WHERE stripe_subscription_id = $5;
   ```

### 10.2 구독 조회

**API**: `GET /subscriptions/me`

**비즈니스 로직**:
- 사용자 본인의 구독만 조회 가능 (RLS 정책)
- Stripe 구독 ID, 상태, 기간 등 포함

---

## 11. 감사 로그

### 11.1 감사 로그 기록

**테이블**: `audit_logs`

**비즈니스 로직**:

1. **기록 대상 액션**
   - 프로젝트 생성/수정/삭제
   - 팀 멤버 초대/제거
   - API 키 생성/삭제
   - 웹훅 생성/수정/삭제

2. **플랜 제한**
   - Team 또는 Pro 플랜만 기록
   - Free 플랜: 기록 안 함

3. **로그 구조**
   ```typescript
   {
     id: "uuid",
     project_id: "uuid",
     action: "project.created" | "member.invited" | "api_key.created",
     actor_id: "user-uuid",
     metadata: {
       // 액션별 메타데이터
     },
     created_at: "2024-12-03T10:00:00Z"
   }
   ```

### 11.2 감사 로그 조회

**API**: `GET /projects/:id/audit-logs`

**비즈니스 로직**:
- 프로젝트 멤버 (`viewer` 이상)만 조회 가능
- 페이지네이션 지원
- 필터링: 날짜 범위, 액션 타입, 사용자

---

## 12. 데이터베이스 트리거 및 자동화

### 12.1 프로필 자동 생성

**트리거**: `on_auth_user_created`
- **이벤트**: `auth.users INSERT`
- **함수**: `handle_new_user()`
- **동작**: `profiles` 레코드 자동 생성

### 12.2 프로젝트 소유자 자동 추가

**트리거**: `on_project_created`
- **이벤트**: `projects INSERT`
- **함수**: `handle_new_project()`
- **동작**: `team_members`에 owner 자동 추가

**주의**: `20241203000007_remove_triggers.sql`에서 제거됨 (백엔드에서 처리)

### 12.3 번역 히스토리 자동 기록

**트리거**: `on_translation_change`
- **이벤트**: `translations INSERT/UPDATE/DELETE`
- **함수**: `record_translation_history()`
- **동작**: Pro+ 플랜 사용자만 히스토리 기록

### 12.4 updated_at 자동 갱신

**트리거**: 각 테이블별 `update_*_updated_at`
- **이벤트**: `UPDATE`
- **함수**: `update_updated_at()`
- **동작**: `updated_at` 자동 갱신

---

## 13. RLS 정책 및 보안

### 13.1 RLS 활성화 테이블

모든 테이블에 RLS 활성화:
- `profiles`
- `projects`
- `team_members`
- `translations`
- `translation_history`
- `api_keys`
- `api_usage`
- `webhooks`
- `webhook_events`
- `webhook_deliveries`
- `subscriptions`
- `audit_logs`

### 13.2 Service Role Bypass

**서비스 역할**은 RLS를 자동으로 우회합니다. 다음 용도로 사용:
- Stripe 웹훅 처리
- Delivery API (Edge Functions)
- 관리자 작업

**주의**: Service Role 키는 **절대 클라이언트에 노출 금지**

### 13.3 권한 체크 우선순위

1. **RLS 정책** (DB 레벨)
2. **백엔드 서비스 체크** (애플리케이션 레벨)
3. **비즈니스 로직 검증** (플랜, 제한사항 등)

---

## 14. 에러 처리

### 14.1 에러 타입

| 에러 코드 | HTTP 상태 | 설명 |
|----------|----------|------|
| `Unauthorized` | 401 | 인증되지 않음 |
| `Forbidden` | 403 | 권한 없음 또는 플랜 제한 |
| `NotFound` | 404 | 리소스 없음 |
| `Conflict` | 409 | 중복 (slug, email 등) |
| `TooManyRequests` | 429 | API 사용량 초과 |
| `BadRequest` | 400 | 잘못된 요청 |

### 14.2 에러 응답 형식

```json
{
  "statusCode": 403,
  "message": "Cannot create project: plan limit exceeded",
  "error": "Forbidden"
}
```

### 14.3 비즈니스 로직 에러 예시

```typescript
// 프로젝트 생성 제한 초과
if (!canCreateProject(plan, currentCount)) {
  throw new ForbiddenProjectAccessError({
    message: `Cannot create project: ${plan} plan allows ${limit} projects, currently have ${currentCount}`,
  });
}

// API 사용량 초과
if (currentUsage >= quotaLimit) {
  throw new TooManyRequestsError({
    message: 'API quota exceeded',
    limit: quotaLimit,
    usage: currentUsage,
    resetAt: getNextMonthStart(),
  });
}
```

---

## 부록: 유용한 SQL 함수

### 프로젝트별 API 사용량 집계

```sql
-- 현재 월
SELECT get_project_api_usage(project_uuid);

-- 특정 월
SELECT get_project_api_usage_by_month(project_uuid, 2024, 12);
```

### 권한 체크

```sql
-- 프로젝트 접근 권한 체크
SELECT has_project_access(project_uuid, 'editor');
```

---

## 참고 문서

- **데이터베이스 스키마**: `supabase/migrations/20241203000001_initial_schema.sql`
- **RLS 정책**: `supabase/migrations/20241203000002_rls_policies.sql`
- **플랜 제한**: `backend/src/project/plan/plan.types.ts`
- **프로젝트 서비스**: `backend/src/project/project.service.ts`

---

**문서 버전**: 1.0  
**최종 업데이트**: 2024-12-03

