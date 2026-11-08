package signal

import (
	"context"
	"errors"
	"strconv"
	"strings"
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

var ErrNotFound = errors.New("not found")
var ErrValidation = errors.New("validation failed")

type Repository interface {
	List(ctx context.Context, status string, page, perPage int) ([]Signal, int64, error)
	Find(ctx context.Context, id uuid.UUID) (*Signal, error)
	Create(ctx context.Context, s *Signal) error
	Update(ctx context.Context, s *Signal) error
}

type gormRepository struct{ db *gorm.DB }

func NewRepository(db *gorm.DB) Repository { return &gormRepository{db: db} }

func (r *gormRepository) List(ctx context.Context, status string, page, perPage int) ([]Signal, int64, error) {
	if page < 1 {
		page = 1
	}
	if perPage < 1 || perPage > 100 {
		perPage = 20
	}
	q := r.db.WithContext(ctx).Model(&Signal{})
	if status != "" {
		q = q.Where("status = ?", status)
	}
	var total int64
	if err := q.Count(&total).Error; err != nil {
		return nil, 0, err
	}
	var items []Signal
	err := q.Order("published_at desc").Offset((page - 1) * perPage).Limit(perPage).Find(&items).Error
	return items, total, err
}

func (r *gormRepository) Find(ctx context.Context, id uuid.UUID) (*Signal, error) {
	var s Signal
	err := r.db.WithContext(ctx).First(&s, "id = ?", id).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, ErrNotFound
	}
	return &s, err
}

func (r *gormRepository) Create(ctx context.Context, s *Signal) error {
	return r.db.WithContext(ctx).Create(s).Error
}

func (r *gormRepository) Update(ctx context.Context, s *Signal) error {
	return r.db.WithContext(ctx).Save(s).Error
}

type Input struct {
	Pair      string   `json:"pair"`
	Direction string   `json:"direction"`
	Entry     float64  `json:"entry"`
	SL        *float64 `json:"sl"`
	TP        *float64 `json:"tp"`
	Status    string   `json:"status"`
	Result    *string  `json:"result"`
	Analysis  *string  `json:"analysis"`
	ChartKey  *string  `json:"chart_key"`
}

type StatusInput struct {
	Status string  `json:"status"`
	Result *string `json:"result"`
}

type Service interface {
	List(ctx context.Context, status string, page, perPage int) ([]Signal, int64, error)
	Get(ctx context.Context, id uuid.UUID) (*Signal, error)
	Create(ctx context.Context, authorID uuid.UUID, in Input) (*Signal, error)
	Update(ctx context.Context, id uuid.UUID, in Input) (*Signal, error)
	PatchStatus(ctx context.Context, id uuid.UUID, in StatusInput) (*Signal, error)
	SeedDemo(ctx context.Context, authorID uuid.UUID) error
}

type service struct{ repo Repository }

func NewService(repo Repository) Service { return &service{repo: repo} }

func (s *service) List(ctx context.Context, status string, page, perPage int) ([]Signal, int64, error) {
	return s.repo.List(ctx, status, page, perPage)
}

func (s *service) Get(ctx context.Context, id uuid.UUID) (*Signal, error) {
	return s.repo.Find(ctx, id)
}

func (s *service) Create(ctx context.Context, authorID uuid.UUID, in Input) (*Signal, error) {
	item, err := build(authorID, nil, in)
	if err != nil {
		return nil, err
	}
	if err := s.repo.Create(ctx, item); err != nil {
		return nil, err
	}
	return item, nil
}

func (s *service) Update(ctx context.Context, id uuid.UUID, in Input) (*Signal, error) {
	existing, err := s.repo.Find(ctx, id)
	if err != nil {
		return nil, err
	}
	item, err := build(existing.CreatedBy, existing, in)
	if err != nil {
		return nil, err
	}
	item.ID = existing.ID
	item.PublishedAt = existing.PublishedAt
	item.CreatedAt = existing.CreatedAt
	if err := s.repo.Update(ctx, item); err != nil {
		return nil, err
	}
	return item, nil
}

