package verification

import (
	"context"
	"errors"
	"strings"
	"time"

	"github.com/google/uuid"
	"github.com/ib-community/api/internal/auth"
	"github.com/ib-community/api/internal/notification"
)

var (
	ErrInvalidInput = errors.New("invalid input")
	ErrWrongState   = errors.New("verification is not pending")
)

type Service interface {
	Mine(ctx context.Context, userID uuid.UUID) (map[string]any, error)
	ResubmitHint(ctx context.Context, userID uuid.UUID) error
	AdminList(ctx context.Context, status string, page, perPage int) ([]AdminListItem, int64, error)
	AdminGet(ctx context.Context, id uuid.UUID) (*VerificationRequest, *auth.User, error)
	Approve(ctx context.Context, id, adminID uuid.UUID) error
	Reject(ctx context.Context, id, adminID uuid.UUID, reason string) error
	LockUser(ctx context.Context, userID, adminID uuid.UUID) error
	UnlockUser(ctx context.Context, userID, adminID uuid.UUID) error
}

type AdminListItem struct {
	ID           string  `json:"id"`
	UserID       string  `json:"user_id"`
	MT5Account   string  `json:"mt5_account"`
	BrokerServer string  `json:"broker_server"`
	ProofKey     *string `json:"proof_key,omitempty"`
	Status       string  `json:"status"`
	CreatedAt    string  `json:"created_at"`
	UserEmail    string  `json:"user_email"`
	UserFullName string  `json:"user_full_name"`
}

type service struct {
	repo    Repository
	users   auth.Repository
	notify  notification.Service
}

func NewService(repo Repository, users auth.Repository, notify notification.Service) Service {
	return &service{repo: repo, users: users, notify: notify}
}

func (s *service) Mine(ctx context.Context, userID uuid.UUID) (map[string]any, error) {
	history, err := s.repo.ListByUser(ctx, userID)
	if err != nil {
		return nil, err
	}
	var latest *VerificationRequest
	if len(history) > 0 {
		latest = &history[0]
	}
	return map[string]any{
		"latest":  latest,
		"history": history,
	}, nil
}

func (s *service) ResubmitHint(ctx context.Context, userID uuid.UUID) error {
	user, err := s.users.FindUserByID(ctx, userID)
	if err != nil {
		return err
	}
	if user.Status != auth.StatusRejected {
		return ErrWrongState
	}
	progress, err := s.users.GetOnboarding(ctx, userID)
	if err != nil {
		return err
	}
	// Reset to step 3 so they can submit new MT5 details
	progress.CurrentStep = 3
	progress.Step3DoneAt = nil
	progress.Step4DoneAt = nil
	progress.Step5DoneAt = nil
	progress.CompletedAt = nil
	user.Status = auth.StatusOnboarding
	if err := s.users.SaveOnboarding(ctx, progress); err != nil {
		return err
	}
	return s.users.UpdateUser(ctx, user)
}

func (s *service) AdminList(ctx context.Context, status string, page, perPage int) ([]AdminListItem, int64, error) {
	items, total, err := s.repo.List(ctx, status, page, perPage)
	if err != nil {
		return nil, 0, err
	}
	out := make([]AdminListItem, 0, len(items))
	for _, item := range items {
		row := AdminListItem{
			ID:           item.ID.String(),
			UserID:       item.UserID.String(),
			MT5Account:   item.MT5Account,
			BrokerServer: item.BrokerServer,
			ProofKey:     item.ProofKey,
			Status:       item.Status,
			CreatedAt:    item.CreatedAt.UTC().Format(time.RFC3339),
		}
		if u, err := s.users.FindUserByID(ctx, item.UserID); err == nil {
			row.UserEmail = u.Email
			if u.Profile != nil {
				row.UserFullName = u.Profile.FullName
			}
		}
		out = append(out, row)
	}
	return out, total, nil
}

func (s *service) AdminGet(ctx context.Context, id uuid.UUID) (*VerificationRequest, *auth.User, error) {
	req, err := s.repo.FindByID(ctx, id)
	if err != nil {
		return nil, nil, err
	}
	user, err := s.users.FindUserByID(ctx, req.UserID)
	if err != nil {
		return nil, nil, err
	}
	return req, user, nil
}

func (s *service) Approve(ctx context.Context, id, adminID uuid.UUID) error {
	req, err := s.repo.FindByID(ctx, id)
	if err != nil {
		return err
	}
	if req.Status != StatusPending {
		return ErrWrongState
	}
	user, err := s.users.FindUserByID(ctx, req.UserID)
	if err != nil {
		return err
	}

	now := time.Now().UTC()
	req.Status = StatusApproved
	req.ReviewedBy = &adminID
	req.ReviewedAt = &now
	if err := s.repo.Update(ctx, req); err != nil {
		return err
	}

	user.Status = auth.StatusVerified
	user.StatusBeforeLock = nil
	if err := s.users.UpdateUser(ctx, user); err != nil {
		return err
	}

	link := "/member"
	return s.notify.Notify(ctx, user.ID, "verification_approved", "Verification approved",
		"Your MT5 account has been verified. Premium modules are unlocked.", &link)
}

func (s *service) Reject(ctx context.Context, id, adminID uuid.UUID, reason string) error {
	reason = strings.TrimSpace(reason)
	if reason == "" {
		return ErrInvalidInput
	}
	req, err := s.repo.FindByID(ctx, id)
	if err != nil {
		return err
	}
	if req.Status != StatusPending {
		return ErrWrongState
	}
	user, err := s.users.FindUserByID(ctx, req.UserID)
	if err != nil {
		return err
	}

	now := time.Now().UTC()
	req.Status = StatusRejected
	req.RejectionReason = &reason
	req.ReviewedBy = &adminID
	req.ReviewedAt = &now
	if err := s.repo.Update(ctx, req); err != nil {
		return err
	}

	user.Status = auth.StatusRejected
	if err := s.users.UpdateUser(ctx, user); err != nil {
		return err
	}

	link := "/onboarding"
	return s.notify.Notify(ctx, user.ID, "verification_rejected", "Verification rejected", reason, &link)
}

func (s *service) LockUser(ctx context.Context, userID, _ uuid.UUID) error {
	user, err := s.users.FindUserByID(ctx, userID)
	if err != nil {
		return err
	}
	if user.Status == auth.StatusLocked {
		return nil
	}
	prev := user.Status
	user.StatusBeforeLock = &prev
	user.Status = auth.StatusLocked
	return s.users.UpdateUser(ctx, user)
}

func (s *service) UnlockUser(ctx context.Context, userID, _ uuid.UUID) error {
	user, err := s.users.FindUserByID(ctx, userID)
	if err != nil {
		return err
	}
	if user.Status != auth.StatusLocked {
		return nil
	}
	restore := auth.StatusOnboarding
	if user.StatusBeforeLock != nil && *user.StatusBeforeLock != "" {
		restore = *user.StatusBeforeLock
	}
	user.Status = restore
	user.StatusBeforeLock = nil
	return s.users.UpdateUser(ctx, user)
}
