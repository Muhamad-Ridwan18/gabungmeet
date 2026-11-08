package auth

import (
	"context"
	"errors"
	"log/slog"

	"github.com/google/uuid"
	"github.com/ib-community/api/pkg/hasher"
)

type seedUser struct {
	Email    string
	Password string
	FullName string
	Role     string
	Status   string
}

// SeedDemoUsers creates deterministic local accounts if missing.
// Password for all: password123
func (s *service) SeedDemoUsers(ctx context.Context) error {
	if err := s.repo.EnsureRoles(ctx); err != nil {
		return err
	}

	seeds := []seedUser{
		{
			Email:    "member@ib.local",
			Password: "password123",
			FullName: "Demo Member",
			Role:     RoleMember,
			Status:   StatusOnboarding,
		},
		{
			Email:    "verified@ib.local",
			Password: "password123",
			FullName: "Verified Member",
			Role:     RoleMember,
			Status:   StatusVerified,
		},
		{
			Email:    "admin@ib.local",
			Password: "password123",
			FullName: "Demo Admin",
			Role:     RoleAdmin,
			Status:   StatusVerified,
		},
		{
			Email:    "super@ib.local",
			Password: "password123",
			FullName: "Super Admin",
			Role:     RoleSuperAdmin,
			Status:   StatusVerified,
		},
	}

	for _, seed := range seeds {
		if _, err := s.repo.FindUserByEmail(ctx, seed.Email); err == nil {
			continue
		} else if !errors.Is(err, ErrNotFound) {
			return err
		}

		role, err := s.repo.FindRoleByName(ctx, seed.Role)
		if err != nil {
			return err
		}

		hash, err := hasher.Hash(seed.Password)
		if err != nil {
			return err
		}

		user := &User{
			ID:           uuid.New(),
			Email:        seed.Email,
			PasswordHash: hash,
			RoleID:       role.ID,
			Status:       seed.Status,
		}
		profile := &Profile{
			FullName: seed.FullName,
			Timezone: "UTC",
		}
		step := int16(1)
		if seed.Status == StatusVerified {
			step = 5
		}
		progress := &OnboardingProgress{CurrentStep: step}

		if err := s.repo.CreateUserWithDefaults(ctx, user, profile, progress); err != nil {
			return err
		}
		slog.Info("seeded demo user", "email", seed.Email, "role", seed.Role, "status", seed.Status)
	}

	return nil
}

func (s *service) AutoMigrate(ctx context.Context) error {
	return s.repo.EnsureRoles(ctx)
}
