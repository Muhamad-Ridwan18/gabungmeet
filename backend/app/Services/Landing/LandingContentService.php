<?php

namespace App\Services\Landing;

use App\Models\Setting;
use RuntimeException;

/**
 * Admin-editable content for the public landing page (hero, sections, CTA, disclaimer).
 * Stored as JSON in the `settings` table, one value per locale where text is involved.
 */
class LandingContentService
{
    public const SETTING_KEY = 'landing_content';

    private const LOCALES = ['id', 'en'];

    private const KINDS = ['text', 'cards', 'steps', 'chips', 'compare'];

    private const ALLOWED_TAGS = '<p><br><strong><b><em><i><u><ul><ol><li><h2><h3><blockquote><a>';

    private const MAX_SECTIONS = 40;

    private const MAX_ITEMS = 30;

    /** Public payload: null when the admin has never saved, so the frontend uses its defaults. */
    public function getPublic(): ?array
    {
        $data = $this->getStored();
        if ($data === null) {
            return null;
        }

        $data['sections'] = array_values(array_filter(
            $data['sections'],
            fn (array $section) => (bool) ($section['enabled'] ?? false)
        ));

        return $data;
    }

    public function getAdmin(): array
    {
        $data = $this->getStored();

        return [
            'configured' => $data !== null,
            'content' => $data,
        ];
    }

    public function update(array $input): array
    {
        $sections = $input['sections'] ?? null;
        if (! is_array($sections) || count($sections) > self::MAX_SECTIONS) {
            throw new RuntimeException('Validation failed', 422);
        }

        $clean = [
            'hero' => $this->perLocale($input['hero'] ?? [], fn (array $h) => [
                'badge' => $this->text($h['badge'] ?? '', 120),
                'title_a' => $this->text($h['title_a'] ?? '', 80),
                'title_b' => $this->text($h['title_b'] ?? '', 80),
                'subtitle' => $this->text($h['subtitle'] ?? '', 200),
                'body' => $this->text($h['body'] ?? '', 600),
                'cta' => $this->text($h['cta'] ?? '', 60),
            ]),
            'sections' => $this->sections($sections),
            'cta' => $this->perLocale($input['cta'] ?? [], fn (array $c) => [
                'title' => $this->text($c['title'] ?? '', 200),
                'body' => $this->text($c['body'] ?? '', 600),
                'button' => $this->text($c['button'] ?? '', 60),
                'login' => $this->text($c['login'] ?? '', 60),
            ]),
            'disclaimer' => $this->perLocale($input['disclaimer'] ?? [], fn (array $d) => [
                'label' => $this->text($d['label'] ?? '', 80),
                'body' => $this->text($d['body'] ?? '', 3000),
            ]),
            'updated_at' => now()->toIso8601String(),
        ];

        Setting::query()->updateOrCreate(
            ['key' => self::SETTING_KEY],
            ['value' => json_encode($clean, JSON_UNESCAPED_UNICODE)]
        );

        return $this->getAdmin();
    }

    private function getStored(): ?array
    {
        $row = Setting::query()->find(self::SETTING_KEY);
        if (! $row || ! $row->value) {
            return null;
        }

        $decoded = json_decode($row->value, true);
        if (! is_array($decoded) || ! isset($decoded['sections']) || ! is_array($decoded['sections'])) {
            return null;
        }

        return $decoded;
    }

    /** @param array<int, mixed> $sections */
    private function sections(array $sections): array
    {
        $out = [];
        $seen = [];

        foreach (array_values($sections) as $i => $section) {
            if (! is_array($section)) {
                continue;
            }

            $key = preg_replace('/[^a-z0-9_-]/i', '', (string) ($section['key'] ?? '')) ?: 'section-'.($i + 1);
            if (isset($seen[$key])) {
                $key .= '-'.($i + 1);
            }
            $seen[$key] = true;

            $kind = (string) ($section['kind'] ?? 'text');
            if (! in_array($kind, self::KINDS, true)) {
                $kind = 'text';
            }

            $out[] = [
                'key' => $key,
                'kind' => $kind,
                'enabled' => (bool) ($section['enabled'] ?? true),
                'i18n' => $this->perLocale($section['i18n'] ?? [], fn (array $l) => [
                    'kicker' => $this->text($l['kicker'] ?? '', 120),
                    'title' => $this->text($l['title'] ?? '', 200),
                    'body' => $this->html($l['body'] ?? '', 20000),
                    'col_a' => $this->text($l['col_a'] ?? '', 120),
                    'col_b' => $this->text($l['col_b'] ?? '', 120),
                    'items' => $this->items($l['items'] ?? []),
                ]),
            ];
        }

        return $out;
    }

    private function items(mixed $items): array
    {
        if (! is_array($items)) {
            return [];
        }

        $out = [];
        foreach (array_slice(array_values($items), 0, self::MAX_ITEMS) as $item) {
            if (! is_array($item)) {
                continue;
            }
            $out[] = [
                'title' => $this->text($item['title'] ?? '', 200),
                'body' => $this->text($item['body'] ?? '', 1500),
            ];
        }

        return $out;
    }

    /** @param callable(array): array $build */
    private function perLocale(mixed $value, callable $build): array
    {
        $value = is_array($value) ? $value : [];
        $out = [];
        foreach (self::LOCALES as $locale) {
            $out[$locale] = $build(is_array($value[$locale] ?? null) ? $value[$locale] : []);
        }

        return $out;
    }

    private function text(mixed $value, int $max): string
    {
        return mb_substr(trim(strip_tags((string) $value)), 0, $max);
    }

    /** Rich text from the admin editor: keep a small set of tags and drop script vectors. */
    private function html(mixed $value, int $max): string
    {
        $clean = strip_tags((string) $value, self::ALLOWED_TAGS);
        $clean = preg_replace('/\s+on\w+\s*=\s*("[^"]*"|\'[^\']*\'|[^\s>]+)/i', '', $clean) ?? '';
        $clean = preg_replace('/href\s*=\s*(["\'])\s*(javascript|data|vbscript):[^"\']*\1/i', 'href="#"', $clean) ?? '';

        return mb_substr(trim($clean), 0, $max);
    }
}
