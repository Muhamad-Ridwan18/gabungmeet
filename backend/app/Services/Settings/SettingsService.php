<?php

namespace App\Services\Settings;

use App\Models\Setting;

class SettingsService
{
    public const KEY_IB_REGISTER_URL = 'ib_register_url';

    public const KEY_TELEGRAM_INVITE_URL = 'telegram_invite_url';

    public const KEY_BROKER_TUTORIAL_URL = 'broker_tutorial_url';

    public const KEY_DEPOSIT_TUTORIAL_URL = 'deposit_tutorial_url';

    public const KEY_AI_FAIL_THRESHOLD = 'ai_fail_threshold';

    public function getPublic(): array
    {
        return [
            'ib_register_url' => $this->getString(self::KEY_IB_REGISTER_URL, ''),
            'telegram_invite_url' => $this->getString(self::KEY_TELEGRAM_INVITE_URL, ''),
            'broker_tutorial_url' => $this->getString(self::KEY_BROKER_TUTORIAL_URL, ''),
            'deposit_tutorial_url' => $this->getString(self::KEY_DEPOSIT_TUTORIAL_URL, ''),
        ];
    }

    public function ensureDefaults(): void
    {
        $defaults = [
            self::KEY_IB_REGISTER_URL => 'https://example-broker.com/ib/register',
            self::KEY_TELEGRAM_INVITE_URL => 'https://t.me/ibcommunity',
            self::KEY_BROKER_TUTORIAL_URL => 'https://www.youtube.com/watch?v=yfZxu6YX1nU',
            self::KEY_DEPOSIT_TUTORIAL_URL => 'https://www.youtube.com/watch?v=yfZxu6YX1nU',
            self::KEY_AI_FAIL_THRESHOLD => '3',
        ];

        foreach ($defaults as $key => $value) {
            Setting::query()->firstOrCreate(
                ['key' => $key],
                ['value' => json_encode($value)]
            );
        }
    }

    public function getString(string $key, string $fallback = ''): string
    {
        $row = Setting::query()->find($key);
        if (! $row || $row->value === null || $row->value === '') {
            return $fallback;
        }

        $decoded = json_decode($row->value, true);
        if (is_string($decoded)) {
            return $decoded;
        }

        return is_scalar($row->value) ? (string) $row->value : $fallback;
    }

    public function setString(string $key, string $value): void
    {
        Setting::query()->updateOrCreate(
            ['key' => $key],
            ['value' => json_encode($value)]
        );
    }

    public function getTelegramInviteUrl(): string
    {
        return $this->getString(self::KEY_TELEGRAM_INVITE_URL, '');
    }

    public function setTelegramInviteUrl(string $url): array
    {
        $url = trim($url);
        if ($url !== '' && ! filter_var($url, FILTER_VALIDATE_URL)) {
            throw new \RuntimeException('Validation failed', 422);
        }

        $this->setString(self::KEY_TELEGRAM_INVITE_URL, $url);

        return ['telegram_invite_url' => $url];
    }

    public function aiFailThreshold(): int
    {
        $raw = $this->getString(self::KEY_AI_FAIL_THRESHOLD, '3');
        $n = (int) trim($raw);

        return $n >= 1 ? $n : 3;
    }
}
