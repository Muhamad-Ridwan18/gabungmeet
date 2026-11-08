<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Api\V1\Concerns\HandlesServiceErrors;
use App\Http\Controllers\Controller;
use App\Services\Ticket\TicketService;
use App\Support\PaginationMeta;
use Illuminate\Http\Request;

class TicketController extends Controller
{
    use HandlesServiceErrors;

    public function __construct(private TicketService $tickets) {}

    public function store(Request $request)
    {
        return $this->fromService(
            fn () => $this->tickets->create($request->user(), $request->all()),
            'Ticket created',
            201
        );
    }

    public function me(Request $request)
    {
        return $this->fromService(fn () => $this->tickets->listMine($request->user()->id));
    }

    public function show(Request $request, string $id)
    {
        return $this->fromService(fn () => $this->tickets->get($id, $request->user(), false));
    }

    public function addMessage(Request $request, string $id)
    {
        return $this->fromService(
            fn () => $this->tickets->addMessage($id, $request->user(), false, $request->all()),
            'Message added',
            201
        );
    }
}
