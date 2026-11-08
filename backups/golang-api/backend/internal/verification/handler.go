package verification

import (
	"errors"
	"strconv"

	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
	"github.com/ib-community/api/internal/auth"
	"github.com/ib-community/api/pkg/response"
)

type Handler struct {
	svc Service
}

func NewHandler(svc Service) *Handler {
	return &Handler{svc: svc}
}

func (h *Handler) Mine(c *fiber.Ctx) error {
	uid := c.Locals("user_id").(uuid.UUID)
	data, err := h.svc.Mine(c.Context(), uid)
	if err != nil {
		return mapErr(c, err)
	}
	return response.OK(c, "OK", data)
}

func (h *Handler) Resubmit(c *fiber.Ctx) error {
	uid := c.Locals("user_id").(uuid.UUID)
	if err := h.svc.ResubmitHint(c.Context(), uid); err != nil {
		return mapErr(c, err)
	}
	return response.OK(c, "Ready to resubmit MT5 details", nil)
}

func (h *Handler) AdminList(c *fiber.Ctx) error {
	page, _ := strconv.Atoi(c.Query("page", "1"))
	perPage, _ := strconv.Atoi(c.Query("per_page", "20"))
	status := c.Query("status", "")
	items, total, err := h.svc.AdminList(c.Context(), status, page, perPage)
	if err != nil {
		return mapErr(c, err)
	}
	totalPages := int(total) / perPage
	if int(total)%perPage != 0 {
		totalPages++
	}
	return response.Paginated(c, "OK", items, response.Meta{
		Page: page, PerPage: perPage, Total: total, TotalPages: totalPages,
	})
}

func (h *Handler) AdminGet(c *fiber.Ctx) error {
	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return response.Fail(c, fiber.StatusBadRequest, "Invalid id")
	}
	req, user, err := h.svc.AdminGet(c.Context(), id)
	if err != nil {
		return mapErr(c, err)
	}
	return response.OK(c, "OK", fiber.Map{
		"request": req,
		"user": fiber.Map{
			"id":     user.ID,
			"email":  user.Email,
			"status": user.Status,
			"profile": user.Profile,
		},
	})
}

func (h *Handler) Approve(c *fiber.Ctx) error {
	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return response.Fail(c, fiber.StatusBadRequest, "Invalid id")
	}
	adminID := c.Locals("user_id").(uuid.UUID)
	if err := h.svc.Approve(c.Context(), id, adminID); err != nil {
		return mapErr(c, err)
	}
	return response.OK(c, "Verification approved", nil)
}

func (h *Handler) Reject(c *fiber.Ctx) error {
	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return response.Fail(c, fiber.StatusBadRequest, "Invalid id")
	}
	var body struct {
		Reason string `json:"reason"`
	}
	if err := c.BodyParser(&body); err != nil {
		return response.Fail(c, fiber.StatusBadRequest, "Invalid request body")
	}
	adminID := c.Locals("user_id").(uuid.UUID)
	if err := h.svc.Reject(c.Context(), id, adminID, body.Reason); err != nil {
		return mapErr(c, err)
	}
	return response.OK(c, "Verification rejected", nil)
}

func (h *Handler) LockUser(c *fiber.Ctx) error {
	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return response.Fail(c, fiber.StatusBadRequest, "Invalid id")
	}
	adminID := c.Locals("user_id").(uuid.UUID)
	if err := h.svc.LockUser(c.Context(), id, adminID); err != nil {
		return mapErr(c, err)
	}
	return response.OK(c, "User locked", nil)
}

func (h *Handler) UnlockUser(c *fiber.Ctx) error {
	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return response.Fail(c, fiber.StatusBadRequest, "Invalid id")
	}
	adminID := c.Locals("user_id").(uuid.UUID)
	if err := h.svc.UnlockUser(c.Context(), id, adminID); err != nil {
		return mapErr(c, err)
	}
	return response.OK(c, "User unlocked", nil)
}

func mapErr(c *fiber.Ctx, err error) error {
	switch {
	case errors.Is(err, ErrNotFound), errors.Is(err, auth.ErrNotFound):
		return response.Fail(c, fiber.StatusNotFound, "Not found")
	case errors.Is(err, ErrInvalidInput):
		return response.Fail(c, fiber.StatusUnprocessableEntity, "Invalid input")
	case errors.Is(err, ErrWrongState):
		return response.Fail(c, fiber.StatusConflict, err.Error())
	default:
		return response.Fail(c, fiber.StatusInternalServerError, "Internal server error")
	}
}

func RegisterRoutes(router fiber.Router, h *Handler, authMW, adminMW fiber.Handler) {
	member := router.Group("/verifications", authMW)
	member.Get("/me", h.Mine)
	member.Post("/resubmit", h.Resubmit)

	admin := router.Group("/admin", authMW, adminMW)
	admin.Get("/verifications", h.AdminList)
	admin.Get("/verifications/:id", h.AdminGet)
	admin.Post("/verifications/:id/approve", h.Approve)
	admin.Post("/verifications/:id/reject", h.Reject)
	admin.Post("/users/:id/lock", h.LockUser)
	admin.Post("/users/:id/unlock", h.UnlockUser)
}
