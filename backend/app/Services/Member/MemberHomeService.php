<?php

namespace App\Services\Member;

use App\Models\Setting;
use App\Services\Upload\UploadService;
use Illuminate\Support\Str;
use RuntimeException;

class MemberHomeService
{
    public const SETTING_KEY = 'member_home';

    public function __construct(private UploadService $uploads) {}

    public function getPublic(): array
    {
        $data = $this->getStored();

        return [
            'welcome' => $this->publicVideoSlot($data['welcome'] ?? []),
            'tutorial' => $this->publicVideoSlot($data['tutorial'] ?? []),
            'referral' => $this->publicReferral($data['referral'] ?? []),
        ];
    }

    public function getAdmin(): array
    {
        $data = $this->getStored();

        return [
            'welcome' => $this->adminVideoSlot($data['welcome'] ?? []),
            'tutorial' => $this->adminVideoSlot($data['tutorial'] ?? []),
            'referral' => $this->adminReferral($data['referral'] ?? []),
            'updated_at' => $data['updated_at'] ?? null,
        ];
    }

    public function update(array $input): array
    {
        $data = $this->getStored();

        if (array_key_exists('welcome', $input) && is_array($input['welcome'])) {
            $data['welcome'] = $this->mergeVideoSlot($data['welcome'] ?? [], $input['welcome']);
        }

        if (array_key_exists('tutorial', $input) && is_array($input['tutorial'])) {
            $data['tutorial'] = $this->mergeVideoSlot($data['tutorial'] ?? [], $input['tutorial']);
        }

        if (array_key_exists('referral', $input) && is_array($input['referral'])) {
            $data['referral'] = $this->mergeReferral($data['referral'] ?? [], $input['referral']);
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
            'title' => (string) ($slot['title'] ?? 'Santara Pips'),
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

    /** @param array<string, mixed> $referral */
    private function publicReferral(array $referral): ?array
    {
        $link = trim((string) ($referral['link'] ?? ''));
        if ($link === '' || ! $this->toBool($referral['is_active'] ?? true)) {
            return null;
        }

        $barcodeUrl = $this->resolveBarcodeUrl($referral);

        return [
            'title' => (string) ($referral['title'] ?? 'Link Referral'),
            'link' => $link,
            'barcode_url' => $barcodeUrl,
        ];
    }

    /** @param array<string, mixed> $referral */
    private function adminReferral(array $referral): array
    {
        return [
            'title' => (string) ($referral['title'] ?? ''),
            'link' => (string) ($referral['link'] ?? ''),
            'barcode_key' => $referral['barcode_key'] ?? null,
            'barcode_url' => $this->resolveBarcodeUrl($referral),
            'is_active' => $this->toBool($referral['is_active'] ?? true),
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

    /** @param array<string, mixed> $existing @param array<string, mixed> $input */
    private function mergeReferral(array $existing, array $input): array
    {
        $referral = $existing;

        if (array_key_exists('title', $input)) {
            $referral['title'] = trim((string) $input['title']);
        }

        if (array_key_exists('link', $input)) {
            $link = trim((string) $input['link']);
            if ($link !== '' && ! filter_var($link, FILTER_VALIDATE_URL)) {
                throw new RuntimeException('Validation failed', 422);
            }
            $referral['link'] = $link;
        }

        if (! empty($input['barcode_key'])) {
            $referral['barcode_key'] = (string) $input['barcode_key'];
            $referral['barcode_url'] = $this->uploads->urlForKey($referral['barcode_key']);
        } elseif (array_key_exists('barcode_url', $input) && empty($input['barcode_key'])) {
            $url = trim((string) $input['barcode_url']);
            if ($url === '') {
                $referral['barcode_key'] = null;
                $referral['barcode_url'] = null;
            }
        }

        if (array_key_exists('is_active', $input)) {
            $referral['is_active'] = $this->toBool($input['is_active']);
        }

        return $referral;
    }

    private function toBool(mixed $value): bool
    {
        return filter_var($value, FILTER_VALIDATE_BOOLEAN, FILTER_NULL_ON_FAILURE) ?? false;
    }

    private function getStored(): array
    {
        $defaults = [
            'welcome' => $this->defaultVideoSlot('Selamat datang di Santara Pips'),
            'tutorial' => $this->defaultVideoSlot('Tutorial member'),
            'referral' => [
                'title' => 'Link Referral',
                'link' => '',
                'barcode_key' => null,
                'barcode_url' => null,
                'is_active' => true,
            ],
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
            'welcome' => array_merge($defaults['welcome'], $decoded['welcome'] ?? []),
            'tutorial' => array_merge($defaults['tutorial'], $decoded['tutorial'] ?? []),
            'referral' => array_merge($defaults['referral'], $decoded['referral'] ?? []),
            'updated_at' => $decoded['updated_at'] ?? null,
        ];
    }

    /** @return array<string, mixed> */
    private function defaultVideoSlot(string $title): array
    {
        return [
            'title' => $title,
            'video_url' => null,
            'video_key' => null,
            'is_active' => false,
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

    /** @param array<string, mixed> $referral */
    private function resolveBarcodeUrl(array $referral): ?string
    {
        if (! empty($referral['barcode_key'])) {
            return $this->uploads->urlForKey((string) $referral['barcode_key']);
        }

        $url = trim((string) ($referral['barcode_url'] ?? ''));

        return $url !== '' ? $url : null;
    }
}
