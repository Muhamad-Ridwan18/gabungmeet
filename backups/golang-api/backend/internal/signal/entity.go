package signal

import (
	"time"

	"github.com/google/uuid"
)

const (
	DirectionBuy  = "buy"
	DirectionSell = "sell"

	StatusActive    = "active"
	StatusClosed    = "closed"
	StatusCancelled = "cancelled"

	ResultWin  = "win"
	ResultLoss = "loss"
	ResultBE   = "be"
)

type Signal struct {
	ID          uuid.UUID  `gorm:"type:uuid;primaryKey" json:"id"`
	Pair        string     `gorm:"size:32;not null;index" json:"pair"`
	Direction   string     `gorm:"size:8;not null" json:"direction"`
	Entry       float64    `gorm:"type:numeric(18,6);not null" json:"entry"`
	SL          *float64   `gorm:"type:numeric(18,6)" json:"sl,omitempty"`
	TP          *float64   `gorm:"type:numeric(18,6)" json:"tp,omitempty"`
	Status      string     `gorm:"size:16;not null;index" json:"status"`
	Result      *string    `gorm:"size:16" json:"result,omitempty"`
	Analysis    *string    `gorm:"type:text" json:"analysis,omitempty"`
	ChartKey    *string    `gorm:"size:255" json:"chart_key,omitempty"`
	PublishedAt time.Time  `gorm:"not null;index" json:"published_at"`
	CreatedBy   uuid.UUID  `gorm:"type:uuid;not null" json:"created_by"`
	CreatedAt   time.Time  `json:"created_at"`
	UpdatedAt   time.Time  `json:"updated_at"`
}

func (Signal) TableName() string { return "signals" }
