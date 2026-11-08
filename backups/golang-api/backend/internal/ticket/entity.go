package ticket

import (
	"time"

	"github.com/google/uuid"
)

const (
	StatusOpen       = "open"
	StatusInProgress = "in_progress"
	StatusSolved     = "solved"
	StatusClosed     = "closed"

	SenderUser   = "user"
	SenderAdmin  = "admin"
	SenderSystem = "system"
)

type Ticket struct {
	ID               uuid.UUID  `gorm:"type:uuid;primaryKey" json:"id"`
	UserID           *uuid.UUID `gorm:"type:uuid;index" json:"user_id,omitempty"`
	Name             string     `gorm:"size:150;not null" json:"name"`
	TelegramUsername string     `gorm:"size:64" json:"telegram_username"`
	Email            *string    `gorm:"size:255" json:"email,omitempty"`
	Topic            string     `gorm:"size:120;not null;index" json:"topic"`
	Description      string     `gorm:"type:text;not null" json:"description"`
	Status           string     `gorm:"size:32;not null;index" json:"status"`
	AssignedTo       *uuid.UUID `gorm:"type:uuid" json:"assigned_to,omitempty"`
	CreatedAt        time.Time  `json:"created_at"`
	UpdatedAt        time.Time  `json:"updated_at"`
	Messages         []TicketMessage `gorm:"foreignKey:TicketID" json:"messages,omitempty"`
}

func (Ticket) TableName() string { return "tickets" }

type TicketMessage struct {
	ID             uuid.UUID  `gorm:"type:uuid;primaryKey" json:"id"`
	TicketID       uuid.UUID  `gorm:"type:uuid;not null;index" json:"ticket_id"`
	SenderID       *uuid.UUID `gorm:"type:uuid" json:"sender_id,omitempty"`
	SenderType     string     `gorm:"size:16;not null" json:"sender_type"`
	Message        string     `gorm:"type:text;not null" json:"message"`
	AttachmentKey  *string    `gorm:"size:255" json:"attachment_key,omitempty"`
	CreatedAt      time.Time  `json:"created_at"`
}

func (TicketMessage) TableName() string { return "ticket_messages" }
