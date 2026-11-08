package ai

import (
	"errors"
	"strconv"

	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
	"github.com/ib-community/api/pkg/response"
)

type Handler struct{ svc Service }

func NewHandler(svc Service) *Handler { return &Handler{svc: svc} }

func (h *Handler) Chat(c *fiber.Ctx) error {
	var in ChatInput
	if err := c.BodyParser(&in); err != nil {
		return response.Fail(c, fiber.StatusBadRequest, "Invalid request body")
	}
	var uid *uuid.UUID
	if v, ok := c.Locals("user_id").(uuid.UUID); ok {
		uid = &v
	}
	reply, err := h.svc.Chat(c.Context(), uid, in)
	if err != nil {
		return mapErr(c, err)
	}
	return response.OK(c, "OK", reply)
}

func (h *Handler) ListMine(c *fiber.Ctx) error {
	uid := c.Locals("user_id").(uuid.UUID)
	items, err := h.svc.ListMine(c.Context(), uid)
	if err != nil {
		return mapErr(c, err)
	}
	return response.OK(c, "OK", items)
}

func (h *Handler) AdminList(c *fiber.Ctx) error {
	page, _ := strconv.Atoi(c.Query("page", "1"))
	perPage, _ := strconv.Atoi(c.Query("per_page", "20"))
	items, total, err := h.svc.AdminList(c.Context(), page, perPage)
	if err != nil {
		return mapErr(c, err)
	}
	totalPages := int(total) / perPage
	if int(total)%perPage != 0 {
		totalPages++
	}
	return response.Paginated(c, "OK", items, response.Meta{Page: page, PerPage: perPage, Total: total, TotalPages: totalPages})
}

func (h *Handler) AdminGet(c *fiber.Ctx) error {
	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return response.Fail(c, fiber.StatusBadRequest, "Invalid id")
	}
	item, err := h.svc.AdminGet(c.Context(), id)
	if err != nil {
		return mapErr(c, err)
	}
	return response.OK(c, "OK", item)
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

func RegisterRoutes(router fiber.Router, h *Handler, optionalAuth, authMW, adminMW fiber.Handler) {
	router.Post("/ai/chat", optionalAuth, h.Chat)
	router.Get("/ai/conversations/me", authMW, h.ListMine)

	admin := router.Group("/admin", authMW, adminMW)
	admin.Get("/ai/conversations", h.AdminList)
	admin.Get("/ai/conversations/:id", h.AdminGet)
}
