package response

import (
	"github.com/gofiber/fiber/v2"
)

type Meta struct {
	Page       int   `json:"page,omitempty"`
	PerPage    int   `json:"per_page,omitempty"`
	Total      int64 `json:"total,omitempty"`
	TotalPages int   `json:"total_pages,omitempty"`
}

type FieldError struct {
	Field   string `json:"field"`
	Message string `json:"message"`
}

type Envelope struct {
	Success bool         `json:"success"`
	Message string       `json:"message"`
	Data    any          `json:"data"`
	Meta    *Meta        `json:"meta"`
	Errors  []FieldError `json:"errors"`
}

func OK(c *fiber.Ctx, message string, data any) error {
	return c.Status(fiber.StatusOK).JSON(Envelope{
		Success: true,
		Message: message,
		Data:    data,
		Meta:    nil,
		Errors:  nil,
	})
}

func Created(c *fiber.Ctx, message string, data any) error {
	return c.Status(fiber.StatusCreated).JSON(Envelope{
		Success: true,
		Message: message,
		Data:    data,
		Meta:    nil,
		Errors:  nil,
	})
}

func Paginated(c *fiber.Ctx, message string, data any, meta Meta) error {
	return c.Status(fiber.StatusOK).JSON(Envelope{
		Success: true,
		Message: message,
		Data:    data,
		Meta:    &meta,
		Errors:  nil,
	})
}

func Fail(c *fiber.Ctx, status int, message string, errs ...FieldError) error {
	var list []FieldError
	if len(errs) > 0 {
		list = errs
	}
	return c.Status(status).JSON(Envelope{
		Success: false,
		Message: message,
		Data:    nil,
		Meta:    nil,
		Errors:  list,
	})
}
