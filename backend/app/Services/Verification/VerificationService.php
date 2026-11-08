<?php

namespace App\Services\Verification;

use App\Models\OnboardingProgress;
use App\Models\User;
use App\Models\VerificationRequest;
use App\Services\Notification\NotificationService;
use Illuminate\Support\Facades\Storage;
use RuntimeException;

class VerificationService
{
    public function __construct(private NotificationService $notifications) {}

    public function me(User $user): array
    {
        $history = VerificationRequest::query()
            ->where('user_id', $user->id)
            ->orderByDesc('created_at')
            ->get()
            ->map(fn (VerificationRequest $v) => $v->toApiArray())
            ->all();

        return [
            'latest' => $history[0] ?? null,
            'history' => $history,
        ];
    }

    public function resubmit(User $user): void
    {
        if ($user->status !== User::STATUS_REJECTED) {
            throw new RuntimeException('verification is not pending', 409);
        }

        $progress = OnboardingProgress::query()->firstOrCreate(
            ['user_id' => $user->id],
            ['current_step' => 3]
        );

        $progress->update([
            'current_step' => 3,
            'step3_done_at' => null,
            'step4_done_at' => null,
            'step5_done_at' => null,
            'completed_at' => null,
        ]);

        $user->update(['status' => User::STATUS_ONBOARDING]);
    }

    public function adminList(?string $status, int $page, int $perPage): array
    {
        $query = VerificationRequest::query()->with('user.profile');

        if ($status) {
            $query->where('status', $status);
        } else {
            // Hide in-progress drafts from the default admin queue.
            $query->where('status', '!=', VerificationRequest::STATUS_DRAFT);
        }

        $total = (clone $query)->count();
        $items = $query->orderByDesc('created_at')
            ->offset(($page - 1) * $perPage)
            ->limit($perPage)
            ->get()
            ->map(function (VerificationRequest $item) {
                $row = $item->toApiArray();
                $row['user_email'] = $item->user?->email ?? '';
                $row['user_full_name'] = $item->user?->profile?->full_name ?? '';
                $row['user_phone'] = $item->user?->profile?->phone ?? '';

                return $row;
            })
            ->all();

        return [$items, $total];
    }

    public function adminGet(string $id): array
    {
        $req = VerificationRequest::query()->find($id);
        if (! $req) {
            throw new RuntimeException('Not found', 404);
        }

        $user = User::query()->with('profile')->find($req->user_id);
        if (! $user) {
            throw new RuntimeException('Not found', 404);
        }

        return [
            'request' => $req->toApiArray(),
            'user' => [
                'id' => $user->id,
                'email' => $user->email,
                'status' => $user->status,
                'profile' => $user->profile ? [
                    'full_name' => $user->profile->full_name,
                    'phone' => $user->profile->phone,
                    'telegram_username' => $user->profile->telegram_username,
                    'timezone' => $user->profile->timezone,
                ] : null,
            ],
        ];
    }

    public function approve(string $id, User $admin): void
    {
        $req = VerificationRequest::query()->find($id);
        if (! $req) {
            throw new RuntimeException('Not found', 404);
        }

        if ($req->status !== VerificationRequest::STATUS_PENDING) {
            throw new RuntimeException('verification is not pending', 409);
        }

        if (! filled($req->proof_key)) {
            throw new RuntimeException('Deposit proof is required', 422);
        }

        $user = User::query()->find($req->user_id);
        if (! $user) {
            throw new RuntimeException('Not found', 404);
        }

        $req->update([
            'status' => VerificationRequest::STATUS_APPROVED,
            'reviewed_by' => $admin->id,
            'reviewed_at' => now(),
        ]);

        $user->update([
            'status' => User::STATUS_VERIFIED,
            'status_before_lock' => null,
        ]);

        $this->notifications->notify(
            $user,
            'verification_approved',
            'Verification approved',
            'Your MT5 account has been verified. Premium modules are unlocked.',
            '/member'
        );
    }

    public function reject(string $id, User $admin, string $reason): void
    {
        $reason = trim($reason);
        if ($reason === '') {
            throw new RuntimeException('Invalid input', 422);
        }

        $req = VerificationRequest::query()->find($id);
        if (! $req) {
            throw new RuntimeException('Not found', 404);
        }

        if ($req->status !== VerificationRequest::STATUS_PENDING) {
            throw new RuntimeException('verification is not pending', 409);
        }

        $user = User::query()->find($req->user_id);
        if (! $user) {
            throw new RuntimeException('Not found', 404);
        }

        $req->update([
            'status' => VerificationRequest::STATUS_REJECTED,
            'rejection_reason' => $reason,
            'reviewed_by' => $admin->id,
            'reviewed_at' => now(),
        ]);

        $user->update(['status' => User::STATUS_REJECTED]);

        $this->notifications->notify(
            $user,
            'verification_rejected',
            'Verification rejected',
            $reason,
            '/onboarding'
        );
    }

    public function delete(string $id): void
    {
        $req = VerificationRequest::query()->find($id);
        if (! $req) {
            throw new RuntimeException('Not found', 404);
        }

        $user = User::query()->find($req->user_id);
        $wasPending = $req->status === VerificationRequest::STATUS_PENDING;

        if ($req->proof_key && Storage::disk('public')->exists($req->proof_key)) {
            Storage::disk('public')->delete($req->proof_key);
        }

        $req->delete();

        // Pending submission removed — let the member re-enter MT5 steps.
        if ($wasPending && $user && $user->status === User::STATUS_PENDING) {
            $progress = OnboardingProgress::query()->firstOrCreate(
                ['user_id' => $user->id],
                ['current_step' => 3]
            );

            $progress->update([
                'current_step' => 3,
                'step3_done_at' => null,
                'step4_done_at' => null,
                'step5_done_at' => null,
                'completed_at' => null,
            ]);

            $user->update(['status' => User::STATUS_ONBOARDING]);
        }
    }

    public function lockUser(string $userId): void
    {
        $user = User::query()->find($userId);
        if (! $user) {
            throw new RuntimeException('Not found', 404);
        }

        if ($user->status === User::STATUS_LOCKED) {
            return;
        }

        $user->update([
            'status_before_lock' => $user->status,
            'status' => User::STATUS_LOCKED,
        ]);
    }

    public function unlockUser(string $userId): void
    {
        $user = User::query()->find($userId);
        if (! $user) {
            throw new RuntimeException('Not found', 404);
        }

        if ($user->status !== User::STATUS_LOCKED) {
            return;
        }

        $restore = $user->status_before_lock ?: User::STATUS_ONBOARDING;
        $user->update([
            'status' => $restore,
            'status_before_lock' => null,
        ]);
    }
}
