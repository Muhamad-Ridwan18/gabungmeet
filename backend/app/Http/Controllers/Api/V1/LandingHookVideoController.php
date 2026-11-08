<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Services\Landing\LandingHookVideoService;
use App\Support\ApiResponse;

class LandingHookVideoController extends Controller
{
    public function __construct(private LandingHookVideoService $hookVideo) {}

    public function show()
    {
        $data = $this->hookVideo->getPublic();

        return ApiResponse::ok($data, $data ? 'OK' : 'No hook video configured');
    }
}
