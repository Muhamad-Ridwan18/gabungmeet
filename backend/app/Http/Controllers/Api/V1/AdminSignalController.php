<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Api\V1\Concerns\HandlesServiceErrors;
use App\Http\Controllers\Controller;
use App\Services\Signal\SignalService;
use App\Support\PaginationMeta;
use Illuminate\Http\Request;

class AdminSignalController extends Controller
{
    use HandlesServiceErrors;

    public function __construct(private SignalService $signals) {}

    public function index(Request $request)
    {
        [$page, $perPage] = PaginationMeta::normalize(
            (int) $request->query('page', 1),
            (int) $request->query('per_page', 20)
        );

        return $this->fromService(fn () => $this->paginated(
            fn () => $this->signals->list($request->query('status'), $page, $perPage),
            $page,
            $perPage
        ));
    }

    public function store(Request $request)
    {
        return $this->fromService(
            fn () => $this->signals->create($request->user(), $request->all()),
            'Signal created',
            201
        );
    }

    public function update(Request $request, string $id)
    {
        return $this->fromService(fn () => $this->signals->update($id, $request->all()), 'Signal updated');
    }

    public function patchStatus(Request $request, string $id)
    {
        return $this->fromService(fn () => $this->signals->patchStatus($id, $request->all()), 'Signal status updated');
    }
}
