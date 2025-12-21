# Swagger 문서 비교 분석

## NestJS Swagger JSON 구조 분석

NestJS 백엔드의 Swagger JSON (https://i18n-api.jinseok9338.info/docs-json)을 기반으로 Go 백엔드에 동일한 Swagger 문서를 생성해야 합니다.

### 주요 구성 요소:

1. **OpenAPI 3.0.0** 스펙 사용
2. **info** 섹션:
   - title: "LocalizeKit API"
   - description: "API documentation for LocalizeKit backend"
   - version: "1.0.0"
3. **Security Schemes**: JWT Bearer token
4. **Paths**: 모든 엔드포인트 정의
5. **Components/Schemas**: 모든 DTO 및 스키마 정의

### 엔드포인트 목록:

#### Health Check
- `GET /` - Health check

#### Auth
- `POST /auth/login` - Login with Google access token
- `POST /auth/refresh` - Refresh tokens
- `POST /auth/switch-team` - Switch team

#### Users
- `POST /users/register` - Register user
- `GET /users/me` - Get current user
- `PUT /users/me` - Update current user

#### Projects
- `POST /projects` - Create project
- `GET /projects` - List projects
- `PUT /projects/:id` - Update project
- `POST /projects/:id/members` - Add member
- `POST /projects/:id/members/remove` - Remove member

#### Teams
- `POST /teams` - Create team

#### Debug
- `POST /debug/users/plan` - Update user plan (debug only)

## Go 백엔드 Swagger 구현 필요 사항

현재 Go 백엔드는 Swagger annotations가 없어 문서가 생성되지 않습니다.

구현해야 할 것:
1. `swaggo/swag` annotations 추가
2. 각 핸들러에 Swagger 주석 추가
3. 스키마 정의 추가
4. `swag init` 실행하여 문서 생성

## 다음 단계

Go 백엔드에 Swagger annotations를 추가하여 NestJS와 동일한 문서 구조를 만들어야 합니다.

