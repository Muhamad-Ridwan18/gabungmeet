<?php

namespace App\Services\Ticket;

use App\Models\Ticket;
use App\Models\TicketMessage;
use App\Models\User;
use App\Services\Notification\NotificationService;
use Illuminate\Support\Str;
use RuntimeException;

class TicketService
{
    public function __construct(private NotificationService $notifications) {}

    public function create(?User $user, array $input): array
    {
        $name = trim($input['name'] ?? ($user?->profile?->full_name ?? ''));
        $topic = trim($input['topic'] ?? '');
        $description = trim($input['description'] ?? '');

        if ($name === '' || $topic === '' || $description === '') {
            throw new RuntimeException('Validation failed', 422);
        }

        $ticket = Ticket::query()->create([
            'id' => (string) Str::uuid(),
            'user_id' => $user?->id,
            'name' => $name,
            'email' => trim($input['email'] ?? '') ?: $user?->email,
            'telegram_username' => trim($input['telegram_username'] ?? ''),
            'topic' => $topic,
            'description' => $description,
            'status' => Ticket::STATUS_OPEN,
        ]);

        TicketMessage::query()->create([
            'id' => (string) Str::uuid(),
            'ticket_id' => $ticket->id,
            'user_id' => $user?->id,
            'sender_type' => TicketMessage::SENDER_USER,
            'body' => $description,
        ]);

        return $ticket->fresh('messages')->toApiArray(true);
    }

    public function listMine(string $userId): array
    {
        return Ticket::query()
            ->where('user_id', $userId)
            ->orderByDesc('updated_at')
            ->get()
            ->map(fn (Ticket $t) => $t->toApiArray())
            ->all();
    }

    public function get(string $id, ?User $user, bool $isAdmin): array
    {
        $ticket = Ticket::query()->with('messages')->find($id);
        if (! $ticket) {
            throw new RuntimeException('Not found', 404);
        }

        if (! $isAdmin) {
            if (! $user || $ticket->user_id !== $user->id) {
                throw new RuntimeException('Forbidden', 403);
            }
        }

        return $ticket->toApiArray(true);
    }

    public function addMessage(string $id, User $sender, bool $isAdmin, array $input): array
    {
        $message = trim($input['message'] ?? '');
        if ($message === '') {
            throw new RuntimeException('Validation failed', 422);
        }

        $ticket = Ticket::query()->find($id);
        if (! $ticket) {
            throw new RuntimeException('Not found', 404);
        }

        if (! $isAdmin) {
            if ($ticket->user_id !== $sender->id) {
                throw new RuntimeException('Forbidden', 403);
            }
            if ($ticket->status === Ticket::STATUS_CLOSED) {
                throw new RuntimeException('Forbidden', 403);
            }
        }

        if ($isAdmin && $ticket->status === Ticket::STATUS_OPEN) {
            $ticket->update([
                'status' => Ticket::STATUS_IN_PROGRESS,
                'assigned_to' => $sender->id,
            ]);
        }

        $msg = TicketMessage::query()->create([
            'id' => (string) Str::uuid(),
            'ticket_id' => $ticket->id,
            'user_id' => $sender->id,
            'sender_type' => $isAdmin ? TicketMessage::SENDER_ADMIN : TicketMessage::SENDER_USER,
            'body' => $message,
            'attachment_key' => $input['attachment_key'] ?? null,
        ]);

        $ticket->touch();

        if ($isAdmin && $ticket->user_id) {
            $this->notifications->notify(
                $ticket->user_id,
                'ticket_reply',
                'Support reply',
                'Your ticket received a new reply.',
                '/member/support'
            );
        }

        return $msg->toApiArray();
    }

    public function adminList(?string $status, int $page, int $perPage): array
    {
        $query = Ticket::query();
        if ($status) {
            $query->where('status', $status);
        }

        $total = (clone $query)->count();
        $items = $query->orderByDesc('updated_at')
            ->offset(($page - 1) * $perPage)
            ->limit($perPage)
            ->get()
            ->map(fn (Ticket $t) => $t->toApiArray())
            ->all();

        return [$items, $total];
    }

    public function patchStatus(string $id, User $admin, string $status): array
    {
        $status = strtolower(trim($status));
        if (! in_array($status, [
            Ticket::STATUS_OPEN,
            Ticket::STATUS_IN_PROGRESS,
            Ticket::STATUS_SOLVED,
            Ticket::STATUS_CLOSED,
        ], true)) {
            throw new RuntimeException('Validation failed', 422);
        }

        $ticket = Ticket::query()->find($id);
        if (! $ticket) {
            throw new RuntimeException('Not found', 404);
        }

        $updates = ['status' => $status];
        if ($status === Ticket::STATUS_IN_PROGRESS && ! $ticket->assigned_to) {
            $updates['assigned_to'] = $admin->id;
        }
        $ticket->update($updates);

        return $ticket->fresh()->toApiArray();
    }
}
