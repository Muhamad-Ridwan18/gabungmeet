package content

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

const (
	ModuleAcademy       = "academy"
	ModulePsychology    = "psychology"
	ModuleDailyAnalysis = "daily_analysis"
	ModuleLanding       = "landing"

	TypeVideo   = "video"
	TypeArticle = "article"

	StatusDraft     = "draft"
	StatusPublished = "published"
	StatusArchived  = "archived"
)

type Category struct {
	ID           uuid.UUID      `gorm:"type:uuid;primaryKey" json:"id"`
	Module       string         `gorm:"size:32;not null;index" json:"module"`
	Name         string         `gorm:"size:120;not null" json:"name"`
	Slug         string         `gorm:"size:150;uniqueIndex;not null" json:"slug"`
	Description  *string        `gorm:"type:text" json:"description,omitempty"`
	ThumbnailKey *string        `gorm:"size:255" json:"thumbnail_key,omitempty"`
	SortOrder    int            `gorm:"not null;default:0" json:"sort_order"`
	IsActive     bool           `gorm:"not null;default:true" json:"is_active"`
	CreatedAt    time.Time      `json:"created_at"`
	UpdatedAt    time.Time      `json:"updated_at"`
	DeletedAt    gorm.DeletedAt `gorm:"index" json:"-"`
}

func (Category) TableName() string { return "categories" }

type Content struct {
	ID           uuid.UUID      `gorm:"type:uuid;primaryKey" json:"id"`
	CategoryID   *uuid.UUID     `gorm:"type:uuid;index" json:"category_id,omitempty"`
	Category     *Category      `gorm:"foreignKey:CategoryID" json:"category,omitempty"`
	Module       string         `gorm:"size:32;not null;index" json:"module"`
	Type         string         `gorm:"size:16;not null;index" json:"type"`
	Title        string         `gorm:"size:255;not null" json:"title"`
	Slug         string         `gorm:"size:255;uniqueIndex;not null" json:"slug"`
	Excerpt      *string        `gorm:"type:text" json:"excerpt,omitempty"`
	Body         *string        `gorm:"type:text" json:"body,omitempty"`
	ThumbnailKey *string        `gorm:"size:255" json:"thumbnail_key,omitempty"`
	VideoKey     *string        `gorm:"size:255" json:"video_key,omitempty"`
	DurationSec  *int           `json:"duration_sec,omitempty"`
	IsPremium    bool           `gorm:"not null;default:true" json:"is_premium"`
	Status       string         `gorm:"size:16;not null;index" json:"status"`
	PublishedAt  *time.Time     `json:"published_at,omitempty"`
	CreatedBy    uuid.UUID      `gorm:"type:uuid;not null" json:"created_by"`
	CreatedAt    time.Time      `json:"created_at"`
	UpdatedAt    time.Time      `json:"updated_at"`
	DeletedAt    gorm.DeletedAt `gorm:"index" json:"-"`
}

func (Content) TableName() string { return "contents" }

type Bookmark struct {
	ID        uuid.UUID `gorm:"type:uuid;primaryKey" json:"id"`
	UserID    uuid.UUID `gorm:"type:uuid;not null;uniqueIndex:idx_bookmark_user_content" json:"user_id"`
	ContentID uuid.UUID `gorm:"type:uuid;not null;uniqueIndex:idx_bookmark_user_content" json:"content_id"`
	Content   *Content  `gorm:"foreignKey:ContentID" json:"content,omitempty"`
	CreatedAt time.Time `json:"created_at"`
}

func (Bookmark) TableName() string { return "bookmarks" }

type ViewHistory struct {
	ID               uuid.UUID `gorm:"type:uuid;primaryKey" json:"id"`
	UserID           uuid.UUID `gorm:"type:uuid;not null;uniqueIndex:idx_history_user_content" json:"user_id"`
	ContentID        uuid.UUID `gorm:"type:uuid;not null;uniqueIndex:idx_history_user_content" json:"content_id"`
	Content          *Content  `gorm:"foreignKey:ContentID" json:"content,omitempty"`
	ProgressPct      float64   `gorm:"type:numeric(5,2);not null;default:0" json:"progress_pct"`
	LastPositionSec  int       `gorm:"not null;default:0" json:"last_position_sec"`
	Completed        bool      `gorm:"not null;default:false" json:"completed"`
	LastViewedAt     time.Time `gorm:"not null" json:"last_viewed_at"`
}

func (ViewHistory) TableName() string { return "view_histories" }
