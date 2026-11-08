<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Support\ApiResponse;

/**
 * Route stubs for Go API parity — implement services next sprint.
 * Returning 501 keeps FE wiring discoverable without silent 404s.
 */
class StubController extends Controller
{
    public function notImplemented(string $module = 'module')
    {
        return ApiResponse::fail(
            "Laravel {$module} endpoint not implemented yet. See docs/laravel-migration.md",
            501
        );
    }
}
