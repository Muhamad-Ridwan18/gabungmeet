package signal

import (
	"errors"
	"strconv"

	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
	"github.com/ib-community/api/pkg/response"
)

type Handler struct{ svc Service }

func NewHandler(svc Service) *Handler { return &Handler{svc: svc} }

func (h *Handler) List(c *fiber.Ctx) error {
	page, _ := strconv.Atoi(c.Query("page", "1"))
	perPage, _ := strconv.Atoi(c.Query("per_page", "20"))
	items, total, err := h.svc.List(c.Context(), c.Query("status"), page, perPage)
	if err != nil {
		return mapErr(c, err)
	}
	totalPages := int(total) / perPage
	if int(total)%perPage != 0 {
		totalPages++
	}
	return response.Paginated(c, "OK", items, response.Meta{Page: page, PerPage: perPage, Total: total, TotalPages: totalPages})
}

func (h *Handler) Get(c *fiber.Ctx) error {
	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return response.Fail(c, fiber.StatusBadRequest, "Invalid id")
	}
	item, err := h.svc.Get(c.Context(), id)
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
	return response.Created(c, "Signal created", item)
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
	return response.OK(c, "Signal updated", item)
}

func (h *Handler) PatchStatus(c *fiber.Ctx) error {
	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return response.Fail(c, fiber.StatusBadRequest, "Invalid id")
	}
	var in StatusInput
	if err := c.BodyParser(&in); err != nil {
		return response.Fail(c, fiber.StatusBadRequest, "Invalid request body")
	}
	item, err := h.svc.PatchStatus(c.Context(), id, in)
	if err != nil {
		return mapErr(c, err)
	}
	return response.OK(c, "Signal status updated", item)
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
	router.Get("/signals", authMW, verifiedMW, h.List)
	router.Get("/signals/:id", authMW, verifiedMW, h.Get)

	admin := router.Group("/admin", authMW, adminMW)
	admin.Get("/signals", h.List)
	admin.Post("/signals", h.Create)
	admin.Put("/signals/:id", h.Update)
	admin.Patch("/signals/:id/status", h.PatchStatus)
}
