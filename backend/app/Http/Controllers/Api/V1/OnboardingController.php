<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Api\V1\Concerns\HandlesServiceErrors;
use App\Http\Controllers\Controller;
use App\Services\Onboarding\OnboardingService;
use App\Support\ApiResponse;
use Illuminate\Http\Request;

class OnboardingController extends Controller
{
    use HandlesServiceErrors;

    public function __construct(private OnboardingService $onboarding) {}

    public function show(Request $request)
    {
        return $this->fromService(fn () => $this->onboarding->get($request->user()));
    }

    public function start(Request $request)
    {
        return $this->fromService(
            fn () => $this->onboarding->start($request->user()),
            'Membership verification started'
        );
    }

    public function completeStep1(Request $request)
    {
        return $this->fromService(
            fn () => $this->onboarding->completeStep1($request->user()),
            'Step 1 completed'
        );
    }

    public function completeStep2(Request $request)
    {
        return $this->fromService(
            fn () => $this->onboarding->completeStep2($request->user()),
            'Step 2 completed'
        );
    }

    public function submitStep3(Request $request)
    {
        $data = $request->validate([
            'mt5_account' => ['required', 'string', 'max:64'],
            'broker_server' => ['required', 'string', 'max:128'],
        ]);

        return $this->fromService(
            fn () => $this->onboarding->submitStep3($request->user(), $data['mt5_account'], $data['broker_server']),
            'MT5 details submitted'
        );
    }

    public function completeStep4(Request $request)
    {
        $data = $request->validate([
            'proof_key' => ['required', 'string', 'max:255'],
        ]);

        return $this->fromService(
            fn () => $this->onboarding->completeStep4($request->user(), $data['proof_key']),
            'Step 4 completed'
        );
    }

    public function completeStep5(Request $request)
    {
        return $this->fromService(
            fn () => $this->onboarding->completeStep5($request->user()),
            'Submitted for verification'
        );
    }
}
