package auth

type RegisterRequest struct {
	Email    string `json:"email"`
	Password string `json:"password"`
	FullName string `json:"full_name"`
}

type LoginRequest struct {
	Email    string `json:"email"`
	Password string `json:"password"`
	Remember bool   `json:"remember"`
}

type ForgotPasswordRequest struct {
	Email string `json:"email"`
}

type ResetPasswordRequest struct {
	Token       string `json:"token"`
	NewPassword string `json:"new_password"`
}

type TokenPair struct {
	AccessToken  string `json:"access_token"`
	RefreshToken string `json:"refresh_token"`
	ExpiresIn    int64  `json:"expires_in"`
	TokenType    string `json:"token_type"`
}

type UserResponse struct {
	ID        string           `json:"id"`
	Email     string           `json:"email"`
	Status    string           `json:"status"`
	Role      string           `json:"role"`
	Profile   *ProfileResponse `json:"profile,omitempty"`
	CreatedAt string           `json:"created_at"`
}

type ProfileResponse struct {
	FullName         string  `json:"full_name"`
	Phone            *string `json:"phone,omitempty"`
	TelegramUsername *string `json:"telegram_username,omitempty"`
	AvatarURL        *string `json:"avatar_url,omitempty"`
	Timezone         string  `json:"timezone"`
}

type AuthResponse struct {
	User   UserResponse `json:"user"`
	Tokens TokenPair    `json:"tokens"`
}
