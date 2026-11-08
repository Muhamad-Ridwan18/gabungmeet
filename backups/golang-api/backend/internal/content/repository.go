package content

import (
	"context"
	"errors"
	"strings"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

var ErrNotFound = errors.New("not found")

type ListFilter struct {
	Module     string
	Type       string
	CategoryID string
	Query      string
	Status     string
	Page       int
	PerPage    int
}

type Repository interface {
	ListCategories(ctx context.Context, module string, activeOnly bool) ([]Category, error)
	FindCategory(ctx context.Context, id uuid.UUID) (*Category, error)
	CreateCategory(ctx context.Context, c *Category) error
	UpdateCategory(ctx context.Context, c *Category) error
	DeleteCategory(ctx context.Context, id uuid.UUID) error

	ListContents(ctx context.Context, f ListFilter) ([]Content, int64, error)
	FindContentByID(ctx context.Context, id uuid.UUID) (*Content, error)
	FindContentBySlug(ctx context.Context, slug string) (*Content, error)
	CreateContent(ctx context.Context, c *Content) error
	UpdateContent(ctx context.Context, c *Content) error
	DeleteContent(ctx context.Context, id uuid.UUID) error
	SlugExists(ctx context.Context, slug string, excludeID *uuid.UUID) (bool, error)

	ListBookmarks(ctx context.Context, userID uuid.UUID) ([]Bookmark, error)
	AddBookmark(ctx context.Context, b *Bookmark) error
	RemoveBookmark(ctx context.Context, userID, contentID uuid.UUID) error
	IsBookmarked(ctx context.Context, userID, contentID uuid.UUID) (bool, error)

	UpsertHistory(ctx context.Context, h *ViewHistory) error
	ListHistory(ctx context.Context, userID uuid.UUID, limit int) ([]ViewHistory, error)
	Continue(ctx context.Context, userID uuid.UUID, limit int) ([]ViewHistory, error)
}

type gormRepository struct {
	db *gorm.DB
}

func NewRepository(db *gorm.DB) Repository {
	return &gormRepository{db: db}
}

func (r *gormRepository) ListCategories(ctx context.Context, module string, activeOnly bool) ([]Category, error) {
	q := r.db.WithContext(ctx).Model(&Category{})
	if module != "" {
		q = q.Where("module = ?", module)
	}
	if activeOnly {
		q = q.Where("is_active = ?", true)
	}
	var items []Category
	err := q.Order("sort_order asc, name asc").Find(&items).Error
	return items, err
}

func (r *gormRepository) FindCategory(ctx context.Context, id uuid.UUID) (*Category, error) {
	var c Category
	err := r.db.WithContext(ctx).First(&c, "id = ?", id).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, ErrNotFound
	}
	return &c, err
}

func (r *gormRepository) CreateCategory(ctx context.Context, c *Category) error {
	return r.db.WithContext(ctx).Create(c).Error
}

func (r *gormRepository) UpdateCategory(ctx context.Context, c *Category) error {
	return r.db.WithContext(ctx).Save(c).Error
}

func (r *gormRepository) DeleteCategory(ctx context.Context, id uuid.UUID) error {
	return r.db.WithContext(ctx).Delete(&Category{}, "id = ?", id).Error
}

func (r *gormRepository) ListContents(ctx context.Context, f ListFilter) ([]Content, int64, error) {
	if f.Page < 1 {
		f.Page = 1
	}
	if f.PerPage < 1 || f.PerPage > 100 {
		f.PerPage = 20
	}
	q := r.db.WithContext(ctx).Model(&Content{})
	if f.Module != "" {
		q = q.Where("module = ?", f.Module)
	}
	if f.Type != "" {
		q = q.Where("type = ?", f.Type)
	}
	if f.CategoryID != "" {
		q = q.Where("category_id = ?", f.CategoryID)
	}
	if f.Status != "" {
		q = q.Where("status = ?", f.Status)
	}
	if f.Query != "" {
		like := "%" + strings.ToLower(f.Query) + "%"
		q = q.Where("LOWER(title) LIKE ? OR LOWER(COALESCE(excerpt,'')) LIKE ?", like, like)
	}
	var total int64
	if err := q.Count(&total).Error; err != nil {
		return nil, 0, err
	}
	var items []Content
	err := q.Preload("Category").
		Order("COALESCE(published_at, created_at) desc").
		Offset((f.Page - 1) * f.PerPage).
		Limit(f.PerPage).
		Find(&items).Error
	return items, total, err
}

