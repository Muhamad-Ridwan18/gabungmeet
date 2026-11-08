package auth

import (
	"errors"
	"os"
	"strings"

	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
	"github.com/ib-community/api/pkg/response"
)

type Handler struct {
	svc Service
}

func NewHandler(svc Service) *Handler {
	return &Handler{svc: svc}
}

func (h *Handler) Register(c *fiber.Ctx) error {
	var req RegisterRequest
	if err := c.BodyParser(&req); err != nil {
		return response.Fail(c, fiber.StatusBadRequest, "Invalid request body")
	}
	authResp, err := h.svc.Register(c.Context(), req)
	if err != nil {
		return mapAuthError(c, err)
	}
	return response.Created(c, "Registered successfully", authResp)
}

func (h *Handler) Login(c *fiber.Ctx) error {
	var req LoginRequest
	if err := c.BodyParser(&req); err != nil {
		return response.Fail(c, fiber.StatusBadRequest, "Invalid request body")
	}
	authResp, err := h.svc.Login(c.Context(), req, c.Get("User-Agent"), c.IP())
	if err != nil {
		return mapAuthError(c, err)
	}
	return response.OK(c, "Login successful", authResp)
}

func (h *Handler) Refresh(c *fiber.Ctx) error {
	var body struct {
		RefreshToken string `json:"refresh_token"`
	}
	if err := c.BodyParser(&body); err != nil || strings.TrimSpace(body.RefreshToken) == "" {
		return response.Fail(c, fiber.StatusBadRequest, "refresh_token is required")
	}
	pair, err := h.svc.Refresh(c.Context(), body.RefreshToken, c.Get("User-Agent"), c.IP())
	if err != nil {
		return mapAuthError(c, err)
	}
	return response.OK(c, "Token refreshed", pair)
}

func (h *Handler) Logout(c *fiber.Ctx) error {
	var body struct {
		RefreshToken string `json:"refresh_token"`
	}
	_ = c.BodyParser(&body)
	if body.RefreshToken != "" {
		_ = h.svc.Logout(c.Context(), body.RefreshToken)
	}
	return response.OK(c, "Logged out", nil)
}

func (h *Handler) Me(c *fiber.Ctx) error {
	uid, ok := c.Locals("user_id").(uuid.UUID)
	if !ok {
		return response.Fail(c, fiber.StatusUnauthorized, "Unauthorized")
	}
	user, err := h.svc.Me(c.Context(), uid)
	if err != nil {
		return mapAuthError(c, err)
	}
	return response.OK(c, "OK", user)
}

func (h *Handler) ForgotPassword(c *fiber.Ctx) error {
	var req ForgotPasswordRequest
	if err := c.BodyParser(&req); err != nil {
		return response.Fail(c, fiber.StatusBadRequest, "Invalid request body")
	}
	token, err := h.svc.ForgotPassword(c.Context(), req.Email)
	if err != nil {
		return mapAuthError(c, err)
	}
	data := fiber.Map{"sent": true}
	// Dev only — never leak reset tokens outside local development.
	if token != "" && strings.EqualFold(os.Getenv("APP_ENV"), "development") {
		data["dev_reset_token"] = token
	}
	return response.OK(c, "If the email exists, a reset link has been sent", data)
}

func (h *Handler) ResetPassword(c *fiber.Ctx) error {
	var req ResetPasswordRequest
	if err := c.BodyParser(&req); err != nil {
		return response.Fail(c, fiber.StatusBadRequest, "Invalid request body")
	}
	if err := h.svc.ResetPassword(c.Context(), req.Token, req.NewPassword); err != nil {
		return mapAuthError(c, err)
	}
	return response.OK(c, "Password updated", nil)
}

func mapAuthError(c *fiber.Ctx, err error) error {
	switch {
	case errors.Is(err, ErrValidation):
		return response.Fail(c, fiber.StatusUnprocessableEntity, "Validation failed", response.FieldError{
			Field: "body", Message: err.Error(),
		})
	case errors.Is(err, ErrEmailTaken):
		return response.Fail(c, fiber.StatusConflict, "Email already registered")
	case errors.Is(err, ErrInvalidCredentials):
		return response.Fail(c, fiber.StatusUnauthorized, "Invalid email or password")
	case errors.Is(err, ErrAccountLocked):
		return response.Fail(c, fiber.StatusForbidden, "Account is locked")
	case errors.Is(err, ErrInvalidResetToken):
		return response.Fail(c, fiber.StatusBadRequest, "Invalid or expired reset token")
	case errors.Is(err, ErrNotFound):
		return response.Fail(c, fiber.StatusNotFound, "Not found")
	default:
		return response.Fail(c, fiber.StatusInternalServerError, "Internal server error")
	}
}

func RegisterRoutes(router fiber.Router, h *Handler, authMW fiber.Handler) {
	auth := router.Group("/auth")
	auth.Post("/register", h.Register)
	auth.Post("/login", h.Login)
	auth.Post("/refresh", h.Refresh)
	auth.Post("/logout", h.Logout)
	auth.Post("/forgot-password", h.ForgotPassword)
	auth.Post("/reset-password", h.ResetPassword)
	auth.Get("/me", authMW, h.Me)
}
