package content

import (
	"errors"
	"strconv"

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

func (h *Handler) ListCategories(c *fiber.Ctx) error {
	viewer := ViewerFromLocals(c.Locals("user_id"), c.Locals("role"), c.Locals("status"))
	items, err := h.svc.ListCategories(c.Context(), c.Query("module"), viewer.IsAdmin)
	if err != nil {
		return mapErr(c, err)
	}
	return response.OK(c, "OK", items)
}

func (h *Handler) AdminCreateCategory(c *fiber.Ctx) error {
	var in CategoryInput
	if err := c.BodyParser(&in); err != nil {
		return response.Fail(c, fiber.StatusBadRequest, "Invalid request body")
	}
	item, err := h.svc.CreateCategory(c.Context(), in)
	if err != nil {
		return mapErr(c, err)
	}
	return response.Created(c, "Category created", item)
}

func (h *Handler) AdminUpdateCategory(c *fiber.Ctx) error {
	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return response.Fail(c, fiber.StatusBadRequest, "Invalid id")
	}
	var in CategoryInput
	if err := c.BodyParser(&in); err != nil {
		return response.Fail(c, fiber.StatusBadRequest, "Invalid request body")
	}
	item, err := h.svc.UpdateCategory(c.Context(), id, in)
	if err != nil {
		return mapErr(c, err)
	}
	return response.OK(c, "Category updated", item)
}

func (h *Handler) AdminDeleteCategory(c *fiber.Ctx) error {
	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return response.Fail(c, fiber.StatusBadRequest, "Invalid id")
	}
	if err := h.svc.DeleteCategory(c.Context(), id); err != nil {
		return mapErr(c, err)
	}
	return response.OK(c, "Category deleted", nil)
}

func (h *Handler) ListContents(c *fiber.Ctx) error {
	viewer := ViewerFromLocals(c.Locals("user_id"), c.Locals("role"), c.Locals("status"))
	page, _ := strconv.Atoi(c.Query("page", "1"))
	perPage, _ := strconv.Atoi(c.Query("per_page", "20"))
	f := ListFilter{
		Module:     c.Query("module"),
		Type:       c.Query("type"),
		CategoryID: c.Query("category_id"),
		Query:      c.Query("q"),
		Status:     c.Query("status"),
		Page:       page,
		PerPage:    perPage,
	}
	items, total, err := h.svc.ListContents(c.Context(), f, viewer)
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

func (h *Handler) GetBySlug(c *fiber.Ctx) error {
	viewer := ViewerFromLocals(c.Locals("user_id"), c.Locals("role"), c.Locals("status"))
	item, err := h.svc.GetBySlug(c.Context(), c.Params("slug"), viewer)
	if err != nil {
		return mapErr(c, err)
	}
	return response.OK(c, "OK", item)
}

func (h *Handler) Continue(c *fiber.Ctx) error {
	uid := c.Locals("user_id").(uuid.UUID)
	items, err := h.svc.Continue(c.Context(), uid)
	if err != nil {
		return mapErr(c, err)
	}
	return response.OK(c, "OK", items)
}

func (h *Handler) AdminCreateContent(c *fiber.Ctx) error {
	uid := c.Locals("user_id").(uuid.UUID)
	var in ContentInput
	if err := c.BodyParser(&in); err != nil {
		return response.Fail(c, fiber.StatusBadRequest, "Invalid request body")
	}
	item, err := h.svc.CreateContent(c.Context(), uid, in)
	if err != nil {
		return mapErr(c, err)
	}
	return response.Created(c, "Content created", item)
}

func (h *Handler) AdminUpdateContent(c *fiber.Ctx) error {
	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return response.Fail(c, fiber.StatusBadRequest, "Invalid id")
	}
	var in ContentInput
	if err := c.BodyParser(&in); err != nil {
		return response.Fail(c, fiber.StatusBadRequest, "Invalid request body")
	}
	item, err := h.svc.UpdateContent(c.Context(), id, in)
	if err != nil {
		return mapErr(c, err)
	}
	return response.OK(c, "Content updated", item)
}

func (h *Handler) AdminDeleteContent(c *fiber.Ctx) error {
	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return response.Fail(c, fiber.StatusBadRequest, "Invalid id")
	}
	if err := h.svc.DeleteContent(c.Context(), id); err != nil {
		return mapErr(c, err)
	}
	return response.OK(c, "Content deleted", nil)
}

func (h *Handler) AdminPublishContent(c *fiber.Ctx) error {
	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return response.Fail(c, fiber.StatusBadRequest, "Invalid id")
	}
	item, err := h.svc.PublishContent(c.Context(), id)
	if err != nil {
		return mapErr(c, err)
	}
	return response.OK(c, "Content published", item)
}

