# Swagger 문서 비교 현황

## 현재 상태

### NestJS 백엔드 (https://i18n-api.jinseok9338.info/docs-json)
- ✅ 완전한 OpenAPI 3.0.0 문서 생성됨
- ✅ 모든 엔드포인트 문서화
- ✅ 모든 스키마 정의 포함
- ✅ JWT Bearer 인증 스키마 포함

### Go 백엔드
- ❌ Swagger annotations 없음
- ❌ Swagger 문서 생성 안됨
- ❌ `/docs/*` 엔드포인트는 설정되어 있으나 문서가 없음

## NestJS Swagger JSON 주요 구조

```json
{
  "openapi": "3.0.0",
  "info": {
    "title": "LocalizeKit API",
    "description": "API documentation for LocalizeKit backend",
    "version": "1.0.0"
  },
  "paths": {
    "/": { ... },
    "/auth/login": { ... },
    "/auth/refresh": { ... },
    "/auth/switch-team": { ... },
    "/users/register": { ... },
    "/users/me": { ... },
    "/projects": { ... },
    "/teams": { ... },
    "/debug/users/plan": { ... }
  },
  "components": {
    "securitySchemes": {
      "jwt": { ... }
    },
    "schemas": {
      "ResponseEnvelopeDto": { ... },
      "ProviderLoginDto": { ... },
      ...
    }
  }
}
```

## Go 백엔드에서 동일한 문서를 만들려면

1. **swaggo/swag annotations 추가 필요**
   - 모든 핸들러에 `@Summary`, `@Description`, `@Tags` 등 추가
   - 요청/응답 스키마 정의
   - 에러 응답 정의

2. **main.go에 general info 추가**
   ```go
   // @title LocalizeKit API
   // @description API documentation for LocalizeKit backend
   // @version 1.0.0
   // @schemes http https
   // @host localhost:3000
   // @BasePath /
   ```

3. **각 컨트롤러 핸들러에 annotations 추가**
   - 예: Auth Controller의 Login 핸들러
   ```go
   // @Summary Login with Google access token
   // @Description Login with Google access token
   // @Tags auth
   // @Accept json
   // @Produce json
   // @Param body body ProviderLoginRequest true "Provider access token payload"
   // @Success 200 {object} response.Envelope{data=TokenPair}
   // @Failure 400 {object} ErrorResponse
   // @Router /auth/login [post]
   ```

4. **swag init 실행**
   ```bash
   swag init -g cmd/server/main.go
   ```

## 작업 범위

- 약 15개 핸들러에 annotations 추가 필요
- 모든 DTO/Schema 구조 정의 필요
- ResponseEnvelope 구조 정의 필요
- Error response 구조 정의 필요

## 결론

현재 Go 백엔드에는 Swagger 문서가 생성되지 않으므로, NestJS와 동일한 문서를 만들려면 모든 핸들러에 Swagger annotations를 추가해야 합니다.

