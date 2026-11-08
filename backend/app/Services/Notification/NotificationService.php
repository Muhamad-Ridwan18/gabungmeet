<?php

namespace App\Services\Notification;

use App\Models\Notification;
use App\Models\User;
use Illuminate\Support\Str;

class NotificationService
{
    public function notify(User|string $user, string $type, string $title, string $body, ?string $link = null): Notification
    {
        $userId = $user instanceof User ? $user->id : $user;

        return Notification::query()->create([
            'id' => (string) Str::uuid(),
            'user_id' => $userId,
            'type' => $type,
            'title' => $title,
            'body' => $body,
            'link' => $link,
        ]);
    }

    public function listForUser(string $userId, int $limit = 50): array
    {
        return Notification::query()
            ->where('user_id', $userId)
            ->orderByDesc('created_at')
            ->limit($limit)
            ->get()
            ->map(fn (Notification $n) => $n->toApiArray())
            ->all();
    }

    public function unreadCount(string $userId): int
    {
        return Notification::query()
            ->where('user_id', $userId)
            ->whereNull('read_at')
            ->count();
    }

    public function markRead(string $userId, string $id): bool
    {
        $updated = Notification::query()
            ->where('user_id', $userId)
            ->where('id', $id)
            ->whereNull('read_at')
            ->update(['read_at' => now()]);

        return $updated > 0;
    }

    public function markAllRead(string $userId): int
    {
        return Notification::query()
            ->where('user_id', $userId)
            ->whereNull('read_at')
            ->update(['read_at' => now()]);
    }
}
