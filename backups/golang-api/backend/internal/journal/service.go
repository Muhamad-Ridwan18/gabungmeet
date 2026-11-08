package journal

import (
	"context"
	"errors"
	"strings"
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

var ErrNotFound = errors.New("not found")
var ErrValidation = errors.New("validation failed")
var ErrForbidden = errors.New("forbidden")

type Repository interface {
	ListByUser(ctx context.Context, userID uuid.UUID, page, perPage int) ([]TradingJournal, int64, error)
	ListAll(ctx context.Context, page, perPage int) ([]TradingJournal, int64, error)
	Find(ctx context.Context, id uuid.UUID) (*TradingJournal, error)
	Create(ctx context.Context, j *TradingJournal) error
	Update(ctx context.Context, j *TradingJournal) error
	Delete(ctx context.Context, id uuid.UUID) error
}

type gormRepository struct{ db *gorm.DB }

func NewRepository(db *gorm.DB) Repository { return &gormRepository{db: db} }

func (r *gormRepository) ListByUser(ctx context.Context, userID uuid.UUID, page, perPage int) ([]TradingJournal, int64, error) {
	if page < 1 {
		page = 1
	}
	if perPage < 1 || perPage > 100 {
		perPage = 20
	}
	q := r.db.WithContext(ctx).Model(&TradingJournal{}).Where("user_id = ?", userID)
	var total int64
	if err := q.Count(&total).Error; err != nil {
		return nil, 0, err
	}
	var items []TradingJournal
	err := q.Order("traded_at desc").Offset((page - 1) * perPage).Limit(perPage).Find(&items).Error
	return items, total, err
}

func (r *gormRepository) ListAll(ctx context.Context, page, perPage int) ([]TradingJournal, int64, error) {
	if page < 1 {
		page = 1
	}
	if perPage < 1 || perPage > 100 {
		perPage = 20
	}
	q := r.db.WithContext(ctx).Model(&TradingJournal{})
	var total int64
	if err := q.Count(&total).Error; err != nil {
		return nil, 0, err
	}
	var items []TradingJournal
	err := q.Order("traded_at desc").Offset((page - 1) * perPage).Limit(perPage).Find(&items).Error
	return items, total, err
}

func (r *gormRepository) Find(ctx context.Context, id uuid.UUID) (*TradingJournal, error) {
	var j TradingJournal
	err := r.db.WithContext(ctx).First(&j, "id = ?", id).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, ErrNotFound
	}
	return &j, err
}

func (r *gormRepository) Create(ctx context.Context, j *TradingJournal) error {
	return r.db.WithContext(ctx).Create(j).Error
}

func (r *gormRepository) Update(ctx context.Context, j *TradingJournal) error {
	return r.db.WithContext(ctx).Save(j).Error
}

func (r *gormRepository) Delete(ctx context.Context, id uuid.UUID) error {
	return r.db.WithContext(ctx).Delete(&TradingJournal{}, "id = ?", id).Error
}

type Input struct {
	TradedAt      string   `json:"traded_at"`
	Pair          string   `json:"pair"`
	Direction     string   `json:"direction"`
	Entry         *float64 `json:"entry"`
	Exit          *float64 `json:"exit"`
	SL            *float64 `json:"sl"`
	TP            *float64 `json:"tp"`
	Result        *string  `json:"result"`
	RR            *float64 `json:"rr"`
	Notes         *string  `json:"notes"`
	Emotion       *string  `json:"emotion"`
	ScreenshotKey *string  `json:"screenshot_key"`
}

type Service interface {
	ListMine(ctx context.Context, userID uuid.UUID, page, perPage int) ([]TradingJournal, int64, error)
	ListAdmin(ctx context.Context, page, perPage int) ([]TradingJournal, int64, error)
	GetMine(ctx context.Context, userID, id uuid.UUID) (*TradingJournal, error)
	Create(ctx context.Context, userID uuid.UUID, in Input) (*TradingJournal, error)
	Update(ctx context.Context, userID, id uuid.UUID, in Input) (*TradingJournal, error)
	Delete(ctx context.Context, userID, id uuid.UUID) error
}

type service struct{ repo Repository }

func NewService(repo Repository) Service { return &service{repo: repo} }

func (s *service) ListMine(ctx context.Context, userID uuid.UUID, page, perPage int) ([]TradingJournal, int64, error) {
	return s.repo.ListByUser(ctx, userID, page, perPage)
}

func (s *service) ListAdmin(ctx context.Context, page, perPage int) ([]TradingJournal, int64, error) {
	return s.repo.ListAll(ctx, page, perPage)
}

func (s *service) GetMine(ctx context.Context, userID, id uuid.UUID) (*TradingJournal, error) {
	j, err := s.repo.Find(ctx, id)
	if err != nil {
		return nil, err
	}
	if j.UserID != userID {
		return nil, ErrForbidden
	}
	return j, nil
}

func (s *service) Create(ctx context.Context, userID uuid.UUID, in Input) (*TradingJournal, error) {
	j, err := build(userID, in)
	if err != nil {
		return nil, err
	}
	if err := s.repo.Create(ctx, j); err != nil {
		return nil, err
	}
	return j, nil
}

func (s *service) Update(ctx context.Context, userID, id uuid.UUID, in Input) (*TradingJournal, error) {
	existing, err := s.GetMine(ctx, userID, id)
	if err != nil {
		return nil, err
	}
	j, err := build(userID, in)
	if err != nil {
		return nil, err
	}
	j.ID = existing.ID
	j.CreatedAt = existing.CreatedAt
	if err := s.repo.Update(ctx, j); err != nil {
		return nil, err
	}
	return j, nil
}

func (s *service) Delete(ctx context.Context, userID, id uuid.UUID) error {
	if _, err := s.GetMine(ctx, userID, id); err != nil {
		return err
	}
	return s.repo.Delete(ctx, id)
}

func build(userID uuid.UUID, in Input) (*TradingJournal, error) {
	pair := strings.ToUpper(strings.TrimSpace(in.Pair))
	dir := strings.ToLower(strings.TrimSpace(in.Direction))
	if pair == "" || (dir != "buy" && dir != "sell") {
		return nil, ErrValidation
	}
	tradedAt := time.Now().UTC()
	if strings.TrimSpace(in.TradedAt) != "" {
		t, err := time.Parse(time.RFC3339, strings.TrimSpace(in.TradedAt))
		if err != nil {
			return nil, ErrValidation
		}
		tradedAt = t.UTC()
	}
	return &TradingJournal{
		ID: uuid.New(), UserID: userID, TradedAt: tradedAt, Pair: pair, Direction: dir,
		Entry: in.Entry, Exit: in.Exit, SL: in.SL, TP: in.TP, Result: in.Result,
		RR: in.RR, Notes: in.Notes, Emotion: in.Emotion, ScreenshotKey: in.ScreenshotKey,
	}, nil
}
