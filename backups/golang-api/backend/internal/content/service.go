package content

import (
	"context"
	"errors"
	"regexp"
	"strings"
	"time"

	"github.com/google/uuid"
	"github.com/ib-community/api/internal/auth"
	"github.com/ib-community/api/pkg/storage"
)

var (
	ErrValidation = errors.New("validation failed")
	ErrConflict   = errors.New("conflict")
	ErrForbidden  = errors.New("forbidden")
)

type ContentDTO struct {
	ID            string  `json:"id"`
	CategoryID    *string `json:"category_id,omitempty"`
	CategoryName  *string `json:"category_name,omitempty"`
	Module        string  `json:"module"`
	Type          string  `json:"type"`
	Title         string  `json:"title"`
	Slug          string  `json:"slug"`
	Excerpt       *string `json:"excerpt,omitempty"`
	Body          *string `json:"body,omitempty"`
	ThumbnailURL  *string `json:"thumbnail_url,omitempty"`
	VideoURL      *string `json:"video_url,omitempty"`
	DurationSec   *int    `json:"duration_sec,omitempty"`
	IsPremium     bool    `json:"is_premium"`
	Locked        bool    `json:"locked"`
	Status        string  `json:"status"`
	PublishedAt   *string `json:"published_at,omitempty"`
	Bookmarked    bool    `json:"bookmarked,omitempty"`
	CreatedAt     string  `json:"created_at"`
}

type CategoryInput struct {
	Module      string  `json:"module"`
	Name        string  `json:"name"`
	Slug        string  `json:"slug"`
	Description *string `json:"description"`
	SortOrder   int     `json:"sort_order"`
	IsActive    *bool   `json:"is_active"`
}

type ContentInput struct {
	CategoryID   *string `json:"category_id"`
	Module       string  `json:"module"`
	Type         string  `json:"type"`
	Title        string  `json:"title"`
	Slug         string  `json:"slug"`
	Excerpt      *string `json:"excerpt"`
	Body         *string `json:"body"`
	ThumbnailKey *string `json:"thumbnail_key"`
	VideoKey     *string `json:"video_key"`
	DurationSec  *int    `json:"duration_sec"`
	IsPremium    *bool   `json:"is_premium"`
	Status       string  `json:"status"`
}

type HistoryInput struct {
	ProgressPct     float64 `json:"progress_pct"`
	LastPositionSec int     `json:"last_position_sec"`
	Completed       bool    `json:"completed"`
}

type Viewer struct {
	UserID   *uuid.UUID
	Role     string
	Status   string
	Verified bool
	IsAdmin  bool
}

type Service interface {
	ListCategories(ctx context.Context, module string, admin bool) ([]Category, error)
	CreateCategory(ctx context.Context, in CategoryInput) (*Category, error)
	UpdateCategory(ctx context.Context, id uuid.UUID, in CategoryInput) (*Category, error)
	DeleteCategory(ctx context.Context, id uuid.UUID) error

	ListContents(ctx context.Context, f ListFilter, viewer Viewer) ([]ContentDTO, int64, error)
	GetBySlug(ctx context.Context, slug string, viewer Viewer) (*ContentDTO, error)
	CreateContent(ctx context.Context, authorID uuid.UUID, in ContentInput) (*ContentDTO, error)
	UpdateContent(ctx context.Context, id uuid.UUID, in ContentInput) (*ContentDTO, error)
	DeleteContent(ctx context.Context, id uuid.UUID) error
	PublishContent(ctx context.Context, id uuid.UUID) (*ContentDTO, error)

	ListBookmarks(ctx context.Context, userID uuid.UUID) ([]ContentDTO, error)
	AddBookmark(ctx context.Context, userID, contentID uuid.UUID) error
	RemoveBookmark(ctx context.Context, userID, contentID uuid.UUID) error
	UpsertHistory(ctx context.Context, userID, contentID uuid.UUID, in HistoryInput) error
	ListHistory(ctx context.Context, userID uuid.UUID) ([]ViewHistory, error)
	Continue(ctx context.Context, userID uuid.UUID) ([]ContentDTO, error)
	SeedDemo(ctx context.Context, adminID uuid.UUID) error
	SeedDemoProgress(ctx context.Context, userID uuid.UUID) error
}

