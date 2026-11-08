package auth

import (
	"strings"

	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
	jwtpkg "github.com/ib-community/api/pkg/jwt"
	"github.com/ib-community/api/pkg/response"
)

func AuthRequired(tokens *jwtpkg.Manager) fiber.Handler {
	return func(c *fiber.Ctx) error {
		header := c.Get("Authorization")
		if header == "" || !strings.HasPrefix(header, "Bearer ") {
			return response.Fail(c, fiber.StatusUnauthorized, "Missing or invalid authorization header")
		}
		raw := strings.TrimPrefix(header, "Bearer ")
		claims, err := tokens.ParseAccessToken(raw)
		if err != nil {
			return response.Fail(c, fiber.StatusUnauthorized, "Invalid or expired token")
		}
		uid, err := uuid.Parse(claims.UserID)
		if err != nil {
			return response.Fail(c, fiber.StatusUnauthorized, "Invalid token subject")
		}
		c.Locals("user_id", uid)
		c.Locals("role", claims.Role)
		c.Locals("status", claims.Status)
		return c.Next()
	}
}

// AuthOptional attaches JWT claims when present; continues for guests.
func AuthOptional(tokens *jwtpkg.Manager) fiber.Handler {
	return func(c *fiber.Ctx) error {
		header := c.Get("Authorization")
		if header == "" || !strings.HasPrefix(header, "Bearer ") {
			return c.Next()
		}
		raw := strings.TrimPrefix(header, "Bearer ")
		claims, err := tokens.ParseAccessToken(raw)
		if err != nil {
			return c.Next()
		}
		uid, err := uuid.Parse(claims.UserID)
		if err != nil {
			return c.Next()
		}
		c.Locals("user_id", uid)
		c.Locals("role", claims.Role)
		c.Locals("status", claims.Status)
		return c.Next()
	}
}

func RequireRoles(roles ...string) fiber.Handler {
	allowed := map[string]struct{}{}
	for _, r := range roles {
		allowed[r] = struct{}{}
	}
	return func(c *fiber.Ctx) error {
		role, _ := c.Locals("role").(string)
		if _, ok := allowed[role]; !ok {
			return response.Fail(c, fiber.StatusForbidden, "Insufficient role")
		}
		return c.Next()
	}
}

func RequireStatuses(statuses ...string) fiber.Handler {
	allowed := map[string]struct{}{}
	for _, s := range statuses {
		allowed[s] = struct{}{}
	}
	return func(c *fiber.Ctx) error {
		status, _ := c.Locals("status").(string)
		if _, ok := allowed[status]; !ok {
			return response.Fail(c, fiber.StatusForbidden, "Account status does not allow this action")
		}
		return c.Next()
	}
}
