<?php

namespace App\Services\Journal;

use App\Models\TradingJournal;
use Illuminate\Support\Str;
use RuntimeException;

class JournalService
{
    public function listMine(string $userId, int $page, int $perPage): array
    {
        $query = TradingJournal::query()->where('user_id', $userId);
        $total = (clone $query)->count();
        $items = $query->orderByDesc('traded_at')
            ->offset(($page - 1) * $perPage)
            ->limit($perPage)
            ->get()
            ->map(fn (TradingJournal $j) => $j->toApiArray())
            ->all();

        return [$items, $total];
    }

    public function listAdmin(int $page, int $perPage): array
    {
        $query = TradingJournal::query();
        $total = (clone $query)->count();
        $items = $query->orderByDesc('traded_at')
            ->offset(($page - 1) * $perPage)
            ->limit($perPage)
            ->get()
            ->map(fn (TradingJournal $j) => $j->toApiArray())
            ->all();

        return [$items, $total];
    }

    public function getMine(string $userId, string $id): array
    {
        $journal = TradingJournal::query()->find($id);
        if (! $journal) {
            throw new RuntimeException('Not found', 404);
        }
        if ($journal->user_id !== $userId) {
            throw new RuntimeException('Forbidden', 403);
        }

        return $journal->toApiArray();
    }

    public function create(string $userId, array $input): array
    {
        $journal = $this->build($userId, $input);
        $journal->save();

        return $journal->toApiArray();
    }

    public function update(string $userId, string $id, array $input): array
    {
        $existing = TradingJournal::query()->find($id);
        if (! $existing) {
            throw new RuntimeException('Not found', 404);
        }
        if ($existing->user_id !== $userId) {
            throw new RuntimeException('Forbidden', 403);
        }

        $journal = $this->build($userId, $input);
        $journal->id = $existing->id;
        $journal->created_at = $existing->created_at;
        $journal->save();

        return $journal->toApiArray();
    }

    public function delete(string $userId, string $id): void
    {
        $journal = TradingJournal::query()->find($id);
        if (! $journal) {
            throw new RuntimeException('Not found', 404);
        }
        if ($journal->user_id !== $userId) {
            throw new RuntimeException('Forbidden', 403);
        }
        $journal->delete();
    }

    private function build(string $userId, array $input): TradingJournal
    {
        $pair = strtoupper(trim($input['pair'] ?? ''));
        $direction = strtolower(trim($input['direction'] ?? ''));
        if ($pair === '' || ! in_array($direction, ['buy', 'sell'], true)) {
            throw new RuntimeException('Validation failed', 422);
        }

        $tradedAt = now();
        if (! empty($input['traded_at'])) {
            try {
                $tradedAt = \Carbon\Carbon::parse($input['traded_at'])->utc();
            } catch (\Throwable) {
                throw new RuntimeException('Validation failed', 422);
            }
        }

        return new TradingJournal([
            'id' => (string) Str::uuid(),
            'user_id' => $userId,
            'pair' => $pair,
            'direction' => $direction,
            'traded_at' => $tradedAt,
            'entry' => $input['entry'] ?? null,
            'exit' => $input['exit'] ?? null,
            'sl' => $input['sl'] ?? null,
            'tp' => $input['tp'] ?? null,
            'result' => $input['result'] ?? null,
            'rr' => $input['rr'] ?? null,
            'notes' => $input['notes'] ?? null,
            'emotion' => $input['emotion'] ?? null,
            'screenshot_key' => $input['screenshot_key'] ?? null,
        ]);
    }
}
