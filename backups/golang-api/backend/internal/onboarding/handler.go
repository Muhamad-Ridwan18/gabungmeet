package onboarding

import (
	"errors"

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

func (h *Handler) Get(c *fiber.Ctx) error {
	uid := c.Locals("user_id").(uuid.UUID)
	data, err := h.svc.Get(c.Context(), uid)
	if err != nil {
		return mapErr(c, err)
	}
	return response.OK(c, "OK", data)
}

func (h *Handler) Start(c *fiber.Ctx) error {
	uid := c.Locals("user_id").(uuid.UUID)
	data, err := h.svc.Start(c.Context(), uid)
	if err != nil {
		return mapErr(c, err)
	}
	return response.OK(c, "Membership verification started", data)
}

func (h *Handler) Step1(c *fiber.Ctx) error {
	uid := c.Locals("user_id").(uuid.UUID)
	data, err := h.svc.CompleteStep1(c.Context(), uid)
	if err != nil {
		return mapErr(c, err)
	}
	return response.OK(c, "Step 1 completed", data)
}

func (h *Handler) Step2(c *fiber.Ctx) error {
	uid := c.Locals("user_id").(uuid.UUID)
	data, err := h.svc.CompleteStep2(c.Context(), uid)
	if err != nil {
		return mapErr(c, err)
	}
	return response.OK(c, "Step 2 completed", data)
}

func (h *Handler) Step3(c *fiber.Ctx) error {
	uid := c.Locals("user_id").(uuid.UUID)
	var req Step3Request
	if err := c.BodyParser(&req); err != nil {
		return response.Fail(c, fiber.StatusBadRequest, "Invalid request body")
	}
	data, err := h.svc.SubmitStep3(c.Context(), uid, req)
	if err != nil {
		return mapErr(c, err)
	}
	return response.OK(c, "MT5 details submitted", data)
}

func (h *Handler) Step4(c *fiber.Ctx) error {
	uid := c.Locals("user_id").(uuid.UUID)
	var req Step4Request
	_ = c.BodyParser(&req)
	data, err := h.svc.CompleteStep4(c.Context(), uid, req)
	if err != nil {
		return mapErr(c, err)
	}
	return response.OK(c, "Step 4 completed", data)
}

func (h *Handler) Step5(c *fiber.Ctx) error {
	uid := c.Locals("user_id").(uuid.UUID)
	data, err := h.svc.CompleteStep5(c.Context(), uid)
	if err != nil {
		return mapErr(c, err)
	}
	return response.OK(c, "Submitted for verification", data)
}

func mapErr(c *fiber.Ctx, err error) error {
	switch {
	case errors.Is(err, ErrStepSkip):
		return response.Fail(c, fiber.StatusConflict, "Complete previous steps first")
	case errors.Is(err, ErrInvalidInput):
		return response.Fail(c, fiber.StatusUnprocessableEntity, "Invalid input")
	case errors.Is(err, ErrWrongStatus):
		return response.Fail(c, fiber.StatusForbidden, "Account status does not allow this action")
	case errors.Is(err, ErrAlreadyDone):
		return response.Fail(c, fiber.StatusConflict, "Already verified")
	case errors.Is(err, auth.ErrNotFound):
		return response.Fail(c, fiber.StatusNotFound, "Not found")
	default:
		return response.Fail(c, fiber.StatusInternalServerError, "Internal server error")
	}
}

func RegisterRoutes(router fiber.Router, h *Handler, authMW fiber.Handler) {
	g := router.Group("/onboarding", authMW)
	g.Get("/", h.Get)
	g.Post("/start", h.Start)
	g.Post("/step/1/complete", h.Step1)
	g.Post("/step/2/complete", h.Step2)
	g.Post("/step/3", h.Step3)
	g.Post("/step/4", h.Step4)
	g.Post("/step/5/complete", h.Step5)
}
