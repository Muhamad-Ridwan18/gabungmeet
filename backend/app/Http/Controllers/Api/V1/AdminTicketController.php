<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Api\V1\Concerns\HandlesServiceErrors;
use App\Http\Controllers\Controller;
use App\Services\Ticket\TicketService;
use App\Support\PaginationMeta;
use Illuminate\Http\Request;

class AdminTicketController extends Controller
{
    use HandlesServiceErrors;

    public function __construct(private TicketService $tickets) {}

    public function index(Request $request)
    {
        [$page, $perPage] = PaginationMeta::normalize(
            (int) $request->query('page', 1),
            (int) $request->query('per_page', 20)
        );

        return $this->fromService(fn () => $this->paginated(
            fn () => $this->tickets->adminList($request->query('status'), $page, $perPage),
            $page,
            $perPage
        ));
    }

    public function show(Request $request, string $id)
    {
        return $this->fromService(fn () => $this->tickets->get($id, $request->user(), true));
    }

    public function addMessage(Request $request, string $id)
    {
        return $this->fromService(
            fn () => $this->tickets->addMessage($id, $request->user(), true, $request->all()),
            'Message added',
            201
        );
    }

    public function patchStatus(Request $request, string $id)
    {
        $data = $request->validate(['status' => ['required', 'string']]);

        return $this->fromService(
            fn () => $this->tickets->patchStatus($id, $request->user(), $data['status']),
            'Ticket status updated'
        );
    }
}
