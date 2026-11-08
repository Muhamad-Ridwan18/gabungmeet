package journal

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type TradingJournal struct {
	ID             uuid.UUID      `gorm:"type:uuid;primaryKey" json:"id"`
	UserID         uuid.UUID      `gorm:"type:uuid;not null;index" json:"user_id"`
	TradedAt       time.Time      `gorm:"not null;index" json:"traded_at"`
	Pair           string         `gorm:"size:32;not null" json:"pair"`
	Direction      string         `gorm:"size:8;not null" json:"direction"`
	Entry          *float64       `gorm:"type:numeric(18,6)" json:"entry,omitempty"`
	Exit           *float64       `gorm:"type:numeric(18,6)" json:"exit,omitempty"`
	SL             *float64       `gorm:"type:numeric(18,6)" json:"sl,omitempty"`
	TP             *float64       `gorm:"type:numeric(18,6)" json:"tp,omitempty"`
	Result         *string        `gorm:"size:16" json:"result,omitempty"`
	RR             *float64       `gorm:"type:numeric(10,2)" json:"rr,omitempty"`
	Notes          *string        `gorm:"type:text" json:"notes,omitempty"`
	Emotion        *string        `gorm:"size:64" json:"emotion,omitempty"`
	ScreenshotKey  *string        `gorm:"size:255" json:"screenshot_key,omitempty"`
	CreatedAt      time.Time      `json:"created_at"`
	UpdatedAt      time.Time      `json:"updated_at"`
	DeletedAt      gorm.DeletedAt `gorm:"index" json:"-"`
}

func (TradingJournal) TableName() string { return "trading_journals" }
