package auth

import (
	authErrors "backend-go/internal/common/errors"
	"errors"
	"strings"

	"github.com/golang-jwt/jwt/v5"
	"github.com/labstack/echo/v4"
)

const BearerPrefix = "Bearer "

type ContextKey string

const UserKey ContextKey = "user"

func JWTMiddleware(jwtSecret string) echo.MiddlewareFunc {
	return func(next echo.HandlerFunc) echo.HandlerFunc {
		return func(c echo.Context) error {
			path := c.Request().URL.Path
			
			// Skip JWT check for public paths
			if path == "/" || strings.HasPrefix(path, "/docs") || path == "/docs-json" {
				return next(c)
			}
			
			// Check if route is marked as public
			isPublic := c.Get("public") != nil
			if isPublic {
				return next(c)
			}

			authHeader := c.Request().Header.Get("Authorization")
			if authHeader == "" {
				return echo.NewHTTPError(401, "Missing authorization header")
			}

			if !strings.HasPrefix(authHeader, BearerPrefix) {
				return echo.NewHTTPError(401, "Invalid authorization scheme")
			}

			tokenString := strings.TrimPrefix(authHeader, BearerPrefix)

			token, err := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
				if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
					return nil, &authErrors.InvalidTokenError{Reason: "invalid signing method"}
				}
				return []byte(jwtSecret), nil
			})

			if err != nil {
				if errors.Is(err, jwt.ErrTokenExpired) {
					return echo.NewHTTPError(401, "JWT token expired")
				}
				return echo.NewHTTPError(401, "Invalid token: "+err.Error())
			}

			if !token.Valid {
				return echo.NewHTTPError(401, "Invalid token")
			}

			claims, ok := token.Claims.(jwt.MapClaims)
			if !ok {
				return echo.NewHTTPError(401, "Invalid token claims")
			}

			sub, ok := claims["sub"].(string)
			if !ok || sub == "" {
				return echo.NewHTTPError(401, "Invalid token: missing sub")
			}

			var email *string
			if e, ok := claims["email"].(string); ok && e != "" {
				email = &e
			}

			var plan *string
			if p, ok := claims["plan"].(string); ok && p != "" {
				plan = &p
			}

			var teamID *string
			if t, ok := claims["teamId"].(string); ok && t != "" {
				teamID = &t
			}

			payload := JwtPayload{
				Sub:    sub,
				Email:  email,
				Plan:   plan,
				TeamID: teamID,
			}

			c.Set(string(UserKey), payload)
			return next(c)
		}
	}
}

// GetUserFromContext extracts user from echo context
func GetUserFromContext(c echo.Context) (*JwtPayload, error) {
	user := c.Get(string(UserKey))
	if user == nil {
		return nil, &authErrors.UnauthorizedError{Reason: "User not authenticated"}
	}

	payload, ok := user.(JwtPayload)
	if !ok {
		return nil, &authErrors.UnauthorizedError{Reason: "Invalid user context"}
	}

	return &payload, nil
}

// Public marks a route as public (no auth required)
func Public() echo.MiddlewareFunc {
	return func(next echo.HandlerFunc) echo.HandlerFunc {
		return func(c echo.Context) error {
			c.Set("public", true)
			return next(c)
		}
	}
}

