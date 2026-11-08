package main

import (
	"context"
	"log/slog"
	"os"
	ossignal "os/signal"
	"path/filepath"
	"strings"
	"syscall"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
	"github.com/gofiber/fiber/v2/middleware/limiter"
	"github.com/gofiber/fiber/v2/middleware/recover"
	"github.com/gofiber/fiber/v2/middleware/requestid"

	"github.com/ib-community/api/config"
	"github.com/ib-community/api/internal/ai"
	"github.com/ib-community/api/internal/auth"
	"github.com/ib-community/api/internal/bonus"
	"github.com/ib-community/api/internal/content"
	"github.com/ib-community/api/internal/journal"
	"github.com/ib-community/api/internal/notification"
	"github.com/ib-community/api/internal/onboarding"
	"github.com/ib-community/api/internal/settings"
	"github.com/ib-community/api/internal/signal"
	"github.com/ib-community/api/internal/ticket"
	"github.com/ib-community/api/internal/upload"
	"github.com/ib-community/api/internal/verification"
	"github.com/ib-community/api/pkg/database"
	jwtpkg "github.com/ib-community/api/pkg/jwt"
	"github.com/ib-community/api/pkg/logger"
	"github.com/ib-community/api/pkg/response"
	"github.com/ib-community/api/pkg/storage"
)