type service struct {
	repo  Repository
	store storage.ObjectStorage
}

func NewService(repo Repository, store storage.ObjectStorage) Service {
	return &service{repo: repo, store: store}
}

func (s *service) ListCategories(ctx context.Context, module string, admin bool) ([]Category, error) {
	return s.repo.ListCategories(ctx, module, !admin)
}

func (s *service) CreateCategory(ctx context.Context, in CategoryInput) (*Category, error) {
	if err := validateModule(in.Module); err != nil {
		return nil, err
	}
	name := strings.TrimSpace(in.Name)
	if name == "" {
		return nil, ErrValidation
	}
	slug := strings.TrimSpace(in.Slug)
	if slug == "" {
		slug = slugify(name)
	}
	active := true
	if in.IsActive != nil {
		active = *in.IsActive
	}
	c := &Category{
		ID:          uuid.New(),
		Module:      in.Module,
		Name:        name,
		Slug:        slug,
		Description: in.Description,
		SortOrder:   in.SortOrder,
		IsActive:    active,
	}
	if err := s.repo.CreateCategory(ctx, c); err != nil {
		return nil, err
	}
	return c, nil
}

func (s *service) UpdateCategory(ctx context.Context, id uuid.UUID, in CategoryInput) (*Category, error) {
	c, err := s.repo.FindCategory(ctx, id)
	if err != nil {
		return nil, err
	}
	if in.Module != "" {
		if err := validateModule(in.Module); err != nil {
			return nil, err
		}
		c.Module = in.Module
	}
	if strings.TrimSpace(in.Name) != "" {
		c.Name = strings.TrimSpace(in.Name)
	}
	if strings.TrimSpace(in.Slug) != "" {
		c.Slug = strings.TrimSpace(in.Slug)
	}
	if in.Description != nil {
		c.Description = in.Description
	}
	c.SortOrder = in.SortOrder
	if in.IsActive != nil {
		c.IsActive = *in.IsActive
	}
	if err := s.repo.UpdateCategory(ctx, c); err != nil {
		return nil, err
	}
	return c, nil
}

func (s *service) DeleteCategory(ctx context.Context, id uuid.UUID) error {
	return s.repo.DeleteCategory(ctx, id)
}

func (s *service) ListContents(ctx context.Context, f ListFilter, viewer Viewer) ([]ContentDTO, int64, error) {
	if !viewer.IsAdmin {
		f.Status = StatusPublished
	}
	items, total, err := s.repo.ListContents(ctx, f)
	if err != nil {
		return nil, 0, err
	}
	out := make([]ContentDTO, 0, len(items))
	for _, item := range items {
		out = append(out, s.toDTO(item, viewer, false, false))
	}
	return out, total, nil
}

func (s *service) GetBySlug(ctx context.Context, slug string, viewer Viewer) (*ContentDTO, error) {
	item, err := s.repo.FindContentBySlug(ctx, slug)
	if err != nil {
		return nil, err
	}
	if !viewer.IsAdmin && item.Status != StatusPublished {
		return nil, ErrNotFound
	}
	bookmarked := false
	if viewer.UserID != nil {
		bookmarked, _ = s.repo.IsBookmarked(ctx, *viewer.UserID, item.ID)
	}
	dto := s.toDTO(*item, viewer, true, bookmarked)
	return &dto, nil
}

func (s *service) CreateContent(ctx context.Context, authorID uuid.UUID, in ContentInput) (*ContentDTO, error) {
	c, err := s.buildContent(ctx, authorID, nil, in)
	if err != nil {
		return nil, err
	}
	if err := s.repo.CreateContent(ctx, c); err != nil {
		return nil, err
	}
	dto := s.toDTO(*c, Viewer{IsAdmin: true, Verified: true}, true, false)
	return &dto, nil
}

