package ticket

import (
	"context"
	"errors"
	"strings"
	"time"

	"github.com/google/uuid"
	"github.com/ib-community/api/internal/notification"
	"gorm.io/gorm"
)

var ErrNotFound = errors.New("not found")
var ErrValidation = errors.New("validation failed")
var ErrForbidden = errors.New("forbidden")

type Repository interface {
	Create(ctx context.Context, t *Ticket) error
	CreateMessage(ctx context.Context, m *TicketMessage) error
	Find(ctx context.Context, id uuid.UUID) (*Ticket, error)
	ListByUser(ctx context.Context, userID uuid.UUID) ([]Ticket, error)
	ListAll(ctx context.Context, status string, page, perPage int) ([]Ticket, int64, error)
	Update(ctx context.Context, t *Ticket) error
}

type gormRepository struct{ db *gorm.DB }

func NewRepository(db *gorm.DB) Repository { return &gormRepository{db: db} }

func (r *gormRepository) Create(ctx context.Context, t *Ticket) error {
	return r.db.WithContext(ctx).Create(t).Error
}

func (r *gormRepository) CreateMessage(ctx context.Context, m *TicketMessage) error {
	return r.db.WithContext(ctx).Create(m).Error
}

func (r *gormRepository) Find(ctx context.Context, id uuid.UUID) (*Ticket, error) {
	var t Ticket
	err := r.db.WithContext(ctx).Preload("Messages", func(db *gorm.DB) *gorm.DB {
		return db.Order("created_at asc")
	}).First(&t, "id = ?", id).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, ErrNotFound
	}
	return &t, err
}

func (r *gormRepository) ListByUser(ctx context.Context, userID uuid.UUID) ([]Ticket, error) {
	var items []Ticket
	err := r.db.WithContext(ctx).Where("user_id = ?", userID).Order("updated_at desc").Find(&items).Error
	return items, err
}

func (r *gormRepository) ListAll(ctx context.Context, status string, page, perPage int) ([]Ticket, int64, error) {
	if page < 1 {
		page = 1
	}
	if perPage < 1 || perPage > 100 {
		perPage = 20
	}
	q := r.db.WithContext(ctx).Model(&Ticket{})
	if status != "" {
		q = q.Where("status = ?", status)
	}
	var total int64
	if err := q.Count(&total).Error; err != nil {
		return nil, 0, err
	}
	var items []Ticket
	err := q.Order("updated_at desc").Offset((page - 1) * perPage).Limit(perPage).Find(&items).Error
	return items, total, err
}

func (r *gormRepository) Update(ctx context.Context, t *Ticket) error {
	return r.db.WithContext(ctx).Save(t).Error
}

type CreateInput struct {
	Name             string `json:"name"`
	TelegramUsername string `json:"telegram_username"`
	Email            string `json:"email"`
	Topic            string `json:"topic"`
	Description      string `json:"description"`
}

type MessageInput struct {
	Message       string  `json:"message"`
	AttachmentKey *string `json:"attachment_key"`
}

type StatusInput struct {
	Status string `json:"status"`
}

type Service interface {
	Create(ctx context.Context, userID *uuid.UUID, in CreateInput) (*Ticket, error)
	ListMine(ctx context.Context, userID uuid.UUID) ([]Ticket, error)
	Get(ctx context.Context, id uuid.UUID, userID *uuid.UUID, role string) (*Ticket, error)
	AddMessage(ctx context.Context, id uuid.UUID, senderID uuid.UUID, role string, in MessageInput) (*TicketMessage, error)
	AdminList(ctx context.Context, status string, page, perPage int) ([]Ticket, int64, error)
	PatchStatus(ctx context.Context, id, adminID uuid.UUID, in StatusInput) (*Ticket, error)
}

type service struct {
	repo   Repository
	notify notification.Service
}

func NewService(repo Repository, notify notification.Service) Service {
	return &service{repo: repo, notify: notify}
}

