package verification

import (
	"context"
	"errors"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

var ErrNotFound = errors.New("verification request not found")

type Repository interface {
	Create(ctx context.Context, req *VerificationRequest) error
	Update(ctx context.Context, req *VerificationRequest) error
	FindByID(ctx context.Context, id uuid.UUID) (*VerificationRequest, error)
	LatestByUser(ctx context.Context, userID uuid.UUID) (*VerificationRequest, error)
	ListByUser(ctx context.Context, userID uuid.UUID) ([]VerificationRequest, error)
	List(ctx context.Context, status string, page, perPage int) ([]VerificationRequest, int64, error)
}

type gormRepository struct {
	db *gorm.DB
}

func NewRepository(db *gorm.DB) Repository {
	return &gormRepository{db: db}
}

func (r *gormRepository) Create(ctx context.Context, req *VerificationRequest) error {
	return r.db.WithContext(ctx).Create(req).Error
}

func (r *gormRepository) Update(ctx context.Context, req *VerificationRequest) error {
	return r.db.WithContext(ctx).Save(req).Error
}

func (r *gormRepository) FindByID(ctx context.Context, id uuid.UUID) (*VerificationRequest, error) {
	var req VerificationRequest
	err := r.db.WithContext(ctx).First(&req, "id = ?", id).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, ErrNotFound
	}
	return &req, err
}

func (r *gormRepository) LatestByUser(ctx context.Context, userID uuid.UUID) (*VerificationRequest, error) {
	var req VerificationRequest
	err := r.db.WithContext(ctx).Where("user_id = ?", userID).Order("created_at desc").First(&req).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, ErrNotFound
	}
	return &req, err
}

func (r *gormRepository) ListByUser(ctx context.Context, userID uuid.UUID) ([]VerificationRequest, error) {
	var items []VerificationRequest
	err := r.db.WithContext(ctx).Where("user_id = ?", userID).Order("created_at desc").Find(&items).Error
	return items, err
}

func (r *gormRepository) List(ctx context.Context, status string, page, perPage int) ([]VerificationRequest, int64, error) {
	if page < 1 {
		page = 1
	}
	if perPage < 1 || perPage > 100 {
		perPage = 20
	}
	q := r.db.WithContext(ctx).Model(&VerificationRequest{})
	if status != "" {
		q = q.Where("status = ?", status)
	}
	var total int64
	if err := q.Count(&total).Error; err != nil {
		return nil, 0, err
	}
	var items []VerificationRequest
	err := q.Order("created_at desc").Offset((page - 1) * perPage).Limit(perPage).Find(&items).Error
	return items, total, err
}
