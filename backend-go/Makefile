.PHONY: build run test clean sqlc docker-build docker-run

# Build the application
build:
	go build -o server ./cmd/server/main.go

# Run the application
run:
	go run ./cmd/server/main.go

# Run all tests
test:
	go test ./...

# Run E2E tests
test-e2e:
	go test ./test/e2e/... -v

# Generate sqlc code
sqlc:
	sqlc generate

# Generate Swagger documentation
swagger:
	swag init -g cmd/server/main.go -o docs --parseDependency --parseInternal

# Clean build artifacts
clean:
	rm -f server
	go clean

# Build Docker image
docker-build:
	docker build -t localizekit-backend-go .

# Run Docker container
docker-run:
	docker run -p 3000:3000 --env-file .env.local localizekit-backend-go

# Install dependencies
deps:
	go mod download
	go mod tidy

# Format code
fmt:
	go fmt ./...

# Run linter (requires golangci-lint)
lint:
	golangci-lint run

# Setup development environment
setup: deps sqlc
	@echo "Development environment setup complete"

