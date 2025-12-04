# LocalizeKit - Database Schema

## 설계 결정 사항

| 항목 | 결정 |
|------|------|
| 번역 구조 | JSONB `{"en": "Submit", "ko": "제출"}` |
| 언어 관리 | `projects.languages` 명시적 저장 |
| 팀 기능 | `team_members` 테이블 (처음부터) |
| 히스토리 | `translation_history` (Pro+ 전용) |
| API 키 | 프로젝트당 1개 (`UNIQUE` 제약) |
| 인증 | Google OAuth + Magic Link (Passwordless) |

---

## 테이블 구조

### 1. profiles

| Column | Type | Description |
|--------|------|-------------|
| id | UUID (PK) | auth.users.id 참조 |
| email | TEXT | 이메일 |
| full_name | TEXT | 이름 (Magic Link: 랜덤 생성) |
| avatar_url | TEXT | 프로필 이미지 |
| plan | TEXT | `free` / `pro` / `team` |
| stripe_customer_id | TEXT | Stripe 고객 ID |
| created_at | TIMESTAMPTZ | 생성일 |
| updated_at | TIMESTAMPTZ | 수정일 |

### 2. projects

| Column | Type | Description |
|--------|------|-------------|
| id | UUID (PK) | 프로젝트 ID |
| owner_id | UUID (FK) | 소유자 |
| name | TEXT | 프로젝트 이름 |
| description | TEXT | 설명 |
| slug | TEXT (UNIQUE) | API URL용 식별자 |
| default_language | TEXT | 기본 언어 |
| languages | TEXT[] | 지원 언어 배열 |
| created_at | TIMESTAMPTZ | 생성일 |
| updated_at | TIMESTAMPTZ | 수정일 |

### 3. team_members

| Column | Type | Description |
|--------|------|-------------|
| id | UUID (PK) | ID |
| project_id | UUID (FK) | 프로젝트 |
| user_id | UUID (FK) | 사용자 |
| role | TEXT | `owner` / `editor` / `viewer` |
| invited_by | UUID (FK) | 초대한 사람 |
| invited_at | TIMESTAMPTZ | 초대 시간 |
| joined_at | TIMESTAMPTZ | 수락 시간 (NULL=대기중) |
| created_at | TIMESTAMPTZ | 생성일 |

**UNIQUE**: `(project_id, user_id)`

### 4. translations

| Column | Type | Description |
|--------|------|-------------|
| id | UUID (PK) | ID |
| project_id | UUID (FK) | 프로젝트 |
| key | TEXT | 번역 키 |
| values | JSONB | `{"en": "Submit", "ko": "제출"}` |
| context | TEXT | 번역자를 위한 설명 |
| created_at | TIMESTAMPTZ | 생성일 |
| updated_at | TIMESTAMPTZ | 수정일 |
| updated_by | UUID (FK) | 마지막 수정자 |

**UNIQUE**: `(project_id, key)`

### 5. translation_history (Pro+)

| Column | Type | Description |
|--------|------|-------------|
| id | UUID (PK) | ID |
| translation_id | UUID (FK) | 번역 |
| previous_values | JSONB | 이전 값 |
| new_values | JSONB | 새 값 |
| changed_by | UUID (FK) | 변경자 |
| changed_at | TIMESTAMPTZ | 변경 시간 |
| change_type | TEXT | `create` / `update` / `delete` |

### 6. api_keys

| Column | Type | Description |
|--------|------|-------------|
| id | UUID (PK) | ID |
| project_id | UUID (FK, UNIQUE) | 프로젝트 (1:1) |
| key_hash | TEXT (UNIQUE) | 해시된 키 |
| key_prefix | TEXT | 표시용 (`lk_abc...`) |
| last_used_at | TIMESTAMPTZ | 마지막 사용 |
| created_at | TIMESTAMPTZ | 생성일 |
| created_by | UUID (FK) | 생성자 |

### 7. subscriptions

| Column | Type | Description |
|--------|------|-------------|
| id | UUID (PK) | ID |
| user_id | UUID (FK, UNIQUE) | 사용자 (1:1) |
| stripe_subscription_id | TEXT | Stripe 구독 ID |
| stripe_price_id | TEXT | Stripe 가격 ID |
| status | TEXT | `active` / `inactive` / `canceled` / `past_due` / `trialing` |
| current_period_start | TIMESTAMPTZ | 현재 기간 시작 |
| current_period_end | TIMESTAMPTZ | 현재 기간 종료 |
| cancel_at_period_end | BOOLEAN | 기간 종료 시 취소 |
| created_at | TIMESTAMPTZ | 생성일 |
| updated_at | TIMESTAMPTZ | 수정일 |

---

## ERD

```
auth.users
    │
    ├──1:1── profiles
    │           └── plan, stripe_customer_id
    │
    ├──1:N── projects (as owner)
    │           │
    │           ├──1:N── team_members
    │           │           └── role: owner/editor/viewer
    │           │
    │           ├──1:N── translations
    │           │           │
    │           │           └──1:N── translation_history (Pro+)
    │           │
    │           └──1:1── api_keys
    │
    └──1:1── subscriptions
```

---

## 자동 트리거

| 트리거 | 이벤트 | 동작 |
|--------|--------|------|
| `on_auth_user_created` | auth.users INSERT | profiles 자동 생성 (Magic Link: 랜덤 이름) |
| `on_project_created` | projects INSERT | team_members에 owner 추가 |
| `on_translation_change` | translations INSERT/UPDATE/DELETE | Pro+ 히스토리 기록 |
| `update_*_updated_at` | UPDATE | updated_at 자동 갱신 |

---

## RLS 정책

| 테이블 | SELECT | INSERT | UPDATE | DELETE |
|--------|--------|--------|--------|--------|
| profiles | 본인 | 자동 | 본인 | - |
| projects | owner OR member | owner | owner | owner |
| team_members | member | owner | owner (role변경), 본인 (수락) | owner |
| translations | viewer+ | editor+ | editor+ | editor+ |
| translation_history | viewer+ | 트리거 | - | - |
| api_keys | owner | owner | - | owner |
| subscriptions | 본인 | service_role | service_role | service_role |

### Role 계층
```
owner > editor > viewer
```

---

## 플랜별 기능

| 기능 | Free | Pro | Team |
|------|------|-----|------|
| 프로젝트 수 | 1 | 5 | 20 |
| 언어 수 | 2 | ∞ | ∞ |
| Dashboard 편집 | ❌ | ✅ | ✅ |
| Delivery API | ❌ | ✅ | ✅ |
| api_keys | ❌ | ✅ | ✅ |
| translation_history | ❌ | ✅ | ✅ |
| team_members | ❌ | ❌ | ✅ |

---

## 파일 위치

```
supabase/
├── migrations/
│   ├── 00001_initial_schema.sql   # 테이블, 함수, 트리거
│   └── 00002_rls_policies.sql     # RLS 정책
└── kong.yml                        # API Gateway
```

---

## 마이그레이션 실행

### Supabase Studio (권장)

1. http://localhost:3100 접속
2. **SQL Editor** 클릭
3. `00001_initial_schema.sql` 복사 → 실행
4. `00002_rls_policies.sql` 복사 → 실행

### 순서 중요!
```
00001 → 00002
```

