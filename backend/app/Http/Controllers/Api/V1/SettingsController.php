<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Services\Settings\SettingsService;
use App\Support\ApiResponse;

class SettingsController extends Controller
{
    public function __construct(private SettingsService $settings) {}

    public function publicSettings()
    {
        return ApiResponse::ok($this->settings->getPublic());
    }
}
