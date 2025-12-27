package config

import (
	"fmt"
	"os"

	"github.com/joho/godotenv"
)

type Config struct {
	Port             string
	DatabaseURL      string
	JWTSecret        string
	JWTExpiresIn     string
	JWTRefreshExpiresIn string
	SupabaseURL      string
	SupabaseSecretKey string
	LogLevel         string
	NodeEnv          string
}

func LoadConfig() (*Config, error) {
	// Load .env.local file in non-production
	nodeEnv := os.Getenv("NODE_ENV")
	if nodeEnv != "production" {
		if err := godotenv.Load(".env.local"); err != nil {
			// .env.local is optional, but log if not found
			fmt.Printf("Warning: .env.local file not found (this is optional): %v\n", err)
		}
	}

	dbURL := os.Getenv("DB_URL_STRING")
	if dbURL == "" {
		return nil, fmt.Errorf("DB_URL_STRING is required")
	}

	jwtSecret := os.Getenv("JWT_SECRET")
	if jwtSecret == "" {
		return nil, fmt.Errorf("JWT_SECRET is required")
	}

	jwtExpiresIn := os.Getenv("JWT_EXPIRES_IN")
	if jwtExpiresIn == "" {
		jwtExpiresIn = "15m"
	}

	jwtRefreshExpiresIn := os.Getenv("JWT_REFRESH_EXPIRES_IN")
	if jwtRefreshExpiresIn == "" {
		jwtRefreshExpiresIn = "7d"
	}

	supabaseURL := os.Getenv("SUPABASE_URL")
	if supabaseURL == "" {
		return nil, fmt.Errorf("SUPABASE_URL is required")
	}

	supabaseSecretKey := os.Getenv("SUPABASE_SECRET_KEY")
	if supabaseSecretKey == "" {
		return nil, fmt.Errorf("SUPABASE_SECRET_KEY is required")
	}

	port := os.Getenv("PORT")
	if port == "" {
		port = "3000"
	}

	logLevel := os.Getenv("LOG_LEVEL")
	if logLevel == "" {
		logLevel = "info"
	}

	return &Config{
		Port:                port,
		DatabaseURL:         dbURL,
		JWTSecret:           jwtSecret,
		JWTExpiresIn:        jwtExpiresIn,
		JWTRefreshExpiresIn: jwtRefreshExpiresIn,
		SupabaseURL:         supabaseURL,
		SupabaseSecretKey:   supabaseSecretKey,
		LogLevel:            logLevel,
		NodeEnv:             nodeEnv,
	}, nil
}

