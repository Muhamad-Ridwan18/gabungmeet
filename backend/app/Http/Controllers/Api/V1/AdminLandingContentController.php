<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Api\V1\Concerns\HandlesServiceErrors;
use App\Http\Controllers\Controller;
use App\Services\Landing\LandingContentService;
use Illuminate\Http\Request;

class AdminLandingContentController extends Controller
{
    use HandlesServiceErrors;

    public function __construct(private LandingContentService $content) {}

    public function show()
    {
        return $this->fromService(fn () => $this->content->getAdmin());
    }

    public function update(Request $request)
    {
        return $this->fromService(
            fn () => $this->content->update($request->only(['hero', 'sections', 'cta', 'disclaimer'])),
            'Landing content updated'
        );
    }
}
