# Migration 검토 결과 및 수정 사항

> **검토일**: 2024-12-03  
> **기준**: `docs/BUSINESS_LOGIC.md` 및 현재 백엔드 구현

---

## 발견된 문제점

### 1. ⚠️ 프로젝트 생성 시 team_members에 owner 추가 누락

**현재 상태**:
- Migration `20241203000007_remove_triggers.sql`에서 `handle_new_project()` 트리거 제거
- 백엔드 `ProjectService.createProject()`에서 `team_members`에 owner 추가 로직 없음

**영향**:
- RLS 정책은 `projects.owner_id`를 직접 체크하므로 기능적으로는 문제 없음
- 하지만 비즈니스 로직 문서에는 "트리거 제거 후 백엔드에서 처리"라고 되어 있으나 실제로 처리하지 않음
- 일관성 문제: 모든 프로젝트 소유자가 `team_members`에도 존재해야 함

**해결 방안**:
```typescript
// backend/src/project/project.service.ts - createProject() 수정 필요
const { data, error } = await client
  .from('projects')
  .insert({ ... })
  .select('*')
  .single<ProjectRow>();

// 추가 필요:
await client
  .from('team_members')
  .insert({
    project_id: data.id,
    user_id: userId,
    role: 'owner',
    joined_at: new Date().toISOString(),
  });
```

**권장**: Migration 수정보다는 백엔드 코드 수정 권장 (일관성 유지)

---

### 2. ⚠️ updated_at 자동 갱신 누락

**현재 상태**:
- Migration `20241203000007_remove_triggers.sql`에서 `update_*_updated_at` 트리거 제거
- 백엔드 코드에서 `updated_at`을 명시적으로 설정하지 않음

**영향**:
- 레코드 수정 시 `updated_at`이 갱신되지 않음
- 정확한 수정 시간 추적 불가

**해결 방안**:

**옵션 1**: 백엔드에서 명시적으로 설정 (권장)
```typescript
// 모든 UPDATE 쿼리에 추가
.update({
  ...input,
  updated_at: new Date().toISOString(),
})
```

**옵션 2**: 트리거 복원 (더 안전하지만 백엔드와 중복 가능)
```sql
-- Migration 복원 또는 새 migration 추가
CREATE TRIGGER update_projects_updated_at
  BEFORE UPDATE ON projects
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();
```

**권장**: 옵션 1 (백엔드에서 명시적 처리, 더 명확함)

---

### 3. ⚠️ 번역 히스토리 자동 기록 누락

**현재 상태**:
- Migration `20241203000007_remove_triggers.sql`에서 `record_translation_history()` 트리거 제거
- 백엔드에서 번역 히스토리 기록 로직 확인 필요

**영향**:
- Pro+ 플랜 사용자의 번역 변경 히스토리가 기록되지 않음
- 비즈니스 로직 문서와 불일치

**해결 방안**:
- 백엔드 `TranslationService`에서 번역 CRUD 시 히스토리 기록 로직 추가 필요
- 또는 트리거 복원

**권장**: 백엔드에서 명시적 처리 (플랜 체크 가능, 더 유연함)

---

### 4. ✅ 프로필 자동 생성 - 정상

**현재 상태**:
- Migration에서 트리거 제거되었지만
- 백엔드 `AuthService.findOrCreateUser()`에서 처리 중

**결론**: 문제 없음

---

## 권장 수정 사항

### Migration 파일 수정 필요 없음

모든 문제는 백엔드 코드 수정으로 해결 가능:
1. 프로젝트 생성 시 `team_members`에 owner 추가
2. 모든 UPDATE 시 `updated_at` 명시적 설정
3. 번역 히스토리 기록 로직 추가

### 백엔드 코드 수정 필요

1. **`backend/src/project/project.service.ts`**
   - `createProject()`: team_members에 owner 추가
   - `updateProject()`: updated_at 설정

2. **`backend/src/translation/translation.service.ts`** (없으면 생성)
   - 번역 CRUD 시 `translation_history` 기록
   - Pro+ 플랜 체크

3. **모든 서비스의 UPDATE 메서드**
   - `updated_at` 필드 명시적 설정

---

## Migration 구조 검토

### ✅ 정상 동작하는 부분

1. **테이블 구조**: 모든 비즈니스 로직에 필요한 테이블 존재
2. **RLS 정책**: 권한 체크 로직 정상
3. **인덱스**: 성능 최적화 적절
4. **제약조건**: UNIQUE, FOREIGN KEY 적절
5. **API 사용량 집계 함수**: `20241203000008` 추가됨

### Migration 파일 순서

현재 순서는 적절함:
1. `00001_initial_schema.sql` - 기본 구조
2. `00002_rls_policies.sql` - 보안 정책
3. `00003_webhooks_and_api_usage.sql` - API 관련
4. `00004_webhooks_rls_policies.sql` - 웹훅 보안
5. `00005_audit_logs.sql` - 감사 로그
6. `00006_audit_logs_rls_policies.sql` - 감사 로그 보안
7. `00007_remove_triggers.sql` - 트리거 제거 (백엔드 처리로 전환)
8. `00008_project_api_usage_aggregation.sql` - API 사용량 집계 함수

---

## 최종 권장사항

### Migration 수정: 없음

현재 migration 구조는 적절하며, 트리거 제거는 백엔드에서 처리하겠다는 설계 결정이므로 문제 없음.

### 백엔드 코드 수정 필요

1. **프로젝트 생성 시 team_members 추가**
2. **updated_at 자동 갱신** (모든 UPDATE 쿼리)
3. **번역 히스토리 기록** (Pro+ 플랜 체크)

### 비즈니스 로직 문서 업데이트

`docs/BUSINESS_LOGIC.md`의 트리거 관련 설명을 실제 구현 방식에 맞게 수정 필요:
- 트리거 제거됨
- 백엔드에서 처리 (명시적)

---

**검토 완료일**: 2024-12-03