func (s *service) UpdateContent(ctx context.Context, id uuid.UUID, in ContentInput) (*ContentDTO, error) {
	existing, err := s.repo.FindContentByID(ctx, id)
	if err != nil {
		return nil, err
	}
	c, err := s.buildContent(ctx, existing.CreatedBy, existing, in)
	if err != nil {
		return nil, err
	}
	c.ID = existing.ID
	c.CreatedAt = existing.CreatedAt
	if err := s.repo.UpdateContent(ctx, c); err != nil {
		return nil, err
	}
	dto := s.toDTO(*c, Viewer{IsAdmin: true, Verified: true}, true, false)
	return &dto, nil
}

func (s *service) DeleteContent(ctx context.Context, id uuid.UUID) error {
	return s.repo.DeleteContent(ctx, id)
}

func (s *service) PublishContent(ctx context.Context, id uuid.UUID) (*ContentDTO, error) {
	c, err := s.repo.FindContentByID(ctx, id)
	if err != nil {
		return nil, err
	}
	now := time.Now().UTC()
	c.Status = StatusPublished
	c.PublishedAt = &now
	if err := s.repo.UpdateContent(ctx, c); err != nil {
		return nil, err
	}
	dto := s.toDTO(*c, Viewer{IsAdmin: true, Verified: true}, true, false)
	return &dto, nil
}

func (s *service) ListBookmarks(ctx context.Context, userID uuid.UUID) ([]ContentDTO, error) {
	items, err := s.repo.ListBookmarks(ctx, userID)
	if err != nil {
		return nil, err
	}
	viewer := Viewer{UserID: &userID, Verified: true}
	out := make([]ContentDTO, 0, len(items))
	for _, b := range items {
		if b.Content == nil {
			continue
		}
		out = append(out, s.toDTO(*b.Content, viewer, false, true))
	}
	return out, nil
}

func (s *service) AddBookmark(ctx context.Context, userID, contentID uuid.UUID) error {
	if _, err := s.repo.FindContentByID(ctx, contentID); err != nil {
		return err
	}
	return s.repo.AddBookmark(ctx, &Bookmark{ID: uuid.New(), UserID: userID, ContentID: contentID})
}

func (s *service) RemoveBookmark(ctx context.Context, userID, contentID uuid.UUID) error {
	return s.repo.RemoveBookmark(ctx, userID, contentID)
}

func (s *service) UpsertHistory(ctx context.Context, userID, contentID uuid.UUID, in HistoryInput) error {
	if _, err := s.repo.FindContentByID(ctx, contentID); err != nil {
		return err
	}
	return s.repo.UpsertHistory(ctx, &ViewHistory{
		ID:              uuid.New(),
		UserID:          userID,
		ContentID:       contentID,
		ProgressPct:     in.ProgressPct,
		LastPositionSec: in.LastPositionSec,
		Completed:       in.Completed,
		LastViewedAt:    time.Now().UTC(),
	})
}

func (s *service) ListHistory(ctx context.Context, userID uuid.UUID) ([]ViewHistory, error) {
	return s.repo.ListHistory(ctx, userID, 50)
}

func (s *service) Continue(ctx context.Context, userID uuid.UUID) ([]ContentDTO, error) {
	items, err := s.repo.Continue(ctx, userID, 12)
	if err != nil {
		return nil, err
	}
	viewer := Viewer{UserID: &userID, Verified: true}
	out := make([]ContentDTO, 0, len(items))
	for _, h := range items {
		if h.Content == nil {
			continue
		}
		out = append(out, s.toDTO(*h.Content, viewer, false, false))
	}
	return out, nil
}

