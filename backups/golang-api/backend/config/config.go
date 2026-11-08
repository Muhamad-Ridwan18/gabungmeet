package config

import (
	"fmt"
	"os"
	"strconv"
	"strings"
	"time"

	"github.com/joho/godotenv"
)

type Config struct {
	App      AppConfig
	DB       DatabaseConfig
	JWT      JWTConfig
	Storage  StorageConfig
	AI       AIConfig
	Frontend string
}

type AppConfig struct {
	Name     string
	Env      string
	Port     string
	URL      string
	SeedDemo bool
}

type DatabaseConfig struct {
	Host     string
	Port     string
	User     string
	Password string
	Name     string
	SSLMode  string
}

func (d DatabaseConfig) DSN() string {
	return fmt.Sprintf(
		"host=%s user=%s password=%s dbname=%s port=%s sslmode=%s TimeZone=UTC",
		d.Host, d.User, d.Password, d.Name, d.Port, d.SSLMode,
	)
}

type JWTConfig struct {
	Secret     string
	AccessTTL  time.Duration
	RefreshTTL time.Duration
}

type StorageConfig struct {
	Driver        string
	LocalRoot     string
	PublicBaseURL string
}

type AIConfig struct {
	FailThreshold int
}

var weakSecrets = map[string]bool{
	"change-me-to-a-long-random-string": true,
	"dev-only-change-me":                true,
	"secret":                            true,
	"password":                          true,
	"jwt-secret":                        true,
}

func Load() (*Config, error) {
	_ = godotenv.Load()

	accessMin, err := strconv.Atoi(getEnv("JWT_ACCESS_TTL_MINUTES", "15"))
	if err != nil {
		return nil, fmt.Errorf("JWT_ACCESS_TTL_MINUTES: %w", err)
	}
	refreshDays, err := strconv.Atoi(getEnv("JWT_REFRESH_TTL_DAYS", "30"))
	if err != nil {
		return nil, fmt.Errorf("JWT_REFRESH_TTL_DAYS: %w", err)
	}
	failThreshold, err := strconv.Atoi(getEnv("AI_FAIL_THRESHOLD", "3"))
	if err != nil {
		return nil, fmt.Errorf("AI_FAIL_THRESHOLD: %w", err)
	}

	env := getEnv("APP_ENV", "development")
	seedDemo := env == "development" || strings.EqualFold(getEnv("SEED_DEMO", ""), "true")

	cfg := &Config{
		App: AppConfig{
			Name:     getEnv("APP_NAME", "Santara Pips"),
			Env:      env,
			Port:     getEnv("APP_PORT", "8080"),
			URL:      getEnv("APP_URL", "http://localhost:8080"),
			SeedDemo: seedDemo,
		},
		DB: DatabaseConfig{
			Host:     getEnv("DB_HOST", "localhost"),
			Port:     getEnv("DB_PORT", "5432"),
			User:     getEnv("DB_USER", "ibcommunity"),
			Password: getEnv("DB_PASSWORD", "ibcommunity"),
			Name:     getEnv("DB_NAME", "ib_community"),
			SSLMode:  getEnv("DB_SSLMODE", "disable"),
		},
		JWT: JWTConfig{
			Secret:     getEnv("JWT_SECRET", "change-me-to-a-long-random-string"),
			AccessTTL:  time.Duration(accessMin) * time.Minute,
			RefreshTTL: time.Duration(refreshDays) * 24 * time.Hour,
		},
		Storage: StorageConfig{
			Driver:        getEnv("STORAGE_DRIVER", "local"),
			LocalRoot:     getEnv("STORAGE_LOCAL_ROOT", "../storage"),
			PublicBaseURL: getEnv("STORAGE_PUBLIC_BASE_URL", "http://localhost:8080/storage"),
		},
		AI: AIConfig{
			FailThreshold: failThreshold,
		},
		Frontend: getEnv("FRONTEND_URL", "http://localhost:3000"),
	}

	if err := validateJWTSecret(cfg); err != nil {
		return nil, err
	}
	if cfg.App.Env == "production" && cfg.Frontend == "" {
		return nil, fmt.Errorf("FRONTEND_URL must be set in production")
	}

	return cfg, nil
}

func validateJWTSecret(cfg *Config) error {
	secret := strings.TrimSpace(cfg.JWT.Secret)
	if cfg.App.Env != "production" {
		return nil
	}
	if secret == "" || weakSecrets[secret] || strings.HasPrefix(secret, "dev-only") {
		return fmt.Errorf("JWT_SECRET must be a strong random value in production (openssl rand -hex 32)")
	}
	if len(secret) < 32 {
		return fmt.Errorf("JWT_SECRET must be at least 32 characters in production")
	}
	return nil
}

func getEnv(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}

func (c *Config) IsProduction() bool {
	return strings.EqualFold(c.App.Env, "production")
}
