# LocalizeKit Backend (Go)

This is the Go + Echo backend implementation for LocalizeKit, migrated from NestJS.

## Features

- **Framework**: Echo (Go web framework)
- **Database**: PostgreSQL with sqlc (type-safe SQL queries)
- **Authentication**: JWT with golang-jwt/jwt/v5
- **Validation**: go-playground/validator/v10
- **Logging**: zerolog (structured logging)
- **Supabase Integration**: Custom HTTP client for Supabase Auth API

## Prerequisites

- Go 1.21 or higher
- PostgreSQL database
- sqlc (for code generation)

## Installation

### Install Go

```bash
# macOS
brew install go

# Verify installation
go version
```

### Install sqlc

```bash
# macOS
brew install sqlc

# Or using go install
go install github.com/sqlc-dev/sqlc/cmd/sqlc@latest
```

### Install Dependencies

```bash
go mod download
```

## Configuration

Create a `.env.local` file in the root directory:

```env
PORT=3000
DB_URL_STRING=postgresql://user:password@localhost:5432/localizekit
JWT_SECRET=your-jwt-secret-key
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SECRET_KEY=your-supabase-secret-key
LOG_LEVEL=info
NODE_ENV=development
```

## Database Setup

### Generate SQL Code

After modifying SQL queries in `sql/queries/`, regenerate the code:

```bash
sqlc generate
```

### SQL Files

- `sql/schema.sql`: Database schema definitions
- `sql/queries/`: SQL query files organized by entity

## Development

### Run the Server

```bash
go run ./cmd/server/main.go
```

### Build

```bash
go build -o server ./cmd/server/main.go
```

### Run Tests

```bash
# Run all tests
go test ./...

# Run E2E tests
go test ./test/e2e/... -v
```

## Project Structure

```
backend-go/
├── cmd/
│   └── server/          # Main application entry point
├── internal/
│   ├── auth/            # Authentication module
│   ├── user/            # User module
│   ├── project/         # Project module
│   ├── team/            # Team module
│   ├── common/          # Shared utilities
│   │   ├── errors/      # Error types and mapping
│   │   ├── logging/     # Logging middleware
│   │   ├── middleware/  # HTTP middleware
│   │   └── response/    # Response envelope
│   ├── config/          # Configuration management
│   ├── database/        # Database connection and queries
│   └── supabase/        # Supabase client
├── sql/
│   ├── schema.sql       # Database schema
│   └── queries/         # SQL query files
├── test/
│   └── e2e/             # End-to-end tests
├── Dockerfile           # Docker build configuration
├── sqlc.yaml            # sqlc configuration
└── go.mod               # Go module definition
```

## API Endpoints

### Authentication

- `POST /api/v1/auth/login` - Login with Google access token
- `POST /api/v1/auth/refresh` - Refresh access token
- `POST /api/v1/auth/switch-team` - Switch active team

### Users

- `POST /api/v1/users/register` - Register new user
- `GET /api/v1/users/me` - Get current user profile
- `PUT /api/v1/users/me` - Update current user profile

### Projects

- `POST /api/v1/projects` - Create project
- `GET /api/v1/projects` - List projects
- `PUT /api/v1/projects/:id` - Update project
- `POST /api/v1/projects/:id/members` - Add project member
- `POST /api/v1/projects/:id/members/remove` - Remove project member

### Teams

- `POST /api/v1/teams` - Create team

## Docker

### Build Docker Image

```bash
docker build -t localizekit-backend-go .
```

### Run Docker Container

```bash
docker run -p 3000:3000 --env-file .env.local localizekit-backend-go
```

## Testing

The E2E tests match the NestJS backend test suite to ensure compatibility:

- Error handling tests
- Health check tests
- All error types are mapped correctly

Run tests with:

```bash
go test ./test/e2e/... -v
```

## Migration from NestJS

This Go backend maintains API compatibility with the original NestJS backend:

- Same request/response structures
- Same error handling and status codes
- Same authentication flow
- Same business logic

Key differences:

- Uses sqlc for type-safe SQL instead of MikroORM
- Uses Echo instead of NestJS/Fastify
- Uses Go's standard error handling instead of Effect library
- Uses validator/v10 instead of Zod

## License

UNLICENSED

