<?php

namespace App\Services\Onboarding;

use App\Models\Setting;
use App\Services\Settings\SettingsService;
use App\Services\Upload\UploadService;
use Illuminate\Support\Str;
use RuntimeException;

class OnboardingVideosService
{
    public const SETTING_KEY = 'onboarding_videos';

    public function __construct(
        private UploadService $uploads,
        private SettingsService $settings,
    ) {}

    public function getPublic(): array
    {
        $data = $this->getStored();

        return [
            'broker_tutorial' => $this->publicVideoSlot($data['broker_tutorial'] ?? []),
            'deposit_tutorial' => $this->publicVideoSlot($data['deposit_tutorial'] ?? []),
        ];
    }

    public function getAdmin(): array
    {
        $data = $this->getStored();

        return [
            'broker_tutorial' => $this->adminVideoSlot($data['broker_tutorial'] ?? []),
            'deposit_tutorial' => $this->adminVideoSlot($data['deposit_tutorial'] ?? []),
            'updated_at' => $data['updated_at'] ?? null,
        ];
    }

    public function update(array $input): array
    {
        $data = $this->getStored();

        if (array_key_exists('broker_tutorial', $input) && is_array($input['broker_tutorial'])) {
            $data['broker_tutorial'] = $this->mergeVideoSlot($data['broker_tutorial'] ?? [], $input['broker_tutorial']);
        }

        if (array_key_exists('deposit_tutorial', $input) && is_array($input['deposit_tutorial'])) {
            $data['deposit_tutorial'] = $this->mergeVideoSlot($data['deposit_tutorial'] ?? [], $input['deposit_tutorial']);
        }

        $data['updated_at'] = now()->toIso8601String();
        $this->persist($data);

        return $this->getAdmin();
    }

    /** @param array<string, mixed> $slot */
    private function publicVideoSlot(array $slot): ?array
    {
        $url = $this->resolveVideoUrl($slot);
        if (! $this->toBool($slot['is_active'] ?? false) || ! $url) {
            return null;
        }

        return [
            'title' => (string) ($slot['title'] ?? 'Tutorial'),
            'video_url' => $url,
            'kind' => $this->detectKind($url),
        ];
    }

    /** @param array<string, mixed> $slot */
    private function adminVideoSlot(array $slot): array
    {
        $url = $this->resolveVideoUrl($slot);

        return [
            'title' => (string) ($slot['title'] ?? ''),
            'video_url' => $url,
            'video_key' => $slot['video_key'] ?? null,
            'is_active' => $this->toBool($slot['is_active'] ?? false),
            'kind' => $url ? $this->detectKind($url) : null,
        ];
    }

    /** @param array<string, mixed> $existing @param array<string, mixed> $input */
    private function mergeVideoSlot(array $existing, array $input): array
    {
        $slot = $existing;

        if (array_key_exists('title', $input)) {
            $title = trim((string) $input['title']);
            if ($title !== '') {
                $slot['title'] = $title;
            }
        }

        if (! empty($input['video_key'])) {
            $slot['video_key'] = (string) $input['video_key'];
            $slot['video_url'] = $this->uploads->urlForKey($slot['video_key']);
        } elseif (array_key_exists('video_url', $input)) {
            $url = trim((string) $input['video_url']);
            if ($url === '') {
                $slot['video_url'] = null;
                $slot['video_key'] = null;
            } else {
                if (! filter_var($url, FILTER_VALIDATE_URL)) {
                    throw new RuntimeException('Validation failed', 422);
                }
                $slot['video_url'] = $url;
                $slot['video_key'] = null;
            }
        }

        if (array_key_exists('is_active', $input)) {
            $slot['is_active'] = $this->toBool($input['is_active']);
        }

        if (($slot['is_active'] ?? false) && empty($this->resolveVideoUrl($slot))) {
            throw new RuntimeException('Validation failed', 422);
        }

        if (($slot['is_active'] ?? false) && trim((string) ($slot['title'] ?? '')) === '') {
            throw new RuntimeException('Validation failed', 422);
        }

        return $slot;
    }

    private function toBool(mixed $value): bool
    {
        return filter_var($value, FILTER_VALIDATE_BOOLEAN, FILTER_NULL_ON_FAILURE) ?? false;
    }

    private function getStored(): array
    {
        $defaults = [
            'broker_tutorial' => $this->defaultFromLegacy(
                'Tutorial broker',
                SettingsService::KEY_BROKER_TUTORIAL_URL
            ),
            'deposit_tutorial' => $this->defaultFromLegacy(
                'Tutorial deposit',
                SettingsService::KEY_DEPOSIT_TUTORIAL_URL
            ),
            'updated_at' => null,
        ];

        $row = Setting::query()->find(self::SETTING_KEY);
        if (! $row || ! $row->value) {
            return $defaults;
        }

        $decoded = json_decode($row->value, true);
        if (! is_array($decoded)) {
            return $defaults;
        }

        return [
            'broker_tutorial' => array_merge($defaults['broker_tutorial'], $decoded['broker_tutorial'] ?? []),
            'deposit_tutorial' => array_merge($defaults['deposit_tutorial'], $decoded['deposit_tutorial'] ?? []),
            'updated_at' => $decoded['updated_at'] ?? null,
        ];
    }

    /** @return array<string, mixed> */
    private function defaultFromLegacy(string $title, string $legacyKey): array
    {
        $legacyUrl = trim($this->settings->getString($legacyKey, ''));
        $hasUrl = $legacyUrl !== '' && filter_var($legacyUrl, FILTER_VALIDATE_URL);

        return [
            'title' => $title,
            'video_url' => $hasUrl ? $legacyUrl : null,
            'video_key' => null,
            'is_active' => $hasUrl,
        ];
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

    /** @param array<string, mixed> $slot */
    private function resolveVideoUrl(array $slot): ?string
    {
        if (! empty($slot['video_key'])) {
            return $this->uploads->urlForKey((string) $slot['video_key']);
        }

        $url = trim((string) ($slot['video_url'] ?? ''));

        return $url !== '' ? $url : null;
    }
}