func (s *service) buildContent(ctx context.Context, authorID uuid.UUID, existing *Content, in ContentInput) (*Content, error) {
	if err := validateModule(in.Module); err != nil {
		return nil, err
	}
	if in.Type != TypeVideo && in.Type != TypeArticle {
		return nil, ErrValidation
	}
	title := strings.TrimSpace(in.Title)
	if title == "" {
		return nil, ErrValidation
	}
	slug := strings.TrimSpace(in.Slug)
	if slug == "" {
		slug = slugify(title)
	}
	var exclude *uuid.UUID
	if existing != nil {
		exclude = &existing.ID
	}
	exists, err := s.repo.SlugExists(ctx, slug, exclude)
	if err != nil {
		return nil, err
	}
	if exists {
		return nil, ErrConflict
	}

	status := strings.TrimSpace(in.Status)
	if status == "" {
		status = StatusDraft
	}
	if status != StatusDraft && status != StatusPublished && status != StatusArchived {
		return nil, ErrValidation
	}

	premium := true
	if in.IsPremium != nil {
		premium = *in.IsPremium
	}

	var categoryID *uuid.UUID
	if in.CategoryID != nil && strings.TrimSpace(*in.CategoryID) != "" {
		id, err := uuid.Parse(strings.TrimSpace(*in.CategoryID))
		if err != nil {
			return nil, ErrValidation
		}
		if _, err := s.repo.FindCategory(ctx, id); err != nil {
			return nil, err
		}
		categoryID = &id
	}

	c := &Content{
		ID:           uuid.New(),
		CategoryID:   categoryID,
		Module:       in.Module,
		Type:         in.Type,
		Title:        title,
		Slug:         slug,
		Excerpt:      in.Excerpt,
		Body:         in.Body,
		ThumbnailKey: in.ThumbnailKey,
		VideoKey:     in.VideoKey,
		DurationSec:  in.DurationSec,
		IsPremium:    premium,
		Status:       status,
		CreatedBy:    authorID,
	}
	if existing != nil {
		c.ID = existing.ID
		c.PublishedAt = existing.PublishedAt
	}
	if status == StatusPublished && (existing == nil || existing.PublishedAt == nil) {
		now := time.Now().UTC()
		c.PublishedAt = &now
	}
	return c, nil
}

func (s *service) toDTO(c Content, viewer Viewer, full bool, bookmarked bool) ContentDTO {
	locked := c.IsPremium && !viewer.Verified && !viewer.IsAdmin
	dto := ContentDTO{
		ID:         c.ID.String(),
		Module:     c.Module,
		Type:       c.Type,
		Title:      c.Title,
		Slug:       c.Slug,
		Excerpt:    c.Excerpt,
		IsPremium:  c.IsPremium,
		Locked:     locked,
		Status:     c.Status,
		Bookmarked: bookmarked,
		CreatedAt:  c.CreatedAt.UTC().Format(time.RFC3339),
	}
	if c.CategoryID != nil {
		id := c.CategoryID.String()
		dto.CategoryID = &id
	}
	if c.Category != nil {
		name := c.Category.Name
		dto.CategoryName = &name
	}
	if c.ThumbnailKey != nil && *c.ThumbnailKey != "" {
		url := s.store.URL(*c.ThumbnailKey)
		dto.ThumbnailURL = &url
	}
	if c.PublishedAt != nil {
		v := c.PublishedAt.UTC().Format(time.RFC3339)
		dto.PublishedAt = &v
	}
	dto.DurationSec = c.DurationSec

	if full && !locked {
		dto.Body = c.Body
		if c.VideoKey != nil && *c.VideoKey != "" {
			url := s.store.URL(*c.VideoKey)
			dto.VideoURL = &url
		}
	}
	return dto
}

func validateModule(module string) error {
	switch module {
	case ModuleAcademy, ModulePsychology, ModuleDailyAnalysis, ModuleLanding:
		return nil
	default:
		return ErrValidation
	}
}

var nonSlug = regexp.MustCompile(`[^a-z0-9]+`)

func slugify(s string) string {
	s = strings.ToLower(strings.TrimSpace(s))
	s = nonSlug.ReplaceAllString(s, "-")
	s = strings.Trim(s, "-")
	if s == "" {
		s = uuid.NewString()[:8]
	}
	return s
}

func ViewerFromLocals(userID any, role any, status any) Viewer {
	v := Viewer{}
	if id, ok := userID.(uuid.UUID); ok {
		v.UserID = &id
	}
	if r, ok := role.(string); ok {
		v.Role = r
		v.IsAdmin = r == auth.RoleAdmin || r == auth.RoleSuperAdmin
	}
	if st, ok := status.(string); ok {
		v.Status = st
		v.Verified = st == auth.StatusVerified || v.IsAdmin
	}
	return v
}
