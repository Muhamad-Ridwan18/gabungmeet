package storage

import (
	"context"
	"fmt"
	"io"
	"os"
	"path/filepath"
	"strings"
)

type LocalStorage struct {
	root      string
	publicURL string
}

func NewLocalStorage(root, publicURL string) (*LocalStorage, error) {
	abs, err := filepath.Abs(root)
	if err != nil {
		return nil, err
	}
	if err := os.MkdirAll(abs, 0o755); err != nil {
		return nil, err
	}
	return &LocalStorage{root: abs, publicURL: strings.TrimRight(publicURL, "/")}, nil
}

func (s *LocalStorage) resolve(key string) (string, error) {
	key = strings.TrimPrefix(filepath.ToSlash(key), "/")
	if key == "" || strings.Contains(key, "..") {
		return "", fmt.Errorf("invalid storage key")
	}
	full := filepath.Clean(filepath.Join(s.root, filepath.FromSlash(key)))
	rootWithSep := s.root + string(os.PathSeparator)
	if full != s.root && !strings.HasPrefix(full, rootWithSep) {
		return "", fmt.Errorf("path escapes storage root")
	}
	return full, nil
}

func (s *LocalStorage) Upload(ctx context.Context, key string, r io.Reader, size int64, contentType string) (ObjectInfo, error) {
	_ = ctx
	_ = size

	full, err := s.resolve(key)
	if err != nil {
		return ObjectInfo{}, err
	}
	if err := os.MkdirAll(filepath.Dir(full), 0o755); err != nil {
		return ObjectInfo{}, err
	}

	f, err := os.Create(full)
	if err != nil {
		return ObjectInfo{}, err
	}
	defer f.Close()

	n, err := io.Copy(f, r)
	if err != nil {
		return ObjectInfo{}, err
	}

	key = strings.TrimPrefix(filepath.ToSlash(key), "/")
	return ObjectInfo{
		Key:         key,
		Size:        n,
		ContentType: contentType,
		URL:         s.URL(key),
	}, nil
}

func (s *LocalStorage) Delete(ctx context.Context, key string) error {
	_ = ctx
	full, err := s.resolve(key)
	if err != nil {
		return err
	}
	if err := os.Remove(full); err != nil && !os.IsNotExist(err) {
		return err
	}
	return nil
}

func (s *LocalStorage) URL(key string) string {
	key = strings.TrimPrefix(filepath.ToSlash(key), "/")
	return fmt.Sprintf("%s/%s", s.publicURL, key)
}

func (s *LocalStorage) Exists(ctx context.Context, key string) (bool, error) {
	_ = ctx
	full, err := s.resolve(key)
	if err != nil {
		return false, err
	}
	_, err = os.Stat(full)
	if err == nil {
		return true, nil
	}
	if os.IsNotExist(err) {
		return false, nil
	}
	return false, err
}

func (s *LocalStorage) Root() string {
	return s.root
}

var _ ObjectStorage = (*LocalStorage)(nil)
