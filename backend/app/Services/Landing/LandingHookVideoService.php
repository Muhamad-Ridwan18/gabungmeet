<?php

namespace App\Services\Landing;

use App\Models\Setting;
use App\Services\Upload\UploadService;
use Illuminate\Support\Str;
use RuntimeException;

class LandingHookVideoService
{
    public const SETTING_KEY = 'landing_hook_video';

    public function __construct(private UploadService $uploads) {}

    public function getPublic(): ?array
    {
        $data = $this->getStored();
        $videoUrl = $this->resolveVideoUrl($data);
        if (! ($data['is_active'] ?? false) || ! $videoUrl) {
            return null;
        }

        return [
            'title' => (string) ($data['title'] ?? 'Santara Pips'),
            'video_url' => $videoUrl,
            'kind' => $this->detectKind($videoUrl),
        ];
    }

    public function getAdmin(): array
    {
        $data = $this->getStored();
        $videoUrl = $this->resolveVideoUrl($data);

        return [
            'title' => (string) ($data['title'] ?? ''),
            'video_url' => $videoUrl,
            'video_key' => $data['video_key'] ?? null,
            'is_active' => (bool) ($data['is_active'] ?? false),
            'kind' => $videoUrl ? $this->detectKind($videoUrl) : null,
            'updated_at' => $data['updated_at'] ?? null,
        ];
    }

    public function update(array $input): array
    {
        $data = $this->getStored();

        if (array_key_exists('title', $input)) {
            $title = trim((string) $input['title']);
            if ($title === '') {
                throw new RuntimeException('Validation failed', 422);
            }
            $data['title'] = $title;
        }

        if (! empty($input['video_key'])) {
            $data['video_key'] = (string) $input['video_key'];
            $data['video_url'] = $this->uploads->urlForKey($data['video_key']);
        } elseif (array_key_exists('video_url', $input)) {
            $url = trim((string) $input['video_url']);
            if ($url === '') {
                $data['video_url'] = null;
                $data['video_key'] = null;
            } else {
                if (! filter_var($url, FILTER_VALIDATE_URL)) {
                    throw new RuntimeException('Validation failed', 422);
                }
                $data['video_url'] = $url;
                $data['video_key'] = null;
            }
        }

        if (array_key_exists('is_active', $input)) {
            $data['is_active'] = (bool) $input['is_active'];
        }

        if (($data['is_active'] ?? false) && empty($this->resolveVideoUrl($data))) {
            throw new RuntimeException('Validation failed', 422);
        }

        $data['updated_at'] = now()->toIso8601String();
        $this->persist($data);

        return $this->getAdmin();
    }

    private function getStored(): array
    {
        $row = Setting::query()->find(self::SETTING_KEY);
        if (! $row || ! $row->value) {
            return [
                'title' => 'Santara Pips',
                'video_url' => null,
                'video_key' => null,
                'is_active' => false,
                'updated_at' => null,
            ];
        }

        $decoded = json_decode($row->value, true);

        return is_array($decoded) ? $decoded : [];
    }

    private function persist(array $data): void
    {
        Setting::query()->updateOrCreate(
            ['key' => self::SETTING_KEY],
            ['value' => json_encode($data)]
        );
    }

    private function detectKind(string $url): string
    {
        $host = strtolower(parse_url($url, PHP_URL_HOST) ?? '');

        if (Str::contains($host, ['youtube.com', 'youtu.be', 'vimeo.com'])) {
            return 'embed';
        }

        return 'file';
    }

    /** @param array<string, mixed> $data */
    private function resolveVideoUrl(array $data): ?string
    {
        if (! empty($data['video_key'])) {
            return $this->uploads->urlForKey((string) $data['video_key']);
        }

        $url = trim((string) ($data['video_url'] ?? ''));

        return $url !== '' ? $url : null;
    }
}