func (s *service) PatchStatus(ctx context.Context, id uuid.UUID, in StatusInput) (*Signal, error) {
	item, err := s.repo.Find(ctx, id)
	if err != nil {
		return nil, err
	}
	status := strings.ToLower(strings.TrimSpace(in.Status))
	if status != StatusActive && status != StatusClosed && status != StatusCancelled {
		return nil, ErrValidation
	}
	item.Status = status
	if in.Result != nil {
		r := strings.ToLower(strings.TrimSpace(*in.Result))
		if r != "" && r != ResultWin && r != ResultLoss && r != ResultBE {
			return nil, ErrValidation
		}
		if r == "" {
			item.Result = nil
		} else {
			item.Result = &r
		}
	}
	if err := s.repo.Update(ctx, item); err != nil {
		return nil, err
	}
	return item, nil
}

func (s *service) SeedDemo(ctx context.Context, authorID uuid.UUID) error {
	existing, _, err := s.repo.List(ctx, "", 1, 50)
	if err != nil {
		return err
	}
	seen := map[string]bool{}
	for _, it := range existing {
		key := it.Pair + "|" + it.Direction + "|" + formatEntry(it.Entry)
		seen[key] = true
	}

	type seedSig struct {
		Pair, Dir, Analysis string
		Entry, SL, TP       float64
		Status, Result      string
		HoursAgo            int
	}
	seeds := []seedSig{
		{"XAUUSD", DirectionBuy, "Liquidity sweep then continuation. Invalidation below SL.", 2335.5, 2310, 2360, StatusActive, "", 2},
		{"EURUSD", DirectionSell, "Rejection from HTF supply. Target prior London low; cancel above entry wick high.", 1.0842, 1.0875, 1.0780, StatusActive, "", 5},
		{"GBPUSD", DirectionBuy, "Discount reclaim after Asia sweep. Hold only while above mid-range.", 1.2650, 1.2595, 1.2740, StatusActive, "", 8},
		{"USDJPY", DirectionSell, "Failed breakout into NY. Partial at mid; trail remainder.", 157.80, 158.40, 156.50, StatusActive, "", 14},
		{"NAS100", DirectionBuy, "Open drive continuation after equal lows sweep. Desk bias risk-on.", 19850, 19680, 20120, StatusClosed, ResultWin, 36},
		{"XAUUSD", DirectionSell, "Premium fade into resistance. Closed at BE after news spike.", 2412.0, 2428, 2385, StatusClosed, ResultBE, 72},
	}

	now := time.Now().UTC()
	for _, row := range seeds {
		key := row.Pair + "|" + row.Dir + "|" + formatEntry(row.Entry)
		if seen[key] {
			continue
		}
		sl, tp := row.SL, row.TP
		analysis := row.Analysis
		sig := &Signal{
			ID: uuid.New(), Pair: row.Pair, Direction: row.Dir, Entry: row.Entry,
			SL: &sl, TP: &tp, Status: row.Status, Analysis: &analysis,
			PublishedAt: now.Add(-time.Duration(row.HoursAgo) * time.Hour), CreatedBy: authorID,
		}
		if row.Result != "" {
			r := row.Result
			sig.Result = &r
		}
		if err := s.repo.Create(ctx, sig); err != nil {
			return err
		}
		seen[key] = true
	}
	return nil
}

func formatEntry(v float64) string {
	return strconv.FormatFloat(v, 'f', 4, 64)
}

func build(authorID uuid.UUID, existing *Signal, in Input) (*Signal, error) {
	pair := strings.ToUpper(strings.TrimSpace(in.Pair))
	dir := strings.ToLower(strings.TrimSpace(in.Direction))
	if pair == "" || (dir != DirectionBuy && dir != DirectionSell) || in.Entry == 0 {
		return nil, ErrValidation
	}
	status := strings.ToLower(strings.TrimSpace(in.Status))
	if status == "" {
		status = StatusActive
	}
	if status != StatusActive && status != StatusClosed && status != StatusCancelled {
		return nil, ErrValidation
	}
	item := &Signal{
		ID: uuid.New(), Pair: pair, Direction: dir, Entry: in.Entry,
		SL: in.SL, TP: in.TP, Status: status, Result: in.Result,
		Analysis: in.Analysis, ChartKey: in.ChartKey,
		PublishedAt: time.Now().UTC(), CreatedBy: authorID,
	}
	if existing != nil {
		item.ID = existing.ID
	}
	return item, nil
}
