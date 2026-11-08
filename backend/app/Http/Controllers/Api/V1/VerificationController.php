<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Api\V1\Concerns\HandlesServiceErrors;
use App\Http\Controllers\Controller;
use App\Services\Verification\VerificationService;
use App\Support\PaginationMeta;
use Illuminate\Http\Request;

class VerificationController extends Controller
{
    use HandlesServiceErrors;

    public function __construct(private VerificationService $verification) {}

    public function me(Request $request)
    {
        return $this->fromService(fn () => $this->verification->me($request->user()));
    }

    public function resubmit(Request $request)
    {
        return $this->fromService(function () use ($request) {
            $this->verification->resubmit($request->user());

            return null;
        }, 'Ready to resubmit MT5 details');
    }

    public function adminIndex(Request $request)
    {
        [$page, $perPage] = PaginationMeta::normalize(
            (int) $request->query('page', 1),
            (int) $request->query('per_page', 20)
        );

        return $this->fromService(fn () => $this->paginated(
            fn () => $this->verification->adminList($request->query('status'), $page, $perPage),
            $page,
            $perPage
        ));
    }

    public function adminShow(string $id)
    {
        return $this->fromService(fn () => $this->verification->adminGet($id));
    }

    public function approve(Request $request, string $id)
    {
        return $this->fromService(function () use ($request, $id) {
            $this->verification->approve($id, $request->user());

            return null;
        }, 'Verification approved');
    }

    public function reject(Request $request, string $id)
    {
        $data = $request->validate(['reason' => ['required', 'string', 'max:2000']]);

        return $this->fromService(function () use ($request, $id, $data) {
            $this->verification->reject($id, $request->user(), $data['reason']);

            return null;
        }, 'Verification rejected');
    }

    public function destroy(string $id)
    {
        return $this->fromService(function () use ($id) {
            $this->verification->delete($id);

            return null;
        }, 'Verification deleted');
    }
}
