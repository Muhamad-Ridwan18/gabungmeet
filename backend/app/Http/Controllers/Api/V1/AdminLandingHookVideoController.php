<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Api\V1\Concerns\HandlesServiceErrors;
use App\Http\Controllers\Controller;
use App\Services\Landing\LandingHookVideoService;
use Illuminate\Http\Request;

class AdminLandingHookVideoController extends Controller
{
    use HandlesServiceErrors;

    public function __construct(private LandingHookVideoService $hookVideo) {}

    public function show()
    {
        return $this->fromService(fn () => $this->hookVideo->getAdmin());
    }

    public function update(Request $request)
    {
        return $this->fromService(
            fn () => $this->hookVideo->update($request->only(['title', 'video_url', 'video_key', 'is_active'])),
            'Landing hook video updated'
        );
    }
}
