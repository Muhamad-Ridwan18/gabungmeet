<?php

namespace App\Services\Ai;

use App\Models\AiConversation;
use App\Models\AiKnowledge;
use App\Models\AiMessage;
use App\Models\User;
use App\Services\Settings\SettingsService;
use Illuminate\Support\Str;
use RuntimeException;

class AiService
{
    public function __construct(private SettingsService $settings) {}

    public function chat(?User $user, string $message, ?string $sessionKey = null): array
    {
        $message = trim($message);
        if ($message === '') {
            throw new RuntimeException('Validation failed', 422);
        }

        $sessionKey = trim((string) $sessionKey);
        if ($sessionKey === '') {
            $sessionKey = (string) Str::uuid();
        }

        $conversation = AiConversation::query()->firstOrCreate(
            ['session_key' => $sessionKey],
            ['id' => (string) Str::uuid(), 'user_id' => $user?->id]
        );

        if ($user && ! $conversation->user_id) {
            $conversation->update(['user_id' => $user->id]);
        }

        AiMessage::query()->create([
            'id' => (string) Str::uuid(),
            'conversation_id' => $conversation->id,
            'role' => 'user',
            'content' => $message,
        ]);

        $match = $this->matchKnowledge($message);
        $threshold = $this->settings->aiFailThreshold();
        $fails = AiMessage::query()
            ->where('conversation_id', $conversation->id)
            ->where('failed_attempt', true)
            ->count();

        $reply = [
            'session_key' => $sessionKey,
            'conversation_id' => $conversation->id,
            'need_human' => false,
            'redirect_path' => null,
            'suggested_ticket_topic' => null,
        ];

        if ($match) {
            $reply['reply'] = $match->answer;
            $reply['redirect_path'] = $match->redirect_path;

            AiMessage::query()->create([
                'id' => (string) Str::uuid(),
                'conversation_id' => $conversation->id,
                'role' => 'assistant',
                'content' => $match->answer,
                'intent' => $match->title,
                'redirect_path' => $match->redirect_path,
                'failed_attempt' => false,
            ]);
        } else {
            $fails++;
            $reply['reply'] = 'Saya belum menemukan jawaban yang pas. Coba tanya soal registrasi IB, MT5, deposit, verifikasi, atau Telegram.';

            AiMessage::query()->create([
                'id' => (string) Str::uuid(),
                'conversation_id' => $conversation->id,
                'role' => 'assistant',
                'content' => $reply['reply'],
                'failed_attempt' => true,
            ]);

            if ($fails >= $threshold) {
                $reply['need_human'] = true;
                $reply['suggested_ticket_topic'] = 'General support';
            }
        }

        $conversation->touch();

        return $reply;
    }

    public function listMine(string $userId): array
    {
        return AiConversation::query()
            ->with('messages')
            ->where('user_id', $userId)
            ->orderByDesc('updated_at')
            ->get()
            ->map(fn (AiConversation $c) => $c->toApiArray())
            ->all();
    }

    public function adminList(int $page, int $perPage): array
    {
        $query = AiConversation::query();
        $total = (clone $query)->count();
        $items = $query->orderByDesc('updated_at')
            ->offset(($page - 1) * $perPage)
            ->limit($perPage)
            ->get()
            ->map(fn (AiConversation $c) => $c->toApiArray(false))
            ->all();

        return [$items, $total];
    }

    public function adminGet(string $id): array
    {
        $conversation = AiConversation::query()->with('messages')->find($id);
        if (! $conversation) {
            throw new RuntimeException('Not found', 404);
        }

        return $conversation->toApiArray();
    }

    private function matchKnowledge(string $message): ?AiKnowledge
    {
        $normalized = strtolower($message);
        $items = AiKnowledge::query()->where('is_active', true)->orderByDesc('priority')->get();

        $best = null;
        $bestScore = 0;

        foreach ($items as $knowledge) {
            $score = 0;
            foreach ($knowledge->keywordList() as $keyword) {
                $kw = strtolower(trim($keyword));
                if ($kw === '') {
                    continue;
                }
                if (str_contains($normalized, $kw)) {
                    $score += 1 + (int) (strlen($kw) / 8);
                }
            }

            if ($score > $bestScore || ($score === $bestScore && $score > 0 && $best && $knowledge->priority > $best->priority)) {
                $bestScore = $score;
                $best = $knowledge;
            }
        }

        return $bestScore > 0 ? $best : null;
    }
}
