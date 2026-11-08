package bonus

import (
	"errors"

	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
	"github.com/ib-community/api/pkg/response"
)

type Handler struct{ svc Service }

func NewHandler(svc Service) *Handler { return &Handler{svc: svc} }

func (h *Handler) List(c *fiber.Ctx) error {
	items, err := h.svc.List(c.Context(), false)
	if err != nil {
		return mapErr(c, err)
	}
	return response.OK(c, "OK", items)
}

func (h *Handler) Telegram(c *fiber.Ctx) error {
	return response.OK(c, "OK", fiber.Map{"telegram_invite_url": h.svc.TelegramLink(c.Context())})
}

func (h *Handler) AdminList(c *fiber.Ctx) error {
	items, err := h.svc.List(c.Context(), true)
	if err != nil {
		return mapErr(c, err)
	}
	return response.OK(c, "OK", items)
}

func (h *Handler) Create(c *fiber.Ctx) error {
	var in Input
	if err := c.BodyParser(&in); err != nil {
		return response.Fail(c, fiber.StatusBadRequest, "Invalid request body")
	}
	item, err := h.svc.Create(c.Context(), in)
	if err != nil {
		return mapErr(c, err)
	}
	return response.Created(c, "Bonus created", item)
}

func (h *Handler) Update(c *fiber.Ctx) error {
	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return response.Fail(c, fiber.StatusBadRequest, "Invalid id")
	}
	var in Input
	if err := c.BodyParser(&in); err != nil {
		return response.Fail(c, fiber.StatusBadRequest, "Invalid request body")
	}
	item, err := h.svc.Update(c.Context(), id, in)
	if err != nil {
		return mapErr(c, err)
	}
	return response.OK(c, "Bonus updated", item)
}

func (h *Handler) Delete(c *fiber.Ctx) error {
	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return response.Fail(c, fiber.StatusBadRequest, "Invalid id")
	}
	if err := h.svc.Delete(c.Context(), id); err != nil {
		return mapErr(c, err)
	}
	return response.OK(c, "Bonus deleted", nil)
}

func mapErr(c *fiber.Ctx, err error) error {
	switch {
	case errors.Is(err, ErrNotFound):
		return response.Fail(c, fiber.StatusNotFound, "Not found")
	case errors.Is(err, ErrValidation):
		return response.Fail(c, fiber.StatusUnprocessableEntity, "Validation failed")
	default:
		return response.Fail(c, fiber.StatusInternalServerError, "Internal server error")
	}
}

func RegisterRoutes(router fiber.Router, h *Handler, authMW, verifiedMW, adminMW fiber.Handler) {
	router.Get("/bonuses", authMW, verifiedMW, h.List)
	router.Get("/telegram-link", authMW, verifiedMW, h.Telegram)

	admin := router.Group("/admin", authMW, adminMW)
	admin.Get("/bonuses", h.AdminList)
	admin.Post("/bonuses", h.Create)
	admin.Put("/bonuses/:id", h.Update)
	admin.Delete("/bonuses/:id", h.Delete)
}
