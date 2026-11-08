<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Api\V1\Concerns\HandlesServiceErrors;
use App\Http\Controllers\Controller;
use App\Services\Branding\BrandingService;
use Illuminate\Http\Request;

class AdminBrandingController extends Controller
{
    use HandlesServiceErrors;

    public function __construct(private BrandingService $branding) {}

    public function show()
    {
        return $this->fromService(fn () => $this->branding->getAdmin());
    }

    public function update(Request $request)
    {
        return $this->fromService(
            fn () => $this->branding->update($request->only(['logo_key'])),
            'Branding updated'
        );
    }
}
