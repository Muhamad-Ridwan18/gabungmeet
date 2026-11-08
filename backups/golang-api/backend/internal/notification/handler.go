package notification

import (
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

func (h *Handler) ListMine(c *fiber.Ctx) error {
	uid := c.Locals("user_id").(uuid.UUID)
	items, err := h.svc.ListMine(c.Context(), uid)
	if err != nil {
		return response.Fail(c, fiber.StatusInternalServerError, "Internal server error")
	}
	return response.OK(c, "OK", items)
}

func RegisterRoutes(router fiber.Router, h *Handler, authMW fiber.Handler) {
	router.Get("/notifications", authMW, h.ListMine)
}
