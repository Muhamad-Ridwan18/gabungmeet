<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Services\Branding\BrandingService;
use App\Support\ApiResponse;

class BrandingController extends Controller
{
    public function __construct(private BrandingService $branding) {}

    public function show()
    {
        return ApiResponse::ok($this->branding->getPublic());
    }
}
