package ai

import (
	"context"
	"errors"
	"strings"
	"time"

	"github.com/google/uuid"
	"github.com/ib-community/api/internal/settings"
	"gorm.io/gorm"
)

var ErrNotFound = errors.New("not found")
var ErrValidation = errors.New("validation failed")

type Repository interface {
	FindOrCreateConversation(ctx context.Context, sessionKey string, userID *uuid.UUID) (*Conversation, error)
	AddMessage(ctx context.Context, m *Message) error
	CountFails(ctx context.Context, conversationID uuid.UUID) (int64, error)
	ListKnowledge(ctx context.Context) ([]Knowledge, error)
	ListConversationsByUser(ctx context.Context, userID uuid.UUID) ([]Conversation, error)
	ListConversations(ctx context.Context, page, perPage int) ([]Conversation, int64, error)
	FindConversation(ctx context.Context, id uuid.UUID) (*Conversation, error)
	CountKnowledge(ctx context.Context) (int64, error)
	CreateKnowledge(ctx context.Context, k *Knowledge) error
	TouchConversation(ctx context.Context, id uuid.UUID) error
}

type gormRepository struct{ db *gorm.DB }

func NewRepository(db *gorm.DB) Repository { return &gormRepository{db: db} }

func (r *gormRepository) FindOrCreateConversation(ctx context.Context, sessionKey string, userID *uuid.UUID) (*Conversation, error) {
	var conv Conversation
	err := r.db.WithContext(ctx).Where("session_key = ?", sessionKey).First(&conv).Error
	if err == nil {
		if userID != nil && conv.UserID == nil {
			conv.UserID = userID
			_ = r.db.WithContext(ctx).Save(&conv).Error
		}
		return &conv, nil
	}
	if !errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, err
	}
	conv = Conversation{ID: uuid.New(), UserID: userID, SessionKey: sessionKey}
	if err := r.db.WithContext(ctx).Create(&conv).Error; err != nil {
		return nil, err
	}
	return &conv, nil
}

func (r *gormRepository) AddMessage(ctx context.Context, m *Message) error {
	return r.db.WithContext(ctx).Create(m).Error
}

func (r *gormRepository) CountFails(ctx context.Context, conversationID uuid.UUID) (int64, error) {
	var n int64
	err := r.db.WithContext(ctx).Model(&Message{}).
		Where("conversation_id = ? AND failed_attempt = ?", conversationID, true).
		Count(&n).Error
	return n, err
}

func (r *gormRepository) ListKnowledge(ctx context.Context) ([]Knowledge, error) {
	var items []Knowledge
	err := r.db.WithContext(ctx).Where("is_active = ?", true).Order("priority desc").Find(&items).Error
	return items, err
}

func (r *gormRepository) ListConversationsByUser(ctx context.Context, userID uuid.UUID) ([]Conversation, error) {
	var items []Conversation
	err := r.db.WithContext(ctx).Where("user_id = ?", userID).Order("updated_at desc").
		Preload("Messages", func(db *gorm.DB) *gorm.DB { return db.Order("created_at asc") }).
		Find(&items).Error
	return items, err
}

func (r *gormRepository) ListConversations(ctx context.Context, page, perPage int) ([]Conversation, int64, error) {
	if page < 1 {
		page = 1
	}
	if perPage < 1 || perPage > 100 {
		perPage = 20
	}
	q := r.db.WithContext(ctx).Model(&Conversation{})
	var total int64
	if err := q.Count(&total).Error; err != nil {
		return nil, 0, err
	}
	var items []Conversation
	err := q.Order("updated_at desc").Offset((page - 1) * perPage).Limit(perPage).Find(&items).Error
	return items, total, err
}

func (r *gormRepository) FindConversation(ctx context.Context, id uuid.UUID) (*Conversation, error) {
	var conv Conversation
	err := r.db.WithContext(ctx).Preload("Messages", func(db *gorm.DB) *gorm.DB {
		return db.Order("created_at asc")
	}).First(&conv, "id = ?", id).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, ErrNotFound
	}
	return &conv, err
}

