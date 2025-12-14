# 팀별 인증 전략 설계

## 두 가지 접근 방식 비교

### 옵션 1: 요청마다 teamId 파라미터 전달

**구현 방식:**
```typescript
GET /projects?teamId=xxx
POST /projects { teamId: "xxx", ... }
```

**장점:**
- 한 번에 여러 팀의 프로젝트 조회 가능
- 팀 변경 시 토큰 재발급 불필요
- 유연한 API 설계

**단점:**
- 매 요청마다 teamId 검증 필요 (권한 체크)
- 클라이언트가 임의로 변경 가능 (보안 위험)
- 코드 중복 (모든 엔드포인트에서 teamId 검증)
- 실수로 잘못된 teamId 전달 가능

### 옵션 2: JWT에 teamId 포함 (추천) ⭐

**구현 방식:**
```typescript
// JWT Payload
{
  sub: "user-id",
  email: "user@example.com",
  plan: "team",
  teamId: "team-id"  // 새로 추가
}

// API 요청
GET /projects  // teamId는 JWT에서 자동 추출
```

**장점:**
- ✅ **보안**: 클라이언트가 임의로 변경 불가
- ✅ **일관성**: 인증 레벨에서 한 번만 처리
- ✅ **간결성**: 매 요청마다 teamId 파라미터 불필요
- ✅ **자동화**: Guard에서 자동으로 teamId 추출 및 검증
- ✅ **에러 방지**: 잘못된 teamId 전달 불가능

**단점:**
- 팀 변경 시 토큰 재발급 필요 (하지만 이는 보안상 오히려 좋음)
- 한 번에 하나의 팀만 활성화 가능 (일반적인 사용 패턴과 일치)

## 추천: JWT에 teamId 포함 방식

### 구현 계획

1. **JWT Payload 확장**
   - `teamId` 필드 추가 (optional, null 가능)
   - free/pro 플랜: `teamId: null`
   - team 플랜: 활성 팀의 `teamId`

2. **팀 변경 API**
   - `POST /auth/switch-team` 엔드포인트 추가
   - 새로운 accessToken/refreshToken 발급

3. **Guard에서 자동 처리**
   - `JwtAuthGuard`에서 `teamId` 추출
   - `request.user.teamId`로 접근 가능

4. **서비스 레벨 검증**
   - 사용자가 해당 팀의 멤버인지 확인
   - 권한 체크 (owner, editor, viewer)

### 구현 예시

```typescript
// JWT Payload
export const jwtPayloadSchema = z.object({
  sub: z.string(),
  email: z.string().email().nullish(),
  plan: z.string().nullish(),
  teamId: z.string().uuid().nullish(),  // 새로 추가
  exp: z.number().optional(),
  iat: z.number().optional(),
});

// Guard에서 자동 추출
request.user = {
  sub: "user-id",
  email: "user@example.com",
  plan: "team",
  teamId: "team-id"  // 자동으로 포함됨
}

// Controller에서 사용
@Get('/projects')
listProjects(@Req() req: AuthenticatedRequest) {
  const teamId = req.user?.teamId;  // JWT에서 자동 추출
  // teamId가 null이면 개인 프로젝트, 있으면 팀 프로젝트
}
```

### `/auth/switch-team`의 역할

**목적**: 사용자가 여러 팀에 속해 있을 때, 현재 활성화할 팀을 선택하고 해당 팀의 컨텍스트로 작업하기 위한 API입니다.

**동작 방식:**
1. 사용자가 프론트엔드에서 팀 선택 (드롭다운 등)
2. `POST /auth/switch-team { teamId: "xxx" }` 호출
3. 서버에서:
   - 사용자가 해당 팀의 멤버인지 검증 (`team_memberships` 테이블 확인)
   - 검증 성공 시 새로운 JWT 토큰 발급 (teamId 포함)
   - 실패 시 403 Forbidden 반환
4. 클라이언트가 새 토큰을 저장하고 이후 모든 API 요청에 사용
5. 이후 모든 API 요청은 JWT의 `teamId`를 기반으로 동작:
   - `GET /projects` → 해당 팀의 프로젝트만 조회
   - `POST /projects` → 해당 팀에 프로젝트 생성
   - 등등...

**예시 시나리오:**
```
사용자 A가 "Team Alpha"와 "Team Beta" 두 팀에 속해 있음

1. 초기 로그인: JWT에 teamId 없음 (null)
   → 개인 프로젝트만 조회 가능

2. 사용자가 "Team Alpha" 선택
   → POST /auth/switch-team { teamId: "alpha-id" }
   → 새 JWT 발급: { ..., teamId: "alpha-id" }

3. 이후 API 호출
   → GET /projects → Team Alpha의 프로젝트만 조회
   → POST /projects → Team Alpha에 프로젝트 생성

4. 사용자가 "Team Beta"로 전환
   → POST /auth/switch-team { teamId: "beta-id" }
   → 새 JWT 발급: { ..., teamId: "beta-id" }

5. 이후 API 호출
   → GET /projects → Team Beta의 프로젝트만 조회
```

**보안:**
- 팀 변경 시 항상 멤버십 검증 필수
- 사용자가 멤버가 아닌 팀으로 전환 시도 시 403 Forbidden
- 토큰에 포함된 teamId는 읽기 전용 (클라이언트 수정 불가)

### 보안 고려사항

- 팀 변경 시 항상 멤버십 검증 필수
- 토큰에 포함된 teamId는 읽기 전용 (클라이언트 수정 불가)
- Guard 레벨에서 자동 검증 가능

## 결론

**JWT에 teamId 포함 방식을 추천합니다.**

이유:
1. 보안성: 클라이언트가 임의로 변경 불가
2. 간결성: 매 요청마다 파라미터 불필요
3. 일관성: 인증 레벨에서 통일된 처리
4. 확장성: 향후 팀별 권한 관리 용이

