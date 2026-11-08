package verification

import (
	"time"

	"github.com/google/uuid"
)

const (
	StatusPending  = "pending"
	StatusApproved = "approved"
	StatusRejected = "rejected"
)

type VerificationRequest struct {
	ID              uuid.UUID  `gorm:"type:uuid;primaryKey" json:"id"`
	UserID          uuid.UUID  `gorm:"type:uuid;not null;index" json:"user_id"`
	MT5Account      string     `gorm:"size:64;not null" json:"mt5_account"`
	BrokerServer    string     `gorm:"size:128;not null" json:"broker_server"`
	ProofKey        *string    `gorm:"size:255" json:"proof_key,omitempty"`
	Status          string     `gorm:"size:32;not null;index" json:"status"`
	RejectionReason *string    `gorm:"type:text" json:"rejection_reason,omitempty"`
	ReviewedBy      *uuid.UUID `gorm:"type:uuid" json:"reviewed_by,omitempty"`
	ReviewedAt      *time.Time `json:"reviewed_at,omitempty"`
	CreatedAt       time.Time  `json:"created_at"`
	UpdatedAt       time.Time  `json:"updated_at"`
}

func (VerificationRequest) TableName() string { return "verification_requests" }
