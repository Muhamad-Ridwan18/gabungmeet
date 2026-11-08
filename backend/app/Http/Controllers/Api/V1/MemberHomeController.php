<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Services\Member\MemberHomeService;
use App\Support\ApiResponse;

class MemberHomeController extends Controller
{
    public function __construct(private MemberHomeService $memberHome) {}

    public function show()
    {
        return ApiResponse::ok($this->memberHome->getPublic());
    }
}
