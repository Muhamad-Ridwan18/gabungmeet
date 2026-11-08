<?php

namespace App\Services\Upload;

use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use RuntimeException;

class UploadService
{
    /** @var array<string, array{max: int, ext?: string[]}> */
    private const PURPOSES = [
        'proof' => ['max' => 10 * 1024 * 1024],
        'avatar' => ['max' => 2 * 1024 * 1024],
        'thumbnail' => ['max' => 5 * 1024 * 1024],
        'attachment' => ['max' => 10 * 1024 * 1024],
        'temp' => ['max' => 5 * 1024 * 1024],
        'video' => ['max' => 120 * 1024 * 1024, 'ext' => ['mp4', 'webm', 'mov']],
        'document' => ['max' => 25 * 1024 * 1024, 'ext' => ['pdf']],
        'logo' => ['max' => 2 * 1024 * 1024, 'ext' => ['png', 'webp', 'jpg', 'jpeg', 'svg']],
    ];

    private const DEFAULT_EXT = ['jpg', 'jpeg', 'png', 'webp', 'pdf'];

    /** @var list<string> */
    private const ADMIN_ONLY_PURPOSES = ['video', 'logo', 'document'];

    public function store(UploadedFile $file, string $purpose = 'temp', bool $allowAdminOnly = false): array
    {
        $purpose = strtolower(trim($purpose));
        if (! isset(self::PURPOSES[$purpose])) {
            throw new RuntimeException('Invalid upload purpose', 400);
        }

        if (in_array($purpose, self::ADMIN_ONLY_PURPOSES, true) && ! $allowAdminOnly) {
            throw new RuntimeException('Invalid upload purpose', 400);
        }

        $max = self::PURPOSES[$purpose]['max'];
        if ($file->getSize() <= 0 || $file->getSize() > $max) {
            throw new RuntimeException(sprintf('File too large (max %dMB)', $max / (1024 * 1024)), 422);
        }

        $ext = strtolower($file->getClientOriginalExtension());
        if ($ext === 'jpeg') {
            $ext = 'jpg';
        }
        if (! in_array($ext, $this->allowedExtensions($purpose), true)) {
            throw new RuntimeException('Unsupported file type', 422);
        }

        $filename = Str::uuid().'_'.time().'.'.$ext;
        $key = "uploads/{$purpose}/{$filename}";
        Storage::disk('public')->putFileAs("uploads/{$purpose}", $file, $filename);

        return [
            'key' => $key,
            'url' => $this->urlForKey($key),
        ];
    }

    public function urlForKey(?string $key): ?string
    {
        if (! $key) {
            return null;
        }

        return Storage::disk('public')->url($key);
    }

    /** @return list<string> */
    private function allowedExtensions(string $purpose): array
    {
        return self::PURPOSES[$purpose]['ext'] ?? self::DEFAULT_EXT;
    }
}
