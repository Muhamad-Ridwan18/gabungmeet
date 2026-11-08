<?php

namespace App\Http\Middleware;

use App\Support\ApiResponse;
use Closure;
use Illuminate\Http\Request;

class EnsureVerifiedMember
{
    public function handle(Request $request, Closure $next)
    {
        $user = $request->user();
        if (! $user || ! $user->isVerifiedMember()) {
            return ApiResponse::fail('Account status does not allow this action', 403);
        }

        return $next($request);
    }
}
