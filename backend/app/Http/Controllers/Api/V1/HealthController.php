<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Support\ApiResponse;
use Illuminate\Support\Facades\DB;

class HealthController extends Controller
{
    public function health()
    {
        return ApiResponse::ok(['status' => 'up']);
    }

    public function ready()
    {
        try {
            DB::connection()->getPdo();
        } catch (\Throwable $e) {
            return ApiResponse::fail('database not ready', 503);
        }

        return ApiResponse::ok(['status' => 'ready']);
    }
}
