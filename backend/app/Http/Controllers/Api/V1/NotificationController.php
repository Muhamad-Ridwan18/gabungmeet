<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Api\V1\Concerns\HandlesServiceErrors;
use App\Http\Controllers\Controller;
use App\Services\Notification\NotificationService;
use Illuminate\Http\Request;

class NotificationController extends Controller
{
    use HandlesServiceErrors;

    public function __construct(private NotificationService $notifications) {}

    public function index(Request $request)
    {
        return $this->fromService(fn () => $this->notifications->listForUser($request->user()->id));
    }

    public function unreadCount(Request $request)
    {
        return $this->fromService(fn () => ['count' => $this->notifications->unreadCount($request->user()->id)]);
    }

    public function markRead(Request $request, string $id)
    {
        return $this->fromService(function () use ($request, $id) {
            $this->notifications->markRead($request->user()->id, $id);

            return null;
        }, 'Notification marked read');
    }

    public function markAllRead(Request $request)
    {
        return $this->fromService(function () use ($request) {
            $count = $this->notifications->markAllRead($request->user()->id);

            return ['updated' => $count];
        }, 'All notifications marked read');
    }
}