func main() {
	cfg, err := config.Load()
	if err != nil {
		slog.Error("config load failed", "error", err)
		os.Exit(1)
	}

	log := logger.New(cfg.App.Env)
	slog.SetDefault(log)

	db, err := database.Connect(cfg.DB, cfg.App.Env)
	if err != nil {
		log.Error("database connection failed", "error", err)
		os.Exit(1)
	}

	if err := db.AutoMigrate(
		&auth.Role{},
		&auth.User{},
		&auth.Profile{},
		&auth.OnboardingProgress{},
		&auth.RefreshToken{},
		&auth.PasswordReset{},
		&verification.VerificationRequest{},
		&settings.Setting{},
		&notification.Notification{},
		&content.Category{},
		&content.Content{},
		&content.Bookmark{},
		&content.ViewHistory{},
		&signal.Signal{},
		&journal.TradingJournal{},
		&bonus.Bonus{},
		&ticket.Ticket{},
		&ticket.TicketMessage{},
		&ai.Conversation{},
		&ai.Message{},
		&ai.Knowledge{},
	); err != nil {
		log.Error("auto migrate failed", "error", err)
		os.Exit(1)
	}

	store, err := storage.NewLocalStorage(cfg.Storage.LocalRoot, cfg.Storage.PublicBaseURL)
	if err != nil {
		log.Error("storage init failed", "error", err)
		os.Exit(1)
	}

	tokens := jwtpkg.NewManager(cfg.JWT.Secret, cfg.JWT.AccessTTL, cfg.JWT.RefreshTTL, cfg.App.Name)
	authRepo := auth.NewRepository(db)
	authSvc := auth.NewService(authRepo, tokens)
	ctx := context.Background()
	if err := authSvc.AutoMigrate(ctx); err != nil {
		log.Error("ensure roles failed", "error", err)
		os.Exit(1)
	}

	settingsRepo := settings.NewRepository(db)
	settingsSvc := settings.NewService(settingsRepo)
	if err := settingsSvc.EnsureDefaults(ctx); err != nil {
		log.Error("seed settings failed", "error", err)
		os.Exit(1)
	}

	notifyRepo := notification.NewRepository(db)
	notifySvc := notification.NewService(notifyRepo)

	verifRepo := verification.NewRepository(db)
	verifSvc := verification.NewService(verifRepo, authRepo, notifySvc)
	onboardSvc := onboarding.NewService(authRepo, verifRepo, settingsSvc)

	contentRepo := content.NewRepository(db)
	contentSvc := content.NewService(contentRepo, store)

	signalRepo := signal.NewRepository(db)
	signalSvc := signal.NewService(signalRepo)
	journalRepo := journal.NewRepository(db)
	journalSvc := journal.NewService(journalRepo)
	bonusRepo := bonus.NewRepository(db)
	bonusSvc := bonus.NewService(bonusRepo, store, settingsSvc)
	ticketRepo := ticket.NewRepository(db)
	ticketSvc := ticket.NewService(ticketRepo, notifySvc)
	aiRepo := ai.NewRepository(db)
	aiSvc := ai.NewService(aiRepo, settingsSvc)

	authHandler := auth.NewHandler(authSvc)
	onboardHandler := onboarding.NewHandler(onboardSvc)
	verifHandler := verification.NewHandler(verifSvc)
	uploadHandler := upload.NewHandler(store)
	notifyHandler := notification.NewHandler(notifySvc)
	settingsHandler := settings.NewHandler(settingsSvc)
	contentHandler := content.NewHandler(contentSvc)
	signalHandler := signal.NewHandler(signalSvc)
	journalHandler := journal.NewHandler(journalSvc)
	bonusHandler := bonus.NewHandler(bonusSvc)
	ticketHandler := ticket.NewHandler(ticketSvc)
	aiHandler := ai.NewHandler(aiSvc)

	authMW := auth.AuthRequired(tokens)
	optionalAuth := auth.AuthOptional(tokens)
	adminMW := auth.RequireRoles(auth.RoleAdmin, auth.RoleSuperAdmin)
	verifiedMW := auth.RequireStatuses(auth.StatusVerified)

	if cfg.App.SeedDemo {
		if err := authSvc.SeedDemoUsers(ctx); err != nil {
			log.Error("seed demo users failed", "error", err)
		}
		if super, err := authRepo.FindUserByEmail(ctx, "super@ib.local"); err == nil {
			if err := contentSvc.SeedDemo(ctx, super.ID); err != nil {
				log.Error("seed content failed", "error", err)
			}
			if err := signalSvc.SeedDemo(ctx, super.ID); err != nil {
				log.Error("seed signals failed", "error", err)
			}
		}
		if verified, err := authRepo.FindUserByEmail(ctx, "verified@ib.local"); err == nil {
			if err := contentSvc.SeedDemoProgress(ctx, verified.ID); err != nil {
				log.Error("seed demo progress failed", "error", err)
			}
		}
		if err := bonusSvc.SeedDemo(ctx); err != nil {
			log.Error("seed bonuses failed", "error", err)
		}
		if err := aiSvc.SeedKnowledge(ctx); err != nil {
			log.Error("seed ai knowledge failed", "error", err)
		}
	} else if err := aiSvc.SeedKnowledge(ctx); err != nil {
		// Knowledge base is operational content, not demo accounts — keep in all envs if empty.
		log.Error("seed ai knowledge failed", "error", err)
	}

	app := fiber.New(fiber.Config{
		AppName:               cfg.App.Name,
		BodyLimit:             12 * 1024 * 1024,
		ReadTimeout:           15 * time.Second,
		WriteTimeout:          30 * time.Second,
		IdleTimeout:           60 * time.Second,
		ErrorHandler:          fiberErrorHandler,
		ProxyHeader:           fiber.HeaderXForwardedFor,
		EnableTrustedProxyCheck: true,
		TrustedProxies:        []string{"127.0.0.1", "::1"},
	})

	app.Use(recover.New())
	app.Use(requestid.New())
	corsCfg := cors.Config{
		AllowHeaders:     "Origin, Content-Type, Accept, Authorization",
		AllowMethods:     "GET,POST,PUT,PATCH,DELETE,OPTIONS",
		AllowCredentials: true,
	}
	if cfg.App.Env == "development" {
		corsCfg.AllowOriginsFunc = func(origin string) bool { return true }
	} else {
		corsCfg.AllowOrigins = cfg.Frontend
	}
	app.Use(cors.New(corsCfg))
	app.Use(limiter.New(limiter.Config{
		Max:        180,
		Expiration: time.Minute,
	}))
	app.Use(pathLimiter("/v1/auth", 30, time.Minute))
	app.Use(pathLimiter("/v1/uploads", 30, time.Minute))
	app.Use(pathLimiter("/v1/ai", 60, time.Minute))

	if !cfg.IsProduction() {
		storageRoot, err := filepath.Abs(cfg.Storage.LocalRoot)
		if err == nil {
			// Public assets only in local/dev. Production serves via nginx with proofs denied.
			app.Static("/storage", storageRoot)
		}
	}

	app.Get("/health", func(c *fiber.Ctx) error {
		return response.OK(c, "OK", fiber.Map{"status": "up"})
	})
	app.Get("/ready", func(c *fiber.Ctx) error {
		if err := database.Ping(db); err != nil {
			return response.Fail(c, fiber.StatusServiceUnavailable, "database not ready")
		}
		return response.OK(c, "OK", fiber.Map{"status": "ready"})
	})

	v1 := app.Group("/v1")
	auth.RegisterRoutes(v1, authHandler, authMW)
	onboarding.RegisterRoutes(v1, onboardHandler, authMW)
	verification.RegisterRoutes(v1, verifHandler, authMW, adminMW)
	upload.RegisterRoutes(v1, uploadHandler, authMW)
	notification.RegisterRoutes(v1, notifyHandler, authMW)
	settings.RegisterRoutes(v1, settingsHandler)
	content.RegisterRoutes(v1, contentHandler, optionalAuth, authMW, verifiedMW, adminMW)
	signal.RegisterRoutes(v1, signalHandler, authMW, verifiedMW, adminMW)
	journal.RegisterRoutes(v1, journalHandler, authMW, verifiedMW, adminMW)
	bonus.RegisterRoutes(v1, bonusHandler, authMW, verifiedMW, adminMW)
	ticket.RegisterRoutes(v1, ticketHandler, optionalAuth, authMW, adminMW)
	ai.RegisterRoutes(v1, aiHandler, optionalAuth, authMW, adminMW)

	go func() {
		addr := ":" + cfg.App.Port
		log.Info("api starting", "addr", addr, "env", cfg.App.Env, "seed_demo", cfg.App.SeedDemo)
		if err := app.Listen(addr); err != nil {
			log.Error("api stopped", "error", err)
			os.Exit(1)
		}
	}()

	quit := make(chan os.Signal, 1)
	ossignal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit
	log.Info("shutting down")
	shutdownCtx, cancel := context.WithTimeout(context.Background(), 15*time.Second)
	defer cancel()
	if err := app.ShutdownWithContext(shutdownCtx); err != nil {
		log.Error("shutdown error", "error", err)
	}
	if err := database.Close(db); err != nil {
		log.Error("database close error", "error", err)
	}
}

func pathLimiter(prefix string, max int, window time.Duration) fiber.Handler {
	return limiter.New(limiter.Config{
		Max:        max,
		Expiration: window,
		Next: func(c *fiber.Ctx) bool {
			return !strings.HasPrefix(c.Path(), prefix)
		},
	})
}

func fiberErrorHandler(c *fiber.Ctx, err error) error {
	code := fiber.StatusInternalServerError
	msg := "Internal server error"
	if e, ok := err.(*fiber.Error); ok {
		code = e.Code
		if code < 500 {
			msg = e.Message
		}
	}
	if code >= 500 {
		slog.Error("request error", "path", c.Path(), "status", code, "error", err)
	}
	return response.Fail(c, code, msg)
}