func (r *gormRepository) CountKnowledge(ctx context.Context) (int64, error) {
	var n int64
	err := r.db.WithContext(ctx).Model(&Knowledge{}).Count(&n).Error
	return n, err
}

func (r *gormRepository) CreateKnowledge(ctx context.Context, k *Knowledge) error {
	return r.db.WithContext(ctx).Create(k).Error
}

func (r *gormRepository) TouchConversation(ctx context.Context, id uuid.UUID) error {
	return r.db.WithContext(ctx).Model(&Conversation{}).Where("id = ?", id).Update("updated_at", time.Now().UTC()).Error
}

type ChatInput struct {
	Message    string `json:"message"`
	SessionKey string `json:"session_key"`
}

type ChatReply struct {
	Reply                string  `json:"reply"`
	RedirectPath         *string `json:"redirect_path"`
	NeedHuman            bool    `json:"need_human"`
	SuggestedTicketTopic *string `json:"suggested_ticket_topic"`
	SessionKey           string  `json:"session_key"`
	ConversationID       string  `json:"conversation_id"`
}

type Service interface {
	Chat(ctx context.Context, userID *uuid.UUID, in ChatInput) (*ChatReply, error)
	ListMine(ctx context.Context, userID uuid.UUID) ([]Conversation, error)
	AdminList(ctx context.Context, page, perPage int) ([]Conversation, int64, error)
	AdminGet(ctx context.Context, id uuid.UUID) (*Conversation, error)
	SeedKnowledge(ctx context.Context) error
}

type service struct {
	repo     Repository
	settings settings.Service
}

func NewService(repo Repository, settingsSvc settings.Service) Service {
	return &service{repo: repo, settings: settingsSvc}
}

func (s *service) Chat(ctx context.Context, userID *uuid.UUID, in ChatInput) (*ChatReply, error) {
	msg := strings.TrimSpace(in.Message)
	if msg == "" {
		return nil, ErrValidation
	}
	sessionKey := strings.TrimSpace(in.SessionKey)
	if sessionKey == "" {
		sessionKey = uuid.NewString()
	}
	conv, err := s.repo.FindOrCreateConversation(ctx, sessionKey, userID)
	if err != nil {
		return nil, err
	}

	userMsg := &Message{
		ID: uuid.New(), ConversationID: conv.ID, Role: "user", Content: msg,
	}
	if err := s.repo.AddMessage(ctx, userMsg); err != nil {
		return nil, err
	}

	kb, err := s.repo.ListKnowledge(ctx)
	if err != nil {
		return nil, err
	}
	match := matchKnowledge(msg, kb)

	threshold := s.settings.AIFailThreshold(ctx)
	fails, _ := s.repo.CountFails(ctx, conv.ID)

	reply := &ChatReply{SessionKey: sessionKey, ConversationID: conv.ID.String()}
	assistant := &Message{ID: uuid.New(), ConversationID: conv.ID, Role: "assistant"}

	if match != nil {
		reply.Reply = match.Answer
		reply.RedirectPath = match.RedirectPath
		assistant.Content = match.Answer
		assistant.Intent = &match.Topic
		assistant.RedirectPath = match.RedirectPath
	} else {
		fails++
		reply.Reply = "Saya belum menemukan jawaban yang pas. Coba tanya soal registrasi IB, MT5, deposit, verifikasi, atau Telegram."
		assistant.Content = reply.Reply
		assistant.FailedAttempt = true
		topic := "General support"
		if fails >= int64(threshold) {
			reply.NeedHuman = true
			reply.SuggestedTicketTopic = &topic
		}
	}

	if err := s.repo.AddMessage(ctx, assistant); err != nil {
		return nil, err
	}
	_ = s.repo.TouchConversation(ctx, conv.ID)
	return reply, nil
}

