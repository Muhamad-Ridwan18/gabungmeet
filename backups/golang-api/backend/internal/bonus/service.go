package bonus

import (
	"context"
	"errors"
	"strings"

	"github.com/google/uuid"
	"github.com/ib-community/api/internal/settings"
	"github.com/ib-community/api/pkg/storage"
	"gorm.io/gorm"
)

var ErrNotFound = errors.New("not found")
var ErrValidation = errors.New("validation failed")

type Repository interface {
	List(ctx context.Context, activeOnly bool) ([]Bonus, error)
	Find(ctx context.Context, id uuid.UUID) (*Bonus, error)
	Create(ctx context.Context, b *Bonus) error
	Update(ctx context.Context, b *Bonus) error
	Delete(ctx context.Context, id uuid.UUID) error
}

type gormRepository struct{ db *gorm.DB }

func NewRepository(db *gorm.DB) Repository { return &gormRepository{db: db} }

func (r *gormRepository) List(ctx context.Context, activeOnly bool) ([]Bonus, error) {
	q := r.db.WithContext(ctx).Model(&Bonus{})
	if activeOnly {
		q = q.Where("is_active = ?", true)
	}
	var items []Bonus
	err := q.Order("sort_order asc, created_at desc").Find(&items).Error
	return items, err
}

func (r *gormRepository) Find(ctx context.Context, id uuid.UUID) (*Bonus, error) {
	var b Bonus
	err := r.db.WithContext(ctx).First(&b, "id = ?", id).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, ErrNotFound
	}
	return &b, err
}

func (r *gormRepository) Create(ctx context.Context, b *Bonus) error {
	return r.db.WithContext(ctx).Create(b).Error
}

func (r *gormRepository) Update(ctx context.Context, b *Bonus) error {
	return r.db.WithContext(ctx).Save(b).Error
}

func (r *gormRepository) Delete(ctx context.Context, id uuid.UUID) error {
	return r.db.WithContext(ctx).Delete(&Bonus{}, "id = ?", id).Error
}

type Input struct {
	Title       string  `json:"title"`
	Description *string `json:"description"`
	FileKey     *string `json:"file_key"`
	ExternalURL *string `json:"external_url"`
	IsActive    *bool   `json:"is_active"`
	SortOrder   int     `json:"sort_order"`
}

type BonusDTO struct {
	ID          string  `json:"id"`
	Title       string  `json:"title"`
	Description *string `json:"description,omitempty"`
	FileURL     *string `json:"file_url,omitempty"`
	ExternalURL *string `json:"external_url,omitempty"`
	IsActive    bool    `json:"is_active"`
	SortOrder   int     `json:"sort_order"`
}

type Service interface {
	List(ctx context.Context, admin bool) ([]BonusDTO, error)
	Create(ctx context.Context, in Input) (*BonusDTO, error)
	Update(ctx context.Context, id uuid.UUID, in Input) (*BonusDTO, error)
	Delete(ctx context.Context, id uuid.UUID) error
	TelegramLink(ctx context.Context) string
	SeedDemo(ctx context.Context) error
}

type service struct {
	repo     Repository
	store    storage.ObjectStorage
	settings settings.Service
}

func NewService(repo Repository, store storage.ObjectStorage, settingsSvc settings.Service) Service {
	return &service{repo: repo, store: store, settings: settingsSvc}
}

func (s *service) List(ctx context.Context, admin bool) ([]BonusDTO, error) {
	items, err := s.repo.List(ctx, !admin)
	if err != nil {
		return nil, err
	}
	out := make([]BonusDTO, 0, len(items))
	for _, b := range items {
		out = append(out, s.toDTO(b))
	}
	return out, nil
}

func (s *service) Create(ctx context.Context, in Input) (*BonusDTO, error) {
	b, err := build(nil, in)
	if err != nil {
		return nil, err
	}
	if err := s.repo.Create(ctx, b); err != nil {
		return nil, err
	}
	dto := s.toDTO(*b)
	return &dto, nil
}

func (s *service) Update(ctx context.Context, id uuid.UUID, in Input) (*BonusDTO, error) {
	existing, err := s.repo.Find(ctx, id)
	if err != nil {
		return nil, err
	}
	b, err := build(existing, in)
	if err != nil {
		return nil, err
	}
	b.ID = existing.ID
	b.CreatedAt = existing.CreatedAt
	if err := s.repo.Update(ctx, b); err != nil {
		return nil, err
	}
	dto := s.toDTO(*b)
	return &dto, nil
}

func (s *service) Delete(ctx context.Context, id uuid.UUID) error {
	return s.repo.Delete(ctx, id)
}

func (s *service) TelegramLink(ctx context.Context) string {
	return s.settings.Public(ctx).TelegramInviteURL
}

func (s *service) SeedDemo(ctx context.Context) error {
	existing, err := s.repo.List(ctx, false)
	if err != nil {
		return err
	}
	seen := map[string]bool{}
	for _, b := range existing {
		seen[strings.ToLower(b.Title)] = true
	}

	type seedBonus struct {
		Title, Desc, URL string
		Sort             int
	}
	seeds := []seedBonus{
		{
			"Risk pack PDF",
			"Position sizing sheet, max-loss calculator notes, and R-multiple examples for verified members.",
			"https://example.com/bonus-risk-pack.pdf",
			1,
		},
		{
			"Session checklist",
			"Printable pre-market and post-session checklist used by the desk.",
			"https://example.com/bonus-session-checklist.pdf",
			2,
		},
		{
			"Broker onboarding guide",
			"Step-by-step MT5 registration under our IB with screenshot cues.",
			"https://example.com/bonus-broker-guide.pdf",
			3,
		},
		{
			"Economic calendar pack",
			"Weekly high-impact event filter and how the desk sizes around news.",
			"https://example.com/bonus-calendar-pack.pdf",
			4,
		},
	}

	for _, row := range seeds {
		if seen[strings.ToLower(row.Title)] {
			continue
		}
		desc, url := row.Desc, row.URL
		if err := s.repo.Create(ctx, &Bonus{
			ID: uuid.New(), Title: row.Title, Description: &desc,
			ExternalURL: &url, IsActive: true, SortOrder: row.Sort,
		}); err != nil {
			return err
		}
	}
	return nil
}

func build(existing *Bonus, in Input) (*Bonus, error) {
	title := strings.TrimSpace(in.Title)
	if title == "" {
		return nil, ErrValidation
	}
	active := true
	if in.IsActive != nil {
		active = *in.IsActive
	}
	b := &Bonus{
		ID: uuid.New(), Title: title, Description: in.Description,
		FileKey: in.FileKey, ExternalURL: in.ExternalURL,
		IsActive: active, SortOrder: in.SortOrder,
	}
	if existing != nil {
		b.ID = existing.ID
	}
	return b, nil
}

func (s *service) toDTO(b Bonus) BonusDTO {
	dto := BonusDTO{
		ID: b.ID.String(), Title: b.Title, Description: b.Description,
		ExternalURL: b.ExternalURL, IsActive: b.IsActive, SortOrder: b.SortOrder,
	}
	if b.FileKey != nil && *b.FileKey != "" {
		url := s.store.URL(*b.FileKey)
		dto.FileURL = &url
	}
	return dto
}
