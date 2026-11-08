package notification

import (
	"context"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type Repository interface {
	Create(ctx context.Context, n *Notification) error
	ListByUser(ctx context.Context, userID uuid.UUID, limit int) ([]Notification, error)
}

type gormRepository struct {
	db *gorm.DB
}

func NewRepository(db *gorm.DB) Repository {
	return &gormRepository{db: db}
}

func (r *gormRepository) Create(ctx context.Context, n *Notification) error {
	return r.db.WithContext(ctx).Create(n).Error
}

func (r *gormRepository) ListByUser(ctx context.Context, userID uuid.UUID, limit int) ([]Notification, error) {
	if limit <= 0 {
		limit = 20
	}
	var items []Notification
	err := r.db.WithContext(ctx).Where("user_id = ?", userID).Order("created_at desc").Limit(limit).Find(&items).Error
	return items, err
}

type Service interface {
	Notify(ctx context.Context, userID uuid.UUID, typ, title, body string, link *string) error
	ListMine(ctx context.Context, userID uuid.UUID) ([]Notification, error)
}

type service struct {
	repo Repository
}

func NewService(repo Repository) Service {
	return &service{repo: repo}
}

func (s *service) Notify(ctx context.Context, userID uuid.UUID, typ, title, body string, link *string) error {
	return s.repo.Create(ctx, &Notification{
		ID:     uuid.New(),
		UserID: userID,
		Type:   typ,
		Title:  title,
		Body:   body,
		Link:   link,
	})
}

func (s *service) ListMine(ctx context.Context, userID uuid.UUID) ([]Notification, error) {
	return s.repo.ListByUser(ctx, userID, 50)
}
