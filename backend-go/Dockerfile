# Multi-stage build for Go backend with sqlc

# Stage 1: Build stage
# Use Go 1.23+ to support latest sqlc (requires Go 1.23.0+)
FROM golang:1.23-alpine AS builder

# Install build dependencies (git for go mod, sqlc)
RUN apk add --no-cache git ca-certificates tzdata

# Install sqlc
RUN go install github.com/sqlc-dev/sqlc/cmd/sqlc@latest

# Set working directory
WORKDIR /build

# Copy go mod files
COPY go.mod go.sum ./
RUN go mod download

# Copy sqlc configuration
COPY sqlc.yaml ./
COPY sql/schema.sql sql/schema.sql
COPY sql/queries sql/queries

# Generate sqlc code
RUN sqlc generate

# Copy source code
COPY . .

# Build the application
RUN CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build \
    -ldflags='-w -s -extldflags "-static"' \
    -a -installsuffix cgo \
    -o server \
    ./cmd/server

# Stage 2: Runtime stage
FROM alpine:latest

# Install ca-certificates for HTTPS requests
RUN apk --no-cache add ca-certificates tzdata

WORKDIR /app

# Copy the binary from builder
COPY --from=builder /build/server .

# Expose port
EXPOSE 3000

# Run the server
CMD ["./server"]

