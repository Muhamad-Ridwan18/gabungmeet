package onboarding

import (
	"context"
	"errors"
	"strings"
	"time"

	"github.com/google/uuid"
	"github.com/ib-community/api/internal/auth"
	"github.com/ib-community/api/internal/settings"
	"github.com/ib-community/api/internal/verification"
)

var (
	ErrStepSkip      = errors.New("cannot skip onboarding steps")
	ErrInvalidInput  = errors.New("invalid input")
	ErrWrongStatus   = errors.New("account status does not allow this action")
	ErrAlreadyDone   = errors.New("onboarding already completed")
)

type ProgressResponse struct {
	CurrentStep        int16                              `json:"current_step"`
	Status             string                             `json:"status"`
	Step1DoneAt        *time.Time                         `json:"step1_done_at,omitempty"`
	Step2DoneAt        *time.Time                         `json:"step2_done_at,omitempty"`
	Step3DoneAt        *time.Time                         `json:"step3_done_at,omitempty"`
	Step4DoneAt        *time.Time                         `json:"step4_done_at,omitempty"`
	Step5DoneAt        *time.Time                         `json:"step5_done_at,omitempty"`
	CompletedAt        *time.Time                         `json:"completed_at,omitempty"`
	Settings           settings.PublicSettings            `json:"settings"`
	LatestVerification *verification.VerificationRequest  `json:"latest_verification,omitempty"`
}

type Step3Request struct {
	MT5Account   string `json:"mt5_account"`
	BrokerServer string `json:"broker_server"`
}

type Step4Request struct {
	ProofKey string `json:"proof_key"`
}

type Service interface {
	Get(ctx context.Context, userID uuid.UUID) (*ProgressResponse, error)
	Start(ctx context.Context, userID uuid.UUID) (*ProgressResponse, error)
	CompleteStep1(ctx context.Context, userID uuid.UUID) (*ProgressResponse, error)
	CompleteStep2(ctx context.Context, userID uuid.UUID) (*ProgressResponse, error)
	SubmitStep3(ctx context.Context, userID uuid.UUID, req Step3Request) (*ProgressResponse, error)
	CompleteStep4(ctx context.Context, userID uuid.UUID, req Step4Request) (*ProgressResponse, error)
	CompleteStep5(ctx context.Context, userID uuid.UUID) (*ProgressResponse, error)
}

type service struct {
	users   auth.Repository
	verifs  verification.Repository
	settings settings.Service
}

func NewService(users auth.Repository, verifs verification.Repository, settingsSvc settings.Service) Service {
	return &service{users: users, verifs: verifs, settings: settingsSvc}
}

func (s *service) Get(ctx context.Context, userID uuid.UUID) (*ProgressResponse, error) {
	return s.build(ctx, userID)
}

// Start moves a registered account into the IB verification wizard.
func (s *service) Start(ctx context.Context, userID uuid.UUID) (*ProgressResponse, error) {
	user, err := s.users.FindUserByID(ctx, userID)
	if err != nil {
		return nil, err
	}
	switch user.Status {
	case auth.StatusLocked:
		return nil, ErrWrongStatus
	case auth.StatusVerified:
		return nil, ErrAlreadyDone
	case auth.StatusOnboarding, auth.StatusPendingVerification, auth.StatusRejected:
		return s.build(ctx, userID)
	case auth.StatusRegistered:
		user.Status = auth.StatusOnboarding
		if err := s.users.UpdateUser(ctx, user); err != nil {
			return nil, err
		}
		return s.build(ctx, userID)
	default:
		return nil, ErrWrongStatus
	}
}

func (s *service) CompleteStep1(ctx context.Context, userID uuid.UUID) (*ProgressResponse, error) {
	user, progress, err := s.loadMutable(ctx, userID)
	if err != nil {
		return nil, err
	}
	if progress.Step1DoneAt != nil {
		return s.build(ctx, userID)
	}
	now := time.Now().UTC()
	progress.Step1DoneAt = &now
	progress.CurrentStep = 2
	_ = user
	if err := s.users.SaveOnboarding(ctx, progress); err != nil {
		return nil, err
	}
	return s.build(ctx, userID)
}

func (s *service) CompleteStep2(ctx context.Context, userID uuid.UUID) (*ProgressResponse, error) {
	_, progress, err := s.loadMutable(ctx, userID)
	if err != nil {
		return nil, err
	}
	if progress.Step1DoneAt == nil {
		return nil, ErrStepSkip
	}
	if progress.Step2DoneAt != nil {
		return s.build(ctx, userID)
	}
	now := time.Now().UTC()
	progress.Step2DoneAt = &now
	progress.CurrentStep = 3
	if err := s.users.SaveOnboarding(ctx, progress); err != nil {
		return nil, err
	}
	return s.build(ctx, userID)
}