func (s *service) Create(ctx context.Context, userID *uuid.UUID, in CreateInput) (*Ticket, error) {
	name := strings.TrimSpace(in.Name)
	topic := strings.TrimSpace(in.Topic)
	desc := strings.TrimSpace(in.Description)
	if name == "" || topic == "" || desc == "" {
		return nil, ErrValidation
	}
	t := &Ticket{
		ID:               uuid.New(),
		UserID:           userID,
		Name:             name,
		TelegramUsername: strings.TrimSpace(in.TelegramUsername),
		Topic:            topic,
		Description:      desc,
		Status:           StatusOpen,
	}
	if email := strings.TrimSpace(in.Email); email != "" {
		t.Email = &email
	}
	if err := s.repo.Create(ctx, t); err != nil {
		return nil, err
	}
	msg := &TicketMessage{
		ID: uuid.New(), TicketID: t.ID, SenderID: userID,
		SenderType: SenderUser, Message: desc,
	}
	_ = s.repo.CreateMessage(ctx, msg)
	t.Messages = []TicketMessage{*msg}
	return t, nil
}

func (s *service) ListMine(ctx context.Context, userID uuid.UUID) ([]Ticket, error) {
	return s.repo.ListByUser(ctx, userID)
}

func (s *service) Get(ctx context.Context, id uuid.UUID, userID *uuid.UUID, role string) (*Ticket, error) {
	t, err := s.repo.Find(ctx, id)
	if err != nil {
		return nil, err
	}
	if role == "admin" || role == "super_admin" {
		return t, nil
	}
	if userID == nil || t.UserID == nil || *t.UserID != *userID {
		return nil, ErrForbidden
	}
	return t, nil
}

func (s *service) AddMessage(ctx context.Context, id uuid.UUID, senderID uuid.UUID, role string, in MessageInput) (*TicketMessage, error) {
	msgText := strings.TrimSpace(in.Message)
	if msgText == "" {
		return nil, ErrValidation
	}
	t, err := s.repo.Find(ctx, id)
	if err != nil {
		return nil, err
	}
	isAdmin := role == "admin" || role == "super_admin"
	if !isAdmin {
		if t.UserID == nil || *t.UserID != senderID {
			return nil, ErrForbidden
		}
		if t.Status == StatusClosed {
			return nil, ErrForbidden
		}
	}
	senderType := SenderUser
	if isAdmin {
		senderType = SenderAdmin
		if t.Status == StatusOpen {
			t.Status = StatusInProgress
			t.AssignedTo = &senderID
			t.UpdatedAt = time.Now().UTC()
			_ = s.repo.Update(ctx, t)
		}
	}
	m := &TicketMessage{
		ID: uuid.New(), TicketID: id, SenderID: &senderID,
		SenderType: senderType, Message: msgText, AttachmentKey: in.AttachmentKey,
	}
	if err := s.repo.CreateMessage(ctx, m); err != nil {
		return nil, err
	}
	t.UpdatedAt = time.Now().UTC()
	_ = s.repo.Update(ctx, t)

	if isAdmin && t.UserID != nil {
		link := "/member/support"
		_ = s.notify.Notify(ctx, *t.UserID, "ticket_reply", "Support reply", "Your ticket received a new reply.", &link)
	}
	return m, nil
}

func (s *service) AdminList(ctx context.Context, status string, page, perPage int) ([]Ticket, int64, error) {
	return s.repo.ListAll(ctx, status, page, perPage)
}

func (s *service) PatchStatus(ctx context.Context, id, adminID uuid.UUID, in StatusInput) (*Ticket, error) {
	status := strings.ToLower(strings.TrimSpace(in.Status))
	switch status {
	case StatusOpen, StatusInProgress, StatusSolved, StatusClosed:
	default:
		return nil, ErrValidation
	}
	t, err := s.repo.Find(ctx, id)
	if err != nil {
		return nil, err
	}
	t.Status = status
	if status == StatusInProgress && t.AssignedTo == nil {
		t.AssignedTo = &adminID
	}
	t.UpdatedAt = time.Now().UTC()
	if err := s.repo.Update(ctx, t); err != nil {
		return nil, err
	}
	return t, nil
}
