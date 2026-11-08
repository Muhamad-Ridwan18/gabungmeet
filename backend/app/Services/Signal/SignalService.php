<?php

namespace App\Services\Signal;

use App\Models\Signal;
use App\Models\User;
use Illuminate\Support\Str;
use RuntimeException;

class SignalService
{
    public function list(?string $status, int $page, int $perPage): array
    {
        $query = Signal::query();
        if ($status) {
            $query->where('status', $status);
        }

        $total = (clone $query)->count();
        $items = $query->orderByDesc('published_at')
            ->offset(($page - 1) * $perPage)
            ->limit($perPage)
            ->get()
            ->map(fn (Signal $s) => $s->toApiArray())
            ->all();

        return [$items, $total];
    }

    public function get(string $id): array
    {
        $signal = Signal::query()->find($id);
        if (! $signal) {
            throw new RuntimeException('Not found', 404);
        }

        return $signal->toApiArray();
    }

    public function create(User $author, array $input): array
    {
        $signal = $this->build($author->id, null, $input);
        $signal->save();

        return $signal->toApiArray();
    }

    public function update(string $id, array $input): array
    {
        $existing = Signal::query()->find($id);
        if (! $existing) {
            throw new RuntimeException('Not found', 404);
        }

        $signal = $this->build($existing->created_by, $existing, $input);
        $signal->save();

        return $signal->toApiArray();
    }

    public function patchStatus(string $id, array $input): array
    {
        $signal = Signal::query()->find($id);
        if (! $signal) {
            throw new RuntimeException('Not found', 404);
        }

        $status = strtolower(trim($input['status'] ?? ''));
        if (! in_array($status, [Signal::STATUS_ACTIVE, Signal::STATUS_CLOSED, Signal::STATUS_CANCELLED], true)) {
            throw new RuntimeException('Validation failed', 422);
        }

        $signal->status = $status;
        if (array_key_exists('result', $input)) {
            $result = strtolower(trim((string) $input['result']));
            if ($result !== '' && ! in_array($result, ['win', 'loss', 'be'], true)) {
                throw new RuntimeException('Validation failed', 422);
            }
            $signal->result = $result === '' ? null : $result;
        }
        $signal->save();

        return $signal->toApiArray();
    }

    private function build(string $authorId, ?Signal $existing, array $input): Signal
    {
        $pair = strtoupper(trim($input['pair'] ?? ($existing?->pair ?? '')));
        $direction = strtolower(trim($input['direction'] ?? ($existing?->direction ?? '')));
        $entry = (float) ($input['entry'] ?? $existing?->entry ?? 0);

        if ($pair === '' || ! in_array($direction, ['buy', 'sell'], true) || $entry == 0.0) {
            throw new RuntimeException('Validation failed', 422);
        }

        $status = strtolower(trim($input['status'] ?? ($existing?->status ?? Signal::STATUS_ACTIVE)));
        if (! in_array($status, [Signal::STATUS_ACTIVE, Signal::STATUS_CLOSED, Signal::STATUS_CANCELLED], true)) {
            throw new RuntimeException('Validation failed', 422);
        }

        $signal = $existing ?? new Signal([
            'id' => (string) Str::uuid(),
            'created_by' => $authorId,
            'published_at' => now(),
        ]);

        $signal->fill([
            'pair' => $pair,
            'direction' => $direction,
            'entry' => $entry,
            'sl' => $input['sl'] ?? $existing?->sl,
            'tp' => $input['tp'] ?? $existing?->tp,
            'status' => $status,
            'result' => $input['result'] ?? $existing?->result,
            'analysis' => $input['analysis'] ?? $existing?->analysis,
            'chart_key' => $input['chart_key'] ?? $existing?->chart_key,
        ]);

        return $signal;
    }
}
