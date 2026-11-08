package journal

import (
	"errors"
	"strconv"

	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
	"github.com/ib-community/api/pkg/response"
)

type Handler struct{ svc Service }

func NewHandler(svc Service) *Handler { return &Handler{svc: svc} }

func (h *Handler) ListMine(c *fiber.Ctx) error {
	uid := c.Locals("user_id").(uuid.UUID)
	page, _ := strconv.Atoi(c.Query("page", "1"))
	perPage, _ := strconv.Atoi(c.Query("per_page", "20"))
	items, total, err := h.svc.ListMine(c.Context(), uid, page, perPage)
	if err != nil {
		return mapErr(c, err)
	}
	totalPages := int(total) / perPage
	if int(total)%perPage != 0 {
		totalPages++
	}
	return response.Paginated(c, "OK", items, response.Meta{Page: page, PerPage: perPage, Total: total, TotalPages: totalPages})
}

func (h *Handler) GetMine(c *fiber.Ctx) error {
	uid := c.Locals("user_id").(uuid.UUID)
	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return response.Fail(c, fiber.StatusBadRequest, "Invalid id")
	}
	item, err := h.svc.GetMine(c.Context(), uid, id)
	if err != nil {
		return mapErr(c, err)
	}
	return response.OK(c, "OK", item)
}

func (h *Handler) Create(c *fiber.Ctx) error {
	uid := c.Locals("user_id").(uuid.UUID)
	var in Input
	if err := c.BodyParser(&in); err != nil {
		return response.Fail(c, fiber.StatusBadRequest, "Invalid request body")
	}
	item, err := h.svc.Create(c.Context(), uid, in)
	if err != nil {
		return mapErr(c, err)
	}
	return response.Created(c, "Journal created", item)
}

func (h *Handler) Update(c *fiber.Ctx) error {
	uid := c.Locals("user_id").(uuid.UUID)
	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return response.Fail(c, fiber.StatusBadRequest, "Invalid id")
	}
	var in Input
	if err := c.BodyParser(&in); err != nil {
		return response.Fail(c, fiber.StatusBadRequest, "Invalid request body")
	}
	item, err := h.svc.Update(c.Context(), uid, id, in)
	if err != nil {
		return mapErr(c, err)
	}
	return response.OK(c, "Journal updated", item)
}

func (h *Handler) Delete(c *fiber.Ctx) error {
	uid := c.Locals("user_id").(uuid.UUID)
	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return response.Fail(c, fiber.StatusBadRequest, "Invalid id")
	}
	if err := h.svc.Delete(c.Context(), uid, id); err != nil {
		return mapErr(c, err)
	}
	return response.OK(c, "Journal deleted", nil)
}

func (h *Handler) AdminList(c *fiber.Ctx) error {
	page, _ := strconv.Atoi(c.Query("page", "1"))
	perPage, _ := strconv.Atoi(c.Query("per_page", "20"))
	items, total, err := h.svc.ListAdmin(c.Context(), page, perPage)
	if err != nil {
		return mapErr(c, err)
	}
	totalPages := int(total) / perPage
	if int(total)%perPage != 0 {
		totalPages++
	}
	return response.Paginated(c, "OK", items, response.Meta{Page: page, PerPage: perPage, Total: total, TotalPages: totalPages})
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

func RegisterRoutes(router fiber.Router, h *Handler, authMW, verifiedMW, adminMW fiber.Handler) {
	router.Get("/journals", authMW, verifiedMW, h.ListMine)
	router.Post("/journals", authMW, verifiedMW, h.Create)
	router.Get("/journals/:id", authMW, verifiedMW, h.GetMine)
	router.Put("/journals/:id", authMW, verifiedMW, h.Update)
	router.Delete("/journals/:id", authMW, verifiedMW, h.Delete)

	admin := router.Group("/admin", authMW, adminMW)
	admin.Get("/journals", h.AdminList)
}
