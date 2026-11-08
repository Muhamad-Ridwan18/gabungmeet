package settings

import (
	"context"
	"encoding/json"
	"errors"
	"strconv"
	"strings"

	"gorm.io/gorm"
)

var ErrNotFound = errors.New("setting not found")

type Repository interface {
	Get(ctx context.Context, key string) (*Setting, error)
	Upsert(ctx context.Context, setting *Setting) error
	GetString(ctx context.Context, key, fallback string) string
	EnsureDefaults(ctx context.Context) error
}

type gormRepository struct {
	db *gorm.DB
}

func NewRepository(db *gorm.DB) Repository {
	return &gormRepository{db: db}
}

func (r *gormRepository) Get(ctx context.Context, key string) (*Setting, error) {
	var s Setting
	err := r.db.WithContext(ctx).First(&s, "key = ?", key).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, ErrNotFound
	}
	return &s, err
}

func (r *gormRepository) Upsert(ctx context.Context, setting *Setting) error {
	return r.db.WithContext(ctx).Save(setting).Error
}

func (r *gormRepository) GetString(ctx context.Context, key, fallback string) string {
	s, err := r.Get(ctx, key)
	if err != nil {
		return fallback
	}
	var v string
	if err := json.Unmarshal([]byte(s.Value), &v); err != nil {
		// allow raw string stored without JSON quotes
		if s.Value != "" {
			return s.Value
		}
		return fallback
	}
	return v
}

func (r *gormRepository) EnsureDefaults(ctx context.Context) error {
	defaults := map[string]string{
		KeyIBRegisterURL:      "https://example-broker.com/ib/register",
		KeyTelegramInviteURL:  "https://t.me/ibcommunity",
		KeyBrokerTutorialURL:  "https://www.youtube.com/watch?v=yfZxu6YX1nU",
		KeyDepositTutorialURL: "https://www.youtube.com/watch?v=yfZxu6YX1nU",
		KeyAIFailThreshold:    "3",
	}
	placeholders := map[string]bool{
		"https://www.youtube.com/watch?v=dQw4w9WgXcQ": true,
	}
	for k, v := range defaults {
		existing, err := r.Get(ctx, k)
		if err == nil {
			cur := r.GetString(ctx, k, "")
			if placeholders[cur] {
				raw, _ := json.Marshal(v)
				existing.Value = string(raw)
				if err := r.Upsert(ctx, existing); err != nil {
					return err
				}
			}
			continue
		}
		if !errors.Is(err, ErrNotFound) {
			return err
		}
		raw, _ := json.Marshal(v)
		if err := r.Upsert(ctx, &Setting{Key: k, Value: string(raw)}); err != nil {
			return err
		}
	}
	return nil
}

type PublicSettings struct {
	IBRegisterURL      string `json:"ib_register_url"`
	TelegramInviteURL  string `json:"telegram_invite_url"`
	BrokerTutorialURL  string `json:"broker_tutorial_url"`
	DepositTutorialURL string `json:"deposit_tutorial_url"`
}

type Service interface {
	Public(ctx context.Context) PublicSettings
	EnsureDefaults(ctx context.Context) error
	AIFailThreshold(ctx context.Context) int
}

type service struct {
	repo Repository
}

func NewService(repo Repository) Service {
	return &service{repo: repo}
}

func (s *service) EnsureDefaults(ctx context.Context) error {
	return s.repo.EnsureDefaults(ctx)
}

func (s *service) Public(ctx context.Context) PublicSettings {
	return PublicSettings{
		IBRegisterURL:      s.repo.GetString(ctx, KeyIBRegisterURL, ""),
		TelegramInviteURL:  s.repo.GetString(ctx, KeyTelegramInviteURL, ""),
		BrokerTutorialURL:  s.repo.GetString(ctx, KeyBrokerTutorialURL, ""),
		DepositTutorialURL: s.repo.GetString(ctx, KeyDepositTutorialURL, ""),
	}
}

func (s *service) AIFailThreshold(ctx context.Context) int {
	raw := s.repo.GetString(ctx, KeyAIFailThreshold, "3")
	n, err := strconv.Atoi(strings.TrimSpace(raw))
	if err != nil || n < 1 {
		return 3
	}
	return n
}
