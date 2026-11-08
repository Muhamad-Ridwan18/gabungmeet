<?php

namespace App\Services\Onboarding;

use App\Models\OnboardingProgress;
use App\Models\User;
use App\Models\VerificationRequest;
use App\Services\Settings\SettingsService;
use Illuminate\Support\Str;
use RuntimeException;

class OnboardingService
{
    public function __construct(
        private SettingsService $settings,
        private OnboardingVideosService $videos,
    ) {}

    public function get(User $user): array
    {
        return $this->buildProgress($user);
    }

    public function start(User $user): array
    {
        return match ($user->status) {
            User::STATUS_LOCKED => throw new RuntimeException('Account status does not allow this action', 403),
            User::STATUS_VERIFIED => throw new RuntimeException('Already verified', 409),
            User::STATUS_ONBOARDING, User::STATUS_PENDING, User::STATUS_REJECTED => $this->buildProgress($user),
            User::STATUS_REGISTERED => (function () use ($user) {
                $user->update(['status' => User::STATUS_ONBOARDING]);

                return $this->buildProgress($user->fresh());
            })(),
            default => throw new RuntimeException('Account status does not allow this action', 403),
        };
    }

    public function completeStep1(User $user): array
    {
        [$user, $progress] = $this->loadMutable($user);

        if (! $progress->step1_done_at) {
            $progress->update([
                'step1_done_at' => now(),
                'current_step' => 2,
            ]);
        }

        return $this->buildProgress($user->fresh());
    }

    public function completeStep2(User $user): array
    {
        [, $progress] = $this->loadMutable($user);

        if (! $progress->step1_done_at) {
            throw new RuntimeException('Complete previous steps first', 409);
        }

        if (! $progress->step2_done_at) {
            $progress->update([
                'step2_done_at' => now(),
                'current_step' => 3,
            ]);
        }

        return $this->buildProgress($user->fresh());
    }

    public function submitStep3(User $user, string $mt5Account, string $brokerServer): array
    {
        $mt5 = trim($mt5Account);
        $server = trim($brokerServer);
        if ($mt5 === '' || $server === '') {
            throw new RuntimeException('Invalid input', 422);
        }

        [$user, $progress] = $this->loadMutable($user);

        if (! $progress->step2_done_at) {
            throw new RuntimeException('Complete previous steps first', 409);
        }

        if ($progress->step3_done_at && $user->status !== User::STATUS_REJECTED) {
            return $this->buildProgress($user);
        }

        // Keep MT5 details as draft until deposit proof is uploaded + final submit.
        $draft = VerificationRequest::query()
            ->where('user_id', $user->id)
            ->where('status', VerificationRequest::STATUS_DRAFT)
            ->orderByDesc('created_at')
            ->first();

        if ($draft) {
            $draft->update([
                'mt5_account' => $mt5,
                'broker_server' => $server,
                'proof_key' => null,
            ]);
        } else {
            VerificationRequest::query()->create([
                'id' => (string) Str::uuid(),
                'user_id' => $user->id,
                'mt5_account' => $mt5,
                'broker_server' => $server,
                'status' => VerificationRequest::STATUS_DRAFT,
            ]);
        }

        $progress->update([
            'step3_done_at' => now(),
            'current_step' => 4,
        ]);

        if ($user->status === User::STATUS_REJECTED) {
            $user->update(['status' => User::STATUS_ONBOARDING]);
        }

        return $this->buildProgress($user->fresh());
    }

    public function completeStep4(User $user, string $proofKey): array
    {
        $key = trim($proofKey);
        if ($key === '') {
            throw new RuntimeException('Deposit proof is required', 422);
        }

        [, $progress] = $this->loadMutable($user);

        if (! $progress->step3_done_at) {
            throw new RuntimeException('Complete previous steps first', 409);
        }

        $latest = VerificationRequest::query()
            ->where('user_id', $user->id)
            ->whereIn('status', [
                VerificationRequest::STATUS_DRAFT,
                VerificationRequest::STATUS_PENDING,
                VerificationRequest::STATUS_REJECTED,
            ])
            ->orderByDesc('created_at')
            ->first();

        if (! $latest) {
            throw new RuntimeException('Submit MT5 details first', 409);
        }

        $latest->update(['proof_key' => $key]);

        if (! $progress->step4_done_at) {
            $progress->update([
                'step4_done_at' => now(),
                'current_step' => 5,
            ]);
        }

        return $this->buildProgress($user->fresh());
    }

    public function completeStep5(User $user): array
    {
        [$user, $progress] = $this->loadMutable($user);

        if (! $progress->step4_done_at) {
            throw new RuntimeException('Complete previous steps first', 409);
        }

        $latest = VerificationRequest::query()
            ->where('user_id', $user->id)
            ->orderByDesc('created_at')
            ->first();

        if (! $latest || ! filled($latest->proof_key)) {
            throw new RuntimeException('Deposit proof is required', 422);
        }

        if (! $progress->step5_done_at) {
            $now = now();
            if ($latest->status === VerificationRequest::STATUS_DRAFT) {
                $latest->update(['status' => VerificationRequest::STATUS_PENDING]);
            }
            $progress->update([
                'step5_done_at' => $now,
                'completed_at' => $now,
                'current_step' => 5,
            ]);
            $user->update(['status' => User::STATUS_PENDING]);
        }

        return $this->buildProgress($user->fresh());
    }

    /** @return array{0: User, 1: OnboardingProgress} */
    private function loadMutable(User $user): array
    {
        if (in_array($user->status, [User::STATUS_LOCKED, User::STATUS_REGISTERED], true)) {
            throw new RuntimeException('Account status does not allow this action', 403);
        }

        if ($user->status === User::STATUS_VERIFIED) {
            throw new RuntimeException('Already verified', 409);
        }

        $progress = OnboardingProgress::query()->firstOrCreate(
            ['user_id' => $user->id],
            ['current_step' => 1]
        );

        return [$user, $progress];
    }

    private function buildProgress(User $user): array
    {
        $progress = OnboardingProgress::query()->firstOrCreate(
            ['user_id' => $user->id],
            ['current_step' => 1]
        );

        $latest = VerificationRequest::query()
            ->where('user_id', $user->id)
            ->orderByDesc('created_at')
            ->first();

        $data = [
            'current_step' => (int) $progress->current_step,
            'status' => $user->status,
            'settings' => array_merge($this->settings->getPublic(), $this->videos->getPublic()),
        ];

        foreach (['step1_done_at', 'step2_done_at', 'step3_done_at', 'step4_done_at', 'step5_done_at', 'completed_at'] as $field) {
            if ($progress->{$field}) {
                $data[$field] = $progress->{$field}->toISOString();
            }
        }

        if ($latest) {
            $data['latest_verification'] = $latest->toApiArray();
        }

        return $data;
    }
}
