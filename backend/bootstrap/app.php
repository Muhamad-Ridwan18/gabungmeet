<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
        apiPrefix: '',
    )
    ->withMiddleware(function (Middleware $middleware) {
        $middleware->statefulApi();
        $middleware->alias([
            'admin' => \App\Http\Middleware\EnsureAdmin::class,
            'verified.member' => \App\Http\Middleware\EnsureVerifiedMember::class,
            'optional.auth' => \App\Http\Middleware\OptionalSanctumAuth::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions) {
        $exceptions->render(function (\Illuminate\Validation\ValidationException $e, $request) {
            if ($request->is('v1/*') || $request->expectsJson()) {
                $errors = collect($e->errors())->map(function ($messages, $field) {
                    return ['field' => $field, 'message' => $messages[0] ?? 'invalid'];
                })->values()->all();

                return \App\Support\ApiResponse::fail('Validation failed', 422, $errors);
            }
        });

        $exceptions->render(function (\Illuminate\Auth\AuthenticationException $e, $request) {
            if ($request->is('v1/*') || $request->expectsJson()) {
                return \App\Support\ApiResponse::fail('Unauthenticated', 401);
            }
        });
    })->create();
