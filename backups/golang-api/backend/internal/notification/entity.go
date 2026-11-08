package notification

import (
	"time"

	"github.com/google/uuid"
)

type Notification struct {
	ID        uuid.UUID  `gorm:"type:uuid;primaryKey" json:"id"`
	UserID    uuid.UUID  `gorm:"type:uuid;not null;index" json:"user_id"`
	Type      string     `gorm:"size:64;not null" json:"type"`
	Title     string     `gorm:"size:255;not null" json:"title"`
	Body      string     `gorm:"type:text;not null" json:"body"`
	Link      *string    `gorm:"size:255" json:"link,omitempty"`
	ReadAt    *time.Time `json:"read_at,omitempty"`
	CreatedAt time.Time  `json:"created_at"`
}

func (Notification) TableName() string { return "notifications" }
