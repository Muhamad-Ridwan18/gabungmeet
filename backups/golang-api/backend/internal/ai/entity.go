package ai

import (
	"time"

	"github.com/google/uuid"
)

type Conversation struct {
	ID         uuid.UUID  `gorm:"type:uuid;primaryKey" json:"id"`
	UserID     *uuid.UUID `gorm:"type:uuid;index" json:"user_id,omitempty"`
	SessionKey string     `gorm:"size:64;not null;index" json:"session_key"`
	CreatedAt  time.Time  `json:"created_at"`
	UpdatedAt  time.Time  `json:"updated_at"`
	Messages   []Message  `gorm:"foreignKey:ConversationID" json:"messages,omitempty"`
}

func (Conversation) TableName() string { return "ai_conversations" }

type Message struct {
	ID            uuid.UUID `gorm:"type:uuid;primaryKey" json:"id"`
	ConversationID uuid.UUID `gorm:"type:uuid;not null;index" json:"conversation_id"`
	Role          string    `gorm:"size:16;not null" json:"role"`
	Content       string    `gorm:"type:text;not null" json:"content"`
	Intent        *string   `gorm:"size:64" json:"intent,omitempty"`
	RedirectPath  *string   `gorm:"size:255" json:"redirect_path,omitempty"`
	FailedAttempt bool      `gorm:"not null;default:false" json:"failed_attempt"`
	CreatedAt     time.Time `json:"created_at"`
}

func (Message) TableName() string { return "ai_messages" }

type Knowledge struct {
	ID           uuid.UUID `gorm:"type:uuid;primaryKey" json:"id"`
	Topic        string    `gorm:"size:64;not null;index" json:"topic"`
	Keywords     string    `gorm:"type:text;not null" json:"keywords"`
	Answer       string    `gorm:"type:text;not null" json:"answer"`
	RedirectPath *string   `gorm:"size:255" json:"redirect_path,omitempty"`
	IsActive     bool      `gorm:"not null;default:true" json:"is_active"`
	Priority     int       `gorm:"not null;default:0" json:"priority"`
	CreatedAt    time.Time `json:"created_at"`
	UpdatedAt    time.Time `json:"updated_at"`
}

func (Knowledge) TableName() string { return "ai_knowledge" }