func matchKnowledge(msg string, items []Knowledge) *Knowledge {
	normalized := strings.ToLower(msg)
	var best *Knowledge
	bestScore := 0
	for i := range items {
		k := &items[i]
		score := 0
		for _, raw := range strings.Split(k.Keywords, ",") {
			kw := strings.ToLower(strings.TrimSpace(raw))
			if kw == "" {
				continue
			}
			if strings.Contains(normalized, kw) {
				score += 1 + len(kw)/8
			}
		}
		if score > bestScore || (score == bestScore && score > 0 && best != nil && k.Priority > best.Priority) {
			bestScore = score
			best = k
		}
	}
	if bestScore == 0 {
		return nil
	}
	return best
}

func (s *service) ListMine(ctx context.Context, userID uuid.UUID) ([]Conversation, error) {
	return s.repo.ListConversationsByUser(ctx, userID)
}

func (s *service) AdminList(ctx context.Context, page, perPage int) ([]Conversation, int64, error) {
	return s.repo.ListConversations(ctx, page, perPage)
}

func (s *service) AdminGet(ctx context.Context, id uuid.UUID) (*Conversation, error) {
	return s.repo.FindConversation(ctx, id)
}

func (s *service) SeedKnowledge(ctx context.Context) error {
	n, err := s.repo.CountKnowledge(ctx)
	if err != nil || n > 0 {
		return err
	}
	redir := func(p string) *string { return &p }
	seeds := []Knowledge{
		{ID: uuid.New(), Topic: "broker_registration", Keywords: "daftar,register,ib,broker,registrasi", Answer: "Mulai dari onboarding step 1–2: buka link IB broker lalu lanjutkan proses registrasi.", RedirectPath: redir("/onboarding"), Priority: 10, IsActive: true},
		{ID: uuid.New(), Topic: "mt5", Keywords: "mt5,meta trader,metatrader,login mt5,akun trading", Answer: "Setelah akun broker aktif, lanjutkan onboarding untuk menghubungkan MT5 login Anda.", RedirectPath: redir("/onboarding"), Priority: 9, IsActive: true},
		{ID: uuid.New(), Topic: "deposit", Keywords: "deposit,setor,top up,funding", Answer: "Ikuti tutorial deposit di onboarding, lalu unggah bukti deposit untuk verifikasi.", RedirectPath: redir("/onboarding"), Priority: 9, IsActive: true},
		{ID: uuid.New(), Topic: "withdrawal", Keywords: "withdraw,withdrawal,penarikan,cairkan", Answer: "Penarikan dilakukan di platform broker Anda. Komunitas ini fokus akses konten setelah verifikasi IB.", RedirectPath: nil, Priority: 5, IsActive: true},
		{ID: uuid.New(), Topic: "telegram", Keywords: "telegram,grup,group,invite", Answer: "Link Telegram privat tersedia di modul Bonus setelah status verified.", RedirectPath: redir("/member/bonus"), Priority: 8, IsActive: true},
		{ID: uuid.New(), Topic: "verification", Keywords: "verifikasi,verification,approve,pending,bukti", Answer: "Setelah kirim bukti MT5/deposit, status jadi pending. Admin akan review di panel verifikasi.", RedirectPath: redir("/onboarding"), Priority: 8, IsActive: true},
		{ID: uuid.New(), Topic: "navigation", Keywords: "academy,signal,signals,journal,bonus,modul,menu", Answer: "Modul premium (Academy, Signals, Journal, Bonus) terbuka setelah akun verified.", RedirectPath: redir("/member"), Priority: 7, IsActive: true},
		{ID: uuid.New(), Topic: "faq", Keywords: "faq,bantuan,help,cara,bagaimana", Answer: "Anda bisa tanya soal IB, MT5, deposit, verifikasi, Telegram, atau navigasi website. Jika belum terbantu, minta bantuan manusia lewat Support.", RedirectPath: redir("/member/support"), Priority: 3, IsActive: true},
	}
	for i := range seeds {
		if err := s.repo.CreateKnowledge(ctx, &seeds[i]); err != nil {
			return err
		}
	}
	return nil
}
