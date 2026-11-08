package auth

import (
	"context"
	"crypto/sha256"
	"encoding/hex"
	"errors"
	"strings"
	"time"

	"github.com/google/uuid"
	"github.com/ib-community/api/pkg/hasher"
	jwtpkg "github.com/ib-community/api/pkg/jwt"
)

var (
	ErrInvalidCredentials = errors.New("invalid email or password")
	ErrEmailTaken         = errors.New("email already registered")
	ErrAccountLocked      = errors.New("account is locked")
	ErrValidation         = errors.New("validation failed")
	ErrInvalidResetToken  = errors.New("invalid or expired reset token")
)

type Service interface {
	Register(ctx context.Context, req RegisterRequest) (*AuthResponse, error)
	Login(ctx context.Context, req LoginRequest, userAgent, ip string) (*AuthResponse, error)
	Refresh(ctx context.Context, refreshToken, userAgent, ip string) (*TokenPair, error)
	Logout(ctx context.Context, refreshToken string) error
	Me(ctx context.Context, userID uuid.UUID) (*UserResponse, error)
	ForgotPassword(ctx context.Context, email string) (resetToken string, err error)
	ResetPassword(ctx context.Context, token, newPassword string) error
	AutoMigrate(ctx context.Context) error
	SeedDemoUsers(ctx context.Context) error
}

type service struct {
	repo   Repository
	tokens *jwtpkg.Manager
}

func NewService(repo Repository, tokens *jwtpkg.Manager) Service {
	return &service{repo: repo, tokens: tokens}
}

func (s *service) Register(ctx context.Context, req RegisterRequest) (*AuthResponse, error) {
	email := strings.TrimSpace(strings.ToLower(req.Email))
	fullName := strings.TrimSpace(req.FullName)
	if email == "" || len(req.Password) < 8 || fullName == "" {
		return nil, ErrValidation
	}

	if _, err := s.repo.FindUserByEmail(ctx, email); err == nil {
		return nil, ErrEmailTaken
	} else if !errors.Is(err, ErrNotFound) {
		return nil, err
	}

	role, err := s.repo.FindRoleByName(ctx, RoleMember)
	if err != nil {
		return nil, err
	}

	hash, err := hasher.Hash(req.Password)
	if err != nil {
		return nil, err
	}

	user := &User{
		ID:           uuid.New(),
		Email:        email,
		PasswordHash: hash,
		RoleID:       role.ID,
		Status:       StatusRegistered,
	}
	profile := &Profile{
		FullName: fullName,
		Timezone: "UTC",
	}
	progress := &OnboardingProgress{CurrentStep: 1}

	if err := s.repo.CreateUserWithDefaults(ctx, user, profile, progress); err != nil {
		return nil, err
	}

	user.Role = role
	user.Profile = profile
	return s.issueAuth(ctx, user, false, "", "")
}

func (s *service) Login(ctx context.Context, req LoginRequest, userAgent, ip string) (*AuthResponse, error) {
	email := strings.TrimSpace(strings.ToLower(req.Email))
	user, err := s.repo.FindUserByEmail(ctx, email)
	if errors.Is(err, ErrNotFound) {
		return nil, ErrInvalidCredentials
	}
	if err != nil {
		return nil, err
	}
	if !hasher.Check(user.PasswordHash, req.Password) {
		return nil, ErrInvalidCredentials
	}
	if user.Status == StatusLocked {
		return nil, ErrAccountLocked
	}

	now := time.Now().UTC()
	user.LastLoginAt = &now
	_ = s.repo.UpdateUser(ctx, user)

	return s.issueAuth(ctx, user, req.Remember, userAgent, ip)
}

func (s *service) Refresh(ctx context.Context, refreshToken, userAgent, ip string) (*TokenPair, error) {
	claims, err := s.tokens.ParseRefreshToken(refreshToken)
	if err != nil {
		return nil, ErrInvalidCredentials
	}

	stored, err := s.repo.FindRefreshTokenByHash(ctx, hashToken(refreshToken))
	if errors.Is(err, ErrNotFound) {
		return nil, ErrInvalidCredentials
	}
	if err != nil {
		return nil, err
	}
	if stored.RevokedAt != nil || time.Now().After(stored.ExpiresAt) {
		return nil, ErrInvalidCredentials
	}

	userID, err := uuid.Parse(claims.Subject)
	if err != nil {
		return nil, ErrInvalidCredentials
	}
	user, err := s.repo.FindUserByID(ctx, userID)
	if err != nil {
		return nil, err
	}
	if user.Status == StatusLocked {
		return nil, ErrAccountLocked
	}

	_ = s.repo.RevokeRefreshToken(ctx, stored.ID)
	pair, err := s.createTokenPair(ctx, user, false, userAgent, ip)
	return pair, err
}

