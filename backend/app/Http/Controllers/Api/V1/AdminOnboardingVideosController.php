<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Api\V1\Concerns\HandlesServiceErrors;
use App\Http\Controllers\Controller;
use App\Services\Onboarding\OnboardingVideosService;
use Illuminate\Http\Request;

class AdminOnboardingVideosController extends Controller
{
    use HandlesServiceErrors;

    public function __construct(private OnboardingVideosService $videos) {}

    public function show()
    {
        return $this->fromService(fn () => $this->videos->getAdmin());
    }

    public function update(Request $request)
    {
        return $this->fromService(
            fn () => $this->videos->update($request->only(['broker_tutorial', 'deposit_tutorial'])),
            'Onboarding videos updated'
        );
    }
}
