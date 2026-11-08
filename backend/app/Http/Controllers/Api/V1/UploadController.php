<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Api\V1\Concerns\HandlesServiceErrors;
use App\Http\Controllers\Controller;
use App\Services\Upload\UploadService;
use Illuminate\Http\Request;
use RuntimeException;

class UploadController extends Controller
{
    use HandlesServiceErrors;

    public function __construct(private UploadService $uploads) {}

    public function store(Request $request)
    {
        $request->validate(['file' => ['required', 'file']]);

        $purpose = $this->resolvePurpose($request, self::MEMBER_PURPOSES);

        return $this->fromService(
            fn () => $this->uploads->store(
                $request->file('file'),
                $purpose,
                false
            ),
            'Uploaded',
            201
        );
    }

    public function storeAdmin(Request $request)
    {
        $request->validate(['file' => ['required', 'file']]);

        $purpose = $this->resolvePurpose($request, self::ADMIN_PURPOSES);

        return $this->fromService(
            fn () => $this->uploads->store(
                $request->file('file'),
                $purpose,
                true
            ),
            'Uploaded',
            201
        );
    }

    public function storeAdminVideo(Request $request)
    {
        $request->validate(['file' => ['required', 'file']]);

        return $this->fromService(
            fn () => $this->uploads->store(
                $request->file('file'),
                'video',
                true
            ),
            'Uploaded',
            201
        );
    }

    /** @param list<string> $allowed */
    private function resolvePurpose(Request $request, array $allowed): string
    {
        $purpose = strtolower(trim((string) ($request->query('purpose') ?? $request->input('purpose') ?? 'temp')));

        if (! in_array($purpose, $allowed, true)) {
            throw new RuntimeException('Invalid upload purpose', 400);
        }

        return $purpose;
    }

    private const MEMBER_PURPOSES = ['proof', 'avatar', 'thumbnail', 'attachment', 'temp'];

    private const ADMIN_PURPOSES = ['proof', 'avatar', 'thumbnail', 'attachment', 'temp', 'video', 'logo', 'document'];
}
