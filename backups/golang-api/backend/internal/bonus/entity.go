package bonus

import (
	"time"

	"github.com/google/uuid"
)

type Bonus struct {
	ID          uuid.UUID `gorm:"type:uuid;primaryKey" json:"id"`
	Title       string    `gorm:"size:255;not null" json:"title"`
	Description *string   `gorm:"type:text" json:"description,omitempty"`
	FileKey     *string   `gorm:"size:255" json:"file_key,omitempty"`
	ExternalURL *string   `gorm:"type:text" json:"external_url,omitempty"`
	IsActive    bool      `gorm:"not null;default:true" json:"is_active"`
	SortOrder   int       `gorm:"not null;default:0" json:"sort_order"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
}

func (Bonus) TableName() string { return "bonuses" }