func (h *Handler) ListBookmarks(c *fiber.Ctx) error {
	uid := c.Locals("user_id").(uuid.UUID)
	items, err := h.svc.ListBookmarks(c.Context(), uid)
	if err != nil {
		return mapErr(c, err)
	}
	return response.OK(c, "OK", items)
}

func (h *Handler) AddBookmark(c *fiber.Ctx) error {
	uid := c.Locals("user_id").(uuid.UUID)
	var body struct {
		ContentID string `json:"content_id"`
	}
	if err := c.BodyParser(&body); err != nil {
		return response.Fail(c, fiber.StatusBadRequest, "Invalid request body")
	}
	cid, err := uuid.Parse(body.ContentID)
	if err != nil {
		return response.Fail(c, fiber.StatusBadRequest, "Invalid content_id")
	}
	if err := h.svc.AddBookmark(c.Context(), uid, cid); err != nil {
		return mapErr(c, err)
	}
	return response.Created(c, "Bookmarked", nil)
}

func (h *Handler) RemoveBookmark(c *fiber.Ctx) error {
	uid := c.Locals("user_id").(uuid.UUID)
	cid, err := uuid.Parse(c.Params("contentId"))
	if err != nil {
		return response.Fail(c, fiber.StatusBadRequest, "Invalid content id")
	}
	if err := h.svc.RemoveBookmark(c.Context(), uid, cid); err != nil {
		return mapErr(c, err)
	}
	return response.OK(c, "Bookmark removed", nil)
}

func (h *Handler) UpsertHistory(c *fiber.Ctx) error {
	uid := c.Locals("user_id").(uuid.UUID)
	cid, err := uuid.Parse(c.Params("contentId"))
	if err != nil {
		return response.Fail(c, fiber.StatusBadRequest, "Invalid content id")
	}
	var in HistoryInput
	if err := c.BodyParser(&in); err != nil {
		return response.Fail(c, fiber.StatusBadRequest, "Invalid request body")
	}
	if err := h.svc.UpsertHistory(c.Context(), uid, cid, in); err != nil {
		return mapErr(c, err)
	}
	return response.OK(c, "History saved", nil)
}

func (h *Handler) ListHistory(c *fiber.Ctx) error {
	uid := c.Locals("user_id").(uuid.UUID)
	items, err := h.svc.ListHistory(c.Context(), uid)
	if err != nil {
		return mapErr(c, err)
	}
	return response.OK(c, "OK", items)
}

func mapErr(c *fiber.Ctx, err error) error {
	switch {
	case errors.Is(err, ErrNotFound):
		return response.Fail(c, fiber.StatusNotFound, "Not found")
	case errors.Is(err, ErrValidation):
		return response.Fail(c, fiber.StatusUnprocessableEntity, "Validation failed")
	case errors.Is(err, ErrConflict):
		return response.Fail(c, fiber.StatusConflict, "Slug already exists")
	case errors.Is(err, ErrForbidden):
		return response.Fail(c, fiber.StatusForbidden, "Forbidden")
	default:
		return response.Fail(c, fiber.StatusInternalServerError, "Internal server error")
	}
}

func RegisterRoutes(router fiber.Router, h *Handler, optionalAuth, authMW, verifiedMW, adminMW fiber.Handler) {
	router.Get("/categories", optionalAuth, h.ListCategories)
	router.Get("/contents", optionalAuth, h.ListContents)
	router.Get("/contents/continue", authMW, verifiedMW, h.Continue)
	router.Get("/contents/:slug", optionalAuth, h.GetBySlug)

	router.Get("/bookmarks", authMW, verifiedMW, h.ListBookmarks)
	router.Post("/bookmarks", authMW, verifiedMW, h.AddBookmark)
	router.Delete("/bookmarks/:contentId", authMW, verifiedMW, h.RemoveBookmark)
	router.Post("/history/:contentId", authMW, verifiedMW, h.UpsertHistory)
	router.Get("/history", authMW, verifiedMW, h.ListHistory)

	admin := router.Group("/admin", authMW, adminMW)
	admin.Get("/categories", h.ListCategories)
	admin.Post("/categories", h.AdminCreateCategory)
	admin.Put("/categories/:id", h.AdminUpdateCategory)
	admin.Delete("/categories/:id", h.AdminDeleteCategory)
	admin.Get("/contents", h.ListContents)
	admin.Post("/contents", h.AdminCreateContent)
	admin.Put("/contents/:id", h.AdminUpdateContent)
	admin.Delete("/contents/:id", h.AdminDeleteContent)
	admin.Post("/contents/:id/publish", h.AdminPublishContent)
}
