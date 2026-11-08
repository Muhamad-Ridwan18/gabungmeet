package settings

import (
	"github.com/gofiber/fiber/v2"
	"github.com/ib-community/api/pkg/response"
)

type Handler struct {
	svc Service
}

func NewHandler(svc Service) *Handler {
	return &Handler{svc: svc}
}

func (h *Handler) Public(c *fiber.Ctx) error {
	return response.OK(c, "OK", h.svc.Public(c.Context()))
}

func RegisterRoutes(router fiber.Router, h *Handler) {
	router.Get("/settings/public", h.Public)
}
