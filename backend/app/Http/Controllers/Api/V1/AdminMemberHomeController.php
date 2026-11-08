<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Api\V1\Concerns\HandlesServiceErrors;
use App\Http\Controllers\Controller;
use App\Services\Member\MemberHomeService;
use Illuminate\Http\Request;

class AdminMemberHomeController extends Controller
{
    use HandlesServiceErrors;

    public function __construct(private MemberHomeService $memberHome) {}

    public function show()
    {
        return $this->fromService(fn () => $this->memberHome->getAdmin());
    }

    public function update(Request $request)
    {
        return $this->fromService(
            fn () => $this->memberHome->update($request->only(['welcome', 'tutorial', 'referral'])),
            'Member home updated'
        );
    }
}
