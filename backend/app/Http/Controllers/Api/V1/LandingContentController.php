<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Services\Landing\LandingContentService;
use App\Support\ApiResponse;

class LandingContentController extends Controller
{
    public function __construct(private LandingContentService $content) {}

    public function show()
    {
        $data = $this->content->getPublic();

        return ApiResponse::ok($data, $data ? 'OK' : 'No landing content configured');
    }
}
