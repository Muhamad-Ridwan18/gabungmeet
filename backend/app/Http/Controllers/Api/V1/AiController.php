<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Api\V1\Concerns\HandlesServiceErrors;
use App\Http\Controllers\Controller;
use App\Services\Ai\AiService;
use Illuminate\Http\Request;

class AiController extends Controller
{
    use HandlesServiceErrors;

    public function __construct(private AiService $ai) {}

    public function chat(Request $request)
    {
        $data = $request->validate([
            'message' => ['required', 'string', 'max:4000'],
            'session_key' => ['nullable', 'string', 'max:64'],
        ]);

        return $this->fromService(fn () => $this->ai->chat(
            $request->user(),
            $data['message'],
            $data['session_key'] ?? null
        ));
    }

    public function conversationsMe(Request $request)
    {
        return $this->fromService(fn () => $this->ai->listMine($request->user()->id));
    }
}
