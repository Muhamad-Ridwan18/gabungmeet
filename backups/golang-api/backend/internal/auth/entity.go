package auth

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

const (
	RoleMember     = "member"
	RoleAdmin      = "admin"
	RoleSuperAdmin = "super_admin"

	StatusRegistered          = "registered"
	StatusOnboarding          = "onboarding"
	StatusPendingVerification = "pending_verification"
	StatusVerified            = "verified"
	StatusRejected            = "rejected"
	StatusLocked              = "locked"
)

type Role struct {
	ID          uuid.UUID `gorm:"type:uuid;primaryKey" json:"id"`
	Name        string    `gorm:"size:50;uniqueIndex;not null" json:"name"`
	Description string    `gorm:"type:text" json:"description"`
	CreatedAt   time.Time `json:"created_at"`
}

type User struct {
	ID               uuid.UUID      `gorm:"type:uuid;primaryKey" json:"id"`
	Email            string         `gorm:"size:255;uniqueIndex;not null" json:"email"`
	PasswordHash     string         `gorm:"not null" json:"-"`
	RoleID           uuid.UUID      `gorm:"type:uuid;not null;index" json:"role_id"`
	Role             *Role          `gorm:"foreignKey:RoleID" json:"role,omitempty"`
	Status           string         `gorm:"size:32;not null;index" json:"status"`
	StatusBeforeLock *string        `gorm:"size:32" json:"status_before_lock,omitempty"`
	EmailVerifiedAt  *time.Time     `json:"email_verified_at,omitempty"`
	LastLoginAt      *time.Time     `json:"last_login_at,omitempty"`
	CreatedAt        time.Time      `json:"created_at"`
	UpdatedAt        time.Time      `json:"updated_at"`
	DeletedAt        gorm.DeletedAt `gorm:"index" json:"-"`
	Profile          *Profile       `gorm:"foreignKey:UserID" json:"profile,omitempty"`
}

func (User) TableName() string { return "users" }

type Profile struct {
	UserID           uuid.UUID `gorm:"type:uuid;primaryKey" json:"user_id"`
	FullName         string    `gorm:"size:150;not null" json:"full_name"`
	Phone            *string   `gorm:"size:30" json:"phone,omitempty"`
	TelegramUsername *string   `gorm:"size:64" json:"telegram_username,omitempty"`
	AvatarKey        *string   `gorm:"size:255" json:"avatar_key,omitempty"`
	Timezone         string    `gorm:"size:64;not null;default:UTC" json:"timezone"`
	Bio              *string   `gorm:"type:text" json:"bio,omitempty"`
	CreatedAt        time.Time `json:"created_at"`
	UpdatedAt        time.Time `json:"updated_at"`
}

func (Profile) TableName() string { return "profiles" }

type OnboardingProgress struct {
	UserID       uuid.UUID  `gorm:"type:uuid;primaryKey" json:"user_id"`
	CurrentStep  int16      `gorm:"not null;default:1" json:"current_step"`
	Step1DoneAt  *time.Time `json:"step1_done_at,omitempty"`
	Step2DoneAt  *time.Time `json:"step2_done_at,omitempty"`
	Step3DoneAt  *time.Time `json:"step3_done_at,omitempty"`
	Step4DoneAt  *time.Time `json:"step4_done_at,omitempty"`
	Step5DoneAt  *time.Time `json:"step5_done_at,omitempty"`
	CompletedAt  *time.Time `json:"completed_at,omitempty"`
	CreatedAt    time.Time  `json:"created_at"`
	UpdatedAt    time.Time  `json:"updated_at"`
}

func (OnboardingProgress) TableName() string { return "onboarding_progress" }

type RefreshToken struct {
	ID        uuid.UUID  `gorm:"type:uuid;primaryKey" json:"id"`
	UserID    uuid.UUID  `gorm:"type:uuid;not null;index" json:"user_id"`
	TokenHash string     `gorm:"not null" json:"-"`
	ExpiresAt time.Time  `gorm:"not null" json:"expires_at"`
	RevokedAt *time.Time `json:"revoked_at,omitempty"`
	UserAgent *string    `gorm:"type:text" json:"user_agent,omitempty"`
	IP        *string    `gorm:"size:64" json:"ip,omitempty"`
	CreatedAt time.Time  `json:"created_at"`
}

func (RefreshToken) TableName() string { return "refresh_tokens" }

type PasswordReset struct {
	ID        uuid.UUID  `gorm:"type:uuid;primaryKey" json:"id"`
	UserID    uuid.UUID  `gorm:"type:uuid;not null;index" json:"user_id"`
	TokenHash string     `gorm:"not null" json:"-"`
	ExpiresAt time.Time  `gorm:"not null" json:"expires_at"`
	UsedAt    *time.Time `json:"used_at,omitempty"`
	CreatedAt time.Time  `json:"created_at"`
}

func (PasswordReset) TableName() string { return "password_resets" }
