<?php

namespace App\Services\Branding;

use App\Models\Setting;
use App\Services\Upload\UploadService;

class BrandingService
{
    public const SETTING_KEY = 'site_branding';

    public function __construct(private UploadService $uploads) {}

    public function getPublic(): array
    {
        $data = $this->getStored();

        return [
            'logo_url' => $this->resolveLogoUrl($data),
        ];
    }

    public function getAdmin(): array
    {
        $data = $this->getStored();

        return [
            'logo_key' => $data['logo_key'] ?? null,
            'logo_url' => $this->resolveLogoUrl($data),
            'updated_at' => $data['updated_at'] ?? null,
        ];
    }

    public function update(array $input): array
    {
        $data = $this->getStored();

        if (array_key_exists('logo_key', $input)) {
            $key = trim((string) ($input['logo_key'] ?? ''));
            $data['logo_key'] = $key !== '' ? $key : null;
        }

        $data['updated_at'] = now()->toIso8601String();
        $this->persist($data);

        return $this->getAdmin();
    }

    /** @return array<string, mixed> */
    private function getStored(): array
    {
        $defaults = [
            'logo_key' => null,
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

        return array_merge($defaults, $decoded);
    }

    /** @param array<string, mixed> $data */
    private function persist(array $data): void
    {
        Setting::query()->updateOrCreate(
            ['key' => self::SETTING_KEY],
            ['value' => json_encode($data)]
        );
    }

    /** @param array<string, mixed> $data */
    private function resolveLogoUrl(array $data): ?string
    {
        if (! empty($data['logo_key'])) {
            return $this->uploads->urlForKey((string) $data['logo_key']);
        }

        return null;
    }
}
