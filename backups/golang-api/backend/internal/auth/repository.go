package auth

import (
	"context"
	"errors"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

var ErrNotFound = errors.New("not found")

type Repository interface {
	FindRoleByName(ctx context.Context, name string) (*Role, error)
	CreateUserWithDefaults(ctx context.Context, user *User, profile *Profile, progress *OnboardingProgress) error
	FindUserByEmail(ctx context.Context, email string) (*User, error)
	FindUserByID(ctx context.Context, id uuid.UUID) (*User, error)
	UpdateUser(ctx context.Context, user *User) error
	GetOnboarding(ctx context.Context, userID uuid.UUID) (*OnboardingProgress, error)
	SaveOnboarding(ctx context.Context, progress *OnboardingProgress) error
	ListUsers(ctx context.Context, status string, page, perPage int) ([]User, int64, error)
	SaveRefreshToken(ctx context.Context, token *RefreshToken) error
	FindRefreshTokenByHash(ctx context.Context, hash string) (*RefreshToken, error)
	RevokeRefreshToken(ctx context.Context, id uuid.UUID) error
	SavePasswordReset(ctx context.Context, reset *PasswordReset) error
	FindPasswordResetByHash(ctx context.Context, hash string) (*PasswordReset, error)
	MarkPasswordResetUsed(ctx context.Context, id uuid.UUID) error
	EnsureRoles(ctx context.Context) error
}

type gormRepository struct {
	db *gorm.DB
}

func NewRepository(db *gorm.DB) Repository {
	return &gormRepository{db: db}
}

func (r *gormRepository) FindRoleByName(ctx context.Context, name string) (*Role, error) {
	var role Role
	err := r.db.WithContext(ctx).Where("name = ?", name).First(&role).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, ErrNotFound
	}
	return &role, err
}

func (r *gormRepository) CreateUserWithDefaults(ctx context.Context, user *User, profile *Profile, progress *OnboardingProgress) error {
	return r.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		if err := tx.Create(user).Error; err != nil {
			return err
		}
		profile.UserID = user.ID
		if err := tx.Create(profile).Error; err != nil {
			return err
		}
		progress.UserID = user.ID
		return tx.Create(progress).Error
	})
}

func (r *gormRepository) FindUserByEmail(ctx context.Context, email string) (*User, error) {
	var user User
	err := r.db.WithContext(ctx).Preload("Role").Preload("Profile").Where("email = ?", email).First(&user).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, ErrNotFound
	}
	return &user, err
}

func (r *gormRepository) FindUserByID(ctx context.Context, id uuid.UUID) (*User, error) {
	var user User
	err := r.db.WithContext(ctx).Preload("Role").Preload("Profile").First(&user, "id = ?", id).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, ErrNotFound
	}
	return &user, err
}

func (r *gormRepository) UpdateUser(ctx context.Context, user *User) error {
	return r.db.WithContext(ctx).Save(user).Error
}

func (r *gormRepository) GetOnboarding(ctx context.Context, userID uuid.UUID) (*OnboardingProgress, error) {
	var progress OnboardingProgress
	err := r.db.WithContext(ctx).First(&progress, "user_id = ?", userID).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, ErrNotFound
	}
	return &progress, err
}

func (r *gormRepository) SaveOnboarding(ctx context.Context, progress *OnboardingProgress) error {
	return r.db.WithContext(ctx).Save(progress).Error
}

func (r *gormRepository) ListUsers(ctx context.Context, status string, page, perPage int) ([]User, int64, error) {
	if page < 1 {
		page = 1
	}
	if perPage < 1 || perPage > 100 {
		perPage = 20
	}
	q := r.db.WithContext(ctx).Model(&User{})
	if status != "" {
		q = q.Where("status = ?", status)
	}
	var total int64
	if err := q.Count(&total).Error; err != nil {
		return nil, 0, err
	}
	var users []User
	err := q.Preload("Role").Preload("Profile").
		Order("created_at desc").
		Offset((page - 1) * perPage).
		Limit(perPage).
		Find(&users).Error
	return users, total, err
}

func (r *gormRepository) SaveRefreshToken(ctx context.Context, token *RefreshToken) error {
	return r.db.WithContext(ctx).Create(token).Error
}

func (r *gormRepository) FindRefreshTokenByHash(ctx context.Context, hash string) (*RefreshToken, error) {
	var token RefreshToken
	err := r.db.WithContext(ctx).Where("token_hash = ?", hash).First(&token).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, ErrNotFound
	}
	return &token, err
}

func (r *gormRepository) RevokeRefreshToken(ctx context.Context, id uuid.UUID) error {
	now := gorm.Expr("NOW()")
	return r.db.WithContext(ctx).Model(&RefreshToken{}).Where("id = ?", id).Update("revoked_at", now).Error
}

func (r *gormRepository) SavePasswordReset(ctx context.Context, reset *PasswordReset) error {
	return r.db.WithContext(ctx).Create(reset).Error
}

func (r *gormRepository) FindPasswordResetByHash(ctx context.Context, hash string) (*PasswordReset, error) {
	var reset PasswordReset
	err := r.db.WithContext(ctx).Where("token_hash = ? AND used_at IS NULL", hash).First(&reset).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, ErrNotFound
	}
	return &reset, err
}

func (r *gormRepository) MarkPasswordResetUsed(ctx context.Context, id uuid.UUID) error {
	now := gorm.Expr("NOW()")
	return r.db.WithContext(ctx).Model(&PasswordReset{}).Where("id = ?", id).Update("used_at", now).Error
}

func (r *gormRepository) EnsureRoles(ctx context.Context) error {
	roles := []Role{
		{ID: uuid.New(), Name: RoleMember, Description: "Default community member"},
		{ID: uuid.New(), Name: RoleAdmin, Description: "Community administrator"},
		{ID: uuid.New(), Name: RoleSuperAdmin, Description: "Full platform access"},
	}
	for _, role := range roles {
		var existing Role
		err := r.db.WithContext(ctx).Where("name = ?", role.Name).First(&existing).Error
		if errors.Is(err, gorm.ErrRecordNotFound) {
			if err := r.db.WithContext(ctx).Create(&role).Error; err != nil {
				return err
			}
			continue
		}
		if err != nil {
			return err
		}
	}
	return nil
}
