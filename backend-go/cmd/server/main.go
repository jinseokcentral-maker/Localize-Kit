// @title LocalizeKit API
// @version 1.0.0
// @description API documentation for LocalizeKit backend
// @BasePath /api/v1
// @schemes http https
// @host localhost:8000
package main

import (
	"backend-go/internal/auth"
	"backend-go/internal/common/logging"
	"backend-go/internal/common/middleware"
	"backend-go/internal/config"
	"backend-go/internal/database"
	db "backend-go/internal/database/queries"
	"backend-go/internal/debug"
	"backend-go/internal/project"
	"backend-go/internal/supabase"
	"backend-go/internal/team"
	"backend-go/internal/user"
	"context"
	"os"
	"os/signal"
	"syscall"
	"time"

	_ "backend-go/docs" // swagger docs

	"github.com/go-playground/validator/v10"
	"github.com/labstack/echo/v4"
	echoMiddleware "github.com/labstack/echo/v4/middleware"
	"github.com/rs/zerolog/log"
	echoSwagger "github.com/swaggo/echo-swagger"
	"github.com/swaggo/swag"
)

func main() {
	// Load configuration
	log.Info().Msg("Loading configuration...")
	cfg, err := config.LoadConfig()
	if err != nil {
		log.Fatal().Err(err).Msg("Failed to load configuration")
	}
	log.Info().
		Str("port", cfg.Port).
		Str("nodeEnv", cfg.NodeEnv).
		Str("logLevel", cfg.LogLevel).
		Msg("Configuration loaded")

	// Initialize database connection pool
	log.Info().Msg("Connecting to database...")
	ctx := context.Background()
	pool, err := database.NewConnectionPool(ctx, cfg.DatabaseURL)
	if err != nil {
		log.Fatal().Err(err).Msg("Failed to connect to database")
	}
	defer pool.Close()
	log.Info().Msg("Database connection established")

	// Initialize sqlc queries
	queries := db.New(pool)

	// Initialize Supabase client
	log.Info().Msg("Initializing Supabase client...")
	supabaseClient, err := supabase.NewClient(cfg.SupabaseURL, cfg.SupabaseSecretKey)
	if err != nil {
		log.Fatal().Err(err).Msg("Failed to create Supabase client")
	}
	log.Info().Msg("Supabase client initialized")

	// Initialize validator
	v := validator.New()

	// Initialize services
	log.Info().Msg("Initializing services...")
	authService := auth.NewService(queries, supabaseClient, cfg.JWTSecret, cfg.JWTExpiresIn, cfg.JWTRefreshExpiresIn)
	userService := user.NewService(queries)
	projectService := project.NewService(queries)
	teamService := team.NewService(queries)
	debugService := debug.NewService(queries)
	log.Info().Msg("Services initialized")

	// Initialize controllers
	authController := auth.NewController(authService, cfg, v)
	userController := user.NewController(userService)
	projectController := project.NewController(projectService)
	teamController := team.NewController(teamService)
	debugController := debug.NewController(debugService, cfg, v)

	// Initialize logger
	logger := logging.NewLogger(cfg.LogLevel)

	// Initialize Echo
	e := echo.New()
	e.HTTPErrorHandler = middleware.ErrorHandler

	// Middleware
	e.Use(echoMiddleware.Recover())
	e.Use(echoMiddleware.CORS())
	e.Use(logging.LoggerMiddleware(logger))

	// Health check (matches NestJS AppController) - Public route, must be registered BEFORE JWT middleware
	// @Summary Health check
	// @Description Returns a greeting string
	// @Tags health
	// @Accept json
	// @Produce json
	// @Success 200 {object} map[string]interface{} "Returns a greeting string"
	// @Router / [get]
	healthCheckHandler := func(c echo.Context) error {
		return c.JSON(200, map[string]interface{}{
			"data":      "Hello World!",
			"timestamp": time.Now().UTC().Format(time.RFC3339),
		})
	}
	e.GET("/", healthCheckHandler)

	// Apply JWT middleware to all routes (will skip routes registered before this)
	// Routes registered before this middleware are not protected
	e.Use(auth.JWTMiddleware(cfg.JWTSecret))

	// Swagger documentation (only in non-production)
	if cfg.NodeEnv != "production" {
		e.GET("/docs/*", echoSwagger.WrapHandler)

		// Add /docs-json endpoint to match NestJS behavior
		e.GET("/docs-json", func(c echo.Context) error {
			doc, err := swag.ReadDoc()
			if err != nil {
				return echo.NewHTTPError(500, "Failed to read swagger doc: "+err.Error())
			}
			c.Response().Header().Set("Content-Type", "application/json")
			return c.String(200, doc)
		})

		log.Info().Msg("Swagger documentation available at /docs/index.html and /docs-json")
	}

	// Public routes
	api := e.Group("/api/v1")
	log.Info().Msg("Registering API routes...")

	// Auth routes (public)
	authGroup := api.Group("/auth")
	authGroup.POST("/login", authController.Login, auth.Public())
	authGroup.POST("/refresh", authController.Refresh, auth.Public())
	authGroup.POST("/switch-team", authController.SwitchTeam)

	// User routes
	userGroup := api.Group("/users")
	userGroup.POST("/register", userController.Register, auth.Public()) // Public: user registration
	userGroup.GET("/me", userController.GetMe)
	userGroup.PUT("/me", userController.UpdateMe)

	projectGroup := api.Group("/projects")
	projectGroup.POST("", projectController.CreateProject)
	projectGroup.GET("", projectController.ListProjects)
	projectGroup.PUT("/:id", projectController.UpdateProject)
	projectGroup.POST("/:id/members", projectController.AddMember)
	projectGroup.POST("/:id/members/remove", projectController.RemoveMember)

	teamGroup := api.Group("/teams")
	teamGroup.POST("", teamController.CreateTeam)

	// Debug routes (only in non-production)
	if cfg.NodeEnv != "production" {
		debugGroup := api.Group("")
		debugController.RegisterRoutes(debugGroup)
	}

	// Start server
	serverAddr := ":" + cfg.Port
	log.Info().
		Str("address", serverAddr).
		Str("environment", cfg.NodeEnv).
		Msg("Starting HTTP server...")

	go func() {
		if err := e.Start(serverAddr); err != nil {
			log.Info().Err(err).Msg("Server shutting down")
		}
	}()

	// Wait for interrupt signal to gracefully shutdown the server
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, os.Interrupt, syscall.SIGTERM)
	<-quit

	log.Info().Msg("Shutting down server...")

	shutdownCtx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	if err := e.Shutdown(shutdownCtx); err != nil {
		log.Fatal().Err(err).Msg("Server forced to shutdown")
	}

	log.Info().Msg("Server exited")
}
