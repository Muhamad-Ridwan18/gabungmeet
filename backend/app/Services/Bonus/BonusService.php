<?php

namespace App\Services\Bonus;

use App\Models\Bonus;
use App\Services\Settings\SettingsService;
use App\Services\Upload\UploadService;
use Illuminate\Support\Str;
use RuntimeException;

class BonusService
{
    public function __construct(
        private SettingsService $settings,
        private UploadService $uploads,
    ) {}

    public function list(bool $admin = false): array
    {
        $query = Bonus::query()->orderBy('sort_order')->orderByDesc('created_at');
        if (! $admin) {
            $query->where('is_active', true);
        }

        return $query->get()->map(fn (Bonus $b) => $this->toDto($b))->all();
    }

    public function create(array $input): array
    {
        $bonus = $this->build(null, $input);
        $bonus->save();

        return $this->toDto($bonus);
    }

    public function update(string $id, array $input): array
    {
        $existing = Bonus::query()->find($id);
        if (! $existing) {
            throw new RuntimeException('Not found', 404);
        }

        $bonus = $this->build($existing, $input);
        $bonus->save();

        return $this->toDto($bonus);
    }

    public function delete(string $id): void
    {
        $bonus = Bonus::query()->find($id);
        if (! $bonus) {
            throw new RuntimeException('Not found', 404);
        }
        $bonus->delete();
    }

    public function telegramLink(): array
    {
        return ['telegram_invite_url' => $this->settings->getTelegramInviteUrl()];
    }

    private function build(?Bonus $existing, array $input): Bonus
    {
        $title = trim($input['title'] ?? ($existing?->title ?? ''));
        if ($title === '') {
            throw new RuntimeException('Validation failed', 422);
        }

        $fileUrl = $existing?->file_url;
        if (! empty($input['file_key'])) {
            $fileUrl = $this->uploads->urlForKey($input['file_key']);
        }

        $bonus = $existing ?? new Bonus(['id' => (string) Str::uuid()]);
        $bonus->fill([
            'title' => $title,
            'description' => $input['description'] ?? $existing?->description,
            'file_key' => $input['file_key'] ?? $existing?->file_key,
            'file_url' => $fileUrl,
            'external_url' => $input['external_url'] ?? $existing?->external_url,
            'is_active' => array_key_exists('is_active', $input) ? (bool) $input['is_active'] : ($existing?->is_active ?? true),
            'sort_order' => (int) ($input['sort_order'] ?? $existing?->sort_order ?? 0),
        ]);

        return $bonus;
    }

    private function toDto(Bonus $bonus): array
    {
        $fileUrl = $bonus->file_url;
        if (! $fileUrl && $bonus->file_key) {
            $fileUrl = $this->uploads->urlForKey($bonus->file_key);
        }

        return [
            'id' => $bonus->id,
            'title' => $bonus->title,
            'description' => $bonus->description,
            'file_url' => $fileUrl,
            'external_url' => $bonus->external_url,
            'is_active' => (bool) $bonus->is_active,
            'sort_order' => (int) $bonus->sort_order,
        ];
    }
}
