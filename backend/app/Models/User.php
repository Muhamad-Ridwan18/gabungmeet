<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, HasUuids, Notifiable, SoftDeletes;

    public $incrementing = false;

    protected $keyType = 'string';

    public const STATUS_REGISTERED = 'registered';

    public const STATUS_ONBOARDING = 'onboarding';

    public const STATUS_PENDING = 'pending_verification';

    public const STATUS_VERIFIED = 'verified';

    public const STATUS_REJECTED = 'rejected';

    public const STATUS_LOCKED = 'locked';

    protected $fillable = [
        'email',
        'password',
        'role_id',
        'member_level_id',
        'current_subscription_id',
        'status',
        'status_before_lock',
        'email_verified_at',
        'last_login_at',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'last_login_at' => 'datetime',
            'password' => 'hashed',
        ];
    }

    public function role(): BelongsTo
    {
        return $this->belongsTo(Role::class);
    }

    public function profile(): HasOne
    {
        return $this->hasOne(Profile::class);
    }

    public function memberLevel(): BelongsTo
    {
        return $this->belongsTo(MemberLevel::class);
    }

    public function currentSubscription(): BelongsTo
    {
        return $this->belongsTo(Subscription::class, 'current_subscription_id');
    }

    public function subscriptions(): HasMany
    {
        return $this->hasMany(Subscription::class);
    }

    public function onboardingProgress(): HasOne
    {
        return $this->hasOne(OnboardingProgress::class);
    }

    public function isAdmin(): bool
    {
        return in_array($this->role?->name, ['admin', 'super_admin'], true);
    }

    public function isVerifiedMember(): bool
    {
        return $this->status === self::STATUS_VERIFIED || $this->isAdmin();
    }

    public function hasActiveSubscription(): bool
    {
        $sub = $this->currentSubscription;

        return $sub && in_array($sub->status, ['active', 'trialing'], true);
    }

    /** FE-compatible user payload (matches Go auth envelope). */
    public function toApiArray(): array
    {
        $this->loadMissing(['profile', 'role', 'memberLevel', 'currentSubscription.plan']);

        return [
            'id' => $this->id,
            'email' => $this->email,
            'status' => $this->status,
            'role' => $this->role?->name ?? 'member',
            'created_at' => optional($this->created_at)?->toISOString(),
            'profile' => $this->profile ? [
                'full_name' => $this->profile->full_name,
                'phone' => $this->profile->phone,
                'telegram_username' => $this->profile->telegram_username,
                'timezone' => $this->profile->timezone,
            ] : null,
            'member_level' => $this->memberLevel?->code,
            'subscription' => $this->currentSubscription ? [
                'id' => $this->currentSubscription->id,
                'status' => $this->currentSubscription->status,
                'plan_code' => $this->currentSubscription->plan?->code,
                'current_period_end' => optional($this->currentSubscription->current_period_end)?->toISOString(),
            ] : null,
        ];
    }
}
