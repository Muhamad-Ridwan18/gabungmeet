package ticket

import (
	"errors"
	"strconv"

	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
	"github.com/ib-community/api/pkg/response"
)

type Handler struct{ svc Service }

func NewHandler(svc Service) *Handler { return &Handler{svc: svc} }

func (h *Handler) Create(c *fiber.Ctx) error {
	var in CreateInput
	if err := c.BodyParser(&in); err != nil {
		return response.Fail(c, fiber.StatusBadRequest, "Invalid request body")
	}
	var uid *uuid.UUID
	if v, ok := c.Locals("user_id").(uuid.UUID); ok {
		uid = &v
	}
	item, err := h.svc.Create(c.Context(), uid, in)
	if err != nil {
		return mapErr(c, err)
	}
	return response.Created(c, "Ticket created", item)
}

func (h *Handler) ListMine(c *fiber.Ctx) error {
	uid := c.Locals("user_id").(uuid.UUID)
	items, err := h.svc.ListMine(c.Context(), uid)
	if err != nil {
		return mapErr(c, err)
	}
	return response.OK(c, "OK", items)
}

func (h *Handler) Get(c *fiber.Ctx) error {
	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return response.Fail(c, fiber.StatusBadRequest, "Invalid id")
	}
	var uid *uuid.UUID
	if v, ok := c.Locals("user_id").(uuid.UUID); ok {
		uid = &v
	}
	role, _ := c.Locals("role").(string)
	item, err := h.svc.Get(c.Context(), id, uid, role)
	if err != nil {
		return mapErr(c, err)
	}
	return response.OK(c, "OK", item)
}

func (h *Handler) AddMessage(c *fiber.Ctx) error {
	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return response.Fail(c, fiber.StatusBadRequest, "Invalid id")
	}
	uid := c.Locals("user_id").(uuid.UUID)
	role, _ := c.Locals("role").(string)
	var in MessageInput
	if err := c.BodyParser(&in); err != nil {
		return response.Fail(c, fiber.StatusBadRequest, "Invalid request body")
	}
	msg, err := h.svc.AddMessage(c.Context(), id, uid, role, in)
	if err != nil {
		return mapErr(c, err)
	}
	return response.Created(c, "Message added", msg)
}

func (h *Handler) AdminList(c *fiber.Ctx) error {
	page, _ := strconv.Atoi(c.Query("page", "1"))
	perPage, _ := strconv.Atoi(c.Query("per_page", "20"))
	items, total, err := h.svc.AdminList(c.Context(), c.Query("status"), page, perPage)
	if err != nil {
		return mapErr(c, err)
	}
	totalPages := int(total) / perPage
	if int(total)%perPage != 0 {
		totalPages++
	}
	return response.Paginated(c, "OK", items, response.Meta{Page: page, PerPage: perPage, Total: total, TotalPages: totalPages})
}

func (h *Handler) PatchStatus(c *fiber.Ctx) error {
	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return response.Fail(c, fiber.StatusBadRequest, "Invalid id")
	}
	uid := c.Locals("user_id").(uuid.UUID)
	var in StatusInput
	if err := c.BodyParser(&in); err != nil {
		return response.Fail(c, fiber.StatusBadRequest, "Invalid request body")
	}
	item, err := h.svc.PatchStatus(c.Context(), id, uid, in)
	if err != nil {
		return mapErr(c, err)
	}
	return response.OK(c, "Ticket status updated", item)
}

func mapErr(c *fiber.Ctx, err error) error {
	switch {
	case errors.Is(err, ErrNotFound):
		return response.Fail(c, fiber.StatusNotFound, "Not found")
	case errors.Is(err, ErrValidation):
		return response.Fail(c, fiber.StatusUnprocessableEntity, "Validation failed")
	case errors.Is(err, ErrForbidden):
		return response.Fail(c, fiber.StatusForbidden, "Forbidden")
	default:
		return response.Fail(c, fiber.StatusInternalServerError, "Internal server error")
	}
}

func RegisterRoutes(router fiber.Router, h *Handler, optionalAuth, authMW, adminMW fiber.Handler) {
	router.Post("/tickets", optionalAuth, h.Create)
	router.Get("/tickets/me", authMW, h.ListMine)
	router.Get("/tickets/:id", authMW, h.Get)
	router.Post("/tickets/:id/messages", authMW, h.AddMessage)

	admin := router.Group("/admin", authMW, adminMW)
	admin.Get("/tickets", h.AdminList)
	admin.Patch("/tickets/:id/status", h.PatchStatus)
}