func (r *gormRepository) FindContentByID(ctx context.Context, id uuid.UUID) (*Content, error) {
	var c Content
	err := r.db.WithContext(ctx).Preload("Category").First(&c, "id = ?", id).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, ErrNotFound
	}
	return &c, err
}

func (r *gormRepository) FindContentBySlug(ctx context.Context, slug string) (*Content, error) {
	var c Content
	err := r.db.WithContext(ctx).Preload("Category").Where("slug = ?", slug).First(&c).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, ErrNotFound
	}
	return &c, err
}

func (r *gormRepository) CreateContent(ctx context.Context, c *Content) error {
	return r.db.WithContext(ctx).Create(c).Error
}

func (r *gormRepository) UpdateContent(ctx context.Context, c *Content) error {
	return r.db.WithContext(ctx).Save(c).Error
}

func (r *gormRepository) DeleteContent(ctx context.Context, id uuid.UUID) error {
	return r.db.WithContext(ctx).Delete(&Content{}, "id = ?", id).Error
}

func (r *gormRepository) SlugExists(ctx context.Context, slug string, excludeID *uuid.UUID) (bool, error) {
	q := r.db.WithContext(ctx).Model(&Content{}).Where("slug = ?", slug)
	if excludeID != nil {
		q = q.Where("id <> ?", *excludeID)
	}
	var n int64
	err := q.Count(&n).Error
	return n > 0, err
}

func (r *gormRepository) ListBookmarks(ctx context.Context, userID uuid.UUID) ([]Bookmark, error) {
	var items []Bookmark
	err := r.db.WithContext(ctx).Preload("Content").Preload("Content.Category").
		Where("user_id = ?", userID).Order("created_at desc").Find(&items).Error
	return items, err
}

func (r *gormRepository) AddBookmark(ctx context.Context, b *Bookmark) error {
	return r.db.WithContext(ctx).Create(b).Error
}

func (r *gormRepository) RemoveBookmark(ctx context.Context, userID, contentID uuid.UUID) error {
	return r.db.WithContext(ctx).Where("user_id = ? AND content_id = ?", userID, contentID).Delete(&Bookmark{}).Error
}

func (r *gormRepository) IsBookmarked(ctx context.Context, userID, contentID uuid.UUID) (bool, error) {
	var n int64
	err := r.db.WithContext(ctx).Model(&Bookmark{}).Where("user_id = ? AND content_id = ?", userID, contentID).Count(&n).Error
	return n > 0, err
}

func (r *gormRepository) UpsertHistory(ctx context.Context, h *ViewHistory) error {
	var existing ViewHistory
	err := r.db.WithContext(ctx).Where("user_id = ? AND content_id = ?", h.UserID, h.ContentID).First(&existing).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return r.db.WithContext(ctx).Create(h).Error
	}
	if err != nil {
		return err
	}
	existing.ProgressPct = h.ProgressPct
	existing.LastPositionSec = h.LastPositionSec
	existing.Completed = h.Completed
	existing.LastViewedAt = h.LastViewedAt
	return r.db.WithContext(ctx).Save(&existing).Error
}

func (r *gormRepository) ListHistory(ctx context.Context, userID uuid.UUID, limit int) ([]ViewHistory, error) {
	if limit <= 0 {
		limit = 20
	}
	var items []ViewHistory
	err := r.db.WithContext(ctx).Preload("Content").Where("user_id = ?", userID).
		Order("last_viewed_at desc").Limit(limit).Find(&items).Error
	return items, err
}

func (r *gormRepository) Continue(ctx context.Context, userID uuid.UUID, limit int) ([]ViewHistory, error) {
	if limit <= 0 {
		limit = 10
	}
	var items []ViewHistory
	err := r.db.WithContext(ctx).Preload("Content").
		Where("user_id = ? AND completed = ? AND progress_pct > 0", userID, false).
		Order("last_viewed_at desc").Limit(limit).Find(&items).Error
	return items, err
}