func (s *service) SubmitStep3(ctx context.Context, userID uuid.UUID, req Step3Request) (*ProgressResponse, error) {
	mt5 := strings.TrimSpace(req.MT5Account)
	server := strings.TrimSpace(req.BrokerServer)
	if mt5 == "" || server == "" {
		return nil, ErrInvalidInput
	}
	user, progress, err := s.loadMutable(ctx, userID)
	if err != nil {
		return nil, err
	}
	if progress.Step2DoneAt == nil {
		return nil, ErrStepSkip
	}

	// Resubmit after rejection: allow step3 again
	if progress.Step3DoneAt != nil && user.Status != auth.StatusRejected {
		return s.build(ctx, userID)
	}

	vr := &verification.VerificationRequest{
		ID:           uuid.New(),
		UserID:       userID,
		MT5Account:   mt5,
		BrokerServer: server,
		Status:       verification.StatusPending,
	}
	if err := s.verifs.Create(ctx, vr); err != nil {
		return nil, err
	}

	now := time.Now().UTC()
	progress.Step3DoneAt = &now
	progress.CurrentStep = 4
	if user.Status == auth.StatusRejected {
		user.Status = auth.StatusOnboarding
		if err := s.users.UpdateUser(ctx, user); err != nil {
			return nil, err
		}
	}
	if err := s.users.SaveOnboarding(ctx, progress); err != nil {
		return nil, err
	}
	return s.build(ctx, userID)
}

func (s *service) CompleteStep4(ctx context.Context, userID uuid.UUID, req Step4Request) (*ProgressResponse, error) {
	_, progress, err := s.loadMutable(ctx, userID)
	if err != nil {
		return nil, err
	}
	if progress.Step3DoneAt == nil {
		return nil, ErrStepSkip
	}
	if progress.Step4DoneAt != nil {
		return s.build(ctx, userID)
	}

	latest, err := s.verifs.LatestByUser(ctx, userID)
	if err != nil {
		return nil, err
	}
	if key := strings.TrimSpace(req.ProofKey); key != "" {
		latest.ProofKey = &key
		if err := s.verifs.Update(ctx, latest); err != nil {
			return nil, err
		}
	}

	now := time.Now().UTC()
	progress.Step4DoneAt = &now
	progress.CurrentStep = 5
	if err := s.users.SaveOnboarding(ctx, progress); err != nil {
		return nil, err
	}
	return s.build(ctx, userID)
}

func (s *service) CompleteStep5(ctx context.Context, userID uuid.UUID) (*ProgressResponse, error) {
	user, progress, err := s.loadMutable(ctx, userID)
	if err != nil {
		return nil, err
	}
	if progress.Step4DoneAt == nil {
		return nil, ErrStepSkip
	}
	if progress.Step5DoneAt != nil {
		return s.build(ctx, userID)
	}

	now := time.Now().UTC()
	progress.Step5DoneAt = &now
	progress.CompletedAt = &now
	progress.CurrentStep = 5
	user.Status = auth.StatusPendingVerification

	if err := s.users.SaveOnboarding(ctx, progress); err != nil {
		return nil, err
	}
	if err := s.users.UpdateUser(ctx, user); err != nil {
		return nil, err
	}
	return s.build(ctx, userID)
}

func (s *service) loadMutable(ctx context.Context, userID uuid.UUID) (*auth.User, *auth.OnboardingProgress, error) {
	user, err := s.users.FindUserByID(ctx, userID)
	if err != nil {
		return nil, nil, err
	}
	if user.Status == auth.StatusLocked || user.Status == auth.StatusRegistered {
		return nil, nil, ErrWrongStatus
	}
	if user.Status == auth.StatusVerified {
		return nil, nil, ErrAlreadyDone
	}
	progress, err := s.users.GetOnboarding(ctx, userID)
	if err != nil {
		return nil, nil, err
	}
	return user, progress, nil
}

func (s *service) build(ctx context.Context, userID uuid.UUID) (*ProgressResponse, error) {
	user, err := s.users.FindUserByID(ctx, userID)
	if err != nil {
		return nil, err
	}
	progress, err := s.users.GetOnboarding(ctx, userID)
	if err != nil {
		return nil, err
	}
	resp := &ProgressResponse{
		CurrentStep: progress.CurrentStep,
		Status:      user.Status,
		Step1DoneAt: progress.Step1DoneAt,
		Step2DoneAt: progress.Step2DoneAt,
		Step3DoneAt: progress.Step3DoneAt,
		Step4DoneAt: progress.Step4DoneAt,
		Step5DoneAt: progress.Step5DoneAt,
		CompletedAt: progress.CompletedAt,
		Settings:    s.settings.Public(ctx),
	}
	if latest, err := s.verifs.LatestByUser(ctx, userID); err == nil {
		resp.LatestVerification = latest
	}
	return resp, nil
}
