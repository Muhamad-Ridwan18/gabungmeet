package settings

import (
	"time"

	"github.com/google/uuid"
)

type Setting struct {
	Key       string     `gorm:"size:100;primaryKey" json:"key"`
	Value     string     `gorm:"type:text;not null" json:"value"`
	UpdatedBy *uuid.UUID `gorm:"type:uuid" json:"updated_by,omitempty"`
	UpdatedAt time.Time  `json:"updated_at"`
}

func (Setting) TableName() string { return "settings" }

const (
	KeyIBRegisterURL      = "ib_register_url"
	KeyTelegramInviteURL  = "telegram_invite_url"
	KeyBrokerTutorialURL  = "broker_tutorial_url"
	KeyDepositTutorialURL = "deposit_tutorial_url"
	KeyAIFailThreshold    = "ai_fail_threshold"
)
