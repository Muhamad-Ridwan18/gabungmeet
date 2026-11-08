export type UserStatus =
  | "registered"
  | "onboarding"
  | "pending_verification"
  | "verified"
  | "rejected"
  | "locked";

export type UserRole = "member" | "admin" | "super_admin";

export type ApiEnvelope<T> = {
  success: boolean;
  message: string;
  data: T;
  meta: {
    page?: number;
    per_page?: number;
    total?: number;
    total_pages?: number;
  } | null;
  errors: { field: string; message: string }[] | null;
};

export type Profile = {
  full_name: string;
  phone?: string | null;
  telegram_username?: string | null;
  avatar_url?: string | null;
  timezone: string;
};

export type User = {
  id: string;
  email: string;
  status: UserStatus;
  role: UserRole;
  profile?: Profile;
  created_at: string;
};

export type TokenPair = {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: string;
};

export type AuthPayload = {
  user: User;
  tokens: TokenPair;
};