func (s *service) Logout(ctx context.Context, refreshToken string) error {
	stored, err := s.repo.FindRefreshTokenByHash(ctx, hashToken(refreshToken))
	if errors.Is(err, ErrNotFound) {
		return nil
	}
	if err != nil {
		return err
	}
	return s.repo.RevokeRefreshToken(ctx, stored.ID)
}

func (s *service) Me(ctx context.Context, userID uuid.UUID) (*UserResponse, error) {
	user, err := s.repo.FindUserByID(ctx, userID)
	if err != nil {
		return nil, err
	}
	resp := toUserResponse(user)
	return &resp, nil
}

func (s *service) ForgotPassword(ctx context.Context, email string) (string, error) {
	email = strings.TrimSpace(strings.ToLower(email))
	user, err := s.repo.FindUserByEmail(ctx, email)
	if errors.Is(err, ErrNotFound) {
		// Do not leak existence
		return "", nil
	}
	if err != nil {
		return "", err
	}

	raw := uuid.NewString() + uuid.NewString()
	reset := &PasswordReset{
		ID:        uuid.New(),
		UserID:    user.ID,
		TokenHash: hashToken(raw),
		ExpiresAt: time.Now().UTC().Add(1 * time.Hour),
	}
	if err := s.repo.SavePasswordReset(ctx, reset); err != nil {
		return "", err
	}
	// Mailer not wired in P0 — return raw token only in non-prod callers / logs.
	return raw, nil
}

func (s *service) ResetPassword(ctx context.Context, token, newPassword string) error {
	if len(newPassword) < 8 {
		return ErrValidation
	}
	reset, err := s.repo.FindPasswordResetByHash(ctx, hashToken(token))
	if errors.Is(err, ErrNotFound) {
		return ErrInvalidResetToken
	}
	if err != nil {
		return err
	}
	if time.Now().After(reset.ExpiresAt) {
		return ErrInvalidResetToken
	}

	user, err := s.repo.FindUserByID(ctx, reset.UserID)
	if err != nil {
		return err
	}
	hash, err := hasher.Hash(newPassword)
	if err != nil {
		return err
	}
	user.PasswordHash = hash
	if err := s.repo.UpdateUser(ctx, user); err != nil {
		return err
	}
	return s.repo.MarkPasswordResetUsed(ctx, reset.ID)
}

func (s *service) issueAuth(ctx context.Context, user *User, remember bool, userAgent, ip string) (*AuthResponse, error) {
	pair, err := s.createTokenPair(ctx, user, remember, userAgent, ip)
	if err != nil {
		return nil, err
	}
	return &AuthResponse{
		User:   toUserResponse(user),
		Tokens: *pair,
	}, nil
}

func (s *service) createTokenPair(ctx context.Context, user *User, remember bool, userAgent, ip string) (*TokenPair, error) {
	roleName := RoleMember
	if user.Role != nil {
		roleName = user.Role.Name
	}

	access, _, err := s.tokens.GenerateAccessToken(user.ID.String(), roleName, user.Status)
	if err != nil {
		return nil, err
	}
	refresh, exp, err := s.tokens.GenerateRefreshToken(user.ID.String())
	if err != nil {
		return nil, err
	}
	if remember {
		exp = time.Now().UTC().Add(s.tokens.RefreshTTL() * 2)
	}

	var ua *string
	var ipPtr *string
	if userAgent != "" {
		ua = &userAgent
	}
	if ip != "" {
		ipPtr = &ip
	}

	rt := &RefreshToken{
		ID:        uuid.New(),
		UserID:    user.ID,
		TokenHash: hashToken(refresh),
		ExpiresAt: exp,
		UserAgent: ua,
		IP:        ipPtr,
	}
	if err := s.repo.SaveRefreshToken(ctx, rt); err != nil {
		return nil, err
	}

	return &TokenPair{
		AccessToken:  access,
		RefreshToken: refresh,
		ExpiresIn:    int64(s.tokens.AccessTTL().Seconds()),
		TokenType:    "Bearer",
	}, nil
}

func hashToken(raw string) string {
	sum := sha256.Sum256([]byte(raw))
	return hex.EncodeToString(sum[:])
}

func toUserResponse(user *User) UserResponse {
	roleName := RoleMember
	if user.Role != nil {
		roleName = user.Role.Name
	}
	resp := UserResponse{
		ID:        user.ID.String(),
		Email:     user.Email,
		Status:    user.Status,
		Role:      roleName,
		CreatedAt: user.CreatedAt.UTC().Format(time.RFC3339),
	}
	if user.Profile != nil {
		resp.Profile = &ProfileResponse{
			FullName:         user.Profile.FullName,
			Phone:            user.Profile.Phone,
			TelegramUsername: user.Profile.TelegramUsername,
			Timezone:         user.Profile.Timezone,
		}
	}
	return resp
}
