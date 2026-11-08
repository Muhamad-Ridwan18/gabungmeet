<?php

namespace App\Services\Auth;

use App\Models\OnboardingProgress;
use App\Models\Profile;
use App\Models\RefreshToken;
use App\Models\Role;
use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class AuthService
{
    public function register(string $email, string $password, string $fullName, string $whatsapp): array
    {
        $role = Role::query()->where('name', 'member')->firstOrFail();

        $user = User::query()->create([
            'email' => strtolower($email),
            'password' => $password,
            'role_id' => $role->id,
            'status' => User::STATUS_REGISTERED,
        ]);

        $phone = preg_replace('/[^\d+]/', '', $whatsapp) ?: $whatsapp;

        Profile::query()->create([
            'user_id' => $user->id,
            'full_name' => $fullName,
            'phone' => $phone,
            'timezone' => 'UTC',
        ]);

        OnboardingProgress::query()->create([
            'user_id' => $user->id,
            'current_step' => 1,
        ]);

        return $this->issueTokens($user);
    }

    public function login(string $email, string $password): ?array
    {
        $user = User::query()->where('email', strtolower($email))->first();
        if (! $user || ! Hash::check($password, $user->password)) {
            return null;
        }

        if ($user->status === User::STATUS_LOCKED) {
            return null;
        }

        $user->forceFill(['last_login_at' => now()])->save();

        return $this->issueTokens($user);
    }

    public function issueTokens(User $user): array
    {
        // Prune expired tokens only, so sessions on other devices stay signed in.
        $user->tokens()
            ->where('name', 'access')
            ->whereNotNull('expires_at')
            ->where('expires_at', '<', now())
            ->delete();

        $accessToken = $user->createToken('access', ['*'], now()->addMinutes((int) config('santara.jwt_access_ttl_minutes', 15)))->plainTextToken;

        $refreshPlain = Str::random(64);
        RefreshToken::query()->create([
            'user_id' => $user->id,
            'token_hash' => hash('sha256', $refreshPlain),
            'expires_at' => now()->addDays((int) config('santara.jwt_refresh_ttl_days', 30)),
            'user_agent' => request()->userAgent(),
            'ip' => request()->ip(),
        ]);

        return [
            'user' => $user->fresh(['profile', 'role', 'memberLevel', 'currentSubscription.plan'])->toApiArray(),
            'tokens' => [
                'access_token' => $accessToken,
                'refresh_token' => $refreshPlain,
                'token_type' => 'Bearer',
                'expires_in' => (int) config('santara.jwt_access_ttl_minutes', 15) * 60,
            ],
        ];
    }

    public function refresh(string $refreshToken): ?array
    {
        $row = RefreshToken::query()
            ->where('token_hash', hash('sha256', $refreshToken))
            ->whereNull('revoked_at')
            ->where('expires_at', '>', now())
            ->first();

        if (! $row) {
            return null;
        }

        $row->forceFill(['revoked_at' => now()])->save();

        return $this->issueTokens($row->user);
    }

    public function logout(User $user, ?string $refreshToken = null): void
    {
        $user->currentAccessToken()?->delete();

        if ($refreshToken) {
            RefreshToken::query()
                ->where('user_id', $user->id)
                ->where('token_hash', hash('sha256', $refreshToken))
                ->update(['revoked_at' => now()]);
        }
    }

    /**
     * @param  array{email?: string, full_name?: string, password?: string, current_password?: string}  $input
     */
    public function updateProfile(User $user, array $input): array
    {
        if (array_key_exists('email', $input) && $input['email'] !== null) {
            $email = strtolower(trim((string) $input['email']));
            if ($email === '') {
                throw ValidationException::withMessages(['email' => ['Email is required.']]);
            }
            $taken = User::query()
                ->where('email', $email)
                ->where('id', '!=', $user->id)
                ->exists();
            if ($taken) {
                throw ValidationException::withMessages(['email' => ['Email is already taken.']]);
            }
            $user->email = $email;
        }

        if (! empty($input['password'])) {
            $current = (string) ($input['current_password'] ?? '');
            if ($current === '' || ! Hash::check($current, $user->password)) {
                throw ValidationException::withMessages(['current_password' => ['Current password is incorrect.']]);
            }
            $user->password = $input['password'];
        }

        $user->save();

        if (array_key_exists('full_name', $input) && $input['full_name'] !== null) {
            $name = trim((string) $input['full_name']);
            if ($name === '') {
                throw ValidationException::withMessages(['full_name' => ['Username is required.']]);
            }
            $profile = $user->profile;
            if ($profile) {
                $profile->update(['full_name' => $name]);
            } else {
                Profile::query()->create([
                    'user_id' => $user->id,
                    'full_name' => $name,
                    'timezone' => 'UTC',
                ]);
            }
        }

        return $user->fresh(['profile', 'role', 'memberLevel', 'currentSubscription.plan'])->toApiArray();
    }
}
