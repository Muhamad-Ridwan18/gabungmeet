package upload

import (
	"bytes"
	"fmt"
	"io"
	"net/http"
	"path/filepath"
	"strings"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
	"github.com/ib-community/api/pkg/response"
	"github.com/ib-community/api/pkg/storage"
)

type Handler struct {
	store storage.ObjectStorage
}

func NewHandler(store storage.ObjectStorage) *Handler {
	return &Handler{store: store}
}

var purposeLimits = map[string]struct {
	folder string
	max    int64
}{
	"proof":      {folder: "proofs", max: 10 * 1024 * 1024},
	"avatar":     {folder: "avatars", max: 2 * 1024 * 1024},
	"thumbnail":  {folder: "thumbnails", max: 5 * 1024 * 1024},
	"attachment": {folder: "attachments", max: 10 * 1024 * 1024},
	"temp":       {folder: "temp", max: 5 * 1024 * 1024},
}

var allowedMIME = map[string]string{
	"image/jpeg":      ".jpg",
	"image/png":       ".png",
	"image/webp":      ".webp",
	"application/pdf": ".pdf",
}

func (h *Handler) Upload(c *fiber.Ctx) error {
	purpose := c.Query("purpose", "temp")
	spec, ok := purposeLimits[purpose]
	if !ok {
		return response.Fail(c, fiber.StatusBadRequest, "Invalid upload purpose")
	}

	fileHeader, err := c.FormFile("file")
	if err != nil {
		return response.Fail(c, fiber.StatusBadRequest, "file is required")
	}
	if fileHeader.Size <= 0 || fileHeader.Size > spec.max {
		return response.Fail(c, fiber.StatusBadRequest, fmt.Sprintf("File too large (max %dMB)", spec.max/(1024*1024)))
	}

	ext := strings.ToLower(filepath.Ext(fileHeader.Filename))
	switch ext {
	case ".jpg", ".jpeg", ".png", ".webp", ".pdf":
	default:
		return response.Fail(c, fiber.StatusBadRequest, "Unsupported file type")
	}

	src, err := fileHeader.Open()
	if err != nil {
		return response.Fail(c, fiber.StatusInternalServerError, "Cannot read file")
	}
	defer src.Close()

	head := make([]byte, 512)
	n, _ := io.ReadFull(src, head)
	detected := http.DetectContentType(head[:n])
	// DetectContentType may return charset variants for some payloads; normalize.
	detected = strings.TrimSpace(strings.Split(detected, ";")[0])
	canonicalExt, mimeOK := allowedMIME[detected]
	if !mimeOK {
		// JPEG often detected as image/jpeg; some PDFs sniff as application/octet-stream — re-check ext for pdf magic.
		if !(ext == ".pdf" && n >= 4 && string(head[:4]) == "%PDF") {
			return response.Fail(c, fiber.StatusBadRequest, "File content does not match an allowed type")
		}
		detected = "application/pdf"
		canonicalExt = ".pdf"
	}
	if ext == ".jpeg" {
		ext = ".jpg"
	}
	if canonicalExt != "" && ext != canonicalExt && !(ext == ".jpg" && canonicalExt == ".jpg") {
		// Allow .jpg when sniffed jpeg
		if !(detected == "image/jpeg" && (ext == ".jpg" || ext == ".jpeg")) {
			return response.Fail(c, fiber.StatusBadRequest, "File extension does not match content")
		}
	}

	reader := io.MultiReader(bytes.NewReader(head[:n]), src)
	key := fmt.Sprintf("%s/%s_%d%s", spec.folder, uuid.NewString(), time.Now().Unix(), ext)
	info, err := h.store.Upload(c.Context(), key, reader, fileHeader.Size, detected)
	if err != nil {
		return response.Fail(c, fiber.StatusInternalServerError, "Upload failed")
	}

	return response.Created(c, "Uploaded", info)
}

func RegisterRoutes(router fiber.Router, h *Handler, authMW fiber.Handler) {
	router.Post("/uploads", authMW, h.Upload)
}
