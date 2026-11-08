package storage

import (
	"context"
	"io"
)

type ObjectInfo struct {
	Key         string `json:"key"`
	Size        int64  `json:"size"`
	ContentType string `json:"content_type"`
	URL         string `json:"url"`
}

// ObjectStorage abstracts local disk vs Cloudflare R2 (or similar).
// Domain services must depend on this interface only.
type ObjectStorage interface {
	Upload(ctx context.Context, key string, r io.Reader, size int64, contentType string) (ObjectInfo, error)
	Delete(ctx context.Context, key string) error
	URL(key string) string
	Exists(ctx context.Context, key string) (bool, error)
}
