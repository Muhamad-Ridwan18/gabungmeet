<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Api\V1\Concerns\HandlesServiceErrors;
use App\Http\Controllers\Controller;
use App\Services\Journal\JournalService;
use App\Support\PaginationMeta;
use Illuminate\Http\Request;

class AdminJournalController extends Controller
{
    use HandlesServiceErrors;

    public function __construct(private JournalService $journal) {}

    public function index(Request $request)
    {
        [$page, $perPage] = PaginationMeta::normalize(
            (int) $request->query('page', 1),
            (int) $request->query('per_page', 20)
        );

        return $this->fromService(fn () => $this->paginated(
            fn () => $this->journal->listAdmin($page, $perPage),
            $page,
            $perPage
        ));
    }
}
